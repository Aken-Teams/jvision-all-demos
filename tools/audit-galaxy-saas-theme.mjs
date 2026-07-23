import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const toolDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(toolDir, "..");
const index = JSON.parse(fs.readFileSync(path.join(repoRoot, "projects-index.json"), "utf8"));
const catalog = JSON.parse(fs.readFileSync(path.join(repoRoot, "docs", "GALAXY_SAAS_STYLE_CATALOG.json"), "utf8"));
const sourceMarker = "JVISION_GALAXY_SAAS_START";
const styleVersion = "galaxy-bright-20260722";

function contrast(foreground, background) {
  const luminance = (hex) => {
    const value = hex.replace("#", "");
    const channels = [0, 2, 4].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16) / 255);
    const linear = channels.map((channel) => channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  };
  const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return Number(((light + 0.05) / (dark + 0.05)).toFixed(2));
}

function sourceCssChecks(projectDir) {
  const generated = [path.join(projectDir, "styles.css"), path.join(projectDir, "app", "globals.css")];
  const legacy = path.join(projectDir, "src", "app", "globals.css");
  if (generated.every((item) => fs.existsSync(item))) {
    return generated.every((item) => fs.readFileSync(item, "utf8").includes(sourceMarker));
  }
  if (fs.existsSync(legacy)) return fs.readFileSync(legacy, "utf8").includes(sourceMarker);
  return true;
}

function sourceBodyClassCheck(projectDir, family) {
  const generatedData = path.join(projectDir, "app", "demo-data.js");
  if (fs.existsSync(generatedData)) {
    const source = fs.readFileSync(generatedData, "utf8");
    return source.includes("jv-galaxy-saas") && source.includes(`jv-galaxy-${family}`);
  }
  const layouts = ["src/app/layout.tsx", "src/app/layout.ts", "src/app/layout.jsx", "src/app/layout.js"];
  const layoutPath = layouts.map((relative) => path.join(projectDir, relative)).find((candidate) => fs.existsSync(candidate));
  if (!layoutPath) return true;
  const source = fs.readFileSync(layoutPath, "utf8");
  return source.includes("jv-galaxy-saas") && source.includes(`jv-galaxy-${family}`);
}

const rows = index.projects.map((project) => {
  const projectDir = path.join(repoRoot, "demos", project.repoName);
  const html = fs.readFileSync(path.join(projectDir, "index.html"), "utf8");
  const assignment = catalog.assignments.find((item) => item.repoName === project.repoName);
  const checks = {
    bodyScope: html.includes("jv-galaxy-saas"),
    family: Boolean(assignment) && html.includes(`jv-galaxy-${assignment.family}`),
    stylesheetLink: html.includes(`./galaxy-saas.css?v=${styleVersion}`),
    stylesheetFile: fs.existsSync(path.join(projectDir, "galaxy-saas.css")),
    sourceCss: sourceCssChecks(projectDir),
    sourceBodyClass: Boolean(assignment) && sourceBodyClassCheck(projectDir, assignment.family),
  };
  return { id: Number(project.id), repoName: project.repoName, checks, passed: Object.values(checks).every(Boolean) };
});

const palette = ["#1d4ed8", "#0f766e", "#0369a1", "#6d28d9", "#1e3a8a", "#4338ca", "#be123c", "#9a3412", "#047857", "#7c2d12"];
const contrastChecks = Object.fromEntries(palette.map((color) => [color, contrast("#ffffff", color)]));
const failed = rows.filter((row) => !row.passed);
const contrastPassed = Object.values(contrastChecks).every((ratio) => ratio >= 4.5);
const summary = {
  total: rows.length,
  passed: rows.length - failed.length,
  failed: failed.length,
  assignmentCount: catalog.assignments.length,
  styleFamilies: Object.keys(catalog.styleCounts).length,
  contrastPassed,
  contrastChecks,
};

fs.writeFileSync(
  path.join(repoRoot, "docs", "GALAXY_SAAS_THEME_AUDIT.json"),
  `${JSON.stringify({ generatedAt: new Date().toISOString(), summary, rows }, null, 2)}\n`,
  "utf8",
);
console.log(JSON.stringify(summary, null, 2));
if (failed.length || catalog.assignments.length !== index.projects.length || !contrastPassed) {
  if (failed.length) console.error(JSON.stringify(failed.slice(0, 20), null, 2));
  process.exitCode = 1;
}
