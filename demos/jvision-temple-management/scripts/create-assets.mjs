import { mkdir, readFile, writeFile, copyFile } from "node:fs/promises";
import path from "node:path";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import sharp from "sharp";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) args.set(process.argv[i], process.argv[i + 1]);

const demoUrl = args.get("--url") || process.env.DEMO_URL || "https://jvision-temple-management.vercel.app";
const outDir = args.get("--out") || "D:/code/image/說明文件/Jvision智慧廟務管理";
const publicDir = "D:/code01/projects/jvision-temple-management/public";
const logoBuffer = await readFile(path.join(publicDir, "logo.png"));
const qrPng = await QRCode.toBuffer(demoUrl, {
  margin: 1,
  width: 300,
  color: { dark: "#122336", light: "#ffffff" },
});

await mkdir(outDir, { recursive: true });
await mkdir(publicDir, { recursive: true });

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1240" height="1754" viewBox="0 0 1240 1754" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="hero" x1="92" y1="96" x2="1110" y2="920" gradientUnits="userSpaceOnUse">
      <stop stop-color="#0F8F7A"/>
      <stop offset="1" stop-color="#D39A3F"/>
    </linearGradient>
  </defs>
  <rect width="1240" height="1754" fill="#F7FBF7"/>
  <rect x="78" y="78" width="1084" height="1598" rx="36" fill="#FFFFFF" stroke="#DDE8E0" stroke-width="2"/>
  <rect x="126" y="124" width="988" height="442" rx="28" fill="url(#hero)"/>
  <rect x="166" y="164" width="220" height="72" rx="14" fill="#FFFFFF"/>
  <text x="166" y="320" fill="#EAFBF5" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30" font-weight="800">Jvision Temple Operations</text>
  <text x="166" y="402" fill="#FFFFFF" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="66" font-weight="900">智慧廟務管理平台</text>
  <text x="166" y="478" fill="#FFFFFF" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="36" font-weight="800">信眾、點燈、法會、收據與 LINE 通知一次完成</text>
  <text x="126" y="666" fill="#16212F" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="38" font-weight="900">Demo 測試重點</text>
  <text x="126" y="728" fill="#68768A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">從櫃檯受理到日結入帳，讓宮廟日常流程清楚可追蹤。</text>
  <rect x="126" y="802" width="300" height="210" rx="22" fill="#F3FBF7" stroke="#DDE8E0"/>
  <rect x="470" y="802" width="300" height="210" rx="22" fill="#FFF8E8" stroke="#EEDDBD"/>
  <rect x="814" y="802" width="300" height="210" rx="22" fill="#F3FBF7" stroke="#DDE8E0"/>
  <text x="166" y="878" fill="#0F8F7A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30" font-weight="900">櫃檯登記</text>
  <text x="166" y="936" fill="#455466" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="23">新增信眾、點燈與</text>
  <text x="166" y="974" fill="#455466" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="23">法會報名資料</text>
  <text x="510" y="878" fill="#B7791F" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30" font-weight="900">收據日結</text>
  <text x="510" y="936" fill="#455466" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="23">建立收據、收款狀態</text>
  <text x="510" y="974" fill="#455466" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="23">與收入分類</text>
  <text x="854" y="878" fill="#0F8F7A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30" font-weight="900">AI 摘要</text>
  <text x="854" y="936" fill="#455466" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="23">整理今日名單、提醒</text>
  <text x="854" y="974" fill="#455466" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="23">優先處理項目</text>
  <text x="126" y="1168" fill="#16212F" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="38" font-weight="900">掃描 QR Code 體驗 Demo</text>
  <text x="126" y="1230" fill="#68768A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">直接進入互動頁面，測試信眾登記、開收據與 LINE 通知。</text>
  <text x="126" y="1292" fill="#68768A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="22">${demoUrl}</text>
  <rect x="794" y="1124" width="320" height="320" rx="24" fill="#FFFFFF" stroke="#DDE8E0" stroke-width="2"/>
  <rect x="126" y="1502" width="520" height="5" fill="#0F8F7A"/>
  <text x="126" y="1570" fill="#16212F" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="28" font-weight="900">Jvision AI Demo 系列</text>
  <text x="126" y="1620" fill="#68768A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="23">把傳統宮廟服務流程變成可測試、可追蹤的智慧工作台。</text>
