#!/usr/bin/env node
/**
 * 把「畫面上根本沒有表格」的 demo 的資料表定義收回。
 *
 * 這些 demo 的資料是用卡片、時間軸、清單排出來的，不是 <table>。
 * jv-live 是靠 <th> 的文字去 DOM 找表，找不到就什麼都不綁——
 * 但 content/schema 裡還留著更早以前擷取到的欄位，於是平台以為它可以複製。
 * 客戶複製之後拿到的是一套「畫面看得到、輸入存不住、而且不報錯」的系統，
 * 那比直接說「這一套還不能複製」糟很多：他要用一陣子才會發現，
 * 而且不會知道是哪一步出的問題。
 *
 * 拿掉 schema 之後，既有機制就會自動做對的事：
 *   /api/catalog/stats 把它列進 noSchema
 *   → 目錄卡片顯示「暫不開放複製」並擋住點擊
 *   → /api/templates/copy 回 409「這一套還沒有資料表定義」
 * 所以這裡只要移除檔案，不必改任何介面。
 *
 * 不是刪掉就算了：搬到 docs/_state/retired-schema/ 留著，並記下當時的證據。
 * 那個 attic 加清單的做法救過一次——見下方。
 *
 * ── 必須明確指定要收哪幾套 ──
 * 這一支原本會依 audit-unsupported-schema 的分類整批收「畫面沒有表格」的那些，
 * 結果一次收掉 121 套刻意設計的 schema：它們是 schema-design.mjs 讓 codex 依
 * 畫面內容設計出來的，存在的目的就是讓那些「資料用 div 排版」的 demo 也能被
 * 複製成有資料層的系統。它們本來就不對應畫面上的 <table>，因為那些畫面沒有表格。
 *
 * 「畫面上有沒有表格」回答不了「這份 schema 該不該存在」。所以不再提供整批模式，
 * 要收哪幾套由呼叫端指名——沒有名單就不動手。
 *
 *   node tools/retire-unbindable-schema.mjs --repos=a,b [--dry-run]
 *   node tools/retire-unbindable-schema.mjs --restore [--repos=a,b]
 */
import fs from "node:fs";
import path from "node:path";
import { ROOT, EXIT, parseArgs, list, makeLogger, writeJson } from "./lib/forge-common.mjs";

const args = parseArgs();
const log = makeLogger({ quiet: Boolean(args.quiet) });
const DRY = Boolean(args["dry-run"]);
const AUDIT = path.join(ROOT, "docs", "_state", "unsupported-schema-audit.json");
const SCHEMA_DIR = path.join(ROOT, "content", "schema");
const ATTIC = path.join(ROOT, "docs", "_state", "retired-schema");
const LEDGER = path.join(ROOT, "docs", "_state", "retired-schema.json");

if (args.restore) {
  /* 還原：demo 補上表格之後把 schema 放回去。 */
  const ledger = JSON.parse(fs.readFileSync(LEDGER, "utf8"));
  const only = args.repos ? new Set(list(args.repos)) : null;
  let back = 0;
  for (const row of ledger.retired) {
    if (only && !only.has(row.repo)) continue;
    const from = path.join(ATTIC, `${row.repo}.json`);
    if (!fs.existsSync(from)) continue;
    if (!DRY) fs.copyFileSync(from, path.join(SCHEMA_DIR, `${row.repo}.json`));
    back += 1;
  }
  log.step(`還原 ${back} 套${DRY ? "（試跑）" : ""}`);
  process.exit(EXIT.OK);
}

/* 一定要指名。整批依「畫面沒有表格」動手會誤殺 schema-design 刻意產生的那些。 */
if (!args.repos) {
  log.error("請用 --repos=a,b 指名要收回哪幾套");
  log.info("  不提供整批模式：「畫面上有沒有表格」回答不了「這份 schema 該不該存在」。");
  log.info("  designedBy: codex 的那些是 schema-design.mjs 刻意產生的，收掉會讓 demo 不能複製。");
  process.exit(EXIT.BAD_INPUT);
}
const want = new Set(list(args.repos));
const byRepo = new Map((JSON.parse(fs.readFileSync(AUDIT, "utf8")).rows || []).map((r) => [r.repo, r]));
const targets = [...want].map((repo) => byRepo.get(repo) || { repo });
if (!targets.length) { log.warn("沒有要處理的"); process.exit(EXIT.OK); }

/* 刻意設計出來的 schema 要多問一句。一次誤收 121 套的教訓：
   它們看起來「跟畫面對不上」，但那不是壞掉，是它們本來就不對應畫面上的表格。 */
for (const t of targets) {
  const f = path.join(SCHEMA_DIR, `${t.repo}.json`);
  if (!fs.existsSync(f)) continue;
  try {
    const sc = JSON.parse(fs.readFileSync(f, "utf8"));
    if ((sc.tables || []).some((x) => x.designedBy) && !args.force) {
      log.error(`${t.repo} 的 schema 是刻意設計的（designedBy）——確定要收就加 --force`);
      process.exit(EXIT.BAD_INPUT);
    }
  } catch { /* 讀不掉就當普通的 */ }
}

log.step(`要收回 ${targets.length} 套的資料表定義${DRY ? "（試跑）" : ""}`);
if (!DRY) fs.mkdirSync(ATTIC, { recursive: true });

const retired = [];
let missing = 0;
for (const t of targets) {
  const src = path.join(SCHEMA_DIR, `${t.repo}.json`);
  if (!fs.existsSync(src)) { missing += 1; continue; }
  if (!DRY) {
    fs.copyFileSync(src, path.join(ATTIC, `${t.repo}.json`));
    fs.rmSync(src);
  }
  retired.push({ repo: t.repo, why: "畫面上沒有任何表格", domTables: t.domTables ?? 0,
    schemaTables: t.schemaTables ?? 0, at: new Date().toISOString() });
}

log.step(`收回 ${retired.length} 套${missing ? `（另有 ${missing} 套本來就沒有 schema）` : ""}`);
if (DRY) { log.info("dry-run：不動任何檔"); process.exit(EXIT.OK); }

writeJson(LEDGER, {
  at: new Date().toISOString(),
  note: "這些 demo 的畫面沒有表格，jv-live 綁不上任何東西，所以先不開放複製。"
    + "原本的 schema 留在 docs/_state/retired-schema/，補上表格後用 --restore 放回去。",
  retired,
});
log.info(`  原檔留在 ${path.relative(ROOT, ATTIC)}/`);
log.info(`  清單：${path.relative(ROOT, LEDGER)}`);
log.info("  目錄卡片會自動變成「暫不開放複製」，不需要改介面");
process.exit(EXIT.OK);
