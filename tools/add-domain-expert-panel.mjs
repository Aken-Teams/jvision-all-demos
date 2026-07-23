import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const toolDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(toolDir, "..");
const demosRoot = path.join(repoRoot, "demos");
const catalog = JSON.parse(fs.readFileSync(path.join(repoRoot, "projects-index.json"), "utf8"));
const marker = "jvision-domain-expert";
const runtimeCss = /\s*<link\b[^>]*\bhref=(['"])[^'"]*jvision-domain-expert\.css[^'"]*\1[^>]*>\s*/gi;
const runtimeScript = /\s*<script\b[^>]*\bsrc=(['"])[^'"]*jvision-domain-expert\.js[^'"]*\1[^>]*>\s*<\/script>\s*/gi;

let removed = 0;
let alreadyInternal = 0;
const missing = [];

for (const project of catalog.projects) {
  const indexPath = path.join(demosRoot, project.repoName, "index.html");
  if (!fs.existsSync(indexPath)) {
    missing.push(project.repoName);
    continue;
  }

  let html = fs.readFileSync(indexPath, "utf8");
  if (!html.includes(marker)) {
    alreadyInternal += 1;
    continue;
  }

  html = html.replace(runtimeCss, "\n").replace(runtimeScript, "\n");
  fs.writeFileSync(indexPath, html.replaceAll("\r\n", "\n"), "utf8");
  removed += 1;
}

console.log(JSON.stringify({
  total: catalog.projects.length,
  removed,
  alreadyInternal,
  missing,
  policy: "Domain expert reviews remain in docs/project-expert and are not loaded in the Demo frontend.",
}, null, 2));
if (missing.length) process.exitCode = 1;
