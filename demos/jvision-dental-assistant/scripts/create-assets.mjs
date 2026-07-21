import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { chromium } from "playwright";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) args.set(process.argv[i], process.argv[i + 1]);

const demoUrl = args.get("--url") || process.env.DEMO_URL || "https://jvision-dental-assistant.vercel.app";
const outDir = args.get("--out") || "D:/code/image/說明文件/Jvision牙科診所智能助理";
const logoUrl = "https://www.jvision-ai.com/public/logo.png";
const fontRegular = "C:/Windows/Fonts/kaiu.ttf";
const fontBold = "C:/Windows/Fonts/simsunb.ttf";

await mkdir(outDir, { recursive: true });

const qrDataUrl = await QRCode.toDataURL(demoUrl, {
  margin: 1,
  width: 380,
  color: { dark: "#172233", light: "#ffffff" }
});
const qrPng = Buffer.from(qrDataUrl.split(",")[1], "base64");
const logoResponse = await fetch(logoUrl);
const logoBuffer = Buffer.from(await logoResponse.arrayBuffer());

const posterSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1240" height="1754" viewBox="0 0 1240 1754" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1240" height="1754" fill="#EEFBFB"/>
  <rect x="76" y="76" width="1088" height="1602" rx="30" fill="#FFFFFF" stroke="#DCE6F0" stroke-width="2"/>
  <image href="${logoUrl}" x="116" y="120" width="230" height="72" preserveAspectRatio="xMinYMid meet"/>
  <text x="116" y="286" fill="#0FB5A9" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30" font-weight="800">Jvision Dental Assistant</text>
  <text x="116" y="386" fill="#172233" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="76" font-weight="900">牙科診所</text>
  <text x="116" y="476" fill="#172233" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="76" font-weight="900">智能助理</text>
  <text x="116" y="554" fill="#64748B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">線上預約、患者 CRM、提醒通知、術後追蹤與 AI 診所摘要。</text>
  <rect x="116" y="650" width="1008" height="360" rx="24" fill="#F4F9FD" stroke="#DCE6F0" stroke-width="2"/>
  <rect x="162" y="714" width="256" height="226" rx="18" fill="#FFFFFF"/>
  <rect x="492" y="714" width="256" height="226" rx="18" fill="#FFFFFF"/>
  <rect x="822" y="714" width="256" height="226" rx="18" fill="#FFFFFF"/>
  <text x="198" y="790" fill="#0FB5A9" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30" font-weight="900">線上預約</text>
  <text x="198" y="850" fill="#172233" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">患者自選醫師</text>
  <text x="198" y="895" fill="#172233" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">休診也不漏約</text>
  <text x="528" y="790" fill="#0FB5A9" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30" font-weight="900">患者關懷</text>
  <text x="528" y="850" fill="#172233" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">術後、定檢、提醒</text>
  <text x="528" y="895" fill="#172233" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">自動化追蹤</text>
  <text x="858" y="790" fill="#0FB5A9" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30" font-weight="900">AI 摘要</text>
  <text x="858" y="850" fill="#172233" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">今日預約、風險</text>
  <text x="858" y="895" fill="#172233" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">櫃檯待辦整理</text>
  <text x="116" y="1124" fill="#172233" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="48" font-weight="900">掃描 QR Code 立即體驗 Demo</text>
  <text x="116" y="1188" fill="#64748B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="28">可新增約診、調整狀態、發送追蹤提醒並生成 AI 診所摘要。</text>
  <text x="116" y="1252" fill="#64748B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="24">${demoUrl}</text>
  <rect x="820" y="1084" width="304" height="304" rx="22" fill="#FFFFFF" stroke="#DCE6F0" stroke-width="2"/>
  <image href="${qrDataUrl}" x="846" y="1110" width="252" height="252"/>
  <rect x="116" y="1488" width="468" height="6" fill="#0FB5A9"/>
  <text x="116" y="1560" fill="#172233" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="31" font-weight="900">適合牙科預約、患者 CRM 與診所助理展示</text>
  <text x="116" y="1616" fill="#64748B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="27">把櫃檯、醫師與患者互動串成完整照護流程。</text>
  <text x="116" y="1672" fill="#64748B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="24">Jvision AI | 牙科診所智能助理 Demo</text>
