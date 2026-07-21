import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import sharp from "sharp";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) args.set(process.argv[i], process.argv[i + 1]);

const demoUrl = args.get("--url") || process.env.DEMO_URL || "https://jvision-self-care-platform.vercel.app";
const outDir = args.get("--out") || "D:/code/image/說明文件/jvision-self-care-platform";
const logoUrl = "https://www.jvision-ai.com/public/logo.png";
const fontRegular = "C:/Windows/Fonts/kaiu.ttf";
const fontBold = "C:/Windows/Fonts/simsunb.ttf";

await mkdir(outDir, { recursive: true });

const qrSvgRaw = await QRCode.toString(demoUrl, {
  type: "svg",
  margin: 1,
  width: 250,
  color: { dark: "#1F2A37", light: "#ffffff" },
});
const qrPng = Buffer.from((await QRCode.toDataURL(demoUrl, { margin: 1, width: 360 })).split(",")[1], "base64");
const logoBuffer = Buffer.from(await (await fetch(logoUrl)).arrayBuffer());
const qrInner = qrSvgRaw.replace(/<\?xml.*?\?>/, "").replace(/<svg[^>]*>/, "").replace("</svg>", "");

const posterSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1240" height="1754" viewBox="0 0 1240 1754" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="1240" height="1754" fill="#F7F3EE"/>
<rect x="70" y="70" width="1100" height="1614" rx="34" fill="#FFFFFF" stroke="#E7D8C9" stroke-width="2"/>
<image href="${logoUrl}" x="108" y="112" width="214" height="60" preserveAspectRatio="xMinYMid meet"/>
<text x="108" y="266" fill="#B45309" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30" font-weight="700">Jvision Beauty Booking Operations Platform</text>
<text x="108" y="356" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="68" font-weight="800">美業預約營運平台 Demo</text>
<text x="108" y="442" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="50" font-weight="800">預約、排班、POS、會員與行銷一套完成</text>
<text x="108" y="526" fill="#667085" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">整合自助預約、客戶檔案、表單紀錄、POS 結帳與多店報表。</text>
<text x="108" y="574" fill="#667085" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">掃描 QR Code 可直接進入線上互動 Demo。</text>
<rect x="108" y="672" width="1024" height="420" rx="28" fill="#1F2A37"/>
<rect x="158" y="728" width="292" height="280" rx="22" fill="#FFFFFF"/>
<rect x="474" y="728" width="292" height="280" rx="22" fill="#FFF7ED"/>
<rect x="790" y="728" width="292" height="280" rx="22" fill="#FFFFFF"/>
<text x="190" y="806" fill="#B45309" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">自助預約</text>
<text x="190" y="874" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">智慧排班</text>
<text x="190" y="932" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">候補提醒</text>
<text x="506" y="806" fill="#B45309" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">客戶體驗</text>
<text x="506" y="874" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">檔案表單</text>
<text x="506" y="932" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">偏好紀錄</text>
<text x="822" y="806" fill="#B45309" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">營收成長</text>
<text x="822" y="874" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">POS 會員</text>
<text x="822" y="932" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">訊息行銷</text>
<text x="108" y="1192" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="38" font-weight="800">適用情境</text>
<text x="108" y="1260" fill="#667085" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">沙龍、SPA、美療、醫美、按摩、指甲店、理髮店與多據點品牌。</text>
<text x="108" y="1352" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="38" font-weight="800">掃描 QR Code 進入 Demo</text>
<text x="108" y="1410" fill="#667085" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">${demoUrl}</text>
<rect x="852" y="1238" width="280" height="280" rx="24" fill="#FFFFFF" stroke="#E7D8C9" stroke-width="2"/>
<g transform="translate(867 1253)">${qrInner}</g>
<rect x="108" y="1574" width="486" height="4" fill="#B45309"/>
<text x="108" y="1632" fill="#667085" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="24">Jvision AI | 美業預約營運平台互動展示</text>
</svg>`;

await writeFile(path.join(outDir, "jvision-self-care-platform-poster.svg"), posterSvg, "utf8");
await sharp(Buffer.from(posterSvg)).png().toFile(path.join(outDir, "jvision-self-care-platform-poster.png"));

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

await createPdf("jvision-self-care-platform-poster.pdf", (doc) => {
  doc.image(logoBuffer, 48, 42, { width: 130 });
  doc.font("bold").fontSize(29).fillColor("#1F2A37").text("Jvision 美業預約營運平台 Demo", 48, 132);
  doc.font("bold").fontSize(20).text("預約、排班、POS、會員與行銷一套完成", 48, 174);
  doc.font("regular").fontSize(13).fillColor("#667085").text(
    "Jvision 協助沙龍、SPA、美療、醫美、按摩與指甲店整合自助預約、智慧排班、客戶檔案、POS 結帳、會員方案、訊息行銷與多店報表。",
    48,
    226,
    { width: 480, lineGap: 8 },
  );
  doc.roundedRect(48, 318, 498, 210, 14).fill("#1F2A37");
  doc.fillColor("#FFFFFF").font("bold").fontSize(22).text("Demo 可測試功能", 78, 350);
  doc.font("regular").fontSize(14).text("1. 新增線上預約並安排服務人員", 78, 404);
  doc.text("2. 更新客戶檔案、諮詢表單與服務偏好", 78, 436);
  doc.text("3. POS 結帳、會員累點與回訪訊息", 78, 468);
  doc.roundedRect(345, 570, 160, 160, 10).stroke("#E7D8C9");
  doc.image(qrPng, 355, 580, { width: 140 });
  doc.fillColor("#1F2A37").font("bold").fontSize(18).text("掃描進入 Demo", 48, 584);
  doc.fillColor("#667085").font("regular").fontSize(10).text(demoUrl, 48, 620, { width: 260 });
});

await createPdf("jvision-self-care-platform-product-introduction.pdf", (doc) => {
  doc.image(logoBuffer, 48, 42, { width: 120 });
  doc.font("bold").fontSize(24).fillColor("#1F2A37").text("Jvision 美業預約營運平台產品介紹", 48, 120);
  doc.font("regular").fontSize(12).fillColor("#667085").text(
    "Jvision 美業預約營運平台適合沙龍、SPA、美療、醫美、按摩、指甲店、理髮店與多據點品牌。系統將預約、排班、客戶檔案、表單、POS、會員、訊息與報表整合成一套門市營運工作流。",
    48,
    168,
    { width: 500, lineGap: 7 },
  );
  const sections = [
    ["核心模組", "自助預約、智慧排班、客戶檔案、表單紀錄、POS 結帳、會員方案、訊息行銷與多店報表。"],
    ["互動 Demo", "可新增預約、更新到店狀態、建立客戶偏好、完成結帳、累積點數、發送回訪與查看營運指標。"],
    ["管理價值", "降低漏接預約、減少櫃台溝通、提升回訪與會員留存，讓多店營運更容易複製。"],
    ["適合對象", "沙龍、SPA、美療、醫美、按摩、指甲店、理髮店、複合式美容會館與多據點品牌。"],
  ];
  let y = 245;
  for (const [title, text] of sections) {
    doc.roundedRect(48, y, 500, 84, 8).stroke("#E7D8C9");
    doc.font("bold").fontSize(15).fillColor("#B45309").text(title, 68, y + 16);
    doc.font("regular").fontSize(11).fillColor("#667085").text(text, 68, y + 42, { width: 455, lineGap: 5 });
    y += 106;
  }
  doc.font("bold").fontSize(16).fillColor("#1F2A37").text("線上展示", 48, 708);
  doc.font("regular").fontSize(10).fillColor("#667085").text(demoUrl, 48, 734, { width: 310 });
  doc.image(qrPng, 445, 684, { width: 92 });
});

await writeFile(
  path.join(outDir, "README.txt"),
  `Jvision 美業預約營運平台素材\n\nDemo URL: ${demoUrl}\n\n檔案：\n- jvision-self-care-platform-poster.svg\n- jvision-self-care-platform-poster.png\n- jvision-self-care-platform-poster.pdf\n- jvision-self-care-platform-product-introduction.pdf\n`,
  "utf8",
);

console.log(`Assets created in ${outDir}`);
