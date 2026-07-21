import { mkdir, writeFile, copyFile } from "node:fs/promises";
import path from "node:path";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { chromium } from "playwright";

const demoUrl = process.env.DEMO_URL || "https://jvision-fashion-plm.vercel.app";
const outDir = "D:/code/image/說明文件/Jvision 服裝系列開發 PLM 平台";
const logoUrl = "https://www.jvision-ai.com/public/logo.png";
const fontRegular = "C:/Windows/Fonts/kaiu.ttf";
const fontBold = "C:/Windows/Fonts/simsunb.ttf";

const localPosterSvg = path.join(outDir, "jvision-fashion-plm-poster.svg");
const localPosterPng = path.join(outDir, "jvision-fashion-plm-poster.png");
const localPosterPdf = path.join(outDir, "jvision-fashion-plm-poster.pdf");
const localIntroPdf = path.join(outDir, "jvision-fashion-plm-product-introduction.pdf");

await mkdir(outDir, { recursive: true });
await mkdir("public/marketing", { recursive: true });
await mkdir("docs/marketing", { recursive: true });
await mkdir("assets", { recursive: true });

const logoBuffer = Buffer.from(await (await fetch(logoUrl)).arrayBuffer());
const logoDataUrl = `data:image/png;base64,${logoBuffer.toString("base64")}`;
const qrDataUrl = await QRCode.toDataURL(demoUrl, {
  margin: 1,
  width: 380,
  color: { dark: "#101827", light: "#ffffff" },
});
const qrPng = Buffer.from(qrDataUrl.split(",")[1], "base64");

const posterSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1240" height="1754" viewBox="0 0 1240 1754" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1240" height="1754" fill="#F2F8FF"/>
  <rect x="76" y="76" width="1088" height="1602" rx="34" fill="#FFFFFF" stroke="#DFE5EE" stroke-width="2"/>
  <rect x="116" y="116" width="1008" height="330" rx="26" fill="#101827"/>
  <rect x="154" y="154" width="228" height="82" rx="16" fill="#FFFFFF"/>
  <image href="${logoDataUrl}" x="172" y="174" width="192" height="48"/>
  <text x="154" y="302" fill="#9BE15D" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="900">Jvision Fashion PLM</text>
  <text x="154" y="382" fill="#FFFFFF" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="62" font-weight="900">服裝系列開發 PLM 平台</text>
  <text x="116" y="522" fill="#111827" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="39" font-weight="900">系列企劃、款式監控、BOM 物料</text>
  <text x="116" y="578" fill="#111827" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="39" font-weight="900">雲端檔案與 AI 摘要一次整合</text>
  <text x="116" y="636" fill="#667085" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="27">完整 Demo 可新增款式、更新打樣階段、追蹤物料成本並產生上市摘要。</text>
  <rect x="116" y="710" width="1008" height="296" rx="24" fill="#F3F7FB" stroke="#DFE5EE" stroke-width="2"/>
  <rect x="164" y="770" width="270" height="172" rx="18" fill="#FFFFFF"/>
  <rect x="486" y="770" width="270" height="172" rx="18" fill="#FFFFFF"/>
  <rect x="808" y="770" width="270" height="172" rx="18" fill="#FFFFFF"/>
  <text x="200" y="830" fill="#1F5EFF" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="31" font-weight="900">款式開發</text>
  <text x="200" y="884" fill="#111827" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">企劃打樣</text>
  <text x="200" y="924" fill="#111827" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">核准量產</text>
  <text x="522" y="830" fill="#1F5EFF" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="31" font-weight="900">物料成本</text>
  <text x="522" y="884" fill="#111827" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">BOM 追蹤</text>
  <text x="522" y="924" fill="#111827" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">替代料管理</text>
  <text x="844" y="830" fill="#1F5EFF" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="31" font-weight="900">雲端檔案</text>
  <text x="844" y="884" fill="#111827" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">技術包</text>
  <text x="844" y="924" fill="#111827" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">試穿紀錄</text>
  <text x="116" y="1110" fill="#111827" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="45" font-weight="900">掃描 QR Code 立即體驗 Demo</text>
  <text x="116" y="1172" fill="#667085" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">新增款式、更新打樣階段、追蹤 BOM 物料</text>
  <text x="116" y="1214" fill="#667085" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">並生成 Jvision AI 系列上市摘要。</text>
  <text x="116" y="1272" fill="#667085" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="24">${demoUrl}</text>
  <rect x="820" y="1074" width="304" height="304" rx="22" fill="#FFFFFF" stroke="#DFE5EE" stroke-width="2"/>
  <image href="${qrDataUrl}" x="846" y="1100" width="252" height="252"/>
  <text x="864" y="1418" fill="#111827" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="22" font-weight="900">掃描進入 Demo</text>
  <rect x="116" y="1488" width="468" height="6" fill="#1F5EFF"/>
  <text x="116" y="1560" fill="#111827" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="31" font-weight="900">Jvision AI Demo 系列</text>
  <text x="116" y="1616" fill="#667085" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="27">讓設計、商品、版師、採購與生產團隊同步掌握系列開發。</text>
