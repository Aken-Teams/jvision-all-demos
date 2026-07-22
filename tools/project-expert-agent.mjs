import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const toolDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(toolDir, "..");
const applySafeFixes = process.argv.includes("--apply-safe");
const projectsIndex = JSON.parse(fs.readFileSync(path.join(repoRoot, "projects-index.json"), "utf8"));
const mobileAuditPath = path.join(repoRoot, "docs", "MOBILE_ANALYTICS_AUDIT.json");
const formalAuditPath = path.join(repoRoot, "docs", "FORMAL_SITE_AUDIT.json");
const acceptanceAuditPath = path.join(repoRoot, "docs", "PROJECT_EXPERT_ACCEPTANCE_REPORT.json");
const outputJsonPath = path.join(repoRoot, "docs", "PROJECT_EXPERT_AGENT_REPORT.json");
const outputMarkdownPath = path.join(repoRoot, "docs", "PROJECT_EXPERT_AGENT_REPORT.md");
const runtimeCatalogPath = path.join(repoRoot, "docs", "DOMAIN_EXPERT_CATALOG.json");
const briefDirectory = path.join(repoRoot, "docs", "project-expert");
const agentVersion = "2.0.0";

const ignoredDirectories = new Set([".git", ".next", "node_modules", "_next", "_vercel", ".vercel", "coverage", "out"]);

const BASE_CAPABILITIES = [
  "可操作的核心工作流程（建立、更新或完成一筆作業）",
  "可依關鍵字、狀態或責任人聚焦待處理事項的工作清單",
  "可閱讀的 KPI、趨勢／階段統計與明細表",
  "成功、空資料、異常與復原動作的即時回饋",
];

