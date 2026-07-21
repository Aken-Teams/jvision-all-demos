import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const url = process.env.DEMO_URL || "http://127.0.0.1:3142";
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
  await page.getByPlaceholder("客戶或單位").fill("捷安車隊");
  await page.getByPlaceholder("事故或救援地點").fill("國道三號南下 78K");
  await page.getByPlaceholder("預估費用").fill("4600");
  await page.getByRole("button", { name: "新增任務" }).click();
  await page.getByRole("button", { name: "指派最近車輛" }).click();
  await page.getByRole("button", { name: "更新帳務" }).click();
  await page.getByRole("button", { name: "生成 AI 摘要" }).click();
  await page.waitForTimeout(500);

  const body = await page.textContent("body");
  checks.push({
    viewport: viewport.name,
    hasTitle: body.includes("Jvision 拖吊派遣與車隊管理平台"),
    hasNewCall: body.includes("捷安車隊"),
    hasBoard: body.includes("道路救援任務看板"),
    hasFleet: body.includes("車輛狀態與收款追蹤"),
    hasAi: body.includes("目前有") && body.includes("待帳務處理"),
    noMojibake: !/[蝞摮撌銝隤鞈嚗�]/.test(body),
    consoleErrors,
    failedResponses,
  });

  await page.screenshot({
    path: path.join(outDir, `towing-dispatch-${viewport.name}.png`),
    fullPage: true,
  });
  await page.close();
}

await browser.close();

const failed = checks.some((check) =>
  !check.hasTitle ||
  !check.hasNewCall ||
  !check.hasBoard ||
  !check.hasFleet ||
  !check.hasAi ||
  !check.noMojibake ||
  check.consoleErrors.length ||
  check.failedResponses.length,
);

console.log(JSON.stringify(checks, null, 2));
if (failed) process.exit(1);
