import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const url = process.env.DEMO_URL || process.argv[2] || "http://127.0.0.1:3135";
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
    await page.waitForSelector(".demo-shell", { timeout: 30000 });
    await page.getByLabel("場域名稱").fill("台中營運中心");
    await page.getByLabel("負責單位").fill("永續辦公室");
    await page.getByLabel("活動數據").fill("9800");
    await page.getByRole("button", { name: "新增盤查資料" }).click();
    await page.getByLabel("設備名稱").fill("B 棟冰水主機");
    await page.getByLabel("設備場域").fill("台中廠");
    await page.getByLabel("即時用電").fill("76");
    await page.getByLabel("本月用電").fill("610");
    await page.getByRole("button", { name: "新增能源設備" }).click();
    await page.getByRole("button", { name: "生成 AI 摘要" }).click();
    await page.getByRole("button", { name: "建立節能任務" }).click();

    const body = await page.locator("body").innerText();
    await page.screenshot({ path: `verification/esg-energy-carbon-${viewport.name}.png`, fullPage: true });

    results.push({
      viewport: viewport.name,
      hasTitle: body.includes("Jvision ESG 能源與碳管理平台"),
      hasEnergy: body.includes("能源監控"),
      hasCarbon: body.includes("碳盤查"),
      hasTask: body.includes("改善任務看板"),
      hasAi: body.includes("能源與碳排摘要"),
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
if (results.some((result) => !result.hasTitle || !result.hasEnergy || !result.hasCarbon || !result.hasTask || !result.hasAi || !result.noMojibake || result.consoleErrors.length || result.failedResponses.length)) {
  process.exit(1);
}
