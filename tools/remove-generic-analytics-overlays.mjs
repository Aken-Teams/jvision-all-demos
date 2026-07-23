import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const demosRoot = path.join(root, "demos");
const legacyManifest = JSON.parse(
  fs.readFileSync(path.join(root, "docs", "LEGACY_NEXT_PROJECTS.json"), "utf8")
);
const legacyStaticShells = new Set(
  (legacyManifest.projects || [])
    .map((project) => project.repoName)
    .filter((repoName) => repoName !== "jvision-temple-management")
);
const overlayName = /jvision-(?:analytics|dynamic-charts)\.(?:css|js)/i;
const textExtensions = new Set([".js", ".jsx", ".ts", ".tsx", ".html"]);

function listFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  const result = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...listFiles(target));
    else if (textExtensions.has(path.extname(entry.name))) result.push(target);
  }
  return result;
}

function removeReferences(source) {
  return source
    .replace(/^[ \t]*import\s+["'][^"']*jvision-(?:analytics|dynamic-charts)\.css[^"']*["'];?\s*\r?\n/gim, "")
    .replace(/\s*<link\b[^>]*jvision-(?:analytics|dynamic-charts)\.css[^>]*\/?>/gi, "")
    .replace(/\s*<script\b[^>]*jvision-(?:analytics|dynamic-charts)\.js[^>]*>\s*<\/script>/gi, "")
    .replace(/\s*<script\b[^>]*jvision-(?:analytics|dynamic-charts)\.js[^>]*\/>/gi, "");
}

const projects = fs.readdirSync(demosRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory());
const changed = [];
const unchanged = [];
const remaining = [];

for (const project of projects) {
  const projectRoot = path.join(demosRoot, project.name);
  const candidates = [
    ...(legacyStaticShells.has(project.name) ? [] : [path.join(projectRoot, "index.html")]),
    ...listFiles(path.join(projectRoot, "src", "app"))
  ];
  let projectChanges = 0;

  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    const before = fs.readFileSync(file, "utf8");
    if (!overlayName.test(before)) continue;
    const after = removeReferences(before);
    if (after !== before) {
      fs.writeFileSync(file, after);
      projectChanges += 1;
    }
    if (overlayName.test(after)) {
      remaining.push(path.relative(root, file).replaceAll("\\", "/"));
    }
  }

  if (projectChanges) changed.push({ repoName: project.name, files: projectChanges });
  else unchanged.push(project.name);
}

const summary = {
  generatedAt: new Date().toISOString(),
  totalProjects: projects.length,
  changedProjects: changed.length,
  changedFiles: changed.reduce((sum, item) => sum + item.files, 0),
  unchangedProjects: unchanged.length,
  remainingReferences: remaining
};

fs.writeFileSync(
  path.join(root, "docs", "GENERIC_ANALYTICS_REMOVAL_REPORT.json"),
  `${JSON.stringify({ ...summary, changed, unchanged }, null, 2)}\n`
);

console.log(JSON.stringify(summary, null, 2));
if (remaining.length) process.exitCode = 1;
