import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { chromium } from "playwright";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) args.set(process.argv[i], process.argv[i + 1]);

const demoUrl = args.get("--url") || process.env.DEMO_URL || "https://jvision-inventory.vercel.app";
const outDir = args.get("--out") || "D:/code/image/說明文件/Jvision智慧庫存與倉儲管理平台";
const logoUrl = "https://www.jvision-ai.com/public/logo.png";
const fontRegular = "C:/Windows/Fonts/kaiu.ttf";
const fontBold = "C:/Windows/Fonts/simsunb.ttf";

await mkdir(outDir, { recursive: true });

const qrDataUrl = await QRCode.toDataURL(demoUrl, {
  margin: 1,
  width: 380,
  color: { dark: "#22172a", light: "#ffffff" }
});
const qrPng = Buffer.from(qrDataUrl.split(",")[1], "base64");
const logoResponse = await fetch(logoUrl);
const logoBuffer = Buffer.from(await logoResponse.arrayBuffer());

const posterSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1240" height="1754" viewBox="0 0 1240 1754" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1240" height="1754" fill="#FFF8F1"/>
  <rect x="70" y="70" width="1100" height="1614" rx="34" fill="#FFFFFF" stroke="#E6DFE8" stroke-width="2"/>
  <rect x="70" y="70" width="1100" height="360" rx="34" fill="#22172A"/>
  <rect x="112" y="112" width="258" height="92" rx="18" fill="#FFFFFF"/>
  <image href="${logoUrl}" x="128" y="132" width="224" height="56" preserveAspectRatio="xMinYMid meet"/>
  <text x="120" y="278" fill="#00A09D" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">Jvision Inventory</text>
  <text x="120" y="362" fill="#FFFFFF" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="70" font-weight="900">智慧庫存與倉儲管理平台</text>
  <text x="120" y="488" fill="#22172A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="38" font-weight="900">讓補貨、收貨、揀貨、盤點與 AI 摘要一次完成</text>
  <text x="120" y="548" fill="#675B70" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="28">完整 Demo 可直接新增品項、掃碼入出庫、產生補貨建議與庫存行動摘要。</text>

  <rect x="120" y="638" width="1000" height="392" rx="26" fill="#FBF7FB" stroke="#E6DFE8" stroke-width="2"/>
  <rect x="166" y="704" width="270" height="230" rx="18" fill="#FFFFFF"/>
  <rect x="486" y="704" width="270" height="230" rx="18" fill="#FFFFFF"/>
  <rect x="806" y="704" width="270" height="230" rx="18" fill="#FFFFFF"/>
  <text x="196" y="775" fill="#875A7B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="31" font-weight="900">智慧補貨</text>
  <text x="196" y="836" fill="#22172A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">依安全庫存與交期</text>
  <text x="196" y="881" fill="#22172A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">自動列出採購建議</text>
  <text x="516" y="775" fill="#875A7B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="31" font-weight="900">條碼作業</text>
  <text x="516" y="836" fill="#22172A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">模擬掃碼入庫出庫</text>
  <text x="516" y="881" fill="#22172A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">同步庫存與異動紀錄</text>
  <text x="836" y="775" fill="#875A7B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="31" font-weight="900">AI 摘要</text>
  <text x="836" y="836" fill="#22172A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">整理低庫存、補貨</text>
  <text x="836" y="881" fill="#22172A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">與今日優先行動</text>

  <text x="120" y="1162" fill="#22172A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="42" font-weight="900">掃描 QR Code 體驗 Demo</text>
  <text x="120" y="1228" fill="#675B70" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="28">適合零售、維修、電商與製造團隊展示庫存流程。</text>
  <text x="120" y="1288" fill="#675B70" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="24">${demoUrl}</text>
  <rect x="816" y="1112" width="304" height="304" rx="22" fill="#FFFFFF" stroke="#E6DFE8" stroke-width="2"/>
  <image href="${qrDataUrl}" x="842" y="1138" width="252" height="252"/>

  <rect x="120" y="1498" width="470" height="6" fill="#00A09D"/>
  <text x="120" y="1570" fill="#22172A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="31" font-weight="900">Jvision AI Demo 系列</text>
  <text x="120" y="1624" fill="#675B70" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">把倉儲資料變成每天都能採取行動的營運看板。</text>
