import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const root = path.resolve(import.meta.dirname, "..");
const baseUrl = process.env.DEMO_BASE_URL || "http://127.0.0.1:4191";
const projects = JSON.parse(fs.readFileSync(path.join(root, "projects-index.json"), "utf8")).projects;
const executablePath = process.env.JVISION_BROWSER_EXECUTABLE || undefined;
const browser = await chromium.launch({ headless: true, executablePath });
const tablet = await browser.newContext({
  viewport: { width: 768, height: 1024 },
  locale: "zh-TW",
  reducedMotion: "reduce",
});

async function metrics(page) {
  return page.evaluate(() => {
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    };
    const exposedOverflow = (element) => {
      const rect = element.getBoundingClientRect();
      const amount = Math.max(rect.right - innerWidth, -rect.left);
      if (amount <= 0) return 0;
      let parent = element.parentElement;
      while (parent && parent !== document.body) {
        if (["auto", "scroll", "hidden", "clip"].includes(getComputedStyle(parent).overflowX)) return 0;
        parent = parent.parentElement;
      }
      return amount;
    };
    const elements = [...document.querySelectorAll("body *")].filter(visible);
    const overflow = elements.reduce((max, element) => Math.max(max, exposedOverflow(element)), 0);
    const tooSmall = [...document.querySelectorAll('button,a[href],input:not([type="radio"]):not([type="checkbox"]),select,textarea')]
      .filter(visible)
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width < 32 || rect.height < 32;
      }).length;
    return {
      contentLength: (document.body?.innerText || "").trim().length,
      overflow: Math.max(0, Math.round(overflow)),
      errorOverlay: Boolean(document.querySelector("[data-nextjs-dialog],nextjs-portal,.vite-error-overlay,#webpack-dev-server-client-overlay")),
      tooSmall,
    };
  });
}

const rows = new Array(projects.length);
let cursor = 0;
async function worker() {
  const page = await tablet.newPage();
  while (true) {
    const index = cursor++;
    if (index >= projects.length) break;
    const project = projects[index];
    const errors = [];
    page.removeAllListeners("pageerror");
    page.on("pageerror", (error) => errors.push(error.message));
    try {
      const response = await page.goto(`${baseUrl}${project.demoUrl}?rwd-audit=tablet`, { waitUntil: "load", timeout: 20000 });
      await page.waitForTimeout(120);
      const result = await metrics(page);
      const reasons = [];
      if (!response || response.status() >= 400) reasons.push(`HTTP ${response?.status() || 0}`);
      if (result.contentLength < 40) reasons.push("content too short");
      if (result.overflow > 8) reasons.push(`horizontal overflow ${result.overflow}px`);
      if (result.errorOverlay) reasons.push("framework error overlay");
      const warnings = errors.filter((message) => message.includes("Minified React error #418"));
      const blockingErrors = errors.filter((message) => !message.includes("Minified React error #418"));
      if (blockingErrors.length) reasons.push(`page error: ${blockingErrors[0]}`);
      rows[index] = { repoName: project.repoName, title: project.title, passed: reasons.length === 0, reasons, warnings, ...result };
    } catch (error) {
      rows[index] = { repoName: project.repoName, title: project.title, passed: false, reasons: [error.message], overflow: -1, tooSmall: -1 };
    }
    if ((index + 1) % 50 === 0 || index + 1 === projects.length) console.log(`RWD_TABLET_PROGRESS ${index + 1}/${projects.length}`);
  }
  await page.close();
}

await Promise.all(Array.from({ length: 8 }, worker));
await tablet.close();

const hubRows = [];
for (const viewport of [
  { name: "desktop", width: 1440, height: 960 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
]) {
  const context = await browser.newContext({ viewport, locale: "zh-TW", reducedMotion: "reduce" });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const response = await page.goto(baseUrl, { waitUntil: "load", timeout: 20000 });
  await page.waitForTimeout(300);
  const result = await metrics(page);
  const reasons = [];
  if (!response || response.status() >= 400) reasons.push(`HTTP ${response?.status() || 0}`);
  if (result.contentLength < 40) reasons.push("content too short");
  if (result.overflow > 8) reasons.push(`horizontal overflow ${result.overflow}px`);
  if (result.errorOverlay) reasons.push("framework error overlay");
  const warnings = errors.filter((message) => message.includes("Minified React error #418"));
  const blockingErrors = errors.filter((message) => !message.includes("Minified React error #418"));
  if (blockingErrors.length) reasons.push(`page error: ${blockingErrors[0]}`);
  hubRows.push({ viewport: viewport.name, passed: reasons.length === 0, reasons, warnings, ...result });
  await context.close();
}

await browser.close();
const failures = rows.filter((row) => !row.passed);
const summary = {
  demos: rows.length,
  demosPassed: rows.length - failures.length,
  demosFailed: failures.length,
  tabletNoOverflow: rows.filter((row) => row.overflow <= 8).length,
  tabletTouchTargetsPassed: rows.filter((row) => row.tooSmall === 0).length,
  recoverableHydrationWarnings: rows.filter((row) => row.warnings?.length).length,
  hubViewportsPassed: hubRows.filter((row) => row.passed).length,
  hubViewports: hubRows.length,
};
const report = { generatedAt: new Date().toISOString(), baseUrl, summary, hub: hubRows, failures, rows };
fs.writeFileSync(path.join(root, "docs", "ALL_RWD_AUDIT.json"), `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(path.join(root, "docs", "ALL_RWD_AUDIT.md"), [
  "# 全站 RWD 稽核",
  "",
  `- Demo 平板版通過：${summary.demosPassed} / ${summary.demos}`,
  `- Demo 平板版無水平溢位：${summary.tabletNoOverflow} / ${summary.demos}`,
  `- Demo 平板版操作元件尺寸通過：${summary.tabletTouchTargetsPassed} / ${summary.demos}`,
  `- 舊版靜態輸出 hydration 警告（不影響 RWD）：${summary.recoverableHydrationWarnings}`,
  `- 入口網站桌機／平板／手機通過：${summary.hubViewportsPassed} / ${summary.hubViewports}`,
  "",
  ...failures.map((row) => `- ${row.repoName}：${row.reasons.join("；")}`),
  "",
].join("\n"));
console.log(JSON.stringify(summary, null, 2));
if (failures.length || summary.hubViewportsPassed !== summary.hubViewports) process.exitCode = 1;
