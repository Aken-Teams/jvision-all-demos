import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { chromium } from "playwright";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) {
  args.set(process.argv[i], process.argv[i + 1]);
}

const demoUrl = args.get("--url") || process.env.DEMO_URL || "https://jvision-car-cloud.vercel.app";
const outDir = args.get("--out") || "D:/code/image/說明文件/Jvision車廠雲端管理系統";
const logoUrl = "https://www.jvision-ai.com/public/logo.png";
const fontRegular = "C:/Windows/Fonts/kaiu.ttf";
const fontBold = "C:/Windows/Fonts/simsunb.ttf";

await mkdir(outDir, { recursive: true });

const qrDataUrl = await QRCode.toDataURL(demoUrl, {
  margin: 1,
  width: 380,
  color: { dark: "#07111f", light: "#ffffff" }
});
const qrPng = Buffer.from(qrDataUrl.split(",")[1], "base64");
const logoResponse = await fetch(logoUrl);
const logoBuffer = Buffer.from(await logoResponse.arrayBuffer());

const posterSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1240" height="1754" viewBox="0 0 1240 1754" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1240" height="1754" fill="#EEF3F8"/>
  <rect x="76" y="76" width="1088" height="1602" rx="20" fill="#FFFFFF"/>
  <rect x="76" y="76" width="1088" height="548" rx="20" fill="#07111F"/>
  <rect x="116" y="114" width="252" height="86" rx="14" fill="#FFFFFF"/>
  <image href="${logoUrl}" x="138" y="135" width="204" height="46" preserveAspectRatio="xMinYMid meet"/>
  <text x="116" y="274" fill="#FFCF33" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30" font-weight="800">Jvision Garage Cloud</text>
  <text x="116" y="366" fill="#FFFFFF" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="76" font-weight="900">車廠雲端</text>
  <text x="116" y="456" fill="#FFFFFF" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="76" font-weight="900">管理系統</text>
  <text x="116" y="536" fill="#C6D4E4" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">預約、工單、報價、庫存、LINE 通知與營收分析一站完成。</text>
  <rect x="828" y="176" width="276" height="300" rx="8" fill="#101C2D" stroke="#FF4141" stroke-width="6"/>
  <text x="866" y="238" fill="#FFFFFF" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="34" font-weight="900">六大系統功能</text>
  <text x="866" y="304" fill="#BCD7FF" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">預約管理</text>
  <text x="866" y="350" fill="#BCD7FF" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">維修銷貨</text>
  <text x="866" y="396" fill="#BCD7FF" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">報價工單</text>
  <text x="866" y="442" fill="#BCD7FF" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">庫存管理</text>

  <rect x="116" y="690" width="1008" height="320" rx="18" fill="#101C2D"/>
  <rect x="158" y="752" width="276" height="194" rx="14" fill="#FFFFFF"/>
  <rect x="482" y="752" width="276" height="194" rx="14" fill="#EFF7FF"/>
  <rect x="806" y="752" width="276" height="194" rx="14" fill="#FFFFFF"/>
  <text x="188" y="818" fill="#1F8CFF" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="900">預約轉工單</text>
  <text x="188" y="878" fill="#17202A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">車主、車牌、服務項目</text>
  <text x="188" y="920" fill="#17202A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">快速建立進廠紀錄</text>
  <text x="512" y="818" fill="#1F8CFF" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="900">估價與庫存</text>
  <text x="512" y="878" fill="#17202A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">維修項目加入工單</text>
  <text x="512" y="920" fill="#17202A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">零件同步扣庫存</text>
  <text x="836" y="818" fill="#1F8CFF" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="900">通知與收款</text>
  <text x="836" y="878" fill="#17202A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">LINE 估價通知</text>
  <text x="836" y="920" fill="#17202A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">結帳存車歷史</text>

  <text x="116" y="1120" fill="#07111F" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="46" font-weight="900">掃描進入 Demo 後台</text>
  <text x="116" y="1184" fill="#687789" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="27">測試預約、工單估價、扣庫存、LINE 通知與結帳。</text>
  <text x="116" y="1246" fill="#687789" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="24">${demoUrl}</text>
  <rect x="820" y="1082" width="304" height="304" rx="20" fill="#FFFFFF" stroke="#D7E0EA" stroke-width="2"/>
  <image href="${qrDataUrl}" x="846" y="1108" width="252" height="252"/>
  <rect x="116" y="1472" width="468" height="6" fill="#1F8CFF"/>
  <text x="116" y="1548" fill="#07111F" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="31" font-weight="900">適用場景</text>
  <text x="116" y="1604" fill="#687789" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="27">汽車保養廠、鈑烤維修、汽車美容、機車維修、二手車商</text>
  <text x="116" y="1660" fill="#687789" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="24">Jvision AI | 車廠雲端管理系統 Demo</text>
