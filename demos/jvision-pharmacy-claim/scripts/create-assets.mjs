import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { chromium } from "playwright";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) args.set(process.argv[i], process.argv[i + 1]);

const demoUrl = args.get("--url") || process.env.DEMO_URL || "https://jvision-pharmacy-claim.vercel.app";
const outDir = args.get("--out") || "D:/code/image/說明文件/Jvision藥局健保調劑申報系統";
const logoUrl = "https://www.jvision-ai.com/public/logo.png";
const fontRegular = "C:/Windows/Fonts/kaiu.ttf";
const fontBold = "C:/Windows/Fonts/simsunb.ttf";

await mkdir(outDir, { recursive: true });

const qrDataUrl = await QRCode.toDataURL(demoUrl, {
  margin: 1,
  width: 380,
  color: { dark: "#182332", light: "#ffffff" }
});
const qrPng = Buffer.from(qrDataUrl.split(",")[1], "base64");
const logoResponse = await fetch(logoUrl);
const logoBuffer = Buffer.from(await logoResponse.arrayBuffer());

const posterSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1240" height="1754" viewBox="0 0 1240 1754" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1240" height="1754" fill="#EEF7FF"/>
  <rect x="76" y="76" width="1088" height="1602" rx="30" fill="#FFFFFF" stroke="#DFE8EF" stroke-width="2"/>
  <image href="${logoUrl}" x="116" y="120" width="230" height="72" preserveAspectRatio="xMinYMid meet"/>
  <text x="116" y="286" fill="#2878FF" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30" font-weight="800">Jvision Pharmacy Claim</text>
  <text x="116" y="386" fill="#182332" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="76" font-weight="900">藥局健保</text>
  <text x="116" y="476" fill="#182332" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="76" font-weight="900">調劑申報系統</text>
  <text x="116" y="554" fill="#65758A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">處方調劑、申報檢核、費用試算、藥袋列印與 AI 申報摘要。</text>
  <rect x="116" y="650" width="1008" height="360" rx="24" fill="#F4F8FB" stroke="#DFE8EF" stroke-width="2"/>
  <rect x="162" y="714" width="256" height="226" rx="18" fill="#FFFFFF"/>
  <rect x="492" y="714" width="256" height="226" rx="18" fill="#FFFFFF"/>
  <rect x="822" y="714" width="256" height="226" rx="18" fill="#FFFFFF"/>
  <text x="198" y="790" fill="#2878FF" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30" font-weight="900">處方調劑</text>
  <text x="198" y="850" fill="#182332" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">快速建立處方</text>
  <text x="198" y="895" fill="#182332" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">常用處方複製</text>
  <text x="528" y="790" fill="#2878FF" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30" font-weight="900">申報檢核</text>
  <text x="528" y="850" fill="#182332" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">錯誤表、費用</text>
  <text x="528" y="895" fill="#182332" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">部分負擔檢查</text>
  <text x="858" y="790" fill="#2878FF" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30" font-weight="900">列印報表</text>
  <text x="858" y="850" fill="#182332" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">藥袋、明細、收據</text>
  <text x="858" y="895" fill="#182332" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">歷史申報查詢</text>
  <text x="116" y="1124" fill="#182332" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="48" font-weight="900">掃描 QR Code 立即體驗 Demo</text>
  <text x="116" y="1188" fill="#65758A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="28">可新增處方、試算費用、檢查錯誤並產生 AI 申報摘要。</text>
  <text x="116" y="1252" fill="#65758A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="24">${demoUrl}</text>
  <rect x="820" y="1084" width="304" height="304" rx="22" fill="#FFFFFF" stroke="#DFE8EF" stroke-width="2"/>
  <image href="${qrDataUrl}" x="846" y="1110" width="252" height="252"/>
  <rect x="116" y="1488" width="468" height="6" fill="#2878FF"/>
  <text x="116" y="1560" fill="#182332" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="31" font-weight="900">適合藥局健保申報與調劑管理展示</text>
  <text x="116" y="1616" fill="#65758A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="27">把月底申報壓力，改成每天可檢查、可修正的工作流程。</text>
  <text x="116" y="1672" fill="#65758A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="24">Jvision AI | 藥局健保調劑申報 Demo</text>
