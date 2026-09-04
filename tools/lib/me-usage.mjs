/**
 * 一個人用掉多少 token、佔了多少空間。
 *
 * 兩個數字的來源完全不同，所以分開算、各自允許失敗：
 *   token  控制面的 token_usage 表（每次 LLM 呼叫寫一列）
 *          ——AI 修改（codex）、對話的意圖分類、Python 那邊的分析都寫同一張
 *   空間   實例目錄的檔案大小 ＋ 該實例資料庫在 MySQL 的實際佔用
 *
 * 空間刻意不用 du：那要 spawn 一個行程，而這支會被帳號選單每次開啟時呼叫。
 * 遞迴讀目錄在實例這種規模（幾十個檔）比 spawn 便宜得多。
 */
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./forge-common.mjs";

/* 舊的檔案帳目。只在匯入時讀，不再寫。 */
const LEDGER = path.join(ROOT, "var", "token-usage.jsonl");
/* 資料庫寫不進去時的落腳處。補進去之後就可以刪。 */
const SPILL = path.join(ROOT, "var", "token-usage-spill.jsonl");

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
/**
 * 記一筆用量。
 *
 * ── 為什麼要有 ────────────────────────────────────────
 * 在這之前，只有 Python 那邊的分析會寫帳，而**使用者按下「修改」跑的 codex、
 * 以及每送一則訊息就跑一次的意圖分類，兩條都沒有記**。結果是個人設定上
 * 「這個月的 token」顯示 0，但那個人今天已經做了幾十次 AI 修改——那個數字
 * 不是稀疏，是錯的。而「每個人可以用多少額度」完全建立在這份帳上。
 *
 * ── 為什麼寫資料庫不寫檔案 ────────────────────────────
 * 原本寫 var/token-usage.jsonl。那是給人印出來看一眼的格式，撐不住接下來
 * 要做的事：後台要能問「這個人這個月用了多少」，檔案得整份重讀，而且它會
 * 一直長；現在還有兩個行程在寫同一個檔，附加寫入大多數時候沒事，但沒有
 * 任何保證。
 *
 * ── 寫不進去怎麼辦 ────────────────────────────────────
 * 落到 var/token-usage-spill.jsonl 並且記一行錯誤。資料庫暫時不通時，帳寧可
 * 晚一點補進去，也不要安靜地消失——消失的那幾筆就是某個人白用的額度。
 *
 * ── cost 為什麼可以是 null ────────────────────────────
 * codex 的事件不含模型名稱與價格，硬套一個價目表只會產生一個看起來精確、
 * 實際上是猜的金額——而那個金額會出現在別人的帳單旁邊。寧可誠實地留空，
 * 讓畫面說「至少」。token 數本身是準的，額度用它就夠了。
 */
