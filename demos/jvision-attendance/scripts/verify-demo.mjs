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
  await page.locator('input[aria-label="員工姓名"]').fill("測試員工");
  await page.locator('input[aria-label="部門"]').fill("測試部門");
  await page.locator('input[aria-label="職務"]').fill("專員");
  await page.locator('button:has-text("新增員工")').click();
  await page.locator('article:has-text("測試員工") button:has-text("上班中")').click();
  await page.locator('article:has-text("測試員工") button:has-text("已下班")').click();
  await page.locator('button:has-text("新增外勤")').click();
  await page.locator('button:has-text("標記異常")').click();
  await page.locator('button:has-text("送出請假")').click();
  await page.locator('button:has-text("主管簽核")').click();
  await page.locator('button:has-text("計算工時")').click();

  const hasEmployee = await page.getByText("測試員工").count();
  const hasField = await page.getByText("測試外勤回報").count();
  const hasException = await page.getByText("GPS 地點異常").count();
  const hasLeave = await page.getByText("病假 0.5 天").count();
  const hasPayroll = await page.getByText("新增薪時計算").count();

  await page.screenshot({ path: `verification/attendance-${viewport.name}.png`, fullPage: true });
  results.push({ viewport: viewport.name, bodyLen, overlay, consoleErrors: errors, hasEmployee, hasField, hasException, hasLeave, hasPayroll });
  await page.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 2));
