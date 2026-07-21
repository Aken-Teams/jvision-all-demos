import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = path.resolve(process.cwd());
const index = JSON.parse(fs.readFileSync(path.join(root, "projects-index.json"), "utf8"));
const reportPath = path.join(root, "..", "generated-ai-demos", "next-demo-export-report.json");
const limit = Number(process.env.EXPORT_LIMIT || 5);
const only = new Set(
  String(process.env.EXPORT_ONLY || "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean),
);

function isNext(project) {
  const dir = path.join(root, "demos", project.repoName);
  const pkgPath = path.join(dir, "package.json");
  if (!fs.existsSync(pkgPath)) return false;
  let pkg = {};
  try {
    pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  } catch {}
  const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
  return Boolean(deps.next || fs.existsSync(path.join(dir, "next.config.mjs")) || fs.existsSync(path.join(dir, "next.config.js")));
}

function loadReport() {
  if (!fs.existsSync(reportPath)) return { generatedAt: null, rows: [] };
  return JSON.parse(fs.readFileSync(reportPath, "utf8"));
}

function saveReport(report) {
  const rows = report.rows || [];
  const summary = {
    generatedAt: new Date().toISOString(),
    totalRows: rows.length,
    exported: rows.filter((row) => row.status === "exported").length,
    failed: rows.filter((row) => row.status === "failed").length,
    failedRepos: rows.filter((row) => row.status === "failed").map((row) => row.repoName),
  };
  fs.writeFileSync(reportPath, JSON.stringify({ summary, rows }, null, 2));
}

const report = loadReport();
const exported = new Set(report.rows.filter((row) => row.status === "exported").map((row) => row.repoName));
const failed = new Set(report.rows.filter((row) => row.status === "failed").map((row) => row.repoName));
const candidates = index.projects
  .filter((project) => project.sourceGroup === "legacy-jvision")
  .filter(isNext)
  .filter((project) => !exported.has(project.repoName))
  .filter((project) => only.size === 0 || only.has(project.repoName))
  .slice(0, limit);

for (const project of candidates) {
  const startedAt = new Date().toISOString();
  console.log(`[export] ${project.repoName}`);
  const result = spawnSync(process.execPath, ["tools/export-next-demo.mjs", project.repoName], {
    cwd: root,
    encoding: "utf8",
    shell: false,
  });
  const existingIndex = report.rows.findIndex((row) => row.repoName === project.repoName);
  if (existingIndex >= 0) report.rows.splice(existingIndex, 1);
  const row = {
    repoName: project.repoName,
    status: result.status === 0 ? "exported" : "failed",
    startedAt,
    finishedAt: new Date().toISOString(),
    stdout: (result.stdout || "").slice(-3000),
    stderr: (result.stderr || "").slice(-3000),
  };
  report.rows.push(row);
  saveReport(report);
  if (row.status === "failed") {
    console.error(`[failed] ${project.repoName}`);
    console.error(row.stderr || row.stdout);
  } else {
    console.log(`[done] ${project.repoName}`);
  }
}

saveReport(report);
const nextTotal = index.projects.filter((project) => project.sourceGroup === "legacy-jvision").filter(isNext).length;
const exportedCount = new Set(report.rows.filter((row) => row.status === "exported").map((row) => row.repoName)).size;
console.log(JSON.stringify({
  nextTotal,
  attemptedThisRun: candidates.length,
  exportedCount,
  remaining: Math.max(0, nextTotal - exportedCount),
  failed: report.rows.filter((row) => row.status === "failed").length,
}, null, 2));
