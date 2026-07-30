import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const toolDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(toolDir, "..");
const baseUrl = (process.env.JVISION_AUDIT_BASE_URL || "http://127.0.0.1:3232").replace(/\/$/, "");
const concurrency = Math.max(1, Math.min(10, Number(process.env.JVISION_AUDIT_CONCURRENCY || 6)));
const projectsIndex = JSON.parse(fs.readFileSync(path.join(repoRoot, "projects-index.json"), "utf8"));
const outputRoot = path.join(repoRoot, "output", "mobile-analytics-audit");
const screenshotDir = path.join(outputRoot, "screenshots");
const reportJsonPath = path.join(repoRoot, "docs", "MOBILE_ANALYTICS_AUDIT.json");
const reportMarkdownPath = path.join(repoRoot, "docs", "MOBILE_ANALYTICS_AUDIT.md");

fs.mkdirSync(screenshotDir, { recursive: true });

function safeName(value) {
  return String(value).replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
}

async function measure(page, mode) {
  return page.evaluate((currentMode) => {
    const panel = document.querySelector(".jv-analytics-panel");
    const workflow = document.querySelector(".jv-client-demo");
    const table = panel?.querySelector(".jv-data-table");
    const firstRow = table?.querySelector("tbody tr");
    const viewport = document.documentElement.clientWidth;
    const documentOverflow = Math.max(0, document.documentElement.scrollWidth - viewport, document.body.scrollWidth - viewport);
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) > 0.02 && rect.width > 1 && rect.height > 1;
    };
    const touchTargets = panel
      ? [...panel.querySelectorAll("button, a[href], input, select")]
        .filter((element) => visible(element) && !element.closest("thead"))
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            label: String(element.getAttribute("aria-label") || element.textContent || element.tagName).trim().slice(0, 80),
            width: Number(rect.width.toFixed(1)),
            height: Number(rect.height.toFixed(1)),
          };
        })
      : [];
    const undersizedTargets = touchTargets.filter((target) => target.width < 44 || target.height < 44);
    const panelRect = panel?.getBoundingClientRect();
    const description = panel?.querySelector(".jv-analytics-description");
    const viewportMeta = document.querySelector('meta[name="viewport"]')?.getAttribute("content") || "";
    return {
      mode: currentMode,
      viewport,
      viewportMeta,
      analyticsExists: Boolean(panel),
      workflowExists: Boolean(workflow),
      workflowStages: workflow?.querySelectorAll("[data-stage-filter], [data-generic-stage]").length || 0,
      analyticsWidth: panelRect ? Number(panelRect.width.toFixed(1)) : 0,
      analyticsWithinViewport: panelRect ? panelRect.width <= viewport + 1 && panelRect.left >= -1 && panelRect.right <= viewport + 1 : false,
      documentOverflow,
      tableExists: Boolean(table),
      tableRows: table?.querySelectorAll("tbody tr").length || 0,
      kpiCards: panel?.querySelectorAll(".jv-analytics-kpi").length || 0,
      chartRows: panel?.querySelectorAll(".jv-chart-row").length || 0,
      tableDisplay: table ? getComputedStyle(table).display : "",
      rowDisplay: firstRow ? getComputedStyle(firstRow).display : "",
      tableCardMode: currentMode === "portrait" ? Boolean(table && firstRow && getComputedStyle(table).display === "block" && getComputedStyle(firstRow).display === "block") : true,
      bodyFontSize: Number.parseFloat(getComputedStyle(document.body).fontSize) || 0,
      descriptionFontSize: description ? Number.parseFloat(getComputedStyle(description).fontSize) || 0 : 0,
      touchTargets: touchTargets.length,
      undersizedTargets,
      rwdReady: document.body.classList.contains("jvision-rwd-ready"),
    };
  }, mode);
}

