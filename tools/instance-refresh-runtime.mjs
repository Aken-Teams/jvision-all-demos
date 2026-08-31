#!/usr/bin/env node
/**
 * 把 shared/ 底下的執行時腳本重新複製到每一個既有的實例。
 *
 * instance-bind.mjs 是**複製**而不是連結 shared/——實例交付給客戶之後是獨立
 * 部署的，連回站台就會斷。代價是：站台這邊修好 jv-live / jv-assist / jv-tour
 * 的任何一個問題，已經開通的實例都還帶著舊的那一份，而且不會有任何錯誤訊息
 * 告訴你它們沒跟上（第一次踩到是工作台的 ?jv=embed 判斷加了卻沒生效，
 * 因為實例讀的是自己那份三週前的 assist.js）。
 *
 * 這支只動 _jv/ 底下那三支腳本：
 *   - index.html 不碰。那是客戶自己改過的東西。
 *   - schema.json / tour.json 不碰。那是這個實例自己的內容，不是共用的程式。
 *
 *   node tools/instance-refresh-runtime.mjs [--dry-run] [--instance=i_xxx]
 */
import fs from "node:fs";
import path from "node:path";
import { ROOT, parseArgs, makeLogger, EXIT } from "./lib/forge-common.mjs";

const args = parseArgs();
const log = makeLogger({ quiet: false });
const DRY = Boolean(args["dry-run"] || args.dryRun);
const ONLY = args.instance ? String(args.instance) : null;

/* 站台的檔名 → 實例裡的檔名。實例那邊刻意用短名（./_jv/live.js），
   因為那個路徑會出現在交付給客戶的 HTML 裡。 */
const FILES = [
  ["jv-live.js", "live.js"],
  ["jv-assist.js", "assist.js"],
  ["jv-tour.js", "tour.js"],
];

const INSTANCES = path.join(ROOT, "var", "instances");
if (!fs.existsSync(INSTANCES)) {
  log.info("還沒有任何實例。");
  process.exit(EXIT.OK);
}

const dirs = fs.readdirSync(INSTANCES)
  .filter((d) => !ONLY || d === ONLY)
  .filter((d) => fs.existsSync(path.join(INSTANCES, d, "public", "_jv")));

if (!dirs.length) {
  log.error(ONLY ? `找不到實例 ${ONLY}（或它還沒有 _jv 目錄）` : "沒有可以更新的實例。");
  process.exit(ONLY ? EXIT.BAD_INPUT : EXIT.OK);
}

/* 先把來源讀進記憶體。逐個實例重讀同樣的三個檔沒有意義，而且中途有人動到
   shared/ 的話，前後複製出去的會是不同版本。 */
const source = FILES.map(([from, to]) => {
  const file = path.join(ROOT, "shared", from);
  if (!fs.existsSync(file)) {
    log.error(`找不到 shared/${from}`);
    process.exit(EXIT.BAD_INPUT);
  }
  return { to, body: fs.readFileSync(file) };
});

let changed = 0;
let same = 0;

for (const id of dirs) {
  const jv = path.join(INSTANCES, id, "public", "_jv");
  const updated = [];
  for (const { to, body } of source) {
    const dest = path.join(jv, to);
    /* 內容一樣就跳過。全部重寫也能動，但那樣每次執行都會把所有實例的
       mtime 推到現在，之後就再也看不出「哪些真的落後了」。 */
    if (fs.existsSync(dest) && fs.readFileSync(dest).equals(body)) continue;
    updated.push(to);
    if (!DRY) {
      /* 先寫暫存再改名。客戶正好在載入這支腳本時被寫到一半，
         他拿到的會是一個語法錯誤的檔案。 */
      const tmp = `${dest}.tmp`;
      fs.writeFileSync(tmp, body);
      fs.renameSync(tmp, dest);
    }
  }
  if (updated.length) { changed += 1; log.step(`${id}：${DRY ? "將更新" : "已更新"} ${updated.join("、")}`); }
  else same += 1;
}

log.info(`${DRY ? "（試跑）" : ""}共 ${dirs.length} 套：更新 ${changed}、已是最新 ${same}`);
process.exit(EXIT.OK);
