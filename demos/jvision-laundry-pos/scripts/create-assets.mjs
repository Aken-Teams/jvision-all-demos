import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import sharp from "sharp";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) args.set(process.argv[i], process.argv[i + 1]);

const demoUrl = args.get("--url") || process.env.DEMO_URL || "https://jvision-laundry-pos.vercel.app";
const outDir = args.get("--out") || "D:/code/image/說明文件/jvision-laundry-pos";
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
<text x="108" y="266" fill="#F97316" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30" font-weight="700">Jvision Laundry Store Management</text>
<text x="108" y="356" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="70" font-weight="800">洗衣門市管理 Demo</text>
<text x="108" y="442" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="52" font-weight="800">收件、入庫、取件、付款一套完成</text>
<text x="108" y="526" fill="#667085" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">整合客戶資料、送洗登錄、衣物入庫、取件付款與日月報表。</text>
<text x="108" y="574" fill="#667085" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">掃描 QR Code 可直接進入線上互動 Demo。</text>
<rect x="108" y="672" width="1024" height="420" rx="28" fill="#1F2A37"/>
<rect x="158" y="728" width="292" height="280" rx="22" fill="#FFFFFF"/>
<rect x="474" y="728" width="292" height="280" rx="22" fill="#FFF4EC"/>
<rect x="790" y="728" width="292" height="280" rx="22" fill="#FFFFFF"/>
<text x="190" y="806" fill="#F97316" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">送洗收件</text>
<text x="190" y="874" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">衣物洗法</text>
<text x="190" y="932" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">顏色特徵</text>
<text x="506" y="806" fill="#F97316" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">入庫取件</text>
<text x="506" y="874" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">架位袋號</text>
<text x="506" y="932" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">付款沖銷</text>
<text x="822" y="806" fill="#F97316" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">營業報表</text>
<text x="822" y="874" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">每日支出</text>
<text x="822" y="932" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">日月報表</text>
<text x="108" y="1192" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="38" font-weight="800">適用情境</text>
<text x="108" y="1260" fill="#667085" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">洗衣門市、乾洗店、精緻洗衣、協力洗衣廠與連鎖洗衣櫃台。</text>
<text x="108" y="1352" fill="#1F2A37" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="38" font-weight="800">掃描 QR Code 進入 Demo</text>
<text x="108" y="1410" fill="#667085" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">${demoUrl}</text>
<rect x="852" y="1238" width="280" height="280" rx="24" fill="#FFFFFF" stroke="#DDE7F0" stroke-width="2"/>
<g transform="translate(867 1253)">${qrInner}</g>
<rect x="108" y="1574" width="486" height="4" fill="#F97316"/>
<text x="108" y="1632" fill="#667085" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="24">Jvision AI | 洗衣門市管理互動展示</text>
</svg>`;

await writeFile(path.join(outDir, "jvision-laundry-pos-poster.svg"), posterSvg, "utf8");
await sharp(Buffer.from(posterSvg)).png().toFile(path.join(outDir, "jvision-laundry-pos-poster.png"));

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

await createPdf("jvision-laundry-pos-poster.pdf", (doc) => {
  doc.image(logoBuffer, 48, 42, { width: 130 });
  doc.font("bold").fontSize(30).fillColor("#1F2A37").text("Jvision 洗衣門市管理 Demo", 48, 132);
  doc.font("bold").fontSize(21).text("收件、入庫、取件、付款一套完成", 48, 174);
  doc.font("regular").fontSize(13).fillColor("#667085").text(
    "Jvision 協助洗衣門市管理客戶資料、送洗收件、衣物入庫、取件付款、每日支出與營業日月報表，讓衣物與帳款都有清楚紀錄。",
    48,
    226,
    { width: 480, lineGap: 8 },
  );
  doc.roundedRect(48, 318, 498, 210, 14).fill("#1F2A37");
  doc.fillColor("#FFFFFF").font("bold").fontSize(22).text("Demo 可測試功能", 78, 350);
  doc.font("regular").fontSize(14).text("1. 新增客戶與會員資料", 78, 404);
  doc.text("2. 建立送洗單並更新入庫/取件狀態", 78, 436);
  doc.text("3. 登錄付款、每日支出與列印日月報表", 78, 468);
  doc.roundedRect(345, 570, 160, 160, 10).stroke("#DDE7F0");
  doc.image(qrPng, 355, 580, { width: 140 });
  doc.fillColor("#1F2A37").font("bold").fontSize(18).text("掃描進入 Demo", 48, 584);
  doc.fillColor("#667085").font("regular").fontSize(10).text(demoUrl, 48, 620, { width: 260 });
});

await createPdf("jvision-laundry-pos-product-introduction.pdf", (doc) => {
  doc.image(logoBuffer, 48, 42, { width: 120 });
  doc.font("bold").fontSize(24).fillColor("#1F2A37").text("Jvision 洗衣門市管理產品介紹", 48, 120);
  doc.font("regular").fontSize(12).fillColor("#667085").text(
    "Jvision 洗衣門市管理平台適合洗衣店、乾洗店、精緻洗衣與協力洗衣廠使用。系統將客戶建檔、送洗登錄、入庫架位、取件付款、每日支出與日月報表整合成門市工作流。",
    48,
    168,
    { width: 500, lineGap: 7 },
  );
  const sections = [
    ["核心模組", "員工、衣服項目、會員類別、協力洗衣廠、客戶資料、送洗單、入庫取件、付款與收支報表。"],
    ["互動 Demo", "可新增客戶、建立送洗單、更新收件/送洗/入庫/取件、付款沖銷、新增支出與列印報表。"],
    ["管理價值", "降低衣物遺漏、未收款與查件時間，讓櫃台快速掌握待取件、未收帳款與營業狀況。"],
    ["適合對象", "洗衣門市、乾洗店、精緻洗衣、連鎖洗衣櫃台、協力洗衣廠與衣物代收服務。"],
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
  `Jvision 洗衣門市管理素材\n\nDemo URL: ${demoUrl}\n\n檔案：\n- jvision-laundry-pos-poster.svg\n- jvision-laundry-pos-poster.png\n- jvision-laundry-pos-poster.pdf\n- jvision-laundry-pos-product-introduction.pdf\n`,
  "utf8",
);

console.log(`Assets created in ${outDir}`);