</svg>`;

await writeFile(path.join(outDir, "jvision-inventory-poster.svg"), posterSvg, "utf8");
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1240, height: 1754 }, deviceScaleFactor: 1 });
await page.setContent(posterSvg, { waitUntil: "networkidle" });
await page.screenshot({ path: path.join(outDir, "jvision-inventory-poster.png"), fullPage: true });
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

await createPdf("jvision-inventory-poster.pdf", (doc) => {
  doc.rect(0, 0, 595, 842).fill("#FFF8F1");
  doc.roundedRect(36, 36, 523, 770, 18).fill("#FFFFFF").stroke("#E6DFE8");
  doc.roundedRect(36, 36, 523, 184, 18).fill("#22172A");
  doc.roundedRect(52, 58, 162, 56, 9).fill("#FFFFFF");
  doc.image(logoBuffer, 62, 72, { width: 138 });
  doc.font("regular").fontSize(14).fillColor("#00A09D").text("Jvision Inventory", 58, 132);
  doc.font("bold").fontSize(29).fillColor("#FFFFFF").text("智慧庫存與倉儲管理平台", 58, 164, { width: 470 });
  doc.font("bold").fontSize(18).fillColor("#22172A").text("從補貨、收貨、揀貨到 AI 摘要，一套 Demo 完整展示。", 58, 260, { width: 470 });
  doc.font("regular").fontSize(12).fillColor("#675B70").text("可直接新增庫存品項、模擬條碼入出庫、查看補貨建議，並產生主管可讀的庫存行動摘要。", 58, 302, { width: 470, lineGap: 7 });
  doc.roundedRect(58, 386, 330, 130, 10).fill("#FBF7FB");
  doc.font("bold").fontSize(15).fillColor("#875A7B").text("Demo 功能", 80, 410);
  doc.font("regular").fontSize(11).fillColor("#675B70").text("新增品項、掃碼異動、補貨清單、庫存表格、揀貨波次、AI 摘要與 RWD 響應式介面。", 80, 440, { width: 270, lineGap: 8 });
  doc.roundedRect(414, 386, 102, 102, 8).stroke("#E6DFE8");
  doc.image(qrPng, 422, 394, { width: 86 });
  doc.font("bold").fontSize(15).fillColor("#22172A").text("掃描立即體驗", 58, 578);
  doc.font("regular").fontSize(10).fillColor("#675B70").text(demoUrl, 58, 604, { width: 470 });
  doc.font("regular").fontSize(10).fillColor("#675B70").text("Jvision AI Demo 系列 | 智慧庫存與倉儲管理", 58, 756);
});

await createPdf("jvision-inventory-product-introduction.pdf", (doc) => {
  doc.image(logoBuffer, 48, 42, { width: 132 });
  doc.font("bold").fontSize(24).fillColor("#22172A").text("Jvision 智慧庫存與倉儲管理平台", 48, 112);
  doc.font("regular").fontSize(12).fillColor("#675B70").text("Jvision Inventory 是一套示範用的庫存與倉儲管理 Demo，聚焦補貨、入出庫、條碼作業、揀貨波次、批號追蹤與 AI 行動摘要。使用者可在網頁上直接操作流程，而不是只閱讀產品介紹。", 48, 154, { width: 500, lineGap: 7 });
  const sections = [
    ["核心價值", "把分散的庫存資料集中成即時看板，降低缺貨、過量庫存與人工溝通成本。"],
    ["主要功能", "商品主檔、掃碼入出庫、即時庫存表、低庫存補貨、揀貨波次與庫存異動紀錄。"],
    ["AI 應用", "自動整理今日庫存風險、建議補貨品項與倉管優先行動，讓主管快速掌握重點。"],
    ["適用場景", "零售、維修、電商、製造、多門市、寄倉與需要追蹤批號或效期的營運團隊。"],
    ["Demo 特色", "網頁可互動測試，支援桌機與手機 RWD，並附行銷海報與 QR Code。"],
    ["正式網址", demoUrl]
  ];
  let y = 230;
  for (const [title, text] of sections) {
    doc.roundedRect(48, y, 500, 70, 8).stroke("#E6DFE8");
    doc.font("bold").fontSize(14).fillColor("#875A7B").text(title, 68, y + 13);
    doc.font("regular").fontSize(11).fillColor("#675B70").text(text, 68, y + 38, { width: 455, lineGap: 5 });
    y += 86;
  }
  doc.image(qrPng, 448, 710, { width: 90 });
  doc.font("bold").fontSize(15).fillColor("#22172A").text("掃描前往 Demo", 48, 724);
  doc.font("regular").fontSize(10).fillColor("#675B70").text(demoUrl, 48, 750, { width: 340 });
});

await writeFile(
  path.join(outDir, "README.txt"),
  `Jvision 智慧庫存與倉儲管理平台\n\nDemo URL: ${demoUrl}\n\n檔案清單:\n- jvision-inventory-poster.png\n- jvision-inventory-poster.svg\n- jvision-inventory-poster.pdf\n- jvision-inventory-product-introduction.pdf\n`,
  "utf8"
);

console.log(`Assets created in ${outDir}`);
