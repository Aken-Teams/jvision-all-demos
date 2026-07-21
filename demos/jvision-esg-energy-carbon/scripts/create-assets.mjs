import { mkdir, writeFile, copyFile } from "node:fs/promises";
import path from "node:path";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { chromium } from "playwright";

const demoUrl = process.env.DEMO_URL || "https://jvision-esg-energy-carbon.vercel.app";
const outDir = "D:/code/image/說明文件/Jvision ESG 能源與碳管理平台";
const logoUrl = "https://www.jvision-ai.com/public/logo.png";
const fontRegular = "C:/Windows/Fonts/kaiu.ttf";
const fontBold = "C:/Windows/Fonts/simsunb.ttf";

const localPosterSvg = path.join(outDir, "jvision-esg-energy-carbon-poster.svg");
const localPosterPng = path.join(outDir, "jvision-esg-energy-carbon-poster.png");
const localPosterPdf = path.join(outDir, "jvision-esg-energy-carbon-poster.pdf");
const localIntroPdf = path.join(outDir, "jvision-esg-energy-carbon-product-introduction.pdf");

await mkdir(outDir, { recursive: true });
await mkdir("public/marketing", { recursive: true });
await mkdir("docs/marketing", { recursive: true });
await mkdir("assets", { recursive: true });

const logoBuffer = Buffer.from(await (await fetch(logoUrl)).arrayBuffer());
const logoDataUrl = `data:image/png;base64,${logoBuffer.toString("base64")}`;
const qrDataUrl = await QRCode.toDataURL(demoUrl, {
  margin: 1,
  width: 380,
  color: { dark: "#102019", light: "#ffffff" },
});
const qrPng = Buffer.from(qrDataUrl.split(",")[1], "base64");

const posterSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1240" height="1754" viewBox="0 0 1240 1754" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1240" height="1754" fill="#EFFAF2"/>
  <rect x="76" y="76" width="1088" height="1602" rx="34" fill="#FFFFFF" stroke="#DCE8DF" stroke-width="2"/>
  <rect x="116" y="116" width="1008" height="330" rx="26" fill="#102019"/>
  <rect x="154" y="154" width="228" height="82" rx="16" fill="#FFFFFF"/>
  <image href="${logoDataUrl}" x="172" y="174" width="192" height="48"/>
  <text x="154" y="302" fill="#B6E55A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="900">Jvision ESG Energy &amp; Carbon</text>
  <text x="154" y="382" fill="#FFFFFF" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="62" font-weight="900">ESG 能源與碳管理平台</text>
  <text x="116" y="522" fill="#102019" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="39" font-weight="900">能源監控、溫室氣體盤查、減碳任務</text>
  <text x="116" y="578" fill="#102019" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="39" font-weight="900">與 AI 摘要一次完成</text>
  <text x="116" y="636" fill="#66756D" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="27">整合能源監控、碳盤查、節能任務與 AI 摘要，讓改善進度清楚可追蹤。</text>
  <rect x="116" y="710" width="1008" height="296" rx="24" fill="#F3FAF5" stroke="#DCE8DF" stroke-width="2"/>
  <rect x="164" y="770" width="270" height="172" rx="18" fill="#FFFFFF"/>
  <rect x="486" y="770" width="270" height="172" rx="18" fill="#FFFFFF"/>
  <rect x="808" y="770" width="270" height="172" rx="18" fill="#FFFFFF"/>
  <text x="200" y="830" fill="#0D6B45" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="31" font-weight="900">能源監控</text>
  <text x="200" y="884" fill="#102019" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">設備用電</text>
  <text x="200" y="924" fill="#102019" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">異常狀態</text>
  <text x="522" y="830" fill="#0D6B45" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="31" font-weight="900">碳盤查</text>
  <text x="522" y="884" fill="#102019" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">排放分類</text>
  <text x="522" y="924" fill="#102019" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">排放熱點</text>
  <text x="844" y="830" fill="#0D6B45" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="31" font-weight="900">AI 摘要</text>
  <text x="844" y="884" fill="#102019" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">節能任務</text>
  <text x="844" y="924" fill="#102019" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">改善建議</text>
  <text x="116" y="1110" fill="#102019" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="45" font-weight="900">掃描 QR Code 立即體驗 Demo</text>
  <text x="116" y="1172" fill="#66756D" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">新增盤查資料、接入能源設備、建立節能任務</text>
  <text x="116" y="1214" fill="#66756D" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">並生成 AI 摘要。</text>
  <text x="116" y="1272" fill="#66756D" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="24">${demoUrl}</text>
  <rect x="820" y="1074" width="304" height="304" rx="22" fill="#FFFFFF" stroke="#DCE8DF" stroke-width="2"/>
  <image href="${qrDataUrl}" x="846" y="1100" width="252" height="252"/>
  <text x="864" y="1418" fill="#102019" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="22" font-weight="900">掃描進入 Demo</text>
  <rect x="116" y="1488" width="468" height="6" fill="#16A05D"/>
  <text x="116" y="1560" fill="#102019" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="31" font-weight="900">Jvision AI Demo 系列</text>
  <text x="116" y="1616" fill="#66756D" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="27">讓 ESG、廠務、行政與管理團隊用同一個平台追蹤能源與碳排改善。</text>
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
  doc.rect(0, 0, 595, 842).fill("#EFFAF2");
  doc.roundedRect(36, 36, 523, 770, 18).fill("#FFFFFF").stroke("#DCE8DF");
  doc.roundedRect(58, 58, 479, 190, 14).fill("#102019");
  doc.roundedRect(78, 78, 126, 46, 8).fill("#FFFFFF");
  doc.image(logoBuffer, 88, 90, { width: 106 });
  doc.font("regular").fontSize(13).fillColor("#B6E55A").text("Jvision ESG Energy & Carbon", 78, 150);
  doc.font("bold").fontSize(28).fillColor("#FFFFFF").text("ESG 能源與碳管理平台", 78, 178, { width: 420 });
  doc.font("bold").fontSize(18).fillColor("#102019").text("能源監控、溫室氣體盤查、減碳任務與 AI 摘要一次完成", 58, 292, { width: 470 });
  doc.font("regular").fontSize(11).fillColor("#66756D").text("可操作 Demo：新增盤查資料、接入能源設備、切換設備狀態、建立節能任務並生成 AI 摘要。", 58, 342, { width: 470, lineGap: 7 });
  doc.roundedRect(58, 430, 330, 136, 10).fill("#F3FAF5");
  doc.font("bold").fontSize(15).fillColor("#0D6B45").text("Demo 測試重點", 80, 456);
  doc.font("regular").fontSize(11).fillColor("#66756D").text("1. 能源設備監控\n2. 排放分類盤查\n3. 減碳任務追蹤\n4. AI 熱點摘要", 80, 488, { width: 270, lineGap: 6 });
  doc.roundedRect(414, 430, 102, 102, 8).stroke("#DCE8DF");
  doc.image(qrPng, 422, 438, { width: 86 });
  doc.font("bold").fontSize(15).fillColor("#102019").text("掃描進入 Demo", 58, 620);
  doc.font("regular").fontSize(10).fillColor("#66756D").text(demoUrl, 58, 646, { width: 470 });
});

