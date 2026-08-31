/**
 * 內建驗收器（fallback）。與 tools/verify-demos.mjs + chartscan + loadscan 同語意，
 * 但用 Playwright 自帶的 chromium 而非系統 Chrome，且 port 可傳入。
 *
 *   node tools/lib/verify-runner.mjs <port> <repo...>
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import * as staticServer from "./static-server.mjs";
import { loadManifest, saveManifest, upsertEntry } from "./forge-common.mjs";

const [, , portArg, ...repos] = process.argv;
const PORT = Number(portArg) || 4599;
const ROOT = path.resolve(import.meta.dirname, "..", "..");
const BASE = `http://127.0.0.1:${PORT}/demos/`;

/* 這支工具原本假設 port 上已經有人起了站，連不上就整個拋例外中止。實際上
   呼叫它的產線（run-batch.sh、agent-loop.sh）都沒有起站，靠的是環境裡剛好
   有一個別處留下的站；那個程序一沒了，每一套都會被記成「驗收未過」——工具
   崩潰被讀成 demo 有問題（實測連續 20 套全被誤判，其實全部乾淨通過）。
   改成自己確保站台存在，已經有人在聽就沿用（start() 內建 probe）。 */
const server = await staticServer.start({ root: ROOT, port: PORT });

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1360, height: 900 } });
let allOk = true;
/* 驗收結果要回寫 manifest。原本這支只印 OK/XX 就結束，而另外兩條驗收路徑
   （--static-only 與正典工具）都會 upsertEntry。結果是：沒有系統 Chrome 的
   機器只走得到這一條，跑完什麼都沒被記下來，demo 永遠停在 built/failed、
   到不了 verified，demo-publish 也就永遠說「沒有可上架的項目」。
   驗收跑了、畫面也對，只是沒有人把結果寫下來——這條退路整個是死的。 */
const manifest = loadManifest();

for (const repo of repos) {
 let page = null;
 try {
  const detailPath = path.join(ROOT, "content", "details", `${repo}.json`);
  const stages = fs.existsSync(detailPath)
    ? (JSON.parse(fs.readFileSync(detailPath, "utf8")).flow?.stages || []).map((s) => s.demo)
    : [];

  page = await context.newPage();
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

  /* 圖表逐畫面量測（只在最後一個畫面量會漏報）。
     只在最後一個 stage 量會漏報：ApexCharts 畫的是 SVG，隱藏畫面上的
     SVG getBoundingClientRect().width 為 0 會被濾掉，而 Chart.js／ECharts
     用 canvas、點陣圖在隱藏後仍在，於是同樣的 demo 會因圖表庫不同而結果相反。 */
  /* 不要在量之前等 animation frame：實測加了兩個 rAF 之後，同一頁的
     canvas 每次都量成 0（不加是 1）。headless 下等 frame 反而讓量測落在
     ECharts 清畫布、還沒重畫完的那一刻。 */
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

  /* 單次取樣不可靠：多數 demo 是切到該畫面才建圖表，260ms 內有沒有畫完
     並不確定，同一個 demo 連跑三次會得到 charts=6 或 charts=0 兩種結果
     （實測可重現）。改成輪詢，量到就停，量不到才花滿 1.2 秒確認是真的空白。 */
  const measureStable = async () => {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const n = await measure();
      if (n > 0) return n;
      await page.waitForTimeout(150);
    }
    return 0;
  };

  const screenCount = Math.max(stages.length, 6);

  /* 圖表要在任何 setViewportSize 之前量完。改變視窗大小會讓 ECharts 清掉
     並重畫 canvas，量測落在清掉、還沒畫回來的空檔，同一個 demo 連跑三次
     只有一次量得到（實測）。所以先在固定視窗下把六個畫面的圖表量完，
     再另跑一輪只量溢出。 */
  let chartPixels = 0;
  for (let v = 0; v < screenCount; v += 1) {
    await page.evaluate((n) => { location.hash = `#go=${n}`; }, v);
    await page.waitForTimeout(260);
    chartPixels += await measureStable();
  }

  /* 每個寬度都重新開一個分頁載入，不用 setViewportSize 把 1360 縮到 390。
     縮視窗會留下以載入寬度算出來的東西——最明顯的是 ECharts 的 canvas，
     它在 1360 建好之後不會自己縮，於是報出手機根本不會發生的溢出
     （實測 56 個「溢出」裡有 45 個是這樣來的假陽性）。真實手機使用者是
     直接以 390 載入，所以要照那個情境量。 */
  const overflow = [];
  for (const width of [1360, 768, 390]) {
    const wp = width === 1360 ? page : await context.newPage();
    if (wp !== page) {
      await wp.setViewportSize({ width, height: 900 });
      await wp.goto(`${BASE}${repo}/`, { waitUntil: "domcontentloaded", timeout: 40000 });
    }
    let worst = 0;
    for (let v = 0; v < screenCount; v += 1) {
      await wp.evaluate((n) => { location.hash = `#go=${n}`; }, v);
      await wp.waitForTimeout(260);
      const over = await wp.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (over > worst) worst = over;
    }
    if (worst > 2) overflow.push(`${width}px:+${worst}`);
    if (wp !== page) await wp.close();
  }

  const distinctOk = stages.length > 0 && signatures.size === stages.length;
  const ok = distinctOk && firstPaint && chartPixels > 0 && overflow.length === 0 && errors.length === 0;
  if (!ok) allOk = false;

  console.log(`${ok ? "OK " : "XX "}${repo.padEnd(44)} stages=${stages.length} distinct=${signatures.size} firstPaint=${firstPaint ? "y" : "n"} charts=${chartPixels} overflow=${overflow.join(",") || "none"} err=${errors.length}`);
  if (errors.length) errors.slice(0, 2).forEach((e) => console.log(`      ${e}`));
  upsertEntry(manifest, { repoName: repo, state: ok ? "verified" : "failed",
    checks: { ...(manifest.entries.find((e) => e.repoName === repo)?.checks || {}),
      browser: { pass: ok, stages: stages.length, distinct: signatures.size, firstPaint,
        chartPixels, overflow, errors: errors.slice(0, 3) } } });
 } catch (error) {
  /* 單一 demo 讓驗收器出錯時不要把整批拖垮：記成該套未過，其餘照跑。
     原本一個例外會終止整個行程，後面幾百套完全沒被驗到。 */
  allOk = false;
  console.log(`XX ${repo.padEnd(44)} 驗收器錯誤：${String(error.message).split("\n")[0].slice(0, 90)}`);
  upsertEntry(manifest, { repoName: repo, state: "failed",
    checks: { ...(manifest.entries.find((e) => e.repoName === repo)?.checks || {}),
      browser: { pass: false, error: String(error.message).slice(0, 200) } } });
 } finally {
  if (page) await page.close().catch(() => {});
 }
}

await browser.close();
await server.close();
saveManifest(manifest);
process.exit(allOk ? 0 : 1);
