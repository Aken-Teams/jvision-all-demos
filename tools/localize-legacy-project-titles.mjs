import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const indexPath = path.join(root, "projects-index.json");
const catalog = JSON.parse(fs.readFileSync(indexPath, "utf8"));
const names = {
  "jvision-production-order": "生產工單管理",
  "jvision-crm": "客戶關係管理 CRM",
  "jvision-construction": "營建專案管理",
  "jvision-bizbooks": "企業財務記帳",
  "jvision-attendance": "出勤差勤管理",
  "jvision-course-tools": "課程教學工具",
  "jvision-legalops": "法務案件管理",
  "jvision-car-cloud": "車聯網營運平台",
  "jvision-personal-finance": "個人財務管理",
  "jvision-tms": "運輸管理 TMS",
  "jvision-construction-erp": "營建工程 ERP",
  "jvision-hospitality": "旅宿營運管理",
  "jvision-property-management": "物業管理",
  "jvision-course-platform": "線上課程平台",
  "jvision-ecare": "照護服務管理",
  "jvision-clinic": "診所營運管理",
  "jvision-store-design": "門市空間設計管理",
  "jvision-smart-pos": "智慧門市 POS",
  "jvision-pos": "門市銷售 POS",
  "jvision-work-management": "工作協作管理",
  "jvision-ai-workspace": "AI 協作工作台",
  "jvision-office-automation": "辦公流程自動化",
  "jvision-bi-analytics": "商業智慧分析 BI",
  "jvision-carbon-inventory": "組織碳盤查",
  "jvision-ems": "能源管理 EMS",
  "jvision-srm": "供應商關係管理 SRM",
  "jvision-sqm": "供應商品質管理 SQM",
  "jvision-dental-assistant": "牙科診療助理",
  "jvision-pet-booking": "寵物服務預約",
  "jvision-education-care": "學生學習支持平台",
  "jvision-pharmacy-claim": "藥局申報管理",
  "jvision-staff-dispatch": "人力派遣管理",
  "jvision-optical-saas": "眼鏡門市管理",
  "jvision-motorcycle-shop": "機車行營運管理",
  "jvision-estimate-pmis": "工程估價與專案管理",
  "jvision-laundry-pos": "洗衣門市 POS",
  "jvision-smart-parking": "智慧停車管理",
  "jvision-bakery-pos": "烘焙門市 POS",
  "jvision-printing-erp": "印刷產業 ERP",
  "jvision-trading-erp": "貿易營運 ERP",
  "jvision-inventory": "商品庫存管理",
  "jvision-maintenance": "設備維護管理",
  "jvision-self-care-platform": "健康自主管理平台",
  "jvision-event-wedding": "活動婚禮專案管理",
  "jvision-customer-support-platform": "客戶服務平台",
  "jvision-hris": "人力資源資訊系統 HRIS",
  "jvision-work-project-suite": "工作與專案協作套件",
  "jvision-equipment-maintenance-suite": "設備維護管理套件",
  "jvision-construction-management-suite": "營建專案管理套件",
  "jvision-course-learning-suite": "課程與學習管理套件",
  "jvision-esg-energy-carbon": "能源與碳排管理",
  "jvision-interior-design-studio": "室內設計專案管理",
  "jvision-fashion-plm": "服飾產品生命週期管理 PLM",
  "jvision-sign-shop-management": "廣告招牌業務管理",
  "jvision-towing-dispatch": "道路救援調度",
  "jvision-auto-glass-ops": "汽車玻璃服務管理",
  "jvision-claims-management": "保險理賠管理",
  "jvision-order-inventory": "訂單與庫存管理",
  "jvision-lean-demo": "精實生產改善",
  "jvision-work-order-demo": "維修工單管理",
  "jvision-demo": "企業協作示範系統",
  "jvision-task-demo": "團隊任務管理",
  "jvision-showcase-vercel": "內容展示管理",
  "jvision-temple-management": "宮廟信眾與服務管理"
};

let updated = 0;
for (const project of catalog.projects) {
  const title = names[project.repoName];
  if (!title || project.title === title) continue;
  project.title = title;
  updated += 1;
}
fs.writeFileSync(indexPath, `${JSON.stringify(catalog, null, 2)}\n`);
console.log(JSON.stringify({ mapped: Object.keys(names).length, updated }, null, 2));
