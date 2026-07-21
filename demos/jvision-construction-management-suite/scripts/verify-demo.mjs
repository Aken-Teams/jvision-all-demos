import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const url = process.env.DEMO_URL || process.argv[2] || "http://127.0.0.1:3133";
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
  await page.getByRole("button", { name: "新增估價" }).click();
  await page.getByRole("button", { name: "推進流程" }).first().click();
  await page.getByRole("button", { name: "更新進度與成本" }).click();
  await page.getByRole("button", { name: "日報" }).click();
  const body = await page.locator("body").innerText();
  await page.screenshot({ path: `verification/construction-management-suite-${viewport.name}.png`, fullPage: true });
  results.push({
    viewport: viewport.name,
    hasTitle: body.includes("營建工程整合平台"),
    hasEstimate: body.includes("新增工程估價"),
    hasProject: body.includes("工程專案看板"),
    hasField: body.includes("現場回報"),
    hasAi: body.includes("AI 工程摘要"),
    noMojibake: !/[蝞摮撌銝隤鞈嚗�]/.test(body),
    consoleErrors,
    failedResponses,
  });
  await page.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 2));
if (results.some((r) => !r.hasTitle || !r.hasEstimate || !r.hasProject || !r.hasField || !r.hasAi || !r.noMojibake || r.consoleErrors.length || r.failedResponses.length)) process.exit(1);
