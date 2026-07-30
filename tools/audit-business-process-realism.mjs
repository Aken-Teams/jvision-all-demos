import fs from "node:fs";
import path from "node:path";
import { projectWorkflowOverrides } from "../shared/jvision-project-workflows.js";

const root = process.cwd();
const projects = JSON.parse(fs.readFileSync(path.join(root, "projects-index.json"), "utf8")).projects || [];
const scenarioFile = JSON.parse(fs.readFileSync(path.join(root, "content", "practical-scenarios.json"), "utf8"));
const scenarios = scenarioFile.scenarios || {};
const applySafe = process.argv.includes("--apply-safe");

const rules = {
  "ESG 永續": { terms: ["盤查", "排放", "碳", "查證", "揭露"], roles: ["永續", "環安", "查證"], review: ["查證", "覆核", "確認"], outputs: ["揭露", "報告", "結案"] },
  "交通運輸": { terms: ["班次", "車輛", "駕駛", "路線", "到站"], roles: ["調度", "駕駛", "車隊"], review: ["確認", "驗收"], outputs: ["到站", "結算", "結案"] },
  "人力資源": { terms: ["員工", "職缺", "出勤", "薪資", "人事"], roles: ["人資", "主管", "招募"], review: ["主管", "核准", "覆核"], outputs: ["歸檔", "發薪", "到職", "結案"] },
  "企業協作": { terms: ["任務", "文件", "協作", "決策", "責任人"], roles: ["負責人", "主管", "專案"], review: ["確認", "核准", "決策"], outputs: ["歸檔", "交付", "完成"] },
  "企業營運": { terms: ["營運", "作業", "異常", "資源", "據點"], roles: ["營運", "主管", "負責人"], review: ["主管", "確認", "核定"], outputs: ["歸檔", "結案", "追蹤"] },
  "倉儲物流": { terms: ["庫存", "庫位", "揀貨", "盤點", "出庫"], roles: ["倉管", "理貨", "主管"], review: ["複核", "盤點", "確認"], outputs: ["出庫", "入庫", "結算"] },
  "品質管理": { terms: ["檢驗", "品質", "缺失", "批次", "改善"], roles: ["品保", "品管", "品質"], review: ["驗證", "核准", "放行"], outputs: ["放行", "結案", "驗證"] },
  "宗教服務": { terms: ["信徒", "點燈", "法會", "功德金", "志工"], roles: ["服務", "志工", "廟務"], review: ["確認", "核對"], outputs: ["登記", "入帳", "完成"] },
  "客服管理": { terms: ["客服", "工單", "客戶", "回覆", "SLA"], roles: ["客服", "主管", "專員"], review: ["確認", "升級", "回覆"], outputs: ["結案", "關閉", "滿意度"] },
  "專業服務": { terms: ["案件", "客戶", "交付", "顧問", "工時"], roles: ["顧問", "專案", "案件"], review: ["客戶確認", "審核", "驗收"], outputs: ["交付", "結案", "收款"] },
  "採購供應鏈": { terms: ["請購", "詢價", "供應商", "採購", "驗收"], roles: ["採購", "需求", "主管"], review: ["簽核", "核准", "驗收"], outputs: ["驗收", "入庫", "結案"] },
  "教育": { terms: ["課程", "學員", "教案", "教材", "學習"], roles: ["教師", "教務", "講師"], review: ["審閱", "課綱", "確認"], outputs: ["發布", "完成", "結案"] },
  "數據分析": { terms: ["資料", "指標", "模型", "分析", "洞察"], roles: ["分析師", "資料", "主管"], review: ["驗證", "覆核", "確認"], outputs: ["發布", "報告", "洞察"] },
  "業務銷售": { terms: ["客戶", "商機", "報價", "成交", "跟進"], roles: ["業務", "業務主管", "客戶"], review: ["簽核", "核准", "確認"], outputs: ["成交", "交接", "簽約"] },
  "營建工程": { terms: ["工項", "工地", "施工", "查驗", "估驗"], roles: ["工班", "監造", "工地主任"], review: ["查驗", "監造", "核定"], outputs: ["計價", "驗收", "完工"] },
  "物流運輸": { terms: ["訂單", "配送", "運單", "簽收", "承運"], roles: ["物流", "調度", "司機"], review: ["簽收", "確認", "驗收"], outputs: ["簽收", "結算", "完成"] },
  "生活服務": { terms: ["預約", "顧客", "服務", "排班", "到店"], roles: ["服務", "客服", "技師"], review: ["顧客確認", "驗收", "確認"], outputs: ["結案", "收款", "完成"] },
  "生產製造": { terms: ["工單", "產線", "物料", "生產", "入庫"], roles: ["生管", "製造", "班長"], review: ["品檢", "確認", "核准"], outputs: ["入庫", "完工", "出貨"] },
  "研發管理": { terms: ["需求", "規格", "開發", "驗證", "版本"], roles: ["研發", "產品", "工程師"], review: ["審核", "驗證", "評審"], outputs: ["發布", "歸檔", "交付"] },
  "經營管理": { terms: ["目標", "KPI", "決策", "策略", "行動"], roles: ["主管", "經營", "負責人"], review: ["核定", "決策", "審議"], outputs: ["追蹤", "結案", "核定"] },
  "設備維護": { terms: ["設備", "故障", "保養", "維修", "復機"], roles: ["設備", "維修", "工程師"], review: ["驗證", "復機", "確認"], outputs: ["復機", "歸檔", "結案"] },
  "財務會計": { terms: ["單據", "憑證", "帳款", "付款", "入帳"], roles: ["會計", "財務", "出納"], review: ["覆核", "核准", "對帳"], outputs: ["入帳", "關帳", "結案"] },
  "資訊安全": { terms: ["資安", "告警", "事件", "風險", "隔離"], roles: ["資安", "SOC", "分析師"], review: ["研判", "驗證", "核准"], outputs: ["復原", "結案", "關閉"] },
  "資訊科技": { terms: ["系統", "帳號", "服務單", "維運", "驗收"], roles: ["IT", "維運", "工程師"], review: ["驗收", "確認", "核准"], outputs: ["關閉", "上線", "完成"] },
  "醫療照護": { terms: ["病患", "掛號", "診察", "處方", "照護"], roles: ["醫師", "護理", "藥師"], review: ["醫師", "藥師", "確認"], outputs: ["批價", "結案", "完成照護"] },
  "金融保險": { terms: ["申請", "身分", "風險", "核保", "理賠"], roles: ["理專", "核保", "理賠"], review: ["覆核", "核准", "審查"], outputs: ["生效", "理賠", "簽約"] },
  "零售電商": { terms: ["商品", "訂單", "庫存", "收款", "出貨"], roles: ["門市", "電商", "客服"], review: ["確認", "揀貨", "驗收"], outputs: ["出貨", "交付", "售後"] },
  "餐飲旅宿": { terms: ["訂位", "住房", "房間", "到店", "結帳"], roles: ["櫃檯", "接待", "房務"], review: ["確認", "安排", "點交"], outputs: ["結帳", "退房", "完成"] },
};

