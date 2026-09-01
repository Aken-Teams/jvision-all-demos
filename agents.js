/* 專案 Agents — 團隊資料與渲染邏輯（純前端 demo，尚未接真實後端）
 * 分類系統：4 大分類 (BIG) → 16 小分類 (CAT)，每個大分類一種顏色。 */

const BIGS = [
  { key: "plan",   name: "顧問與規劃", en: "ADVISORY & PLANNING", color: "violet",  desc: "把需求對應到最合適的系統、產業做法與導入路線。" },
  { key: "assure", name: "審視與治理", en: "ASSURANCE",           color: "amber",   desc: "為完整度、風險與品質把關，敏感決策一律保留人工覆核。" },
  { key: "build",  name: "生成與交付", en: "BUILD & DELIVER",     color: "blue",    desc: "把結論落成規格、介面、示範資料與可交付產物。" },
  { key: "ops",    name: "營運與分析", en: "OPERATIONS",          color: "emerald", desc: "算清效益、排程、進度與數據，讓導入可被追蹤。" },
];

/* 小分類（也是市集的篩選維度）。icon/caps/sample 由此決定。 */
const CATS = [
  // 顧問與規劃 (violet)
  { key: "match",       name: "選型顧問",   big: "plan",   icon: "travel_explore", caps: ["需求匹配", "方案比較", "信心評分"], b: "挑出最合適的系統",       st: "推薦系統",   r: ["系統適配", "需求覆蓋", "信心分數"] },
  { key: "expert",      name: "領域專家",   big: "plan",   icon: "school",         caps: ["產業痛點", "落地建議", "標竿比對"], b: "指出真正的痛點與做法",   st: "產業洞察",   r: ["痛點命中", "落地建議", "標竿覆蓋"] },
  { key: "strategy",    name: "策略規劃",   big: "plan",   icon: "architecture",   caps: ["導入路線", "階段規劃", "里程碑"],   b: "把目標拆成清楚的路線",   st: "導入路線",   r: ["里程碑", "風險預抓", "時程準確"] },
  { key: "orchestrate", name: "指揮調度",   big: "plan",   icon: "hub",            caps: ["需求理解", "任務拆解", "分派協調"], b: "聽懂一句話並統籌全局",   st: "任務拆解",   r: ["理解準確", "任務覆蓋", "分派命中"] },
  // 審視與治理 (amber)
  { key: "audit",       name: "完整度稽核", big: "assure", icon: "fact_check",     caps: ["完整度稽核", "缺口偵測", "證據標註"], b: "把缺口攤在陽光下",     st: "稽核結果",   r: ["完整度", "缺口偵測", "證據覆蓋"] },
  { key: "compliance",  name: "風險合規",   big: "assure", icon: "gavel",          caps: ["敏感偵測", "政策檢核", "權限治理"], b: "敏感決策先攔下來覆核",   st: "合規結果",   r: ["敏感偵測", "政策符合", "攔截準確"] },
  { key: "quality",     name: "品質稽核",   big: "assure", icon: "rule",           caps: ["一致性檢查", "驗收基線", "回歸把關"], b: "守住驗收與品質基線",   st: "品質稽核",   r: ["一致性", "驗收通過", "回歸攔截"] },
  { key: "monitor",     name: "即時監控",   big: "assure", icon: "monitoring",     caps: ["即時監控", "門檻告警", "狀態追蹤"], b: "盯住每個關鍵指標",       st: "監控指標",   r: ["即時掌握", "門檻告警", "狀態追蹤"] },
  // 生成與交付 (blue)
  { key: "doc",         name: "文件規格",   big: "build",  icon: "edit_document",  caps: ["規格撰寫", "SOW", "需求轉換"],     b: "把結論寫成能簽章的文件", st: "文件產出",   r: ["需求覆蓋", "可讀性", "審核通過"] },
  { key: "design",      name: "介面設計",   big: "build",  icon: "palette",        caps: ["介面草稿", "設計 prompt", "元件規範"], b: "產出介面草稿與設計規範", st: "設計產出", r: ["元件一致", "可用性", "交付速度"] },
  { key: "datagen",     name: "資料填充",   big: "build",  icon: "dataset",        caps: ["擬真資料", "情境樣本", "邊界案例"], b: "填進擬真資料讓 demo 像真的", st: "示範資料", r: ["擬真度", "情境覆蓋", "邊界案例"] },
  { key: "assist",      name: "智慧助理",   big: "build",  icon: "support_agent",  caps: ["問答協助", "流程引導", "自動填寫"], b: "隨問隨答、代你處理雜事", st: "處理項目",   r: ["問答準確", "流程引導", "自動填寫"] },
  // 營運與分析 (emerald)
  { key: "finance",     name: "財務效益",   big: "ops",    icon: "calculate",      caps: ["效益估算", "成本結構", "回收評估"], b: "把效益算成看得懂的數字", st: "ROI 試算",   r: ["效益估準", "成本涵蓋", "回收評估"] },
  { key: "schedule",    name: "排程調度",   big: "ops",    icon: "calendar_month", caps: ["資源排程", "任務分派", "衝突偵測"], b: "資源與時程排好排滿",     st: "排程結果",   r: ["資源利用", "衝突偵測", "準時達成"] },
  { key: "analyze",     name: "數據洞察",   big: "ops",    icon: "query_stats",    caps: ["指標分析", "趨勢解讀", "異常偵測"], b: "把資料變成看得懂的洞察", st: "分析結果",   r: ["關鍵指標", "趨勢變化", "異常比例"] },
  { key: "forecast",    name: "預測預警",   big: "ops",    icon: "trending_up",    caps: ["需求預測", "風險預警", "情境模擬"], b: "提前看見風險與需求",     st: "預測信心",   r: ["短期預測", "風險預警", "情境命中"] },
];

/* 大分類顏色 → icon 圓框樣式 */
const BIG_ACCENT = {
  violet:  "bg-violet/10 text-violet",
  amber:   "bg-amber/10 text-amber",
  blue:    "bg-brand2/10 text-brand2",
  emerald: "bg-emerald-500/10 text-emerald-600",
};
const BIG_TEXT = { violet: "text-violet", amber: "text-amber", blue: "text-brand2", emerald: "text-emerald-600" };
const BIG_RING = { violet: "ring-violet/50", amber: "ring-amber/50", blue: "ring-brand2/50", emerald: "ring-emerald-500/50" };

