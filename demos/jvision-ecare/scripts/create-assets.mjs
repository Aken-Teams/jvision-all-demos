import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) args.set(process.argv[i], process.argv[i + 1]);

const demoUrl = args.get("--url") || process.env.DEMO_URL || "https://jvision-ecare.vercel.app";
const outDir = args.get("--out") || "D:/code/image/說明文件/Jvision智慧照護管理";
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
  <text x="108" y="264" fill="#00A99D" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30" font-weight="700">Jvision Care Platform</text>
  <text x="108" y="356" fill="#123040" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="70" font-weight="800">智慧照護管理 Demo</text>
  <text x="108" y="442" fill="#123040" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="62" font-weight="800">長者、照護、庫存與帳務一站整合</text>
  <text x="108" y="526" fill="#647783" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">床位長者、照護紀錄、護理交班、耗材庫存、班表人力與收費帳務，</text>
  <text x="108" y="574" fill="#647783" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">全部整合成可直接操作的 Demo 流程。</text>
  <rect x="108" y="672" width="1024" height="420" rx="28" fill="#123040"/>
  <rect x="158" y="728" width="292" height="280" rx="22" fill="#FFFFFF"/>
  <rect x="474" y="728" width="292" height="280" rx="22" fill="#E9F8F7"/>
  <rect x="790" y="728" width="292" height="280" rx="22" fill="#FFFFFF"/>
  <text x="190" y="806" fill="#00A99D" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">長者床位</text>
  <text x="190" y="874" fill="#123040" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">入住管理</text>
  <text x="190" y="932" fill="#123040" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">照護等級</text>
  <text x="506" y="806" fill="#00A99D" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">照護交班</text>
  <text x="506" y="874" fill="#123040" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">生命徵象</text>
  <text x="506" y="932" fill="#123040" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">風險追蹤</text>
  <text x="822" y="806" fill="#00A99D" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">營運管理</text>
  <text x="822" y="874" fill="#123040" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">庫存與排班</text>
  <text x="822" y="932" fill="#123040" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">帳務指標</text>
  <text x="108" y="1192" fill="#123040" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="38" font-weight="800">完整功能 Demo</text>
  <text x="108" y="1260" fill="#647783" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">新增長者、切換風險、建立照護紀錄、交班提醒、補庫存、排班與入帳。</text>
  <text x="108" y="1352" fill="#123040" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="38" font-weight="800">掃描 QR Code 立即進入線上 Demo</text>
  <text x="108" y="1410" fill="#647783" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">${demoUrl}</text>
  <rect x="852" y="1238" width="280" height="280" rx="24" fill="#FFFFFF" stroke="#DCE8EC" stroke-width="2"/>
  <g transform="translate(867 1253)">${qrInner}</g>
  <rect x="108" y="1574" width="486" height="4" fill="#00A99D"/>
  <text x="108" y="1632" fill="#647783" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="24">Jvision AI · 智慧照護管理展示專案</text>
</svg>`;

await writeFile(path.join(outDir, "jvision-ecare-poster.svg"), posterSvg, "utf8");

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

await createPdf("jvision-ecare-poster.pdf", (doc) => {
  doc.image(logoBuffer, 48, 42, { width: 130 });
  doc.font("bold").fontSize(30).fillColor("#123040").text("智慧照護管理 Demo", 48, 132);
  doc.font("bold").fontSize(24).text("長者、照護、庫存與帳務一站整合", 48, 172);
  doc.font("regular").fontSize(13).fillColor("#647783").text("Jvision 把長照機構的長者床位、照護紀錄、護理交班、耗材庫存、班表與收費帳務整合為可操作展示。", 48, 226, { width: 480, lineGap: 8 });
  doc.roundedRect(48, 312, 498, 210, 14).fill("#123040");
  doc.fillColor("#FFFFFF").font("bold").fontSize(22).text("Demo 可測試功能", 78, 344);
  doc.font("regular").fontSize(14).text("• 新增長者並切換風險狀態", 78, 398);
  doc.text("• 新增照護紀錄與交班提醒", 78, 430);
  doc.text("• 補貨、排班、新增帳務與查看 KPI", 78, 462);
  doc.roundedRect(345, 570, 160, 160, 10).stroke("#DCE8EC");
  doc.image(qrPng, 355, 580, { width: 140 });
  doc.fillColor("#123040").font("bold").fontSize(18).text("掃描進入 Demo", 48, 584);
  doc.fillColor("#647783").font("regular").fontSize(10).text(demoUrl, 48, 620, { width: 260 });
});

await createPdf("jvision-ecare-product-introduction.pdf", (doc) => {
  doc.image(logoBuffer, 48, 42, { width: 120 });
  doc.font("bold").fontSize(24).fillColor("#123040").text("Jvision 智慧照護管理產品介紹", 48, 120);
  doc.font("regular").fontSize(12).fillColor("#647783").text("面向長照與照護機構的營運展示專案，串連長者床位、照護紀錄、人力班表、庫存耗材與帳務品質指標。", 48, 168, { width: 500, lineGap: 7 });
  const sections = [
    ["核心價值", "把分散的照護紀錄、交班事項、庫存、帳務與品質指標集中成可追蹤的營運工作台。"],
    ["Demo 功能", "可新增長者、切換風險、建立照護紀錄、排班、補庫存、入帳並查看 KPI。"],
    ["導入情境", "適合照護主管、護理人員、照服員、行政帳務與營運管理者共同使用。"],
    ["品牌呈現", "專案已統一為 Jvision 名稱與 Jvision logo，適合直接展示給客戶。"]
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

await writeFile(path.join(outDir, "README.txt"), `\uFEFFJvision 智慧照護管理素材\n\nDemo URL: ${demoUrl}\n\n檔案：\n- jvision-ecare-poster.svg\n- jvision-ecare-poster.pdf\n- jvision-ecare-product-introduction.pdf\n`, "utf8");
console.log(`Assets created in ${outDir}`);
