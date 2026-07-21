import { chromium } from "playwright";

const url = process.env.DEMO_URL || process.argv[2] || "http://127.0.0.1:3000";
const forbidden = ["Odoo", "Odoo Maintenance", "????", "undefined"];

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
await page.getByRole("link", { name: "開啟功能 Demo" }).click();
await page.getByRole("button", { name: "新增維修請求" }).click();
await page.getByRole("button", { name: "生成 AI 維護摘要" }).click();
await page.getByRole("button", { name: "建立預防保養提醒" }).click();
await page.getByText("目前有").first().waitFor({ timeout: 10000 });

const bodyText = await page.locator("body").innerText();
const found = forbidden.filter((term) => bodyText.includes(term));

await page.setViewportSize({ width: 390, height: 900 });
await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
const mobileHeading = await page.getByRole("heading", { name: "Jvision 智慧設備維護與預防保養平台" }).isVisible();

await browser.close();

if (errors.length || notFound.length || found.length || !mobileHeading) {
  console.error(JSON.stringify({ errors, notFound, found, mobileHeading }, null, 2));
  process.exit(1);
}

console.log(`Verified ${url}`);
