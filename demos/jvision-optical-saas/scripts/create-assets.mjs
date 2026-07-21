import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { chromium } from "playwright";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) args.set(process.argv[i], process.argv[i + 1]);

const demoUrl = args.get("--url") || process.env.DEMO_URL || "https://jvision-optical-saas.vercel.app";
const outDir = args.get("--out") || "D:/code/image/說明文件/Jvision眼鏡門市預約會員經營平台";
const logoUrl = "https://www.jvision-ai.com/public/logo.png";
const fontRegular = "C:/Windows/Fonts/kaiu.ttf";
const fontBold = "C:/Windows/Fonts/simsunb.ttf";

await mkdir(outDir, { recursive: true });

const qrDataUrl = await QRCode.toDataURL(demoUrl, {
  margin: 1,
  width: 380,
  color: { dark: "#101728", light: "#ffffff" }
});
const qrPng = Buffer.from(qrDataUrl.split(",")[1], "base64");
const logoResponse = await fetch(logoUrl);
const logoBuffer = Buffer.from(await logoResponse.arrayBuffer());

const posterSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1240" height="1754" viewBox="0 0 1240 1754" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1240" height="1754" fill="#EEF5FF"/>
  <rect x="76" y="76" width="1088" height="1602" rx="30" fill="#FFFFFF" stroke="#DFE6F1" stroke-width="2"/>
  <image href="${logoUrl}" x="116" y="120" width="230" height="72" preserveAspectRatio="xMinYMid meet"/>
  <text x="116" y="286" fill="#3268FF" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30" font-weight="800">Jvision Optical CRM</text>
  <text x="116" y="386" fill="#101728" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="76" font-weight="900">眼鏡門市</text>
  <text x="116" y="476" fill="#101728" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="76" font-weight="900">預約會員經營</text>
  <text x="116" y="554" fill="#657188" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">24H 預約、會員 CRM、驗光處方、LINE 推播與 AI 門市摘要。</text>
  <rect x="116" y="650" width="1008" height="360" rx="24" fill="#F5F8FC" stroke="#DFE6F1" stroke-width="2"/>
  <rect x="162" y="714" width="256" height="226" rx="18" fill="#FFFFFF"/>
  <rect x="492" y="714" width="256" height="226" rx="18" fill="#FFFFFF"/>
  <rect x="822" y="714" width="256" height="226" rx="18" fill="#FFFFFF"/>
  <text x="198" y="790" fill="#3268FF" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30" font-weight="900">雲端預約</text>
  <text x="198" y="850" fill="#101728" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">官網與 LINE 預約</text>
  <text x="198" y="895" fill="#101728" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">驗光師排班同步</text>
  <text x="528" y="790" fill="#3268FF" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30" font-weight="900">會員 CRM</text>
  <text x="528" y="850" fill="#101728" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">度數、處方、偏好</text>
  <text x="528" y="895" fill="#101728" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">回訪週期追蹤</text>
  <text x="858" y="790" fill="#3268FF" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30" font-weight="900">LINE 經營</text>
  <text x="858" y="850" fill="#101728" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">精準推播、好評</text>
  <text x="858" y="895" fill="#101728" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">商城自動對帳</text>
  <text x="116" y="1124" fill="#101728" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="48" font-weight="900">掃描 QR Code 立即體驗 Demo</text>
  <text x="116" y="1188" fill="#657188" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="28">可新增預約、追蹤回訪、發送 LINE 訊息並生成 AI 摘要。</text>
  <text x="116" y="1252" fill="#657188" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="24">${demoUrl}</text>
  <rect x="820" y="1084" width="304" height="304" rx="22" fill="#FFFFFF" stroke="#DFE6F1" stroke-width="2"/>
  <image href="${qrDataUrl}" x="846" y="1110" width="252" height="252"/>
  <rect x="116" y="1488" width="468" height="6" fill="#3268FF"/>
  <text x="116" y="1560" fill="#101728" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="31" font-weight="900">適合眼鏡行預約、會員 CRM 與 LINE 經營展示</text>
  <text x="116" y="1616" fill="#657188" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="27">讓眼鏡門市不只完成交易，也留下下一次回店的理由。</text>
  <text x="116" y="1672" fill="#657188" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="24">Jvision AI | 眼鏡門市預約會員經營 Demo</text>
