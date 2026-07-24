import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const file = path.join(root, "projects-index.json");
const catalog = JSON.parse(fs.readFileSync(file, "utf8"));
const updated = [];

for (const project of catalog.projects || []) {
  if (project.contentDepth === "full-scenario") continue;
  project.contentDepth = "full-scenario";
  project.contentVersion = project.contentVersion || "2026.07-client-demo-v1";
  updated.push({ id: project.id, repoName: project.repoName, category: project.category });
}

catalog.contentVersion = "2026.07-client-demo-v1";
fs.writeFileSync(file, `${JSON.stringify(catalog, null, 2)}\n`);
const summary = {
  generatedAt: new Date().toISOString(),
  total: catalog.projects?.length || 0,
  enabledNow: updated.length,
  fullScenario: catalog.projects?.filter(project => project.contentDepth === "full-scenario").length || 0
};
fs.writeFileSync(
  path.join(root, "docs", "CLIENT_DEMO_GUIDE_ENABLEMENT_REPORT.json"),
  `${JSON.stringify({ summary, updated }, null, 2)}\n`
);
console.log(JSON.stringify(summary, null, 2));
