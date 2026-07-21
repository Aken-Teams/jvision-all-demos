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

  await page.goto(targetUrl, { waitUntil: "networkidle", timeout: 45000 });
  const bodyLen = (await page.locator("body").innerText()).trim().length;
  const overlay = await page.locator("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay").count();

  await page.locator('a[href="#demo"]').first().click();
  await page.getByPlaceholder("姓名").fill("黃詩涵");
  await page.getByPlaceholder("公司").fill("Jade Cloud");
  await page.getByPlaceholder("Email").fill("sales@jadecloud.example");
  await page.getByRole("button", { name: "新增客戶" }).click();
  await page.getByRole("button", { name: "建立商機" }).click();
  await page.getByRole("button", { name: "記錄活動" }).click();
  await page.locator(".deal-card").first().getByRole("button", { name: "→" }).click();
  await page.locator(".task-list input").first().check();

  const hasContact = await page.getByText("Jade Cloud").count();
  const hasActivity = await page.getByText("需求摘要").count();
  const hasPipeline = await page.getByText("管線已更新").count();

  await page.screenshot({ path: `verification/jvision-crm-${viewport.name}.png`, fullPage: true });
  results.push({ viewport: viewport.name, bodyLen, overlay, consoleErrors: errors, hasContact, hasActivity, hasPipeline });
  await page.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 2));
