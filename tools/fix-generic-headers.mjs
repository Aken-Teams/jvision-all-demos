#!/usr/bin/env node
/**
 * 把「編號／項目／負責人／期限／階段」這種樣板表頭換成該領域真正的欄位。
 *
 * 這組欄位來自 detail-template 寫死的 records.columns，早期的 demo-forge 被
 * 要求「照規格做」時就忠實照抄了。結果是一套《開挖支撐巡查交班台》的表格
 * 長得跟通用待辦清單一模一樣——而客戶按「模板複製」買走的就是畫面上那張表。
 *
 * 新生成的已經在 demo-forge 的 prompt 與 static-gate 兩層擋掉了，這一支是
 * 回頭處理既有的 703 套。
 *
 * ── 只換文字，不動標記 ──
 * 欄數維持不變，只替換 <th> 與 <td> 裡的文字節點，<span class="badge"> 那些
 * class 原封不動。重新生成整張表的話，badge 的顏色規則、對齊、欄寬全都要
 * 重新對一次，而那些東西壞掉不會報錯，只會看起來怪怪的。
 *
 * ── 跳過已經被複製的 ──
 * 實例的 runtime 是靠 <th> 的文字認表的。已經有客戶複製過的模板改了表頭，
 * 他手上那套就接不上——那是我們單方面把他的系統弄壞。
 *
 *   node tools/fix-generic-headers.mjs [--limit=N] [--workers=4] [--dry-run] [--resume] [--retry-failed]
 */
import fs from "node:fs";
import path from "node:path";
import { ROOT, EXIT, parseArgs, num, list, makeLogger, loadCatalog } from "./lib/forge-common.mjs";
import { runCodexWithRetry } from "./lib/codex-run.mjs";
import { staticGate } from "./lib/static-gate.mjs";

const args = parseArgs();
const log = makeLogger({ quiet: Boolean(args.quiet) });
const DRY = Boolean(args["dry-run"]);
const WORKERS = Math.max(1, Math.min(8, num(args.workers, 4)));
const STATE = path.join(ROOT, "docs", "_state", "header-fix.json");
const SCHEMA = path.join(ROOT, "tools", "schemas", "header-fix.schema.json");
const DEMOS = path.join(ROOT, "demos");

const GENERIC = ["編號", "項目", "負責人", "期限", "階段"];
const strip = (s) => s.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

/** 這張表是不是那組樣板欄位。 */
function isGeneric(block) {
  const th = [...block.matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/gi)].map((m) => strip(m[1]));
  return GENERIC.every((g) => th.includes(g)) ? th : null;
}

/** 表格內容：表頭與每一列的純文字。給模型看的是文字，不是標記。 */
function readTable(block) {
  const headers = [...block.matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/gi)].map((m) => strip(m[1]));
  const rows = [];
  for (const r of block.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...r[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => strip(m[1]));
    if (cells.length === headers.length) rows.push(cells);
  }
  return { headers, rows };
}

/**
 * 把新的文字替回原本的標記裡。
 *
 * 逐個 <th>／<td> 只換「標籤之間的那段文字」，其餘一個位元組都不動——
 * 所以 class、colspan、內層的 <span class="badge"> 全都留著。
 * badge 那種內層有標籤的，換掉最內層的文字節點。
 */
function writeTable(block, headers, rows) {
  let i = 0;
  let out = block.replace(/(<th\b[^>]*>)([\s\S]*?)(<\/th>)/gi, (m, open, inner, close) => {
    const next = headers[i]; i += 1;
    if (next == null) return m;
    return open + swapText(inner, next) + close;
  });
  let r = -1;
  out = out.replace(/(<tr[^>]*>)([\s\S]*?)(<\/tr>)/gi, (m, open, inner, close) => {
    if (!/<td/i.test(inner)) return m;
    r += 1;
    const row = rows[r];
    if (!row) return m;
    let c = 0;
    const body = inner.replace(/(<td[^>]*>)([\s\S]*?)(<\/td>)/gi, (mm, o, v, cl) => {
      const next = row[c]; c += 1;
      if (next == null) return mm;
      return o + swapText(v, next) + cl;
    });
    return open + body + close;
  });
  return out;
}

/** 換掉最內層的文字，保留所有包在外面的標籤。 */
function swapText(inner, text) {
  const esc = String(text).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  if (!/<[a-z]/i.test(inner)) return esc;
  /* 有內層標籤（例如 <span class="badge">）：只換標籤裡的文字。 */
  return inner.replace(/(>)([^<>]+)(<)/, (m, a, _t, b) => a + esc + b);
}

