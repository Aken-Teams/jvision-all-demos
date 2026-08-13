/**
 * build-demo-pages.mjs
 * Turns every demo folder into a clean, pure-UI system page:
 *  - writes index.html that loads the shared data-driven demo runtime
 *  - writes README.md as a real product introduction (from content/details)
 *  - removes the old cluttered files (app.js, styles.css, app/, public/, configs…)
 * Keeps only index.html + README.md per demo. Data comes from content/details/<repo>.json.
 *
 * Run: node tools/build-demo-pages.mjs
 */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const idx = JSON.parse(fs.readFileSync(path.join(root, "projects-index.json"), "utf8"));
const detailsDir = path.join(root, "content/details");
const demosDir = path.join(root, "demos");
const escAttr = (s) => String(s == null ? "" : s).replace(/"/g, "&quot;").replace(/</g, "&lt;");

function indexHtml(D) {
  return `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escAttr(D.title)}｜Jvision 系統 Demo</title>
  <meta name="description" content="${escAttr(D.hero && D.hero.tagline || D.title)}" />
  <link rel="icon" href="../../favicon.svg" type="image/svg+xml" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Noto+Sans+TC:wght@400;500;700;900&display=swap" rel="stylesheet" />
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="../../shared/jvision-demo-app.css" />
  <script src="https://cdn.jsdelivr.net/npm/echarts@5.5.1/dist/echarts.min.js"></script>
</head>
<body>
  <div id="app"></div>
  <script src="../../shared/jvision-demo-app.js"></script>
</body>
</html>
`;
}

function readmeMd(D) {
  const modules = (D.architecture && D.architecture.modules) || [];
  const users = (D.system && D.system.users) || [];
  const kpis = (D.benefits && D.benefits.kpis) || [];
  const stages = ((D.flow && D.flow.stages) || []).map((s) => s.title);
  const lines = [];
  lines.push(`# ${D.title}`, "");
  if (D.hero && D.hero.tagline) lines.push(`> ${D.hero.tagline}`, "");
  lines.push(D.system && D.system.summary ? D.system.summary : (D.problem && D.problem.situation) || "", "");
  lines.push(`**產業別：**${D.category || "—"}　|　**系統類型：**${D.systemType || "—"}`, "");
  if (modules.length) { lines.push("## 功能模組", ""); modules.forEach((m) => lines.push(`- **${m.name}** — ${m.desc || ""}`)); lines.push(""); }
  if (users.length) { lines.push("## 適合誰使用", ""); users.forEach((u) => lines.push(`- ${u}`)); lines.push(""); }
  if (stages.length) { lines.push("## 運作流程", ""); stages.forEach((s, i) => lines.push(`${i + 1}. ${s}`)); lines.push(""); }
  if (kpis.length) { lines.push("## 導入效益", ""); kpis.forEach((k) => lines.push(`- ${k.label}：${k.before}${k.unit || ""} → **${k.after}${k.unit || ""}**`)); lines.push(""); }
  lines.push("---", "", `本頁為 **純 UI 系統展示**（無後端），畫面與資料皆為擬真示範，與專案詳細頁的功能模組、運作流程一致。單一網域下以 \`/demos/${D.repoName}/\` 提供。`, "");
  return lines.join("\n");
}

let written = 0, cleaned = 0, created = 0, skipped = 0;
for (const p of idx.projects) {
  const repo = p.repoName;
  const detailPath = path.join(detailsDir, repo + ".json");
  if (!fs.existsSync(detailPath)) { skipped++; continue; }
  const D = JSON.parse(fs.readFileSync(detailPath, "utf8"));
  const dir = path.join(demosDir, repo);
  if (!fs.existsSync(dir)) { fs.mkdirSync(dir, { recursive: true }); created++; }
  fs.writeFileSync(path.join(dir, "index.html"), indexHtml(D));
  fs.writeFileSync(path.join(dir, "README.md"), readmeMd(D));
  // remove everything else (old runtime, Next source, configs, snapshots…)
  for (const entry of fs.readdirSync(dir)) {
    if (entry === "index.html" || entry === "README.md") continue;
    fs.rmSync(path.join(dir, entry), { recursive: true, force: true });
    cleaned++;
  }
  written++;
}
console.log(`Demo pages built: ${written} (new dirs: ${created}), removed ${cleaned} old entries, skipped ${skipped} (no details).`);
