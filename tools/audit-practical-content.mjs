import fs from "node:fs";
import path from "node:path";
import { CATEGORY_PROFILES, CONTENT_VERSION, createScenario } from "./practical-scenario-model.mjs";

const root = path.resolve(import.meta.dirname, "..");
const catalog = JSON.parse(fs.readFileSync(path.join(root, "projects-index.json"), "utf8"));
const registry = JSON.parse(fs.readFileSync(path.join(root, "content", "practical-scenarios.json"), "utf8"));
const requiredCatalogFields = ["businessSituation", "primaryUser", "dailyUse", "operationalMetrics", "contentDepth"];
const bannedPatterns = [
  /\bD\+\d+\b/i,
  /^(工單|任務|案件|項目|對象|產線)\s*\d+$/,
  /資料分散、人工追蹤/,
  /平均 AI 分數/,
];
const failures = [];

if (catalog.projects.length !== 464) failures.push(`Catalog expected 464 projects, found ${catalog.projects.length}.`);
if (registry.contentVersion !== CONTENT_VERSION) failures.push("Scenario registry content version mismatch.");
if (Object.keys(CATEGORY_PROFILES).length !== 29) failures.push(`Expected 29 category profiles, found ${Object.keys(CATEGORY_PROFILES).length}.`);

for (const project of catalog.projects) {
  for (const field of requiredCatalogFields) {
    if (!project[field] || (Array.isArray(project[field]) && project[field].length < 1)) {
      failures.push(`${project.repoName}: missing catalog field ${field}.`);
    }
  }
  const shouldBeFull = Number(project.id) >= 1001 && Number(project.id) <= 1400;
  if (project.contentDepth !== (shouldBeFull ? "full-scenario" : "catalog-only")) {
    failures.push(`${project.repoName}: invalid contentDepth ${project.contentDepth}.`);
  }
  if (!shouldBeFull) continue;

  const scenario = registry.scenarios[project.repoName];
  if (!scenario) {
    failures.push(`${project.repoName}: missing scenario.`);
    continue;
  }
  if (scenario.records?.length < 8) failures.push(`${project.repoName}: requires at least 8 records.`);
  if (scenario.exceptions?.length < 2) failures.push(`${project.repoName}: requires at least 2 exceptions.`);
  if (scenario.metrics?.length < 3 || scenario.metrics.length > 5) failures.push(`${project.repoName}: requires 3-5 metrics.`);
  if (scenario.decisionRules?.length < 3) failures.push(`${project.repoName}: requires decision rules.`);
  if (scenario.guidedSteps?.length !== 4) failures.push(`${project.repoName}: requires four guided steps.`);
  if (!scenario.disclaimer?.includes("擬真示範")) failures.push(`${project.repoName}: missing simulation disclaimer.`);

  for (const record of scenario.records || []) {
    for (const value of [record.title, record.target, record.due, record.owner]) {
      if (bannedPatterns.some((pattern) => pattern.test(String(value)))) {
        failures.push(`${project.repoName}: banned placeholder content "${value}".`);
      }
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(record.due)) failures.push(`${project.repoName}: invalid absolute date ${record.due}.`);
    if (!Array.isArray(record.decisionReasons) || record.decisionReasons.length < 3) failures.push(`${project.repoName}: record ${record.id} lacks decision reasons.`);
  }

  const recreated = createScenario(project);
  if (JSON.stringify(recreated) !== JSON.stringify(scenario)) failures.push(`${project.repoName}: scenario generation is not deterministic.`);

  const projectDir = path.join(root, "demos", project.repoName);
  const staticHtml = fs.readFileSync(path.join(projectDir, "index.html"), "utf8");
  const runtime = fs.readFileSync(path.join(projectDir, "app.js"), "utf8");
  const nextRuntime = fs.readFileSync(path.join(projectDir, "public", "demo-app.js"), "utf8");
  if (!staticHtml.includes(`"contentVersion":"${CONTENT_VERSION}"`)) failures.push(`${project.repoName}: static config not updated.`);
  if (!runtime.includes("JVISION_PRACTICAL_WORKFLOW_V1") || !nextRuntime.includes("JVISION_PRACTICAL_WORKFLOW_V1")) {
    failures.push(`${project.repoName}: practical workflow runtime missing.`);
  }
  if (runtime.includes("Math.random()") || nextRuntime.includes("Math.random()")) failures.push(`${project.repoName}: random workflow logic remains.`);
}

const descriptions = new Map();
for (const project of catalog.projects) {
  const key = project.description;
  descriptions.set(key, [...(descriptions.get(key) || []), project.repoName]);
}
const duplicateDescriptions = [...descriptions.values()].filter((repos) => repos.length > 1);
if (duplicateDescriptions.length) failures.push(`${duplicateDescriptions.length} duplicate catalog description group(s) found.`);

const summary = {
  catalogProjects: catalog.projects.length,
  categoryProfiles: Object.keys(CATEGORY_PROFILES).length,
  fullScenarios: Object.keys(registry.scenarios).length,
  uniqueDescriptions: descriptions.size,
  failures: failures.length,
};

console.log(JSON.stringify(summary, null, 2));
if (failures.length) {
  console.error(failures.slice(0, 100).join("\n"));
  process.exitCode = 1;
}