</svg>`;

await writeFile(path.join(outDir, "jvision-pharmacy-claim-poster.svg"), posterSvg, "utf8");
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1240, height: 1754 }, deviceScaleFactor: 1 });
await page.setContent(posterSvg, { waitUntil: "networkidle" });
await page.screenshot({ path: path.join(outDir, "jvision-pharmacy-claim-poster.png"), fullPage: true });
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

await createPdf("jvision-pharmacy-claim-poster.pdf", (doc) => {
  doc.rect(0, 0, 595, 842).fill("#EEF7FF");
  doc.roundedRect(36, 36, 523, 770, 18).fill("#FFFFFF").stroke("#DFE8EF");
  doc.image(logoBuffer, 58, 62, { width: 142 });
  doc.font("regular").fontSize(14).fillColor("#2878FF").text("Jvision Pharmacy Claim", 58, 132);
  doc.font("bold").fontSize(30).fillColor("#182332").text("藥局健保調劑申報系統", 58, 166, { width: 470 });
  doc.font("regular").fontSize(13).fillColor("#65758A").text("處方調劑、申報檢核、費用試算、藥袋列印與 AI 申報摘要。", 58, 228, { width: 470, lineGap: 7 });
  doc.roundedRect(58, 294, 330, 150, 10).fill("#F4F8FB");
  doc.font("bold").fontSize(16).fillColor("#182332").text("Demo 可測試功能", 80, 318);
  doc.font("regular").fontSize(11).fillColor("#65758A").text("新增處方、藥品選擇、費用試算、申報錯誤檢查、狀態更新、藥袋與收據列印。", 80, 352, { width: 270, lineGap: 8 });
  doc.roundedRect(414, 294, 102, 102, 8).stroke("#DFE8EF");
  doc.image(qrPng, 422, 302, { width: 86 });
  doc.font("bold").fontSize(15).fillColor("#182332").text("掃描立即體驗", 58, 496);
  doc.font("regular").fontSize(10).fillColor("#65758A").text(demoUrl, 58, 522, { width: 470 });
  doc.font("bold").fontSize(15).fillColor("#182332").text("適合展示場景", 58, 602);
  doc.font("regular").fontSize(11).fillColor("#65758A").text("藥局調劑、健保申報、藥價更新、錯誤檢核、部分負擔、藥袋列印與歷史申報查詢。", 58, 628, { width: 470, lineGap: 8 });
});

await createPdf("jvision-pharmacy-claim-product-introduction.pdf", (doc) => {
  doc.image(logoBuffer, 48, 42, { width: 132 });
  doc.font("bold").fontSize(24).fillColor("#182332").text("Jvision 藥局健保調劑申報系統產品介紹", 48, 112);
  doc.font("regular").fontSize(12).fillColor("#65758A").text("Jvision 藥局健保調劑申報系統整合處方建立、健保用藥資料、藥價更新、申報檢核、藥袋列印、費用試算與歷史申報查詢，協助藥局降低申報錯誤與重複作業。", 48, 154, { width: 500, lineGap: 7 });
  const sections = [
    ["平台定位", "協助藥局把處方調劑、費用試算與健保申報檢核集中在同一個工作台。"],
    ["核心能力", "健保用藥資料庫、藥價更新、處方複製、錯誤表、藥袋收據列印與歷史查詢。"],
    ["AI 應用", "自動整理今日待修正處方、申報錯誤、異常費用與優先處理項目。"],
    ["Demo 功能", "使用者可新增處方、試算費用、標記可申報、送出申報、列印藥袋與產生 AI 摘要。"],
    ["導入價值", "降低月底補資料壓力，讓申報錯誤提早發現、提早修正。"],
    ["Demo 網址", demoUrl]
  ];
  let y = 220;
  for (const [title, text] of sections) {
    doc.roundedRect(48, y, 500, 70, 8).stroke("#DFE8EF");
    doc.font("bold").fontSize(14).fillColor("#2878FF").text(title, 68, y + 13);
    doc.font("regular").fontSize(11).fillColor("#65758A").text(text, 68, y + 38, { width: 455, lineGap: 5 });
    y += 86;
  }
  doc.image(qrPng, 448, 710, { width: 90 });
  doc.font("bold").fontSize(15).fillColor("#182332").text("掃描開啟 Demo", 48, 724);
  doc.font("regular").fontSize(10).fillColor("#65758A").text(demoUrl, 48, 750, { width: 340 });
});

await writeFile(
  path.join(outDir, "README.txt"),
  `Jvision 藥局健保調劑申報系統行銷素材\n\nDemo URL: ${demoUrl}\n\n檔案清單:\n- jvision-pharmacy-claim-poster.png\n- jvision-pharmacy-claim-poster.svg\n- jvision-pharmacy-claim-poster.pdf\n- jvision-pharmacy-claim-product-introduction.pdf\n`,
  "utf8"
);

console.log(`Assets created in ${outDir}`);
