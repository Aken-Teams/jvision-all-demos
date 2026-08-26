#!/usr/bin/env node
/**
 * 把「指定的系統名稱清單」補完成可以直接建置的規格書。
 *
 * 與 topic-scout 的分工：那支是自己找題目（缺口分析 → 圓桌討論 → 收斂），
 * 這支的題目是外部給定的，只負責補完欄位。所以不跑圓桌、不算配額，
 * 但格式驗證與六道去重閘照跑——差別在於去重命中時只是「標記並回報」，
 * 不會擋下來：題目是人指定的，重不重複由人決定。
 *
 *   node tools/topics-from-titles.mjs <標題檔> --out=<輸出.json> [--timeout=900]
 *
 * 標題檔一行一個系統名稱，空行與 # 開頭的行會略過。
 */
import fs from "node:fs";
import path from "node:path";
import { ROOT, EXIT, parseArgs, num, makeLogger, loadCatalog, loadClassifier,
         writeJson, existingRepoDirs, SLUG_RE, coverageByCategory } from "./lib/forge-common.mjs";
import { runCodexWithRetry } from "./lib/codex-run.mjs";
import { buildExistingIndex, screenCandidates } from "./lib/topic-similarity.mjs";

const args = parseArgs();
const log = makeLogger({ quiet: Boolean(args.quiet) });
const [titleFile] = args._;
const OUT = args.out ? path.resolve(args.out) : path.join(ROOT, "docs", "_state", "given-topics.json");
const SCHEMA = path.join(ROOT, "tools", "schemas", "topics-from-titles.schema.json");
const BATCH = num(args.batch, 10);

if (!titleFile || !fs.existsSync(titleFile)) {
  log.error("用法：node tools/topics-from-titles.mjs <標題檔> --out=<輸出.json>");
  process.exit(EXIT.BAD_INPUT);
}

const titles = fs.readFileSync(titleFile, "utf8").split("\n")
  .map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
log.step(`指定題目 ${titles.length} 個`);

const catalog = loadCatalog();
const JV = loadClassifier();
const dirs = existingRepoDirs();
const catCoverage = coverageByCategory(catalog.projects);
const CATEGORIES = catCoverage.map((c) => c.category);
const TYPES = Object.keys(JV.TYPES);

function buildPrompt(chunk) {
  /* 只餵產業與類型清單，不餵既有標題。這支不需要避開既有題目——題目已經
     指定好了，餵一堆既有標題只會讓模型想「改一下比較不重複」，反而偏離指定。 */
  return `你是 JVision 的產品企劃。以下是**已經決定要做**的系統名稱，請為每一個補完規格書。

## 這個網站是什麼
每個題目會做成一個「純 UI 展示」的單頁系統 demo：繁體中文、6 個可切換的操作畫面、擬真假資料、無後端。
客群是台灣的中小企業與工廠。

## 要補完的系統名稱（共 ${chunk.length} 個，一個都不能少、不能改題目）
${chunk.map((t, i) => `${i + 1}. ${t}`).join("\n")}

## 規則
1. **givenTitle 必須原樣抄回上面的名稱**，用來對位。
2. **title 是站上要顯示的中文名稱**：把英文縮寫展開成看得懂的中文，6-16 字。
   例如「IAM 權限管理平台」可以是「員工系統權限控管台」；縮寫太專業時在描述裡解釋。
   但不可以改變題目講的是什麼。
3. category 必須是以下其中一個：${CATEGORIES.join("、")}
4. systemType 必須是以下其中一個：${TYPES.join("、")}
5. slug 用英文小寫連字號，看得出是哪一套，不要加 jvision- 前綴。
6. description 60-120 字，講清楚這套系統解決什麼工作。
7. modules 剛好 6 個，icon 用 Material Symbols Outlined 的名稱（例如 inventory、rule、insights）。
8. flowStages 剛好 6 個，依序對應那 6 個操作畫面，每個階段要有負責角色。
9. 六個模組必須能拆成**六個彼此不同的畫面**，不是同一個畫面換資料。
10. 不可依賴真實後端、硬體或即時裝置才成立（demo 是純 UI）。

只輸出符合 schema 的 JSON，不要 Markdown、不要任何說明文字。`;
}

/* 分批送。一次 20 個題目、每個都要 6 模組 6 階段，輸出長度會逼近上限，
   實測長輸出的結構化回應比較容易逾時；分批也讓失敗只影響那一批。 */
