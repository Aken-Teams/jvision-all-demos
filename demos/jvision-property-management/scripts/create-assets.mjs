import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) args.set(process.argv[i], process.argv[i + 1]);
const demoUrl = args.get("--url") || process.env.DEMO_URL || "https://jvision-property-management.vercel.app";
const outDir = args.get("--out") || "D:/code/image/說明文件/Jvision房產租賃代管";
const logoUrl = "https://www.jvision-ai.com/public/logo.png";
const fontRegular = "C:/Windows/Fonts/kaiu.ttf";
const fontBold = "C:/Windows/Fonts/simsunb.ttf";
await mkdir(outDir, { recursive: true });
const qrSvgRaw = await QRCode.toString(demoUrl, { type: "svg", margin: 1, width: 250, color: { dark: "#17313B", light: "#ffffff" } });
const qrPng = Buffer.from((await QRCode.toDataURL(demoUrl, { margin: 1, width: 360 })).split(",")[1], "base64");
const logoBuffer = Buffer.from(await (await fetch(logoUrl)).arrayBuffer());
const qrInner = qrSvgRaw.replace(/<\?xml.*?\?>/, "").replace(/<svg[^>]*>/, "").replace("</svg>", "");
const posterSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1240" height="1754" viewBox="0 0 1240 1754" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="1240" height="1754" fill="#F6FBF8"/><rect x="70" y="70" width="1100" height="1614" rx="34" fill="#fff" stroke="#DCE8E5" stroke-width="2"/>
<image href="${logoUrl}" x="108" y="112" width="214" height="60" preserveAspectRatio="xMinYMid meet"/>
<text x="108" y="264" fill="#00A878" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30" font-weight="700">Jvision Property Operations</text>
<text x="108" y="356" fill="#17313B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="70" font-weight="800">房產租賃代管 Demo</text>
<text x="108" y="442" fill="#17313B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="62" font-weight="800">房源、租約、租金與修繕一站管理</text>
<text x="108" y="526" fill="#667783" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">房源列表、線上簽約、帳單租金、修繕派工、點交與 AI 現況，</text>
<text x="108" y="574" fill="#667783" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">全部整合成可直接操作的線上展示。</text>
<rect x="108" y="672" width="1024" height="420" rx="28" fill="#17313B"/>
<rect x="158" y="728" width="292" height="280" rx="22" fill="#fff"/><rect x="474" y="728" width="292" height="280" rx="22" fill="#EAF8F2"/><rect x="790" y="728" width="292" height="280" rx="22" fill="#fff"/>
<text x="190" y="806" fill="#00A878" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">房源租約</text><text x="190" y="874" fill="#17313B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">出租狀態</text><text x="190" y="932" fill="#17313B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">線上簽署</text>
<text x="506" y="806" fill="#00A878" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">租金帳務</text><text x="506" y="874" fill="#17313B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">帳單收款</text><text x="506" y="932" fill="#17313B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">租金對帳</text>
<text x="822" y="806" fill="#00A878" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="32" font-weight="800">修繕點交</text><text x="822" y="874" fill="#17313B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">報修追蹤</text><text x="822" y="932" fill="#17313B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">AI 現況</text>
<text x="108" y="1192" fill="#17313B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="38" font-weight="800">適合展示給</text><text x="108" y="1260" fill="#667783" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="30">租屋代管、包租代管、資產管理、物業客服與房東團隊</text>
<text x="108" y="1352" fill="#17313B" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="38" font-weight="800">掃描 QR Code 立即進入線上 Demo</text><text x="108" y="1410" fill="#667783" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="26">${demoUrl}</text>
<rect x="852" y="1238" width="280" height="280" rx="24" fill="#fff" stroke="#DCE8E5" stroke-width="2"/><g transform="translate(867 1253)">${qrInner}</g>
<rect x="108" y="1574" width="486" height="4" fill="#00A878"/><text x="108" y="1632" fill="#667783" font-family="Arial, Microsoft JhengHei, sans-serif" font-size="24">Jvision AI · 房產租賃代管展示素材</text></svg>`;
await writeFile(path.join(outDir, "jvision-property-management-poster.svg"), posterSvg, "utf8");
function createPdf(fileName, render){return new Promise((resolve)=>{const doc=new PDFDocument({size:"A4",margin:48,bufferPages:true});const chunks=[];doc.on("data",(c)=>chunks.push(c));doc.on("end",async()=>{await writeFile(path.join(outDir,fileName),Buffer.concat(chunks));resolve();});doc.registerFont("regular",fontRegular);doc.registerFont("bold",fontBold);render(doc);doc.end();});}
await createPdf("jvision-property-management-poster.pdf",(doc)=>{doc.image(logoBuffer,48,42,{width:130});doc.font("bold").fontSize(30).fillColor("#17313B").text("房產租賃代管 Demo",48,132);doc.font("bold").fontSize(24).text("房源、租約、租金與修繕一站管理",48,172);doc.font("regular").fontSize(13).fillColor("#667783").text("Jvision 把房源、租約、帳單、修繕、點交與 AI 現況整合為可操作展示。",48,226,{width:480,lineGap:8});doc.roundedRect(48,312,498,210,14).fill("#17313B");doc.fillColor("#fff").font("bold").fontSize(22).text("可展示功能",78,344);doc.font("regular").fontSize(14).text("• 新增房源並切換出租狀態",78,398);doc.text("• 產生合約、收款與修繕派工",78,430);doc.text("• 生成 AI 現況並查看營運 KPI",78,462);doc.roundedRect(345,570,160,160,10).stroke("#DCE8E5");doc.image(qrPng,355,580,{width:140});doc.fillColor("#17313B").font("bold").fontSize(18).text("掃描進入 Demo",48,584);doc.fillColor("#667783").font("regular").fontSize(10).text(demoUrl,48,620,{width:260});});
await createPdf("jvision-property-management-product-introduction.pdf",(doc)=>{doc.image(logoBuffer,48,42,{width:120});doc.font("bold").fontSize(24).fillColor("#17313B").text("Jvision 房產租賃代管產品介紹",48,120);doc.font("regular").fontSize(12).fillColor("#667783").text("面向租屋代管與物業管理團隊的營運展示專案，串連房源、租約、帳務、修繕與點交。",48,168,{width:500,lineGap:7});const sections=[["核心價值","把房源、租約、帳單、報修、點交與對帳集中成可追蹤流程。"],["Demo 功能","可新增房源、切換出租狀態、送簽合約、建立報修、收款與生成 AI 現況。"],["導入情境","適合包租代管、租屋代管、物業客服、資產管理與多房東團隊。"],["預期效益","降低漏收漏修與到期未追蹤，提升房東與代管團隊透明度。"]];let y=245;for(const [t,txt] of sections){doc.roundedRect(48,y,500,84,8).stroke("#DCE8E5");doc.font("bold").fontSize(15).fillColor("#00A878").text(t,68,y+16);doc.font("regular").fontSize(11).fillColor("#667783").text(txt,68,y+42,{width:455,lineGap:5});y+=106;}doc.font("bold").fontSize(16).fillColor("#17313B").text("立即體驗",48,708);doc.font("regular").fontSize(10).fillColor("#667783").text(demoUrl,48,734,{width:310});doc.image(qrPng,445,684,{width:92});});
await writeFile(path.join(outDir,"README.txt"),`\uFEFFJvision 房產租賃代管素材\n\nDemo URL: ${demoUrl}\n\n檔案：\n- jvision-property-management-poster.svg\n- jvision-property-management-poster.pdf\n- jvision-property-management-product-introduction.pdf\n`,"utf8");
console.log(`Assets created in ${outDir}`);
