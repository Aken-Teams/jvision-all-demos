import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) args.set(process.argv[i], process.argv[i + 1]);

const demoUrl = args.get("--url") || process.env.DEMO_URL || "https://jvision-clinic.vercel.app";
const outDir = args.get("--out") || "D:/code/image/說明文件/Jvision智慧診所管理";
const logoUrl = "https://www.jvision-ai.com/public/logo.png";
const fontRegular = "C:/Windows/Fonts/kaiu.ttf";
const fontBold = "C:/Windows/Fonts/simsunb.ttf";

await mkdir(outDir, { recursive: true });
const qrSvgRaw = await QRCode.toString(demoUrl, { type: "svg", margin: 1, width: 250, color: { dark: "#123040", light: "#ffffff" } });
const qrDataUrl = await QRCode.toDataURL(demoUrl, { margin: 1, width: 360 });
const qrPng = Buffer.from(qrDataUrl.split(",")[1], "base64");
const logoResponse = await fetch(logoUrl);
const logoBuffer = Buffer.from(await logoResponse.arrayBuffer());
const qrInner = qrSvgRaw.replace(/<\?xml.*?\?>/, "").replace(/<svg[^>]*>/, "").replace("</svg>", "");

const posterSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1240" height="1754" viewBox="0 0 1240 1754" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1240" height="1754" fill="#F5FAFB"/>
  <rect x="70" y="70" width="1100" height="1614" rx="34" fill="#FFFFFF" stroke="#DCE8EC" stroke-width="2"/>
  <image href="${logoUrl}" x="108" y="112" width="214" height="60" preserveAspectRatio="xMinYMid meet"/>
  <text x="108" y="264" fill="#00A99D" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30" font-weight="700">Jvision Clinic Assistant</text>
  <text x="108" y="356" fill="#123040" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="70" font-weight="800">智慧診所管理 Demo</text>
  <text x="108" y="442" fill="#123040" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="62" font-weight="800">預約、候診、病歷與營運數據一站整合</text>
  <text x="108" y="526" fill="#647783" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">AI 待辦、預約候診、病歷摘要、排班薪資、倉管耗材與財務收款，</text>
  <text x="108" y="574" fill="#647783" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">全部整合成可直接操作的線上展示。</text>
  <rect x="108" y="672" width="1024" height="420" rx="28" fill="#123040"/>
  <rect x="158" y="728" width="292" height="280" rx="22" fill="#FFFFFF"/>
  <rect x="474" y="728" width="292" height="280" rx="22" fill="#E9F8F7"/>
  <rect x="790" y="728" width="292" height="280" rx="22" fill="#FFFFFF"/>
  <text x="190" y="806" fill="#00A99D" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">智慧預約</text>
  <text x="190" y="874" fill="#123040" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">預約、候診</text>
  <text x="190" y="932" fill="#123040" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">診間分流</text>
  <text x="506" y="806" fill="#00A99D" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">病歷摘要</text>
  <text x="506" y="874" fill="#123040" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">主訴、處置</text>
  <text x="506" y="932" fill="#123040" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">回診追蹤</text>
  <text x="822" y="806" fill="#00A99D" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">營運管理</text>
  <text x="822" y="874" fill="#123040" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">排班、庫存</text>
  <text x="822" y="932" fill="#123040" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">財務收款</text>
  <text x="108" y="1192" fill="#123040" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="38" font-weight="800">適合展示給</text>
  <text x="108" y="1260" fill="#647783" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">診所經營者、櫃台行政、護理團隊、醫療營運管理單位</text>
  <text x="108" y="1352" fill="#123040" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="38" font-weight="800">掃描 QR Code 立即進入線上 Demo</text>
  <text x="108" y="1410" fill="#647783" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">${demoUrl}</text>
  <rect x="852" y="1238" width="280" height="280" rx="24" fill="#FFFFFF" stroke="#DCE8EC" stroke-width="2"/>
  <g transform="translate(867 1253)">${qrInner}</g>
  <rect x="108" y="1574" width="486" height="4" fill="#00A99D"/>
  <text x="108" y="1632" fill="#647783" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="24">Jvision AI · 智慧診所管理展示素材</text>
