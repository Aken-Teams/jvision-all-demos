import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

const projectName = "Jvision 招牌店務與工單管理平台";
const slug = "jvision-sign-shop-management";
const demoUrl = process.env.DEMO_URL || "https://jvision-sign-shop-management.vercel.app";
const outDir = "D:/code/image/說明文件/Jvision 招牌店務與工單管理平台";
const publicDir = path.join(process.cwd(), "public", "marketing");
const docsDir = path.join(process.cwd(), "docs", "marketing");
const assetsDir = path.join(process.cwd(), "assets");
const logoUrl = "https://www.jvision-ai.com/public/logo.png";

for (const dir of [outDir, publicDir, docsDir, assetsDir]) {
  fs.mkdirSync(dir, { recursive: true });
}

const logoBuffer = Buffer.from(await fetch(logoUrl).then((res) => res.arrayBuffer()));
const logoDataUrl = `data:image/png;base64,${logoBuffer.toString("base64")}`;
const qrDataUrl = await QRCode.toDataURL(demoUrl, {
  width: 360,
  margin: 1,
  color: { dark: "#182231", light: "#ffffff" },
});

const posterSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1080" height="1530" viewBox="0 0 1080 1530" xmlns="http://www.w3.org/2000/svg">
  <rect width="1080" height="1530" fill="#eef6ff"/>
  <rect x="72" y="72" width="936" height="1386" rx="32" fill="#ffffff" stroke="#dbe5f1" stroke-width="2"/>
  <rect x="108" y="108" width="864" height="292" rx="26" fill="#111d2e"/>
  <rect x="136" y="136" width="220" height="78" rx="12" fill="#ffffff"/>
  <image href="${logoDataUrl}" x="148" y="150" width="190" height="50" preserveAspectRatio="xMidYMid meet"/>
  <text x="140" y="270" fill="#59d3ff" font-size="28" font-family="Arial, Microsoft JhengHei" font-weight="800">Jvision Sign Shop</text>
  <text x="140" y="334" fill="#ffffff" font-size="56" font-family="Arial, Microsoft JhengHei" font-weight="900">招牌店務與工單管理平台</text>
  <text x="108" y="470" fill="#182231" font-size="38" font-family="Arial, Microsoft JhengHei" font-weight="900">線索跟進、報價模板、製作工單與安裝排程一次整合</text>
  <text x="108" y="528" fill="#5d6c81" font-size="25" font-family="Arial, Microsoft JhengHei">完整 Demo 可新增案件、推進流程、上傳檔案並生成 AI 店務摘要。</text>
  <rect x="108" y="612" width="864" height="250" rx="24" fill="#f3f8fc" stroke="#dbe5f1" stroke-width="2"/>
  <rect x="150" y="668" width="210" height="136" rx="16" fill="#ffffff"/>
  <rect x="435" y="668" width="210" height="136" rx="16" fill="#fff4ec"/>
  <rect x="720" y="668" width="210" height="136" rx="16" fill="#ffffff"/>
  <text x="185" y="718" fill="#1d65f2" font-size="28" font-family="Arial, Microsoft JhengHei" font-weight="900">接案報價</text>
  <text x="185" y="768" fill="#182231" font-size="22" font-family="Arial, Microsoft JhengHei">模板估價</text>
  <text x="185" y="805" fill="#182231" font-size="22" font-family="Arial, Microsoft JhengHei">毛利控管</text>
  <text x="470" y="718" fill="#ff7a2f" font-size="28" font-family="Arial, Microsoft JhengHei" font-weight="900">工單看板</text>
  <text x="470" y="768" fill="#182231" font-size="22" font-family="Arial, Microsoft JhengHei">製作進度</text>
  <text x="470" y="805" fill="#182231" font-size="22" font-family="Arial, Microsoft JhengHei">安裝排程</text>
  <text x="755" y="718" fill="#0ea5b7" font-size="28" font-family="Arial, Microsoft JhengHei" font-weight="900">檔案管理</text>
  <text x="755" y="768" fill="#182231" font-size="22" font-family="Arial, Microsoft JhengHei">設計稿</text>
  <text x="755" y="805" fill="#182231" font-size="22" font-family="Arial, Microsoft JhengHei">施工照片</text>
  <text x="108" y="948" fill="#182231" font-size="40" font-family="Arial, Microsoft JhengHei" font-weight="900">掃描 QR Code 立即體驗 Demo</text>
  <text x="108" y="1006" fill="#5d6c81" font-size="25" font-family="Arial, Microsoft JhengHei">手機掃描即可開啟線上 Demo。</text>
  <text x="108" y="1070" fill="#5d6c81" font-size="22" font-family="Arial">${demoUrl}</text>
  <rect x="700" y="918" width="236" height="236" rx="20" fill="#ffffff" stroke="#dbe5f1" stroke-width="2"/>
  <image href="${qrDataUrl}" x="724" y="942" width="188" height="188"/>
  <text x="723" y="1190" fill="#182231" font-size="22" font-family="Arial, Microsoft JhengHei" font-weight="800">掃描進入 Demo</text>
  <line x1="108" y1="1268" x2="510" y2="1268" stroke="#1d65f2" stroke-width="4"/>
  <text x="108" y="1340" fill="#182231" font-size="32" font-family="Arial, Microsoft JhengHei" font-weight="900">Jvision AI Demo 系列</text>
  <text x="108" y="1394" fill="#5d6c81" font-size="24" font-family="Arial, Microsoft JhengHei">讓業務、設計、製作與安裝團隊同步掌握每一件招牌工程。</text>
