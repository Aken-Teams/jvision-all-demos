import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const toolDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(toolDir, "..");
const baseUrl = (process.env.JVISION_AGENT_BASE_URL || "http://127.0.0.1:3232").replace(/\/$/, "");
const concurrency = Math.max(1, Math.min(10, Number(process.env.JVISION_AGENT_CONCURRENCY || 10)));
const projectsIndex = JSON.parse(fs.readFileSync(path.join(repoRoot, "projects-index.json"), "utf8"));
const reportJsonPath = path.join(repoRoot, "docs", "PROJECT_EXPERT_ACCEPTANCE_REPORT.json");
const reportMarkdownPath = path.join(repoRoot, "docs", "PROJECT_EXPERT_ACCEPTANCE_REPORT.md");
const legacyFilterProjects = new Set([
  "jvision-order-inventory",
  "jvision-lean-demo",
  "jvision-work-order-demo",
  "jvision-demo",
  "jvision-task-demo",
]);

async function inspect(page, project) {
  const consoleErrors = [];
  const pageErrors = [];
  const onConsole = (message) => { if (message.type() === "error") consoleErrors.push(message.text().slice(0, 300)); };
  const onPageError = (error) => pageErrors.push(String(error?.message || error).slice(0, 300));
  page.on("console", onConsole);
  page.on("pageerror", onPageError);
  const url = `${baseUrl}${project.demoUrl}`;
  let status = 0;
  let navigationError = "";
  let rangeToggled = false;
  let tableSorted = false;
  let legacyFilterPassed = !legacyFilterProjects.has(project.repoName);
  try {
    await page.setViewportSize({ width: 390, height: 844 });
    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 12_000 });
    status = response?.status() || 0;
    await page.waitForSelector(".jv-analytics-panel", { state: "attached", timeout: 3_500 });
    const toggle = page.locator('.jv-range-button[data-range="30"]');
    await toggle.evaluate((element) => element.click());
    rangeToggled = await toggle.getAttribute("aria-pressed") === "true" && await page.locator(".jv-chart-period").textContent() === "近 30 日";
    const sortButton = page.locator(".jv-sort-button").first();
    await sortButton.evaluate((element) => element.click());
    tableSorted = await page.locator(".jv-data-table tbody tr").count() >= 4;
    if (legacyFilterProjects.has(project.repoName)) {
      const filterInput = page.locator(".jv-legacy-task-filter input");
      const firstTask = (await page.locator("#tasks > li").first().innerText()).trim();
      await filterInput.fill(firstTask);
      legacyFilterPassed = await page.locator("#tasks > li:not([hidden])").count() === 1;
    }
  } catch (error) {
    navigationError = String(error?.message || error).slice(0, 500);
  }
  page.off("console", onConsole);
  page.off("pageerror", onPageError);
  const httpOk = status >= 200 && status < 400;
  const reasons = [];
  if (!httpOk) reasons.push(`HTTP ${status || "navigation failed"}`);
  if (navigationError) reasons.push("navigation or interaction failure");
  if (!rangeToggled) reasons.push("30-day statistic toggle failed");
  if (!tableSorted) reasons.push("statistics table sorting interaction failed");
  if (!legacyFilterPassed) reasons.push("legacy task search/filter failed");
  if (consoleErrors.length) reasons.push(`${consoleErrors.length} console error(s)`);
  if (pageErrors.length) reasons.push(`${pageErrors.length} page error(s)`);
  return { id: Number(project.id), repoName: project.repoName, title: project.title || project.repoName, url, status, httpOk, rangeToggled, tableSorted, legacyFilterPassed, consoleErrors, pageErrors, navigationError, reasons, passed: reasons.length === 0 };
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ locale: "zh-TW", colorScheme: "light" });
const rows = new Array(projectsIndex.projects.length);
let cursor = 0;
let completed = 0;
async function worker() {
  const page = await context.newPage();
  while (cursor < projectsIndex.projects.length) {
    const index = cursor;
    cursor += 1;
    rows[index] = await inspect(page, projectsIndex.projects[index]);
    completed += 1;
    if (completed % 10 === 0 || completed === projectsIndex.projects.length) console.log(`PROJECT_EXPERT_ACCEPTANCE_PROGRESS ${completed}/${projectsIndex.projects.length}`);
  }
  await page.close();
}
try {
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
} finally {
  await context.close();
  await browser.close();
}

const summary = {
  total: rows.length,
  passed: rows.filter((row) => row.passed).length,
  failed: rows.filter((row) => !row.passed).length,
  rangeTogglePassed: rows.filter((row) => row.rangeToggled).length,
  tableSortPassed: rows.filter((row) => row.tableSorted).length,
  legacyFilterPassed: rows.filter((row) => row.legacyFilterPassed).length,
  zeroConsoleErrors: rows.filter((row) => row.consoleErrors.length === 0 && row.pageErrors.length === 0).length,
};
const report = { generatedAt: new Date().toISOString(), baseUrl, summary, rows };
fs.writeFileSync(reportJsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
fs.writeFileSync(reportMarkdownPath, [
  "# Project Expert Agent 最小驗收測試", "", `- 產生時間：${report.generatedAt}`, `- 通過：${summary.passed}/${summary.total}`,
  `- 30 日統計切換：${summary.rangeTogglePassed}/${summary.total}`, `- 資料表排序：${summary.tableSortPassed}/${summary.total}`, `- 舊專案搜尋／篩選：${summary.legacyFilterPassed}/${summary.total}`, `- 零前端錯誤：${summary.zeroConsoleErrors}/${summary.total}`, "",
  "| 專案 | 結果 | 30 日切換 | 表格排序 | 搜尋篩選 | 問題 |", "|---|---|---|---|---|---|",
  ...rows.map((row) => `| ${row.title} (${row.repoName}) | ${row.passed ? "通過" : "失敗"} | ${row.rangeToggled ? "通過" : "失敗"} | ${row.tableSorted ? "通過" : "失敗"} | ${row.legacyFilterPassed ? "通過／不適用" : "失敗"} | ${row.reasons.join("；")} |`), "",
].join("\n"), "utf8");
console.log(JSON.stringify(summary, null, 2));
