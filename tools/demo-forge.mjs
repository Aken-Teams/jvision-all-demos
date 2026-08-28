#!/usr/bin/env node
/**
 * Agent B — 用 codex 建 demo。
 *
 * 腳本負責決定論的部分（details JSON、README、風格參數），
 * codex 只負責唯一需要創意的 index.html。
 * 永遠不寫 projects-index.json —— 上架是 tools/demo-publish.mjs 的事。
 *
 *   node tools/demo-forge.mjs --count=1 --dry-run
 *   node tools/demo-forge.mjs --count=5
 *   node tools/demo-forge.mjs --status
 *   node tools/demo-forge.mjs --discard=jvision-xxx
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { spawnSync } from "node:child_process";
import {
  ROOT, EXIT, DEMOS_DIR, DETAILS_DIR, CANDIDATES_PATH, parseArgs, num, list, makeLogger,
  loadCatalog, loadClassifier, loadManifest, saveManifest, upsertEntry, writeJson,
  nextProjectId, existingRepoDirs, gitStatus, diffGuard, gitRestore,
} from "./lib/forge-common.mjs";
import { runCodexWithRetry } from "./lib/codex-run.mjs";
import { buildDetails, readmeMd } from "./lib/detail-template.mjs";

const args = parseArgs();
const log = makeLogger({ quiet: Boolean(args.quiet) });
const DRY = Boolean(args["dry-run"]);

/* ── 風格輪替：讓每個 demo 長得不一樣（pipeline 的硬規則） ── */
const CHART_LIBS = [
  { key: "echarts", cdn: "https://cdn.jsdelivr.net/npm/echarts@5.5.1/dist/echarts.min.js", note: "echarts.init(el) 後 setOption" },
  { key: "chartjs", cdn: "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js", note: "new Chart(canvas, config)" },
  { key: "apexcharts", cdn: "https://cdn.jsdelivr.net/npm/apexcharts@3.45.2/dist/apexcharts.min.js", note: "new ApexCharts(el, options).render()" },
];
const ACCENTS = ["#1e40af", "#0f766e", "#7c3aed", "#b45309", "#be123c", "#0369a1", "#4d7c0f", "#9333ea"];
const LAYOUTS = ["rail-left（78px 圖示欄 + 主區）", "topnav-tabs（頂部分頁列）", "split-sidebar（220px 文字側欄）", "card-workbench（卡片工作台）"];

/* ── 狀態查詢 / 丟棄 ────────────────────────────────────── */
const manifest = loadManifest();

if (args.status) {
  if (!manifest.entries.length) { log.info("manifest 目前沒有任何項目"); process.exit(EXIT.OK); }
  for (const e of manifest.entries) {
    const checks = Object.entries(e.checks || {}).map(([k, v]) => `${k}:${v.pass ? "✓" : "✗"}`).join(" ");
    log.info(`  ${(e.state || "?").padEnd(10)} ${e.repoName.padEnd(42)} ${e.title || ""}  ${checks}`);
  }
  process.exit(EXIT.OK);
}

if (args.discard) {
  for (const repo of list(args.discard)) {
    fs.rmSync(path.join(DEMOS_DIR, repo), { recursive: true, force: true });
    fs.rmSync(path.join(DETAILS_DIR, `${repo}.json`), { force: true });
    upsertEntry(manifest, { repoName: repo, state: "discarded" });
    log.info(`  已丟棄 ${repo}`);
  }
  saveManifest(manifest);
  process.exit(EXIT.OK);
}

/* ── 讀候選 ─────────────────────────────────────────────── */
const from = args.from ? path.resolve(args.from) : CANDIDATES_PATH;
if (!fs.existsSync(from)) {
  log.error(`找不到候選檔 ${path.relative(ROOT, from)}，請先執行 node tools/topic-scout.mjs`);
  process.exit(EXIT.BAD_INPUT);
}
const candidates = JSON.parse(fs.readFileSync(from, "utf8")).accepted || [];
const picked = args.pick
  ? candidates.filter((c) => list(args.pick).includes(c.slug))
  : candidates.slice(0, num(args.count, 5));

if (!picked.length) { log.error("沒有可建置的候選"); process.exit(EXIT.BAD_INPUT); }

const catalog = loadCatalog();
const JV = loadClassifier();
const dirs = existingRepoDirs();
let nextId = nextProjectId(catalog.projects);

/* ── 建置 prompt ────────────────────────────────────────── */
const HARD_RULES = fs.existsSync(path.join(ROOT, "docs", "AGENT-WORKFLOW-PIPELINE.md"))
  ? fs.readFileSync(path.join(ROOT, "docs", "AGENT-WORKFLOW-PIPELINE.md"), "utf8")
      .split("### 7-2")[1]?.split("```")[1] || ""
  : "";

