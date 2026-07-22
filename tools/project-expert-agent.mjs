import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const toolDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(toolDir, "..");
const applySafeFixes = process.argv.includes("--apply-safe");
const projectsIndex = JSON.parse(fs.readFileSync(path.join(repoRoot, "projects-index.json"), "utf8"));
const mobileAuditPath = path.join(repoRoot, "docs", "MOBILE_ANALYTICS_AUDIT.json");
const formalAuditPath = path.join(repoRoot, "docs", "FORMAL_SITE_AUDIT.json");
const acceptanceAuditPath = path.join(repoRoot, "docs", "PROJECT_EXPERT_ACCEPTANCE_REPORT.json");
const outputJsonPath = path.join(repoRoot, "docs", "PROJECT_EXPERT_AGENT_REPORT.json");
const outputMarkdownPath = path.join(repoRoot, "docs", "PROJECT_EXPERT_AGENT_REPORT.md");
const briefDirectory = path.join(repoRoot, "docs", "project-expert");

const ignoredDirectories = new Set([".git", ".next", "node_modules", "_next", "_vercel", ".vercel", "coverage", "out"]);

function readJsonIfExists(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function hasFile(directory, relativePath) {
  return fs.existsSync(path.join(directory, relativePath));
}

function collectFiles(directory, limit = 140) {
  const collected = [];
  const queue = [directory];
  while (queue.length && collected.length < limit) {
    const current = queue.shift();
    let entries = [];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (collected.length >= limit) break;
      if (entry.isDirectory()) {
        if (!ignoredDirectories.has(entry.name)) queue.push(path.join(current, entry.name));
        continue;
      }
      if (/\.(?:html|css|js|jsx|ts|tsx|json|md)$/i.test(entry.name)) {
        collected.push(path.join(current, entry.name));
      }
    }
  }
  return collected;
}

