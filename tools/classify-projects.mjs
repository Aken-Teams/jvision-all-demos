import fs from "node:fs";
import path from "node:path";

const root=path.resolve(import.meta.dirname,"..");
const indexPath=path.join(root,"projects-index.json");
const catalog=JSON.parse(fs.readFileSync(indexPath,"utf8"));

const directCategories=new Map([
  ["智慧製造｜製造管理","生產製造"],
  ["智慧製造｜品質管理","品質管理"],
  ["智慧製造｜業務管理","業務銷售"],
  ["智慧製造｜採購管理","採購供應鏈"],
  ["智慧製造｜倉儲管理","倉儲物流"],
  ["智慧製造｜人資管理","人力資源"],
  ["智慧製造｜財務管理","財務會計"],
  ["智慧製造｜研發管理","研發管理"],
  ["智慧製造｜IT管理","資訊科技"],
  ["IT 與資安","資訊科技"],
  ["智慧製造｜經營管理","經營管理"],
  ["教育與培訓","教育"],
  ["醫療照護與健康","醫療照護"],
  ["ESG 與永續","ESG 永續"],
  ["ESG、能源與永續","ESG 永續"],
  ["營建與工程服務","營建工程"],
  ["交通與車輛","交通運輸"],
  ["交通車輛與物流","交通運輸"],
  ["金融與保險","金融保險"],
  ["企業營運","企業營運"],
  ["展示與內容管理","內容管理"],
  ["宗教與社區服務","宗教服務"],
]);

const rules=[
  ["資訊安全",/(siem|soc|identity-access|iam|privileged-access|pam|ot-security|edr|xdr|vulnerability|firewall|cyber|security|backup-dr|grc)/],
  ["教育",/(course|lesson|teacher|student|school|kindergarten|training|learning|exam|question-bank|speaking|education-care)/],
  ["醫療照護",/(clinic|dental|pharmacy|medical|health|care|therapy|counseling|rehab)/],
  ["營建工程",/(construction|pmis|interior|site-inspection|material-yard|crew-attendance|contract-change|real-estate|estimate)/],
  ["物流運輸",/(tms|logistics|dispatch|towing|fleet|route|delivery|transport)/],
  ["交通運輸",/(car-|motorcycle|parking|auto-glass|vehicle)/],
  ["餐飲旅宿",/(restaurant|bakery|hospitality|hotel|table-kds)/],
  ["零售電商",/(retail|pos|store|commerce|inventory|member|returns|laundry|optical)/],
  ["生活服務",/(beauty|pet|wedding|event|self-care|salon)/],
  ["金融保險",/(finance|financial|claim|insurance|loan|portfolio|cashflow|ar-ap|bizbooks)/],
  ["專業服務",/(legal|cpa|tax|contract-risk)/],
  ["ESG 永續",/(carbon|energy|ems|esg)/],
  ["人力資源",/(attendance|hris|staff|workforce|payroll|employee|recruit)/],
  ["採購供應鏈",/(supplier|procurement|purchas|srm)/],
  ["品質管理",/(quality|inspection|sqm|root-cause)/],
  ["倉儲物流",/(warehouse|inventory|material-handling|replenishment)/],
  ["設備維護",/(maintenance|equipment|mold-lifecycle)/],
  ["生產製造",/(production|manufactur|work-order|lean|factory|oee|printing|fashion-plm|bom|ecn|order-inventory)/],
  ["客服管理",/(customer-support|service-recovery)/],
  ["企業協作",/(crm|workspace|office|work-management|task|collaboration|project-suite)/],
  ["數據分析",/(analytics|bi-)/],
];

function classify(project){
  const text=`${project.repoName} ${project.title||""}`.toLowerCase();
  for(const [category,pattern] of rules){if(pattern.test(text))return category}
  if(project.category==="教育與照護")return "教育";
  if(project.category==="金融保險與專業服務")return "專業服務";
  if(project.category==="協作與管理"||project.category==="協作、企業營運與 AI 工作區")return "企業協作";
  if(project.category==="零售與服務")return "生活服務";
  if(project.category==="製造與工程")return "生產製造";
  return directCategories.get(project.category)||project.category||"企業應用";
}

for(const project of catalog.projects)project.category=classify(project);
catalog.generatedAt=new Date().toISOString();
fs.writeFileSync(indexPath,JSON.stringify(catalog,null,2)+"\n");

const counts={};
for(const project of catalog.projects)counts[project.category]=(counts[project.category]||0)+1;
console.log(JSON.stringify({total:catalog.projects.length,categories:Object.fromEntries(Object.entries(counts).sort((a,b)=>b[1]-a[1]))},null,2));
