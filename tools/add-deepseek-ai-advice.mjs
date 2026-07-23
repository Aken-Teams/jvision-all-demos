import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const toolDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(toolDir, "..");
const demosRoot = path.join(repoRoot, "demos");
const catalog = JSON.parse(fs.readFileSync(path.join(repoRoot, "projects-index.json"), "utf8"));
const marker = "jvision-ai-advice.js";
const version = "20260723-3";
const css = `<link rel="stylesheet" href="../../shared/jvision-ai-advice.css?v=${version}" />`;
const script = `<script src="../../shared/jvision-ai-advice.js?v=${version}" defer></script>`;

let injected = 0;
let updated = 0;
const missing = [];

for (const project of catalog.projects) {
  const indexPath = path.join(demosRoot, project.repoName, "index.html");
  if (!fs.existsSync(indexPath)) {
    missing.push(project.repoName);
    continue;
  }

  let html = fs.readFileSync(indexPath, "utf8");
  const previous = html;
  const hadRuntime = html.includes(marker);
  html = html
    .replace(/\s*<link\s+rel=["']stylesheet["']\s+href=["'][^"']*jvision-ai-advice\.css[^"']*["']\s*\/?>(?:\r?\n)?/gi, "\n")
    .replace(/\s*<script\s+src=["'][^"']*jvision-ai-advice\.js[^"']*["']\s+defer><\/script>(?:\r?\n)?/gi, "\n");
  html = /<\/head>/i.test(html) ? html.replace(/<\/head>/i, `  ${css}\n</head>`) : `${css}\n${html}`;
  html = /<\/body>/i.test(html) ? html.replace(/<\/body>/i, `  ${script}\n</body>`) : `${html}\n${script}`;

  if (html !== previous) {
    fs.writeFileSync(indexPath, html.replaceAll("\r\n", "\n"), "utf8");
    if (hadRuntime) updated += 1;
    else injected += 1;
  }
}

console.log(JSON.stringify({ total: catalog.projects.length, injected, updated, missing }, null, 2));
if (missing.length) process.exitCode = 1;