await createPdf(localIntroPdf, (doc) => {
  doc.image(logoBuffer, 48, 42, { width: 132 });
  doc.font("bold").fontSize(24).fillColor("#102019").text("Jvision ESG 能源與碳管理平台", 48, 116);
  doc.font("regular").fontSize(12).fillColor("#66756D").text("整合能源管理系統與組織溫室氣體盤查平台，協助企業把用電數據、活動數據、排放係數、Scope 分類、改善任務與 AI 摘要放在同一個平台。", 48, 162, { width: 500, lineGap: 7 });
  const rows = [
    ["能源監控", "管理電表、設備、場域、即時 kW、本月 kWh 與異常狀態。"],
    ["碳盤查", "管理外購電力、天然氣、運輸與廢棄物等活動數據。"],
    ["減碳任務", "依排放熱點建立任務，追蹤負責單位、預估節能與進度。"],
    ["AI 摘要", "整理最大排放來源、Scope 佔比、用電風險與改善建議。"],
    ["線上 Demo", demoUrl],
  ];
  let y = 238;
  for (const [title, text] of rows) {
    doc.roundedRect(48, y, 500, 78, 8).stroke("#DCE8DF");
    doc.font("bold").fontSize(15).fillColor("#0D6B45").text(title, 68, y + 14);
    doc.font("regular").fontSize(11).fillColor("#66756D").text(text, 68, y + 42, { width: 455, lineGap: 5 });
    y += 98;
  }
  doc.image(qrPng, 448, 708, { width: 90 });
  doc.font("bold").fontSize(15).fillColor("#102019").text("立即體驗", 48, 724);
  doc.font("regular").fontSize(10).fillColor("#66756D").text(demoUrl, 48, 750, { width: 340 });
});

const publicPoster = "public/marketing/jvision-esg-energy-carbon-poster.png";
const publicIntro = "public/marketing/jvision-esg-energy-carbon-product-introduction.pdf";
await copyFile(localPosterPng, publicPoster);
await copyFile(localIntroPdf, publicIntro);
await copyFile(localPosterPng, "assets/poster.png");
await copyFile(localPosterPng, "docs/marketing/jvision-esg-energy-carbon-poster.png");
await copyFile(localPosterPdf, "docs/marketing/jvision-esg-energy-carbon-poster.pdf");
await copyFile(localIntroPdf, "docs/marketing/jvision-esg-energy-carbon-product-introduction.pdf");

await writeFile(
  path.join(outDir, "README.txt"),
  `Jvision ESG 能源與碳管理平台\n\nDemo URL: ${demoUrl}\n\n檔案：\n- jvision-esg-energy-carbon-poster.png\n- jvision-esg-energy-carbon-poster.svg\n- jvision-esg-energy-carbon-poster.pdf\n- jvision-esg-energy-carbon-product-introduction.pdf\n`,
  "utf8",
);

console.log(`Assets created in ${outDir}`);
