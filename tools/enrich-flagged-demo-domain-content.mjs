import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const auditPath = path.join(root, "docs", "DEMO_DOMAIN_FIT_AUDIT.json");
const catalogPath = path.join(root, "projects-index.json");
const audit = JSON.parse(fs.readFileSync(auditPath, "utf8"));
let catalogRaw;
try {
  catalogRaw = execFileSync("git", ["show", "HEAD:projects-index.json"], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024
  });
} catch {
  catalogRaw = fs.readFileSync(catalogPath, "utf8");
}
const catalog = JSON.parse(catalogRaw);
const flagged = new Set(audit.projects.filter((project) => project.issues.length).map((project) => project.repoName));
const incidentalTargets = new Set([
  "jvision-ai-case-071-logistics-dispatch-pod",
  "jvision-ai-case-096-project-workload-ai",
  "jvision-smart-mfg-198-cold-chain-environmental-monitoring",
  "jvision-optical-saas",
  "jvision-claims-management",
  "jvision-smart-mfg-214-ai-attrition-prediction"
]);
for (const project of catalog.projects) {
  const indexPath = path.join(root, project.localPath, "index.html");
  if (!incidentalTargets.has(project.repoName) && fs.existsSync(indexPath) && fs.readFileSync(indexPath, "utf8").includes('id="domain-workflow"')) {
    flagged.add(project.repoName);
  }
}
for (const repoName of incidentalTargets) flagged.delete(repoName);

const categoryOverrides = {
  "jvision-carbon-inventory": "ESG 永續",
  "jvision-staff-dispatch": "人力資源",
  "jvision-auto-glass-ops": "交通運輸",
  "jvision-lean-demo": "生產製造",
  "jvision-ai-case-002-work-order-dispatch": "生產製造",
  "jvision-ai-case-038-returns-aftercare": "零售電商",
  "jvision-ai-case-070-financial-health-report": "財務會計",
  "jvision-ai-case-081-ghg-inventory": "ESG 永續",
  "jvision-ai-case-095-staff-dispatch-payroll": "人力資源",
  "jvision-smart-mfg-004-real-time-dispatching-rtd": "生產製造",
  "jvision-smart-mfg-056-discrete-event-simulation-des": "生產製造",
  "jvision-smart-mfg-059-ai-dispatching-optimization-system": "生產製造",
  "jvision-smart-mfg-063-corrective-and-preventive-action": "品質管理",
  "jvision-smart-mfg-147-delivery-lead-time-coordination": "業務銷售",
  "jvision-smart-mfg-199-automated-material-handling-dispatch": "倉儲物流",
  "jvision-smart-mfg-213-ehs-environment-health-safety": "品質管理",
  "jvision-smart-mfg-217-org-chart-position-management": "人力資源",
  "jvision-smart-mfg-245-ecn-ecr": "研發管理",
  "jvision-smart-mfg-250-ebom": "研發管理",
  "jvision-smart-mfg-107-scrap-rework-management": "品質管理",
  "jvision-smart-mfg-134-competitive-quote-benchmarking": "業務銷售",
  "jvision-smart-mfg-183-inventory-management-system": "倉儲物流",
  "jvision-smart-mfg-196-aging-obsolete-inventory-analysis": "倉儲物流",
  "jvision-smart-mfg-197-vendor-managed-inventory": "採購供應鏈",
  "jvision-smart-mfg-236-inventory-costing-obsolescence-provision-system": "財務會計"
};

