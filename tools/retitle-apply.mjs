#!/usr/bin/env node
/**
 * 套用 retitle-scan 的改名提案：projects-index.json 的 title、
 * content/details/<repo>.json 的 title，然後重建 catalog-index 與 recent。
 *
 * repoName／網址不動——名稱是給人看的，位址是給連結用的，改名不斷鏈。
 * 撞名防線：套用後任兩個專案不可同名，撞到的跳過並回報。
 *
 *   node tools/retitle-apply.mjs [--dry-run]
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { ROOT, EXIT, parseArgs, makeLogger, writeJson } from "./lib/forge-common.mjs";

const args = parseArgs();
const log = makeLogger({ quiet: false });
const DRY = Boolean(args["dry-run"]);
const PROPOSALS = path.join(ROOT, "docs", "_state", "retitle-proposals.json");
const INDEX = path.join(ROOT, "projects-index.json");

if (!fs.existsSync(PROPOSALS)) { log.error("找不到提案檔，先跑 retitle-scan.mjs"); process.exit(EXIT.BAD_INPUT); }
const state = JSON.parse(fs.readFileSync(PROPOSALS, "utf8"));
const catalog = JSON.parse(fs.readFileSync(INDEX, "utf8"));

const renames = new Map(
  Object.entries(state.reviewed).filter(([, v]) => v.new).map(([repo, v]) => [repo, v]),
);
log.step(`提案改名 ${renames.size} 個`);

/* 撞名檢查：以「套用後」的完整名單驗證 */
const finalTitles = new Map(); // title -> repoName
const skipped = [];
for (const p of catalog.projects) {
  const r = renames.get(p.repoName);
  const t = r ? r.new : p.title;
  if (finalTitles.has(t)) {
    if (r) { skipped.push({ repo: p.repoName, title: t, clashWith: finalTitles.get(t) }); renames.delete(p.repoName); }
    else log.warn(`既有名稱本來就撞名：${t}（${p.repoName} vs ${finalTitles.get(t)}）`);
    continue;
  }
  finalTitles.set(t, p.repoName);
}
if (skipped.length) log.warn(`撞名跳過 ${skipped.length} 個：${skipped.slice(0, 5).map((s) => s.title).join("、")}`);

let applied = 0, detailMissing = 0;
for (const p of catalog.projects) {
  const r = renames.get(p.repoName);
  if (!r) continue;
  if (r.old !== p.title) { log.warn(`  ${p.repoName} 目前名稱已變（${p.title}），跳過`); continue; }
  if (DRY) { log.info(`  ${p.title} → ${r.new}`); applied += 1; continue; }
  p.title = r.new;
  const dp = path.join(ROOT, "content", "details", `${p.repoName}.json`);
  if (fs.existsSync(dp)) {
    const d = JSON.parse(fs.readFileSync(dp, "utf8"));
    d.title = r.new;
    writeJson(dp, d);
  } else detailMissing += 1;
  applied += 1;
}

if (DRY) { log.step(`dry-run：將改 ${applied} 個，不寫檔`); process.exit(0); }

fs.writeFileSync(INDEX, JSON.stringify(catalog, null, 2) + "\n");
log.step(`已套用 ${applied} 個（details 缺檔 ${detailMissing}）`);

for (const tool of ["build-catalog-index.mjs", "build-recent.mjs"]) {
  const r = spawnSync(process.execPath, [path.join(ROOT, "tools", tool)], { cwd: ROOT, stdio: "inherit" });
  if (r.status !== 0) log.warn(`${tool} 結束碼 ${r.status}`);
}
writeJson(path.join(ROOT, "docs", "_state", "retitle-applied.json"), {
  at: new Date().toISOString(), applied, skippedClash: skipped,
});
