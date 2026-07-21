import { chromium } from "playwright";

const url = process.argv[2] || "http://127.0.0.1:3026";

const checks = [
  ["hasModules", "text=功能模組"],
  ["hasPlate", "text=車牌辨識進出"],
  ["hasSpace", "text=車位狀態與電動車位管制"],
  ["hasEvent", "text=尋車與安全事件"],
  ["hasDashboard", "text=營運儀表板"],
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
  await page.screenshot({ path: `verification/smart-parking-${viewport.name}.png`, fullPage: true });
  results.push(result);
  await page.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 2));

if (results.some((result) => result.overlay || result.consoleErrors.length || checks.some(([key]) => result[key] < 1))) {
  process.exit(1);
}
