import { chromium } from "playwright";

const url = process.argv[2] || "http://127.0.0.1:3030";

const checks = [
  ["hasModules", "text=功能模組"],
  ["hasBooking", "text=自助預約與智慧排班"],
  ["hasClient", "text=客戶檔案與表單紀錄"],
  ["hasPos", "text=POS 會員與行銷訊息"],
  ["hasDashboard", "text=多店營運儀表板"],
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
  await page.screenshot({ path: `verification/self-care-platform-${viewport.name}.png`, fullPage: true });
  results.push(result);
  await page.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 2));

if (results.some((result) => result.overlay || result.consoleErrors.length || checks.some(([key]) => result[key] < 1))) {
  process.exit(1);
}
