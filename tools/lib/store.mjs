/**
 * SQLite 薄封裝（node:sqlite，Node 24 內建，零新依賴）。
 *
 * 為什麼新資料不再用 JSON 檔：現有的 wish-requests.json / github-sync.json 都是
 * 「讀進來 → 改 → 整份寫回」。tmp+rename 保證檔案不會半毀，但**不防 lost update**
 * ——兩個並發的 update 會有一個被默默蓋掉。許願申請掉一筆還能重送，付過錢的
 * 訂單掉一筆就是事故。所以訂單、租戶、實例一律走這裡。
 *
 * 既有的那些 JSON 檔不強迫遷移——那個 churn 不值得，而且它們的寫入者實際上
 * 是單一背景程序。這條界線寫在 DECISIONS.md。
 */
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

/**
 * 開啟資料庫並套上該有的 pragma。
 *
 * WAL：讀不擋寫、寫不擋讀。gateway 在讀的同時 worker 在寫，沒有 WAL 會互相卡。
 * busy_timeout：遇到鎖先等 5 秒再放棄，而不是立刻丟 SQLITE_BUSY 給使用者。
 * foreign_keys：SQLite 預設是關的，不開的話外鍵形同註解。
 */
export function open(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA busy_timeout = 5000");
  db.exec("PRAGMA synchronous = NORMAL");
  db.exec("PRAGMA foreign_keys = ON");
  return db;
}

/**
 * 交易。一律用 BEGIN IMMEDIATE，不用裸的 BEGIN。
 *
 * 差別很要命：BEGIN 會先拿讀鎖，等到真的要寫時才升級成寫鎖，而升級失敗時
 * SQLite **不會**套用 busy_timeout，直接丟 SQLITE_BUSY。BEGIN IMMEDIATE 一開始
 * 就拿寫鎖，拿不到才是 busy_timeout 該負責的事。
 */
export function tx(db, fn) {
  db.exec("BEGIN IMMEDIATE");
  try {
    const r = fn(db);
    db.exec("COMMIT");
    return r;
  } catch (error) {
    try { db.exec("ROLLBACK"); } catch { /* 已經沒有交易了就算了 */ }
    throw error;
  }
}

/**
 * 用 user_version 驅動的 migration。冪等：跑幾次都只會前進，不會重做。
 * @param {Array<{version:number, up:string|((db)=>void)}>} migrations 版本必須連續遞增
 */
export function migrate(db, migrations) {
  const current = db.prepare("PRAGMA user_version").get().user_version;
  const todo = migrations.filter((m) => m.version > current).sort((a, b) => a.version - b.version);
  if (!todo.length) return { from: current, to: current, applied: 0 };

  for (const m of todo) {
    tx(db, () => {
      if (typeof m.up === "function") m.up(db);
      else db.exec(m.up);
      // user_version 不吃參數綁定，只能字串內插——version 來自程式碼常數，不是外部輸入
      db.exec(`PRAGMA user_version = ${Number(m.version)}`);
    });
  }
  return { from: current, to: todo[todo.length - 1].version, applied: todo.length };
}

/**
 * 條件式狀態轉移。回傳是否真的改到（changes() === 1）。
 *
 * 這是防重複處理的核心手法：付款回呼會重送、worker 會有兩個同時醒來，
 * 「先 SELECT 檢查再 UPDATE」中間有空隙，兩邊都會覺得自己是第一個。
 * 把條件寫進 UPDATE 的 WHERE，由資料庫保證只有一個人贏。
 */
export function transition(db, { table, id, from, to, set = {} }) {
  const cols = Object.keys(set);
  const sql = `UPDATE ${table} SET status = ?${cols.map((c) => `, ${c} = ?`).join("")} WHERE id = ? AND status = ?`;
  const r = db.prepare(sql).run(to, ...cols.map((c) => set[c]), id, from);
  return r.changes === 1;
}

/** 樂觀鎖更新。rev 不符代表這筆已經被別人改過，回 false 讓上層回 409。 */
export function updateRow(db, { table, id, rev, set }) {
  const cols = Object.keys(set);
  if (!cols.length) return false;
  const sql = `UPDATE ${table} SET ${cols.map((c) => `${c} = ?`).join(", ")}, rev = rev + 1, updated_at = ? WHERE id = ? AND rev = ?`;
  const r = db.prepare(sql).run(...cols.map((c) => set[c]), new Date().toISOString(), id, rev);
  return r.changes === 1;
}

/** 產生排序友善的識別碼：時間在前，重跑不會撞。形狀沿用 wish-requests 的 id。 */
export function newId(prefix) {
  const rand = Math.random().toString(16).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}_${rand}`;
}