</svg>`;

await writeFile(path.join(outDir, "jvision-optical-saas-poster.svg"), posterSvg, "utf8");
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1240, height: 1754 }, deviceScaleFactor: 1 });
await page.setContent(posterSvg, { waitUntil: "networkidle" });
await page.screenshot({ path: path.join(outDir, "jvision-optical-saas-poster.png"), fullPage: true });
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

await createPdf("jvision-optical-saas-poster.pdf", (doc) => {
  doc.rect(0, 0, 595, 842).fill("#EEF5FF");
  doc.roundedRect(36, 36, 523, 770, 18).fill("#FFFFFF").stroke("#DFE6F1");
  doc.image(logoBuffer, 58, 62, { width: 142 });
  doc.font("regular").fontSize(14).fillColor("#3268FF").text("Jvision Optical CRM", 58, 132);
  doc.font("bold").fontSize(30).fillColor("#101728").text("眼鏡門市預約會員經營平台", 58, 166, { width: 470 });
  doc.font("regular").fontSize(13).fillColor("#657188").text("24H 預約、會員 CRM、驗光處方、LINE 推播與 AI 門市摘要。", 58, 228, { width: 470, lineGap: 7 });
  doc.roundedRect(58, 294, 330, 150, 10).fill("#F5F8FC");
  doc.font("bold").fontSize(16).fillColor("#101728").text("Demo 可測試功能", 80, 318);
  doc.font("regular").fontSize(11).fillColor("#657188").text("新增驗光預約、更新服務狀態、發送 LINE 回訪訊息、查看流失風險，並生成 AI 門市摘要。", 80, 352, { width: 270, lineGap: 8 });
  doc.roundedRect(414, 294, 102, 102, 8).stroke("#DFE6F1");
  doc.image(qrPng, 422, 302, { width: 86 });
  doc.font("bold").fontSize(15).fillColor("#101728").text("掃描立即體驗", 58, 496);
  doc.font("regular").fontSize(10).fillColor("#657188").text(demoUrl, 58, 522, { width: 470 });
  doc.font("bold").fontSize(15).fillColor("#101728").text("適合展示場景", 58, 602);
  doc.font("regular").fontSize(11).fillColor("#657188").text("眼鏡店預約管理、會員 CRM、驗光工單、LINE 行銷、回訪追蹤、好評邀請與商城對帳。", 58, 628, { width: 470, lineGap: 8 });
});

await createPdf("jvision-optical-saas-product-introduction.pdf", (doc) => {
  doc.image(logoBuffer, 48, 42, { width: 132 });
  doc.font("bold").fontSize(24).fillColor("#101728").text("Jvision 眼鏡門市預約會員經營平台產品介紹", 48, 112);
  doc.font("regular").fontSize(12).fillColor("#657188").text("Jvision 眼鏡門市預約會員經營平台協助眼鏡行整合 24H 預約、會員 CRM、驗光處方、回訪追蹤、LINE 推播、好評邀請與隱形眼鏡商城，讓門市服務與顧客關係更容易延續。", 48, 154, { width: 500, lineGap: 7 });
  const sections = [
    ["平台定位", "把眼鏡門市的預約、會員、驗光工單、回訪與 LINE 經營整合在同一個工作台。"],
    ["核心能力", "24H 預約、會員 CRM、回訪追蹤、LINE 推播、品牌官網、驗光工單與商城對帳。"],
    ["AI 應用", "自動整理今日預約、流失風險、回訪名單、訊息建議與業績機會。"],
    ["Demo 功能", "使用者可新增預約、更新狀態、發送 LINE 訊息、查看風險排序與 AI 摘要。"],
    ["導入價值", "降低電話預約負擔，提升回訪率、好評數與會員回購機會。"],
    ["Demo 網址", demoUrl]
  ];
  let y = 220;
  for (const [title, text] of sections) {
    doc.roundedRect(48, y, 500, 70, 8).stroke("#DFE6F1");
    doc.font("bold").fontSize(14).fillColor("#3268FF").text(title, 68, y + 13);
    doc.font("regular").fontSize(11).fillColor("#657188").text(text, 68, y + 38, { width: 455, lineGap: 5 });
    y += 86;
  }
  doc.image(qrPng, 448, 710, { width: 90 });
  doc.font("bold").fontSize(15).fillColor("#101728").text("掃描開啟 Demo", 48, 724);
  doc.font("regular").fontSize(10).fillColor("#657188").text(demoUrl, 48, 750, { width: 340 });
});

await writeFile(
  path.join(outDir, "README.txt"),
  `Jvision 眼鏡門市預約會員經營平台行銷素材\n\nDemo URL: ${demoUrl}\n\n檔案清單:\n- jvision-optical-saas-poster.png\n- jvision-optical-saas-poster.svg\n- jvision-optical-saas-poster.pdf\n- jvision-optical-saas-product-introduction.pdf\n`,
  "utf8"
);

console.log(`Assets created in ${outDir}`);
