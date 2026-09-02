#!/usr/bin/env node
/**
 * 全站資料表 schema 抽取（掃描階段）。
 *
 * 這是把 1,878 套展示 demo 變成「真的能存資料的系統」的第一塊地基：
 * 每套系統的主資料表長什麼樣，必須先有機器讀得懂的定義。
 *
 * 來源是 demo 的 index.html，不是 content/details 的 records——實測 1,420 套裡
 * 有 1,340 套的 records.columns 完全相同（編號/項目/負責人/期限/階段），那是
 * detail-template.mjs 寫死的樣板；抽樣比對只有 17% 與畫面上的表格相符。
 * 客戶買的是畫面上那張表。
 *
 * 三段管線，能不用 LLM 就不用：
 *   A 決定論解析——表頭、selector、靜態資料列、型別推斷（零 LLM）
 *   B 全站去重後的欄位命名——6,942 個不同的中文欄位名批次送 codex 換英文 key。
 *     去重是關鍵：逐套呼叫要 1,878 次，去重後只要約 47 次，而且同一個中文詞
 *     在全站會得到同一個 key。
 *   C 組裝提案——決定論
 *
 * 只產提案（docs/_state/schema-proposals.json），不動任何既有檔；套用是
 * schema-apply.mjs 的事。每批落盤，可中斷續跑。
 *
 *   node tools/schema-scan.mjs [--batch=150] [--limit=N] [--no-llm] [--timeout=600]
 */
import fs from "node:fs";
import path from "node:path";
import { ROOT, EXIT, parseArgs, num, makeLogger, loadCatalog, writeJson } from "./lib/forge-common.mjs";
import { runCodexWithRetry } from "./lib/codex-run.mjs";
import { extractTables } from "./lib/schema-extract.mjs";

const args = parseArgs();
const log = makeLogger({ quiet: Boolean(args.quiet) });
const OUT = path.join(ROOT, "docs", "_state", "schema-proposals.json");
const KEYMAP = path.join(ROOT, "docs", "_state", "schema-keymap.json");
const KEY_SCHEMA = path.join(ROOT, "tools", "schemas", "label-keys.schema.json");
const BATCH = num(args.batch, 150);
const TIMEOUT_MS = num(args.timeout, 600) * 1000;
const KEY_RE = /^[a-z][a-z0-9_]*$/;

/* ── A. 決定論解析 ─────────────────────────────────────── */
const catalog = loadCatalog();
const scanned = [];
let noTable = 0;

for (const p of catalog.projects) {
  const hp = path.join(ROOT, "demos", p.repoName, "index.html");
  if (!fs.existsSync(hp)) continue;
  const html = fs.readFileSync(hp, "utf8");
  const tables = extractTables(html);
  if (!tables.length) { noTable += 1; scanned.push({ repoName: p.repoName, title: p.title, tables: [] }); continue; }

  /* JS 渲染的表不猜種子資料。實測用「欄位數相符」去配 JS 陣列會配錯——
     personal-finance 的交易表配到了帳戶陣列，種子變成一堆不相干的值。
     錯的種子比沒有更糟：客戶的系統裡會冒出看不懂的資料。真系統從空表開始
     本來就是對的，種子只是展示用的加分項。 */
  scanned.push({ repoName: p.repoName, title: p.title, tables });
}

const allLabels = new Set();
for (const s of scanned) for (const t of s.tables) for (const l of t.labels) allLabels.add(l);
log.step(`掃描 ${scanned.length} 套：可綁表 ${scanned.length - noTable}、無表 ${noTable}；不同欄位名稱 ${allLabels.size}`);

/* ── B. 欄位命名（全站去重後批次送 codex） ─────────────── */
const keymap = fs.existsSync(KEYMAP) ? JSON.parse(fs.readFileSync(KEYMAP, "utf8")) : { map: {}, failedBatches: [] };
let todo = [...allLabels].filter((l) => !keymap.map[l]);
if (args.limit) todo = todo.slice(0, num(args.limit, 0));

if (args["no-llm"]) {
  log.info("--no-llm：跳過欄位命名，未命名的欄位會落在 needs-review");
} else if (todo.length) {
  log.step(`待命名欄位 ${todo.length} 個（已有 ${Object.keys(keymap.map).length}）`);
  let batches = 0;
  for (let i = 0; i < todo.length; i += BATCH) {
    const chunk = todo.slice(i, i + BATCH);
    batches += 1;
    log.step(`第 ${batches} 批（${chunk.length} 個）…`);
    const r = await runCodexWithRetry({
      prompt: `你是資料庫設計者。把下面這些中文欄位名稱各對應到一個英文欄位 key。

## 規則
1. key 必須是 **小寫、底線分隔的合法識別字**（符合 ^[a-z][a-z0-9_]*$），不可數字開頭。
2. 語意要對得上（「負責人」→ owner、「單號」→ order_no、「批號」→ lot_no、「良率」→ yield_rate）。
3. 編號、單號、案號、代號這類**識別碼**一律用 id 或 <名詞>_no。
4. **label 原樣抄回，一個字都不能改**，一個都不能少。
5. 不同的中文詞盡量給不同的 key，但同義詞可以共用（「狀態」與「處理狀態」都可以是 status）。

## 待命名（共 ${chunk.length} 個）
${chunk.map((l, n) => `${n + 1}. ${l}`).join("\n")}`,
      cwd: ROOT, sandbox: "read-only", schemaPath: KEY_SCHEMA, timeoutMs: TIMEOUT_MS,
    });
    const items = r.json?.items;
    if (!r.ok || !Array.isArray(items)) {
      log.warn(`  批次失敗：${String(r.error || "回傳非陣列").slice(0, 120)}——記下跳過，重跑會再試`);
      keymap.failedBatches.push({ at: new Date().toISOString(), first: chunk[0], error: String(r.error || "bad json").slice(0, 200) });
      writeJson(KEYMAP, keymap);
      continue;
    }
    let ok = 0;
    for (const it of items) {
      if (!it || typeof it.label !== "string" || typeof it.key !== "string") continue;
      if (!allLabels.has(it.label) || !KEY_RE.test(it.key)) continue;
      keymap.map[it.label] = it.key;
      ok += 1;
    }
    writeJson(KEYMAP, keymap);
    log.info(`  收到 ${ok} 個，累計 ${Object.keys(keymap.map).length}`);
  }
}

