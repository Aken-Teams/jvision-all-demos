import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

await mkdir("verification", { recursive: true });

const targetUrl = process.argv[2] || "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true });
const results = [];

for (const viewport of [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "mobile", width: 390, height: 844 },
]) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto(targetUrl, { waitUntil: "networkidle", timeout: 30000 });
  const bodyLen = (await page.locator("body").innerText()).trim().length;
  const overlay = await page
    .locator("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay")
    .count();

  await page.locator('a[href="#demo"]').first().click();
  await page.locator('article:has-text("山景四人房 205") button:has-text("已入住")').click();
  await page.locator('article:has-text("山景四人房 205") button:has-text("旺日加價")').click();
  await page.locator('input[aria-label="旅客姓名"]').fill("測試旅客");
  await page.locator('input[aria-label="房型房號"]').fill("山景四人房 205");
  await page.locator('input[aria-label="通路"]').fill("官網");
  await page.locator('button:has-text("新增訂房")').click();
  await page.locator('article:has-text("測試旅客") button:has-text("已入住")').click();
  await page.locator('button:has-text("新增加購")').click();
  await page.locator('button:has-text("同步 訂房平台")').click();
  await page.locator('button:has-text("新增結算")').click();

  const hasGuest = await page.getByText("測試旅客").count();
  const hasAddon = await page.getByText("加購接駁服務").count();
  const hasSync = await page.getByText("訂房平台 房價與庫存已同步").count();
  const hasSettlement = await page.getByText("訂房平台 佣金扣除後").count();

  await page.screenshot({ path: `verification/hospitality-${viewport.name}.png`, fullPage: true });
  results.push({ viewport: viewport.name, bodyLen, overlay, consoleErrors: errors, hasGuest, hasAddon, hasSync, hasSettlement });
  await page.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 2));
