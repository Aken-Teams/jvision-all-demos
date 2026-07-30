import { projectWorkflowOverrides } from "./jvision-project-workflows.js?v=20260729-3";
import { resolveSemanticWorkflow } from "./jvision-semantic-workflows.js?v=20260729-1";
import { buildProjectProcessBlueprint } from "./jvision-process-blueprints.js?v=20260730-1";

const domainDefinitions = {
  "宗教服務": {
    code: "temple",
    eyebrow: "信眾服務中心",
    primary: "信徒",
    createTitle: "建立信徒與服務需求",
    fields: [["name","信徒姓名"],["contact","聯絡電話"],["request","點燈／法會／捐款項目"]],
    stages: ["資料建檔","服務確認","功德金入帳","完成登記"],
    actions: ["建立信徒名冊","確認點燈資料","登錄功德金","完成服務"],
    metrics: ["信徒名冊","待確認服務","今日點燈","功德金入帳"],
    seeds: [
      ["林明德","0912-345-678","光明燈","資料建檔"],
      ["陳美蘭","0988-210-336","安太歲","服務確認"],
      ["張國豪","0921-700-118","祈福法會","功德金入帳"]
    ]
  },
  "醫療照護": {
    code: "medical",
    eyebrow: "門診照護工作站",
    primary: "個案",
    createTitle: "新增掛號與主訴",
    fields: [["name","病患姓名"],["contact","病歷號"],["request","主訴／照護需求"]],
    stages: ["完成掛號","候診評估","醫師看診","處方批價","完成照護"],
    actions: ["完成掛號","記錄生命徵象","完成診察","確認處方","結束本次照護"],
    metrics: ["今日掛號","候診人數","待確認處方","平均候診"],
    seeds: [
      ["王小姐","MR-240701","持續咳嗽三日","完成掛號"],
      ["李先生","MR-231188","慢性處方續領","候診評估"],
      ["周小弟","MR-240724","發燒與喉嚨痛","醫師看診"]
    ]
  },
  "教育": {
    code: "education",
    eyebrow: "教學內容協作台",
    primary: "教案",
    createTitle: "建立教案與學習目標",
    fields: [["name","教案名稱"],["contact","授課教師"],["request","學習目標／適用年級"]],
    stages: ["草稿建立","素材編輯","同儕審閱","課綱確認","發布使用"],
    actions: ["建立草稿","補齊教材素材","送交審閱","確認課綱對應","發布教案"],
    metrics: ["教案總數","待審閱","本週發布","教材完整率"],
    seeds: [
      ["生成式 AI 入門","陳怡君老師","高中一年級｜理解提示詞","草稿建立"],
      ["永續城市專題","林志豪老師","國中二年級｜跨域探究","素材編輯"],
      ["數據圖表判讀","王雅雯老師","國中一年級｜資訊素養","同儕審閱"]
    ]
  },
  "餐飲旅宿": {
    code: "hospitality",
    eyebrow: "現場接待與服務台",
    primary: "訂位",
    createTitle: "新增訂位／住房需求",
    fields: [["name","顧客姓名"],["contact","聯絡方式"],["request","人數、日期與特殊需求"]],
    stages: ["預約成立","到店確認","安排桌房","服務進行","結帳完成"],
    actions: ["建立預約","確認抵達","安排桌位／房號","開始服務","完成結帳"],
    metrics: ["今日預約","等待安排","服務中","翻桌／住房率"],
    seeds: [
      ["黃小姐","0911-220-881","今晚 19:00｜4 位｜兒童椅","預約成立"],
      ["宇辰科技","02-2655-1188","商務聚餐｜包廂 10 位","到店確認"],
      ["James Chen","Email","雙人房｜延後入住","安排桌房"]
    ]
  },
  "倉儲物流": {
    code: "warehouse",
    eyebrow: "波次揀貨控制塔",
    primary: "波次",
    createTitle: "建立出貨波次",
    fields: [["name","波次編號"],["contact","作業人員"],["request","儲位、訂單與出貨要求"]],
    stages: ["波次建立","揀貨執行","複核包裝","月台交接","完成出庫"],
    actions: ["釋放波次","掃碼揀貨","完成複核","交接承運商","確認出庫"],
    metrics: ["今日波次","待揀貨","複核異常","準時出庫率"],
    seeds: [
      ["WAVE-0724-A","林志豪","A 區 18 張訂單｜今日 16:00","波次建立"],
      ["WAVE-0724-B","陳怡君","冷鏈 6 張訂單｜溫控交接","揀貨執行"],
      ["WAVE-0724-C","王雅雯","電商急單 12 張｜超商取貨","複核包裝"]
    ]
  },
  "營建工程": {
    code: "construction",
    eyebrow: "工地履約協作中心",
    primary: "工項",
    createTitle: "新增工項與查驗需求",
    fields: [["name","工項名稱"],["contact","負責工班"],["request","樓層、圖說與查驗重點"]],
    stages: ["工項建立","施工回報","自主查驗","監造確認","完成計價"],
    actions: ["建立工項","提交施工日報","完成自主查驗","送監造確認","納入估驗計價"],
    metrics: ["進行工項","待查驗","缺失改善","本期完成率"],
    seeds: [
      ["B2 筏基鋼筋","鋼筋班","B2｜圖號 S-112｜續接器抽驗","工項建立"],
      ["8F 外牆防水","防水班","8F 東向｜48 小時淹水試驗","施工回報"],
      ["機房消防配管","機電班","B1 機房｜套管與支架間距","自主查驗"]
    ]
  },
  "業務銷售": {
    code: "sales",
    eyebrow: "商機與營收作戰室",
    primary: "商機",
    createTitle: "建立客戶商機",
    fields: [["name","客戶／商機名稱"],["contact","業務負責人"],["request","預算、需求與預計成交日"]],
    stages: ["潛在客戶","需求訪談","方案報價","議價簽核","成交交接"],
    actions: ["建立商機","完成需求訪談","送出正式報價","提交議價簽核","完成成交交接"],
    metrics: ["進行中商機","待跟進","報價金額","預估達成率"],
    seeds: [
      ["曜川精工 MES 導入","陳怡君","預算 180 萬｜Q3 上線｜本週訪談","潛在客戶"],
      ["永信物流 WMS 擴充","林志豪","預算 95 萬｜需串接 ERP","需求訪談"],
      ["華景建設工地平台","王雅雯","報價 240 萬｜等待採購確認","方案報價"]
    ]
  },
  "生產製造": {
    code: "manufacturing",
    eyebrow: "生產排程與現場執行台",
    primary: "工單",
    createTitle: "建立生產工單",
    fields: [["name","工單／產品名稱"],["contact","產線與班別"],["request","數量、交期與用料要求"]],
    stages: ["工單建立","物料齊套","排程派工","生產報工","完工入庫"],
    actions: ["建立工單","確認物料齊套","完成排程派工","登錄生產報工","確認完工入庫"],
    metrics: ["今日工單","待排程","生產異常","準時完工率"],
    seeds: [
      ["MO-0724 鋁合金外殼","A 線｜早班","680 件｜今日 18:00｜鋁料 A6061","工單建立"],
      ["MO-0725 傳動軸","CNC-03｜中班","420 件｜刀具壽命需確認","物料齊套"],
      ["MO-0726 控制面板","組裝二線｜晚班","900 件｜首件確認完成","排程派工"]
    ]
  },
  "品質管理": {
    code: "quality",
    eyebrow: "品質異常與改善中心",
    primary: "品質案件",
    createTitle: "建立檢驗／異常案件",
    fields: [["name","批號與異常名稱"],["contact","品質負責人"],["request","檢驗結果、缺陷與隔離要求"]],
    stages: ["異常登錄","批次隔離","原因分析","改善驗證","結案放行"],
    actions: ["登錄品質異常","執行批次隔離","提交原因分析","完成改善驗證","核准結案放行"],
    metrics: ["品質案件","待隔離批次","改善驗證中","一次合格率"],
    seeds: [
      ["NCR-0724 外觀刮傷","陳怡君","LOT-A2407｜抽驗 8/50 不合格","異常登錄"],
      ["NCR-0722 尺寸偏差","林志豪","軸徑超差 0.08mm｜隔離 120 件","批次隔離"],
      ["CAR-0718 包裝破損","王雅雯","客訴 3 件｜需進行 8D 分析","原因分析"]
    ]
  },
  "採購供應鏈": {
    code: "procurement",
    eyebrow: "採購與供應協作中心",
    primary: "採購案件",
    createTitle: "建立請購需求",
    fields: [["name","物料／採購項目"],["contact","採購承辦人"],["request","數量、預算與需求日期"]],
    stages: ["請購提出","詢比議價","採購簽核","供應交貨","到貨驗收"],
    actions: ["建立請購單","完成詢比議價","送交採購簽核","確認供應交貨","完成到貨驗收"],
    metrics: ["進行採購","待詢價","逾期交貨","本月節省率"],
    seeds: [
      ["A6061 鋁材 2 噸","陳怡君","預算 42 萬｜8/05 到貨","請購提出"],
      ["CNC 主軸軸承","林志豪","3 家報價｜交期差異 12 天","詢比議價"],
      ["包裝紙箱年度合約","王雅雯","年度 12 萬只｜議價後降 4.2%","採購簽核"]
    ]
  },
  "人力資源": {
    code: "hr",
    eyebrow: "人才與人事服務中心",
    primary: "人事案件",
    createTitle: "建立人事需求",
    fields: [["name","員工／職缺名稱"],["contact","人資承辦人"],["request","部門、日期與作業需求"]],
    stages: ["需求建立","資料確認","主管核准","人資執行","完成歸檔"],
    actions: ["建立人事需求","確認員工資料","送交主管核准","核准並交由人資辦理","完成文件歸檔"],
    metrics: ["待辦人事","待主管核准","本月到職","資料完整率"],
    seeds: [
      ["製程工程師招募","陳怡君","製造部｜需求 2 人｜8 月到職","需求建立"],
      ["林志豪加班申請","王雅雯","7/23 18:00–21:00｜專案趕工","資料確認"],
      ["年度薪資調整批次","人資薪酬組","共 48 人｜主管已完成初審","主管核准"]
    ]
  },
  "財務會計": {
    code: "finance",
    eyebrow: "財務關帳與資金工作台",
    primary: "財務單據",
    createTitle: "建立財務單據",
    fields: [["name","單據／交易名稱"],["contact","會計承辦人"],["request","金額、科目與到期日"]],
    stages: ["單據建立","憑證檢核","主管覆核","付款收款","入帳結案"],
    actions: ["建立財務單據","完成憑證檢核","送交主管覆核","確認付款／收款","完成入帳結案"],
    metrics: ["待處理單據","待覆核","本週現金需求","關帳進度"],
    seeds: [
      ["AP-0724 原料貨款","陳怡君","NT$ 426,000｜應付帳款｜7/31","單據建立"],
      ["AR-0718 客戶專案款","林志豪","NT$ 1,280,000｜應收帳款｜已逾期 3 日","憑證檢核"],
      ["JV-2407 折舊批次","王雅雯","NT$ 318,600｜製造費用｜月底入帳","主管覆核"]
    ]
  }
};

