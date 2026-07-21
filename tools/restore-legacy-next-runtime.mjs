import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const toolDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(toolDir, "..");
const indexPath = path.join(repoRoot, "projects-index.json");
const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));

function readPackage(projectDir) {
  const packagePath = path.join(projectDir, "package.json");
  if (!fs.existsSync(packagePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(packagePath, "utf8"));
  } catch {
    return null;
  }
}

function isLegacyNextProject(project) {
  if (project.sourceGroup !== "legacy-jvision") return false;
  const projectDir = path.join(repoRoot, "demos", project.repoName);
  const packageJson = readPackage(projectDir);
  const dependencies = {
    ...(packageJson?.dependencies || {}),
    ...(packageJson?.devDependencies || {}),
  };
  return Boolean(
    dependencies.next
      && fs.existsSync(path.join(projectDir, "src", "app"))
      && ["next.config.js", "next.config.mjs", "next.config.ts"].some((name) => fs.existsSync(path.join(projectDir, name))),
  );
}

const legacyNextProjects = index.projects.filter(isLegacyNextProject);
if (legacyNextProjects.length !== 59) {
  throw new Error(`Expected 59 legacy Next.js projects, found ${legacyNextProjects.length}.`);
}

const manifestRows = [];
const defaultIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">\n` +
  `  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#7dd3fc"/><stop offset="1" stop-color="#34d399"/></linearGradient></defs>\n` +
  `  <rect width="64" height="64" rx="16" fill="#071018"/>\n` +
  `  <path d="M17 15v22c0 9 5 13 14 13 10 0 16-5 16-16V15H37v20c0 5-2 7-6 7-3 0-5-2-5-6V15H17Z" fill="url(#g)"/>\n` +
  `</svg>\n`;

for (const project of legacyNextProjects) {
  const projectDir = path.join(repoRoot, "demos", project.repoName);
  const packagePath = path.join(projectDir, "package.json");
  const packageJson = readPackage(projectDir);
  const oldStaticMarker = path.join(projectDir, ".jvision-exported");

  packageJson.scripts = packageJson.scripts || {};
  packageJson.scripts.dev = String(packageJson.scripts.dev || "next dev").includes("--webpack")
    ? packageJson.scripts.dev
    : `${packageJson.scripts.dev || "next dev"} --webpack`;
  packageJson.scripts.build = String(packageJson.scripts.build || "next build").includes("--webpack")
    ? packageJson.scripts.build
    : `${packageJson.scripts.build || "next build"} --webpack`;
  packageJson.scripts.start = packageJson.scripts.start || "next start";

  // This marker described the project as a static export. The original Next.js
  // source is the primary runtime again; the existing index.html remains only
  // as a compatibility snapshot for the single-domain static Demo Hub.
  if (fs.existsSync(oldStaticMarker)) fs.unlinkSync(oldStaticMarker);

  packageJson.jvision = {
    ...(packageJson.jvision || {}),
    id: Number(project.id),
    type: "next-app-router",
    runtime: "nextjs",
    sourceRoot: "src/app",
    hubPath: `/demos/${project.repoName}/`,
    hubSnapshot: "index.html",
  };
  fs.writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`, "utf8");

  const runtimeMarker = {
    id: Number(project.id),
    repoName: project.repoName,
    runtime: "nextjs",
    router: "app",
    sourceRoot: "src/app",
    hubPath: `/demos/${project.repoName}/`,
    hubSnapshot: "index.html",
  };
  fs.writeFileSync(
    path.join(projectDir, ".jvision-next-app"),
    `${JSON.stringify(runtimeMarker, null, 2)}\n`,
    "utf8",
  );

  const appDir = path.join(projectDir, "src", "app");
  const hasAppIcon = fs.readdirSync(appDir).some((name) => /^icon\.(?:ico|png|jpg|jpeg|svg|tsx?|jsx?)$/i.test(name));
  if (!hasAppIcon) {
    fs.writeFileSync(path.join(appDir, "icon.svg"), defaultIconSvg, "utf8");
  }

  project.runtime = "nextjs";
  project.router = "app";
  project.runtimeSource = `demos/${project.repoName}/src/app`;
  project.hubSnapshot = true;

  manifestRows.push({
    ...runtimeMarker,
    packageName: packageJson.name,
    nextVersion: packageJson.dependencies?.next || packageJson.devDependencies?.next,
    scripts: {
      dev: packageJson.scripts?.dev,
      build: packageJson.scripts?.build,
      start: packageJson.scripts?.start,
    },
  });
}

fs.writeFileSync(indexPath, `${JSON.stringify(index, null, 2)}\n`, "utf8");
fs.writeFileSync(
  path.join(repoRoot, "docs", "LEGACY_NEXT_PROJECTS.json"),
  `${JSON.stringify({
    total: manifestRows.length,
    runtime: "nextjs",
    router: "app",
    hubCompatibility: "preserved-static-snapshot",
    projects: manifestRows,
  }, null, 2)}\n`,
  "utf8",
);

console.log(`Restored ${manifestRows.length} legacy projects to Next.js-first runtime.`);
