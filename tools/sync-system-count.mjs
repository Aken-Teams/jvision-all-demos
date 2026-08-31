#!/usr/bin/env node
/**
 * 把畫面上寫的「N 個系統」同步成目錄裡真正的數量。
 *
 * 這個數字散在四個檔案的十個地方，每次上架都要手動改，於是它總是過期的
 * ——實測時目錄是 1944 套，畫面上寫的是 1943，而首頁的 <title> 是給搜尋引擎
 * 看的第一行字。
 *
 * 為什麼不改成執行時從 catalog 讀：<title> 與 <meta description> 必須是靜態的，
 * 爬蟲不會跑 JS。所以正解是「上架時同步」而不是「載入時計算」，
 * demo-publish 會呼叫這一支。
 *
 *   node tools/sync-system-count.mjs [--dry-run]
 */
import fs from "node:fs";
import path from "node:path";
import { ROOT, EXIT, parseArgs, makeLogger, loadCatalog } from "./lib/forge-common.mjs";

const args = parseArgs();
const log = makeLogger({ quiet: Boolean(args.quiet) });
const DRY = Boolean(args["dry-run"]);

const total = loadCatalog().projects.length;
if (!total) { log.error("目錄是空的，不動任何檔案"); process.exit(EXIT.BAD_INPUT); }

/* 用前後文錨定，不是見到四位數就換——頁面上還有年份、金額、其他統計數字。
   每一條都必須框住那個數字本身，替換時只動 $1 那一段。 */
const RULES = [
  [/(\d{3,5})(\s*個系統)/g, "$2"],
  [/(\d{3,5})(\s*套系統)/g, "$2"],
  [/(\d{3,5})(\s*個 AI 產業系統)/g, "$2"],
  [/(\d{3,5})(\s*個可操作的)/g, "$2"],
  [/(對\s*)(\d{3,5})(\s*套 JVision)/g, null],
  [/(比對\s*)(\d{3,5})(\s*套系統)/g, null],
  [/(全部\s*)(\d{3,5})(\s*個系統)/g, null],
  [/(id="totalCount"[^>]*>)(\d{3,5})(<)/g, null],
];

const FILES = ["index.html", "catalog.html", "agents.js", "shared/jv-mobile-nav.js"];
let touched = 0;

for (const rel of FILES) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) { log.warn(`跳過 ${rel}（不存在）`); continue; }
  const before = fs.readFileSync(file, "utf8");
  let after = before;
  let hits = 0;

  for (const [re, tail] of RULES) {
    after = after.replace(re, (m, ...g) => {
      hits += 1;
      /* g[0] 是第一個括號，不是「尾巴」。兩種形狀：
         數字在最前面（$1=數字、$2=尾巴），或被前後文夾住（$1=前、$2=數字、$3=後）。 */
      return tail === null ? `${g[0]}${total}${g[2]}` : `${total}${g[1]}`;
    });
  }

  if (after === before) { log.info(`${rel}　已是 ${total}，不用動`); continue; }
  touched += 1;
  log.step(`${rel}　${hits} 處 → ${total}`);
  if (!DRY) {
    /* 先寫 .tmp 再改名：寫到一半被讀到的話，拿到的是半個檔案。 */
    const tmp = `${file}.tmp`;
    fs.writeFileSync(tmp, after);
    fs.renameSync(tmp, file);
  }
}

log.info(`${DRY ? "（試跑）" : ""}系統數 ${total}，更新 ${touched} 個檔案`);
process.exit(EXIT.OK);
