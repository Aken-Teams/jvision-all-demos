import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const catalogPath = path.join(root, "projects-index.json");
const scenarioPath = path.join(root, "content", "practical-scenarios.json");
const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
const scenarios = JSON.parse(fs.readFileSync(scenarioPath, "utf8")).scenarios || {};

const profiles = {
  "生產製造": ["生產主管", "規格、工單、產能與物料條件", "作業條件與排程", "生產紀錄", ["待排項目", "執行中", "異常待處理", "今日完成"]],
  "品質管理": ["品質工程師", "檢驗批次、規格與判定依據", "檢驗判定", "檢驗與改善紀錄", ["待檢驗", "不符合項目", "待品質核准", "合格率"]],
  "採購供應鏈": ["採購專員", "需求數量、交期、報價與供應條件", "採購條件與供應風險", "採購決策與供應紀錄", ["待詢價", "待議價", "供應風險", "準時交付率"]],
  "業務銷售": ["業務人員", "客戶需求、商機金額、報價與預計成交日", "商務條件與成交風險", "客戶跟進與成交紀錄", ["本週商機", "待報價", "高風險商機", "成交率"]],
  "人力資源": ["人資專員", "員工、職缺、日期與人事規則", "人事規則與核准條件", "人事處理與核准紀錄", ["待處理人事", "待主管核准", "本月完成", "資料完整率"]],
  "倉儲物流": ["倉儲主管", "料號、批號、數量、儲位與出貨需求", "庫存與作業條件", "庫存異動與作業紀錄", ["待執行作業", "庫存異常", "待覆核", "準時完成率"]],
  "研發管理": ["研發工程師", "產品規格、版本、驗證條件與技術文件", "技術可行性", "研發版本與驗證紀錄", ["進行中項目", "待驗證", "待審核版本", "里程碑達成率"]],
  "經營管理": ["經營主管", "目標、指標、風險與決策依據", "經營影響", "決策、責任與追蹤紀錄", ["待決策議題", "高風險事項", "待追蹤", "目標達成率"]],
  "ESG 永續": ["永續管理人員", "活動數據、排放來源、佐證與改善目標", "盤查與揭露條件", "永續數據與改善紀錄", ["待盤查資料", "缺漏佐證", "改善中", "目標達成率"]],
  "醫療照護": ["照護服務人員", "服務對象、評估資料、處置與追蹤日期", "專業評估", "服務、處置與追蹤紀錄", ["今日服務", "待專業確認", "待追蹤", "資料完整率"]],
  "教育": ["教學人員", "學習者、課程內容、進度與評量資料", "教學成效", "教學與學習成果紀錄", ["進行中課程", "待批改", "需協助學員", "完成率"]],
  "營建工程": ["專案工程師", "圖說、工項、數量、進度與現場佐證", "工程影響", "施工、查驗與簽核紀錄", ["進行中工項", "待查驗", "異常缺失", "進度達成率"]],
  "財務會計": ["財會人員", "單據、科目、金額、日期與往來對象", "入帳或付款規則", "財務憑證與核銷紀錄", ["待入帳", "待覆核", "金額差異", "準時結帳率"]],
  "資訊科技": ["IT 管理人員", "系統、服務、資源、事件與變更需求", "技術與服務影響", "處理、變更與服務紀錄", ["待處理服務", "異常事件", "待變更核准", "服務可用率"]],
  "資訊安全": ["資安人員", "帳號、資產、事件、風險與存取依據", "資安風險", "調查、核准與稽核紀錄", ["待調查事件", "高風險項目", "待權限核准", "處理完成率"]],
  "零售電商": ["門市營運人員", "商品、顧客、訂單、庫存與活動條件", "銷售與庫存影響", "交易、履約與顧客紀錄", ["今日訂單", "待履約", "庫存異常", "轉換率"]],
  "企業協作": ["專案協作人員", "任務、文件、期限、參與者與決議", "協作影響", "任務、決議與版本紀錄", ["待辦事項", "即將到期", "待確認", "完成率"]],
  "金融保險": ["金融服務人員", "客戶、申請資料、金額、風險與佐證", "授信或理賠條件", "審查、核准與交易紀錄", ["待審案件", "高風險案件", "待主管核准", "準時完成率"]],
  "餐飲旅宿": ["現場營運人員", "訂位、房況、品項、顧客需求與服務時段", "服務與供應條件", "接單、服務與結算紀錄", ["今日預訂", "待處理服務", "供應異常", "顧客滿意度"]],
  "設備維護": ["設備工程師", "設備、故障現象、保養週期、零件與停機影響", "維修可行性", "點檢、維修與復機紀錄", ["待維修設備", "異常告警", "待復機確認", "設備可用率"]],
  "物流運輸": ["運輸調度員", "車次、路線、貨件、時窗與簽收要求", "運輸可行性", "派車、運送與簽收紀錄", ["待派車", "運送中", "異常貨件", "準時送達率"]],
  "專業服務": ["案件承辦人", "客戶委託、文件、期限、工時與專業意見", "專業審查", "案件處理與交付紀錄", ["進行中案件", "即將到期", "待審文件", "準時交付率"]],
  "生活服務": ["服務人員", "顧客、預約、服務項目、時段與特殊需求", "服務安排", "預約、服務與回訪紀錄", ["今日預約", "待確認", "服務中", "回訪完成率"]],
  "數據分析": ["分析人員", "資料來源、分析口徑、指標與決策問題", "資料品質與分析結論", "分析版本與決策紀錄", ["待分析主題", "資料缺漏", "待確認結論", "報表準時率"]],
  "客服管理": ["客服人員", "客戶、問題、聯絡紀錄、服務承諾與處理期限", "服務補救方案", "回覆、處理與結案紀錄", ["待回覆案件", "即將逾時", "待主管確認", "一次解決率"]],
};