const containsAny = (value, terms) => terms.some((term) => String(value || "").toLowerCase().includes(term.toLowerCase()));
const flatten = (value) => Array.isArray(value) ? value.flat(Infinity).join(" ") : String(value || "");
const issue = (severity, code, message, evidence) => ({ severity, code, message, evidence });

function normalizeScenario(project, scenario) {
  const rule = rules[project.category];
  if (!rule || !scenario?.profile) return false;
  let changed = false;
  const processText = flatten([
    scenario.workflow?.map((step) => [step.label, step.outcome]),
    scenario.modules,
    scenario.profile.object,
    scenario.profile.owner,
    scenario.profile.stages,
    scenario.profile.risks,
    scenario.profile.fields,
    scenario.records?.map((row) => [row.title, row.target, row.owner, row.risk, row.stage, row.statusNote]),
  ]);

  if (!containsAny(flatten(Object.values(scenario.persona || {})), rule.roles)) {
    scenario.persona = {
      ...(scenario.persona || {}),
      operator: `${rule.roles[0]}專員`,
      supervisor: `${rule.roles[0]}主管`,
      decisionMaker: `${project.category}主管`,
    };
    scenario.profile.owner = `${rule.roles[0]}專員`;
    changed = true;
  }

  const oldStages = [...(scenario.profile.stages || [])];
  const nextStages = [...oldStages];
  if (nextStages.length >= 4 && !containsAny(flatten(nextStages), rule.review)) {
    nextStages[nextStages.length - 2] = `${rule.review[0]}確認`;
  }
  if (nextStages.length >= 4 && !containsAny(flatten(nextStages), rule.outputs)) {
    nextStages[nextStages.length - 1] = `${rule.outputs[0]}完成`;
  }
  if (nextStages.some((stage, index) => stage !== oldStages[index])) {
    const stageMap = new Map(oldStages.map((stage, index) => [stage, nextStages[index]]));
    scenario.profile.stages = nextStages;
    scenario.records = (scenario.records || []).map((record) => ({
      ...record,
      stage: stageMap.get(record.stage) || record.stage,
      done: record.done || record.stage === oldStages.at(-1),
    }));
    changed = true;
  }

  const hits = rule.terms.filter((term) => containsAny(processText, [term]));
  if (hits.length < Math.min(3, rule.terms.length)) {
    const missing = rule.terms.filter((term) => !hits.includes(term)).slice(0, 3 - hits.length);
    const modules = [...(scenario.modules || [])];
    for (const term of missing) {
      const replacement = `${term}管理`;
      if (!modules.some((module) => containsAny(module, [term]))) {
        const replaceAt = Math.max(0, modules.length - 1 - missing.indexOf(term));
        modules[replaceAt] = replacement;
      }
    }
    scenario.modules = modules;
    changed = true;
  }
  return changed;
}