const rules = [
  {
    test: /carbon|ghg|energy-management|energy-monitoring/,
    profile: ["永續盤查工作區", "彙整據點、能源與排放活動數據，完成係數套用、碳排計算、覆核與減碳追蹤。",
      ["匯入活動數據", "套用排放係數", "覆核盤查邊界", "發布永續報告"], "盤查據點、排放源、能源用量、佐證文件"]
  },
  {
    test: /staff-dispatch.*payroll/,
    profile: ["派遣工時計薪中心", "把人員派班、出勤回報、加班核准與薪資結算串成可追溯的人力流程。",
      ["建立人員班表", "確認出勤工時", "核准加班異常", "產生薪資明細"], "員工、班別、出勤、工時、薪資"]
  },
  {
    test: /staff-dispatch/,
    profile: ["人員派班調度台", "依員工技能、可用時段與服務地點安排班表，持續追蹤缺班與臨時代班。",
      ["登錄人力需求", "比對技能時段", "發布派班通知", "確認出勤結果"], "員工、職能、班表、出勤、缺班"]
  },
  {
    test: /bakery/,
    profile: ["烘焙前店後廠作業台", "從生產批次、配方備料到門市商品、訂單與結帳，掌握每日鮮度與銷售。",
      ["排定烘焙批次", "領用原料配方", "商品上架標價", "門市結帳盤點"], "餐點、菜單、配方、批次、商品、門市訂單"]
  },
  {
    test: /pet-hotel/,
    profile: ["寵物旅宿照護中心", "管理寵物入住、房型分配、美容預約、餵藥囑咐與飼主聯繫紀錄。",
      ["建立寵物檔案", "安排房間入住", "執行照護美容", "退房通知飼主"], "寵物、飼主、房間、預約、照護紀錄"]
  },
  {
    test: /hospitality/,
    profile: ["旅宿房況營運台", "整合房間庫存、旅客訂房、入住清潔與退房帳務，避免超賣並提升住房率。",
      ["接收旅客訂房", "指派房間房型", "辦理入住清潔", "退房結帳對帳"], "旅客、房間、訂房、入住、住房收入"]
  },
  {
    test: /returns-aftercare/,
    profile: ["售後退換貨處理台", "依訂單、商品狀態與退貨原因完成受理、檢驗、退款換貨及顧客通知。",
      ["查詢原始訂單", "受理退貨申請", "檢驗商品狀態", "完成退款或換貨"], "顧客、訂單、商品、退貨、退款"]
  },
  {
    test: /financial-health/,
    profile: ["財務健檢報告中心", "以現金流、帳款、成本與預算差異檢視企業財務體質，形成改善建議。",
      ["匯入會計帳務", "分析現金流量", "檢查帳款風險", "發布財務報告"], "財務、會計、現金流、帳款、成本"]
  },
  {
    test: /auto-glass/,
    profile: ["汽車玻璃維修工作台", "依車輛與玻璃規格建立維修工單，安排技師、備料、施工驗收與保固。",
      ["辨識車型玻璃", "建立維修工單", "安排技師施工", "驗收交車保固"], "車輛、車主、玻璃料件、技師、維修工單"]
  },
  {
    test: /car-cloud/,
    profile: ["聯網車輛管理中心", "集中管理車輛位置、里程、駕駛行程、告警與保養到期狀態。",
      ["綁定車輛裝置", "接收行程定位", "判讀異常告警", "安排保養維修"], "車輛、駕駛、路線、里程、保養"]
  },
  {
    test: /motorcycle/,
    profile: ["機車行維修營運台", "管理車主與車輛資料、維修估價、技師工序、零件領用及交車收款。",
      ["建立車輛履歷", "檢查估價報修", "領料執行維修", "交車收款保固"], "機車、車主、技師、零件、維修工單"]
  },
  {
    test: /smart-parking/,
    profile: ["智慧停車場控制台", "追蹤車位、車牌進出、停車費率、月租資格與設備異常。",
      ["辨識車牌入場", "配置可用車位", "計算停車費用", "繳費放行離場"], "車牌、車位、停車場、費率、進出紀錄"]
  },
  {
    test: /pharmacy-claim/,
    profile: ["藥局申報作業中心", "核對病患處方、藥品調劑、健保申報與退件補正，保留完整稽核紀錄。",
      ["接收病患處方", "核對藥品調劑", "送出健保申報", "處理退件補正"], "病患、處方、藥品、藥師、申報案件"]
  },
  {
    test: /self-care/,
    profile: ["個人照護追蹤平台", "協助個案記錄健康指標、照護計畫、提醒任務與專業人員回覆。",
      ["建立個案目標", "記錄健康數據", "執行照護任務", "回顧調整計畫"], "個案、健康指標、照護計畫、提醒、專業人員"]
  },
  {
    test: /course|training|learning-management/,
    profile: ["學習與課程管理中心", "讓教師安排課程教材、學生報名、出席作業與學習成果追蹤。",
      ["建立課程班級", "發布教材教案", "記錄學生出席", "批改作業測驗"], "教師、學生、課程、教材、班級、作業"]
  },
  {
    test: /event-wedding/,
    profile: ["婚禮活動籌備台", "集中管理新人需求、場地檔期、供應商任務、賓客桌次與當日流程。",
      ["確認活動需求", "預約場地檔期", "協調供應商", "執行婚宴流程"], "新人、賓客、場地、預約、供應商"]
  },
  {
    test: /interior-design/,
    profile: ["室內設計專案中心", "從丈量、圖面提案、材料選樣、工程排程到驗收請款管理設計案。",
      ["建立客戶需求", "提交設計圖面", "確認材料報價", "施工驗收交付"], "客戶、圖面、材料、工程、施工進度"]
  },
  {
    test: /towing|logistics-tracking/,
    profile: ["車隊物流調度中心", "依運單位置與車輛載況安排駕駛路線，追蹤到貨、簽收與異常。",
      ["建立運單任務", "指派車輛駕駛", "追蹤路線位置", "完成到貨簽收"], "物流、運單、車隊、駕駛、路線、到貨"]
  },
  {
    test: /work-order|dispatching|real-time-dispatch|lean-demo/,
    profile: ["生產派工與精實改善台", "依工單優先序、產線產能、設備狀態與人員技能安排即時生產。",
      ["釋出生產工單", "檢查物料設備", "指派產線人員", "回報完工良率"], "工單、產線、設備、物料、排程、良率"]
  },
  {
    test: /inventory-replenishment/,
    profile: ["門市庫存補貨中心", "依商品銷售、門市庫存與安全水位產生補貨建議，追蹤訂單到貨與上架。",
      ["彙整商品銷售", "檢查門市庫存", "建立補貨訂單", "驗收到貨上架"], "商品、門市、庫存、補貨、訂單、到貨"]
  },
  {
    test: /amhs|warehouse-control|warehouse-wave|pull-replenishment|inventory-management|aging-obsolete/,
    profile: ["倉儲物料控制中心", "協調庫存、儲位、搬運設備與揀貨波次，確保入庫、補料及出庫正確。",
      ["接收入庫物料", "配置倉庫儲位", "執行揀貨補料", "複核出庫批號"], "倉庫、庫存、儲位、入庫、出庫、揀貨、批號"]
  },
  {
    test: /vendor-managed-inventory/,
    profile: ["供應商庫存協同台", "共享需求、庫存水位與交期，讓供應商主動提出補貨並由採購確認。",
      ["同步需求庫存", "計算補貨建議", "供應商確認交期", "採購驗收入庫"], "供應商、採購、庫存、補貨、交期、物料"]
  },
  {
    test: /discrete-event/,
    profile: ["離散事件產線模擬室", "以站點、設備、批次與節拍建立模擬情境，找出瓶頸並比較改善方案。",
      ["建立製程模型", "設定設備節拍", "執行批次模擬", "比較產能瓶頸"], "製程、產線、設備、批次、產能、模擬"]
  },
  {
    test: /capa|safety-inspection|supplier-quality|corrective-action|scrap-rework|cleanroom/,
    profile: ["品質異常改善中心", "從缺陷或稽核異常展開原因分析、矯正預防措施、成效驗證與結案。",
      ["登錄品質異常", "分析缺陷原因", "執行 CAPA 措施", "稽核驗證結案"], "品質、缺陷、稽核、異常、CAPA、檢驗"]
  },
  {
    test: /delivery-lead/,
    profile: ["客戶交期協同中心", "串接客戶訂單、生產承諾與物流進度，提早處理交期落差。",
      ["接收客戶訂單", "確認生產交期", "協調出貨排程", "通知客戶到貨"], "客戶、訂單、交期、出貨、業務"]
  },
  {
    test: /automated-material-handling-dispatch/,
    profile: ["AGV／AMR 搬運調度台", "依站點叫料、車輛電量與路徑壅塞，自動派送搬運任務並回報到站。",
      ["接收站點叫料", "選擇可用車輛", "規劃搬運路線", "到站交付物料"], "倉庫、物料、AGV、AMR、路線、到站"]
  },
  {
    test: /ehs-environment/,
    profile: ["職業安全衛生中心", "管理工地與廠區巡檢、危害通報、改善措施、教育訓練及法規稽核。",
      ["辨識作業危害", "執行安衛巡檢", "指派改善措施", "稽核確認結案"], "安衛、風險、巡檢、事故、稽核、訓練"]
  },
  {
    test: /org-chart/,
    profile: ["組織職位管理中心", "維護部門、職位、員工編制與主管關係，支援異動簽核及人才盤點。",
      ["建立組織部門", "設定職位編制", "配置員工主管", "發布組織異動"], "員工、人事、部門、職位、人才、績效"]
  },
  {
    test: /ecn-ecr|ebom/,
    profile: ["研發變更與 BOM 中心", "管理產品設計版本、BOM 結構、工程變更申請、影響評估與核准發布。",
      ["建立產品版本", "維護研發 BOM", "提交工程變更", "評估核准發布"], "研發、產品、設計、版本、變更、BOM"]
  },
  {
    test: /multi-plant/,
    profile: ["多廠協同營運中心", "讓各工廠共享訂單、產能、物料與生產進度，協調跨廠支援。",
      ["彙整各廠需求", "比較產線產能", "協調物料工單", "追蹤跨廠交付"], "工廠、產線、工單、物料、協作、進度"]
  },
  {
    test: /competitive-quote/,
    profile: ["同業報價分析中心", "彙整客戶需求、競品價格與歷史成交，協助業務提出可獲利報價。",
      ["建立客戶商機", "蒐集同業報價", "分析成本毛利", "送審正式報價"], "業務、客戶、商機、報價、成本、合約"]
  },
  {
    test: /financial-accounting|financial-reporting/,
    profile: ["財務會計與關帳中心", "整合傳票、帳款、成本、對帳與報表流程，加速月結並保留稽核軌跡。",
      ["匯入會計傳票", "核對收付款帳款", "執行關帳調整", "發布財務報表"], "會計、財務、帳款、成本、對帳、報表"]
  },
  {
    test: /inventory-costing/,
    profile: ["存貨成本與跌價提列台", "依庫存批次、庫齡與成本計價分析呆滯風險，完成會計提列與報表。",
      ["彙整庫存批次", "計算存貨成本", "分析庫齡呆滯", "核准跌價提列"], "財務、會計、庫存、成本、庫齡、提列"]
  },
  {
    test: /restaurant-table/,
    profile: ["餐廳桌位與出餐台", "串接顧客訂位、桌位安排、菜單點餐、廚房出單及結帳。",
      ["接受顧客訂位", "安排餐桌座位", "送出菜單餐點", "廚房出餐結帳"], "顧客、訂位、桌位、菜單、餐點"]
  }
];

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function profileFor(project) {
  const key = `${project.repoName} ${project.title}`.toLowerCase();
  const match = rules.find((rule) => rule.test.test(key));
  if (match) return match.profile;
  return [
    `${project.title} 作業流程`,
    `以 ${project.title} 的實際作業對象、處理狀態與責任分工管理日常工作。`,
    ["建立作業資料", "確認負責角色", "推進處理狀態", "完成覆核結案"],
    "作業資料、負責人、處理狀態、歷程紀錄"
  ];
}

