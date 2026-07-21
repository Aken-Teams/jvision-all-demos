import { mkdir, readFile, writeFile, copyFile, rm } from "node:fs/promises";
import path from "node:path";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import sharp from "sharp";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) args.set(process.argv[i], process.argv[i + 1]);

const demoUrl = args.get("--url") || process.env.DEMO_URL || "https://jvision-event-wedding.vercel.app";
const projectName = "Jvision活動會展與婚禮場地管理平台";
const projectRoot = "D:/code01/projects/jvision-event-wedding";
const publicDir = path.join(projectRoot, "public");
const docsDir = path.join(projectRoot, "docs/marketing");
const outDir = args.get("--out") || `D:/code/image/說明文件/${projectName}`;
const logoBuffer = await readFile(path.join(publicDir, "logo.png"));
const qrPng = await QRCode.toBuffer(demoUrl, {
  margin: 1,
  width: 320,
  color: { dark: "#252236", light: "#ffffff" },
});

await mkdir(outDir, { recursive: true });
await mkdir(publicDir, { recursive: true });
await mkdir(docsDir, { recursive: true });

for (const file of [
  "jvision-hris-poster.png",
  "jvision-hris-poster.pdf",
  "jvision-hris-product-introduction.pdf",
]) {
  await rm(path.join(publicDir, file), { force: true });
  await rm(path.join(docsDir, file), { force: true });
}

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1240" height="1754" viewBox="0 0 1240 1754" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="hero" x1="100" y1="120" x2="1120" y2="610" gradientUnits="userSpaceOnUse">
      <stop stop-color="#2D2544"/>
      <stop offset="0.55" stop-color="#A85B6B"/>
      <stop offset="1" stop-color="#F9735A"/>
    </linearGradient>
  </defs>
  <rect width="1240" height="1754" fill="#F7F1EE"/>
  <rect x="78" y="78" width="1084" height="1598" rx="36" fill="#FFFDFB" stroke="#EADDE4" stroke-width="2"/>
  <rect x="126" y="124" width="988" height="410" rx="28" fill="url(#hero)"/>
  <rect x="166" y="164" width="220" height="72" rx="14" fill="#FFFFFF"/>
  <text x="166" y="304" fill="#FFD7A8" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30" font-weight="800">Jvision Event Planning</text>
  <text x="166" y="384" fill="#FFFFFF" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="62" font-weight="900">活動會展與婚禮場地管理平台</text>
  <text x="166" y="462" fill="#FFFFFF" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="34" font-weight="800">詢價、檔期、報價合約、訂金付款一次整合</text>

  <text x="126" y="646" fill="#252236" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="38" font-weight="900">完整 Demo 可直接體驗，AI 摘要與流程看板一次完成</text>
  <text x="126" y="708" fill="#6F6879" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">適合婚禮顧問、宴會場地、活動公司、外燴團隊與企業活動管理。</text>

  <rect x="126" y="800" width="300" height="210" rx="22" fill="#FFF0EC" stroke="#EADDE4"/>
  <rect x="470" y="800" width="300" height="210" rx="22" fill="#F4F8FB" stroke="#DDE9F0"/>
  <rect x="814" y="800" width="300" height="210" rx="22" fill="#FFF6DF" stroke="#F2E1C6"/>
  <text x="166" y="876" fill="#A85B6B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30" font-weight="900">詢價報價</text>
  <text x="166" y="934" fill="#455466" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="23">建立客戶需求</text>
  <text x="166" y="972" fill="#455466" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="23">產生報價與訂金建議</text>
  <text x="510" y="876" fill="#2A7195" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30" font-weight="900">檔期任務</text>
  <text x="510" y="934" fill="#455466" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="23">追蹤桌次、菜單</text>
  <text x="510" y="972" fill="#455466" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="23">供應商與待辦事項</text>
  <text x="854" y="876" fill="#A85B6B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30" font-weight="900">AI 摘要</text>
  <text x="854" y="934" fill="#455466" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="23">整理案件狀態</text>
  <text x="854" y="972" fill="#455466" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="23">提醒優先處理事項</text>

  <text x="126" y="1160" fill="#252236" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="38" font-weight="900">掃描 QR Code 立即進入 Demo</text>
  <text x="126" y="1222" fill="#6F6879" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">用手機或平板也能操作，直接測試詢價、報價、任務與 AI 摘要。</text>
  <text x="126" y="1284" fill="#6F6879" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="22">${demoUrl}</text>
  <rect x="794" y="1118" width="320" height="320" rx="24" fill="#FFFFFF" stroke="#EADDE4" stroke-width="2"/>

  <rect x="126" y="1502" width="520" height="5" fill="#A85B6B"/>
  <text x="126" y="1570" fill="#252236" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="28" font-weight="900">Jvision AI Demo 系列</text>
  <text x="126" y="1620" fill="#6F6879" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="23">把活動籌備流程轉成可測試、可追蹤、可提案的智慧工作台。</text>
