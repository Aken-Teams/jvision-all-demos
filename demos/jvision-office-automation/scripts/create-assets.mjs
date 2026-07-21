import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { chromium } from "playwright";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) {
  args.set(process.argv[i], process.argv[i + 1]);
}

const demoUrl = args.get("--url") || process.env.DEMO_URL || "https://jvision-office-automation.vercel.app";
const outDir = args.get("--out") || "D:/code/image/說明文件/Jvision企業協同辦公平台";
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
  <rect width="1240" height="1754" fill="#EEF7FF"/>
  <rect x="76" y="76" width="1088" height="1602" rx="30" fill="#FFFFFF" stroke="#DBE4F0" stroke-width="2"/>
  <image href="${logoUrl}" x="116" y="120" width="230" height="72" preserveAspectRatio="xMinYMid meet"/>
  <text x="116" y="286" fill="#1769FF" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30" font-weight="800">Jvision Office Automation</text>
  <text x="116" y="386" fill="#172033" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="76" font-weight="900">企業協同辦公</text>
  <text x="116" y="476" fill="#172033" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="76" font-weight="900">AI 數位中樞</text>
  <text x="116" y="554" fill="#60708A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">流程簽核、內容門戶、資料中心、服務管理與 AI 助手一次整合。</text>
  <rect x="116" y="650" width="1008" height="360" rx="24" fill="#F4F8FC" stroke="#DBE4F0" stroke-width="2"/>
  <rect x="162" y="714" width="256" height="226" rx="18" fill="#FFFFFF"/>
  <rect x="492" y="714" width="256" height="226" rx="18" fill="#FFFFFF"/>
  <rect x="822" y="714" width="256" height="226" rx="18" fill="#FFFFFF"/>
  <text x="198" y="790" fill="#1769FF" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30" font-weight="900">流程管理</text>
  <text x="198" y="850" fill="#172033" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">簽核、會辦、逾時提醒</text>
  <text x="198" y="895" fill="#172033" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">全流程可追蹤</text>
  <text x="528" y="790" fill="#1769FF" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30" font-weight="900">企業門戶</text>
  <text x="528" y="850" fill="#172033" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">公告、知識、文件搜尋</text>
  <text x="528" y="895" fill="#172033" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">部門入口整合</text>
  <text x="858" y="790" fill="#1769FF" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30" font-weight="900">AI 辦公</text>
  <text x="858" y="850" fill="#172033" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">自動摘要、制度問答</text>
  <text x="858" y="895" fill="#172033" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">事件服務串接</text>
  <text x="116" y="1124" fill="#172033" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="48" font-weight="900">掃描 QR Code 立即體驗 Demo</text>
  <text x="116" y="1188" fill="#60708A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="28">可新增簽核單、推進流程、搜尋企業門戶，並生成 AI 工作摘要。</text>
  <text x="116" y="1252" fill="#60708A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="24">${demoUrl}</text>
  <rect x="820" y="1084" width="304" height="304" rx="22" fill="#FFFFFF" stroke="#DBE4F0" stroke-width="2"/>
  <image href="${qrDataUrl}" x="846" y="1110" width="252" height="252"/>
  <rect x="116" y="1488" width="468" height="6" fill="#1769FF"/>
  <text x="116" y="1560" fill="#172033" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="31" font-weight="900">適合展示企業 OA、低代碼流程與 AI 協作</text>
  <text x="116" y="1616" fill="#60708A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="27">把日常辦公、跨部門協作與管理決策放進同一個可擴充平台。</text>
  <text x="116" y="1672" fill="#60708A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="24">Jvision AI | 企業協同辦公平台 Demo</text>
