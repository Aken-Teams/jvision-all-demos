import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import sharp from "sharp";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) args.set(process.argv[i], process.argv[i + 1]);

const demoUrl = args.get("--url") || process.env.DEMO_URL || "https://jvision-bakery-pos.vercel.app";
const outDir = args.get("--out") || "D:/code/image/說明文件/jvision-bakery-pos";
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
<text x="108" y="266" fill="#F97316" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30" font-weight="700">Jvision Bakery POS</text>
<text x="108" y="356" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="70" font-weight="800">烘焙 POS 管理 Demo</text>
<text x="108" y="442" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="52" font-weight="800">門市、禮盒、後廠與會員一套完成</text>
<text x="108" y="526" fill="#667085" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">整合門市收銀、禮盒預購、生產派工、入庫報廢與總部報表。</text>
<text x="108" y="574" fill="#667085" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">掃描 QR Code 可直接進入線上互動 Demo。</text>
<rect x="108" y="672" width="1024" height="420" rx="28" fill="#1F2A37"/>
<rect x="158" y="728" width="292" height="280" rx="22" fill="#FFFFFF"/>
<rect x="474" y="728" width="292" height="280" rx="22" fill="#FFF4EC"/>
<rect x="790" y="728" width="292" height="280" rx="22" fill="#FFFFFF"/>
<text x="190" y="806" fill="#F97316" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">門市 POS</text>
<text x="190" y="874" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">快速結帳</text>
<text x="190" y="932" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">會員優惠</text>
<text x="506" y="806" fill="#F97316" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">禮盒預購</text>
<text x="506" y="874" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">自由組合</text>
<text x="506" y="932" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">分批取貨</text>
<text x="822" y="806" fill="#F97316" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">前店後廠</text>
<text x="822" y="874" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">生產入庫</text>
<text x="822" y="932" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">報廢扣料</text>
<text x="108" y="1192" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="38" font-weight="800">適用情境</text>
<text x="108" y="1260" fill="#667085" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">烘焙門市、咖啡烘焙複合店、喜餅禮盒、中央工廠與連鎖品牌。</text>
<text x="108" y="1352" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="38" font-weight="800">掃描 QR Code 進入 Demo</text>
<text x="108" y="1410" fill="#667085" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">${demoUrl}</text>
<rect x="852" y="1238" width="280" height="280" rx="24" fill="#FFFFFF" stroke="#DDE7F0" stroke-width="2"/>
<g transform="translate(867 1253)">${qrInner}</g>
<rect x="108" y="1574" width="486" height="4" fill="#F97316"/>
<text x="108" y="1632" fill="#667085" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="24">Jvision AI | 烘焙 POS 互動展示</text>
</svg>`;

await writeFile(path.join(outDir, "jvision-bakery-pos-poster.svg"), posterSvg, "utf8");
await sharp(Buffer.from(posterSvg)).png().toFile(path.join(outDir, "jvision-bakery-pos-poster.png"));

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

await createPdf("jvision-bakery-pos-poster.pdf", (doc) => {
  doc.image(logoBuffer, 48, 42, { width: 130 });
  doc.font("bold").fontSize(30).fillColor("#1F2A37").text("Jvision 烘焙 POS 管理 Demo", 48, 132);
  doc.font("bold").fontSize(21).text("門市、禮盒、後廠與會員一套完成", 48, 174);
  doc.font("regular").fontSize(13).fillColor("#667085").text(
    "Jvision 協助烘焙品牌整合門市 POS、禮盒預購、前店後廠、生產入庫、報廢扣料、會員行銷與總部報表，讓前台、後廠與總部資料同步。",
    48,
    226,
    { width: 480, lineGap: 8 },
  );
  doc.roundedRect(48, 318, 498, 210, 14).fill("#1F2A37");
  doc.fillColor("#FFFFFF").font("bold").fontSize(22).text("Demo 可測試功能", 78, 350);
  doc.font("regular").fontSize(14).text("1. 新增門市與預購訂單", 78, 404);
  doc.text("2. 建立自由組合禮盒與會員推播", 78, 436);
  doc.text("3. 訂單轉後廠派工、入庫與報廢扣料", 78, 468);
  doc.roundedRect(345, 570, 160, 160, 10).stroke("#DDE7F0");
  doc.image(qrPng, 355, 580, { width: 140 });
  doc.fillColor("#1F2A37").font("bold").fontSize(18).text("掃描進入 Demo", 48, 584);
  doc.fillColor("#667085").font("regular").fontSize(10).text(demoUrl, 48, 620, { width: 260 });
});

await createPdf("jvision-bakery-pos-product-introduction.pdf", (doc) => {
  doc.image(logoBuffer, 48, 42, { width: 120 });
  doc.font("bold").fontSize(24).fillColor("#1F2A37").text("Jvision 烘焙 POS 產品介紹", 48, 120);
  doc.font("regular").fontSize(12).fillColor("#667085").text(
    "Jvision 烘焙 POS 適合烘焙門市、複合式咖啡烘焙、喜餅禮盒、前店後廠、中央工廠與連鎖品牌使用。系統將 POS 收銀、禮盒預購、生產派工、入庫報廢、會員行銷與總部報表整合成一套操作流程。",
    48,
    168,
    { width: 500, lineGap: 7 },
  );
  const sections = [
    ["核心模組", "門市 POS、禮盒彈性搭配、預購分批取貨、前店後廠、生產入庫、報廢扣料、會員行銷與總部營運報表。"],
    ["互動 Demo", "可新增訂單、組合禮盒、套用促銷、收取尾款、轉後廠派工、更新生產狀態與查看庫存指標。"],
    ["管理價值", "降低禮盒漏單、重複登打、缺料與報廢成本，讓門市、後廠與總部使用同一份即時資料。"],
    ["適合對象", "烘焙坊、甜點店、咖啡烘焙複合店、喜餅禮盒品牌、中央工廠與多門市連鎖品牌。"],
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
  `Jvision 烘焙 POS 素材\n\nDemo URL: ${demoUrl}\n\n檔案：\n- jvision-bakery-pos-poster.svg\n- jvision-bakery-pos-poster.png\n- jvision-bakery-pos-poster.pdf\n- jvision-bakery-pos-product-introduction.pdf\n`,
  "utf8",
);

console.log(`Assets created in ${outDir}`);