</svg>`;

await writeFile(path.join(outDir, "jvision-car-cloud-poster.svg"), posterSvg, "utf8");

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1240, height: 1754 }, deviceScaleFactor: 1 });
await page.setContent(posterSvg, { waitUntil: "networkidle" });
await page.screenshot({ path: path.join(outDir, "jvision-car-cloud-poster.png"), fullPage: true });
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

await createPdf("jvision-car-cloud-poster.pdf", (doc) => {
  doc.rect(0, 0, 595, 262).fill("#07111F");
  doc.roundedRect(48, 42, 142, 46, 8).fill("#FFFFFF");
  doc.image(logoBuffer, 58, 52, { width: 122 });
  doc.font("regular").fontSize(14).fillColor("#FFCF33").text("Jvision Garage Cloud", 48, 116);
  doc.font("bold").fontSize(31).fillColor("#FFFFFF").text("車廠雲端管理系統", 48, 150, { width: 440 });
  doc.font("regular").fontSize(12).fillColor("#C6D4E4").text("預約、工單、報價、庫存、LINE 通知與營收分析一站完成。", 48, 208, { width: 470 });
  doc.roundedRect(48, 300, 498, 168, 10).fill("#EEF3F8");
  doc.fillColor("#17202A").font("bold").fontSize(18).text("Demo 可測試功能", 70, 324);
  doc.font("regular").fontSize(12).fillColor("#687789").text("新增預約、轉工單、加入維修項目、扣零件庫存、傳送 LINE 估價、結帳存車歷史、查看營收與低庫存提醒。", 70, 360, { width: 450, lineGap: 8 });
  doc.fillColor("#17202A").font("bold").fontSize(18).text("掃描進入 Demo", 70, 524);
  doc.fillColor("#687789").font("regular").fontSize(10).text(demoUrl, 70, 552, { width: 280 });
  doc.roundedRect(372, 500, 132, 132, 8).stroke("#D7E0EA");
  doc.image(qrPng, 382, 510, { width: 112 });
  doc.fillColor("#17202A").font("bold").fontSize(15).text("適用場景", 70, 676);
  doc.fillColor("#687789").font("regular").fontSize(11).text("汽車保養廠、鈑烤維修、汽車美容、機車維修、二手車商。", 70, 702, { width: 450 });
});

await createPdf("jvision-car-cloud-product-introduction.pdf", (doc) => {
  doc.image(logoBuffer, 48, 42, { width: 120 });
  doc.font("bold").fontSize(24).fillColor("#17202A").text("Jvision 車廠雲端管理系統產品介紹", 48, 112);
  doc.font("regular").fontSize(12).fillColor("#687789").text("Jvision 車廠雲端管理系統是一套以汽修廠日常流程為核心的互動 Demo，涵蓋預約、車主資料、工單、報價、零件庫存、供應商、LINE 通知、結帳與營收分析。", 48, 154, { width: 500, lineGap: 7 });

  const sections = [
    ["專案架構", "參考車廠雲端系統資訊架構，改成 Jvision 品牌的產品頁與後台操作 demo。"],
    ["預約與車主資料", "以時間、車主、車牌、服務項目建立預約，並可一鍵轉成進廠工單。"],
    ["報價與工單", "維修項目、工資、零件費用與稅額自動計算，可傳送 LINE 估價通知。"],
    ["庫存與供應商", "加入維修項目時同步扣除零件庫存，低於安全量時在報表與庫存區提示。"],
    ["結帳與分析", "結帳後自動保存車歷與發票紀錄，並更新今日營收、客單價與待追蹤車主。"],
    ["Demo 網址", demoUrl]
  ];

  let y = 220;
  for (const [title, text] of sections) {
    doc.roundedRect(48, y, 500, 70, 8).stroke("#D7E0EA");
    doc.font("bold").fontSize(14).fillColor("#1F8CFF").text(title, 68, y + 13);
    doc.font("regular").fontSize(11).fillColor("#687789").text(text, 68, y + 38, { width: 455, lineGap: 5 });
    y += 86;
  }

  doc.image(qrPng, 445, 710, { width: 92 });
  doc.font("bold").fontSize(15).fillColor("#17202A").text("掃描測試 Demo", 48, 724);
  doc.font("regular").fontSize(10).fillColor("#687789").text(demoUrl, 48, 750, { width: 340 });
});

await writeFile(
  path.join(outDir, "README.txt"),
  `Jvision 車廠雲端管理系統行銷與說明文件\n\nDemo URL: ${demoUrl}\n\n檔案清單:\n- jvision-car-cloud-poster.png\n- jvision-car-cloud-poster.svg\n- jvision-car-cloud-poster.pdf\n- jvision-car-cloud-product-introduction.pdf\n`,
  "utf8"
);

console.log(`Assets created in ${outDir}`);
