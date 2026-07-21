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
  await page.locator('input[aria-label="工程案名稱"]').fill("測試捷運宅統包");
  await page.locator('input[aria-label="業主名稱"]').fill("測試建設");
  await page.locator('input[aria-label="預算"]').fill("3600000");
  await page.locator('button:has-text("新增工程案")').click();
  await page.locator('article:has-text("測試捷運宅統包") button:has-text("施工中")').click();
  await page.locator('input[aria-label="材料品項"]').fill("水泥 200 包");
  await page.locator('input[aria-label="歸屬工程"]').fill("測試捷運宅統包");
  await page.locator('input[aria-label="金額"]').fill("128000");
  await page.locator('button:has-text("新增採購")').click();
  await page.locator('button:has-text("新增出工")').click();
  await page.locator('button:has-text("新增報價單")').click();
  await page.locator('button:has-text("新增結算")').click();

  const hasProject = await page.getByText("測試捷運宅統包").count();
  const hasPurchase = await page.getByText("水泥 200 包").count();
  const hasLabor = await page.getByText("泥作班").count();
  const hasQuote = await page.getByText("地下室防水追加工程").count();
  const hasSettlement = await page.getByText("新增請款結算").count();

  await page.screenshot({ path: `verification/construction-erp-${viewport.name}.png`, fullPage: true });
  results.push({ viewport: viewport.name, bodyLen, overlay, consoleErrors: errors, hasProject, hasPurchase, hasLabor, hasQuote, hasSettlement });
  await page.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 2));
