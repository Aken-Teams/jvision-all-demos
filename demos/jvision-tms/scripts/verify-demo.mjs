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
  await page.locator('input[aria-label="客戶名稱"]').fill("測試超商物流");
  await page.locator('input[aria-label="配送地點"]').fill("台中西屯");
  await page.locator('input[aria-label="件數"]').fill("42");
  await page.locator('button:has-text("新增配送單")').click();
  await page.locator('article:has-text("測試超商物流") button:has-text("配送中")').click();
  await page.locator('button:has-text("指派車輛")').click();
  await page.locator('button:has-text("新增簽收")').click();
  await page.locator('button:has-text("新增異常")').click();
  await page.locator('button:has-text("新增結算")').click();

  const hasShipment = await page.getByText("測試超商物流").count();
  const hasDispatch = await page.getByText("KLC-3399").count();
  const hasSignature = await page.getByText("測試客戶 已完成電子簽名與影像簽單").count();
  const hasException = await page.getByText("地址無人收貨").count();
  const hasSettlement = await page.getByText("新增運費結算").count();

  await page.screenshot({ path: `verification/tms-${viewport.name}.png`, fullPage: true });
  results.push({ viewport: viewport.name, bodyLen, overlay, consoleErrors: errors, hasShipment, hasDispatch, hasSignature, hasException, hasSettlement });
  await page.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 2));