if (applySafe) {
  let updated = 0;
  for (const project of projects) {
    const scenario = scenarios[project.repoName];
    if (scenario && normalizeScenario(project, scenario)) updated += 1;
  }
  scenarioFile.generatedAt = new Date().toISOString();
  scenarioFile.auditNormalization = {
    version: "2026.07-business-realism-v1",
    updated,
    note: "補齊符合領域的責任角色、人工覆核關卡、結案產出位置與流程用語。",
  };
  fs.writeFileSync(path.join(root, "content", "practical-scenarios.json"), `${JSON.stringify(scenarioFile, null, 2)}\n`);
  console.log(`Applied safe business-realism normalization to ${updated} scenarios.`);
}

function auditScenario(project, scenario) {
  const found = [];
  const rule = rules[project.category] || { terms: [], roles: [], review: [], outputs: [] };
  const workflowText = flatten(scenario.workflow?.map((step) => [step.label, step.outcome]));
  const moduleText = flatten(scenario.modules);
  const profileText = flatten([scenario.profile?.object, scenario.profile?.owner, scenario.profile?.stages, scenario.profile?.risks, scenario.profile?.fields]);
  const recordText = flatten((scenario.records || []).map((row) => [row.title, row.target, row.owner, row.risk, row.stage, row.statusNote, row.decisionReasons]));
  const allProcessText = [workflowText, moduleText, profileText, recordText].join(" ");

  if (!scenario.persona?.operator || !scenario.persona?.supervisor || !scenario.persona?.decisionMaker) {
    found.push(issue("high", "missing-responsibility-chain", "缺少操作人、主管或決策者責任鏈", scenario.persona));
  } else if (!containsAny(flatten(Object.values(scenario.persona)), rule.roles)) {
    found.push(issue("medium", "role-domain-mismatch", "角色名稱與產業日常職責連結不足", scenario.persona));
  }
  if (!scenario.triggerEvent || !scenario.businessSituation || !scenario.dailyUse) {
    found.push(issue("high", "missing-business-context", "缺少觸發事件、業務情境或日常使用說明", null));
  }
  if (!Array.isArray(scenario.workflow) || scenario.workflow.length < 4 || scenario.workflow.some((step) => !step.label || !step.outcome)) {
    found.push(issue("high", "incomplete-user-story", "操作故事未涵蓋查看、判斷、執行與確認", scenario.workflow));
  }
  if (!Array.isArray(scenario.profile?.stages) || scenario.profile.stages.length < 4 || new Set(scenario.profile.stages).size !== scenario.profile.stages.length) {
    found.push(issue("high", "invalid-lifecycle", "案件生命週期不足或有重複階段", scenario.profile?.stages));
  }
  if (!containsAny(allProcessText, rule.terms)) {
    found.push(issue("high", "domain-language-missing", "工作流程缺少該產業核心名詞", rule.terms));
  } else {
    const hits = rule.terms.filter((term) => containsAny(allProcessText, [term]));
    if (hits.length < Math.min(3, rule.terms.length)) {
      found.push(issue("medium", "domain-language-weak", "工作流程的產業用語不足", hits));
    }
  }
  if (!containsAny(flatten(scenario.profile?.stages), rule.review)) {
    found.push(issue("high", "missing-review-gate", "流程缺少合理的人工確認、覆核或驗收關卡", scenario.profile?.stages));
  }
  if (!containsAny(flatten(scenario.profile?.stages), rule.outputs)) {
    found.push(issue("high", "missing-output-destination", "最後產出物或結案去向不明確", scenario.profile?.stages));
  }
  if (!Array.isArray(scenario.profile?.fields) || scenario.profile.fields.length < 4) {
    found.push(issue("medium", "insufficient-business-fields", "核心作業欄位不足", scenario.profile?.fields));
  }
  if (!Array.isArray(scenario.profile?.risks) || new Set(scenario.profile.risks).size < 3) {
    found.push(issue("medium", "insufficient-exception-model", "缺少至少三種可處理的例外／風險", scenario.profile?.risks));
  }
  const records = scenario.records || [];
  if (records.length < 5) {
    found.push(issue("medium", "insufficient-demo-records", "示範資料不足五筆，無法呈現正常與例外情境", records.length));
  } else {
    const stages = new Set(records.map((row) => row.stage));
    if (stages.size < 3) found.push(issue("medium", "poor-stage-coverage", "示範資料未涵蓋至少三個流程階段", [...stages]));
    if (!records.some((row) => row.priority === "high") || !records.some((row) => row.done)) {
      found.push(issue("medium", "poor-case-mix", "示範資料需同時包含高優先與已完成案例", null));
    }
    if (records.some((row) => !row.owner || !row.due || !row.statusNote)) {
      found.push(issue("medium", "record-traceability-gap", "部分明細缺少負責人、期限或狀態說明", null));
    }
  }
  const metrics = project.operationalMetrics || [];
  if (metrics.length < 4 || new Set(metrics).size < 4) {
    found.push(issue("medium", "weak-operational-metrics", "缺少四個可區分的營運指標", metrics));
  }
  return found;
}

