/**
 * 建議句產生器的測試。
 *
 * 這幾顆按鈕的內容會原封不動出現在使用者眼前，而素材來自 page-outline 抽出來
 * 的字串——那些字串不保證乾淨：型錄裡有不少 demo 是用 JS 樣板字串拼畫面的，
 * 抽出來的「標題」有時候是程式碼碎片（實測 jvision-attendance 抽到
 * `'+esc(m.t)+'`）。所以測試的重點有兩個：
 *   一、素材是這套系統自己的字，不同結構要產出不同建議；
 *   二、明顯不是人話的字串一個都不能漏出去。
 */
import { chips } from "./lib/instance-chips.mjs";

let pass = 0; let fail = 0;
const ok = (name, cond, extra) => {
  if (cond) pass += 1;
  else { fail += 1; console.log(`  ✗ ${name}${extra ? "\n     " + extra : ""}`); }
};

console.log("── 用這套系統自己的字 ──");
const seal = chips({
  screens: ["提出申請", "法務審查", "權限核准"],
  headings: [{ level: 2, text: "登入印鑑稽核台" }],
  tables: [["承辦人", "文件與正本序號", "印章組合", "備註"]],
  charts: ["ECharts"],
});
ok("提到畫面名「法務審查」", seal.some((c) => c.includes("法務審查")), seal.join(" / "));
ok("提到真實欄位", seal.some((c) => c.includes("文件與正本序號") || c.includes("印章組合")), seal.join(" / "));

const hotel = chips({
  screens: ["掌握收益概況", "研判住房需求"],
  headings: [{ level: 2, text: "收益駕駛艙" }],
  tables: [["房型 / 實體庫存", "官網直訂", "Booking"]],
  charts: [],
});
ok("兩套系統產出的建議不一樣", seal.join("|") !== hotel.join("|"));
ok("飯店那套提到自己的畫面", hotel.some((c) => c.includes("研判住房需求")), hotel.join(" / "));

console.log("── 樣板欄位要優先提出來 ──");
const tpl = chips({ screens: ["總覽"], headings: [], tables: [["編號", "項目", "負責人", "期限", "階段"]], charts: [] });
ok("第一句就講樣板表", /樣板|真正要管/.test(tpl[0]), tpl.join(" / "));

console.log("── 不是人話的字串不能漏出去 ──");
const dirty = [
  "'+esc(m.t)+'", "${x}", "fn(a)", "a+b", "`t`", 'x"y', "很長很長很長很長很長很長很長的標題",
];
dirty.forEach(function (t) {
  const r = chips({ screens: [t], headings: [{ level: 2, text: t }], tables: [[t, t]], charts: [] });
  ok(`擋掉 ${JSON.stringify(t)}`, !r.some((c) => c.includes(t)), r.join(" / "));
});

console.log("── 邊界 ──");
ok("完全沒有素材也要給得出東西", chips({}).length >= 1, JSON.stringify(chips({})));
ok("沒有素材時只剩通用那句", chips({}).every((c) => !c.includes("「")), JSON.stringify(chips({})));
ok("最多四句", chips({
  screens: ["一", "二", "三"], headings: [{ level: 2, text: "四" }],
  tables: [["甲", "乙"], ["丙", "丁"]], charts: ["ECharts"],
}).length <= 4);
ok("不重複", (function () {
  const r = chips({ screens: ["同", "同"], headings: [], tables: [["同", "同"]], charts: [] });
  return new Set(r).size === r.length;
})());
ok("通用那句永遠排最後", (function () {
  const r = chips({ screens: [], headings: [], tables: [], charts: [] });
  return r[r.length - 1].includes("配色");
})());

console.log(`\n通過 ${pass}　失敗 ${fail}`);
process.exitCode = fail ? 1 : 0;
