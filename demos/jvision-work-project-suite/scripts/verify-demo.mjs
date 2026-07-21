import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const url = process.env.DEMO_URL || process.argv[2] || "http://127.0.0.1:3131";

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
    const text = message.text();
    if (message.type() === "error" && !text.includes("Failed to load resource")) consoleErrors.push(text);
  });

  page.on("response", (response) => {
    if (response.status() >= 400 && !response.url().includes("/_vercel/insights/script.js")) {
      failedResponses.push(`${response.status()} ${response.url()}`);
    }
  });

  await page.goto(url, { waitUntil: "networkidle" });
  await page.locator(".task-form button").click();
  await page.locator(".ai-panel button").click();
  await page.getByRole("button", { name: "送下一步" }).first().click();
  await page.locator(".goals-panel .panel-heading button").click();

  const body = await page.locator("body").innerText();
  const result = {
    viewport: viewport.name,
    hasTitle: body.includes("工作與專案管理平台"),
    hasDemo: body.includes("新增任務"),
    hasBoard: body.includes("專案看板"),
    hasGoal: body.includes("目標與工作負荷"),
    hasClearWorkflowButtons: body.includes("退回") && body.includes("送下一步"),
    noMojibake: !/[蝞摮撌銝隤鞈嚗�]/.test(body),
    consoleErrors,
    failedResponses,
  };
  await page.screenshot({ path: `verification/work-project-suite-${viewport.name}.png`, fullPage: true });
  results.push(result);
  await page.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 2));

if (
  results.some(
    (result) =>
      !result.hasTitle ||
      !result.hasDemo ||
      !result.hasBoard ||
      !result.hasGoal ||
      !result.hasClearWorkflowButtons ||
      !result.noMojibake ||
      result.consoleErrors.length ||
      result.failedResponses.length,
  )
) {
  process.exit(1);
}
