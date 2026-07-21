import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) args.set(process.argv[i], process.argv[i + 1]);

const demoUrl = args.get("--url") || process.env.DEMO_URL || "https://jvision-ems.vercel.app";
const outDir = args.get("--out") || "D:/code/image/說明文件/Jvision能源管理系統";
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
<rect width="1240" height="1754" fill="#F0FFF6"/>
<rect x="70" y="70" width="1100" height="1614" rx="34" fill="#FFFFFF" stroke="#DCE8E5" stroke-width="2"/>
<image href="${logoUrl}" x="108" y="112" width="214" height="60" preserveAspectRatio="xMinYMid meet"/>
<text x="108" y="264" fill="#00A878" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30" font-weight="700">Jvision Energy Management</text>
<text x="108" y="356" fill="#17313B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="70" font-weight="800">能源管理系統 Demo</text>
<text x="108" y="442" fill="#17313B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="56" font-weight="800">智慧電表、節能控制、碳排報表</text>
<text x="108" y="526" fill="#667783" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">把用電監控、需量告警、節能策略、碳排估算與能源報表集中管理。</text>
<text x="108" y="574" fill="#667783" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">掃描 QR Code 直接進入互動 Demo，測試 EMS 能源管理流程。</text>
<rect x="108" y="672" width="1024" height="420" rx="28" fill="#17313B"/>
<rect x="158" y="728" width="292" height="280" rx="22" fill="#FFFFFF"/>
<rect x="474" y="728" width="292" height="280" rx="22" fill="#EAF8F2"/>
<rect x="790" y="728" width="292" height="280" rx="22" fill="#FFFFFF"/>
<text x="190" y="806" fill="#00A878" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">智慧電表</text>
<text x="190" y="874" fill="#17313B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">即時功率</text>
<text x="190" y="932" fill="#17313B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">累計電量</text>
<text x="506" y="806" fill="#00A878" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">節能告警</text>
<text x="506" y="874" fill="#17313B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">需量控制</text>
<text x="506" y="932" fill="#17313B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">節能策略</text>
<text x="822" y="806" fill="#00A878" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">碳排報表</text>
<text x="822" y="874" fill="#17313B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">碳盤查資料</text>
<text x="822" y="932" fill="#17313B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">能源月報</text>
<text x="108" y="1192" fill="#17313B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="38" font-weight="800">行銷重點</text>
<text x="108" y="1260" fill="#667783" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">適合校園、大樓、工廠、連鎖門市與社區場域能源管理。</text>
<text x="108" y="1352" fill="#17313B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="38" font-weight="800">掃描 QR Code 直接進入 Demo</text>
<text x="108" y="1410" fill="#667783" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">${demoUrl}</text>
<rect x="852" y="1238" width="280" height="280" rx="24" fill="#FFFFFF" stroke="#DCE8E5" stroke-width="2"/>
<g transform="translate(867 1253)">${qrInner}</g>
<rect x="108" y="1574" width="486" height="4" fill="#00A878"/>
<text x="108" y="1632" fill="#667783" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="24">Jvision AI | 能源管理系統互動展示</text>
</svg>`;

await writeFile(path.join(outDir, "jvision-ems-poster.svg"), posterSvg, "utf8");

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

await createPdf("jvision-ems-poster.pdf", (doc) => {
  doc.image(logoBuffer, 48, 42, { width: 130 });
  doc.font("bold").fontSize(30).fillColor("#17313B").text("能源管理系統 Demo", 48, 132);
  doc.font("bold").fontSize(22).text("智慧電表、節能控制、告警與碳排報表", 48, 172);
  doc.font("regular").fontSize(13).fillColor("#667783").text("Jvision 協助企業集中監控用電、需量告警、節能策略、碳排估算與能源報表，讓節電與永續管理可視化。", 48, 226, { width: 480, lineGap: 8 });
  doc.roundedRect(48, 312, 498, 210, 14).fill("#17313B");
  doc.fillColor("#FFFFFF").font("bold").fontSize(22).text("Demo 可測試流程", 78, 344);
  doc.font("regular").fontSize(14).text("1. 新增智慧電表並更新設備狀態", 78, 398);
  doc.text("2. 建立告警、節能策略與啟用控制", 78, 430);
  doc.text("3. 計算碳排並產生能源報表", 78, 462);
  doc.roundedRect(345, 570, 160, 160, 10).stroke("#DCE8E5");
  doc.image(qrPng, 355, 580, { width: 140 });
  doc.fillColor("#17313B").font("bold").fontSize(18).text("掃描進入 Demo", 48, 584);
  doc.fillColor("#667783").font("regular").fontSize(10).text(demoUrl, 48, 620, { width: 260 });
});

await createPdf("jvision-ems-product-introduction.pdf", (doc) => {
  doc.image(logoBuffer, 48, 42, { width: 120 });
  doc.font("bold").fontSize(24).fillColor("#17313B").text("Jvision 能源管理系統產品介紹", 48, 120);
  doc.font("regular").fontSize(12).fillColor("#667783").text("本產品展示 EMS 的核心體驗：智慧電表監測、能源儀表板、節能控制、告警管理、碳排計算與能源報表，用同一個工作台完成企業能源管理。", 48, 168, { width: 500, lineGap: 7 });
  const sections = [
    ["核心價值", "整合用電資料、設備狀態、告警、節能策略與碳排估算，支援節能與淨零管理。"],
    ["Demo 功能", "可新增電表、切換狀態、建立告警、新增節能策略、計算碳排與產生能源報表。"],
    ["適用場景", "校園、大樓、工廠、連鎖門市、住宅社區與多場域能源監控。"],
    ["導入效益", "提升用電透明度、降低尖峰需量風險，縮短能源報表與碳盤查資料整理時間。"],
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
  `\uFEFFJvision 能源管理系統素材\n\nDemo URL: ${demoUrl}\n\n檔案清單：\n- jvision-ems-poster.svg\n- jvision-ems-poster.pdf\n- jvision-ems-product-introduction.pdf\n`,
  "utf8",
);

console.log(`Assets created in ${outDir}`);
