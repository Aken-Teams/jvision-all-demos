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
import { q, one, tx, ident, newId } from "./mysql.mjs";

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
     table_prefix VARCHAR(50) NOT NULL UNIQUE,
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
];

let ready = null;
/** 建表。冪等，所有進入點都先 await 它一次。 */
export function ensureSchema() {
  if (!ready) ready = (async () => { for (const ddl of DDL) await q(ddl); })();
  return ready;
}

const now = () => new Date().toISOString().slice(0, 19).replace("T", " ");
const parse = (r) => (r ? { ...r, items: typeof r.items_json === "string" ? JSON.parse(r.items_json) : r.items_json } : null);

/** slug 要能當子網域：小寫、只留英數與連字號、不可空。 */
export function slugify(name, fallback = "co") {
  const s = String(name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 24);
  return s && /^[a-z]/.test(s) ? s : `${fallback}-${Math.random().toString(36).slice(2, 6)}`;
}

/** 依 email 找到或建立客戶。下單者自動成為第一個 owner。 */
export async function ensureCustomer({ email, company }) {
  await ensureSchema();
  const found = await one("SELECT * FROM customers WHERE owner_email = ?", [email]);
  if (found) return found;
  const id = newId("c");
  let slug = slugify(company || email.split("@")[0]);
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

export async function createOrder({ customerId, buyerEmail, items, amount = 0, note = null }) {
  await ensureSchema();
  const id = newId("o");
  await q(`INSERT INTO orders(id,customer_id,buyer_email,status,amount,items_json,note,created_at)
           VALUES(?,?,?,'draft',?,?,?,?)`,
    [id, customerId, buyerEmail, amount, JSON.stringify(items), note, now()]);
  return getOrder(id);
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
      WHERE status='paid' AND provisioned_at IS NULL AND (lease_until IS NULL OR lease_until < ?)
      ORDER BY paid_at LIMIT 1 FOR UPDATE`, [now()]);
    if (!cands.length) return null;
    const [r] = await cn.execute(`UPDATE orders SET lease_owner=?, lease_until=?, status='provisioning'
      WHERE id=? AND status='paid'`, [workerId, until, cands[0].id]);
    if (r.affectedRows !== 1) return null;
    const [rows] = await cn.execute("SELECT * FROM orders WHERE id=?", [cands[0].id]);
    return parse(rows[0]);
  });
}

export async function recordEvent({ kind, customerId = null, instanceId = null, actor = null, detail = null }) {
  await ensureSchema();
  await q("INSERT INTO events(at,kind,customer_id,instance_id,actor,detail_json) VALUES(?,?,?,?,?,?)",
    [now(), kind, customerId, instanceId, actor, detail ? JSON.stringify(detail) : null]);
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
  /* 表前綴就是隔離邊界：表名本身帶實例編號，即使查詢漏寫條件也撈不到別人的資料。
     這是共用資料庫下最接近「一個客戶一個檔」的做法。 */
  const prefix = `i_${id.replace(/[^a-z0-9]/gi, "").toLowerCase().slice(0, 24)}_`;
  ident(prefix.slice(0, -1)); // 提早驗證，避免建到一半才發現名字不合法
  await q(`INSERT INTO instances(id,customer_id,order_id,repo_name,host,table_prefix,dir,state,created_at)
           VALUES(?,?,?,?,?,?,?,'building',?)`,
    [id, customerId, orderId, repoName, host.toLowerCase(), prefix, dir, now()]);
  return getInstance(id);
}

export async function setInstanceState(id, state, extra = {}) {
  await ensureSchema();
  const cols = Object.keys(extra);
  await q(`UPDATE instances SET state=?${cols.map((c) => `, ${ident(c).replace(/`/g, "")} = ?`).join("")} WHERE id=?`,
    [state, ...cols.map((c) => extra[c]), id]);
  return getInstance(id);
}
