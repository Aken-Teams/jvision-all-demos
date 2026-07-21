import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { chromium } from "playwright";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) {
  args.set(process.argv[i], process.argv[i + 1]);
}

const demoUrl = args.get("--url") || process.env.DEMO_URL || "https://jvision-crm.vercel.app";
const outDir = args.get("--out") || "D:/code/image/說明文件/Jvision CRM";
const logoUrl = "https://www.jvision-ai.com/public/logo.png";
const fontRegular = "C:/Windows/Fonts/kaiu.ttf";
const fontBold = "C:/Windows/Fonts/simsunb.ttf";

await mkdir(outDir, { recursive: true });

const qrDataUrl = await QRCode.toDataURL(demoUrl, {
  margin: 1,
  width: 380,
  color: { dark: "#213343", light: "#ffffff" }
});
const qrPng = Buffer.from(qrDataUrl.split(",")[1], "base64");
const logoResponse = await fetch(logoUrl);
const logoBuffer = Buffer.from(await logoResponse.arrayBuffer());

const posterSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1240" height="1754" viewBox="0 0 1240 1754" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1240" height="1754" fill="#FFF4EE"/>
  <rect x="76" y="76" width="1088" height="1602" rx="22" fill="#FFFFFF"/>
  <rect x="116" y="116" width="252" height="86" rx="14" fill="#FFFFFF" stroke="#DBE4ED" stroke-width="2"/>
  <image href="${logoUrl}" x="138" y="137" width="204" height="46" preserveAspectRatio="xMinYMid meet"/>
  <text x="116" y="292" fill="#D4431F" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30" font-weight="800">Jvision CRM Platform</text>
  <text x="116" y="388" fill="#213343" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="76" font-weight="900">客戶關係管理</text>
  <text x="116" y="478" fill="#213343" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="76" font-weight="900">與銷售管線 Demo</text>
  <text x="116" y="556" fill="#516F90" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">客戶資料、商機、任務、活動紀錄與報表分析集中管理。</text>
  <rect x="116" y="660" width="1008" height="340" rx="18" fill="#F6F9FC" stroke="#DBE4ED" stroke-width="2"/>
  <rect x="158" y="724" width="276" height="206" rx="14" fill="#FFFFFF"/>
  <rect x="482" y="724" width="276" height="206" rx="14" fill="#FFFFFF"/>
  <rect x="806" y="724" width="276" height="206" rx="14" fill="#FFFFFF"/>
  <text x="188" y="792" fill="#FF5C35" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="900">???????</text>
  <text x="188" y="852" fill="#213343" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">公司、聯絡人、Email</text>
  <text x="188" y="894" fill="#213343" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">活動紀錄一次整合</text>
  <text x="512" y="792" fill="#FF5C35" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="900">????</text>
  <text x="512" y="852" fill="#213343" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">商機階段、金額</text>
  <text x="512" y="894" fill="#213343" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">成交預測同步更新</text>
  <text x="836" y="792" fill="#FF5C35" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="900">Tasks & Reports</text>
  <text x="836" y="852" fill="#213343" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">待辦、活動、報表</text>
  <text x="836" y="894" fill="#213343" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">團隊行動透明化</text>
  <text x="116" y="1110" fill="#213343" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="46" font-weight="900">掃描進入 CRM Demo</text>
  <text x="116" y="1174" fill="#516F90" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="27">測試客戶、商機、管線、任務與 ????。</text>
  <text x="116" y="1238" fill="#516F90" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="24">${demoUrl}</text>
  <rect x="820" y="1076" width="304" height="304" rx="20" fill="#FFFFFF" stroke="#DBE4ED" stroke-width="2"/>
  <image href="${qrDataUrl}" x="846" y="1102" width="252" height="252"/>
  <rect x="116" y="1464" width="468" height="6" fill="#FF5C35"/>
  <text x="116" y="1540" fill="#213343" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="31" font-weight="900">適用場景</text>
  <text x="116" y="1596" fill="#516F90" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="27">新創業務、B2B 銷售、客服續約、行銷名單轉換</text>
  <text x="116" y="1652" fill="#516F90" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="24">Jvision AI | CRM Demo</text>
