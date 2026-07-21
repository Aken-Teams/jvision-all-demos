import { chromium } from "playwright";

const url = process.argv[2] || "http://127.0.0.1:3019";

const checks = [
  ["hasSupplier", "text=供應商資料"],
  ["hasIqc", "text=IQC 進料檢驗"],
  ["hasDocuments", "text=文件與綠色資料"],
  ["hasAudit", "text=稽核與改善"],
  ["hasDashboard", "text=管理儀表板"],
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
  for (const [key, selector] of checks) {
    result[key] = await page.locator(selector).count();
  }
  await page.screenshot({ path: `verification/sqm-${viewport.name}.png`, fullPage: true });
  results.push(result);
  await page.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 2));

if (results.some((result) => result.overlay || result.consoleErrors.length || checks.some(([key]) => result[key] < 1))) {
  process.exit(1);
}
