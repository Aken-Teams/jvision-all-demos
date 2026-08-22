#!/usr/bin/env node
/**
 * Agent A — 題目發掘與去重。
 *
 * 從既有 demo 的 systemType 分布算出缺口 → 交給 codex 出題 →
 * 用中文 trigram 五道閘去重 → 輸出候選清單供人審。
 * 完全唯讀（codex 以 -s read-only 執行），不寫任何專案檔。
 *
 *   node tools/topic-scout.mjs --gap-only
 *   node tools/topic-scout.mjs --count=30 --dry-run
 *   node tools/topic-scout.mjs --count=30
 */
import fs from "node:fs";
import path from "node:path";
import {
  ROOT, EXIT, CANDIDATES_PATH, parseArgs, num, list, makeLogger,
  loadCatalog, loadClassifier, coverageByType, writeJson, SLUG_RE, existingRepoDirs,
} from "./lib/forge-common.mjs";
import { runCodexWithRetry } from "./lib/codex-run.mjs";
import { buildExistingIndex, screenCandidates } from "./lib/topic-similarity.mjs";

const args = parseArgs();
const log = makeLogger({ quiet: Boolean(args.quiet) });

const COUNT = num(args.count, 30);
const POOL = num(args.pool, COUNT * 2);
const ROUNDS = num(args.rounds, 2);
const OUT = args.out ? path.resolve(args.out) : CANDIDATES_PATH;
const SCHEMA = path.join(ROOT, "tools", "schemas", "topic-scout.schema.json");
const ONLY_TYPES = args.type ? list(args.type) : null;
const EXCLUDE_TYPES = args["exclude-type"] ? list(args["exclude-type"]) : [];

/* ── 1. 缺口分析 ─────────────────────────────────────────── */
const catalog = loadCatalog();
const JV = loadClassifier();
const { rows, median } = coverageByType(catalog.projects, JV);
const dirs = existingRepoDirs();

const eligible = rows
  .filter((r) => (!ONLY_TYPES || ONLY_TYPES.includes(r.type)) && !EXCLUDE_TYPES.includes(r.type));

// 稀缺者配額高：缺口權重 = max(1, median - count + 1)
const weights = eligible.map((r) => ({ ...r, weight: Math.max(1, median - r.count + 1) }));
const totalWeight = weights.reduce((sum, r) => sum + r.weight, 0);
const quota = weights.map((r) => ({
  ...r,
  quota: Math.max(1, Math.round((r.weight / totalWeight) * POOL)),
}));

log.step(`既有專案 ${catalog.projects.length} 筆，${rows.length} 種系統類型，中位數 ${median} 筆`);
log.info("  缺口由大到小（前 10）：");
for (const r of quota.slice(0, 10)) {
  log.info(`   ${String(r.count).padStart(3)} 筆  ${r.type.padEnd(20)} ${r.label}  → 配額 ${r.quota}`);
}

if (args["gap-only"]) {
  console.log(JSON.stringify({ total: catalog.projects.length, median, coverage: rows.map(({ type, count, label }) => ({ type, count, label })) }, null, 2));
  process.exit(EXIT.OK);
}

/* ── 2. 組 prompt ────────────────────────────────────────── */
function buildPrompt(round, negatives) {
  const coverageBlock = quota.map((r) =>
    `${r.type}（${r.label}｜已有 ${r.count} 題${r.count <= median ? "・缺口" : ""}）：${r.titles.join("、") || "（無）"}`
  ).join("\n");

  const quotaBlock = quota
    .filter((r) => r.count <= median)
    .map((r) => `- ${r.type}：${r.quota} 題`)
    .join("\n");

  const negativeBlock = negatives.length
    ? `\n## 上一輪被判定重複的題目（請避開這些方向）\n${negatives.map((n) => `- ${n.title}（撞到「${n.matchedTitle}」，相似度 ${n.score}）`).join("\n")}\n`
    : "";

  return `你是 JVision 的產品企劃，要為 B2B 企業系統 demo 網站提案新題目。

## 這個網站是什麼
每個題目會做成一個「純 UI 展示」的單頁系統 demo：繁體中文、6 個可切換的操作畫面、擬真假資料、無後端。
客群是台灣的中小企業與工廠，題目必須是**企業內部真的會採購導入的系統**。

## 目前已有 ${catalog.projects.length} 個題目，依系統類型分布如下
${coverageBlock}

## 這次要出 ${POOL} 題，配額集中在缺口類型
${quotaBlock}
${negativeBlock}
## 好題目的硬性條件
1. **不可以是既有題目的換句話說**。每題都要在 differentiator 說明「跟哪一個既有題目最像、差在哪」。
2. 必須是企業會付錢買的內部系統，不是消費者 App、不是純資訊網站。
3. 不可依賴真實後端、硬體或即時裝置才成立（demo 是純 UI）。
4. 必須能自然拆成 **6 個彼此不同的操作畫面**，而不是同一個畫面換資料。
5. title 用 6-14 個中文字；description 60-120 字，講清楚解決什麼工作。
6. modules 剛好 6 個，icon 用 Material Symbols Outlined 的名稱（例如 inventory、rule、insights）。
7. flowStages 剛好 6 個，依序對應那 6 個畫面，每個階段要有負責角色。

只輸出符合 schema 的 JSON，不要 Markdown、不要任何說明文字。`;
}

