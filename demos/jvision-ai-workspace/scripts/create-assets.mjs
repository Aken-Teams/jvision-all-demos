import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) args.set(process.argv[i], process.argv[i + 1]);

const demoUrl = args.get("--url") || process.env.DEMO_URL || "https://jvision-ai-workspace.vercel.app";
const outDir = args.get("--out") || "D:/code/image/說明文件/JvisionAI工作區";
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
<rect width="1240" height="1754" fill="#F7F8FF"/>
<rect x="70" y="70" width="1100" height="1614" rx="34" fill="#FFFFFF" stroke="#DCE8E5" stroke-width="2"/>
<image href="${logoUrl}" x="108" y="112" width="214" height="60" preserveAspectRatio="xMinYMid meet"/>
<text x="108" y="264" fill="#00A878" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30" font-weight="700">Jvision AI Workspace</text>
<text x="108" y="356" fill="#17313B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="70" font-weight="800">AI 工作區 Demo</text>
<text x="108" y="442" fill="#17313B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="56" font-weight="800">文件、知識、專案、會議、代理人</text>
<text x="108" y="526" fill="#667783" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">把文件、任務、會議筆記、知識庫搜尋與 AI 代理人集中管理。</text>
<text x="108" y="574" fill="#667783" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">掃描 QR Code 直接進入互動 Demo，測試團隊 AI 工作流程。</text>
<rect x="108" y="672" width="1024" height="420" rx="28" fill="#17313B"/>
<rect x="158" y="728" width="292" height="280" rx="22" fill="#FFFFFF"/>
<rect x="474" y="728" width="292" height="280" rx="22" fill="#EAF8F2"/>
<rect x="790" y="728" width="292" height="280" rx="22" fill="#FFFFFF"/>
<text x="190" y="806" fill="#00A878" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">AI 文件</text>
<text x="190" y="874" fill="#17313B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">規格筆記</text>
<text x="190" y="932" fill="#17313B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">摘要改寫</text>
<text x="506" y="806" fill="#00A878" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">專案會議</text>
<text x="506" y="874" fill="#17313B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">任務看板</text>
<text x="506" y="932" fill="#17313B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">會議摘要</text>
<text x="822" y="806" fill="#00A878" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">知識代理</text>
<text x="822" y="874" fill="#17313B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">企業搜尋</text>
<text x="822" y="932" fill="#17313B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">AI 報告</text>
<text x="108" y="1192" fill="#17313B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="38" font-weight="800">行銷重點</text>
<text x="108" y="1260" fill="#667783" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">適合產品、研發、營運、顧問與跨部門協作團隊。</text>
<text x="108" y="1352" fill="#17313B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="38" font-weight="800">掃描 QR Code 直接進入 Demo</text>
<text x="108" y="1410" fill="#667783" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">${demoUrl}</text>
<rect x="852" y="1238" width="280" height="280" rx="24" fill="#FFFFFF" stroke="#DCE8E5" stroke-width="2"/>
<g transform="translate(867 1253)">${qrInner}</g>
<rect x="108" y="1574" width="486" height="4" fill="#00A878"/>
<text x="108" y="1632" fill="#667783" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="24">Jvision AI | AI 工作區互動展示</text>
</svg>`;

await writeFile(path.join(outDir, "jvision-ai-workspace-poster.svg"), posterSvg, "utf8");

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

await createPdf("jvision-ai-workspace-poster.pdf", (doc) => {
  doc.image(logoBuffer, 48, 42, { width: 130 });
  doc.font("bold").fontSize(30).fillColor("#17313B").text("AI 工作區 Demo", 48, 132);
  doc.font("bold").fontSize(22).text("文件、知識、專案、會議與代理人一站整合", 48, 172);
  doc.font("regular").fontSize(13).fillColor("#667783").text("Jvision 協助團隊集中管理文件、任務、會議筆記、知識庫搜尋與 AI 代理人流程，讓資訊和執行保持同步。", 48, 226, { width: 480, lineGap: 8 });
  doc.roundedRect(48, 312, 498, 210, 14).fill("#17313B");
  doc.fillColor("#FFFFFF").font("bold").fontSize(22).text("Demo 可測試流程", 78, 344);
  doc.font("regular").fontSize(14).text("1. 新增文件並切換審閱與發布狀態", 78, 398);
  doc.text("2. 新增任務、會議筆記與知識庫問答", 78, 430);
  doc.text("3. 指派 AI 代理人並產生專案報告", 78, 462);
  doc.roundedRect(345, 570, 160, 160, 10).stroke("#DCE8E5");
  doc.image(qrPng, 355, 580, { width: 140 });
  doc.fillColor("#17313B").font("bold").fontSize(18).text("掃描進入 Demo", 48, 584);
  doc.fillColor("#667783").font("regular").fontSize(10).text(demoUrl, 48, 620, { width: 260 });
});

await createPdf("jvision-ai-workspace-product-introduction.pdf", (doc) => {
  doc.image(logoBuffer, 48, 42, { width: 120 });
  doc.font("bold").fontSize(24).fillColor("#17313B").text("Jvision AI 工作區產品介紹", 48, 120);
  doc.font("regular").fontSize(12).fillColor("#667783").text("本產品展示 AI 工作區的核心體驗：文件、知識庫、專案任務、會議筆記、AI 代理人與自動化流程，用同一個工作台完成團隊協作。", 48, 168, { width: 500, lineGap: 7 });
  const sections = [
    ["核心價值", "整合知識、任務、會議與 AI 產出，降低資訊分散與重複整理成本。"],
    ["Demo 功能", "可新增文件、切換發布狀態、新增任務、會議筆記、知識問答、指派代理人與產生報告。"],
    ["適用場景", "產品、研發、營運、顧問、管理團隊與跨部門專案協作。"],
    ["導入效益", "提升知識搜尋效率、會議追蹤品質與專案透明度。"],
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
  `\uFEFFJvision AI 工作區素材\n\nDemo URL: ${demoUrl}\n\n檔案清單：\n- jvision-ai-workspace-poster.svg\n- jvision-ai-workspace-poster.pdf\n- jvision-ai-workspace-product-introduction.pdf\n`,
  "utf8",
);

console.log(`Assets created in ${outDir}`);