// status: active（執行中）/ idle（待命）/ pending（待審核）
const AGENTS = [
  { id: "orchestrator", cat: "orchestrate", name: "智策", role: "總指揮 Agent", status: "active",
    tagline: "聽懂一句話，把它變成整支團隊的作戰計畫。",
    detail: "解析你的一句話目標，判定需要哪些領域專家，拆成有先後關係的子任務並即時調度，最後把各 agent 的產物彙整成可交付成果。",
    inputs: ["一句話目標", "限制條件", "既有資源"], projects: ["跨部門協作", "數位轉型", "專案立案"] },
  { id: "matchmaker", cat: "match", name: "選配", role: "選型顧問 Agent", status: "active",
    tagline: "從 2015 套系統中，挑出最貼你需求的那幾套。",
    detail: "依你的產業、規模、預算與痛點，對 2015 套 JVision 系統做多維度比對，產出帶信心分數的推薦清單與比較矩陣。",
    inputs: ["一句話需求", "產業別", "公司規模", "預算區間", "既有系統"], projects: ["生產製造", "採購供應鏈", "品質管理", "數位轉型"],
    sample: { type: "score", title: "推薦系統清單", rows: [{ t: "生產工單管理", v: 92 }, { t: "AI 產線智排中心", v: 88 }, { t: "設備預測維護", v: 81 }] } },
  { id: "expert", cat: "expert", name: "行家", role: "產業領域專家 Agent", status: "active",
    tagline: "29 個產業的落地經驗，指出真正的痛點。",
    detail: "涵蓋 29 個產業的領域知識，針對你的情境指出關鍵痛點、標竿做法與導入時的常見地雷。",
    inputs: ["產業別", "情境描述", "現況問題"], projects: ["智慧製造", "醫療照護", "ESG 永續", "零售電商"] },
  { id: "blueprint", cat: "strategy", name: "藍圖", role: "導入策略顧問 Agent", status: "idle",
    tagline: "把「要導入」拆成清楚的階段與里程碑。",
    detail: "將導入拆成試點、擴散、優化等階段，標出每階段的目標、依賴與里程碑，讓落地有節奏。",
    inputs: ["導入目標", "時程限制", "組織規模"], projects: ["專案管理", "數位轉型", "經營管理"] },
  { id: "auditor", cat: "audit", name: "明鏡", role: "專案完整度 Agent", status: "idle",
    tagline: "逐案稽核完整度，把缺口攤在陽光下。",
    detail: "沿用既有的 Project Expert 稽核能力，逐案檢視工作流程、清單、KPI、回饋與無障礙證據，標出可強化之處並附偵測證據。",
    inputs: ["專案清單", "稽核基線"], projects: ["品質管理", "專案治理"], link: "./project-expert.html" },
  { id: "guardian", cat: "compliance", name: "守衡", role: "風險與合規 Agent", status: "pending",
    tagline: "敏感決策先攔下來，交回人手上覆核。",
    detail: "偵測涉及業務規則、權限與敏感資料的動作，依企業政策標記為「需人工覆核」，確保 AI 不自動改動高風險項目。",
    inputs: ["決策內容", "企業政策", "權限矩陣"], projects: ["資訊安全", "法遵合規", "財務會計"] },
  { id: "calibrator", cat: "quality", name: "校準", role: "品質稽核 Agent", status: "idle",
    tagline: "驗收基線的守門員，回歸問題不放過。",
    detail: "對交付物做一致性與驗收檢查，維持命名、格式與品質基線，避免回歸問題。",
    inputs: ["交付物", "驗收準則"], projects: ["品質管理", "研發管理"] },
  { id: "drafter", cat: "doc", name: "擬稿", role: "規格 / SOW Agent", status: "idle",
    tagline: "把結論寫成能簽章的規格與 SOW。",
    detail: "將需求與推薦結論轉成結構化的導入規格書與工作說明書（SOW），可直接進入審核流程。",
    inputs: ["需求結論", "範圍界定"], projects: ["專案管理", "系統整合"] },
  { id: "designer", cat: "design", name: "繪境", role: "UI 設計 Agent", status: "idle",
    tagline: "產出介面草稿與設計 prompt（就像這頁）。",
    detail: "依系統定位產生介面草稿與可貼進設計工具的 prompt，並維持一致的元件與樣式規範。",
    inputs: ["系統定位", "風格指引"], projects: ["產品設計", "使用者體驗"] },
  { id: "seeder", cat: "datagen", name: "填實", role: "資料填充 Agent", status: "idle",
    tagline: "填進擬真資料，讓 demo 像真的在跑。",
    detail: "為系統填入符合情境的擬真示範資料，涵蓋正常、空資料與邊界案例，讓展示更可信。",
    inputs: ["資料結構", "情境設定"], projects: ["示範環境", "測試資料"] },
  { id: "narrator", cat: "assist", name: "講解", role: "導覽腳本 Agent", status: "idle",
    tagline: "三分鐘把系統賣點講清楚的腳本手。",
    detail: "為業務產出 3 分鐘導覽腳本，提煉賣點與操作動線，讓每一場 demo 都打中重點。",
    inputs: ["系統功能", "對象角色"], projects: ["業務銷售", "客戶簡報"] },
  { id: "abacus", cat: "finance", name: "算盤", role: "ROI 試算 Agent", status: "active",
    tagline: "把效益算成老闆看得懂的數字。",
    detail: "依情境資料試算導入效益、成本結構與投資回收期，輸出可對照 before→after 的 ROI 表。",
    inputs: ["現況數據", "成本假設"], projects: ["經營管理", "財務會計"] },
  { id: "quoter", cat: "finance", name: "估價", role: "報價 / 預算 Agent", status: "idle",
    tagline: "從需求直接長出一張清楚的報價單。",
    detail: "依範圍與規模產生報價單與授權方案建議，讓預算討論有依據。",
    inputs: ["導入範圍", "規模人數"], projects: ["採購供應鏈", "財務會計"] },
  { id: "scheduler", cat: "schedule", name: "排程", role: "專案排程 Agent", status: "idle",
    tagline: "資源與時程排好排滿，甘特圖一鍵成形。",
    detail: "把導入任務排成時程與資源配置，輸出甘特圖與關鍵路徑，讓進度可被規劃。",
    inputs: ["任務清單", "資源限制"], projects: ["專案管理", "生產製造"] },
  { id: "supervisor", cat: "schedule", name: "督導", role: "進度追蹤 Agent", status: "idle",
    tagline: "盯進度、示警風險、週報自動生。",
    detail: "持續追蹤任務進度、預警落後與風險，自動彙整週報與待辦，讓管理者一眼掌握。",
    inputs: ["專案進度", "風險門檻"], projects: ["專案管理", "經營管理"] },
  { id: "insighter", cat: "analyze", name: "洞察", role: "數據洞察 Agent", status: "idle",
    tagline: "從資料裡讀出趨勢與該做的決定。",
    detail: "彙整營運資料，解讀關鍵指標與趨勢，產出決策用的儀表板與洞察摘要。",
    inputs: ["營運資料", "關注指標"], projects: ["經營管理", "業務銷售"] },
];

