import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import sharp from "sharp";

const toolDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(toolDir, "..");
const baseUrl = (process.env.JVISION_AUDIT_BASE_URL || "http://127.0.0.1:3232").replace(/\/$/, "");
const concurrency = Math.max(1, Math.min(8, Number(process.env.JVISION_AUDIT_CONCURRENCY || 4)));
const projectsIndex = JSON.parse(fs.readFileSync(path.join(repoRoot, "projects-index.json"), "utf8"));
const outputRoot = path.join(repoRoot, "output", "formal-audit");
const screenshotDir = path.join(outputRoot, "screenshots");
const sheetDir = path.join(outputRoot, "contact-sheets");
const reportJsonPath = path.join(repoRoot, "docs", "FORMAL_SITE_AUDIT.json");
const reportMarkdownPath = path.join(repoRoot, "docs", "FORMAL_SITE_AUDIT.md");

fs.mkdirSync(screenshotDir, { recursive: true });
fs.mkdirSync(sheetDir, { recursive: true });

function safeName(value) {
  return String(value).replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function formalScore(row) {
  let score = 100;
  if (!row.httpOk) score -= 50;
  score -= Math.min(22, row.consoleErrors.length * 6 + row.pageErrors.length * 10);
  if (row.metrics.horizontalOverflow > 4) score -= 18;
  else if (row.metrics.horizontalOverflow > 1) score -= 10;
  else if (row.metrics.horizontalOverflow > 0) score -= 4;
  if (!row.metrics.hasHeading) score -= 12;
  if (row.metrics.genericTitle) score -= 8;
  if (row.metrics.textLength < 120) score -= 12;
  if (row.metrics.loginWall) score -= 45;
  if (row.metrics.placeholderCopy) score -= 12;
  if (row.metrics.lowContrastRate > 0.12) score -= 18;
  else if (row.metrics.lowContrastRate > 0.06) score -= 10;
  else if (row.metrics.lowContrastRate > 0.025) score -= 4;
  if (row.metrics.tinyTextRate > 0.08) score -= 10;
  else if (row.metrics.tinyTextRate > 0.03) score -= 4;
  if (row.metrics.headingFontSize > 0 && row.metrics.headingFontSize < 24) score -= 8;
  if (row.visual.averageBrightness < 0.58) score -= 24;
  else if (row.visual.averageBrightness < 0.7) score -= 14;
  else if (row.visual.averageBrightness < 0.78) score -= 6;
  if (row.metrics.firstFoldElements < 8) score -= 8;
  return Math.max(0, Math.round(score));
}

async function inspectProject(page, project, sequence) {
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];
  const httpErrors = [];
  const onConsole = (message) => {
    if (message.type() === "error") consoleErrors.push(message.text().slice(0, 500));
  };
  const onPageError = (error) => pageErrors.push(String(error?.message || error).slice(0, 500));
  const onRequestFailed = (request) => failedRequests.push({
    url: request.url(),
    error: request.failure()?.errorText || "request failed",
  });
  const onResponse = (response) => {
    if (response.status() >= 400) httpErrors.push({ status: response.status(), url: response.url() });
  };
  page.on("console", onConsole);
  page.on("pageerror", onPageError);
  page.on("requestfailed", onRequestFailed);
  page.on("response", onResponse);

  const url = `${baseUrl}${project.demoUrl}`;
  let responseStatus = 0;
  let navigationError = "";
  try {
    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25_000 });
    responseStatus = response?.status() || 0;
    await page.waitForLoadState("load", { timeout: 8_000 }).catch(() => {});
    await page.waitForTimeout(320);
  } catch (error) {
    navigationError = String(error?.message || error).slice(0, 500);
  }

  const screenshotName = `${String(sequence + 1).padStart(3, "0")}-${safeName(project.repoName)}.jpg`;
  const screenshotPath = path.join(screenshotDir, screenshotName);
  let metrics = {
    title: "",
    heading: "",
    hasHeading: false,
    genericTitle: true,
    textLength: 0,
    horizontalOverflow: 0,
    overflowSamples: [],
    lowContrastRate: 1,
    tinyTextRate: 1,
    headingFontSize: 0,
    firstFoldElements: 0,
    loginWall: false,
    placeholderCopy: false,
    bodyClass: "",
  };
  if (!navigationError) {
    metrics = await page.evaluate(() => {
      const visible = (element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) > 0.02 && rect.width > 0 && rect.height > 0;
      };
      const rgb = (value) => {
        const match = String(value).match(/rgba?\((\d+(?:\.\d+)?)[,\s]+(\d+(?:\.\d+)?)[,\s]+(\d+(?:\.\d+)?)(?:[,/\s]+(\d+(?:\.\d+)?))?\)/i);
        return match ? [Number(match[1]), Number(match[2]), Number(match[3]), match[4] === undefined ? 1 : Number(match[4])] : null;
      };
      const luminance = ([red, green, blue]) => {
        const values = [red, green, blue].map((channel) => {
          const value = channel / 255;
          return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * values[0] + 0.7152 * values[1] + 0.0722 * values[2];
      };
      const contrast = (first, second) => {
        const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
        return (values[0] + 0.05) / (values[1] + 0.05);
      };
      const nearestBackground = (element) => {
        let current = element;
        while (current) {
          const style = getComputedStyle(current);
          const color = rgb(style.backgroundColor);
          if (color && color[3] >= 0.86) return color;
          if (style.backgroundImage !== "none") return null;
          current = current.parentElement;
        }
        return [255, 255, 255, 1];
      };
      const candidates = [...document.querySelectorAll("h1,h2,h3,p,a,button,label,span,small,td,th")]
        .filter((element) => {
          const hasOwnText = [...element.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && String(node.textContent || "").trim());
          return visible(element) && hasOwnText;
        })
        .slice(0, 800);
      let lowContrast = 0;
      let contrastCandidates = 0;
      let tinyText = 0;
      for (const element of candidates) {
        const style = getComputedStyle(element);
        const foreground = rgb(style.color);
        const background = nearestBackground(element);
        const size = Number.parseFloat(style.fontSize) || 16;
        const threshold = size >= 18 || (size >= 14 && Number(style.fontWeight) >= 700) ? 3 : 4.5;
        if (foreground && background) {
          contrastCandidates += 1;
          if (contrast(foreground, background) < threshold) lowContrast += 1;
        }
        if (size < 11) tinyText += 1;
      }
      const overflowing = [...document.querySelectorAll("body *")].filter((element) => {
        if (!visible(element)) return false;
        const rect = element.getBoundingClientRect();
        return rect.right > document.documentElement.clientWidth + 3 || rect.left < -3;
      });
      const firstFoldElements = [...document.querySelectorAll("body *")].filter((element) => {
        if (!visible(element)) return false;
        const rect = element.getBoundingClientRect();
        return rect.top < innerHeight && rect.bottom > 0;
      }).length;
      const heading = document.querySelector("h1");
      const bodyText = String(document.body?.innerText || "").replace(/\s+/g, " ").trim();
      const title = document.title.trim();
      return {
        title,
        heading: String(heading?.textContent || "").replace(/\s+/g, " ").trim(),
        hasHeading: Boolean(heading && visible(heading)),
        genericTitle: !title || /^(document|untitled|next app|vite|react app)$/i.test(title),
        textLength: bodyText.length,
        horizontalOverflow: overflowing.length,
        overflowSamples: overflowing.slice(0, 5).map((element) => `${element.tagName.toLowerCase()}.${String(element.className || "").split(/\s+/).slice(0, 2).join(".")}`),
        lowContrastRate: contrastCandidates ? Number((lowContrast / contrastCandidates).toFixed(4)) : 0,
        tinyTextRate: candidates.length ? Number((tinyText / candidates.length).toFixed(4)) : 1,
        headingFontSize: heading ? Number.parseFloat(getComputedStyle(heading).fontSize) || 0 : 0,
        firstFoldElements,
        loginWall: /log in to vercel|continue with github|sign in with vercel/i.test(bodyText),
        placeholderCopy: /lorem ipsum|\bTODO\b|coming soon|尚未製作|待建置/i.test(bodyText),
        bodyClass: document.body?.className || "",
      };
    });
    await page.screenshot({ path: screenshotPath, type: "jpeg", quality: 86, fullPage: false });
  } else {
    await sharp({ create: { width: 1440, height: 960, channels: 3, background: "#f4f8fc" } })
      .jpeg({ quality: 86 })
      .toFile(screenshotPath);
  }

  const stats = await sharp(screenshotPath).stats();
  const mean = stats.channels.slice(0, 3).map((channel) => channel.mean / 255);
  const averageBrightness = Number((0.2126 * mean[0] + 0.7152 * mean[1] + 0.0722 * mean[2]).toFixed(4));
  const row = {
    sequence: sequence + 1,
    id: Number(project.id),
    repoName: project.repoName,
    title: project.title || project.name || project.repoName,
    category: project.category,
    sourceGroup: project.sourceGroup,
    runtime: project.runtime,
    url,
    responseStatus,
    httpOk: responseStatus >= 200 && responseStatus < 400,
    navigationError,
    consoleErrors,
    pageErrors,
    failedRequests: failedRequests.slice(0, 10),
    httpErrors: httpErrors.slice(0, 10),
    metrics,
    visual: { averageBrightness },
    screenshot: path.relative(repoRoot, screenshotPath).replaceAll(path.sep, "/"),
  };
  row.score = formalScore(row);
  row.verdict = row.score >= 90 ? "pass" : row.score >= 78 ? "review" : "fail";
  if (!row.httpOk || row.metrics.loginWall || row.pageErrors.length) row.verdict = "fail";

  page.off("console", onConsole);
  page.off("pageerror", onPageError);
  page.off("requestfailed", onRequestFailed);
  page.off("response", onResponse);
  return row;
}