</svg>`;

await writeFile(path.join(outDir, "jvision-dental-assistant-poster.svg"), posterSvg, "utf8");
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1240, height: 1754 }, deviceScaleFactor: 1 });
await page.setContent(posterSvg, { waitUntil: "networkidle" });
await page.screenshot({ path: path.join(outDir, "jvision-dental-assistant-poster.png"), fullPage: true });
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

await createPdf("jvision-dental-assistant-poster.pdf", (doc) => {
  doc.rect(0, 0, 595, 842).fill("#EEFBFB");
  doc.roundedRect(36, 36, 523, 770, 18).fill("#FFFFFF").stroke("#DCE6F0");
  doc.image(logoBuffer, 58, 62, { width: 142 });
  doc.font("regular").fontSize(14).fillColor("#0FB5A9").text("Jvision Dental Assistant", 58, 132);
  doc.font("bold").fontSize(31).fillColor("#172233").text("牙科診所智能助理", 58, 166, { width: 470 });
  doc.font("regular").fontSize(13).fillColor("#64748B").text("線上預約、患者 CRM、提醒通知、術後追蹤與 AI 診所摘要。", 58, 228, { width: 470, lineGap: 7 });
  doc.roundedRect(58, 294, 330, 150, 10).fill("#F4F9FD");
  doc.font("bold").fontSize(16).fillColor("#172233").text("Demo 可測試功能", 80, 318);
  doc.font("regular").fontSize(11).fillColor("#64748B").text("新增約診、更新患者狀態、發送術後追蹤提醒、查看爽約風險，並生成 AI 診所營運摘要。", 80, 352, { width: 270, lineGap: 8 });
  doc.roundedRect(414, 294, 102, 102, 8).stroke("#DCE6F0");
  doc.image(qrPng, 422, 302, { width: 86 });
  doc.font("bold").fontSize(15).fillColor("#172233").text("掃描立即體驗", 58, 496);
  doc.font("regular").fontSize(10).fillColor("#64748B").text(demoUrl, 58, 522, { width: 470 });
  doc.font("bold").fontSize(15).fillColor("#172233").text("適合展示場景", 58, 602);
  doc.font("regular").fontSize(11).fillColor("#64748B").text("牙科線上預約、患者 CRM、LINE/簡訊提醒、術後追蹤、定檢通知、診所績效與 AI 櫃檯助理。", 58, 628, { width: 470, lineGap: 8 });
});

await createPdf("jvision-dental-assistant-product-introduction.pdf", (doc) => {
  doc.image(logoBuffer, 48, 42, { width: 132 });
  doc.font("bold").fontSize(24).fillColor("#172233").text("Jvision 牙科診所智能助理產品介紹", 48, 112);
  doc.font("regular").fontSize(12).fillColor("#64748B").text("Jvision 牙科診所智能助理協助診所整合線上預約、患者 CRM、約診提醒、術後追蹤、定檢通知、評價管理與診所績效，讓櫃檯與醫師掌握完整患者互動流程。", 48, 154, { width: 500, lineGap: 7 });
  const sections = [
    ["平台定位", "讓牙科診所把預約、提醒、患者關懷與經營數據集中在同一個工作台。"],
    ["核心能力", "線上預約、患者 CRM、約診提醒、術後追蹤、定檢通知、評價管理與診所績效。"],
    ["AI 應用", "自動整理今日預約、爽約風險、待追蹤患者與櫃檯優先待辦。"],
    ["Demo 功能", "使用者可新增約診、更新患者狀態、發送追蹤訊息、查看風險排序與 AI 摘要。"],
    ["導入價值", "減少櫃檯電話追蹤，提升到診率、回診率與患者互動體驗。"],
    ["Demo 網址", demoUrl]
  ];
  let y = 220;
  for (const [title, text] of sections) {
    doc.roundedRect(48, y, 500, 70, 8).stroke("#DCE6F0");
    doc.font("bold").fontSize(14).fillColor("#0FB5A9").text(title, 68, y + 13);
    doc.font("regular").fontSize(11).fillColor("#64748B").text(text, 68, y + 38, { width: 455, lineGap: 5 });
    y += 86;
  }
  doc.image(qrPng, 448, 710, { width: 90 });
  doc.font("bold").fontSize(15).fillColor("#172233").text("掃描開啟 Demo", 48, 724);
  doc.font("regular").fontSize(10).fillColor("#64748B").text(demoUrl, 48, 750, { width: 340 });
});

await writeFile(
  path.join(outDir, "README.txt"),
  `Jvision 牙科診所智能助理行銷素材\n\nDemo URL: ${demoUrl}\n\n檔案清單:\n- jvision-dental-assistant-poster.png\n- jvision-dental-assistant-poster.svg\n- jvision-dental-assistant-poster.pdf\n- jvision-dental-assistant-product-introduction.pdf\n`,
  "utf8"
);

console.log(`Assets created in ${outDir}`);
