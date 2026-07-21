import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) args.set(process.argv[i], process.argv[i + 1]);

const demoUrl = args.get("--url") || process.env.DEMO_URL || "https://jvision-course-platform.vercel.app";
const outDir = args.get("--out") || "D:/code/image/說明文件/Jvision線上課程平台";
const logoUrl = "https://www.jvision-ai.com/public/logo.png";
const fontRegular = "C:/Windows/Fonts/kaiu.ttf";
const fontBold = "C:/Windows/Fonts/simsunb.ttf";

await mkdir(outDir, { recursive: true });
const qrSvgRaw = await QRCode.toString(demoUrl, { type: "svg", margin: 1, width: 250, color: { dark: "#172033", light: "#ffffff" } });
const qrDataUrl = await QRCode.toDataURL(demoUrl, { margin: 1, width: 360 });
const qrPng = Buffer.from(qrDataUrl.split(",")[1], "base64");
const logoResponse = await fetch(logoUrl);
const logoBuffer = Buffer.from(await logoResponse.arrayBuffer());
const qrInner = qrSvgRaw.replace(/<\?xml.*?\?>/, "").replace(/<svg[^>]*>/, "").replace("</svg>", "");

const posterSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1240" height="1754" viewBox="0 0 1240 1754" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1240" height="1754" fill="#F8FAFC"/>
  <rect x="70" y="70" width="1100" height="1614" rx="34" fill="#FFFFFF" stroke="#DFE5EF" stroke-width="2"/>
  <image href="${logoUrl}" x="108" y="112" width="214" height="60" preserveAspectRatio="xMinYMid meet"/>
  <text x="108" y="264" fill="#6655FF" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30" font-weight="700">Jvision Creator Academy</text>
  <text x="108" y="356" fill="#172033" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="70" font-weight="800">線上課程平台 Demo</text>
  <text x="108" y="442" fill="#172033" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="62" font-weight="800">課程、銷售、金流與學習互動一站完成</text>
  <text x="108" y="526" fill="#667085" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">快速架站、課程產品、折扣結帳、影音單元、作業回饋與營運報表，</text>
  <text x="108" y="574" fill="#667085" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">全部整合成可直接操作的線上展示。</text>
  <rect x="108" y="672" width="1024" height="420" rx="28" fill="#172033"/>
  <rect x="158" y="728" width="292" height="280" rx="22" fill="#FFFFFF"/>
  <rect x="474" y="728" width="292" height="280" rx="22" fill="#F0F3FF"/>
  <rect x="790" y="728" width="292" height="280" rx="22" fill="#FFFFFF"/>
  <text x="190" y="806" fill="#6655FF" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">課程銷售</text>
  <text x="190" y="874" fill="#172033" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">課程產品</text>
  <text x="190" y="932" fill="#172033" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">折扣結帳</text>
  <text x="506" y="806" fill="#6655FF" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">影音學習</text>
  <text x="506" y="874" fill="#172033" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">單元管理</text>
  <text x="506" y="932" fill="#172033" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">作業回饋</text>
  <text x="822" y="806" fill="#6655FF" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">營運報表</text>
  <text x="822" y="874" fill="#172033" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">營收、學員</text>
  <text x="822" y="932" fill="#172033" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">完課與名單</text>
  <text x="108" y="1192" fill="#172033" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="38" font-weight="800">適合展示給</text>
  <text x="108" y="1260" fill="#667085" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">講師、顧問、知識型品牌、企業內訓、會員訂閱社群</text>
  <text x="108" y="1352" fill="#172033" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="38" font-weight="800">掃描 QR Code 立即進入線上 Demo</text>
  <text x="108" y="1410" fill="#667085" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">${demoUrl}</text>
  <rect x="852" y="1238" width="280" height="280" rx="24" fill="#FFFFFF" stroke="#DFE5EF" stroke-width="2"/>
  <g transform="translate(867 1253)">${qrInner}</g>
  <rect x="108" y="1574" width="486" height="4" fill="#6655FF"/>
  <text x="108" y="1632" fill="#667085" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="24">Jvision AI · 線上課程平台展示素材</text>
