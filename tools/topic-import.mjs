#!/usr/bin/env node
/**
 * 從 Master List（xlsx）匯入題目 —— topic-scout 的替代入口。
 *
 * topic-scout 是「用 codex 發想題目」；本工具是「匯入既有清單」，
 * 兩者輸出同一種候選格式，下游 demo-forge 不必改。
 * 去重用同一套五道閘，逐筆比對站上 538 個既有專案。
 *
 *   node tools/topic-import.mjs --dry-run
 *   node tools/topic-import.mjs --limit=30 --priority=P0
 *   node tools/topic-import.mjs --wave=1 --group="AI Agent"
 */
import fs from "node:fs";
import path from "node:path";
import {
  ROOT, EXIT, CANDIDATES_PATH, parseArgs, num, makeLogger,
  loadCatalog, loadClassifier, writeJson, existingRepoDirs,
} from "./lib/forge-common.mjs";
import { openWorkbook, toObjects } from "./lib/xlsx-read.mjs";
import { buildExistingIndex, screenCandidates } from "./lib/topic-similarity.mjs";
import { runCodexWithRetry } from "./lib/codex-run.mjs";

const args = parseArgs();
const log = makeLogger({ quiet: Boolean(args.quiet) });
const FILE = args.file ? path.resolve(args.file) : path.join(ROOT, "JVision_新增500_Apps_Master_List.xlsx");
const OUT = args.out ? path.resolve(args.out) : CANDIDATES_PATH;

if (!fs.existsSync(FILE)) { log.error(`找不到 ${FILE}`); process.exit(EXIT.BAD_INPUT); }

/* ── 產品群 → 站上 28 個分類 ─────────────────────────────
   Master List 用自己的 18 種產品群，與站上分類體系不同，必須明確對應。 */
const GROUP_TO_CATEGORY = {
  "AI Agent／Agentic AI": "資訊科技",
  "軟體研發／DevOps": "資訊科技",
  "企業 AI／LLM": "資訊科技",
  "MCP／Skills／API": "資訊科技",
  "AI Security／Governance": "資訊安全",
  "法務／專利／合規": "專業服務",
  "政府標案／補助": "專業服務",
  "行銷／MarTech": "業務銷售",
  "客戶成功／CX": "客服管理",
  "Data／DataOps": "數據分析",
  "Enterprise Search／KM": "企業協作",
  "行政／總務": "企業協作",
  "Industrial AI 新應用": "生產製造",
  "IoT／Edge AI": "設備維護",
  "實驗室／Lab": "研發管理",
  "國際貿易": "採購供應鏈",
  "Treasury／FinTech": "財務會計",
  "企業學習／人才": "人力資源",
};

/* 產品群 → repoName 的英文前綴（中文標題無法自動轉拼音，用編號保證唯一） */
const GROUP_TO_SLUG = {
  "AI Agent／Agentic AI": "agent", "軟體研發／DevOps": "devops", "企業 AI／LLM": "llm",
  "MCP／Skills／API": "mcp", "AI Security／Governance": "aisec", "法務／專利／合規": "legal",
  "政府標案／補助": "gov", "行銷／MarTech": "martech", "客戶成功／CX": "cx",
  "Data／DataOps": "dataops", "Enterprise Search／KM": "km", "行政／總務": "admin",
  "Industrial AI 新應用": "indai", "IoT／Edge AI": "iot", "實驗室／Lab": "lab",
  "國際貿易": "trade", "Treasury／FinTech": "treasury", "企業學習／人才": "learn",
};

/** 由痛點模板中間段與帶差異的功能項組出真正有內容的描述。 */
function buildDescription(row, features) {
  const pain = String(row["解決痛點"] || "");
  const core = (pain.match(/「([^」]+)」/) || [])[1] || features[1] || "";
  const outcome = String(features[4] || "").replace(/成效追蹤$/, "");
  const parts = [core, outcome].filter(Boolean);
  return parts.length > 1 ? `${parts[0]}，並追蹤${parts[1]}的改善成效。` : `${parts[0] || row["App 名稱"]}。`;
}

const MODULE_ICONS = ["input", "smart_toy", "verified", "alt_route", "insights", "history"];
/** 欄位內的項目分隔符只有全形分號；「、」是句子內的並列，切了會把語意截斷。 */
const split = (value) => String(value || "").split(/[；;]/).map((s) => s.trim()).filter(Boolean);
/** 人名／系統名這類才用頓號切。 */
const splitNames = (value) => String(value || "").split(/[、,，；;]/).map((s) => s.trim()).filter(Boolean);

/* ── 讀取與映射 ─────────────────────────────────────────── */
const wb = openWorkbook(FILE);
const sheetIndex = wb.names.findIndex((n) => /master/i.test(n)) + 1 || 2;
const rows = toObjects(wb.readSheet(sheetIndex));
wb.cleanup();
log.step(`Master List：${rows.length} 筆`);

