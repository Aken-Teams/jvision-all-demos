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
  await page.locator('input[aria-label="資料集名稱"]').fill("測試財務資料集");
  await page.locator('input[aria-label="資料來源"]').fill("Finance DB");
  await page.locator('input[aria-label="資料列數"]').fill("56000");
  await page.locator('button:has-text("匯入資料集")').click();
  await page.locator('article:has-text("測試財務資料集") button:has-text("已連線")').click();
  await page.locator('button:has-text("更新指標")').click();
  await page.locator('button:has-text("產生報表")').click();
  await page.locator('button:has-text("發布報表")').click();
  await page.locator('button:has-text("分享報表")').click();
  await page.locator('button:has-text("詢問 AI")').click();
  await page.locator('button:has-text("產生摘要")').click();
  await page.locator('button:has-text("建立治理紀錄")').click();

  const hasDataset = await page.getByText("測試財務資料集").count();
  const hasReport = await page.getByText("測試營運分析報表").count();
  const hasShare = await page.getByText("分享連結已建立").count();
  const hasAi = await page.getByText("AI 洞察：新增資料集").count();
  const hasSummary = await page.getByText("AI 摘要：庫存週轉下降").count();
  const hasGovernance = await page.getByText("新增治理紀錄").count();

  await page.screenshot({ path: `verification/bi-analytics-${viewport.name}.png`, fullPage: true });
  results.push({ viewport: viewport.name, bodyLen, overlay, consoleErrors: errors, hasDataset, hasReport, hasShare, hasAi, hasSummary, hasGovernance });
  await page.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 2));
