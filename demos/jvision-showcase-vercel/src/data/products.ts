export type Product = { id: number; name: string; module: string; description: string; demoUrl: string; githubUrl: string; posterUrl?: string; category: string; slug: string; visible?: boolean; };

type CatalogProduct = Omit<Product, "githubUrl">;

const catalog: CatalogProduct[] = [
  {
    "id": 2,
    "name": "生產工單",
    "module": "Production Order",
    "description": "生產工單下達、排產派工、進度追蹤與 AI 摘要 Demo",
    "demoUrl": "https://jvision-production-order.vercel.app",
    "category": "????????",
    "slug": "demo-02"
  },
  {
    "id": 6,
    "name": "客戶關係管理",
    "module": "客戶資料與銷售跟進",
    "description": "客戶資料、銷售流程、互動紀錄與商機追蹤管理",
    "demoUrl": "https://jvision-crm.vercel.app",
    "category": "????",
    "slug": "demo-06"
  },
  {
    "id": 9,
    "name": "營建工程",
    "module": "Construction",
    "description": "日報、品質安衛、材料成本、審批與工程績效管理",
    "demoUrl": "https://jvision-construction.vercel.app",
    "category": "????????",
    "slug": "demo-09"
  },
  {
    "id": 11,
    "name": "企業財務記帳",
    "module": "Business Books",
    "description": "銀行明細匯入、自動分類、應收付、代墊款、專案損益與三大財報",
    "demoUrl": "https://jvision-bizbooks.vercel.app",
    "category": "??????",
    "slug": "demo-11"
  },
  {
    "id": 12,
    "name": "出勤差勤管理",
    "module": "Attendance",
    "description": "雲端打卡、外勤回報、異常判斷、請假簽核與工時計算",
    "demoUrl": "https://jvision-attendance.vercel.app",
    "category": "????",
    "slug": "demo-12"
  },
  {
    "id": 13,
    "name": "課程工具平台",
    "module": "課程工具管理",
    "description": "課程工具、學習流程與內容營運管理 Demo",
    "demoUrl": "https://jvision-course-tools.vercel.app",
    "category": "????",
    "slug": "demo-13"
  },
  {
    "id": 14,
    "name": "法律案件管理",
    "module": "LegalOps",
    "description": "案件主檔、庭期提醒、待辦回報、工時紀錄與請款管理",
    "demoUrl": "https://jvision-legalops.vercel.app",
    "category": "????",
    "slug": "demo-14"
  },
  {
    "id": 15,
    "name": "汽車雲端管理",
    "module": "Car Cloud",
    "description": "車輛資料、服務流程與營運管理雲端 Demo",
    "demoUrl": "https://jvision-car-cloud.vercel.app",
    "category": "????",
    "slug": "demo-15"
  },
  {
    "id": 16,
    "name": "個人財務管理",
    "module": "Personal Finance",
    "description": "帳戶資產、交易記帳、自動分類、預算控管、帳單提醒與儲蓄目標",
    "demoUrl": "https://jvision-personal-finance.vercel.app",
    "category": "??????",
    "slug": "demo-16"
  },
  {
    "id": 17,
    "name": "物流派車管理",
    "module": "配送調度與簽收管理",
    "description": "配送訂單、派車調度、貨態更新、電子簽收、異常回報與運費結算",
    "demoUrl": "https://jvision-tms.vercel.app",
    "category": "????",
    "slug": "demo-17"
  },
  {
    "id": 18,
    "name": "營建工程管理",
    "module": "工程進度與成本管理",
    "description": "工程案、採購用料、工班出勤、報價合約、成本與請款管理",
    "demoUrl": "https://jvision-construction-erp.vercel.app",
    "category": "????",
    "slug": "demo-18"
  },
  {
    "id": 19,
    "name": "旅宿營運管理",
    "module": "旅宿房況與訂房管理",
    "description": "房況、官網訂房、訂房平台同步、加購服務與結算管理",
    "demoUrl": "https://jvision-hospitality.vercel.app",
    "category": "????",
    "slug": "demo-19"
  },
  {
    "id": 20,
    "name": "房產租賃代管",
    "module": "Property Management",
    "description": "房源、租約、維修、收租、房東報表與代管績效管理",
    "demoUrl": "https://jvision-property-management.vercel.app",
    "category": "????",
    "slug": "demo-20"
  },
  {
    "id": 21,
    "name": "線上課程平台",
    "module": "線上課程管理",
    "description": "課程上架、學員管理、銷售、學習進度與營運分析",
    "demoUrl": "https://jvision-course-platform.vercel.app",
    "category": "????",
    "slug": "demo-21"
  },
  {
    "id": 22,
    "name": "智慧照護管理",
    "module": "eCare",
    "description": "長者照護、班表、量測紀錄、異常提醒與家屬溝通管理",
    "demoUrl": "https://jvision-ecare.vercel.app",
    "category": "????",
    "slug": "demo-22"
  },
  {
    "id": 23,
    "name": "智慧診所管理",
    "module": "Clinic Management",
    "description": "掛號、看診、病歷、收費、庫存與診所營運管理",
    "demoUrl": "https://jvision-clinic.vercel.app",
    "category": "????",
    "slug": "demo-23"
  },
  {
    "id": 24,
    "name": "網店設計開店",
    "module": "Store Design",
    "description": "版型設計、商品區塊、行銷活動、金物流與商店預覽",
    "demoUrl": "https://jvision-store-design.vercel.app",
    "category": "??????",
    "slug": "demo-24"
  },
  {
    "id": 25,
    "name": "智慧門市 POS",
    "module": "門市收銀與會員管理",
    "description": "門市收銀、會員、庫存、線上線下 訂單與營運分析",
    "demoUrl": "https://jvision-smart-pos.vercel.app",
    "category": "??????",
    "slug": "demo-25"
  },
  {
    "id": 26,
    "name": "餐飲 POS 科技",
    "module": "Restaurant POS",
    "description": "桌位點餐、結帳、廚房出單、庫存與餐飲營運分析",
    "demoUrl": "https://jvision-pos.vercel.app",
    "category": "??????",
    "slug": "demo-26"
  },
  {
    "id": 27,
    "name": "工作管理平台",
    "module": "工作協作管理",
    "description": "整合任務、專案檢視、AI 摘要、目標報告、自動化規則與工作負荷管理的協作平台",
    "demoUrl": "https://jvision-work-management.vercel.app",
    "category": "????",
    "slug": "demo-27"
  },
  {
    "id": 28,
    "name": "AI 工作區",
    "module": "AI Workspace",
    "description": "文件、知識庫、專案任務、會議筆記、AI 代理人與自動化流程",
    "demoUrl": "https://jvision-ai-workspace.vercel.app",
    "category": "????",
    "slug": "demo-28"
  },
  {
    "id": 29,
    "name": "企業協同辦公平台",
    "module": "Office Automation / OA",
    "description": "整合流程簽核、內容門戶、資料中心、服務管理、行動辦公與 AI 摘要的企業協同辦公平台",
    "demoUrl": "https://jvision-office-automation.vercel.app",
    "category": "????",
    "slug": "demo-29"
  },
  {
    "id": 30,
    "name": "BI 分析平台",
    "module": "BI Analytics",
    "description": "資料連接、語意模型、AI 洞察、互動報表、分享發布與治理安全",
    "demoUrl": "https://jvision-bi-analytics.vercel.app",
    "category": "????",
    "slug": "demo-30"
  },
  {
    "id": 31,
    "name": "組織溫室氣體盤查平台",
    "module": "Carbon Inventory / GHG Management",
    "description": "整合組織邊界、活動數據、排放係數、Scope 1/2/3 計算、排放清冊、熱點分析與 AI 查核摘要的企業碳管理平台",
    "demoUrl": "https://jvision-carbon-inventory.vercel.app",
    "category": "????????",
    "slug": "demo-31"
  },
  {
    "id": 32,
    "name": "能源管理系統",
    "module": "EMS",
    "description": "智慧電表、用電監控、需量告警、節能策略、碳排計算與能源報表",
    "demoUrl": "https://jvision-ems.vercel.app",
    "category": "????????",
    "slug": "demo-32"
  },
  {
    "id": 33,
    "name": "採購供應商協作平台",
    "module": "SRM / Supplier Relationship Management",
    "description": "整合供應商入口、採購案件、詢報價競標、訂單交期、履約驗收、風險排序與 AI 採購摘要的供應商協作平台",
    "demoUrl": "https://jvision-srm.vercel.app",
    "category": "????????",
    "slug": "demo-33"
  },
  {
    "id": 34,
    "name": "供應商品質管理",
    "module": "SQM / Supplier Quality Management",
    "description": "供應商建檔、採購收料、IQC 進料檢驗、文件補件、綠色產品資料、評鑑稽核與改善追蹤",
    "demoUrl": "https://jvision-sqm.vercel.app",
    "category": "????????",
    "slug": "demo-34"
  },
  {
    "id": 35,
    "name": "牙科診所智能助理",
    "module": "Dental Clinic Assistant",
    "description": "整合線上預約、患者 CRM、約診提醒、術後關懷、定檢通知、爽約風險與 AI 診所摘要的牙科診所工作台",
    "demoUrl": "https://jvision-dental-assistant.vercel.app",
    "category": "????",
    "slug": "demo-35"
  },
  {
    "id": 36,
    "name": "寵物服務預約",
    "module": "Pet Service Booking",
    "description": "寵物旅館、安親、美容、課程預約、商品加購、入住排房、照護紀錄與家長通知",
    "demoUrl": "https://jvision-pet-booking.vercel.app",
    "category": "????",
    "slug": "demo-36"
  },
  {
    "id": 37,
    "name": "教育照護管理",
    "module": "Education Care Management",
    "description": "招生 CRM、學務排課、出勤接送、收費財務、電子聯絡簿、人事薪資與幼教照護管理",
    "demoUrl": "https://jvision-education-care.vercel.app",
    "category": "????",
    "slug": "demo-37"
  },
  {
    "id": 38,
    "name": "藥局健保調劑申報系統",
    "module": "Pharmacy Claim / NHI Dispensing",
    "description": "整合處方調劑、健保藥價更新、申報錯誤檢核、藥袋與收據列印、部分負擔試算、歷史申報查詢與 AI 申報摘要的藥局工作台",
    "demoUrl": "https://jvision-pharmacy-claim.vercel.app",
    "category": "????",
    "slug": "demo-38"
  },
  {
    "id": 39,
    "name": "人力派遣管理",
    "module": "Workforce Dispatch Management",
    "description": "派遣員工建檔、客戶案場、派工出勤、工時登錄、薪資結算、薪資清冊與請款報表",
    "demoUrl": "https://jvision-staff-dispatch.vercel.app",
    "category": "????",
    "slug": "demo-39"
  },
  {
    "id": 40,
    "name": "眼鏡門市預約會員經營平台",
    "module": "Optical Store CRM / Booking",
    "description": "整合 24H 預約、會員 CRM、驗光處方、配鏡回訪、LINE 推播、好評邀請、隱形眼鏡商城與 AI 門市摘要的眼鏡行經營工作台",
    "demoUrl": "https://jvision-optical-saas.vercel.app",
    "category": "????",
    "slug": "demo-40"
  },
  {
    "id": 41,
    "name": "機車行管理",
    "module": "Motorcycle Shop Management",
    "description": "客戶車籍、維修保養單、廠牌車型、零件庫存、安全存量、付款沖銷、日月報表與毛利分析",
    "demoUrl": "https://jvision-motorcycle-shop.vercel.app",
    "category": "????",
    "slug": "demo-41"
  },
  {
    "id": 42,
    "name": "估價與工程管理",
    "module": "Estimate + PMIS Engineering Management",
    "description": "工程估價、報價簽核、轉專案、進度管理、品質安全、圖說送審、工程財務與估驗請款",
    "demoUrl": "https://jvision-estimate-pmis.vercel.app",
    "category": "????",
    "slug": "demo-42"
  },
  {
    "id": 43,
    "name": "洗衣門市管理",
    "module": "Laundry Store Management",
    "description": "客戶資料、送洗衣服登入、當日收件查核、衣物入庫、客戶取件、付款、每日支出與日月報表",
    "demoUrl": "https://jvision-laundry-pos.vercel.app",
    "category": "??????",
    "slug": "demo-43"
  },
  {
    "id": 44,
    "name": "智慧停車場管理",
    "module": "Intelligent Parking System",
    "description": "AI 尋車、空車位偵測、車位導引、一位多車、車牌辨識、EV 地鎖、VIP 訪客車位與安全事件監控",
    "demoUrl": "https://jvision-smart-parking.vercel.app",
    "category": "??????",
    "slug": "demo-44"
  },
  {
    "id": 45,
    "name": "烘焙 POS 與前店後廠管理",
    "module": "Bakery POS / Front Store Factory",
    "description": "門市 POS、禮盒預購、自由組合、前店後廠、生產入庫、報廢扣料、會員行銷與總部報表",
    "demoUrl": "https://jvision-bakery-pos.vercel.app",
    "category": "??????",
    "slug": "demo-45"
  },
  {
    "id": 46,
    "name": "印刷業解決方案",
    "module": "Printing ERP / Production Costing",
    "description": "快速估價、圖檔版模、排版整合、合版排程、託外加工、WIP、領料入庫、實際成本與出貨管理",
    "demoUrl": "https://jvision-printing-erp.vercel.app",
    "category": "????????",
    "slug": "demo-46"
  },
  {
    "id": 47,
    "name": "貿易 ERP 管理",
    "module": "Trading ERP / Import Export",
    "description": "客戶產品、報價訂單、採購、分批出貨、裝箱單、商業發票、出貨嘜頭、應收應付與利潤分析",
    "demoUrl": "https://jvision-trading-erp.vercel.app",
    "category": "????????",
    "slug": "demo-47"
  },
  {
    "id": 48,
    "name": "智慧庫存與倉儲管理",
    "module": "Inventory Management",
    "description": "補貨建議、條碼入出庫、即時庫存、揀貨波次與 AI 庫存摘要 Demo",
    "demoUrl": "https://jvision-inventory.vercel.app",
    "category": "????????",
    "slug": "demo-48"
  },
  {
    "id": 49,
    "name": "智慧設備維護與預防保養",
    "module": "Maintenance Management",
    "description": "設備履歷、維修請求、預防保養、MTBF/MTTR 與 AI 維護摘要 Demo",
    "demoUrl": "https://jvision-maintenance.vercel.app",
    "category": "????????",
    "slug": "demo-49"
  },
  {
    "id": 51,
    "name": "美業預約營運平台",
    "module": "Beauty Booking / Client Experience",
    "description": "自助預約、智慧排班、客戶檔案、POS 結帳、會員方案、表單紀錄、訊息行銷與多店報表",
    "demoUrl": "https://jvision-self-care-platform.vercel.app",
    "category": "服務與生活",
    "slug": "demo-51"
  },
  {
    "id": 52,
    "name": "活動會展與婚禮場地管理",
    "module": "Event / Wedding Venue Management",
    "description": "詢價檔期、報價合約、訂金付款、賓客桌次、籌備任務與 AI 活動摘要",
    "demoUrl": "https://jvision-event-wedding.vercel.app",
    "category": "服務與生活",
    "slug": "demo-52"
  },
  {
    "id": 53,
    "name": "客服支援平台",
    "module": "Customer Support / Help Desk",
    "description": "共享收件箱、AI 回覆、知識庫、工作流程、客戶檔案與客服報表",
    "demoUrl": "https://jvision-customer-support-platform.vercel.app",
    "category": "企業營運",
    "slug": "demo-53"
  },
  {
    "id": 54,
    "name": "人資薪酬招募管理",
    "module": "HRIS / Payroll / Recruiting",
    "description": "員工資料、招募流程、薪資試算、請假簽核、績效追蹤與 AI 人資摘要",
    "demoUrl": "https://jvision-hris.vercel.app",
    "category": "企業營運",
    "slug": "demo-54"
  },
  {
    "id": 55,
    "name": "工作與專案管理平台",
    "module": "Work & Project Management",
    "description": "專案排程、任務看板、工作負荷、目標追蹤、自動化規則與 AI 摘要",
    "demoUrl": "https://jvision-work-project-suite.vercel.app",
    "category": "協作與管理",
    "slug": "demo-55"
  },
  {
    "id": 56,
    "name": "設備維護整合平台",
    "module": "Equipment Maintenance",
    "description": "設備報修、巡檢保養、備品、設備履歷、預防保養與維護指標整合",
    "demoUrl": "https://jvision-equipment-maintenance-suite.vercel.app",
    "category": "製造與工程",
    "slug": "demo-56"
  },
  {
    "id": 57,
    "name": "營建工程整合平台",
    "module": "Construction Management / Estimate PMIS",
    "description": "工程估價、專案管理、工地日報、品質安衛、材料成本與估驗請款",
    "demoUrl": "https://jvision-construction-management-sui.vercel.app",
    "category": "製造與工程",
    "slug": "demo-57"
  },
  {
    "id": 58,
    "name": "課程學習整合平台",
    "module": "Course Learning / Course Tools",
    "description": "課程上架、課表預約、購課銷售、影音單元、作業回饋與學員進度",
    "demoUrl": "https://jvision-course-learning-suite.vercel.app",
    "category": "教育與照護",
    "slug": "demo-58"
  },
  {
    "id": 59,
    "name": "ESG 能源與碳管理平台",
    "module": "ESG Energy & Carbon Management",
    "description": "能源監控、溫室氣體盤查、Scope 1/2/3、減碳任務與 AI 摘要",
    "demoUrl": "https://jvision-esg-energy-carbon.vercel.app",
    "category": "ESG 與永續",
    "slug": "demo-59"
  },
  {
    "id": 60,
    "name": "室內設計專案管理",
    "module": "Interior Design Project Management",
    "description": "提案、選品板、商品資料庫、採購追蹤、客戶儀表板與 AI 摘要",
    "demoUrl": "https://jvision-interior-design-studio.vercel.app",
    "category": "專業服務",
    "slug": "demo-60"
  },
  {
    "id": 61,
    "name": "服裝系列開發 PLM",
    "module": "Fashion PLM",
    "description": "系列企劃、款式監控、BOM 物料、雲端檔案、動態報表與 AI 摘要",
    "demoUrl": "https://jvision-fashion-plm.vercel.app",
    "category": "製造與工程",
    "slug": "demo-61"
  },
  {
    "id": 62,
    "name": "招牌店務與工單管理",
    "module": "Sign Shop Management",
    "description": "線索跟進、報價模板、製作工單、安裝排程、檔案管理與 AI 店務摘要",
    "demoUrl": "https://jvision-sign-shop-management.vercel.app",
    "category": "製造與工程",
    "slug": "demo-62"
  },
  {
    "id": 63,
    "name": "拖吊派遣與車隊管理",
    "module": "Towing Dispatch",
    "description": "拖吊接單、道路救援派遣、司機任務、車隊狀態、扣車與帳務收款",
    "demoUrl": "https://jvision-towing-dispatch.vercel.app",
    "category": "交通與車輛",
    "slug": "demo-63"
  },
  {
    "id": 64,
    "name": "汽車玻璃維修與請款管理",
    "module": "Auto Glass Operations",
    "description": "預約、技師派工、玻璃訂購、客戶簽名、保險請款與收款追蹤",
    "demoUrl": "https://jvision-auto-glass-ops.vercel.app",
    "category": "交通與車輛",
    "slug": "demo-64"
  },
  {
    "id": 65,
    "name": "理賠案件管理平台",
    "module": "Claims Management",
    "description": "案件受理、保單審核、文件補件、任務協作、核賠付款與 AI 摘要",
    "demoUrl": "https://jvision-claims-management.vercel.app",
    "category": "金融與保險",
    "slug": "demo-65"
  }
];