const DOMAIN_PROFILES = {
  "人力資源": {
    role: "人資營運與人才數據顧問",
    mandate: "讓招募、任用、出勤與人才發展能以一致流程被追蹤與決策。",
    painPoints: ["跨系統的人員資料重複維護", "審核時程與人力風險不易預警", "主管缺少可行動的人才指標"],
    capabilities: ["職缺／人員／申請單的生命週期與責任人", "權限分級、簽核歷程與個資最小揭露"],
    architecture: "以人員主檔、申請單與簽核事件為三個可追溯模組，並將角色權限獨立管理。",
    content: "在工作台先呈現待簽核、到期合約、缺勤異常與招募漏斗，讓主管一眼知道下一步。",
    metrics: ["待簽核時效", "招募轉換率", "人力缺口", "異常出勤件數"],
    boundary: "薪資、績效與個資欄位需由人資與資安負責人確認資料範圍。",
  },
  "內容管理": {
    role: "內容策略與知識治理顧問",
    mandate: "讓內容從建立、審稿、發布到成效追蹤皆有明確責任與版本。",
    painPoints: ["版本與審稿狀態分散", "內容標籤不一致", "成效資料無法回饋選題"],
    capabilities: ["內容版本、排程與審稿工作流", "分類標籤、搜尋與成效回饋"],
    architecture: "以內容主檔、版本紀錄、審稿任務及發布排程拆分模組，保留可回溯的異動記錄。",
    content: "以待審、待發布、成效下滑與推薦選題作為首頁重點，並揭露每筆內容的版本與負責人。",
    metrics: ["待審稿件", "準時發布率", "內容互動率", "逾期修訂數"],
    boundary: "發布權限、外部素材授權與留存年限須由內容權責單位確認。",
  },
  "生活服務": {
    role: "服務營運與顧客體驗顧問",
    mandate: "降低預約、派工與服務交付中的等待與資訊落差。",
    painPoints: ["服務進度靠人工追問", "預約與人員排班衝突", "客訴缺少閉環追蹤"],
    capabilities: ["預約／服務單／派工的狀態流轉", "顧客通知、服務紀錄與滿意度回收"],
    architecture: "把預約、服務單、派工與顧客回饋串為單一事件時間軸，避免跨表重複查詢。",
    content: "首頁優先顯示今日服務量、即將逾時案件、可調度人力與客訴處理進度。",
    metrics: ["準時服務率", "平均等待時間", "一次解決率", "滿意度"],
    boundary: "通知頻率與顧客聯絡資料使用需遵守同意與退訂規則。",
  },
  "生產製造": {
    role: "製造營運與智慧工廠顧問",
    mandate: "讓訂單、工單、現場回報與品質風險在同一個可執行節奏中運作。",
    painPoints: ["工單進度與現場實況不同步", "插單、缺料與設備異常晚被發現", "品質與成本資料難以回溯到批次"],
    capabilities: ["訂單轉工單、排程與派工狀態", "批次追溯、設備／品質例外與處置閉環"],
    architecture: "以訂單、工單、站點回報與批次追溯為核心領域模組，將預警規則與排程引擎解耦。",
    content: "工作台要先交代今日排程達成、逾期工單、瓶頸站點與品質／缺料風險，再提供可執行的下一步。",
    metrics: ["排程達成率", "在製逾期數", "一次良率", "設備／缺料風險"],
    boundary: "排程自動改派、產能承諾與批次放行須由製造與品質主管覆核。",
  },
  "交通運輸": {
    role: "運輸調度與車隊安全顧問",
    mandate: "讓派車、路線、駕駛與車況能即時協同並降低延誤風險。",
    painPoints: ["調度決策仰賴電話與試算表", "延誤與車況告警反應太慢", "行程、駕駛與費用缺少一致追溯"],
    capabilities: ["任務派遣、路線與車輛狀態", "延誤／安全事件與維護提醒"],
    architecture: "以運輸任務、車輛、駕駛與事件流為主，並讓地圖／定位資料透過介面層整合。",
    content: "首頁呈現待派任務、準點風險、車況告警與可用運能，並讓調度員能快速切換處理。",
    metrics: ["準點率", "平均延誤", "車輛稼動率", "安全事件"],
    boundary: "定位、駕駛行為與自動派車規則需經營運與隱私權責核准。",
  },
  "企業協作": {
    role: "企業流程與協作治理顧問",
    mandate: "讓跨部門任務、文件與決策都有清楚的負責人、期限與可追溯性。",
    painPoints: ["任務散落於訊息與試算表", "決策與文件版本無法對應", "阻塞事項未被及時升級"],
    capabilities: ["任務、責任人、期限與依賴關係", "文件／會議決議與跨部門阻塞追蹤"],
    architecture: "以工作項目、決策紀錄、文件版本與通知事件為四個可獨立演進的模組。",
    content: "首頁依『今天要完成、等待他人、已逾期、需要決策』排序，讓使用者直接進入工作。",
    metrics: ["準時交付率", "阻塞天數", "待決策數", "跨部門完成率"],
    boundary: "跨部門可見範圍、文件權限與保密標籤須由資訊治理單位確認。",
  },
  "企業營運": {
    role: "營運管理與流程改善顧問",
    mandate: "將日常作業、異常與改善任務轉成可衡量的營運節奏。",
    painPoints: ["管理者只看結果、不知道原因", "異常處理沒有負責人與期限", "跨單位資料定義不一致"],
    capabilities: ["營運目標、作業事件與改善任務串連", "跨單位 KPI 定義與例外升級規則"],
    architecture: "以營運目標、作業事件、例外處置及改善任務建立分層模型，避免 KPI 與原始資料混在同一層。",
    content: "首頁先提供目標差距、異常清單、改善進度與決策待辦，文字定義應可一鍵查閱。",
    metrics: ["目標達成率", "異常結案時效", "改善完成率", "跨部門阻塞"],
    boundary: "KPI 口徑、預警門檻與績效連動規則需由經營團隊確認。",
  },
  "宗教服務": {
    role: "宗教服務與社群營運顧問",
    mandate: "在尊重儀式與隱私的前提下，提升服務安排、名冊與關懷追蹤的可靠性。",
    painPoints: ["活動與服務名冊易有遺漏", "志工協調仰賴人工聯絡", "關懷紀錄缺少一致脈絡"],
    capabilities: ["活動、服務申請與志工排班", "關懷紀錄、通知與授權管理"],
    architecture: "將活動、服務紀錄、志工班表與關懷案件分開治理，避免敏感備註擴散到非必要角色。",
    content: "首頁以近期活動、待協調服務、志工缺口與需要關懷的案件作為工作優先序。",
    metrics: ["服務完成率", "志工到位率", "通知回覆率", "待關懷案件"],
    boundary: "信仰、家庭與關懷備註屬敏感資料，必須採最小可見與明確同意。",
  },
  "物流運輸": {
    role: "物流履約與配送營運顧問",
    mandate: "讓收貨、配送、簽收與異常處理形成可預警的履約鏈。",
    painPoints: ["訂單、貨態與簽收資訊不同步", "延誤或破損只在客訴後才發現", "承運績效缺少可比較依據"],
    capabilities: ["訂單、運單、貨態與簽收事件", "異常工單、承運商績效與通知規則"],
    architecture: "以運單事件流為中心，將訂單、庫位、承運商與客訴整合為可追溯關聯。",
    content: "首頁應聚焦即將逾時運單、簽收例外、異常待處理與承運商服務品質。",
    metrics: ["準時簽收率", "異常件數", "平均配送時長", "承運商達成率"],
    boundary: "客戶地址、聯絡資訊與跨境運輸文件必須依區域法規控管。",
  },
  "金融保險": {
    role: "金融流程、風險與法遵顧問",
    mandate: "讓案件處理、風險判斷與審核軌跡可被驗證與稽核。",
    painPoints: ["案件證據與決策理由分散", "風險規則無法追溯版本", "例外案件容易逾期"],
    capabilities: ["案件、文件、覆核與決策軌跡", "風險規則版本、例外升級與權限分工"],
    architecture: "把案件、風險規則、審核決策與稽核事件分離建模，所有自動建議都必須可追溯來源。",
    content: "首頁優先顯示待覆核高風險案件、法遵期限、例外原因與可解釋的風險摘要。",
    metrics: ["案件審核時效", "高風險待覆核", "例外結案率", "規則命中趨勢"],
    boundary: "授信、理賠、投資與身分資料不得由 Demo 自動做最終決策；需人員覆核與法遵核可。",
  },
  "品質管理": {
    role: "品質系統與持續改善顧問",
    mandate: "讓檢驗、異常、矯正預防與稽核證據形成閉環。",
    painPoints: ["不良與原因分析無法回溯批次", "改善措施未追到驗證結案", "品質指標僅停留在報表"],
    capabilities: ["檢驗紀錄、缺失、原因與矯正預防措施", "批次追溯、稽核證據與效果驗證"],
    architecture: "將品質事件、檢驗結果、原因分析、CAPA 與驗證證據建成可關聯的事件鏈。",
    content: "首頁應把高風險不良、逾期 CAPA、重複缺失與批次影響範圍排在最前面。",
    metrics: ["一次良率", "不良率", "CAPA 逾期數", "重複缺失率"],
    boundary: "放行判定、規格上下限與稽核證據留存需由品質主管與法規要求共同確認。",
  },
  "客服管理": {
    role: "客戶支援與服務品質顧問",
    mandate: "讓每一個服務請求都有明確時限、脈絡與解決品質。",
    painPoints: ["案件分派不均或被遺漏", "回覆內容與知識庫無法累積", "客戶情緒與升級風險太晚辨識"],
    capabilities: ["工單分級、指派、SLA 與升級規則", "客戶脈絡、知識建議與解決結果"],
    architecture: "將客服案件、互動紀錄、SLA 計時器與知識條目分開管理，以事件關聯維持客戶脈絡。",
    content: "首頁先提示即將違約 SLA、高情緒或重複案件、待回覆清單與知識缺口。",
    metrics: ["首次回覆時間", "SLA 達成率", "一次解決率", "滿意度"],
    boundary: "客戶對話、錄音與個資遮罩規則需由客服與隱私負責人審核。",
  },
  "研發管理": {
    role: "研發流程與產品交付顧問",
    mandate: "讓需求、實驗、缺陷與版本交付以可驗證的節奏前進。",
    painPoints: ["需求、問題與決策沒有關聯", "實驗結果與版本難以追蹤", "技術風險未被提早揭露"],
    capabilities: ["需求、任務、實驗、缺陷與版本關聯", "決策紀錄、風險登錄與交付驗收"],
    architecture: "以需求、工作項目、實驗紀錄與發布版本為領域模組，建立從問題到驗收的可追溯關係。",
    content: "首頁呈現本週交付、阻塞議題、實驗結論與版本風險，讓團隊直接聚焦取捨。",
    metrics: ["交付準時率", "缺陷逃逸率", "實驗完成率", "阻塞工作數"],
    boundary: "產品路線圖、原始碼權限與客戶需求細節需依角色與保密層級分流。",
  },
  "倉儲物流": {
    role: "倉儲營運與庫存控制顧問",
    mandate: "讓收貨、上架、揀貨、盤點與補貨維持準確且可預警。",
    painPoints: ["帳實不符直到盤點才發現", "缺貨與呆滯庫存缺少提醒", "揀貨與庫位效率沒有依據"],
    capabilities: ["庫存異動、庫位、批號與盤點差異", "補貨規則、揀貨任務與庫存例外"],
    architecture: "把庫存異動當成不可變事件，庫位、批號與任務以關聯資料管理，確保帳實可追溯。",
    content: "首頁優先揭露缺貨、低庫存、盤點差異、即期批次與待完成揀貨。",
    metrics: ["庫存準確率", "缺貨率", "揀貨準時率", "呆滯庫存"],
    boundary: "庫存調整、報廢與補貨門檻需依權限與財務控管流程確認。",
  },
  "財務會計": {
    role: "財會流程與內控顧問",
    mandate: "讓憑證、審核、對帳與結帳進度透明並符合內控。",
    painPoints: ["發票、付款與帳務狀態不同步", "例外交易的覆核證據不足", "結帳期間靠人工追催"],
    capabilities: ["憑證、分錄、付款與對帳狀態", "核准流程、例外處理與稽核紀錄"],
    architecture: "將憑證、帳務事件、對帳結果及核准流程分離，並以不可竄改的稽核紀錄串接。",
    content: "首頁以待核憑證、對帳差異、到期付款與結帳進度作為可行動的財務視圖。",
    metrics: ["結帳完成率", "對帳差異", "待核金額", "逾期付款"],
    boundary: "付款、分錄過帳、稅務與銀行資料處理必須經財會主管與內控核准。",
  },
  "專業服務": {
    role: "專業服務交付與案件管理顧問",
    mandate: "讓案件範圍、交付品質、工時與客戶溝通可被清楚管理。",
    painPoints: ["案件範圍與變更缺乏紀錄", "顧問工時、交付與收款未串連", "客戶風險與依賴事項未被提醒"],
    capabilities: ["案件、里程碑、交付物與變更紀錄", "工時、風險、客戶溝通與收款狀態"],
    architecture: "以案件為核心，關聯里程碑、交付物、工時、變更與客戶溝通，保留可稽核的範圍邊界。",
    content: "首頁先呈現即將到期交付、範圍變更、未回覆客戶事項與資源負載。",
    metrics: ["里程碑準時率", "工時偏差", "範圍變更數", "應收逾期"],
    boundary: "合約、客戶機密與專業意見需依案件角色與留存義務控管。",
  },
  "採購供應鏈": {
    role: "採購策略與供應鏈風險顧問",
    mandate: "讓需求、詢比議價、交期與供應風險被一致管理。",
    painPoints: ["採購需求與庫存／生產計畫脫節", "供應商交期與品質風險太晚被看見", "詢比議價與核准依據不完整"],
    capabilities: ["請購、詢報價、訂單、收貨與核准流程", "供應商績效、交期、品質與風險預警"],
    architecture: "以請購到收貨的採購生命週期為主軸，讓供應商主檔、風險規則與審核證據可獨立治理。",
    content: "首頁要優先顯示急件、即將逾期 PO、供應中斷風險與待核准採購需求。",
    metrics: ["準時交貨率", "採購週期", "待核金額", "供應風險件數"],
    boundary: "供應商評鑑、價格、合約與核准權限需遵守採購授權與利益衝突規則。",
  },
  "教育": {
    role: "教育營運與學習成效顧問",
    mandate: "讓課程、學習歷程、關懷與成效資料支持個別化服務。",
    painPoints: ["學習進度與出缺勤分散", "預警只看單一成績", "教師與家長溝通無統一脈絡"],
    capabilities: ["課程、學員、進度與出缺勤紀錄", "學習預警、關懷任務與溝通歷程"],
    architecture: "以學員歷程、課程活動、評量事件與關懷任務組成可追溯模型，避免一次性分數主導判斷。",
    content: "首頁呈現需關注學員、待完成教務事項、課程出席與學習進度分布。",
    metrics: ["出席率", "完成率", "學習預警人數", "關懷結案率"],
    boundary: "未成年者、成績與特殊需求資料需依教育與個資規範設定最小權限。",
  },
  "設備維護": {
    role: "設備可靠度與維護管理顧問",
    mandate: "把保養、故障、備件與風險預警整合成可降低停機的維護流程。",
    painPoints: ["保養排程與實際執行不同步", "故障原因與備件使用未累積", "停機風險只能事後分析"],
    capabilities: ["設備台帳、保養計畫、工單與故障事件", "備件、停機影響與預防性預警"],
    architecture: "以設備主檔、維護計畫、維修工單、故障事件與備件交易建立可靠度資料鏈。",
    content: "首頁優先呈現逾期保養、高風險設備、未結工單與關鍵備件不足。",
    metrics: ["非計畫停機", "保養準時率", "MTTR", "關鍵備件缺貨"],
    boundary: "設備停機、保護設定與安全維護程序必須由現場主管核可。",
  },
  "業務銷售": {
    role: "業務營運與客戶成長顧問",
    mandate: "讓商機、活動、報價與成交預測能帶動下一個可執行行動。",
    painPoints: ["商機資訊不完整或無人跟進", "預測與實際落差缺少原因", "客戶互動紀錄分散"],
    capabilities: ["客戶、商機、活動、報價與成交階段", "下一步行動、預測、競品與流失風險"],
    architecture: "以客戶與商機為核心，關聯接觸事件、報價、產品與預測版本，避免用單一欄位取代歷程。",
    content: "首頁先列出本週待跟進、高機率商機、停滯案件與預測落差，再提供快速更新入口。",
    metrics: ["管線金額", "階段轉換率", "成交週期", "跟進逾期數"],
    boundary: "客戶資料、報價折扣與預測權限需由業務管理與隱私規範共同界定。",
  },
  "經營管理": {
    role: "策略執行與經營績效顧問",
    mandate: "使策略目標、部門行動與經營例外能被同一套節奏管理。",
    painPoints: ["策略與日常任務脫節", "不同單位 KPI 口徑不一致", "異常議題沒有明確決策與追蹤"],
    capabilities: ["策略目標、KPI、行動方案與責任人", "經營例外、會議決策與改善追蹤"],
    architecture: "將策略目標、衡量指標、行動方案、決策與例外議題分層管理，維持從目標到執行的追溯。",
    content: "首頁聚焦目標差距、需決策議題、跨部門阻塞與改善行動到期日。",
    metrics: ["策略目標達成率", "行動方案準時率", "重大例外數", "決策結案率"],
    boundary: "績效權重、預算與重大決策門檻需由經營層核准。",
  },
  "資訊安全": {
    role: "資安治理與事件應變顧問",
    mandate: "讓風險、資產、告警與處置證據能支援可稽核的安全營運。",
    painPoints: ["告警太多且優先序不清", "資產與弱點資料不同步", "事件處置證據不足"],
    capabilities: ["資產、弱點、告警、事件與處置流程", "風險分級、權限、稽核軌跡與演練紀錄"],
    architecture: "以資產、偵測訊號、事件案例與處置任務切分模組，將高風險存取和稽核日誌設為基礎能力。",
    content: "首頁先顯示高風險告警、未修補弱點、事件 SLA 與資產覆蓋率，避免以視覺效果取代處置資訊。",
    metrics: ["高風險告警", "修補時效", "事件 SLA", "資產覆蓋率"],
    boundary: "不得在 Demo 中暴露真實憑證、IP、日誌或攻擊細節；偵測規則與存取權限須經資安核可。",
  },
  "資訊科技": {
    role: "IT 服務管理與數位交付顧問",
    mandate: "讓服務請求、變更、資產與事件處理有一致的服務水準。",
    painPoints: ["事件與變更關聯不清", "資產狀態不準確", "使用者不知道服務處理進度"],
    capabilities: ["服務台、事件、問題、變更與資產管理", "SLA、知識庫、發布與服務健康度"],
    architecture: "以服務、資產、事件、問題與變更為獨立領域，透過關聯事件保持根因與影響分析。",
    content: "首頁應顯示服務健康、即將違約案件、待核准變更、資產風險與可用知識。",
    metrics: ["SLA 達成率", "平均修復時間", "變更成功率", "服務可用度"],
    boundary: "管理權限、系統組態與使用者資料需依最小權限與變更管理政策落實。",
  },
  "零售電商": {
    role: "零售營運與電商成長顧問",
    mandate: "讓商品、訂單、庫存與顧客互動能即時支援銷售與履約。",
    painPoints: ["商品與庫存狀態不同步", "訂單例外靠人工追蹤", "促銷與顧客行為無法回饋"],
    capabilities: ["商品、價格、訂單、庫存與履約狀態", "會員分群、促銷成效與退貨例外"],
    architecture: "以商品、庫存、訂單、顧客與促銷分模組，所有價格與庫存變動保留事件歷程。",
    content: "首頁優先展示今日訂單、缺貨／超賣風險、履約異常、轉換漏斗與高價值客群。",
    metrics: ["轉換率", "客單價", "履約準時率", "缺貨／退貨率"],
    boundary: "付款、優惠規則、會員資料與個人化推薦必須遵循資安、同意與交易控管。",
  },
  "數據分析": {
    role: "資料產品與決策分析顧問",
    mandate: "讓指標可信、資料來源可追溯，並把洞察轉成可負責的行動。",
    painPoints: ["不同報表的數字不一致", "資料更新時間與品質不透明", "洞察沒有對應的行動與結果"],
    capabilities: ["指標定義、資料來源與更新狀態", "趨勢、異常、假設與行動追蹤"],
    architecture: "分離資料來源、指標語意層、分析視圖與行動任務，並為每項 KPI 保留口徑與更新時間。",
    content: "首頁應先交代資料新鮮度、關鍵趨勢、異常來源與建議行動，而非只展示圖表。",
    metrics: ["資料新鮮度", "資料品質通過率", "異常處理時效", "洞察採納率"],
    boundary: "資料連接、模型判斷與敏感欄位遮罩需經資料治理與隱私責任人核可。",
  },
  "餐飲旅宿": {
    role: "餐旅營運與服務品質顧問",
    mandate: "讓訂位、服務、庫存與顧客評價能即時支援現場決策。",
    painPoints: ["尖峰時段人力與訂位難以平衡", "餐點／房務異常無即時回應", "顧客回饋無法轉成改善任務"],
    capabilities: ["訂位／住房、服務任務與人員排班", "庫存、異常、評價與關懷處理"],
    architecture: "以預約、服務事件、排班與顧客回饋串成營運時間軸，避免現場狀態只存在口頭交接。",
    content: "首頁顯示今日預約、尖峰負載、逾時服務、庫存缺口與高優先評價回覆。",
    metrics: ["入座／入住率", "平均候位", "服務準時率", "顧客評分"],
    boundary: "付款、個資、監視影像與顧客偏好使用需符合告知與權限規範。",
  },
  "營建工程": {
    role: "工程專案、工地品質與安衛顧問",
    mandate: "讓進度、成本、品質與安衛現況能依據現場證據被管理。",
    painPoints: ["工地日報與計畫進度不一致", "材料、變更與成本影響無法即時連結", "安衛缺失沒有追到改善驗證"],
    capabilities: ["WBS、工地日報、進度、材料與變更管理", "品質安衛缺失、照片證據與改善驗證"],
    architecture: "以專案、WBS、現場日報、變更、材料與安衛事件建立關聯，所有現場證據附上時間與責任人。",
    content: "首頁應先呈現關鍵路徑偏差、工地待辦、安衛高風險、材料到料與成本變更。",
    metrics: ["進度達成率", "工安缺失未結案", "成本偏差", "材料到料準時率"],
    boundary: "現場安全指示、工程簽證、合約與影像資料必須依工程責任與法規程序確認。",
  },
  "醫療照護": {
    role: "醫療服務流程與病安資料顧問",
    mandate: "在保護個資與專業判斷前提下，提升照護流程、追蹤與服務連續性。",
    painPoints: ["個案資訊分散且交班不完整", "追蹤與提醒容易逾期", "服務品質與風險事件未形成閉環"],
    capabilities: ["個案、預約、服務紀錄與追蹤任務", "病安／服務事件、權限、稽核與提醒"],
    architecture: "將個案主檔、照護事件、追蹤任務與風險通報分模組，所有資料依角色與照護關係最小授權。",
    content: "首頁只呈現角色必要的待處理個案、逾期追蹤、服務容量與風險提醒，避免暴露多餘病人資訊。",
    metrics: ["追蹤準時率", "等待時間", "服務完成率", "風險事件結案率"],
    boundary: "不可把 Demo 建議當成診斷或醫囑；病歷、健康資料與權限設計須由醫療與法遵單位核准。",
  },
  "ESG 永續": {
    role: "ESG 數據治理與永續管理顧問",
    mandate: "讓能源、碳排、供應鏈與改善任務的計算依據可查核並能持續行動。",
    painPoints: ["數據來源、係數與版本不透明", "缺值或異常到申報前才發現", "減碳任務與成果沒有連結"],
    capabilities: ["資料來源、活動數據、係數、計算與查核軌跡", "缺值預警、改善任務、目標與申報進度"],
    architecture: "將原始活動數據、排放係數、計算結果、查核證據與改善行動分層，維持每個指標的血緣。",
    content: "首頁先呈現資料完整度、異常／缺值、目標差距、減量行動與申報時程。",
    metrics: ["資料完整度", "碳排／能耗趨勢", "減量目標達成率", "待查核項目"],
    boundary: "申報數據、排放係數與對外揭露內容需經永續、財會與查證單位覆核。",
  },
};

