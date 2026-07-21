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
  await page.locator('input[aria-label="帳戶名稱"]').fill("測試外幣帳戶");
  await page.locator('input[aria-label="帳戶類型"]').fill("外幣");
  await page.locator('input[aria-label="餘額"]').fill("56000");
  await page.locator('button:has-text("新增帳戶")').click();
  await page.locator('button:has-text("匯入交易")').click();
  await page.locator('button:has-text("自動分類")').click();
  await page.locator('button:has-text("新增帳單")').click();
  await page.locator('button:has-text("新增預算")').click();
  await page.locator('button:has-text("新增目標")').click();
  await page.locator('article:has-text("餐飲") button:has-text("增加支出")').click();

  const hasAccount = await page.getByText("測試外幣帳戶").count();
  const hasTransaction = await page.getByText("測試咖啡消費").count();
  const hasCategory = await page.getByText("餐飲").count();
  const hasBill = await page.getByText("新增房租提醒").count();
  const hasGoal = await page.getByText("新增旅遊基金目標").count();

  await page.screenshot({ path: `verification/personal-finance-${viewport.name}.png`, fullPage: true });
  results.push({ viewport: viewport.name, bodyLen, overlay, consoleErrors: errors, hasAccount, hasTransaction, hasCategory, hasBill, hasGoal });
  await page.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 2));
