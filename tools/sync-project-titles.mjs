import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const indexPath = path.join(root, "projects-index.json");
const catalog = JSON.parse(fs.readFileSync(indexPath, "utf8"));

function readDemoConfig(project) {
  const file = path.join(root, "demos", project.repoName, "index.html");
  if (!fs.existsSync(file)) return null;
  const html = fs.readFileSync(file, "utf8");
  const match = html.match(/window\.DEMO_CONFIG\s*=\s*(\{[\s\S]*?\});\s*window\.SYSTEM_PRESET/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

let updated = 0;
const unresolved = [];
for (const project of catalog.projects) {
  if (project.title?.trim()) continue;
  const config = readDemoConfig(project);
  const title = config?.originalName?.trim() || config?.name?.trim();
  if (!title) {
    unresolved.push(project.repoName);
    continue;
  }
  project.title = title;
  updated++;
}

catalog.generatedAt = new Date().toISOString();
fs.writeFileSync(indexPath, `${JSON.stringify(catalog, null, 2)}\n`);
console.log(JSON.stringify({ total: catalog.projects.length, updated, unresolved }, null, 2));
if (unresolved.length) process.exitCode = 1;
