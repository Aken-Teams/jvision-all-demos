import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { createJvisionServer } from "../server.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = path.join(root, "output", "project-expert-ui");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "assets", "demo-screenshots", "manifest.json"), "utf8"));
assert.equal(manifest.count, 464);
assert.equal(manifest.items.length, 464);
for (const item of manifest.items) {
  assert.ok(fs.existsSync(path.join(root, item.thumbnail)), `Missing thumbnail: ${item.repoName}`);
}

fs.mkdirSync(outputDir, { recursive: true });
const server = createJvisionServer();
await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", resolve);
});

const address = server.address();
const origin = `http://127.0.0.1:${address.port}`;
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, locale: "zh-TW", reducedMotion: "reduce" });
const errors = [];
page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
page.on("pageerror", (error) => errors.push(String(error?.message || error)));

try {
  await page.goto(`${origin}/project-expert.html`, { waitUntil: "networkidle" });
  await page.waitForSelector(".agent-review-card");
  assert.equal(await page.locator(".agent-review-card").count(), 24);
  assert.equal(await page.locator(".review-preview").count(), 24);
  assert.equal(await page.locator(".review-preview img").count(), 24);
  const firstPreview = page.locator(".review-preview").first();
  await firstPreview.locator("img").waitFor({ state: "visible" });
  assert.equal(await firstPreview.locator("img").evaluate((image) => image.complete && image.naturalWidth > 0), true);
  assert.match(await firstPreview.getAttribute("href"), /^\/demos\//);
  await firstPreview.scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(outputDir, "desktop.png"), fullPage: false });

  await page.setViewportSize({ width: 390, height: 844 });
  await firstPreview.scrollIntoViewIfNeeded();
  const mobile = await page.evaluate(() => {
    const preview = document.querySelector(".review-preview");
    const rect = preview?.getBoundingClientRect();
    return {
      overflow: Math.max(0, document.documentElement.scrollWidth - innerWidth),
      previewWidth: rect?.width || 0,
      previewHeight: rect?.height || 0,
    };
  });
  assert.ok(mobile.overflow <= 2, `Mobile overflow: ${mobile.overflow}px`);
  assert.ok(mobile.previewWidth > 290 && mobile.previewHeight > 190, `Mobile preview is not readable: ${mobile.previewWidth}×${mobile.previewHeight}`);
  await page.screenshot({ path: path.join(outputDir, "mobile.png"), fullPage: false });
  assert.deepEqual(errors, []);

  console.log(JSON.stringify({ thumbnails: manifest.count, desktopCards: 24, mobileOverflow: mobile.overflow, browserErrors: errors.length }, null, 2));
} finally {
  await page.close();
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
