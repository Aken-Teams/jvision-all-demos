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
  await page.locator('input[aria-label="案件名稱"]').fill("測試智慧合約糾紛");
  await page.locator('input[aria-label="當事人"]').fill("測試客戶");
  await page.locator('input[aria-label="承辦律師"]').fill("測試律師");
  await page.locator('button:has-text("新增案件")').click();
  await page.locator('article:has-text("測試智慧合約糾紛") button:has-text("開庭中")').click();
  await page.locator('button:has-text("新增庭期")').click();
  await page.locator('button:has-text("新增待辦")').click();
  await page.locator('button:has-text("發送提醒")').click();
  await page.locator('button:has-text("登錄工時")').click();
  await page.locator('button:has-text("新增請款")').click();
  await page.locator('article:has-text("測試待辦撰寫書狀") button:has-text("完成回報")').click();

  const hasCase = await page.getByText("測試智慧合約糾紛").count();
  const hasHearing = await page.getByText("智慧法院").count();
  const hasTask = await page.getByText("測試待辦撰寫書狀").count();
  const hasNotice = await page.getByText("HotLine 強制提醒已發送").count();
  const hasBilling = await page.getByText("新增請款 NT$ 60,000").count();

  await page.screenshot({ path: `verification/legalops-${viewport.name}.png`, fullPage: true });
  results.push({ viewport: viewport.name, bodyLen, overlay, consoleErrors: errors, hasCase, hasHearing, hasTask, hasNotice, hasBilling });
  await page.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 2));
