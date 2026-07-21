import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const url = process.env.DEMO_URL || process.argv[2] || "http://127.0.0.1:3138";
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
    await page.getByLabel("款式編號").fill("SS26-SK-031");
    await page.getByLabel("款式名稱").fill("抽繩工裝裙");
    await page.getByLabel("品類").fill("裙裝");
    await page.getByLabel("負責人").fill("Ryan");
    await page.getByLabel("目標成本").fill("580");
    await page.getByRole("button", { name: "新增款式" }).click();
    await page.getByText("SS26-SK-031", { exact: true }).waitFor({ timeout: 10000 });
    await page.getByRole("button", { name: "上傳文件" }).click();
    await page.getByRole("button", { name: "生成 AI 摘要" }).click();

    const body = await page.locator("body").innerText();
    await page.screenshot({ path: `verification/fashion-plm-${viewport.name}.png`, fullPage: true });

    results.push({
      viewport: viewport.name,
      hasTitle: body.includes("Jvision 服裝系列開發 PLM 平台"),
      hasStyle: body.includes("新增款式資料"),
      hasMonitor: body.includes("即時產品監控"),
      hasMaterial: body.includes("BOM 物料追蹤"),
      hasAi: body.includes("系列上市摘要"),
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
if (results.some((result) => !result.hasTitle || !result.hasStyle || !result.hasMonitor || !result.hasMaterial || !result.hasAi || !result.noMojibake || result.consoleErrors.length || result.failedResponses.length)) {
  process.exit(1);
}
