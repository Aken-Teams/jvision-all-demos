import { copyFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import sharp from "sharp";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) args.set(process.argv[i], process.argv[i + 1]);

const demoUrl = args.get("--url") || process.env.DEMO_URL || "https://jvision-education-care.vercel.app";
const projectRoot = "D:/code01/projects/jvision-education-care";
const projectName = "Jvision幼教園務與安親管理平台";
const outDir = args.get("--out") || `D:/code/image/說明文件/${projectName}`;
const assetsDir = path.join(projectRoot, "assets");
const docsDir = path.join(projectRoot, "docs/marketing");
const logoUrl = "https://www.jvision-ai.com/public/logo.png";
const fontRegular = "C:/Windows/Fonts/kaiu.ttf";
const fontBold = "C:/Windows/Fonts/simsunb.ttf";

await mkdir(outDir, { recursive: true });
await mkdir(assetsDir, { recursive: true });
await mkdir(docsDir, { recursive: true });

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
<rect width="1240" height="1754" fill="#F5FBFF"/>
<rect x="70" y="70" width="1100" height="1614" rx="34" fill="#FFFFFF" stroke="#DDE7F0" stroke-width="2"/>
<rect x="108" y="112" width="214" height="70" rx="12" fill="#FFFFFF"/>
<text x="108" y="266" fill="#2563EB" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30" font-weight="700">Jvision Education Operations</text>
<text x="108" y="356" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="68" font-weight="800">幼教園務與安親管理平台</text>
<text x="108" y="442" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="44" font-weight="800">招生、排課、出勤接送、收費與聯絡簿一次整合</text>
<text x="108" y="526" fill="#667085" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">適合幼兒園、安親班、補習班、托育中心與課後照顧單位。</text>
<text x="108" y="574" fill="#667085" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">掃描 QR Code 可立即進入線上 Demo。</text>
<rect x="108" y="672" width="1024" height="420" rx="28" fill="#1F2A37"/>
<rect x="158" y="728" width="292" height="280" rx="22" fill="#FFFFFF"/>
<rect x="474" y="728" width="292" height="280" rx="22" fill="#EAF6FF"/>
<rect x="790" y="728" width="292" height="280" rx="22" fill="#FFFFFF"/>
<text x="190" y="806" fill="#2563EB" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">學童名冊</text>
<text x="190" y="874" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">班級、家長</text>
<text x="190" y="932" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">照護注意事項</text>
<text x="506" y="806" fill="#2563EB" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">出勤接送</text>
<text x="506" y="874" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">到校、請假</text>
<text x="506" y="932" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">放學接送確認</text>
<text x="822" y="806" fill="#2563EB" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">聯絡簿收費</text>
<text x="822" y="874" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">家長通知</text>
<text x="822" y="932" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">應收款提醒</text>
<text x="108" y="1192" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="38" font-weight="800">Demo 測試重點</text>
<text x="108" y="1260" fill="#667085" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">新增學童、變更到校狀態、建立課程、</text>
<text x="108" y="1308" fill="#667085" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">發送聯絡簿與繳費提醒。</text>
<text x="108" y="1352" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="38" font-weight="800">掃描 QR Code 進入 Demo</text>
<text x="108" y="1410" fill="#667085" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">${demoUrl}</text>
<rect x="852" y="1238" width="280" height="280" rx="24" fill="#FFFFFF" stroke="#DDE7F0" stroke-width="2"/>
<rect x="872" y="1258" width="240" height="240" fill="#FFFFFF"/>
<rect x="108" y="1574" width="486" height="4" fill="#2563EB"/>
<text x="108" y="1632" fill="#667085" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="24">Jvision AI | 幼教園務與安親管理 Demo 素材</text>
</svg>`;

const posterSvgPath = path.join(outDir, "jvision-education-care-poster.svg");
const posterPngPath = path.join(outDir, "jvision-education-care-poster.png");
const posterPdfPath = path.join(outDir, "jvision-education-care-poster.pdf");
const introPdfPath = path.join(outDir, "jvision-education-care-product-introduction.pdf");

await writeFile(posterSvgPath, posterSvg, "utf8");
const renderedLogo = await sharp(logoBuffer)
  .resize({ width: 180, height: 52, fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
  .png()
  .toBuffer();
const renderedQr = await sharp(qrPng)
  .resize({ width: 240, height: 240, fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
  .png()
  .toBuffer();

await sharp(Buffer.from(posterSvg))
  .composite([
    { input: renderedLogo, left: 125, top: 121 },
    { input: renderedQr, left: 872, top: 1258 },
  ])
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
  doc.font("bold").fontSize(30).fillColor("#1F2A37").text("Jvision 幼教園務與安親管理平台", 48, 132);
  doc.font("bold").fontSize(19).text("招生、排課、出勤接送、收費與聯絡簿一次整合", 48, 174);
  doc.font("regular").fontSize(13).fillColor("#667085").text(
    "Jvision 協助幼兒園、安親班、補習班與課後照顧中心，把招生追蹤、學童名冊、出勤接送、班級排課、收費提醒、家長通知與 AI 摘要整合在同一個工作台。",
    48,
    226,
    { width: 480, lineGap: 8 },
  );
  doc.roundedRect(48, 318, 498, 210, 14).fill("#1F2A37");
  doc.fillColor("#FFFFFF").font("bold").fontSize(22).text("Demo 可測試功能", 78, 350);
  doc.font("regular").fontSize(14).text("1. 新增學童並建立家長與班級資料", 78, 404);
  doc.text("2. 更新到校、請假與接送狀態", 78, 436);
  doc.text("3. 發送聯絡簿、接送提醒與繳費通知", 78, 468);
  doc.roundedRect(345, 570, 160, 160, 10).stroke("#DDE7F0");
  doc.image(qrPng, 355, 580, { width: 140 });
  doc.fillColor("#1F2A37").font("bold").fontSize(18).text("掃描進入 Demo", 48, 584);
  doc.fillColor("#667085").font("regular").fontSize(10).text(demoUrl, 48, 620, { width: 260 });
});

await createPdf(introPdfPath, (doc) => {
  doc.image(logoBuffer, 48, 42, { width: 120 });
  doc.font("bold").fontSize(24).fillColor("#1F2A37").text("Jvision 幼教園務與安親管理平台", 48, 120);
  doc.font("regular").fontSize(12).fillColor("#667085").text(
    "這是一個可互動展示的幼教與安親營運管理 Demo，整合招生 CRM、學童名冊、排課出勤、接送確認、收費提醒、電子聯絡簿、人事薪資與 AI 園務摘要。適合幼兒園、安親班、補習班、托育中心與課後照顧單位。",
    48,
    168,
    { width: 500, lineGap: 7 },
  );
  const sections = [
    ["招生與名冊", "記錄家長諮詢、試讀、報名、學童資料、班級與照護注意事項。"],
    ["班務與接送", "管理課表、老師、教室、出勤、請假、到校與放學接送確認。"],
    ["收費與通知", "追蹤月費、材料費、逾期款項，並快速發送家長通知。"],
    ["AI 園務摘要", "整理今日出勤、未收款、聯絡簿與待處理事項，協助主任快速掌握重點。"],
  ];
  let y = 245;
  for (const [title, text] of sections) {
    doc.roundedRect(48, y, 500, 84, 8).stroke("#DDE7F0");
    doc.font("bold").fontSize(15).fillColor("#2563EB").text(title, 68, y + 16);
    doc.font("regular").fontSize(11).fillColor("#667085").text(text, 68, y + 42, { width: 455, lineGap: 5 });
    y += 106;
  }
  doc.font("bold").fontSize(16).fillColor("#1F2A37").text("線上 Demo", 48, 708);
  doc.font("regular").fontSize(10).fillColor("#667085").text(demoUrl, 48, 734, { width: 310 });
  doc.image(qrPng, 445, 684, { width: 92 });
});

await writeFile(
  path.join(outDir, "README.txt"),
  `Jvision 幼教園務與安親管理平台\n\nDemo URL: ${demoUrl}\n\n檔案：\n- jvision-education-care-poster.svg\n- jvision-education-care-poster.png\n- jvision-education-care-poster.pdf\n- jvision-education-care-product-introduction.pdf\n`,
  "utf8",
);

await copyFile(posterPngPath, path.join(assetsDir, "poster.png"));
await copyFile(posterSvgPath, path.join(docsDir, "jvision-education-care-poster.svg"));
await copyFile(posterPngPath, path.join(docsDir, "jvision-education-care-poster.png"));
await copyFile(posterPdfPath, path.join(docsDir, "jvision-education-care-poster.pdf"));
await copyFile(introPdfPath, path.join(docsDir, "jvision-education-care-product-introduction.pdf"));
await copyFile(path.join(outDir, "README.txt"), path.join(docsDir, "README.txt"));

console.log(`Assets created in ${outDir}`);