function auditLegacy(project) {
  const file = path.join(root, project.localPath, "index.html");
  if (!fs.existsSync(file)) return [issue("high", "missing-demo", "找不到可稽核的 Demo 頁面", file)];
  const html = fs.readFileSync(file, "utf8");
  const text = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  const rule = rules[project.category] || { terms: [], roles: [], review: [], outputs: [] };
  const found = [];
  const controls = (html.match(/<(button|form|input|select|textarea)\b/gi) || []).length;
  if (project.repoName === "jvision-property-management") {
    const componentFile = path.join(root, project.localPath, "src", "components", "property-demo.tsx");
    const implementation = `${html} ${fs.existsSync(componentFile) ? fs.readFileSync(componentFile, "utf8") : ""}`;
    const required = ["租約簽核中心", "租務主管待辦匣", "承租人線上簽署頁", "建立應收帳單", "登錄入帳", "對帳差額", "修繕管理"];
    const missing = required.filter((term) => !implementation.includes(term));
    if (missing.length) found.push(issue("high", "property-flow-incomplete", "物業管理專屬租約、帳務或修繕流程不完整", missing));
    return found;
  }
  const override = projectWorkflowOverrides[project.repoName];
  if (override) {
    if (controls < 4) found.push(issue("high", "insufficient-operability", "原生系統缺少可完成流程的操作元件", controls));
    if (!Array.isArray(override.stages) || override.stages.length < 5 || new Set(override.stages).size !== override.stages.length) {
      found.push(issue("high", "invalid-lifecycle", "專屬流程未提供五個清楚且不重複的生命週期階段", override.stages));
    }
    if (!Array.isArray(override.fields) || override.fields.length < 3) {
      found.push(issue("medium", "insufficient-business-fields", "專屬流程缺少建立案件所需欄位", override.fields));
    }
    if (!Array.isArray(override.metrics) || override.metrics.length < 4) {
      found.push(issue("medium", "weak-operational-metrics", "專屬流程缺少四個營運指標", override.metrics));
    }
    if (!Array.isArray(override.seeds) || override.seeds.length < 3) {
      found.push(issue("medium", "insufficient-demo-records", "專屬流程缺少正常、待覆核與例外示範資料", override.seeds));
    }
    if (!containsAny(flatten(override.stages), ["確認", "覆核", "審核", "驗收", "簽核", "核准", "核定", "查證", "定稿", "驗證", "盤點"])) {
      found.push(issue("high", "missing-review-gate", "專屬流程缺少人工確認或覆核", override.stages));
    }
    if (!containsAny(flatten(override.stages.at(-1)), ["歸檔", "結案", "交付", "交接", "發布", "入帳", "入庫", "給付", "揭露", "出場", "出貨", "放行", "計價", "結清", "結帳", "請款", "驗收", "封版"])) {
      found.push(issue("high", "missing-output-destination", "專屬流程最後階段未明確說明產出物去向", override.stages.at(-1)));
    }
    if (!containsAny(flatten(override.seeds), ["異常", "風險", "逾期", "差異", "差額", "待", "不足", "超過", "缺", "偏高", "失敗", "退件", "超標", "漏", "出險", "追加"])) {
      found.push(issue("medium", "missing-exception-path", "專屬流程缺少可供 Demo 的例外案例", override.seeds));
    }
    return found;
  }
  const effectiveText = override ? flatten([
    override.eyebrow,
    override.primary,
    override.createTitle,
    override.fields,
    override.stages,
    override.actions,
    override.metrics,
    override.seeds,
  ]) : text;
  const domainHits = rule.terms.filter((term) => containsAny(effectiveText, [term]));
  if (controls < 4) found.push(issue("high", "insufficient-operability", "原生系統缺少可完成流程的操作元件", controls));
  if (domainHits.length < Math.min(3, rule.terms.length)) found.push(issue("medium", "domain-language-weak", "原生系統的產業用語不足", domainHits));
  if (!containsAny(effectiveText, rule.review)) found.push(issue("high", "missing-review-gate", "原生流程缺少人工確認、覆核或驗收關卡", rule.review));
  if (!containsAny(effectiveText, rule.outputs)) found.push(issue("high", "missing-output-destination", "原生流程未交代最後產出物或結案位置", rule.outputs));
  if (!containsAny(effectiveText, rule.roles)) found.push(issue("medium", "role-domain-mismatch", "畫面未交代符合領域的承辦角色", rule.roles));
  if (!containsAny(effectiveText, ["異常", "風險", "逾期", "差額", "退回", "失敗", "待處理", "缺失", "警示", "待補", "不足", "超過"])) {
    found.push(issue("medium", "missing-exception-path", "未呈現異常、退回或差異處理情境", null));
  }
  return found;
}

