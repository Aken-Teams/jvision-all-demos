import { mkdir, writeFile, copyFile } from "node:fs/promises";
import path from "node:path";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { chromium } from "playwright";

const demoUrl = process.env.DEMO_URL || "https://jvision-interior-design-studio.vercel.app";
const outDir = "D:/code/image/說明文件/Jvision 室內設計專案管理平台";
const logoUrl = "https://www.jvision-ai.com/public/logo.png";
const fontRegular = "C:/Windows/Fonts/kaiu.ttf";
const fontBold = "C:/Windows/Fonts/simsunb.ttf";

const localPosterSvg = path.join(outDir, "jvision-interior-design-studio-poster.svg");
const localPosterPng = path.join(outDir, "jvision-interior-design-studio-poster.png");
const localPosterPdf = path.join(outDir, "jvision-interior-design-studio-poster.pdf");
const localIntroPdf = path.join(outDir, "jvision-interior-design-studio-product-introduction.pdf");

await mkdir(outDir, { recursive: true });
await mkdir("public/marketing", { recursive: true });
await mkdir("docs/marketing", { recursive: true });
await mkdir("assets", { recursive: true });

const logoBuffer = Buffer.from(await (await fetch(logoUrl)).arrayBuffer());
const logoDataUrl = `data:image/png;base64,${logoBuffer.toString("base64")}`;
const qrDataUrl = await QRCode.toDataURL(demoUrl, {
  margin: 1,
  width: 380,
  color: { dark: "#172033", light: "#ffffff" },
});
const qrPng = Buffer.from(qrDataUrl.split(",")[1], "base64");

const posterSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1240" height="1754" viewBox="0 0 1240 1754" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1240" height="1754" fill="#FFF7EF"/>
  <rect x="76" y="76" width="1088" height="1602" rx="34" fill="#FFFFFF" stroke="#E3DFD7" stroke-width="2"/>
  <rect x="116" y="116" width="1008" height="330" rx="26" fill="#172033"/>
  <rect x="154" y="154" width="228" height="82" rx="16" fill="#FFFFFF"/>
  <image href="${logoDataUrl}" x="172" y="174" width="192" height="48"/>
  <text x="154" y="302" fill="#F0C28A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="900">Jvision Interior Design Studio</text>
  <text x="154" y="382" fill="#FFFFFF" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="62" font-weight="900">室內設計專案管理平台</text>
  <text x="116" y="522" fill="#1F2430" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="39" font-weight="900">提案、選品、採購、客戶溝通</text>
  <text x="116" y="578" fill="#1F2430" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="39" font-weight="900">與 AI 摘要一次整合</text>
  <text x="116" y="636" fill="#687083" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="27">完整 Demo 可新增提案、核准選品、建立採購並同步客戶儀表板。</text>
  <rect x="116" y="710" width="1008" height="296" rx="24" fill="#F7F5F1" stroke="#E3DFD7" stroke-width="2"/>
  <rect x="164" y="770" width="270" height="172" rx="18" fill="#FFFFFF"/>
  <rect x="486" y="770" width="270" height="172" rx="18" fill="#FFFFFF"/>
  <rect x="808" y="770" width="270" height="172" rx="18" fill="#FFFFFF"/>
  <text x="200" y="830" fill="#B66B4D" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="31" font-weight="900">設計提案</text>
  <text x="200" y="884" fill="#1F2430" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">預算版本</text>
  <text x="200" y="924" fill="#1F2430" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">客戶核准</text>
  <text x="522" y="830" fill="#B66B4D" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="31" font-weight="900">選品板</text>
  <text x="522" y="884" fill="#1F2430" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">家具燈具</text>
  <text x="522" y="924" fill="#1F2430" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">留言確認</text>
  <text x="844" y="830" fill="#B66B4D" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="31" font-weight="900">採購追蹤</text>
  <text x="844" y="884" fill="#1F2430" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">供應商</text>
  <text x="844" y="924" fill="#1F2430" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">到貨狀態</text>
  <text x="116" y="1110" fill="#1F2430" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="45" font-weight="900">掃描 QR Code 立即體驗 Demo</text>
  <text x="116" y="1172" fill="#687083" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">新增提案、核准選品、建立採購、更新到貨</text>
  <text x="116" y="1214" fill="#687083" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">並生成 Jvision AI 專案摘要。</text>
  <text x="116" y="1272" fill="#687083" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="24">${demoUrl}</text>
  <rect x="820" y="1074" width="304" height="304" rx="22" fill="#FFFFFF" stroke="#E3DFD7" stroke-width="2"/>
  <image href="${qrDataUrl}" x="846" y="1100" width="252" height="252"/>
  <text x="864" y="1418" fill="#1F2430" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="22" font-weight="900">掃描進入 Demo</text>
  <rect x="116" y="1488" width="468" height="6" fill="#E87854"/>
  <text x="116" y="1560" fill="#1F2430" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="31" font-weight="900">Jvision AI Demo 系列</text>
  <text x="116" y="1616" fill="#687083" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="27">讓設計師、採購、財務與客戶用同一個平台追蹤專案。</text>
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
  doc.rect(0, 0, 595, 842).fill("#FFF7EF");
  doc.roundedRect(36, 36, 523, 770, 18).fill("#FFFFFF").stroke("#E3DFD7");
  doc.roundedRect(58, 58, 479, 190, 14).fill("#172033");
  doc.roundedRect(78, 78, 126, 46, 8).fill("#FFFFFF");
  doc.image(logoBuffer, 88, 90, { width: 106 });
  doc.font("regular").fontSize(13).fillColor("#F0C28A").text("Jvision Interior Design Studio", 78, 150);
  doc.font("bold").fontSize(27).fillColor("#FFFFFF").text("室內設計專案管理平台", 78, 178, { width: 420 });
  doc.font("bold").fontSize(18).fillColor("#1F2430").text("提案、選品、採購、客戶溝通與 AI 摘要一次整合", 58, 292, { width: 470 });
  doc.font("regular").fontSize(11).fillColor("#687083").text("可操作 Demo：新增提案、核准選品、建立採購、更新到貨狀態並生成 AI 專案摘要。", 58, 342, { width: 470, lineGap: 7 });
  doc.roundedRect(58, 430, 330, 136, 10).fill("#F7F5F1");
  doc.font("bold").fontSize(15).fillColor("#B66B4D").text("Demo 測試重點", 80, 456);
  doc.font("regular").fontSize(11).fillColor("#687083").text("1. 設計提案管理\n2. 選品板核准\n3. 採購與到貨追蹤\n4. AI 專案摘要", 80, 488, { width: 270, lineGap: 6 });
  doc.roundedRect(414, 430, 102, 102, 8).stroke("#E3DFD7");
  doc.image(qrPng, 422, 438, { width: 86 });
  doc.font("bold").fontSize(15).fillColor("#1F2430").text("掃描進入 Demo", 58, 620);
  doc.font("regular").fontSize(10).fillColor("#687083").text(demoUrl, 58, 646, { width: 470 });
});