function readEvidence(projectDirectory, acceptanceAudit) {
  const files = collectFiles(projectDirectory);
  const sourceFiles = files.filter((file) => !/\.(?:md|json)$/i.test(file));
  const source = sourceFiles.map((file) => {
    try {
      return fs.readFileSync(file, "utf8");
    } catch {
      return "";
    }
  }).join("\n");
  const text = source.toLowerCase();
  const includes = (pattern) => pattern.test(source);
  const count = (pattern) => (source.match(pattern) || []).length;
  const hasNext = hasFile(projectDirectory, "app/page.js") || hasFile(projectDirectory, "app/page.tsx") || hasFile(projectDirectory, "src/app/page.tsx") || hasFile(projectDirectory, "src/app/page.js");
  const hasStatic = hasFile(projectDirectory, "index.html");

  return {
    files: files.length,
    hasNext,
    hasStatic,
    hasReadme: hasFile(projectDirectory, "README.md"),
    hasPackage: hasFile(projectDirectory, "package.json"),
    hasAnalytics: hasFile(projectDirectory, "jvision-analytics.js") || hasFile(projectDirectory, "public/jvision-analytics.js"),
    hasRwdCss: hasFile(projectDirectory, "jvision-analytics.css") || hasFile(projectDirectory, "app/jvision-analytics.css") || hasFile(projectDirectory, "src/app/jvision-analytics.css"),
    hasMetadata: includes(/<meta[^>]+name=["']description["']/i) || includes(/description\s*:/i),
    hasWorkflowActions: count(/<button\b|<form\b|\bonclick\s*=|onClick\s*=/gi) >= 3,
    hasInputs: includes(/<input\b|<select\b|<textarea\b/i),
    hasDataViews: includes(/<table\b|jv-data-table|chart|analytics|metrics|kpi/i),
    hasPersistence: includes(/localStorage|sessionStorage|indexedDB|useState\s*\(/i),
    hasFeedback: includes(/aria-live|role=["']alert|toast|empty-state|empty state|錯誤|載入失敗|重試/i),
    hasAccessibleNames: includes(/aria-label|aria-labelledby|<label\b/i),
    hasTests: Boolean(acceptanceAudit?.passed) || files.some((file) => /(?:test|spec)\.(?:js|jsx|ts|tsx)$/i.test(file)),
    buttonCount: count(/<button\b|\bonClick\s*=/gi),
    sourceSize: source.length,
    sourceText: text,
  };
}

function requirementProfile(category) {
  const base = [
    "可操作的核心工作流程（建立、更新或完成一筆作業）",
    "可搜尋、篩選或聚焦待處理事項的工作清單",
    "可閱讀的 KPI、趨勢／階段統計與資料表",
    "成功、空資料與異常時的回饋狀態",
  ];
  const categorySpecific = {
    "製造與工程": ["工單／設備／品質的例外處理", "交期、品質、成本或設備風險的預警"],
    "金融與保險": ["案件、權限與審核軌跡", "風險／法遵條件與可追溯的決策紀錄"],
    "教育與照護": ["個案或學習歷程追蹤", "個資最小揭露與服務進度提醒"],
    "交通與車輛": ["派遣或路線狀態更新", "安全、延誤與維護事件預警"],
    "零售與服務": ["訂單／會員／庫存或預約作業", "服務異常與營收機會追蹤"],
    "ESG 與永續": ["資料來源、計算依據與查核追溯", "缺值、超標與改善任務追蹤"],
    "協作與管理": ["任務責任人、期限與交付追蹤", "跨部門阻塞與優先級管理"],
  };
  return [...base, ...(categorySpecific[category] || ["角色權限與跨部門協作", "可追溯的營運改善流程"])];
}

function makeRecommendation({ id, priority, title, evidence, suggestion, autoFix = null }) {
  return { id, priority, title, evidence, suggestion, autoFix };
}

function projectReview(project, mobileAuditByRepo, formalAuditByRepo, acceptanceByRepo) {
  const directory = path.join(repoRoot, project.localPath || `demos/${project.repoName}`);
  const mobileAudit = mobileAuditByRepo.get(project.repoName);
  const formalAudit = formalAuditByRepo.get(project.repoName);
  const acceptanceAudit = acceptanceByRepo.get(project.repoName);
  const evidence = readEvidence(directory, acceptanceAudit);
  const recommendations = [];
  let score = 0;

  const mobilePassed = Boolean(mobileAudit?.passed);
  const formalPassed = formalAudit ? formalAudit.status !== "failed" && formalAudit.status !== "review" : true;
  if (mobilePassed) score += 25;
  else recommendations.push(makeRecommendation({
    id: "mobile-rwd",
    priority: "critical",
    title: "修復手機 RWD 與統計可用性",
    evidence: mobileAudit?.reasons?.join("；") || "尚未找到手機稽核證據。",
    suggestion: "重新套用共用 RWD／統計層，並以 375px、812px 橫向及 1440px 重跑瀏覽器驗收。",
    autoFix: "apply-responsive-analytics",
  }));

  if (formalPassed) score += 10;
  else recommendations.push(makeRecommendation({
    id: "formal-visual",
    priority: "high",
    title: "改善正式 SaaS 視覺與可讀性",
    evidence: formalAudit?.reasons?.join("；") || "正式版面稽核需要複查。",
    suggestion: "依設計系統調整對比、留白、字級與關鍵行動區，並重新檢查溢位與執行錯誤。",
  }));

  if (evidence.hasWorkflowActions) score += 14;
  else recommendations.push(makeRecommendation({
    id: "core-workflow",
    priority: "high",
    title: "補齊核心工作流程",
    evidence: `僅偵測到 ${evidence.buttonCount} 個可操作行為；未達最小工作流訊號。`,
    suggestion: `新增「建立／更新／完成」的一條端到端作業流程，並將其連到 ${requirementProfile(project.category)[0]}。`,
  }));

  if (evidence.hasInputs) score += 8;
  else recommendations.push(makeRecommendation({
    id: "search-filter",
    priority: "medium",
    title: "補齊搜尋或篩選入口",
    evidence: "未偵測到 input、select 或 textarea 控制項。",
    suggestion: "加入可依關鍵字、狀態或責任人篩選的清單入口，手機版保持 44px 觸控高度。",
    autoFix: "apply-project-expert-fixes",
  }));

  if (evidence.hasDataViews) score += 12;
  else recommendations.push(makeRecommendation({
    id: "analytics-view",
    priority: "high",
    title: "補齊可決策的資料視圖",
    evidence: "未偵測到資料表、KPI 或圖表訊號。",
    suggestion: "補上至少四項 KPI、一個趨勢／階段圖與可排序資料表；圖表需附文字或表格替代資訊。",
    autoFix: "apply-responsive-analytics",
  }));

  if (evidence.hasPersistence) score += 8;
  else recommendations.push(makeRecommendation({
    id: "draft-persistence",
    priority: "medium",
    title: "加入操作狀態保存",
    evidence: "未偵測到 localStorage、sessionStorage、IndexedDB 或前端狀態管理訊號。",
    suggestion: "為篩選、草稿或工作進度加入本機保存；儲存前應避免放入敏感個資。",
  }));

  if (evidence.hasFeedback) score += 8;
  else recommendations.push(makeRecommendation({
    id: "feedback-states",
    priority: "medium",
    title: "補齊成功、空資料與錯誤回饋",
    evidence: "未偵測到 aria-live、錯誤、重試或空狀態訊號。",
    suggestion: "對載入、提交成功、無資料與失敗提供就地回饋與明確復原動作。",
  }));

  if (evidence.hasAccessibleNames) score += 5;
  else recommendations.push(makeRecommendation({
    id: "accessible-controls",
    priority: "medium",
    title: "補強控制項無障礙名稱",
    evidence: "未偵測到 aria-label、aria-labelledby 或明確 label。",
    suggestion: "為圖示按鈕、輸入欄與動態區塊補上可讀名稱；不可只以顏色傳達狀態。",
  }));

  if (evidence.hasMetadata) score += 3;
  else recommendations.push(makeRecommendation({
    id: "metadata",
    priority: "low",
    title: "補上產品描述 metadata",
    evidence: "未偵測到 description metadata。",
    suggestion: "新增一句可說明使用者、痛點與 AI 價值的描述，提升索引與交接品質。",
  }));

  if (evidence.hasReadme) score += 2;
  else recommendations.push(makeRecommendation({
    id: "project-brief",
    priority: "low",
    title: "建立專案使用與驗收說明",
    evidence: "專案目錄缺少 README.md。",
    suggestion: "建立專案目的、主要流程、資料限制、啟動方式與驗收清單。",
    autoFix: "generate-project-brief",
  }));

  if (evidence.hasTests) score += 5;
  else recommendations.push(makeRecommendation({
    id: "acceptance-tests",
    priority: "medium",
    title: "建立最小驗收測試",
    evidence: "未偵測到 test/spec 檔案。",
    suggestion: "至少覆蓋首頁載入、核心操作、統計表顯示及手機尺寸的驗收情境。",
  }));

  const completion = Math.max(0, Math.min(100, score));
  const hasBlockingFinding = recommendations.some((item) => item.priority === "critical" || item.priority === "high");
  const hasStrengtheningFinding = recommendations.some((item) => item.priority === "medium") || completion < 97;
  return {
    id: Number(project.id),
    repoName: project.repoName,
    title: project.title || project.repoName,
    category: project.category || project.industry || "未分類",
    demoUrl: project.demoUrl,
    localPath: project.localPath,
    score: completion,
    grade: hasBlockingFinding || completion < 65 ? "優先改善" : hasStrengtheningFinding ? "可強化" : "完整",
    requiredCapabilities: requirementProfile(project.category),
    evidence: {
      mobilePassed,
      formalPassed,
      hasNext: evidence.hasNext,
      hasStatic: evidence.hasStatic,
      hasWorkflowActions: evidence.hasWorkflowActions,
      hasInputs: evidence.hasInputs,
      hasDataViews: evidence.hasDataViews,
      hasPersistence: evidence.hasPersistence,
      hasFeedback: evidence.hasFeedback,
      hasAccessibleNames: evidence.hasAccessibleNames,
      hasReadme: evidence.hasReadme,
      hasTests: evidence.hasTests,
      acceptancePassed: Boolean(acceptanceAudit?.passed),
    },
    recommendations: recommendations.sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      return order[a.priority] - order[b.priority] || a.title.localeCompare(b.title, "zh-Hant");
    }),
  };
}

function buildBrief(review) {
  const actions = review.recommendations.length
    ? review.recommendations.map((item) => `- [ ] **${item.priority.toUpperCase()}｜${item.title}**：${item.suggestion}`).join("\n")
    : "- [x] 目前自動稽核未偵測到基線缺口；仍建議由產業使用者驗證真實流程。";
  return `# ${review.title}｜專案專家審視摘要\n\n- 專案：\`${review.repoName}\`\n- 分類：${review.category}\n- 完整度：${review.score}/100（${review.grade}）\n- 產生時間：${new Date().toISOString()}\n\n## 建議能力基線\n\n${review.requiredCapabilities.map((item) => `- ${item}`).join("\n")}\n\n## 待辦改善建議\n\n${actions}\n\n## 自動化驗收證據\n\n- 手機 RWD 與統計：${review.evidence.mobilePassed ? "通過" : "需修正"}\n- 正式 SaaS 版面：${review.evidence.formalPassed ? "通過" : "需複查"}\n- 操作工作流訊號：${review.evidence.hasWorkflowActions ? "已偵測" : "未偵測"}\n- 可篩選輸入：${review.evidence.hasInputs ? "已偵測" : "未偵測"}\n- 資料視圖：${review.evidence.hasDataViews ? "已偵測" : "未偵測"}\n- 狀態保存：${review.evidence.hasPersistence ? "已偵測" : "未偵測"}\n- 回饋狀態：${review.evidence.hasFeedback ? "已偵測" : "未偵測"}\n\n> 本文件由 Project Expert Agent 自動產出。涉及權限、個資、金流、醫療或法遵規則的變更，須由領域負責人審核後再實作。\n`;
}

const mobileAudit = readJsonIfExists(mobileAuditPath);
const formalAudit = readJsonIfExists(formalAuditPath);
const acceptanceAudit = readJsonIfExists(acceptanceAuditPath);
const mobileAuditByRepo = new Map((mobileAudit?.rows || []).map((row) => [row.repoName, row]));
const formalAuditByRepo = new Map((formalAudit?.rows || []).map((row) => [row.repoName, row]));
const acceptanceByRepo = new Map((acceptanceAudit?.rows || []).map((row) => [row.repoName, row]));
const reviews = projectsIndex.projects
  .map((project) => projectReview(project, mobileAuditByRepo, formalAuditByRepo, acceptanceByRepo))
  .sort((a, b) => a.score - b.score || a.id - b.id);

const priorityCounts = { critical: 0, high: 0, medium: 0, low: 0 };
for (const review of reviews) {
  for (const recommendation of review.recommendations) priorityCounts[recommendation.priority] += 1;
}

let generatedBriefs = 0;
if (applySafeFixes) {
  fs.mkdirSync(briefDirectory, { recursive: true });
  for (const review of reviews) {
    const filePath = path.join(briefDirectory, `${review.repoName}.md`);
    fs.writeFileSync(filePath, buildBrief(review), "utf8");
    generatedBriefs += 1;
  }
}

const summary = {
  totalProjects: reviews.length,
  averageScore: Number((reviews.reduce((sum, review) => sum + review.score, 0) / Math.max(reviews.length, 1)).toFixed(1)),
  complete: reviews.filter((review) => review.grade === "完整").length,
  strengthen: reviews.filter((review) => review.grade === "可強化").length,
  priorityImprovement: reviews.filter((review) => review.grade === "優先改善").length,
  priorityCounts,
  safeFixesApplied: { generatedBriefs, responsiveAnalyticsRepairNeeded: reviews.some((review) => !review.evidence.mobilePassed) },
};

const report = {
  generatedAt: new Date().toISOString(),
  agent: {
    name: "JVision Project Expert Agent",
    version: "1.0.0",
    mode: applySafeFixes ? "analyze-and-apply-safe" : "analyze-only",
    policy: "自動修正僅限低風險的說明、RWD 與統計基線；業務邏輯、權限與敏感資料流程僅提出建議。",
  },
  summary,
  reviews,
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
const markdown = [
  "# JVision Project Expert Agent 審視報告",
  "",
  `- 產生時間：${report.generatedAt}`,
  `- Agent 模式：${report.agent.mode}`,
  `- 專案數：${summary.totalProjects}`,
  `- 平均完整度：${summary.averageScore}/100`,
  `- 完整：${summary.complete}；可強化：${summary.strengthen}；優先改善：${summary.priorityImprovement}`,
  `- 建議優先度：Critical ${priorityCounts.critical} / High ${priorityCounts.high} / Medium ${priorityCounts.medium} / Low ${priorityCounts.low}`,
  `- 已生成專案改善摘要：${generatedBriefs}`,
  "",
  "## 優先改善清單（前 50 項）",
  "",
  "| 專案 | 分數 | 狀態 | 最高優先建議 |",
  "|---|---:|---|---|",
  ...reviews.slice(0, 50).map((review) => `| ${review.title} (${review.repoName}) | ${review.score} | ${review.grade} | ${review.recommendations[0]?.title || "基線通過"} |`),
  "",
  "## 執行方式",
  "",
  "```powershell",
  "npm run agent:project-expert",
  "npm run agent:project-expert:apply-safe",
  "npm run apply:project-expert-fixes",
  "```",
  "",
].join("\n");
fs.writeFileSync(outputMarkdownPath, markdown, "utf8");
console.log(JSON.stringify(summary, null, 2));
