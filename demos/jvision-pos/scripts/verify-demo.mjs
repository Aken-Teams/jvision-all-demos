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
  await page.locator('button:has-text("焦糖拿鐵")').click();
  await page.locator('button:has-text("巴斯克乳酪蛋糕")').click();
  await page.locator('button:has-text("套用 50 元折抵")').click();
  await page.locator('button:has-text("完成結帳")').click();
  await page.locator('article:has-text("L-1028") button:has-text("製作中")').click();
  await page.locator('input[name="time"]').fill("20:00");
  await page.locator('input[name="name"]').fill("測試客人");
  await page.locator('input[name="party"]').fill("3");
  await page.locator('input[name="note"]').fill("靠窗，預點拿鐵");
  await page.locator('button:has-text("新增訂位")').click();

  const hasReceipt = await page.getByText("已以 信用卡 結帳").count();
  const hasReservation = await page.getByText("測試客人").count();
  const hasOnlineStatus = await page.locator('article:has-text("L-1028") button:has-text("製作中"):disabled').count();

  await page.screenshot({ path: `verification/pos-${viewport.name}.png`, fullPage: true });
  results.push({ viewport: viewport.name, bodyLen, overlay, consoleErrors: errors, hasReceipt, hasReservation, hasOnlineStatus });
  await page.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 2));
