import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { chromium } from "playwright";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) {
  args.set(process.argv[i], process.argv[i + 1]);
}

const demoUrl = args.get("--url") || process.env.DEMO_URL || "https://jvision-carbon-inventory.vercel.app";
const outDir = args.get("--out") || "D:/code/image/說明文件/Jvision組織溫室氣體盤查平台";
const logoUrl = "https://www.jvision-ai.com/public/logo.png";
const fontRegular = "C:/Windows/Fonts/kaiu.ttf";
const fontBold = "C:/Windows/Fonts/simsunb.ttf";

await mkdir(outDir, { recursive: true });

const qrDataUrl = await QRCode.toDataURL(demoUrl, {
  margin: 1,
  width: 380,
  color: { dark: "#102019", light: "#ffffff" }
});
const qrPng = Buffer.from(qrDataUrl.split(",")[1], "base64");
const logoResponse = await fetch(logoUrl);
const logoBuffer = Buffer.from(await logoResponse.arrayBuffer());

const posterSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1240" height="1754" viewBox="0 0 1240 1754" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1240" height="1754" fill="#EFFAF2"/>
  <rect x="76" y="76" width="1088" height="1602" rx="30" fill="#FFFFFF" stroke="#DCE8DF" stroke-width="2"/>
  <image href="${logoUrl}" x="116" y="120" width="230" height="72" preserveAspectRatio="xMinYMid meet"/>
  <text x="116" y="286" fill="#0D6B45" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30" font-weight="800">Jvision Carbon Inventory</text>
  <text x="116" y="386" fill="#102019" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="76" font-weight="900">組織溫室氣體</text>
  <text x="116" y="476" fill="#102019" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="76" font-weight="900">盤查平台</text>
  <text x="116" y="554" fill="#66756D" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">活動數據、排放係數、清冊報告、熱點分析與 AI 查核一次整合。</text>
  <rect x="116" y="650" width="1008" height="360" rx="24" fill="#F3FAF5" stroke="#DCE8DF" stroke-width="2"/>
  <rect x="162" y="714" width="256" height="226" rx="18" fill="#FFFFFF"/>
  <rect x="492" y="714" width="256" height="226" rx="18" fill="#FFFFFF"/>
  <rect x="822" y="714" width="256" height="226" rx="18" fill="#FFFFFF"/>
  <text x="198" y="790" fill="#0D6B45" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30" font-weight="900">盤查資料</text>
  <text x="198" y="850" fill="#102019" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">場域、活動數據</text>
  <text x="198" y="895" fill="#102019" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">責任分工追蹤</text>
  <text x="528" y="790" fill="#0D6B45" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30" font-weight="900">排放清冊</text>
  <text x="528" y="850" fill="#102019" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">Scope 1/2/3</text>
  <text x="528" y="895" fill="#102019" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">自動彙總報告</text>
  <text x="858" y="790" fill="#0D6B45" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30" font-weight="900">AI 查核</text>
  <text x="858" y="850" fill="#102019" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">異常提醒、熱點</text>
  <text x="858" y="895" fill="#102019" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">減量優先建議</text>
  <text x="116" y="1124" fill="#102019" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="48" font-weight="900">掃描 QR Code 立即體驗 Demo</text>
  <text x="116" y="1188" fill="#66756D" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="28">可新增活動數據、計算 tCO2e、查看熱點並產生 AI 查核摘要。</text>
  <text x="116" y="1252" fill="#66756D" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="24">${demoUrl}</text>
  <rect x="820" y="1084" width="304" height="304" rx="22" fill="#FFFFFF" stroke="#DCE8DF" stroke-width="2"/>
  <image href="${qrDataUrl}" x="846" y="1110" width="252" height="252"/>
  <rect x="116" y="1488" width="468" height="6" fill="#16A05D"/>
  <text x="116" y="1560" fill="#102019" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="31" font-weight="900">適合 ESG、ISO 盤查與企業碳管理展示</text>
  <text x="116" y="1616" fill="#66756D" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="27">把碳盤查從人工表格整理，升級成可查證的管理決策系統。</text>
  <text x="116" y="1672" fill="#66756D" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="24">Jvision AI | 組織溫室氣體盤查 Demo</text>
