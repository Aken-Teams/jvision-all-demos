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
  await page.locator(".task").first().click();

  const body = await page.locator("body").innerText();
  await page.screenshot({ path: `verification/event-wedding-${viewport.name}.png`, fullPage: true });

  results.push({
    viewport: viewport.name,
    hasTitle: body.includes("活動會展與婚禮場地管理平台"),
    hasLead: body.includes("王先生求婚派對"),
    hasQuote: body.includes("報價完成") || body.includes("訂金"),
    hasTaskUpdate: body.includes("籌備任務狀態已更新"),
    consoleErrors: errors,
    failedResponses,
  });

  await page.close();
}

await browser.close();

const failed = results.filter(
  (item) =>
    !item.hasTitle ||
    !item.hasLead ||
    !item.hasQuote ||
    !item.hasTaskUpdate ||
    item.consoleErrors.length ||
    item.failedResponses.length,
);

console.log(JSON.stringify(results, null, 2));
if (failed.length) {
  throw new Error(`verify failed: ${JSON.stringify(failed)}`);
}
