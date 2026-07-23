import fs from "node:fs";
import path from "node:path";
import { CONTENT_VERSION, createCatalogContent, createScenario } from "./practical-scenario-model.mjs";

const root = path.resolve(import.meta.dirname, "..");
const catalogPath = path.join(root, "projects-index.json");
const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
const runtime = fs.readFileSync(path.join(root, "shared", "practical-workflow-runtime.js"), "utf8").trim();
const generated = catalog.projects.filter((project) => Number(project.id) >= 1001 && Number(project.id) <= 1400);

if (generated.length !== 400) {
  throw new Error(`Expected 400 generated projects, found ${generated.length}.`);
}

const scenarioRegistry = {};
for (const project of catalog.projects) {
  const content = createCatalogContent(project);
  Object.assign(project, content, {
    contentDepth: generated.includes(project) ? "full-scenario" : "catalog-only",
    contentVersion: CONTENT_VERSION,
  });
}

function replaceJsonAssignment(source, expression, value, label) {
  const match = source.match(expression);
  if (!match) throw new Error(`Unable to find ${label}.`);
  return source.replace(expression, `${match[1]}${JSON.stringify(value)}${match[3]}`);
}

function injectRuntime(source) {
  source = source.replace(/\r\n/g, "\n");
  const practicalPattern = /\n*\/\/ JVISION_PRACTICAL_WORKFLOW_V1[\s\S]*?setupPracticalWorkflow\(\);\s*/m;
  const oldPattern = /\n*\/\/ JVISION_DISTINCT_FUNCTIONAL_MODULES[\s\S]*?setupDistinctFunctionalModules\(\);\s*/m;
  if (practicalPattern.test(source)) {
    source = source.replace(practicalPattern, `\n\n${runtime}\n\n`);
  } else if (oldPattern.test(source)) {
    source = source.replace(oldPattern, `\n\n${runtime}\n\n`);
  } else {
    const insertion = source.lastIndexOf("render();");
    if (insertion < 0) throw new Error("Unable to find runtime insertion point.");
    source = `${source.slice(0, insertion)}${runtime}\n\n${source.slice(insertion)}`;
  }
  return source
    .replace(/const storageKey = "jvision-industry-system-" \+ config\.id;/, `const storageKey = "jvision-practical-records:${CONTENT_VERSION}:" + config.id;`)
    .replace(/Math\.floor\(Math\.random\(\) \* 8\)/g, "0")
    .replace(/60 \+ Math\.floor\(Math\.random\(\) \* 30\)/g, "60 + (records.length % 30)")
    .replace(/due: "D\+3"/g, 'due: "2026-07-30"')
    .replaceAll("AI 分數：", "處理優先序：");
}

const changed = [];
for (const project of generated) {
  const scenario = createScenario(project);
  scenarioRegistry[project.repoName] = scenario;
  const demoConfig = {
    id: Number(project.id),
    caseNo: String(Number(project.id) - 1000).padStart(3, "0"),
    name: project.title,
    category: project.category,
    description: scenario.description,
    repoName: project.repoName,
    profile: scenario.profile,
    records: scenario.records,
    scenario,
  };

  const projectDir = path.join(root, "demos", project.repoName);
  const indexPath = path.join(projectDir, "index.html");
  let html = fs.readFileSync(indexPath, "utf8");
  html = replaceJsonAssignment(
    html,
    /(window\.DEMO_CONFIG\s*=\s*)(\{[\s\S]*?\})(;\s*window\.SYSTEM_PRESET)/,
    demoConfig,
    `${project.repoName} static DEMO_CONFIG`,
  );
  html = html.replace(/app\.js\?v=[^"']+/g, `app.js?v=${CONTENT_VERSION}`);
  fs.writeFileSync(indexPath, html.replace(/\r\n/g, "\n"), "utf8");

  const dataPath = path.join(projectDir, "app", "demo-data.js");
  let data = fs.readFileSync(dataPath, "utf8");
  data = replaceJsonAssignment(
    data,
    /(export const demoConfig\s*=\s*)(\{[^\n]*\})(;)/,
    demoConfig,
    `${project.repoName} Next demoConfig`,
  );
  data = data.replace(
    /(export const pageMetadata\s*=\s*)\{[^\n]*\}(;)/,
    `$1${JSON.stringify({ title: `${project.title}｜JVision 實務情境 Demo`, description: scenario.description })}$2`,
  );
  fs.writeFileSync(dataPath, data.replace(/\r\n/g, "\n"), "utf8");

  for (const relativePath of ["app.js", "public/demo-app.js"]) {
    const runtimePath = path.join(projectDir, relativePath);
    fs.writeFileSync(runtimePath, injectRuntime(fs.readFileSync(runtimePath, "utf8")), "utf8");
  }

  const pagePath = path.join(projectDir, "app", "page.js");
  let page = fs.readFileSync(pagePath, "utf8");
  page = page.replace(/demo-app\.js(?:\?[^"']*)?/g, `demo-app.js?v=${CONTENT_VERSION}`);
  fs.writeFileSync(pagePath, page.replace(/\r\n/g, "\n"), "utf8");
  changed.push(project.repoName);
}

catalog.generatedAt = new Date().toISOString();
catalog.contentVersion = CONTENT_VERSION;
fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");

const contentDir = path.join(root, "content");
fs.mkdirSync(contentDir, { recursive: true });
fs.writeFileSync(
  path.join(contentDir, "practical-scenarios.json"),
  `${JSON.stringify({ contentVersion: CONTENT_VERSION, generatedAt: catalog.generatedAt, scenarios: scenarioRegistry }, null, 2)}\n`,
  "utf8",
);

console.log(JSON.stringify({
  contentVersion: CONTENT_VERSION,
  catalogProjects: catalog.projects.length,
  fullScenarios: Object.keys(scenarioRegistry).length,
  updatedGeneratedProjects: changed.length,
}, null, 2));