</svg>`;

await writeFile(path.join(outDir, "jvision-office-automation-poster.svg"), posterSvg, "utf8");

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1240, height: 1754 }, deviceScaleFactor: 1 });
await page.setContent(posterSvg, { waitUntil: "networkidle" });
await page.screenshot({ path: path.join(outDir, "jvision-office-automation-poster.png"), fullPage: true });
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

await createPdf("jvision-office-automation-poster.pdf", (doc) => {
  doc.rect(0, 0, 595, 842).fill("#EEF7FF");
  doc.roundedRect(36, 36, 523, 770, 18).fill("#FFFFFF").stroke("#DBE4F0");
  doc.image(logoBuffer, 58, 62, { width: 142 });
  doc.font("regular").fontSize(14).fillColor("#1769FF").text("Jvision Office Automation", 58, 132);
  doc.font("bold").fontSize(33).fillColor("#172033").text("企業協同辦公 AI 數位中樞", 58, 166, { width: 470 });
  doc.font("regular").fontSize(13).fillColor("#60708A").text("流程簽核、內容門戶、資料中心、服務管理與 AI 助手一次整合。", 58, 228, { width: 470, lineGap: 7 });
  doc.roundedRect(58, 294, 330, 150, 10).fill("#F4F8FC");
  doc.font("bold").fontSize(16).fillColor("#172033").text("Demo 可測試功能", 80, 318);
  doc.font("regular").fontSize(11).fillColor("#60708A").text("新增簽核單、推進流程狀態、搜尋企業門戶內容、查看資料中心指標，並生成 AI 工作摘要。", 80, 352, { width: 270, lineGap: 8 });
  doc.roundedRect(414, 294, 102, 102, 8).stroke("#DBE4F0");
  doc.image(qrPng, 422, 302, { width: 86 });
  doc.font("bold").fontSize(15).fillColor("#172033").text("掃描立即體驗", 58, 496);
  doc.font("regular").fontSize(10).fillColor("#60708A").text(demoUrl, 58, 522, { width: 470 });
  doc.font("bold").fontSize(15).fillColor("#172033").text("適合展示場景", 58, 602);
  doc.font("regular").fontSize(11).fillColor("#60708A").text("企業 OA、低代碼流程、行動簽核、文件門戶、資料管理、AI 辦公與跨系統服務整合。", 58, 628, { width: 470, lineGap: 8 });
});

await createPdf("jvision-office-automation-product-introduction.pdf", (doc) => {
  doc.image(logoBuffer, 48, 42, { width: 132 });
  doc.font("bold").fontSize(24).fillColor("#172033").text("Jvision 企業協同辦公平台產品介紹", 48, 112);
  doc.font("regular").fontSize(12).fillColor("#60708A").text("Jvision 企業協同辦公平台整合流程簽核、內容管理、企業門戶、資料中心與服務管理，並加入 AI 摘要與知識問答能力，協助企業建立可擴充的辦公數位中樞。", 48, 154, { width: 500, lineGap: 7 });

  const sections = [
    ["平台定位", "以企業日常辦公為核心，將請購、合約、人事、資產、公文與會議管理集中在同一入口。"],
    ["核心能力", "流程管理、內容管理、門戶管理、資料管理與服務管理五大模組，可依部門需求快速組合。"],
    ["AI 應用", "可生成今日待辦摘要、整理會議重點、協助搜尋制度文件，並透過服務事件觸發自動化流程。"],
    ["Demo 功能", "使用者可新增簽核單、推進流程、搜尋門戶內容、查看營運指標，完整感受 OA 平台操作。"],
    ["導入價值", "減少紙本與人工追蹤，提升跨部門協作效率，並讓主管以資料化方式掌握流程瓶頸。"],
    ["Demo 網址", demoUrl]
  ];

  let y = 220;
  for (const [title, text] of sections) {
    doc.roundedRect(48, y, 500, 70, 8).stroke("#DBE4F0");
    doc.font("bold").fontSize(14).fillColor("#1769FF").text(title, 68, y + 13);
    doc.font("regular").fontSize(11).fillColor("#60708A").text(text, 68, y + 38, { width: 455, lineGap: 5 });
    y += 86;
  }

  doc.image(qrPng, 448, 710, { width: 90 });
  doc.font("bold").fontSize(15).fillColor("#172033").text("掃描開啟 Demo", 48, 724);
  doc.font("regular").fontSize(10).fillColor("#60708A").text(demoUrl, 48, 750, { width: 340 });
});

await writeFile(
  path.join(outDir, "README.txt"),
  `Jvision 企業協同辦公平台行銷素材\n\nDemo URL: ${demoUrl}\n\n檔案清單:\n- jvision-office-automation-poster.png\n- jvision-office-automation-poster.svg\n- jvision-office-automation-poster.pdf\n- jvision-office-automation-product-introduction.pdf\n`,
  "utf8"
);

console.log(`Assets created in ${outDir}`);
