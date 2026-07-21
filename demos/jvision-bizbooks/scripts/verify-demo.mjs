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
  await page.locator('input[aria-label="交易摘要"]').fill("測試銀行入帳");
  await page.locator('input[aria-label="金額"]').fill("128000");
  await page.locator('input[aria-label="歸屬專案"]').fill("測試專案");
  await page.locator('button:has-text("匯入明細")').click();
  await page.locator('article:has-text("測試銀行入帳") button:has-text("自動分類")').click();
  await page.locator('button:has-text("新增應收")').click();
  await page.locator('button:has-text("收款入帳")').click();
  await page.locator('button:has-text("新增代墊")').click();
  await page.locator('button:has-text("核銷代墊")').click();
  await page.locator('button:has-text("新增專案損益")').click();
  await page.locator('button:has-text("產生財報")').click();

  const hasTransaction = await page.getByText("測試銀行入帳").count();
  const hasCategory = await page.getByText("營業收入").count();
  const hasReceivable = await page.getByText("測試客戶應收款").count();
  const hasExpense = await page.getByText("測試代墊款").count();
  const hasReport = await page.getByText("三大財報已產生").count();
  const hasProject = await page.getByText("測試專案損益").count();

  await page.screenshot({ path: `verification/bizbooks-${viewport.name}.png`, fullPage: true });
  results.push({ viewport: viewport.name, bodyLen, overlay, consoleErrors: errors, hasTransaction, hasCategory, hasReceivable, hasExpense, hasReport, hasProject });
  await page.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 2));
