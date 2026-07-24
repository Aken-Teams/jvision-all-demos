import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const root = process.cwd();
const baseUrl = process.env.DEMO_BASE_URL || "http://127.0.0.1:4191";
const projects = JSON.parse(fs.readFileSync(path.join(root, "projects-index.json"), "utf8")).projects || [];
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "zh-TW" });
const results = new Array(projects.length);
const workerCount = 3;

async function inspect(project, index) {
  const page = await context.newPage();
  try {
    await page.goto(`${baseUrl}${project.demoUrl}?hub-navigation-layout-test=1`, { waitUntil: "load", timeout: 20000 });
    try {
      await page.waitForSelector(".jv-demo-hub-link", { timeout: 5000 });
    } catch {
      await page.reload({ waitUntil: "load", timeout: 20000 });
      await page.waitForSelector(".jv-demo-hub-link", { timeout: 8000 });
    }
    const desktop = await page.evaluate(() => {
      const link = document.querySelector(".jv-demo-hub-link");
      const rect = link.getBoundingClientRect();
      const paddingBottom = Number.parseFloat(getComputedStyle(document.body).paddingBottom) || 0;
      const candidates = [...document.querySelectorAll('header,nav,.logo,.brand,[class*="logo"],[class*="brand"]')]
        .filter(element => element !== link && !element.contains(link))
        .map(element => element.getBoundingClientRect())
        .filter(candidate => candidate.width > 0 && candidate.height > 0);
      const overlapsHeader = candidates.some(candidate =>
        rect.left < candidate.right && rect.right > candidate.left &&
        rect.top < candidate.bottom && rect.bottom > candidate.top
      );
      return {
        top: Math.round(rect.top),
        bottomGap: Math.round(innerHeight - rect.bottom),
        left: Math.round(rect.left),
        paddingBottom,
        overlapsHeader,
        href: link.href
      };
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(320);
    const mobile = await page.evaluate(() => {
      const rect = document.querySelector(".jv-demo-hub-link").getBoundingClientRect();
      return {
        bottomGap: Math.round(innerHeight - rect.bottom),
        centerDelta: Math.round(Math.abs((rect.left + rect.width / 2) - innerWidth / 2)),
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
      };
    });
    const passed = desktop.top > 700 && desktop.bottomGap >= 10 && desktop.left <= 30 &&
      desktop.paddingBottom >= 68 && !desktop.overlapsHeader &&
      desktop.href === `${baseUrl}/` && mobile.bottomGap >= 10 &&
      mobile.centerDelta <= 2 && mobile.overflow <= 8;
    results[index] = { id: project.id, repoName: project.repoName, passed, desktop, mobile };
  } catch (error) {
    results[index] = { id: project.id, repoName: project.repoName, passed: false, error: String(error) };
  } finally {
    await page.close();
  }
}

let cursor = 0;
await Promise.all(Array.from({ length: workerCount }, async () => {
  while (cursor < projects.length) {
    const index = cursor++;
    await inspect(projects[index], index);
  }
}));
for (const index of results.map((result, index) => result?.passed ? -1 : index).filter(index => index >= 0)) {
  await inspect(projects[index], index);
}
await context.close();
await browser.close();

const summary = {
  generatedAt: new Date().toISOString(),
  total: results.length,
  passed: results.filter(result => result.passed).length,
  failed: results.filter(result => !result.passed).length
};
fs.writeFileSync(
  path.join(root, "docs", "DEMO_HUB_NAVIGATION_LAYOUT_REPORT.json"),
  `${JSON.stringify({ summary, results }, null, 2)}\n`
);
console.log(JSON.stringify(summary, null, 2));
if (summary.failed) {
  console.log(JSON.stringify(results.filter(result => !result.passed).slice(0, 20), null, 2));
  process.exitCode = 1;
}