/** 建置 prompt 用的瘦身規格：records 只留 columns＋兩筆示例，其餘 codex 依同格式編造即可。
 *  完整版照樣寫入 content/details/，詳細頁不受影響——瘦的只是餵給模型的那一份。 */
function slimForPrompt(details) {
  const slim = { ...details };
  const rows = details.records?.rows;
  if (Array.isArray(rows) && rows.length > 2) {
    slim.records = {
      ...details.records,
      rows: rows.slice(0, 2),
      note: `示例僅列 2 筆；畫面中的表格請依相同欄位格式自行編出約 ${rows.length} 筆合理資料`,
    };
  }
  return slim;
}

function buildPrompt(entry, details, style, reference) {
  return `你要建立「一個」檔案：demos/${entry.repoName}/index.html

## 唯一可寫路徑
你只能建立或修改 \`demos/${entry.repoName}/index.html\` 這一個檔案。
不得修改 projects-index.json、不得動任何其他 demos/*、不得新增其他檔案。

## 規格書（已備妥，直接照做，不要自行發想模組）
${JSON.stringify(slimForPrompt(details), null, 1)}

## 指派的風格參數（用來確保每個 demo 都不一樣）
- 主色：${style.accent}
- 版型：${style.layout}
- 圖表庫：${style.lib.key}，CDN：${style.lib.cdn}（用法：${style.lib.note}）

## 架構契約（必須與現有 538 個 demo 一致）
- 單檔自足：一個 index.html，內嵌 <style> 與 <script>，總大小 20–45 KB，不得引用任何本地 .js/.css
- <html lang="zh-Hant">；<title> 為「${details.title} · ${details.systemType}｜Jvision 系統 Demo」
- head 固定四行：../../favicon.svg、Google Fonts(Inter + Noto Sans TC)、Material Symbols Outlined、上面指派的圖表庫 CDN
- CSS 變數調色盤：--blue(換成指派主色)/--ink/--body/--muted/--line/--bg/--green/--amber/--red
- 導覽契約：6 顆 [data-i="0"]～[data-i="5"] 按鈕；show(i) 切畫面；載入時直接 show(0)；
  支援 #go=N 深連結與 hashchange（照既有寫法 /(?:go=|v)([0-9]+)/）
- 6 個畫面依序對應 flow.stages 的 v0..v5，內容必須**完全不同**（不是同版型換資料）
- 參考實作（同架構的既有 demo，可讀取觀摩，但不可抄成公版）：${reference}

## 硬性品質規則（違反會被驗收退回）
${HARD_RULES || `- 390 / 768 / 1360px 都不可有水平溢出；多欄版面用 CSS class + @media 收合
- 圖表只在該畫面顯示時初始化，且容器已有寬度才畫
- 一打開就要顯示第一個畫面，不是點了才出現
- 每個流程步驟對到不同畫面，絕不可兩步共用同一畫面
- 不准用 setInterval / setTimeout 自動更新資料
- 命名不可用 top / name / location / status 等全域衝突字
- 產出前自行做語法檢查`}

## 輸出方式（重要）
**不要嘗試寫入任何檔案**（本環境的沙箱不允許 codex 寫檔）。
你的最後一則訊息必須是「完整的 HTML 文件本身」，從 \`<!doctype html>\` 開始、到 \`</html>\` 結束，
前後不要有任何說明文字、不要用 \`\`\` 圍籬包起來。檔案會由呼叫端負責寫入。`;
}

/** 從 codex 的最後訊息取出 HTML；容忍前後說明文字與 ``` 圍籬。 */
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

