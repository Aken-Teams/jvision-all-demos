import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

await mkdir("verification", { recursive: true });

const targetUrl = process.env.DEMO_URL || process.argv[2] || "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true });
const results = [];

for (const viewport of [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "mobile", width: 390, height: 844 },
]) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  const failedResponses = [];
  page.on("console", (message) => {
    const text = message.text();
    if (message.type() === "error" && !text.includes("Failed to load resource")) errors.push(text);
  });
  page.on("response", (response) => {
    if (response.status() >= 400 && !response.url().includes("/_vercel/insights/script.js")) {
      failedResponses.push(`${response.status()} ${response.url()}`);
    }
  });

  await page.goto(targetUrl, { waitUntil: "networkidle", timeout: 30000 });
  await page.locator(".wide-button").click();
  await page.locator(".button-row button").nth(0).click();
  await page.locator(".button-row button").nth(1).click();
  await page.locator(".button-row button").nth(2).click();

  const body = await page.locator("body").innerText();
  await page.screenshot({ path: `verification/hris-${viewport.name}.png`, fullPage: true });
  results.push({
    viewport: viewport.name,
    hasTitle: body.includes("人資工作台"),
    hasEmployee: body.includes("黃品妤"),
    hasNotice: body.includes("請假已核准") || body.includes("薪資試算完成") || body.includes("招募流程已推進"),
    consoleErrors: errors,
    failedResponses,
  });
  await page.close();
}

await browser.close();

const failed = results.filter((item) => !item.hasTitle || !item.hasNotice || item.consoleErrors.length || item.failedResponses.length);
console.log(JSON.stringify(results, null, 2));
if (failed.length) {
  throw new Error(`verify failed: ${JSON.stringify(failed)}`);
}