const cleanCore = (title) => String(title || "營運事項")
  .replace(/[（(][^）)]*[）)]/g, "")
  .replace(/\b(?:Demo|System|Platform|Management)\b/gi, "")
  .replace(/(?:管理)?(?:系統|平台|中心|協作所|工作台|儀表板|洞察站|管家|艙|台|所|室|塔|員|板)$/u, "")
  .replace(/[｜|]/g, " ")
  .replace(/\s+/g, " ")
  .trim() || String(title || "營運事項");

const normalize = (value, project) => String(value || "")
  .replaceAll(project.title || "", "{TITLE}")
  .replaceAll(project.repoName || "", "{REPO}")
  .replace(/\b\d+(?:[.,]\d+)*%?\b/g, "#")
  .replace(/\s+/g, " ")
  .trim();

function duplicateMembers(field) {
  const members = new Set();
  const groups = Map.groupBy(catalog.projects, (project) => normalize(project[field], project));
  for (const [value, projects] of groups) {
    if (value && projects.length > 1) projects.forEach((project) => members.add(project.repoName));
  }
  return members;
}

const duplicateDescriptions = duplicateMembers("description");
const duplicateSituations = duplicateMembers("businessSituation");
const duplicateDailyUse = duplicateMembers("dailyUse");
const titleSpecializations = {
  "jvision-smart-mfg-025-warehouse-management-system": "入出庫作業管理 WMS",
  "jvision-smart-mfg-181-warehouse-management-system": "庫存與儲位管理 WMS"
};

