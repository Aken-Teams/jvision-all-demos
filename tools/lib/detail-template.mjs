/**
 * content/details/<repo>.json 與 README.md 的決定論產生器。
 *
 * 為什麼不交給 codex：details 是三方契約 —— project.html 靠它渲染詳細頁、
 * tools/verify-demos.mjs 靠 flow.stages[].demo 判定「每個階段對到不同畫面」、
 * README 的內容也源自它。欄位固定 13 個、demo 必須精確為 v0..v5，
 * 交給 LLM 漏一欄就是一個壞掉的詳細頁。
 *
 * PAIN_ICONS / CAT_KPI / P / CAT_PAINS 由 tools/build-detail-content.mjs 原文擷取；
 * readmeMd() 抄自 tools/build-demo-pages.mjs。
 * ⚠ 那兩支檔案本身都不可執行：build-demo-pages 會覆寫全部 demo 並刪檔，
 *   build-detail-content 會把 details 全量重產。
 */

const PAIN_ICONS = [
  [/料|缺|庫存|補/, "inventory"], [/設備|負載|機|稼動|停機/, "warning"],
  [/交期|期限|逾期|時效|延遲/, "schedule"], [/品質|不良|規格|超差|瑕疵/, "rule"],
  [/客戶|客訴|抱怨|投訴/, "sentiment_dissatisfied"], [/風險|審核|核准|合規/, "gpp_maybe"],
  [/資料|散|文件|版本/, "table_view"], [/成本|費用|金額|預算/, "payments"],
  [/人力|排班|出勤|人員/, "groups"], [/安全|資安|漏洞|威脅/, "security"],
];

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
/* ── details JSON ────────────────────────────────────────── */

const splitUsers = (value) =>
  String(value || "").split(/[、,，／/]/).map((s) => s.trim()).filter(Boolean);

/**
 * 由 topic-scout 候選 + systemType 定義產出 details。
 * flow.stages 固定 6 筆、demo = v0..v5，與 index.html 的 6 個畫面 1:1；
 * 這正是 verify-demos.mjs 判「畫面互異」的依據。
 */
