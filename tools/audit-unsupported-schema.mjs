#!/usr/bin/env node
/**
 * 盤點「schema-extract 讀不到表格」的那批 demo 到底是什麼狀況。
 *
 * schema-extract 讀的是靜態 HTML。有些 demo 的表格是 JS 在執行時畫出來的，
 * 原始碼裡一個 <table> 都沒有，於是被判成 unsupported——但它們的
 * content/schema 還留著早期擷取到的欄位，而那份欄位跟現在的畫面對不上。
 *
 * 對不上的後果不是好不好看：jv-live 是靠 <th> 的文字去 DOM 找表，
 * 客戶複製了這種 demo，畫面看得到、輸入存不住，而且不會報錯。
 *
 * 所以要分清楚兩件事，處理方式完全不同：
 *   A 畫面上真的有表格，只是 schema 記的是舊的 → 可以從 DOM 重新抽
 *   B 畫面上根本沒有表格               → schema 本身就不該存在
 *
 *   node tools/audit-unsupported-schema.mjs [--limit=N] [--out=path]
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { ROOT, EXIT, parseArgs, num, makeLogger } from "./lib/forge-common.mjs";
import * as staticServer from "./lib/static-server.mjs";

const args = parseArgs();
const log = makeLogger({ quiet: Boolean(args.quiet) });
const OUT = path.join(ROOT, "docs", "_state", "unsupported-schema-audit.json");
const PORT = num(args.port, 4888);

const proposals = JSON.parse(fs.readFileSync(
  path.join(ROOT, "docs", "_state", "schema-proposals.json"), "utf8")).proposals;

let todo = Object.entries(proposals)
  .filter(([repo, p]) => p.readyState === "unsupported"
    && fs.existsSync(path.join(ROOT, "demos", repo, "index.html")))
  .map(([repo]) => repo);
if (args.limit) todo = todo.slice(0, num(args.limit, 0));

log.step(`盤點 ${todo.length} 套 unsupported`);
const server = await staticServer.start({ root: ROOT, port: PORT });
const browser = await chromium.launch();
const rows = [];

for (const repo of todo) {
  const scPath = path.join(ROOT, "content", "schema", `${repo}.json`);
  const sc = fs.existsSync(scPath) ? JSON.parse(fs.readFileSync(scPath, "utf8")) : null;
  const page = await browser.newPage();
  const seen = new Set();
  let err = null;
  try {
    await page.goto(`http://127.0.0.1:${PORT}/demos/${repo}/`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(500);
    /* 導覽的遮罩會擋住切畫面的點擊，先移掉——那是它本來的行為，不是壞掉。 */
    await page.evaluate(() => {
      document.querySelectorAll(".shepherd-modal-overlay-container,.shepherd-element").forEach((e) => e.remove());
    });
    const btns = await page.$$("[data-i]");
    for (let i = 0; i < btns.length; i++) {
      try { await btns[i].click({ timeout: 1200 }); await page.waitForTimeout(150); } catch { /* 點不到就算 */ }
      const sigs = await page.evaluate(() => [...document.querySelectorAll("table")].map((t) =>
        [...t.querySelectorAll("thead th, tr:first-child th")]
          .map((x) => x.textContent.replace(/\s+/g, " ").trim()).join("|")).filter(Boolean));
      sigs.forEach((s) => seen.add(s));
    }
  } catch (e) { err = String(e.message).slice(0, 80); }
  await page.close();

  const want = (sc?.tables || []).map((t) => (t.columns || []).map((c) => c.label).join("|"));
  const hit = want.filter((w) => seen.has(w)).length;
  const kind = err ? "開不起來"
    : seen.size === 0 ? "畫面沒有表格"
    : hit === want.length && want.length ? "其實是對的"
    : hit ? "部分對上"
    : "畫面有表格但 schema 是舊的";
  rows.push({ repo, kind, schemaTables: want.length, domTables: seen.size, hit, err,
    dom: [...seen].slice(0, 6) });
  process.stderr.write(".");
}
process.stderr.write("\n");
await browser.close();
server.close?.();

const by = {};
for (const r of rows) by[r.kind] = (by[r.kind] || 0) + 1;
log.step("盤點結果");
for (const [k, n] of Object.entries(by).sort((a, b) => b[1] - a[1])) log.info(`  ${k}：${n} 套`);
fs.writeFileSync(OUT, JSON.stringify({ at: new Date().toISOString(), summary: by, rows }, null, 2) + "\n");
log.info(`  → ${path.relative(ROOT, OUT)}`);
process.exit(EXIT.OK);