</svg>`;

await writeFile(path.join(outDir, "jvision-carbon-inventory-poster.svg"), posterSvg, "utf8");

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1240, height: 1754 }, deviceScaleFactor: 1 });
await page.setContent(posterSvg, { waitUntil: "networkidle" });
await page.screenshot({ path: path.join(outDir, "jvision-carbon-inventory-poster.png"), fullPage: true });
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

await createPdf("jvision-carbon-inventory-poster.pdf", (doc) => {
  doc.rect(0, 0, 595, 842).fill("#EFFAF2");
  doc.roundedRect(36, 36, 523, 770, 18).fill("#FFFFFF").stroke("#DCE8DF");
  doc.image(logoBuffer, 58, 62, { width: 142 });
  doc.font("regular").fontSize(14).fillColor("#0D6B45").text("Jvision Carbon Inventory", 58, 132);
  doc.font("bold").fontSize(31).fillColor("#102019").text("組織溫室氣體盤查平台", 58, 166, { width: 470 });
  doc.font("regular").fontSize(13).fillColor("#66756D").text("活動數據、排放係數、清冊報告、熱點分析與 AI 查核一次整合。", 58, 228, { width: 470, lineGap: 7 });
  doc.roundedRect(58, 294, 330, 150, 10).fill("#F3FAF5");
  doc.font("bold").fontSize(16).fillColor("#102019").text("Demo 可測試功能", 80, 318);
  doc.font("regular").fontSize(11).fillColor("#66756D").text("新增活動數據、即時計算 tCO2e、查看 Scope 1/2/3 清冊、熱點分析，並產生 AI 查核摘要。", 80, 352, { width: 270, lineGap: 8 });
  doc.roundedRect(414, 294, 102, 102, 8).stroke("#DCE8DF");
  doc.image(qrPng, 422, 302, { width: 86 });
  doc.font("bold").fontSize(15).fillColor("#102019").text("掃描立即體驗", 58, 496);
  doc.font("regular").fontSize(10).fillColor("#66756D").text(demoUrl, 58, 522, { width: 470 });
  doc.font("bold").fontSize(15).fillColor("#102019").text("適合展示場景", 58, 602);
  doc.font("regular").fontSize(11).fillColor("#66756D").text("企業碳管理、ISO 盤查、ESG 揭露、查證準備、排放熱點分析與減量策略規劃。", 58, 628, { width: 470, lineGap: 8 });
});

await createPdf("jvision-carbon-inventory-product-introduction.pdf", (doc) => {
  doc.image(logoBuffer, 48, 42, { width: 132 });
  doc.font("bold").fontSize(24).fillColor("#102019").text("Jvision 組織溫室氣體盤查平台產品介紹", 48, 112);
  doc.font("regular").fontSize(12).fillColor("#66756D").text("Jvision 組織溫室氣體盤查平台協助企業整合活動數據、排放係數、Scope 分類、排放清冊、報告輸出與熱點分析，將年度盤查轉化為可延續的碳管理基礎。", 48, 154, { width: 500, lineGap: 7 });

  const sections = [
    ["平台定位", "協助企業把分散的營運資料轉換為可追溯、可查證、可決策的碳排放管理資料。"],
    ["核心能力", "盤查邊界、活動數據、係數版本、排放試算、清冊彙總、報告輸出與查核軌跡。"],
    ["標準支援", "以 ISO 14064-1 與 GHG Protocol 概念設計，可依揭露需求檢視不同分類。"],
    ["AI 應用", "自動辨識高排放熱點、缺值、異常用量與係數版本風險，產生查核摘要。"],
    ["Demo 功能", "使用者可新增活動數據、即時計算 tCO2e、查看 Scope 統計、匯出報告與生成 AI 摘要。"],
    ["Demo 網址", demoUrl]
  ];

  let y = 220;
  for (const [title, text] of sections) {
    doc.roundedRect(48, y, 500, 70, 8).stroke("#DCE8DF");
    doc.font("bold").fontSize(14).fillColor("#0D6B45").text(title, 68, y + 13);
    doc.font("regular").fontSize(11).fillColor("#66756D").text(text, 68, y + 38, { width: 455, lineGap: 5 });
    y += 86;
  }

  doc.image(qrPng, 448, 710, { width: 90 });
  doc.font("bold").fontSize(15).fillColor("#102019").text("掃描開啟 Demo", 48, 724);
  doc.font("regular").fontSize(10).fillColor("#66756D").text(demoUrl, 48, 750, { width: 340 });
});

await writeFile(
  path.join(outDir, "README.txt"),
  `Jvision 組織溫室氣體盤查平台行銷素材\n\nDemo URL: ${demoUrl}\n\n檔案清單:\n- jvision-carbon-inventory-poster.png\n- jvision-carbon-inventory-poster.svg\n- jvision-carbon-inventory-poster.pdf\n- jvision-carbon-inventory-product-introduction.pdf\n`,
  "utf8"
);

console.log(`Assets created in ${outDir}`);
