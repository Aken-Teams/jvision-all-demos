import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const toolDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(toolDir, "..");
const index = JSON.parse(fs.readFileSync(path.join(repoRoot, "projects-index.json"), "utf8"));
const marker = "JVISION_PROFESSIONAL_LIGHT_START";

function colorToRgb(hex) {
  const value = hex.replace("#", "");
  return [0, 2, 4].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16));
}

function luminance(hex) {
  const channels = colorToRgb(hex).map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(foreground, background) {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return Number(((values[0] + 0.05) / (values[1] + 0.05)).toFixed(2));
}

const rows = index.projects.map((project) => {
  const projectDir = path.join(repoRoot, "demos", project.repoName);
  const html = fs.readFileSync(path.join(projectDir, "index.html"), "utf8");
  const isGenerated = Number(project.id) >= 1001 && Number(project.id) <= 1400;
  const isLegacyNext = project.sourceGroup === "legacy-jvision" && project.runtime === "nextjs";
  const checks = {
    bodyClass: html.includes("jvision-bright-saas"),
    faviconLink: html.includes('./favicon.svg" type="image/svg+xml"'),
    faviconFile: fs.existsSync(path.join(projectDir, "favicon.svg")),
    stylesheetLink: html.includes("./bright-saas.css?v=professional-light-20260721"),
    stylesheetFile: fs.existsSync(path.join(projectDir, "bright-saas.css")),
    generatedSource: !isGenerated || (
      fs.readFileSync(path.join(projectDir, "styles.css"), "utf8").includes(marker)
      && fs.readFileSync(path.join(projectDir, "app", "globals.css"), "utf8").includes(marker)
    ),
    legacyNextSource: !isLegacyNext
      || fs.readFileSync(path.join(projectDir, "src", "app", "globals.css"), "utf8").includes(marker),
  };
  return {
    id: Number(project.id),
    repoName: project.repoName,
    checks,
    passed: Object.values(checks).every(Boolean),
  };
});

const contrastChecks = {
  primaryTextOnWhite: contrast("#10243e", "#ffffff"),
  secondaryTextOnWhite: contrast("#5b6f84", "#ffffff"),
  whiteOnPrimaryButton: contrast("#ffffff", "#075fd8"),
};
const contrastPassed = contrastChecks.primaryTextOnWhite >= 7
  && contrastChecks.secondaryTextOnWhite >= 4.5
  && contrastChecks.whiteOnPrimaryButton >= 4.5;
const failed = rows.filter((row) => !row.passed);
const summary = {
  total: rows.length,
  passed: rows.length - failed.length,
  failed: failed.length,
  generatedThemed: rows.filter((row) => row.id >= 1001 && row.id <= 1400 && row.passed).length,
  legacyNextThemed: rows.filter((row) => row.id < 1001 || row.id > 1400).filter((row) => {
    const project = index.projects.find((item) => Number(item.id) === row.id && item.repoName === row.repoName);
    return project?.runtime === "nextjs" && row.passed;
  }).length,
  contrastPassed,
  contrastChecks,
};

fs.writeFileSync(
  path.join(repoRoot, "docs", "BRIGHT_SAAS_THEME_AUDIT.json"),
  `${JSON.stringify({ generatedAt: new Date().toISOString(), summary, rows }, null, 2)}\n`,
  "utf8",
);
console.log(JSON.stringify(summary, null, 2));
if (failed.length || !contrastPassed) {
  if (failed.length) console.error(JSON.stringify(failed.slice(0, 20), null, 2));
  process.exitCode = 1;
}
