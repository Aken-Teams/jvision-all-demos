import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const toolDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(toolDir, "..");
const demosRoot = path.join(repoRoot, "demos");
const catalog = JSON.parse(fs.readFileSync(path.join(repoRoot, "projects-index.json"), "utf8"));
const version = "20260723-3";
const css = `<link rel="stylesheet" href="../../shared/jvision-project-share.css?v=${version}" />`;
const script = `<script src="../../shared/jvision-project-share.js?v=${version}" defer></script>`;
const marker = "jvision-project-share.js";
const previousCss = /\s*<link\s+rel=["']stylesheet["']\s+href=["'][^"']*jvision-project-share\.css[^"']*["']\s*\/?>\s*/gi;
const previousScript = /\s*<script\s+src=["'][^"']*jvision-project-share\.js[^"']*["'][^>]*><\/script>\s*/gi;

let injected = 0;
let updated = 0;
const missing = [];

for (const project of catalog.projects) {
  const indexPath = path.join(demosRoot, project.repoName, "index.html");
  if (!fs.existsSync(indexPath)) {
    missing.push(project.repoName);
    continue;
  }
  const original = fs.readFileSync(indexPath, "utf8");
  const hadRuntime = original.includes(marker);
  let html = original.replace(previousCss, "\n").replace(previousScript, "\n");
  if (!/<\/head>/i.test(html) || !/<\/body>/i.test(html)) throw new Error(`Cannot add share controls to ${project.repoName}`);
  html = html.replace(/<\/head>/i, `  ${css}\n</head>`).replace(/<\/body>/i, `  ${script}\n</body>`).replaceAll("\r\n", "\n");
  if (html !== original) {
    fs.writeFileSync(indexPath, html, "utf8");
    if (hadRuntime) updated += 1;
    else injected += 1;
  }
}

console.log(JSON.stringify({ total: catalog.projects.length, injected, updated, missing }, null, 2));
if (missing.length) process.exitCode = 1;
