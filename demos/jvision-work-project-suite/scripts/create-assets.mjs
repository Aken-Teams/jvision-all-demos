import { copyFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import sharp from "sharp";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) args.set(process.argv[i], process.argv[i + 1]);

const demoUrl = args.get("--url") || process.env.DEMO_URL || "https://jvision-work-project-suite.vercel.app";
const projectRoot = "D:/code01/projects/jvision-work-project-suite";
const projectName = "Jvision工作與專案管理平台";
const outDir = args.get("--out") || `D:/code/image/說明文件/${projectName}`;
const assetsDir = path.join(projectRoot, "assets");
const docsDir = path.join(projectRoot, "docs/marketing");
const publicDir = path.join(projectRoot, "public");
const logoUrl = "https://www.jvision-ai.com/public/logo.png";
const fontRegular = "C:/Windows/Fonts/kaiu.ttf";
const fontBold = "C:/Windows/Fonts/simsunb.ttf";

await mkdir(outDir, { recursive: true });
await mkdir(assetsDir, { recursive: true });
await mkdir(docsDir, { recursive: true });
await mkdir(publicDir, { recursive: true });

const logoBuffer = Buffer.from(await (await fetch(logoUrl)).arrayBuffer());
const qrPng = Buffer.from((await QRCode.toDataURL(demoUrl, { margin: 1, width: 360 })).split(",")[1], "base64");

const posterSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1240" height="1754" viewBox="0 0 1240 1754" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="1240" height="1754" fill="#F5EEE7"/>
<rect x="70" y="70" width="1100" height="1614" rx="34" fill="#FFFFFF" stroke="#DEDEE3" stroke-width="2"/>
<rect x="108" y="112" width="214" height="70" rx="12" fill="#FFFFFF"/>
<text x="108" y="266" fill="#FF6B5F" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30" font-weight="700">Jvision Work &amp; Project Suite</text>
<text x="108" y="356" fill="#20212A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="66" font-weight="800">工作與專案管理平台</text>
<text x="108" y="442" fill="#20212A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="44" font-weight="800">專案、任務、目標、工時與 AI 摘要一次整合</text>
<text x="108" y="526" fill="#667085" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">整合專案排程、任務看板、目標追蹤、工時負荷與 AI 摘要，讓跨部門協作更清楚。</text>
<text x="108" y="574" fill="#667085" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30"></text>

<rect x="108" y="650" width="1024" height="380" rx="28" fill="#20212A"/>
<rect x="158" y="706" width="292" height="240" rx="22" fill="#FFFFFF"/>
<rect x="474" y="706" width="292" height="240" rx="22" fill="#FFF4EC"/>
<rect x="790" y="706" width="292" height="240" rx="22" fill="#FFFFFF"/>
<text x="190" y="782" fill="#6D5DFC" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">專案排程</text>
<text x="190" y="850" fill="#20212A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">里程碑</text>
<text x="190" y="908" fill="#20212A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">交付風險</text>
<text x="506" y="782" fill="#6D5DFC" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">任務看板</text>
<text x="506" y="850" fill="#20212A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">待辦追蹤</text>
<text x="506" y="908" fill="#20212A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">狀態推進</text>
<text x="822" y="782" fill="#6D5DFC" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">AI 摘要</text>
<text x="822" y="850" fill="#20212A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">工作負荷</text>
<text x="822" y="908" fill="#20212A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">下一步建議</text>

