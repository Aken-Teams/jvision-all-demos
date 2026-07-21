import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const toolDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(toolDir, "..");
const index = JSON.parse(fs.readFileSync(path.join(repoRoot, "projects-index.json"), "utf8"));
const manifestPath = path.join(repoRoot, "docs", "LEGACY_NEXT_PROJECTS.json");
const manifest = fs.existsSync(manifestPath)
  ? JSON.parse(fs.readFileSync(manifestPath, "utf8"))
  : { projects: [] };

const projects = index.projects.filter(
  (project) => project.sourceGroup === "legacy-jvision" && project.runtime === "nextjs",
);

function hasAppPage(appDir) {
  if (!fs.existsSync(appDir)) return false;
  const entries = fs.readdirSync(appDir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(appDir, entry.name);
    if (entry.isDirectory() && hasAppPage(fullPath)) return true;
    if (entry.isFile() && /^page\.(?:js|jsx|ts|tsx)$/.test(entry.name)) return true;
  }
  return false;
}

const rows = projects.map((project) => {
  const projectDir = path.join(repoRoot, "demos", project.repoName);
  const packagePath = path.join(projectDir, "package.json");
  let packageJson = {};
  try {
    packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  } catch {}
  const dependencies = {
    ...(packageJson.dependencies || {}),
    ...(packageJson.devDependencies || {}),
  };
  const checks = {
    nextDependency: Boolean(dependencies.next),
    appRouterSource: hasAppPage(path.join(projectDir, "src", "app")),
    appIcon: fs.readdirSync(path.join(projectDir, "src", "app")).some((name) => /^icon\.(?:ico|png|jpg|jpeg|svg|tsx?|jsx?)$/i.test(name)),
    nextConfig: ["next.config.js", "next.config.mjs", "next.config.ts"].some((name) => fs.existsSync(path.join(projectDir, name))),
    devScript: String(packageJson.scripts?.dev || "").startsWith("next dev") && packageJson.scripts.dev.includes("--webpack"),
    buildScript: String(packageJson.scripts?.build || "").startsWith("next build") && packageJson.scripts.build.includes("--webpack"),
    startScript: String(packageJson.scripts?.start || "").startsWith("next start"),
    runtimeMetadata: packageJson.jvision?.runtime === "nextjs" && packageJson.jvision?.type === "next-app-router",
    nextMarker: fs.existsSync(path.join(projectDir, ".jvision-next-app")),
    oldStaticMarkerRemoved: !fs.existsSync(path.join(projectDir, ".jvision-exported")),
    hubSnapshotPreserved: fs.existsSync(path.join(projectDir, "index.html")),
  };
  return {
    id: Number(project.id),
    repoName: project.repoName,
    checks,
    passed: Object.values(checks).every(Boolean),
  };
});

const failed = rows.filter((row) => !row.passed);
const summary = {
  expected: 59,
  discovered: projects.length,
  manifestProjects: manifest.projects?.length || 0,
  passed: rows.length - failed.length,
  failed: failed.length,
  oldStaticMarkersRemaining: rows.filter((row) => !row.checks.oldStaticMarkerRemoved).length,
  nextRuntimeMarkers: rows.filter((row) => row.checks.nextMarker).length,
  hubSnapshotsPreserved: rows.filter((row) => row.checks.hubSnapshotPreserved).length,
};

console.log(JSON.stringify(summary, null, 2));
if (failed.length) {
  console.error(JSON.stringify(failed.slice(0, 20), null, 2));
  process.exitCode = 1;
}
