import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { chromium } from "playwright";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) {
  args.set(process.argv[i], process.argv[i + 1]);
}

const demoUrl = args.get("--url") || process.env.DEMO_URL || "https://code01.vercel.app";
const outDir = args.get("--out") || "D:/code/image/說明文件/Jvision課程工具";
const logoUrl = "https://www.jvision-ai.com/public/logo.png";
const fontRegular = "C:/Windows/Fonts/kaiu.ttf";
const fontBold = "C:/Windows/Fonts/simsunb.ttf";

await mkdir(outDir, { recursive: true });

const qrSvgRaw = await QRCode.toString(demoUrl, {
  type: "svg",
  margin: 1,
  width: 250,
  color: { dark: "#091225", light: "#ffffff" }
});
const qrDataUrl = await QRCode.toDataURL(demoUrl, { margin: 1, width: 360 });
const qrPng = Buffer.from(qrDataUrl.split(",")[1], "base64");
const logoResponse = await fetch(logoUrl);
const logoBuffer = Buffer.from(await logoResponse.arrayBuffer());
const qrInner = qrSvgRaw.replace(/<\?xml.*?\?>/, "").replace(/<svg[^>]*>/, "").replace("</svg>", "");

const posterSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1240" height="1754" viewBox="0 0 1240 1754" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1240" height="1754" fill="#F4F7FB"/>
  <rect x="76" y="76" width="1088" height="1602" rx="28" fill="#FFFFFF"/>
  <rect x="76" y="76" width="1088" height="552" rx="28" fill="#091225"/>
  <rect x="116" y="112" width="250" height="86" rx="18" fill="#FFFFFF"/>
  <image href="${logoUrl}" x="138" y="132" width="204" height="48" preserveAspectRatio="xMinYMid meet"/>
  <text x="116" y="264" fill="#46C3D0" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30" font-weight="700">Jvision Course Operations</text>
  <text x="116" y="360" fill="#FFFFFF" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="72" font-weight="800">課程預約管理</text>
  <text x="116" y="446" fill="#FFFFFF" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="72" font-weight="800">變成經營優勢</text>
  <text x="116" y="526" fill="#D9E6EE" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">排課同步、線上預約、購課劃位、電子合約與發票一次完成。</text>
  <rect x="116" y="658" width="1008" height="310" rx="26" fill="#111B34"/>
  <rect x="158" y="714" width="276" height="198" rx="18" fill="#FFFFFF"/>
  <rect x="482" y="714" width="276" height="198" rx="18" fill="#F0FBFD"/>
  <rect x="806" y="714" width="276" height="198" rx="18" fill="#FFFFFF"/>
  <text x="188" y="782" fill="#D6297A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">排課工作台</text>
  <text x="188" y="842" fill="#101828" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">複製週課表、衝突提醒</text>
  <text x="188" y="884" fill="#101828" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">草稿與發布狀態管理</text>
  <text x="512" y="782" fill="#D6297A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">預約與劃位</text>
  <text x="512" y="842" fill="#101828" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">會員購課、候補遞補</text>
  <text x="512" y="884" fill="#101828" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">座位即時鎖定</text>
  <text x="836" y="782" fill="#D6297A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">合約與發票</text>
  <text x="836" y="842" fill="#101828" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">電子合約自動留存</text>
  <text x="836" y="884" fill="#101828" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">發票開立寄送</text>
  <text x="116" y="1078" fill="#101828" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="44" font-weight="800">直接掃描進入 Demo</text>
  <text x="116" y="1144" fill="#667085" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="27">測試新增課程、會員預約、購課、劃位、簽約與開票。</text>
  <text x="116" y="1210" fill="#667085" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="24">${demoUrl}</text>
  <rect x="820" y="1044" width="300" height="300" rx="24" fill="#FFFFFF" stroke="#D9E1EA" stroke-width="2"/>
  <image href="${qrDataUrl}" x="845" y="1069" width="250" height="250"/>
  <rect x="116" y="1438" width="470" height="6" fill="#46C3D0"/>
  <text x="116" y="1516" fill="#101828" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="31" font-weight="800">適用場景</text>
  <text x="116" y="1572" fill="#667085" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="27">健身房、瑜珈教室、拳館、舞蹈教室、皮拉提斯與複合式運動場館</text>
  <text x="116" y="1632" fill="#667085" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="24">Jvision AI | 課程營運工具 Demo</text>
