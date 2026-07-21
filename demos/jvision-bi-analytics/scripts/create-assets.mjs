import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) args.set(process.argv[i], process.argv[i + 1]);

const demoUrl = args.get("--url") || process.env.DEMO_URL || "https://jvision-bi-analytics.vercel.app";
const outDir = args.get("--out") || "D:/code/image/說明文件/JvisionBI分析平台";
const logoUrl = "https://www.jvision-ai.com/public/logo.png";
const fontRegular = "C:/Windows/Fonts/kaiu.ttf";
const fontBold = "C:/Windows/Fonts/simsunb.ttf";

await mkdir(outDir, { recursive: true });

const qrSvgRaw = await QRCode.toString(demoUrl, {
  type: "svg",
  margin: 1,
  width: 250,
  color: { dark: "#17313B", light: "#ffffff" },
});
const qrPng = Buffer.from((await QRCode.toDataURL(demoUrl, { margin: 1, width: 360 })).split(",")[1], "base64");
const logoBuffer = Buffer.from(await (await fetch(logoUrl)).arrayBuffer());
const qrInner = qrSvgRaw.replace(/<\?xml.*?\?>/, "").replace(/<svg[^>]*>/, "").replace("</svg>", "");

const posterSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1240" height="1754" viewBox="0 0 1240 1754" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="1240" height="1754" fill="#FFF9DC"/>
<rect x="70" y="70" width="1100" height="1614" rx="34" fill="#FFFFFF" stroke="#DCE8E5" stroke-width="2"/>
<image href="${logoUrl}" x="108" y="112" width="214" height="60" preserveAspectRatio="xMinYMid meet"/>
<text x="108" y="264" fill="#00A878" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30" font-weight="700">Jvision BI Analytics</text>
<text x="108" y="356" fill="#17313B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="70" font-weight="800">BI 分析平台 Demo</text>
<text x="108" y="442" fill="#17313B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="56" font-weight="800">資料連接、AI 洞察、互動報表</text>
<text x="108" y="526" fill="#667783" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">把資料集、語意模型、AI 問答、互動儀表板與治理分享集中管理。</text>
<text x="108" y="574" fill="#667783" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">掃描 QR Code 直接進入互動 Demo，測試商業智慧分析流程。</text>
<rect x="108" y="672" width="1024" height="420" rx="28" fill="#17313B"/>
<rect x="158" y="728" width="292" height="280" rx="22" fill="#FFFFFF"/>
<rect x="474" y="728" width="292" height="280" rx="22" fill="#EAF8F2"/>
<rect x="790" y="728" width="292" height="280" rx="22" fill="#FFFFFF"/>
<text x="190" y="806" fill="#00A878" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">資料連接</text>
<text x="190" y="874" fill="#17313B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">資料集匯入</text>
<text x="190" y="932" fill="#17313B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">語意模型</text>
<text x="506" y="806" fill="#00A878" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">AI 洞察</text>
<text x="506" y="874" fill="#17313B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">自然語言問答</text>
<text x="506" y="932" fill="#17313B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">摘要報告</text>
<text x="822" y="806" fill="#00A878" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">分享治理</text>
<text x="822" y="874" fill="#17313B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">報表發布</text>
<text x="822" y="932" fill="#17313B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">權限審核</text>
<text x="108" y="1192" fill="#17313B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="38" font-weight="800">行銷重點</text>
<text x="108" y="1260" fill="#667783" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">適合管理者、資料團隊、業務、營運與跨部門決策場景。</text>
<text x="108" y="1352" fill="#17313B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="38" font-weight="800">掃描 QR Code 直接進入 Demo</text>
<text x="108" y="1410" fill="#667783" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">${demoUrl}</text>
<rect x="852" y="1238" width="280" height="280" rx="24" fill="#FFFFFF" stroke="#DCE8E5" stroke-width="2"/>
<g transform="translate(867 1253)">${qrInner}</g>
<rect x="108" y="1574" width="486" height="4" fill="#00A878"/>
<text x="108" y="1632" fill="#667783" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="24">Jvision AI | BI 分析平台互動展示</text>
</svg>`;

await writeFile(path.join(outDir, "jvision-bi-analytics-poster.svg"), posterSvg, "utf8");

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

await createPdf("jvision-bi-analytics-poster.pdf", (doc) => {
  doc.image(logoBuffer, 48, 42, { width: 130 });
  doc.font("bold").fontSize(30).fillColor("#17313B").text("BI 分析平台 Demo", 48, 132);
  doc.font("bold").fontSize(22).text("資料連接、AI 洞察、互動報表與治理分享", 48, 172);
  doc.font("regular").fontSize(13).fillColor("#667783").text("Jvision 協助企業集中管理資料集、語意模型、互動報表、AI 問答、分享發布與治理紀錄，推動資料驅動決策。", 48, 226, { width: 480, lineGap: 8 });
  doc.roundedRect(48, 312, 498, 210, 14).fill("#17313B");
  doc.fillColor("#FFFFFF").font("bold").fontSize(22).text("Demo 可測試流程", 78, 344);
  doc.font("regular").fontSize(14).text("1. 匯入資料集並切換刷新與治理狀態", 78, 398);
  doc.text("2. 更新 KPI、產生報表、發布與分享", 78, 430);
  doc.text("3. 詢問 AI、產生摘要與建立治理紀錄", 78, 462);
  doc.roundedRect(345, 570, 160, 160, 10).stroke("#DCE8E5");
  doc.image(qrPng, 355, 580, { width: 140 });
  doc.fillColor("#17313B").font("bold").fontSize(18).text("掃描進入 Demo", 48, 584);
  doc.fillColor("#667783").font("regular").fontSize(10).text(demoUrl, 48, 620, { width: 260 });
});

await createPdf("jvision-bi-analytics-product-introduction.pdf", (doc) => {
  doc.image(logoBuffer, 48, 42, { width: 120 });
  doc.font("bold").fontSize(24).fillColor("#17313B").text("Jvision BI 分析平台產品介紹", 48, 120);
  doc.font("regular").fontSize(12).fillColor("#667783").text("本產品展示 BI 分析平台的核心體驗：資料連接、語意模型、AI 洞察、互動報表、自助分析、報表分享與治理安全，用同一個工作台完成企業分析流程。", 48, 168, { width: 500, lineGap: 7 });
  const sections = [
    ["核心價值", "整合資料來源、報表、AI 問答與治理紀錄，建立企業單一事實來源。"],
    ["Demo 功能", "可匯入資料集、切換資料狀態、更新 KPI、產生報表、分享報表、詢問 AI 與建立治理紀錄。"],
    ["適用場景", "管理決策、業務分析、營運監控、資料團隊治理與自助 BI。"],
    ["導入效益", "提升報表一致性、分析速度與資料治理透明度。"],
  ];
  let y = 245;
  for (const [title, text] of sections) {
    doc.roundedRect(48, y, 500, 84, 8).stroke("#DCE8E5");
    doc.font("bold").fontSize(15).fillColor("#00A878").text(title, 68, y + 16);
    doc.font("regular").fontSize(11).fillColor("#667783").text(text, 68, y + 42, { width: 455, lineGap: 5 });
    y += 106;
  }
  doc.font("bold").fontSize(16).fillColor("#17313B").text("線上展示", 48, 708);
  doc.font("regular").fontSize(10).fillColor("#667783").text(demoUrl, 48, 734, { width: 310 });
  doc.image(qrPng, 445, 684, { width: 92 });
});

await writeFile(
  path.join(outDir, "README.txt"),
  `\uFEFFJvision BI 分析平台素材\n\nDemo URL: ${demoUrl}\n\n檔案清單：\n- jvision-bi-analytics-poster.svg\n- jvision-bi-analytics-poster.pdf\n- jvision-bi-analytics-product-introduction.pdf\n`,
  "utf8",
);

console.log(`Assets created in ${outDir}`);
