import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { chromium } from "playwright";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) args.set(process.argv[i], process.argv[i + 1]);

const demoUrl = args.get("--url") || process.env.DEMO_URL || "https://jvision-maintenance.vercel.app";
const outDir = args.get("--out") || "D:/code/image/說明文件/Jvision智慧設備維護與預防保養平台";
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
  <text x="120" y="278" fill="#00A09D" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">Jvision Maintenance</text>
  <text x="120" y="362" fill="#FFFFFF" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="68" font-weight="900">智慧設備維護與預防保養平台</text>
  <text x="120" y="488" fill="#22172A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="38" font-weight="900">讓故障通報、維修派工、保養排程與 AI 摘要一次完成</text>
  <text x="120" y="548" fill="#675B70" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="28">完整 Demo 可直接新增工單、移動看板、安排保養與查看設備績效。</text>

  <rect x="120" y="638" width="1000" height="392" rx="26" fill="#FBF7FB" stroke="#E6DFE8" stroke-width="2"/>
  <rect x="166" y="704" width="270" height="230" rx="18" fill="#FFFFFF"/>
  <rect x="486" y="704" width="270" height="230" rx="18" fill="#FFFFFF"/>
  <rect x="806" y="704" width="270" height="230" rx="18" fill="#FFFFFF"/>
  <text x="196" y="775" fill="#875A7B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="31" font-weight="900">預防保養</text>
  <text x="196" y="836" fill="#22172A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">依設備健康與週期</text>
  <text x="196" y="881" fill="#22172A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">自動建立提醒</text>
  <text x="516" y="775" fill="#875A7B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="31" font-weight="900">維修看板</text>
  <text x="516" y="836" fill="#22172A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">追蹤待派工、處理中</text>
  <text x="516" y="881" fill="#22172A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">待驗收與已完成</text>
  <text x="836" y="775" fill="#875A7B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="31" font-weight="900">AI 摘要</text>
  <text x="836" y="836" fill="#22172A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">整理停機風險</text>
  <text x="836" y="881" fill="#22172A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">與今日優先行動</text>

  <text x="120" y="1162" fill="#22172A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="42" font-weight="900">掃描 QR Code 體驗 Demo</text>
  <text x="120" y="1228" fill="#675B70" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="28">適合工廠、物流、門市與維修團隊展示設備管理流程。</text>
  <text x="120" y="1288" fill="#675B70" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="24">${demoUrl}</text>
  <rect x="816" y="1112" width="304" height="304" rx="22" fill="#FFFFFF" stroke="#E6DFE8" stroke-width="2"/>
  <image href="${qrDataUrl}" x="842" y="1138" width="252" height="252"/>

  <rect x="120" y="1498" width="470" height="6" fill="#00A09D"/>
  <text x="120" y="1570" fill="#22172A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="31" font-weight="900">Jvision AI Demo 系列</text>
  <text x="120" y="1624" fill="#675B70" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">把設備維護變成可預測、可追蹤、可改善的管理流程。</text>
</svg>`;

await writeFile(path.join(outDir, "jvision-maintenance-poster.svg"), posterSvg, "utf8");
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1240, height: 1754 }, deviceScaleFactor: 1 });
await page.setContent(posterSvg, { waitUntil: "networkidle" });
await page.screenshot({ path: path.join(outDir, "jvision-maintenance-poster.png"), fullPage: true });
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

await createPdf("jvision-maintenance-poster.pdf", (doc) => {
  doc.rect(0, 0, 595, 842).fill("#FFF8F1");
  doc.roundedRect(36, 36, 523, 770, 18).fill("#FFFFFF").stroke("#E6DFE8");
  doc.roundedRect(36, 36, 523, 184, 18).fill("#22172A");
  doc.roundedRect(52, 58, 162, 56, 9).fill("#FFFFFF");
  doc.image(logoBuffer, 62, 72, { width: 138 });
  doc.font("regular").fontSize(14).fillColor("#00A09D").text("Jvision Maintenance", 58, 132);
  doc.font("bold").fontSize(27).fillColor("#FFFFFF").text("智慧設備維護與預防保養平台", 58, 164, { width: 470 });
  doc.font("bold").fontSize(18).fillColor("#22172A").text("從故障通報、維修派工到 AI 摘要，一套 Demo 完整展示。", 58, 260, { width: 470 });
  doc.font("regular").fontSize(12).fillColor("#675B70").text("可直接新增維修請求、流轉工單狀態、安排預防保養，並產生主管可讀的維護行動摘要。", 58, 302, { width: 470, lineGap: 7 });
  doc.roundedRect(58, 386, 330, 130, 10).fill("#FBF7FB");
  doc.font("bold").fontSize(15).fillColor("#875A7B").text("Demo 功能", 80, 410);
  doc.font("regular").fontSize(11).fillColor("#675B70").text("設備履歷、異常通報、維修看板、預防保養、MTBF / MTTR、停機統計與 AI 摘要。", 80, 440, { width: 270, lineGap: 8 });
  doc.roundedRect(414, 386, 102, 102, 8).stroke("#E6DFE8");
  doc.image(qrPng, 422, 394, { width: 86 });
  doc.font("bold").fontSize(15).fillColor("#22172A").text("掃描立即體驗", 58, 578);
  doc.font("regular").fontSize(10).fillColor("#675B70").text(demoUrl, 58, 604, { width: 470 });
  doc.font("regular").fontSize(10).fillColor("#675B70").text("Jvision AI Demo 系列 | 智慧設備維護與預防保養", 58, 756);
});

await createPdf("jvision-maintenance-product-introduction.pdf", (doc) => {
  doc.image(logoBuffer, 48, 42, { width: 132 });
  doc.font("bold").fontSize(24).fillColor("#22172A").text("Jvision 智慧設備維護與預防保養平台", 48, 112);
  doc.font("regular").fontSize(12).fillColor("#675B70").text("Jvision Maintenance 是一套示範用的設備維護管理 Demo，聚焦設備履歷、維修請求、預防保養、看板派工、日曆排程、MTBF / MTTR 指標與 AI 行動摘要。使用者可在網頁上直接操作流程，而不是只閱讀產品介紹。", 48, 154, { width: 500, lineGap: 7 });
  const sections = [
    ["核心價值", "把被動救火的維修模式，轉成可預測、可排程、可追蹤的設備管理流程。"],
    ["主要功能", "設備異常通報、維修看板、預防保養提醒、設備健康分數、停機統計與保養日曆。"],
    ["AI 應用", "自動整理高風險設備、逾期工單、停機影響與今日優先處理清單。"],
    ["適用場景", "製造產線、物流設備、醫療設備、門市設備、公用設備與維修服務團隊。"],
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
  `Jvision 智慧設備維護與預防保養平台\n\nDemo URL: ${demoUrl}\n\n檔案清單:\n- jvision-maintenance-poster.png\n- jvision-maintenance-poster.svg\n- jvision-maintenance-poster.pdf\n- jvision-maintenance-product-introduction.pdf\n`,
  "utf8"
);

console.log(`Assets created in ${outDir}`);