/* ---------- 每個小分類的技能池（4~6 依 agent 而定）與「產出範例」模板 ---------- */
function _scColor(sc) { return sc >= 90 ? "success" : sc >= 80 ? "brand2" : "brand"; }
const CAT_SKILLS = {
  match: ["需求語意理解", "產業匹配", "規模與預算適配", "多方案比較", "信心評分", "比較矩陣產出"],
  expert: ["產業痛點診斷", "標竿做法比對", "落地建議", "導入地雷預警", "法規要點提示", "案例引用"],
  strategy: ["導入路線規劃", "階段拆解", "里程碑設定", "依賴與風險分析", "資源估算", "時程規劃"],
  orchestrate: ["需求理解", "任務拆解", "優先排序", "Agent 分派", "進度彙整", "交付彙總"],
  audit: ["完整度檢查", "缺口偵測", "證據標註", "流程盤點", "無障礙檢視", "改善建議"],
  compliance: ["敏感決策偵測", "政策比對", "權限治理", "資料合規檢查", "風險分級", "人工覆核標記"],
  quality: ["一致性檢查", "驗收基線", "回歸把關", "命名規範", "格式校對", "缺陷分級"],
  monitor: ["即時監控", "門檻告警", "狀態追蹤", "異常偵測", "趨勢觀測", "事件通報"],
  doc: ["需求轉換", "規格撰寫", "SOW 產出", "範圍界定", "驗收準則", "版本控管"],
  design: ["線框草稿", "介面設計", "設計 prompt", "元件規範", "設計 tokens", "可用性檢視"],
  datagen: ["擬真資料生成", "情境樣本", "邊界案例", "空資料案例", "資料遮罩", "分布校準"],
  assist: ["問答協助", "流程引導", "自動填寫", "表單處理", "知識檢索", "任務代辦"],
  finance: ["效益估算", "成本結構分析", "回收期試算", "敏感度分析", "預算配置", "ROI 報表"],
  schedule: ["資源排程", "任務分派", "衝突偵測", "關鍵路徑", "甘特圖產出", "負載平衡"],
  analyze: ["指標分析", "趨勢解讀", "異常偵測", "分群洞察", "儀表板產出", "決策建議"],
  forecast: ["需求預測", "風險預警", "情境模擬", "季節性分析", "信賴區間", "預警通知"],
};
const CAT_OUT = {
  match: { type: "score", title: "推薦方案清單", rows: [{ t: "方案 A · 高適配", v: 92 }, { t: "方案 B · 成本優先", v: 86 }, { t: "方案 C · 快速導入", v: 80 }] },
  expert: { type: "check", title: "痛點與建議", rows: [{ t: "點出 3 大關鍵痛點", ok: true }, { t: "對應落地建議 ×3", ok: true }, { t: "導入地雷提醒 ×2", ok: true }] },
  strategy: { type: "step", title: "導入路線圖", rows: ["第一階段 · 試點導入", "第二階段 · 擴散推廣", "第三階段 · 優化營運"] },
  orchestrate: { type: "step", title: "任務拆解 (DAG)", rows: ["理解並澄清需求", "拆解並分派子任務", "彙整各 Agent 產出"] },
  audit: { type: "check", title: "稽核發現", rows: [{ t: "核心流程完整", ok: true }, { t: "缺少操作回饋機制", ok: false }, { t: "未處理空資料狀態", ok: false }] },
  compliance: { type: "check", title: "合規檢查", rows: [{ t: "權限治理通過", ok: true }, { t: "自動決策需人工覆核", ok: false }, { t: "資料保留符合政策", ok: true }] },
  quality: { type: "check", title: "驗收結果", rows: [{ t: "命名與格式一致", ok: true }, { t: "驗收基線通過", ok: true }, { t: "1 項回歸待修正", ok: false }] },
  monitor: { type: "check", title: "監控狀態", rows: [{ t: "產能指標 正常", ok: true }, { t: "安全庫存 低於門檻", ok: false }, { t: "設備溫度 正常", ok: true }] },
  doc: { type: "step", title: "規格文件目錄", rows: ["1. 範圍與目標", "2. 功能需求", "3. 介面與資料", "4. 驗收準則"] },
  design: { type: "item", title: "設計產出", rows: ["線框稿 ×5 頁", "元件規範", "設計 tokens", "互動原型"] },
  datagen: { type: "item", title: "示範資料", rows: ["正常資料 ×120 筆", "空資料案例 ×3", "邊界案例 ×8"] },
  assist: { type: "check", title: "處理清單", rows: [{ t: "已回覆 3 個提問", ok: true }, { t: "已代填 2 張表單", ok: true }, { t: "已引導完成流程", ok: true }] },
  finance: { type: "metric", title: "ROI 摘要", rows: [{ t: "交期達成", v: "+18pt" }, { t: "庫存成本", v: "−11%" }, { t: "投資回收", v: "2.1 年" }] },
  schedule: { type: "metric", title: "排程結果", rows: [{ t: "資源利用", v: "90%" }, { t: "排程衝突", v: "0" }, { t: "準時達成", v: "92%" }] },
  analyze: { type: "metric", title: "分析摘要", rows: [{ t: "關鍵指標", v: "達標 96%" }, { t: "趨勢", v: "持續上升" }, { t: "異常", v: "2 處" }] },
  forecast: { type: "metric", title: "預測結果", rows: [{ t: "下期需求", v: "+8%" }, { t: "風險等級", v: "中" }, { t: "預測信心", v: "88%" }] },
};
/* 運作步驟：它收到需求後怎麼做（3 步） */
const CAT_FLOW = {
  match: ["理解你的產業、規模與限制", "比對 2015 套系統多維度篩選", "輸出帶信心分數的推薦清單"],
  expert: ["盤點你的情境與現況", "比對產業標竿做法", "給出關鍵痛點與落地建議"],
  strategy: ["釐清導入目標與限制", "拆解成階段與里程碑", "標出依賴、風險與資源"],
  orchestrate: ["聽懂並澄清需求", "拆解並分派子任務", "彙整各 Agent 的產出"],
  audit: ["讀取專案與稽核基線", "逐項檢查完整度", "標出缺口並附證據"],
  compliance: ["掃描決策與資料流", "比對企業政策與權限", "標記需人工覆核的項目"],
  quality: ["讀取交付物", "比對驗收基線", "標出回歸與缺陷並分級"],
  monitor: ["接上即時資料源", "比對告警門檻", "異常即時通報"],
  doc: ["彙整需求與結論", "轉成結構化規格", "產出可審核的文件"],
  design: ["理解系統定位", "產生介面草稿", "輸出設計規範與 prompt"],
  datagen: ["讀取資料結構", "生成擬真樣本", "補上邊界與空值案例"],
  assist: ["接收你的問題或表單", "檢索知識與流程", "回覆並代你處理"],
  finance: ["讀取現況數據", "試算效益與成本", "輸出 ROI 與回收期"],
  schedule: ["讀取任務與資源", "排入時程並偵測衝突", "輸出甘特圖與關鍵路徑"],
  analyze: ["彙整營運資料", "解讀指標與趨勢", "輸出洞察與建議"],
  forecast: ["讀取歷史資料", "建模並模擬情境", "輸出預測與預警"],
};