function domainSection(project, profile) {
  const [heading, purpose, steps, records] = profile;
  const markup = `<style id="jv-domain-context-style">
.jv-domain-context{max-width:1180px;margin:32px auto;padding:28px;border:1px solid #d5e2f4;border-radius:24px;background:#fff;color:#10213f;box-shadow:0 16px 45px rgba(28,64,120,.08);font-family:inherit}.jv-domain-context__eyebrow{margin:0 0 8px;color:#245edb;font-size:13px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}.jv-domain-context h2{margin:0;font-size:clamp(24px,3vw,36px);line-height:1.2}.jv-domain-context__purpose{max-width:820px;margin:12px 0 22px;color:#50627e;line-height:1.8}.jv-domain-context__steps{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.jv-domain-context__step{padding:16px;border-radius:16px;background:#f4f7fc}.jv-domain-context__step b{display:block;margin-bottom:6px;color:#245edb;font-size:12px}.jv-domain-context__records{margin:18px 0 0;padding-top:16px;border-top:1px solid #e2e9f4;color:#50627e}@media(max-width:760px){.jv-domain-context{margin:20px 14px;padding:20px}.jv-domain-context__steps{grid-template-columns:1fr 1fr}}@media(max-width:440px){.jv-domain-context__steps{grid-template-columns:1fr}}
</style><section class="jv-domain-context" id="domain-workflow" aria-labelledby="domain-workflow-title">
  <p class="jv-domain-context__eyebrow">${escapeHtml(project.category)} · SYSTEM WORKFLOW</p>
  <h2 id="domain-workflow-title">${escapeHtml(heading)}</h2>
  <p class="jv-domain-context__purpose">${escapeHtml(purpose)}</p>
  <div class="jv-domain-context__steps">${steps.map((step, index) => `<div class="jv-domain-context__step"><b>0${index + 1}</b><span>${escapeHtml(step)}</span></div>`).join("")}</div>
  <p class="jv-domain-context__records"><strong>核心資料：</strong>${escapeHtml(records)}</p>
</section>`;
  const serializedMarkup = JSON.stringify(markup).replaceAll("<", "\\u003c");
  return `${markup}<script id="jv-domain-context-runtime">
setTimeout(function(){if(!document.getElementById("domain-workflow"))document.body.insertAdjacentHTML("beforeend",${serializedMarkup});},700);
</script>`;
}

