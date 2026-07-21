import { chromium } from "playwright";

const url = process.env.DEMO_URL || process.argv[2] || "http://127.0.0.1:3027";

const browser = await chromium.launch({ headless: true });
const results = [];

for (const viewport of [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "mobile", width: 390, height: 1100 },
]) {
  const page = await browser.newPage({ viewport });
  const consoleErrors = [];
  const failedResponses = [];

  page.on("console", (message) => {
    const text = message.text();
    if (message.type() === "error" && !text.includes("Failed to load resource")) consoleErrors.push(text);
  });

  page.on("response", (response) => {
    if (response.status() >= 400 && !response.url().includes("/_vercel/insights/script.js")) {
      failedResponses.push(`${response.status()} ${response.url()}`);
    }
  });

  await page.goto(url, { waitUntil: "networkidle" });
  await page.locator(".dispatch-form button").click();
  await page.locator(".primary-action").first().click();
  await page.locator(".shop-actions button").first().click();

  const body = await page.locator("body").innerText();
  const result = {
    viewport: viewport.name,
    hasTitle: body.includes("烘焙 POS 與前店後廠管理"),
    hasPos: body.includes("門市 POS 與預購訂單"),
    hasFactory: body.includes("前店後廠與庫存"),
    hasNotice: body.includes("新增") || body.includes("已建立"),
    noMojibake: !/[蝞摮撌銝隤鞈嚗]/.test(body),
    consoleErrors,
    failedResponses,
  };
  await page.screenshot({ path: `verification/bakery-pos-${viewport.name}.png`, fullPage: true });
  results.push(result);
  await page.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 2));

if (
  results.some(
    (result) =>
      !result.hasTitle ||
      !result.hasPos ||
      !result.hasFactory ||
      !result.hasNotice ||
      !result.noMojibake ||
      result.consoleErrors.length ||
      result.failedResponses.length,
  )
) {
  process.exit(1);
}
