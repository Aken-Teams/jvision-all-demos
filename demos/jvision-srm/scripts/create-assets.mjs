import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { chromium } from "playwright";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) args.set(process.argv[i], process.argv[i + 1]);

const demoUrl = args.get("--url") || process.env.DEMO_URL || "https://jvision-srm.vercel.app";
const outDir = args.get("--out") || "D:/code/image/說明文件/Jvision採購供應商協作平台";
const logoUrl = "https://www.jvision-ai.com/public/logo.png";
const fontRegular = "C:/Windows/Fonts/kaiu.ttf";
const fontBold = "C:/Windows/Fonts/simsunb.ttf";

await mkdir(outDir, { recursive: true });

const qrDataUrl = await QRCode.toDataURL(demoUrl, {
  margin: 1,
  width: 380,
  color: { dark: "#172033", light: "#ffffff" }
});
const qrPng = Buffer.from(qrDataUrl.split(",")[1], "base64");
const logoResponse = await fetch(logoUrl);
const logoBuffer = Buffer.from(await logoResponse.arrayBuffer());

const posterSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1240" height="1754" viewBox="0 0 1240 1754" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1240" height="1754" fill="#EDF6FF"/>
  <rect x="76" y="76" width="1088" height="1602" rx="30" fill="#FFFFFF" stroke="#DFE6EF" stroke-width="2"/>
  <image href="${logoUrl}" x="116" y="120" width="230" height="72" preserveAspectRatio="xMinYMid meet"/>
  <text x="116" y="286" fill="#2563EB" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30" font-weight="800">Jvision SRM</text>
  <text x="116" y="386" fill="#172033" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="76" font-weight="900">採購供應商</text>
  <text x="116" y="476" fill="#172033" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="76" font-weight="900">協作平台</text>
  <text x="116" y="554" fill="#657187" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">供應商入口、詢報價、電子競標、訂單交期與 AI 採購摘要。</text>
  <rect x="116" y="650" width="1008" height="360" rx="24" fill="#F5F8FC" stroke="#DFE6EF" stroke-width="2"/>
  <rect x="162" y="714" width="256" height="226" rx="18" fill="#FFFFFF"/>
  <rect x="492" y="714" width="256" height="226" rx="18" fill="#FFFFFF"/>
  <rect x="822" y="714" width="256" height="226" rx="18" fill="#FFFFFF"/>
  <text x="198" y="790" fill="#2563EB" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30" font-weight="900">供應商入口</text>
  <text x="198" y="850" fill="#172033" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">資料、文件、報價</text>
  <text x="198" y="895" fill="#172033" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">交期回覆集中處理</text>
  <text x="528" y="790" fill="#2563EB" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30" font-weight="900">採購案件</text>
  <text x="528" y="850" fill="#172033" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">詢價、議價、決標</text>
  <text x="528" y="895" fill="#172033" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">流程狀態可追蹤</text>
  <text x="858" y="790" fill="#2563EB" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30" font-weight="900">AI 採購</text>
  <text x="858" y="850" fill="#172033" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">報價差異、風險</text>
  <text x="858" y="895" fill="#172033" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">今日摘要建議</text>
  <text x="116" y="1124" fill="#172033" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="48" font-weight="900">掃描 QR Code 立即體驗 Demo</text>
  <text x="116" y="1188" fill="#657187" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="28">可新增採購案件、比較報價、追蹤交期風險並生成 AI 摘要。</text>
  <text x="116" y="1252" fill="#657187" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="24">${demoUrl}</text>
  <rect x="820" y="1084" width="304" height="304" rx="22" fill="#FFFFFF" stroke="#DFE6EF" stroke-width="2"/>
  <image href="${qrDataUrl}" x="846" y="1110" width="252" height="252"/>
  <rect x="116" y="1488" width="468" height="6" fill="#2563EB"/>
  <text x="116" y="1560" fill="#172033" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="31" font-weight="900">適合電子採購、供應商入口與 SRM 展示</text>
  <text x="116" y="1616" fill="#657187" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="27">把採購流程從人工追蹤，升級成可稽核的供應商協作網路。</text>
  <text x="116" y="1672" fill="#657187" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="24">Jvision AI | 採購供應商協作平台 Demo</text>
