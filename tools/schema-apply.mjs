#!/usr/bin/env node
/**
 * 把 schema-scan 的提案落成正式檔案（套用階段）。
 *
 * 分成獨立的第二支，理由與 demo-publish 一樣：寫入共用資料是半不可逆的動作，
 * 要有明確的單一入口，而且掃描可以重跑很多次、套用只該跑在確認過的提案上。
 *
 * 產出 content/schema/<repo>.json（新目錄，進版控，與 content/details 平行）。
 * 這是之後把 demo 變成真系統時，runtime 用來找到表格、後端用來建資料表的契約。
 *
 * 另外可選擇回填 content/details 的 records：
 *   預設只補「本來就沒有」的那 458 套。
 *   --fix-details 會連「有但不對」的一起修——實測 1,420 套裡有 1,340 套的
 *   records.columns 是 detail-template 寫死的樣板（編號/項目/負責人/期限/階段），
 *   與畫面上的表格不符。那會影響專案介紹頁的顯示，所以預設不動，要改請明示。
 *
 *   node tools/schema-apply.mjs [--dry-run] [--repo=a,b] [--include-review] [--fix-details]
 */
import fs from "node:fs";
import path from "node:path";
import { ROOT, EXIT, parseArgs, list, makeLogger, writeJson } from "./lib/forge-common.mjs";

const args = parseArgs();
const log = makeLogger({ quiet: Boolean(args.quiet) });
const DRY = Boolean(args["dry-run"]);
const PROPOSALS = path.join(ROOT, "docs", "_state", "schema-proposals.json");
const SCHEMA_DIR = path.join(ROOT, "content", "schema");
const DETAILS_DIR = path.join(ROOT, "content", "details");
const BACKUP_DIR = path.join(ROOT, "docs", "backups");

if (!fs.existsSync(PROPOSALS)) { log.error("找不到提案檔，先跑 tools/schema-scan.mjs"); process.exit(EXIT.BAD_INPUT); }
const { proposals, stats } = JSON.parse(fs.readFileSync(PROPOSALS, "utf8"));

const only = args.repo ? new Set(list(args.repo)) : null;
const wanted = Object.entries(proposals).filter(([repo, p]) => {
  if (only && !only.has(repo)) return false;
  if (p.readyState === "unsupported") return false;
  if (p.readyState === "needs-review" && !args["include-review"]) return false;
  return true;
});

log.step(`提案共 ${Object.keys(proposals).length} 套（ready ${stats.ready}、needs-review ${stats.needsReview}、unsupported ${stats.unsupported}）`);
log.info(`  本次將寫入 ${wanted.length} 套${args["include-review"] ? "（含待審）" : "（只含 ready）"}`);
if (!wanted.length) { log.warn("沒有可套用的項目"); process.exit(0); }

/* details 回填：預設只補沒有的，--fix-details 才連錯的一起修 */
const detailTargets = [];
for (const [repo, p] of wanted) {
  const dp = path.join(DETAILS_DIR, `${repo}.json`);
  if (!fs.existsSync(dp)) continue;
  const d = JSON.parse(fs.readFileSync(dp, "utf8"));
  const has = d.records && Array.isArray(d.records.columns) && d.records.columns.length;
  if (!has) detailTargets.push([repo, dp, d, "補缺"]);
  else if (args["fix-details"]) {
    const now = d.records.columns.map((c) => c.label).join("|");
    const real = p.tables[0].columns.map((c) => c.label).join("|");
    if (now !== real) detailTargets.push([repo, dp, d, "修正不符"]);
  }
}
log.info(`  details 回填 ${detailTargets.length} 套（${args["fix-details"] ? "補缺＋修正不符" : "只補缺，要修不符請加 --fix-details"}）`);

if (DRY) {
  log.step("dry-run：不寫任何檔");
  const [repo, p] = wanted[0];
  log.info(`  範例 ${repo} → content/schema/${repo}.json`);
  console.log(JSON.stringify({ repoName: repo, readyState: p.readyState, tables: p.tables }, null, 2).slice(0, 900) + "\n  …");
  for (const [r, , , why] of detailTargets.slice(0, 5)) log.info(`  details 將${why}：${r}`);
  process.exit(0);
}

/* 寫共用資料前先備份，沿用 demo-publish 的慣例 */
if (detailTargets.length) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const bak = path.join(BACKUP_DIR, `details-records-${stamp}.json`);
  writeJson(bak, Object.fromEntries(detailTargets.map(([r, , d]) => [r, d.records ?? null])));
  log.info(`  已備份原 records → ${path.relative(ROOT, bak)}`);
}

fs.mkdirSync(SCHEMA_DIR, { recursive: true });
let wroteSchema = 0, wroteDetails = 0;

for (const [repo, p] of wanted) {
  writeJson(path.join(SCHEMA_DIR, `${repo}.json`), {
    repoName: repo,
    generatedAt: new Date().toISOString(),
    readyState: p.readyState,
    ...(p.issues ? { issues: p.issues } : {}),
    tables: p.tables,
  });
  wroteSchema += 1;
}

for (const [repo, dp, d] of detailTargets) {
  const primary = proposals[repo].tables[0];
  d.records = {
    title: primary.title,
    columns: primary.columns.map((c) => ({ key: c.key, label: c.label })),
    rows: primary.seed,
  };
  writeJson(dp, d);
  wroteDetails += 1;
}

log.step(`已寫入 content/schema/ ${wroteSchema} 套、回填 details ${wroteDetails} 套`);
log.info("  下一步：node tools/schema-verify.mjs（起實例驗證資料真的存得住）");
