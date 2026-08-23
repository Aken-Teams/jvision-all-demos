#!/usr/bin/env node
/**
 * 掃全站 demo 的 console 錯誤。
 *
 * 與 verify-runner 的差別：那支要切六個畫面、量圖表像素、三個寬度各載一次，
 * 一套要十幾秒；這支只載入一次收錯誤，一套不到一秒，所以全站掃得動。
 * 用途是回答「哪些 demo 會噴錯」，不是取代驗收。
 *
 *   node tools/scan-console-errors.mjs [--port=4616] [--limit=N]
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import * as staticServer from "./lib/static-server.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const val = (k, d) => Number(args.find((a) => a.startsWith(`--${k}=`))?.split("=")[1]) || d;
const PORT = val("port", 4616);
const LIMIT = val("limit", 0);

const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, "projects-index.json"), "utf8"));
let projects = catalog.projects.filter((p) => p.demoUrl);
if (LIMIT) projects = projects.slice(0, LIMIT);

const server = await staticServer.start({ root: ROOT, port: PORT });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });

const bad = [];
const queue = [...projects];
let done = 0;

async function worker() {
  const page = await ctx.newPage();
  while (queue.length) {
    const p = queue.shift();
    done += 1;
    if (done % 200 === 0) process.stderr.write(`  ${done}/${projects.length}\n`);
    const errs = [];
    const onErr = (e) => errs.push(String(e.message || e).split("\n")[0].slice(0, 90));
    const onConsole = (m) => { if (m.type() === "error") errs.push(m.text().split("\n")[0].slice(0, 90)); };
    page.on("pageerror", onErr);
    page.on("console", onConsole);
    try {
      await page.goto(`${server.url}${p.demoUrl}`, { waitUntil: "domcontentloaded", timeout: 20000 });
      await page.waitForTimeout(600);
    } catch (e) { errs.push(`載入失敗：${String(e.message).split("\n")[0].slice(0, 60)}`); }
    page.off("pageerror", onErr);
    page.off("console", onConsole);
    if (errs.length) bad.push({ repo: p.repoName, title: p.title, errs: [...new Set(errs)] });
  }
  await page.close();
}
await Promise.all(Array.from({ length: 8 }, worker));
await browser.close();
await server.close();

console.log(`\n掃描 ${projects.length} 套`);
console.log(`  ✓ 無錯誤   ${projects.length - bad.length}`);
console.log(`  ✖ 有錯誤   ${bad.length}`);
if (bad.length) {
  const byMsg = new Map();
  for (const b of bad) for (const e of b.errs) byMsg.set(e, (byMsg.get(e) || 0) + 1);
  console.log(`\n  ── 錯誤訊息分佈 ──`);
  [...byMsg].sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([m, n]) => console.log(`    ${String(n).padStart(4)} × ${m}`));
  console.log(`\n  ── 出錯的 demo ──`);
  bad.slice(0, 40).forEach((b) => console.log(`    ${b.repo}（${b.title}）\n        ${b.errs.join("\n        ")}`));
  if (bad.length > 40) console.log(`    …另外 ${bad.length - 40} 套`);
  fs.writeFileSync(path.join(ROOT, "docs", "_state", "console-errors.json"), JSON.stringify(bad, null, 2) + "\n");
  console.log(`\n  完整清單：docs/_state/console-errors.json`);
}
process.exit(bad.length ? 1 : 0);
