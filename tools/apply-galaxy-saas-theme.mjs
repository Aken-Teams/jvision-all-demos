import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const toolDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(toolDir, "..");
const index = JSON.parse(fs.readFileSync(path.join(repoRoot, "projects-index.json"), "utf8"));
const sharedCss = fs.readFileSync(path.join(repoRoot, "shared", "jvision-galaxy-saas.css"), "utf8").trim();
const sourceStart = "/* JVISION_GALAXY_SAAS_START */";
const sourceEnd = "/* JVISION_GALAXY_SAAS_END */";
const styleVersion = "galaxy-bright-20260722";

const galaxySources = [
  {
    type: "Buttons",
    source: "https://github.com/uiverse-io/galaxy/tree/main/Buttons",
    adaptation: "明確主次操作、可見焦點環與輕量按壓回饋",
  },
  {
    type: "Cards",
    source: "https://github.com/uiverse-io/galaxy/tree/main/Cards",
    adaptation: "亮色資料卡、產業色上緣與一致的層級陰影",
  },
  {
    type: "Inputs",
    source: "https://github.com/uiverse-io/galaxy/tree/main/Inputs",
    adaptation: "可辨識的輸入邊框、44px 行動觸控高度與焦點狀態",
  },
];

const categoryStyles = {
  "生產製造": { family: "factory-command", label: "Factory Command" },
  "品質管理": { family: "factory-command", label: "Quality Command" },
  "物流運輸": { family: "supply-flow", label: "Supply Flow" },
  "倉儲物流": { family: "supply-flow", label: "Warehouse Flow" },
  "採購供應鏈": { family: "supply-flow", label: "Procurement Flow" },
  "交通運輸": { family: "field-route", label: "Field Route" },
  "設備維護": { family: "field-route", label: "Service Route" },
  "醫療照護": { family: "clinical-calm", label: "Clinical Calm" },
  "生活服務": { family: "clinical-calm", label: "Care Calm" },
  "教育": { family: "learning-studio", label: "Learning Studio" },
  "內容管理": { family: "learning-studio", label: "Content Studio" },
  "金融保險": { family: "trust-ledger", label: "Trust Ledger" },
  "財務會計": { family: "trust-ledger", label: "Finance Ledger" },
  "資訊安全": { family: "trust-ledger", label: "Secure Ledger" },
  "人力資源": { family: "people-workspace", label: "People Workspace" },
  "企業協作": { family: "people-workspace", label: "Collaboration Workspace" },
  "企業營運": { family: "people-workspace", label: "Operations Workspace" },
  "經營管理": { family: "people-workspace", label: "Management Workspace" },
  "業務銷售": { family: "revenue-lift", label: "Revenue Lift" },
  "零售電商": { family: "revenue-lift", label: "Commerce Lift" },
  "專業服務": { family: "revenue-lift", label: "Service Lift" },
  "客服管理": { family: "guest-delight", label: "Guest Delight" },
  "餐飲旅宿": { family: "guest-delight", label: "Hospitality Delight" },
  "研發管理": { family: "insight-lab", label: "Insight Lab" },
  "數據分析": { family: "insight-lab", label: "Data Insight Lab" },
  "資訊科技": { family: "insight-lab", label: "Technology Insight Lab" },
  "營建工程": { family: "site-blueprint", label: "Site Blueprint" },
  "ESG 永續": { family: "green-impact", label: "Green Impact" },
  "宗教服務": { family: "community-altar", label: "Community Altar" },
};

function bodyClasses(project) {
  const style = categoryStyles[project.category];
  if (!style) throw new Error(`No Galaxy style for category: ${project.category}`);
  return ["jv-galaxy-saas", `jv-galaxy-${style.family}`];
}