/* ── 3. 呼叫 codex + 去重 ────────────────────────────────── */
const existingIndex = buildExistingIndex(catalog.projects, (p) => JV.classify(p));
const accepted = [];
const rejected = [];
let generated = 0;

if (args["dry-run"]) {
  const prompt = buildPrompt(1, []);
  log.step("── DRY RUN：以下是將送給 codex 的 prompt ──");
  console.log(prompt);
  log.step(`prompt 長度：${prompt.length} 字元（約 ${(Buffer.byteLength(prompt) / 1024).toFixed(1)} KB）`);
  log.info(`schema：${path.relative(ROOT, SCHEMA)}`);
  log.info(`輸出目標：${path.relative(ROOT, OUT)}（未寫入）`);
  process.exit(EXIT.OK);
}

/** schema 之外自己再驗一次；單筆不合格丟該筆，不整批中止。 */
function validate(topic) {
  const errors = [];
  if (!SLUG_RE.test(String(topic.slug || ""))) errors.push("slug 格式");
  if (!JV.TYPES[topic.systemType]) errors.push("systemType 不存在");
  if (!(topic.modules || []).length || topic.modules.length !== 6) errors.push("modules 需 6 個");
  if (!(topic.flowStages || []).length || topic.flowStages.length !== 6) errors.push("flowStages 需 6 個");
  if (String(topic.title || "").length < 3) errors.push("title 過短");
  if (dirs.has(`jvision-${topic.slug}`)) errors.push("repoName 已存在");
  return errors;
}

for (let round = 1; round <= ROUNDS && accepted.length < COUNT; round += 1) {
  log.step(`── 第 ${round} 輪：呼叫 codex 產題（已收 ${accepted.length}/${COUNT}）──`);
  const result = await runCodexWithRetry({
    prompt: buildPrompt(round, rejected.slice(-12)),
    cwd: ROOT,
    sandbox: "read-only",
    schemaPath: SCHEMA,
    timeoutMs: num(args.timeout, 300) * 1000,
    model: args.model,
    onLog: () => process.stderr.write("."),
  }, { retries: 2 });
  process.stderr.write("\n");

  if (!result.ok) { log.error(`codex 失敗：${result.error}`); if (round === ROUNDS) process.exit(EXIT.CODEX_FAILED); continue; }
  const topics = result.json?.topics;
  if (!Array.isArray(topics) || !topics.length) { log.error("codex 回應無法解析成題目清單"); if (round === ROUNDS) process.exit(EXIT.BAD_OUTPUT); continue; }

  generated += topics.length;
  const valid = [];
  for (const topic of topics) {
    const errors = validate(topic);
    if (errors.length) rejected.push({ ...topic, reason: "格式不合", detail: errors.join("、"), round });
    else valid.push({ ...topic, repoName: `jvision-${topic.slug}`, round });
  }

  const screened = screenCandidates(valid, existingIndex);
  for (const item of screened.accepted) {
    if (accepted.length >= COUNT) break;
    accepted.push(item);
    existingIndex.push({ repoName: item.repoName, title: item.title, systemType: item.systemType, grams: buildExistingIndex([item], () => item.systemType)[0].grams });
  }
  rejected.push(...screened.rejected.map((r) => ({ ...r, round })));
  log.info(`  本輪 ${topics.length} 題 → 通過 ${screened.accepted.length}、重複/不合格 ${topics.length - screened.accepted.length}`);
}

/* ── 4. 輸出 ─────────────────────────────────────────────── */
const output = {
  generatedAt: new Date().toISOString(),
  config: { count: COUNT, pool: POOL, rounds: ROUNDS },
  catalogSize: catalog.projects.length,
  coverage: Object.fromEntries(rows.map((r) => [r.type, r.count])),
  stats: { generated, accepted: accepted.length, rejected: rejected.length },
  accepted,
  rejected,
};
writeJson(OUT, output);

const md = [
  `# 題目候選（${new Date().toISOString().slice(0, 10)}）`, "",
  `既有 ${catalog.projects.length} 題｜本次產 ${generated} 題｜通過 ${accepted.length}｜重複或不合格 ${rejected.length}`, "",
  "## 通過的題目", "",
  ...accepted.map((a, i) => `${i + 1}. **${a.title}**（${a.systemType}／${a.category}）\n   - ${a.description}\n   - 差異：${a.differentiator}\n   - repo：\`${a.repoName}\``),
  "", "## 被判重複或不合格", "",
  ...rejected.map((r) => `- ${r.title || "(無標題)"}　—　${r.reason}${r.matchedTitle ? `（撞到「${r.matchedTitle}」${r.score}）` : ""}${r.detail ? `：${r.detail}` : ""}`),
].join("\n");
fs.writeFileSync(OUT.replace(/\.json$/, ".md"), md + "\n");

log.step(`完成：通過 ${accepted.length}／目標 ${COUNT}，重複或不合格 ${rejected.length}`);
log.info(`  ${path.relative(ROOT, OUT)}`);
log.info(`  ${path.relative(ROOT, OUT.replace(/\.json$/, ".md"))}`);
process.exit(accepted.length >= COUNT ? EXIT.OK : EXIT.PARTIAL);
