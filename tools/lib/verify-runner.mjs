/**
 * 內建驗收器（fallback）。與 tools/verify-demos.mjs + chartscan + loadscan 同語意，
 * 但用 Playwright 自帶的 chromium 而非系統 Chrome，且 port 可傳入。
 *
 *   node tools/lib/verify-runner.mjs <port> <repo...>
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const [, , portArg, ...repos] = process.argv;
const PORT = Number(portArg) || 4599;
const ROOT = path.resolve(import.meta.dirname, "..", "..");
const BASE = `http://127.0.0.1:${PORT}/demos/`;

const browser = await chromium.launch();
const context = await browser.newContext();
let allOk = true;

for (const repo of repos) {
  const detailPath = path.join(ROOT, "content", "details", `${repo}.json`);
  const stages = fs.existsSync(detailPath)
    ? (JSON.parse(fs.readFileSync(detailPath, "utf8")).flow?.stages || []).map((s) => s.demo)
    : [];

  const page = await context.newPage();
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 100)); });
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 100)));

  await page.goto(`${BASE}${repo}/`, { waitUntil: "networkidle", timeout: 40000 });

  // 打開即有內容（loadscan 的語意）
  const firstPaint = (await page.evaluate(() => (document.body.innerText || "").trim().length)) > 200;

  // 每個 stage 對到的畫面必須互異（verify-demos 的語意）
  const signatures = new Set();
  for (const stage of stages) {
    const n = String(stage).replace(/\D/g, "") || "0";
    await page.evaluate((v) => { location.hash = `#go=${v}`; }, n);
    await page.waitForTimeout(500);
    signatures.add(await page.evaluate(() => (document.body.innerText || "").replace(/\s+/g, "").slice(0, 3000)));
  }

  /* 圖表與溢出都必須逐畫面量測。
     只在最後一個 stage 量會漏報：ApexCharts 畫的是 SVG，隱藏畫面上的
     SVG getBoundingClientRect().width 為 0 會被濾掉，而 Chart.js／ECharts
     用 canvas、點陣圖在隱藏後仍在，於是同樣的 demo 會因圖表庫不同而結果相反。 */
  const measure = () => page.evaluate(() => {
    const vis = (el) => el.getBoundingClientRect().width > 40;
    let painted = 0;
    for (const s of document.querySelectorAll("svg")) {
      if (vis(s) && s.querySelector("path,rect,circle,line,polyline")) painted += 1;
    }
    for (const c of document.querySelectorAll("canvas")) {
      try {
        const ctx = c.getContext("2d");
        if (!ctx || !c.width || !c.height) continue;
        const d = ctx.getImageData(0, 0, c.width, c.height).data;
        for (let i = 3; i < d.length; i += 4000) if (d[i] > 0) { painted += 1; break; }
      } catch { /* webgl 或跨域取不到就跳過 */ }
    }
    return painted;
  });

  const screenCount = Math.max(stages.length, 6);
  let chartPixels = 0;
  const overflow = [];
  for (const width of [1360, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    let worst = 0;
    for (let v = 0; v < screenCount; v += 1) {
      await page.evaluate((n) => { location.hash = `#go=${n}`; }, v);
      await page.waitForTimeout(260);
      if (width === 1360) chartPixels += await measure();
      const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (over > worst) worst = over;
    }
    if (worst > 2) overflow.push(`${width}px:+${worst}`);
  }

  const distinctOk = stages.length > 0 && signatures.size === stages.length;
  const ok = distinctOk && firstPaint && chartPixels > 0 && overflow.length === 0 && errors.length === 0;
  if (!ok) allOk = false;

  console.log(`${ok ? "OK " : "XX "}${repo.padEnd(44)} stages=${stages.length} distinct=${signatures.size} firstPaint=${firstPaint ? "y" : "n"} charts=${chartPixels} overflow=${overflow.join(",") || "none"} err=${errors.length}`);
  if (errors.length) errors.slice(0, 2).forEach((e) => console.log(`      ${e}`));
  await page.close();
}

await browser.close();
process.exit(allOk ? 0 : 1);