/* ---------- 生成 200+ agents，讓目錄與清單豐富多元 ---------- */
const _DOMAINS = [
  { n: "生產製造", p: ["生產製造", "設備維護", "品質管理"] }, { n: "品質管理", p: ["品質管理", "生產製造", "研發管理"] },
  { n: "採購供應鏈", p: ["採購供應鏈", "倉儲物流", "生產製造"] }, { n: "倉儲物流", p: ["倉儲物流", "採購供應鏈", "零售電商"] },
  { n: "設備維護", p: ["設備維護", "生產製造", "品質管理"] }, { n: "研發管理", p: ["研發管理", "品質管理", "專案管理"] },
  { n: "業務銷售", p: ["業務銷售", "客服管理", "經營管理"] }, { n: "客戶關係", p: ["客服管理", "業務銷售", "行銷"] },
  { n: "客服管理", p: ["客服管理", "業務銷售", "企業協作"] }, { n: "行銷推廣", p: ["業務銷售", "零售電商", "經營管理"] },
  { n: "人力資源", p: ["人力資源", "企業協作", "經營管理"] }, { n: "財務會計", p: ["財務會計", "經營管理", "採購供應鏈"] },
  { n: "經營管理", p: ["經營管理", "財務會計", "業務銷售"] }, { n: "專案管理", p: ["專案管理", "企業協作", "研發管理"] },
  { n: "ESG 永續", p: ["ESG 永續", "設備維護", "經營管理"] }, { n: "能源管理", p: ["ESG 永續", "設備維護", "生產製造"] },
  { n: "法遵合規", p: ["財務會計", "經營管理", "資訊安全"] }, { n: "資訊安全", p: ["資訊安全", "企業協作", "經營管理"] },
  { n: "零售電商", p: ["零售電商", "倉儲物流", "業務銷售"] }, { n: "教育培訓", p: ["教育", "人力資源", "企業協作"] },
  { n: "醫療照護", p: ["醫療照護", "品質管理", "經營管理"] }, { n: "營建工程", p: ["營建工程", "專案管理", "採購供應鏈"] },
  { n: "物流配送", p: ["倉儲物流", "採購供應鏈", "零售電商"] }, { n: "數據治理", p: ["經營管理", "資訊安全", "研發管理"] },
  { n: "資產管理", p: ["設備維護", "財務會計", "經營管理"] }, { n: "風險管理", p: ["經營管理", "財務會計", "資訊安全"] },
];
const _DOM_AB = { "生產製造": "製造", "品質管理": "品管", "採購供應鏈": "採購", "倉儲物流": "倉儲", "設備維護": "設備", "研發管理": "研發", "業務銷售": "業務", "客戶關係": "客戶", "客服管理": "客服", "行銷推廣": "行銷", "人力資源": "人資", "財務會計": "財會", "經營管理": "經營", "專案管理": "專案", "ESG 永續": "永續", "能源管理": "能源", "法遵合規": "法遵", "資訊安全": "資安", "零售電商": "零售", "教育培訓": "教育", "醫療照護": "醫護", "營建工程": "營建", "物流配送": "物流", "數據治理": "數據", "資產管理": "資產", "風險管理": "風控" };
const _CAT_AB = { "選型顧問": "選型", "領域專家": "領域", "策略規劃": "策略", "指揮調度": "調度", "完整度稽核": "稽核", "風險合規": "合規", "品質稽核": "品保", "即時監控": "監控", "文件規格": "擬稿", "介面設計": "設計", "資料填充": "填料", "智慧助理": "助理", "財務效益": "試算", "排程調度": "排程", "數據洞察": "洞察", "預測預警": "預測" };
const _ST = ["active", "idle", "idle", "pending", "idle"];
(function generateAgents() {
  let gi = 0;
  CATS.forEach((cat, ci) => {
    for (let j = 0; j < 13; j++) {
      const d = _DOMAINS[(ci * 7 + j * 5) % _DOMAINS.length];
      const i = gi++;
      const name = (_DOM_AB[d.n] || d.n.slice(0, 2)) + (_CAT_AB[cat.name] || cat.name.slice(0, 2));
      AGENTS.push({
        id: "g" + i, cat: cat.key, name, role: d.n + " · " + cat.name, status: _ST[i % _ST.length],
        tagline: "為「" + d.n + "」" + cat.name + "，" + cat.b + "。",
        detail: "專注於" + d.n + "領域的" + cat.name + "，" + cat.b + "，並把結果整理成可追溯、可交付的產物；需要跨領域時會與其他 Agent 交接協作。",
        caps: cat.caps.slice(), inputs: ["一句話需求", d.n + "資料", "情境設定"], projects: d.p.slice(),
      });
    }
  });
})();

