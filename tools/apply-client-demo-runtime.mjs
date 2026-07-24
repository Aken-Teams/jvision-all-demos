import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const catalog = JSON.parse(fs.readFileSync(path.join(root, "projects-index.json"), "utf8"));
const cssTag = '<link rel="stylesheet" href="../../shared/jvision-client-demo.css?v=20260724-3" />';
const scriptTag = '<script src="../../shared/jvision-client-demo.js?v=20260724-3" defer></script>';
const rows = [];

for (const project of catalog.projects || []) {
  const file = path.join(root, project.localPath, "index.html");
  if (!fs.existsSync(file)) {
    rows.push({ repoName: project.repoName, status: "missing-index" });
    continue;
  }
  const before = fs.readFileSync(file, "utf8");
  let html = before
    .replace(/\s*<link[^>]+jvision-client-demo\.css[^>]*>\s*/gi, "\n")
    .replace(/\s*<script[^>]+jvision-client-demo\.js[^>]*><\/script>\s*/gi, "\n")
    .replace(/\s*<script[^>]+id=["']jvision-client-demo-project["'][^>]*>[\s\S]*?<\/script>\s*/gi, "\n")
    .replace(/\s*<script>window\.addEventListener\("load",\(\)=>setTimeout\(\(\)=>\{const script=document\.createElement\("script"\);script\.src="\.\.\/\.\.\/shared\/jvision-client-demo\.js[^<]+<\/script>\s*/gi, "\n");

  const headClose = html.toLowerCase().indexOf("</head>");
  const bodyClose = html.toLowerCase().lastIndexOf("</body>");
  if (headClose < 0 || bodyClose < 0) {
    rows.push({ repoName: project.repoName, status: "invalid-html" });
    continue;
  }
  html = `${html.slice(0, headClose)}  ${cssTag}\n${html.slice(headClose)}`;
  const updatedBodyClose = html.toLowerCase().lastIndexOf("</body>");
  const embeddedProject = JSON.stringify({
    id: project.id,
    repoName: project.repoName,
    title: project.title,
    category: project.category,
    description: project.description,
    businessSituation: project.businessSituation,
    dailyUse: project.dailyUse,
    operationalMetrics: project.operationalMetrics
  }).replaceAll("<", "\\u003c");
  const metadataTag = `<script type="application/json" id="jvision-client-demo-project">${embeddedProject}</script>`;
  html = `${html.slice(0, updatedBodyClose)}  ${metadataTag}\n  ${scriptTag}\n${html.slice(updatedBodyClose)}`;
  fs.writeFileSync(file, html);
  rows.push({
    repoName: project.repoName,
    category: project.category,
    status: html === before ? "unchanged" : "updated"
  });
}

const summary = {
  generatedAt: new Date().toISOString(),
  total: rows.length,
  updated: rows.filter(row => row.status === "updated").length,
  unchanged: rows.filter(row => row.status === "unchanged").length,
  failed: rows.filter(row => !["updated","unchanged"].includes(row.status)).length,
  categories: new Set(rows.map(row => row.category).filter(Boolean)).size
};
fs.writeFileSync(
  path.join(root, "docs", "CLIENT_DEMO_RUNTIME_REPORT.json"),
  `${JSON.stringify({ summary, rows }, null, 2)}\n`
);
console.log(JSON.stringify(summary, null, 2));
if (summary.failed) process.exitCode = 1;