function prompt(title, desc, category, t) {
  return `這是一套叫「${title}」的企業系統展示畫面（產業：${category}）。
${desc ? `它做的事：${desc}\n` : ""}
畫面上有一張表格，但欄位名稱是通用樣板，跟這套系統一點關係都沒有：

${t.headers.join(" | ")}
${t.rows.map((r) => r.join(" | ")).join("\n")}

請把它換成**這個領域的人真的會用的欄位**，並把每一列的資料換成對應的真實內容。

規則：
- 欄位數量必須剛好 ${t.headers.length} 個，列數必須剛好 ${t.rows.length} 列。
- 欄位名稱要讓這一行的人一看就知道是什麼。不可以再出現
  「編號、項目、負責人、期限、階段」這一整組。
- 最後一欄原本是狀態標籤（處理中／待確認／已完成），請維持「狀態類」的欄位，
  值也維持那種短詞——那一欄在畫面上是彩色標籤，換成長句子會破版。
- 資料要像真的：編號有該領域的前綴、日期是具體日期、金額有單位。
  不要出現 D+1 這種佔位。
- 全部用繁體中文。`;
}

/* ── 狀態 ─────────────────────────────────────────────── */
function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE, "utf8")); } catch { return null; }
}
let state = null;
function saveState() {
  state.updatedAt = new Date().toISOString();
  fs.mkdirSync(path.dirname(STATE), { recursive: true });
  const tmp = `${STATE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(state, null, 1) + "\n");
  fs.renameSync(tmp, STATE);
}

/* ── 單套 ─────────────────────────────────────────────── */
async function fixOne(p) {
  const file = path.join(DEMOS, p.repoName, "index.html");
  if (!fs.existsSync(file)) return { repo: p.repoName, ok: false, why: "找不到 index.html" };
  const before = fs.readFileSync(file, "utf8");
  const baseline = new Set(staticGate(p.repoName).issues || []);

  const blocks = before.match(/<table[\s\S]*?<\/table>/gi) || [];
  const targets = blocks.filter((b) => isGeneric(b));
  if (!targets.length) return { repo: p.repoName, ok: true, skipped: "已經不是樣板表頭" };

  let after = before;
  const changes = [];
  for (const block of targets) {
    const t = readTable(block);
    if (!t.headers.length || !t.rows.length) continue;
    const r = await runCodexWithRetry({
      prompt: prompt(p.title, p.description || p.summary, p.category, t),
      cwd: ROOT, sandbox: "read-only", schemaPath: SCHEMA,
      timeoutMs: num(args.timeout, 240) * 1000, model: args.model,
    }, { retries: 1 });
    if (!r.ok) return { repo: p.repoName, ok: false, why: `codex 失敗：${String(r.error || "").replace(/\s+/g, " ").slice(0, 60)}` };
    const j = r.json;
    if (!j || !Array.isArray(j.headers) || !Array.isArray(j.rows)) return { repo: p.repoName, ok: false, why: "回的格式不對" };
    if (j.headers.length !== t.headers.length) return { repo: p.repoName, ok: false, why: `欄位數不符（要 ${t.headers.length} 給 ${j.headers.length}）` };
    if (GENERIC.every((g) => j.headers.includes(g))) return { repo: p.repoName, ok: false, why: "換出來的還是那組樣板欄位" };
    const rows = j.rows.filter((x) => Array.isArray(x) && x.length === t.headers.length).slice(0, t.rows.length);
    if (rows.length !== t.rows.length) return { repo: p.repoName, ok: false, why: `列數不符（要 ${t.rows.length} 給 ${rows.length}）` };
    changes.push({ from: t.headers.join("、"), to: j.headers.join("、") });
    after = after.replace(block, writeTable(block, j.headers, rows));
  }

  if (after === before) return { repo: p.repoName, ok: false, why: "內容沒有變動" };
  /* 顯示的是「這一張表換成什麼」，不是「檔案裡第一張非樣板表」——
     後者會抓到本來就存在的別張表，看起來像換錯了。 */
  if (DRY) return { repo: p.repoName, ok: true, dry: true, ...changes[0] };

  fs.writeFileSync(file, after);
  const revert = (why) => { fs.writeFileSync(file, before); return { repo: p.repoName, ok: false, why }; };
  /* 只換文字不該動到任何結構，但驗一次比較安心——這一支要跑七百多套，
     出錯的話沒有人會逐套看。 */
  const added = (staticGate(p.repoName).issues || []).filter((i) => !baseline.has(i));
  if (added.length) return revert(`改壞了：${added[0]}`);
  const scr = (h) => new Set([...h.matchAll(/data-i=["']?(\d+)/g)].map((m) => m[1])).size;
  if (scr(after) !== scr(before)) return revert("畫面數變了");
  return { repo: p.repoName, ok: true, tables: targets.length };
}

/* ── 主流程 ───────────────────────────────────────────── */
const catalog = loadCatalog();
const byRepo = new Map(catalog.projects.map((p) => [p.repoName, p]));

/* 已經被客戶複製過的一律跳過。實例的 runtime 靠 <th> 文字認表，
   改了他手上那套就接不上——那是我們單方面把他的系統弄壞。 */
let copied = new Set();
try {
  const control = await import("./lib/control-db.mjs");
  const rows = await control.listAllMembers();   // 只是為了確保連得上
  const mysql = await import("./lib/mysql.mjs");
  const used = await mysql.q("SELECT DISTINCT repo_name r FROM instances WHERE state <> 'archived'");
  copied = new Set(used.map((x) => x.r));
  await mysql.close();
  log.info(`  已被複製的 ${copied.size} 套會跳過`);
} catch (e) {
  log.error(`查不到已被複製的清單（${String(e.message).slice(0, 60)}），為了安全不繼續`);
  process.exit(EXIT.BAD_INPUT);
}

let queue = [];
for (const p of catalog.projects) {
  if (copied.has(p.repoName)) continue;
  const file = path.join(DEMOS, p.repoName, "index.html");
  if (!fs.existsSync(file)) continue;
  const html = fs.readFileSync(file, "utf8");
  if ((html.match(/<table[\s\S]*?<\/table>/gi) || []).some((b) => isGeneric(b))) queue.push(p);
}

const prev = loadState();
if (args.resume && prev) {
  /* --retry-failed：只把失敗的那些再跑一次，成功的一律不碰。
     失敗多半是模型少給了幾列（護欄擋下來，檔案沒被動過），重問一次通常就過。
     不另外開一支腳本、也不手改 state 檔——手改的話很容易把 done 一起清掉，
     那就會拿七百套已經改好的再跑一次。 */
  const RETRY = Boolean(args["retry-failed"]);
  const seen = new Set(RETRY
    ? prev.done.map((d) => d.repo)
    : [...prev.done.map((d) => d.repo), ...prev.failed.map((f) => f.repo)]);
  queue = queue.filter((p) => !seen.has(p.repoName));
  /* 重試時把舊的失敗紀錄清掉，不然這一輪成功了，檔案裡還留著上一輪的失敗，
     看起來像是同一套又成功又失敗。 */
  state = { ...prev, failed: RETRY ? [] : prev.failed, resumedAt: new Date().toISOString() };
  log.info(RETRY
    ? `  重試：${prev.failed.length} 套失敗的重跑，已成功的 ${seen.size} 套不動`
    : `  續跑：已處理 ${seen.size} 套，剩 ${queue.length} 套`);
} else {
  state = { startedAt: new Date().toISOString(), total: queue.length, done: [], failed: [] };
}
if (args.repos) { const only = new Set(list(args.repos)); queue = queue.filter((p) => only.has(p.repoName)); }
if (args.limit) queue = queue.slice(0, num(args.limit, 0));

log.step(`要修 ${queue.length} 套　${WORKERS} 條線${DRY ? "（試跑）" : ""}`);
if (!queue.length) { log.info("沒有要處理的。"); process.exit(EXIT.OK); }

let next = 0;
async function worker() {
  while (next < queue.length) {
    const p = queue[next]; next += 1;
    const r = await fixOne(p).catch((e) => ({ repo: p.repoName, ok: false, why: String(e.message).slice(0, 80) }));
    if (r.ok) {
      state.done.push({ repo: r.repo, at: new Date().toISOString() });
      log.step(`✓ ${r.repo}${r.dry ? `　${r.from} → ${r.to}` : r.skipped ? `（${r.skipped}）` : ""}`);
    } else {
      state.failed.push({ repo: r.repo, why: r.why, at: new Date().toISOString() });
      log.error(`✖ ${r.repo}　${r.why}`);
    }
    if (!DRY) saveState();
  }
}
await Promise.all(Array.from({ length: WORKERS }, () => worker()));
log.step(`完成：成功 ${state.done.length}、失敗 ${state.failed.length}`);
if (!DRY) log.info("  下一步：node tools/schema-scan.mjs && node tools/schema-apply.mjs（表頭換了，資料表定義要跟著更新）");
process.exit(EXIT.OK);
