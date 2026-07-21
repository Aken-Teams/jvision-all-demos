import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const url = process.env.DEMO_URL || process.argv[2] || "http://127.0.0.1:3132";

await mkdir("verification", { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];

for (const viewport of [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "mobile", width: 390, height: 1100 },
]) {
  const page = await browser.newPage({ viewport });
  const consoleErrors = [];
  const failedResponses = [];
  page.on("console", (message) => {
    if (message.type() === "error" && !message.text().includes("Failed to load resource")) consoleErrors.push(message.text());
  });
  page.on("response", (response) => {
    if (response.status() >= 400 && !response.url().includes("/_vercel/insights/script.js")) failedResponses.push(`${response.status()} ${response.url()}`);
  });

  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  await page.getByRole("button", { name: "新增維修通報" }).click();
  await page.getByRole("button", { name: "生成 AI 維護摘要" }).click();
  await page.getByRole("button", { name: "建立預防保養提醒" }).click();
  await page.getByRole("button", { name: "送下一步" }).first().click();
  const body = await page.locator("body").innerText();
  await page.screenshot({ path: `verification/equipment-maintenance-suite-${viewport.name}.png`, fullPage: true });
  results.push({
    viewport: viewport.name,
    hasTitle: body.includes("設備維護整合平台"),
    hasDemo: body.includes("新增維修通報"),
    hasBoard: body.includes("工單看板"),
    hasAi: body.includes("AI 維護摘要") || body.includes("AI 摘要"),
    hasButtons: body.includes("退回") && body.includes("送下一步"),
    noMojibake: !/[蝞摮撌銝隤鞈嚗�]/.test(body),
    consoleErrors,
    failedResponses,
  });
  await page.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 2));

if (results.some((r) => !r.hasTitle || !r.hasDemo || !r.hasBoard || !r.hasAi || !r.hasButtons || !r.noMojibake || r.consoleErrors.length || r.failedResponses.length)) {
  process.exit(1);
}