/* ── 靜態閘 ─────────────────────────────────────────────── */
function staticGate(file, details) {
  const issues = [];
  if (!fs.existsSync(file)) return { pass: false, issues: ["index.html 未產出"] };
  const html = fs.readFileSync(file, "utf8");
  const size = Buffer.byteLength(html);
  if (size < 12000 || size > 90000) issues.push(`檔案大小 ${(size / 1024).toFixed(1)}KB 超出 12–90KB`);
  for (let i = 0; i < 6; i += 1) if (!html.includes(`data-i="${i}"`) && !html.includes(`data-i='${i}'`) && !html.includes("data-i=")) issues.push(`缺少 data-i="${i}"`);
  if (!/hashchange/.test(html)) issues.push("缺少 hashchange 深連結");
  if (!/favicon\.svg/.test(html)) issues.push("缺少 favicon 引用");
  if (/setInterval\s*\(/.test(html)) issues.push("使用了 setInterval（硬性規則禁止）");
  if (/<link[^>]+href="\.\.\/\.\.\/shared/.test(html)) issues.push("引用了 shared/（單檔自足規則禁止）");
  const localScripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]).filter((s) => !s.startsWith("http"));
  if (localScripts.length) issues.push(`引用本地腳本：${localScripts.join(", ")}`);
  if (/\b(?:var|let|const|function)\s+(top|name|location|status|open|close|parent|self)\b/.test(html)) issues.push("使用了會與瀏覽器全域衝突的識別字");

  // 內嵌 script 語法檢查（在 process 內做，不落暫存檔）
  for (const m of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)) {
    if (!m[1].trim()) continue;
    try { new vm.Script(m[1]); }
    catch (error) { issues.push(`內嵌 script 語法錯誤：${String(error.message).slice(0, 80)}`); break; }
  }
  return { pass: issues.length === 0, issues };
}

/* ── 主流程 ─────────────────────────────────────────────── */
const built = [];
const failed = [];
let aborted = false;

async function buildOne(candidate, index) {
  const repoName = `jvision-${candidate.slug}`;
  const style = { lib: CHART_LIBS[index % 3], accent: ACCENTS[index % ACCENTS.length], layout: LAYOUTS[index % LAYOUTS.length] };

  const prior = manifest.entries.find((e) => e.repoName === repoName);
  if (prior && ["built", "verified", "published"].includes(prior.state) && fs.existsSync(path.join(DEMOS_DIR, repoName, "index.html"))) {
    log.info(`[${index + 1}/${picked.length}] ${candidate.title} —— 已建置，跳過`);
    built.push(repoName);
    return;
  }
  if (dirs.has(repoName) && !prior) { log.warn(`${repoName} 目錄已存在但不在 manifest，跳過以免覆蓋`); return; }

  const details = buildDetails(candidate, { id: nextId + index, JV });
  const demoDir = path.join(DEMOS_DIR, repoName);
  const htmlPath = path.join(demoDir, "index.html");
  const reference = "demos/jvision-ai-case-001-production-scheduler/index.html";
  const prompt = buildPrompt({ repoName }, details, style, reference);

  log.step(`[${index + 1}/${picked.length}] ${candidate.title}（${repoName}）`);
  log.info(`  類型 ${candidate.systemType}／${candidate.category}　主色 ${style.accent}　圖表 ${style.lib.key}`);

  if (DRY) {
    log.info(`  將寫入：${path.relative(ROOT, path.join(DETAILS_DIR, `${repoName}.json`))}`);
    log.info(`  將寫入：${path.relative(ROOT, path.join(demoDir, "README.md"))}`);
    log.info(`  codex 產出：${path.relative(ROOT, htmlPath)}`);
    log.info(`  details 6 stages → ${details.flow.stages.map((s) => s.demo).join(",")}`);
    log.info(`  prompt 長度 ${(Buffer.byteLength(prompt) / 1024).toFixed(1)} KB`);
    if (args.verbose) console.log("\n" + prompt + "\n");
    return;
  }

  // 腳本端先產決定論的兩個檔
  fs.mkdirSync(demoDir, { recursive: true });
  writeJson(path.join(DETAILS_DIR, `${repoName}.json`), details);
  fs.writeFileSync(path.join(demoDir, "README.md"), readmeMd(details));
  upsertEntry(manifest, { repoName, slug: candidate.slug, title: candidate.title, category: candidate.category, systemType: candidate.systemType, state: "building", assigned: { chartLib: style.lib.key, accent: style.accent, layout: style.layout, index } });
  saveManifest(manifest);

  const before = gitStatus();
  const started = Date.now();
  // codex 全程 read-only —— 這個環境的 bubblewrap 沙箱無法讓它寫檔
  // （bwrap: loopback: Failed RTM_NEWADDR），且由腳本落檔本來就更安全：
  // 檔案寫到哪、寫什麼，完全由這裡控制。
  const result = await runCodexWithRetry({
    prompt,
    cwd: ROOT,
    sandbox: "read-only",
    timeoutMs: num(args.timeout, 1800) * 1000,
    model: args.model,
    onLog: () => process.stderr.write("."),
  }, { retries: num(args.retry, 1) });
  process.stderr.write("\n");

  // 由腳本把 codex 回傳的 HTML 落檔
  if (result.ok) {
    const html = extractHtml(result.text);
    if (html) fs.writeFileSync(htmlPath, html);
    else { result.ok = false; result.error = "codex 回傳內容不是完整的 HTML 文件"; }
  }

  // 越界護欄：白名單外的已追蹤檔變動立即還原並中止
  const allow = [`demos/${repoName}/`, `content/details/${repoName}.json`, "docs/DEMO_FORGE_MANIFEST.json"];
  const guard = diffGuard(before, allow);
  if (guard.trackedViolations.length) {
    log.error(`codex 越界修改了 ${guard.trackedViolations.join(", ")} —— 已還原並中止本批`);
    gitRestore(guard.trackedViolations);
    upsertEntry(manifest, { repoName, state: "failed", failReason: "out-of-scope-write", outOfScope: guard.trackedViolations });
    saveManifest(manifest);
    aborted = true;
    return;
  }
  if (guard.untrackedExtras.length) log.warn(`codex 額外產生了未追蹤檔（未自動刪除）：${guard.untrackedExtras.join(", ")}`);

  const gate = staticGate(htmlPath, details);
  const state = result.ok && gate.pass ? "built" : "failed";

  /* 失敗的 transcript 是最值錢的分析材料。codex 的輸出檔本來讀進記憶體就刪，
     失敗時什麼都不剩——錯誤模式（回傳截斷、圍籬包裹、規則違反）只能靠猜。
     留檔含：錯誤、prompt 大小、完整輸出。只在失敗時留，並修剪到最近 60 份，
     不會無限長大。 */
  if (state === "failed") {
    try {
      const dir = path.join(ROOT, "docs", "_state", "failed-transcripts");
      fs.mkdirSync(dir, { recursive: true });
      const head = [
        `repo: ${repoName}`,
        `at: ${new Date().toISOString()}`,
        `error: ${result.error || "(靜態閘未過)"}`,
        `gate: ${JSON.stringify(gate.issues || [])}`,
        `promptBytes: ${Buffer.byteLength(prompt)}`,
        `durationMs: ${Date.now() - started}`,
        "─".repeat(60),
      ].join("\n");
      fs.writeFileSync(path.join(dir, `${repoName}-${Date.now()}.log`),
        head + "\n" + (result.text || "(codex 無輸出)"));
      const olds = fs.readdirSync(dir).filter((f) => f.endsWith(".log")).sort();
      for (const f of olds.slice(0, Math.max(0, olds.length - 60))) fs.unlinkSync(path.join(dir, f));
    } catch { /* 留檔失敗不影響產線 */ }
  }
  upsertEntry(manifest, {
    repoName, state,
    attempts: result.attempts,
    checks: { static: gate, codex: { pass: result.ok, error: result.error || null } },
    // report 欄位已移除：輸出改為純 HTML 後 result.json 恆為 null，1,190 筆裡只有 2 筆
    // 舊流程殘骸——沒有任何機器在讀的回報就是死信，留著只是佔 manifest。
    codex: { durationMs: Date.now() - started },
  });
  saveManifest(manifest);

  if (state === "built") { log.info(`  ✅ 已產出（${(fs.statSync(htmlPath).size / 1024).toFixed(1)} KB）`); built.push(repoName); }
  else { log.error(`  失敗：${result.error || gate.issues.join("；")}`); }
}

