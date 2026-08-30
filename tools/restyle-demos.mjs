#!/usr/bin/env node
/**
 * 讓每一套 demo 有自己的視覺風格。
 *
 * 只動 demos/<repo>/index.html——站台本身的框架介面一律不碰。
 *
 * 每套的風格由 repo 名稱決定（見 lib/restyle-styles.mjs），所以同一套永遠拿到
 * 同一組風格，重跑不會今天橘色明天綠色。
 *
 * 三個非改不可的前提，任何一項沒過就整份還原：
 *   1. 表頭文字一字不能變 —— 客戶實例的 runtime 是靠 <th> 的文字認表的，
 *      改了字就等於那張表再也接不上，客戶買到的系統會少一塊。
 *   2. 六個 data-i 畫面與 hashchange 深連結要在 —— 那是站台目錄與 details 的契約。
 *   3. 單檔自足、不引用 shared/、不用 setInterval —— static-gate 的既有規則。
 *
 * codex 全程 read-only、由這支腳本落檔——這個環境的 bubblewrap 沙箱無法讓
 * codex 寫檔（bwrap: loopback: Failed RTM_NEWADDR），demo-forge 早就是這樣做的。
 * 由腳本落檔本來也更安全：寫到哪、寫什麼完全由這裡決定。
 *
 * 平行跑。codex 一套要好幾分鐘，序列跑完 1,900 多套是以月計的。
 * 進度寫在 docs/_state/restyle.json，後台「產線管理」看得到。
 *
 *   node tools/restyle-demos.mjs --workers=4 [--limit=N] [--repos=a,b] [--dry-run]
 *   node tools/restyle-demos.mjs --resume            接續上次沒做完的
 *   node tools/restyle-demos.mjs --status            只看進度
 */
import fs from "node:fs";
import path from "node:path";
import { ROOT, EXIT, parseArgs, num, list, makeLogger } from "./lib/forge-common.mjs";
import { staticGate } from "./lib/static-gate.mjs";
import { runCodexWithRetry } from "./lib/codex-run.mjs";
import { styleBrief, styleFor } from "./lib/restyle-styles.mjs";

const args = parseArgs();
const log = makeLogger({ quiet: Boolean(args.quiet) });
const DEMOS = path.join(ROOT, "demos");
const STATE = path.join(ROOT, "docs", "_state", "restyle.json");
const BACKUP = path.join(ROOT, "var", "restyle-backups");
const WORKERS = Math.max(1, Math.min(12, num(args.workers, 4)));
const TIMEOUT_MS = num(args.timeout, 900) * 1000;
const DRY = Boolean(args["dry-run"]);

/* ── 狀態檔 ───────────────────────────────────────────
   平行寫同一個檔會互相蓋掉，所以只有主行程寫，worker 只回報。 */
