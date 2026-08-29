/**
 * 平台控制面：誰是客戶、買了什麼、開通了哪幾套系統。
 *
 * 全站原本沒有任何「某人擁有什麼」的概念——projects-index 是型錄、
 * content/details 是規格、github-sync.json 是鏡像狀態，三者都沒有租戶維度。
 * 這裡補上那一層。
 *
 * 放 SQLite 不放 JSON 的理由見 store.mjs 的檔頭：付過錢的訂單掉一筆就是事故。
 */
import path from "node:path";
import { ROOT } from "./forge-common.mjs";
import { open, migrate, tx, transition, newId } from "./store.mjs";

export const CONTROL_DB = path.join(ROOT, "var", "control.db");

/** 訂單狀態機。收費模式是「一次買斷＋修改另計」，所以是訂單不是訂閱。 */
export const ORDER_STATES = ["draft", "pending", "paid", "provisioning", "live", "failed", "refunded"];

const MIGRATIONS = [
  {
    version: 1,
    up: `
      CREATE TABLE customers (
        id TEXT PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,          -- 子網域用，全小寫
        name TEXT NOT NULL,                 -- 公司名
        owner_email TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TEXT NOT NULL
      );

      -- 客戶自己維護的信箱白名單。沿用 Google 登入，這裡只決定「誰進得去」。
      CREATE TABLE members (
        customer_id TEXT NOT NULL REFERENCES customers(id),
        email TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'member', -- owner | member | viewer
        created_at TEXT NOT NULL,
        PRIMARY KEY (customer_id, email)
      );

      CREATE TABLE orders (
        id TEXT PRIMARY KEY,
        customer_id TEXT REFERENCES customers(id),
        buyer_email TEXT NOT NULL,
        status TEXT NOT NULL,
        amount INTEGER NOT NULL DEFAULT 0,
        currency TEXT NOT NULL DEFAULT 'TWD',
        provider TEXT,                       -- mock | ecpay | newebpay | stripe
        provider_ref TEXT UNIQUE,            -- 金流端的交易號，防重複入帳
        items_json TEXT NOT NULL,            -- [{repoName, title, note}]
        note TEXT,
        created_at TEXT NOT NULL,
        paid_at TEXT,
        provisioned_at TEXT,
        -- 租約：worker 搶單用。崩潰時租約到期自動被別人接手，不會有兩個 worker
        -- 同時建同一筆，也不會因為某個 worker 死掉就永遠沒人做。
        lease_owner TEXT,
        lease_until TEXT
      );
      CREATE INDEX idx_orders_status ON orders(status);
      CREATE INDEX idx_orders_buyer ON orders(buyer_email);

      CREATE TABLE instances (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL REFERENCES customers(id),
        order_id TEXT REFERENCES orders(id),
        repo_name TEXT NOT NULL,             -- 來源 demo
        host TEXT NOT NULL UNIQUE,           -- 客戶專屬子網域，唯一由 DB 保證
        dir TEXT NOT NULL,                   -- var/instances/<id>
        state TEXT NOT NULL DEFAULT 'building', -- building | live | suspended | archived
        repo_url TEXT,                       -- 交付給客戶的 GitHub repo
        created_at TEXT NOT NULL,
        last_write_at TEXT,                  -- 閒置回收看這個
        archived_at TEXT
      );
      CREATE INDEX idx_instances_customer ON instances(customer_id);

      -- 事件寫這裡而不是 actions.jsonl：實例的每次 CRUD 都是寫入操作，
      -- 灌進那個已經 1.1MB 的檔案會很快撐爆，而且那是給站台動作看的。
      CREATE TABLE events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        at TEXT NOT NULL,
        kind TEXT NOT NULL,
        customer_id TEXT,
        instance_id TEXT,
        actor TEXT,
        detail_json TEXT
      );
      CREATE INDEX idx_events_at ON events(at);

      -- 全自動自助沒有人工審核，配額就是那道自動閘門。
      CREATE TABLE quotas (
        customer_id TEXT PRIMARY KEY REFERENCES customers(id),
        max_instances INTEGER NOT NULL DEFAULT 10,
        max_bytes_per_instance INTEGER NOT NULL DEFAULT 536870912,
        max_rows_per_table INTEGER NOT NULL DEFAULT 100000
      );
    `,
  },
];

export function openControl(file = CONTROL_DB) {
  const db = open(file);
  migrate(db, MIGRATIONS);
  return db;
}

const now = () => new Date().toISOString();

/** slug 要能當子網域：小寫、只留英數與連字號、不可空。 */
export function slugify(name, fallback = "co") {
  const s = String(name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 24);
  return s && /^[a-z]/.test(s) ? s : `${fallback}-${Math.random().toString(36).slice(2, 6)}`;
}

