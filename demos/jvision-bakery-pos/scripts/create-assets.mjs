import { copyFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import sharp from "sharp";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) args.set(process.argv[i], process.argv[i + 1]);

const demoUrl = args.get("--url") || process.env.DEMO_URL || "https://jvision-bakery-pos.vercel.app";
const projectRoot = "D:/code01/projects/jvision-bakery-pos";
const projectName = "Jvision烘焙POS與前店後廠管理";
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
<rect width="1240" height="1754" fill="#FFF7ED"/>
<rect x="70" y="70" width="1100" height="1614" rx="34" fill="#FFFFFF" stroke="#FED7AA" stroke-width="2"/>
<rect x="108" y="112" width="214" height="70" rx="12" fill="#FFFFFF"/>
<text x="108" y="266" fill="#F97316" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30" font-weight="700">Jvision Bakery POS</text>
<text x="108" y="356" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="66" font-weight="800">烘焙 POS 與前店後廠管理</text>
<text x="108" y="442" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="44" font-weight="800">門市結帳、禮盒預購、產銷排程與庫存一次整合</text>
<text x="108" y="526" fill="#667085" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">適合麵包店、甜點店、中央廚房與多門市烘焙品牌。</text>
<text x="108" y="574" fill="#667085" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">掃描 QR Code 可立即進入線上 Demo。</text>

<rect x="108" y="650" width="1024" height="380" rx="28" fill="#1F2A37"/>
<rect x="158" y="706" width="292" height="240" rx="22" fill="#FFFFFF"/>
<rect x="474" y="706" width="292" height="240" rx="22" fill="#FFF4EC"/>
<rect x="790" y="706" width="292" height="240" rx="22" fill="#FFFFFF"/>
<text x="190" y="782" fill="#F97316" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">門市 POS</text>
<text x="190" y="850" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">快速結帳</text>
<text x="190" y="908" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">會員優惠</text>
<text x="506" y="782" fill="#F97316" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">禮盒預購</text>
<text x="506" y="850" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">自由組合</text>
<text x="506" y="908" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">分批取貨</text>
<text x="822" y="782" fill="#F97316" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">前店後廠</text>
<text x="822" y="850" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">生產入庫</text>
<text x="822" y="908" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">報廢扣料</text>