</svg>`;

await writeFile(path.join(outDir, "jvision-crm-poster.svg"), posterSvg, "utf8");

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1240, height: 1754 }, deviceScaleFactor: 1 });
await page.setContent(posterSvg, { waitUntil: "networkidle" });
await page.screenshot({ path: path.join(outDir, "jvision-crm-poster.png"), fullPage: true });
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

await createPdf("jvision-crm-poster.pdf", (doc) => {
  doc.rect(0, 0, 595, 262).fill("#FFF4EE");
  doc.roundedRect(48, 42, 142, 46, 8).fill("#FFFFFF").stroke("#DBE4ED");
  doc.image(logoBuffer, 58, 52, { width: 122 });
  doc.font("regular").fontSize(14).fillColor("#D4431F").text("Jvision CRM Platform", 48, 116);
  doc.font("bold").fontSize(30).fillColor("#213343").text("客戶關係管理與銷售管線 Demo", 48, 150, { width: 470 });
  doc.font("regular").fontSize(12).fillColor("#516F90").text("客戶資料、商機、任務、活動紀錄與報表分析集中管理。", 48, 210, { width: 470 });
  doc.roundedRect(48, 300, 498, 168, 10).fill("#F6F9FC");
  doc.fillColor("#213343").font("bold").fontSize(18).text("Demo 可測試功能", 70, 324);
  doc.font("regular").fontSize(12).fillColor("#516F90").text("新增客戶、建立商機、推進銷售管線、建立與完成任務、記錄活動、查看 open pipeline 與 won revenue。", 70, 360, { width: 450, lineGap: 8 });
  doc.fillColor("#213343").font("bold").fontSize(18).text("掃描進入 Demo", 70, 524);
  doc.fillColor("#516F90").font("regular").fontSize(10).text(demoUrl, 70, 552, { width: 280 });
  doc.roundedRect(372, 500, 132, 132, 8).stroke("#DBE4ED");
  doc.image(qrPng, 382, 510, { width: 112 });
  doc.fillColor("#213343").font("bold").fontSize(15).text("適用場景", 70, 676);
  doc.fillColor("#516F90").font("regular").fontSize(11).text("新創業務、B2B 銷售、客服續約、行銷名單轉換。", 70, 702, { width: 450 });
});

await createPdf("jvision-crm-product-introduction.pdf", (doc) => {
  doc.image(logoBuffer, 48, 42, { width: 120 });
  doc.font("bold").fontSize(24).fillColor("#213343").text("Jvision CRM 產品介紹", 48, 112);
  doc.font("regular").fontSize(12).fillColor("#516F90").text("Jvision CRM 是一套參考 HubSpot CRM 產品架構打造的互動 Demo，提供客戶資料、銷售管線、任務、活動紀錄、銷售報表與自動化流程展示。", 48, 154, { width: 500, lineGap: 7 });

  const sections = [
    ["專案架構", "以明亮 SaaS 產品頁呈現 CRM 價值，並內建可操作的 dashboard demo。"],
    ["客戶資料庫", "集中管理姓名、公司、Email、負責人、lead score 與互動紀錄。"],
    ["銷售管線", "商機可在 New、Qualified、Proposal、Won 階段推進，金額與 ???? 即時更新。"],
    ["任務與活動", "建立跟進任務、完成待辦、記錄 demo call 與需求摘要。"],
    ["報表分析", "即時顯示 contacts、open pipeline、won revenue 與 open tasks。"],
    ["Demo 網址", demoUrl]
  ];

  let y = 220;
  for (const [title, text] of sections) {
    doc.roundedRect(48, y, 500, 70, 8).stroke("#DBE4ED");
    doc.font("bold").fontSize(14).fillColor("#FF5C35").text(title, 68, y + 13);
    doc.font("regular").fontSize(11).fillColor("#516F90").text(text, 68, y + 38, { width: 455, lineGap: 5 });
    y += 86;
  }

  doc.image(qrPng, 445, 710, { width: 92 });
  doc.font("bold").fontSize(15).fillColor("#213343").text("掃描測試 Demo", 48, 724);
  doc.font("regular").fontSize(10).fillColor("#516F90").text(demoUrl, 48, 750, { width: 340 });
});

await writeFile(
  path.join(outDir, "README.txt"),
  `Jvision CRM 行銷與說明文件\n\nDemo URL: ${demoUrl}\n\n檔案清單:\n- jvision-crm-poster.png\n- jvision-crm-poster.svg\n- jvision-crm-poster.pdf\n- jvision-crm-product-introduction.pdf\n`,
  "utf8"
);

console.log(`Assets created in ${outDir}`);
