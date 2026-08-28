#!/usr/bin/env node
/**
 * 產線評測：用固定的 golden set 走完整的 建置→驗收→修正→重驗，量出
 * 一次過關率、平均耗時、修正回合——改 prompt 或 schema 之後跑一次，
 * 跟上一次比，才知道是變好還是變壞。沒有這個，迭代全靠感覺。
 *
 *   node tools/eval-pipeline.mjs               全部 12 題（約 70 分鐘）
 *   node tools/eval-pipeline.mjs --limit=2     抽測
 *   node tools/eval-pipeline.mjs --keep        跑完不清現場（除錯用）
 *
 * 評測品永不上架：slug 都是 eval- 前綴，跑完刪 demos/、details、manifest 條目。
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync, execSync } from "node:child_process";

const ROOT = path.resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const LIMIT = Number((args.find((a) => a.startsWith("--limit=")) || "").split("=")[1]) || 0;
const KEEP = args.includes("--keep");
const GOLDEN = path.join(ROOT, "tools", "eval", "golden-topics.json");
const RUNS_DIR = path.join(ROOT, "docs", "_state", "eval-runs");
const PORT = 4620;

const golden = JSON.parse(fs.readFileSync(GOLDEN, "utf8"));
const topics = LIMIT ? golden.accepted.slice(0, LIMIT) : golden.accepted;
fs.mkdirSync(RUNS_DIR, { recursive: true });

const run = (cmd, cmdArgs, timeout) =>
  spawnSync(process.execPath, [path.join(ROOT, cmd), ...cmdArgs], { cwd: ROOT, encoding: "utf8", timeout });

function cleanup() {
  for (const d of fs.readdirSync(path.join(ROOT, "demos"))) {
    if (d.startsWith("jvision-eval-")) fs.rmSync(path.join(ROOT, "demos", d), { recursive: true, force: true });
  }
  for (const f of fs.readdirSync(path.join(ROOT, "content", "details"))) {
    if (f.startsWith("jvision-eval-")) fs.unlinkSync(path.join(ROOT, "content", "details", f));
  }
  const mp = path.join(ROOT, "docs", "DEMO_FORGE_MANIFEST.json");
  const m = JSON.parse(fs.readFileSync(mp, "utf8"));
  const before = m.entries.length;
  m.entries = m.entries.filter((e) => !String(e.repoName).startsWith("jvision-eval-"));
  if (m.entries.length !== before) fs.writeFileSync(mp, JSON.stringify(m, null, 2) + "\n");
}

console.log(`評測 ${topics.length} 題（每題約 6 分鐘）`);
const results = [];
for (const t of topics) {
  const repo = t.repoName;
  const t0 = Date.now();
  process.stdout.write(`  ${t.title.padEnd(14)} 建置…`);

  const forge = run("tools/demo-forge.mjs", [`--from=${GOLDEN}`, `--pick=${t.slug}`, "--concurrency=1", "--timeout=1500"], 1700000);
  const htmlPath = path.join(ROOT, "demos", repo, "index.html");
  const built = fs.existsSync(htmlPath);
  if (!built) {
    console.log(` ✖ 建置失敗（${Math.round((Date.now() - t0) / 1000)}s）`);
    results.push({ slug: t.slug, title: t.title, built: false, pass: false, firstPass: false, fixRounds: 0, durationMs: Date.now() - t0 });
    continue;
  }
  const sizeKB = Math.round(fs.statSync(htmlPath).size / 1024);

  /* 與產線相同的驗收→修正→重驗，最多兩回合 */
  let pass = false, fixRounds = 0, firstPass = false;
  const roundIssues = []; // 每一輪沒過的 XX 行原文——失敗材料是分析 prompt 改動的依據，不留就白跑
  for (let round = 1; round <= 2; round += 1) {
    const v = run("tools/lib/verify-runner.mjs", [String(PORT), repo], 300000);
    const okLine = (v.stdout || "").split("\n").find((l) => l.startsWith("OK " + repo));
    if (okLine) { pass = true; firstPass = round === 1; break; }
    roundIssues.push((v.stdout || "").split("\n").find((l) => l.startsWith("XX " + repo)) || (v.stdout || v.stderr || "").trim().slice(-200));
    if (round === 1) {
      fixRounds += 1;
      run("tools/fix-demo-overflow.mjs", [`--port=${PORT}`, "--concurrency=1", repo], 300000);
    }
  }
  const durationMs = Date.now() - t0;
  console.log(` ${pass ? (firstPass ? "✓ 一次過" : "✓ 修正後過") : "✖ 未過"}（${Math.round(durationMs / 1000)}s，${sizeKB}KB）`);
  if (roundIssues.length) console.log(`    第 1 輪未過：${String(roundIssues[0]).slice(0, 160)}`);
  results.push({ slug: t.slug, title: t.title, built: true, pass, firstPass, fixRounds, durationMs, sizeKB, ...(roundIssues.length ? { roundIssues } : {}) });
}

const passN = results.filter((r) => r.pass).length;
const firstN = results.filter((r) => r.firstPass).length;
const avgMs = Math.round(results.reduce((a, r) => a + r.durationMs, 0) / results.length);
const summary = {
  total: results.length, pass: passN, firstPass: firstN,
  passRate: +(passN / results.length).toFixed(2),
  firstPassRate: +(firstN / results.length).toFixed(2),
  avgDurationMs: avgMs,
};

const head = execSync("git rev-parse --short HEAD", { cwd: ROOT, encoding: "utf8" }).trim();
const report = { at: new Date().toISOString(), gitHead: head, limit: LIMIT || null, summary, results };
const file = path.join(RUNS_DIR, `${report.at.replace(/[:.]/g, "-")}.json`);
fs.writeFileSync(file, JSON.stringify(report, null, 2) + "\n");

console.log(`\n本次：通過 ${passN}/${results.length}　一次過關 ${firstN}（${Math.round(summary.firstPassRate * 100)}%）　平均 ${Math.round(avgMs / 1000)}s`);

/* 與上一次同規模的紀錄比較——不同 limit 的抽測跟全量比沒有意義 */
const prev = fs.readdirSync(RUNS_DIR).filter((f) => f.endsWith(".json")).sort().slice(0, -1)
  .map((f) => JSON.parse(fs.readFileSync(path.join(RUNS_DIR, f), "utf8")))
  .filter((r) => (r.limit || null) === (LIMIT || null)).pop();
if (prev) {
  const d = (a, b, unit, invert) => {
    const diff = a - b;
    const sign = diff > 0 ? "+" : "";
    const good = invert ? diff < 0 : diff > 0;
    return `${sign}${unit === "s" ? Math.round(diff / 1000) : Math.round(diff * 100)}${unit}${diff === 0 ? "" : good ? " ↑好" : " ↓差"}`;
  };
  console.log(`對比上次（${prev.gitHead}，${prev.at.slice(0, 16)}）：一次過關 ${d(summary.firstPassRate, prev.summary.firstPassRate, "pt")}　平均耗時 ${d(avgMs, prev.summary.avgDurationMs, "s", true)}`);
} else {
  console.log("（首次紀錄，之後的執行會自動與本次比較）");
}
console.log(`報告：${path.relative(ROOT, file)}`);

if (!KEEP) { cleanup(); console.log("評測現場已清除（--keep 可保留）"); }
