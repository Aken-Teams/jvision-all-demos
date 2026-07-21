import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import sharp from "sharp";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) args.set(process.argv[i], process.argv[i + 1]);

const demoUrl = args.get("--url") || process.env.DEMO_URL || "https://jvision-customer-support-platform.vercel.app";
const outDir = args.get("--out") || "D:/code/image/說明文件/jvision-customer-support-platform";
const logoUrl = "https://www.jvision-ai.com/public/logo.png";
const fontRegular = "C:/Windows/Fonts/kaiu.ttf";
const fontBold = "C:/Windows/Fonts/simsunb.ttf";

await mkdir(outDir, { recursive: true });

const qrSvgRaw = await QRCode.toString(demoUrl, {
  type: "svg",
  margin: 1,
  width: 250,
  color: { dark: "#12332A", light: "#ffffff" },
});
const qrPng = Buffer.from((await QRCode.toDataURL(demoUrl, { margin: 1, width: 360 })).split(",")[1], "base64");
const logoBuffer = Buffer.from(await (await fetch(logoUrl)).arrayBuffer());
const qrInner = qrSvgRaw.replace(/<\?xml.*?\?>/, "").replace(/<svg[^>]*>/, "").replace("</svg>", "");

const posterSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1240" height="1754" viewBox="0 0 1240 1754" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="1240" height="1754" fill="#F3FAF6"/>
<rect x="70" y="70" width="1100" height="1614" rx="34" fill="#FFFFFF" stroke="#CFE8D8" stroke-width="2"/>
<image href="${logoUrl}" x="108" y="112" width="214" height="60" preserveAspectRatio="xMinYMid meet"/>
<text x="108" y="266" fill="#157347" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30" font-weight="700">Jvision Customer Support Platform</text>
<text x="108" y="356" fill="#12332A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="70" font-weight="800">客服支援平台 Demo</text>
<text x="108" y="442" fill="#12332A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="52" font-weight="800">收件箱、AI、知識庫與報表一套完成</text>
<text x="108" y="526" fill="#667085" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">整合客服對話、AI 回覆、知識庫、主動訊息與團隊洞察。</text>
<text x="108" y="574" fill="#667085" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">掃描 QR Code 可直接進入線上互動 Demo。</text>
<rect x="108" y="672" width="1024" height="420" rx="28" fill="#12332A"/>
<rect x="158" y="728" width="292" height="280" rx="22" fill="#FFFFFF"/>
<rect x="474" y="728" width="292" height="280" rx="22" fill="#ECFDF3"/>
<rect x="790" y="728" width="292" height="280" rx="22" fill="#FFFFFF"/>
<text x="190" y="806" fill="#157347" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">共享收件箱</text>
<text x="190" y="874" fill="#12332A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">跨渠道對話</text>
<text x="190" y="932" fill="#12332A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">自動分派</text>
<text x="506" y="806" fill="#157347" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">AI 與知識庫</text>
<text x="506" y="874" fill="#12332A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">摘要草稿</text>
<text x="506" y="932" fill="#12332A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">自助文章</text>
<text x="822" y="806" fill="#157347" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">客服洞察</text>
<text x="822" y="874" fill="#12332A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">SLA 報表</text>
<text x="822" y="932" fill="#12332A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">滿意度追蹤</text>
<text x="108" y="1192" fill="#12332A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="38" font-weight="800">適用情境</text>
<text x="108" y="1260" fill="#667085" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">SaaS、電商、教育、物流、旅宿、製造、金融保險與專業服務。</text>
<text x="108" y="1352" fill="#12332A" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="38" font-weight="800">掃描 QR Code 進入 Demo</text>
<text x="108" y="1410" fill="#667085" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">${demoUrl}</text>
<rect x="852" y="1238" width="280" height="280" rx="24" fill="#FFFFFF" stroke="#CFE8D8" stroke-width="2"/>
<g transform="translate(867 1253)">${qrInner}</g>
<rect x="108" y="1574" width="486" height="4" fill="#157347"/>
<text x="108" y="1632" fill="#667085" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="24">Jvision AI | 客服支援平台互動展示</text>
</svg>`;

await writeFile(path.join(outDir, "jvision-customer-support-platform-poster.svg"), posterSvg, "utf8");
await sharp(Buffer.from(posterSvg)).png().toFile(path.join(outDir, "jvision-customer-support-platform-poster.png"));

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

await createPdf("jvision-customer-support-platform-poster.pdf", (doc) => {
  doc.image(logoBuffer, 48, 42, { width: 130 });
  doc.font("bold").fontSize(30).fillColor("#12332A").text("Jvision 客服支援平台 Demo", 48, 132);
  doc.font("bold").fontSize(20).text("收件箱、AI、知識庫與報表一套完成", 48, 174);
  doc.font("regular").fontSize(13).fillColor("#667085").text(
    "Jvision 協助客服團隊整合共享收件箱、AI 摘要與回覆、知識庫、網站支援入口、工作流程、主動訊息與客服洞察報表。",
    48,
    226,
    { width: 480, lineGap: 8 },
  );
  doc.roundedRect(48, 318, 498, 210, 14).fill("#12332A");
  doc.fillColor("#FFFFFF").font("bold").fontSize(22).text("Demo 可測試功能", 78, 350);
  doc.font("regular").fontSize(14).text("1. 新增客服對話並自動分派", 78, 404);
  doc.text("2. 產生 AI 回覆草稿並套用知識庫", 78, 436);
  doc.text("3. 發送滿意度調查與查看客服洞察", 78, 468);
  doc.roundedRect(345, 570, 160, 160, 10).stroke("#CFE8D8");
  doc.image(qrPng, 355, 580, { width: 140 });
  doc.fillColor("#12332A").font("bold").fontSize(18).text("掃描進入 Demo", 48, 584);
  doc.fillColor("#667085").font("regular").fontSize(10).text(demoUrl, 48, 620, { width: 260 });
});

await createPdf("jvision-customer-support-platform-product-introduction.pdf", (doc) => {
  doc.image(logoBuffer, 48, 42, { width: 120 });
  doc.font("bold").fontSize(24).fillColor("#12332A").text("Jvision 客服支援平台產品介紹", 48, 120);
  doc.font("regular").fontSize(12).fillColor("#667085").text(
    "Jvision 客服支援平台適合 SaaS、電商、教育、物流、旅宿、製造、金融保險與專業服務團隊。系統將客服收件箱、AI 回覆、知識庫、支援入口、工作流程、主動訊息與報表整合成完整客服工作流。",
    48,
    168,
    { width: 500, lineGap: 7 },
  );
  const sections = [
    ["核心模組", "共享收件箱、AI 摘要與回覆、知識庫、網站支援入口、工作流程、主動訊息、客戶檔案與客服報表。"],
    ["互動 Demo", "可新增對話、更新狀態、自動分派、套用知識庫、完成結案、發送滿意度調查與查看客服洞察。"],
    ["管理價值", "降低重複回覆、減少漏接、縮短首次回覆時間，讓客服團隊用資料持續改善服務品質。"],
    ["適合對象", "SaaS、電商、教育、物流、旅宿、房產、製造、金融保險、專業服務與多產品客服團隊。"],
  ];
  let y = 245;
  for (const [title, text] of sections) {
    doc.roundedRect(48, y, 500, 84, 8).stroke("#CFE8D8");
    doc.font("bold").fontSize(15).fillColor("#157347").text(title, 68, y + 16);
    doc.font("regular").fontSize(11).fillColor("#667085").text(text, 68, y + 42, { width: 455, lineGap: 5 });
    y += 106;
  }
  doc.font("bold").fontSize(16).fillColor("#12332A").text("線上展示", 48, 708);
  doc.font("regular").fontSize(10).fillColor("#667085").text(demoUrl, 48, 734, { width: 310 });
  doc.image(qrPng, 445, 684, { width: 92 });
});

await writeFile(
  path.join(outDir, "README.txt"),
  `Jvision 客服支援平台素材\n\nDemo URL: ${demoUrl}\n\n檔案：\n- jvision-customer-support-platform-poster.svg\n- jvision-customer-support-platform-poster.png\n- jvision-customer-support-platform-poster.pdf\n- jvision-customer-support-platform-product-introduction.pdf\n`,
  "utf8",
);

console.log(`Assets created in ${outDir}`);