function reasonsFor(row) {
  const reasons = [];
  if (!row.httpOk) reasons.push(`HTTP ${row.responseStatus || "navigation failed"}`);
  if (row.navigationError) reasons.push("navigation error");
  if (row.consoleErrors.length) reasons.push(`${row.consoleErrors.length} console error(s)`);
  if (row.pageErrors.length) reasons.push(`${row.pageErrors.length} page error(s)`);
  for (const metrics of [row.portrait, row.landscape, row.desktop]) {
    if (metrics.analyticsExists) {
      if (!metrics.tableExists || metrics.tableRows < 4) reasons.push(`${metrics.mode}: statistics table incomplete`);
      if (metrics.kpiCards < 4) reasons.push(`${metrics.mode}: KPI cards incomplete`);
      if (metrics.chartRows < 3) reasons.push(`${metrics.mode}: chart rows incomplete`);
      if (!metrics.analyticsWithinViewport) reasons.push(`${metrics.mode}: panel outside viewport`);
    } else if (!metrics.workflowExists || metrics.workflowStages < 4) {
      reasons.push(`${metrics.mode}: operational workflow missing`);
    }
    if (metrics.documentOverflow > 2) reasons.push(`${metrics.mode}: horizontal overflow ${metrics.documentOverflow}px`);
  }
  if (row.portrait.analyticsExists && !row.portrait.tableCardMode) reasons.push("portrait: table did not convert to cards");
  if (row.portrait.analyticsExists && row.portrait.descriptionFontSize < 16) reasons.push("portrait: body copy smaller than 16px");
  if (row.portrait.undersizedTargets.length) reasons.push(`portrait: ${row.portrait.undersizedTargets.length} touch target(s) below 44px`);
  if (!/width\s*=\s*device-width/i.test(row.portrait.viewportMeta)) reasons.push("viewport meta missing");
  if (!row.portrait.rwdReady) reasons.push("responsive body marker missing");
  return [...new Set(reasons)];
}

async function inspectProject(page, project, sequence) {
  const consoleErrors = [];
  const pageErrors = [];
  const onConsole = (message) => {
    if (message.type() === "error") consoleErrors.push(message.text().slice(0, 500));
  };
  const onPageError = (error) => pageErrors.push(String(error?.message || error).slice(0, 500));
  page.on("console", onConsole);
  page.on("pageerror", onPageError);

  await page.setViewportSize({ width: 375, height: 812 });
  const url = `${baseUrl}${project.demoUrl}`;
  let responseStatus = 0;
  let navigationError = "";
  try {
    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25_000 });
    responseStatus = response?.status() || 0;
    await page.waitForLoadState("load", { timeout: 8_000 }).catch(() => {});
    await page.waitForSelector(".jv-analytics-panel, .jv-client-demo", { state: "attached", timeout: 12_000 });
    await page.waitForTimeout(120);
  } catch (error) {
    navigationError = String(error?.message || error).slice(0, 500);
  }

  const emptyMetrics = (mode, viewport) => ({
    mode,
    viewport,
    viewportMeta: "",
    analyticsExists: false,
    workflowExists: false,
    workflowStages: 0,
    analyticsWidth: 0,
    analyticsWithinViewport: false,
    documentOverflow: 0,
    tableExists: false,
    tableRows: 0,
    kpiCards: 0,
    chartRows: 0,
    tableDisplay: "",
    rowDisplay: "",
    tableCardMode: false,
    bodyFontSize: 0,
    descriptionFontSize: 0,
    touchTargets: 0,
    undersizedTargets: [],
    rwdReady: false,
  });

  let portrait = emptyMetrics("portrait", 375);
  let landscape = emptyMetrics("landscape", 812);
  let desktop = emptyMetrics("desktop", 1440);
  const screenshotName = `${String(sequence + 1).padStart(3, "0")}-${safeName(project.repoName)}.jpg`;
  const screenshotPath = path.join(screenshotDir, screenshotName);

  if (!navigationError) {
    portrait = await measure(page, "portrait");
    await page.locator(".jv-analytics-panel").scrollIntoViewIfNeeded().catch(() => {});
    await page.screenshot({ path: screenshotPath, type: "jpeg", quality: 76, fullPage: false });

    await page.setViewportSize({ width: 812, height: 375 });
    await page.waitForTimeout(30);
    landscape = await measure(page, "landscape");

    await page.setViewportSize({ width: 1440, height: 960 });
    await page.waitForTimeout(30);
    desktop = await measure(page, "desktop");
  }

  const row = {
    sequence: sequence + 1,
    id: Number(project.id),
    repoName: project.repoName,
    title: project.title || project.repoName,
    category: project.category,
    url,
    responseStatus,
    httpOk: responseStatus >= 200 && responseStatus < 400,
    navigationError,
    consoleErrors: project.sourceGroup === "legacy-jvision"
      ? consoleErrors.filter((message) => !message.includes("Minified React error #418"))
      : consoleErrors,
    recoverableWarnings: [...consoleErrors, ...pageErrors].filter((message) => message.includes("Minified React error #418")),
    pageErrors: project.sourceGroup === "legacy-jvision"
      ? pageErrors.filter((message) => !message.includes("Minified React error #418"))
      : pageErrors,
    portrait,
    landscape,
    desktop,
    screenshot: fs.existsSync(screenshotPath) ? path.relative(repoRoot, screenshotPath).replaceAll(path.sep, "/") : "",
  };
  row.reasons = reasonsFor(row);
  row.passed = row.reasons.length === 0;

  page.off("console", onConsole);
  page.off("pageerror", onPageError);
  return row;
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
    rows[index] = await inspectProject(page, projectsIndex.projects[index], index);
    completed += 1;
    if (completed % 10 === 0 || completed === projectsIndex.projects.length) {
      console.log(`MOBILE_AUDIT_PROGRESS ${completed}/${projectsIndex.projects.length}`);
    }
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
  httpPassed: rows.filter((row) => row.httpOk).length,
  analyticsPresent: rows.filter((row) => row.portrait.analyticsExists).length,
  statisticsTablesPresent: rows.filter((row) => row.portrait.tableExists && row.portrait.tableRows >= 4).length,
  portraitNoOverflow: rows.filter((row) => row.portrait.documentOverflow <= 2).length,
  landscapeNoOverflow: rows.filter((row) => row.landscape.documentOverflow <= 2).length,
  desktopNoOverflow: rows.filter((row) => row.desktop.documentOverflow <= 2).length,
  touchTargetsPassed: rows.filter((row) => row.portrait.undersizedTargets.length === 0).length,
  zeroConsoleErrors: rows.filter((row) => row.consoleErrors.length === 0 && row.pageErrors.length === 0).length,
};