/* ---------- 補完每位 agent 的衍生欄位（cat 對應的 icon / 顏色 / big / stats / sample） ---------- */
const _CAT_MAP = {}; CATS.forEach((c) => (_CAT_MAP[c.key] = c));
const _BIG_MAP = {}; BIGS.forEach((b) => (_BIG_MAP[b.key] = b));
function catOf(key) { return _CAT_MAP[key]; }
function bigOf(catKey) { const c = _CAT_MAP[catKey]; return c ? _BIG_MAP[c.big] : null; }
/* 若載入了生成的真資料（jvision-agents-office 產出），改用它；下方衍生欄位照常補完 */
if (typeof window !== "undefined" && Array.isArray(window.__AGENTS_DATA) && window.__AGENTS_DATA.length) {
  AGENTS.length = 0;
  window.__AGENTS_DATA.forEach((o) => AGENTS.push(Object.assign({}, o)));
}
AGENTS.forEach((a, i) => {
  const c = _CAT_MAP[a.cat] || CATS[0];
  const big = _BIG_MAP[c.big];
  a.big = c.big;
  a.icon = a.icon || c.icon;
  a.accentClass = BIG_ACCENT[big.color]; // 卡片/詳細頁 icon 依大分類上色
  if (!a.caps) a.caps = c.caps.slice();
  // generated agent 從「領域特化技能」輪選 3 個當卡片標籤，讓每張卡連得上領域+角色
  if (/^g\d+$/.test(a.id) && (a.skills || CAT_SKILLS[a.cat])) {
    const pool = a.skills || CAT_SKILLS[a.cat], h = _hash(a.id);
    a.caps = [pool[h % pool.length], pool[(h + 2) % pool.length], pool[(h + 4) % pool.length]]
      .filter((v, idx, arr) => arr.indexOf(v) === idx);
  }
  a.stats = a.stats || { tasks: 48 + ((i * 37) % 180), hit: 84 + ((i * 7) % 14), resp: 4 + ((i * 3) % 9), collab: 3 + ((i * 2) % 5) };
  a.status = "active"; // 全部顯示綠燈（上線可用）
  // 卡片顯示：功能名（大）＋ 產業/說明（小），不用抽象暱稱
  const isGen = /^g\d+$/.test(a.id);
  a.dom = isGen ? (a.role.split(" · ")[0]) : "";
  // 卡片大標：一般 agent 用「領域」當標題（才有區別，不會 14 張都叫選型顧問）；旗艦用角色名
  a.label = isGen ? a.dom : (a.role || c.name).replace(/\s*Agent\s*$/, "").trim();
  a.sub = isGen ? c.name : big.name;
});

/* 常用 / 必備 Agents（精選呈現於市集頂部） */
const FEATURED_IDS = ["orchestrator", "matchmaker", "expert"];

/* ---------- helpers ---------- */
const STATUS_META = {
  active:  { dot: "bg-success",  ring: "ring-success/40",  label: "執行中", text: "text-success" },
  idle:    { dot: "bg-idle",     ring: "ring-line",         label: "待命",   text: "text-muted" },
  pending: { dot: "bg-amber",    ring: "ring-amber/50",     label: "待審核", text: "text-amber" },
};
function agentById(id) { return AGENTS.find((a) => a.id === id); }
function catCount(key) { return AGENTS.filter((a) => a.cat === key).length; }
function bigCount(key) { return AGENTS.filter((a) => a.big === key).length; }
function _hash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }

/* 每位 agent 產生不同的執行紀錄；部分沒有紀錄就顯示空狀態 */
function _activityHTML(a, mateName) {
  const h = _hash(a.id);
  const n = [0, 2, 3, 4, 3, 2, 0, 3][h % 8];
  if (!n) return `<p class="text-[13px] text-muted py-1">目前尚無執行紀錄。</p>`;
  const c = catOf(a.cat) || { name: "分析", st: "結果" };
  const P = a.projects && a.projects.length ? a.projects : ["某專案"];
  const T = [
    "為「{p}」完成一次" + c.name,
    "更新「{p}」的" + (a.caps[0] || "分析") + "設定",
    "與「" + mateName + "」交接協作",
    "產出「{p}」的" + c.st,
    "彙整「{p}」的結果並交付",
    "處理「{p}」的一筆待辦",
  ];
  const times = ["6 分鐘前", "38 分鐘前", "2 小時前", "5 小時前", "昨天 14:30", "前天 10:15", "08/12 09:20", "08/10 16:40"];
  const dots = ["bg-success", "bg-idle", "bg-emerald-500", "bg-idle", "bg-idle"];
  const start = h % (times.length - 4);
  let rows = "";
  for (let i = 0; i < n; i++) {
    const txt = T[(h + i * 2) % T.length].replace("{p}", P[(h + i) % P.length]);
    rows += `<div class="relative pl-4"><span class="absolute w-2.5 h-2.5 ${dots[i % dots.length]} rounded-full -left-[7px] top-1 border-2 border-white"></span><p class="text-[11px] text-muted">${times[start + i] || times[i]}</p><p class="text-[13px] text-ink">${txt}</p></div>`;
  }
  return `<div class="relative border-l-2 border-line ml-2 space-y-4">${rows}</div>`;
}