await createPdf(localIntroPdf, (doc) => {
  doc.image(logoBuffer, 48, 42, { width: 132 });
  doc.font("bold").fontSize(24).fillColor("#1F2430").text("Jvision 室內設計專案管理平台", 48, 116);
  doc.font("regular").fontSize(12).fillColor("#687083").text("整合設計提案、選品板、商品資料庫、採購追蹤、客戶儀表板與 AI 摘要，讓室內設計團隊從初步概念到交付都用同一份資料協作。", 48, 162, { width: 500, lineGap: 7 });
  const rows = [
    ["設計提案", "建立客戶、空間、預算與提案狀態。"],
    ["選品板", "依空間管理家具、燈具、材質、供應商與客戶核准。"],
    ["採購追蹤", "把已核准選品轉成採購清單並追蹤到貨狀態。"],
    ["客戶儀表板", "集中留言、提案、選品與採購更新。"],
    ["AI 摘要", "整理待處理項目、採購風險與下一步建議。"],
    ["線上 Demo", demoUrl],
  ];
  let y = 238;
  for (const [title, text] of rows) {
    doc.roundedRect(48, y, 500, 70, 8).stroke("#E3DFD7");
    doc.font("bold").fontSize(15).fillColor("#B66B4D").text(title, 68, y + 14);
    doc.font("regular").fontSize(11).fillColor("#687083").text(text, 68, y + 42, { width: 455, lineGap: 5 });
    y += 86;
  }
  doc.image(qrPng, 448, 708, { width: 90 });
  doc.font("bold").fontSize(15).fillColor("#1F2430").text("立即體驗", 48, 724);
  doc.font("regular").fontSize(10).fillColor("#687083").text(demoUrl, 48, 750, { width: 340 });
});

await copyFile(localPosterPng, "public/marketing/jvision-interior-design-studio-poster.png");
await copyFile(localIntroPdf, "public/marketing/jvision-interior-design-studio-product-introduction.pdf");
await copyFile(localPosterPng, "assets/poster.png");
await copyFile(localPosterPng, "docs/marketing/jvision-interior-design-studio-poster.png");
await copyFile(localPosterPdf, "docs/marketing/jvision-interior-design-studio-poster.pdf");
await copyFile(localIntroPdf, "docs/marketing/jvision-interior-design-studio-product-introduction.pdf");

await writeFile(
  path.join(outDir, "README.txt"),
  `Jvision 室內設計專案管理平台\n\nDemo URL: ${demoUrl}\n\n檔案：\n- jvision-interior-design-studio-poster.png\n- jvision-interior-design-studio-poster.svg\n- jvision-interior-design-studio-poster.pdf\n- jvision-interior-design-studio-product-introduction.pdf\n`,
  "utf8",
);

console.log(`Assets created in ${outDir}`);
