import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) args.set(process.argv[i], process.argv[i + 1]);

const demoUrl = args.get("--url") || process.env.DEMO_URL || "https://jvision-construction.vercel.app";
const outDir = args.get("--out") || "D:/code/image/說明文件/Jvision建築工程管理";
const logoUrl = "https://www.jvision-ai.com/public/logo.png";
const fontRegular = "C:/Windows/Fonts/kaiu.ttf";
const fontBold = "C:/Windows/Fonts/simsunb.ttf";

await mkdir(outDir, { recursive: true });

const qrSvgRaw = await QRCode.toString(demoUrl, {
  type: "svg",
  margin: 1,
  width: 250,
  color: { dark: "#102336", light: "#ffffff" }
});
const qrDataUrl = await QRCode.toDataURL(demoUrl, { margin: 1, width: 360 });
const qrPng = Buffer.from(qrDataUrl.split(",")[1], "base64");
const logoResponse = await fetch(logoUrl);
const logoBuffer = Buffer.from(await logoResponse.arrayBuffer());
const qrInner = qrSvgRaw.replace(/<\?xml.*?\?>/, "").replace(/<svg[^>]*>/, "").replace("</svg>", "");

const posterSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1240" height="1754" viewBox="0 0 1240 1754" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1240" height="1754" fill="#F7FBF9"/>
  <rect x="70" y="70" width="1100" height="1614" rx="34" fill="#FFFFFF" stroke="#DCE7E3" stroke-width="2"/>
  <image href="${logoUrl}" x="108" y="112" width="214" height="60" preserveAspectRatio="xMinYMid meet"/>
  <text x="108" y="264" fill="#087A67" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30" font-weight="700">Jvision Construction Cloud</text>
  <text x="108" y="356" fill="#16213A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="70" font-weight="800">建築工程管理 Demo</text>
  <text x="108" y="442" fill="#16213A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="66" font-weight="800">現場、成本、審批一次掌握</text>
  <text x="108" y="526" fill="#5F6B7A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">工地日報、品質安衛、材料成本、變更追加與估驗請款，</text>
  <text x="108" y="574" fill="#5F6B7A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">全部整合在可直接操作的線上展示。</text>
  <rect x="108" y="672" width="1024" height="420" rx="28" fill="#102336"/>
  <rect x="158" y="728" width="292" height="280" rx="22" fill="#FFFFFF"/>
  <rect x="474" y="728" width="292" height="280" rx="22" fill="#E7F7F2"/>
  <rect x="790" y="728" width="292" height="280" rx="22" fill="#FFFFFF"/>
  <text x="190" y="806" fill="#087A67" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">工地日報</text>
  <text x="190" y="874" fill="#16213A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">人力、機具、天候</text>
  <text x="190" y="932" fill="#16213A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">即時回報</text>
  <text x="506" y="806" fill="#087A67" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">品質安衛</text>
  <text x="506" y="874" fill="#16213A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">建立缺失</text>
  <text x="506" y="932" fill="#16213A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">派工改善</text>
  <text x="822" y="806" fill="#087A67" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">成本審批</text>
  <text x="822" y="874" fill="#16213A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">材料預算</text>
  <text x="822" y="932" fill="#16213A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">送簽紀錄</text>
  <text x="108" y="1192" fill="#16213A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="38" font-weight="800">適合展示給</text>
  <text x="108" y="1260" fill="#5F6B7A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">營造廠、建設公司、工程顧問、機電分包、物業整修團隊</text>
  <text x="108" y="1352" fill="#16213A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="38" font-weight="800">掃描 QR Code 立即進入 Demo</text>
  <text x="108" y="1410" fill="#5F6B7A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">${demoUrl}</text>
  <rect x="852" y="1238" width="280" height="280" rx="24" fill="#FFFFFF" stroke="#DCE7E3" stroke-width="2"/>
  <g transform="translate(867 1253)">${qrInner}</g>
  <rect x="108" y="1574" width="486" height="4" fill="#0BB285"/>
  <text x="108" y="1632" fill="#5F6B7A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="24">Jvision AI · 建築工程管理展示素材</text>