let pool = rows;
if (args.priority) pool = pool.filter((r) => r["建議優先級"] === args.priority);
if (args.wave) pool = pool.filter((r) => String(r["批次開發波次"] || "").includes(`Wave ${args.wave}`));
if (args.group) pool = pool.filter((r) => String(r["產品群／分類"] || "").includes(args.group));
if (args["max-risk"]) {
  const order = { "低": 0, "中低": 1, "中": 2, "中高": 3, "高": 4 };
  const cap = order[args["max-risk"]] ?? 4;
  pool = pool.filter((r) => (order[r["與原463重複風險"]] ?? 4) <= cap);
}
log.info(`  篩選後 ${pool.length} 筆${args.priority ? `（${args.priority}）` : ""}${args.wave ? `（Wave ${args.wave}）` : ""}`);

// 依商業價值高、開發難度低排序，讓先做的最划算
pool = [...pool].sort((a, b) =>
  (Number(b["商業價值 (1-5)"]) - Number(a["商業價值 (1-5)"])) ||
  (Number(a["開發難度 (1-5)"]) - Number(b["開發難度 (1-5)"])));

const candidates = pool.map((row) => {
  const group = row["產品群／分類"];
  const serial = String(row["編號"] || "").replace(/\D/g, "").padStart(3, "0");
  const features = split(row["核心功能"]).slice(0, 6);
  const users = splitNames(row["主要使用者"]);
  const owner = users[0] || "承辦人員";
  const approver = users[1] || users[0] || "主管";

  return {
    slug: `${GROUP_TO_SLUG[group] || "app"}-${serial}`,
    title: row["App 名稱"],
    category: GROUP_TO_CATEGORY[group] || "經營管理",
    systemType: null,                       // 稍後用 classify 補
    // 解決痛點 500 筆共用「現行作法對「X」多靠人工…」的模板，X 才是真內容；
    // 核心功能只有第 2、5 項帶差異（其餘四項 500 筆逐字相同）。
    description: buildDescription(row, features),
    businessSituation: row["解決痛點"],
    primaryUser: users.slice(0, 3).join("、"),
    dailyUse: String(row["Demo 情境"] || "").split("Demo：")[0] || row["Demo 情境"],
    operationalMetrics: splitNames(row["所需企業資料"]).slice(0, 5),
    // 核心功能實測 500 筆全部剛好 6 項，可直接對應 6 個模組與 6 個畫面
    modules: features.map((name, i) => ({
      icon: MODULE_ICONS[i],
      name,
      desc: name,
    })),
    flowStages: features.map((name, i) => ({
      title: name,
      role: i >= 3 ? approver : owner,
      desc: name,
    })),
    differentiator: row["差異化界線"] || "",
    rawCore: features[1] || "",
    rawAi: row["AI 能力"] || "",
    rawAgent: row["Agent 能力"] || "",
    rawSystems: row["可串接系統"] || "",
    source: {
      masterId: row["編號"], group, subDomain: row["子領域"],
      priority: row["建議優先級"], wave: row["批次開發波次"],
      value: Number(row["商業價值 (1-5)"]), difficulty: Number(row["開發難度 (1-5)"]),
      declaredRisk: row["與原463重複風險"],
    },
  };
});

/* ── 去重（與 topic-scout 同一套五道閘） ─────────────────── */
const catalog = loadCatalog();
const JV = loadClassifier();
const dirs = existingRepoDirs();
for (const c of candidates) {
  c.systemType = JV.classify({ title: c.title, category: c.category });
  c.repoName = `jvision-${c.slug}`;
}
const index = buildExistingIndex(catalog.projects, (p) => JV.classify(p));
const { accepted, rejected } = screenCandidates(candidates, index, { existingDirs: dirs });

const limit = num(args.limit, accepted.length);
const finalAccepted = accepted.slice(0, limit);

log.step(`去重結果（比對站上 ${catalog.projects.length} 個既有專案）`);
log.info(`  通過 ${accepted.length}　重複 ${rejected.length}${limit < accepted.length ? `　本次取前 ${limit}` : ""}`);
const byGate = {};
rejected.forEach((r) => { byGate[r.gate] = (byGate[r.gate] || 0) + 1; });
if (rejected.length) log.info(`  各閘攔截：${Object.entries(byGate).map(([g, n]) => `${g}=${n}`).join("　")}`);

// 清單自稱的重複風險 vs 實際比對結果，交叉檢核
const cross = {};
for (const c of [...accepted, ...rejected]) {
  const key = `${c.source?.declaredRisk || "?"}／${rejected.includes(c) ? "判重複" : "通過"}`;
  cross[key] = (cross[key] || 0) + 1;
}
log.info(`  與清單自評風險交叉：${Object.entries(cross).map(([k, v]) => `${k}:${v}`).join("　")}`);

/* ── 補完：把 Master List 的模板欄位換成真正的 6 模組 6 流程 ──
   核心功能有 4 項是 500 筆逐字相同的模板（資料／事件接入、證據與信心呈現、
   例外分流與人工覆核、完整稽核軌跡），直接當模組會讓每個 demo 長一樣。
   這一步用 codex 依原始欄位重新設計，是 LLM 真正有價值的地方。 */
