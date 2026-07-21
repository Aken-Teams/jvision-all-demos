import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const url = process.env.DEMO_URL || process.argv[2] || "http://127.0.0.1:3136";
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
    await page.getByLabel("客戶姓名").fill("陳小姐");
    await page.getByLabel("專案名稱").fill("大安住宅全室規劃");
    await page.getByLabel("空間區域").fill("玄關與客廳");
    await page.getByLabel("預算金額").fill("680000");
    await page.getByRole("button", { name: "新增提案" }).click();
    await page.getByText("大安住宅全室規劃", { exact: true }).waitFor({ timeout: 10000 });
    await page.getByRole("button", { name: "核准提案" }).first().click({ force: true });
    await page.getByRole("button", { name: "加入採購" }).first().click();
    await page.getByRole("button", { name: "生成 AI 專案摘要" }).click();

    const body = await page.locator("body").innerText();
    await page.screenshot({ path: `verification/interior-design-studio-${viewport.name}.png`, fullPage: true });

    results.push({
      viewport: viewport.name,
      hasTitle: body.includes("Jvision 室內設計專案管理平台"),
      hasProposal: body.includes("新增設計提案"),
      hasSelection: body.includes("選品板與客戶確認"),
      hasProcurement: body.includes("採購與到貨追蹤"),
      hasAi: body.includes("專案摘要"),
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
if (results.some((result) => !result.hasTitle || !result.hasProposal || !result.hasSelection || !result.hasProcurement || !result.hasAi || !result.noMojibake || result.consoleErrors.length || result.failedResponses.length)) {
  process.exit(1);
}
