import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const root = path.resolve(import.meta.dirname, "..");
const catalog = JSON.parse(fs.readFileSync(path.join(root, "projects-index.json"), "utf8"));
const projects = catalog.projects.filter((project) => {
  const index = path.join(root, "demos", project.repoName, "index.html");
  return fs.existsSync(index) && fs.readFileSync(index, "utf8").includes("jvision-generated");
});
const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 1024, height: 768 },
  { name: "mobile", width: 390, height: 844 },
];
const port = 3236;
const baseUrl = `http://127.0.0.1:${port}`;
const mime = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml" };
const server = http.createServer((request, response) => {
  let relative = decodeURIComponent(new URL(request.url, baseUrl).pathname).replace(/^\/+/, "");
  if (!relative || relative.endsWith("/")) relative += "index.html";
  const target = path.resolve(root, relative);
  if (!target.startsWith(root)) return response.writeHead(403).end();
  fs.readFile(target, (error, data) => {
    if (error) return response.writeHead(404).end("Not found");
    response.writeHead(200, { "Content-Type": mime[path.extname(target)] || "application/octet-stream" }).end(data);
  });
});
await new Promise((resolve, reject) => { server.once("error", reject); server.listen(port, "127.0.0.1", resolve); });

const browser = await chromium.launch({ headless: true });
const failures = [];
let checked = 0;
try {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport, locale: "zh-TW", reducedMotion: "reduce" });
    let cursor = 0;
    async function worker() {
      const page = await context.newPage();
      while (cursor < projects.length) {
        const project = projects[cursor++];
        const errors = [];
        page.once("pageerror", (error) => errors.push(error.message));
        const response = await page.goto(`${baseUrl}${project.demoUrl}`, { waitUntil: "domcontentloaded", timeout: 15000 });
        const metrics = await page.evaluate(() => {
          const h1 = document.querySelector(".topbar h1");
          const description = document.querySelector(".topbar > div > span");
          const search = document.querySelector(".global-search");
          const topbar = document.querySelector(".topbar");
          if (!h1 || !description || !search || !topbar) return { missing: true };
          const rect = (element) => element.getBoundingClientRect();
          const a = rect(h1), b = rect(description), c = rect(search), shell = rect(topbar);
          const intersects = (x, y) => x.left < y.right - 1 && x.right > y.left + 1 && x.top < y.bottom - 1 && x.bottom > y.top + 1;
          const style = getComputedStyle(h1);
          const fontSize = parseFloat(style.fontSize);
          const lineHeight = parseFloat(style.lineHeight);
          const lineCount = Math.max(1, Math.round(a.height / lineHeight));
          return {
            missing: false,
            title: h1.textContent.trim(),
            titleDescriptionOverlap: intersects(a, b),
            titleSearchOverlap: intersects(a, c),
            titleOutsideHeader: a.left < shell.left - 1 || a.right > shell.right + 1,
            titleHorizontalOverflow: h1.scrollWidth > h1.clientWidth + 1,
            unsafeMultilineLeading: lineCount > 1 && lineHeight < fontSize * 1.04,
            documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          };
        });
        checked++;
        const reasons = [];
        if (response?.status() !== 200) reasons.push(`HTTP ${response?.status()}`);
        if (metrics.missing) reasons.push("missing title layout elements");
        if (metrics.titleDescriptionOverlap) reasons.push("title overlaps description");
        if (metrics.titleSearchOverlap) reasons.push("title overlaps search");
        if (metrics.titleOutsideHeader || metrics.titleHorizontalOverflow) reasons.push("title overflows header");
        if (metrics.unsafeMultilineLeading) reasons.push("multiline title line-height is too small");
        if (metrics.documentOverflow > 2) reasons.push(`document overflow ${metrics.documentOverflow}px`);
        if (errors.length) reasons.push(`${errors.length} page error(s)`);
        if (reasons.length) failures.push({ viewport: viewport.name, repoName: project.repoName, metrics, reasons });
      }
      await page.close();
    }
    await Promise.all(Array.from({ length: 10 }, worker));
    await context.close();
    console.log(`TITLE_LAYOUT_PROGRESS ${viewport.name} ${projects.length}/${projects.length}`);
  }
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

const report = { generatedAt: new Date().toISOString(), projects: projects.length, viewports: viewports.map(v => v.name), checked, passed: checked - failures.length, failed: failures.length, failures };
fs.writeFileSync(path.join(root, "docs", "GENERATED_TITLE_LAYOUT_AUDIT.json"), JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ projects: report.projects, checked, passed: report.passed, failed: report.failed }, null, 2));
if (failures.length) process.exitCode = 1;
