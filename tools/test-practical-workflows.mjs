import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const projects = JSON.parse(fs.readFileSync(path.join(root, "projects-index.json"), "utf8")).projects
  .filter((project) => project.contentDepth === "full-scenario");
const port = 3235;
const baseUrl = `http://127.0.0.1:${port}`;
const mime = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg" };

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
const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: "zh-TW", reducedMotion: "reduce" });
const rows = new Array(projects.length);
let cursor = 0;
let completed = 0;

async function inspect(page, project) {
  const errors = [];
  const onError = (error) => errors.push(String(error.message || error));
  page.on("pageerror", onError);
  const reasons = [];
  try {
    await page.goto(`${baseUrl}${project.demoUrl}?mode=guided`, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForSelector(".pw-guide:not([hidden])", { timeout: 5000 });
    const guidedModules = [];
    for (let index = 0; index < 4; index += 1) {
      guidedModules.push(await page.evaluate(() => Number(document.body.dataset.activeModuleIndex)));
      await page.locator("[data-guide-action='next']").click();
    }
    if (guidedModules.join(",") !== "0,1,2,3") reasons.push(`guided sequence ${guidedModules.join(",")}`);
    if (await page.locator(".pw-guide:not([hidden])").count()) reasons.push("guide did not close after completion");

    await page.locator(".module-nav button[data-module]").nth(2).click();
    const before = await page.locator("[data-pw-resolve]").count();
    if (before < 2) reasons.push(`only ${before} actionable exception(s)`);
    const firstId = await page.locator("[data-pw-resolve]").first().getAttribute("data-pw-resolve");
    await page.locator("[data-pw-resolve]").first().click();
    if (await page.locator(`[data-pw-resolve="${firstId}"]`).count()) reasons.push("resolved exception remained actionable");

    await page.locator(".module-nav button[data-module]").nth(3).click();
    const beforeOrder = await page.locator(".pw-list").first().innerText();
    await page.locator("#pwRecalculate").click();
    const afterOrder = await page.locator(".pw-list").first().innerText();
    if (beforeOrder !== afterOrder) reasons.push("deterministic recalculation changed order");

    await page.locator("[data-pw-reset]").click();
    await page.locator(".module-nav button[data-module]").nth(2).click();
    if (await page.locator("[data-pw-resolve]").count() < 2) reasons.push("reset did not restore exceptions");
  } catch (error) {
    reasons.push(String(error.message || error).split("\n")[0]);
  }
  if (errors.length) reasons.push(`${errors.length} page error(s)`);
  page.off("pageerror", onError);
  return { id: project.id, repoName: project.repoName, passed: reasons.length === 0, reasons };
}

async function worker() {
  const page = await context.newPage();
  while (cursor < projects.length) {
    const index = cursor++;
    rows[index] = await inspect(page, projects[index]);
    completed += 1;
    if (completed % 25 === 0 || completed === projects.length) console.log(`PRACTICAL_WORKFLOW_PROGRESS ${completed}/${projects.length}`);
  }
  await page.close();
}

try {
  await Promise.all(Array.from({ length: 10 }, worker));
} finally {
  await context.close();
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

const summary = {
  total: rows.length,
  passed: rows.filter((row) => row.passed).length,
  failed: rows.filter((row) => !row.passed).length,
};
fs.writeFileSync(path.join(root, "docs", "PRACTICAL_WORKFLOW_TEST_REPORT.json"), `${JSON.stringify({ generatedAt: new Date().toISOString(), summary, rows }, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
if (summary.failed) {
  console.error(rows.filter((row) => !row.passed).slice(0, 20));
  process.exitCode = 1;
}