</svg>`;

await writeFile(path.join(outDir, "jvision-course-platform-poster.svg"), posterSvg, "utf8");

function createPdf(fileName, render) {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ size: "A4", margin: 48, bufferPages: true });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", async () => { await writeFile(path.join(outDir, fileName), Buffer.concat(chunks)); resolve(); });
    doc.registerFont("regular", fontRegular);
    doc.registerFont("bold", fontBold);
    render(doc);
    doc.end();
  });
}

await createPdf("jvision-course-platform-poster.pdf", (doc) => {
  doc.image(logoBuffer, 48, 42, { width: 130 });
  doc.font("bold").fontSize(30).fillColor("#172033").text("線上課程平台 Demo", 48, 132);
  doc.font("bold").fontSize(24).text("課程、銷售、金流與學習互動一站完成", 48, 172);
  doc.font("regular").fontSize(13).fillColor("#667085").text("Jvision 把課程網站、產品銷售、折扣結帳、影音單元、作業回饋與營運報表整合為可操作展示。", 48, 226, { width: 480, lineGap: 8 });
  doc.roundedRect(48, 312, 498, 210, 14).fill("#172033");
  doc.fillColor("#FFFFFF").font("bold").fontSize(22).text("可展示功能", 78, 344);
  doc.font("regular").fontSize(14).text("• 新增課程並管理影音單元", 78, 398);
  doc.text("• 套用折扣碼並完成課程結帳", 78, 430);
  doc.text("• 送出作業回饋並查看營運 KPI", 78, 462);
  doc.roundedRect(345, 570, 160, 160, 10).stroke("#DFE5EF");
  doc.image(qrPng, 355, 580, { width: 140 });
  doc.fillColor("#172033").font("bold").fontSize(18).text("掃描進入 Demo", 48, 584);
  doc.fillColor("#667085").font("regular").fontSize(10).text(demoUrl, 48, 620, { width: 260 });
});

await createPdf("jvision-course-platform-product-introduction.pdf", (doc) => {
  doc.image(logoBuffer, 48, 42, { width: 120 });
  doc.font("bold").fontSize(24).fillColor("#172033").text("Jvision 線上課程平台產品介紹", 48, 120);
  doc.font("regular").fontSize(12).fillColor("#667085").text("面向講師與知識型品牌的課程營運展示專案，串連課程建立、銷售頁、金流、影音單元、作業回饋與營運報表。", 48, 168, { width: 500, lineGap: 7 });
  const sections = [
    ["核心價值", "把課程內容、學員互動、名單與銷售資料集中到一套知識變現流程。"],
    ["Demo 功能", "可新增課程、加入購物車、套折扣碼、完成結帳、建立單元、送出作業回饋。"],
    ["導入情境", "適合講師、顧問、知識型品牌、企業內訓、會員訂閱與直播銷售。"],
    ["預期效益", "縮短開課上線時間，提升銷售轉換與學員持續互動。"]
  ];
  let y = 245;
  for (const [title, text] of sections) {
    doc.roundedRect(48, y, 500, 84, 8).stroke("#DFE5EF");
    doc.font("bold").fontSize(15).fillColor("#6655FF").text(title, 68, y + 16);
    doc.font("regular").fontSize(11).fillColor("#667085").text(text, 68, y + 42, { width: 455, lineGap: 5 });
    y += 106;
  }
  doc.font("bold").fontSize(16).fillColor("#172033").text("立即體驗", 48, 708);
  doc.font("regular").fontSize(10).fillColor("#667085").text(demoUrl, 48, 734, { width: 310 });
  doc.image(qrPng, 445, 684, { width: 92 });
});

await writeFile(path.join(outDir, "README.txt"), `\uFEFFJvision 線上課程平台素材\n\nDemo URL: ${demoUrl}\n\n檔案：\n- jvision-course-platform-poster.svg\n- jvision-course-platform-poster.pdf\n- jvision-course-platform-product-introduction.pdf\n`, "utf8");
console.log(`Assets created in ${outDir}`);
