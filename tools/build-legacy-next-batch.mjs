import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const toolDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(toolDir, "..");
const manifest = JSON.parse(
  fs.readFileSync(path.join(repoRoot, "docs", "LEGACY_NEXT_PROJECTS.json"), "utf8"),
);
const concurrency = Math.max(1, Math.min(8, Number(process.env.NEXT_BUILD_CONCURRENCY || 4)));
const projects = manifest.projects || [];

if (projects.length !== 59) {
  throw new Error(`Expected 59 legacy Next.js projects, found ${projects.length}.`);
}

function runBuild(project) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const projectDir = path.join(repoRoot, "demos", project.repoName);
    const isWindows = process.platform === "win32";
    const command = isWindows ? (process.env.ComSpec || "cmd.exe") : "npm";
    const args = isWindows ? ["/d", "/s", "/c", "npm run build"] : ["run", "build"];
    const child = spawn(command, args, {
      cwd: projectDir,
      env: process.env,
      shell: false,
      windowsHide: true,
    });
    let output = "";
    child.stdout.on("data", (chunk) => { output += chunk; });
    child.stderr.on("data", (chunk) => { output += chunk; });
    child.on("error", (error) => {
      resolve({
        repoName: project.repoName,
        status: "failed",
        durationMs: Date.now() - startedAt,
        output: String(error),
      });
    });
    child.on("close", (code) => {
      resolve({
        repoName: project.repoName,
        status: code === 0 ? "passed" : "failed",
        exitCode: code,
        durationMs: Date.now() - startedAt,
        output: output.slice(-5000),
      });
    });
  });
}

const rows = [];
let cursor = 0;

async function worker() {
  while (cursor < projects.length) {
    const project = projects[cursor++];
    const result = await runBuild(project);
    rows.push(result);
    console.log(`[${rows.length}/${projects.length}] ${result.status} ${project.repoName}`);
  }
}

await Promise.all(Array.from({ length: concurrency }, () => worker()));
rows.sort((a, b) => a.repoName.localeCompare(b.repoName));

const summary = {
  total: rows.length,
  passed: rows.filter((row) => row.status === "passed").length,
  failed: rows.filter((row) => row.status === "failed").length,
  failedRepos: rows.filter((row) => row.status === "failed").map((row) => row.repoName),
  concurrency,
  totalDurationMs: rows.reduce((sum, row) => sum + row.durationMs, 0),
};

fs.writeFileSync(
  path.join(repoRoot, "docs", "LEGACY_NEXT_BUILD_REPORT.json"),
  `${JSON.stringify({ generatedAt: new Date().toISOString(), summary, rows }, null, 2)}\n`,
  "utf8",
);
console.log(JSON.stringify(summary, null, 2));
if (summary.failed) process.exitCode = 1;
