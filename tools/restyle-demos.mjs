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
 * 風格來自 ui-ux-pro-max 技能（79 種風格、192 組配色、74 組字體搭配）。
 * 安裝：npx ui-ux-pro-max-cli init --ai codex（裝到 .agents/，不進版控）。
 * 沒裝的話會退回 lib/restyle-styles.mjs 的內建矩陣，產線照跑。
 *
 * 每天有配額（預設 100 套）。做滿就停下來等隔天，不是一口氣跑完——
 * 一次改動上千套沒辦法逐批看成果，出了系統性的問題也要到最後才發現。
 *
 *   node tools/restyle-demos.mjs --workers=4 [--daily=100] [--limit=N] [--repos=a,b] [--dry-run]
 *   node tools/restyle-demos.mjs --mode=rewrite      只走整份重寫（取代區塊出問題時的退路）
 *   node tools/restyle-demos.mjs --resume            接續上次沒做完的
 *   node tools/restyle-demos.mjs --status            只看進度
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { ROOT, EXIT, parseArgs, num, list, makeLogger } from "./lib/forge-common.mjs";
import { staticGate } from "./lib/static-gate.mjs";
import { runCodexWithRetry } from "./lib/codex-run.mjs";
import { applyEdits, replaceStyleBlock } from "./lib/instance-patch.mjs";
import { styleBrief, styleFor } from "./lib/restyle-styles.mjs";
import * as uiux from "./lib/uiux-skill.mjs";

const args = parseArgs();

/* 共用一顆瀏覽器。每套各開一次的話，啟動成本比渲染本身還貴。 */
let _browser = null;
function browser() {
  /* 記住的是 promise 而不是結果。存結果的寫法在多線下是競態：8 條線同時進來
     時每一條都看到 null，於是各自 launch 一顆，最後只有一顆被記進 _browser，
     其餘七顆沒有人關得掉——收尾的 _browser.close() 收不到它們，node 因此
     永遠不會退出。實測跑完之後留下 35 個 chrome 行程、3.3GB，而服務狀態
     一直顯示 running，看起來像還在做事。 */
  if (!_browser) _browser = import("playwright").then((m) => m.chromium.launch());
  return _browser;
}

/**
 * 實際把頁面跑起來，數 console 與未捕捉的錯誤。
 *
 * static-gate 只解析內嵌腳本的語法，抓不到執行時才爆的東西——實測換裝後有兩套
 * 出現 "color is not defined" 與 <polygon> 的 NaN 座標，兩者語法都合法，
 * 是跑起來才壞。那種壞法在目錄縮圖上看起來只是「圖沒畫出來」，不會有人發現。
 */
async function runtimeErrors(file) {
  const b = await browser();
  const c = await b.newContext();
  const p = await c.newPage();
  const errs = [];
  p.on("pageerror", (e) => errs.push(String(e).slice(0, 90)));
  p.on("console", (m) => { if (m.type() === "error") errs.push(m.text().slice(0, 90)); });
  try {
    await p.goto("file://" + file, { waitUntil: "networkidle", timeout: 45000 });
    await p.waitForTimeout(2200);   // 圖表是非同步畫的，太早關會漏掉它們的錯誤
  } catch (e) { errs.push("開不起來：" + String(e.message).slice(0, 60)); }
  await c.close();
  /* 本機用 file:// 開，favicon 的相對路徑必然 404——那不是換裝造成的，濾掉。 */
  return errs.filter((x) => !/ERR_FILE_NOT_FOUND|favicon/i.test(x));
}

const log = makeLogger({ quiet: Boolean(args.quiet) });
const DEMOS = path.join(ROOT, "demos");
const STATE = path.join(ROOT, "docs", "_state", "restyle.json");
const BACKUP = path.join(ROOT, "var", "restyle-backups");
const QUOTA_FILE = path.join(ROOT, "docs", "_state", "restyle-quota");
const WORKERS = Math.max(1, Math.min(12, num(args.workers, 4)));
const TIMEOUT_MS = num(args.timeout, 900) * 1000;
const DRY = Boolean(args["dry-run"]);
/* 指定 repo 的單套執行是「臨時跑一下」，不該動到整批的進度檔。
   實測被這件事咬過兩次：測完一套之後，整批 1,958 套的完成紀錄變成 2/2，
   得靠比對備份與現檔才救得回來。 */
