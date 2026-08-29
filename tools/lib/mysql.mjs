/**
 * 平台資料庫連線（MySQL）。
 *
 * 設定用 JV_MYSQL_* 而不是既有的 MYSQL_*——後者是許願池 wish.py 在用的
 * （指向 db_Survey），共用變數名會讓它寫到錯的資料庫。
 *
 * 用連線池：gateway 每個請求都可能要查一次租戶授權，每次開新連線的延遲
 * 會直接加在使用者身上，而且共用主機的連線數是有限的。
 */
import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";
import { ROOT } from "./forge-common.mjs";

function envFromFile() {
  const p = path.join(ROOT, ".env");
  if (!fs.existsSync(p)) return {};
  const out = {};
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (m) out[m[1]] = m[2];
  }
  return out;
}

export function config() {
  const e = { ...envFromFile(), ...process.env };
  const need = ["JV_MYSQL_HOST", "JV_MYSQL_DB", "JV_MYSQL_USER", "JV_MYSQL_PASSWORD"];
  const miss = need.filter((k) => !e[k]);
  if (miss.length) throw new Error(`缺少資料庫設定：${miss.join(", ")}（見 .env）`);
  return {
    host: e.JV_MYSQL_HOST,
    port: Number(e.JV_MYSQL_PORT || 3306),
    database: e.JV_MYSQL_DB,
    user: e.JV_MYSQL_USER,
    password: e.JV_MYSQL_PASSWORD,
  };
}

let pool = null;
export function db() {
  if (!pool) {
    pool = mysql.createPool({
      ...config(),
      waitForConnections: true,
      /* 共用主機，不要把連線數吃光——這台上面還有兩百多個資料庫在跑。 */
      connectionLimit: 8,
      queueLimit: 0,
      charset: "utf8mb4_unicode_ci",
      /* 日期一律拿字串回來自己處理。驅動轉成 Date 物件之後再序列化成 JSON
         會變成 UTC 的 ISO 字串，與我們存進去的當地時間字串對不起來。 */
      dateStrings: true,
      timezone: "Z",
    });
  }
  return pool;
}

export async function close() { if (pool) { await pool.end(); pool = null; } }

/** 一次性查詢。回 rows。 */
export async function q(sql, params = []) {
  const [rows] = await db().execute(sql, params);
  return rows;
}

/** 取單筆。 */
export async function one(sql, params = []) {
  const rows = await q(sql, params);
  return rows[0] ?? null;
}

/** 交易。拿一條連線做完再還回池子——不能用 pool.execute，那每句都可能是不同連線。 */
export async function tx(fn) {
  const conn = await db().getConnection();
  try {
    await conn.beginTransaction();
    const r = await fn(conn);
    await conn.commit();
    return r;
  } catch (error) {
    try { await conn.rollback(); } catch { /* 連線已死就算了 */ }
    throw error;
  } finally {
    conn.release();
  }
}

/**
 * 識別字白名單化。表名與欄位名不能用參數綁定，只能拼字串，所以必須自己擋。
 * 規則故意很嚴：小寫英數與底線、字母開頭、長度上限。
 */
export function ident(s) {
  if (typeof s !== "string" || !/^[a-z][a-z0-9_]{0,62}$/.test(s)) {
    throw Object.assign(new Error(`不合法的識別字：${s}`), { status: 400 });
  }
  return `\`${s}\``;
}

/** 產生排序友善的識別碼，形狀沿用既有的 wish-requests。 */
export function newId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 8)}`;
}