</svg>`;

await writeFile(path.join(outDir, "jvision-construction-poster.svg"), posterSvg, "utf8");

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

await createPdf("jvision-construction-poster.pdf", (doc) => {
  doc.image(logoBuffer, 48, 42, { width: 130 });
  doc.font("bold").fontSize(30).fillColor("#16213A").text("建築工程管理 Demo", 48, 132);
  doc.font("bold").fontSize(25).text("現場、成本、審批一次掌握", 48, 172);
  doc.font("regular").fontSize(13).fillColor("#5F6B7A").text("Jvision 把工地日報、品質安衛、材料成本與簽核流程整合成可直接操作的線上展示。", 48, 226, { width: 480, lineGap: 8 });
  doc.roundedRect(48, 312, 498, 210, 14).fill("#102336");
  doc.fillColor("#FFFFFF").font("bold").fontSize(22).text("可展示功能", 78, 344);
  doc.font("regular").fontSize(14).text("• 新增工地日報並即時更新 KPI", 78, 398);
  doc.text("• 建立品質安衛缺失並切換狀態", 78, 430);
  doc.text("• 查看材料成本與送出審批紀錄", 78, 462);
  doc.roundedRect(345, 570, 160, 160, 10).stroke("#DCE7E3");
  doc.image(qrPng, 355, 580, { width: 140 });
  doc.fillColor("#16213A").font("bold").fontSize(18).text("掃描進入 Demo", 48, 584);
  doc.fillColor("#5F6B7A").font("regular").fontSize(10).text(demoUrl, 48, 620, { width: 260 });
});

await createPdf("jvision-product-introduction.pdf", (doc) => {
  doc.image(logoBuffer, 48, 42, { width: 120 });
  doc.font("bold").fontSize(24).fillColor("#16213A").text("Jvision 建築工程管理產品介紹", 48, 120);
  doc.font("regular").fontSize(12).fillColor("#5F6B7A").text("面向建築工程團隊的流程展示專案，串連工地日報、品質安衛、材料成本、審批與管理儀表板。", 48, 168, { width: 500, lineGap: 7 });
  const sections = [
    ["核心價值", "把 Line、Excel、紙本表單與口頭追蹤整合為可稽核資料流。"],
    ["Demo 功能", "可新增日報、建立缺失、切換改善狀態、查看材料預算比例並送出審批。"],
    ["導入情境", "適用新建工程、廠辦整修、機電分包、物流中心與跨案工程管理。"],
    ["預期效益", "縮短回報時間，降低漏簽漏追，提升缺失改善閉環率。"]
  ];
  let y = 245;
  for (const [title, text] of sections) {
    doc.roundedRect(48, y, 500, 84, 8).stroke("#DCE7E3");
    doc.font("bold").fontSize(15).fillColor("#087A67").text(title, 68, y + 16);
    doc.font("regular").fontSize(11).fillColor("#5F6B7A").text(text, 68, y + 42, { width: 455, lineGap: 5 });
    y += 106;
  }
  doc.font("bold").fontSize(16).fillColor("#16213A").text("立即體驗", 48, 708);
  doc.font("regular").fontSize(10).fillColor("#5F6B7A").text(demoUrl, 48, 734, { width: 310 });
  doc.image(qrPng, 445, 684, { width: 92 });
});

await writeFile(
  path.join(outDir, "README.txt"),
  `\uFEFFJvision 建築工程管理素材\n\nDemo URL: ${demoUrl}\n\n檔案：\n- jvision-construction-poster.svg\n- jvision-construction-poster.pdf\n- jvision-product-introduction.pdf\n`,
  "utf8"
);

console.log(`Assets created in ${outDir}`);