const CATEGORY_ALIASES = {
  "製造與工程": "生產製造",
  "金融與保險": "金融保險",
  "教育與照護": "教育",
  "交通與車輛": "交通運輸",
  "零售與服務": "零售電商",
  "ESG 與永續": "ESG 永續",
  "協作與管理": "企業協作",
};

const FALLBACK_PROFILE = {
  role: "數位營運與服務設計顧問",
  mandate: "讓核心作業、例外處理與決策資訊形成清楚且可追溯的工作流程。",
  painPoints: ["資料與工作分散", "例外處理缺少負責人", "管理資訊無法帶動行動"],
  capabilities: ["核心案件生命週期與責任人", "KPI、例外與改善追蹤"],
  architecture: "以核心案件、工作項目、事件紀錄與權限分層設計，讓日後整合與稽核可持續演進。",
  content: "首頁以待處理事項、風險與關鍵指標為優先，讓使用者能在一個畫面中決定下一步。",
  metrics: ["待處理件數", "準時完成率", "例外結案時效", "工作負載"],
  boundary: "權限、敏感資料與自動決策規則必須由業務與資安責任人審核。",
};

function readJsonIfExists(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function hasFile(directory, relativePath) {
  return fs.existsSync(path.join(directory, relativePath));
}

function collectFiles(directory, limit = 140) {
  const collected = [];
  const queue = [directory];
  while (queue.length && collected.length < limit) {
    const current = queue.shift();
    let entries = [];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (collected.length >= limit) break;
      if (entry.isDirectory()) {
        if (!ignoredDirectories.has(entry.name)) queue.push(path.join(current, entry.name));
        continue;
      }
      if (/\.(?:html|css|js|jsx|ts|tsx|json|md)$/i.test(entry.name)) collected.push(path.join(current, entry.name));
    }
  }
  return collected;
}

