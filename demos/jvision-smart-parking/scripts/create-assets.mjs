import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import sharp from "sharp";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) args.set(process.argv[i], process.argv[i + 1]);

const demoUrl = args.get("--url") || process.env.DEMO_URL || "https://jvision-smart-parking.vercel.app";
const outDir = args.get("--out") || "D:/code/image/說明文件/jvision-smart-parking";
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
<rect width="1240" height="1754" fill="#F6F8FB"/>
<rect x="70" y="70" width="1100" height="1614" rx="34" fill="#FFFFFF" stroke="#DDE7F0" stroke-width="2"/>
<image href="${logoUrl}" x="108" y="112" width="214" height="60" preserveAspectRatio="xMinYMid meet"/>
<text x="108" y="266" fill="#F97316" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30" font-weight="700">Jvision Intelligent Parking System</text>
<text x="108" y="356" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="70" font-weight="800">智慧停車場管理 Demo</text>
<text x="108" y="442" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="52" font-weight="800">車牌辨識、車位導引、安全監控</text>
<text x="108" y="526" fill="#667085" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">整合 AI 尋車、空車位偵測、EV 地鎖、VIP 訪客車位與安全事件。</text>
<text x="108" y="574" fill="#667085" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">掃描 QR Code 可直接進入線上互動 Demo。</text>
<rect x="108" y="672" width="1024" height="420" rx="28" fill="#1F2A37"/>
<rect x="158" y="728" width="292" height="280" rx="22" fill="#FFFFFF"/>
<rect x="474" y="728" width="292" height="280" rx="22" fill="#FFF4EC"/>
<rect x="790" y="728" width="292" height="280" rx="22" fill="#FFFFFF"/>
<text x="190" y="806" fill="#F97316" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">車牌辨識</text>
<text x="190" y="874" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">進出管制</text>
<text x="190" y="932" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">照片留存</text>
<text x="506" y="806" fill="#F97316" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">空位導引</text>
<text x="506" y="874" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">AI 偵測</text>
<text x="506" y="932" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">EV 地鎖</text>
<text x="822" y="806" fill="#F97316" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">安全事件</text>
<text x="822" y="874" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">違規火警</text>
<text x="822" y="932" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">徘徊遺留物</text>
<text x="108" y="1192" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="38" font-weight="800">適用情境</text>
<text x="108" y="1260" fill="#667085" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">公共停車場、住宅社區、商辦大樓、工廠、醫院、飯店與遊樂場。</text>
<text x="108" y="1352" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="38" font-weight="800">掃描 QR Code 進入 Demo</text>
<text x="108" y="1410" fill="#667085" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">${demoUrl}</text>
<rect x="852" y="1238" width="280" height="280" rx="24" fill="#FFFFFF" stroke="#DDE7F0" stroke-width="2"/>
<g transform="translate(867 1253)">${qrInner}</g>
<rect x="108" y="1574" width="486" height="4" fill="#F97316"/>
<text x="108" y="1632" fill="#667085" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="24">Jvision AI | 智慧停車場管理互動展示</text>
</svg>`;

await writeFile(path.join(outDir, "jvision-smart-parking-poster.svg"), posterSvg, "utf8");
await sharp(Buffer.from(posterSvg)).png().toFile(path.join(outDir, "jvision-smart-parking-poster.png"));

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

await createPdf("jvision-smart-parking-poster.pdf", (doc) => {
  doc.image(logoBuffer, 48, 42, { width: 130 });
  doc.font("bold").fontSize(30).fillColor("#1F2A37").text("Jvision 智慧停車場管理 Demo", 48, 132);
  doc.font("bold").fontSize(21).text("車牌辨識、車位導引、安全監控", 48, 174);
  doc.font("regular").fontSize(13).fillColor("#667085").text(
    "Jvision 結合車牌辨識、AI 空車位偵測、智慧地鎖、訪客預約、VIP 車位與安全事件監控，協助停車場提升進出效率與安全管理。",
    48,
    226,
    { width: 480, lineGap: 8 },
  );
  doc.roundedRect(48, 318, 498, 210, 14).fill("#1F2A37");
  doc.fillColor("#FFFFFF").font("bold").fontSize(22).text("Demo 可測試功能", 78, 350);
  doc.font("regular").fontSize(14).text("1. 新增車牌辨識進出紀錄", 78, 404);
  doc.text("2. 更新車位狀態與 EV 地鎖", 78, 436);
  doc.text("3. 建立安全事件並產生營運指標", 78, 468);
  doc.roundedRect(345, 570, 160, 160, 10).stroke("#DDE7F0");
  doc.image(qrPng, 355, 580, { width: 140 });
  doc.fillColor("#1F2A37").font("bold").fontSize(18).text("掃描進入 Demo", 48, 584);
  doc.fillColor("#667085").font("regular").fontSize(10).text(demoUrl, 48, 620, { width: 260 });
});

await createPdf("jvision-smart-parking-product-introduction.pdf", (doc) => {
  doc.image(logoBuffer, 48, 42, { width: 120 });
  doc.font("bold").fontSize(24).fillColor("#1F2A37").text("Jvision 智慧停車場管理產品介紹", 48, 120);
  doc.font("regular").fontSize(12).fillColor("#667085").text(
    "Jvision 智慧停車場管理平台適合公共停車場、住宅社區、商辦大樓、工廠、醫院、飯店與遊樂場使用。系統整合車牌辨識、空車位偵測、EV 地鎖、訪客/VIP 車位、AI 尋車與安全事件管理。",
    48,
    168,
    { width: 500, lineGap: 7 },
  );
  const sections = [
    ["核心模組", "AI 尋車、空車位偵測、車位導引、一位多車、車牌辨識、EV 地鎖、VIP/訪客車位與安全監控。"],
    ["互動 Demo", "可新增車輛進出、查詢空位、開啟或關閉電動車位地鎖、預約訪客車位、建立安全事件與查看營運指標。"],
    ["管理價值", "提升進出效率、降低找車時間、控管特殊車位，並即時追蹤違規停車、火警與徘徊等事件。"],
    ["適合對象", "公共停車場、住宅社區、商辦大樓、工廠園區、醫院、飯店旅館、遊樂場與車輛進出管制場域。"],
  ];
  let y = 245;
  for (const [title, text] of sections) {
    doc.roundedRect(48, y, 500, 84, 8).stroke("#DDE7F0");
    doc.font("bold").fontSize(15).fillColor("#F97316").text(title, 68, y + 16);
    doc.font("regular").fontSize(11).fillColor("#667085").text(text, 68, y + 42, { width: 455, lineGap: 5 });
    y += 106;
  }
  doc.font("bold").fontSize(16).fillColor("#1F2A37").text("線上展示", 48, 708);
  doc.font("regular").fontSize(10).fillColor("#667085").text(demoUrl, 48, 734, { width: 310 });
  doc.image(qrPng, 445, 684, { width: 92 });
});

await writeFile(
  path.join(outDir, "README.txt"),
  `Jvision 智慧停車場管理素材\n\nDemo URL: ${demoUrl}\n\n檔案：\n- jvision-smart-parking-poster.svg\n- jvision-smart-parking-poster.png\n- jvision-smart-parking-poster.pdf\n- jvision-smart-parking-product-introduction.pdf\n`,
  "utf8",
);

console.log(`Assets created in ${outDir}`);