</svg>`;

await writeFile(path.join(outDir, "jvision-course-tools-poster.svg"), posterSvg, "utf8");

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1240, height: 1754 }, deviceScaleFactor: 1 });
await page.setContent(posterSvg, { waitUntil: "networkidle" });
await page.screenshot({ path: path.join(outDir, "jvision-course-tools-poster.png"), fullPage: true });
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

await createPdf("jvision-course-tools-poster.pdf", (doc) => {
  doc.rect(0, 0, 595, 260).fill("#091225");
  doc.image(logoBuffer, 48, 42, { width: 132 });
  doc.font("regular").fontSize(14).fillColor("#46C3D0").text("Jvision Course Operations", 48, 112);
  doc.font("bold").fontSize(30).fillColor("#FFFFFF").text("課程預約管理變成經營優勢", 48, 144, { width: 450 });
  doc.font("regular").fontSize(12).fillColor("#D9E6EE").text("排課同步、線上預約、購課劃位、電子合約與發票一次完成。", 48, 206, { width: 460 });
  doc.roundedRect(48, 296, 498, 164, 10).fill("#F4F7FB");
  doc.fillColor("#101828").font("bold").fontSize(18).text("Demo 可測試功能", 70, 318);
  doc.font("regular").fontSize(12).fillColor("#667085").text("新增課程、發布課表、複製週課表、會員購課、預約候補、座位鎖定、電子合約簽署、發票開立與營運指標。", 70, 354, { width: 450, lineGap: 8 });
  doc.fillColor("#101828").font("bold").fontSize(18).text("掃描進入 Demo", 70, 520);
  doc.fillColor("#667085").font("regular").fontSize(10).text(demoUrl, 70, 548, { width: 280 });
  doc.roundedRect(372, 500, 132, 132, 8).stroke("#D9E1EA");
  doc.image(qrPng, 382, 510, { width: 112 });
  doc.fillColor("#101828").font("bold").fontSize(15).text("適用場景", 70, 670);
  doc.fillColor("#667085").font("regular").fontSize(11).text("健身房、瑜珈教室、拳館、舞蹈教室、皮拉提斯與複合式運動場館。", 70, 696, { width: 450 });
});

await createPdf("jvision-course-tools-product-introduction.pdf", (doc) => {
  doc.image(logoBuffer, 48, 42, { width: 120 });
  doc.font("bold").fontSize(24).fillColor("#101828").text("Jvision 課程工具產品介紹", 48, 112);
  doc.font("regular").fontSize(12).fillColor("#667085").text("Jvision 課程工具是一套為運動場館打造的營運 Demo，涵蓋排課、預約、購課、候補、劃位、電子合約、發票與即時報表。", 48, 154, { width: 500, lineGap: 7 });

  const sections = [
    ["專案架構", "以產品頁形式呈現完整場館課程營運流程：首頁說明價值、功能架構、會員體驗與可互動 demo。"],
    ["排課管理", "管理端可新增課程、複製週課表、發布草稿，並即時查看名額、候補與課程狀態。"],
    ["會員預約", "會員可選課、購買課包、預約課程、選擇座位；滿班時可進入候補流程。"],
    ["商務流程", "購課後建立電子合約，簽署後留存紀錄，並可開立發票，方便後續對帳與報表追蹤。"],
    ["Demo 網址", demoUrl]
  ];

  let y = 220;
  for (const [title, text] of sections) {
    doc.roundedRect(48, y, 500, 78, 8).stroke("#D9E1EA");
    doc.font("bold").fontSize(14).fillColor("#D6297A").text(title, 68, y + 14);
    doc.font("regular").fontSize(11).fillColor("#667085").text(text, 68, y + 40, { width: 455, lineGap: 5 });
    y += 96;
  }

  doc.image(qrPng, 445, 704, { width: 92 });
  doc.font("bold").fontSize(15).fillColor("#101828").text("掃描測試 Demo", 48, 720);
  doc.font("regular").fontSize(10).fillColor("#667085").text(demoUrl, 48, 746, { width: 340 });
});

await writeFile(
  path.join(outDir, "README.txt"),
  `Jvision 課程工具行銷與說明文件\n\nDemo URL: ${demoUrl}\n\n檔案清單:\n- jvision-course-tools-poster.png\n- jvision-course-tools-poster.svg\n- jvision-course-tools-poster.pdf\n- jvision-course-tools-product-introduction.pdf\n`,
  "utf8"
);

console.log(`Assets created in ${outDir}`);