/* 工作池：--concurrency 控制同時進行數（預設 1，上限 4）。
   codex 呼叫是純 IO 等待，並行能大幅縮短總時間；但每個都會寫檔，
   所以 manifest 的寫入要在每個任務結束時各自進行（已如此）。 */
const CONCURRENCY = Math.min(4, Math.max(1, num(args.concurrency, 1)));
if (!DRY && CONCURRENCY > 1) log.info(`並行度 ${CONCURRENCY}`);

let cursor = 0;
async function worker() {
  while (cursor < picked.length && !aborted) {
    const index = cursor++;
    try { await buildOne(picked[index], index); }
    catch (error) { log.error(`第 ${index + 1} 筆例外：${error.message}`); failed.push(picked[index]?.slug); }
  }
}
await Promise.all(Array.from({ length: DRY ? 1 : CONCURRENCY }, worker));

if (DRY) { log.step("DRY RUN：未寫入任何檔案"); process.exit(EXIT.OK); }

log.step(`建置完成：成功 ${built.length}／${picked.length}${aborted ? "（因越界寫入中止）" : ""}`);
if (built.length) {
  log.info("  下一步驗收（需先起靜態站）：");
  log.info(`    node tools/demo-verify.mjs ${built.join(" ")}`);
  log.info("  確認後上架：");
  log.info(`    node tools/demo-publish.mjs --repo=${built.join(",")}`);
}
process.exit(built.length === picked.length ? EXIT.OK : EXIT.PARTIAL);
