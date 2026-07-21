import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import sharp from "sharp";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) args.set(process.argv[i], process.argv[i + 1]);

const demoUrl = args.get("--url") || process.env.DEMO_URL || "https://jvision-estimate-pmis.vercel.app";
const outDir = args.get("--out") || "D:/code/image/說明文件/jvision-estimate-pmis";
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
<text x="108" y="266" fill="#F97316" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30" font-weight="700">Jvision Estimate + PMIS</text>
<text x="108" y="356" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="70" font-weight="800">估價與工程管理 Demo</text>
<text x="108" y="442" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="52" font-weight="800">報價簽核到工程執行，一套接起來</text>
<text x="108" y="526" fill="#667085" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">整合工程類型估價、施工區域、收款追蹤、轉專案與估驗請款。</text>
<text x="108" y="574" fill="#667085" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">掃描 QR Code 可直接進入線上互動 Demo。</text>
<rect x="108" y="672" width="1024" height="420" rx="28" fill="#1F2A37"/>
<rect x="158" y="728" width="292" height="280" rx="22" fill="#FFFFFF"/>
<rect x="474" y="728" width="292" height="280" rx="22" fill="#FFF4EC"/>
<rect x="790" y="728" width="292" height="280" rx="22" fill="#FFFFFF"/>
<text x="190" y="806" fill="#F97316" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">報價估價</text>
<text x="190" y="874" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">類型區域</text>
<text x="190" y="932" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">收款追蹤</text>
<text x="506" y="806" fill="#F97316" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">工程 PMIS</text>
<text x="506" y="874" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">進度品質</text>
<text x="506" y="932" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">施工日誌</text>
<text x="822" y="806" fill="#F97316" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">財務送審</text>
<text x="822" y="874" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">估驗請款</text>
<text x="822" y="932" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">圖說版本</text>
<text x="108" y="1192" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="38" font-weight="800">適用情境</text>
<text x="108" y="1260" fill="#667085" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">營造、統包、機電、裝修、公共工程、業主專管與監造協作團隊。</text>
<text x="108" y="1352" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="38" font-weight="800">掃描 QR Code 進入 Demo</text>
<text x="108" y="1410" fill="#667085" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">${demoUrl}</text>
<rect x="852" y="1238" width="280" height="280" rx="24" fill="#FFFFFF" stroke="#DDE7F0" stroke-width="2"/>
<g transform="translate(867 1253)">${qrInner}</g>
<rect x="108" y="1574" width="486" height="4" fill="#F97316"/>
<text x="108" y="1632" fill="#667085" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="24">Jvision AI | 估價與工程管理互動展示</text>
</svg>`;

await writeFile(path.join(outDir, "jvision-estimate-pmis-poster.svg"), posterSvg, "utf8");
await sharp(Buffer.from(posterSvg)).png().toFile(path.join(outDir, "jvision-estimate-pmis-poster.png"));

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

await createPdf("jvision-estimate-pmis-poster.pdf", (doc) => {
  doc.image(logoBuffer, 48, 42, { width: 130 });
  doc.font("bold").fontSize(30).fillColor("#1F2A37").text("Jvision 估價與工程管理 Demo", 48, 132);
  doc.font("bold").fontSize(21).text("報價簽核到工程執行，一套接起來", 48, 174);
  doc.font("regular").fontSize(13).fillColor("#667085").text(
    "Jvision 將工程類型估價、施工區域、報價簽核、收款追蹤、轉專案、圖說送審與估驗請款整合在同一個工作台，降低資料斷點。",
    48,
    226,
    { width: 480, lineGap: 8 },
  );
  doc.roundedRect(48, 318, 498, 210, 14).fill("#1F2A37");
  doc.fillColor("#FFFFFF").font("bold").fontSize(22).text("Demo 可測試功能", 78, 350);
  doc.font("regular").fontSize(14).text("1. 新增工程估價與報價狀態", 78, 404);
  doc.text("2. 追蹤已收款、追加金額、未收款與自動結案", 78, 436);
  doc.text("3. 報價核准後轉專案，追蹤品質與估驗請款", 78, 468);
  doc.roundedRect(345, 570, 160, 160, 10).stroke("#DDE7F0");
  doc.image(qrPng, 355, 580, { width: 140 });
  doc.fillColor("#1F2A37").font("bold").fontSize(18).text("掃描進入 Demo", 48, 584);
  doc.fillColor("#667085").font("regular").fontSize(10).text(demoUrl, 48, 620, { width: 260 });
});

await createPdf("jvision-estimate-pmis-product-introduction.pdf", (doc) => {
  doc.image(logoBuffer, 48, 42, { width: 120 });
  doc.font("bold").fontSize(24).fillColor("#1F2A37").text("Jvision 估價與工程管理產品介紹", 48, 120);
  doc.font("regular").fontSize(12).fillColor("#667085").text(
    "Jvision 估價與工程管理平台適合營造、統包、機電、裝修、公共工程、業主專管與監造協作團隊。系統把報價估價與工程專案管理接在一起，讓預算、進度、品質、圖說與請款共用同一份資料。",
    48,
    168,
    { width: 500, lineGap: 7 },
  );
  const sections = [
    ["核心模組", "工程類型、施工區域、估價模板、報價簽核、收款追蹤、轉專案、進度管理、圖說送審與估驗請款。"],
    ["互動 Demo", "可新增報價、選擇工程類型與區域、追蹤已收款與未收款、列印報價、轉工程、更新進度與新增請款。"],
    ["管理價值", "讓估價預算延伸到工程執行，減少 Excel 版本落差，提升業主、監造與承包商協作效率。"],
    ["適合對象", "營造公司、統包商、機電工程、裝修工程、公共工程、專案管理顧問、監造與工程業主。"],
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
  `Jvision 估價與工程管理素材\n\nDemo URL: ${demoUrl}\n\n檔案：\n- jvision-estimate-pmis-poster.svg\n- jvision-estimate-pmis-poster.png\n- jvision-estimate-pmis-poster.pdf\n- jvision-estimate-pmis-product-introduction.pdf\n`,
  "utf8",
);

console.log(`Assets created in ${outDir}`);