const rows = [];
for (const project of catalog.projects) {
  if (incidentalTargets.has(project.repoName)) {
    const indexPath = path.join(root, project.localPath, "index.html");
    if (fs.existsSync(indexPath)) {
      try {
        const relative = path.relative(root, indexPath).replaceAll("\\", "/");
        const original = execFileSync("git", ["show", `HEAD:${relative}`], {
          cwd: root,
          encoding: "utf8",
          maxBuffer: 20 * 1024 * 1024
        });
        fs.writeFileSync(indexPath, original);
      } catch {
        const cleaned = fs.readFileSync(indexPath, "utf8")
          .replace(/<style id="jv-domain-context-style">[\s\S]*?<\/section>/i, "")
          .replace(/<script id="jv-domain-context-runtime">[\s\S]*?<\/script>/i, "");
        fs.writeFileSync(indexPath, cleaned);
      }
    }
    continue;
  }
  if (!flagged.has(project.repoName)) continue;
  if (categoryOverrides[project.repoName]) project.category = categoryOverrides[project.repoName];
  const indexPath = path.join(root, project.localPath, "index.html");
  if (!fs.existsSync(indexPath)) {
    rows.push({ repoName: project.repoName, status: "missing-index" });
    continue;
  }
  let html = fs.readFileSync(indexPath, "utf8");
  html = html
    .replace(/<style id="jv-domain-context-style">[\s\S]*?<\/section>/i, "")
    .replace(/<script id="jv-domain-context-runtime">[\s\S]*?<\/script>/i, "");
  const section = domainSection(project, profileFor(project));
  html = /<\/body>/i.test(html)
    ? html.replace(/<\/body>/i, `${section}</body>`)
    : `${html}\n${section}\n`;
  fs.writeFileSync(indexPath, html);
  rows.push({ repoName: project.repoName, status: "enriched", category: project.category });
}

