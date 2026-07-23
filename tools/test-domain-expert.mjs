import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const toolDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(toolDir, "..");
const projects = JSON.parse(fs.readFileSync(path.join(repoRoot, "projects-index.json"), "utf8")).projects;
const runtimeCatalog = JSON.parse(fs.readFileSync(path.join(repoRoot, "docs", "DOMAIN_EXPERT_CATALOG.json"), "utf8"));
const missing = [];

for (const project of projects) {
  const htmlPath = path.join(repoRoot, project.localPath, "index.html");
  const briefPath = path.join(repoRoot, "docs", "project-expert", `${project.repoName}.md`);
  const review = runtimeCatalog.projects?.[project.repoName];
  const html = fs.existsSync(htmlPath) ? fs.readFileSync(htmlPath, "utf8") : "";
  const brief = fs.existsSync(briefPath) ? fs.readFileSync(briefPath, "utf8") : "";
  const checks = {
    frontendHidden: !html.includes("jvision-domain-expert.js") && !html.includes("jvision-domain-expert.css"),
    catalog: Boolean(review?.expert?.role) && Array.isArray(review?.next) && review.next.length >= 3,
    safeChange: Array.isArray(review?.applied) && review.applied.some((item) => item.execution === "auto-applied"),
    brief: brief.includes("領域專家") && brief.includes("下一步建議") && brief.includes("不顯示前台"),
  };
  if (Object.values(checks).some((passed) => !passed)) missing.push({ repoName: project.repoName, checks });
}

const result = {
  total: projects.length,
  passed: projects.length - missing.length,
  failed: missing.length,
  policy: "Domain expert reviews are internal documents and must not be loaded in the Demo frontend.",
  missing,
};
console.log(JSON.stringify(result, null, 2));
if (missing.length) process.exitCode = 1;