async function createContactSheets(rows) {
  const columns = 3;
  const rowsPerSheet = 4;
  const perSheet = columns * rowsPerSheet;
  const tileWidth = 400;
  const previewHeight = 225;
  const labelHeight = 54;
  const gap = 10;
  const headerHeight = 54;
  const sheetWidth = gap + columns * (tileWidth + gap);
  const sheetHeight = headerHeight + rowsPerSheet * (previewHeight + labelHeight + gap);
  const sheetPaths = [];
  for (let start = 0; start < rows.length; start += perSheet) {
    const group = rows.slice(start, start + perSheet);
    const composites = [];
    for (let index = 0; index < group.length; index += 1) {
      const item = group[index];
      const column = index % columns;
      const row = Math.floor(index / columns);
      const left = gap + column * (tileWidth + gap);
      const top = headerHeight + row * (previewHeight + labelHeight + gap);
      const preview = await sharp(path.join(repoRoot, item.screenshot))
        .resize(tileWidth, previewHeight, { fit: "cover", position: "top" })
        .jpeg({ quality: 82 })
        .toBuffer();
      const border = item.verdict === "pass" ? "#0f9f78" : item.verdict === "review" ? "#d97706" : "#dc3545";
      const label = Buffer.from(`<svg width="${tileWidth}" height="${labelHeight}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#ffffff"/>
        <rect width="5" height="100%" fill="${border}"/>
        <text x="16" y="22" font-size="15" font-weight="700" font-family="Segoe UI, sans-serif" fill="#10243e">${escapeXml(`${item.sequence}. ${item.title}`)}</text>
        <text x="16" y="42" font-size="11" font-family="Segoe UI, sans-serif" fill="#5b6f84">${escapeXml(`${item.repoName} · ${item.score}/100 · ${item.verdict}`)}</text>
      </svg>`);
      composites.push({ input: preview, left, top });
      composites.push({ input: label, left, top: top + previewHeight });
    }
    const sheetNumber = Math.floor(start / perSheet) + 1;
    const header = Buffer.from(`<svg width="${sheetWidth}" height="${headerHeight}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#10243e"/>
      <text x="18" y="33" font-size="20" font-weight="700" font-family="Segoe UI, sans-serif" fill="#ffffff">JVision Formal Website Review ${String(sheetNumber).padStart(2, "0")} · ${start + 1}–${start + group.length}</text>
    </svg>`);
    composites.push({ input: header, left: 0, top: 0 });
    const sheetPath = path.join(sheetDir, `formal-review-${String(sheetNumber).padStart(2, "0")}.jpg`);
    await sharp({ create: { width: sheetWidth, height: sheetHeight, channels: 3, background: "#e7eef5" } })
      .composite(composites)
      .jpeg({ quality: 88 })
      .toFile(sheetPath);
    sheetPaths.push(path.relative(repoRoot, sheetPath).replaceAll(path.sep, "/"));
  }
  return sheetPaths;
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 960 },
  colorScheme: "light",
  reducedMotion: "reduce",
  deviceScaleFactor: 1,
});
context.setDefaultTimeout(12_000);
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
      console.log(`AUDIT_PROGRESS ${completed}/${projectsIndex.projects.length}`);
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

