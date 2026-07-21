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
  page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });

  await page.goto(targetUrl, { waitUntil: "networkidle", timeout: 30000 });
  const bodyLen = (await page.locator("body").innerText()).trim().length;
  const overlay = await page.locator("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay").count();

  await page.locator('a[href="#demo"]').first().click();
  await page.locator('input[aria-label="主標題"]').fill("測試品牌首頁標題");
  await page.locator('select').selectOption("Editorial Blue");
  await page.locator('button:has-text("新增活動區塊")').click();
  await page.locator('button:has-text("森系香氛組")').click();
  await page.locator('button:has-text("建立訂單")').click();
  await page.locator('input[name="email"]').fill("test@example.com");
  await page.locator('input[name="message"]').fill("測試表單送出成功");
  await page.locator('button:has-text("送出表單")').click();
  await page.locator('input').nth(4).fill("測試 SEO 標題");

  const hasHeadline = await page.getByText("測試品牌首頁標題").count();
  const hasOrder = await page.getByText("已建立：森系香氛組").count();
  const hasLead = await page.getByText("測試表單送出成功").count();
  const hasSeo = await page.getByText("測試 SEO 標題").count();

  await page.screenshot({ path: `verification/store-design-${viewport.name}.png`, fullPage: true });
  results.push({ viewport: viewport.name, bodyLen, overlay, consoleErrors: errors, hasHeadline, hasOrder, hasLead, hasSeo });
  await page.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 2));
