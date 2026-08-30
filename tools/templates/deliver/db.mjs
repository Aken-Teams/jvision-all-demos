/**
 * 資料庫連線。連線資訊全部從環境變數來——交付出去的程式碼裡不該有任何密碼。
 *
 * 這一支取代站台版的 lib/mysql.mjs：那一支會去讀專案根目錄的 .env，
 * 而交付給客戶的是獨立部署，沒有那個檔也不該有。
 */
import mysql from "mysql2/promise";

let pool = null;

export function db() {
  if (pool) return pool;
  pool = mysql.createPool({
    host: process.env.MYSQL_HOST || "127.0.0.1",
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DB || "app",
    waitForConnections: true,
    connectionLimit: 8,
    /* 日期以字串回傳。轉成 Date 物件再序列化會帶上時區偏移，
       畫面上的日期就會莫名其妙差一天。 */
    dateStrings: true,
  });
  return pool;
}

export async function q(sql, params = []) {
  const [rows] = await db().execute(sql, params);
  return rows;
}

export async function one(sql, params = []) {
  const rows = await q(sql, params);
  return rows[0] || null;
}

export async function tx(fn) {
  const cn = await db().getConnection();
  try {
    await cn.beginTransaction();
    const out = await fn(cn);
    await cn.commit();
    return out;
  } catch (error) {
    await cn.rollback().catch(() => {});
    throw error;
  } finally {
    cn.release();
  }
}

/** 識別字白名單。表名與欄名會被拼進 SQL，不能只靠跳脫。 */
export function ident(s) {
  if (typeof s !== "string" || !/^[a-z][a-z0-9_]{0,62}$/.test(s)) {
    throw Object.assign(new Error(`不合法的識別字：${s}`), { status: 400 });
  }
  return `\`${s}\``;
}

export function qualified(dbName, table) {
  /* 交付版只有一個資料庫，dbName 一律用連線設定裡的那個。 */
  return ident(table);
}

export async function close() { if (pool) { await pool.end(); pool = null; } }
