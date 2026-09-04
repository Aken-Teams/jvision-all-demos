/**
 * 把 public/_jv/schema.json 補回跟現況一致。
 *
 * ── 為什麼需要 ────────────────────────────────────────
 * AI 在修改畫面時如果加了新表格，`instance-grow` 會在資料庫裡把表建起來，
 * 但（在這支工具寫出來之前）不會把它寫回 schema.json。那個檔漏一筆的後果有兩個：
 *
 * 一、「資料」那一頁的下拉選單只能叫它「資料表 3」——使用者要一張一張點開
 *     才知道哪張是哪張。
 * 二、交付出去的專案是照 schema.json 建表的，漏掉的表在客戶自己跑起來的
 *     版本裡不存在，而畫面上還畫著它。
 *
 * 另外舊的條目本身也不準：`screen` 是「表格前面最後一個 data-i」，而很多畫面
 * 是 JS 拼出來的、導覽的 data-i 全擠在最前面，於是每張表都算到同一個畫面。
 * 實測飯店那套三張表都被判成 screen 6，table_1 因此叫「追蹤策略成效」，
 * 但它其實是「房型庫存配置」。
 *
 * 所以這支做兩件事：補上漏掉的表、把標題換成從表格上方 <h3> 抽出來的那一個。
 *
 * ── 怎麼對應 ──────────────────────────────────────────
 * 用欄位標籤串起來當身分（跟 jv-live 找表、instance-grow 判斷新表的方式一致）。
 * 對不上的就不動——寧可留著一個難看的名字，也不要把 A 表的名字寫到 B 表上。
 */
import fs from "node:fs";
import path from "node:path";
import { parseArgs, makeLogger, EXIT } from "./lib/forge-common.mjs";
import { extractTables } from "./lib/schema-extract.mjs";
import * as control from "./lib/control-db.mjs";
import { describe } from "./lib/instance-db.mjs";
import { q, close } from "./lib/mysql.mjs";

const args = parseArgs();
const log = makeLogger({ quiet: Boolean(args.quiet) });
const DRY = args["dry-run"] !== false && !args.apply;

const sig = (labels) => labels.map((x) => String(x).trim()).join("|");
/* 佔位名有兩種：「資料表 3」，以及產線給的「<系統名> 資料表 1」。
   後者更糟——它長，而且每張表只差最後一個數字。 */
const isPlaceholder = (t) => !t || /資料表\s*\d+\s*$/.test(String(t).trim());

async function syncOne(inst) {
  const file = path.join(inst.dir, "public", "_jv", "schema.json");
  const page = path.join(inst.dir, "public", "index.html");
  let sc; let html;
  try { sc = JSON.parse(fs.readFileSync(file, "utf8")); } catch { return { skip: "沒有 schema.json" }; }
  try { html = fs.readFileSync(page, "utf8"); } catch { return { skip: "沒有 index.html" }; }
  if (!Array.isArray(sc.tables)) return { skip: "schema.json 格式不認得" };

  let db;
  try { db = await describe(inst.db_name); } catch (e) { return { skip: `資料庫讀不到（${String(e.message).slice(0, 40)}）` }; }

  /* 畫面上的表，用欄位串當索引。 */
  const onPage = new Map();
  for (const t of extractTables(html)) onPage.set(sig(t.labels), t);

  const have = new Set(sc.tables.map((t) => t.name));
  const added = []; const renamed = [];

  /* 一、資料庫有、schema.json 沒有的補上去 */
  for (const t of db.tables) {
    if (have.has(t.name)) continue;
    const hit = onPage.get(sig(t.columns.map((c) => c.label)));
    sc.tables.push({
      name: t.name,
      title: (hit && hit.caption) || t.title || t.name,
      selector: hit ? hit.selector : null,
      screen: hit ? hit.screen : null,
      renderedByJs: hit ? hit.rendered : true,
      columns: t.columns,
    });
    added.push(`${t.name}＝${(hit && hit.caption) || "（畫面上找不到，用原名）"}`);
  }

  /* 二、標題是佔位或空的，用畫面上那個標題換掉 */
  for (const e of sc.tables) {
    if (!isPlaceholder(e.title)) continue;
    const cols = (e.columns || []).map((c) => c.label);
    const hit = onPage.get(sig(cols));
    if (!hit || !hit.caption) continue;
    renamed.push(`${e.name}：${e.title || "(空)"} → ${hit.caption}`);
    e.title = hit.caption;
  }

  if (!added.length && !renamed.length) return { same: true };
  if (!DRY) {
    fs.writeFileSync(`${file}.tmp`, `${JSON.stringify(sc, null, 2)}\n`);
    fs.renameSync(`${file}.tmp`, file);
  }
  return { added, renamed };
}

async function main() {
  const rows = await q("SELECT id, repo_name, dir, db_name FROM instances ORDER BY repo_name");
  log.step(`${DRY ? "試跑" : "實際寫入"}：${rows.length} 套`);
  let touched = 0; let addN = 0; let renN = 0;
  for (const inst of rows) {
    const r = await syncOne(inst);
    if (r.skip) { log.warn(`  ${inst.repo_name}：${r.skip}`); continue; }
    if (r.same) continue;
    touched += 1;
    addN += (r.added || []).length;
    renN += (r.renamed || []).length;
    log.info(`  ${inst.repo_name}`);
    (r.added || []).forEach((x) => log.info(`    ＋ 補上 ${x}`));
    (r.renamed || []).forEach((x) => log.info(`    ✎ 改名 ${x}`));
  }
  log.step(`${touched} 套要改：補上 ${addN} 張表、改名 ${renN} 個`);
  if (DRY) log.info("（這是試跑，什麼都沒寫。要真的寫入請加 --apply）");
}

main()
  .catch((e) => { log.error(e.message); process.exitCode = EXIT.BAD_INPUT; })
  .finally(() => close());
