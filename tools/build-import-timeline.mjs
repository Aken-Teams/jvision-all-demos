#!/usr/bin/env node
/**
 * 產生 content/import-timeline.json：每個專案的導入時間。
 *
 * projects-index.json 沒有任何日期欄位，所以時間要從兩處推導：
 *   1. docs/DEMO_FORGE_MANIFEST.json 的 builtAt / publishedAt（本批 473 套才有）
 *   2. git 首次加入 demos/<repo>/ 的 author date（涵蓋全部，含早期匯入的）
 *
 * git 的部分用單次 log 掃完再比對，不對 1011 個目錄各跑一次 git log
 * （實測那樣要 30 秒以上）。
 *
 *   node tools/build-import-timeline.mjs [--out=content/import-timeline.json]
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { ROOT, EXIT, parseArgs, makeLogger, loadCatalog, loadManifest } from "./lib/forge-common.mjs";

const args = parseArgs();
const log = makeLogger({ quiet: Boolean(args.quiet) });
const OUT = path.resolve(ROOT, args.out || "content/import-timeline.json");

const MARK = "@@COMMIT@@";

/** 一次 git log 掃出每個 demo 目錄最早出現的時間。 */
function firstSeenFromGit() {
  const r = spawnSync("git", [
    "log", "--reverse", "--diff-filter=A", "--name-only",
    `--pretty=format:${MARK}%aI|%h|%s`, "--", "demos/",
  ], { cwd: ROOT, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  if (r.status !== 0) { log.warn(`git log 失敗：${(r.stderr || "").slice(0, 120)}`); return new Map(); }

  const seen = new Map();
  let stamp = null; let sha = null; let subject = null;
  for (const line of r.stdout.split("\n")) {
    if (line.startsWith(MARK)) {
      const parts = line.slice(MARK.length).split("|");
      stamp = parts[0];
      sha = parts[1];
      subject = parts.slice(2).join("|");
      continue;
    }
    const m = line.match(/^demos\/([^/]+)\//);
    if (!m || seen.has(m[1])) continue;
    seen.set(m[1], { at: stamp, commit: sha, subject });
  }
  return seen;
}

const catalog = loadCatalog();
const manifest = loadManifest();
const byRepo = new Map(manifest.entries.map((e) => [e.repoName, e]));
const git = firstSeenFromGit();

let fromManifest = 0; let fromGit = 0; let unknown = 0;
const rows = catalog.projects.map((p) => {
  const entry = byRepo.get(p.repoName);
  const g = git.get(p.repoName);
  /* 以 git 首次加入為「導入時間」——那是檔案真正進到這個 repo 的時刻。
     manifest 的 publishedAt 是「進到目錄的時刻」，兩者分開記，因為本批
     473 套是先建置、隔一段時間才上架的。 */
  /* manifest 的 createdAt 是該 demo 實際建置完成的時刻，精確到秒；
     git 首次加入只精確到「我哪天 commit 的」，同一批會全部擠在一天。
     兩者都有時取前者，才看得出 11 小時建置期間的產出節奏。 */
  const importedAt = entry?.createdAt || g?.at || null;
  if (entry?.createdAt) fromManifest += 1;
  else if (g) fromGit += 1;
  else unknown += 1;
  return {
    id: p.id,
    repoName: p.repoName,
    title: p.title,
    category: p.category,
    sourceGroup: p.sourceGroup || null,
    importedAt,
    committedAt: g?.at || null,
    importCommit: g?.commit || null,
    importSubject: g?.subject || null,
    publishedAt: entry?.publishedAt || null,
    origin: entry?.createdAt ? "manifest" : g ? "git" : "unknown",
  };
});

rows.sort((a, b) => String(a.importedAt || "").localeCompare(String(b.importedAt || "")) || a.id - b.id);

/** 依日期彙總，供前端直接畫時間軸。 */
const byDay = new Map();
for (const r of rows) {
  const day = (r.importedAt || "").slice(0, 10) || "未知";
  const bucket = byDay.get(day) || { date: day, count: 0, subjects: new Set(), categories: new Set() };
  bucket.count += 1;
  if (r.importSubject) bucket.subjects.add(r.importSubject);
  if (r.category) bucket.categories.add(r.category);
  byDay.set(day, bucket);
}

const payload = {
  generatedAt: new Date().toISOString(),
  total: rows.length,
  resolved: rows.length - unknown,
  days: [...byDay.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((d) => ({ date: d.date, count: d.count, subjects: [...d.subjects].slice(0, 4), categories: d.categories.size })),
  projects: rows,
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(payload, null, 2) + "\n");

log.info(`已寫入 ${path.relative(ROOT, OUT)}`);
log.info(`  ${rows.length} 個專案　git 推導 ${fromGit}　manifest 推導 ${fromManifest}　無法判定 ${unknown}`);
log.info(`  導入日期共 ${payload.days.length} 天，最早 ${payload.days[0]?.date}，最新 ${payload.days.at(-1)?.date}`);
process.exit(unknown === rows.length ? EXIT.BAD_OUTPUT : EXIT.OK);