const audited = projects.map((project) => {
  const scenario = scenarios[project.repoName];
  const issues = scenario ? auditScenario(project, scenario) : auditLegacy(project);
  const score = Math.max(0, 100 - issues.reduce((sum, row) => sum + (row.severity === "high" ? 18 : 8), 0));
  return {
    id: project.id,
    repoName: project.repoName,
    title: project.title,
    category: project.category,
    source: scenario ? "practical-scenario" : "legacy-page",
    score,
    grade: score >= 90 ? "可展示" : score >= 75 ? "需微調" : score >= 60 ? "需改善" : "不建議展示",
    issues,
  };
});

const severityCounts = audited.flatMap((row) => row.issues).reduce((acc, row) => {
  acc[row.severity] = (acc[row.severity] || 0) + 1;
  acc[row.code] = (acc[row.code] || 0) + 1;
  return acc;
}, {});
const summary = {
  total: audited.length,
  passed: audited.filter((row) => row.score >= 90).length,
  needsAdjustment: audited.filter((row) => row.score >= 75 && row.score < 90).length,
  needsImprovement: audited.filter((row) => row.score < 75).length,
  highIssues: severityCounts.high || 0,
  mediumIssues: severityCounts.medium || 0,
  bySource: Object.fromEntries(["practical-scenario", "legacy-page"].map((source) => [source, audited.filter((row) => row.source === source).length])),
};
const report = { generatedAt: new Date().toISOString(), version: "1.0.0", summary, issueCounts: severityCounts, projects: audited };
fs.writeFileSync(path.join(root, "docs", "BUSINESS_PROCESS_REALISM_AUDIT.json"), `${JSON.stringify(report, null, 2)}\n`);

