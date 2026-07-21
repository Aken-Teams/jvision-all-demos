import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { chromium } from "playwright";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) {
  args.set(process.argv[i], process.argv[i + 1]);
}

const demoUrl = args.get("--url") || process.env.DEMO_URL || "https://jvision-work-management.vercel.app";
const outDir = args.get("--out") || "D:/code/image/說明文件/Jvision工作管理平台";
const logoUrl = "https://www.jvision-ai.com/public/logo.png";
const fontRegular = "C:/Windows/Fonts/kaiu.ttf";
const fontBold = "C:/Windows/Fonts/simsunb.ttf";

await mkdir(outDir, { recursive: true });

const qrDataUrl = await QRCode.toDataURL(demoUrl, {
  margin: 1,
  width: 380,
  color: { dark: "#1f1f21", light: "#ffffff" }
});
const qrPng = Buffer.from(qrDataUrl.split(",")[1], "base64");
const logoResponse = await fetch(logoUrl);
const logoBuffer = Buffer.from(await logoResponse.arrayBuffer());

const posterSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1240" height="1754" viewBox="0 0 1240 1754" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1240" height="1754" fill="#F5EEE7"/>
  <rect x="76" y="76" width="1088" height="1602" rx="28" fill="#FFFFFF"/>
  <rect x="116" y="116" width="252" height="86" rx="18" fill="#FFFFFF" stroke="#DEDEE3" stroke-width="2"/>
  <image href="${logoUrl}" x="138" y="137" width="204" height="46" preserveAspectRatio="xMinYMid meet"/>
  <text x="116" y="286" fill="#FF6B5F" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30" font-weight="800">Jvision Work Graph</text>
  <text x="116" y="382" fill="#1F1F21" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="72" font-weight="900">工作管理平台</text>
  <text x="116" y="468" fill="#1F1F21" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="72" font-weight="900">與 AI 專案 Demo</text>
  <text x="116" y="546" fill="#6B6B74" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="29">任務、專案檢視、目標報告、自動化與工作負荷管理。</text>
  <rect x="116" y="656" width="1008" height="348" rx="22" fill="#F7F6F3" stroke="#DEDEE3" stroke-width="2"/>
  <rect x="156" y="726" width="220" height="210" rx="18" fill="#FFFFFF"/>
  <rect x="398" y="726" width="220" height="210" rx="18" fill="#FFFFFF"/>
  <rect x="640" y="726" width="220" height="210" rx="18" fill="#FFFFFF"/>
  <rect x="882" y="726" width="202" height="210" rx="18" fill="#FFFFFF"/>
  <text x="184" y="790" fill="#8B5CF6" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="28" font-weight="900">專案管理</text>
  <text x="184" y="850" fill="#1F1F21" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="23">看板、清單</text>
  <text x="184" y="890" fill="#1F1F21" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="23">時間軸</text>
  <text x="426" y="790" fill="#8B5CF6" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="28" font-weight="900">任務追蹤</text>
  <text x="426" y="850" fill="#1F1F21" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="23">負責人</text>
  <text x="426" y="890" fill="#1F1F21" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="23">截止日</text>
  <text x="668" y="790" fill="#8B5CF6" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="28" font-weight="900">目標報告</text>
  <text x="668" y="850" fill="#1F1F21" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="23">KPI 進度</text>
  <text x="668" y="890" fill="#1F1F21" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="23">儀表板</text>
  <text x="910" y="790" fill="#8B5CF6" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="28" font-weight="900">AI 自動化</text>
  <text x="910" y="850" fill="#1F1F21" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="23">摘要</text>
  <text x="910" y="890" fill="#1F1F21" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="23">規則</text>
  <text x="116" y="1120" fill="#1F1F21" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="46" font-weight="900">掃描進入 Demo</text>
  <text x="116" y="1184" fill="#6B6B74" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="27">測試任務、看板、AI 摘要、目標與工作負荷。</text>
  <text x="116" y="1246" fill="#6B6B74" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="24">${demoUrl}</text>
  <rect x="820" y="1084" width="304" height="304" rx="22" fill="#FFFFFF" stroke="#DEDEE3" stroke-width="2"/>
  <image href="${qrDataUrl}" x="846" y="1110" width="252" height="252"/>
  <rect x="116" y="1476" width="468" height="6" fill="#FF6B5F"/>
  <text x="116" y="1550" fill="#1F1F21" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="31" font-weight="900">適用場景</text>
  <text x="116" y="1606" fill="#6B6B74" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="27">產品、行銷、營運、IT、銷售、人資與跨部門專案</text>
  <text x="116" y="1662" fill="#6B6B74" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="24">Jvision AI | 工作管理平台 Demo</text>
