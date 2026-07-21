import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

await mkdir("verification", { recursive: true });
const targetUrl = process.argv[2] || "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true });
const results = [];

for (const viewport of [{ name: "desktop", width: 1440, height: 1000 }, { name: "mobile", width: 390, height: 844 }]) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
  await page.goto(targetUrl, { waitUntil: "networkidle", timeout: 30000 });
  const bodyLen = (await page.locator("body").innerText()).trim().length;
  const overlay = await page.locator("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay").count();
  await page.locator('a[href="#demo"]').first().click();
  await page.locator('input[aria-label="課程名稱"]').fill("測試課程");
  await page.locator('input[aria-label="價格"]').fill("3600");
  await page.locator('input[aria-label="單元數"]').fill("8");
  await page.locator('button:has-text("新增課程")').click();
  await page.locator('button:has-text("測試課程")').click();
  await page.locator('input[aria-label="折扣碼"]').fill("JVISION20");
  await page.locator('button:has-text("完成結帳")').click();
  await page.locator('input[aria-label="新增單元標題"]').fill("測試影音單元");
  await page.locator('button:has-text("新增單元")').click();
  await page.locator('input[aria-label="學員"]').fill("測試學員");
  await page.locator('input[aria-label="作業回饋"]').fill("測試回饋成功");
  await page.locator('button:has-text("送出回饋")').click();
  const hasCourse = await page.getByText("測試課程").count();
  const hasOrder = await page.getByText("已付款").count();
  const hasLesson = await page.getByText("測試影音單元").count();
  const hasFeedback = await page.getByText("測試回饋成功").count();
  await page.screenshot({ path: `verification/course-${viewport.name}.png`, fullPage: true });
  results.push({ viewport: viewport.name, bodyLen, overlay, consoleErrors: errors, hasCourse, hasOrder, hasLesson, hasFeedback });
  await page.close();
}
await browser.close();
console.log(JSON.stringify(results, null, 2));