const ONE_OFF = Boolean(args.repos);
const PATCH_SCHEMA = path.join(ROOT, "tools", "schemas", "restyle-patch.schema.json");
/* auto＝先試取代區塊、套不進去才整份重寫。rewrite＝只走舊路徑（緊急切換用）。
   取代區塊存在的理由是正確性：整份重寫時模型會順手動到不該動的地方，
   而失敗原因裡最大的一類正是「表頭文字被改動」。 */
const MODE = ["auto", "patch", "rewrite"].includes(args.mode) ? args.mode : "auto";
/* 每日配額只定義在 docs/_state/restyle-quota 一個地方，後台改的也是那個檔。
   參數與檔案各存一份，改一邊就會不一致。 */
function dailyQuota() {
  if (args.daily != null) return Math.max(0, num(args.daily, 100));
  try { return Math.max(0, Number(fs.readFileSync(QUOTA_FILE, "utf8").trim()) || 100); } catch { return 100; }
}

/* ── 狀態檔 ───────────────────────────────────────────
   平行寫同一個檔會互相蓋掉，所以只有主行程寫，worker 只回報。 */
function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE, "utf8")); } catch { return null; }
}
let state = null;
function saveState() {
  /* --repos 原本完全不寫狀態（「臨時跑的不留痕跡」）。那在它只是人工臨時跑時
     是對的——整份寫回會把正在跑的那一批進度蓋掉，實測發生過一次，220 套變成 2 套。

     但現在 --repos 是每一套新 demo 的正式換裝路徑（agent-loop 會呼叫它），
     不留痕跡等於覆蓋率永遠算不對：實測今天上架 26 套、實際都換過裝，
     restyle.json 裡卻一套都沒有，數字顯示「未換裝 29 套」。

     所以改成：--repos 時「只把換好的那幾套追加進 done」，重新讀檔再追加，
     完全不碰 queue／daily／inFlight 那些屬於批次的欄位——追加是安全的，
     整份覆寫才是危險的。 */
  if (ONE_OFF) {
    const cur = loadState();
    if (!cur) return;               // 還沒跑過整批，沒有東西可以追加
    const have = new Set(cur.done.map((d) => d.repo));
    const add = state.done.filter((d) => !have.has(d.repo));
    if (!add.length) return;
    cur.done.push(...add);
    cur.failed = (cur.failed || []).filter((f) => !add.some((a) => a.repo === f.repo));
    cur.updatedAt = new Date().toISOString();
    const t = `${STATE}.tmp`;
    fs.writeFileSync(t, JSON.stringify(cur, null, 2) + "\n");
    fs.renameSync(t, STATE);
    return;
  }
  state.updatedAt = new Date().toISOString();
  fs.mkdirSync(path.dirname(STATE), { recursive: true });
  const tmp = `${STATE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2) + "\n");
  fs.renameSync(tmp, STATE);
}

const today = () => new Date().toLocaleDateString("sv"); // YYYY-MM-DD，當地時區

function doneToday() {
  const d = state.daily || {};
  return d[today()] || 0;
}

function countToday() {
  state.daily = state.daily || {};
  state.daily[today()] = (state.daily[today()] || 0) + 1;
  /* 只留最近 30 天，不然這個檔會一直長。 */
  const keys = Object.keys(state.daily).sort();
  while (keys.length > 30) delete state.daily[keys.shift()];
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

export function prompt(repo, title, current, ds) {
  /* 有技能就用技能給的設計系統（含真實的色票、字體搭配、風格名與檢核表）；
     沒有才退回內建矩陣。兩者都保證同一套 repo 永遠拿到同一種風格。 */
  const styleSection = ds
    ? `## 這一套要走的設計系統（由 ui-ux-pro-max 依產業與刻度選出）
${ds.text}

照上面的 STYLE、COLORS、TYPOGRAPHY 實作：色票直接當 CSS 變數用，字體用它給的
Google Fonts 連結（<link> 放 <head>），KEY EFFECTS 要看得出來，AVOID 列的不要做，
最後對照 PRE-DELIVERY CHECKLIST 自我檢查一遍。`
    : `## 這一套要走的風格
${styleBrief(repo)}`;

  return `你要幫這一套展示系統換一套全新的視覺風格。這是既有檔案 index.html，請直接改寫它。

系統名稱：${title || repo}

${styleSection}

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

## 設計品質要求（每一項都要做到）
- 狀態與風險**不能只靠顏色**表達：一定要同時有文字或圖示，色盲的人也看得懂。
- 正文對背景的對比至少 4.5:1，次要文字至少 3:1。深色風格特別容易不足。
- 可聚焦的元素要有看得見的 focus ring（鍵盤操作的人靠它）。
- 動畫一律包在 @media (prefers-reduced-motion: reduce) 的例外裡。
- 圖示用 SVG 或既有的 icon font，**不要用 emoji 當圖示**。
- 編號、代號、ID、時間這類要對齊比較的欄位用等寬字。
- 每個畫面都要有明確的視覺層級：一眼看得出哪裡是主要動作、哪裡是輔助資訊。
- 數字要好讀：千分位、單位、對齊方式都要處理（數值欄右對齊）。

## 輸出方式
把改寫後的**完整 index.html** 從 <!doctype html> 到 </html> 一次輸出，不要只給片段、
不要輸出解釋、不要用差異格式。你沒有寫檔權限，輸出的內容就是最後存檔的內容。

以下是目前的 index.html：

${current}`;
}

/* 取代區塊版。前面那一大段規則與風格說明完全共用，只換掉「輸出方式」。
   換裝的主要工作是整塊 <style>，所以通常一處 find/replace 就換掉大半。 */
export function patchPrompt(repo, title, current, ds) {
  const full = prompt(repo, title, current, ds);
  const head = full.slice(0, full.indexOf("## 輸出方式"));
  return `${head}## 輸出方式
不要重寫整份檔案。分兩個部分回答：

### styleBlock —— 這次換裝的主要工作
把**整個 <style> 區塊的新內容**放這裡（不要含 <style> 標籤本身）。
你不需要把原本的 CSS 抄回來給我看，只要給新的；舊的我會自己換掉。
整份檔案只有一個 <style>，位置我自己找得到。

### edits —— 標記與 <head> 的零星改動
只有真的要動 HTML 標記時才用（例如 <head> 加 Google Fonts 的 <link>、
某個區塊要換 class）。每一處給一組 find / replace：
- find 必須是檔案裡**逐字元完全相同**的一段原文，包含空白與縮排，
  要整段複製而不是憑印象重打，而且在整份檔案中**只出現一次**。
- 太短可能重複的話，往前後多帶幾行讓它唯一。
- CSS 不要放這裡，放 styleBlock。沒有要改標記就給空陣列。

**不要把含有 <th> 的那幾段放進 edits**——表頭一個字都不能動，
不碰它就不可能改到它。這是這件事最常見的失敗原因。

以下是目前的 index.html：

${current}`;
}

async function restyleOne(repo, title, category) {
  const file = path.join(DEMOS, repo, "index.html");
  if (!fs.existsSync(file)) return { repo, ok: false, why: "找不到 index.html" };
  const before = fs.readFileSync(file, "utf8");
  const fp = headerFingerprint(before);
  const screens = screenCount(before);

  if (DRY) {
    const d = uiux.available() ? await uiux.designSystem(repo, category, title).catch(() => null) : null;
    const nm = d ? (d.text.match(/Name:\s*([^\n]+)/g) || [])[1]?.replace(/Name:\s*/, "").trim() : null;
    return { repo, ok: true, why: "dry-run", style: nm || styleFor(repo).palette.name };
  }

  /* 先量原檔的閘況。static-gate 是「出生時」的規則，早期匯入的 demo 本來就
     過不了（注入過 agent-bridge、導覽是 JS 動態建的、stages 只有 5 個）。
     拿絕對標準去要求它們，等於把改好的成品判定成失敗再還原——實測 125 筆
     失敗裡有 94 筆是這樣來的。判準改成「不要比原本更糟」。 */
  const baselineIssues = new Set((staticGate(repo).issues || []));
  /* 原檔本來就有的錯誤不算在換裝頭上——判準一律是「不要比原本更糟」。 */
  const baselineErrs = DRY ? 0 : (await runtimeErrors(file)).length;

  fs.mkdirSync(BACKUP, { recursive: true });
  const backup = path.join(BACKUP, `${repo}.html`);
  if (!fs.existsSync(backup)) fs.writeFileSync(backup, before);

  /* 技能查詢是本機資料、幾秒就好；查不到就回 null 走內建矩陣，
     不讓一個加分項擋住整條產線。 */
  const ds = uiux.available() ? await uiux.designSystem(repo, category, title).catch(() => null) : null;

  const ask = (kind) => runCodexWithRetry({
    prompt: kind === "patch" ? patchPrompt(repo, title, before, ds) : prompt(repo, title, before, ds),
    cwd: ROOT,
    sandbox: "read-only",
    timeoutMs: TIMEOUT_MS,
    model: args.model,
    ...(kind === "patch" ? { schemaPath: PATCH_SCHEMA } : {}),
  }, { retries: 1 });

  const revert = (why) => {
    fs.writeFileSync(file, before);
    return { repo, ok: false, why, how };
  };

  let how = MODE === "rewrite" ? "rewrite" : "patch";
  let after = null;
  let edits = null;

  if (how === "patch") {
    const r = await ask("patch");
    if (r.ok && r.json) {
      /* 先換 <style>，再套標記上的零星改動。順序不能反——edits 的 find
         有可能落在 style 區塊裡，先套的話換 style 時就被蓋掉了。 */
      let work = before;
      let okSoFar = true;
      const css = String(r.json.styleBlock || "").trim();
      if (css) {
        const sb = replaceStyleBlock(work, css);
        if (sb.ok) work = sb.text; else okSoFar = false;
      }
      const list = Array.isArray(r.json.edits) ? r.json.edits : [];
      if (okSoFar && list.length) {
        const ap = applyEdits(work, list);
        if (ap.ok) { work = ap.text; edits = ap.applied; } else okSoFar = false;
      }
      if (okSoFar && work !== before) after = work;
    }
    /* 套不進去就整份重寫。失敗多半只是它把原文記錯一兩個字，
       那時整份重寫仍然做得出正確結果——不該因為內部策略就少換一套。 */
    if (after === null) {
      if (MODE === "patch") return revert("取代區塊套不進去（--mode=patch 不退回重寫）");
      how = "rewrite";
    }
  }

  if (after === null) {
    const r = await ask("rewrite");
    if (!r.ok) return revert(`codex 失敗：${String(r.error || "").replace(/\s+/g, " ").slice(0, 60)}`);
    after = extractHtml(r.text);
    if (!after) return revert("codex 回傳的不是完整 HTML");
  }
  if (after === before) return revert("內容沒有變動");
  fs.writeFileSync(file, after);
  /* 表頭指紋是最重要的一關。放在 static-gate 之前檢查，因為 gate 不看這個，
     而表頭被改掉是這件事唯一「看起來成功、實際上壞掉」的失敗模式。 */
  if (headerFingerprint(after) !== fp) return revert("表頭文字被改動");
  if (screenCount(after) < Math.min(6, screens)) return revert("畫面數變少");

  const gate = staticGate(repo);
  const added = (gate.issues || []).filter((i) => !baselineIssues.has(i));
  if (added.length) return revert(`改壞了：${added.slice(0, 2).join("／")}`);

  const errs = await runtimeErrors(file);
  if (errs.length > baselineErrs) {
    return revert(`跑起來會出錯：${errs[0]}`);
  }

  const styleName = ds
    ? (ds.text.match(/Name:\s*([^\n]+)/g) || [])[1]?.replace(/Name:\s*/, "").trim().slice(0, 40)
    : styleFor(repo).palette.name;
  return { repo, ok: true, style: styleName || styleFor(repo).palette.name,
    bytes: Buffer.byteLength(after), how, edits };
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

  const catalogCat = (() => {
    try {
      const c = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "catalog-index.json"), "utf8"));
      const arr = Array.isArray(c) ? c : (c.projects || c.items || []);
      return new Map(arr.map((x) => [x.repoName || x.repo, x.category]));
    } catch { return new Map(); }
  })();

  let queue;
  const prev = loadState();
  if (args.repos) {
    queue = list(args.repos);
    state = { startedAt: new Date().toISOString(), total: queue.length, done: [], failed: [], running: true, stopRequested: false };
  } else if (args.resume && prev) {
    const seen = new Set([...prev.done.map((d) => d.repo), ...prev.failed.map((f) => f.repo)]);
    queue = all.filter((r) => !seen.has(r));
    /* finishedAt 也要清掉。它是上一輪結束的時間，留著會讓後台把還在跑的
       這一輪顯示成「已完成」。 */
    state = { ...prev, running: true, stopRequested: false, finishedAt: null,
      resumedAt: new Date().toISOString() };
    state.total = prev.done.length + prev.failed.length + queue.length;
  } else {
    queue = all;
    state = { startedAt: new Date().toISOString(), total: all.length, done: [], failed: [], running: true, stopRequested: false };
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
      /* 配額用完就把這條線收起來。等隔天的事交給主流程一個人做，
         十二條線各自睡到半夜再一起醒來只是把同一件事做十二遍。 */
      if (doneToday() >= dailyQuota()) return;
      const repo = queue[next++];
      state.inFlight = [...state.inFlight.filter((x) => x.worker !== id), { worker: id, repo, at: Date.now() }];
      saveState();
      const r = await restyleOne(repo, catalog.get(repo), catalogCat.get(repo));
      if (r.ok) { state.done.push({ repo: r.repo, style: r.style, at: Date.now() }); log.info(`  ✓ ${repo}（${r.style}）`); }
      else { state.failed.push({ repo: r.repo, why: r.why, at: Date.now() }); log.warn(`  ✖ ${repo}：${r.why}`); }
      state.inFlight = state.inFlight.filter((x) => x.worker !== id);
      /* 每完成一筆就落地。這件事會跑很久，中途斷電也要能接得回來。 */
      countToday();
      const n = state.done.length + state.failed.length;
      const per = (Date.now() - t0) / Math.max(1, n);
      /* 剩下的天數 × 24 小時，比「剩餘套數 × 每套秒數」誠實得多——
         每天只做 100 套的話，真正決定何時結束的是天數不是速度。 */
      const left = queue.length - n;
      const q = dailyQuota();
      state.etaMs = q > 0
        ? Math.max(0, Math.ceil((left - (q - doneToday())) / q)) * 86400000 + per * Math.min(left, q - doneToday())
        : Math.round(per * left);
      saveState();
    }
  }

  const stop = () => {
    state.stopRequested = true;
    state.running = false;
    state.stoppedAt = new Date().toISOString();
    saveState();
    process.exit(0);
  };
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);

  /* 一天一輪：做滿配額 → 睡到換日 → 再開一輪。整批做完才真的結束。 */
  while (next < queue.length) {
    log.step(`今日配額 ${dailyQuota()} 套，已做 ${doneToday()} 套`);
    await Promise.all(Array.from({ length: WORKERS }, (_, i) => worker(i)));
    if (next >= queue.length) break;

    state.waitingUntilTomorrow = true;
    state.inFlight = [];
    saveState();
    const day = today();
    log.step(`今日配額已用完（${doneToday()} 套），休息到明天`);
    /* 每五分鐘看一次日期。不用算到半夜的精確秒數——那要處理時區與日光節約，
       而早幾分鐘晚幾分鐘對這件事沒有差別。 */
    while (today() === day) {
      if (state.stopRequested) break;
      await new Promise((r) => setTimeout(r, 300000));
    }
    if (state.stopRequested) break;
    state.waitingUntilTomorrow = false;
    saveState();
    log.step("換日，繼續換裝");
  }

  state.running = false;
  state.waitingUntilTomorrow = false;
  state.finishedAt = new Date().toISOString();
  state.inFlight = [];
  saveState();
  if (_browser) await _browser.then((b) => b.close()).catch(() => {});
  log.step(`完成：成功 ${state.done.length}、失敗 ${state.failed.length}`);
  if (state.failed.length) log.info(`  失敗的原檔都已還原，可用 --resume 重跑`);
}

/* 只有被直接執行時才跑。少了這道判斷，任何 import 這支來借用 prompt 的程式
   （例如 A/B 量測）都會連帶啟動整條產線並覆寫共用的 restyle.json。
   A/B 需要拿「真正的」prompt 來比——自己抄一份的話，抄漏一句就會把其中
   一邊打殘：第一次就是漏了「不要輸出解釋」，害重寫那一邊 0/3 全滅。 */
/* argv[1] 在 node -e 底下是 undefined，要先擋掉再轉 URL。 */
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => { log.error(e.stack || e.message); process.exitCode = EXIT.BAD_INPUT; });
}
