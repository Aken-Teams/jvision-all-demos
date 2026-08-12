/**
 * system-content.js
 * -------------------------------------------------------------
 * Real, domain-realistic module content for each SYSTEM TYPE, so every
 * project detail page can present a complete "system architecture + modules"
 * intro instead of thin generic cards.
 *
 * Exposes window.JVSystemContent = { classify(project), TYPES }.
 */
(function () {
  // ---- system-type classifier (ported from tools/generate-stitch-prompts) ----
  const KEYWORD_RULES = [
    [/資安|SIEM|SOC|IAM|PAM|EDR|XDR|弱點管理|弱點掃描|防火牆|NGFW|GRC|滲透|災難復原|備份與|端點偵測/i, "security-soc"],
    [/ITSM|ITAM|NMS|APM|CMP|MDM|iPaaS|ESB|雲端資源|系統整合|網路監控|OT資安|資訊科技|資訊安全事件/i, "it-ops"],
    [/CRM|Sales|Pipeline|業務|客戶關係|商機|RFQ|報價|Quotation|詢報價|客戶入口|Customer Portal/i, "sales-crm"],
    [/SRM|SQM|SCAR|採購|供應商|供應鏈|詢價|綠色採購|供應交期/i, "procurement-srm"],
    [/QMS|品質|品管|CAPA|NCR|FMEA|AOI|SPC|追因|檢驗|8D|不良|稽核|安衛/i, "quality-qms"],
    [/WMS|WCS|倉儲|庫存|出貨|入庫|儲位|盤點|AS\/RS|AMHS|補料|補貨|波次/i, "warehouse-wms"],
    [/CMMS|設備維護|預測性?維護|PdM|模具|保養|預兆|OEE|EAP|點檢/i, "maintenance-cmms"],
    [/MES|生產|排程|排產|工單|產線|製造|精實|印刷|服飾|貿易營運|PLM|BOM|ECN|ECR|SMT/i, "manufacturing-mes"],
    [/ERP/i, "erp"],
    [/BI|商業智慧|經營分析|儀表板|Dashboard|洞察|BSC|平衡計分卡|策略|治理|合併報表|風險管理|法令遵循|Compliance|數據分析|行為分析/i, "analytics-bi"],
    [/ESG|碳|能源|EMS|排放|溫室|減碳|需量/i, "esg-energy"],
    [/POS|門市|餐飲|烘焙|旅宿|桌位|出單|洗衣|眼鏡|寵物旅宿|房況|前店後廠/i, "pos-frontdesk"],
    [/HRIS|人資|人力資源|出勤|差勤|薪資|Payroll|派遣|招募|打卡|工時計薪/i, "hr-hris"],
    [/理賠|貸款|投資風險|保險|授信|避險|催收/i, "finance-case"],
    [/財務|會計|帳款|AR|AP|預算|現金流|資金|固定資產|記帳|傳票|稅務|關稅|報稅/i, "finance-ledger"],
    [/教育|課程|學習|學生|補習|幼兒|內訓|證照|教學/i, "education-lms"],
    [/醫療|診所|牙科|藥局|照護|健康|申報|調劑/i, "healthcare-clinic"],
    [/營建|工程|工地|估價|巡檢|施工|PMIS|日報|室內設計/i, "construction-pm"],
    [/TMS|運輸|車隊|派車|停車|拖吊|冷鏈|救援|車聯網|機車|汽車|物流|簽收|油耗/i, "logistics-fleet"],
    [/法務|事務所|庭期|合約|案件進度/i, "legal-case"],
    [/客服|客訴|服務平台|補償/i, "service-desk"],
    [/協作|任務|知識|辦公|流程自動化|專案協作|工作台/i, "collaboration-pm"],
  ];
  const CATEGORY_FALLBACK = {
    "生產製造": "manufacturing-mes", "品質管理": "quality-qms", "業務銷售": "sales-crm",
    "採購供應鏈": "procurement-srm", "人力資源": "hr-hris", "倉儲物流": "warehouse-wms",
    "研發管理": "manufacturing-mes", "經營管理": "analytics-bi", "ESG 永續": "esg-energy",
    "零售電商": "pos-frontdesk", "教育": "education-lms", "企業協作": "collaboration-pm",
    "營建工程": "construction-pm", "醫療照護": "healthcare-clinic", "財務會計": "finance-ledger",
    "金融保險": "finance-case", "資訊科技": "it-ops", "交通運輸": "logistics-fleet",
    "設備維護": "maintenance-cmms", "資訊安全": "security-soc", "專業服務": "legal-case",
    "物流運輸": "logistics-fleet", "餐飲旅宿": "pos-frontdesk", "生活服務": "operations-console",
    "數據分析": "analytics-bi", "客服管理": "service-desk", "房地產與物業": "operations-console",
    "宗教服務": "operations-console",
  };
  function classify(project) {
    const title = String(project.title || "");
    for (const [re, type] of KEYWORD_RULES) if (re.test(title)) return type;
    return CATEGORY_FALLBACK[project.category] || "operations-console";
  }

  // ---- per-type content: label, tagline, 6 real modules, entry/data layer ----
  const M = (icon, name, desc) => ({ icon, name, desc });
  const TYPES = {
    "sales-crm": { label: "CRM 客戶關係管理", tagline: "從名單到成交的完整客戶生命週期管理", entry: ["業務", "業務主管", "行銷"], data: ["業績報表", "客戶資料庫", "郵件/行事曆整合"], modules: [
      M("groups", "客戶 360 視圖", "整合互動、報價、合約與服務歷程"),
      M("filter_alt", "銷售管線", "拖曳看板管理商機階段與轉化率"),
      M("request_quote", "報價與合約", "線上報價、審核與電子簽核"),
      M("campaign", "行銷活動", "名單分群、活動追蹤與成效分析"),
      M("smart_toy", "AI 業務助理", "下一步建議、風險提醒與成交預測"),
      M("insights", "業績報表", "銷售漏斗、預測與達成率儀表"),
    ]},
    "manufacturing-mes": { label: "MES 製造執行系統", tagline: "訂單到入庫的製造現場全流程數位化", entry: ["生管", "現場主管", "廠長"], data: ["生產報表", "追溯履歷", "ERP/設備整合"], modules: [
      M("assignment", "工單管理", "訂單轉工單、拆併單與工單派發"),
      M("calendar_month", "排程排產", "依產能、交期、負載自動排程"),
      M("engineering", "現場執行", "派工、報工與進度即時回報"),
      M("speed", "設備稼動 OEE", "稼動、效率、良率即時監控"),
      M("verified", "品質入庫", "檢驗判定、不良處置與入庫"),
      M("auto_awesome", "AI 改善建議", "異常摘要與瓶頸改善建議"),
    ]},
    "erp": { label: "ERP 企業資源規劃", tagline: "訂單、庫存、財務、人資一體的營運中樞", entry: ["各部門", "主管", "經營層"], data: ["經營報表", "總帳資料", "跨模組整合"], modules: [
      M("shopping_cart", "訂單採購", "銷售、採購單據一條龍處理"),
      M("inventory", "庫存成本", "即時庫存、成本與呆滯分析"),
      M("account_balance", "財務會計", "總帳、應收付與傳票拋轉"),
      M("badge", "人資薪資", "出勤、薪資與組織管理"),
      M("approval", "簽核流程", "多層簽核與權限控管"),
      M("analytics", "經營報表", "跨模組即時經營儀表"),
    ]},
    "warehouse-wms": { label: "WMS 倉儲管理系統", tagline: "收貨到出貨的倉內作業與庫存精準管理", entry: ["倉管", "作業員", "物流主管"], data: ["庫存報表", "作業紀錄", "ERP/條碼整合"], modules: [
      M("input", "入庫上架", "收貨、驗收與智慧上架"),
      M("output", "揀貨出貨", "波次揀貨、覆核與出貨"),
      M("grid_view", "儲位管理", "儲位規劃與庫容視覺化"),
      M("inventory_2", "庫存盤點", "即時庫存、盤點與調撥"),
      M("sync", "拉動補料", "安全庫存與自動補貨"),
      M("qr_code_scanner", "條碼作業", "PDA 掃碼即時作業"),
    ]},
    "procurement-srm": { label: "SRM 採購供應商管理", tagline: "供應商協同、詢比議價到交期風險控管", entry: ["採購", "品保", "供應商"], data: ["採購報表", "供應商評分", "ERP 整合"], modules: [
      M("handshake", "供應商管理", "建檔、分級與績效評分"),
      M("request_quote", "詢報價協作", "線上詢價、比價與議價"),
      M("receipt_long", "採購訂單", "請購、下單與交期追蹤"),
      M("warning", "交期風險", "缺料預警與到貨監控"),
      M("verified_user", "供應商品質", "進料檢驗與 SCAR 改善"),
      M("eco", "綠色採購", "ESG 評分與永續採購"),
    ]},
    "quality-qms": { label: "QMS 品質管理系統", tagline: "從異常到改善的品質閉環與追溯稽核", entry: ["品保", "品管", "產線"], data: ["品質報表", "批次追溯", "SPC 數據"], modules: [
      M("report_problem", "異常 / NCR", "不良通報與處置追蹤"),
      M("rule", "CAPA / 8D", "矯正預防與根因分析"),
      M("monitoring", "SPC 管制圖", "製程數據即時管制"),
      M("fact_check", "檢驗管理", "進料/製程/出貨檢驗"),
      M("inventory", "FMEA", "失效模式與風險評估"),
      M("history", "追溯稽核", "批次追溯與稽核紀錄"),
    ]},
    "analytics-bi": { label: "BI 商業智慧", tagline: "把分散數據變成可下鑽、可決策的經營洞察", entry: ["經營層", "分析師", "主管"], data: ["資料倉儲", "多源整合", "排程報表"], modules: [
      M("dashboard", "經營儀表板", "關鍵指標即時總覽"),
      M("trending_up", "趨勢分析", "多維度趨勢與比較"),
      M("zoom_in", "指標下鑽", "逐層鑽取到明細"),
      M("scoreboard", "平衡計分卡", "策略目標與 KPI 對齊"),
      M("auto_awesome", "AI 洞察", "自動發現異常與機會"),
      M("description", "報表匯出", "排程報表與分享"),
    ]},
    "esg-energy": { label: "ESG 永續 / 能源管理", tagline: "碳盤查、能源監控到減碳目標的永續管理", entry: ["永續", "廠務", "管理層"], data: ["永續報告", "排放清冊", "電表/係數"], modules: [
      M("co2", "碳盤查", "範疇一、二、三排放盤查"),
      M("bolt", "能源監控", "用電/用能即時監控"),
      M("flag", "減碳目標", "目標設定與進度追蹤"),
      M("factory", "排放源管理", "排放源清冊與係數庫"),
      M("description", "永續報告", "GRI/ISO 報告產出"),
      M("notifications_active", "需量告警", "用電尖峰即時預警"),
    ]},
    "pos-frontdesk": { label: "POS 門市管理", tagline: "前台結帳、會員到進銷存的門市一體化", entry: ["門市人員", "店長", "總部"], data: ["營收報表", "熱銷分析", "會員資料"], modules: [
      M("point_of_sale", "前台結帳", "點餐、開單與快速結帳"),
      M("table_restaurant", "桌位 / 訂位", "桌況與訂位管理"),
      M("receipt", "訂單管理", "內用、外帶、外送整合"),
      M("inventory_2", "庫存進銷", "即時庫存與自動叫貨"),
      M("loyalty", "會員行銷", "會員、點數與優惠"),
      M("summarize", "日結報表", "營收與熱銷分析"),
    ]},
    "hr-hris": { label: "HRIS 人力資源系統", tagline: "出勤、薪資、招募到績效的人資全流程", entry: ["人資", "主管", "員工"], data: ["人資報表", "薪資資料", "差勤紀錄"], modules: [
      M("fingerprint", "出勤差勤", "打卡、請假與加班"),
      M("payments", "薪資計算", "薪資、勞健保與報稅"),
      M("schedule", "排班管理", "智慧排班與工時控管"),
      M("person_add", "招募任用", "職缺、面試與報到"),
      M("school", "教育訓練", "課程、證照與紀錄"),
      M("workspace_premium", "績效考核", "目標設定與考核流程"),
    ]},
    "finance-ledger": { label: "財務會計系統", tagline: "應收付、現金流到預算的財務即時掌握", entry: ["財會", "出納", "財務長"], data: ["財務報表", "帳齡分析", "ERP/銀行整合"], modules: [
      M("request_quote", "應收帳款", "開立、對帳與催收"),
      M("payments", "應付帳款", "請款、付款與對帳"),
      M("account_balance_wallet", "現金流", "資金調度與預測"),
      M("savings", "預算管理", "編列、控管與差異分析"),
      M("domain", "固定資產", "資產登錄與折舊"),
      M("receipt_long", "總帳傳票", "傳票、拋轉與月結"),
    ]},
    "finance-case": { label: "金融 / 保險案件系統", tagline: "受理、審核、風險到撥付的案件審查流程", entry: ["受理人員", "審核", "覆核主管"], data: ["案件報表", "風險評分", "全程稽核"], modules: [
      M("assignment", "案件受理", "理賠/貸款案件建立"),
      M("fact_check", "審核初核", "文件審查與資格核對"),
      M("shield", "風險評分", "風險模型與評分"),
      M("gavel", "覆核核准", "多層覆核與核決"),
      M("payments", "撥付理算", "理算與撥款作業"),
      M("history", "案件追溯", "全程紀錄與稽核"),
    ]},
    "it-ops": { label: "IT 維運管理平台", tagline: "服務工單、資產到即時監控的 IT 維運", entry: ["IT 人員", "維運", "使用者"], data: ["SLA 報表", "資產清冊", "監控數據"], modules: [
      M("confirmation_number", "服務工單", "事件/請求工單管理"),
      M("dns", "資產管理", "IT 資產與軟體授權"),
      M("monitor_heart", "即時監控", "系統/網路健康監控"),
      M("warning", "告警事件", "告警彙整與分派"),
      M("build", "變更發布", "變更與發布管理"),
      M("insights", "服務報表", "SLA 與可用率報表"),
    ]},
    "security-soc": { label: "資安 SOC 平台", tagline: "告警分流、事件應變到弱點與合規治理", entry: ["資安", "SOC", "稽核"], data: ["資安報表", "事件紀錄", "合規稽核"], modules: [
      M("gpp_maybe", "告警分流", "資安告警彙整分級"),
      M("security", "事件應變", "事件調查與處置"),
      M("bug_report", "弱點管理", "弱點掃描與修補追蹤"),
      M("vpn_key", "身分權限", "帳號與特權管理"),
      M("policy", "合規治理", "政策、稽核與合規"),
      M("shield", "端點防護", "端點偵測與應變"),
    ]},
    "education-lms": { label: "學習管理平台", tagline: "課程、學員、測驗到學習進度的教學管理", entry: ["老師", "學員", "教務"], data: ["學習報表", "成績資料", "課程庫"], modules: [
      M("menu_book", "課程管理", "課程、單元與教材"),
      M("groups", "學員管理", "名冊、分班與出勤"),
      M("quiz", "作業測驗", "派題、批改與成績"),
      M("trending_up", "學習進度", "進度追蹤與提醒"),
      M("support_agent", "學習輔導", "提問與輔導紀錄"),
      M("workspace_premium", "證書結業", "結業與證照管理"),
    ]},
    "healthcare-clinic": { label: "診所 / 照護系統", tagline: "預約、病歷、診療到申報回診的照護流程", entry: ["醫護", "櫃檯", "藥師"], data: ["病歷資料", "申報紀錄", "回診追蹤"], modules: [
      M("event", "預約掛號", "線上預約與報到"),
      M("folder_shared", "病患病歷", "病歷與就診紀錄"),
      M("vaccines", "診療處置", "醫囑、處方與處置"),
      M("receipt_long", "申報請款", "健保申報與請款"),
      M("notifications_active", "回診追蹤", "主動回診與提醒"),
      M("inventory_2", "藥材庫存", "藥品/耗材管理"),
    ]},
    "construction-pm": { label: "營建工程管理", tagline: "進度、日報、品安到估價成本的工程管理", entry: ["工程師", "工地主任", "業主"], data: ["進度報表", "成本分析", "現場紀錄"], modules: [
      M("account_tree", "工程進度", "WBS 排程與進度追蹤"),
      M("description", "工地日報", "日報、人機料回報"),
      M("fact_check", "品質安衛", "巡檢與缺失改善"),
      M("request_quote", "估價發包", "估價、發包與計價"),
      M("payments", "成本控管", "預算、實支與請款"),
      M("photo_camera", "現場紀錄", "照片與文件留存"),
    ]},
    "maintenance-cmms": { label: "CMMS 設備維護", tagline: "保養、維修、預兆到備品的設備全生命週期", entry: ["設備", "維修", "廠務"], data: ["設備報表", "維護履歷", "感測數據"], modules: [
      M("calendar_month", "保養排程", "預防保養自動排程"),
      M("build", "維修工單", "報修、派工與完工"),
      M("sensors", "預兆診斷", "設備數據異常預警"),
      M("inventory_2", "備品管理", "備品庫存與領用"),
      M("speed", "OEE 稼動", "稼動與故障分析"),
      M("history", "履歷追溯", "設備維護履歷"),
    ]},
    "logistics-fleet": { label: "TMS 運輸調度", tagline: "派車、追蹤、簽收到成本油耗的車隊管理", entry: ["調度", "駕駛", "物流主管"], data: ["配送報表", "成本分析", "GPS 定位"], modules: [
      M("map", "路線調度", "派車與路線規劃"),
      M("local_shipping", "任務派車", "任務指派與追蹤"),
      M("location_on", "即時追蹤", "GPS 定位與到貨"),
      M("assignment_turned_in", "簽收回單", "電子簽收與回單"),
      M("local_gas_station", "成本油耗", "油耗與成本分析"),
      M("ac_unit", "冷鏈溫控", "溫度監控與告警"),
    ]},
    "legal-case": { label: "法務案件管理", tagline: "案件、庭期、合約到工時計費的法務管理", entry: ["律師", "法務", "助理"], data: ["案件報表", "工時計費", "文件庫"], modules: [
      M("folder", "案件管理", "案件建檔與進度"),
      M("gavel", "庭期管理", "開庭與期限提醒"),
      M("description", "合約管理", "合約審閱與風險"),
      M("schedule", "工時計費", "工時記錄與計費"),
      M("fact_check", "文件管理", "文件版本與檢索"),
      M("history", "案件追溯", "全程紀錄與稽核"),
    ]},
    "collaboration-pm": { label: "協作 / 專案平台", tagline: "任務、專案、知識到流程自動化的團隊協作", entry: ["團隊", "PM", "主管"], data: ["工作報表", "知識庫", "通知整合"], modules: [
      M("view_kanban", "任務看板", "任務指派與進度"),
      M("account_tree", "專案協作", "專案與里程碑"),
      M("description", "知識文件", "文件與知識庫"),
      M("bolt", "流程自動化", "表單簽核自動化"),
      M("forum", "團隊溝通", "討論與通知"),
      M("insights", "工作報表", "產能與進度報表"),
    ]},
    "service-desk": { label: "客服服務台", tagline: "多渠道客服、SLA 到客訴補償的服務管理", entry: ["客服", "主管", "客戶"], data: ["服務報表", "滿意度", "對話紀錄"], modules: [
      M("confirmation_number", "服務工單", "客訴/服務單管理"),
      M("timer", "SLA 追蹤", "時效與升級管理"),
      M("forum", "多渠道客服", "整合多渠道對話"),
      M("redeem", "客訴補償", "補償與退換處理"),
      M("smart_toy", "AI 客服助理", "自動回覆與建議"),
      M("sentiment_satisfied", "滿意度", "回饋與滿意度分析"),
    ]},
    "operations-console": { label: "營運管理主控台", tagline: "把日常作業收斂成可操作、可追蹤的營運中樞", entry: ["承辦", "主管", "管理層"], data: ["營運報表", "操作紀錄", "數據整合"], modules: [
      M("dashboard", "營運總覽", "今日狀態與待辦"),
      M("view_kanban", "作業看板", "作業流程看板"),
      M("report_problem", "例外處理", "異常與例外管理"),
      M("edit_note", "資料建立", "快速建立與流轉"),
      M("insights", "營運洞察", "數據彙整與洞察"),
      M("history", "操作紀錄", "稽核與追溯"),
    ]},
  };

  window.JVSystemContent = {
    classify,
    TYPES,
    get(project) { return TYPES[classify(project)] || TYPES["operations-console"]; },
  };
})();
