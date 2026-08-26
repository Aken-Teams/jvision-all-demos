#!/usr/bin/env node
/**
 * 把 codex 已經產好、但父行程來不及讀走的題目救回來。
 *
 * codex exec -o 寫出的檔案就是完整的結構化輸出。實測出題行程被外部訊號帶走時，
 * 檔案已經落地、內容完好，重跑一次等於白白再付一次圓桌加主席的錢。
 *
 *   node tools/salvage-topics.mjs <codex-out 檔> <輸出.json> [--count=50]
 */
import fs from "node:fs";
import path from "node:path";
import { ROOT, EXIT, parseArgs, num, makeLogger, loadCatalog, loadClassifier, writeJson, existingRepoDirs, SLUG_RE } from "./lib/forge-common.mjs";
import { buildExistingIndex, screenCandidates } from "./lib/topic-similarity.mjs";

const args = parseArgs();
const log = makeLogger({});
const [src, out] = args._;
if (!src || !out) { log.error("用法：node tools/salvage-topics.mjs <codex-out 檔> <輸出.json> [--count=N]"); process.exit(EXIT.BAD_INPUT); }
const COUNT = num(args.count, 50);

const topics = JSON.parse(fs.readFileSync(src, "utf8")).topics || [];
log.step(`讀入 ${topics.length} 題`);

const catalog = loadCatalog();
const JV = loadClassifier();
const dirs = existingRepoDirs();

/* 去重池要含「已建置但未上架」的 demo，否則它們對標題與全文比對完全隱形。 */
function drafts() {
  const published = new Set(catalog.projects.map((p) => p.repoName));
  const rows = [];
  for (const repo of dirs) {
    if (published.has(repo)) continue;
    const detail = path.join(ROOT, "content", "details", `${repo}.json`);
    if (!fs.existsSync(detail)) continue;
    try {
      const d = JSON.parse(fs.readFileSync(detail, "utf8"));
      if (d.title) rows.push({ repoName: repo, title: d.title, description: d.hero?.tagline || "", category: d.category, systemType: d.systemType });
    } catch { /* 壞掉的 details 不影響 */ }
  }
  return rows;
}

const pool = [...catalog.projects, ...drafts()];
const index = buildExistingIndex(pool, (p) => (p.systemType && JV.TYPES[p.systemType] ? p.systemType : JV.classify(p)));
log.info(`去重池 ${pool.length} 筆`);

const valid = [];
const rejected = [];
for (const t of topics) {
  const errors = [];
  if (!SLUG_RE.test(String(t.slug || ""))) errors.push("slug 格式");
  if (!JV.TYPES[t.systemType]) errors.push("systemType 不存在");
  if ((t.modules || []).length !== 6) errors.push("modules 需 6 個");
  if ((t.flowStages || []).length !== 6) errors.push("flowStages 需 6 個");
  if (String(t.title || "").length < 3) errors.push("title 過短");
  if (dirs.has(`jvision-${t.slug}`)) errors.push("repoName 已存在");
  if (errors.length) rejected.push({ ...t, reason: "格式不合", detail: errors.join("、") });
  else valid.push({ ...t, repoName: `jvision-${t.slug}` });
}

const screened = screenCandidates(valid, index);
/* 直接切前 N 筆會照模型的輸出順序切，而它是照產業分組輸出的——實測取前 50
   剛好把最後兩個產業整批切掉。改成各產業輪流取一題，數量少的產業會先被取完，
   剩下的名額自然流向題目多的產業。 */
const buckets = new Map();
for (const t of screened.accepted) {
  if (!buckets.has(t.category)) buckets.set(t.category, []);
  buckets.get(t.category).push(t);
}
const accepted = [];
while (accepted.length < COUNT) {
  let took = 0;
  for (const list of buckets.values()) {
    if (accepted.length >= COUNT) break;
    if (!list.length) continue;
    accepted.push(list.shift());
    took += 1;
  }
  if (!took) break;
}
rejected.push(...screened.rejected);

writeJson(out, {
  generatedAt: new Date().toISOString(),
  salvagedFrom: src,
  catalogSize: catalog.projects.length,
  stats: { read: topics.length, accepted: accepted.length, rejected: rejected.length },
  accepted,
  rejected,
});

log.step(`通過 ${accepted.length}／目標 ${COUNT}，格式不合或重複 ${rejected.length}`);
const byCat = {};
for (const a of accepted) byCat[a.category] = (byCat[a.category] || 0) + 1;
log.info(`  產業分佈：${Object.entries(byCat).map(([k, v]) => `${k} ${v}`).join("、")}`);
for (const r of rejected.slice(0, 8)) log.info(`  ✖ ${r.title}　${r.reason}${r.matchedTitle ? `（撞到「${r.matchedTitle}」${r.score}）` : ""}${r.detail ? `：${r.detail}` : ""}`);
process.exit(accepted.length ? EXIT.OK : EXIT.PARTIAL);
