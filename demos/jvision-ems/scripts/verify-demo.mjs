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
  await page.locator('input[aria-label="電表名稱"]').fill("測試智慧電表");
  await page.locator('input[aria-label="場域"]').fill("測試大樓");
  await page.locator('input[aria-label="即時功率"]').fill("88");
  await page.locator('input[aria-label="累計電量"]').fill("520");
  await page.locator('button:has-text("新增電表")').click();
  await page.locator('article:has-text("測試智慧電表") button:has-text("告警")').click();
  await page.locator('button:has-text("建立告警")').click();
  await page.locator('button:has-text("新增策略")').click();
  await page.locator('button:has-text("啟用策略")').click();
  await page.locator('button:has-text("計算碳排")').click();
  await page.locator('button:has-text("產生節電比較")').click();
  await page.locator('button:has-text("產生報表")').click();

  const hasMeter = await page.getByText("測試智慧電表").count();
  const hasAlert = await page.getByText("測試需量超標告警").count();
  const hasPolicy = await page.getByText("測試節能策略").count();
  const hasCarbon = await page.getByText("碳排計算已更新").count();
  const hasCompare = await page.getByText("節電比較報表").count();
  const hasReport = await page.getByText("能源報表已產生").count();

  await page.screenshot({ path: `verification/ems-${viewport.name}.png`, fullPage: true });
  results.push({ viewport: viewport.name, bodyLen, overlay, consoleErrors: errors, hasMeter, hasAlert, hasPolicy, hasCarbon, hasCompare, hasReport });
  await page.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 2));