<text x="108" y="1126" fill="#20212A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="38" font-weight="800">Demo 測試重點</text>
<text x="108" y="1192" fill="#667085" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">新增任務、推進看板、平衡工時與 AI 摘要。</text>
<text x="108" y="1278" fill="#20212A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="38" font-weight="800">掃描 QR Code 立即體驗 Demo</text>
<text x="108" y="1338" fill="#667085" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">${demoUrl}</text>
<rect x="852" y="1138" width="280" height="280" rx="24" fill="#FFFFFF" stroke="#DEDEE3" stroke-width="2"/>
<rect x="872" y="1158" width="240" height="240" fill="#FFFFFF"/>
<text x="892" y="1464" fill="#20212A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="20" font-weight="800">掃描進入 Demo</text>
<rect x="108" y="1574" width="486" height="4" fill="#FF6B5F"/>
<text x="108" y="1632" fill="#667085" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="24">Jvision AI | 工作與專案管理整合展示</text>
</svg>`;

const posterSvgPath = path.join(outDir, "jvision-work-project-suite-poster.svg");
const posterPngPath = path.join(outDir, "jvision-work-project-suite-poster.png");
const posterPdfPath = path.join(outDir, "jvision-work-project-suite-poster.pdf");
const introPdfPath = path.join(outDir, "jvision-work-project-suite-product-introduction.pdf");

await writeFile(posterSvgPath, posterSvg, "utf8");
const renderedLogo = await sharp(logoBuffer).resize({ width: 180, height: 52, fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } }).png().toBuffer();
const renderedQr = await sharp(qrPng).resize({ width: 240, height: 240, fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } }).png().toBuffer();
await sharp(Buffer.from(posterSvg))
  .composite([{ input: renderedLogo, left: 125, top: 121 }, { input: renderedQr, left: 872, top: 1158 }])
  .png()
  .toFile(posterPngPath);

function createPdf(filePath, render) {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ size: "A4", margin: 48, bufferPages: true });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", async () => {
      await writeFile(filePath, Buffer.concat(chunks));
      resolve();
    });
    doc.registerFont("regular", fontRegular);
    doc.registerFont("bold", fontBold);
    render(doc);
    doc.end();
  });
}

await createPdf(posterPdfPath, (doc) => {
  doc.image(logoBuffer, 48, 42, { width: 130 });
  doc.font("bold").fontSize(28).fillColor("#20212A").text("Jvision 工作與專案管理平台", 48, 132);
  doc.font("bold").fontSize(18).text("專案、任務、目標、工時與 AI 摘要一次整合", 48, 174);
  doc.font("regular").fontSize(13).fillColor("#667085").text(
    "這個整合版 Demo 將專案管理、任務管理與工作管理平台合併，保留原本三個專案，並新增可互動的工作流程展示。",
    48,
    226,
    { width: 480, lineGap: 8 },
  );
  doc.roundedRect(48, 318, 498, 210, 14).fill("#20212A");
  doc.fillColor("#FFFFFF").font("bold").fontSize(22).text("Demo 可測試", 78, 350);
  doc.font("regular").fontSize(14).text("1. 新增任務並查看看板", 78, 404);
  doc.text("2. 推進任務狀態與工時變化", 78, 436);
  doc.text("3. 更新目標並產生 AI 摘要", 78, 468);
  doc.roundedRect(345, 570, 160, 160, 10).stroke("#DEDEE3");
  doc.image(qrPng, 355, 580, { width: 140 });
  doc.fillColor("#20212A").font("bold").fontSize(18).text("掃描進入 Demo", 48, 584);
  doc.fillColor("#667085").font("regular").fontSize(10).text(demoUrl, 48, 620, { width: 260 });
});

await createPdf(introPdfPath, (doc) => {
  doc.image(logoBuffer, 48, 42, { width: 120 });
  doc.font("bold").fontSize(24).fillColor("#20212A").text("Jvision 工作與專案管理平台", 48, 120);
  doc.font("regular").fontSize(12).fillColor("#667085").text(
    "此平台整合專案排程、任務看板、工作負荷、目標追蹤、自動化提醒與 AI 摘要，讓主管與團隊可以在同一個畫面掌握工作進度。",
    48,
    168,
    { width: 500, lineGap: 7 },
  );
  const sections = [
    ["專案排程", "管理里程碑、截止日與交付風險。"],
    ["任務看板", "用狀態欄位追蹤待辦、進行中、審核與完成。"],
    ["工作負荷", "看見成員工時分布，降低過度集中。"],
    ["AI 摘要", "整理高風險任務、延期原因與下一步建議。"],
  ];
  let y = 245;
  for (const [title, text] of sections) {
    doc.roundedRect(48, y, 500, 84, 8).stroke("#DEDEE3");
    doc.font("bold").fontSize(15).fillColor("#6D5DFC").text(title, 68, y + 16);
    doc.font("regular").fontSize(11).fillColor("#667085").text(text, 68, y + 42, { width: 455, lineGap: 5 });
    y += 106;
  }
  doc.font("bold").fontSize(16).fillColor("#20212A").text("線上 Demo", 48, 708);
  doc.font("regular").fontSize(10).fillColor("#667085").text(demoUrl, 48, 734, { width: 310 });
  doc.image(qrPng, 445, 684, { width: 92 });
});

await writeFile(path.join(outDir, "README.txt"), `Jvision 工作與專案管理平台\n\nDemo URL: ${demoUrl}\n\n檔案：\n- jvision-work-project-suite-poster.svg\n- jvision-work-project-suite-poster.png\n- jvision-work-project-suite-poster.pdf\n- jvision-work-project-suite-product-introduction.pdf\n`, "utf8");

await copyFile(posterPngPath, path.join(assetsDir, "poster.png"));
for (const dir of [docsDir, publicDir]) {
  await copyFile(posterSvgPath, path.join(dir, "jvision-work-project-suite-poster.svg"));
  await copyFile(posterPngPath, path.join(dir, "jvision-work-project-suite-poster.png"));
  await copyFile(posterPdfPath, path.join(dir, "jvision-work-project-suite-poster.pdf"));
  await copyFile(introPdfPath, path.join(dir, "jvision-work-project-suite-product-introduction.pdf"));
}
await copyFile(path.join(outDir, "README.txt"), path.join(docsDir, "README.txt"));

console.log(`Assets created in ${outDir}`);
