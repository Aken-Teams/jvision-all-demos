import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) {
  args.set(process.argv[i], process.argv[i + 1]);
}

const demoUrl = args.get("--url") || process.env.DEMO_URL || "https://code01-psi.vercel.app";
const outDir = args.get("--out") || "D:/code/image/說明文件/Jvision餐飲POS科技";
const logoUrl = "https://www.jvision-ai.com/public/logo.png";
const fontRegular = "C:/Windows/Fonts/kaiu.ttf";
const fontBold = "C:/Windows/Fonts/simsunb.ttf";

await mkdir(outDir, { recursive: true });

const qrSvgRaw = await QRCode.toString(demoUrl, {
  type: "svg",
  margin: 1,
  width: 250,
  color: { dark: "#112233", light: "#ffffff" }
});
const qrDataUrl = await QRCode.toDataURL(demoUrl, { margin: 1, width: 360 });
const qrPng = Buffer.from(qrDataUrl.split(",")[1], "base64");
const logoResponse = await fetch(logoUrl);
const logoBuffer = Buffer.from(await logoResponse.arrayBuffer());

const qrInner = qrSvgRaw.replace(/<\?xml.*?\?>/, "").replace(/<svg[^>]*>/, "").replace("</svg>", "");

const posterSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1240" height="1754" viewBox="0 0 1240 1754" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1240" height="1754" fill="#F6FBF8"/>
  <rect x="70" y="70" width="1100" height="1614" rx="34" fill="#FFFFFF" stroke="#DCE8E4" stroke-width="2"/>
  <image href="${logoUrl}" x="108" y="112" width="214" height="60" preserveAspectRatio="xMinYMid meet"/>
  <text x="108" y="264" fill="#047B63" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30" font-weight="700">Jvision Restaurant Technology</text>
  <text x="108" y="356" fill="#112233" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="70" font-weight="800">餐飲 POS 科技 Demo</text>
  <text x="108" y="442" fill="#112233" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="66" font-weight="800">點餐、結帳、會員、報表一次完成</text>
  <text x="108" y="526" fill="#61717F" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">前台點餐、線上接單、訂位、支付、電子發票、會員與成本分析，</text>
  <text x="108" y="574" fill="#61717F" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">全部整合在可直接操作的線上展示。</text>

  <rect x="108" y="672" width="1024" height="420" rx="28" fill="#11283A"/>
  <rect x="158" y="728" width="292" height="280" rx="22" fill="#FFFFFF"/>
  <rect x="474" y="728" width="292" height="280" rx="22" fill="#E9FBF5"/>
  <rect x="790" y="728" width="292" height="280" rx="22" fill="#FFFFFF"/>
  <text x="190" y="806" fill="#047B63" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">POS 點餐</text>
  <text x="190" y="874" fill="#112233" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">桌況、加點、折扣</text>
  <text x="190" y="932" fill="#112233" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">完成結帳</text>
  <text x="506" y="806" fill="#047B63" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">線上營運</text>
  <text x="506" y="874" fill="#112233" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">接單、訂位、會員</text>
  <text x="506" y="932" fill="#112233" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">狀態同步</text>
  <text x="822" y="806" fill="#047B63" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">即時報表</text>
  <text x="822" y="874" fill="#112233" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">營收、客單、毛利</text>
  <text x="822" y="932" fill="#112233" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">一眼掌握</text>

  <text x="108" y="1192" fill="#112233" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="38" font-weight="800">適合展示給</text>
  <text x="108" y="1260" fill="#61717F" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">咖啡廳、餐酒館、早午餐、便當店、連鎖門市、雲端廚房</text>
  <text x="108" y="1352" fill="#112233" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="38" font-weight="800">掃描 QR Code 立即進入線上 Demo</text>
  <text x="108" y="1410" fill="#61717F" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">${demoUrl}</text>
  <rect x="852" y="1238" width="280" height="280" rx="24" fill="#FFFFFF" stroke="#DCE8E4" stroke-width="2"/>
  <g transform="translate(867 1253)">${qrInner}</g>
  <rect x="108" y="1574" width="486" height="4" fill="#00B386"/>
  <text x="108" y="1632" fill="#61717F" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="24">Jvision AI · 餐飲 POS 科技展示素材</text>