function classify(product: CatalogProduct) {
  const text = `${product.name} ${product.module}`;
  if (/碳|能源|ESG|環安衛|EHS/.test(text)) return "ESG 與永續";
  if (/診所|牙科|藥局|照護|教育|課程|學習/.test(text)) return "教育與照護";
  if (/車|停車|物流|派車|拖吊|玻璃/.test(text)) return "交通與車輛";
  if (/POS|門市|網店|烘焙|洗衣|寵物|美業|婚禮|旅宿|活動/.test(text)) return "零售與服務";
  if (/財務|記帳|理賠|保險/.test(text)) return "金融與保險";
  if (/工程|營建|設備|維護|庫存|生產|工單|供應商|採購|印刷|貿易|PLM|招牌/.test(text)) return "製造與工程";
  if (/人資|出勤|CRM|客服|法律|房產/.test(text)) return "企業營運";
  return "協作與管理";
}

const repositoryOverrides: Record<string, string> = {
  "jvision-construction-management-sui.vercel.app": "jvision-construction-management-suite",
};

function getGithubUrl(product: CatalogProduct) {
  const hostname = product.demoUrl.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  const repository = repositoryOverrides[hostname] ?? hostname.replace(/\.vercel\.app$/, "");
  return `https://github.com/yunghua817/${repository}`;
}

export const products = catalog.map((product) => ({
  ...product,
  category: classify(product),
  githubUrl: getGithubUrl(product),
}));
export const categories = Array.from(new Set(products.map((product) => product.category)));
