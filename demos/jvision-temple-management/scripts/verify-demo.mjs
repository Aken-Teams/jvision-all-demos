import { chromium } from "playwright";

const url = process.env.DEMO_URL || "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
const errors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text());
});
await page.goto(url, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "新增信眾登記" }).click();
await page.getByRole("button", { name: "開立收據" }).click();
await page.getByRole("button", { name: "產生 LINE 通知" }).click();
await page.waitForSelector("text=已排程傳送");
await page.getByRole("button", { name: "日結入帳" }).click();
await page.waitForSelector("text=會計報表同步更新");
const titleVisible = await page.getByText("把宮廟櫃檯、點燈、法會報名與收據管理放在同一個工作台。").first().isVisible();
const rowVisible = await page.getByText("黃先生").first().isVisible();
await browser.close();
if (!titleVisible || !rowVisible || errors.length) {
  throw new Error(`verify failed: title=${titleVisible} row=${rowVisible} errors=${errors.join("; ")}`);
}
console.log("verify ok");