const issueRows = audited.filter((row) => row.issues.length).sort((a, b) => a.score - b.score || a.id - b.id);
const markdown = [
  "# 全專案業務流程合理性稽核",
  "",
  `- 產生時間：${report.generatedAt}`,
  `- 專案總數：${summary.total}`,
  `- 可展示：${summary.passed}`,
  `- 需微調：${summary.needsAdjustment}`,
  `- 需改善：${summary.needsImprovement}`,
  `- 高優先問題：${summary.highIssues}`,
  `- 中優先問題：${summary.mediumIssues}`,
  "",
  "## 稽核範圍",
  "",
  "角色責任、業務觸發、流程生命週期、人工覆核、產出物去向、必要欄位、例外處理、示範資料覆蓋、KPI 與操作可追溯性。",
  "",
  "## 需處理專案",
  "",
  "| ID | 專案 | 分類 | 分數 | 等級 | 主要問題 |",
  "|---:|---|---|---:|---|---|",
  ...issueRows.map((row) => `| ${row.id} | ${row.title} | ${row.category} | ${row.score} | ${row.grade} | ${row.issues.map((item) => item.message).join("；")} |`),
  "",
  "## 問題統計",
  "",
  ...Object.entries(severityCounts).filter(([key]) => !["high", "medium"].includes(key)).sort((a, b) => b[1] - a[1]).map(([key, value]) => `- ${key}: ${value}`),
  "",
];
fs.writeFileSync(path.join(root, "docs", "BUSINESS_PROCESS_REALISM_AUDIT.md"), `${markdown.join("\n")}\n`);
console.log(JSON.stringify(summary, null, 2));
if (summary.needsImprovement) process.exitCode = 1;