function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE, "utf8")); } catch { return null; }
}
let state = null;
function saveState() {
  state.updatedAt = new Date().toISOString();
  fs.mkdirSync(path.dirname(STATE), { recursive: true });
  const tmp = `${STATE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2) + "\n");
  fs.renameSync(tmp, STATE);
}

/** 表頭是綁定的身分證。抓出來當作改寫前後必須一致的指紋。 */
function headerFingerprint(html) {
  const out = [];
  const tables = html.match(/<table[\s\S]*?<\/table>/gi) || [];
  for (const t of tables) {
    const ths = t.match(/<th\b[^>]*>([\s\S]*?)<\/th>/gi) || [];
    out.push(ths.map((x) => x.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim()).join("|"));
  }
  return out.sort().join("¶");
}

/* codex 會把檔案包在 ```html 圍籬裡，也可能在前後加話。只取 doctype 到 </html>。 */
function extractHtml(text) {
  let body = String(text || "").trim();
  const fenced = body.match(/```(?:html)?\s*([\s\S]*?)```/i);
  if (fenced) body = fenced[1].trim();
  const start = body.search(/<!doctype html/i);
  if (start === -1) return null;
  const end = body.toLowerCase().lastIndexOf("</html>");
  if (end === -1) return null;
  return body.slice(start, end + 7);
}

const screenCount = (html) => new Set([...html.matchAll(/data-i=["']?(\d+)/g)].map((m) => m[1])).size;

function prompt(repo, title, current) {
  return `你要幫這一套展示系統換一套全新的視覺風格。這是既有檔案 index.html，請直接改寫它。

系統名稱：${title || repo}

## 這一套要走的風格
${styleBrief(repo)}

## 絕對不可以動的東西（動了這份改寫就作廢）
1. 所有 <table> 的 <th> 文字**一個字都不能改**，也不能增減 <th> 的數量或順序。
   欄位名稱是這套系統對外的契約，改了會讓下游整個對不上。
   你可以改表格的顏色、線條、列高、字級、對齊，就是不能改表頭的字。
2. 六個 data-i 畫面全部保留，hashchange 深連結保留。
3. 單檔自足：不可以引用本地檔案（沒有 <script src="./...">、沒有 shared/），
   favicon 維持 ../../favicon.svg。圖表庫維持原本用的那一個 CDN。
4. 不可以使用 setInterval。
5. 檔案大小要落在 12KB–90KB。
6. 保留這四個 CSS 變數名稱：--blue、--ink、--muted、--line（值可以換成新色調）。
   它們是外部要用的介面名稱，改名會壞掉。

## 要做到的事
- 版面、配色、間距、圓角、字級、卡片層次都照上面的風格走，做出「這是另一套產品」的感覺。
- 資料內容、欄位、數字、文案語意保持原樣——這是換裝，不是重寫。
- 六個畫面都要一致地套用新風格，不能只改第一頁。
- 深色風格的話，文字對比要夠（正文對底色至少 4.5:1）。

## 輸出方式
把改寫後的**完整 index.html** 從 <!doctype html> 到 </html> 一次輸出，不要只給片段、
不要輸出解釋、不要用差異格式。你沒有寫檔權限，輸出的內容就是最後存檔的內容。

以下是目前的 index.html：

${current}`;
}

async function restyleOne(repo, title) {
  const file = path.join(DEMOS, repo, "index.html");
  if (!fs.existsSync(file)) return { repo, ok: false, why: "找不到 index.html" };
  const before = fs.readFileSync(file, "utf8");
  const fp = headerFingerprint(before);
  const screens = screenCount(before);

  if (DRY) return { repo, ok: true, why: "dry-run", style: styleFor(repo).palette.name };

  fs.mkdirSync(BACKUP, { recursive: true });
  const backup = path.join(BACKUP, `${repo}.html`);
  if (!fs.existsSync(backup)) fs.writeFileSync(backup, before);

  const r = await runCodexWithRetry({
    prompt: prompt(repo, title, before),
    cwd: ROOT,
    sandbox: "read-only",
    timeoutMs: TIMEOUT_MS,
    model: args.model,
  }, { retries: 1 });

  const revert = (why) => {
    fs.writeFileSync(file, before);
    return { repo, ok: false, why };
  };

  if (!r.ok) return revert(`codex 失敗：${String(r.error || "").slice(0, 60)}`);

  const after = extractHtml(r.text);
  if (!after) return revert("codex 回傳的不是完整 HTML");
  if (after === before) return revert("內容沒有變動");
  fs.writeFileSync(file, after);
  /* 表頭指紋是最重要的一關。放在 static-gate 之前檢查，因為 gate 不看這個，
     而表頭被改掉是這件事唯一「看起來成功、實際上壞掉」的失敗模式。 */
  if (headerFingerprint(after) !== fp) return revert("表頭文字被改動");
  if (screenCount(after) < Math.min(6, screens)) return revert("畫面數變少");

  const gate = staticGate(repo);
  if (!gate.pass) return revert(`品質閘未過：${gate.issues.slice(0, 2).join("／")}`);

  return { repo, ok: true, style: styleFor(repo).palette.name, bytes: Buffer.byteLength(after) };
}

/* ── 主流程 ─────────────────────────────────────────── */
async function main() {
  if (args.status) {
    const s = loadState();
    if (!s) { log.info("還沒有跑過"); return; }
    log.step(`進度 ${s.done.length + s.failed.length}/${s.total}　成功 ${s.done.length}　失敗 ${s.failed.length}`);
    if (s.failed.length) log.info(`  最近失敗：${s.failed.slice(-3).map((f) => `${f.repo}（${f.why}）`).join("、")}`);
    return;
  }

  const all = fs.readdirSync(DEMOS).filter((d) => d.startsWith("jvision-")
    && fs.existsSync(path.join(DEMOS, d, "index.html")));
  const catalog = (() => {
    try {
      const c = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "catalog-index.json"), "utf8"));
      const arr = Array.isArray(c) ? c : (c.projects || c.items || []);
      return new Map(arr.map((x) => [x.repoName || x.repo, x.title]));
    } catch { return new Map(); }
  })();

  let queue;
  const prev = loadState();
  if (args.repos) {
    queue = list(args.repos);
    state = { startedAt: new Date().toISOString(), total: queue.length, done: [], failed: [], running: true };
  } else if (args.resume && prev) {
    const seen = new Set([...prev.done.map((d) => d.repo), ...prev.failed.map((f) => f.repo)]);
    queue = all.filter((r) => !seen.has(r));
    state = { ...prev, running: true, resumedAt: new Date().toISOString() };
    state.total = prev.done.length + prev.failed.length + queue.length;
  } else {
    queue = all;
    state = { startedAt: new Date().toISOString(), total: all.length, done: [], failed: [], running: true };
  }
  if (args.limit) queue = queue.slice(0, num(args.limit, 0));

  state.workers = WORKERS;
  state.pid = process.pid;
  state.inFlight = [];
  saveState();

  log.step(`改寫 ${queue.length} 套，${WORKERS} 條線${DRY ? "（dry-run）" : ""}`);

  let next = 0;
  const t0 = Date.now();
  async function worker(id) {
    while (next < queue.length) {
      const repo = queue[next++];
      state.inFlight = [...state.inFlight.filter((x) => x.worker !== id), { worker: id, repo, at: Date.now() }];
      saveState();
      const r = await restyleOne(repo, catalog.get(repo));
      if (r.ok) { state.done.push({ repo: r.repo, style: r.style, at: Date.now() }); log.info(`  ✓ ${repo}（${r.style}）`); }
      else { state.failed.push({ repo: r.repo, why: r.why, at: Date.now() }); log.warn(`  ✖ ${repo}：${r.why}`); }
      state.inFlight = state.inFlight.filter((x) => x.worker !== id);
      /* 每完成一筆就落地。這件事會跑很久，中途斷電也要能接得回來。 */
      const n = state.done.length + state.failed.length;
      const per = (Date.now() - t0) / Math.max(1, n);
      state.etaMs = Math.round(per * (queue.length - n));
      saveState();
    }
  }

  const stop = () => { state.running = false; state.stoppedAt = new Date().toISOString(); saveState(); process.exit(0); };
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);

  await Promise.all(Array.from({ length: WORKERS }, (_, i) => worker(i)));
  state.running = false;
  state.finishedAt = new Date().toISOString();
  state.inFlight = [];
  saveState();
  log.step(`完成：成功 ${state.done.length}、失敗 ${state.failed.length}`);
  if (state.failed.length) log.info(`  失敗的原檔都已還原，可用 --resume 重跑`);
}

main().catch((e) => { log.error(e.stack || e.message); process.exitCode = EXIT.BAD_INPUT; });