/* ---------- agent card ---------- */
function agentCardHTML(a) {
  const st = STATUS_META[a.status];
  const chips = a.caps.map((c) => `<span class="text-[11px] font-semibold text-body bg-soft border border-line rounded-full px-2 py-0.5">${c}</span>`).join("");
  return `
  <a href="./agents-profile?id=${a.id}" class="group bg-white border border-line rounded-xl p-4 flex flex-col gap-3 hover:border-brand2 hover:shadow-[0_10px_30px_rgba(15,30,70,.08)] hover:-translate-y-0.5 transition-all">
    <div class="flex items-start gap-3">
      <div class="relative shrink-0">
        <div class="w-12 h-12 rounded-full ${a.accentClass} grid place-content-center ring-2 ${st.ring} ring-offset-2 ring-offset-white">
          <span class="material-symbols-outlined text-[24px]">${a.icon}</span>
        </div>
        <span class="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ${st.dot} border-2 border-white"></span>
      </div>
      <div class="min-w-0">
        <h4 class="text-[15px] font-black text-ink truncate">${a.label}</h4>
        <p class="text-xs text-muted font-semibold truncate">${a.sub}</p>
      </div>
    </div>
    <p class="text-[13px] text-body leading-snug line-clamp-2 min-h-[36px]">${a.tagline}</p>
    <div class="flex flex-wrap gap-1.5 min-h-[26px] content-start">${chips}</div>
    <span class="mt-auto self-end text-xs font-bold text-brand2 inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">查看 Agent <span class="material-symbols-outlined text-[16px]">arrow_forward</span></span>
  </a>`;
}
function featuredCardHTML(a) {
  const st = STATUS_META[a.status];
  return `
  <a href="./agents-profile?id=${a.id}" class="group relative bg-white border border-line rounded-xl p-4 flex flex-col gap-3 hover:border-brand2 hover:shadow-[0_10px_28px_rgba(15,30,70,.1)] transition-all">
    <span class="absolute top-3 right-3 text-[10px] font-bold text-amber bg-amber/10 border border-amber/20 rounded-full px-2 py-0.5">常用</span>
    <div class="flex items-center gap-3">
      <div class="relative shrink-0">
        <div class="w-12 h-12 rounded-full ${a.accentClass} grid place-content-center ring-2 ${st.ring} ring-offset-2 ring-offset-white"><span class="material-symbols-outlined text-[24px]">${a.icon}</span></div>
        <span class="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ${st.dot} border-2 border-white"></span>
      </div>
      <div class="min-w-0"><h4 class="text-[15px] font-black text-ink truncate">${a.label}</h4><p class="text-xs text-muted font-semibold truncate">${a.sub}</p></div>
    </div>
    <p class="text-[13px] text-body leading-snug line-clamp-2">${a.tagline}</p>
    <div class="flex items-center gap-3 text-[11px] text-muted font-semibold pt-1 border-t border-line">
      <span>協助 <b class="text-ink">${a.stats.tasks}</b></span><span>命中 <b class="text-success">${a.stats.hit}%</b></span>
      <span class="ml-auto text-brand2 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5">查看 <span class="material-symbols-outlined text-[15px]">arrow_forward</span></span>
    </div>
  </a>`;
}

/* ---------- marketplace ---------- */
function renderAgentMarketplace() {
  const $ = (s) => document.querySelector(s);
  const grid = $("#agGrid"), featWrap = $("#agFeaturedWrap"), feat = $("#agFeatured"), count = $("#agCount");
  const searchEl = $("#agSearch"), catsEl = $("#agSquads"), statusEl = $("#agStatus"), clearEl = $("#agClear"), moreEl = $("#agMore");
  if (!grid) return;
  const params = new URLSearchParams(location.search);
  const initCat = params.get("cat"), initBig = params.get("big");
  const PAGE = 9;
  const initOpen = _CAT_MAP[initCat] ? _CAT_MAP[initCat].big : (_BIG_MAP[initBig] ? initBig : "");
  const state = { q: "", cat: _CAT_MAP[initCat] ? initCat : "", big: _BIG_MAP[initBig] ? initBig : "", status: "", visible: PAGE, open: initOpen };

  if (feat) feat.innerHTML = FEATURED_IDS.map(agentById).filter(Boolean).map(featuredCardHTML).join("");

  const BIG_ICON = { plan: "groups", assure: "verified_user", build: "handyman", ops: "monitoring" };
  function paintCats() {
    const allActive = !state.cat && !state.big;
    let html = `<button data-scope="all" class="ag-cat w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm font-bold transition-colors ${allActive ? "bg-[#e8f0ff] text-brand border border-[#bfdbfe]" : "text-ink hover:bg-[#eef4ff] hover:text-brand border border-transparent"}"><span>全部 Agents</span><span class="text-xs font-bold ${allActive ? "text-brand" : "text-muted"}">${AGENTS.length}</span></button>`;
    BIGS.forEach((b) => {
      const isOpen = state.open === b.key;
      const active = state.big === b.key;
      const tcls = BIG_ACCENT[b.color].split(" ")[1];
      html += `<button data-big="${b.key}" class="ag-big w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${active ? "bg-[#e8f0ff] text-brand" : "text-body hover:bg-[#eef4ff] hover:text-brand"}"><span class="flex items-center gap-2.5"><span class="material-symbols-outlined text-[19px] ${tcls}">${BIG_ICON[b.key]}</span>${b.name}</span><span class="flex items-center gap-1"><span class="text-xs font-bold ${active ? "text-brand" : "text-muted"}">${bigCount(b.key)}</span><span class="material-symbols-outlined text-[18px] text-muted transition-transform ${isOpen ? "rotate-180" : ""}">expand_more</span></span></button>`;
      if (isOpen) {
        html += CATS.filter((c) => c.big === b.key).map((c) => {
          const ca = state.cat === c.key;
          return `<button data-cat="${c.key}" class="ag-cat w-full flex items-center justify-between gap-2 pl-9 pr-3 py-2 rounded-lg text-[13px] font-semibold transition-colors ${ca ? "bg-[#e8f0ff] text-brand" : "text-body hover:bg-[#eef4ff] hover:text-brand"}"><span class="flex items-center gap-2"><span class="material-symbols-outlined text-[16px] ${tcls}">${c.icon}</span>${c.name}</span><span class="text-[11px] font-bold ${ca ? "text-brand" : "text-muted"}">${catCount(c.key)}</span></button>`;
        }).join("");
      }
    });
    catsEl.innerHTML = html;
    // 大分類：切換展開（手風琴，只開一個）＋不套用篩選（點小項目才篩）
    catsEl.querySelectorAll("[data-big]").forEach((el) => el.addEventListener("click", () => { state.open = state.open === el.dataset.big ? "" : el.dataset.big; paintCats(); }));
    catsEl.querySelectorAll("[data-cat]").forEach((el) => el.addEventListener("click", () => { state.cat = el.dataset.cat; state.big = ""; state.visible = PAGE; apply(); }));
    catsEl.querySelectorAll('[data-scope="all"]').forEach((el) => el.addEventListener("click", () => { state.cat = ""; state.big = ""; state.open = ""; state.visible = PAGE; apply(); }));
  }
  function paintStatus() { if (!statusEl) return; statusEl.innerHTML = ""; }
  function apply() {
    const q = state.q.trim().toLocaleLowerCase("zh-Hant");
    const list = AGENTS.filter((a) => {
      if (state.cat && a.cat !== state.cat) return false;
      if (state.big && a.big !== state.big) return false;
      if (state.status && a.status !== state.status) return false;
      if (q) { const hay = [a.name, a.role, (a.caps || []).join(" "), (a.projects || []).join(" ")].join(" ").toLocaleLowerCase("zh-Hant"); if (!hay.includes(q)) return false; }
      return true;
    });
    const filtering = !!(state.q || state.cat || state.big || state.status);
    if (featWrap) featWrap.style.display = filtering ? "none" : "";
    const shown = list.slice(0, state.visible);
    grid.innerHTML = shown.length ? shown.map(agentCardHTML).join("")
      : `<div class="col-span-full text-center py-14 border border-dashed border-line rounded-2xl bg-white text-muted"><span class="material-symbols-outlined text-[36px]">search_off</span><p class="font-bold text-ink mt-2">找不到符合的 Agent</p><p class="text-sm mt-1">換個關鍵字或清除篩選再試一次。</p></div>`;
    if (count) count.textContent = `顯示 ${shown.length} / ${filtering ? list.length : AGENTS.length} 位 Agent`;
    if (moreEl) moreEl.hidden = list.length <= state.visible;
    if (clearEl) clearEl.disabled = !filtering;
    paintCats(); paintStatus();
  }
  if (searchEl) searchEl.addEventListener("input", (e) => { state.q = e.target.value; state.visible = PAGE; apply(); });
  if (clearEl) clearEl.addEventListener("click", () => { state.q = ""; state.cat = ""; state.big = ""; state.status = ""; state.visible = PAGE; if (searchEl) searchEl.value = ""; apply(); });
  if (moreEl) moreEl.addEventListener("click", () => { state.visible += PAGE; apply(); });
  paintCats(); paintStatus(); apply();

  /* 對外的小 API：手機版底部大分類列用它切換篩選（桌機行為不變） */
  window.jvAgentFilter = {
    setBig(key) { state.cat = ""; state.big = key || ""; state.open = key || ""; state.visible = PAGE; apply(); },
    getBig() { return state.big; },
  };
}

