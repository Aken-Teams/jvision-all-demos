#!/usr/bin/env node
/**
 * 上架 — 唯一會寫 projects-index.json 的腳本。
 *
 * 刻意做成獨立第三支而非 demo-forge 的旗標：寫目錄是整條流程唯一
 * 不可逆、且會動到 538 個既有專案共用檔的動作，必須有明確的單一入口。
 *
 *   node tools/demo-publish.mjs --repo=jvision-xxx --dry-run
 *   node tools/demo-publish.mjs --repo=jvision-xxx,jvision-yyy
 *   node tools/demo-publish.mjs --all-verified
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import {
  ROOT, EXIT, DEMOS_DIR, DETAILS_DIR, parseArgs, list, makeLogger,
  loadCatalog, saveCatalog, loadManifest, saveManifest, upsertEntry, nextProjectId,
} from "./lib/forge-common.mjs";

const args = parseArgs();
const log = makeLogger({ quiet: Boolean(args.quiet) });
const DRY = Boolean(args["dry-run"]);

const manifest = loadManifest();
let targets = args.repo ? list(args.repo)
  : args["all-verified"] ? manifest.entries.filter((e) => e.state === "verified").map((e) => e.repoName)
  : [];

if (!targets.length) {
  log.error("請指定 --repo=<repo,...> 或 --all-verified");
  process.exit(EXIT.BAD_INPUT);
}

const catalog = loadCatalog();
const known = new Set(catalog.projects.map((p) => p.repoName));
const additions = [];
let nextId = nextProjectId(catalog.projects);

for (const repoName of targets) {
  const entry = manifest.entries.find((e) => e.repoName === repoName);
  const detailPath = path.join(DETAILS_DIR, `${repoName}.json`);
  const htmlPath = path.join(DEMOS_DIR, repoName, "index.html");

  if (known.has(repoName)) { log.warn(`${repoName} 已在目錄中，跳過`); continue; }
  if (!fs.existsSync(htmlPath)) { log.error(`${repoName} 缺少 index.html，跳過`); continue; }
  if (!fs.existsSync(detailPath)) { log.error(`${repoName} 缺少 details JSON，跳過`); continue; }
  if (entry && entry.state !== "verified" && !args.force) {
    log.error(`${repoName} 狀態為 ${entry.state}（非 verified），要強制上架請加 --force`);
    continue;
  }

  const D = JSON.parse(fs.readFileSync(detailPath, "utf8"));
  const id = nextId++;
  additions.push({
    id,
    category: D.category,
    demoUrl: `/demos/${repoName}/`,
    githubUrl: `https://github.com/JVision-pj/${repoName}`,
    repoName,
    localPath: `demos/${repoName}`,
    singleDomain: true,
    description: D.hero?.tagline || D.system?.summary || "",
    title: D.title,
    businessSituation: D.problem?.situation || "",
    primaryUser: (D.system?.users || []).join("、"),
    dailyUse: D.system?.dailyUse || "",
    operationalMetrics: D.flow?.inputs || [],
    contentDepth: "full-scenario",
    contentVersion: catalog.contentVersion || "2026.07-practical-v1",
    customerWorkflow: {
      eyebrow: `${D.title}實際作業`,
      steps: (D.flow?.stages || []).map((s) => s.title),
      choices: (D.flow?.decisions || []).map((d) => d.label),
      fields: (D.records?.columns || []).map((c) => c.label),
      output: D.flow?.output || "",
    },
    industry: D.category,
  });
}

if (!additions.length) { log.error("沒有可上架的項目"); process.exit(EXIT.BAD_INPUT); }

log.step(`將新增 ${additions.length} 筆到目錄`);
for (const p of additions) log.info(`  id ${p.id}　${p.title}（${p.category}）→ ${p.demoUrl}`);
log.info(`  projects: ${catalog.projects.length} → ${catalog.projects.length + additions.length}`);
log.info(`  total: ${catalog.total} → ${catalog.projects.length + additions.length}`);

if (DRY) {
  console.log("\n" + JSON.stringify(additions[0], null, 2));
  log.step("DRY RUN：未寫入");
  process.exit(EXIT.OK);
}

// 1.1 MB 的共用檔，寫入前先備份一份（git 之外的第二道保險）
const backupDir = path.join(ROOT, "docs", "backups");
fs.mkdirSync(backupDir, { recursive: true });
const backup = path.join(backupDir, `projects-index.${Date.now()}.json`);
fs.copyFileSync(path.join(ROOT, "projects-index.json"), backup);
log.info(`  備份：${path.relative(ROOT, backup)}`);

catalog.projects.push(...additions);
catalog.total = catalog.projects.length;
if (typeof catalog.copied === "number") catalog.copied = catalog.projects.length;
saveCatalog(catalog);

for (const p of additions) upsertEntry(manifest, { repoName: p.repoName, state: "published", publishedId: p.id, publishedAt: new Date().toISOString() });
saveManifest(manifest);

/* 首頁的「最近新增」要跟著更新。接在上架這個唯一入口，而不是塞進 agent 腳本——
   任何管道上架（agent、手動、補救）都會更新，不會有某條路徑忘了跑。 */
{
  for (const [script, why] of [
    ["build-recent.mjs", "首頁會顯示上一次的最近新增"],
    ["build-catalog-index.mjs", "目錄頁會退回讀完整的 projects-index.json，慢但不會壞"],
  ]) {
    const r = spawnSync(process.execPath, [path.join(ROOT, "tools", script)], { cwd: ROOT, encoding: "utf8" });
    log.info(r.status === 0 ? `  ${(r.stdout || "").trim().split("\n")[0]}` : `  ⚠ ${script} 失敗（${why}）`);
  }
}

log.step("已寫入 projects-index.json，執行既有稽核：");
/* 畫面上寫的「N 個系統／N 個產業分類」跟著一起更新。
   sync-catalog-counts 本來就存在，但只有 agent-loop 在呼叫它；
   從別的路徑上架（例如手動 demo-publish）時就沒人同步，數字於是慢慢過期
   ——實測目錄已經 1944 而畫面上還寫 1943，包含首頁 <title>。
   這裡是唯一會寫 projects-index.json 的地方，同步掛在這裡才不會有漏網的路徑。 */
for (const [label, script] of [["數字同步", "tools/sync-catalog-counts.mjs"], ["結構稽核", "tools/audit-structure.js"], ["描述相似度", "tools/audit-project-description-similarity.mjs"]]) {
  const r = spawnSync(process.execPath, [path.join(ROOT, script)], { cwd: ROOT, encoding: "utf8" });
  log.info(`  ${label}：${r.status === 0 ? "通過" : "有發現（exit " + r.status + "）"}`);
  if (r.status !== 0) log.info((r.stdout || "").trim().split("\n").slice(-8).map((l) => "    " + l).join("\n"));
}
process.exit(EXIT.OK);
