/**
 * 表格標題抽取的測試。
 *
 * 這一段用的是啟發式：「表格上方最近的那個標題就是它的名字」。啟發式一定有
 * 猜錯的時候，而猜錯的代價不對稱——沒名字只是難用（「資料表 3」），
 * 猜錯名字會讓兩張不相干的表叫同一個名字，那時候使用者是在錯的表上改資料。
 *
 * 所以測試的重點是「寧可沒名字」：抓不準的情況要回 null，不要硬給一個。
 */
import { extractTables } from "./lib/schema-extract.mjs";

let pass = 0; let fail = 0;
const ok = (name, cond, extra) => {
  if (cond) pass += 1;
  else { fail += 1; console.log(`  ✗ ${name}${extra !== undefined ? "\n     實際：" + JSON.stringify(extra) : ""}`); }
};
const T = (labels) => `<table><tr>${labels.map((l) => `<th>${l}</th>`).join("")}</tr>`
  + `<tr>${labels.map(() => "<td>x</td>").join("")}</tr></table>`;
const cap = (html) => extractTables(html)[0]?.caption;

console.log("── 該抓到的 ──");
ok("表格上方的 h3", cap(`<h3>競品價格比較</h3>${T(["飯店", "公開房價", "價差"])}`) === "競品價格比較");
ok("中間隔著別的標籤也算", cap(`<h3>應收帳齡矩陣</h3><div class="hint"><p>說明</p></div>${T(["客戶", "30 天", "60 天"])}`) === "應收帳齡矩陣");
ok("<caption> 優先於上方標題",
  cap(`<h3>上面那個</h3><table><caption>真正的名字</caption><tr><th>甲</th><th>乙</th><th>丙</th></tr></table>`) === "真正的名字");
ok("有多個標題時取最近的", cap(`<h2>整頁大標</h2><h3>這一張的名字</h3>${T(["甲", "乙", "丙"])}`) === "這一張的名字");

console.log("── 圖示字型的字不算標題的一部分 ──");
ok("Material Symbols ligature 要拿掉",
  cap(`<h3><span class="material-symbols-outlined">pie_chart</span>庫存價值分佈</h3>${T(["品項", "數量", "金額"])}`) === "庫存價值分佈",
  cap(`<h3><span class="material-symbols-outlined">pie_chart</span>庫存價值分佈</h3>${T(["品項", "數量", "金額"])}`));

console.log("── 寧可沒名字 ──");
ok("完全沒有標題就回 null", cap(T(["甲", "乙", "丙"])) === null);
ok("標題太遠不算（超過 1500 字元）",
  cap(`<h3>很遠的標題</h3>${"<p>填充</p>".repeat(300)}${T(["甲", "乙", "丙"])}`) === null);
ok("樣板字串拼出來的標題不算",
  cap(`<h3>'+esc(m.t)+'</h3>${T(["甲", "乙", "丙"])}`) === null,
  cap(`<h3>'+esc(m.t)+'</h3>${T(["甲", "乙", "丙"])}`));
ok("太長的標題不算（那多半是整頁的標語）",
  cap(`<h3>每一次用印，都有完整授權依據。</h3>${T(["甲", "乙", "丙"])}`) === null);
ok("空標題不算", cap(`<h3>  </h3>${T(["甲", "乙", "丙"])}`) === null);

console.log("── 兩張表不該共用同一個名字 ──");
const two = extractTables(`<h3>第一張</h3>${T(["甲", "乙", "丙"])}<h3>第二張</h3>${T(["丁", "戊", "己"])}`);
ok("各自抓到自己上面那個", two[0].caption === "第一張" && two[1].caption === "第二張",
  two.map((t) => t.caption));

console.log(`\n通過 ${pass}　失敗 ${fail}`);
process.exitCode = fail ? 1 : 0;