/* 產出範例：依 agent 功能，用不同版型呈現「它真的會產出什麼」 */
function _renderSample(out) {
  const rows = out.rows || [];
  if (out.type === "score") {
    return rows.map((r) => { const col = _scColor(r.v); return `<div class="flex items-center justify-between p-2 border-b border-line last:border-0"><span class="text-[14px] font-semibold text-ink">${r.t}</span><div class="flex items-center gap-3"><div class="w-24 bg-line rounded-full h-1.5 overflow-hidden"><div class="bg-${col} h-1.5 rounded-full" style="width:${r.v}%"></div></div><span class="text-xs font-bold text-${col} w-9 text-right">${r.v}%</span></div></div>`; }).join("");
  }
  if (out.type === "check") {
    return rows.map((r) => `<div class="flex items-center gap-2 p-2 border-b border-line last:border-0"><span class="material-symbols-outlined text-[18px] ${r.ok ? "text-success" : "text-amber"}">${r.ok ? "check_circle" : "error"}</span><span class="text-[14px] text-ink">${r.t}</span>${r.ok ? "" : '<span class="ml-auto text-[11px] font-bold text-amber">待改善</span>'}</div>`).join("");
  }
  if (out.type === "metric") {
    return `<div class="grid grid-cols-3 gap-3">${rows.map((r) => `<div class="bg-soft rounded-lg border border-line p-3 text-center"><div class="text-[11px] text-muted">${r.t}</div><div class="text-[17px] font-black text-ink mt-1">${r.v}</div></div>`).join("")}</div>`;
  }
  if (out.type === "step") {
    return `<div class="space-y-2.5">${rows.map((r, i) => `<div class="flex items-center gap-2.5"><span class="w-6 h-6 rounded-full bg-brand/10 text-brand grid place-content-center text-xs font-black shrink-0">${i + 1}</span><span class="text-[14px] text-ink">${r}</span></div>`).join("")}</div>`;
  }
  return `<div class="flex flex-wrap gap-2">${rows.map((r) => `<span class="px-2.5 py-1.5 bg-soft border border-line rounded-lg text-[13px] font-semibold text-body">${r}</span>`).join("")}</div>`;
}

