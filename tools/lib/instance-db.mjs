/**
 * 客戶實例的資料層：把 content/schema/<repo>.json 的表格定義變成真的資料表，
 * 並提供 CRUD。這是「demo 變成能存資料的系統」的核心。
 *
 * **每個實例一個獨立資料庫**（沙盒）。隔離就是資料庫邊界，不必靠查詢寫對
 * WHERE 條件；備份、匯出、刪除也都是整個資料庫的操作，乾淨俐落。
 *
 * 表名一律寫全名 `資料庫`.`表`，不用 USE——連線池的每一句都可能落在不同連線上，
 * USE 的效果不保證跟著下一句走，而那種錯會安靜地查到別人的資料庫。
 * 資料庫名與表名都不能參數綁定，一律經 ident() 白名單化才拼進 SQL。
 */
import { q, one, tx, ident, qualified } from "./mysql.mjs";

/* 型別對應。刻意保守：只有明確是數字的才用數字欄位，其餘一律文字。
   percent/date 保持文字，因為 demo 畫面上就是「8.2 mm/s」「D+3」這種帶單位的
   顯示值，硬轉成數字會丟掉單位，客戶看到的東西就變了。 */
const SQL_TYPE = { int: "BIGINT", number: "DOUBLE" };

/** 內部欄位一律底線開頭；業務欄位的 key 是 ^[a-z] 開頭，天然不會撞。 */
const RESERVED = new Set(["_id", "_created_at", "_updated_at", "_created_by", "_deleted_at", "rev"]);

function col(key) {
  if (RESERVED.has(key)) throw Object.assign(new Error(`保留欄位名：${key}`), { status: 400 });
  return ident(key);
}

const T = (dbName, name) => qualified(dbName, name);
const now = () => new Date().toISOString().slice(0, 19).replace("T", " ");

/**
 * 依 schema 建立這個實例的資料表。冪等，可以重跑。
 * @param {string} dbName 這個實例專屬的資料庫名，例如 jv_imte1a2b3
 * @param {object} schema content/schema/<repo>.json 的內容
 */