function addBodyClassesAndData(html, project) {
  const classes = bodyClasses(project);
  const style = categoryStyles[project.category];
  return html.replace(/<body([^>]*)>/i, (full, attributes) => {
    const classMatch = attributes.match(/\sclass=(['"])(.*?)\1/i);
    const existing = classMatch ? classMatch[2].split(/\s+/).filter(Boolean) : [];
    const nextClasses = [...new Set([...existing, ...classes])].join(" ");
    let nextAttributes = classMatch
      ? attributes.replace(classMatch[0], ` class=${classMatch[1]}${nextClasses}${classMatch[1]}`)
      : `${attributes} class="${nextClasses}"`;
    nextAttributes = nextAttributes
      .replace(/\sdata-jv-galaxy-style=(['"]).*?\1/gi, "")
      .replace(/\sdata-jv-galaxy-category=(['"]).*?\1/gi, "");
    return `<body${nextAttributes}>`;
  });
}

function addThemeLink(html) {
  const withoutOld = html.replace(/\s*<link[^>]+href=(['"])\.\/galaxy-saas\.css[^'"]*\1[^>]*\/?>/gi, "");
  const link = `  <link rel="stylesheet" href="./galaxy-saas.css?v=${styleVersion}" />`;
  if (!/<\/head>/i.test(withoutOld)) throw new Error("Document is missing a closing head tag");
  return withoutOld.replace(/<\/head>/i, `${link}\n</head>`);
}

function replaceGeneratedBlock(source, block) {
  const start = source.indexOf(sourceStart);
  const end = source.indexOf(sourceEnd);
  const clean = start >= 0 && end >= start
    ? `${source.slice(0, start).trimEnd()}${source.slice(end + sourceEnd.length)}`.trimEnd()
    : source.trimEnd();
  return `${clean}\n\n${block}\n`;
}

function updateGeneratedBodyClass(source, project) {
  const classes = bodyClasses(project).join(" ");
  return source.replace(/export const bodyClass = (["'])(.*?)\1;/, (full, quote, existing) => {
    const next = [...new Set([...existing.split(/\s+/).filter(Boolean), ...classes.split(" ")])].join(" ");
    return `export const bodyClass = ${quote}${next}${quote};`;
  });
}

function findLayoutPath(projectDir) {
  const candidates = ["src/app/layout.tsx", "src/app/layout.ts", "src/app/layout.jsx", "src/app/layout.js"];
  return candidates.map((relative) => path.join(projectDir, relative)).find((candidate) => fs.existsSync(candidate));
}

function addClassesToLayout(layout, project) {
  const classes = ["jvision-bright-saas", "jvision-next-legacy", ...bodyClasses(project)];
  if (/<body\s*>/i.test(layout)) {
    return layout.replace(/<body\s*>/i, `<body className="${classes.join(" ")}">`);
  }
  return layout.replace(/<body([^>]*?)className=(['"])(.*?)\2([^>]*)>/i, (full, before, quote, existing, after) => {
    const next = [...new Set([...existing.split(/\s+/).filter(Boolean), ...classes])].join(" ");
    return `<body${before}className=${quote}${next}${quote}${after}>`;
  });
}

function writeCssForNextSource(project, projectDir, block) {
  const generatedCssPaths = [path.join(projectDir, "styles.css"), path.join(projectDir, "app", "globals.css")];
  const legacyCssPath = path.join(projectDir, "src", "app", "globals.css");
  const cssPaths = generatedCssPaths.filter((cssPath) => fs.existsSync(cssPath));
  if (cssPaths.length === 2) {
    for (const cssPath of cssPaths) fs.writeFileSync(cssPath, replaceGeneratedBlock(fs.readFileSync(cssPath, "utf8"), block), "utf8");
    const dataPath = path.join(projectDir, "app", "demo-data.js");
    if (fs.existsSync(dataPath)) fs.writeFileSync(dataPath, updateGeneratedBodyClass(fs.readFileSync(dataPath, "utf8"), project), "utf8");
    return "generated";
  }
  if (fs.existsSync(legacyCssPath)) {
    fs.writeFileSync(legacyCssPath, replaceGeneratedBlock(fs.readFileSync(legacyCssPath, "utf8"), block), "utf8");
    const layoutPath = findLayoutPath(projectDir);
    if (!layoutPath) throw new Error(`Missing Next layout: ${project.repoName}`);
    fs.writeFileSync(layoutPath, addClassesToLayout(fs.readFileSync(layoutPath, "utf8"), project), "utf8");
    return "legacy-next";
  }
  return "static";
}

const cssBlock = `${sourceStart}\n${sharedCss}\n${sourceEnd}`;
const styleCounts = {};
const assignments = [];
let generatedSource = 0;
let legacyNextSource = 0;

for (const project of index.projects) {
  const style = categoryStyles[project.category];
  const projectDir = path.join(repoRoot, "demos", project.repoName);
  const indexPath = path.join(projectDir, "index.html");
  if (!fs.existsSync(indexPath)) throw new Error(`Missing index.html: ${project.repoName}`);

  const nextHtml = addThemeLink(addBodyClassesAndData(fs.readFileSync(indexPath, "utf8"), project));
  fs.writeFileSync(indexPath, nextHtml, "utf8");
  fs.writeFileSync(path.join(projectDir, "galaxy-saas.css"), `${sharedCss}\n`, "utf8");

  const sourceType = writeCssForNextSource(project, projectDir, cssBlock);
  if (sourceType === "generated") generatedSource += 1;
  if (sourceType === "legacy-next") legacyNextSource += 1;
  styleCounts[style.family] = (styleCounts[style.family] || 0) + 1;
  assignments.push({
    id: Number(project.id),
    repoName: project.repoName,
    title: project.title,
    category: project.category,
    family: style.family,
    label: style.label,
    runtime: project.runtime,
  });
}

const catalog = {
  generatedAt: new Date().toISOString(),
  total: assignments.length,
  source: {
    library: "Uiverse Galaxy",
    license: "MIT",
    implementation: "JVision adaptation; no third-party runtime scripts or global reset are injected.",
    components: galaxySources,
  },
  accessibility: {
    lightMode: true,
    focusRing: "3px visible focus ring",
    touchTarget: "44px minimum for interactive controls",
    reducedMotion: "Honors prefers-reduced-motion",
  },
  styleCounts,
  assignments,
};

fs.writeFileSync(
  path.join(repoRoot, "docs", "GALAXY_SAAS_STYLE_CATALOG.json"),
  `${JSON.stringify(catalog, null, 2)}\n`,
  "utf8",
);

console.log(JSON.stringify({
  total: index.projects.length,
  generatedSource,
  legacyNextSource,
  staticOnly: index.projects.length - generatedSource - legacyNextSource,
  styleCounts,
}, null, 2));
