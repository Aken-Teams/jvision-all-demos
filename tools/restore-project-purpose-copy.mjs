import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const indexPath = path.join(root, "projects-index.json");
const catalog = JSON.parse(fs.readFileSync(indexPath, "utf8"));
const manualDefinitions = {
  "jvision-order-inventory": {
    description: "把網路訂單、門市庫存、保留量與出貨狀態放在同一畫面，避免商品已售出但庫存尚未扣帳。",
    role: "電商營運專員",
    steps: ["接收並檢查新訂單", "保留可用庫存並建立揀貨單", "完成出貨並回寫庫存"],
    fields: ["訂單編號／銷售通路", "SKU／數量／配送方式"],
    output: "出貨單、庫存異動與訂單履約紀錄"
  },
  "jvision-lean-demo": {
    description: "以價值流程、工時與等待原因找出產線浪費，將改善提案轉成有負責人與驗證期限的行動。",
    role: "精實改善工程師",
    steps: ["量測現況工時與等待", "標記浪費並提出改善", "驗證改善前後成效"],
    fields: ["產線／製程站點", "週期時間／等待原因／改善目標"],
    output: "改善前後比較、節省工時與標準作業版本"
  },
  "jvision-work-order-demo": {
    description: "從設備報修、故障判斷、備品領用到試車復機管理維修工單，保留每次處置與停機時間。",
    role: "維修工程師",
    steps: ["受理設備報修並判斷優先級", "派工維修與登錄備品", "試車確認後完成復機"],
    fields: ["設備編號／故障現象", "停機影響／維修人員／備品"],
    output: "維修履歷、停機時數與復機確認紀錄"
  },
  "jvision-demo": {
    description: "提供跨部門提案、文件會簽與決議追蹤的示範工作區，讓會議結論直接轉為可追蹤任務。",
    role: "專案協調人",
    steps: ["建立提案並附上文件", "邀請相關部門會簽", "發布決議並追蹤待辦"],
    fields: ["提案主旨／參與部門", "附件／期限／決議需求"],
    output: "核定決議、任務清單與文件版本"
  },
  "jvision-task-demo": {
    description: "將團隊待辦依負責人、期限與優先級排入看板，支援交辦、阻塞回報與完成驗收。",
    role: "團隊主管",
    steps: ["建立任務並指定負責人", "更新進度與回報阻塞", "驗收成果並關閉任務"],
    fields: ["任務名稱／負責人", "期限／優先級／完成條件"],
    output: "任務狀態、阻塞紀錄與驗收結果"
  },
  "jvision-maintenance": {
    description: "管理工廠設備的報修、故障判斷、維修派工與復機確認，讓停機影響與備品用量可追溯。",
    role: "設備維修工程師",
    steps: ["受理故障並判定停機風險", "派工維修與登錄備品用量", "試車確認並恢復生產"],
    fields: ["設備編號／故障現象", "停機範圍／維修人員／備品"],
    output: "維修工單、設備履歷與復機紀錄"
  },
  "jvision-equipment-maintenance-suite": {
    description: "依設備台帳與保養週期安排預防保養，追蹤點檢缺失、校正期限與年度保養達成率。",
    role: "設備保養管理師",
    steps: ["建立年度保養計畫", "執行點檢並處理缺失", "主管驗收並更新下次保養日"],
    fields: ["設備台帳／保養週期", "點檢表／校正期限／保養人員"],
    output: "保養履歷、缺失改善與下次保養排程"
  },
  "jvision-ai-case-024-real-estate-crm": {
    description: "房地產 CRM 集中管理潛在客戶、買方與屋主需求，從帶看回饋、方案報價一路追蹤到成交交接，避免重要承諾散落在通訊軟體。",
    role: "房仲業務",
    steps: ["建立潛在客戶與物件需求", "整理帶看回饋並提出方案報價", "確認成交條件並完成成交交接"],
    fields: ["客戶姓名／預算／需求區域", "物件／帶看回饋／報價條件"],
    output: "潛在客戶履歷、方案報價與成交交接紀錄"
  }
};

const splitList = (value) => String(value || "")
  .split(/[、，,]/)
  .map((item) => item.trim())
  .filter(Boolean);

const splitWorkflow = (value) => String(value || "")
  .split(/\s*(?:→|->|＞|>)\s*/)
  .map((item) => item.trim())
  .filter(Boolean);