</svg>`;

await writeFile(path.join(outDir, "jvision-pos-poster.svg"), posterSvg, "utf8");

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

await createPdf("jvision-pos-poster.pdf", (doc) => {
  doc.image(logoBuffer, 48, 42, { width: 130 });
  doc.font("bold").fontSize(30).fillColor("#112233").text("餐飲 POS 科技 Demo", 48, 132);
  doc.font("bold").fontSize(25).text("點餐、結帳、會員、報表一次完成", 48, 172);
  doc.font("regular").fontSize(13).fillColor("#61717F").text("Jvision 把餐廳前台點餐、線上接單、訂位、會員集點、支付發票與銷售分析整合成可直接操作的線上展示。", 48, 226, { width: 480, lineGap: 8 });
  doc.roundedRect(48, 312, 498, 210, 14).fill("#11283A");
  doc.fillColor("#FFFFFF").font("bold").fontSize(22).text("可展示功能", 78, 344);
  doc.font("regular").fontSize(14).text("• 點選餐點加入帳單並完成結帳", 78, 398);
  doc.text("• 接受線上訂單並切換製作狀態", 78, 430);
  doc.text("• 新增訂位、套用會員折扣、查看報表", 78, 462);
  doc.roundedRect(345, 570, 160, 160, 10).stroke("#DCE8E4");
  doc.image(qrPng, 355, 580, { width: 140 });
  doc.fillColor("#112233").font("bold").fontSize(18).text("掃描進入 Demo", 48, 584);
  doc.fillColor("#61717F").font("regular").fontSize(10).text(demoUrl, 48, 620, { width: 260 });
});

await createPdf("jvision-pos-product-introduction.pdf", (doc) => {
  doc.image(logoBuffer, 48, 42, { width: 120 });
  doc.font("bold").fontSize(24).fillColor("#112233").text("Jvision 餐飲 POS 科技產品介紹", 48, 120);
  doc.font("regular").fontSize(12).fillColor("#61717F").text("Jvision Restaurant Technology 是面向餐飲門市的 POS 展示專案，用一個互動頁面串連點餐、結帳、線上接單、訂位、會員、成本與銷售分析。", 48, 168, { width: 500, lineGap: 7 });

  const sections = [
    ["核心價值", "把收銀機、外送平板、訂位表、會員名單與 Excel 報表整合為同一套營運流程。"],
    ["Demo 功能", "可新增餐點到帳單、完成結帳、切換線上訂單狀態、新增訂位、套用會員折扣並查看即時營運指標。"],
    ["導入情境", "適用咖啡廳、餐酒館、早午餐、便當店、連鎖門市與雲端廚房，可由單店展示擴展到多店管理。"],
    ["預期效益", "降低漏單與對帳時間，提升尖峰出餐效率，並把消費資料轉成會員經營與菜單決策依據。"]
  ];

  let y = 245;
  for (const [title, text] of sections) {
    doc.roundedRect(48, y, 500, 84, 8).stroke("#DCE8E4");
    doc.font("bold").fontSize(15).fillColor("#047B63").text(title, 68, y + 16);
    doc.font("regular").fontSize(11).fillColor("#61717F").text(text, 68, y + 42, { width: 455, lineGap: 5 });
    y += 106;
  }

  doc.font("bold").fontSize(16).fillColor("#112233").text("立即體驗", 48, 708);
  doc.font("regular").fontSize(10).fillColor("#61717F").text(demoUrl, 48, 734, { width: 310 });
  doc.image(qrPng, 445, 684, { width: 92 });
});

await writeFile(
  path.join(outDir, "README.txt"),
  `\uFEFFJvision 餐飲 POS 科技素材\n\nDemo URL: ${demoUrl}\n\n檔案：\n- jvision-pos-poster.svg\n- jvision-pos-poster.pdf\n- jvision-pos-product-introduction.pdf\n`,
  "utf8"
);

console.log(`Assets created in ${outDir}`);
