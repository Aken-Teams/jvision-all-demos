/**
 * build-detail-content.mjs
 * ----------------------------------------------------------------------------
 * Generates content/details/<repo>.json for every catalog project so the
 * enriched project detail page (project.html) is driven by project-specific
 * data instead of hard-coded templates.
 *
 * - 400 AI/smart-mfg projects: mapped from content/practical-scenarios.json
 *   (real risks, stages, decision rules, personas) so pains / flow stages /
 *   rules are project-specific.
 * - legacy projects (no scenario): generated from projects-index.json +
 *   shared/system-content.js and flagged "generated":"needs-review".
 * - The 5 hand-authored pilot files are preserved (never overwritten).
 *
 * Run: node tools/build-detail-content.mjs
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = path.resolve(import.meta.dirname, "..");
const idx = JSON.parse(fs.readFileSync(path.join(root, "projects-index.json"), "utf8"));
const scenarios = JSON.parse(fs.readFileSync(path.join(root, "content/practical-scenarios.json"), "utf8")).scenarios;

// ---- load classify() + TYPES from the shared runtime (browser file) ----
const scSrc = fs.readFileSync(path.join(root, "shared/system-content.js"), "utf8");
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(scSrc, sandbox);
const JV = sandbox.window.JVSystemContent;

const PILOTS = new Set([
  "jvision-ai-case-001-production-scheduler",
  "jvision-smart-mfg-111-customer-relationship-management",
  "jvision-ai-case-006-quality-root-cause",
  "jvision-ai-case-070-financial-health-report",
  "jvision-production-order",
]);

const splitList = (s) => String(s || "").split(/[、,，/／·]/).map((x) => x.trim()).filter(Boolean);
const round = (v) => (Math.abs(v) < 10 ? Math.round(v * 10) / 10 : Math.round(v));
const ramp = (a, b, n = 6) => Array.from({ length: n }, (_, i) => round(a + (b - a) * (i / (n - 1))));

// pain icon by risk keyword
const PAIN_ICONS = [
  [/料|缺|庫存|補/, "inventory"], [/設備|負載|機|稼動|停機/, "warning"],
  [/交期|期限|逾期|時效|延遲/, "schedule"], [/品質|不良|規格|超差|瑕疵/, "rule"],
  [/客戶|客訴|抱怨|投訴/, "sentiment_dissatisfied"], [/風險|審核|核准|合規/, "gpp_maybe"],
  [/資料|散|文件|版本/, "table_view"], [/成本|費用|金額|預算/, "payments"],
  [/人力|排班|出勤|人員/, "groups"], [/安全|資安|漏洞|威脅/, "security"],
];
const painIcon = (t) => (PAIN_ICONS.find(([re]) => re.test(t)) || [, "warning"])[1];

// per-category improvement KPI templates: [label, unit, before, after]
const CAT_KPI = {
  "生產製造": [["排程作業工時", "小時/日", 8, 1.5], ["準時交付率", "%", 80, 95], ["缺料停線次數", "次/月", 12, 3], ["設備稼動率", "%", 74, 88]],
  "品質管理": [["批號追溯時間", "分鐘", 180, 15], ["客訴平均關案", "天", 21, 9], ["改善驗證率", "%", 64, 98], ["重複不良率", "%", 6, 2]],
  "業務銷售": [["商機轉換率", "%", 18, 27], ["平均回應時間", "小時", 26, 6], ["客戶資料完整率", "%", 62, 94], ["報價逾期流失", "件/月", 9, 2]],
  "採購供應鏈": [["採購前置時間", "天", 12, 5], ["準時到貨率", "%", 82, 96], ["缺料預警覆蓋", "%", 40, 92], ["議價作業工時", "小時/週", 8, 2]],
  "人力資源": [["薪資作業工時", "小時/月", 40, 8], ["出勤異常處理", "分鐘", 30, 5], ["招募到位天數", "天", 45, 28], ["表單簽核時效", "天", 3, 1]],
  "倉儲物流": [["揀貨作業工時", "小時/日", 7, 2], ["庫存準確率", "%", 88, 99], ["出貨延遲率", "%", 9, 2], ["盤點工時", "小時/月", 16, 3]],
  "研發管理": [["設計變更工時", "小時", 8, 2], ["文件版本錯誤", "件/月", 6, 1], ["專案準時率", "%", 70, 92], ["資料查找時間", "分鐘", 30, 5]],
  "經營管理": [["報表產出工時", "小時", 16, 1], ["異常發現時效", "天", 3, 1], ["決策資料覆蓋", "%", 55, 92], ["跨部門對齊", "%", 60, 90]],
  "ESG 永續": [["盤查作業工時", "小時", 40, 8], ["數據完整率", "%", 60, 95], ["減碳目標達成", "%", 50, 88], ["用能異常反應", "小時", 24, 2]],
  "零售電商": [["補貨反應", "小時", 24, 4], ["熱銷掌握率", "%", 60, 92], ["缺貨率", "%", 12, 4], ["結帳等待", "分鐘", 6, 1.5]],
  "教育": [["排課作業工時", "小時/週", 6, 1.5], ["作業批改時效", "天", 5, 1], ["出席掌握率", "%", 70, 95], ["學習進度可視", "%", 45, 90]],
  "企業協作": [["跨部門協調工時", "小時/週", 8, 2], ["任務準時率", "%", 68, 92], ["資訊落差", "%", 30, 8], ["文件查找時間", "分鐘", 20, 3]],
  "營建工程": [["日報彙整工時", "小時/日", 3, 0.5], ["進度落後預警", "%", 40, 90], ["估驗計價天數", "天", 10, 4], ["缺失改善時效", "天", 7, 2]],
  "醫療照護": [["候診等待", "分鐘", 35, 12], ["回診完成率", "%", 70, 92], ["申報退件率", "%", 8, 2], ["紀錄作業工時", "小時/日", 4, 1]],
  "財務會計": [["月結作業天數", "天", 6, 2], ["對帳錯誤", "件/月", 8, 1], ["帳款逾期率", "%", 15, 5], ["報表產出工時", "小時", 16, 1]],
  "金融保險": [["案件平均處理", "天", 7, 3], ["風險檢出率", "%", 70, 95], ["文件缺漏率", "%", 12, 3], ["覆核作業工時", "小時/日", 5, 1]],
  "資訊科技": [["事件平均處理", "分鐘", 120, 30], ["系統可用率", "%", 97, 99], ["SLA達成率", "%", 85, 98], ["資產盤點工時", "小時/月", 20, 4]],
  "交通運輸": [["派車規劃工時", "小時/日", 4, 1], ["準時配送率", "%", 85, 97], ["空車率", "%", 22, 10], ["油耗異常反應", "小時", 24, 3]],
  "設備維護": [["非計畫停機", "小時/月", 24, 6], ["保養準時率", "%", 75, 96], ["備品缺料", "次/月", 10, 2], ["故障排除時間", "分鐘", 90, 25]],
  "資訊安全": [["告警分流時間", "分鐘", 45, 8], ["事件平均處理", "小時", 12, 3], ["弱點修補率", "%", 68, 96], ["合規稽核工時", "小時/月", 30, 6]],
  "專業服務": [["案件文件工時", "小時", 6, 1.5], ["期限掌握率", "%", 72, 96], ["計費遺漏", "%", 10, 2], ["進度查找時間", "分鐘", 20, 3]],
  "物流運輸": [["派車規劃工時", "小時/日", 4, 1], ["準時配送率", "%", 85, 97], ["空車率", "%", 22, 10], ["簽收回單時效", "小時", 24, 2]],
  "餐飲旅宿": [["結帳等待", "分鐘", 8, 2], ["翻桌率", "%", 70, 90], ["備料浪費", "%", 15, 6], ["訂位掌握率", "%", 65, 94]],
  "生活服務": [["預約作業工時", "小時/日", 3, 0.5], ["準時到府率", "%", 82, 96], ["重工率", "%", 12, 4], ["客訴關案", "天", 4, 1]],
  "數據分析": [["報表產出工時", "小時", 16, 1], ["異常發現時效", "天", 3, 1], ["資料覆蓋率", "%", 55, 92], ["決策反應時間", "天", 5, 1]],
  "客服管理": [["首次回應時間", "分鐘", 30, 5], ["一次解決率", "%", 60, 88], ["客訴關案", "天", 5, 2], ["滿意度", "%", 72, 92]],
  "房地產與物業": [["報修處理", "小時", 24, 4], ["繳費即時率", "%", 70, 94], ["巡檢覆蓋", "%", 60, 95], ["公設調度工時", "小時/週", 6, 1]],
  "宗教服務": [["活動籌備工時", "小時", 20, 5], ["報名掌握率", "%", 65, 94], ["物資盤點", "小時", 6, 1], ["志工調度時效", "天", 3, 1]],
};
const DEFAULT_KPI = [["人工作業時間", "分鐘/日", 90, 25], ["處理時效", "小時", 24, 4], ["資料正確率", "%", 78, 96], ["例外處理耗時", "分鐘", 40, 10]];

function buildKpis(p) {
  const tpl = CAT_KPI[p.category] || DEFAULT_KPI;
  const j = (v, k) => { const f = 1 + (((p.id * k) % 7) - 3) * 0.02; let x = round(v * f); if (tpl[0][1] === "%" || String(v).length && v <= 100) x = Math.min(x, 99); return x; };
  return tpl.map(([label, unit, before, after], i) => ({ label, before: j(before, i + 2), after: j(after, i + 5), unit }));
}
function buildTrend(kpis) {
  const up = kpis.find((k) => k.after > k.before && k.unit === "%") || kpis.find((k) => k.unit === "%") || kpis[0];
  return { labels: ["第1週", "第2週", "第3週", "第4週", "第5週", "第6週"], series: [{ name: up.label + (up.unit === "%" ? " %" : ""), data: ramp(up.before, up.after) }] };
}
const POINTS = [
  { title: "減少人工往返", desc: "資料集中、流程可追蹤，省下每天反覆確認與追蹤的時間。" },
  { title: "異常更早發現", desc: "風險自動排序與提醒，把問題擋在事故發生之前。" },
  { title: "決策更快更準", desc: "營運數據即時彙整，主管一眼掌握該關注的重點。" },
];

// per-category "traditional pain points" so legacy projects are not all identical
const P = (icon, title, desc) => ({ icon, title, desc });
const CAT_PAINS = {
  "生產製造": [P("inventory", "缺料開工才發現", "料況與工單分開看，常在開工前才發現缺料只能停線。"), P("schedule", "排程靠試算表", "交期、產能、治具分散在多份表單，改一處要手動對齊全部。"), P("sync_problem", "現場進度看不到", "報工靠紙本回傳，生管無法即時知道哪張工單卡住。"), P("bolt", "插單反應太慢", "臨時插單要人工重算，往往到下午才排定，錯過當班產能。")],
  "品質管理": [P("manage_search", "追溯要翻好幾套", "檢驗結果、批號、出貨紀錄各在一處，追一個批號要跨系統。"), P("block", "隔離不及時", "規格超差沒有第一時間隔離，風險品可能繼續往下流。"), P("repeat", "問題重複發生", "缺乏根因與 8D 累積，同類不良換個批次又再犯。"), P("rule", "改善難閉環", "對策有沒有驗證、能不能關案全靠人記，稽核常補不齊。")],
  "業務銷售": [P("table_view", "客戶資料散落", "客戶與聯絡人分散在各業務的表單與筆記，交接就斷。"), P("visibility_off", "商機黑箱", "商機到哪一階段、卡在誰身上只存在業務腦中。"), P("schedule", "報價時效流失", "報價快到期沒人提醒，等想到時客戶已找了競品。"), P("person_off", "決策者沒到位", "推進到後段才發現真正拍板的人從沒參與。")],
  "採購供應鏈": [P("handshake", "供應商績效難掌握", "交期、品質、價格分散，供應商好壞沒有一致依據。"), P("warning", "缺料太晚預警", "到貨延遲往往開工前才發現，來不及調整。"), P("request_quote", "詢比價靠來回", "詢價、比價靠郵件往返，版本混亂、難以稽核。"), P("inventory", "庫存與採購脫節", "安全庫存與在途量看不到，重複下單或缺料。")],
  "人力資源": [P("fingerprint", "差勤資料分散", "打卡、請假、加班散在多處，月結對不齊。"), P("payments", "薪資計算易錯", "勞健保、加班費靠人工套公式，一改就要重算。"), P("schedule", "排班靠經驗", "人力與工時靠人排，容易超時或人力不足。"), P("description", "表單簽核卡關", "紙本簽核跑流程，進度看不到、常卡在某一關。")],
  "倉儲物流": [P("qr_code_scanner", "作業靠紙本", "入出庫、揀貨靠紙本與記憶，錯揀漏揀難追。"), P("inventory_2", "庫存不準", "帳面與實際對不上，盤點費時又常有落差。"), P("grid_view", "儲位混亂", "儲位沒有規劃，找貨、補貨耗時。"), P("output", "出貨延遲", "波次與覆核靠人協調，尖峰時容易延遲。")],
  "研發管理": [P("account_tree", "專案進度不透明", "任務與里程碑散在各處，落後難提前發現。"), P("description", "文件版本混亂", "BOM、圖面版本多，用錯版本造成損失。"), P("rule", "變更難追蹤", "ECN/ECR 靠郵件，影響範圍與核准狀態看不清。"), P("manage_search", "知識難沉澱", "經驗與資料散落，新人查找費時。")],
  "經營管理": [P("description", "報表要人工彙整", "跨部門數據靠人整合，一份報表做好幾天。"), P("visibility_off", "異常太晚發現", "問題等到月報才看到，錯過處理時機。"), P("scoreboard", "目標與執行脫節", "策略目標與現場 KPI 對不上，難落地。"), P("sync_problem", "資料各說各話", "各部門口徑不一，決策缺乏一致依據。")],
  "ESG 永續": [P("co2", "碳盤查耗時", "排放資料散在各廠各表，盤查一次要好幾週。"), P("bolt", "用能看不到", "用電用能沒有即時監控，異常反應慢。"), P("description", "報告難產出", "GRI/ISO 報告靠人拼湊，格式與數據難一致。"), P("flag", "減碳進度失焦", "目標與實際落差看不清，難即時調整。")],
  "零售電商": [P("inventory_2", "補貨反應慢", "熱銷缺貨、滯銷積壓，補貨靠經驗。"), P("point_of_sale", "前台結帳卡", "尖峰結帳等待，會員與優惠處理慢。"), P("loyalty", "會員經營薄弱", "會員與消費紀錄未整合，難做行銷。"), P("summarize", "營運看不清", "各門市營收與熱銷靠人彙整。")],
  "教育": [P("menu_book", "課務排課耗時", "課程、師資、教室靠人排，衝堂難避免。"), P("quiz", "批改與成績分散", "作業測驗與成績散在多處，回饋慢。"), P("trending_up", "學習進度看不到", "誰落後、誰缺席難即時掌握。"), P("groups", "親師溝通斷點", "通知與紀錄靠訊息，容易遺漏。")],
  "企業協作": [P("view_kanban", "任務散在各處", "任務散在訊息與郵件，進度看不清、常漏接。"), P("description", "知識難查找", "文件與知識散落，找資料耗時。"), P("bolt", "流程靠人推", "表單簽核與流程靠人催，卡關難發現。"), P("forum", "資訊落差", "跨部門資訊不對齊，重工與誤解多。")],
  "營建工程": [P("description", "日報靠紙本", "人機料回報靠紙本，彙整慢又易漏。"), P("account_tree", "進度落後太晚知", "WBS 與實際進度對不上，延誤難提前發現。"), P("fact_check", "缺失改善追不到", "巡檢缺失靠拍照傳訊，改善狀態難追。"), P("payments", "成本超支難控", "估驗計價與實支對不齊，超支難即時發現。")],
  "醫療照護": [P("event", "預約與報到混亂", "預約、報到、候診靠人叫號，等待久。"), P("folder_shared", "病歷紀錄分散", "就診與照護紀錄散落，交班易漏。"), P("receipt_long", "申報退件多", "健保申報靠人核對，退件率高。"), P("notifications_active", "回診追蹤漏接", "主動回診與提醒靠人記，容易遺漏。")],
  "財務會計": [P("calculate", "對帳靠人工", "應收付與銀行對帳靠人比對，易錯又慢。"), P("history_toggle_off", "月結趕加班", "跨系統抓數、調整，月結總在趕。"), P("request_quote", "帳款逾期難掌握", "帳齡與催收靠人追，呆帳風險高。"), P("savings", "現金流看不清", "資金調度靠經驗，缺乏即時預測。")],
  "金融保險": [P("assignment", "案件受理分散", "文件與資格核對靠人，受理慢。"), P("shield", "風險判斷靠經驗", "風險評分沒有一致依據，品質不一。"), P("gavel", "覆核流程冗長", "多層覆核靠紙本，進度看不清。"), P("history", "稽核追溯困難", "全程紀錄散落，稽核補件費時。")],
  "資訊科技": [P("confirmation_number", "工單淹沒", "事件與請求散在多渠道，容易漏處理。"), P("dns", "資產看不清", "IT 資產與授權靠試算表，盤點難。"), P("monitor_heart", "故障太晚知", "缺乏即時監控，使用者先發現才通報。"), P("timer", "SLA 難達成", "缺乏時效追蹤，容易超時。")],
  "交通運輸": [P("map", "派車靠經驗", "路線與派車靠人排，空車率高。"), P("location_on", "車輛看不到", "缺乏即時定位，到貨時間難掌握。"), P("assignment_turned_in", "回單追不到", "簽收回單靠紙本，對帳費時。"), P("local_gas_station", "成本油耗難控", "油耗與成本靠人記，異常反應慢。")],
  "物流運輸": [P("map", "派車靠經驗", "路線與派車靠人排，空車率高。"), P("location_on", "車輛看不到", "缺乏即時定位，到貨時間難掌握。"), P("assignment_turned_in", "回單追不到", "簽收回單靠紙本，對帳費時。"), P("ac_unit", "溫控難監控", "冷鏈溫度靠人巡查，異常反應慢。")],
  "設備維護": [P("calendar_month", "保養靠人記", "預防保養靠人排，容易漏保養。"), P("sensors", "故障無預兆", "缺乏設備數據，故障才停機處理。"), P("inventory_2", "備品缺料", "備品庫存看不到，維修等料。"), P("history", "維護履歷散落", "設備履歷難追，難分析故障。")],
  "資訊安全": [P("gpp_maybe", "告警淹沒", "資安告警量大，分流靠人容易漏。"), P("bug_report", "弱點修補追不到", "弱點掃描與修補進度散落，難追。"), P("vpn_key", "權限難盤點", "帳號與特權權限散落，稽核困難。"), P("policy", "合規靠人整理", "政策與稽核資料靠人拼湊。")],
  "專業服務": [P("folder", "案件散落難追", "案件與文件散在各處，進度看不清。"), P("gavel", "期限容易漏", "庭期與期限靠人記，漏接風險高。"), P("schedule", "工時計費遺漏", "工時記錄靠人填，計費常遺漏。"), P("fact_check", "文件版本混亂", "合約與文件版本多，用錯版本有風險。")],
  "餐飲旅宿": [P("point_of_sale", "前台出單慢", "點餐、結帳尖峰卡頓，客人久等。"), P("table_restaurant", "桌位訂位混亂", "桌況與訂位靠人記，容易衝突。"), P("inventory_2", "備料浪費", "叫貨與備料靠經驗，浪費或缺料。"), P("loyalty", "會員經營薄弱", "會員與消費未整合，難回流。")],
  "生活服務": [P("event", "預約排程混亂", "預約與派工靠人排，容易衝突。"), P("local_shipping", "到府時效難掌握", "服務進度看不到，客戶常詢問。"), P("report_problem", "重工與客訴", "作業紀錄散落，重工與客訴難追。"), P("summarize", "營運看不清", "各據點狀況靠人彙整。")],
  "數據分析": [P("description", "報表要人工彙整", "跨源數據靠人整合，一份報表做好幾天。"), P("zoom_in", "看不到明細", "指標無法下鑽，異常難定位。"), P("sync_problem", "資料口徑不一", "各部門數據對不齊，決策缺依據。"), P("visibility_off", "洞察太晚", "問題等報表才看到，錯過時機。")],
  "客服管理": [P("confirmation_number", "客訴散在多渠道", "電話、郵件、社群分散，容易漏回。"), P("timer", "回應太慢", "缺乏時效追蹤，首次回應慢。"), P("redeem", "補償流程混亂", "退換與補償靠人處理，標準不一。"), P("sentiment_satisfied", "滿意度看不到", "缺乏回饋彙整，難改善。")],
  "房地產與物業": [P("build", "報修處理慢", "住戶報修靠電話，派工與進度難追。"), P("payments", "繳費對帳費時", "管理費與繳費靠人對帳。"), P("fact_check", "巡檢覆蓋不足", "公設巡檢靠紙本，缺失難追。"), P("groups", "住戶溝通斷點", "公告與通知靠張貼，容易漏。")],
  "宗教服務": [P("event", "活動籌備繁瑣", "報名、志工、物資靠人協調。"), P("groups", "信眾名冊分散", "名冊與聯絡散落，通知困難。"), P("inventory_2", "物資盤點費時", "供品與物資靠人清點。"), P("payments", "香油捐款難管", "捐款與收據靠人記，對帳費時。")],
};
const DEFAULT_PAINS = [P("table_view", "試算表往返", "資料散在各處試算表與訊息，版本混亂、難以對齊。"), P("person_search", "人工追蹤", "靠人一件件盯進度、追負責人，耗時又容易遺漏。"), P("warning", "異常太晚發現", "問題往往等到出事才被看到，錯過最佳處理時機。"), P("sync_problem", "資訊各自為政", "各環節資料不互通，重工與誤解多。")];

function baseParts(p) {
  const sc = JV.get(p);
  const users = splitList(p.primaryUser || "部門使用者與主管");
  const kpis = buildKpis(p);
  return {
    id: p.id, repoName: p.repoName, title: p.title, category: p.category, systemType: sc.label,
    hero: {
      tagline: sc.tagline,
      highlights: [
        { icon: "groups", label: "適用角色", value: users.length + " 種" },
        { icon: "conversion_path", label: "作業階段", value: "多階段流程" },
        { icon: "monitoring", label: "關鍵指標", value: kpis.length + " 項" },
      ],
    },
    system: { summary: (p.description || "") + "把散落的作業，整合成一個「可操作、可追蹤、可稽核」的單一平台。", users, dailyUse: p.dailyUse || "" },
    architecture: { entry: sc.entry, core: sc.label, modules: sc.modules, data: sc.data },
    benefits: { kpis, trend: buildTrend(kpis), points: POINTS },
    _users: users, _sc: sc, _kpis: kpis,
  };
}

function fromScenario(p, sc) {
  const b = baseParts(p);
  const profile = sc.profile || {};
  const risks = (profile.risks || []).slice(0, 5);
  const obj = profile.object || "案件";
  const owner = (sc.persona && sc.persona.operator) || profile.owner || b._users[0] || "承辦";
  const supervisor = (sc.persona && sc.persona.supervisor) || b._users[1] || "主管";
  const rules = (sc.decisionRules || []).map((r) => ({ id: r.id, rule: r.rule, evidence: r.evidence }));
  const pains = risks.map((r) => ({ icon: painIcon(r), title: r, desc: `${obj}一旦遇到「${r}」，靠人工追蹤容易遺漏、反應太慢，往往拖到出事才被發現。` }));
  if (pains.length < 3) pains.unshift({ icon: "table_view", title: "資料分散難對齊", desc: "資料散在試算表與訊息，版本混亂、交接就斷。" });
  const stages = (profile.stages || []).map((st, i, arr) => ({
    title: st, role: i >= arr.length - 1 ? supervisor : owner,
    desc: `${obj}進入「${st}」階段，${owner}依系統提示完成作業並更新狀態，讓後段能接手。`,
    rule: rules[i] ? rules[i].id : undefined,
  }));
  const fields = profile.fields || (p.customerWorkflow && p.customerWorkflow.fields) || ["作業對象", "期限", "負責人"];
  b.hero.highlights[1].value = (stages.length || 4) + " 階段";
  b.problem = { situation: p.businessSituation || "", pains, impact: sc.triggerEvent ? `例如「${sc.triggerEvent}」，人工作業下容易延誤、也難事後追溯。` : "重複人工與資訊分散，讓交期、品質與決策都慢半拍。" };
  b.flow = { inputs: fields, stages: stages.length ? stages : undefined, output: (p.customerWorkflow && p.customerWorkflow.output) || `${obj}處理結果與操作紀錄` };
  b.decisionRules = rules.length ? rules : undefined;
  b.generated = "auto";
  delete b._users; delete b._sc; delete b._kpis;
  return b;
}

function fromLegacy(p) {
  const b = baseParts(p);
  const cw = p.customerWorkflow || {};
  const steps = (cw.steps && cw.steps.length) ? cw.steps : ["建立資料", "系統處理", "確認並留存"];
  const owner = b._users[0] || "承辦", supervisor = b._users[1] || "主管";
  // project-specific pains: rotate the category set by id and take 3-5
  const pool = CAT_PAINS[p.category] || DEFAULT_PAINS;
  const shift = p.id % pool.length;
  const rotated = pool.slice(shift).concat(pool.slice(0, shift));
  const pains = rotated.slice(0, Math.min(3 + (p.id % 3), pool.length)).map((x) => ({ ...x }));
  b.hero.highlights[1].value = steps.length + " 階段";
  b.problem = { situation: p.businessSituation || "", pains, impact: "重複人工與資訊分散，讓交期、品質與決策都慢半拍。" };
  b.flow = {
    inputs: ["作業對象／編號", "負責人", "期限"],
    stages: steps.map((st, i, arr) => ({ title: st, role: i >= arr.length - 1 ? supervisor : owner, desc: `於「${st}」階段完成對應作業並更新狀態，讓後段能接手。` })),
    output: cw.output || "處理結果與操作紀錄",
  };
  b.generated = "needs-review";
  delete b._users; delete b._sc; delete b._kpis;
  return b;
}

const outDir = path.join(root, "content/details");
fs.mkdirSync(outDir, { recursive: true });
let written = 0, skipped = 0, scenario = 0, legacy = 0;
for (const p of idx.projects) {
  if (PILOTS.has(p.repoName)) { skipped++; continue; }
  const sc = scenarios[p.repoName];
  const detail = sc ? fromScenario(p, sc) : fromLegacy(p);
  if (sc) scenario++; else legacy++;
  fs.writeFileSync(path.join(outDir, p.repoName + ".json"), JSON.stringify(detail, null, 2) + "\n");
  written++;
}
console.log(`Wrote ${written} detail files (scenario:${scenario}, legacy:${legacy}); preserved ${skipped} hand-authored pilots.`);
