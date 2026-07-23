import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const toolDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(toolDir, "..");
const sharedScript = fs.readFileSync(path.join(repoRoot, "shared", "jvision-legacy-task-filter.js"), "utf8");
const targetProjects = [
  "jvision-order-inventory",
  "jvision-lean-demo",
  "jvision-work-order-demo",
  "jvision-demo",
  "jvision-task-demo",
];
const scriptTag = '<script src="./jvision-legacy-task-filter.js?v=project-expert-20260722" defer></script>';
let updated = 0;

for (const repoName of targetProjects) {
  const directory = path.join(repoRoot, "demos", repoName);
  const scriptPath = path.join(directory, "jvision-legacy-task-filter.js");
  const indexPath = path.join(directory, "index.html");
  fs.writeFileSync(scriptPath, sharedScript, "utf8");
  const html = fs.readFileSync(indexPath, "utf8");
  const nextHtml = html.includes("jvision-legacy-task-filter.js")
    ? html
    : html.replace(/(<script\s+src="\.\/jvision-analytics\.js[^>]*><\/script>)/i, `${scriptTag}\n  $1`);
  if (nextHtml === html && !html.includes("jvision-legacy-task-filter.js")) {
    throw new Error(`Unable to find analytics script anchor in ${repoName}`);
  }
  fs.writeFileSync(indexPath, nextHtml, "utf8");
  updated += 1;
}

console.log(`Applied Project Expert search/filter enhancement to ${updated} project(s).`);
