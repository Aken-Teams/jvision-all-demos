#!/usr/bin/env node
/**
 * 把大圖轉成 WebP。
 *
 * 這台機器沒有 ImageMagick、沒有 cwebp、也沒有 sharp，但 Playwright 帶的
 * Chromium 有 WebP 編碼器——把圖畫進 canvas 再 toDataURL("image/webp") 就能轉。
 * 用既有的工具，比為了一次轉檔裝一整套影像處理鏈乾淨。
 *
 *   node tools/optimize-images.mjs <圖檔...> [--width=1600] [--quality=0.82]
 *
 * 只產生 .webp，不動原檔——原檔要留著當不支援 WebP 時的退路。
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const ROOT = path.resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const flag = (k, d) => {
  const hit = args.find((a) => a.startsWith(`--${k}=`));
  return hit ? Number(hit.slice(k.length + 3)) : d;
};
const files = args.filter((a) => !a.startsWith("--"));
if (!files.length) {
  console.error('用法：node tools/optimize-images.mjs <圖檔...> [--width=1600] [--quality=0.82]');
  process.exit(2);
}

const MAX_W = flag("width", 1600);
const Q = flag("quality", 0.82);

const browser = await chromium.launch();
const page = await browser.newPage();
let saved = 0;

for (const rel of files) {
  const src = path.resolve(ROOT, rel);
  if (!fs.existsSync(src)) { console.error(`  ✖ 找不到 ${rel}`); continue; }
  const before = fs.statSync(src).size;
  const b64 = fs.readFileSync(src).toString("base64");
  const mime = /\.png$/i.test(src) ? "image/png" : "image/jpeg";

  const out = await page.evaluate(async ({ b64, mime, maxW, q }) => {
    const img = new Image();
    img.src = `data:${mime};base64,${b64}`;
    await img.decode();
    /* 只縮不放。原圖若已經比目標小，放大只會變糊又變大。 */
    const scale = Math.min(1, maxW / img.naturalWidth);
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);
    const cv = document.createElement("canvas");
    cv.width = w; cv.height = h;
    const ctx = cv.getContext("2d");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, w, h);
    const url = cv.toDataURL("image/webp", q);
    if (!url.startsWith("data:image/webp")) return { ok: false, why: "這個 Chromium 不支援 WebP 編碼" };
    return { ok: true, w, h, ow: img.naturalWidth, oh: img.naturalHeight, data: url.split(",")[1] };
  }, { b64, mime, maxW: MAX_W, q: Q });

  if (!out.ok) { console.error(`  ✖ ${rel}：${out.why}`); continue; }
  const dst = src.replace(/\.(png|jpe?g)$/i, ".webp");
  const buf = Buffer.from(out.data, "base64");
  /* 轉完反而更大就不要——小圖或已經壓過的圖常常這樣，留著只是多一個檔要維護。 */
  if (buf.length >= before) {
    console.log(`  · ${rel} 轉完更大（${(buf.length / 1024).toFixed(0)} KB ≥ ${(before / 1024).toFixed(0)} KB），跳過`);
    continue;
  }
  fs.writeFileSync(dst, buf);
  saved += before - buf.length;
  console.log(`  ✓ ${path.relative(ROOT, dst)}　${out.ow}×${out.oh} → ${out.w}×${out.h}　${(before / 1024).toFixed(0)} KB → ${(buf.length / 1024).toFixed(0)} KB（省 ${((1 - buf.length / before) * 100).toFixed(0)}%）`);
}

await browser.close();
console.log(`\n  合計省下 ${(saved / 1024 / 1024).toFixed(2)} MB`);
