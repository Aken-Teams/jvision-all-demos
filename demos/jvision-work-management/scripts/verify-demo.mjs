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
    const text = msg.text();
    if (msg.type() === "error" && !text.includes("Failed to load resource")) errors.push(text);
  });

  await page.goto(targetUrl, { waitUntil: "networkidle", timeout: 45000 });
  const bodyLen = (await page.locator("body").innerText()).trim().length;
  const overlay = await page.locator("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay").count();

  await page.locator('a[href="#demo"]').first().click();
  await page.getByPlaceholder("任務名稱").fill("客戶需求訪談");
  await page.getByLabel("負責人").selectOption("Leo");
  await page.getByLabel("優先順序").selectOption("高");
  await page.getByPlaceholder("截止日 7/15").fill("7/18");
  await page.getByPlaceholder("預估工時").fill("9");
  await page.getByRole("button", { name: "新增任務" }).click();
  await page.locator(".task-card").first().getByRole("button", { name: "往後移動" }).click();
  await page.getByRole("button", { name: "生成 AI 摘要" }).click();
  await page.getByRole("button", { name: "平衡工作量" }).click();

  const hasTask = await page.getByText("客戶需求訪談").count();
  const hasAi = await page.getByText("AI 建議先處理審核中與高優先任務").count();
  const hasBalance = await page.getByText("工作量已重新平衡").count();

  await page.screenshot({ path: `verification/jvision-work-management-${viewport.name}.png`, fullPage: true });
  results.push({ viewport: viewport.name, bodyLen, overlay, consoleErrors: errors, hasTask, hasAi, hasBalance });
  await page.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 2));

if (results.some((result) => result.overlay || result.consoleErrors.length || !result.hasTask || !result.hasAi || !result.hasBalance || result.bodyLen < 1000)) {
  process.exit(1);
}
