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

  await page.goto(targetUrl, { waitUntil: "networkidle", timeout: 45000 });
  const bodyLen = (await page.locator("body").innerText()).trim().length;
  const overlay = await page.locator("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay").count();

  await page.locator('a[href="#demo"]').first().click();
  await page.getByPlaceholder("時間 16:00").fill("16:20");
  await page.getByPlaceholder("車主姓名").fill("黃小姐");
  await page.getByPlaceholder("車牌 ABC-1234").fill("JVS-2026");
  await page.getByPlaceholder("服務項目").fill("輪胎定位");
  await page.getByRole("button", { name: "新增預約" }).click();
  await page.getByRole("button", { name: "轉工單" }).first().click();
  await page.getByRole("button", { name: /基本保養套餐/ }).click();
  await page.getByRole("button", { name: /前輪煞車皮更換/ }).click();
  await page.getByRole("button", { name: "傳送 LINE 估價" }).click();
  await page.getByRole("button", { name: "結帳並存車歷" }).click();

  const hasCheckout = await page.getByText("發票與車歷紀錄已自動保存").count();
  const hasPlate = await page.getByText("JVS-2026").count();
  const hasStock = await page.getByText("低庫存").count();

  await page.screenshot({ path: `verification/jvision-car-cloud-${viewport.name}.png`, fullPage: true });
  results.push({ viewport: viewport.name, bodyLen, overlay, consoleErrors: errors, hasCheckout, hasPlate, hasStock });
  await page.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 2));
