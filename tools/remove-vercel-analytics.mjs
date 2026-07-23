import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const toolDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(toolDir, "..");
const index = JSON.parse(fs.readFileSync(path.join(repoRoot, "projects-index.json"), "utf8"));
const noOpScript = "/* JVision self-hosted demo: Vercel Analytics intentionally disabled. */\n";

let sourceFilesChanged = 0;
let manifestsChanged = 0;
let lockfilesChanged = 0;
let compatibilityScripts = 0;

function writeNoOpScript(root) {
  const destination = path.join(root, "_vercel", "insights", "script.js");
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, noOpScript, "utf8");
  compatibilityScripts += 1;
}

function cleanLockfile(lockPath) {
  if (!fs.existsSync(lockPath)) return;
  const lockfile = JSON.parse(fs.readFileSync(lockPath, "utf8"));
  let changed = false;
  if (lockfile.packages) {
    for (const metadata of Object.values(lockfile.packages)) {
      for (const field of ["dependencies", "devDependencies", "optionalDependencies"]) {
        if (metadata?.[field]?.["@vercel/analytics"]) {
          delete metadata[field]["@vercel/analytics"];
          changed = true;
        }
      }
    }
    for (const key of Object.keys(lockfile.packages)) {
      if (key.endsWith("node_modules/@vercel/analytics")) {
        delete lockfile.packages[key];
        changed = true;
      }
    }
  }
  if (lockfile.dependencies?.["@vercel/analytics"]) {
    delete lockfile.dependencies["@vercel/analytics"];
    changed = true;
  }
  if (changed) {
    fs.writeFileSync(lockPath, `${JSON.stringify(lockfile, null, 2)}\n`, "utf8");
    lockfilesChanged += 1;
  }
}

writeNoOpScript(repoRoot);
cleanLockfile(path.join(repoRoot, "package-lock.json"));

for (const project of index.projects) {
  if (project.sourceGroup !== "legacy-jvision" || project.runtime !== "nextjs") continue;

  const projectDir = path.join(repoRoot, "demos", project.repoName);
  const appDir = path.join(projectDir, "src", "app");
  if (fs.existsSync(appDir)) {
    for (const entry of fs.readdirSync(appDir, { withFileTypes: true })) {
      if (!entry.isFile() || !/\.(?:js|jsx|ts|tsx)$/.test(entry.name)) continue;
      const sourcePath = path.join(appDir, entry.name);
      const source = fs.readFileSync(sourcePath, "utf8");
      const cleaned = source
        .replace(/^import\s*\{\s*Analytics\s*\}\s*from\s*["']@vercel\/analytics\/(?:next|react)["'];?\s*\r?\n/gm, "")
        .replace(/\s*<Analytics\s*\/>/g, "");
      if (cleaned !== source) {
        fs.writeFileSync(sourcePath, cleaned, "utf8");
        sourceFilesChanged += 1;
      }
    }
  }

  const packagePath = path.join(projectDir, "package.json");
  if (fs.existsSync(packagePath)) {
    const manifest = JSON.parse(fs.readFileSync(packagePath, "utf8"));
    let changed = false;
    for (const field of ["dependencies", "devDependencies"]) {
      if (manifest[field]?.["@vercel/analytics"]) {
        delete manifest[field]["@vercel/analytics"];
        changed = true;
      }
    }
    if (changed) {
      fs.writeFileSync(packagePath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
      manifestsChanged += 1;
    }
  }

  cleanLockfile(path.join(projectDir, "package-lock.json"));

  writeNoOpScript(projectDir);
}

console.log(JSON.stringify({ sourceFilesChanged, manifestsChanged, lockfilesChanged, compatibilityScripts }, null, 2));
