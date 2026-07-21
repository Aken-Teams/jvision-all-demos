import { chromium } from "playwright";

const url = process.argv[2] || "http://127.0.0.1:3031";

const checks = [
  ["hasModules", "text=功能模組"],
  ["hasInbox", "text=共享客服收件箱"],
  ["hasAiKb", "text=AI 回覆與知識庫"],
  ["hasWorkflow", "text=工作流程與主動訊息"],
  ["hasDashboard", "text=客服洞察儀表板"],
];

const browser = await chromium.launch({ headless: true });
const results = [];

for (const viewport of [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "mobile", width: 390, height: 1100 },
]) {
  const page = await browser.newPage({ viewport });
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  await page.goto(url, { waitUntil: "networkidle" });
  const bodyLen = (await page.locator("body").innerText()).length;
  const overlay = await page.locator("text=Unhandled Runtime Error").count();
  const result = { viewport: viewport.name, bodyLen, overlay, consoleErrors };
  for (const [key, selector] of checks) result[key] = await page.locator(selector).count();
  await page.screenshot({ path: `verification/customer-support-platform-${viewport.name}.png`, fullPage: true });
  results.push(result);
  await page.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 2));

if (results.some((result) => result.overlay || result.consoleErrors.length || checks.some(([key]) => result[key] < 1))) {
  process.exit(1);
}
