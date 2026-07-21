import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) args.set(process.argv[i], process.argv[i + 1]);

const demoUrl = args.get("--url") || process.env.DEMO_URL || "https://jvision-store-design.vercel.app";
const outDir = args.get("--out") || "D:/code/image/說明文件/Jvision網店設計開店";
const logoUrl = "https://www.jvision-ai.com/public/logo.png";
const fontRegular = "C:/Windows/Fonts/kaiu.ttf";
const fontBold = "C:/Windows/Fonts/simsunb.ttf";

await mkdir(outDir, { recursive: true });

const qrSvgRaw = await QRCode.toString(demoUrl, { type: "svg", margin: 1, width: 250, color: { dark: "#17313B", light: "#ffffff" } });
const qrDataUrl = await QRCode.toDataURL(demoUrl, { margin: 1, width: 360 });
const qrPng = Buffer.from(qrDataUrl.split(",")[1], "base64");
const logoResponse = await fetch(logoUrl);
const logoBuffer = Buffer.from(await logoResponse.arrayBuffer());
const qrInner = qrSvgRaw.replace(/<\?xml.*?\?>/, "").replace(/<svg[^>]*>/, "").replace("</svg>", "");

const posterSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1240" height="1754" viewBox="0 0 1240 1754" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1240" height="1754" fill="#F7FBFA"/>
  <rect x="70" y="70" width="1100" height="1614" rx="34" fill="#FFFFFF" stroke="#DCE8E7" stroke-width="2"/>
  <image href="${logoUrl}" x="108" y="112" width="214" height="60" preserveAspectRatio="xMinYMid meet"/>
  <text x="108" y="264" fill="#00A884" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30" font-weight="700">Jvision Storefront Builder</text>
  <text x="108" y="356" fill="#17313B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="70" font-weight="800">網店設計與開店 Demo</text>
  <text x="108" y="442" fill="#17313B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="62" font-weight="800">拖曳式設計、商品銷售與 SEO 一次完成</text>
  <text x="108" y="526" fill="#64757D" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">品牌主題、RWD 頁面、商品卡、表單、SEO 與訂單管理，</text>
  <text x="108" y="574" fill="#64757D" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">全部整合成可直接操作的線上展示。</text>
  <rect x="108" y="672" width="1024" height="420" rx="28" fill="#17313B"/>
  <rect x="158" y="728" width="292" height="280" rx="22" fill="#FFFFFF"/>
  <rect x="474" y="728" width="292" height="280" rx="22" fill="#EAF8F4"/>
  <rect x="790" y="728" width="292" height="280" rx="22" fill="#FFFFFF"/>
  <text x="190" y="806" fill="#00A884" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">設計主題</text>
  <text x="190" y="874" fill="#17313B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">品牌色、版型</text>
  <text x="190" y="932" fill="#17313B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">即時預覽</text>
  <text x="506" y="806" fill="#00A884" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">商品轉換</text>
  <text x="506" y="874" fill="#17313B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">快速購物車</text>
  <text x="506" y="932" fill="#17313B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">訂單建立</text>
  <text x="822" y="806" fill="#00A884" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">SEO 表單</text>
  <text x="822" y="874" fill="#17313B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">搜尋曝光</text>
  <text x="822" y="932" fill="#17313B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">名單收集</text>
  <text x="108" y="1192" fill="#17313B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="38" font-weight="800">適合展示給</text>
  <text x="108" y="1260" fill="#64757D" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">品牌電商、選物店、D2C 品牌、活動檔期、內容型商店</text>
  <text x="108" y="1352" fill="#17313B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="38" font-weight="800">掃描 QR Code 立即進入線上 Demo</text>
  <text x="108" y="1410" fill="#64757D" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">${demoUrl}</text>
  <rect x="852" y="1238" width="280" height="280" rx="24" fill="#FFFFFF" stroke="#DCE8E7" stroke-width="2"/>
  <g transform="translate(867 1253)">${qrInner}</g>
  <rect x="108" y="1574" width="486" height="4" fill="#00A884"/>
  <text x="108" y="1632" fill="#64757D" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="24">Jvision AI · 網店設計與開店展示素材</text>
