import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) args.set(process.argv[i], process.argv[i + 1]);

const demoUrl = args.get("--url") || process.env.DEMO_URL || "https://jvision-smart-pos.vercel.app";
const outDir = args.get("--out") || "D:/code/image/說明文件/Jvision智能POSOMO";
const logoUrl = "https://www.jvision-ai.com/public/logo.png";
const fontRegular = "C:/Windows/Fonts/kaiu.ttf";
const fontBold = "C:/Windows/Fonts/simsunb.ttf";

await mkdir(outDir, { recursive: true });

const qrSvgRaw = await QRCode.toString(demoUrl, {
  type: "svg",
  margin: 1,
  width: 250,
  color: { dark: "#101820", light: "#ffffff" }
});
const qrDataUrl = await QRCode.toDataURL(demoUrl, { margin: 1, width: 360 });
const qrPng = Buffer.from(qrDataUrl.split(",")[1], "base64");
const logoResponse = await fetch(logoUrl);
const logoBuffer = Buffer.from(await logoResponse.arrayBuffer());
const qrInner = qrSvgRaw.replace(/<\?xml.*?\?>/, "").replace(/<svg[^>]*>/, "").replace("</svg>", "");

const posterSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1240" height="1754" viewBox="0 0 1240 1754" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1240" height="1754" fill="#F5F8FB"/>
  <rect x="70" y="70" width="1100" height="1614" rx="34" fill="#FFFFFF" stroke="#DFE6EE" stroke-width="2"/>
  <image href="${logoUrl}" x="108" y="112" width="214" height="60" preserveAspectRatio="xMinYMid meet"/>
  <text x="108" y="264" fill="#176BFF" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30" font-weight="700">Jvision Smart POS OMO</text>
  <text x="108" y="356" fill="#101820" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="70" font-weight="800">智能 POS OMO Demo</text>
  <text x="108" y="442" fill="#101820" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="62" font-weight="800">門市收銀、會員、庫存與智慧店務</text>
  <text x="108" y="526" fill="#637083" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">把線上線下會員、門市交易、庫存、品牌分潤、電子標籤與 AI 人流，</text>
  <text x="108" y="574" fill="#637083" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">整合成一套可直接操作的智慧零售展示。</text>
  <rect x="108" y="672" width="1024" height="420" rx="28" fill="#07111F"/>
  <rect x="158" y="728" width="292" height="280" rx="22" fill="#FFFFFF"/>
  <rect x="474" y="728" width="292" height="280" rx="22" fill="#EAF8FF"/>
  <rect x="790" y="728" width="292" height="280" rx="22" fill="#FFFFFF"/>
  <text x="190" y="806" fill="#176BFF" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">OMO 會員</text>
  <text x="190" y="874" fill="#101820" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">會員、點數、標籤</text>
  <text x="190" y="932" fill="#101820" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">線上線下同步</text>
  <text x="506" y="806" fill="#176BFF" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">智慧門市</text>
  <text x="506" y="874" fill="#101820" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">電子標籤</text>
  <text x="506" y="932" fill="#101820" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">AI 人流辨識</text>
  <text x="822" y="806" fill="#176BFF" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">營運儀表板</text>
  <text x="822" y="874" fill="#101820" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">庫存、分潤</text>
  <text x="822" y="932" fill="#101820" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">即時分析</text>
  <text x="108" y="1192" fill="#101820" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="38" font-weight="800">適合展示給</text>
  <text x="108" y="1260" fill="#637083" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">零售品牌、快閃店、百貨專櫃、連鎖門市、OMO 電商品牌</text>
  <text x="108" y="1352" fill="#101820" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="38" font-weight="800">掃描 QR Code 立即進入線上 Demo</text>
  <text x="108" y="1410" fill="#637083" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">${demoUrl}</text>
  <rect x="852" y="1238" width="280" height="280" rx="24" fill="#FFFFFF" stroke="#DFE6EE" stroke-width="2"/>
  <g transform="translate(867 1253)">${qrInner}</g>
  <rect x="108" y="1574" width="486" height="4" fill="#176BFF"/>
  <text x="108" y="1632" fill="#637083" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="24">Jvision AI · 智能 POS OMO 展示素材</text>
