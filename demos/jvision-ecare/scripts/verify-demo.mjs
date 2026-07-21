import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const target = process.argv[2] || "http://127.0.0.1:3000";
const viewports = [
  { name: "desktop", width: 1440, height: 1100 },
  { name: "mobile", width: 390, height: 1100 }
];

await mkdir("verification", { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];

for (const viewport of viewports) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto(target, { waitUntil: "networkidle" });
  await page.locator('a[href="#demo"]').first().click();
  await page.locator('input[aria-label="長者姓名"]').fill("測試長者");
  await page.locator('input[aria-label="床號"]').fill("C-101");
  await page.locator('input[aria-label="照護等級"]').fill("中度照護");
  await page.locator('button:has-text("新增長者")').click();
  await page.locator('article:has-text("測試長者") button:has-text("跌倒風險")').click();
  await page.locator('input[aria-label="紀錄長者"]').fill("測試長者");
  await page.locator('input[aria-label="照護紀錄"]').fill("完成晨間照護與用藥確認");
  await page.locator('button:has-text("新增紀錄")').click();
  await page.locator('input[aria-label="班別"]').fill("晚班");
  await page.locator('input[aria-label="人員配置"]').fill("護理 2 / 照服員 6");
  await page.locator('input[aria-label="床位數"]').fill("24");
  await page.locator('button:has-text("新增班表")').click();
  await page.locator('button:has-text("新增帳務")').click();
  await page.screenshot({ path: `verification/ecare-${viewport.name}.png`, fullPage: true });
  const bodyLen = (await page.textContent("body"))?.length || 0;
  const overlay = await page.locator("nextjs-portal").count();
  const hasElder = await page.getByText("測試長者").count();
  const hasRecord = await page.getByText("完成晨間照護與用藥確認").count();
  const hasShift = await page.getByText("護理 2 / 照服員 6").count();
  const hasBilling = await page.getByText("NT$ 4,800").count();
  results.push({ viewport: viewport.name, bodyLen, overlay, consoleErrors: errors, hasElder, hasRecord, hasShift, hasBilling });
  await page.close();
}

await browser.close();

console.log(JSON.stringify(results, null, 2));

if (results.some((result) => result.overlay || result.consoleErrors.length || !result.hasElder || !result.hasRecord || !result.hasShift || !result.hasBilling || result.bodyLen < 1000)) {
  process.exit(1);
}
