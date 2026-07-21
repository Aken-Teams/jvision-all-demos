import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const toolDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(toolDir, "..");
const projects = JSON.parse(fs.readFileSync(path.join(repoRoot, "projects-index.json"), "utf8")).projects
  .filter((project) => Number(project.id) >= 1001 && Number(project.id) <= 1400);

const requiredFiles = [
  "index.html",
  "styles.css",
  "app.js",
  "package.json",
  "next.config.mjs",
  "app/layout.js",
  "app/page.js",
  "app/demo-data.js",
  "app/globals.css",
  "app/icon.svg",
  "public/demo-app.js",
];

const rows = projects.map((project) => {
  const projectDir = path.join(repoRoot, "demos", project.repoName);
  const missing = requiredFiles.filter((relativePath) => !fs.existsSync(path.join(projectDir, relativePath)));
  let packageValid = false;
  let sourceValid = false;
  let hubPathValid = false;

  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(projectDir, "package.json"), "utf8"));
    packageValid = packageJson.scripts?.dev?.startsWith("next dev")
      && packageJson.scripts?.build?.startsWith("next build")
      && packageJson.dependencies?.next === "16.2.10"
      && packageJson.dependencies?.react === "18.3.1"
      && packageJson.jvision?.type === "next-app-router";
    hubPathValid = packageJson.jvision?.hubPath === `/demos/${project.repoName}/`;
  } catch {
    packageValid = false;
  }

  try {
    const pageSource = fs.readFileSync(path.join(projectDir, "app", "page.js"), "utf8");
    const dataSource = fs.readFileSync(path.join(projectDir, "app", "demo-data.js"), "utf8");
    sourceValid = pageSource.includes("next/script")
      && pageSource.includes("demo-app.js")
      && dataSource.includes(`"id":${Number(project.id)}`);
  } catch {
    sourceValid = false;
  }

  return {
    id: Number(project.id),
    repoName: project.repoName,
    missing,
    packageValid,
    sourceValid,
    hubPathValid,
  };
});

const failed = rows.filter((row) => row.missing.length || !row.packageValid || !row.sourceValid || !row.hubPathValid);
const summary = {
  expected: 400,
  discovered: projects.length,
  complete: rows.length - failed.length,
  failed: failed.length,
  appRouterProjects: rows.filter((row) => row.packageValid).length,
  preservedStandalonePages: rows.filter((row) => row.missing.every((file) => !["index.html", "styles.css", "app.js"].includes(file))).length,
};

console.log(JSON.stringify(summary, null, 2));
if (failed.length) {
  console.error(JSON.stringify(failed.slice(0, 20), null, 2));
  process.exitCode = 1;
}

if (process.argv.includes("--write")) {
  const reportPath = path.join(repoRoot, "docs", "NEXT_CONVERSION_AUDIT.json");
  fs.writeFileSync(
    reportPath,
    `${JSON.stringify({ generatedAt: new Date().toISOString(), summary, rows }, null, 2)}\n`,
    "utf8",
  );
  console.log(`Wrote ${path.relative(repoRoot, reportPath)}.`);
}
