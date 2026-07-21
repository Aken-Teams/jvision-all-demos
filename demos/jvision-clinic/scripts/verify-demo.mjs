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
  await page.locator('input[aria-label="患者姓名"]').fill("測試患者");
  await page.locator('input[aria-label="預約時間"]').fill("15:30");
  await page.locator('input[aria-label="醫師"]').fill("測試醫師");
  await page.locator('button:has-text("新增預約")').click();
  await page.locator('article:has-text("測試患者") button:has-text("候診中")').click();
  await page.locator('input[aria-label="病歷患者"]').fill("測試患者");
  await page.locator('input[aria-label="摘要"]').fill("測試摘要建立成功");
  await page.locator('button:has-text("建立摘要")').click();
  await page.locator('input[aria-label="角色"]').fill("護理師 B");
  await page.locator('input[aria-label="工時"]').fill("6");
  await page.locator('button:has-text("新增班表")').click();
  await page.locator('button:has-text("新增收款")').click();
  const hasPatient = await page.getByText("測試患者").count();
  const hasNote = await page.getByText("測試摘要建立成功").count();
  const hasShift = await page.getByText("護理師 B").count();
  const hasPayment = await page.getByText("療程費 NT$1200 已收款").count();
  await page.screenshot({ path: `verification/clinic-${viewport.name}.png`, fullPage: true });
  results.push({ viewport: viewport.name, bodyLen, overlay, consoleErrors: errors, hasPatient, hasNote, hasShift, hasPayment });
  await page.close();
}
await browser.close();
console.log(JSON.stringify(results, null, 2));