/* ── C. 組裝提案 ───────────────────────────────────────── */
const slug = (s, fallback) => {
  const t = String(s || "").replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "").toLowerCase();
  return t && /^[a-z]/.test(t) ? t.slice(0, 24) : fallback;
};

const proposals = {};
let ready = 0, review = 0, unsupported = 0, kept = 0;

/* 上一份提案裡由 schema-scan-dom 抽出來的那些。這一支讀的是靜態 HTML，
   對「表格由 JS 在執行時畫出來」的 demo 一定是「找不到可綁定的表格」——
   但那不代表它沒有表格，只代表這裡看不到。用一個看不到的結果去覆蓋
   已經看到的結果，等於每次上架新 demo 就把 DOM 抽好的 85 套打回原形，
   而且不會報錯（實測就這樣被蓋掉一次）。 */
const prevDom = (() => {
  try {
    const old = JSON.parse(fs.readFileSync(OUT, "utf8")).proposals || {};
    return new Map(Object.entries(old).filter(([, v]) => v?.source === "dom" && v.readyState === "ready"));
  } catch { return new Map(); }
})();

for (const s of scanned) {
  if (!s.tables.length) {
    const dom = prevDom.get(s.repoName);
    if (dom) { proposals[s.repoName] = dom; ready += 1; kept += 1; continue; }
    proposals[s.repoName] = { readyState: "unsupported", reason: "找不到可綁定的表格", tables: [] };
    unsupported += 1;
    continue;
  }
  const tables = [];
  const issues = [];
  const usedNames = new Set();

  s.tables.forEach((t, ti) => {
    // 欄位 key：查全站字典；查不到就用位置編號佔位並標記待審
    const keys = [];
    const seen = new Set();
    for (const [ci, label] of t.labels.entries()) {
      let k = keymap.map[label];
      if (!k) { k = `col_${ci + 1}`; issues.push(`「${label}」未命名`); }
      while (seen.has(k)) k = `${k}_${ci + 1}`; // 同表撞名就加序號
      seen.add(k);
      keys.push(k);
    }

    // 種子資料：靜態列優先（畫面上就長這樣），其次 JS 陣列
    const seed = t.sample.map((row) => Object.fromEntries(keys.map((k, i) => [k, row[i] ?? ""])));

    let name = slug(t.caption, `table_${ti + 1}`);
    while (usedNames.has(name)) name = `${name}_${ti + 1}`;
    usedNames.add(name);

    tables.push({
      name,
      title: t.caption || `${s.title} 資料表 ${ti + 1}`,
      selector: t.selector,
      screen: t.screen,
      renderedByJs: t.rendered,
      columns: t.labels.map((label, i) => ({ key: keys[i], label, type: t.types[i] })),
      seed,
      seedSource: seed.length ? "static" : "none",
    });
  });

  /* ready 只看 schema 品質（欄位是否都命名到位），不看種子有無——
     客戶的系統從空表開始是正常的，種子只是展示用。 */
  const state = issues.length ? "needs-review" : "ready";
  if (state === "ready") ready += 1; else review += 1;
  proposals[s.repoName] = {
    readyState: state,
    ...(issues.length ? { issues: [...new Set(issues)].slice(0, 8) } : {}),
    tables,
  };
}

writeJson(OUT, {
  generatedAt: new Date().toISOString(),
  source: "demos/<repo>/index.html",
  stats: { scanned: scanned.length, ready, needsReview: review, unsupported, labels: allLabels.size, named: Object.keys(keymap.map).length },
  proposals,
});

log.step(`提案完成：ready ${ready}、needs-review ${review}、unsupported ${unsupported}`);
if (kept) log.info(`  其中 ${kept} 套沿用 schema-scan-dom 從畫面抽到的結果（靜態掃描看不到它們的表格）`);
log.info(`  欄位字典 ${Object.keys(keymap.map).length}/${allLabels.size} 已命名`);
log.info(`  → ${path.relative(ROOT, OUT)}`);
if (!ready && !review) process.exit(EXIT.BAD_INPUT);
