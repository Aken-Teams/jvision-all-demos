#!/usr/bin/env node
/**
 * 把許願池的一段需求文字，補完成可以直接建置的規格書，並排進產線佇列。
 *
 * 與 topics-from-titles 的差別：那支收到的是「已經決定好的系統名稱」，這支收到
 * 的是一段沒有結構的需求描述——所以連題目叫什麼、屬於哪個產業都要判斷。
 *
 *   node tools/wish-to-topic.mjs --id=<申請編號> [--front] [--dry-run]
 *
 * --front 插到佇列最前面（管理者按「立即製作」時用），預設排在最後。
 */
import fs from "node:fs";
import path from "node:path";
import { ROOT, EXIT, parseArgs, num, makeLogger, loadCatalog, loadClassifier,
         existingRepoDirs, SLUG_RE, coverageByCategory } from "./lib/forge-common.mjs";
import { runCodexWithRetry } from "./lib/codex-run.mjs";
import { buildExistingIndex, screenCandidates } from "./lib/topic-similarity.mjs";
import * as wishes from "./lib/wish-requests.mjs";

const args = parseArgs();
const log = makeLogger({ quiet: Boolean(args.quiet) });
const ID = args.id;
const FRONT = Boolean(args.front);
const DRY = Boolean(args["dry-run"]);
const QUEUE = path.join(ROOT, "docs", "_state", "agent-queue.json");
const SCHEMA = path.join(ROOT, "tools", "schemas", "topics-from-titles.schema.json");

if (!ID) { log.error("用法：node tools/wish-to-topic.mjs --id=<申請編號> [--front]"); process.exit(EXIT.BAD_INPUT); }
const wish = wishes.get(ROOT, ID);
if (!wish) { log.error(`找不到申請 ${ID}`); process.exit(EXIT.BAD_INPUT); }
log.step(`申請 ${ID}（${wish.who}）`);
log.info(`  需求：${wish.need.slice(0, 80)}${wish.need.length > 80 ? "…" : ""}`);

const catalog = loadCatalog();
const JV = loadClassifier();
const dirs = existingRepoDirs();
const CATEGORIES = coverageByCategory(catalog.projects).map((c) => c.category);
const TYPES = Object.keys(JV.TYPES);

const prompt = `你是 JVision 的產品企劃。有人在許願池描述了他的需求，請把它轉成一套可以做出來的系統規格書。

## 這個網站是什麼
每個題目會做成一個「純 UI 展示」的單頁系統 demo：繁體中文、6 個可切換的操作畫面、擬真假資料、無後端。
客群是台灣的中小企業與工廠。

## 使用者的原始需求
${wish.need}

## 規則
1. **givenTitle 請原樣填 "${ID}"**（這是申請編號，用來對位）。
2. title 是你為這套系統取的中文名稱，6-16 字，要讓人一看就知道解決什麼工作。
3. 需求可能寫得很口語、很發散。你的工作是**收斂成一套企業內部真的會導入的系統**，
   不是把他的每一句話都變成功能。抓住那個最痛的作業環節。
4. 若需求根本不適合做成企業系統（例如是消費者 App、純資訊查詢、或需要真實硬體才成立），
   仍然要產出最接近的企業內部系統版本，並在 differentiator 說明你做了什麼取捨。
5. category 必須是以下其中一個：${CATEGORIES.join("、")}
6. systemType 必須是以下其中一個：${TYPES.join("、")}
7. slug 用英文小寫連字號，不要加 jvision- 前綴。
8. description 60-120 字。modules 剛好 6 個，icon 用 Material Symbols Outlined 的名稱。
9. flowStages 剛好 6 個，依序對應那 6 個操作畫面，每個階段要有負責角色。
10. 六個模組必須能拆成六個彼此不同的畫面，不是同一個畫面換資料。

只輸出符合 schema 的 JSON，不要 Markdown、不要任何說明文字。`;

if (DRY) { console.log(prompt); process.exit(EXIT.OK); }

const r = await runCodexWithRetry({
  prompt, cwd: ROOT, sandbox: "read-only", schemaPath: SCHEMA,
  timeoutMs: num(args.timeout, 900) * 1000, model: args.model,
  onLog: () => process.stderr.write("."),
}, { retries: 2 });
process.stderr.write("\n");

if (!r.ok) {
  wishes.update(ROOT, ID, { note: `產生規格失敗：${r.error}`.slice(0, 200) });
  log.error(`codex 失敗：${r.error}`);
  process.exit(EXIT.CODEX_FAILED);
}
const topic = (r.json?.topics || [])[0];
if (!topic) {
  wishes.update(ROOT, ID, { note: "產生規格失敗：模型沒有回傳題目" });
  log.error("模型沒有回傳題目");
  process.exit(EXIT.BAD_OUTPUT);
}

const errors = [];
if (!SLUG_RE.test(String(topic.slug || ""))) errors.push("slug 格式");
if (!JV.TYPES[topic.systemType]) errors.push(`systemType「${topic.systemType}」不存在`);
if ((topic.modules || []).length !== 6) errors.push("modules 需 6 個");
if ((topic.flowStages || []).length !== 6) errors.push("flowStages 需 6 個");
if (dirs.has(`jvision-${topic.slug}`)) errors.push("repoName 已存在");
if (errors.length) {
  wishes.update(ROOT, ID, { note: `規格不合格：${errors.join("、")}` });
  log.error(`規格不合格：${errors.join("、")}`);
  process.exit(EXIT.BAD_OUTPUT);
}

const entry = { ...topic, repoName: `jvision-${topic.slug}`, fromWish: ID };

/* 去重只提醒不擋。這是人主動提出的需求，跟自動出題不同——要不要因為站上有
   類似的就不做，該由管理者決定。 */
const index = buildExistingIndex(catalog.projects,
  (p) => (p.systemType && JV.TYPES[p.systemType] ? p.systemType : JV.classify(p)));
const screened = screenCandidates([entry], index);
const similar = screened.rejected[0] || null;
if (similar) log.warn(`  ⚠ 與既有的「${similar.matchedTitle}」相近（${similar.gate} ${similar.score}），仍會排入`);

const queue = JSON.parse(fs.readFileSync(QUEUE, "utf8"));
queue.accepted = FRONT ? [entry, ...queue.accepted] : [...queue.accepted, entry];
fs.writeFileSync(QUEUE, JSON.stringify(queue, null, 2) + "\n");

wishes.update(ROOT, ID, {
  status: "queued",
  topic: entry,
  repoName: entry.repoName,
  note: similar ? `已排入（與「${similar.matchedTitle}」相近）` : "已排入產線",
});

log.step(`《${entry.title}》（${entry.category}）已排入佇列${FRONT ? "最前面" : "，輪到就做"}`);
log.info(`  repo：${entry.repoName}　佇列共 ${queue.accepted.length} 題`);