async function enrich(items) {
  const BATCH = 8;
  const types = Object.keys(JV.TYPES);
  const batches = [];
  for (let i = 0; i < items.length; i += BATCH) batches.push(items.slice(i, i + BATCH));

  // 每批是獨立的 codex 呼叫、彼此無依賴，並行可把 60 批的等待壓到 1/N
  const CONCURRENCY = Math.min(6, Math.max(1, num(args.concurrency, 4)));
  log.info(`  ${batches.length} 批、並行 ${CONCURRENCY}`);
  let cursor = 0;
  let done = 0;

  async function runBatch(chunk) {
    const prompt = `你要為以下企業 App 設計 UI 模組與操作流程。

每個 App 會做成一頁式純 UI demo：6 個可切換的完整畫面，畫面內容必須彼此不同。

## 可用的 systemType（挑最貼近的一個）
${types.join("、")}

## 待處理的 App
${chunk.map((c) => `---
編號：${c.source.masterId}
名稱：${c.title}
產品群：${c.source.group}／${c.source.subDomain}
主要使用者：${c.primaryUser}
核心能力：${c.rawCore}
AI 能力：${c.rawAi}
Agent 能力：${c.rawAgent}
所需企業資料：${c.operationalMetrics.join("、")}
可串接系統：${c.rawSystems}
差異化界線：${String(c.differentiator).slice(0, 160)}`).join("\n")}

## 要求
1. slug 用英文小寫連字號，要能看出這是什麼系統（例如 agent-blueprint-designer）。
2. modules 剛好 6 個，必須是**這個 App 專屬**的功能模組。
   嚴禁使用「資料接入」「證據呈現」「例外分流」「稽核軌跡」這類通用樣板名稱 —— 
   那是所有 App 共用的描述，不是模組。要具體到這個領域在做什麼事。
3. flowStages 剛好 6 個，依序對應那 6 個畫面，每階段要有負責角色。
4. description 一句話，60 字內，講清楚解決什麼工作。
5. icon 用 Material Symbols Outlined 的名稱。

只輸出符合 schema 的 JSON。`;

    const result = await runCodexWithRetry({
      prompt, cwd: ROOT, sandbox: "read-only",
      schemaPath: path.join(ROOT, "tools", "schemas", "topic-enrich.schema.json"),
      timeoutMs: num(args.timeout, 420) * 1000, model: args.model,
      onLog: () => process.stderr.write("."),
    }, { retries: 1 });
    process.stderr.write("\n");

    if (!result.ok || !result.json?.apps) { log.warn(`  一批補完失敗，保留原始欄位：${result.error || "無法解析"}`); return; }
    for (const app of result.json.apps) {
      const target = chunk.find((c) => c.source.masterId === app.masterId);
      if (!target) continue;
      if (app.slug) { target.slug = app.slug; target.repoName = `jvision-${app.slug}`; }
      if (app.systemType && JV.TYPES[app.systemType]) target.systemType = app.systemType;
      if (app.description) target.description = app.description;
      if (app.modules?.length === 6) target.modules = app.modules;
      if (app.flowStages?.length === 6) target.flowStages = app.flowStages;
      target.enriched = true;
    }
  }

  async function worker() {
    while (cursor < batches.length) {
      const chunk = batches[cursor++];
      try { await runBatch(chunk); }
      catch (error) { log.warn(`  批次例外：${error.message}`); }
      done += 1;
      if (done % 5 === 0 || done === batches.length) {
        log.info(`  進度 ${done}/${batches.length} 批　已補完 ${items.filter((c) => c.enriched).length}/${items.length} 筆`);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
}

if (args.enrich && !args["dry-run"]) {
  log.step(`用 codex 補完 ${finalAccepted.length} 筆的模組與流程`);
  await enrich(finalAccepted);
  const done = finalAccepted.filter((c) => c.enriched).length;
  log.info(`  完成 ${done}／${finalAccepted.length}`);
}

if (args["dry-run"]) {
  log.step("── 前 5 筆將匯入的候選 ──");
  for (const c of finalAccepted.slice(0, 5)) {
    log.info(`  ${c.title}（${c.systemType}／${c.category}）→ ${c.repoName}`);
    log.info(`     ${c.description.slice(0, 60)}`);
    log.info(`     模組：${c.modules.map((m) => m.name).join("、")}`);
  }
  log.step("DRY RUN：未寫入");
  process.exit(EXIT.OK);
}

writeJson(OUT, {
  generatedAt: new Date().toISOString(),
  source: path.basename(FILE),
  config: { limit, priority: args.priority || null, wave: args.wave || null, group: args.group || null },
  catalogSize: catalog.projects.length,
  stats: { pool: rows.length, filtered: pool.length, accepted: accepted.length, imported: finalAccepted.length, rejected: rejected.length, byGate },
  accepted: finalAccepted,
  rejected,
});
log.step(`已寫入 ${path.relative(ROOT, OUT)}（${finalAccepted.length} 筆候選）`);
log.info(`  下一步：node tools/demo-forge.mjs --count=1 --dry-run`);
process.exit(EXIT.OK);