const additionalDomainProfiles = {
  "企業協作": ["協作事項", "協作窗口", "跨部門需求", ["需求登錄", "任務分派", "協作執行", "成果確認", "完成歸檔"]],
  "專業服務": ["服務案件", "案件顧問", "客戶委託內容", ["委託受理", "資料盤點", "專業執行", "客戶確認", "結案交付"]],
  "交通運輸": ["運輸班次", "調度人員", "車輛、路線與乘載需求", ["班次建立", "車輛指派", "發車執行", "到站確認", "營運結算"]],
  "物流運輸": ["配送任務", "物流調度員", "取件、路線與送達需求", ["訂單受理", "路線排程", "配送執行", "簽收確認", "運費結算"]],
  "企業營運": ["營運事項", "營運負責人", "據點、資源與服務需求", ["事項建立", "資源配置", "現場執行", "主管確認", "營運歸檔"]],
  "數據分析": ["分析任務", "資料分析師", "資料來源、指標與分析問題", ["需求定義", "資料準備", "模型分析", "結果驗證", "洞察發布"]],
  "ESG 永續": ["永續盤查項目", "永續管理員", "排放源、活動數據與查證範圍", ["邊界確認", "數據蒐集", "排放計算", "查證覆核", "報告揭露"]],
  "生活服務": ["服務預約", "服務專員", "顧客時段與服務項目", ["預約受理", "人員排班", "到店服務", "顧客確認", "服務結案"]],
  "設備維護": ["維護工單", "設備工程師", "設備編號、故障現象與停機影響", ["異常報修", "故障診斷", "維修執行", "復機驗證", "保養歸檔"]],
  "客服管理": ["客服案件", "客服專員", "客戶問題、影響範圍與期望回覆", ["案件受理", "問題分類", "跨部處理", "客戶回覆", "滿意度結案"]],
  "零售電商": ["銷售訂單", "門市／電商人員", "商品、數量與交付方式", ["購物需求", "庫存保留", "收款揀貨", "出貨交付", "售後完成"]],
  "金融保險": ["金融服務案件", "理財／核保專員", "客戶需求、風險資料與申請內容", ["申請受理", "身分審查", "風險評估", "核准簽約", "服務生效"]],
  "研發管理": ["研發需求", "產品／研發負責人", "產品規格、驗證條件與版本範圍", ["需求收件", "規格評估", "開發驗證", "版本審核", "發佈歸檔"]],
  "資訊科技": ["IT 服務單", "IT 維運人員", "系統、帳號與服務影響", ["服務申請", "技術分流", "處理執行", "使用者驗收", "服務關閉"]],
  "資訊安全": ["資安事件", "資安分析師", "告警來源、受影響資產與風險跡象", ["告警受理", "事件研判", "隔離處置", "復原驗證", "事件結案"]],
  "經營管理": ["經營議題", "營運主管", "目標、現況與待決策事項", ["議題提出", "資料彙整", "方案評估", "決策核定", "成效追蹤"]],
  "內容管理": ["內容任務", "內容編輯", "主題、受眾與發布渠道", ["內容提案", "素材編輯", "審稿校對", "排程發布", "成效回顧"]]
};

for (const [category, [primary, owner, request, stages]] of Object.entries(additionalDomainProfiles)) {
  if (domainDefinitions[category]) continue;
  domainDefinitions[category] = {
    code: `domain-${Object.keys(domainDefinitions).length + 1}`,
    eyebrow: `${category}流程協作中心`,
    primary,
    createTitle: `建立${primary}`,
    fields: [["name", `${primary}名稱`], ["contact", owner], ["request", request]],
    stages,
    actions: stages.map((stage, index) => index === 0 ? `建立${primary}` : `確認${stage}`),
    metrics: [`進行中${primary}`, "本週待確認", "逾期風險", "流程完成率"],
    seeds: [
      [`${primary} A01`, owner, request, stages[0]],
      [`${primary} B02`, owner, `需於本週完成：${request}`, stages[1]],
      [`${primary} C03`, owner, `主管待確認：${request}`, stages[2]]
    ]
  };
}

const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => (
  {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]
));