const salesDefinitions = {
  "jvision-smart-mfg-111-customer-relationship-management": ["客戶主檔與互動紀錄", "客戶經理", "公司、聯絡人、互動紀錄、商機與待辦", "整併重複客戶並安排下一次跟進", "確認客戶歸屬與關係狀態", "完整客戶 360° 履歷", "同一客戶由兩位業務重複接洽，且重要會議紀錄尚未回填。"],
  "jvision-smart-mfg-112-request-for-quotation": ["客戶詢價單", "業務專員", "需求規格、數量、交期、幣別與回覆期限", "釐清詢價條件並指派成本試算", "確認是否具備報價條件", "詢價回覆與報價準備紀錄", "客戶要求兩天內回覆新料號詢價，但圖面版本與年需求量仍不完整。"],
  "jvision-smart-mfg-113-sales-pipeline": ["業務商機", "業務主管", "商機階段、預估金額、成交機率、下一步與預計成交日", "更新階段並排定下一個成交行動", "檢查停滯與高風險商機", "可追蹤的商機漏斗", "本季一筆高額商機停在提案階段三週，下一步行動與決策人仍不明確。"],
  "jvision-smart-mfg-114-customer-portal": ["客戶自助服務", "客戶服務專員", "客戶帳號、訂單、文件下載權限與服務申請", "核對身分並開放所需服務", "確認客戶可見資料範圍", "入口網站服務與存取紀錄", "客戶登入後看不到最新訂單與檢驗文件，需要確認帳號權限及資料同步狀態。"],
  "jvision-smart-mfg-115-quotation-management": ["正式報價單", "報價專員", "品項、成本、售價、稅額、幣別、有效期限與版本", "試算價格並建立報價版本", "審核毛利、折扣與付款條件", "核准報價單與版本履歷", "業務準備送出報價時發現原物料成本已更新，必須重算毛利並重新取得折扣核准。"],
  "jvision-smart-mfg-116-sales-forecast": ["業務預測", "業務企劃", "歷史業績、商機機率、預計出貨日與產能限制", "彙整區域預測並調整可信度", "確認預測差異與供貨風險", "月度業務預測版本", "下月預測突然高於可供貨量，主管需要找出變動來源並調整承諾。"],
  "jvision-smart-mfg-117-contract-management": ["銷售合約", "合約管理人員", "客戶、條款、價格、責任、版本、起訖日與附件", "比對條款差異並追蹤義務", "完成法務與商務審查", "核准合約與義務清單", "客戶回傳的合約版本修改了賠償與付款條款，業務必須確認差異後才能用印。"],
  "jvision-smart-mfg-118-ai-sales": ["業務行動建議", "業務人員", "客戶信件、會議摘要、商機狀態與歷史互動", "整理訊號並產生下一步建議", "由業務確認建議與客戶語境", "可採用的跟進建議與草稿", "業務收到多封客戶信件但無法快速判斷優先順序，需要整理風險、承諾與下一步。"],
  "jvision-smart-mfg-119-order-management": ["客戶訂單", "訂單管理員", "客戶 PO、品項、數量、價格、交期、庫存與信用狀態", "核對訂單並確認可承諾交期", "檢查價格、信用與供貨條件", "可履約訂單與交付承諾", "新訂單的價格與有效報價不一致，且指定交期早於目前可供貨日。"],
  "jvision-smart-mfg-120-configure-price-quote": ["產品組態報價", "方案業務", "產品選項、相容規則、數量、價格、折扣與服務方案", "完成產品組態與即時計價", "檢查相容性、毛利與折扣權限", "可下單的組態報價", "客戶選擇的設備、軟體與保固方案彼此不相容，需要調整組態後重新計價。"],
  "jvision-smart-mfg-121-credit-management": ["客戶信用額度", "信用管理人員", "信用額度、應收帳款、付款紀錄、訂單曝險與保證條件", "計算信用曝險並提出處置", "核准額度、預付款或暫停出貨", "信用決策與放行紀錄", "客戶新增訂單後將超過信用額度，但仍有兩筆逾期帳款尚未清償。"],
  "jvision-smart-mfg-122-sales-commission-incentive": ["業績獎金", "獎酬管理人員", "業績、回款、達成率、獎金級距、退貨與扣回規則", "試算獎金並核對例外", "主管確認歸屬與計算規則", "獎金明細與核准紀錄", "跨區共同成交的訂單出現業績歸屬爭議，導致兩位業務的獎金試算不同。"],
  "jvision-smart-mfg-123-channel-distributor-management": ["經銷通路", "通路經理", "經銷商、區域、庫存、銷售、返利與年度目標", "追蹤通路表現並處理衝突", "確認區域、價格與返利資格", "經銷績效與返利紀錄", "兩家經銷商同時申報同一終端客戶，必須確認區域歸屬與專案報備資格。"],
  "jvision-smart-mfg-124-trade-show-lead-management": ["展會潛在客戶", "行銷業務", "名片、公司、需求、同意狀態、評分與跟進期限", "清理名單並分派業務跟進", "確認名單品質與個資同意", "可追蹤的展會商機名單", "展會結束後匯入數百筆名單，其中包含重複資料與缺少同意紀錄的聯絡人。"],
  "jvision-smart-mfg-125-after-sales-service-warranty": ["售後保固案件", "售後服務專員", "客戶、序號、保固條件、故障現象、零件與 SLA", "確認保固資格並安排服務", "判定保固、付費或責任歸屬", "服務工單與保固履歷", "客戶回報設備異常，但序號的保固期限與出貨資料不一致。"],
  "jvision-smart-mfg-126-customer-satisfaction-survey-nps": ["客戶滿意度回饋", "客戶體驗專員", "問卷、評分、意見、客群、服務接點與回覆狀態", "分析低分原因並建立改善追蹤", "確認需回訪的負面體驗", "NPS 結果與改善案件", "本月 NPS 明顯下降，數筆低分意見集中在交期與售後回覆速度。"],
  "jvision-smart-mfg-127-sales-dashboard-bi": ["業務績效指標", "業務分析人員", "營收、毛利、商機、成交率、區域與產品維度", "校對口徑並分析績效差異", "確認異常指標與責任區域", "業務儀表板與決策摘要", "營收達標但毛利率下滑，主管需要確認是產品組合、折扣還是區域差異造成。"],
  "jvision-smart-mfg-128-ai-ai-sales-forecasting": ["AI 銷售預測", "銷售分析人員", "歷史訂單、商機訊號、季節性、促銷與供貨限制", "訓練預測並解釋變動因素", "人工覆核異常預測與假設", "具解釋依據的銷售預測", "模型預測某產品需求驟增，但業務團隊尚未看到對應商機，需要檢查訊號來源。"],
  "jvision-smart-mfg-129-import-export-trade-documentation": ["進出口貿易文件", "國貿人員", "訂單、發票、裝箱單、HS Code、產地、報關與船期", "核對文件一致性並準備報關", "確認法規、金額與裝運資料", "完整貿易文件包", "出貨前發現商業發票與裝箱單的數量不一致，可能影響報關與船期。"],
  "jvision-smart-mfg-130-commission-settlement": ["通路佣金結算", "佣金結算人員", "訂單、回款、佣金率、退貨、稅額與爭議", "計算應付佣金並處理差異", "確認回款條件與扣回項目", "佣金結算單與差異紀錄", "代理商主張一筆佣金漏算，但該訂單仍有部分款項尚未收回。"],
  "jvision-smart-mfg-131-customer-abc-classification": ["客戶價值分級", "客戶策略人員", "營收、毛利、近購日、成長率、服務成本與風險", "計算分級並安排服務策略", "確認特殊客戶與人工調整", "客戶分級與經營策略", "一名高營收客戶因毛利下滑與服務成本升高，分級可能需要從 A 調整為 B。"],
  "jvision-smart-mfg-132-sales-approval-workflow": ["業務例外簽核", "業務營運人員", "折扣、毛利、付款條件、交期、責任與附件", "依授權層級送出簽核", "確認例外條件與核准權限", "可稽核的業務核准紀錄", "報價同時包含超額折扣與延長付款條件，需要依不同權限完成兩級簽核。"],
  "jvision-smart-mfg-133-field-sales-management": ["外勤拜訪", "外勤業務", "客戶、路線、拜訪目標、簽到、紀要與後續任務", "安排路線並完成拜訪回報", "確認拜訪成果與承諾事項", "拜訪紀錄與跟進任務", "業務一天安排六個客戶拜訪，其中兩個臨時改期，需要重新規劃路線與跟進。"],
  "jvision-smart-mfg-134-competitive-quote-benchmarking": ["競品報價比較", "商務分析人員", "競品、規格、單價、付款、交期、保固與資料來源", "對齊規格後比較價格條件", "確認比較基準與資料可信度", "競品比價表與定價建議", "競品報價看似較低，但規格、保固與交付範圍不同，不能直接比較總價。"],
  "jvision-smart-mfg-135-sales-expense-management": ["業務費用", "業務行政", "收據、費用類別、出差、客戶、專案與預算", "核對單據並分攤費用", "確認政策、預算與主管核准", "費用報支與會計傳票", "一筆客戶餐敘費用超過部門標準，且缺少與會名單與商務目的。"],
  "jvision-smart-mfg-136-ar-collections-management": ["應收帳款催收", "催收專員", "發票、帳齡、到期日、付款承諾、爭議與聯絡紀錄", "排定催收優先順序並追蹤承諾", "確認爭議、停供或升級條件", "催收紀錄與預計回款", "一筆逾期六十天的帳款多次未依承諾付款，需要升級處理並評估暫停供貨。"],
  "jvision-smart-mfg-137-sales-meeting-weekly-report": ["業務週報", "業務主管", "商機變化、拜訪成果、預測差異、阻礙與下週行動", "彙整團隊週報並追蹤阻礙", "確認數據口徑與責任行動", "會議決議與下週待辦", "週會前發現數名業務的預測未更新，且高額商機缺少明確下一步。"],
  "jvision-smart-mfg-138-sample-management": ["客戶樣品", "樣品管理員", "樣品料號、數量、收件人、借出期限、回收與試用回饋", "安排寄樣並追蹤回收與結果", "確認庫存、用途與核准條件", "樣品流向與試用紀錄", "業務要求緊急寄出高價樣品，但前一批借出品尚未歸還，也沒有試用回饋。"],
  "jvision-smart-mfg-139-lead-generation-prospect-management": ["潛在客戶", "開發業務", "名單來源、公司、聯絡人、需求、適配度、同意與評分", "驗證名單並轉成合格商機", "確認適配度與聯絡許可", "合格潛客與開發節奏", "新購名單中有大量非目標產業公司，需要先清理、評分再分派開發。"],
  "jvision-smart-mfg-140-sales-enablement-knowledge-base": ["業務知識與訓練", "業務賦能人員", "產品教材、銷售話術、競品卡、課程、測驗與版本", "發布最新教材並驗證學習成效", "確認內容正確性與適用對象", "核准教材與業務認證", "新產品即將上市，但業務仍使用舊版價格與競品話術，需要完成更新與測驗。"],
  "jvision-smart-mfg-141-order-change-management": ["訂單變更", "訂單協調員", "原訂單、變更版本、數量、價格、交期與影響範圍", "評估變更影響並取得客戶確認", "確認成本、產能與交期影響", "核准變更單與新版承諾", "客戶臨時增加數量並提前交期，可能影響生產排程與原報價。"],
  "jvision-smart-mfg-142-product-catalog-management": ["產品型錄", "產品行銷人員", "SKU、規格、圖片、售價、版本、語系與發布通路", "維護內容並發布核准版本", "確認規格、價格與品牌一致性", "多通路產品型錄版本", "官網與業務簡報出現不同規格與售價，需要確認哪個版本可以對外發布。"],
  "jvision-smart-mfg-143-territory-management": ["業務責任區", "業務營運人員", "區域、客戶、產業、潛力、業務歸屬與工作量", "重整責任區並平衡客戶分配", "確認歸屬衝突與服務能力", "責任區與客戶指派表", "兩位業務同時負責同一集團客戶，另一區域卻有大量潛客無人跟進。"],
  "jvision-smart-mfg-144-customer-complaint-management": ["客戶投訴", "客訴專員", "客戶、訂單、問題、嚴重度、證據、責任與回覆期限", "調查原因並提出處理方案", "確認補償、改善與結案條件", "客訴回覆與改善追蹤", "客戶收到錯誤規格產品並要求停線損失賠償，需要跨部門調查與回覆。"],
  "jvision-smart-mfg-145-contract-renewal-management": ["合約續約", "客戶成功經理", "到期日、使用情況、價格、服務問題、續約機率與談判紀錄", "安排續約節奏並處理流失風險", "確認新價格與續約條款", "續約版本與客戶承諾", "重要客戶合約六十天後到期，但使用率下降且近期有多筆服務抱怨。"],
  "jvision-smart-mfg-146-sales-quota-target-management": ["業務目標配額", "業務企劃", "年度目標、區域潛力、人力、產品策略、達成率與調整原因", "拆分配額並追蹤達成差距", "確認分配公平性與策略一致性", "核准配額與調整紀錄", "新區域增加兩名業務後，原有年度配額分配已不符合市場潛力與人力配置。"],
  "jvision-smart-mfg-147-delivery-lead-time-coordination": ["客戶交期承諾", "交期協調員", "訂單、需求日、產能、物料、物流時窗與客戶優先級", "協調供應並回覆可承諾日期", "確認產能、物料與運輸條件", "交期承諾與異常通知", "關鍵客戶要求提前一週交貨，但缺料與物流班次可能無法配合。"],
  "jvision-smart-mfg-149-e-signature-digital-seal-management": ["電子簽署與用印", "合約行政", "文件版本、簽署人、順序、身分驗證、印章與有效期限", "發起簽署並追蹤完成狀態", "確認版本、權限與用印規則", "具稽核軌跡的簽署文件", "合約即將到期，但其中一位簽署人已離職，簽署順序與授權必須重新設定。"],
  "jvision-smart-mfg-150-sales-handover-onboarding-management": ["業務交接", "業務主管", "客戶、聯絡人、商機、報價、承諾、文件與未完成任務", "盤點資料並完成新舊業務交接", "確認客戶承諾與責任轉移", "交接清單與客戶通知紀錄", "資深業務即將離職，數筆高額商機與客戶口頭承諾尚未完整留下紀錄。"]
};
let updated = 0;

