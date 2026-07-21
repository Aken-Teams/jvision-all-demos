import { chromium } from "playwright";

const url = process.env.DEMO_URL || process.argv[2] || "http://127.0.0.1:3000";
const forbidden = ["Dent&Co", "DENT&CO", "doctor.dentco", "????", "已改為", "相關字樣"];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
const notFound = [];

page.on("console", (message) => {
  const text = message.text();
  if (message.type() === "error" && !text.startsWith("Failed to load resource:")) errors.push(text);
});

page.on("response", (response) => {
  if (response.status() === 404 && !response.url().includes("/_vercel/insights/script.js")) notFound.push(response.url());
});

await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
await page.getByRole("link", { name: "開啟診所 Demo" }).click();
await page.getByRole("button", { name: "新增約診" }).click();
await page.getByText("更新下一狀態").first().click();
await page.getByRole("button", { name: "生成 AI 診所摘要" }).click();
await page.getByRole("button", { name: "批次發送追蹤提醒" }).click();

const bodyText = await page.locator("body").innerText();
const found = forbidden.filter((term) => bodyText.includes(term));

await page.setViewportSize({ width: 390, height: 900 });
await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
const mobileHeading = await page.getByRole("heading", { name: "Jvision 牙科診所智能助理" }).isVisible();

await browser.close();

if (errors.length || notFound.length || found.length || !mobileHeading) {
  console.error(JSON.stringify({ errors, notFound, found, mobileHeading }, null, 2));
  process.exit(1);
}

console.log(`Verified ${url}`);