</svg>`;

await writeFile(path.join(outDir, "jvision-work-management-poster.svg"), posterSvg, "utf8");

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1240, height: 1754 }, deviceScaleFactor: 1 });
await page.setContent(posterSvg, { waitUntil: "networkidle" });
await page.screenshot({ path: path.join(outDir, "jvision-work-management-poster.png"), fullPage: true });
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

await createPdf("jvision-work-management-poster.pdf", (doc) => {
  doc.rect(0, 0, 595, 262).fill("#F5EEE7");
  doc.roundedRect(48, 42, 142, 46, 8).fill("#FFFFFF").stroke("#DEDEE3");
  doc.image(logoBuffer, 58, 52, { width: 122 });
  doc.font("regular").fontSize(14).fillColor("#FF6B5F").text("Jvision Work Graph", 48, 116);
  doc.font("bold").fontSize(29).fillColor("#1F1F21").text("工作管理平台與 AI 專案 Demo", 48, 150, { width: 470 });
  doc.font("regular").fontSize(12).fillColor("#6B6B74").text("任務、專案檢視、目標報告、自動化與工作負荷管理。", 48, 210, { width: 470 });
  doc.roundedRect(48, 300, 498, 168, 10).fill("#F7F6F3");
  doc.fillColor("#1F1F21").font("bold").fontSize(18).text("Demo 可測試功能", 70, 324);
  doc.font("regular").fontSize(12).fillColor("#6B6B74").text("新增任務、推進看板階段、套用自動化規則、生成 AI 摘要、更新目標進度與重新平衡工作負荷。", 70, 360, { width: 450, lineGap: 8 });
  doc.fillColor("#1F1F21").font("bold").fontSize(18).text("掃描進入 Demo", 70, 524);
  doc.fillColor("#6B6B74").font("regular").fontSize(10).text(demoUrl, 70, 552, { width: 280 });
  doc.roundedRect(372, 500, 132, 132, 8).stroke("#DEDEE3");
  doc.image(qrPng, 382, 510, { width: 112 });
  doc.fillColor("#1F1F21").font("bold").fontSize(15).text("適用場景", 70, 676);
  doc.fillColor("#6B6B74").font("regular").fontSize(11).text("產品、行銷、營運、IT、銷售、人資與跨部門專案。", 70, 702, { width: 450 });
});

await createPdf("jvision-work-management-product-introduction.pdf", (doc) => {
  doc.image(logoBuffer, 48, 42, { width: 120 });
  doc.font("bold").fontSize(24).fillColor("#1F1F21").text("Jvision 工作管理平台產品介紹", 48, 112);
  doc.font("regular").fontSize(12).fillColor("#6B6B74").text("Jvision 工作管理平台整合 AI 摘要、專案看板、任務追蹤、目標報告、工作流程自動化、資源管理與整合工具。", 48, 154, { width: 500, lineGap: 7 });

  const sections = [
    ["專案架構", "以 Work Graph 為核心，呈現團隊工作、專案與目標的連結。"],
    ["任務與專案", "新增任務、設定負責人、截止日、優先級與工時，並在看板中推進階段。"],
    ["AI 工作管理", "一鍵生成專案狀態摘要，提示高風險任務與下一步焦點。"],
    ["自動化規則", "高優先任務可觸發專案更新，降低重複行政工作。"],
    ["資源管理", "工作負荷視覺化，並可重新分配任務以平衡團隊工時。"],
    ["Demo 網址", demoUrl]
  ];

  let y = 220;
  for (const [title, text] of sections) {
    doc.roundedRect(48, y, 500, 70, 8).stroke("#DEDEE3");
    doc.font("bold").fontSize(14).fillColor("#8B5CF6").text(title, 68, y + 13);
    doc.font("regular").fontSize(11).fillColor("#6B6B74").text(text, 68, y + 38, { width: 455, lineGap: 5 });
    y += 86;
  }

  doc.image(qrPng, 445, 710, { width: 92 });
  doc.font("bold").fontSize(15).fillColor("#1F1F21").text("掃描測試 Demo", 48, 724);
  doc.font("regular").fontSize(10).fillColor("#6B6B74").text(demoUrl, 48, 750, { width: 340 });
});

await writeFile(
  path.join(outDir, "README.txt"),
  `Jvision 工作管理平台行銷與說明文件\n\nDemo URL: ${demoUrl}\n\n檔案清單:\n- jvision-work-management-poster.png\n- jvision-work-management-poster.svg\n- jvision-work-management-poster.pdf\n- jvision-work-management-product-introduction.pdf\n`,
  "utf8"
);

console.log(`Assets created in ${outDir}`);
