import { mkdir, readFile, writeFile, copyFile } from "node:fs/promises";
import path from "node:path";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import sharp from "sharp";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) args.set(process.argv[i], process.argv[i + 1]);

const demoUrl = args.get("--url") || process.env.DEMO_URL || "https://jvision-hris.vercel.app";
const projectName = "Jvision人資薪酬招募管理平台";
const projectRoot = "D:/code01/projects/jvision-hris";
const publicDir = path.join(projectRoot, "public");
const docsDir = path.join(projectRoot, "docs/marketing");
const outDir = args.get("--out") || `D:/code/image/說明文件/${projectName}`;
const logoBuffer = await readFile(path.join(publicDir, "logo.png"));
const qrPng = await QRCode.toBuffer(demoUrl, {
  margin: 1,
  width: 320,
  color: { dark: "#173326", light: "#ffffff" },
});

await mkdir(outDir, { recursive: true });
await mkdir(publicDir, { recursive: true });
await mkdir(docsDir, { recursive: true });

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1240" height="1754" viewBox="0 0 1240 1754" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="hero" x1="96" y1="112" x2="1100" y2="702" gradientUnits="userSpaceOnUse">
      <stop stop-color="#12392D"/>
      <stop offset="0.55" stop-color="#1D6B4F"/>
      <stop offset="1" stop-color="#D7EC75"/>
    </linearGradient>
  </defs>
  <rect width="1240" height="1754" fill="#F3FAEF"/>
  <rect x="78" y="78" width="1084" height="1598" rx="36" fill="#FFFDF7" stroke="#D9E4D8" stroke-width="2"/>
  <rect x="126" y="124" width="988" height="420" rx="28" fill="url(#hero)"/>
  <rect x="166" y="164" width="220" height="72" rx="14" fill="#FFFFFF"/>
  <text x="166" y="306" fill="#D7EC75" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30" font-weight="800">Jvision People Platform</text>
  <text x="166" y="388" fill="#FFFFFF" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="62" font-weight="900">人資薪酬招募管理平台</text>
  <text x="166" y="466" fill="#FFFFFF" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="34" font-weight="800">員工名冊、招募流程、薪資試算一次整合</text>

  <text x="126" y="650" fill="#173326" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="38" font-weight="900">完整 Demo 可直接體驗</text>
  <text x="126" y="710" fill="#66766C" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">從人員資料到招募、薪資與請假核准，讓 HR 工作流程清楚可追蹤。</text>

  <rect x="126" y="800" width="300" height="210" rx="22" fill="#F0F9ED" stroke="#D9E4D8"/>
  <rect x="470" y="800" width="300" height="210" rx="22" fill="#FFF6DF" stroke="#EEDDBD"/>
  <rect x="814" y="800" width="300" height="210" rx="22" fill="#F0F9ED" stroke="#D9E4D8"/>
  <text x="166" y="876" fill="#1D6B4F" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30" font-weight="900">員工名冊</text>
  <text x="166" y="934" fill="#455466" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="23">建立人員主檔</text>
  <text x="166" y="972" fill="#455466" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="23">同步假別與薪資</text>
  <text x="510" y="876" fill="#B7791F" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30" font-weight="900">招募薪酬</text>
  <text x="510" y="934" fill="#455466" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="23">推進候選人流程</text>
  <text x="510" y="972" fill="#455466" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="23">試算薪資與獎金</text>
  <text x="854" y="876" fill="#1D6B4F" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30" font-weight="900">AI 摘要</text>
  <text x="854" y="934" fill="#455466" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="23">整理人員狀態</text>
  <text x="854" y="972" fill="#455466" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="23">提示優先任務</text>

  <text x="126" y="1160" fill="#173326" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="38" font-weight="900">掃描 QR Code 立即體驗 Demo</text>
  <text x="126" y="1222" fill="#66766C" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="25">用手機掃描即可開啟線上展示，快速體驗主要功能流程。</text>
  <text x="126" y="1284" fill="#66766C" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="22">${demoUrl}</text>
  <rect x="794" y="1118" width="320" height="320" rx="24" fill="#FFFFFF" stroke="#D9E4D8" stroke-width="2"/>

  <rect x="126" y="1502" width="520" height="5" fill="#1D6B4F"/>
  <text x="126" y="1570" fill="#173326" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="28" font-weight="900">Jvision AI Demo 系列</text>
  <text x="126" y="1620" fill="#66766C" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="23">把人資日常流程轉成可測試、可追蹤、可提案的智慧工作台。</text>
</svg>`;

const posterSvg = path.join(outDir, "jvision-hris-poster.svg");
const posterPng = path.join(outDir, "jvision-hris-poster.png");
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

await createPdf("jvision-hris-product-introduction.pdf", (doc) => {
  doc.image(logoBuffer, 44, 38, { width: 120 });
  doc.font("bold").fontSize(24).fillColor("#173326").text("Jvision 人資薪酬招募管理平台", 44, 112);
  doc.font("regular").fontSize(12).fillColor("#66766C").text(
    "這是一套可互動展示的 HRIS Demo，整合員工名冊、招募流程、入職任務、薪資試算、請假核准與 AI 人資摘要。前台可直接新增員工、推進候選人、試算薪資、核准請假並查看人資營運摘要，適合展示人資數位化流程。",
    44,
    152,
    { width: 500, lineGap: 6 },
  );

  const sections = [
    ["員工主檔", "新增員工姓名、職稱、部門、狀態、薪資與假別資料。"],
    ["招募流程", "候選人從履歷篩選、面試安排到錄取簽核集中追蹤。"],
    ["薪資請假", "即時試算月薪資與獎金池，並核准請假更新剩餘假別。"],
    ["AI 摘要", "彙整人數、薪資、招募與優先待辦，協助 HR 快速決策。"],
  ];

  let y = 248;
  for (const [title, text] of sections) {
    doc.roundedRect(44, y, 500, 78, 10).stroke("#D9E4D8");
    doc.font("bold").fontSize(15).fillColor("#1D6B4F").text(title, 64, y + 15);
    doc.font("regular").fontSize(11).fillColor("#66766C").text(text, 64, y + 42, { width: 455, lineGap: 4 });
    y += 96;
  }

  doc.font("bold").fontSize(16).fillColor("#173326").text("Demo 網址", 44, 650);
  doc.font("regular").fontSize(10).fillColor("#66766C").text(demoUrl, 44, 676, { width: 300 });
  doc.roundedRect(390, 626, 120, 120, 8).stroke("#D9E4D8");
  doc.image(qrPng, 400, 636, { width: 100 });
});

await createPdf("jvision-hris-poster.pdf", (doc) => {
  doc.image(posterPng, 44, 28, { width: 508 });
});

for (const dir of [publicDir, docsDir]) {
  await copyFile(posterPng, path.join(dir, "jvision-hris-poster.png"));
  await copyFile(path.join(outDir, "jvision-hris-poster.pdf"), path.join(dir, "jvision-hris-poster.pdf"));
  await copyFile(path.join(outDir, "jvision-hris-product-introduction.pdf"), path.join(dir, "jvision-hris-product-introduction.pdf"));
}

await writeFile(
  path.join(outDir, "README.txt"),
  `Jvision 人資薪酬招募管理平台\n\nDemo URL: ${demoUrl}\n\n檔案：\n- jvision-hris-poster.png\n- jvision-hris-poster.pdf\n- jvision-hris-product-introduction.pdf\n`,
  "utf8",
);

await copyFile(path.join(outDir, "README.txt"), path.join(docsDir, "README.txt"));

console.log(`Assets created in ${outDir}`);
