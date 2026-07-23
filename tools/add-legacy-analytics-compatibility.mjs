import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const manifest = JSON.parse(fs.readFileSync(path.join(root, "docs", "LEGACY_NEXT_PROJECTS.json"), "utf8"));
const excluded = new Set(["jvision-temple-management"]);
const hiddenOverlayCss = `

/* Generic cross-project analytics are retired. Keep this legacy selector
 * hidden until every historical static export has been rebuilt. */
.jv-analytics-panel { display: none !important; }
`;
const rows = [];

for (const project of manifest.projects || []) {
  if (excluded.has(project.repoName)) continue;
  const relativeIndex = `demos/${project.repoName}/index.html`;
  const indexPath = path.join(root, relativeIndex);
  if (!fs.existsSync(indexPath)) {
    rows.push({ repoName: project.repoName, status: "missing-index" });
    continue;
  }

  let original;
  try {
    original = execFileSync("git", ["show", `HEAD:${relativeIndex}`], {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024
    });
  } catch {
    rows.push({ repoName: project.repoName, status: "missing-head-snapshot" });
    continue;
  }

  const links = [...original.matchAll(/<link\b[^>]*jvision-(?:analytics|dynamic-charts)\.css[^>]*\/?>/gi)];
  const scripts = [...original.matchAll(/<script\b[^>]*jvision-(?:analytics|dynamic-charts)\.js[^>]*>\s*<\/script>/gi)];

  // The compiled React bundle hydrates this exact static DOM shell. Preserve
  // it byte-for-byte and neutralize the unrelated analytics code below.
  fs.writeFileSync(indexPath, original);

  for (const candidate of [
    path.join(root, "demos", project.repoName, "jvision-analytics.js"),
    path.join(root, "demos", project.repoName, "jvision-dynamic-charts.js"),
    path.join(root, "demos", project.repoName, "public", "jvision-analytics.js"),
    path.join(root, "demos", project.repoName, "public", "jvision-dynamic-charts.js")
  ]) {
    if (!fs.existsSync(candidate)) continue;
    const relative = path.relative(root, candidate).replaceAll("\\", "/");
    try {
      const legacyRuntime = execFileSync("git", ["show", `HEAD:${relative}`], {
        cwd: root,
        encoding: "utf8",
        maxBuffer: 20 * 1024 * 1024
      });
      fs.writeFileSync(candidate, legacyRuntime);
    } catch {
      // Some projects reference the shared runtime only.
    }
  }

  for (const cssCandidate of [
    path.join(root, "demos", project.repoName, "jvision-analytics.css"),
    path.join(root, "demos", project.repoName, "public", "jvision-analytics.css")
  ]) {
    if (!fs.existsSync(cssCandidate)) continue;
    const css = fs.readFileSync(cssCandidate, "utf8");
    if (!css.includes("Generic cross-project analytics are retired")) {
      fs.writeFileSync(cssCandidate, `${css.trimEnd()}${hiddenOverlayCss}`);
    }
  }
  rows.push({ repoName: project.repoName, status: "compatible", links: links.length, scripts: scripts.length });
}

for (const sharedFile of [
  path.join(root, "shared", "jvision-dynamic-charts.js")
]) {
  if (!fs.existsSync(sharedFile)) continue;
  const relative = path.relative(root, sharedFile).replaceAll("\\", "/");
  const legacyRuntime = execFileSync("git", ["show", `HEAD:${relative}`], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024
  });
  fs.writeFileSync(sharedFile, legacyRuntime);
}

const summary = {
  generatedAt: new Date().toISOString(),
  total: rows.length,
  compatible: rows.filter((row) => row.status === "compatible").length,
  failed: rows.filter((row) => row.status !== "compatible").length,
  excluded: [...excluded]
};
fs.writeFileSync(
  path.join(root, "docs", "LEGACY_ANALYTICS_COMPATIBILITY_REPORT.json"),
  `${JSON.stringify({ summary, rows }, null, 2)}\n`
);
console.log(JSON.stringify(summary, null, 2));
if (summary.failed) process.exitCode = 1;
