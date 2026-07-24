import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const root = process.cwd();
const baseUrl = process.env.DEMO_BASE_URL || "http://127.0.0.1:4191";
const localServer = process.env.DEMO_BASE_URL
  ? null
  : spawn("C:\\Python314\\python.exe", ["-m", "http.server", "4191", "--bind", "127.0.0.1"], {
      cwd: root,
      stdio: "ignore",
      windowsHide: true
    });
if (localServer) await new Promise((resolve) => setTimeout(resolve, 1200));
const samples = [
  "jvision-smart-mfg-117-contract-management",
  "jvision-smart-mfg-063-corrective-and-preventive-action",
  "jvision-smart-mfg-221-financial-accounting-system"
];
const outputDir = path.join(root, "output", "compact-sticky-sidebars");
fs.mkdirSync(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const rows = [];
try {
  for (const repoName of samples) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 960 }, locale: "zh-TW" });
    const page = await context.newPage();
    await page.goto(`${baseUrl}/demos/${repoName}/`, { waitUntil: "networkidle" });
    const before = await page.locator(".side-panel").evaluate((element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      const nav = element.querySelector(".module-nav")?.getBoundingClientRect();
      const summary = element.querySelector(".ops-summary")?.getBoundingClientRect();
      return {
        height: Math.round(rect.height),
        viewport: innerHeight,
        position: style.position,
        top: Math.round(rect.top),
        maxHeight: style.maxHeight,
        overflowY: style.overflowY,
        summaryGap: nav && summary ? Math.round(summary.top - nav.bottom) : null,
        horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
      };
    });
    await page.evaluate(() => scrollTo(0, Math.min(300, document.documentElement.scrollHeight)));
    await page.waitForTimeout(150);
    const afterScrollTop = await page.locator(".side-panel").evaluate((element) => Math.round(element.getBoundingClientRect().top));
    const screenshot = path.join(outputDir, `${repoName}.png`);
    await page.screenshot({ path: screenshot, fullPage: false });
    rows.push({
      repoName,
      passed:
        before.position === "sticky" &&
        before.height < before.viewport - 20 &&
        before.summaryGap <= 24 &&
        before.horizontalOverflow <= 8 &&
        afterScrollTop >= 0,
      before,
      afterScrollTop,
      screenshot: path.relative(root, screenshot).replaceAll("\\", "/")
    });
    await context.close();
  }

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "zh-TW" });
  const page = await mobile.newPage();
  await page.goto(`${baseUrl}/demos/${samples[0]}/`, { waitUntil: "networkidle" });
  const mobileMetrics = await page.locator(".side-panel").evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      position: style.position,
      maxHeight: style.maxHeight,
      overflowY: style.overflowY,
      horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
    };
  });
  await page.screenshot({ path: path.join(outputDir, "mobile.png"), fullPage: false });
  await mobile.close();

  const summary = {
    generatedAt: new Date().toISOString(),
    total: rows.length,
    passed: rows.filter((row) => row.passed).length,
    failed: rows.filter((row) => !row.passed).length,
    mobilePassed:
      mobileMetrics.position !== "sticky" &&
      mobileMetrics.horizontalOverflow <= 8
  };
  fs.writeFileSync(
    path.join(root, "docs", "COMPACT_STICKY_SIDEBAR_VERIFICATION.json"),
    `${JSON.stringify({ summary, mobileMetrics, rows }, null, 2)}\n`
  );
  console.log(JSON.stringify({ summary, mobileMetrics, rows }, null, 2));
  if (summary.failed || !summary.mobilePassed) process.exitCode = 1;
} finally {
  await browser.close();
  localServer?.kill();
}
