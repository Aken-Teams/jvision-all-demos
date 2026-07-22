import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const toolDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(toolDir, "..");
const demosRoot = path.join(repoRoot, "demos");
const catalog = JSON.parse(fs.readFileSync(path.join(repoRoot, "projects-index.json"), "utf8"));
const marker = "jvision-demo-feedback.js";
const version = "20260722";
const feedbackCss = `<link rel="stylesheet" href="../../shared/jvision-demo-feedback.css?v=${version}" />`;
const feedbackScript = `<script src="../../shared/jvision-demo-feedback.js?v=${version}" defer></script>`;

let injected = 0;
let existing = 0;
const missing = [];

for (const project of catalog.projects) {
  const indexPath = path.join(demosRoot, project.repoName, "index.html");
  if (!fs.existsSync(indexPath)) {
    missing.push(project.repoName);
    continue;
  }

  let html = fs.readFileSync(indexPath, "utf8");
  if (html.includes(marker)) {
    existing += 1;
    continue;
  }

  html = /<\/head>/i.test(html)
    ? html.replace(/<\/head>/i, `  ${feedbackCss}\n</head>`)
    : `${feedbackCss}\n${html}`;
  html = /<\/body>/i.test(html)
    ? html.replace(/<\/body>/i, `  ${feedbackScript}\n</body>`)
    : `${html}\n${feedbackScript}`;
  fs.writeFileSync(indexPath, html.replaceAll("\r\n", "\n"), "utf8");
  injected += 1;
}

console.log(JSON.stringify({ total: catalog.projects.length, injected, existing, missing }, null, 2));
if (missing.length) process.exitCode = 1;
