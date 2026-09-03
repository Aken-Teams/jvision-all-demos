#!/usr/bin/env node
/**
 * lib/instance-head.mjs 的測試。不碰資料庫、不碰正式實例，全部在暫存目錄裡跑。
 *
 * 這一支存在的理由：它守的是「畫面上的 <th> 與資料庫的欄位一致」這條不變式，
 * 而那條不變式壞掉的時候**畫面看起來完全正常**——表格還在、資料還在，
 * 只是那張表從原生接管掉回退路面板。沒有測試的話，下一次改動把它弄壞了
 * 也不會有人發現。
 *
 *   node tools/test-instance-head.mjs
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { renameHeader, addHeader, locate, locateAll, checkBound } from "./lib/instance-head.mjs";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log(`${ok ? "✔" : "✘"} ${name}`
    + (ok ? "" : `\n    得到 ${JSON.stringify(got)}\n    預期 ${JSON.stringify(want)}`));
  ok ? (pass += 1) : (fail += 1);
};

const tmps = [];
function mk(html) {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), "jvhead-"));
  fs.mkdirSync(path.join(d, "public"));
  fs.writeFileSync(path.join(d, "public", "index.html"), html);
  tmps.push(d);
  return d;
}
const read = (d) => fs.readFileSync(path.join(d, "public", "index.html"), "utf8");
const ths = (h) => [...h.matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/g)]
  .map((m) => m[1].replace(/<[^>]*>/g, "").trim());

/* ── 改名 ─────────────────────────────────────────── */
let d = mk('<table><thead><tr><th class="a">甲</th><th class="a">乙</th><th class="a">丙</th></tr>'
  + "</thead><tbody><tr><td>1</td></tr></tbody></table>");
t("改名", renameHeader(d, ["甲", "乙", "丙"], "乙", "新乙"), { ok: true, places: 1 });
t("  結果", ths(read(d)), ["甲", "新乙", "丙"]);

/* ── 加欄位 ───────────────────────────────────────
   要插在「那一段的最後一欄之後」，不是整列尾端。尾端還有「操作」這種
   裝飾欄時，插到最後會把 jv-live 要求的連續性打斷。 */
d = mk("<table><tr><th></th><th>甲</th><th>乙</th><th>操作</th></tr></table>");
t("加欄位", addHeader(d, ["甲", "乙"], "備註"), { ok: true, places: 1 });
t("  插在正確位置", ths(read(d)), ["", "甲", "乙", "備註", "操作"]);
t("  加完仍接得上", checkBound(d, ["甲", "乙", "備註"]), "bound");

/* ── 同一組表頭出現兩次 ─────────────────────────────
   不少 demo 是用 JS 字串建畫面的，同一張表會同時存在於腳本樣板與靜態標記。
   只改一處，jv-live 綁到哪一份就變成擲骰子。 */
d = mk("<div><table><tr><th>甲</th><th>乙</th></tr></table></div>\n"
  + "<script>var s='<table><tr><th>甲</th><th>乙</th></tr></table>';</script>");
t("兩處都改到", renameHeader(d, ["甲", "乙"], "甲", "新甲"), { ok: true, places: 2 });
t("  結果", ths(read(d)), ["新甲", "乙", "新甲", "乙"]);

/* ── 巢狀表格 ─────────────────────────────────────
   非貪婪的 <table>…</table> 會在內層的 </table> 就收掉，外層剩半截，
   於是表頭被插到別張表裡。 */
const nested = '<table id="outer"><tr><td><table id="inner"><tr><th>內甲</th><th>內乙</th></tr>'
  + "</table></td></tr>\n<tr><th>外甲</th><th>外乙</th></tr></table>";
t("巢狀：內層找得到", !!locate(nested, ["內甲", "內乙"]), true);
t("巢狀：外層找得到", !!locate(nested, ["外甲", "外乙"]), true);

/* ── 文字正規化要跟 textContent 對齊 ─────────────── */
d = mk("<table><tr><th>  甲\n  乙  </th><th>丙&amp;丁</th></tr></table>");
t("實體與空白", !!locate(read(d), ["甲 乙", "丙&丁"]), true);

/* ── 跳脫 ─────────────────────────────────────────
   欄位名稱是使用者輸入的，直接塞進 HTML 就是一個注入點。 */
d = mk("<table><tr><th>甲</th><th>乙</th></tr></table>");
renameHeader(d, ["甲", "乙"], "甲", '<img src=x onerror=alert(1)>');
t("跳脫", /&lt;img src=x/.test(read(d)) && !/<img/.test(read(d)), true);

/* ── 找不到就不要動 ───────────────────────────────
   有些表在畫面上是表單或卡片，本來就沒有表頭。那不是失敗，
   但也絕對不可以「找個像的改一改」。 */
d = mk("<div>這套系統沒有表格，只有表單</div>");
t("沒有表格", addHeader(d, ["甲"], "備註").ok, false);
t("  檔案沒被動到", read(d), "<div>這套系統沒有表格，只有表單</div>");

/* ── 空白表頭是裝飾欄，比對時要跳過 ───────────────── */
t("裝飾欄不參與比對",
  locateAll("<table><tr><th></th><th>甲</th><th></th><th>乙</th></tr></table>", ["甲", "乙"]).length, 1);

tmps.forEach((x) => { try { fs.rmSync(x, { recursive: true, force: true }); } catch { /* 清不掉不影響結果 */ } });
console.log(`\n${pass} 過、${fail} 失敗`);
process.exit(fail ? 1 : 0);