export async function createFromSchema(dbName, schema, { seed = true } = {}) {
  const meta = T(dbName, "jv_meta");
  const colsT = T(dbName, "jv_columns");
  const auditT = T(dbName, "jv_audit");

  await q(`CREATE TABLE IF NOT EXISTS ${meta} (
    \`key\` VARCHAR(40) PRIMARY KEY, value TEXT) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  await q(`CREATE TABLE IF NOT EXISTS ${colsT} (
    table_name VARCHAR(64) NOT NULL, \`key\` VARCHAR(64) NOT NULL, label VARCHAR(120) NOT NULL,
    type VARCHAR(20) NOT NULL, ord INT NOT NULL, added_by VARCHAR(190),
    PRIMARY KEY (table_name, \`key\`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  /* 稽核：客戶的資料被誰改過。買斷制沒有客服可以查 log，這是唯一的追溯依據。 */
  await q(`CREATE TABLE IF NOT EXISTS ${auditT} (
    id BIGINT AUTO_INCREMENT PRIMARY KEY, at DATETIME NOT NULL, actor VARCHAR(190),
    table_name VARCHAR(64), row_id BIGINT, action VARCHAR(20),
    before_json JSON, after_json JSON, INDEX idx_at (at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  for (const [k, v] of [["repo_name", schema.repoName], ["created_at", now()], ["schema_version", "1"]]) {
    await q(`INSERT INTO ${meta}(\`key\`,value) VALUES(?,?) ON DUPLICATE KEY UPDATE value=VALUES(value)`, [k, v]);
  }

  for (const t of schema.tables) {
    const phys = T(dbName, t.name);
    const defs = t.columns.map((c) => `${col(c.key)} ${SQL_TYPE[c.type] || "TEXT"}`).join(",\n      ");
    await q(`CREATE TABLE IF NOT EXISTS ${phys} (
      _id BIGINT AUTO_INCREMENT PRIMARY KEY,
      ${defs},
      _created_at DATETIME NOT NULL,
      _updated_at DATETIME NOT NULL,
      _created_by VARCHAR(190),
      _deleted_at DATETIME NULL,
      rev INT NOT NULL DEFAULT 1,
      INDEX idx_live (_deleted_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    for (const [i, c] of t.columns.entries()) {
      await q(`INSERT INTO ${colsT}(table_name,\`key\`,label,type,ord) VALUES(?,?,?,?,?)
               ON DUPLICATE KEY UPDATE label=VALUES(label), type=VALUES(type), ord=VALUES(ord)`,
        [t.name, c.key, c.label, c.type, i]);
    }

    if (seed && t.seed?.length) {
      const existing = await one(`SELECT COUNT(*) c FROM ${phys}`);
      if (!existing.c) {
        const keys = t.columns.map((c) => c.key);
        const cols = keys.map(col).join(",");
        const marks = keys.map(() => "?").join(",");
        for (const row of t.seed) {
          await q(`INSERT INTO ${phys} (${cols}, _created_at, _updated_at, _created_by)
                   VALUES (${marks}, ?, ?, 'seed')`, [...keys.map((k) => row[k] ?? null), now(), now()]);
        }
      }
    }
  }
}

/** 這個實例有哪些表、每張表有哪些欄位。前端要靠它動態畫表單。 */
export async function describe(dbName) {
  const colsT = T(dbName, "jv_columns");
  const names = await q(`SELECT DISTINCT table_name FROM ${colsT} ORDER BY table_name`);
  const repo = await one(`SELECT value FROM ${T(dbName, "jv_meta")} WHERE \`key\`='repo_name'`);
  const tables = [];
  for (const n of names) {
    const columns = await q(`SELECT \`key\`,label,type FROM ${colsT} WHERE table_name=? ORDER BY ord`, [n.table_name]);
    const c = await one(`SELECT COUNT(*) c FROM ${T(dbName, n.table_name)} WHERE _deleted_at IS NULL`);
    tables.push({ name: n.table_name, columns, count: c.c });
  }
  return { repoName: repo?.value ?? null, tables };
}

/** 表名只能是這個實例裡真的登記過的——不從外部字串直接拼進 SQL。 */
async function assertTable(dbName, table) {
  const ok = await one(`SELECT 1 x FROM ${T(dbName, "jv_columns")} WHERE table_name=? LIMIT 1`, [table]);
  if (!ok) throw Object.assign(new Error(`沒有這張表：${table}`), { status: 404 });
  return T(dbName, table);
}

const keysOf = async (dbName, table) =>
  (await q(`SELECT \`key\` FROM ${T(dbName, "jv_columns")} WHERE table_name=? ORDER BY ord`, [table]))
    .map((r) => r.key);

export async function list(dbName, table, { limit = 50, offset = 0, q: search = "" } = {}) {
  const phys = await assertTable(dbName, table);
  const keys = await keysOf(dbName, table);
  let where = "_deleted_at IS NULL";
  const params = [];
  if (search) {
    where += ` AND (${keys.map((k) => `IFNULL(${col(k)},'') LIKE ?`).join(" OR ")})`;
    for (const _ of keys) params.push(`%${search}%`);
  }
  const total = (await one(`SELECT COUNT(*) c FROM ${phys} WHERE ${where}`, params)).c;
  const rows = await q(`SELECT _id, ${keys.map(col).join(",")}, rev, _updated_at FROM ${phys}
    WHERE ${where} ORDER BY _id DESC LIMIT ? OFFSET ?`, [...params, Math.min(Number(limit), 200), Number(offset)]);
  return { rows, total };
}

export async function create(dbName, table, values, actor) {
  const phys = await assertTable(dbName, table);
  const keys = await keysOf(dbName, table);
  return tx(async (cn) => {
    const [r] = await cn.execute(`INSERT INTO ${phys} (${keys.map(col).join(",")}, _created_at, _updated_at, _created_by)
      VALUES (${keys.map(() => "?").join(",")}, ?, ?, ?)`,
      [...keys.map((k) => values[k] ?? null), now(), now(), actor]);
    const id = r.insertId;
    await audit(cn, dbName, { actor, table, rowId: id, action: "create", after: values });
    const [rows] = await cn.execute(`SELECT _id, ${keys.map(col).join(",")}, rev FROM ${phys} WHERE _id=?`, [id]);
    return rows[0];
  });
}

/**
 * 更新。必須帶 rev——兩個人同時改同一列時，後到的會拿到 conflict，
 * 由呼叫端回 409 告訴他「這筆已經被別人改過」，而不是默默覆蓋。
 */
export async function update(dbName, table, id, values, rev, actor) {
  const phys = await assertTable(dbName, table);
  const keys = await keysOf(dbName, table);
  const set = {};
  for (const k of keys) if (k in values) set[k] = values[k];
  if (!Object.keys(set).length) return { ok: false, reason: "沒有要更新的欄位" };
  return tx(async (cn) => {
    const [before] = await cn.execute(`SELECT * FROM ${phys} WHERE _id=? AND _deleted_at IS NULL`, [id]);
    if (!before.length) return { ok: false, reason: "找不到這筆" };
    const cols = Object.keys(set);
    const [r] = await cn.execute(
      `UPDATE ${phys} SET ${cols.map((c) => `${col(c)}=?`).join(",")}, rev=rev+1, _updated_at=? WHERE _id=? AND rev=?`,
      [...cols.map((c) => set[c]), now(), id, Number(rev)]);
    if (r.affectedRows !== 1) return { ok: false, reason: "conflict", current: before[0] };
    await audit(cn, dbName, { actor, table, rowId: id, action: "update", before: before[0], after: set });
    const [rows] = await cn.execute(`SELECT _id, ${keys.map(col).join(",")}, rev FROM ${phys} WHERE _id=?`, [id]);
    return { ok: true, row: rows[0] };
  });
}

/** 軟刪。客戶誤刪的東西要救得回來——買斷制沒有備份服務可以求救。 */
export async function remove(dbName, table, id, actor) {
  const phys = await assertTable(dbName, table);
  return tx(async (cn) => {
    const [before] = await cn.execute(`SELECT * FROM ${phys} WHERE _id=? AND _deleted_at IS NULL`, [id]);
    if (!before.length) return false;
    await cn.execute(`UPDATE ${phys} SET _deleted_at=?, _updated_at=?, rev=rev+1 WHERE _id=?`, [now(), now(), id]);
    await audit(cn, dbName, { actor, table, rowId: id, action: "delete", before: before[0] });
    return true;
  });
}

/** 客戶自己加欄位。ADD COLUMN 之後舊資料那一欄是 NULL，不會壞。 */
export async function addColumn(dbName, table, { key, label, type = "text" }, actor) {
  const phys = await assertTable(dbName, table);
  const colsT = T(dbName, "jv_columns");
  col(key);
  if (await one(`SELECT 1 x FROM ${colsT} WHERE table_name=? AND \`key\`=?`, [table, key])) {
    throw Object.assign(new Error("欄位已存在"), { status: 409 });
  }
  await q(`ALTER TABLE ${phys} ADD COLUMN ${col(key)} ${SQL_TYPE[type] || "TEXT"}`);
  const ord = (await one(`SELECT IFNULL(MAX(ord),-1)+1 n FROM ${colsT} WHERE table_name=?`, [table])).n;
  await q(`INSERT INTO ${colsT}(table_name,\`key\`,label,type,ord,added_by) VALUES(?,?,?,?,?,?)`,
    [table, key, label || key, type, ord, actor]);
  return { key, label: label || key, type };
}

/* 實例整個移除請用 control-db 的 destroyInstance()——它會 DROP DATABASE，
   比逐張刪表乾淨，也不會漏掉客戶自己加出來的表。 */

async function audit(cn, dbName, { actor, table, rowId, action, before = null, after = null }) {
  await cn.execute(`INSERT INTO ${T(dbName, "jv_audit")}(at,actor,table_name,row_id,action,before_json,after_json)
    VALUES(?,?,?,?,?,?,?)`,
    [now(), actor ?? null, table, rowId, action,
      before ? JSON.stringify(before) : null, after ? JSON.stringify(after) : null]);
}
