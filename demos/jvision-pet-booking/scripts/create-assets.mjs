import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import sharp from "sharp";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) args.set(process.argv[i], process.argv[i + 1]);

const demoUrl = args.get("--url") || process.env.DEMO_URL || "https://jvision-pet-booking.vercel.app";
const outDir = args.get("--out") || "D:/code/image/說明文件/jvision-pet-booking";
const logoUrl = "https://www.jvision-ai.com/public/logo.png";
const fontRegular = "C:/Windows/Fonts/kaiu.ttf";
const fontBold = "C:/Windows/Fonts/simsunb.ttf";

await mkdir(outDir, { recursive: true });

const qrSvgRaw = await QRCode.toString(demoUrl, {
  type: "svg",
  margin: 1,
  width: 250,
  color: { dark: "#263040", light: "#ffffff" },
});
const qrPng = Buffer.from((await QRCode.toDataURL(demoUrl, { margin: 1, width: 360 })).split(",")[1], "base64");
const logoBuffer = Buffer.from(await (await fetch(logoUrl)).arrayBuffer());
const qrInner = qrSvgRaw.replace(/<\?xml.*?\?>/, "").replace(/<svg[^>]*>/, "").replace("</svg>", "");

const posterSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1240" height="1754" viewBox="0 0 1240 1754" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="1240" height="1754" fill="#FFF7F5"/>
<rect x="70" y="70" width="1100" height="1614" rx="34" fill="#FFFFFF" stroke="#E5E9F2" stroke-width="2"/>
<image href="${logoUrl}" x="108" y="112" width="214" height="60" preserveAspectRatio="xMinYMid meet"/>
<text x="108" y="266" fill="#F97379" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30" font-weight="700">Jvision Pet Service Booking</text>
<text x="108" y="356" fill="#263040" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="70" font-weight="800">寵物服務預約 Demo</text>
<text x="108" y="442" fill="#263040" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="52" font-weight="800">旅館、安親、美容、課程一頁完成</text>
<text x="108" y="526" fill="#6F7787" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">整合線上預約、商品加購、入住排房、照護紀錄與家長通知。</text>
<text x="108" y="574" fill="#6F7787" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">掃描 QR Code 可直接進入線上互動 Demo。</text>
<rect x="108" y="672" width="1024" height="420" rx="28" fill="#263040"/>
<rect x="158" y="728" width="292" height="280" rx="22" fill="#FFFFFF"/>
<rect x="474" y="728" width="292" height="280" rx="22" fill="#FFF0ED"/>
<rect x="790" y="728" width="292" height="280" rx="22" fill="#FFFFFF"/>
<text x="190" y="806" fill="#F97379" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">線上預約</text>
<text x="190" y="874" fill="#263040" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">服務時段</text>
<text x="190" y="932" fill="#263040" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">毛孩資料</text>
<text x="506" y="806" fill="#F97379" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">商品加購</text>
<text x="506" y="874" fill="#263040" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">鮮食 / 玩具</text>
<text x="506" y="932" fill="#263040" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">同步結帳</text>
<text x="822" y="806" fill="#F97379" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">照護通知</text>
<text x="822" y="874" fill="#263040" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">入住狀態</text>
<text x="822" y="932" fill="#263040" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">家長訊息</text>
<text x="108" y="1192" fill="#263040" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="38" font-weight="800">適用情境</text>
<text x="108" y="1260" fill="#6F7787" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">寵物旅館、寵物安親、寵物美容、寵物課程、寵物日托與小型照護門市。</text>
<text x="108" y="1352" fill="#263040" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="38" font-weight="800">掃描 QR Code 進入 Demo</text>
<text x="108" y="1410" fill="#6F7787" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">${demoUrl}</text>
<rect x="852" y="1238" width="280" height="280" rx="24" fill="#FFFFFF" stroke="#E5E9F2" stroke-width="2"/>
<g transform="translate(867 1253)">${qrInner}</g>
<rect x="108" y="1574" width="486" height="4" fill="#F97379"/>
<text x="108" y="1632" fill="#6F7787" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="24">Jvision AI | 寵物服務預約互動展示</text>
</svg>`;

await writeFile(path.join(outDir, "jvision-pet-booking-poster.svg"), posterSvg, "utf8");
await sharp(Buffer.from(posterSvg)).png().toFile(path.join(outDir, "jvision-pet-booking-poster.png"));

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

await createPdf("jvision-pet-booking-poster.pdf", (doc) => {
  doc.image(logoBuffer, 48, 42, { width: 130 });
  doc.font("bold").fontSize(30).fillColor("#263040").text("Jvision 寵物服務預約 Demo", 48, 132);
  doc.font("bold").fontSize(21).text("旅館、安親、美容、課程一頁完成", 48, 174);
  doc.font("regular").fontSize(13).fillColor("#6F7787").text(
    "Jvision 協助寵物服務門市整合線上預約、商品加購、入住排房、照護紀錄與家長通知，讓每一次預約與照護都有清楚紀錄。",
    48,
    226,
    { width: 480, lineGap: 8 },
  );
  doc.roundedRect(48, 318, 498, 210, 14).fill("#263040");
  doc.fillColor("#FFFFFF").font("bold").fontSize(22).text("Demo 可測試功能", 78, 350);
  doc.font("regular").fontSize(14).text("1. 建立寵物服務預約", 78, 404);
  doc.text("2. 加購商品並同步統計營收", 78, 436);
  doc.text("3. 更新入住狀態與家長通知紀錄", 78, 468);
  doc.roundedRect(345, 570, 160, 160, 10).stroke("#E5E9F2");
  doc.image(qrPng, 355, 580, { width: 140 });
  doc.fillColor("#263040").font("bold").fontSize(18).text("掃描進入 Demo", 48, 584);
  doc.fillColor("#6F7787").font("regular").fontSize(10).text(demoUrl, 48, 620, { width: 260 });
});

await createPdf("jvision-pet-booking-product-introduction.pdf", (doc) => {
  doc.image(logoBuffer, 48, 42, { width: 120 });
  doc.font("bold").fontSize(24).fillColor("#263040").text("Jvision 寵物服務預約產品介紹", 48, 120);
  doc.font("regular").fontSize(12).fillColor("#6F7787").text(
    "Jvision 寵物服務預約平台適合寵物旅館、安親、美容、課程與日托服務使用。系統將一頁式預約、商品加購、入住排房、照護紀錄與家長通知整合在同一個流程，減少人工確認與訊息遺漏。",
    48,
    168,
    { width: 500, lineGap: 7 },
  );
  const sections = [
    ["核心模組", "服務方案、時段預約、毛孩資料、家長聯絡、商品加購、入住排房、照護通知與營運儀表板。"],
    ["互動 Demo", "可新增預約、更新狀態、加入商品、產生照護通知，並即時查看預約數、入住數與預估營收。"],
    ["管理價值", "讓前台、照護人員與家長訊息同步，降低漏單、重複確認與照護備註遺失。"],
    ["適合對象", "寵物旅館、寵物安親、寵物美容、寵物訓練課程、日托與複合式寵物服務門市。"],
  ];
  let y = 245;
  for (const [title, text] of sections) {
    doc.roundedRect(48, y, 500, 84, 8).stroke("#E5E9F2");
    doc.font("bold").fontSize(15).fillColor("#F97379").text(title, 68, y + 16);
    doc.font("regular").fontSize(11).fillColor("#6F7787").text(text, 68, y + 42, { width: 455, lineGap: 5 });
    y += 106;
  }
  doc.font("bold").fontSize(16).fillColor("#263040").text("線上展示", 48, 708);
  doc.font("regular").fontSize(10).fillColor("#6F7787").text(demoUrl, 48, 734, { width: 310 });
  doc.image(qrPng, 445, 684, { width: 92 });
});

await writeFile(
  path.join(outDir, "README.txt"),
  `Jvision 寵物服務預約素材\n\nDemo URL: ${demoUrl}\n\n檔案：\n- jvision-pet-booking-poster.svg\n- jvision-pet-booking-poster.png\n- jvision-pet-booking-poster.pdf\n- jvision-pet-booking-product-introduction.pdf\n`,
  "utf8",
);

console.log(`Assets created in ${outDir}`);