const extractConfig = (html) => {
  const match = html.match(/window\.DEMO_CONFIG\s*=\s*(\{[^\r\n]+\});/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
};

let restored = 0;
let restoredFromMeta = 0;
let skipped = 0;

for (const project of catalog.projects) {
  if (project.repoName === "jvision-property-management") {
    project.category = "房地產與物業";
  }
  project.industry = project.category;

  const htmlPath = path.join(root, project.localPath, "index.html");
  if (!fs.existsSync(htmlPath)) {
    skipped += 1;
    continue;
  }

  const config = extractConfig(fs.readFileSync(htmlPath, "utf8"));
  const spec = config?.spec;
  if (!config?.description || !Array.isArray(spec?.functions) || !spec.functions.length) {
    const manualFirst = manualDefinitions[project.repoName];
    if (manualFirst) {
      project.description = manualFirst.description;
      project.businessSituation = `當作業需要跨人員確認且資訊散落時，${manualFirst.role}可在${project.title}依序完成${manualFirst.steps.join("、")}。`;
      project.dailyUse = `${manualFirst.role}每天更新待處理項目、處理逾期或阻塞，並確認${manualFirst.output}已正確保存。`;
      project.primaryUser = manualFirst.role;
      project.customerWorkflow = {
        eyebrow: `${project.title}實際作業`,
        steps: manualFirst.steps,
        choices: [`執行「${manualFirst.steps[1]}」`, `退回補充${manualFirst.fields[0]}`, `建立例外並指派${manualFirst.role}`],
        fields: manualFirst.fields,
        output: manualFirst.output
      };
      restored += 1;
      continue;
    }
    const html = fs.readFileSync(htmlPath, "utf8");
    const metaDescription = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']{8,})["']/i)?.[1]?.trim();
    if (metaDescription && !/JVision\s*(Demo|系統展示)/i.test(metaDescription)) {
      const scenario = project.repoName && JSON.parse(fs.readFileSync(path.join(root, "content", "practical-scenarios.json"), "utf8")).scenarios?.[project.repoName];
      const operator = scenario?.persona?.operator || String(project.primaryUser || "").split("、")[0] || "承辦人員";
      const reviewer = scenario?.persona?.supervisor || String(project.primaryUser || "").split("、")[1] || "部門主管";
      const subject = project.title.replace(/[（(][^)）]+[)）]/g, "").trim();
      const action = metaDescription.replace(/[。；;]\s*$/, "");
      project.description = metaDescription;
      project.businessSituation = `當現場需要「${action}」時，${operator}可使用${project.title}集中處理，不必再以試算表或訊息往返確認。`;
      project.dailyUse = `${operator}每天在${project.title}更新${subject}資料、處理例外並保存結果；${reviewer}只需查看逾期、衝突或待確認項目。`;
      project.customerWorkflow = {
        eyebrow: `${subject}實際作業`,
        steps: [`建立${subject}資料`, action, `確認結果並完成留存`],
        choices: [`執行「${action}」`, `退回補充${subject}資料`, `交由${reviewer}判斷例外`],
        fields: [`${subject}名稱／編號`, `${subject}條件／負責人／期限`],
        output: `${subject}處理結果與操作紀錄`
      };
      restoredFromMeta += 1;
      continue;
    }
    const manual = manualDefinitions[project.repoName];
    if (manual) {
      project.description = manual.description;
      project.businessSituation = `當作業需要跨人員確認且資訊散落時，${manual.role}可在${project.title}依序完成${manual.steps.join("、")}。`;
      project.dailyUse = `${manual.role}每天更新待處理項目、處理逾期或阻塞，並確認${manual.output}已正確保存。`;
      project.primaryUser = manual.role;
      project.customerWorkflow = {
        eyebrow: `${project.title}實際作業`,
        steps: manual.steps,
        choices: [`執行「${manual.steps[1]}」`, `退回補充${manual.fields[0]}`, `建立例外並指派${manual.role}`],
        fields: manual.fields,
        output: manual.output
      };
      restored += 1;
      continue;
    }
    skipped += 1;
    continue;
  }

  const departments = splitList(spec.departments);
  const pains = Array.isArray(spec.pains) ? spec.pains.filter(Boolean) : [];
  const functions = spec.functions.filter(Boolean);
  const workflow = splitWorkflow(spec.workflow);
  const kpis = splitList(spec.kpi);
  const integrations = splitList(spec.integrations);
  const operator = departments[0] || project.primaryUser || "業務承辦人";
  const reviewer = departments[1] || "部門主管";
  const subject = config.name || project.title;
  const trigger = pains[0] || `${subject}出現資料不完整或進度延誤`;
  const actionText = workflow.length
    ? workflow.join("、")
    : functions.slice(0, 3).join("、");
  const output = workflow.at(-1)
    ? `${workflow.at(-1)}紀錄`
    : `${subject}處理結果`;

  project.description = `${project.title}提供${functions.slice(0, 3).join("、")}。${operator}依「${spec.workflow || actionText}」推進作業，優先解決「${trigger}」，${reviewer}則以${kpis.slice(0, 2).join("與") || output}確認成果。`;
  project.businessSituation = `當「${trigger}」發生時，${operator}可在${project.title}依序完成${actionText}；${reviewer}再依${kpis.slice(0, 2).join("與") || "處理結果"}判斷是否需要介入。`;
  project.dailyUse = `${operator}日常使用${functions.slice(0, 3).join("、")}；案件依「${spec.workflow || actionText}」流轉，並與${integrations.slice(0, 3).join("、") || "既有作業系統"}同步。`;
  project.primaryUser = departments.slice(0, 3).join("、") || operator;
  project.operationalMetrics = kpis.length >= 4
    ? kpis.slice(0, 4)
    : [...kpis, ...pains].filter(Boolean).slice(0, 4);
  project.customerWorkflow = {
    eyebrow: `${subject}實際作業`,
    steps: workflow.length >= 3
      ? [workflow[0], workflow[Math.floor((workflow.length - 1) / 2)], workflow.at(-1)]
      : functions.slice(0, 3),
    choices: [
      `執行「${functions[0] || workflow[0]}」`,
      `退回補充「${functions[1] || "必要資料"}」`,
      `交由${reviewer}處理「${pains[0] || "例外狀況"}」`
    ],
    fields: [
      functions.slice(0, 2).join("／") || `${subject}基本資料`,
      functions.slice(2, 4).join("／") || `${subject}處理依據`
    ],
    output: `${output}；追蹤${kpis.slice(0, 2).join("與") || "完成狀態"}`
  };
  restored += 1;
}

catalog.generatedAt = new Date().toISOString();
catalog.purposeCopyRestoration = {
  version: "2026.07.30-v1",
  restored,
  restoredFromMeta,
  skipped
};
fs.writeFileSync(indexPath, `${JSON.stringify(catalog, null, 2)}\n`);

console.log(JSON.stringify({ restored, restoredFromMeta, skipped }, null, 2));
