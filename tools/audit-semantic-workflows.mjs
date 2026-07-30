import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { projectWorkflowOverrides } from "../shared/jvision-project-workflows.js";
import { resolveSemanticWorkflow } from "../shared/jvision-semantic-workflows.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const projects = JSON.parse(fs.readFileSync(path.join(root, "projects-index.json"), "utf8")).projects;

const regressions = new Map([
  ["jvision-ai-case-038-returns-aftercare", ["申請受理", "商品驗收", "退款／換貨"]],
  ["jvision-ai-case-039-member-segmentation", ["受眾定義", "推播執行", "成效回收"]],
  ["jvision-ai-case-047-medical-supply-expiry", ["批號建檔", "效期預警", "報廢／退供歸檔"]],
  ["jvision-ai-case-024-real-estate-crm", ["潛在客戶", "方案報價", "成交交接"]],
  ["jvision-smart-mfg-267-iam", ["申請提出", "權限檢核", "複核／停用"]],
]);

const rows = projects.map((project) => {
  const key = project.repoName;
  const workflow = projectWorkflowOverrides[key] || resolveSemanticWorkflow(project);
  const errors = [];
  if (!workflow?.primary || /^(任務|事項|案件)$/.test(workflow.primary)) errors.push("主體用語過度通用");
  if (!Array.isArray(workflow?.fields) || workflow.fields.length < 3) errors.push("輸入欄位不足");
  if (!Array.isArray(workflow?.stages) || workflow.stages.length !== 5) errors.push("流程階段不是 5 階段");
  if (new Set(workflow?.stages || []).size !== (workflow?.stages || []).length) errors.push("流程階段重複");
  if (!Array.isArray(workflow?.actions) || workflow.actions.length < 5) errors.push("操作動作不足");
  if (!Array.isArray(workflow?.metrics) || workflow.metrics.length < 4) errors.push("營運指標不足");
  const serialized = JSON.stringify(workflow);
  if (serialized.includes("確認確認")) errors.push("發現重複動詞");
  for (const token of regressions.get(key) || []) {
    if (!serialized.includes(token)) errors.push(`缺少必要領域流程：${token}`);
  }
  return { project: key, title: project.title, source: projectWorkflowOverrides[key] ? "override" : "semantic", errors };
});

const failed = rows.filter((row) => row.errors.length);
const report = {
  generatedAt: new Date().toISOString(),
  total: rows.length,
  passed: rows.length - failed.length,
  failed: failed.length,
  failures: failed,
};
fs.writeFileSync(path.join(root, "docs", "SEMANTIC_WORKFLOW_AUDIT.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(`Semantic workflows: ${report.passed}/${report.total} passed, ${report.failed} failed`);
for (const row of failed.slice(0, 20)) console.log(`- ${row.project}: ${row.errors.join("；")}`);
if (failed.length) process.exitCode = 1;
