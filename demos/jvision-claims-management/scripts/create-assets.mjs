import { mkdir, writeFile, copyFile } from "node:fs/promises";
import path from "node:path";
import QRCode from "qrcode";
import sharp from "sharp";
import PDFDocument from "pdfkit";

const url="https://jvision-claims-management.vercel.app";
const root="D:/code/image/jvision-claims-management";
const marketing="D:/code01/projects/jvision-claims-management/docs/marketing";
const publicDir="D:/code01/projects/jvision-claims-management/public/marketing";
const assets="D:/code01/projects/jvision-claims-management/assets";
for(const d of [root,marketing,publicDir,assets]) await mkdir(d,{recursive:true});
const logo=Buffer.from(await (await fetch("https://www.jvision-ai.com/public/logo.png")).arrayBuffer());
const logo64=`data:image/png;base64,${logo.toString("base64")}`;
const qr=await QRCode.toDataURL(url,{width:420,margin:1,color:{dark:"#13213A",light:"#FFFFFF"}});
const svg=`<svg width="1240" height="1754" xmlns="http://www.w3.org/2000/svg">
<rect width="1240" height="1754" fill="#F4F7FB"/><rect x="70" y="70" width="1100" height="1614" rx="34" fill="white" stroke="#DCE5F0" stroke-width="2"/>
<image href="${logo64}" x="108" y="105" width="220" height="65" preserveAspectRatio="xMinYMid meet"/>
<text x="108" y="260" fill="#2255E6" font-family="Arial, Microsoft JhengHei" font-size="30" font-weight="700">Jvision Intelligent Claims Management</text>
<text x="108" y="355" fill="#13213A" font-family="Arial, Microsoft JhengHei" font-size="68" font-weight="800">智慧理賠管理 Demo</text>
<text x="108" y="435" fill="#13213A" font-family="Arial, Microsoft JhengHei" font-size="46" font-weight="800">案件、文件、任務與付款一次掌握</text>
<text x="108" y="520" fill="#6B778C" font-family="Arial, Microsoft JhengHei" font-size="29">從報案受理、責任判定、估損準備金到核賠付款，</text><text x="108" y="566" fill="#6B778C" font-family="Arial, Microsoft JhengHei" font-size="29">以統一案件視圖串起完整理賠流程。</text>
<rect x="108" y="650" width="1024" height="410" rx="28" fill="#0B1930"/>
${[[158,"統一案件視圖","保單與事故","文件與溝通"],[474,"智慧工作佇列","任務與時限","風險優先提示"],[790,"財務與核賠","準備金追蹤","付款審核"]].map(([x,a,b,c],i)=>`<rect x="${x}" y="710" width="292" height="280" rx="22" fill="${i===1?'#EAF0FF':'#FFFFFF'}"/><text x="${x+32}" y="792" fill="#2255E6" font-family="Arial, Microsoft JhengHei" font-size="31" font-weight="800">${a}</text><text x="${x+32}" y="864" fill="#13213A" font-family="Arial, Microsoft JhengHei" font-size="25">${b}</text><text x="${x+32}" y="922" fill="#13213A" font-family="Arial, Microsoft JhengHei" font-size="25">${c}</text>`).join("")}
<rect x="90" y="1132" width="1060" height="354" rx="30" fill="#F8FAFC" stroke="#DDE6F0" stroke-width="2"/>
<text x="146" y="1238" fill="#13213A" font-family="Arial, Microsoft JhengHei" font-size="38" font-weight="900">掃描 QR Code 立即體驗 Demo</text>
<text x="146" y="1305" fill="#6B778C" font-family="Arial, Microsoft JhengHei" font-size="24">建立案件、切換資料、勾選任務並送出付款審核。</text>
<text x="146" y="1370" fill="#6B778C" font-family="Arial" font-size="21">${url}</text>
<rect x="842" y="1172" width="244" height="244" rx="22" fill="white" stroke="#D6DEE8" stroke-width="2"/><image href="${qr}" x="864" y="1194" width="200" height="200"/><text x="850" y="1450" fill="#13213A" font-family="Arial, Microsoft JhengHei" font-size="20" font-weight="800">掃描進入 Demo</text>
<rect x="108" y="1574" width="486" height="4" fill="#2255E6"/><text x="108" y="1632" fill="#6B778C" font-family="Arial, Microsoft JhengHei" font-size="24">Jvision AI｜智慧理賠管理互動展示</text></svg>`;
const png=path.join(root,"jvision-claims-management-poster.png"); await sharp(Buffer.from(svg)).png().toFile(png);
function pdf(file){return new Promise(resolve=>{const doc=new PDFDocument({size:"A4",margin:48});const chunks=[];doc.on("data",x=>chunks.push(x));doc.on("end",async()=>{await writeFile(file,Buffer.concat(chunks));resolve()});doc.registerFont("zh","C:/Windows/Fonts/kaiu.ttf");doc.image(logo,48,38,{width:125});doc.font("zh").fillColor("#13213A").fontSize(25).text("Jvision 智慧理賠管理",48,128);doc.fontSize(15).fillColor("#2255E6").text("完整理賠生命週期的互動 Demo",48,172);doc.fontSize(11).fillColor("#56647A").text("將案件資料、保單與事故、文件、溝通紀錄、任務、準備金與付款審核整合於同一個工作介面，協助理賠團隊降低切換成本並優先處理高風險案件。",48,216,{width:490,lineGap:7});let y=300;for(const [t,d] of [["統一案件視圖","快速搜尋並切換案件，掌握被保險人、車輛、事故與承辦狀態。"],["智慧工作佇列","以時限、風險與待辦任務安排理賠專員每日工作。"],["財務與付款","追蹤準備金、預估損失與付款審核，保留清楚的處理脈絡。"],["可操作 Demo","可建立新案件、搜尋、切換頁籤、完成任務與送出付款審核。"]]){doc.roundedRect(48,y,500,78,9).stroke("#DCE5F0");doc.fillColor("#2255E6").fontSize(14).text(t,68,y+14);doc.fillColor("#56647A").fontSize(10).text(d,68,y+40,{width:450});y+=96}doc.image(Buffer.from(qr.split(",")[1],"base64"),430,690,{width:105});doc.fillColor("#13213A").fontSize(14).text("線上 Demo",48,700);doc.fillColor("#56647A").fontSize(9).text(url,48,730,{width:340});doc.end()})}
const intro=path.join(root,"jvision-claims-management-product-introduction.pdf");await pdf(intro);
for(const d of [marketing,publicDir]){await copyFile(png,path.join(d,path.basename(png)));await copyFile(intro,path.join(d,path.basename(intro)))}
await copyFile(png,path.join(assets,"poster.png"));
console.log(root);
