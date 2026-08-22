#!/usr/bin/env node
/**
 * 把前端寫死的專案數／產業分類數同步成 projects-index.json 的實際值。
 *
 * 這些數字散在 title、meta description、hero 文案、統計膠囊與導覽副標裡，
 * 每次新增專案都會失準，所以做成可重複執行的工具而不是手改。
 *
 *   node tools/sync-catalog-counts.mjs --dry-run
 *   node tools/sync-catalog-counts.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { ROOT, EXIT, parseArgs, makeLogger, loadCatalog } from "./lib/forge-common.mjs";

const args = parseArgs();
const log = makeLogger({ quiet: Boolean(args.quiet) });
const DRY = Boolean(args["dry-run"]);

const catalog = loadCatalog();
const SYSTEMS = catalog.projects.length;
const CATEGORIES = new Set(catalog.projects.map((p) => p.category).filter(Boolean)).size;

// 現役檔案；index.legacy.html 與 catalog.old.html 已無人引用，刻意不碰
const TARGETS = ["index.html", "catalog.html", "agents.html", "agents.js", "shared/jv-mobile-nav.js"];

/**
 * 每條規則的數字部分用 (\d{2,5}) 捕捉，替換成當前實際值。
 * 只在明確的語境中替換，避免動到無關的數字（例如色碼、尺寸、年份）。
 */
// 統計膠囊與數字磚把數字包在 <b> 裡、單位留在標籤外，需要精確比對。
// 不用通用的「容許任意標籤」樣式 —— \s 會吃掉換行，導致跨行誤配（實測過）。
const RULES = [
  [/(>)(\d{2,5})(<\/b>\s*系統)/g, () => SYSTEMS, 2],
  [/(>)(\d{2,5})(<\/b>\s*套可調度系統)/g, () => SYSTEMS, 2],
  [/(>)(\d{2,5})(<\/b><span>可調度系統)/g, () => SYSTEMS, 2],
  [/(>)(\d{2,5})(<\/b>\s*產業(?!分類))/g, () => CATEGORIES, 2],
  [/(\d{2,5})(\s*個 AI 產業系統)/g, () => SYSTEMS],
  [/(\d{2,5})(\s*個系統)/g, () => SYSTEMS],
  [/(\d{2,5})(\s*系統)(?!\s*類型)/g, () => SYSTEMS],
  [/(\d{2,5})(\s*套可調度系統)/g, () => SYSTEMS],
  [/(\d{2,5})(\s*套系統)/g, () => SYSTEMS],
  [/(\d{2,5})(\s*套 JVision 系統)/g, () => SYSTEMS],
  [/(\d{2,5})(\s*個可操作的 AI)/g, () => SYSTEMS],
  [/(\d{2,5})(\s*個真正能操作)/g, () => SYSTEMS],
  [/(\d{2,5})(\s*SYSTEMS)/g, () => SYSTEMS],
  [/(\d{2,5})(\s*個產業分類)/g, () => CATEGORIES],
  [/(\d{2,5})(\s*產業)(?!\s*系統|\s*分類)/g, () => CATEGORIES],
];

log.step(`目錄實況：${SYSTEMS} 個系統、${CATEGORIES} 個產業分類`);

let touched = 0;
const changes = [];
for (const rel of TARGETS) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) { log.warn(`找不到 ${rel}，跳過`); continue; }
  const before = fs.readFileSync(file, "utf8");
  let after = before;
  for (const rule of RULES) {
    const [pattern, value, numIndex = 1] = rule;
    after = after.replace(pattern, (...m) => {
      const whole = m[0];
      const num = m[numIndex];
      const next = String(value());
      if (num === next) return whole;
      const rebuilt = whole.replace(num, next);
      changes.push({ file: rel, from: whole.replace(/\s+/g, " ").trim().slice(0, 40), to: rebuilt.replace(/\s+/g, " ").trim().slice(0, 40) });
      return rebuilt;
    });
  }
  if (after !== before) {
    touched += 1;
    if (!DRY) fs.writeFileSync(file, after);
  }
}

if (!changes.length) { log.step("所有數字都已是最新，無需更動"); process.exit(EXIT.OK); }

log.step(`${DRY ? "將更動" : "已更動"} ${touched} 個檔案、${changes.length} 處`);
const grouped = {};
for (const c of changes) (grouped[c.file] ||= []).push(`${c.from} → ${c.to}`);
for (const [file, items] of Object.entries(grouped)) {
  log.info(`  ${file}`);
  for (const item of [...new Set(items)]) log.info(`    ${item}　×${items.filter((i) => i === item).length}`);
}
if (DRY) log.step("DRY RUN：未寫入");
process.exit(EXIT.OK);