</svg>`;

const svgPath = path.join(outDir, `${slug}-poster.svg`);
const pngPath = path.join(outDir, `${slug}-poster.png`);
const posterPdfPath = path.join(outDir, `${slug}-poster.pdf`);
const introPdfPath = path.join(outDir, `${slug}-product-introduction.pdf`);
fs.writeFileSync(svgPath, posterSvg, "utf8");

const sharp = await import("sharp").catch(() => null);
if (sharp?.default) {
  await sharp.default(Buffer.from(posterSvg)).png().toFile(pngPath);
} else {
  fs.writeFileSync(pngPath, Buffer.from(posterSvg));
}

function makePdf(filePath, title, subtitle, bullets) {
  return new Promise((resolve, reject) => {
  const doc = new PDFDocument({ size: "A4", margin: 48 });
  const stream = fs.createWriteStream(filePath);
  stream.on("finish", resolve);
  stream.on("error", reject);
  doc.pipe(stream);
  doc.font("Helvetica-Bold").fontSize(24).fillColor("#182231").text(title);
  doc.moveDown(0.5);
  doc.font("Helvetica").fontSize(12).fillColor("#5d6c81").text(subtitle, { lineGap: 6 });
  doc.moveDown(1.2);
  doc.font("Helvetica-Bold").fontSize(15).fillColor("#1d65f2").text("Demo URL");
  doc.font("Helvetica").fontSize(11).fillColor("#182231").text(demoUrl);
  doc.moveDown(1.2);
  doc.font("Helvetica-Bold").fontSize(15).fillColor("#1d65f2").text("Key Capabilities");
  bullets.forEach((bullet) => {
    doc.moveDown(0.45);
    doc.font("Helvetica").fontSize(12).fillColor("#182231").text(`- ${bullet}`, { lineGap: 5 });
  });
  doc.moveDown(1.5);
  doc.image(logoBuffer, 48, 690, { width: 130 });
  doc.image(Buffer.from(qrDataUrl.split(",")[1], "base64"), 390, 630, { width: 130 });
  doc.end();
  });
}

await makePdf(posterPdfPath, projectName, "Sign shop operations demo with quote templates, job boards, file storage and AI summaries.", [
  "Lead follow-up and customer record tracking",
  "Quoting templates with revenue and margin visibility",
  "Production and installation workflow board",
  "Centralized artwork, photos and job documents",
  "AI shop summary for high-priority follow-up",
]);

await makePdf(introPdfPath, `${projectName} 產品介紹`, "A practical Jvision demo for sign shops, print shops, vehicle wrap teams and installation crews.", [
  "Manage each sign job from lead to delivery",
  "Keep sales, design, production and installation aligned",
  "Attach files and notes directly to each job",
  "Use AI summaries to spot overdue quotes and bottlenecks",
]);

const readme = `${projectName}

Demo: ${demoUrl}

檔案內容：
- ${slug}-poster.png
- ${slug}-poster.pdf
- ${slug}-product-introduction.pdf
`;
fs.writeFileSync(path.join(outDir, "README.txt"), readme, "utf8");

for (const [source, target] of [
  [pngPath, path.join(publicDir, `${slug}-poster.png`)],
  [introPdfPath, path.join(publicDir, `${slug}-product-introduction.pdf`)],
  [pngPath, path.join(assetsDir, "poster.png")],
  [pngPath, path.join(docsDir, `${slug}-poster.png`)],
  [posterPdfPath, path.join(docsDir, `${slug}-poster.pdf`)],
  [introPdfPath, path.join(docsDir, `${slug}-product-introduction.pdf`)],
]) {
  fs.copyFileSync(source, target);
}

console.log(`Assets created in ${outDir}`);