</svg>`;

await writeFile(path.join(outDir, "jvision-smart-pos-poster.svg"), posterSvg, "utf8");

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

await createPdf("jvision-smart-pos-poster.pdf", (doc) => {
  doc.image(logoBuffer, 48, 42, { width: 130 });
  doc.font("bold").fontSize(30).fillColor("#101820").text("智能 POS OMO Demo", 48, 132);
  doc.font("bold").fontSize(24).text("門市收銀、會員、庫存與智慧店務", 48, 172);
  doc.font("regular").fontSize(13).fillColor("#637083").text("Jvision 把 OMO 會員、多元支付、即時庫存、品牌分潤、電子標籤、AI 人流與數位看板整合為可操作展示。", 48, 226, { width: 480, lineGap: 8 });
  doc.roundedRect(48, 312, 498, 210, 14).fill("#07111F");
  doc.fillColor("#FFFFFF").font("bold").fontSize(22).text("可展示功能", 78, 344);
  doc.font("regular").fontSize(14).text("• 商品加入帳單、會員折抵並完成支付", 78, 398);
  doc.text("• 結帳後扣庫存並計算品牌分潤", 78, 430);
  doc.text("• 建立調撥、推送數位看板、模擬 AI 人流", 78, 462);
  doc.roundedRect(345, 570, 160, 160, 10).stroke("#DFE6EE");
  doc.image(qrPng, 355, 580, { width: 140 });
  doc.fillColor("#101820").font("bold").fontSize(18).text("掃描進入 Demo", 48, 584);
  doc.fillColor("#637083").font("regular").fontSize(10).text(demoUrl, 48, 620, { width: 260 });
});

await createPdf("jvision-smart-pos-product-introduction.pdf", (doc) => {
  doc.image(logoBuffer, 48, 42, { width: 120 });
  doc.font("bold").fontSize(24).fillColor("#101820").text("Jvision 智能 POS OMO 產品介紹", 48, 120);
  doc.font("regular").fontSize(12).fillColor("#637083").text("面向零售品牌與 OMO 門市的智能 POS 展示專案，串連收銀、會員、庫存、分潤與智慧設備。", 48, 168, { width: 500, lineGap: 7 });
  const sections = [
    ["核心價值", "把門市交易、電商會員、庫存調撥、品牌分潤與智慧設備資料集中到一套營運流程。"],
    ["Demo 功能", "可加入商品、套用會員券、完成結帳、扣庫存、建立調撥、推送看板並查看分潤。"],
    ["導入情境", "適合零售品牌、百貨專櫃、快閃店、選物店、連鎖門市與 OMO 電商品牌。"],
    ["預期效益", "降低門市人工管理成本，提升會員辨識、庫存準確度與跨通路營運效率。"]
  ];
  let y = 245;
  for (const [title, text] of sections) {
    doc.roundedRect(48, y, 500, 84, 8).stroke("#DFE6EE");
    doc.font("bold").fontSize(15).fillColor("#176BFF").text(title, 68, y + 16);
    doc.font("regular").fontSize(11).fillColor("#637083").text(text, 68, y + 42, { width: 455, lineGap: 5 });
    y += 106;
  }
  doc.font("bold").fontSize(16).fillColor("#101820").text("立即體驗", 48, 708);
  doc.font("regular").fontSize(10).fillColor("#637083").text(demoUrl, 48, 734, { width: 310 });
  doc.image(qrPng, 445, 684, { width: 92 });
});

await writeFile(
  path.join(outDir, "README.txt"),
  `\uFEFFJvision 智能 POS OMO 素材\n\nDemo URL: ${demoUrl}\n\n檔案：\n- jvision-smart-pos-poster.svg\n- jvision-smart-pos-poster.pdf\n- jvision-smart-pos-product-introduction.pdf\n`,
  "utf8"
);

console.log(`Assets created in ${outDir}`);