</svg>`;

await writeFile(path.join(outDir, "jvision-clinic-poster.svg"), posterSvg, "utf8");

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

await createPdf("jvision-clinic-poster.pdf", (doc) => {
  doc.image(logoBuffer, 48, 42, { width: 130 });
  doc.font("bold").fontSize(30).fillColor("#123040").text("智慧診所管理 Demo", 48, 132);
  doc.font("bold").fontSize(24).text("預約、候診、病歷與營運數據一站整合", 48, 172);
  doc.font("regular").fontSize(13).fillColor("#647783").text("Jvision 把診所預約候診、病歷摘要、排班薪資、倉管耗材與財務收款整合為可操作展示。", 48, 226, { width: 480, lineGap: 8 });
  doc.roundedRect(48, 312, 498, 210, 14).fill("#123040");
  doc.fillColor("#FFFFFF").font("bold").fontSize(22).text("可展示功能", 78, 344);
  doc.font("regular").fontSize(14).text("• 新增預約並切換候診狀態", 78, 398);
  doc.text("• 建立病歷摘要與回診追蹤", 78, 430);
  doc.text("• 排班薪資、補庫存與新增收款", 78, 462);
  doc.roundedRect(345, 570, 160, 160, 10).stroke("#DCE8EC");
  doc.image(qrPng, 355, 580, { width: 140 });
  doc.fillColor("#123040").font("bold").fontSize(18).text("掃描進入 Demo", 48, 584);
  doc.fillColor("#647783").font("regular").fontSize(10).text(demoUrl, 48, 620, { width: 260 });
});

await createPdf("jvision-clinic-product-introduction.pdf", (doc) => {
  doc.image(logoBuffer, 48, 42, { width: 120 });
  doc.font("bold").fontSize(24).fillColor("#123040").text("Jvision 智慧診所管理產品介紹", 48, 120);
  doc.font("regular").fontSize(12).fillColor("#647783").text("面向診所行政與營運團隊的管理展示專案，串連預約候診、病歷摘要、人事排班、倉管耗材與財務收款。", 48, 168, { width: 500, lineGap: 7 });
  const sections = [
    ["核心價值", "把櫃台、診間、人事、倉管與財務資料整合，降低人工追蹤與溝通落差。"],
    ["Demo 功能", "可新增預約、切換狀態、建立摘要、排班薪資、補庫存、收款並查看 KPI。"],
    ["導入情境", "適合牙科、醫美、復健、眼科、一般診所等需管理預約與營運流程的團隊。"],
    ["使用邊界", "此 demo 聚焦行政流程與營運管理，不提供診斷、治療或醫療決策建議。"]
  ];
  let y = 245;
  for (const [title, text] of sections) {
    doc.roundedRect(48, y, 500, 84, 8).stroke("#DCE8EC");
    doc.font("bold").fontSize(15).fillColor("#00A99D").text(title, 68, y + 16);
    doc.font("regular").fontSize(11).fillColor("#647783").text(text, 68, y + 42, { width: 455, lineGap: 5 });
    y += 106;
  }
  doc.font("bold").fontSize(16).fillColor("#123040").text("立即體驗", 48, 708);
  doc.font("regular").fontSize(10).fillColor("#647783").text(demoUrl, 48, 734, { width: 310 });
  doc.image(qrPng, 445, 684, { width: 92 });
});

await writeFile(path.join(outDir, "README.txt"), `\uFEFFJvision 智慧診所管理素材\n\nDemo URL: ${demoUrl}\n\n檔案：\n- jvision-clinic-poster.svg\n- jvision-clinic-poster.pdf\n- jvision-clinic-product-introduction.pdf\n`, "utf8");
console.log(`Assets created in ${outDir}`);
