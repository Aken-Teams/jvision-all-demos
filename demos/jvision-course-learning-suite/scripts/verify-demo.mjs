import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const url = process.env.DEMO_URL || process.argv[2] || "http://127.0.0.1:3134";
await mkdir("verification", { recursive: true });

const browser = await chromium.launch({ headless: true });
const results = [];

try {
  for (const viewport of [
    { name: "desktop", width: 1440, height: 1000 },
    { name: "mobile", width: 390, height: 1100 },
  ]) {
    const page = await browser.newPage({ viewport });
    const consoleErrors = [];
    const failedResponses = [];

    page.on("console", (message) => {
      if (message.type() === "error" && !message.text().includes("Failed to load resource")) {
        consoleErrors.push(message.text());
      }
    });

    page.on("response", (response) => {
      if (response.status() >= 400 && !response.url().includes("/_vercel/insights/script.js")) {
        failedResponses.push(`${response.status()} ${response.url()}`);
      }
    });

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForSelector(".suite-demo", { timeout: 30000 });

    await page.getByLabel("課程名稱").fill("AI 直播實戰課");
    await page.getByLabel("講師").fill("Nina");
    await page.getByLabel("售價").fill("5200");
    await page.getByLabel("單元數").fill("10");
    await page.getByRole("button", { name: "新增課程" }).click();
    await page.getByRole("button", { name: "發布上架" }).first().click();
    await page.getByRole("button", { name: "預約課程" }).first().click();
    await page.getByRole("button", { name: "回覆作業" }).click();

    const body = await page.locator("body").innerText();
    await page.screenshot({ path: `verification/course-learning-suite-${viewport.name}.png`, fullPage: true });

    results.push({
      viewport: viewport.name,
      hasTitle: body.includes("課程工具、線上課程"),
      hasCourse: body.includes("課程上架"),
      hasBooking: body.includes("課表預約"),
      hasStudent: body.includes("學員進度"),
      hasAi: body.includes("Jvision AI 營運摘要"),
      noMojibake: !/[蝞摮撌銝隤鞈嚗�]/.test(body),
      consoleErrors,
      failedResponses,
    });

    await page.close();
  }
} finally {
  await browser.close();
}

console.log(JSON.stringify(results, null, 2));

if (
  results.some(
    (result) =>
      !result.hasTitle ||
      !result.hasCourse ||
      !result.hasBooking ||
      !result.hasStudent ||
      !result.hasAi ||
      !result.noMojibake ||
      result.consoleErrors.length ||
      result.failedResponses.length,
  )
) {
  process.exit(1);
}