export async function record({ actor, kind = "llm", model = null, instance = null, repo = null, usage = {}, cost = null }) {
  if (!actor) return false;
  const n = (v) => (Number.isFinite(Number(v)) ? Math.max(0, Math.round(Number(v))) : 0);
  const row = {
    at: new Date(),
    actor: String(actor).slice(0, 190),
    kind: String(kind).slice(0, 20),
    model: model ? String(model).slice(0, 80) : null,
    instance: instance || null,
    repo: repo || null,
    in: n(usage.in), out: n(usage.out),
    cacheWrite: n(usage.cacheWrite), cacheRead: n(usage.cacheRead),
    reasoning: n(usage.reasoning), turns: n(usage.turns),
    cost: cost == null ? null : Number(cost),
  };
  /* 一個 token 都沒有的不記——那是呼叫失敗到連 turn 都沒開始，
     留著只會在報表上變成一堆 0 的雜訊。 */
  if (!row.in && !row.out && !row.cacheWrite && !row.cacheRead) return false;
  try {
    const { q } = await import("./mysql.mjs");
    await q(`INSERT INTO token_usage
        (at, actor, kind, model, instance_id, repo_name,
         tok_in, tok_out, tok_cache_write, tok_cache_read, tok_reasoning, turns, cost)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [row.at, row.actor, row.kind, row.model, row.instance, row.repo,
      row.in, row.out, row.cacheWrite, row.cacheRead, row.reasoning, row.turns, row.cost]);
    return true;
  } catch (e) {
    console.error("[usage] 寫不進資料庫，先落檔", String(e.message).slice(0, 120));
    try {
      fs.appendFileSync(SPILL, `${JSON.stringify({ ...row, at: row.at.toISOString() })}\n`);
    } catch { /* 連落檔都失敗就真的沒辦法了 */ }
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
/**
 * 一個人的 token 用量。
 *
 * daily 與 byInstance 是給圖表與額度用的：光有一個總數，看不出「什麼時候用的」
 * 與「用在哪一套上」，而那正是要設額度時第一個會被問的兩件事。
 *
 * 計費的是新輸入、輸出與快取寫入；快取讀取另計且便宜一個量級，混在一起會讓
 * 使用者看到一個和帳單對不起來的數字，所以只在明細裡留著、不進總數。
 */
export async function tokensFor(email) {
  const zero = { total: 0, month: 0, calls: 0, cost: 0, ledger: false,
    costPartial: false, daily: {}, byInstance: {} };
  if (!email) return zero;
  let q;
  try { ({ q } = await import("./mysql.mjs")); } catch { return zero; }

  const BILLABLE = "tok_in + tok_out + tok_cache_write";
  try {
    const [all] = await q(
      `SELECT COUNT(*) calls, COALESCE(SUM(${BILLABLE}),0) total,
              COALESCE(SUM(cost),0) cost, SUM(cost IS NULL) noCost
         FROM token_usage WHERE actor = ?`, [email]);
    if (!all || !Number(all.calls)) return zero;

    /* 「這個月」用當地時間的月初——使用者看到的月份是他的月份。 */
    const d = new Date();
    const since = new Date(d.getFullYear(), d.getMonth(), 1);

    const [mon] = await q(
      `SELECT COALESCE(SUM(${BILLABLE}),0) month FROM token_usage
        WHERE actor = ? AND at >= ?`, [email, since]);
    const days = await q(
      `SELECT DATE(at) d, SUM(${BILLABLE}) n FROM token_usage
        WHERE actor = ? AND at >= ? GROUP BY DATE(at) ORDER BY d`, [email, since]);
    const byRepo = await q(
      `SELECT COALESCE(repo_name, instance_id) k, SUM(${BILLABLE}) n FROM token_usage
        WHERE actor = ? AND at >= ? AND COALESCE(repo_name, instance_id) IS NOT NULL
        GROUP BY k ORDER BY n DESC`, [email, since]);

    const daily = {};
    for (const r of days) {
      /* DATE() 回的是 Date 物件，轉成 YYYY-MM-DD 給前端當鍵。 */
      const key = r.d instanceof Date
        ? `${r.d.getFullYear()}-${String(r.d.getMonth() + 1).padStart(2, "0")}-${String(r.d.getDate()).padStart(2, "0")}`
        : String(r.d).slice(0, 10);
      daily[key] = Number(r.n) || 0;
    }
    const byInstance = {};
    for (const r of byRepo) byInstance[r.k] = Number(r.n) || 0;

    return {
      total: Number(all.total) || 0,
      month: Number(mon && mon.month) || 0,
      calls: Number(all.calls) || 0,
      cost: Math.round((Number(all.cost) || 0) * 10000) / 10000,
      /* 有任何一筆沒有價格，總額就只是「至少這麼多」。 */
      costPartial: Number(all.noCost) > 0,
      ledger: true, daily, byInstance,
    };
  } catch (e) {
    /* 資料庫暫時不通就回「還沒有資料」而不是丟例外——用量只是資訊，
       不該讓整個個人設定頁打不開。 */
    console.error("[usage] 讀不到用量", String(e.message).slice(0, 120));
    return zero;
  }
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