for (const project of catalog.projects) {
  if (project.category === "交通運輸") continue;
  const profile = profiles[project.category];
  if (!profile) continue;
  if (titleSpecializations[project.repoName]) project.title = titleSpecializations[project.repoName];
  const [role, inputs, review, output, metrics] = profile;
  const core = cleanCore(project.title);
  project.description = `${project.title}聚焦「${core}」的完整作業，集中管理${inputs}，把資料確認、執行與${review}串成可追蹤流程，最後產出${output}。`;
  project.businessSituation = `當一筆${core}作業出現資料缺漏、期限逼近或條件異常時，${role}需要在${project.title}核對${inputs}，完成${review}並留下可追蹤的${output}。`;
  project.dailyUse = `${role}每天在${project.title}查看待處理的${core}，補齊${inputs}、處理異常、送交${review}，並確認${output}已更新。`;

  project.customerWorkflow = {
    eyebrow: `${core}實務流程`,
    steps: [`建立${core}資料`, `核對${core}條件`, `確認${review}並產出結果`],
    choices: [`確認條件並繼續`, `退回補充${inputs.split("、")[0]}`, `建立例外處理並指派負責人`],
    fields: [`${core}名稱／編號`, inputs],
    output
  };
  const sales = salesDefinitions[project.repoName];
  if (sales) {
    const [subject, salesRole, salesInputs, operate, salesReview, salesOutput, issue] = sales;
    project.description = `${project.title}用來管理${subject}，讓${salesRole}從${salesInputs}的建立與核對，接續${operate}、${salesReview}，直到產出${salesOutput}。`;
    project.businessSituation = issue;
    project.dailyUse = `${salesRole}每天查看待處理的${subject}，${operate}，處理逾期或資料不一致的例外，並完成${salesReview}與${salesOutput}。`;
    project.primaryUser = salesRole;
    project.customerWorkflow = {
      eyebrow: `${subject}實務流程`,
      steps: [`建立並補齊${subject}`, operate, `${salesReview}並完成交付`],
      choices: [`確認資料並執行「${operate}」`, `退回補充${salesInputs.split("、")[0]}`, `建立例外並指派${salesRole}`],
      fields: [`${subject}名稱／編號`, salesInputs],
      output: salesOutput
    };
  }
  const scenario = scenarios[project.repoName];
  if (!sales && scenario) {
    const operator = scenario.persona?.operator || project.primaryUser || role;
    const supervisor = scenario.persona?.supervisor || "部門主管";
    const businessObject = scenario.profile?.object || core;
    const fields = Array.isArray(scenario.profile?.fields) && scenario.profile.fields.length
      ? scenario.profile.fields
      : [businessObject, "期限", "負責人", "處理依據"];
    const workflowOutcomes = Array.isArray(scenario.workflow)
      ? scenario.workflow.map((step) => step.outcome).filter(Boolean)
      : [];
    const action = scenario.primaryAction || workflowOutcomes.at(-2) || `完成${businessObject}處理`;
    const stages = Array.isArray(scenario.profile?.stages) ? scenario.profile.stages : [];
    const result = workflowOutcomes.at(-1) || `${businessObject}處理紀錄`;
    const metricLabels = Array.isArray(scenario.metrics)
      ? scenario.metrics.map((metric) => metric.label).filter(Boolean).slice(0, 2)
      : [];

    project.description = scenario.description
      || `${operator}在「${scenario.triggerEvent}」發生時，使用${project.title}處理${businessObject}，執行「${action}」，讓${supervisor}能從${metricLabels.join("與") || "處理進度"}確認結果。`;
    project.businessSituation = scenario.businessSituation
      || `${scenario.companyContext?.name || "示範企業"}發生「${scenario.triggerEvent}」，${operator}必須在影響擴大前完成${action}。`;
    project.dailyUse = scenario.dailyUse
      || `${operator}每天依${fields.join("、")}處理${businessObject}，${supervisor}只需介入異常與逾期案件。`;
    project.primaryUser = [operator, supervisor, scenario.persona?.decisionMaker].filter(Boolean).join("、");
    project.customerWorkflow = {
      eyebrow: `${businessObject}客戶實戰`,
      steps: workflowOutcomes.slice(0, 3).length === 3
        ? workflowOutcomes.slice(0, 3)
        : [`確認${businessObject}與影響範圍`, action, `確認${result}`],
      choices: [
        action,
        `退回補充${fields[0]}`,
        `升級交由${supervisor}判斷`
      ],
      fields: [fields.slice(0, 2).join("／"), fields.slice(2).join("／") || `${businessObject}處理說明`],
      output: stages.length
        ? `${businessObject}由「${stages[0]}」更新至「${stages.at(-1)}」並保留${result}`
        : result
    };
  }
  if (!Array.isArray(project.operationalMetrics) || new Set(project.operationalMetrics).size < 4) {
    project.operationalMetrics = metrics;
  }
  updated += 1;
}

catalog.generatedAt = new Date().toISOString();
catalog.industryDifferentiation = {
  version: "2026.07.30-v1",
  updated,
  note: "同產業專案依個別主題產生不同介紹、使用情境、日常用途與客戶操作流程。"
};
fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
console.log(JSON.stringify({
  updated,
  descriptionsRewritten: duplicateDescriptions.size,
  situationsRewritten: duplicateSituations.size,
  dailyUseRewritten: duplicateDailyUse.size
}, null, 2));