const chunks = [];
for (let i = 0; i < titles.length; i += BATCH) chunks.push(titles.slice(i, i + BATCH));

const produced = [];
for (const [i, chunk] of chunks.entries()) {
  log.step(`── 第 ${i + 1}/${chunks.length} 批（${chunk.length} 題）──`);
  const r = await runCodexWithRetry({
    prompt: buildPrompt(chunk), cwd: ROOT, sandbox: "read-only",
    schemaPath: SCHEMA, timeoutMs: num(args.timeout, 900) * 1000, model: args.model,
    onLog: () => process.stderr.write("."),
  }, { retries: 2 });
  process.stderr.write("\n");
  if (!r.ok) { log.error(`  失敗：${r.error}`); continue; }
  const got = r.json?.topics || [];
  log.info(`  收到 ${got.length} 題`);
  produced.push(...got);
}

/* 對位檢查：模型可能漏題或自己多生。以指定清單為準逐一比對。 */
const byGiven = new Map(produced.map((t) => [String(t.givenTitle || "").trim(), t]));
const missing = titles.filter((t) => !byGiven.has(t));
if (missing.length) log.warn(`沒有補完的題目 ${missing.length} 個：${missing.join("、")}`);

const valid = [];
const problems = [];
for (const given of titles) {
  const t = byGiven.get(given);
  if (!t) { problems.push({ givenTitle: given, reason: "模型沒有回傳這一題" }); continue; }
  const errors = [];
  if (!SLUG_RE.test(String(t.slug || ""))) errors.push("slug 格式");
  if (!JV.TYPES[t.systemType]) errors.push(`systemType「${t.systemType}」不存在`);
  if ((t.modules || []).length !== 6) errors.push("modules 需 6 個");
  if ((t.flowStages || []).length !== 6) errors.push("flowStages 需 6 個");
  if (dirs.has(`jvision-${t.slug}`)) errors.push("repoName 已存在");
  if (errors.length) { problems.push({ ...t, reason: "格式不合", detail: errors.join("、") }); continue; }
  valid.push({ ...t, repoName: `jvision-${t.slug}` });
}

/* 去重只做標記，不擋。題目是人指定的，要不要因為相近而放棄由人決定。 */
const drafts = [];
const published = new Set(catalog.projects.map((p) => p.repoName));
for (const repo of dirs) {
  if (published.has(repo)) continue;
  const detail = path.join(ROOT, "content", "details", `${repo}.json`);
  if (!fs.existsSync(detail)) continue;
  try {
    const d = JSON.parse(fs.readFileSync(detail, "utf8"));
    if (d.title) drafts.push({ repoName: repo, title: d.title, description: d.hero?.tagline || "", category: d.category, systemType: d.systemType });
  } catch { /* 壞掉的 details 不影響 */ }
}
const index = buildExistingIndex([...catalog.projects, ...drafts],
  (p) => (p.systemType && JV.TYPES[p.systemType] ? p.systemType : JV.classify(p)));
const screened = screenCandidates(valid, index);
const flagged = new Map(screened.rejected.map((r) => [r.repoName, r]));
const accepted = valid.map((t) => {
  const hit = flagged.get(t.repoName);
  return hit ? { ...t, similarTo: hit.duplicateOf, similarTitle: hit.matchedTitle, similarScore: hit.score, similarGate: hit.gate } : t;
});

writeJson(OUT, {
  generatedAt: new Date().toISOString(),
  source: path.relative(ROOT, path.resolve(titleFile)),
  catalogSize: catalog.projects.length,
  stats: { given: titles.length, accepted: accepted.length, problems: problems.length, flagged: flagged.size },
  accepted, problems,
});

log.step(`完成：可建置 ${accepted.length}／指定 ${titles.length}，有問題 ${problems.length}，與既有相近 ${flagged.size}`);
for (const p of problems) log.info(`  ✖ ${p.givenTitle || p.title}　${p.reason}${p.detail ? `：${p.detail}` : ""}`);
for (const a of accepted.filter((x) => x.similarTo)) log.info(`  ⚠ ${a.title}　與「${a.similarTitle}」相近（${a.similarGate} ${a.similarScore}）——仍會建置`);
process.exit(problems.length ? EXIT.PARTIAL : EXIT.OK);