</svg>`;

await writeFile(path.join(outDir, "jvision-srm-poster.svg"), posterSvg, "utf8");
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1240, height: 1754 }, deviceScaleFactor: 1 });
await page.setContent(posterSvg, { waitUntil: "networkidle" });
await page.screenshot({ path: path.join(outDir, "jvision-srm-poster.png"), fullPage: true });
await browser.close();

function createPdf(fileName, render) {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ size: "A4", margin: 48, bufferPages: true });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", async () => {
      await writeFile(path.join(outDir, fileName), Buffer.concat(chunks));
      resolve();
    });
    doc.registerFont("regular", fontRegular);
    doc.registerFont("bold", fontBold);
    render(doc);
    doc.end();
  });
}

await createPdf("jvision-srm-poster.pdf", (doc) => {
  doc.rect(0, 0, 595, 842).fill("#EDF6FF");
  doc.roundedRect(36, 36, 523, 770, 18).fill("#FFFFFF").stroke("#DFE6EF");
  doc.image(logoBuffer, 58, 62, { width: 142 });
  doc.font("regular").fontSize(14).fillColor("#2563EB").text("Jvision SRM", 58, 132);
  doc.font("bold").fontSize(31).fillColor("#172033").text("採購供應商協作平台", 58, 166, { width: 470 });
  doc.font("regular").fontSize(13).fillColor("#657187").text("供應商入口、詢報價、電子競標、訂單交期與 AI 採購摘要。", 58, 228, { width: 470, lineGap: 7 });
  doc.roundedRect(58, 294, 330, 150, 10).fill("#F5F8FC");
  doc.font("bold").fontSize(16).fillColor("#172033").text("Demo 可測試功能", 80, 318);
  doc.font("regular").fontSize(11).fillColor("#657187").text("新增採購案件、推進案件狀態、比較供應商報價、追蹤交期風險，並產生 AI 採購協作摘要。", 80, 352, { width: 270, lineGap: 8 });
  doc.roundedRect(414, 294, 102, 102, 8).stroke("#DFE6EF");
  doc.image(qrPng, 422, 302, { width: 86 });
  doc.font("bold").fontSize(15).fillColor("#172033").text("掃描立即體驗", 58, 496);
  doc.font("regular").fontSize(10).fillColor("#657187").text(demoUrl, 58, 522, { width: 470 });
  doc.font("bold").fontSize(15).fillColor("#172033").text("適合展示場景", 58, 602);
  doc.font("regular").fontSize(11).fillColor("#657187").text("電子採購、供應商入口、詢報價競標、訂單交期、履約驗收、供應商品質與支出分析。", 58, 628, { width: 470, lineGap: 8 });
});

await createPdf("jvision-srm-product-introduction.pdf", (doc) => {
  doc.image(logoBuffer, 48, 42, { width: 132 });
  doc.font("bold").fontSize(24).fillColor("#172033").text("Jvision 採購供應商協作平台產品介紹", 48, 112);
  doc.font("regular").fontSize(12).fillColor("#657187").text("Jvision SRM 協助企業整合供應商資料、採購案件、詢報價競標、訂單交期、履約驗收與 ERP 介接，把外部供應商協作變成可追蹤、可稽核的流程。", 48, 154, { width: 500, lineGap: 7 });
  const sections = [
    ["平台定位", "補足 ERP 在供應商外部協作上的缺口，集中管理採購案件與供應商回覆。"],
    ["核心能力", "供應商生命週期、請購採購、詢報價競標、訂單交期、履約文件與支出分析。"],
    ["AI 應用", "自動整理報價差異、交期風險、供應商回覆狀態與今日採購協作摘要。"],
    ["Demo 功能", "使用者可新增案件、推進流程、比較報價、查看風險排序與發布供應商通知。"],
    ["導入價值", "降低人工追蹤成本，提升採購透明度、供應商回覆效率與履約風險掌握度。"],
    ["Demo 網址", demoUrl]
  ];
  let y = 220;
  for (const [title, text] of sections) {
    doc.roundedRect(48, y, 500, 70, 8).stroke("#DFE6EF");
    doc.font("bold").fontSize(14).fillColor("#2563EB").text(title, 68, y + 13);
    doc.font("regular").fontSize(11).fillColor("#657187").text(text, 68, y + 38, { width: 455, lineGap: 5 });
    y += 86;
  }
  doc.image(qrPng, 448, 710, { width: 90 });
  doc.font("bold").fontSize(15).fillColor("#172033").text("掃描開啟 Demo", 48, 724);
  doc.font("regular").fontSize(10).fillColor("#657187").text(demoUrl, 48, 750, { width: 340 });
});

await writeFile(
  path.join(outDir, "README.txt"),
  `Jvision 採購供應商協作平台行銷素材\n\nDemo URL: ${demoUrl}\n\n檔案清單:\n- jvision-srm-poster.png\n- jvision-srm-poster.svg\n- jvision-srm-poster.pdf\n- jvision-srm-product-introduction.pdf\n`,
  "utf8"
);

console.log(`Assets created in ${outDir}`);
