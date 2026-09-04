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
    /* 金額在**寫進去的當下**就算好、釘在這一筆上。倍率之後改成 ×2 的話，
       改的是之後寫進來的，不會回頭改寫已經算過的帳——那就是切點。
       算不出來（設定表暫時讀不到）就先留空，billing 那邊的補算會撿回來。 */
    let bill = { multiplier: null, rate: null, usd: null };
    try {
      const billing = await import("./billing.mjs");
      const r = await billing.currentRate();
      bill = { multiplier: r.multiplier, rate: r.usdPerMtok,
        usd: billing.amountFor(row.in + row.out + row.cacheWrite, r) };
    } catch { /* 補算會處理 */ }

    await q(`INSERT INTO token_usage
        (at, actor, kind, model, instance_id, repo_name,
         tok_in, tok_out, tok_cache_write, tok_cache_read, tok_reasoning, turns, cost,
         bill_multiplier, bill_rate, bill_usd)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [row.at, row.actor, row.kind, row.model, row.instance, row.repo,
      row.in, row.out, row.cacheWrite, row.cacheRead, row.reasoning, row.turns, row.cost,
      bill.multiplier, bill.rate, bill.usd]);
    return true;
  } catch (e) {
    console.error("[usage] 寫不進資料庫，先落檔", String(e.message).slice(0, 120));
    try {
      fs.appendFileSync(SPILL, `${JSON.stringify({ ...row, at: row.at.toISOString() })}\n`);
    } catch { /* 連落檔都失敗就真的沒辦法了 */ }
    return false;
  }
}

/**
 * 把 "2026-09" / "2026" 解析成一段時間，外加畫圖要用的刻度。
 * 認不得就退回這個月——報表打不開比報表算錯還糟，而錯的來源多半是
 * 網址被人手動改過。
 */
export function parsePeriod(key) {
  const now = new Date();
  const m = /^(\d{4})-(\d{2})$/.exec(String(key || ""));
  const y = /^(\d{4})$/.exec(String(key || ""));
  if (y) {
    const yr = Number(y[1]);
    return { mode: "year", key: y[1], label: `${yr} 年`,
      from: new Date(yr, 0, 1), to: new Date(yr + 1, 0, 1) };
  }
  const yr = m ? Number(m[1]) : now.getFullYear();
  const mo = m ? Number(m[2]) - 1 : now.getMonth();
  const k = `${yr}-${String(mo + 1).padStart(2, "0")}`;
  return { mode: "month", key: k, label: `${yr} 年 ${mo + 1} 月`,
    from: new Date(yr, mo, 1), to: new Date(yr, mo + 1, 1) };
}

/** 一段區間的刻度：月看每一天，年看每一個月。空的刻度也要留著——
 *  只畫有資料的那幾格，兩格之間的距離會被讀成「連續的」。 */
function ticksOf(per) {
  const out = [];
  if (per.mode === "year") {
    const yr = per.from.getFullYear();
    for (let i = 0; i < 12; i += 1) {
      out.push({ k: `${yr}-${String(i + 1).padStart(2, "0")}`, label: `${i + 1}月` });
    }
    return out;
  }
  const yr = per.from.getFullYear(); const mo = per.from.getMonth();
  const last = new Date(yr, mo + 1, 0).getDate();
  for (let i = 1; i <= last; i += 1) {
    out.push({ k: `${yr}-${String(mo + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`, label: String(i) });
  }
  return out;
}

/**
 * 一個人的 token 用量。
 *
 * 為什麼要能選區間：一份只看得到「這個月」的報表，回答不了「上個月是不是
 * 也這麼多」，而那是看到一個大數字之後第一個會問的問題。所以月與年都要查
 * 得到，而且可以選的區間由帳本本身決定——列出沒有資料的月份只是讓人白點。
 *
 * bySystem 帶 instance 與 repo 兩個鍵，名稱留給上層去解：這一層看不到目錄
 * 索引，硬要在這裡取名只會取出一串英文代號。
 *
 * 計費的是新輸入、輸出與快取寫入；快取讀取另計且便宜一個量級，混在一起會讓
 * 使用者看到一個和帳單對不起來的數字，所以只在明細裡留著、不進總數。
 */
/**
 * 畫面上的 token 要不要換成「計價 token」。
 *
 * 為什麼會有這件事：金額是「原始 token × 單價 × 倍率」算出來的。如果畫面
 * 同時給原始 token 與金額，任何人把金額除以 token 就會得到「單價 × 倍率」
 * ——拿去跟市面行情一比，倍率等於自己招了。兩邊乘上同一個倍率之後，相除
 * 得到的就是單價本身，對得起來。
 *
 * 用每一筆自己釘著的倍率，不是現在這一份：跨過切點的區間裡，早期那幾筆
 * 的金額是用舊倍率算的，token 也要跟著用舊的乘，兩邊才會一致。
 *
 * 資料庫存的永遠是原始值。這只是顯示層——後台看到的仍然是原始 token。
 */
function shownTokens(billable, scaled, fallbackMultiplier) {
  if (!scaled) return billable;
  const m = Number(fallbackMultiplier) > 0 ? Number(fallbackMultiplier) : 1;
  return `(${billable}) * COALESCE(bill_multiplier, ${m})`;
}

export async function tokensFor(email, periodKey, systemKey, opts = {}) {
  const per = parsePeriod(periodKey);
  const sys1 = String(systemKey || "").trim();
  const zero = {
    total: 0, totalCost: 0, period: 0, calls: 0, cost: 0, ledger: false,
    series: ticksOf(per).map((t) => ({ ...t, n: 0 })),
    bySystem: [], systems: [], periods: { months: [], years: [] },
    at: { key: per.key, mode: per.mode, label: per.label, system: sys1 || null },
  };
  if (!email) return zero;
  let q;
  try { ({ q } = await import("./mysql.mjs")); } catch { return zero; }

  const RAW = "tok_in + tok_out + tok_cache_write";
  /* 給畫面看的 token。opts.scaled 打開時就是計價 token。 */
  let mult = 1;
  if (opts.scaled) {
    try { mult = (await (await import("./billing.mjs")).currentRate()).multiplier; }
    catch { mult = 1; }
  }
  const BILLABLE = shownTokens(RAW, !!opts.scaled, mult);
  /* 系統篩選：帳本裡的鍵是 repo_name，舊資料可能只有 instance_id，
     所以比對的是同一個 COALESCE——跟分組用的鍵一致，篩完才加得回原本的總數。 */
  const SYS = sys1 ? " AND COALESCE(repo_name, instance_id) = ?" : "";
  const range = sys1 ? [email, per.from, per.to, sys1] : [email, per.from, per.to];
  try {
    const [all] = await q(
      `SELECT COUNT(*) calls, COALESCE(SUM(${BILLABLE}),0) total,
              COALESCE(SUM(bill_usd),0) usd
         FROM token_usage WHERE actor = ?`, [email]);
    /* token 乘過倍率之後不會是整數（倍率可以填 2.5），四捨五入再給前端
       ——畫面上出現「569,535.5 個 token」只會讓人覺得系統壞了。 */
    const round = (v) => Math.round(Number(v) || 0);
    if (!all || !Number(all.calls)) return zero;

    const [sum] = await q(
      `SELECT COUNT(*) calls, COALESCE(SUM(${BILLABLE}),0) n,
              COALESCE(SUM(bill_usd),0) usd
         FROM token_usage WHERE actor = ? AND at >= ? AND at < ?${SYS}`, range);

    const bucket = per.mode === "year" ? "DATE_FORMAT(at,'%Y-%m')" : "DATE_FORMAT(at,'%Y-%m-%d')";
    const rows = await q(
      `SELECT ${bucket} k, SUM(${BILLABLE}) n FROM token_usage
        WHERE actor = ? AND at >= ? AND at < ?${SYS} GROUP BY k`, range);
    const byKey = new Map(rows.map((r) => [String(r.k), Number(r.n) || 0]));
    const series = ticksOf(per).map((t) => ({ ...t, n: round(byKey.get(t.k)) }));

    const sys = await q(
      `SELECT instance_id, repo_name, SUM(${BILLABLE}) n, COUNT(*) calls,
              COALESCE(SUM(bill_usd),0) usd
         FROM token_usage
        WHERE actor = ? AND at >= ? AND at < ?${SYS}
          AND COALESCE(repo_name, instance_id) IS NOT NULL
        GROUP BY instance_id, repo_name ORDER BY n DESC`, range);

    /* 可以選的區間就是帳本裡真的有東西的那幾個。 */
    const months = await q(
      `SELECT DISTINCT DATE_FORMAT(at,'%Y-%m') k FROM token_usage
        WHERE actor = ? ORDER BY k DESC LIMIT 24`, [email]);
    const years = await q(
      `SELECT DISTINCT DATE_FORMAT(at,'%Y') k FROM token_usage
        WHERE actor = ? ORDER BY k DESC LIMIT 6`, [email]);

    /* 可以篩的系統看的是整本帳，不是這一段區間——用區間內的清單當選項，
       選了一個月之後選單會少掉幾個系統，等於篩選器自己會跳來跳去。 */
    const allSys = await q(
      `SELECT COALESCE(repo_name, instance_id) k, MAX(instance_id) instance_id,
              MAX(repo_name) repo_name, SUM(${BILLABLE}) n
         FROM token_usage
        WHERE actor = ? AND COALESCE(repo_name, instance_id) IS NOT NULL
        GROUP BY k ORDER BY n DESC LIMIT 50`, [email]);

    return {
      total: round(all.total),
      /* 累計也要有金額。只給 token 數的話，那個大數字沒有辦法換算成
         「所以我花了多少」——而那才是看累計時想知道的事。 */
      totalCost: Math.round((Number(all.usd) || 0) * 100) / 100,
      period: round(sum && sum.n),
      calls: Number(sum && sum.calls) || 0,
      /* 金額是「要跟人收多少」，不是各家 API 回報的成本：一律用
         token × 單價 × 倍率算，所以每一筆都有值，畫面上不必再寫「至少」。 */
      cost: Math.round((Number(sum && sum.usd) || 0) * 100) / 100,
      ledger: true,
      series,
      bySystem: sys.map((r) => ({
        instance: r.instance_id || null, repo: r.repo_name || null,
        n: round(r.n), calls: Number(r.calls) || 0,
        cost: Math.round((Number(r.usd) || 0) * 100) / 100,
      })),
      systems: allSys.map((r) => ({
        key: String(r.k), instance: r.instance_id || null, repo: r.repo_name || null,
        n: round(r.n),
      })),
      periods: { months: months.map((r) => String(r.k)), years: years.map((r) => String(r.k)) },
      at: { key: per.key, mode: per.mode, label: per.label, system: sys1 || null },
    };
  } catch (e) {
    /* 資料庫暫時不通就回「還沒有資料」而不是丟例外——用量只是資訊，
       不該讓整個個人設定頁打不開。 */
    console.error("[usage] 讀不到用量", String(e.message).slice(0, 120));
    return zero;
  }
}

/**
 * 名單上每個人各自用了多少。
 *
 * 為什麼要有：使用名單本來只回答「誰進得去」，可是擁有者真正想知道的是
 * 「他到底有沒有在用、用在哪一套上」——名單上一個從來沒動過的信箱，跟一個
 * 每天在跑修改的人，長得一模一樣。所以每一列要帶得出用量、幾套系統、
 * 最後一次是什麼時候。
 *
 * 回的是一個以信箱為鍵的物件；查不到的人就是沒有紀錄，不補零列。
 */
export async function usageByActor(emails, opts = {}) {
  const list = (emails || []).map((e) => String(e || "").toLowerCase()).filter(Boolean);
  if (!list.length) return {};
  let q;
  try { ({ q } = await import("./mysql.mjs")); } catch { return {}; }
  let mult = 1;
  if (opts.scaled) {
    try { mult = (await (await import("./billing.mjs")).currentRate()).multiplier; }
    catch { mult = 1; }
  }
  const BILLABLE = shownTokens("tok_in + tok_out + tok_cache_write", !!opts.scaled, mult);
  const holes = list.map(() => "?").join(",");
  try {
    const rows = await q(
      `SELECT actor, SUM(${BILLABLE}) n, COUNT(*) calls, MAX(at) last,
              COALESCE(SUM(bill_usd),0) usd,
              COUNT(DISTINCT COALESCE(repo_name, instance_id)) systems
         FROM token_usage WHERE actor IN (${holes}) GROUP BY actor`, list);
    const out = {};
    for (const r of rows) {
      out[String(r.actor).toLowerCase()] = {
        n: Math.round(Number(r.n) || 0), calls: Number(r.calls) || 0,
        usd: Math.round((Number(r.usd) || 0) * 100) / 100,
        systems: Number(r.systems) || 0,
        last: r.last instanceof Date ? r.last.toISOString() : r.last || null,
      };
    }
    return out;
  } catch (e) {
    console.error("[usage] 讀不到成員用量", String(e.message).slice(0, 120));
    return {};
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
