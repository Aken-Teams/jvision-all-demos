import { chromium } from "playwright";

const url = process.env.DEMO_URL || process.argv[2] || "http://127.0.0.1:3000";
const forbidden = ["ezGreen", "綠易", "ezGHG", "????", "已改為", "相關字樣"];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
const notFound = [];

page.on("console", (message) => {
  const text = message.text();
  if (message.type() === "error" && !text.startsWith("Failed to load resource:")) {
    errors.push(text);
  }
});

page.on("response", (response) => {
  if (response.status() === 404 && !response.url().includes("/_vercel/insights/script.js")) {
    notFound.push(response.url());
  }
});

await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
await page.getByRole("link", { name: "開啟盤查 Demo" }).click();
await page.getByRole("button", { name: "新增並試算排放量" }).click();
await page.getByRole("button", { name: "生成 AI 查核摘要" }).click();
await page.getByRole("button", { name: "匯出報告" }).click();

const bodyText = await page.locator("body").innerText();
const found = forbidden.filter((term) => bodyText.includes(term));

await page.setViewportSize({ width: 390, height: 900 });
await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
const mobileHeading = await page.getByRole("heading", { name: "Jvision 組織溫室氣體盤查平台" }).isVisible();

await browser.close();

if (errors.length || notFound.length || found.length || !mobileHeading) {
  console.error(JSON.stringify({ errors, notFound, found, mobileHeading }, null, 2));
  process.exit(1);
}

console.log(`Verified ${url}`);