function buildOperationChecklist(project, definition, item, nextStage, action, scenario = "normal") {
  const category = project.category || "";
  const stage = definition.stages[item.stage];
  const next = definition.stages[nextStage];
  const field = definition.fields[2][1];
  const commonEvidence = `記錄「${action}」的時間、執行人與結果附件`;
  if (scenario === "exception") {
    return [
      `確認「${item.name}」的異常現象、發生時間與影響範圍`,
      `保存原始資料、現場照片或系統紀錄，避免異常證據被覆蓋`,
      `評估替代方案、暫停條件與恢復正常作業的判斷標準`,
      `指定改善負責人、完成期限，並留下追蹤與升級處理紀錄`
    ];
  }
  if (scenario === "approval") {
    return [
      `確認「${item.name}」的申請內容、附件與前階段結果均完整`,
      `核對金額／資源、授權層級及是否存在利益衝突`,
      `審閱風險、例外條件與退回後需要補正的項目`,
      `記錄核准、退回或附條件通過的理由與生效日期`
    ];
  }
  const categoryTasks = {
    "倉儲物流": [
      `掃描「${item.name}」的料號、批號與來源儲位`,
      `核對帳面數量、實際數量及「${field}」`,
      `確認目的儲位容量、搬運路徑與設備狀態`,
      `完成${action}後回寫移動數量與目的儲位`
    ],
    "生產製造": [
      `確認「${item.name}」的工單、產品版本與排程時段`,
      `核對機台、模具、物料與作業人員是否到位`,
      `依標準作業條件執行「${action}」並記錄實績`,
      `回報良品、報廢、停機與待處理異常數量`
    ],
    "品質管理": [
      `確認「${item.name}」的檢驗批次、抽樣計畫與規格版本`,
      `登錄量測值、缺陷代碼及不合格品照片`,
      `依判定基準執行「${action}」並選擇允收或隔離`,
      `保留覆核人、判定時間與後續矯正要求`
    ],
    "採購供應鏈": [
      `核對「${item.name}」的需求數量、交期與預算來源`,
      `確認供應商資格、報價條件及歷史履約紀錄`,
      `執行「${action}」並記錄議價或審核意見`,
      `保留核准人、承諾交期與採購條件版本`
    ],
    "業務銷售": [
      `確認「${item.name}」的客戶需求、預算與決策時程`,
      `核對產品組合、價格、毛利及特殊交易條件`,
      `完成「${action}」並記錄客戶回饋與待辦事項`,
      `更新預計成交日、成功機率及下一次聯繫安排`
    ],
    "人力資源": [
      `核對「${item.name}」的員工／職缺資料與適用規則`,
      `確認部門、主管、日期及必要證明文件`,
      `依權責執行「${action}」並記錄核准或退回原因`,
      `更新生效日、人事紀錄及需要通知的相關人員`
    ],
    "財務會計": [
      `核對「${item.name}」的單據、金額、稅額與會計期間`,
      `確認客戶／供應商、科目、成本中心及附件憑證`,
      `執行「${action}」並記錄差異與調整原因`,
      `更新傳票、付款／收款狀態與覆核軌跡`
    ],
    "醫療照護": [
      `確認「${item.name}」的服務對象、預約／照護需求與身分資料`,
      `核對專業人員、時段、處置內容及必要同意紀錄`,
      `依照服務規範執行「${action}」並記錄觀察結果`,
      `更新後續安排、提醒事項及需要追蹤的異常`
    ],
    "教育": [
      `確認「${item.name}」的課程、班級、對象與學習目標`,
      `核對教材版本、授課時段、教師及教室／線上資源`,
      `執行「${action}」並記錄完成度與學習回饋`,
      `更新評量結果、缺交事項與後續輔導安排`
    ],
    "營建工程": [
      `核對「${item.name}」的圖說版本、工項、樓層與施工區域`,
      `確認人員、材料、機具及施工前安全條件`,
      `依查驗點執行「${action}」並拍照記錄`,
      `更新完成數量、缺失項目及監造／業主確認結果`
    ],
    "物流運輸": [
      `確認「${item.name}」的取送地點、時窗、貨物與車輛需求`,
      `核對司機、車況、載重、路線及必要運送文件`,
      `執行「${action}」並回報定位、里程與到離場時間`,
      `保留簽收、異常、照片及費用紀錄`
    ],
    "交通運輸": [
      `核對「${item.name}」的車輛、駕駛、班次與服務時段`,
      `確認路線、載客／載貨限制與安全檢查結果`,
      `執行「${action}」並記錄出發、抵達與里程`,
      `回報延誤、事故、維修或其他營運異常`
    ],
    "設備維護": [
      `確認「${item.name}」的設備編號、告警、停機影響與安全隔離`,
      `核對故障現象、歷史維修及所需備品工具`,
      `依維修步驟執行「${action}」並記錄量測值`,
      `完成試車、復機確認與下次保養安排`
    ],
    "資訊安全": [
      `確認「${item.name}」的告警來源、帳號、資產與影響範圍`,
      `保存事件時間線、日誌、連線與其他數位證據`,
      `依風險等級執行「${action}」並記錄核准人`,
      `驗證隔離／停權／修補結果並安排後續監控`
    ],
    "資訊科技": [
      `確認「${item.name}」的系統、使用者、影響範圍與服務等級`,
      `核對設定、版本、權限、相依服務及變更時段`,
      `執行「${action}」並保存操作指令與測試結果`,
      `取得使用者驗收並更新知識庫或維運紀錄`
    ],
    "ESG 永續": [
      `確認「${item.name}」的據點、期間、排放源與資料邊界`,
      `核對活動數據、單位、係數版本及佐證文件`,
      `執行「${action}」並標記估算、缺漏與異常數據`,
      `保留覆核結果、改善責任人與預計完成日`
    ],
    "研發管理": [
      `確認「${item.name}」的需求來源、產品版本與驗收條件`,
      `核對規格、圖面、BOM、測試資源及影響範圍`,
      `執行「${action}」並記錄測試數據與問題單`,
      `更新版本決策、審核結論與發佈／回復計畫`
    ],
    "零售電商": [
      `確認「${item.name}」的商品、數量、價格與顧客資料`,
      `核對庫存、優惠、付款及取貨／配送方式`,
      `執行「${action}」並記錄訂單與金流結果`,
      `更新出貨、退換貨與顧客通知狀態`
    ],
    "客服管理": [
      `確認「${item.name}」的客戶身分、問題描述與影響程度`,
      `核對歷史聯繫、服務方案及承諾回覆時間`,
      `執行「${action}」並記錄處理說明與附件`,
      `確認客戶回覆、滿意度及是否需要升級處理`
    ],
    "金融保險": [
      `確認「${item.name}」的申請人身分、服務需求與適用商品`,
      `核對徵審／核保資料、風險揭露及法遵文件`,
      `依授權層級執行「${action}」並記錄評估依據`,
      `更新核准條件、契約狀態與後續服務安排`
    ],
    "專業服務": [
      `確認「${item.name}」的委託範圍、交付物與完成期限`,
      `核對負責顧問、估計工時、合約條件及客戶資料`,
      `執行「${action}」並保存工作底稿與專業判斷`,
      `更新客戶確認、待補資料與計費進度`
    ],
    "企業協作": [
      `確認「${item.name}」的提案人、協作部門與預期成果`,
      `核對待辦責任、會議決議、附件版本與完成期限`,
      `執行「${action}」並同步相關人員`,
      `更新決議、未完成事項與下一次追蹤時間`
    ],
    "企業營運": [
      `確認「${item.name}」的營運目標、責任單位與影響範圍`,
      `核對現況數據、資源需求、成本與預計效益`,
      `執行「${action}」並記錄主管決策`,
      `更新負責人、里程碑、風險及成效追蹤方式`
    ],
    "宗教服務": [
      `確認「${item.name}」的信眾資料、服務項目與辦理日期`,
      `核對登記內容、收據、燈位／法會名額及聯絡方式`,
      `執行「${action}」並記錄經辦人與完成狀態`,
      `更新通知、收款、服務完成及後續聯繫紀錄`
    ],
    "餐飲旅宿": [
      `確認「${item.name}」的顧客、日期、人數與服務需求`,
      `核對桌房／房型、庫存、價格、訂金及特殊備註`,
      `執行「${action}」並同步現場與後台`,
      `更新入住／用餐、結帳、客訴與顧客回饋`
    ],
    "生活服務": [
      `確認「${item.name}」的顧客資料、預約項目與服務時段`,
      `核對服務人員、資源、價格及顧客特別需求`,
      `執行「${action}」並記錄現場服務內容`,
      `更新收款、完成狀態、回訪及下次預約`
    ],
    "數據分析": [
      `確認「${item.name}」的分析問題、使用者與決策目的`,
      `核對資料來源、期間、口徑、品質及存取權限`,
      `執行「${action}」並保存查詢條件與模型版本`,
      `更新洞察結論、異常說明與後續行動建議`
    ],
    "經營管理": [
      `確認「${item.name}」的議題、目標與決策期限`,
      `核對關鍵指標、假設、資源限制及風險資料`,
      `執行「${action}」並記錄決策理由`,
      `更新行動負責人、預期成果與追蹤週期`
    ]
  };
  const tasks = categoryTasks[category] || [
    `確認「${item.name}」在「${stage}」階段的必要資料與附件`,
    `核對${definition.fields[1][1]}、${field}及權責條件`,
    `依「${project.title}」規則執行「${action}」`,
    `${commonEvidence}，確認可進入「${next}」`
  ];
  return tasks;
}

function buildOperationFields(project, definition, item, nextStage, scenario = "normal") {
  const category = project.category || "";
  const stage = definition.stages[item.stage];
  if (scenario === "exception") {
    return [
      { name:"exceptionType", label:"異常類型", type:"select", options:["資料不完整","數量／金額差異","時程延誤","品質或服務異常","系統／設備異常"] },
      { name:"impact", label:"影響範圍與暫行措施", type:"text" },
      { name:"recoveryDate", label:"預計恢復／改善日期", type:"date" }
    ];
  }
  if (scenario === "approval") {
    return [
      { name:"approvalDecision", label:"簽核決定", type:"select", options:["核准","附條件核准","退回補件","駁回"] },
      { name:"approvalComment", label:"簽核意見與條件", type:"text" },
      { name:"effectiveDate", label:"決定生效日期", type:"date" }
    ];
  }
  const fieldSets = {
    "倉儲物流": [["quantity","實際處理數量","number"],["location","目的儲位／站點","text"],["equipment","搬運設備","select",["AMHS","AGV","堆高機","人工搬運"]]],
    "生產製造": [["quantity","本次完成數量","number"],["machine","機台／產線","text"],["result","生產結果","select",["正常完成","部分完成","異常停機","待補料"]]],
    "品質管理": [["sample","抽樣／檢驗數量","number"],["defect","缺陷代碼或量測值","text"],["decision","品質判定","select",["允收","隔離","重工","退貨"]]],
    "採購供應鏈": [["amount","含稅金額","number"],["delivery","承諾交期","date"],["decision","採購決定","select",["同意","議價後同意","退回補件","改詢其他供應商"]]],
    "業務銷售": [["amount","預估成交金額","number"],["followup","下次聯繫日期","date"],["probability","成交機率","select",["25%","50%","75%","90%"]]],
    "人力資源": [["effectiveDate","預計生效日","date"],["department","部門／單位","text"],["decision","人事決定","select",["核准","退回補件","轉交主管","暫緩"]]],
    "財務會計": [["amount","入帳／核銷金額","number"],["account","會計科目／成本中心","text"],["postingDate","入帳日期","date"]],
    "醫療照護": [["serviceDate","服務／處置日期","date"],["provider","執行人員","text"],["result","服務結果","select",["完成","需追蹤","轉介","取消"]]],
    "教育": [["courseDate","授課／評量日期","date"],["score","完成度／評量分數","number"],["result","學習狀態","select",["完成","需補交","需輔導","缺席"]]],
    "營建工程": [["quantity","完成數量／進度","number"],["area","樓層／施工區域","text"],["inspection","查驗結果","select",["合格","限期改善","停工確認","待複驗"]]],
    "物流運輸": [["vehicle","車號／運具","text"],["arrival","預計抵達日期","date"],["result","運送狀態","select",["正常","延誤","貨損","地址異常"]]],
    "交通運輸": [["vehicle","車號／班次","text"],["mileage","本次里程","number"],["result","行程狀態","select",["完成","延誤","事故","取消"]]],
    "設備維護": [["equipment","設備編號","text"],["downtime","停機分鐘","number"],["result","復機結果","select",["正常復機","觀察運轉","待料","無法復機"]]],
    "資訊安全": [["asset","受影響資產／帳號","text"],["risk","風險等級","select",["低","中","高","重大"]],["result","處置結果","select",["隔離完成","停權完成","修補完成","持續監控"]]],
    "資訊科技": [["system","系統／服務名稱","text"],["window","變更／處理日期","date"],["result","驗收結果","select",["通過","部分通過","退回修正","已回復"]]],
    "ESG 永續": [["value","活動數據／排放量","number"],["unit","資料單位","text"],["evidence","佐證文件編號","text"]],
    "研發管理": [["version","版本／圖號","text"],["testDate","驗證日期","date"],["result","驗證結果","select",["通過","有條件通過","失敗","待補測"]]],
    "零售電商": [["quantity","商品數量","number"],["amount","訂單／退款金額","number"],["result","履約狀態","select",["完成","部分出貨","取消","退換貨"]]],
    "客服管理": [["contactDate","回覆日期","date"],["channel","聯繫管道","select",["電話","Email","通訊軟體","現場"]],["result","客戶回覆","select",["已接受","需再處理","升級申訴","無法聯繫"]]]
  };
  return (fieldSets[category] || [
    ["effectiveDate", `${stage}處理日期`, "date"],
    ["resultValue", `${definition.primary}處理結果`, "text"],
    ["decision", `進入「${definition.stages[nextStage]}」的決定`, "select", ["同意","退回補件","暫緩","轉交"]]
  ]).map(([name,label,type,options]) => ({ name, label, type, options }));
}

