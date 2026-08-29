/**
 * 一個人用掉多少 token、佔了多少空間。
 *
 * 兩個數字的來源完全不同，所以分開算、各自允許失敗：
 *   token  讀 var/token-usage.jsonl（Python 那邊每次 LLM 呼叫附加一行）
 *   空間   實例目錄的檔案大小 ＋ 該實例資料庫在 MySQL 的實際佔用
 *
 * 空間刻意不用 du：那要 spawn 一個行程，而這支會被帳號選單每次開啟時呼叫。
 * 遞迴讀目錄在實例這種規模（幾十個檔）比 spawn 便宜得多。
 */
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./forge-common.mjs";

const LEDGER = path.join(ROOT, "var", "token-usage.jsonl");

/** 這個月的起點。用當地時間，因為使用者看到的「這個月」是他的月份。 */
function monthStart() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

/**
 * 讀帳本並彙總。整份讀進來——每筆約 160 bytes，一年一萬筆也才 1.6MB，
 * 為了它做輪替或索引是還沒發生的問題。真的長大了再說。
 */
export function tokensFor(email) {
  const zero = { total: 0, month: 0, calls: 0, cost: 0, ledger: false };
  if (!email || !fs.existsSync(LEDGER)) return zero;
  let text;
  try { text = fs.readFileSync(LEDGER, "utf8"); } catch { return zero; }
  const since = monthStart();
  const out = { total: 0, month: 0, calls: 0, cost: 0, ledger: true };
  for (const line of text.split("\n")) {
    if (!line) continue;
    let r;
    try { r = JSON.parse(line); } catch { continue; } // 寫到一半的最後一行，跳過就好
    if (r.actor !== email) continue;
    /* 計費的是新輸入、輸出與快取寫入；快取讀取另計且便宜一個量級，
       混在一起會讓使用者看到一個和帳單對不起來的數字。 */
    const n = (r.in || 0) + (r.out || 0) + (r.cacheWrite || 0);
    out.total += n;
    out.calls += 1;
    out.cost += r.cost || 0;
    if (r.at >= since) out.month += n;
  }
  out.cost = Math.round(out.cost * 10000) / 10000;
  return out;
}

/** 遞迴加總目錄大小。讀不到的子項略過——權限或競態不該讓整個數字消失。 */
function dirBytes(dir, depth = 0) {
  if (depth > 6) return 0;
  let n = 0;
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return 0; }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    try {
      if (e.isDirectory()) n += dirBytes(full, depth + 1);
      else if (e.isFile()) n += fs.statSync(full).size;
    } catch { /* 這一項算不到就算了 */ }
  }
  return n;
}

/**
 * 空間。檔案的部分一定算得到；資料庫的部分要連得上 MySQL，
 * 連不上就只回檔案的部分並標記 partial，而不是整個失敗。
 */
export async function storageFor(instances, query) {
  const out = { files: 0, db: 0, systems: instances.length, partial: false };
  for (const inst of instances) {
    if (inst.dir) out.files += dirBytes(inst.dir);
  }
  const names = instances.map((i) => i.db_name).filter(Boolean);
  if (!names.length) return out;
  try {
    const rows = await query(
      `SELECT table_schema AS db, SUM(data_length + index_length) AS bytes
         FROM information_schema.tables
        WHERE table_schema IN (${names.map(() => "?").join(",")})
        GROUP BY table_schema`, names);
    for (const r of rows) out.db += Number(r.bytes || 0);
  } catch {
    out.partial = true; // 資料庫那半算不到，但檔案那半仍然是真的
  }
  return out;
}
