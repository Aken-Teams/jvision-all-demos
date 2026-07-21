import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import sharp from "sharp";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) args.set(process.argv[i], process.argv[i + 1]);

const demoUrl = args.get("--url") || process.env.DEMO_URL || "https://jvision-sqm.vercel.app";
const outDir = args.get("--out") || "D:/code/image/說明文件/jvision-sqm";
const logoUrl = "https://www.jvision-ai.com/public/logo.png";
const fontRegular = "C:/Windows/Fonts/kaiu.ttf";
const fontBold = "C:/Windows/Fonts/simsunb.ttf";

await mkdir(outDir, { recursive: true });

const qrSvgRaw = await QRCode.toString(demoUrl, {
  type: "svg",
  margin: 1,
  width: 250,
  color: { dark: "#18212F", light: "#ffffff" },
});
const qrPng = Buffer.from((await QRCode.toDataURL(demoUrl, { margin: 1, width: 360 })).split(",")[1], "base64");
const logoBuffer = Buffer.from(await (await fetch(logoUrl)).arrayBuffer());
const qrInner = qrSvgRaw.replace(/<\?xml.*?\?>/, "").replace(/<svg[^>]*>/, "").replace("</svg>", "");

const posterSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1240" height="1754" viewBox="0 0 1240 1754" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="1240" height="1754" fill="#F5F8FC"/>
<rect x="70" y="70" width="1100" height="1614" rx="34" fill="#FFFFFF" stroke="#DFE6EE" stroke-width="2"/>
<image href="${logoUrl}" x="108" y="112" width="214" height="60" preserveAspectRatio="xMinYMid meet"/>
<text x="108" y="266" fill="#2563EB" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30" font-weight="700">Jvision Supplier Quality Management</text>
<text x="108" y="356" fill="#18212F" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="70" font-weight="800">供應商品質管理 Demo</text>
<text x="108" y="442" fill="#18212F" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="52" font-weight="800">採購、品保、倉儲與供應商同步協作</text>
<text x="108" y="526" fill="#687282" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">整合採購收料、IQC 檢驗、供應商文件、綠色資料與評鑑稽核。</text>
<text x="108" y="574" fill="#687282" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">掃描 QR Code 可直接進入線上互動 Demo。</text>
<rect x="108" y="672" width="1024" height="420" rx="28" fill="#18212F"/>
<rect x="158" y="728" width="292" height="280" rx="22" fill="#FFFFFF"/>
<rect x="474" y="728" width="292" height="280" rx="22" fill="#EEF6FF"/>
<rect x="790" y="728" width="292" height="280" rx="22" fill="#FFFFFF"/>
<text x="190" y="806" fill="#2563EB" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">IQC 檢驗</text>
<text x="190" y="874" fill="#18212F" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">批次判定</text>
<text x="190" y="932" fill="#18212F" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">MRB 追蹤</text>
<text x="506" y="806" fill="#2563EB" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">文件補件</text>
<text x="506" y="874" fill="#18212F" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">RoHS / COA</text>
<text x="506" y="932" fill="#18212F" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">到期提醒</text>
<text x="822" y="806" fill="#2563EB" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">供應商評鑑</text>
<text x="822" y="874" fill="#18212F" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">QCDST 分數</text>
<text x="822" y="932" fill="#18212F" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">稽核改善</text>
<text x="108" y="1192" fill="#18212F" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="38" font-weight="800">適用情境</text>
<text x="108" y="1260" fill="#687282" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">製造業中心廠、電子零組件、機構件、材料供應商與需要進料品質控管的團隊。</text>
<text x="108" y="1352" fill="#18212F" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="38" font-weight="800">掃描 QR Code 進入 Demo</text>
<text x="108" y="1410" fill="#687282" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">${demoUrl}</text>
<rect x="852" y="1238" width="280" height="280" rx="24" fill="#FFFFFF" stroke="#DFE6EE" stroke-width="2"/>
<g transform="translate(867 1253)">${qrInner}</g>
<rect x="108" y="1574" width="486" height="4" fill="#2563EB"/>
<text x="108" y="1632" fill="#687282" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="24">Jvision AI | 供應商品質管理互動展示</text>
</svg>`;

await writeFile(path.join(outDir, "jvision-sqm-poster.svg"), posterSvg, "utf8");
await sharp(Buffer.from(posterSvg)).png().toFile(path.join(outDir, "jvision-sqm-poster.png"));

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

await createPdf("jvision-sqm-poster.pdf", (doc) => {
  doc.image(logoBuffer, 48, 42, { width: 130 });
  doc.font("bold").fontSize(30).fillColor("#18212F").text("Jvision 供應商品質管理 Demo", 48, 132);
  doc.font("bold").fontSize(21).text("採購、品保、倉儲與供應商同步協作", 48, 174);
  doc.font("regular").fontSize(13).fillColor("#687282").text(
    "Jvision 將供應商建檔、採購收料、IQC 進料檢驗、文件補件、綠色產品資料與評鑑稽核整合在同一個平台，讓品質風險可以被看見、被提醒、被追蹤。",
    48,
    226,
    { width: 480, lineGap: 8 },
  );
  doc.roundedRect(48, 318, 498, 210, 14).fill("#18212F");
  doc.fillColor("#FFFFFF").font("bold").fontSize(22).text("Demo 可測試功能", 78, 350);
  doc.font("regular").fontSize(14).text("1. 新增供應商並更新狀態", 78, 404);
  doc.text("2. 新增進料批次並進行 IQC 判定", 78, 436);
  doc.text("3. 通知文件補件與安排供應商稽核", 78, 468);
  doc.roundedRect(345, 570, 160, 160, 10).stroke("#DFE6EE");
  doc.image(qrPng, 355, 580, { width: 140 });
  doc.fillColor("#18212F").font("bold").fontSize(18).text("掃描進入 Demo", 48, 584);
  doc.fillColor("#687282").font("regular").fontSize(10).text(demoUrl, 48, 620, { width: 260 });
});

await createPdf("jvision-sqm-product-introduction.pdf", (doc) => {
  doc.image(logoBuffer, 48, 42, { width: 120 });
  doc.font("bold").fontSize(24).fillColor("#18212F").text("Jvision 供應商品質管理產品介紹", 48, 120);
  doc.font("regular").fontSize(12).fillColor("#687282").text(
    "Jvision 供應商品質管理平台協助中心廠把供應商資料、採購收料、進料檢驗、文件管理、綠色產品資料與供應商評鑑串成完整流程，降低人工追蹤成本並提升供應鏈品質透明度。",
    48,
    168,
    { width: 500, lineGap: 7 },
  );
  const sections = [
    ["核心模組", "供應商資格、料號對照、採購收料、IQC 檢驗、MRB 審查、文件補件、綠色產品資料、QCDST 評鑑。"],
    ["互動 Demo", "可新增供應商、更新檢驗判定、通知文件補件、安排稽核，並即時更新管理儀表板。"],
    ["管理價值", "降低進料風險、加速異常改善、減少郵件往返，讓供應商與中心廠共用同一份進度。"],
    ["適合對象", "製造業中心廠、電子零組件、機構件、材料供應商，以及重視進料品質與文件合規的團隊。"],
  ];
  let y = 245;
  for (const [title, text] of sections) {
    doc.roundedRect(48, y, 500, 84, 8).stroke("#DFE6EE");
    doc.font("bold").fontSize(15).fillColor("#2563EB").text(title, 68, y + 16);
    doc.font("regular").fontSize(11).fillColor("#687282").text(text, 68, y + 42, { width: 455, lineGap: 5 });
    y += 106;
  }
  doc.font("bold").fontSize(16).fillColor("#18212F").text("線上展示", 48, 708);
  doc.font("regular").fontSize(10).fillColor("#687282").text(demoUrl, 48, 734, { width: 310 });
  doc.image(qrPng, 445, 684, { width: 92 });
});

await writeFile(
  path.join(outDir, "README.txt"),
  `Jvision 供應商品質管理素材\n\nDemo URL: ${demoUrl}\n\n檔案：\n- jvision-sqm-poster.svg\n- jvision-sqm-poster.pdf\n- jvision-sqm-product-introduction.pdf\n`,
  "utf8",
);

console.log(`Assets created in ${outDir}`);