<text x="108" y="1126" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="38" font-weight="800">Demo 測試重點</text>
<text x="108" y="1192" fill="#667085" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">新增烘焙商品、建立禮盒預購、更新庫存與今日銷售。</text>
<text x="108" y="1278" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="38" font-weight="800">掃描 QR Code 立即體驗 Demo</text>
<text x="108" y="1338" fill="#667085" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">${demoUrl}</text>
<rect x="852" y="1138" width="280" height="280" rx="24" fill="#FFFFFF" stroke="#FED7AA" stroke-width="2"/>
<rect x="872" y="1158" width="240" height="240" fill="#FFFFFF"/>
<text x="892" y="1464" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="20" font-weight="800">掃描進入 Demo</text>
<rect x="108" y="1574" width="486" height="4" fill="#F97316"/>
<text x="108" y="1632" fill="#667085" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="24">Jvision AI | 烘焙 POS 互動展示</text>
</svg>`;

const posterSvgPath = path.join(outDir, "jvision-bakery-pos-poster.svg");
const posterPngPath = path.join(outDir, "jvision-bakery-pos-poster.png");
const posterPdfPath = path.join(outDir, "jvision-bakery-pos-poster.pdf");
const introPdfPath = path.join(outDir, "jvision-bakery-pos-product-introduction.pdf");

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
    { input: renderedQr, left: 872, top: 1158 },
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
  doc.font("bold").fontSize(28).fillColor("#1F2A37").text("Jvision 烘焙 POS 與前店後廠管理", 48, 132);
  doc.font("bold").fontSize(18).text("門市結帳、禮盒預購、產銷排程與庫存一次整合", 48, 174);
  doc.font("regular").fontSize(13).fillColor("#667085").text(
    "Jvision 協助麵包店、甜點店、中央廚房與多門市烘焙品牌，把門市 POS、禮盒預購、庫存、產銷排程、報廢扣料與銷售摘要整合在同一個工作台。",
    48,
    226,
    { width: 480, lineGap: 8 },
  );
  doc.roundedRect(48, 318, 498, 210, 14).fill("#1F2A37");
  doc.fillColor("#FFFFFF").font("bold").fontSize(22).text("Demo 可測試功能", 78, 350);
  doc.font("regular").fontSize(14).text("1. 新增商品與門市銷售", 78, 404);
  doc.text("2. 建立禮盒預購與分批取貨", 78, 436);
  doc.text("3. 更新庫存、報廢扣料與銷售摘要", 78, 468);
  doc.roundedRect(345, 570, 160, 160, 10).stroke("#FED7AA");
  doc.image(qrPng, 355, 580, { width: 140 });
  doc.fillColor("#1F2A37").font("bold").fontSize(18).text("掃描進入 Demo", 48, 584);
  doc.fillColor("#667085").font("regular").fontSize(10).text(demoUrl, 48, 620, { width: 260 });
});

await createPdf(introPdfPath, (doc) => {
  doc.image(logoBuffer, 48, 42, { width: 120 });
  doc.font("bold").fontSize(24).fillColor("#1F2A37").text("Jvision 烘焙 POS 與前店後廠管理", 48, 120);
  doc.font("regular").fontSize(12).fillColor("#667085").text(
    "這是一個可互動展示的烘焙門市與前店後廠管理 Demo，整合門市 POS、商品銷售、禮盒預購、庫存入出、報廢扣料、中央廚房產銷排程與 AI 銷售摘要。",
    48,
    168,
    { width: 500, lineGap: 7 },
  );
  const sections = [
    ["門市 POS", "快速結帳、會員優惠、商品銷售與今日營收統計。"],
    ["禮盒預購", "管理節慶禮盒、自由組合、預訂數量與分批取貨。"],
    ["前店後廠", "同步生產入庫、庫存安全量、報廢扣料與待補貨提醒。"],
    ["AI 摘要", "彙整熱銷商品、庫存風險與當日營運重點，協助店長快速決策。"],
  ];
  let y = 245;
  for (const [title, text] of sections) {
    doc.roundedRect(48, y, 500, 84, 8).stroke("#FED7AA");
    doc.font("bold").fontSize(15).fillColor("#F97316").text(title, 68, y + 16);
    doc.font("regular").fontSize(11).fillColor("#667085").text(text, 68, y + 42, { width: 455, lineGap: 5 });
    y += 106;
  }
  doc.font("bold").fontSize(16).fillColor("#1F2A37").text("線上 Demo", 48, 708);
  doc.font("regular").fontSize(10).fillColor("#667085").text(demoUrl, 48, 734, { width: 310 });
  doc.image(qrPng, 445, 684, { width: 92 });
});

await writeFile(
  path.join(outDir, "README.txt"),
  `Jvision 烘焙 POS 與前店後廠管理\n\nDemo URL: ${demoUrl}\n\n檔案：\n- jvision-bakery-pos-poster.svg\n- jvision-bakery-pos-poster.png\n- jvision-bakery-pos-poster.pdf\n- jvision-bakery-pos-product-introduction.pdf\n`,
  "utf8",
);

await copyFile(posterPngPath, path.join(assetsDir, "poster.png"));
await copyFile(posterPngPath, path.join(publicDir, "jvision-bakery-pos-poster.png"));
await copyFile(posterPdfPath, path.join(publicDir, "jvision-bakery-pos-poster.pdf"));
await copyFile(introPdfPath, path.join(publicDir, "jvision-bakery-pos-product-introduction.pdf"));
await copyFile(posterSvgPath, path.join(docsDir, "jvision-bakery-pos-poster.svg"));
await copyFile(posterPngPath, path.join(docsDir, "jvision-bakery-pos-poster.png"));
await copyFile(posterPdfPath, path.join(docsDir, "jvision-bakery-pos-poster.pdf"));
await copyFile(introPdfPath, path.join(docsDir, "jvision-bakery-pos-product-introduction.pdf"));
await copyFile(path.join(outDir, "README.txt"), path.join(docsDir, "README.txt"));

console.log(`Assets created in ${outDir}`);
