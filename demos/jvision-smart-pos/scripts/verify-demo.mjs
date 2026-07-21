import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

await mkdir("verification", { recursive: true });

const targetUrl = process.argv[2] || "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true });
const results = [];

for (const viewport of [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "mobile", width: 390, height: 844 }
]) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  await page.goto(targetUrl, { waitUntil: "networkidle", timeout: 30000 });
  const bodyLen = (await page.locator("body").innerText()).trim().length;
  const overlay = await page
    .locator("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay")
    .count();

  await page.locator('a[href="#demo"]').first().click();
  await page.locator('button:has-text("香氛蠟燭")').click();
  await page.locator('button:has-text("聯名托特包")').click();
  await page.locator('button:has-text("套用會員 200 元券")').click();
  await page.locator('button:has-text("完成結帳並扣庫存")').click();
  await page.locator('button:has-text("模擬人流增加")').click();
  await page.locator('input[name="from"]').fill("信義店");
  await page.locator('input[name="to"]').fill("台中店");
  await page.locator('input[name="item"]').fill("智慧水壺");
  await page.locator('input[name="qty"]').fill("2");
  await page.locator('button:has-text("建立調撥")').click();
  await page.locator('textarea[aria-label="數位看板內容"]').fill("測試看板推送成功");

  const hasReceipt = await page.getByText("已用 Apple Pay 結帳").count();
  const hasTransfer = await page.getByText("台中店").count();
  const hasSignage = await page.getByText("測試看板推送成功").count();

  await page.screenshot({ path: `verification/smart-pos-${viewport.name}.png`, fullPage: true });
  results.push({ viewport: viewport.name, bodyLen, overlay, consoleErrors: errors, hasReceipt, hasTransfer, hasSignage });
  await page.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 2));
