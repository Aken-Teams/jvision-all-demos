#!/usr/bin/env node
/**
 * 檢查每個專案在目錄卡片上是否真的有預覽畫面。
 *
 * 卡片的預覽不是靜態縮圖，而是把 demoUrl 用 iframe 載進來縮放顯示
 * （app.js 的 cardHeroHTML / setupCardEmbeds）。所以「有沒有預覽」等於：
 *   1. demoUrl 存在
 *   2. 那個位址開得起來
 *   3. 開起來畫得出東西（不是空白頁）
 * 三件事都成立才看得到畫面，任何一件不成立卡片就只剩底色加一個灰圖示。
 *
 *   node tools/check-previews.mjs            只做 1、2（快，全部跑完約十幾秒）
 *   node tools/check-previews.mjs --render   加做 3（開瀏覽器，慢很多）
 *   node tools/check-previews.mjs --render --limit=50
 */
import fs from "node:fs";
import path from "node:path";
import http from "node:http";

const ROOT = path.resolve(import.meta.dirname, "..");
const args = new Set(process.argv.slice(2));
const RENDER = args.has("--render");
const LIMIT = Number([...args].find((a) => a.startsWith("--limit="))?.split("=")[1]) || 0;
const PORT = Number([...args].find((a) => a.startsWith("--port="))?.split("=")[1]) || 4611;

const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, "projects-index.json"), "utf8"));
let projects = catalog.projects;
if (LIMIT) projects = projects.slice(0, LIMIT);

const staticServer = await import("./lib/static-server.mjs");
const server = await staticServer.start({ root: ROOT, port: PORT });
const BASE = server.url;

const results = { noUrl: [], missing: [], notFound: [], blank: [], ok: [] };

/* ── 第一層：位址存在且開得起來 ── */
const head = (url) => new Promise((resolve) => {
  const req = http.get(url, { timeout: 8000 }, (res) => { res.resume(); resolve(res.statusCode); });
  req.on("error", () => resolve(0));
  req.on("timeout", () => { req.destroy(); resolve(0); });
});

let done = 0;
const queue = [...projects];
async function worker() {
  while (queue.length) {
    const p = queue.shift();
    done += 1;
    if (done % 200 === 0) process.stderr.write(`  ${done}/${projects.length}\n`);
    if (!p.demoUrl) { results.noUrl.push(p.repoName); continue; }

    /* 先看檔案在不在。HTTP 404 與「目錄裡根本沒這個 demo」是兩回事，
       前者可能是路徑寫錯，後者是專案被刪了卻還留在目錄裡。 */
    const local = path.join(ROOT, decodeURIComponent(p.demoUrl.replace(/^\//, "")), "index.html");
    if (!fs.existsSync(local)) { results.missing.push(`${p.repoName}　${p.demoUrl}`); continue; }

    const code = await head(`${BASE}${p.demoUrl}`);
    if (code !== 200) { results.notFound.push(`${p.repoName}　${p.demoUrl}　HTTP ${code}`); continue; }
    results.ok.push(p);
  }
}
await Promise.all(Array.from({ length: 12 }, worker));

console.log(`\n第一層：位址與檔案（共 ${projects.length} 個專案）`);
console.log(`  ✓ 開得起來        ${results.ok.length}`);
console.log(`  ✖ 沒有 demoUrl    ${results.noUrl.length}`);
console.log(`  ✖ 檔案不存在      ${results.missing.length}`);
console.log(`  ✖ 開不起來        ${results.notFound.length}`);
for (const [label, list] of [["沒有 demoUrl", results.noUrl], ["檔案不存在", results.missing], ["開不起來", results.notFound]]) {
  if (list.length) { console.log(`\n  ── ${label} ──`); list.slice(0, 40).forEach((x) => console.log(`    ${x}`)); if (list.length > 40) console.log(`    …另外 ${list.length - 40} 個`); }
}

/* ── 第二層：真的畫得出東西 ── */
if (RENDER) {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  /* 用卡片實際的 iframe 尺寸載入（app.js 寫死 1440×900 再縮放），
     不然在 390px 量到的會是手機版，跟卡片看到的不是同一件事。 */
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const todo = [...results.ok];
  let n = 0;
  async function renderWorker() {
    const page = await ctx.newPage();
    while (todo.length) {
      const p = todo.shift();
      n += 1;
      if (n % 100 === 0) process.stderr.write(`  渲染 ${n}/${results.ok.length}\n`);
      try {
        await page.goto(`${BASE}${p.demoUrl}`, { waitUntil: "domcontentloaded", timeout: 20000 });
        await page.waitForTimeout(400);
        const m = await page.evaluate(() => ({
          text: (document.body?.innerText || "").trim().length,
          boxes: document.querySelectorAll("body *").length,
          painted: [...document.querySelectorAll("canvas,svg,img")].some((e) => e.getBoundingClientRect().width > 40),
        }));
        /* 卡片是縮到約 1/4 大小顯示的，看的是「版面有沒有東西」而不是讀字。
           文字太少又沒有任何圖形元素，縮下去就是一片空白。 */
        if (m.text < 120 && !m.painted) results.blank.push(`${p.repoName}　文字 ${m.text} 字、無圖形元素`);
      } catch (e) {
        results.blank.push(`${p.repoName}　載入失敗：${String(e.message).split("\n")[0].slice(0, 50)}`);
      }
    }
    await page.close();
  }
  await Promise.all(Array.from({ length: 6 }, renderWorker));
  await browser.close();

  console.log(`\n第二層：實際渲染（共 ${results.ok.length} 個）`);
  console.log(`  ✓ 畫得出畫面      ${results.ok.length - results.blank.length}`);
  console.log(`  ✖ 空白或載入失敗  ${results.blank.length}`);
  if (results.blank.length) { console.log(`\n  ── 空白或載入失敗 ──`); results.blank.slice(0, 40).forEach((x) => console.log(`    ${x}`)); }
}

await server.close();
const bad = results.noUrl.length + results.missing.length + results.notFound.length + results.blank.length;
console.log(`\n${bad ? `✖ 有 ${bad} 個專案的卡片看不到預覽畫面` : "✓ 全部專案都有預覽畫面"}`);
process.exit(bad ? 1 : 0);