</svg>`;

const posterSvg = path.join(outDir, "jvision-event-wedding-poster.svg");
const posterPng = path.join(outDir, "jvision-event-wedding-poster.png");
const posterPdf = path.join(outDir, "jvision-event-wedding-poster.pdf");
const productPdf = path.join(outDir, "jvision-event-wedding-product-introduction.pdf");
await writeFile(posterSvg, svg, "utf8");

const renderedLogo = await sharp(logoBuffer)
  .resize({ width: 188, height: 54, fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
  .png()
  .toBuffer();

await sharp(Buffer.from(svg))
  .composite([
    { input: renderedLogo, left: 182, top: 174 },
    { input: qrPng, left: 794, top: 1118 },
  ])
  .png()
  .toFile(posterPng);

function createPdf(filePath, render) {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ size: "A4", margin: 44 });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", async () => {
      await writeFile(filePath, Buffer.concat(chunks));
      resolve();
    });
    doc.registerFont("regular", "C:/Windows/Fonts/kaiu.ttf");
    doc.registerFont("bold", "C:/Windows/Fonts/simsunb.ttf");
    render(doc);
    doc.end();
  });
}

await createPdf(productPdf, (doc) => {
  doc.image(logoBuffer, 44, 38, { width: 120 });
  doc.font("bold").fontSize(24).fillColor("#252236").text("Jvision 活動會展與婚禮場地管理平台", 44, 112);
  doc.font("regular").fontSize(12).fillColor("#6F6879").text(
    "這是一個可互動展示的活動籌備 Demo，整合客戶詢價、檔期、報價合約、訂金付款、賓客桌次、籌備任務與 AI 摘要。適合婚禮顧問、宴會場地、活動公司、外燴團隊與企業活動管理情境。",
    44,
    152,
    { width: 500, lineGap: 6 },
  );

  const sections = [
    ["銷售與詢價", "記錄客戶需求、活動類型、日期、人數與預算，快速建立報價流程。"],
    ["活動籌備", "追蹤桌次、菜單、供應商、流程與任務，降低活動前溝通遺漏。"],
    ["付款合約", "把報價單、合約簽核、訂金與尾款提醒放在同一個工作台。"],
    ["AI 摘要", "自動彙整案件狀態、營收、人數與待辦任務，協助團隊掌握優先順序。"],
  ];

  let y = 248;
  for (const [title, text] of sections) {
    doc.roundedRect(44, y, 500, 78, 10).stroke("#EADDE4");
    doc.font("bold").fontSize(15).fillColor("#A85B6B").text(title, 64, y + 15);
    doc.font("regular").fontSize(11).fillColor("#6F6879").text(text, 64, y + 42, { width: 455, lineGap: 4 });
    y += 96;
  }

  doc.font("bold").fontSize(16).fillColor("#252236").text("Demo 網址", 44, 650);
  doc.font("regular").fontSize(10).fillColor("#6F6879").text(demoUrl, 44, 676, { width: 300 });
  doc.roundedRect(390, 626, 120, 120, 8).stroke("#EADDE4");
  doc.image(qrPng, 400, 636, { width: 100 });
});

await createPdf(posterPdf, (doc) => {
  doc.image(posterPng, 44, 28, { width: 508 });
});

for (const dir of [publicDir, docsDir]) {
  await copyFile(posterPng, path.join(dir, "jvision-event-wedding-poster.png"));
  await copyFile(posterPdf, path.join(dir, "jvision-event-wedding-poster.pdf"));
  await copyFile(productPdf, path.join(dir, "jvision-event-wedding-product-introduction.pdf"));
}

await writeFile(
  path.join(outDir, "README.txt"),
  `Jvision 活動會展與婚禮場地管理平台\n\nDemo URL: ${demoUrl}\n\n檔案：\n- jvision-event-wedding-poster.png\n- jvision-event-wedding-poster.pdf\n- jvision-event-wedding-product-introduction.pdf\n`,
  "utf8",
);

await copyFile(path.join(outDir, "README.txt"), path.join(docsDir, "README.txt"));

console.log(`Assets created in ${outDir}`);