for (const [repoName, category] of Object.entries(categoryOverrides)) {
  const repoIndex = catalogRaw.indexOf(`"repoName": "${repoName}"`);
  const categoryKey = catalogRaw.lastIndexOf('"category": "', repoIndex);
  if (repoIndex < 0 || categoryKey < 0 || repoIndex - categoryKey > 1200) continue;
  const valueStart = categoryKey + '"category": "'.length;
  const valueEnd = catalogRaw.indexOf('"', valueStart);
  catalogRaw = `${catalogRaw.slice(0, valueStart)}${category}${catalogRaw.slice(valueEnd)}`;
  const changedLineEnd = catalogRaw.indexOf("\n", valueStart);
  if (changedLineEnd > 0 && catalogRaw[changedLineEnd - 1] === "\r") {
    catalogRaw = `${catalogRaw.slice(0, changedLineEnd - 1)}${catalogRaw.slice(changedLineEnd)}`;
  }
}
fs.writeFileSync(catalogPath, catalogRaw);
const summary = {
  generatedAt: new Date().toISOString(),
  total: rows.length,
  enriched: rows.filter((row) => row.status === "enriched").length,
  failed: rows.filter((row) => row.status !== "enriched").length,
  categoryOverrides: Object.keys(categoryOverrides).length
};
fs.writeFileSync(
  path.join(root, "docs", "DOMAIN_CONTENT_ENRICHMENT_REPORT.json"),
  `${JSON.stringify({ summary, rows }, null, 2)}\n`
);
console.log(JSON.stringify(summary, null, 2));
if (summary.failed) process.exitCode = 1;
