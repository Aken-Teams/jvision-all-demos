/**
 * 平台控制面：誰是客戶、買了什麼、開通了哪幾套系統。
 *
 * 全站原本沒有任何「某人擁有什麼」的概念——projects-index 是型錄、
 * content/details 是規格、github-sync.json 是鏡像狀態，三者都沒有租戶維度。
 *
 * 放資料庫不放 JSON 檔的理由：現有的 wish-requests.json 那種「讀進來→改→
 * 整份寫回」不防 lost update，兩個並發的 update 會有一個被默默蓋掉。
 * 許願申請掉一筆能重送，客戶的需求單掉一筆就是事故。
 */
import { q, one, tx, ident, newId, createDatabase, dropDatabase } from "./mysql.mjs";

/** 需求單狀態機。收費模式是「一次買斷＋修改另計」，所以是訂單不是訂閱。 */
export const ORDER_STATES = ["draft", "pending", "paid", "provisioning", "live", "failed", "refunded"];

const DDL = [
  `CREATE TABLE IF NOT EXISTS customers (
     id VARCHAR(40) PRIMARY KEY,
     slug VARCHAR(40) NOT NULL UNIQUE,
     name VARCHAR(120) NOT NULL,
     owner_email VARCHAR(190) NOT NULL,
     status VARCHAR(20) NOT NULL DEFAULT 'active',
     created_at DATETIME NOT NULL,
     INDEX idx_owner (owner_email)
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  /* 客戶自己維護的信箱白名單。沿用 Google 登入，這裡只決定「誰進得去」。 */
  `CREATE TABLE IF NOT EXISTS members (
     customer_id VARCHAR(40) NOT NULL,
     email VARCHAR(190) NOT NULL,
     role VARCHAR(20) NOT NULL DEFAULT 'member',
     created_at DATETIME NOT NULL,
     PRIMARY KEY (customer_id, email)
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS orders (
     id VARCHAR(40) PRIMARY KEY,
     customer_id VARCHAR(40),
     buyer_email VARCHAR(190) NOT NULL,
     status VARCHAR(20) NOT NULL,
     amount INT NOT NULL DEFAULT 0,
     currency VARCHAR(8) NOT NULL DEFAULT 'TWD',
     provider VARCHAR(20),
     provider_ref VARCHAR(80) UNIQUE,
     items_json JSON NOT NULL,
     note TEXT,
     created_at DATETIME NOT NULL,
     paid_at DATETIME,
     provisioned_at DATETIME,
     /* 租約：worker 搶單用。崩潰時租約到期自動被別人接手，不會有兩個 worker
        同時建同一筆，也不會因為某個 worker 死掉就永遠沒人做。 */
     lease_owner VARCHAR(60),
     lease_until DATETIME,
     INDEX idx_status (status), INDEX idx_buyer (buyer_email)
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS instances (
     id VARCHAR(40) PRIMARY KEY,
     customer_id VARCHAR(40) NOT NULL,
     order_id VARCHAR(40),
     repo_name VARCHAR(120) NOT NULL,
     host VARCHAR(190) NOT NULL UNIQUE,
     db_name VARCHAR(64) NOT NULL UNIQUE,
     dir VARCHAR(255) NOT NULL,
     state VARCHAR(20) NOT NULL DEFAULT 'building',
     repo_url VARCHAR(255),
     created_at DATETIME NOT NULL,
     last_write_at DATETIME,
     archived_at DATETIME,
     INDEX idx_customer (customer_id)
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  /* 事件寫這裡而不是 actions.jsonl：實例的每次 CRUD 都是寫入操作，
     灌進那個已經 1.1MB 的檔案會很快撐爆，而且那是給站台動作看的。 */
  `CREATE TABLE IF NOT EXISTS events (
     id BIGINT AUTO_INCREMENT PRIMARY KEY,
     at DATETIME NOT NULL,
     kind VARCHAR(40) NOT NULL,
     customer_id VARCHAR(40),
     instance_id VARCHAR(40),
     actor VARCHAR(190),
     detail_json JSON,
     INDEX idx_at (at)
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  /* 全自動自助沒有人工審核，配額就是那道自動閘門。 */
  `CREATE TABLE IF NOT EXISTS quotas (
     customer_id VARCHAR(40) PRIMARY KEY,
     max_instances INT NOT NULL DEFAULT 10,
     max_rows_per_table INT NOT NULL DEFAULT 100000
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  /* 對話。v0 最好的地方是「Chat 本身就是自然語言版的開發日誌」——
     客戶不用懂 git diff，看得懂「我上禮拜叫它做了什麼」。
     原本對話只存在前端的一個陣列裡，關掉視窗就沒了。

     放控制面而不是各實例自己的資料庫：實例資料庫會被交付到 GitHub、
     也可能被 drop，而對話歷史是平台的中繼資料，不該跟著客戶的業務資料走。 */
  `CREATE TABLE IF NOT EXISTS chat_sessions (
     id VARCHAR(40) PRIMARY KEY,
     instance_id VARCHAR(40) NOT NULL,
     title VARCHAR(120),
     created_at DATETIME NOT NULL,
     last_at DATETIME NOT NULL,
     INDEX idx_instance (instance_id, last_at)
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  /* version_id 是這句話造成了哪一個版本。有了它，版本清單上的每一版
     都指得回「當初是誰、說了哪一句話才變成這樣」。 */
  `CREATE TABLE IF NOT EXISTS chat_messages (
     id BIGINT AUTO_INCREMENT PRIMARY KEY,
     session_id VARCHAR(40) NOT NULL,
     role VARCHAR(12) NOT NULL,
     text TEXT,
     action VARCHAR(24),
     version_id VARCHAR(40),
     shot VARCHAR(80),
     actor VARCHAR(190),
     at DATETIME NOT NULL,
     INDEX idx_session (session_id, id)
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  /* 個人偏好。跟 customers 分開，是因為一個人可能只是別人公司的成員、
     從來沒有自己的 customers 列，但他一樣要能改自己的顯示名稱。
     以信箱為主鍵：登入身分就是信箱，不需要再發一組編號。 */
  `CREATE TABLE IF NOT EXISTS profiles (
     email VARCHAR(190) PRIMARY KEY,
     display_name VARCHAR(60),
     updated_at DATETIME NOT NULL
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
];

let ready = null;
/** 建表。冪等，所有進入點都先 await 它一次。 */
/* 後來才加的欄位。CREATE TABLE IF NOT EXISTS 對已經存在的表不會補欄位，
   所以要另外補一次；已經有了會丟 ER_DUP_FIELDNAME，忽略掉就是冪等的。 */
const MIGRATIONS = [
  "ALTER TABLE instances ADD COLUMN display_name VARCHAR(120)",
];

export function ensureSchema() {
  if (!ready) ready = (async () => {
    for (const ddl of DDL) await q(ddl);
    for (const m of MIGRATIONS) {
      try { await q(m); }
      catch (e) { if (e.code !== "ER_DUP_FIELDNAME") throw e; }
    }
  })();
  return ready;
}

/** 客戶自己改的系統名稱。空字串代表改回原本的名字。 */
export async function renameInstance(id, name) {
  await ensureSchema();
  const clean = String(name || "").trim().slice(0, 120) || null;
  await q("UPDATE instances SET display_name=? WHERE id=?", [clean, id]);
  return clean;
}

const now = () => new Date().toISOString().slice(0, 19).replace("T", " ");
const parse = (r) => (r ? { ...r, items: typeof r.items_json === "string" ? JSON.parse(r.items_json) : r.items_json } : null);

/** slug 要能當子網域：小寫、只留英數與連字號、不可空。 */
export function slugify(name, fallback = "co") {
  const s = String(name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 24);
  if (s && /^[a-z]/.test(s)) return s;
  return fallback ? `${fallback}-${Math.random().toString(36).slice(2, 6)}` : "";
}

/** 依 email 找到或建立客戶。下單者自動成為第一個 owner。 */
export async function ensureCustomer({ email, company }) {
  await ensureSchema();
  const found = await one("SELECT * FROM customers WHERE owner_email = ?", [email]);
  if (found) return found;
  const id = newId("c");
  /* 公司名是中文時 slugify 產不出東西，退回用信箱前綴——那至少是有意義的字，
     而 slug 會出現在客戶的網址上，亂數看起來像壞掉。 */
  let slug = slugify(company, "") || slugify(email.split("@")[0]);
  // slug 撞名就加序號——host 之後是 UNIQUE，這裡先擋掉才不會等到開通時才失敗
  while (await one("SELECT 1 x FROM customers WHERE slug = ?", [slug])) {
    slug = `${slug.slice(0, 20)}-${Math.random().toString(36).slice(2, 5)}`;
  }
  await tx(async (cn) => {
    await cn.execute("INSERT INTO customers(id,slug,name,owner_email,status,created_at) VALUES(?,?,?,?,'active',?)",
      [id, slug, (company || email).slice(0, 120), email, now()]);
    await cn.execute("INSERT INTO members(customer_id,email,role,created_at) VALUES(?,?,'owner',?)", [id, email, now()]);
    await cn.execute("INSERT INTO quotas(customer_id) VALUES(?)", [id]);
  });
  return one("SELECT * FROM customers WHERE id = ?", [id]);
}

/** 這個人自己設定的顯示名稱。沒設過就回 null，由呼叫端退回 Google 給的名字。 */
export async function getProfile(email) {
  await ensureSchema();
  return one("SELECT email, display_name FROM profiles WHERE email = ?", [email]);
}

/** 空字串代表「清掉，改用 Google 的名字」，跟沒改過是不同的意思。 */
export async function setProfile(email, { displayName }) {
  await ensureSchema();
  const name = displayName == null ? null : String(displayName).trim().slice(0, 60) || null;
  await q(`INSERT INTO profiles(email, display_name, updated_at) VALUES(?,?,?)
           ON DUPLICATE KEY UPDATE display_name = VALUES(display_name), updated_at = VALUES(updated_at)`,
    [email, name, now()]);
  return getProfile(email);
}

/** 這個人自己開的公司帳戶。只有 owner 改得動公司名，所以要分辨得出來。 */
export async function customerOwnedBy(email) {
  await ensureSchema();
  return one("SELECT * FROM customers WHERE owner_email = ?", [email]);
}

export async function renameCustomer(customerId, name) {
  await ensureSchema();
  const clean = String(name || "").trim().slice(0, 120);
  if (!clean) throw Object.assign(new Error("公司名稱不可以空白"), { status: 400 });
  await q("UPDATE customers SET name = ? WHERE id = ?", [clean, customerId]);
  return one("SELECT * FROM customers WHERE id = ?", [customerId]);
}

export async function listMembers(customerId) {
  await ensureSchema();
  return q("SELECT email, role, created_at FROM members WHERE customer_id = ? ORDER BY role='owner' DESC, created_at", [customerId]);
}

/** 加人進使用名單。已經在名單裡就當作成功——重複按不該變成錯誤。 */
export async function addMember(customerId, email) {
  await ensureSchema();
  const clean = String(email || "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean) || clean.length > 190) {
    throw Object.assign(new Error("這不是有效的信箱"), { status: 400 });
  }
  await q(`INSERT INTO members(customer_id,email,role,created_at) VALUES(?,?,'member',?)
           ON DUPLICATE KEY UPDATE email = VALUES(email)`, [customerId, clean, now()]);
  return listMembers(customerId);
}

/** 移除。擁有者不能被移除——那會做出一個沒有人進得去的公司帳戶。 */
export async function removeMember(customerId, email) {
  await ensureSchema();
  const row = await one("SELECT role FROM members WHERE customer_id = ? AND email = ?", [customerId, email]);
  if (row && row.role === "owner") throw Object.assign(new Error("不能移除擁有者"), { status: 400 });
  await q("DELETE FROM members WHERE customer_id = ? AND email = ?", [customerId, email]);
  return listMembers(customerId);
}

/**
 * 建立需求單。
 *
 * status 由呼叫端決定：要收費時是 draft（等客戶去付款），不收費時直接是 queued
 * （等 worker 來拉）。用不同的狀態而不是把不收費的也標成 paid——沒收過錢的單
 * 標成已付款，日後對帳會對不出來。
 */
export async function createOrder({ customerId, buyerEmail, items, amount = 0, note = null, status = "draft" }) {
  await ensureSchema();
  const id = newId("o");
  await q(`INSERT INTO orders(id,customer_id,buyer_email,status,amount,items_json,note,created_at)
           VALUES(?,?,?,?,?,?,?,?)`,
    [id, customerId, buyerEmail, status, amount, JSON.stringify(items), note, now()]);
  return getOrder(id);
}

/** 建單之後才補得上的欄位（例如截圖檔名）。整包覆寫，呼叫端負責帶完整的 items。 */
export async function setOrderItems(orderId, items) {
  await ensureSchema();
  await q("UPDATE orders SET items_json = ? WHERE id = ?", [JSON.stringify(items), orderId]);
}

export async function getOrder(id) {
  await ensureSchema();
  return parse(await one("SELECT * FROM orders WHERE id = ?", [id]));
}

export async function listOrders({ status, buyerEmail, limit = 100 } = {}) {
  await ensureSchema();
  const where = [], params = [];
  if (status) { where.push("status = ?"); params.push(status); }
  if (buyerEmail) { where.push("buyer_email = ?"); params.push(buyerEmail); }
  const rows = await q(`SELECT * FROM orders ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY created_at DESC LIMIT ?`, [...params, Number(limit)]);
  return rows.map(parse);
}

/**
 * 付款成功。回 true 代表這是第一次；重送的回呼會拿到 false 而什麼都不做。
 * 條件寫進 WHERE，由資料庫保證只有一個人贏——「先查再改」中間有空隙，
 * 兩邊都會以為自己是第一個。
 */
export async function markPaid({ orderId, provider, providerRef }) {
  await ensureSchema();
  const [r] = await q(`UPDATE orders SET status='paid', paid_at=?, provider=?, provider_ref=?
    WHERE id=? AND status='pending'`, [now(), provider, providerRef, orderId])
    .then((x) => [x]).catch((e) => { if (e.code === "ER_DUP_ENTRY") return [{ affectedRows: 0 }]; throw e; });
  return r.affectedRows === 1;
}

/** worker 搶單。租約過期的單會被重新搶走——worker 中途死掉不會讓訂單永遠卡住。 */
export async function claimOrder({ workerId, leaseMinutes = 20 }) {
  await ensureSchema();
  const until = new Date(Date.now() + leaseMinutes * 60000).toISOString().slice(0, 19).replace("T", " ");
  return tx(async (cn) => {
    const [cands] = await cn.execute(`SELECT id FROM orders
      WHERE status IN ('paid','queued') AND provisioned_at IS NULL AND (lease_until IS NULL OR lease_until < ?)
      ORDER BY paid_at LIMIT 1 FOR UPDATE`, [now()]);
    if (!cands.length) return null;
    const [r] = await cn.execute(`UPDATE orders SET lease_owner=?, lease_until=?, status='provisioning'
      WHERE id=? AND status IN ('paid','queued')`, [workerId, until, cands[0].id]);
    if (r.affectedRows !== 1) return null;
    const [rows] = await cn.execute("SELECT * FROM orders WHERE id=?", [cands[0].id]);
    return parse(rows[0]);
  });
}

/**
 * 把訂單推進「開通中」。
 *
 * 條件寫在 WHERE 裡，由資料庫保證只有一個人贏——「先查再改」中間有空隙，
 * 兩個人同時按開通會各自以為自己是第一個，然後開出兩套一樣的系統。
 * 回 false 代表這張單已經有人在處理或已經處理完了。
 *
 * 接受 draft 與 paid 兩種來源：現在沒有金流，訂單一直是 draft；之後接上金流
 * 會是 paid。兩種都放行，接金流時這裡不必再改。
 */
/**
 * 訂單進入待付款。金額在這一刻定案並寫進訂單——之後改價不該回頭影響已經
 * 送出的單，那是客戶看到報價才按下付款的那個數字。
 *
 * 回傳 false 代表這張單已經不是 draft（重複按、或已經付過了）。
 */
export async function beginCheckout(orderId, { amount, provider, providerRef }) {
  await ensureSchema();
  const r = await q(`UPDATE orders SET status='pending', amount=?, provider=?, provider_ref=?
    WHERE id=? AND status='draft'`, [Math.max(0, Number(amount) || 0), provider, providerRef, orderId]);
  return r.affectedRows === 1;
}

/** 付款頁重開一次要換新的 ref，舊的回呼才不會把新的付款蓋掉。 */
export async function updateCheckoutRef(orderId, providerRef) {
  await ensureSchema();
  const r = await q("UPDATE orders SET provider_ref=? WHERE id=? AND status='pending'", [providerRef, orderId]);
  return r.affectedRows === 1;
}

export async function beginProvision(orderId) {
  await ensureSchema();
  const r = await q(`UPDATE orders SET status='provisioning', lease_owner=?, lease_until=?
    WHERE id=? AND status IN ('draft','paid','queued')`,
    ["manual", new Date(Date.now() + 20 * 60000).toISOString().slice(0, 19).replace("T", " "), orderId]);
  return r.affectedRows === 1;
}

/**
 * 開通結束。成功寫 delivered 與完成時間，失敗寫 failed 並放掉租約，
 * 讓它可以被重新開通——失敗的單卡在 provisioning 就再也沒有人能碰它。
 */
export async function finishProvision(orderId, ok) {
  await ensureSchema();
  if (ok) {
    await q("UPDATE orders SET status='delivered', provisioned_at=?, lease_owner=NULL, lease_until=NULL WHERE id=?",
      [now(), orderId]);
  } else {
    await q("UPDATE orders SET status='failed', lease_owner=NULL, lease_until=NULL WHERE id=?", [orderId]);
  }
  return getOrder(orderId);
}

/**
 * 把 worker 搶到的單放回 paid，交給 instance-provision 走它自己的狀態轉移。
 *
 * claimOrder 為了搶單必須立刻把狀態改掉（不然第二個 worker 會搶到同一張），
 * 但 instance-provision 只接受 draft/paid。與其讓兩邊各自標記狀態、日後改一邊
 * 忘了另一邊，不如在這裡放回去，讓「怎麼標記開通結果」只有一份邏輯。
 * 租約留著——這段期間別的 worker 仍然不該碰它。
 */
export async function resetPaid(orderId) {
  await ensureSchema();
  /* 放回 queued 而不是 paid：沒收過錢的單不該因為經過 worker 就變成已付款。
     instance-provision 兩種都接受。 */
  const r = await q("UPDATE orders SET status='queued' WHERE id=? AND status='provisioning'", [orderId]);
  return r.affectedRows === 1;
}

/** 失敗或卡住的單要能重來。回到 draft，開通按鈕才會再出現。 */
export async function resetOrder(orderId) {
  await ensureSchema();
  const r = await q(`UPDATE orders SET status='draft', lease_owner=NULL, lease_until=NULL
    WHERE id=? AND status IN ('failed','provisioning')`, [orderId]);
  return r.affectedRows === 1;
}

export async function recordEvent({ kind, customerId = null, instanceId = null, actor = null, detail = null }) {
  await ensureSchema();
  await q("INSERT INTO events(at,kind,customer_id,instance_id,actor,detail_json) VALUES(?,?,?,?,?,?)",
    [now(), kind, customerId, instanceId, actor, detail ? JSON.stringify(detail) : null]);
}

/* ── 對話 ─────────────────────────────────────────────
   一個實例底下有好幾次對話（session），一次對話裡有好幾句話。
   這是 v0 側欄那個「專案 → 這個專案的幾次 Chat」的形狀。 */

/** 開一次新對話。標題留白，等第一句話進來再補。 */
export async function createSession(instanceId, title = null) {
  await ensureSchema();
  const id = newId("s");
  const t = now();
  await q("INSERT INTO chat_sessions(id,instance_id,title,created_at,last_at) VALUES(?,?,?,?,?)",
    [id, instanceId, title ? String(title).slice(0, 120) : null, t, t]);
  return { id, instance_id: instanceId, title, created_at: t, last_at: t };
}

export async function listSessions(instanceId, limit = 30) {
  await ensureSchema();
  const n = Math.max(1, Math.min(100, Number(limit) || 30));
  return q(`SELECT s.id, s.title, s.created_at, s.last_at,
       (SELECT COUNT(*) FROM chat_messages m WHERE m.session_id = s.id) AS messages
     FROM chat_sessions s WHERE s.instance_id = ?
     ORDER BY s.last_at DESC LIMIT ${n}`, [instanceId]);
}

/** 這次對話是不是屬於這個實例。前端傳什麼 sessionId 都不該跨到別套系統。 */
export async function sessionInInstance(sessionId, instanceId) {
  await ensureSchema();
  const r = await one("SELECT id FROM chat_sessions WHERE id=? AND instance_id=?", [sessionId, instanceId]);
  return Boolean(r);
}

export async function listMessages(sessionId, limit = 200) {
  await ensureSchema();
  const n = Math.max(1, Math.min(500, Number(limit) || 200));
  return q(`SELECT role, text, action, version_id, shot, at FROM chat_messages
     WHERE session_id = ? ORDER BY id LIMIT ${n}`, [sessionId]);
}

/**
 * 記一句話。
 *
 * 標題只在第一句使用者的話進來時補上——用他自己說的那句當標題，
 * 側欄上才看得出那次對話在做什麼（「把統計數字放大」比「對話 3」有用）。
 */
export async function addMessage({ sessionId, role, text, action = null, versionId = null, shot = null, actor = null }) {
  await ensureSchema();
  const t = now();
  await q(`INSERT INTO chat_messages(session_id,role,text,action,version_id,shot,actor,at)
     VALUES(?,?,?,?,?,?,?,?)`,
    [sessionId, role, text == null ? null : String(text).slice(0, 4000), action, versionId, shot,
      actor ? String(actor).slice(0, 190) : null, t]);
  await q("UPDATE chat_sessions SET last_at=?, title=COALESCE(title, ?) WHERE id=?",
    [t, role === "user" ? String(text || "").slice(0, 120) : null, sessionId]);
}

/**
 * 一套系統發生過什麼事。工作台的「紀錄」分頁用。
 *
 * detail_json 原樣送出去：裡面是客戶自己講過的話與失敗原因，本來就是要給他看的。
 * 但只挑這幾個 kind——events 表也收站台自己的動作，那些不該出現在客戶眼前。
 */
export async function listEventsFor(instanceId, limit = 60) {
  await ensureSchema();
  const n = Math.max(1, Math.min(200, Number(limit) || 60));
  return q(`SELECT at, kind, actor, detail_json FROM events
     WHERE instance_id = ?
       AND kind IN ('instance.edited','instance.edit_failed','change.request',
                    'instance.shared','instance.delivered','instance.reverted')
     ORDER BY id DESC LIMIT ${n}`, [instanceId]);
}

/** 客戶的哪些信箱進得去、是什麼角色。gateway 每次請求都會問。 */
export async function memberRole({ customerId, email }) {
  await ensureSchema();
  const r = await one("SELECT role FROM members WHERE customer_id=? AND LOWER(email)=LOWER(?)", [customerId, email]);
  return r ? r.role : null;
}

export async function instanceByHost(host) {
  await ensureSchema();
  return one("SELECT * FROM instances WHERE host = ?", [String(host || "").toLowerCase()]);
}

export async function getInstance(id) {
  await ensureSchema();
  return one("SELECT * FROM instances WHERE id = ?", [id]);
}

export async function createInstance({ customerId, orderId, repoName, host, dir }) {
  await ensureSchema();
  const id = newId("i");
  /* 每個實例一個獨立資料庫，隔離就是資料庫邊界——不必靠 WHERE 條件寫對，
     刪除與備份也乾淨（DROP DATABASE 一句話）。 */
  const dbName = `jv_${id.replace(/[^a-z0-9]/gi, "").toLowerCase().slice(0, 40)}`;
  ident(dbName); // 提早驗證，避免建到一半才發現名字不合法
  await createDatabase(dbName);
  try {
    await q(`INSERT INTO instances(id,customer_id,order_id,repo_name,host,db_name,dir,state,created_at)
             VALUES(?,?,?,?,?,?,?,'building',?)`,
      [id, customerId, orderId, repoName, host.toLowerCase(), dbName, dir, now()]);
  } catch (error) {
    /* 登錄失敗就不要留下孤兒資料庫——沒有人知道它屬於誰，也沒有人會去清。 */
    await dropDatabase(dbName).catch(() => {});
    throw error;
  }
  return getInstance(id);
}

/** 實例整個移除：先刪資料庫再刪登錄，順序反了會留下孤兒資料庫。 */
/**
 * 某個人進得去的系統。兩種來源：他自己買的（customers.owner_email），
 * 以及客戶把他加進使用名單的（members）。封存的不列——那已經沒得用了。
 */
export async function listInstancesFor(email) {
  await ensureSchema();
  return q(`SELECT i.id, i.repo_name, i.host, i.state, i.created_at, i.display_name,
       CASE WHEN c.owner_email = ? THEN 'owner' ELSE COALESCE(m.role, 'member') END AS role
     FROM instances i
     LEFT JOIN customers c ON c.id = i.customer_id
     LEFT JOIN members  m ON m.customer_id = i.customer_id AND m.email = ?
     WHERE i.state <> 'archived' AND (c.owner_email = ? OR m.email IS NOT NULL)
     ORDER BY i.created_at DESC LIMIT 50`, [email, email, email]);
}

/**
 * 同 listInstancesFor，但多帶算空間要用的 dir 與 db_name。
 * 這兩個欄位**不可以送到前端**：伺服器路徑與資料庫名稱對使用者沒有用處，
 * 送出去只是多給人一點可以打的東西。所以另開一支，而不是在原本那支加欄位
 * ——加了欄位，總有一天會有人把整個物件直接 json 出去。
 */
/**
 * 這個人是不是已經複製過這一套。
 *
 * 沒有這一層的話，同一顆按鈕按兩次就開出兩套一樣的系統、佔兩份資料庫，
 * 而使用者只會覺得「我剛剛不是按過了嗎」。已經有就直接帶他回去那一套。
 */
export async function instanceForRepo(email, repoName) {
  await ensureSchema();
  return one(`SELECT i.id, i.state
     FROM instances i
     LEFT JOIN customers c ON c.id = i.customer_id
     LEFT JOIN members  m ON m.customer_id = i.customer_id AND m.email = ?
    WHERE i.repo_name = ? AND i.state <> 'archived' AND (c.owner_email = ? OR m.email IS NOT NULL)
    ORDER BY i.created_at DESC LIMIT 1`, [email, repoName, email]);
}

export async function listInstancePathsFor(email) {
  await ensureSchema();
  return q(`SELECT i.id, i.dir, i.db_name
     FROM instances i
     LEFT JOIN customers c ON c.id = i.customer_id
     LEFT JOIN members  m ON m.customer_id = i.customer_id AND m.email = ?
     WHERE i.state <> 'archived' AND (c.owner_email = ? OR m.email IS NOT NULL)`, [email, email]);
}

export async function destroyInstance(id) {
  const inst = await getInstance(id);
  if (!inst) return false;
  await dropDatabase(inst.db_name);
  await q("DELETE FROM instances WHERE id = ?", [id]);
  return true;
}

export async function setInstanceState(id, state, extra = {}) {
  await ensureSchema();
  const cols = Object.keys(extra);
  await q(`UPDATE instances SET state=?${cols.map((c) => `, ${ident(c).replace(/`/g, "")} = ?`).join("")} WHERE id=?`,
    [state, ...cols.map((c) => extra[c]), id]);
  return getInstance(id);
}
