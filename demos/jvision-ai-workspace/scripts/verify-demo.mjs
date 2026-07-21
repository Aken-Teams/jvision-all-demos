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
  await page.locator('input[aria-label="文件標題"]').fill("測試 AI 工作區手冊");
  await page.locator('input[aria-label="文件類型"]').fill("Guide");
  await page.locator('input[aria-label="負責人"]').fill("測試 PM");
  await page.locator('button:has-text("新增文件")').click();
  await page.locator('article:has-text("測試 AI 工作區手冊") button:has-text("已發布")').click();
  await page.locator('button:has-text("新增任務")').click();
  await page.locator('button:has-text("完成任務")').click();
  await page.locator('button:has-text("新增會議")').click();
  await page.locator('button:has-text("知識問答")').click();
  await page.locator('button:has-text("指派代理人")').click();
  await page.locator('button:has-text("產生報告")').click();

  const hasDoc = await page.getByText("測試 AI 工作區手冊").count();
  const hasTask = await page.getByText("測試任務：整理需求").count();
  const hasMeeting = await page.getByText("測試會議筆記").count();
  const hasAnswer = await page.getByText("知識庫回答：測試專案負責人").count();
  const hasAgent = await page.getByText("報告代理人：已整理主管摘要").count();
  const hasReport = await page.getByText("AI 專案報告已產生").count();

  await page.screenshot({ path: `verification/ai-workspace-${viewport.name}.png`, fullPage: true });
  results.push({ viewport: viewport.name, bodyLen, overlay, consoleErrors: errors, hasDoc, hasTask, hasMeeting, hasAnswer, hasAgent, hasReport });
  await page.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 2));
