import { copyFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { chromium } from "playwright";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) args.set(process.argv[i], process.argv[i + 1]);

const demoUrl = args.get("--url") || process.env.DEMO_URL || "https://jvision-equipment-maintenance-suite.vercel.app";
const projectRoot = "D:/code01/projects/jvision-equipment-maintenance-suite";
const projectName = "Jvision設備維護整合平台";
const outDir = args.get("--out") || `D:/code/image/說明文件/${projectName}`;
const assetsDir = path.join(projectRoot, "assets");
const docsDir = path.join(projectRoot, "docs/marketing");
const publicDir = path.join(projectRoot, "public");
const logoUrl = "https://www.jvision-ai.com/public/logo.png";
const fontRegular = "C:/Windows/Fonts/kaiu.ttf";
const fontBold = "C:/Windows/Fonts/simsunb.ttf";

await mkdir(outDir, { recursive: true });
await mkdir(assetsDir, { recursive: true });
await mkdir(docsDir, { recursive: true });
await mkdir(publicDir, { recursive: true });

const qrDataUrl = await QRCode.toDataURL(demoUrl, { margin: 1, width: 380, color: { dark: "#22172a", light: "#ffffff" } });
const qrPng = Buffer.from(qrDataUrl.split(",")[1], "base64");
const logoBuffer = Buffer.from(await (await fetch(logoUrl)).arrayBuffer());

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1240" height="1754" viewBox="0 0 1240 1754" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="1240" height="1754" fill="#FFF8F1"/>
<rect x="70" y="70" width="1100" height="1614" rx="34" fill="#FFFFFF" stroke="#E6DFE8" stroke-width="2"/>
<rect x="70" y="70" width="1100" height="360" rx="34" fill="#22172A"/>
<rect x="112" y="112" width="258" height="92" rx="18" fill="#FFFFFF"/>
<image href="${logoUrl}" x="128" y="132" width="224" height="56" preserveAspectRatio="xMinYMid meet"/>
<text x="120" y="278" fill="#00A09D" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">Jvision Equipment Maintenance Suite</text>
<text x="120" y="362" fill="#FFFFFF" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="64" font-weight="900">設備維護整合平台</text>
<text x="120" y="488" fill="#22172A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="38" font-weight="900">報修、巡檢、保養、備品與 AI 維護摘要一次整合</text>
<text x="120" y="548" fill="#675B70" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="28">整合報修、巡檢、保養、備品與設備績效，讓維護團隊從被動救火走向預防管理。</text>
<rect x="120" y="638" width="1000" height="392" rx="26" fill="#FBF7FB" stroke="#E6DFE8" stroke-width="2"/>
<rect x="166" y="704" width="270" height="230" rx="18" fill="#FFFFFF"/>
<rect x="486" y="704" width="270" height="230" rx="18" fill="#FFFFFF"/>
<rect x="806" y="704" width="270" height="230" rx="18" fill="#FFFFFF"/>
<text x="196" y="775" fill="#875A7B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="31" font-weight="900">維修通報</text>
<text x="196" y="836" fill="#22172A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">現場報修</text>
<text x="196" y="881" fill="#22172A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">狀態追蹤</text>
<text x="516" y="775" fill="#875A7B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="31" font-weight="900">預防保養</text>
<text x="516" y="836" fill="#22172A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">巡檢排程</text>
<text x="516" y="881" fill="#22172A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">備品提醒</text>
<text x="836" y="775" fill="#875A7B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="31" font-weight="900">AI 摘要</text>
<text x="836" y="836" fill="#22172A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">停機風險</text>
<text x="836" y="881" fill="#22172A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">MTBF / MTTR</text>
<text x="120" y="1162" fill="#22172A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="42" font-weight="900">掃描 QR Code 立即體驗 Demo</text>
<text x="120" y="1228" fill="#675B70" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="28">新增維修通報、推進工單、安排保養、查看設備績效。</text>
<text x="120" y="1288" fill="#675B70" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="24">${demoUrl}</text>
<rect x="816" y="1112" width="304" height="304" rx="22" fill="#FFFFFF" stroke="#E6DFE8" stroke-width="2"/>
<image href="${qrDataUrl}" x="842" y="1138" width="252" height="252"/>
<rect x="120" y="1498" width="470" height="6" fill="#00A09D"/>
<text x="120" y="1570" fill="#22172A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="31" font-weight="900">Jvision AI Demo 系列</text>
<text x="120" y="1624" fill="#675B70" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">把設備維護從被動救火，變成可預測、可追蹤的管理流程。</text>
</svg>`;

const posterSvgPath = path.join(outDir, "jvision-equipment-maintenance-suite-poster.svg");
const posterPngPath = path.join(outDir, "jvision-equipment-maintenance-suite-poster.png");
const posterPdfPath = path.join(outDir, "jvision-equipment-maintenance-suite-poster.pdf");
const introPdfPath = path.join(outDir, "jvision-equipment-maintenance-suite-product-introduction.pdf");

await writeFile(posterSvgPath, svg, "utf8");
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1240, height: 1754 }, deviceScaleFactor: 1 });
await page.setContent(svg, { waitUntil: "networkidle" });
await page.screenshot({ path: posterPngPath, fullPage: true });
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

await createPdf(posterPdfPath, (doc) => {
  doc.image(logoBuffer, 48, 42, { width: 130 });
  doc.font("bold").fontSize(26).fillColor("#22172A").text("Jvision 設備維護整合平台", 48, 128);
  doc.font("bold").fontSize(17).text("報修、巡檢、保養、備品與 AI 維護摘要一次整合", 48, 168);
  doc.font("regular").fontSize(12).fillColor("#675B70").text("整合報修、巡檢、保養、備品與設備績效，讓維護團隊從被動救火走向預防管理。", 48, 214, { width: 480, lineGap: 8 });
  doc.roundedRect(48, 310, 500, 160, 12).fill("#FBF7FB");
  doc.font("bold").fontSize(15).fillColor("#875A7B").text("Demo 可測試", 70, 335);
  doc.font("regular").fontSize(11).fillColor("#675B70").text("新增維修通報、推進工單狀態、建立預防保養提醒、查看 MTBF / MTTR，並產生 AI 維護摘要。", 70, 365, { width: 435, lineGap: 7 });
  doc.roundedRect(390, 520, 130, 130, 10).stroke("#E6DFE8");
  doc.image(qrPng, 400, 530, { width: 110 });
  doc.font("bold").fontSize(16).fillColor("#22172A").text("掃描進入 Demo", 48, 540);
  doc.font("regular").fontSize(10).fillColor("#675B70").text(demoUrl, 48, 568, { width: 300 });
});

await createPdf(introPdfPath, (doc) => {
  doc.image(logoBuffer, 48, 42, { width: 120 });
  doc.font("bold").fontSize(24).fillColor("#22172A").text("Jvision 設備維護整合平台", 48, 120);
  doc.font("regular").fontSize(12).fillColor("#675B70").text("整合設備履歷、故障通報、巡檢保養、備品成本、MTBF / MTTR 與 AI 維護摘要，讓團隊用同一個平台處理設備維護日常。", 48, 164, { width: 500, lineGap: 7 });
  const sections = [
    ["維修通報", "現場建立異常工單，主管分派人員並追蹤修復狀態。"],
    ["預防保養", "依健康分數、週期與下次保養日建立提醒。"],
    ["設備績效", "追蹤 MTBF、MTTR、停機時間與完成率。"],
    ["AI 摘要", "整理高風險設備、優先處理項目與下一步建議。"],
  ];
  let y = 235;
  for (const [title, text] of sections) {
    doc.roundedRect(48, y, 500, 78, 8).stroke("#E6DFE8");
    doc.font("bold").fontSize(15).fillColor("#875A7B").text(title, 68, y + 14);
    doc.font("regular").fontSize(11).fillColor("#675B70").text(text, 68, y + 42, { width: 455, lineGap: 5 });
    y += 98;
  }
  doc.image(qrPng, 448, 708, { width: 90 });
  doc.font("bold").fontSize(15).fillColor("#22172A").text("線上 Demo", 48, 724);
  doc.font("regular").fontSize(10).fillColor("#675B70").text(demoUrl, 48, 750, { width: 340 });
});

await writeFile(path.join(outDir, "README.txt"), `Jvision 設備維護整合平台\n\nDemo URL: ${demoUrl}\n\n檔案：\n- jvision-equipment-maintenance-suite-poster.png\n- jvision-equipment-maintenance-suite-poster.svg\n- jvision-equipment-maintenance-suite-poster.pdf\n- jvision-equipment-maintenance-suite-product-introduction.pdf\n`, "utf8");
await copyFile(posterPngPath, path.join(assetsDir, "poster.png"));
for (const dir of [docsDir, publicDir]) {
  await copyFile(posterSvgPath, path.join(dir, "jvision-equipment-maintenance-suite-poster.svg"));
  await copyFile(posterPngPath, path.join(dir, "jvision-equipment-maintenance-suite-poster.png"));
  await copyFile(posterPdfPath, path.join(dir, "jvision-equipment-maintenance-suite-poster.pdf"));
  await copyFile(introPdfPath, path.join(dir, "jvision-equipment-maintenance-suite-product-introduction.pdf"));
}
await copyFile(path.join(outDir, "README.txt"), path.join(docsDir, "README.txt"));

console.log(`Assets created in ${outDir}`);
