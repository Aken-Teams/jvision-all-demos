import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const url = process.env.DEMO_URL || "http://127.0.0.1:3140";
const outDir = path.join(process.cwd(), "verification");
fs.mkdirSync(outDir, { recursive: true });

const checks = [];
const consoleErrors = [];
const failedResponses = [];

const browser = await chromium.launch();
for (const viewport of [
  { name: "desktop", width: 1440, height: 1800 },
  { name: "mobile", width: 390, height: 1500 },
]) {
  const page = await browser.newPage({ viewport });
  page.on("console", (message) => {
    if (message.type() === "error" && !message.text().includes("Failed to load resource")) {
      consoleErrors.push(message.text());
    }
  });
  page.on("response", (response) => {
    if (response.status() >= 400 && !response.url().includes("/_vercel/insights/")) {
      failedResponses.push(`${response.status()} ${response.url()}`);
    }
  });

  await page.goto(url, { waitUntil: "networkidle" });
  await page.getByRole("link", { name: "操作 Demo" }).first().click();
  await page.getByPlaceholder("客戶名稱").fill("星河影城");
  await page.getByPlaceholder("案件名稱").fill("售票大廳燈箱更新");
  await page.getByPlaceholder("報價金額").fill("168000");
  await page.getByRole("button", { name: "新增案件" }).click();
  await page.getByRole("button", { name: "產生報價提醒" }).click();
  await page.getByRole("button", { name: "上傳檔案" }).click();
  await page.getByRole("button", { name: "生成 AI 摘要" }).click();
  await page.waitForTimeout(500);

  const body = await page.textContent("body");
  checks.push({
    viewport: viewport.name,
    hasTitle: body.includes("Jvision 招牌店務與工單管理平台"),
    hasNewJob: body.includes("售票大廳燈箱更新"),
    hasBoard: body.includes("招牌案件看板"),
    hasFiles: body.includes("設計稿、照片與施工文件"),
    hasAi: body.includes("目前有") && body.includes("建議優先確認"),
    noMojibake: !/[蝞摮撌銝隤鞈嚗�]/.test(body),
    consoleErrors,
    failedResponses,
  });

  await page.screenshot({
    path: path.join(outDir, `sign-shop-${viewport.name}.png`),
    fullPage: true,
  });
  await page.close();
}

await browser.close();

const failed = checks.some((check) =>
  !check.hasTitle ||
  !check.hasNewJob ||
  !check.hasBoard ||
  !check.hasFiles ||
  !check.hasAi ||
  !check.noMojibake ||
  check.consoleErrors.length ||
  check.failedResponses.length,
);

console.log(JSON.stringify(checks, null, 2));
if (failed) process.exit(1);
