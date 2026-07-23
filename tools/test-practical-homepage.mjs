import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = 3236;
const baseUrl = `http://127.0.0.1:${port}`;
const outputDir = path.join(root, "output", "practical-content");
fs.mkdirSync(outputDir, { recursive: true });
const mime = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".jpg": "image/jpeg", ".svg": "image/svg+xml" };
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
await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(port, "127.0.0.1", resolve);
});

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, locale: "zh-TW", reducedMotion: "reduce" });
const consoleErrors = [];
page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
page.on("pageerror", (error) => consoleErrors.push(String(error.message || error)));
const failures = [];

try {
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.waitForSelector(".project-card");
  if ((await page.locator(".project-card").count()) !== 24) failures.push("Homepage did not render the first 24 projects.");
  const search = page.locator("#searchInput");
  await search.fill("#1001");
  await page.waitForTimeout(120);
  const first = page.locator(".project-card").first();
  if (!(await first.locator(".guided-link:visible").count())) failures.push("Full scenario card lacks guided entry.");
  await first.locator("summary").click();
  if (!(await first.locator(".practical-detail-body:visible").count())) failures.push("Practical details did not expand.");
  await page.screenshot({ path: path.join(outputDir, "homepage-desktop.png"), fullPage: false });

  await search.fill("缺料");
  await page.waitForTimeout(120);
  const resultCount = await page.locator(".project-card").count();
  if (resultCount < 1) failures.push("Practical keyword search returned no projects.");

  await search.fill("#2");
  await page.waitForTimeout(120);
  const catalogOnly = page.locator(".project-card").first();
  if (await catalogOnly.locator(".guided-link:visible").count()) failures.push("Catalog-only project exposed guided entry.");
  if (!(await catalogOnly.locator(".demo-link:visible").count())) failures.push("Catalog-only project lacks Demo entry.");

  await page.setViewportSize({ width: 390, height: 844 });
  await search.fill("");
  await page.waitForTimeout(120);
  const overflow = await page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - innerWidth));
  if (overflow > 8) failures.push(`Homepage mobile overflow ${overflow}px.`);
  await page.screenshot({ path: path.join(outputDir, "homepage-mobile.png"), fullPage: false });

  await page.goto(`${baseUrl}/demos/jvision-ai-case-001-production-scheduler/?mode=guided`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".pw-guide:not([hidden])");
  const demoOverflow = await page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - innerWidth));
  if (demoOverflow > 8) failures.push(`Guided Demo mobile overflow ${demoOverflow}px.`);
  await page.screenshot({ path: path.join(outputDir, "guided-demo-mobile.png"), fullPage: false });
} finally {
  await page.close();
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

if (consoleErrors.length) failures.push(`${consoleErrors.length} browser error(s).`);
const summary = { passed: failures.length === 0, practicalSearchResults: failures.length ? undefined : "verified", consoleErrors: consoleErrors.length, failures };
console.log(JSON.stringify(summary, null, 2));
if (failures.length) process.exitCode = 1;