export function buildDetails(candidate, { id, JV }) {
  const cat = candidate.category;
  const kpiRows = CAT_KPI[cat] || CAT_KPI["經營管理"];
  const painRows = CAT_PAINS[cat] || CAT_PAINS["經營管理"];
  const type = JV.TYPES[candidate.systemType] || {};
  const modules = (candidate.modules || []).slice(0, 6);
  const stages = (candidate.flowStages || []).slice(0, 6);
  const users = splitUsers(candidate.primaryUser);
  const metrics = (candidate.operationalMetrics || []).slice(0, 5);
  const roles = [...new Set(stages.map((s) => s.role).filter(Boolean))];

  const kpi = kpiRows.map(([label, unit, before, after]) => ({ label, before, after, unit }));
  const headline = kpi[1] || kpi[0];

  return {
    id,
    repoName: `jvision-${candidate.slug}`,
    title: candidate.title,
    category: cat,
    systemType: candidate.systemType,

    hero: {
      tagline: candidate.description,
      highlights: [
        { icon: "conveyor_belt", label: "涵蓋流程", value: stages.map((s) => s.title).slice(0, 4).join("→") },
        { icon: "groups", label: "主要使用者", value: users.slice(0, 3).join("、") || "部門使用者" },
        { icon: "insights", label: "關鍵指標", value: metrics.slice(0, 3).join("、") || headline.label },
      ],
    },

    problem: {
      situation: candidate.businessSituation || candidate.description,
      pains: painRows,
      impact: `${headline.label}長期停在 ${headline.before}${headline.unit}，例外一多就得靠人工追，錯誤與延誤累積成看不見的成本。`,
    },

    system: {
      summary: candidate.description,
      users: users.length ? users : (type.entry || ["部門使用者", "主管"]),
      dailyUse: candidate.dailyUse || `每天在${candidate.title}更新資料、處理例外並保存結果。`,
    },

    architecture: {
      entry: users.length ? users.slice(0, 3) : (type.entry || ["部門使用者"]),
      core: type.label || candidate.systemType,
      modules: modules.map((m) => ({ icon: m.icon, name: m.name, desc: m.desc })),
      data: type.data || ["營運報表", "資料庫", "既有系統整合"],
    },

    flow: {
      inputs: metrics.slice(0, 3),
      stages: stages.map((s, i) => ({ title: s.title, role: s.role, desc: s.desc, demo: `v${i}` })),
      lanes: roles.slice(0, 4).map((role) => ({
        role,
        steps: stages.filter((s) => s.role === role).map((s) => s.title),
      })),
      decisions: stages
        .filter((s) => /審|核|判|決|確認|檢/.test(s.title))
        .slice(0, 2)
        .map((s) => ({ label: `${s.title}是否通過？`, yes: "進入下一階段", no: `退回補件並通知${s.role}` })),
      output: `${candidate.title}處理結果與可追溯的操作紀錄`,
    },

    benefits: {
      kpis: kpi,
      trend: {
        labels: ["W1", "W2", "W3", "W4", "W5", "W6"],
        series: [{
          name: `${headline.label} ${headline.unit}`,
          // 由 before 線性收斂到 after，維持與 KPI 表一致
          data: Array.from({ length: 6 }, (_, i) =>
            Number((headline.before + (headline.after - headline.before) * (i / 5)).toFixed(1))),
        }],
      },
      gauges: kpi.slice(0, 2).map((k) => ({
        label: k.label,
        value: k.after,
        target: Number((k.after * (k.after > k.before ? 1.03 : 0.97)).toFixed(1)),
      })),
      points: modules.slice(0, 3).map((m) => ({ title: m.name, desc: m.desc })),
    },

    records: {
      title: `${candidate.title}資料列表`,
      columns: [
        { key: "id", label: "編號" },
        { key: "target", label: "項目" },
        { key: "owner", label: "負責人" },
        { key: "due", label: "期限" },
        { key: "stage", label: "階段" },
      ],
      rows: stages.map((s, i) => ({
        id: `${candidate.slug.slice(0, 3).toUpperCase()}-${String(i + 1).padStart(3, "0")}`,
        target: s.title,
        owner: s.role,
        due: `D+${i + 1}`,
        stage: i === 0 ? "處理中" : i < 3 ? "待確認" : "已完成",
        priority: i < 2 ? "high" : "medium",
      })),
    },

    decisionRules: stages.slice(0, 3).map((s, i) => ({
      id: `RULE-${String(i + 1).padStart(2, "0")}`,
      rule: `${s.title}階段由${s.role}負責：${s.desc}`,
      evidence: metrics[i] || "系統操作紀錄",
    })),
  };
}

/* ── README.md（抄自 tools/build-demo-pages.mjs 的 readmeMd） ── */
export function readmeMd(D) {
  const modules = (D.architecture && D.architecture.modules) || [];
  const users = (D.system && D.system.users) || [];
  const kpis = (D.benefits && D.benefits.kpis) || [];
  const stages = ((D.flow && D.flow.stages) || []).map((s) => s.title);
  const lines = [];
  lines.push(`# ${D.title}`, "");
  if (D.hero && D.hero.tagline) lines.push(`> ${D.hero.tagline}`, "");
  lines.push(D.system && D.system.summary ? D.system.summary : (D.problem && D.problem.situation) || "", "");
  lines.push(`**產業別：**${D.category || "—"}　|　**系統類型：**${D.systemType || "—"}`, "");
  if (modules.length) { lines.push("## 功能模組", ""); modules.forEach((m) => lines.push(`- **${m.name}** — ${m.desc || ""}`)); lines.push(""); }
  if (users.length) { lines.push("## 適合誰使用", ""); users.forEach((u) => lines.push(`- ${u}`)); lines.push(""); }
  if (stages.length) { lines.push("## 運作流程", ""); stages.forEach((s, i) => lines.push(`${i + 1}. ${s}`)); lines.push(""); }
  if (kpis.length) { lines.push("## 導入效益", ""); kpis.forEach((k) => lines.push(`- ${k.label}：${k.before}${k.unit || ""} → **${k.after}${k.unit || ""}**`)); lines.push(""); }
  lines.push("---", "", `本頁為 **純 UI 系統展示**（無後端），畫面與資料皆為擬真示範，與專案詳細頁的功能模組、運作流程一致。單一網域下以 \`/demos/${D.repoName}/\` 提供。`, "");
  return lines.join("\n");
}
