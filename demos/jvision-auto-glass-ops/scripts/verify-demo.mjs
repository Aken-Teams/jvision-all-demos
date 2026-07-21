import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const url = process.env.DEMO_URL || "http://127.0.0.1:3144";
const outDir = path.join(process.cwd(), "verification");
fs.mkdirSync(outDir, { recursive: true });

const checks = [];
const browser = await chromium.launch();
for (const viewport of [
  { name: "desktop", width: 1440, height: 1800 },
  { name: "mobile", width: 390, height: 1500 },
]) {
  const consoleErrors = [];
  const failedResponses = [];
  const page = await browser.newPage({ viewport });
  page.on("console", (message) => {
    if (message.type() === "error" && !message.text().includes("Failed to load resource")) consoleErrors.push(message.text());
  });
  page.on("response", (response) => {
    if (response.status() >= 400 && !response.url().includes("/_vercel/insights/")) failedResponses.push(`${response.status()} ${response.url()}`);
  });

  await page.goto(url, { waitUntil: "networkidle" });
  await page.getByRole("link", { name: "操作 Demo" }).first().click();
  await page.getByPlaceholder("客戶或保險單位").fill("明亮車業");
  await page.getByPlaceholder("車型或 VIN 資訊").fill("BMW X3 2024");
  await page.getByPlaceholder("預估金額").fill("26000");
  await page.getByRole("button", { name: "新增工單" }).click();
  await page.getByRole("button", { name: "送出玻璃訂購" }).click();
  await page.getByRole("button", { name: "更新請款" }).click();
  await page.getByRole("button", { name: "生成 AI 摘要" }).click();
  await page.waitForTimeout(500);

  const body = await page.textContent("body");
  checks.push({
    viewport: viewport.name,
    hasTitle: body.includes("Jvision 汽車玻璃維修與請款管理平台"),
    hasNewJob: body.includes("明亮車業"),
    hasBoard: body.includes("汽車玻璃工單看板"),
    hasParts: body.includes("玻璃訂購與收款追蹤"),
    hasAi: body.includes("目前有") && body.includes("待零件"),
    noMojibake: !/[蝞摮撌銝隤鞈嚗�]/.test(body),
    consoleErrors,
    failedResponses,
  });

  await page.screenshot({ path: path.join(outDir, `auto-glass-${viewport.name}.png`), fullPage: true });
  await page.close();
}

await browser.close();

const failed = checks.some((check) => !check.hasTitle || !check.hasNewJob || !check.hasBoard || !check.hasParts || !check.hasAi || !check.noMojibake || check.consoleErrors.length || check.failedResponses.length);
console.log(JSON.stringify(checks, null, 2));
if (failed) process.exit(1);