const contactSheets = await createContactSheets(rows);
const summary = {
  total: rows.length,
  passed: rows.filter((row) => row.verdict === "pass").length,
  review: rows.filter((row) => row.verdict === "review").length,
  failed: rows.filter((row) => row.verdict === "fail").length,
  httpPassed: rows.filter((row) => row.httpOk).length,
  zeroConsoleErrors: rows.filter((row) => row.consoleErrors.length === 0 && row.pageErrors.length === 0).length,
  noHorizontalOverflow: rows.filter((row) => row.metrics.horizontalOverflow === 0).length,
  brightEnough: rows.filter((row) => row.visual.averageBrightness >= 0.7).length,
  averageScore: Number((rows.reduce((sum, row) => sum + row.score, 0) / rows.length).toFixed(2)),
  contactSheets: contactSheets.length,
};

const report = {
  generatedAt: new Date().toISOString(),
  baseUrl,
  viewport: { width: 1440, height: 960 },
  criteria: {
    passScore: 90,
    reviewScore: 78,
    formalChecks: [
      "HTTP 載入成功",
      "無 Vercel Login 或模板占位內容",
      "無瀏覽器執行錯誤",
      "無明顯橫向溢位",
      "標題、內容密度與首屏層級完整",
      "文字對比與字級可讀",
      "頁面整體保持明亮清晰",
    ],
  },
  summary,
  contactSheets,
  rows,
};
fs.writeFileSync(reportJsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

const markdown = [
  "# JVision 464 專案正式網站逐案稽核",
  "",
  `- 產生時間：${report.generatedAt}`,
  `- 檢查網址：${baseUrl}`,
  `- 檢查尺寸：1440 × 960`,
  `- 通過：${summary.passed}`,
  `- 待複核：${summary.review}`,
  `- 不合格：${summary.failed}`,
  `- 平均分數：${summary.averageScore}`,
  "",
  "| # | 專案 | 分數 | 結果 | HTTP | 錯誤 | 溢位 | 亮度 |",
  "|---:|---|---:|---|---:|---:|---:|---:|",
  ...rows.map((row) => `| ${row.sequence} | ${row.title} (${row.repoName}) | ${row.score} | ${row.verdict} | ${row.responseStatus} | ${row.consoleErrors.length + row.pageErrors.length} | ${row.metrics.horizontalOverflow} | ${row.visual.averageBrightness} |`),
  "",
].join("\n");
fs.writeFileSync(reportMarkdownPath, markdown, "utf8");
console.log(JSON.stringify(summary, null, 2));