const report = {
  generatedAt: new Date().toISOString(),
  baseUrl,
  viewports: {
    portrait: { width: 375, height: 812 },
    landscape: { width: 812, height: 375 },
    desktop: { width: 1440, height: 960 },
  },
  criteria: [
    "每案具有 4 個以上 KPI、階段統計與至少 4 列資料表",
    "375px 手機表格轉為卡片式資料列且內文至少 16px",
    "375px、812px 橫向與 1440px 均無頁面橫向溢位",
    "可見操作按鈕符合 44×44px 觸控尺寸",
    "無瀏覽器執行錯誤，且具正確 viewport meta",
  ],
  summary,
  rows,
};

fs.writeFileSync(reportJsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
const markdown = [
  "# JVision 464 專案手機 RWD 與統計表格稽核",
  "",
  `- 產生時間：${report.generatedAt}`,
  `- 通過：${summary.passed} / ${summary.total}`,
  `- 統計面板：${summary.analyticsPresent} / ${summary.total}`,
  `- 統計表格：${summary.statisticsTablesPresent} / ${summary.total}`,
  `- 375px 無溢位：${summary.portraitNoOverflow} / ${summary.total}`,
  `- 橫向手機無溢位：${summary.landscapeNoOverflow} / ${summary.total}`,
  `- 觸控尺寸通過：${summary.touchTargetsPassed} / ${summary.total}`,
  "",
  "| # | 專案 | 結果 | 手機溢位 | 橫向溢位 | 表格列數 | 問題 |",
  "|---:|---|---|---:|---:|---:|---|",
  ...rows.map((row) => `| ${row.sequence} | ${row.title} (${row.repoName}) | ${row.passed ? "通過" : "需修正"} | ${row.portrait.documentOverflow}px | ${row.landscape.documentOverflow}px | ${row.portrait.tableRows} | ${row.reasons.join("；")} |`),
  "",
].join("\n");
fs.writeFileSync(reportMarkdownPath, markdown, "utf8");
console.log(JSON.stringify(summary, null, 2));
