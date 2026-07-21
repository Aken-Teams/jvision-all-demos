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
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  await page.goto(targetUrl, { waitUntil: "networkidle", timeout: 30000 });
  const bodyLen = (await page.locator("body").innerText()).trim().length;
  const overlay = await page.locator("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay").count();

  await page.locator('a[href="#demo"]').first().click();
  await page.getByRole("button", { name: "複製上週課表" }).click();
  await page.getByPlaceholder("課程名稱").fill("晨間肌力");
  await page.getByPlaceholder("教練").fill("Ariel");
  await page.getByPlaceholder("20:00").fill("07:30");
  await page.getByPlaceholder("名額").fill("8");
  await page.getByPlaceholder("單堂價格").fill("760");
  await page.getByRole("button", { name: "新增課程" }).click();
  await page.getByRole("button", { name: "發布" }).first().click();
  await page.getByRole("button", { name: "購買 10 堂課包" }).click();
  await page.getByRole("button", { name: "預約並鎖定座位" }).click();
  await page.getByRole("button", { name: "簽署合約" }).first().click();
  await page.getByRole("button", { name: "未開立" }).first().click();

  const hasBooking = await page.getByText("剩餘 21 堂").count();
  const hasContract = await page.getByText("已簽署").count();
  const hasInvoice = await page.getByText("已開立").count();

  await page.screenshot({ path: `verification/course-tools-${viewport.name}.png`, fullPage: true });
  results.push({ viewport: viewport.name, bodyLen, overlay, consoleErrors: errors, hasBooking, hasContract, hasInvoice });
  await page.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 2));
