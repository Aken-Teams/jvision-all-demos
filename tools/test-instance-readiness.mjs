/**
 * 樣板文字判斷的測試。
 *
 * 這一項是整份完整度報告裡最容易出錯的：它要在「還沒改的假資料」與
 * 「客戶真的會這樣寫的業務用語」之間畫線，而中文裡這兩者長得很像。
 * 畫錯的代價不對稱——漏報只是少提醒一句，誤報會讓人不信任整份報告。
 *
 * 所以下面兩組案例都要顧：該報的要報，不該報的一個都不能報。
 * 「不該報」那一組是從真實型錄裡抓出來的句子，不是我想像的。
 */
import { scanHtml } from "./lib/instance-readiness.mjs";

let pass = 0; let fail = 0;
function t(name, html, shouldHit) {
  const hits = scanHtml(html);
  const ok = Boolean(hits.length) === shouldHit;
  if (ok) pass += 1;
  else { fail += 1; console.log(`  ✗ ${name}\n     期望 ${shouldHit ? "要報" : "不報"}，實際 ${hits.length ? "報了：" + hits.map((h) => h.why + "／" + h.sample).join("；") : "沒報"}`); }
}

console.log("── 該報的：具體的假東西，在客戶系統裡不該出現 ──");
t("樣板編號 ENT-001", "<td>ENT-001</td><td>採購</td>", true);
t("Lorem ipsum", "<p>Lorem ipsum dolor sit amet</p>", true);
t("TODO", "<p>說明 TODO 之後補</p>", true);
t("FIXME", "<div>FIXME 這段要改</div>", true);
t("請輸入內容", "<div>請輸入內容</div>", true);
t("範例文字", "<span>範例文字</span>", true);
t("假客戶名 王小明", "<b>王小明</b><small>VIP</small>", true);
t("範例公司", "<td>範例公司</td>", true);
t("整格只有 XXX", "<td>XXX</td>", true);
t("整格只有 測試用", "<span>測試用</span>", true);

console.log("── 不該報的：從真實型錄抓出來的業務用語 ──");
t("狀態徽章 待補", '<span class="state-pill ok">完成</span><span class="state-pill wait">待補</span>', false);
t("KPI 標籤 待補文件", '<div class="metric-label">待補文件</div><div class="metric-value">4 件</div>', false);
t("工程排程 D+7", "<td>D+7</td><td>模板拆除</td>", false);
t("尚未填報", '<td><span class="pill red">尚未填報</span></td>', false);
t("未填完成數量", "<td>臨時排水</td><td>未填完成數量</td>", false);
t("測試資料已去識別", "<b>測試資料已去識別</b><small>負責人已核准</small>", false);
t("測試用電（跟別的字連在一起）", "<td>測試用電</td><td>3 度</td>", false);
t("script 裡的 TODO 變數不算", '<script>const TODO=[];${TODO.map(t=>t)}</script><p>正常內容</p>', false);
t("style 裡的字不算", "<style>.a::after{content:'待補'}</style><p>正常內容</p>", false);
t("乾淨的畫面", "<h1>用印申請管理</h1><td>已核准</td><td>2026-09-01</td>", false);

console.log("── 佐證要指得出位置 ──");
const s = scanHtml("<p>案件 ENT-001 已送出</p>");
if (s[0]?.sample?.includes("ENT-001")) { pass += 1; } else { fail += 1; console.log("  ✗ 佐證沒帶上命中的那一段：", JSON.stringify(s[0]?.sample)); }

console.log(`\n通過 ${pass}　失敗 ${fail}`);
process.exitCode = fail ? 1 : 0;