/** 依 email 找到或建立客戶。下單者自動成為第一個 owner。 */
export function ensureCustomer(db, { email, company }) {
  const found = db.prepare("SELECT * FROM customers WHERE owner_email = ?").get(email);
  if (found) return found;
  return tx(db, () => {
    let slug = slugify(company || email.split("@")[0]);
    // slug 撞名就加序號——host 是 UNIQUE，這裡先擋掉才不會等到開通時才失敗
    while (db.prepare("SELECT 1 FROM customers WHERE slug = ?").get(slug)) {
      slug = `${slug.slice(0, 20)}-${Math.random().toString(36).slice(2, 5)}`;
    }
    const id = newId("c");
    db.prepare("INSERT INTO customers(id,slug,name,owner_email,status,created_at) VALUES(?,?,?,?,'active',?)")
      .run(id, slug, company || email, email, now());
    db.prepare("INSERT INTO members(customer_id,email,role,created_at) VALUES(?,?,'owner',?)").run(id, email, now());
    db.prepare("INSERT INTO quotas(customer_id) VALUES(?)").run(id);
    return db.prepare("SELECT * FROM customers WHERE id = ?").get(id);
  });
}

/** 建立訂單。items 是 [{repoName, title, note}]。 */
export function createOrder(db, { customerId, buyerEmail, items, amount = 0, note = null }) {
  const id = newId("o");
  db.prepare(`INSERT INTO orders(id,customer_id,buyer_email,status,amount,items_json,note,created_at)
              VALUES(?,?,?,'draft',?,?,?,?)`)
    .run(id, customerId, buyerEmail, amount, JSON.stringify(items), note, now());
  return getOrder(db, id);
}

export function getOrder(db, id) {
  const r = db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
  return r ? { ...r, items: JSON.parse(r.items_json) } : null;
}

export function listOrders(db, { status, buyerEmail, limit = 100 } = {}) {
  const where = [], params = [];
  if (status) { where.push("status = ?"); params.push(status); }
  if (buyerEmail) { where.push("buyer_email = ?"); params.push(buyerEmail); }
  const sql = `SELECT * FROM orders ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY created_at DESC LIMIT ?`;
  return db.prepare(sql).all(...params, limit).map((r) => ({ ...r, items: JSON.parse(r.items_json) }));
}

/**
 * 付款成功。回 true 代表這是第一次；重送的回呼會拿到 false 而什麼都不做。
 * provider_ref 是 UNIQUE，同一筆交易號也插不進第二次。
 */
export function markPaid(db, { orderId, provider, providerRef }) {
  return transition(db, {
    table: "orders", id: orderId, from: "pending", to: "paid",
    set: { paid_at: now(), provider, provider_ref: providerRef },
  });
}

/**
 * worker 搶單。用條件式 UPDATE 讓資料庫決定誰贏，不做「先查再改」。
 * 租約過期的單會被重新搶走——worker 中途死掉不會讓訂單永遠卡住。
 */
export function claimOrder(db, { workerId, leaseMinutes = 20 }) {
  const until = new Date(Date.now() + leaseMinutes * 60000).toISOString();
  return tx(db, () => {
    const cand = db.prepare(`SELECT id FROM orders
      WHERE status = 'paid' AND provisioned_at IS NULL
        AND (lease_until IS NULL OR lease_until < ?) ORDER BY paid_at LIMIT 1`).get(now());
    if (!cand) return null;
    const r = db.prepare(`UPDATE orders SET lease_owner = ?, lease_until = ?, status = 'provisioning'
      WHERE id = ? AND status = 'paid' AND (lease_until IS NULL OR lease_until < ?)`)
      .run(workerId, until, cand.id, now());
    return r.changes === 1 ? getOrder(db, cand.id) : null;
  });
}

export function recordEvent(db, { kind, customerId = null, instanceId = null, actor = null, detail = null }) {
  db.prepare("INSERT INTO events(at,kind,customer_id,instance_id,actor,detail_json) VALUES(?,?,?,?,?,?)")
    .run(now(), kind, customerId, instanceId, actor, detail ? JSON.stringify(detail) : null);
}

/** 客戶的哪些信箱進得去、是什麼角色。gateway 每次請求都會問，所以要快。 */
export function memberRole(db, { customerId, email }) {
  const r = db.prepare("SELECT role FROM members WHERE customer_id = ? AND lower(email) = lower(?)")
    .get(customerId, email);
  return r ? r.role : null;
}

export function instanceByHost(db, host) {
  return db.prepare("SELECT * FROM instances WHERE host = ?").get(String(host || "").toLowerCase());
}
