#!/usr/bin/env node
/**
 * 驗收新 demo：自動起靜態站，優先用既有三支正典工具，
 * 系統缺 Chrome 時退回內建的 bundled-chromium 驗收器。
 *
 * 既有 verify-demos / chartscan / loadscan 都硬編 http://localhost:4599 且
 * 用 chromium.launch({ channel: 'chrome' })；本檔不修改它們，只補足環境。
 *
 *   node tools/demo-verify.mjs <repo...>
 *   node tools/demo-verify.mjs --serve          # 只起站供人工審閱
 */
import path from "node:path";
import { spawnSync } from "node:child_process";
import { ROOT, EXIT, parseArgs, num, makeLogger, loadManifest, saveManifest, upsertEntry } from "./lib/forge-common.mjs";
import * as staticServer from "./lib/static-server.mjs";

const args = parseArgs();
const log = makeLogger({ quiet: Boolean(args.quiet) });
const PORT = num(args.port, 4599);
const repos = args._;

/* 純靜態驗收：本機沒有可用瀏覽器時的正式路徑（不是錯誤退回）。
   抓得到：檔案大小、6 個畫面、深連結、反模式、語法、圖表庫、stage 對應。
   抓不到：畫面是否真的互異、三種寬度是否跑版、圖表是否空白。 */
if (args["static-only"]) {
  const { staticGate } = await import("./lib/static-gate.mjs");
  const manifest = loadManifest();
  let allOk = true;
  for (const repo of repos) {
    const gate = staticGate(repo);
    if (!gate.pass) allOk = false;
    console.log(`  ${gate.pass ? "OK " : "XX "}${repo.padEnd(46)} ${gate.summary}`);
    if (!gate.pass) gate.issues.forEach((i) => console.log(`      ${i}`));
    upsertEntry(manifest, { repoName: repo, state: gate.pass ? "verified" : "failed", checks: { ...(manifest.entries.find((e) => e.repoName === repo)?.checks || {}), static: gate } });
  }
  saveManifest(manifest);
  console.log(allOk ? "\n  靜態驗收全部通過（未做瀏覽器驗收）" : "\n  有項目未通過");
  process.exit(allOk ? EXIT.OK : EXIT.PARTIAL);
}

const server = await staticServer.start({ root: ROOT, port: PORT });
log.info(`靜態站：${server.url}${server.reused ? "（沿用既有服務）" : ""}`);

if (args.serve || !repos.length) {
  log.info("按 Ctrl+C 結束。");
  await new Promise(() => {});
}

/** 跑既有正典工具；回傳 null 代表環境不支援（缺 Chrome）。 */
function runCanon(tool) {
  const r = spawnSync(process.execPath, [path.join(ROOT, "tools", tool), ...repos], { cwd: ROOT, encoding: "utf8" });
  const output = `${r.stdout || ""}${r.stderr || ""}`;
  if (/channel: 'chrome'|is not found at|playwright install/.test(output)) return null;
  return { output, code: r.status };
}

const results = {};
let usedFallback = false;

for (const tool of ["verify-demos.mjs", "chartscan.mjs", "loadscan.mjs"]) {
  const canon = runCanon(tool);
  if (canon === null) { usedFallback = true; break; }
  results[tool] = canon;
  log.step(`── ${tool} ──`);
  log.info(canon.output.trim().split("\n").map((l) => "  " + l).join("\n"));
}

if (usedFallback) {
  log.warn("系統沒有可用的 Chrome，改用內建驗收器（Playwright bundled chromium）。");
  log.warn("要使用正典工具請執行一次：npx playwright install chrome");
  /* 交棒前先把站收掉。spawnSync 會把父行程的事件迴圈整個擋住，父行程的
     HTTP server 因此答不了子行程的 probe；probe 逾時（1.5 秒）後子行程就去
     listen 同一個 port，撞成 EADDRINUSE——而錯誤訊息寫的是「被其他服務占用
     （非本專案靜態站）」，那個「其他服務」其實是它自己的父行程。
     缺系統 Chrome 的機器上這條路是唯一的驗收路徑，所以它整個是壞的。
     verify-runner 本來就會自己起站，這裡不需要留著。 */
  await server.close();
  const r = spawnSync(process.execPath, [path.join(ROOT, "tools", "lib", "verify-runner.mjs"), String(PORT), ...repos], { cwd: ROOT, encoding: "utf8", stdio: "inherit" });
  process.exit(r.status === 0 ? EXIT.OK : EXIT.PARTIAL);
}

/* 解析正典工具輸出，寫回 manifest */
const manifest = loadManifest();
let allOk = true;
for (const repo of repos) {
  const checks = {};
  for (const [tool, r] of Object.entries(results)) {
    const line = r.output.split("\n").find((l) => l.includes(repo)) || "";
    const pass = /^(OK|ok)\b/.test(line.trim());
    checks[tool.replace(".mjs", "")] = { pass, raw: line.trim() };
    if (!pass) allOk = false;
  }
  upsertEntry(manifest, { repoName: repo, state: Object.values(checks).every((c) => c.pass) ? "verified" : "failed", checks: { ...(manifest.entries.find((e) => e.repoName === repo)?.checks || {}), ...checks } });
}
saveManifest(manifest);

await server.close();
log.step(allOk ? "驗收全部通過" : "有項目未通過，詳見上方輸出");
process.exit(allOk ? EXIT.OK : EXIT.PARTIAL);
