import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) args.set(process.argv[i], process.argv[i + 1]);

const demoUrl = args.get("--url") || process.env.DEMO_URL || "https://jvision-legalops.vercel.app";
const outDir = args.get("--out") || "D:/code/image/說明文件/Jvision法律案件管理";
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
<rect width="1240" height="1754" fill="#F4F8FB"/>
<rect x="70" y="70" width="1100" height="1614" rx="34" fill="#FFFFFF" stroke="#DCE8E5" stroke-width="2"/>
<image href="${logoUrl}" x="108" y="112" width="214" height="60" preserveAspectRatio="xMinYMid meet"/>
<text x="108" y="264" fill="#00A878" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30" font-weight="700">Jvision ????????</text>
<text x="108" y="356" fill="#17313B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="70" font-weight="800">法律案件管理 Demo</text>
<text x="108" y="442" fill="#17313B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="56" font-weight="800">案件、庭期、待辦、工時、請款</text>
<text x="108" y="526" fill="#667783" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">把案件主檔、庭期提醒、工作回報、工時紀錄與請款管理集中處理。</text>
<text x="108" y="574" fill="#667783" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">掃描 QR Code 直接進入互動 Demo，測試法律事務工作流程。</text>
<rect x="108" y="672" width="1024" height="420" rx="28" fill="#17313B"/>
<rect x="158" y="728" width="292" height="280" rx="22" fill="#FFFFFF"/>
<rect x="474" y="728" width="292" height="280" rx="22" fill="#EAF8F2"/>
<rect x="790" y="728" width="292" height="280" rx="22" fill="#FFFFFF"/>
<text x="190" y="806" fill="#00A878" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">案件控管</text>
<text x="190" y="874" fill="#17313B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">案件主檔</text>
<text x="190" y="932" fill="#17313B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">承辦進度</text>
<text x="506" y="806" fill="#00A878" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">庭期待辦</text>
<text x="506" y="874" fill="#17313B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">團隊行事曆</text>
<text x="506" y="932" fill="#17313B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">強制提醒</text>
<text x="822" y="806" fill="#00A878" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">工時請款</text>
<text x="822" y="874" fill="#17313B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">服務工時</text>
<text x="822" y="932" fill="#17313B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">應收追蹤</text>
<text x="108" y="1192" fill="#17313B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="38" font-weight="800">行銷重點</text>
<text x="108" y="1260" fill="#667783" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">適合法律事務所、公司法務與案件型服務團隊。</text>
<text x="108" y="1352" fill="#17313B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="38" font-weight="800">掃描 QR Code 直接進入 Demo</text>
<text x="108" y="1410" fill="#667783" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">${demoUrl}</text>
<rect x="852" y="1238" width="280" height="280" rx="24" fill="#FFFFFF" stroke="#DCE8E5" stroke-width="2"/>
<g transform="translate(867 1253)">${qrInner}</g>
<rect x="108" y="1574" width="486" height="4" fill="#00A878"/>
<text x="108" y="1632" fill="#667783" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="24">Jvision AI | 法律案件管理互動展示</text>
</svg>`;

await writeFile(path.join(outDir, "jvision-legalops-poster.svg"), posterSvg, "utf8");

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

await createPdf("jvision-legalops-poster.pdf", (doc) => {
  doc.image(logoBuffer, 48, 42, { width: 130 });
  doc.font("bold").fontSize(30).fillColor("#17313B").text("法律案件管理 Demo", 48, 132);
  doc.font("bold").fontSize(22).text("案件、庭期、待辦、工時與請款一站整合", 48, 172);
  doc.font("regular").fontSize(13).fillColor("#667783").text("Jvision 協助法律團隊集中管理案件主檔、庭期提醒、工作回報、工時紀錄與請款狀態，降低期限遺漏與對帳負擔。", 48, 226, { width: 480, lineGap: 8 });
  doc.roundedRect(48, 312, 498, 210, 14).fill("#17313B");
  doc.fillColor("#FFFFFF").font("bold").fontSize(22).text("Demo 可測試流程", 78, 344);
  doc.font("regular").fontSize(14).text("1. 新增案件並切換承辦狀態", 78, 398);
  doc.text("2. 新增庭期、待辦、提醒與工時", 78, 430);
  doc.text("3. 完成回報並新增請款紀錄", 78, 462);
  doc.roundedRect(345, 570, 160, 160, 10).stroke("#DCE8E5");
  doc.image(qrPng, 355, 580, { width: 140 });
  doc.fillColor("#17313B").font("bold").fontSize(18).text("掃描進入 Demo", 48, 584);
  doc.fillColor("#667783").font("regular").fontSize(10).text(demoUrl, 48, 620, { width: 260 });
});

await createPdf("jvision-legalops-product-introduction.pdf", (doc) => {
  doc.image(logoBuffer, 48, 42, { width: 120 });
  doc.font("bold").fontSize(24).fillColor("#17313B").text("Jvision 法律案件管理產品介紹", 48, 120);
  doc.font("regular").fontSize(12).fillColor("#667783").text("本產品展示法律案件管理的核心體驗：案件主檔、庭期管理、工作待辦、強制提醒、工時紀錄與請款管理，用同一個工作台完成事務所日常作業。", 48, 168, { width: 500, lineGap: 7 });
  const sections = [
    ["核心價值", "整合案件、期限、待辦、工時與帳務，降低案件資訊分散與期限遺漏風險。"],
    ["Demo 功能", "可新增案件、切換狀態、建立庭期、分派待辦、發送提醒、登錄工時與新增請款。"],
    ["適用場景", "法律事務所、公司法務、顧問服務與案件型專業服務團隊。"],
    ["導入效益", "提升團隊協作透明度，縮短案件追蹤與月底請款整理時間。"],
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
  `\uFEFFJvision 法律案件管理素材\n\nDemo URL: ${demoUrl}\n\n檔案清單：\n- jvision-legalops-poster.svg\n- jvision-legalops-poster.pdf\n- jvision-legalops-product-introduction.pdf\n`,
  "utf8",
);

console.log(`Assets created in ${outDir}`);