</svg>`;

await writeFile(path.join(outDir, "jvision-store-design-poster.svg"), posterSvg, "utf8");

function createPdf(fileName, render) {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ size: "A4", margin: 48, bufferPages: true });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", async () => { await writeFile(path.join(outDir, fileName), Buffer.concat(chunks)); resolve(); });
    doc.registerFont("regular", fontRegular);
    doc.registerFont("bold", fontBold);
    render(doc);
    doc.end();
  });
}

await createPdf("jvision-store-design-poster.pdf", (doc) => {
  doc.image(logoBuffer, 48, 42, { width: 130 });
  doc.font("bold").fontSize(30).fillColor("#17313B").text("網店設計與開店 Demo", 48, 132);
  doc.font("bold").fontSize(24).text("拖曳式設計、商品銷售與 SEO 一次完成", 48, 172);
  doc.font("regular").fontSize(13).fillColor("#64757D").text("Jvision 把品牌主題、RWD 網店、商品卡、表單、SEO 與訂單管理整合為可操作展示。", 48, 226, { width: 480, lineGap: 8 });
  doc.roundedRect(48, 312, 498, 210, 14).fill("#17313B");
  doc.fillColor("#FFFFFF").font("bold").fontSize(22).text("可展示功能", 78, 344);
  doc.font("regular").fontSize(14).text("• 切換品牌主題並即時預覽網店", 78, 398);
  doc.text("• 商品加入購物車並建立訂單", 78, 430);
  doc.text("• 送出表單、編輯 SEO 搜尋預覽", 78, 462);
  doc.roundedRect(345, 570, 160, 160, 10).stroke("#DCE8E7");
  doc.image(qrPng, 355, 580, { width: 140 });
  doc.fillColor("#17313B").font("bold").fontSize(18).text("掃描進入 Demo", 48, 584);
  doc.fillColor("#64757D").font("regular").fontSize(10).text(demoUrl, 48, 620, { width: 260 });
});

await createPdf("jvision-store-design-product-introduction.pdf", (doc) => {
  doc.image(logoBuffer, 48, 42, { width: 120 });
  doc.font("bold").fontSize(24).fillColor("#17313B").text("Jvision 網店設計與開店產品介紹", 48, 120);
  doc.font("regular").fontSize(12).fillColor("#64757D").text("面向品牌電商的網店設計展示專案，串連品牌視覺、商品銷售、表單名單、SEO 與訂單管理。", 48, 168, { width: 500, lineGap: 7 });
  const sections = [
    ["核心價值", "讓品牌不用從零設計網站，也能快速建立有轉換路徑的 RWD 網店。"],
    ["Demo 功能", "可修改文案、切換主題、新增區塊、加入購物車、建立訂單、送出表單與編輯 SEO。"],
    ["導入情境", "適合 D2C 品牌、選物店、活動檔期、內容型商店與新品牌開店。"],
    ["預期效益", "縮短上線時間，提升購物體驗一致性，並把名單與訂單資料集中管理。"]
  ];
  let y = 245;
  for (const [title, text] of sections) {
    doc.roundedRect(48, y, 500, 84, 8).stroke("#DCE8E7");
    doc.font("bold").fontSize(15).fillColor("#00A884").text(title, 68, y + 16);
    doc.font("regular").fontSize(11).fillColor("#64757D").text(text, 68, y + 42, { width: 455, lineGap: 5 });
    y += 106;
  }
  doc.font("bold").fontSize(16).fillColor("#17313B").text("立即體驗", 48, 708);
  doc.font("regular").fontSize(10).fillColor("#64757D").text(demoUrl, 48, 734, { width: 310 });
  doc.image(qrPng, 445, 684, { width: 92 });
});

await writeFile(path.join(outDir, "README.txt"), `\uFEFFJvision 網店設計與開店素材\n\nDemo URL: ${demoUrl}\n\n檔案：\n- jvision-store-design-poster.svg\n- jvision-store-design-poster.pdf\n- jvision-store-design-product-introduction.pdf\n`, "utf8");

console.log(`Assets created in ${outDir}`);