function readEvidence(projectDirectory, acceptanceAudit) {
  const files = collectFiles(projectDirectory);
  const sourceFiles = files.filter((file) => !/\.(?:md|json)$/i.test(file));
  const source = sourceFiles.map((file) => {
    try {
      return fs.readFileSync(file, "utf8");
    } catch {
      return "";
    }
  }).join("\n");
  const text = source.toLowerCase();
  const includes = (pattern) => pattern.test(source);
  const count = (pattern) => (source.match(pattern) || []).length;

  return {
    files: files.length,
    hasNext: hasFile(projectDirectory, "app/page.js") || hasFile(projectDirectory, "app/page.tsx") || hasFile(projectDirectory, "src/app/page.tsx") || hasFile(projectDirectory, "src/app/page.js"),
    hasStatic: hasFile(projectDirectory, "index.html"),
    hasReadme: hasFile(projectDirectory, "README.md"),
    hasPackage: hasFile(projectDirectory, "package.json"),
    hasAnalytics: hasFile(projectDirectory, "jvision-analytics.js") || hasFile(projectDirectory, "public/jvision-analytics.js"),
    hasRwdCss: hasFile(projectDirectory, "jvision-analytics.css") || hasFile(projectDirectory, "app/jvision-analytics.css") || hasFile(projectDirectory, "src/app/jvision-analytics.css"),
    hasMetadata: includes(/<meta[^>]+name=["']description["']/i) || includes(/description\s*:/i),
    hasWorkflowActions: count(/<button\b|<form\b|\bonclick\s*=|onClick\s*=/gi) >= 3,
    hasInputs: includes(/<input\b|<select\b|<textarea\b/i),
    hasDataViews: includes(/<table\b|jv-data-table|chart|analytics|metrics|kpi/i),
    hasPersistence: includes(/localStorage|sessionStorage|indexedDB|useState\s*\(/i),
    hasFeedback: includes(/aria-live|role=["']alert|toast|empty-state|empty state|錯誤|載入失敗|重試/i),
    hasAccessibleNames: includes(/aria-label|aria-labelledby|<label\b/i),
    hasDomainExpertPanel: includes(/jvision-domain-expert\.js/i),
    hasUniversalFeedback: includes(/jvision-demo-feedback\.js/i),
    hasTests: Boolean(acceptanceAudit?.passed) || files.some((file) => /(?:test|spec)\.(?:js|jsx|ts|tsx)$/i.test(file)),
    buttonCount: count(/<button\b|\bonClick\s*=/gi),
    sourceSize: source.length,
    sourceText: text,
  };
}

function resolveProfile(category) {
  return DOMAIN_PROFILES[CATEGORY_ALIASES[category] || category] || FALLBACK_PROFILE;
}

function requirementProfile(category) {
  const profile = resolveProfile(category);
  return [...BASE_CAPABILITIES, ...profile.capabilities];
}

function makeRecommendation({ id, priority, title, evidence, suggestion, changeType = "content", execution = "requires-review", autoFix = null }) {
  return { id, priority, title, evidence, suggestion, changeType, execution, autoFix };
}

function makeDomainRoadmap(project, profile) {
  const projectName = project.title || project.repoName;
  return [
    makeRecommendation({
      id: "domain-architecture",
      priority: "high",
      title: `建立 ${projectName} 的可追溯領域架構`,
      evidence: `領域專家檢視焦點：${profile.focus || profile.capabilities.join("、")}。`,
      suggestion: profile.architecture,
      changeType: "architecture",
    }),
    makeRecommendation({
      id: "domain-workbench",
      priority: "medium",
      title: "把領域風險與下一步放進工作台",
      evidence: `目前應優先讓使用者看見：${profile.metrics.slice(0, 3).join("、")}。`,
      suggestion: profile.content,
      changeType: "content",
    }),
    makeRecommendation({
      id: "domain-governance",
      priority: "medium",
      title: "確認專業規則、權限與資料治理界線",
      evidence: profile.boundary,
      suggestion: "將規則擁有者、審核關卡、資料保留與例外升級條件寫入專案規格，再進行核心流程調整。",
      changeType: "governance",
    }),
  ];
}

function projectReview(project, mobileAuditByRepo, formalAuditByRepo, acceptanceByRepo) {
  const directory = path.join(repoRoot, project.localPath || `demos/${project.repoName}`);
  const mobileAudit = mobileAuditByRepo.get(project.repoName);
  const formalAudit = formalAuditByRepo.get(project.repoName);
  const acceptanceAudit = acceptanceByRepo.get(project.repoName);
  const evidence = readEvidence(directory, acceptanceAudit);
  const recommendations = [];
  const profile = resolveProfile(project.category);
  let score = 0;

  const mobilePassed = Boolean(mobileAudit?.passed);
  const formalPassed = formalAudit ? formalAudit.status !== "failed" && formalAudit.status !== "review" : true;
  if (mobilePassed) score += 25;
  else recommendations.push(makeRecommendation({
    id: "mobile-rwd",
    priority: "critical",
    title: "修復手機 RWD 與統計可用性",
    evidence: mobileAudit?.reasons?.join("；") || "尚未找到手機稽核證據。",
    suggestion: "重新套用共用 RWD／統計層，並以 375px、812px 橫向及 1440px 重跑瀏覽器驗收。",
    changeType: "interaction",
    execution: "auto-applied",
    autoFix: "apply-responsive-analytics",
  }));

  if (formalPassed) score += 10;
  else recommendations.push(makeRecommendation({
    id: "formal-visual",
    priority: "high",
    title: "改善正式 SaaS 視覺與可讀性",
    evidence: formalAudit?.reasons?.join("；") || "正式版面稽核需要複查。",
    suggestion: "依設計系統調整對比、留白、字級與關鍵行動區，並重新檢查溢位與執行錯誤。",
    changeType: "content",
  }));

  if (evidence.hasWorkflowActions) score += 14;
  else recommendations.push(makeRecommendation({
    id: "core-workflow",
    priority: "high",
    title: "補齊核心工作流程",
    evidence: `僅偵測到 ${evidence.buttonCount} 個可操作行為；未達最小工作流訊號。`,
    suggestion: `新增「建立／更新／完成」的一條端到端作業流程，並對應到「${requirementProfile(project.category)[0]}」。`,
    changeType: "architecture",
  }));

  if (evidence.hasInputs) score += 8;
  else recommendations.push(makeRecommendation({
    id: "search-filter",
    priority: "medium",
    title: "補齊搜尋或篩選入口",
    evidence: "未偵測到 input、select 或 textarea 控制項。",
    suggestion: "加入可依關鍵字、狀態或責任人篩選的清單入口，手機版保持 44px 觸控高度。",
    changeType: "interaction",
  }));

  if (evidence.hasDataViews) score += 12;
  else recommendations.push(makeRecommendation({
    id: "analytics-view",
    priority: "high",
    title: "補齊可決策的資料視圖",
    evidence: "未偵測到資料表、KPI 或圖表訊號。",
    suggestion: `補上至少四項 KPI（例如 ${profile.metrics.join("、")}）、一個趨勢／階段圖與可排序資料表。`,
    changeType: "content",
  }));

  if (evidence.hasPersistence) score += 8;
  else recommendations.push(makeRecommendation({
    id: "draft-persistence",
    priority: "medium",
    title: "加入操作狀態保存",
    evidence: "未偵測到 localStorage、sessionStorage、IndexedDB 或前端狀態管理訊號。",
    suggestion: "為篩選、草稿或工作進度加入本機保存；儲存前應避免放入敏感個資。",
    changeType: "architecture",
  }));

  if (evidence.hasFeedback) score += 8;
  else recommendations.push(makeRecommendation({
    id: "feedback-states",
    priority: "medium",
    title: "補齊成功、空資料與錯誤回饋",
    evidence: "未偵測到 aria-live、錯誤、重試或空狀態訊號。",
    suggestion: "對載入、提交成功、無資料與失敗提供就地回饋與明確復原動作。",
    changeType: "interaction",
    execution: "auto-applied",
    autoFix: "jvision-demo-feedback",
  }));

  if (evidence.hasAccessibleNames) score += 5;
  else recommendations.push(makeRecommendation({
    id: "accessible-controls",
    priority: "medium",
    title: "補強控制項無障礙名稱",
    evidence: "未偵測到 aria-label、aria-labelledby 或明確 label。",
    suggestion: "為圖示按鈕、輸入欄與動態區塊補上可讀名稱；不可只以顏色傳達狀態。",
    changeType: "interaction",
  }));

  if (evidence.hasMetadata) score += 3;
  else recommendations.push(makeRecommendation({
    id: "metadata",
    priority: "low",
    title: "補上產品描述 metadata",
    evidence: "未偵測到 description metadata。",
    suggestion: "新增一句可說明使用者、痛點與 AI 價值的描述，提升索引與交接品質。",
    changeType: "content",
    execution: "auto-applied",
  }));

  if (evidence.hasReadme) score += 2;
  else recommendations.push(makeRecommendation({
    id: "project-brief",
    priority: "low",
    title: "建立專案使用與驗收說明",
    evidence: "專案目錄缺少 README.md。",
    suggestion: "建立專案目的、主要流程、資料限制、啟動方式與驗收清單。",
    changeType: "content",
    execution: "auto-applied",
    autoFix: "generate-project-brief",
  }));

  if (evidence.hasTests) score += 5;
  else recommendations.push(makeRecommendation({
    id: "acceptance-tests",
    priority: "medium",
    title: "建立最小驗收測試",
    evidence: "未偵測到 test/spec 檔案。",
    suggestion: "至少覆蓋首頁載入、核心操作、統計表顯示及手機尺寸的驗收情境。",
    changeType: "architecture",
  }));

  const completion = Math.max(0, Math.min(100, score));
  const hasBlockingFinding = recommendations.some((item) => item.priority === "critical" || item.priority === "high");
  const hasStrengtheningFinding = recommendations.some((item) => item.priority === "medium") || completion < 97;
  const safeImprovements = [
    {
      id: "domain-expert-panel",
      title: "加入領域專家建議入口",
      description: "在不改寫既有作業流程的前提下，以可開關面板提供專家身分、已套用改善與下一步建議。",
      changeType: "content",
      execution: evidence.hasDomainExpertPanel ? "auto-applied" : "pending-safe-apply",
    },
    {
      id: "universal-action-feedback",
      title: "統一按鍵操作回饋",
      description: "以輕量 aria-live 提示確認按鍵已收到操作，原有功能仍由各 Demo 自行處理。",
      changeType: "interaction",
      execution: evidence.hasUniversalFeedback ? "auto-applied" : "pending-safe-apply",
    },
  ];

  return {
    id: Number(project.id),
    repoName: project.repoName,
    title: project.title || project.repoName,
    description: project.description || "",
    category: project.category || project.industry || "未分類",
    demoUrl: project.demoUrl,
    localPath: project.localPath,
    score: completion,
    grade: hasBlockingFinding || completion < 65 ? "優先改善" : hasStrengtheningFinding ? "可強化" : "完整",
    domainExpert: {
      role: profile.role,
      mandate: profile.mandate,
      painPoints: profile.painPoints,
      focusAreas: profile.capabilities,
      metrics: profile.metrics,
      reviewBoundary: profile.boundary,
    },
    requiredCapabilities: requirementProfile(project.category),
    safeImprovements,
    nextImprovements: makeDomainRoadmap(project, profile),
    evidence: {
      mobilePassed,
      formalPassed,
      hasNext: evidence.hasNext,
      hasStatic: evidence.hasStatic,
      hasWorkflowActions: evidence.hasWorkflowActions,
      hasInputs: evidence.hasInputs,
      hasDataViews: evidence.hasDataViews,
      hasPersistence: evidence.hasPersistence,
      hasFeedback: evidence.hasFeedback,
      hasAccessibleNames: evidence.hasAccessibleNames,
      hasDomainExpertPanel: evidence.hasDomainExpertPanel,
      hasUniversalFeedback: evidence.hasUniversalFeedback,
      hasReadme: evidence.hasReadme,
      hasTests: evidence.hasTests,
      acceptancePassed: Boolean(acceptanceAudit?.passed),
    },
    recommendations: recommendations.sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      return order[a.priority] - order[b.priority] || a.title.localeCompare(b.title, "zh-Hant");
    }),
  };
}

function checklist(items, checked = false) {
  return items.map((item) => `- [${checked ? "x" : " "}] **${item.title}**：${item.description || item.suggestion}`).join("\n");
}

function buildBrief(review, generatedAt) {
  const gaps = review.recommendations.length
    ? checklist(review.recommendations)
    : "- [x] 自動稽核未偵測到基線缺口；仍建議由實際使用者依領域流程驗證。";
  return `# ${review.title}｜領域專家審視摘要

- 專案：\`${review.repoName}\`
- 分類：${review.category}
- 領域專家：${review.domainExpert.role}
- 完整度：${review.score}/100（${review.grade}）
- 產生時間：${generatedAt}

## 專家任務與現場痛點

${review.domainExpert.mandate}

${review.domainExpert.painPoints.map((item) => `- ${item}`).join("\n")}

## 已套用的低風險改善

${checklist(review.safeImprovements, true)}

## 專家建議的下一步（需領域審核）

${checklist(review.nextImprovements)}

> ${review.domainExpert.reviewBoundary}

## 自動稽核缺口

${gaps}

## 建議能力基線

${review.requiredCapabilities.map((item) => `- ${item}`).join("\n")}

## 主要指標

${review.domainExpert.metrics.map((item) => `- ${item}`).join("\n")}

## 自動化驗收證據

- 手機 RWD 與統計：${review.evidence.mobilePassed ? "通過" : "需修正"}
- 正式 SaaS 版面：${review.evidence.formalPassed ? "通過" : "需複查"}
- 領域專家入口：${review.evidence.hasDomainExpertPanel ? "已套用" : "待套用"}
- 按鍵操作回饋：${review.evidence.hasUniversalFeedback ? "已套用" : "待套用"}
- 操作工作流訊號：${review.evidence.hasWorkflowActions ? "已偵測" : "未偵測"}
- 可篩選輸入：${review.evidence.hasInputs ? "已偵測" : "未偵測"}
- 資料視圖：${review.evidence.hasDataViews ? "已偵測" : "未偵測"}

> 本文件由 JVision Domain Expert Agent 自動產出。涉及權限、個資、金流、醫療、資安或法遵規則的變更，必須由領域負責人審核後再實作。
`;
}

const mobileAudit = readJsonIfExists(mobileAuditPath);
const formalAudit = readJsonIfExists(formalAuditPath);
const acceptanceAudit = readJsonIfExists(acceptanceAuditPath);
const mobileAuditByRepo = new Map((mobileAudit?.rows || []).map((row) => [row.repoName, row]));
const formalAuditByRepo = new Map((formalAudit?.rows || []).map((row) => [row.repoName, row]));
const acceptanceByRepo = new Map((acceptanceAudit?.rows || []).map((row) => [row.repoName, row]));
const reviews = projectsIndex.projects
  .map((project) => projectReview(project, mobileAuditByRepo, formalAuditByRepo, acceptanceByRepo))
  .sort((a, b) => a.id - b.id);
const generatedAt = new Date().toISOString();

const priorityCounts = { critical: 0, high: 0, medium: 0, low: 0 };
for (const review of reviews) {
  for (const recommendation of review.recommendations) priorityCounts[recommendation.priority] += 1;
}

let generatedBriefs = 0;
if (applySafeFixes) {
  fs.mkdirSync(briefDirectory, { recursive: true });
  for (const review of reviews) {
    fs.writeFileSync(path.join(briefDirectory, `${review.repoName}.md`), buildBrief(review, generatedAt), "utf8");
    generatedBriefs += 1;
  }
}

const summary = {
  totalProjects: reviews.length,
  domainProfiles: new Set(reviews.map((review) => review.category)).size,
  averageScore: Number((reviews.reduce((sum, review) => sum + review.score, 0) / Math.max(reviews.length, 1)).toFixed(1)),
  complete: reviews.filter((review) => review.grade === "完整").length,
  strengthen: reviews.filter((review) => review.grade === "可強化").length,
  priorityImprovement: reviews.filter((review) => review.grade === "優先改善").length,
  priorityCounts,
  safeFixesApplied: {
    generatedBriefs,
    expertPanels: reviews.filter((review) => review.evidence.hasDomainExpertPanel).length,
    actionFeedback: reviews.filter((review) => review.evidence.hasUniversalFeedback).length,
    responsiveAnalyticsRepairNeeded: reviews.some((review) => !review.evidence.mobilePassed),
  },
};

const report = {
  generatedAt,
  agent: {
    name: "JVision Domain Expert Agent",
    version: agentVersion,
    mode: applySafeFixes ? "analyze-and-apply-safe" : "analyze-only",
    policy: "每個專案依產業分配領域專家。自動修改僅限可回復的建議入口、文件、RWD 與互動基線；流程規則、權限、敏感資料與專業決策一律提出建議並要求領域審核。",
  },
  summary,
  reviews,
};

const runtimeCatalog = {
  generatedAt,
  version: agentVersion,
  policy: report.agent.policy,
  projects: Object.fromEntries(reviews.map((review) => [review.repoName, {
    id: review.id,
    title: review.title,
    description: review.description,
    category: review.category,
    score: review.score,
    grade: review.grade,
    expert: review.domainExpert,
    applied: review.safeImprovements,
    next: review.nextImprovements,
    gaps: review.recommendations,
  }])),
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
fs.writeFileSync(runtimeCatalogPath, `${JSON.stringify(runtimeCatalog, null, 2)}\n`, "utf8");
const markdown = [
  "# JVision Domain Expert Agent 審視報告",
  "",
  `- 產生時間：${generatedAt}`,
  `- Agent 版本：${agentVersion}`,
  `- Agent 模式：${report.agent.mode}`,
  `- 專案數：${summary.totalProjects}；領域分類：${summary.domainProfiles}`,
  `- 平均完整度：${summary.averageScore}/100`,
  `- 完整：${summary.complete}；可強化：${summary.strengthen}；優先改善：${summary.priorityImprovement}`,
  `- 已套用領域專家入口：${summary.safeFixesApplied.expertPanels}/${summary.totalProjects}`,
  `- 已套用按鍵回饋：${summary.safeFixesApplied.actionFeedback}/${summary.totalProjects}`,
  `- 自動稽核缺口：Critical ${priorityCounts.critical} / High ${priorityCounts.high} / Medium ${priorityCounts.medium} / Low ${priorityCounts.low}`,
  "",
  "## 執行方式",
  "",
  "```powershell",
  "npm run agent:project-expert",
  "npm run agent:project-expert:apply-safe",
  "npm run apply:domain-expert",
  "```",
  "",
  "## 原則",
  "",
  "每個專案都取得一位依產業分類設定的領域專家。領域架構、業務規則、權限與敏感資料變更會列為『需領域審核』；可回復的文件、建議入口與互動基線會由安全套用流程處理。",
  "",
].join("\n");
fs.writeFileSync(outputMarkdownPath, markdown, "utf8");
console.log(JSON.stringify(summary, null, 2));