</svg>`;

await writeFile(localPosterSvg, posterSvg, "utf8");

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1240, height: 1754 }, deviceScaleFactor: 1 });
await page.setContent(posterSvg, { waitUntil: "networkidle" });
await page.screenshot({ path: localPosterPng, fullPage: true });
await browser.close();

function createPdf(filePath, render) {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ size: "A4", margin: 48, bufferPages: true });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", async () => {
      await writeFile(filePath, Buffer.concat(chunks));
      resolve();
    });
    doc.registerFont("regular", fontRegular);
    doc.registerFont("bold", fontBold);
    render(doc);
    doc.end();
  });
}

await createPdf(localPosterPdf, (doc) => {
  doc.rect(0, 0, 595, 842).fill("#F2F8FF");
  doc.roundedRect(36, 36, 523, 770, 18).fill("#FFFFFF").stroke("#DFE5EE");
  doc.roundedRect(58, 58, 479, 190, 14).fill("#101827");
  doc.roundedRect(78, 78, 126, 46, 8).fill("#FFFFFF");
  doc.image(logoBuffer, 88, 90, { width: 106 });
  doc.font("regular").fontSize(13).fillColor("#9BE15D").text("Jvision Fashion PLM", 78, 150);
  doc.font("bold").fontSize(27).fillColor("#FFFFFF").text("服裝系列開發 PLM 平台", 78, 178, { width: 420 });
  doc.font("bold").fontSize(18).fillColor("#111827").text("系列企劃、款式監控、BOM 物料、雲端檔案與 AI 摘要一次整合", 58, 292, { width: 470 });
  doc.font("regular").fontSize(11).fillColor("#667085").text("可操作 Demo：新增款式、更新打樣階段、追蹤物料成本、上傳技術包並生成 AI 系列上市摘要。", 58, 342, { width: 470, lineGap: 7 });
  doc.roundedRect(58, 430, 330, 136, 10).fill("#F3F7FB");
  doc.font("bold").fontSize(15).fillColor("#1F5EFF").text("Demo 測試重點", 80, 456);
  doc.font("regular").fontSize(11).fillColor("#667085").text("1. 款式資料新增\n2. 打樣階段追蹤\n3. BOM 物料狀態\n4. AI 上市風險摘要", 80, 488, { width: 270, lineGap: 6 });
  doc.roundedRect(414, 430, 102, 102, 8).stroke("#DFE5EE");
  doc.image(qrPng, 422, 438, { width: 86 });
  doc.font("bold").fontSize(15).fillColor("#111827").text("掃描進入 Demo", 58, 620);
  doc.font("regular").fontSize(10).fillColor("#667085").text(demoUrl, 58, 646, { width: 470 });
});

await createPdf(localIntroPdf, (doc) => {
  doc.image(logoBuffer, 48, 42, { width: 132 });
  doc.font("bold").fontSize(24).fillColor("#111827").text("Jvision 服裝系列開發 PLM 平台", 48, 116);
  doc.font("regular").fontSize(12).fillColor("#667085").text("整合系列企劃、款式監控、BOM 物料、雲端檔案、動態報表與 AI 摘要，協助服裝品牌更快掌握系列開發狀態與上市風險。", 48, 162, { width: 500, lineGap: 7 });
  const rows = [
    ["系列企劃", "建立季別、款式、品類、負責人與上市目標。"],
    ["款式監控", "追蹤企劃、打樣、試穿修正與核准量產階段。"],
    ["BOM 物料", "管理布料、供應商、成本、替代料與詢價狀態。"],
    ["雲端檔案", "保存技術包、試穿紀錄、版型資料與會議文件。"],
    ["AI 摘要", "整理款式風險、物料瓶頸與上市前待處理事項。"],
    ["線上 Demo", demoUrl],
  ];
  let y = 238;
  for (const [title, text] of rows) {
    doc.roundedRect(48, y, 500, 70, 8).stroke("#DFE5EE");
    doc.font("bold").fontSize(15).fillColor("#1F5EFF").text(title, 68, y + 14);
    doc.font("regular").fontSize(11).fillColor("#667085").text(text, 68, y + 42, { width: 455, lineGap: 5 });
    y += 86;
  }
  doc.image(qrPng, 448, 708, { width: 90 });
  doc.font("bold").fontSize(15).fillColor("#111827").text("立即體驗", 48, 724);
  doc.font("regular").fontSize(10).fillColor("#667085").text(demoUrl, 48, 750, { width: 340 });
});

await copyFile(localPosterPng, "public/marketing/jvision-fashion-plm-poster.png");
await copyFile(localIntroPdf, "public/marketing/jvision-fashion-plm-product-introduction.pdf");
await copyFile(localPosterPng, "assets/poster.png");
await copyFile(localPosterPng, "docs/marketing/jvision-fashion-plm-poster.png");
await copyFile(localPosterPdf, "docs/marketing/jvision-fashion-plm-poster.pdf");
await copyFile(localIntroPdf, "docs/marketing/jvision-fashion-plm-product-introduction.pdf");

await writeFile(
  path.join(outDir, "README.txt"),
  `Jvision 服裝系列開發 PLM 平台\n\nDemo URL: ${demoUrl}\n\n檔案：\n- jvision-fashion-plm-poster.png\n- jvision-fashion-plm-poster.svg\n- jvision-fashion-plm-poster.pdf\n- jvision-fashion-plm-product-introduction.pdf\n`,
  "utf8",
);

console.log(`Assets created in ${outDir}`);