</svg>`;

const posterSvg = path.join(outDir, "jvision-temple-management-poster.svg");
const posterPng = path.join(outDir, "jvision-temple-management-poster.png");
await writeFile(posterSvg, svg, "utf8");

const renderedLogo = await sharp(logoBuffer)
  .resize({ width: 188, height: 54, fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
  .png()
  .toBuffer();

await sharp(Buffer.from(svg))
  .composite([
    { input: renderedLogo, left: 182, top: 174 },
    { input: qrPng, left: 804, top: 1134 },
  ])
  .png()
  .toFile(posterPng);

await copyFile(posterPng, path.join(publicDir, "jvision-temple-management-poster.png"));

function createPdf(fileName, render) {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ size: "A4", margin: 44 });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", async () => {
      await writeFile(path.join(outDir, fileName), Buffer.concat(chunks));
      resolve();
    });
    doc.registerFont("regular", "C:/Windows/Fonts/kaiu.ttf");
    doc.registerFont("bold", "C:/Windows/Fonts/simsunb.ttf");
    render(doc);
    doc.end();
  });
}

await createPdf("jvision-temple-management-product-introduction.pdf", (doc) => {
  doc.image(logoBuffer, 44, 38, { width: 120 });
  doc.font("bold").fontSize(24).fillColor("#16212F").text("Jvision 智慧廟務管理平台", 44, 112);
  doc.font("regular").fontSize(12).fillColor("#68768A").text(
    "這是一套可互動展示的宮廟營運 Demo，整合信眾資料、點燈牌位、法會活動、捐款收據、日結報表與 LINE 通知流程。前台可直接新增登記、切換信眾、開立收據並產生 AI 摘要，方便展示與提案。",
    44,
    152,
    { width: 500, lineGap: 6 },
  );
  const sections = [
    ["櫃檯受理", "快速建立信眾姓名、電話、地址、點燈項目、法會活動與收款金額。"],
    ["點燈與法會", "支援光明燈、安太歲、財利燈、文昌燈、補財庫與普渡等常見服務。"],
    ["收據與日結", "可測試開立收據、批次日結入帳與收入狀態更新。"],
    ["AI 摘要", "即時整理今日登記數、收入、待通知名單與下一步建議。"],
  ];
  let y = 248;
  for (const [title, text] of sections) {
    doc.roundedRect(44, y, 500, 78, 10).stroke("#DDE8E0");
    doc.font("bold").fontSize(15).fillColor("#0F8F7A").text(title, 64, y + 15);
    doc.font("regular").fontSize(11).fillColor("#68768A").text(text, 64, y + 42, { width: 455, lineGap: 4 });
    y += 96;
  }
  doc.font("bold").fontSize(16).fillColor("#16212F").text("Demo 網址", 44, 650);
  doc.font("regular").fontSize(10).fillColor("#68768A").text(demoUrl, 44, 676, { width: 300 });
  doc.roundedRect(390, 626, 120, 120, 8).stroke("#DDE8E0");
  doc.image(qrPng, 400, 636, { width: 100 });
});

await createPdf("jvision-temple-management-poster.pdf", (doc) => {
  doc.image(posterPng, 44, 28, { width: 508 });
});

await copyFile(path.join(outDir, "jvision-temple-management-product-introduction.pdf"), path.join(publicDir, "jvision-temple-management-product-introduction.pdf"));
await copyFile(path.join(outDir, "jvision-temple-management-poster.pdf"), path.join(publicDir, "jvision-temple-management-poster.pdf"));

await writeFile(
  path.join(outDir, "README.txt"),
  `Jvision 智慧廟務管理平台\n\nDemo URL: ${demoUrl}\n\n檔案：\n- jvision-temple-management-poster.png\n- jvision-temple-management-poster.pdf\n- jvision-temple-management-product-introduction.pdf\n`,
  "utf8",
);

console.log(`Assets created in ${outDir}`);
