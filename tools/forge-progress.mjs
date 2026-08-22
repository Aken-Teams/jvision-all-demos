#!/usr/bin/env node
/**
 * 建置／驗收／修正管線的進度儀表。
 *
 *   node tools/forge-progress.mjs [--watch] [--interval=10]
 *
 * 資料來源都是既有產物，不需要跑著的程序也能看：
 *   docs/DEMO_FORGE_MANIFEST.json   每個 demo 的狀態
 *   docs/_state/current-job.json    目前這輪工作的中繼資料（由啟動端寫入）
 *   docs/_state/*.log               各階段輸出
 */
import fs from "node:fs";
import path from "node:path";
import { ROOT, parseArgs, num } from "./lib/forge-common.mjs";

const args = parseArgs();
const STATE = path.join(ROOT, "docs", "_state");
const JOB = path.join(STATE, "current-job.json");

const readJson = (f, d) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return d; } };
const lines = (f) => { try { return fs.readFileSync(f, "utf8").split("\n"); } catch { return []; } };
const alive = (pid) => { try { process.kill(pid, 0); return true; } catch { return false; } };

/* 有 TTY 才上色，導向檔案時保持純文字 */
const TTY = process.stdout.isTTY && !process.env.NO_COLOR;
const C = (code) => (text) => (TTY ? `\x1b[${code}m${text}\x1b[0m` : String(text));
const dim = C("2"), bold = C("1"), green = C("32"), yellow = C("33"), red = C("31"), cyan = C("36");

const pct = (a, b) => (b ? (a / b) * 100 : 0);
const bar = (p, w = 34) => {
  const n = Math.round((Math.min(100, Math.max(0, p)) / 100) * w);
  const tone = p >= 100 ? green : p >= 50 ? cyan : yellow;
  return tone("█".repeat(n)) + dim("░".repeat(w - n));
};
const hms = (s) => {
  if (!isFinite(s) || s < 0) return "—";
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h ? `${h} 小時 ${m} 分` : m ? `${m} 分 ${Math.floor(s % 60)} 秒` : `${Math.floor(s)} 秒`;
};
const clock = (ms) => new Date(ms).toLocaleTimeString("zh-TW", { hour12: false });

function render() {
  const manifest = readJson(path.join(ROOT, "docs", "DEMO_FORGE_MANIFEST.json"), { entries: [] });
  const byState = {};
  for (const e of manifest.entries) byState[e.state] = (byState[e.state] || 0) + 1;
  const totalDemos = manifest.entries.filter((e) => e.state !== "discarded").length;

  const job = readJson(JOB, null);
  const out = [];
  out.push("");
  out.push(`  ${bold("JV Demo 產線進度")}　　${dim(new Date().toLocaleString("zh-TW", { hour12: false }))}`);
  out.push("  " + "─".repeat(64));

  /* ── 總體：demo 建置 ── */
  const built = (byState.built || 0) + (byState.verified || 0) + (byState.published || 0);
  out.push(`  建置　${String(built).padStart(3)} / ${totalDemos}   ${bar(pct(built, totalDemos))} ${pct(built, totalDemos).toFixed(1)}%`);

  /* ── 驗收：合併歷史與本輪 log ── */
  const logs = fs.existsSync(STATE) ? fs.readdirSync(STATE).filter((f) => f.endsWith(".log")) : [];
  const results = new Map();
  for (const f of logs) {
    for (const l of lines(path.join(STATE, f))) {
      const m = l.match(/^(OK|XX)\s+(\S+)/);
      if (m) results.set(m[2], m[1]);      // 後讀到的覆蓋先讀到的＝重驗結果優先
    }
  }
  const okCount = [...results.values()].filter((v) => v === "OK").length;
  const xxCount = results.size - okCount;
  out.push(`  驗收　${String(results.size).padStart(3)} / ${totalDemos}   ${bar(pct(results.size, totalDemos))} ${pct(results.size, totalDemos).toFixed(1)}%`);
  out.push(`  　　　${green("通過 " + okCount)}　${xxCount ? red("未過 " + xxCount) : "未過 0"}　通過率 ${pct(okCount, results.size || 1).toFixed(0)}%`);
  out.push("");

  /* ── 目前這輪 ── */
  if (!job) { out.push("  目前沒有進行中的工作。"); return out.join("\n"); }

  const running = alive(job.pid);
  const list = lines(path.join(ROOT, job.listPath)).filter(Boolean);
  const logLines = lines(path.join(ROOT, job.logPath));
  const doneNames = logLines.map((l) => (l.match(/^(?:OK|XX|\s+[✓·])\s+(\S+)/) || [])[1]).filter(Boolean);
  const done = doneNames.length;
  const total = job.total || list.length;
  const elapsed = (Date.now() - job.startedAt) / 1000;
  const rate = done > 0 ? elapsed / done : 0;
  const remain = Math.max(0, total - done);
  const eta = rate ? remain * rate / (job.concurrency || 1) * (job.concurrency || 1) : NaN;

  out.push(`  ${cyan("▸")} 目前階段：${bold(job.phase)}${running ? "" : dim("（已結束或中止）")}`);
  out.push(`    ${bar(pct(done, total))} ${pct(done, total).toFixed(1)}%　${done} / ${total}`);
  out.push("");
  out.push(`    開始時間　${clock(job.startedAt)}`);
  out.push(`    已執行　　${hms(elapsed)}`);
  out.push(`    平均速度　${rate ? rate.toFixed(1) + " 秒／個（並行 " + (job.concurrency || 1) + "）" : "—"}`);
  out.push(`    預計剩餘　${hms(eta)}`);
  out.push(`    預計完成　${isFinite(eta) ? clock(Date.now() + eta * 1000) : "—"}`);
  out.push("");

  /* ── 正在處理哪些 ── */
  if (running) {
    const inFlight = list.slice(done, done + (job.concurrency || 1));
    out.push(`    正在處理（並行 ${job.concurrency || 1}）：`);
    for (const r of inFlight) out.push(`      ${cyan("⟳")} ${bold(r)}`);
    out.push(`        ${dim(job.action)}`);
  }
  const tail = logLines.filter((l) => /^(OK|XX|\s+[✓·])\s+\S/.test(l)).slice(-3);
  if (tail.length) {
    out.push("");
    out.push("    最近完成：");
    for (const l of tail) {
      const t = l.trim();
      out.push(`      ${t.startsWith("OK") ? green(t) : t.startsWith("XX") ? red(t) : t}`);
    }
  }
  return out.join("\n");
}

if (args.watch) {
  const interval = Math.max(2, num(args.interval, 10)) * 1000;
  const cleanup = () => { if (TTY) process.stdout.write("\x1b[?25h"); process.exit(0); };
  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
  if (TTY) process.stdout.write("\x1b[?25l");
  const loop = () => {
    process.stdout.write((TTY ? "\x1b[2J\x1b[H" : "\n") + render() +
      `\n\n  ${dim(`每 ${interval / 1000} 秒更新，Ctrl+C 離開`)}\n`);
  };
  loop();
  setInterval(loop, interval);
} else {
  console.log(render());
}