function getDocumentName(category, action) {
  const names = {
    "倉儲物流":"庫存異動單","生產製造":"生產實績單","品質管理":"品質檢驗報告",
    "採購供應鏈":"採購審核紀錄","業務銷售":"商機處理紀錄","人力資源":"人事核准單",
    "財務會計":"會計處理憑證","醫療照護":"服務處置紀錄","教育":"教學／評量紀錄",
    "營建工程":"施工查驗紀錄","物流運輸":"運送簽收紀錄","交通運輸":"行程執行紀錄",
    "設備維護":"維修復機報告","資訊安全":"資安處置報告","資訊科技":"IT 服務驗收單",
    "ESG 永續":"永續數據覆核表","研發管理":"研發驗證紀錄","零售電商":"訂單履約紀錄",
    "客服管理":"客戶服務紀錄","金融保險":"風險審查紀錄","專業服務":"專業服務工作底稿",
    "企業協作":"協作決議紀錄","企業營運":"營運決策紀錄","宗教服務":"信眾服務辦理單",
    "餐飲旅宿":"服務履約紀錄","生活服務":"顧客服務紀錄","數據分析":"分析結論報告",
    "經營管理":"經營決策紀錄"
  };
  return names[category] || `${action}紀錄`;
}

function getIntegrationEffect(category) {
  return {
    "倉儲物流":"已同步庫存、儲位與搬運任務",
    "生產製造":"已回寫生產實績、物料耗用與設備狀態",
    "品質管理":"已同步隔離庫存與品質異常追蹤",
    "採購供應鏈":"已更新採購單、供應商承諾與到貨排程",
    "業務銷售":"已同步報價、訂單與銷售預測",
    "人力資源":"已同步員工主檔、簽核與薪勤資料",
    "財務會計":"已同步傳票、應收應付與資金狀態",
    "醫療照護":"已同步預約、處置與後續追蹤",
    "教育":"已同步課程、出缺席與學習紀錄",
    "營建工程":"已同步工項進度、缺失與估驗資料",
    "物流運輸":"已同步派車、定位與簽收資料",
    "交通運輸":"已同步班次、里程與車況紀錄",
    "設備維護":"已同步設備狀態、備品耗用與保養計畫",
    "資訊安全":"已同步事件、帳號權限與風險追蹤",
    "資訊科技":"已同步服務台、資產與變更紀錄",
    "ESG 永續":"已同步活動數據、排放計算與佐證資料",
    "研發管理":"已同步版本、BOM／圖面與驗證結果"
  }[category] || "已同步相關主檔、待辦與營運指標";
}

function getRoleOptions(category, definition, blueprint) {
  const specialists = {
    "倉儲物流":"倉儲經辦","生產製造":"生管／現場人員","品質管理":"品保工程師",
    "採購供應鏈":"採購經辦","業務銷售":"業務人員","人力資源":"人資經辦",
    "財務會計":"會計經辦","醫療照護":"照護／醫事人員","教育":"教師／教務",
    "營建工程":"工務工程師","物流運輸":"調度人員","交通運輸":"車隊調度",
    "設備維護":"設備工程師","資訊安全":"資安分析師","資訊科技":"IT 維運人員",
    "ESG 永續":"永續管理人員","研發管理":"研發工程師"
  };
  return [
    { value:"operator", label:blueprint?.governance.operator || specialists[category] || definition.fields[1][1], description:"建立、編輯並執行日常作業" },
    { value:"manager", label:blueprint?.governance.approver || "主管／核准人", description:"依簽核條件核准、退回並確認輸出結果" },
    { value:"auditor", label:"稽核／檢視者", description:"唯讀查看文件、軌跡與指標" }
  ];
}

function getExceptionMessage(category) {
  return {
    "倉儲物流":"帳面數量與實際盤點不符，目的儲位容量不足",
    "生產製造":"關鍵物料不足，排程機台目前處於停機狀態",
    "品質管理":"量測值超出規格上限，該批次必須先隔離",
    "採購供應鏈":"金額超過授權額度，且供應商資格文件已逾期",
    "業務銷售":"報價毛利低於底線，需要主管例外核准",
    "人力資源":"申請資料缺少必要證明，且日期與既有班表衝突",
    "財務會計":"單據金額與付款資料不符，會計期間已關帳",
    "醫療照護":"服務對象資料不完整，且目前時段資源衝突",
    "教育":"教材版本不一致，且部分學員尚未完成先修內容",
    "營建工程":"施工圖版本不符，現場安全檢查仍有未完成項目",
    "物流運輸":"車輛載重不足，預計抵達時間將超過承諾時窗",
    "交通運輸":"駕駛工時即將超限，指派車輛也有待修告警",
    "設備維護":"設備尚未完成斷電掛牌，所需備品庫存不足",
    "資訊安全":"偵測到高風險帳號與異常連線，必須先隔離資產",
    "資訊科技":"變更時窗衝突，相依服務健康檢查未通過",
    "ESG 永續":"活動數據缺少佐證，排放係數版本也不一致",
    "研發管理":"測試結果未達驗收門檻，變更影響尚未評估完整"
  }[category] || "必要資料不完整或超出授權條件，需要補件或主管判斷";
}

function getDashboardInsights(category, state, definition) {
  const highRisk = state.items.filter(item => item.alert).length;
  const pendingApproval = state.items.filter(item => item.stage === Math.min(2, definition.stages.length - 1)).length;
  const documents = state.documents.length;
  const labels = {
    "倉儲物流":["待補貨／移庫","帳實差異","今日搬運"],
    "生產製造":["排程風險","停機／缺料","今日產出"],
    "品質管理":["待判定批次","隔離數量","今日放行"],
    "採購供應鏈":["待議價","交期風險","待核准金額"],
    "業務銷售":["高機率商機","低毛利報價","本月預測"],
    "人力資源":["待主管核准","資料缺漏","本月生效"],
    "財務會計":["待入帳","差異待查","今日核銷"],
    "資訊安全":["高風險事件","待停權帳號","今日處置"]
  }[category] || ["待主管確認","異常待處理","今日完成"];
  return [
    { label:labels[0], value:pendingApproval, note:`${definition.stages[Math.min(2,definition.stages.length-1)]}階段` },
    { label:labels[1], value:highRisk, note:highRisk ? "需要立即處理" : "目前正常" },
    { label:labels[2], value:documents, note:"已產生結果文件" }
  ];
}

