/**
 * 一個人用掉多少 token、佔了多少空間。
 *
 * 兩個數字的來源完全不同，所以分開算、各自允許失敗：
 *   token  讀 var/token-usage.jsonl（每次 LLM 呼叫附加一行）
 *          ——AI 修改（codex）與 Python 那邊的分析都寫進同一份
 *   空間   實例目錄的檔案大小 ＋ 該實例資料庫在 MySQL 的實際佔用
 *
 * 空間刻意不用 du：那要 spawn 一個行程，而這支會被帳號選單每次開啟時呼叫。
 * 遞迴讀目錄在實例這種規模（幾十個檔）比 spawn 便宜得多。
 */
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./forge-common.mjs";

const LEDGER = path.join(ROOT, "var", "token-usage.jsonl");

/**
 * 記一筆用量。
 *
 * ── 為什麼要有 ────────────────────────────────────────
 * 在這之前，只有 Python 那邊的分析會寫帳，而**使用者按下「修改」跑的 codex
 * 完全沒有記**。結果是個人設定上「這個月的 token」顯示 0，但那個人今天已經
 * 做了幾十次 AI 修改——那個數字不是稀疏，是錯的。而接下來要做的「每個人可以
 * 用多少額度」完全建立在這份帳上，帳不準的話額度就是隨機扣的。
 *
 * ── 為什麼用同一個檔、同一組欄位 ──────────────────────
 * 兩邊的用量必須加得起來，才回答得了「這個人總共用了多少」。所以沿用既有的
 * in/out/cacheWrite/cacheRead，不另開一套語彙。
 *
 * ── cost 為什麼可以是 null ────────────────────────────
 * codex 的事件不含模型名稱與價格，硬套一個價目表只會產生一個看起來精確、
 * 實際上是猜的金額——而那個金額會出現在別人的帳單旁邊。寧可誠實地留空，
 * 讓畫面說「這部分沒有計價」。token 數本身是準的，額度用它就夠了。
 *
 * 附加寫入，寫失敗只記在 console：記帳不該讓一次成功的修改變成失敗。
 */
export function record({ actor, kind = "llm", model = null, instance = null, repo = null, usage = {}, cost = null }) {
  if (!actor) return false;
  const n = (v) => (Number.isFinite(Number(v)) ? Math.max(0, Math.round(Number(v))) : 0);
  const row = {
    at: new Date().toISOString(),
    actor: String(actor).slice(0, 190),
    kind,
    model,
    instance,
    repo,
    in: n(usage.in),
    out: n(usage.out),
    cacheWrite: n(usage.cacheWrite),
    cacheRead: n(usage.cacheRead),
    reasoning: n(usage.reasoning),
    turns: n(usage.turns),
    cost,
  };
  /* 一個 token 都沒有的不記——那是呼叫失敗到連 turn 都沒開始，
     留著只會在報表上變成一堆 0 的雜訊。 */
  if (!row.in && !row.out && !row.cacheWrite && !row.cacheRead) return false;
  try {
    fs.mkdirSync(path.dirname(LEDGER), { recursive: true });
    fs.appendFileSync(LEDGER, `${JSON.stringify(row)}\n`);
    return true;
  } catch (e) {
    console.error("[usage]", String(e.message).slice(0, 120));
    return false;
  }
}

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
  /* daily／byInstance 是給圖表與額度用的：光有一個總數，看不出「什麼時候用的」
     與「用在哪一套上」，而那正是要設額度時第一個會被問的兩件事。 */
  const out = { total: 0, month: 0, calls: 0, cost: 0, ledger: true,
    costPartial: false, daily: {}, byInstance: {} };
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
    /* cost 是 null 代表那一筆沒有價格資訊（codex 的事件不含模型與單價）。
       當成 0 加進去會讓總額看起來像「就是這麼多」，所以另外標記。 */
    if (r.cost == null) out.costPartial = true;
    else out.cost += r.cost;
    if (r.at >= since) {
      out.month += n;
      const day = String(r.at).slice(0, 10);
      out.daily[day] = (out.daily[day] || 0) + n;
      const key = r.repo || r.instance || "";
      if (key) out.byInstance[key] = (out.byInstance[key] || 0) + n;
    }
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