/* ---------- profile ---------- */
function renderProfile() {
  const id = new URLSearchParams(location.search).get("id") || "matchmaker";
  const a = agentById(id) || agentById("matchmaker");
  const c = catOf(a.cat), big = bigOf(a.cat);
  const st = STATUS_META[a.status];
  const set = (sel, html) => { const el = document.querySelector(sel); if (el) el.innerHTML = html; };
  const setText = (sel, txt) => { const el = document.querySelector(sel); if (el) el.textContent = txt; };

  document.title = `${a.name} · 專案 Agents — JVision`;
  set("#pfAvatar", `<span class="material-symbols-outlined text-[40px]">${a.icon}</span>`);
  document.querySelector("#pfAvatar").className = `w-full h-full rounded-full ${a.accentClass} grid place-content-center`;
  document.querySelector("#pfStatusDot").className = `absolute bottom-1 right-1 w-4 h-4 rounded-full ${st.dot} border-2 border-white`;
  setText("#pfSquad", `${big.name} · ${c.name}`);
  setText("#pfName", a.dom ? `${c.name} · ${a.dom}` : a.label);
  setText("#pfTagline", a.detail);

  setText("#pfKpiTasks", a.stats.tasks);
  setText("#pfKpiHit", a.stats.hit + "%");
  set("#pfKpiResp", `${a.stats.resp}<span class="text-base font-bold text-muted ml-1">秒</span>`);
  setText("#pfKpiCollab", a.stats.collab);
  setText("#pfGraphSelf", a.label);
  const _gsi = document.querySelector("#pfGraphSelfIcon"); if (_gsi) { _gsi.textContent = a.icon; _gsi.className = `material-symbols-outlined text-[22px] ${BIG_TEXT[big.color]}`; }
  const _gsr = document.querySelector("#pfGraphSelfRing"); if (_gsr) _gsr.className = `w-11 h-11 rounded-full bg-white ring-2 ${BIG_RING[big.color]} grid place-content-center mx-auto shadow-sm`;

  // 技能 Skills：顯示該 agent 的領域特化技能（與 agent.md 的 skills 完全一致）
  const skills = (a.skills || CAT_SKILLS[a.cat] || a.caps || []).slice(0, 6);
  set("#pfCaps", skills.map((cap) => `
    <div class="bg-white border border-line rounded-lg p-3 flex items-center gap-2"><span class="material-symbols-outlined text-[20px] text-emerald-600 shrink-0">check_circle</span><h5 class="text-[13px] font-bold text-ink leading-tight">${cap}</h5></div>`).join(""));

  // 運作範例：你問一句話 → 它做 3 步 → 產出成果（合併「怎麼用」與「產出範例」）
  const out = a.sample || CAT_OUT[a.cat] || { type: "item", title: "產出摘要", rows: [a.detail] };
  const flow = CAT_FLOW[a.cat] || [];
  const inputChips = (a.inputs || []).map((i) => `<span class="px-2 py-0.5 bg-white border border-line rounded-full text-[11px] font-semibold text-body">${i}</span>`).join("");
  set("#pfExample", `
    <div class="flex items-start gap-3 mb-1">
      <span class="w-8 h-8 rounded-full bg-soft border border-line grid place-content-center shrink-0"><span class="material-symbols-outlined text-[18px] text-muted">person</span></span>
      <div class="bg-soft border border-line rounded-2xl rounded-tl-sm px-3 py-2"><p class="text-[14px] text-ink font-medium">「幫我${c.b}」</p></div>
    </div>
    <div class="ml-4 pl-5 border-l-2 border-dashed border-line py-2 flex flex-wrap items-center gap-1.5"><span class="text-[11px] text-muted font-bold mr-1">附上</span>${inputChips}</div>
    <div class="ml-4 pl-5 border-l-2 border-dashed border-line pb-3">
      <p class="text-[11px] text-muted font-bold mb-2">它會這樣做</p>
      <div class="space-y-2">${flow.map((s, i) => `<div class="flex items-center gap-2.5"><span class="w-5 h-5 rounded-full bg-brand/10 text-brand grid place-content-center text-[10px] font-black shrink-0">${i + 1}</span><span class="text-[13px] text-ink">${s}</span></div>`).join("")}</div>
    </div>
    <div class="ml-4 pl-5">
      <div class="flex items-center gap-1.5 mb-2"><span class="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span><span class="text-[12px] font-black text-ink">產出 · ${out.title}</span><span class="ml-auto inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-violet/10 text-violet"><span class="material-symbols-outlined text-[11px]">auto_awesome</span><span class="eyebrow text-[9px] font-bold uppercase">AI</span></span></div>
      <div class="rounded-xl border border-emerald-500/30 p-3" style="background:#f0fdf4aa">${_renderSample(out)}</div>
    </div>`);

  set("#pfProjects", (a.projects || []).map((p) => `<a href="./catalog?q=${encodeURIComponent(p)}" class="px-2.5 py-1 bg-soft border border-line rounded-lg text-[12px] font-semibold text-body hover:border-brand2 hover:text-brand transition-colors">${p}</a>`).join(""));

  // 協作關係：智策(接收指派) + 同大分類不同小分類的 3 位（動態）
  const partners = [];
  const orch = agentById("orchestrator"); if (orch && orch.id !== a.id) partners.push({ a: orch, label: "接收指派" });
  const sameBig = AGENTS.filter((x) => x.big === a.big && x.cat !== a.cat);
  const labels = ["交叉驗證", "交棒協作", "彙整交付"];
  const seenCat = {};
  // 用獨立計數器取標籤：看這位 agent 自己是不是總指揮（那時上面不會 push orch），
  // 若沿用 partners.length - 1 會在第一筆算出 labels[-1] → undefined
  let li = 0;
  for (const x of sameBig) { if (partners.length >= 4) break; if (seenCat[x.cat]) continue; seenCat[x.cat] = 1; partners.push({ a: x, label: labels[li++ % labels.length] }); }
  while (partners.length < 4) { const x = AGENTS.find((y) => y.id !== a.id && !partners.some((p) => p.a.id === y.id)); if (!x) break; partners.push({ a: x, label: "協作" }); }
  const pos = ["top-2 left-2", "top-2 right-2", "bottom-2 left-2", "bottom-2 right-2"];
  set("#pfGraphNodes", partners.slice(0, 4).map((pr, i) => `
    <div class="absolute ${pos[i]} text-center w-16">
      <div class="w-8 h-8 rounded-full ${pr.a.accentClass} grid place-content-center mx-auto shadow-sm"><span class="material-symbols-outlined text-[16px]">${pr.a.icon}</span></div>
      <span class="eyebrow text-[9px] font-bold text-ink block mt-0.5 leading-tight">${pr.a.label}</span>
      <span class="text-[8px] text-muted block leading-tight">${pr.label}</span>
    </div>`).join(""));

  // 執行紀錄（每位不同，部分沒有紀錄）
  set("#pfActivity", _activityHTML(a, (partners[1] && partners[1].a.label) || (orch && orch.label) || "領域專家"));

  // teammates: same cat
  const mates = AGENTS.filter((m) => m.cat === a.cat && m.id !== a.id).slice(0, 4);
  set("#pfMates", (mates.length ? mates : AGENTS.filter((m) => m.id !== a.id).slice(0, 4)).map((m) => {
    const mst = STATUS_META[m.status];
    return `<a href="./agents-profile?id=${m.id}" class="bg-white border border-line rounded-xl p-4 flex items-center gap-3 hover:border-brand2 hover:shadow-sm transition-all">
      <div class="relative shrink-0"><div class="w-11 h-11 rounded-full ${m.accentClass} grid place-content-center"><span class="material-symbols-outlined text-[22px]">${m.icon}</span></div><span class="absolute bottom-0 right-0 w-3 h-3 rounded-full ${mst.dot} border border-white"></span></div>
      <div class="min-w-0"><h4 class="text-[13px] font-bold text-ink truncate">${m.label}</h4><p class="text-[11px] text-muted truncate">${m.sub}</p></div></a>`;
  }).join(""));
}

if (document.body && document.body.dataset.page === "agent-profile") {
  document.addEventListener("DOMContentLoaded", renderProfile);
}
