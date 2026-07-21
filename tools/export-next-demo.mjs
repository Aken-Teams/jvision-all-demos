import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = path.resolve(process.cwd());
const repoName = process.argv[2];

if (process.env.ALLOW_LEGACY_STATIC_EXPORT !== "1") {
  console.error("Legacy demos are Next.js-first projects. Set ALLOW_LEGACY_STATIC_EXPORT=1 only when intentionally refreshing a Hub compatibility snapshot.");
  process.exit(2);
}

if (!repoName) {
  console.error("Usage: node tools/export-next-demo.mjs <repoName>");
  process.exit(2);
}

const demoDir = path.join(root, "demos", repoName);
const packagePath = path.join(demoDir, "package.json");
const configPath = ["next.config.mjs", "next.config.js", "next.config.ts"]
  .map((name) => path.join(demoDir, name))
  .find((file) => fs.existsSync(file));

if (!fs.existsSync(packagePath) || !configPath) {
  console.error(`Not a Next demo: ${repoName}`);
  process.exit(2);
}

const configSource = fs.readFileSync(configPath, "utf8");
const backupPath = `${configPath}.jvision-backup`;
fs.writeFileSync(backupPath, configSource, "utf8");
const dynamicBackups = [];

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed with ${result.status}`);
  }
}

function patchConfig(source) {
  const injection = `\nconst jvisionBasePath = "/demos/${repoName}";\n`;
  let patched = source;
  if (!patched.includes("jvisionBasePath")) patched = injection + patched;
  patched = patched.replace(/output\s*:\s*["'](?:standalone|export)["']\s*,?/g, "");
  patched = patched.replace(/const\s+nextConfig(?:\s*:\s*[^=]+)?\s*=\s*\{/, (match) => `${match}\n  output: "export",\n  trailingSlash: true,\n  basePath: jvisionBasePath,\n  assetPrefix: jvisionBasePath,`);
  return patched;
}

function walkFiles(dir, predicate, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, predicate, files);
    else if (entry.isFile() && predicate(full)) files.push(full);
  }
  return files;
}

try {
  fs.writeFileSync(configPath, patchConfig(configSource), "utf8");
  const apiDir = path.join(demoDir, "src", "app", "api");
  const apiBackupDir = path.join(demoDir, ".jvision-api-backup");
  if (fs.existsSync(apiDir)) {
    fs.rmSync(apiBackupDir, { recursive: true, force: true });
    fs.renameSync(apiDir, apiBackupDir);
  }
  const adminDir = path.join(demoDir, "src", "app", "admin");
  const adminBackupDir = path.join(demoDir, ".jvision-admin-backup");
  if (fs.existsSync(adminDir)) {
    fs.rmSync(adminBackupDir, { recursive: true, force: true });
    fs.renameSync(adminDir, adminBackupDir);
  }
  for (const file of walkFiles(path.join(demoDir, "src", "app"), (full) => /\.(tsx|ts|jsx|js)$/.test(full))) {
    const source = fs.readFileSync(file, "utf8");
    if (source.includes("force-dynamic")) {
      dynamicBackups.push([file, source]);
      fs.writeFileSync(file, source.replace(/force-dynamic/g, "force-static"), "utf8");
    }
  }
  if (!fs.existsSync(path.join(demoDir, "node_modules"))) {
    run("npm", ["install", "--no-audit", "--no-fund"], demoDir);
  }
  run("npx", ["next", "build", "--webpack"], demoDir);

  const outDir = path.join(demoDir, "out");
  if (!fs.existsSync(outDir)) {
    throw new Error(`Missing export output: ${outDir}`);
  }

  for (const entry of fs.readdirSync(outDir)) {
    const source = path.join(outDir, entry);
    const target = path.join(demoDir, entry);
    fs.rmSync(target, { recursive: true, force: true });
    fs.cpSync(source, target, { recursive: true });
  }

  fs.writeFileSync(path.join(demoDir, ".jvision-hub-snapshot"), new Date().toISOString(), "utf8");
  console.log(JSON.stringify({ repoName, status: "hub-snapshot", outDir }, null, 2));
} finally {
  const apiDir = path.join(demoDir, "src", "app", "api");
  const apiBackupDir = path.join(demoDir, ".jvision-api-backup");
  if (fs.existsSync(apiBackupDir)) {
    fs.rmSync(apiDir, { recursive: true, force: true });
    fs.renameSync(apiBackupDir, apiDir);
  }
  const adminDir = path.join(demoDir, "src", "app", "admin");
  const adminBackupDir = path.join(demoDir, ".jvision-admin-backup");
  if (fs.existsSync(adminBackupDir)) {
    fs.rmSync(adminDir, { recursive: true, force: true });
    fs.renameSync(adminBackupDir, adminDir);
  }
  for (const [file, source] of dynamicBackups) {
    if (fs.existsSync(path.dirname(file))) fs.writeFileSync(file, source, "utf8");
  }
  fs.writeFileSync(configPath, configSource, "utf8");
  fs.rmSync(backupPath, { force: true });
}