export function mountDomainOperations({ project, slug }) {
  let definition = domainDefinitions[project.category];
  if (!definition || document.querySelector(".jv-client-demo")) return;
  if (projectWorkflowOverrides[slug]) {
    definition = {
      ...definition,
      ...projectWorkflowOverrides[slug],
      code: `${definition.code}-specialized`,
    };
  } else {
    definition = {
      ...definition,
      ...resolveSemanticWorkflow(project),
      code: `${definition.code}-semantic`,
    };
  }
  if (slug === "jvision-smart-mfg-214-ai-attrition-prediction") {
    definition = {
      ...definition,
      eyebrow: "員工溝通與留任管理",
      primary: "留任追蹤",
      createTitle: "建立員工留任追蹤",
      fields: [["name","員工姓名"],["contact","HRBP／溝通負責人"],["request","近期狀況與需協助事項"]],
      stages: ["狀況提醒","主管確認","一對一溝通","改善安排","後續追蹤"],
      actions: ["建立留任追蹤","確認近期狀況","安排一對一面談","落實改善方案","完成後續追蹤"],
      metrics: ["需優先聯繫","待主管確認","面談安排中","後續追蹤率"],
      seeds: [
        ["陳冠宇","HRBP 林怡君","連續加班 4 週｜希望調整工作負荷與排班","狀況提醒"],
        ["王佳穎","人才發展組","有內部轉調想法｜等待主管安排討論","主管確認"],
        ["林志豪","HRBP 陳雅雯","已完成首次面談｜需確認職涯與工作調整方案","一對一溝通"]
      ]
    };
  }
  if (slug !== "jvision-smart-mfg-214-ai-attrition-prediction" && !projectWorkflowOverrides[slug]) {
    const compactText = (value, limit = 92) => {
      const text = String(value || "").replace(/\s+/g, " ").trim();
      return text.length > limit ? `${text.slice(0, limit - 1)}…` : text;
    };
    const projectTexts = [
      project.description,
      project.dailyUse,
      project.businessSituation
    ].filter(Boolean);
    const contactNames = ["陳怡君", "林志豪", "王雅婷"];
    definition = {
      ...definition,
      metrics: Array.isArray(project.operationalMetrics) && project.operationalMetrics.length >= 4
        ? project.operationalMetrics.slice(0, 4)
        : definition.metrics,
      seeds: definition.seeds.map((seed, index) => [
        `${project.title}｜${definition.primary} ${index + 1}`,
        `${definition.fields[1][1]} ${contactNames[index]}`,
        compactText(projectTexts[index % Math.max(1, projectTexts.length)] || seed[2]),
        definition.stages[Math.min(index, 2)]
      ])
    };
  }
  const processBlueprint = buildProjectProcessBlueprint(project, definition);
  const storageVersion = slug === "jvision-smart-mfg-251-system-251" ? "v3" : "v4";
  const storageKey = `jvision-domain-operations:${slug}:${storageVersion}`;
  const initial = () => ({
    items: definition.seeds.map((seed, index) => ({
      id: `${slug}-${index + 1}`,
      name: seed[0],
      contact: seed[1],
      request: seed[2],
      stage: Math.max(0, definition.stages.indexOf(seed[3]))
    })),
    selected: 0,
    logs: [`已載入「${project.title}」專屬展示資料`],
    documents: [],
    integrations: [],
    role: "operator",
    scenario: "normal",
    feedback: "可選取一筆資料查看明細，或從第一階段建立新的展示資料。"
  });
  let state;
  try { state = JSON.parse(localStorage.getItem(storageKey)) || initial(); } catch { state = initial(); }
  state.documents ||= [];
  state.integrations ||= [];
  state.role ||= "operator";
  state.scenario ||= "normal";
  const save = () => localStorage.setItem(storageKey, JSON.stringify(state));
  const host = document.querySelector(".workspace") || document.querySelector("#demo") || document.querySelector("main") || document.body;
  const root = document.createElement("section");
  root.className = `jv-client-demo jv-domain-demo jv-domain-${definition.code}`;
  host.append(root);
  let activeGuideStep = -1;
  let pendingOperationIndex = null;
  let activeDocumentId = null;
  let detailOpen = false;
  const log = message => {
    state.logs.unshift(`${new Date().toLocaleTimeString("zh-TW",{hour:"2-digit",minute:"2-digit"})}　${message}`);
    state.logs = state.logs.slice(0, 8);
  };
  const render = () => {
    const completed = state.items.filter(item => item.stage === definition.stages.length - 1).length;
    const attention = state.items.filter(item => item.stage > 0 && item.stage < definition.stages.length - 1).length;
    const activeStage = Number.isInteger(state.filterStage) ? state.filterStage : null;
    const visibleItems = state.items
      .map((item, index) => ({ item, index }))
      .filter(entry => activeStage === null || entry.item.stage === activeStage);
    const selectedEntry = activeStage === null
      ? { item: state.items[state.selected] || state.items[0], index: state.selected }
      : visibleItems.find(entry => entry.index === state.selected) || visibleItems[0];
    const selected = selectedEntry?.item;
    const pendingItem = Number.isInteger(pendingOperationIndex) ? state.items[pendingOperationIndex] : null;
    const pendingNextStage = pendingItem && pendingItem.stage < definition.stages.length - 1
      ? pendingItem.stage + 1
      : null;
    const pendingAction = pendingNextStage === null
      ? ""
      : definition.actions[pendingNextStage] || definition.actions[pendingItem.stage] || `執行${definition.stages[pendingNextStage]}`;
    const pendingTasks = pendingItem
      ? (state.scenario === "normal" ? definition.stageGuidance?.[pendingItem.stage]?.tasks : null) ||
        buildOperationChecklist(project, definition, pendingItem, pendingNextStage, pendingAction, state.scenario)
      : [];
    const pendingFields = pendingItem
      ? buildOperationFields(project, definition, pendingItem, pendingNextStage, state.scenario)
      : [];
    const activeDocument = state.documents.find(document => document.id === activeDocumentId);
    const selectedDocuments = selected ? state.documents.filter(document => document.itemId === selected.id).slice(0, 3) : [];
    const roleOptions = getRoleOptions(project.category, definition, processBlueprint);
    const activeRole = roleOptions.find(role => role.value === state.role) || roleOptions[0];
    const isReadOnly = state.role === "auditor";
    const selectedStageRule = selected ? processBlueprint.stages[selected.stage] : null;
    const pendingStageRule = pendingItem ? processBlueprint.stages[pendingItem.stage] : null;
    const pendingNextStageRule = pendingNextStage === null ? null : processBlueprint.stages[pendingNextStage];
    const scenarioRule = state.scenario === "exception"
      ? {
          input:"異常證據、影響範圍、暫行措施與改善期限",
          condition:"異常原因與處理責任已確認，恢復條件可被追蹤",
          reject:"證據不足、影響未受控或沒有明確改善負責人",
          output:`${project.title}｜異常處理與改善追蹤紀錄`
        }
      : state.scenario === "approval"
        ? {
            input:"前階段成果、附件、風險說明與簽核依據",
            condition:"核准權限正確，決定理由與附帶條件均已記錄",
            reject:"資料不完整、超出授權額度或風險尚未釐清",
            output:`${project.title}｜主管簽核決定紀錄`
          }
        : {
            input:pendingStageRule?.inputs.join("、") || "",
            condition:pendingStageRule?.passCondition || "",
            reject:pendingStageRule?.rejectCondition || "",
            output:pendingNextStageRule?.output || processBlueprint.finalOutput
          };
    const requiresManager = Boolean(pendingStageRule?.requiresApproval);
    const cannotApprove = isReadOnly || (requiresManager && state.role !== "manager");
    const stageActionLabel = activeStage === null || activeStage === 0
      ? `＋ ${definition.createTitle}`
      : activeStage === definition.stages.length - 1
        ? `檢視${definition.stages[activeStage]}`
        : definition.actions[activeStage + 1] || `處理${definition.stages[activeStage]}`;
    const stageActionAttribute = activeStage === null || activeStage === 0
      ? "data-toggle-create"
      : activeStage === definition.stages.length - 1
        ? "data-stage-review"
        : "data-stage-primary";
    const stageActionDisabled = isReadOnly || (activeStage !== null && activeStage > 0 && visibleItems.length === 0);
    const compactItemName = item => {
      const raw = String(item?.name || "");
      const escapedTitle = String(project.title || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return raw.replace(new RegExp(`^${escapedTitle}\\s*[｜|·:：-]?\\s*`, "i"), "") || raw;
    };
    root.innerHTML = `
      <header class="jv-domain-head">
        <div><p>${escapeHtml(definition.eyebrow)}</p><h2>${escapeHtml(project.title)}｜客戶操作情境</h2><span>${escapeHtml(project.description || project.businessSituation || "")}</span></div>
        <div class="jv-domain-head-actions"><label>操作角色<select data-role-switch>${roleOptions.map(role=>`<option value="${role.value}" ${state.role===role.value?"selected":""}>${escapeHtml(role.label)}</option>`).join("")}</select></label><button class="jv-demo-btn primary" data-domain-guide data-jv-feedback="off">啟動情境導覽</button> <button class="jv-demo-btn" data-domain-reset>還原展示資料</button></div>
      </header>
      <section class="jv-scenario-bar"><div><b>Demo 情境包</b><span>${escapeHtml(activeRole.description)}</span></div><div><button class="${state.scenario==="normal"?"active":""}" data-scenario="normal">正常流程</button><button class="${state.scenario==="exception"?"active":""}" data-scenario="exception">異常處理</button><button class="${state.scenario==="approval"?"active":""}" data-scenario="approval">主管簽核</button></div></section>
      <p class="jv-domain-feedback" role="status" aria-live="polite">${escapeHtml(state.feedback || "")}</p>
      ${selected?.lastOperation ? `<section class="jv-domain-save-notice" role="status">
        <div><b>已儲存「${escapeHtml(compactItemName(selected))}」的處理結果</b><span>這筆${escapeHtml(definition.primary)}目前位於「${escapeHtml(definition.stages[selected.stage])}」，左側已選取；完整內容可在右側最新處理紀錄與流程文件查看。</span></div>
        <button class="jv-demo-btn" data-domain-focus-record>查看這筆資料</button>
      </section>` : ""}
      <div class="jv-domain-metrics">
        ${definition.metrics.map((metric,index)=>`<article><span>${escapeHtml(metric)}</span><strong>${index===0?state.items.length:index===1?attention:index===2?completed:`${Math.min(99,84+completed*3)}%`}</strong></article>`).join("")}
      </div>
      ${state.integrations.length?`<section class="jv-integration-feed"><b>跨模組連動</b><span>${escapeHtml(state.integrations[0].text)}</span><small>${escapeHtml(state.integrations[0].createdAt)}</small></section>`:""}
      <nav class="jv-domain-flow" aria-label="${escapeHtml(definition.primary)}處理流程">
        ${definition.stages.map((stage,index)=>`<button class="${activeStage===index?"active":""}" data-stage-filter="${index}" aria-pressed="${activeStage===index}"><b>${String(index+1).padStart(2,"0")}</b><span>${escapeHtml(stage)}</span><small>${state.items.filter(item=>item.stage===index).length} 筆</small></button>`).join("")}
      </nav>
      <div class="jv-domain-layout">
        <section class="jv-domain-board">
          <div class="jv-domain-section-title"><div><p>現場工作區</p><h3>${activeStage===null?escapeHtml(definition.primary)+"處理清單":escapeHtml(definition.stages[activeStage])+"清單"}</h3></div><div>${activeStage===null?"":'<button class="jv-demo-btn" data-clear-stage>顯示全部</button> '}<button class="jv-demo-btn primary" ${stageActionAttribute} ${stageActionDisabled?"disabled":""}>${escapeHtml(stageActionLabel)}</button></div></div>
          <form class="jv-domain-create" hidden ${activeStage !== null && activeStage > 0 ? 'aria-hidden="true"' : ""}>
            ${definition.fields.map((field,index)=>`<label>${escapeHtml(field[1])}<input name="${field[0]}" required minlength="${index===2?6:2}" placeholder="輸入${escapeHtml(field[1])}"></label>`).join("")}
            <button class="jv-demo-btn primary" type="submit">確認建立</button>
          </form>
          <div class="jv-domain-items">${visibleItems.length ? visibleItems.map(({item,index})=>`
            <article class="${index===state.selected?"selected":""} ${index===state.selected && item.lastOperation?"jv-just-updated":""}">
              <button class="jv-domain-item-main" data-domain-select="${index}">
                <span class="jv-domain-status">${escapeHtml(definition.stages[item.stage])}</span>
                <strong>${escapeHtml(compactItemName(item))}</strong>
                <small>${escapeHtml(item.request)}</small>
              </button>
              ${item.alert?`<span class="jv-item-alert">${escapeHtml(item.alert)}</span>`:""}
              <button class="jv-demo-btn primary" data-domain-advance="${index}" ${item.stage===definition.stages.length-1||isReadOnly?"disabled":""}>
                ${item.stage===definition.stages.length-1?"流程完成":escapeHtml(definition.actions[item.stage+1] || definition.actions[item.stage])}
              </button>
            </article>`).join("") : `<div class="jv-domain-empty"><b>${escapeHtml(definition.stages[activeStage])}目前沒有資料</b><p>可以建立新的${escapeHtml(definition.primary)}，或切換其他流程階段查看。</p><button class="jv-demo-btn" data-clear-stage>顯示全部資料</button></div>`}</div>
        </section>
        ${detailOpen ? '<button class="jv-domain-detail-backdrop" data-domain-detail-close aria-label="關閉明細"></button>' : ""}
        <aside class="jv-domain-detail ${detailOpen ? "is-open" : ""}" aria-hidden="${detailOpen ? "false" : "true"}">
          <div class="jv-domain-detail-heading"><p>目前選取</p><button class="jv-demo-btn" data-domain-detail-close>關閉明細</button></div>
          <h3>${selected ? escapeHtml(compactItemName(selected)) : `${activeStage === null ? "" : escapeHtml(definition.stages[activeStage])}尚無資料`}</h3>
          ${selected ? `<div class="jv-domain-detail-summary">
            <span><small>${escapeHtml(definition.fields[1][1])}</small><b>${escapeHtml(selected.contact)}</b></span>
            <span><small>目前階段</small><b>${escapeHtml(definition.stages[selected.stage])}</b></span>
            <span><small>下一步</small><b>${selected.stage===definition.stages.length-1?"流程已完成":escapeHtml(definition.actions[selected.stage+1] || definition.actions[selected.stage])}</b></span>
          </div>
          <section class="jv-domain-request-summary"><small>${escapeHtml(definition.fields[2][1])}</small><p>${escapeHtml(selected.request)}</p></section>
          <details class="jv-process-contract">
            <summary>查看本階段流程規則</summary>
            <dl>
              <dt>負責角色</dt><dd>${escapeHtml(selectedStageRule.owner)}</dd>
              <dt>必要輸入</dt><dd>${escapeHtml(selectedStageRule.inputs.join("、"))}</dd>
              <dt>簽核條件</dt><dd>${escapeHtml(selectedStageRule.requiresApproval ? `${selectedStageRule.approver}核准；${selectedStageRule.passCondition}` : "本階段不需主管簽核，完成必要檢核即可推進")}</dd>
              <dt>輸出結果</dt><dd>${escapeHtml(selectedStageRule.output)}</dd>
            </dl>
          </details>
          ${definition.stageGuidance?.[selected.stage] ? `<section class="jv-domain-stage-guidance">
            <h4>${escapeHtml(definition.stageGuidance[selected.stage].title)}</h4>
            <p class="jv-domain-guidance-label">本階段要完成</p>
            <ul>${definition.stageGuidance[selected.stage].tasks.map(task => `<li>${escapeHtml(task)}</li>`).join("")}</ul>
            <p class="jv-domain-guidance-output">${escapeHtml(definition.stageGuidance[selected.stage].evidence)}</p>
          </section>` : ""}
          ${selected.stage===definition.stages.length-1?`<div class="jv-domain-complete" role="status"><b>流程已完成</b><span>這筆${escapeHtml(definition.primary)}已留下完整處理紀錄，可用於客戶驗收說明。</span></div>`:""}
          <div class="jv-domain-detail-actions"><button class="jv-demo-btn" data-domain-edit>編輯明細</button><button class="jv-demo-btn" data-domain-note>新增處理紀錄</button></div>
          ${selected.lastOperation ? `<section class="jv-domain-latest-operation"><h4>最新處理紀錄</h4><dl><dt>完成動作</dt><dd>${escapeHtml(selected.lastOperation.action)}</dd>${Object.entries(selected.lastOperation.fields).map(([label,value])=>`<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd>`).join("")}<dt>處理說明</dt><dd>${escapeHtml(selected.lastOperation.note)}</dd></dl></section>` : ""}
          ${selectedDocuments.length ? `<section class="jv-domain-documents"><h4>流程產出文件</h4>${selectedDocuments.map(document=>`<button class="jv-domain-document" data-document-view="${document.id}"><span>${escapeHtml(document.name)}</span><small>${escapeHtml(document.createdAt)} · 點擊預覽</small></button>`).join("")}</section>` : ""}
          <form class="jv-domain-edit" hidden>
            <label>${escapeHtml(definition.fields[0][1])}<input name="name" required minlength="2" value="${escapeHtml(selected.name)}"></label>
            <label>${escapeHtml(definition.fields[1][1])}<input name="contact" required minlength="2" value="${escapeHtml(selected.contact)}"></label>
            <label>${escapeHtml(definition.fields[2][1])}<textarea name="request" required minlength="6">${escapeHtml(selected.request)}</textarea></label>
            <div><button class="jv-demo-btn" type="button" data-domain-edit-cancel>取消</button> <button class="jv-demo-btn primary" type="submit">儲存明細</button></div>
          </form>` : ""}
          <details class="jv-domain-log"><summary>查看操作軌跡（${state.logs.length}）</summary><div>${state.logs.map(item=>`<p>${escapeHtml(item)}</p>`).join("")}</div></details>
        </aside>
      </div>
      ${pendingItem ? `<div class="jv-operation-backdrop" data-operation-close>
        <section class="jv-operation-dialog" role="dialog" aria-modal="true" aria-labelledby="jv-operation-title">
          <header>
            <div><p>現場操作展示</p><h3 id="jv-operation-title">${escapeHtml(pendingAction)}</h3></div>
            <button class="jv-demo-btn" type="button" data-operation-cancel aria-label="關閉操作視窗">關閉</button>
          </header>
          <div class="jv-operation-context">
            <span>作業單</span><strong>${escapeHtml(pendingItem.name)}</strong>
            <span>目前階段</span><strong>${escapeHtml(definition.stages[pendingItem.stage])}</strong>
            <span>完成後</span><strong>${escapeHtml(definition.stages[pendingNextStage])}</strong>
            <span>本階段負責</span><strong>${escapeHtml(pendingStageRule.owner)}</strong>
          </div>
          <form class="jv-operation-form">
            <section class="jv-operation-governance">
              <div><span>必要輸入</span><strong>${escapeHtml(scenarioRule.input)}</strong></div>
              <div><span>${state.scenario === "approval" || pendingStageRule.requiresApproval ? "核准條件" : "推進條件"}</span><strong>${escapeHtml(scenarioRule.condition)}</strong></div>
              <div><span>退回條件</span><strong>${escapeHtml(scenarioRule.reject)}</strong></div>
              <div><span>完成後輸出</span><strong>${escapeHtml(scenarioRule.output)}</strong></div>
            </section>
            <fieldset><legend>執行前檢核</legend>
              ${pendingTasks.map((task,index)=>`<label><input type="checkbox" name="check-${index}" required> <span>${escapeHtml(task)}</span></label>`).join("")}
            </fieldset>
            <div class="jv-operation-fields">
              ${pendingFields.map(field=>`<label>${escapeHtml(field.label)}${field.type==="select"
                ? `<select name="${field.name}" required><option value="">請選擇</option>${field.options.map(option=>`<option>${escapeHtml(option)}</option>`).join("")}</select>`
                : `<input name="${field.name}" type="${field.type}" ${field.type==="number"?'min="0" step="any"':""} required>`}</label>`).join("")}
            </div>
            <label class="jv-operation-note">處理紀錄<textarea name="operationNote" required minlength="4" placeholder="輸入本次執行結果、數量、位置或異常說明"></textarea></label>
            <div class="jv-operation-result"><b>執行結果預覽</b><span>確認後，作業單將推進至「${escapeHtml(definition.stages[pendingNextStage])}」，並寫入操作軌跡。</span></div>
            ${cannotApprove?`<p class="jv-role-notice">此階段必須由「${escapeHtml(pendingStageRule.approver)}」核准；請切換對應角色後再推進。</p>`:""}
            <footer><button class="jv-demo-btn danger" type="button" data-operation-exception>模擬異常</button><button class="jv-demo-btn" type="button" data-operation-reject ${isReadOnly?"disabled":""}>退回補件</button><button class="jv-demo-btn" type="button" data-operation-draft ${isReadOnly?"disabled":""}>暫存</button><button class="jv-demo-btn primary" type="submit" ${cannotApprove?"disabled":""}>核准並推進</button></footer>
          </form>
        </section>
      </div>` : ""}
      ${activeDocument ? `<div class="jv-operation-backdrop" data-document-close><article class="jv-document-preview" role="dialog" aria-modal="true" aria-labelledby="jv-document-title"><header><div><p>流程結果文件</p><h3 id="jv-document-title">${escapeHtml(activeDocument.name)}</h3></div><button class="jv-demo-btn" data-document-close-button>關閉</button></header><dl><dt>文件編號</dt><dd>${escapeHtml(activeDocument.number)}</dd><dt>專案</dt><dd>${escapeHtml(project.title)}</dd><dt>作業單</dt><dd>${escapeHtml(activeDocument.itemName)}</dd><dt>處理動作</dt><dd>${escapeHtml(activeDocument.action)}</dd><dt>承辦角色</dt><dd>${escapeHtml(activeDocument.owner || processBlueprint.governance.operator)}</dd><dt>簽核角色</dt><dd>${escapeHtml(activeDocument.approver || "本階段免簽核")}</dd><dt>輸出結果</dt><dd>${escapeHtml(activeDocument.output || processBlueprint.finalOutput)}</dd><dt>產生時間</dt><dd>${escapeHtml(activeDocument.createdAt)}</dd>${Object.entries(activeDocument.fields).map(([label,value])=>`<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd>`).join("")}<dt>處理紀錄</dt><dd>${escapeHtml(activeDocument.note)}</dd><dt>跨模組連動</dt><dd>${escapeHtml(activeDocument.integration)}</dd></dl></article></div>` : ""}
      <aside class="jv-demo-guide jv-domain-guide" hidden>
        <b>情境導覽 1 / 4</b>
        <p>先建立一筆${escapeHtml(definition.primary)}，帶入客戶現場會使用的資料。</p>
        <div class="jv-demo-guide-actions"><button class="jv-demo-btn" data-domain-guide-close data-jv-feedback="off">結束</button><button class="jv-demo-btn primary" data-domain-guide-next data-jv-feedback="off">下一步</button></div>
      </aside>`;
    bind();
  };
  const bind = () => {
    root.querySelector("[data-role-switch]")?.addEventListener("change", event => {
      state.role = event.currentTarget.value;
      const role = getRoleOptions(project.category, definition, processBlueprint).find(option => option.value === state.role);
      state.feedback = `已切換為「${role?.label || state.role}」：${role?.description || ""}`;
      log(`切換操作角色：${role?.label || state.role}`);
      save(); render();
    });
    root.querySelectorAll("[data-scenario]").forEach(button => button.addEventListener("click", () => {
      const scenario = button.dataset.scenario;
      const role = state.role;
      state = initial();
      state.role = scenario === "approval" ? "manager" : role;
      state.scenario = scenario;
      if (scenario === "exception") {
        state.items.forEach((item,index) => {
          item.stage = Math.min(1 + (index % 2), definition.stages.length - 2);
          item.alert = getExceptionMessage(project.category);
        });
        state.feedback = `已載入「異常處理」情境：${getExceptionMessage(project.category)}。`;
        state.logs = [`已載入「${project.title}」異常處理情境`];
      } else if (scenario === "approval") {
        state.items.forEach(item => { item.stage = Math.min(2, definition.stages.length - 2); });
        state.feedback = "已載入「主管簽核」情境，角色已切換為主管／核准人。";
        state.logs = [`已載入「${project.title}」主管簽核情境`];
      } else {
        state.feedback = "已載入「正常流程」情境，可從建立資料開始展示。";
      }
      state.selected = 0;
      save(); render();
    }));
    root.querySelectorAll("[data-stage-filter]").forEach(button => button.addEventListener("click", () => {
      const stage = Number(button.dataset.stageFilter);
      state.filterStage = state.filterStage === stage ? null : stage;
      if (state.filterStage !== null) {
        const firstMatching = state.items.findIndex(item => item.stage === state.filterStage);
        if (firstMatching >= 0) state.selected = firstMatching;
      }
      save(); render();
    }));
    root.querySelectorAll("[data-clear-stage]").forEach(button => button.addEventListener("click", () => {
      state.filterStage = null;
      save(); render();
    }));
    root.querySelector("[data-toggle-create]")?.addEventListener("click", () => {
      const form = root.querySelector(".jv-domain-create");
      form.hidden = !form.hidden;
      if (!form.hidden) form.querySelector("input")?.focus();
    });
    root.querySelector(".jv-domain-create")?.addEventListener("submit", event => {
      event.preventDefault();
      if (!event.currentTarget.reportValidity()) return;
      const data = new FormData(event.currentTarget);
      const name = String(data.get("name") || "").trim();
      const contact = String(data.get("contact") || "").trim();
      const request = String(data.get("request") || "").trim();
      state.items.unshift({id: crypto.randomUUID(), name, contact, request, stage:0});
      state.selected = 0;
      state.filterStage = null;
      if (activeGuideStep === 0) activeGuideStep = 1;
      state.feedback = `已建立「${name}」，目前位於「${definition.stages[0]}」。`;
      log(`建立${definition.primary}：${name}`);
      save(); render();
    });
    root.querySelector("[data-stage-primary]")?.addEventListener("click", () => {
      const stage = Number(state.filterStage);
      const index = state.items.findIndex((item, itemIndex) =>
        item.stage === stage && (itemIndex === state.selected || !state.items[state.selected] || state.items[state.selected].stage !== stage)
      );
      const fallbackIndex = state.items.findIndex(item => item.stage === stage);
      const targetIndex = index >= 0 ? index : fallbackIndex;
      const item = state.items[targetIndex];
      if (!item || item.stage >= definition.stages.length - 1) return;
      pendingOperationIndex = targetIndex;
      state.selected = targetIndex;
      render();
    });
    root.querySelector("[data-stage-review]")?.addEventListener("click", () => {
      const index = state.items.findIndex(item => item.stage === state.filterStage);
      if (index < 0) return;
      state.selected = index;
      state.feedback = `已開啟「${state.items[index].name}」的完成紀錄。`;
      log(`${state.items[index].name}｜已檢視${definition.stages[state.filterStage]}紀錄`);
      save(); render();
    });
    root.querySelectorAll("[data-domain-select]").forEach(button => button.addEventListener("click", () => {
      state.selected = Number(button.dataset.domainSelect);
      detailOpen = true;
      if (activeGuideStep === 1) activeGuideStep = 2;
      render();
    }));
    root.querySelectorAll("[data-domain-advance]").forEach(button => button.addEventListener("click", () => {
      const index = Number(button.dataset.domainAdvance);
      const item = state.items[index];
      if (!item || item.stage >= definition.stages.length - 1) return;
      pendingOperationIndex = index;
      state.selected = index;
      render();
    }));
    root.querySelector("[data-domain-focus-record]")?.addEventListener("click", () => {
      detailOpen = true;
      render();
    });
    root.querySelectorAll("[data-domain-detail-close]").forEach(button => button.addEventListener("click", () => {
      detailOpen = false;
      render();
    }));
    root.querySelectorAll("[data-operation-cancel]").forEach(button => button.addEventListener("click", () => {
      pendingOperationIndex = null;
      render();
    }));
    root.querySelector("[data-operation-close]")?.addEventListener("click", event => {
      if (event.target !== event.currentTarget) return;
      pendingOperationIndex = null;
      render();
    });
    root.querySelector("[data-operation-draft]")?.addEventListener("click", () => {
      const form = root.querySelector(".jv-operation-form");
      const item = state.items[pendingOperationIndex];
      if (!form || !item) return;
      const data = new FormData(form);
      const nextStage = Math.min(item.stage + 1, definition.stages.length - 1);
      const action = definition.actions[nextStage] || definition.actions[item.stage] || `執行${definition.stages[nextStage]}`;
      const fields = buildOperationFields(project, definition, item, nextStage, state.scenario);
      item.operationDraft = Object.fromEntries(fields.map(field => [field.label, String(data.get(field.name) || "")]));
      item.operationDraft["處理紀錄"] = String(data.get("operationNote") || "");
      state.feedback = `「${item.name}」的「${action}」內容已暫存，流程階段未變更。`;
      log(`${item.name}｜暫存${action}`);
      pendingOperationIndex = null;
      save(); render();
    });
    root.querySelector("[data-operation-reject]")?.addEventListener("click", () => {
      const item = state.items[pendingOperationIndex];
      if (!item) return;
      const fromStage = definition.stages[item.stage];
      item.stage = Math.max(0, item.stage - 1);
      state.feedback = `「${item.name}」已從「${fromStage}」退回「${definition.stages[item.stage]}」補件。`;
      log(`${item.name}｜退回補件：${fromStage} → ${definition.stages[item.stage]}`);
      pendingOperationIndex = null;
      save(); render();
    });
    root.querySelector("[data-operation-exception]")?.addEventListener("click", () => {
      const item = state.items[pendingOperationIndex];
      if (!item) return;
      item.alert = getExceptionMessage(project.category);
      state.feedback = `「${item.name}」發現異常：${item.alert}`;
      log(`${item.name}｜異常攔截：${item.alert}`);
      pendingOperationIndex = null;
      save(); render();
    });
    root.querySelector(".jv-operation-form")?.addEventListener("submit", event => {
      event.preventDefault();
      if (!event.currentTarget.reportValidity()) return;
      const index = pendingOperationIndex;
      const item = state.items[index];
      if (!item || item.stage >= definition.stages.length - 1) return;
      const data = new FormData(event.currentTarget);
      const note = String(data.get("operationNote") || "").trim();
      const nextStage = Math.min(item.stage + 1, definition.stages.length - 1);
      const fields = buildOperationFields(project, definition, item, nextStage, state.scenario);
      const operationFields = Object.fromEntries(fields.map(field => [field.label, String(data.get(field.name) || "").trim()]));
      const completedAction = definition.actions[nextStage] || definition.actions[item.stage] || `執行${definition.stages[nextStage]}`;
      const integration = getIntegrationEffect(project.category);
      const operationRule = processBlueprint.stages[item.stage];
      const outputRule = processBlueprint.stages[nextStage];
      item.stage += 1;
      item.alert = "";
      item.lastOperation = { action: completedAction, fields: operationFields, note };
      state.selected = index;
      pendingOperationIndex = null;
      if (activeGuideStep === 2) activeGuideStep = 3;
      const document = {
        id: crypto.randomUUID(),
        itemId: item.id,
        itemName: item.name,
        name: getDocumentName(project.category, completedAction),
        number: `${slug.toUpperCase().replace(/[^A-Z0-9]/g,"").slice(-10)}-${Date.now().toString().slice(-6)}`,
        action: completedAction,
        owner: operationRule.owner,
        approver: operationRule.requiresApproval ? operationRule.approver : "",
        output: outputRule.output,
        fields: operationFields,
        note,
        integration,
        createdAt: new Date().toLocaleString("zh-TW",{hour12:false})
      };
      state.documents.unshift(document);
      state.documents = state.documents.slice(0, 20);
      state.integrations.unshift({ itemId:item.id, text:integration, createdAt:document.createdAt });
      state.integrations = state.integrations.slice(0, 20);
      activeDocumentId = document.id;
      state.feedback = item.stage === definition.stages.length - 1
        ? `「${item.name}」已完成全部流程；${integration}。`
        : `「${item.name}」已推進至「${definition.stages[item.stage]}」；${integration}。`;
      log(`${item.name}｜${completedAction}｜${integration}`);
      save(); render();
    });
    root.querySelectorAll("[data-document-view]").forEach(button => button.addEventListener("click", () => {
      activeDocumentId = button.dataset.documentView;
      render();
    }));
    root.querySelectorAll("[data-document-close-button]").forEach(button => button.addEventListener("click", () => {
      activeDocumentId = null;
      render();
    }));
    root.querySelector("[data-document-close]")?.addEventListener("click", event => {
      if (event.target !== event.currentTarget) return;
      activeDocumentId = null;
      render();
    });
    root.querySelector("[data-domain-edit]")?.addEventListener("click", () => {
      const form = root.querySelector(".jv-domain-edit");
      form.hidden = false;
      form.querySelector("input")?.focus();
    });
    root.querySelector("[data-domain-edit-cancel]")?.addEventListener("click", () => {
      root.querySelector(".jv-domain-edit").hidden = true;
    });
    root.querySelector(".jv-domain-edit")?.addEventListener("submit", event => {
      event.preventDefault();
      if (!event.currentTarget.reportValidity()) return;
      const item = state.items[state.selected];
      if (!item) return;
      const data = new FormData(event.currentTarget);
      item.name = String(data.get("name") || "").trim();
      item.contact = String(data.get("contact") || "").trim();
      item.request = String(data.get("request") || "").trim();
      state.feedback = `「${item.name}」的明細已更新。`;
      log(`${item.name}｜更新明細資料`);
      save(); render();
    });
    root.querySelector("[data-domain-note]")?.addEventListener("click", () => {
      const item = state.items[state.selected];
      state.feedback = `已替「${item.name}」新增一筆${definition.stages[item.stage]}處理紀錄。`;
      log(`${item.name}｜已補充「${definition.stages[item.stage]}」處理紀錄`);
      save(); render();
    });
    root.querySelector("[data-domain-reset]").addEventListener("click", () => {
      state = initial();
      state.feedback = "展示資料已還原，可以重新操作完整流程。";
      save(); render();
    });
    const guide = root.querySelector(".jv-domain-guide");
    const guideSteps = [
      { text:`請在下方三個欄位輸入「${definition.fields.map(field=>field[1]).join("、")}」，再按「確認建立」。`, selector:".jv-domain-create", hint:`步驟 1｜填寫資料後按「確認建立」` },
      { text:`從${definition.stages[0]}開始，點選資料確認負責角色、需求與下一步。`, selector:"[data-domain-select]", hint:"步驟 2｜點這筆資料查看明細" },
      { text:`執行「${definition.actions[1] || definition.actions[0]}」，觀察案件推進到下一階段。`, selector:"[data-domain-advance]:not(:disabled)", hint:"步驟 3｜點這裡推進流程" },
      { text:`最後查看指標與操作軌跡，說明「${project.title}」如何留下管理依據。`, selector:".jv-domain-metrics", hint:"步驟 4｜確認指標與紀錄更新" }
    ];
    let guideIndex = Math.max(0, activeGuideStep);
    const clearGuideFocus = () => {
      root.querySelector(".jv-guide-focus")?.classList.remove("jv-guide-focus");
      root.querySelector("[data-guide-hint]")?.removeAttribute("data-guide-hint");
      root.querySelector(".jv-guide-overlay")?.remove();
    };
    const focusGuideStep = () => {
      clearGuideFocus();
      const step = guideSteps[guideIndex];
      if (guideIndex === 0) {
        const createForm = root.querySelector(".jv-domain-create");
        if (createForm) {
          createForm.hidden = false;
          createForm.removeAttribute("aria-hidden");
        }
      }
      const overlay = document.createElement("div");
      overlay.className = "jv-guide-overlay";
      root.append(overlay);
      const target = root.querySelector(step.selector);
      if (target) {
        target.classList.add("jv-guide-focus");
        target.dataset.guideHint = step.hint;
        target.scrollIntoView({ behavior:"smooth", block:"center" });
        if (guideIndex === 0) setTimeout(() => target.querySelector("input")?.focus(), 260);
      }
      guide.querySelector("b").textContent = `情境導覽 ${guideIndex + 1} / ${guideSteps.length}`;
      guide.querySelector("p").textContent = step.text;
      const next = guide.querySelector("[data-domain-guide-next]");
      next.disabled = guideIndex < guideSteps.length - 1;
      next.textContent = guideIndex === guideSteps.length - 1 ? "完成" : "請完成畫面操作";
    };
    root.querySelector("[data-domain-guide]").addEventListener("click", () => {
      if (state.filterStage !== null && state.filterStage !== undefined) {
        state.filterStage = null; save(); render();
        setTimeout(() => root.querySelector("[data-domain-guide]")?.click(), 0);
        return;
      }
      activeGuideStep = 0; guideIndex = 0; guide.hidden = false; focusGuideStep();
    });
    root.querySelector("[data-domain-guide-close]").addEventListener("click", () => { activeGuideStep = -1; guide.hidden = true; clearGuideFocus(); });
    root.querySelector("[data-domain-guide-next]").addEventListener("click", event => {
      if (guideIndex < guideSteps.length - 1) return;
      activeGuideStep = -1; guide.hidden = true; clearGuideFocus();
    });
    if (activeGuideStep >= 0) setTimeout(() => { guideIndex = activeGuideStep; guide.hidden = false; focusGuideStep(); }, 0);
  };
  render();
  if (new URLSearchParams(location.search).get("mode") === "guided") {
    const launchGuide = (attempt = 0) => {
      const button = root.querySelector("[data-domain-guide]");
      if (button) button.click();
      else if (attempt < 12) setTimeout(() => launchGuide(attempt + 1), 250);
    };
    setTimeout(launchGuide, 180);
  }
}
