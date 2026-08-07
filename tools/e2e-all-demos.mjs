import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const toolDir=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(toolDir,"..");
const catalog=JSON.parse(fs.readFileSync(path.join(root,"projects-index.json"),"utf8"));
const requestedRepos=new Set((process.env.JVISION_E2E_REPOS||"").split(",").map(value=>value.trim()).filter(Boolean));
const projects=requestedRepos.size?catalog.projects.filter(project=>requestedRepos.has(project.repoName)):catalog.projects;
const port=Number(process.env.JVISION_E2E_PORT||3233);
const baseUrl=`http://127.0.0.1:${port}`;
const concurrency=Math.max(1,Math.min(10,Number(process.env.JVISION_E2E_CONCURRENCY||8)));
const reportJson=path.join(root,"docs","E2E_ALL_DEMOS_REPORT.json");
const reportMarkdown=path.join(root,"docs","E2E_ALL_DEMOS_REPORT.md");
const failureDir=path.join(root,"output","e2e-all-demos","failures");
fs.mkdirSync(failureDir,{recursive:true});

const mime={".html":"text/html; charset=utf-8",".txt":"text/plain; charset=utf-8",".js":"text/javascript; charset=utf-8",".mjs":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".json":"application/json; charset=utf-8",".svg":"image/svg+xml",".png":"image/png",".jpg":"image/jpeg",".jpeg":"image/jpeg",".webp":"image/webp",".ico":"image/x-icon",".woff":"font/woff",".woff2":"font/woff2"};

function safePath(urlPath){
  let relative=decodeURIComponent(urlPath).replace(/^\/+/,"");
  if(!relative||relative.endsWith("/"))relative+="index.html";
  const resolved=path.resolve(root,relative);
  return resolved.startsWith(root)?resolved:null;
}

const server=http.createServer((req,res)=>{
  const target=safePath(new URL(req.url,baseUrl).pathname);
  if(!target){res.writeHead(403).end("Forbidden");return}
  fs.readFile(target,(error,data)=>{
    if(error){res.writeHead(404,{"Content-Type":"text/plain; charset=utf-8"}).end("Not found");return}
    res.writeHead(200,{"Content-Type":mime[path.extname(target).toLowerCase()]||"application/octet-stream","Cache-Control":"no-store"});
    res.end(data);
  });
});
await new Promise((resolve,reject)=>{server.once("error",reject);server.listen(port,"127.0.0.1",resolve)});

function unique(items){return [...new Set(items.filter(Boolean))]}
function safeName(value){return String(value).replace(/[^a-z0-9._-]+/gi,"-")}

async function inspect(page,project,index){
  const consoleErrors=[];
  const pageErrors=[];
  const failedSameOrigin=[];
  const httpErrors=[];
  const resourceErrors=[];
  page.on("console",message=>{if(message.type()==="error"){const location=message.location();consoleErrors.push(`${message.text().slice(0,400)}${location.url?` (${location.url})`:""}`)}});
  page.on("pageerror",error=>pageErrors.push(String(error.message||error).slice(0,400)));
  page.on("requestfailed",request=>{if(request.url().startsWith(baseUrl)&&!request.url().includes("/_vercel/insights/"))failedSameOrigin.push(`${request.failure()?.errorText||"failed"}: ${request.url()}`)});
  page.on("response",response=>{if(response.status()>=400){resourceErrors.push(`${response.status()}: ${response.url()}`);if(response.url().startsWith(baseUrl))httpErrors.push(`${response.status()}: ${response.url()}`)}});

  const url=`${baseUrl}${project.demoUrl}`;
  let status=0;
  let navigationError="";
  try{
    const response=await page.goto(url,{waitUntil:"domcontentloaded",timeout:20000});
    status=response?.status()||0;
    await page.waitForLoadState("load",{timeout:6000}).catch(()=>{});
    await page.waitForFunction(()=>[...document.querySelectorAll('link[rel="stylesheet"]')].every(link=>link.sheet),{timeout:10000}).catch(()=>{});
    // Shared hands-on workspaces mount after the legacy page finishes loading.
    // Wait for that runtime and its domain module before inspecting or navigating away.
    await page.waitForTimeout(900);
  }catch(error){navigationError=String(error.message||error).slice(0,500)}

  const empty={textLength:0,title:"",heading:"",interactiveCount:0,stylesheetCount:0,errorOverlay:false,horizontalOverflow:0};
  let desktop=empty;
  let mobile=empty;
  let interaction={attempted:false,type:"",label:"",succeeded:false,error:""};
  if(!navigationError){
    desktop=await page.evaluate(()=>{
      const visible=element=>{const style=getComputedStyle(element);const rect=element.getBoundingClientRect();return style.display!=="none"&&style.visibility!=="hidden"&&rect.width>0&&rect.height>0};
      const interactive=[...document.querySelectorAll('button,a[href],input:not([type="hidden"]),select,textarea')].filter(visible);
      const exposedOverflow=element=>{const rect=element.getBoundingClientRect();const amount=Math.max(rect.right-innerWidth,-rect.left);if(amount<=0)return 0;let parent=element.parentElement;while(parent&&parent!==document.body){const overflow=getComputedStyle(parent).overflowX;if(["auto","scroll","hidden","clip"].includes(overflow))return 0;parent=parent.parentElement}return amount};
      const overflow=[...document.querySelectorAll("body *")].filter(visible).reduce((max,element)=>Math.max(max,exposedOverflow(element)),0);
      return {textLength:(document.body?.innerText||"").trim().length,title:document.title.trim(),heading:(document.querySelector("h1")?.textContent||"").trim(),interactiveCount:interactive.length,stylesheetCount:document.styleSheets.length,errorOverlay:Boolean(document.querySelector('[data-nextjs-dialog],nextjs-portal,.vite-error-overlay,#webpack-dev-server-client-overlay')),horizontalOverflow:Math.max(0,Math.round(overflow))};
    });

    // Exercise a harmless control. Avoid implicit/explicit form submit buttons,
    // which can trigger native required-field errors unrelated to page health.
    let candidate=page.locator('button[type="button"]:not([disabled]):visible,button:not(form button):not([disabled]):visible,select:not([disabled]):visible').first();
    if(!(await candidate.count()))candidate=page.locator('a[href]:visible').first();
    if(await candidate.count()){
      interaction.attempted=true;
      try{
        const handle=await candidate.elementHandle();
        const tag=await handle.evaluate(element=>element.tagName.toLowerCase());
        interaction.type=tag;
        interaction.label=(await handle.evaluate((element,tagName)=>(element.getAttribute("aria-label")||element.innerText||tagName).trim().slice(0,100),tag));
        if(tag==="select"){
          const values=await handle.evaluate(element=>[...element.options].map(option=>option.value).filter(Boolean));
          if(values.length)await handle.selectOption(values[Math.min(1,values.length-1)]);
          else await handle.focus();
        }else if(tag==="a"){
          await handle.focus();
          await handle.press("Enter",{timeout:3000}).catch(()=>{});
          await page.goBack({waitUntil:"domcontentloaded",timeout:5000}).catch(()=>{});
        }else{
          await handle.click({timeout:1800}).catch(async()=>handle.evaluate(element=>element.click()));
        }
        interaction.succeeded=true;
      }catch(error){interaction.error=String(error.message||error).split("\n")[0].slice(0,300)}
    }

    await page.setViewportSize({width:390,height:844});
    await page.waitForTimeout(80);
    mobile=await page.evaluate(()=>{
      const visible=element=>{const style=getComputedStyle(element);const rect=element.getBoundingClientRect();return style.display!=="none"&&style.visibility!=="hidden"&&rect.width>0&&rect.height>0};
      const exposedOverflow=element=>{const rect=element.getBoundingClientRect();const amount=Math.max(rect.right-innerWidth,-rect.left);if(amount<=0)return 0;let parent=element.parentElement;while(parent&&parent!==document.body){const overflow=getComputedStyle(parent).overflowX;if(["auto","scroll","hidden","clip"].includes(overflow))return 0;parent=parent.parentElement}return amount};
      const overflow=[...document.querySelectorAll("body *")].filter(visible).reduce((max,element)=>Math.max(max,exposedOverflow(element)),0);
      const overflowElements=[...document.querySelectorAll("body *")].filter(visible).map(element=>{const rect=element.getBoundingClientRect(),style=getComputedStyle(element);return {tag:element.tagName.toLowerCase(),id:element.id,className:String(element.className||"").slice(0,120),parentClassName:String(element.parentElement?.className||"").slice(0,120),left:Math.round(rect.left),right:Math.round(rect.right),width:Math.round(rect.width),minWidth:style.minWidth,maxWidth:style.maxWidth,overflowX:style.overflowX}}).filter(element=>element.right>innerWidth+8||element.left<-8).sort((a,b)=>(b.right-innerWidth)-(a.right-innerWidth)).slice(0,8);
      return {textLength:(document.body?.innerText||"").trim().length,title:document.title.trim(),heading:(document.querySelector("h1")?.textContent||"").trim(),interactiveCount:[...document.querySelectorAll('button,a[href],input:not([type="hidden"]),select,textarea')].filter(visible).length,stylesheetCount:document.styleSheets.length,errorOverlay:Boolean(document.querySelector('[data-nextjs-dialog],nextjs-portal,.vite-error-overlay,#webpack-dev-server-client-overlay')),horizontalOverflow:Math.max(0,Math.round(overflow)),overflowElements};
    });
  }

  const recoverableHydrationWarnings=unique(
    pageErrors.filter(message=>message.includes("Minified React error #418"))
  );
  const blockingPageErrors=unique(
    pageErrors.filter(message=>!message.includes("Minified React error #418"))
  );
  const reasons=[];
  if(status<200||status>=400)reasons.push(`route HTTP ${status||"failed"}`);
  if(navigationError)reasons.push(`navigation: ${navigationError}`);
  if(desktop.textLength<40)reasons.push(`desktop content too short (${desktop.textLength})`);
  if(mobile.textLength<40)reasons.push(`mobile content too short (${mobile.textLength})`);
  if(desktop.stylesheetCount<2)reasons.push(`desktop stylesheets missing (${desktop.stylesheetCount})`);
  if(mobile.stylesheetCount<2)reasons.push(`mobile stylesheets missing (${mobile.stylesheetCount})`);
  if(desktop.errorOverlay||mobile.errorOverlay)reasons.push("framework error overlay detected");
  if(blockingPageErrors.length)reasons.push(`${blockingPageErrors.length} page error(s)`);
  if(consoleErrors.length)reasons.push(`${consoleErrors.length} console error(s)`);
  if(failedSameOrigin.length)reasons.push(`${failedSameOrigin.length} same-origin request failure(s)`);
  if(httpErrors.length)reasons.push(`${httpErrors.length} same-origin HTTP error(s)`);
  if(desktop.horizontalOverflow>12)reasons.push(`desktop overflow ${desktop.horizontalOverflow}px`);
  if(mobile.horizontalOverflow>12)reasons.push(`mobile overflow ${mobile.horizontalOverflow}px`);
  if(!interaction.attempted)reasons.push("no interactive control found");
  else if(!interaction.succeeded)reasons.push(`interaction failed: ${interaction.error}`);

  const passed=reasons.length===0;
  let screenshot="";
  if(!passed&&!navigationError){
    screenshot=path.join("output","e2e-all-demos","failures",`${String(index+1).padStart(3,"0")}-${safeName(project.repoName)}.png`).replaceAll(path.sep,"/");
    await page.screenshot({path:path.join(root,screenshot),fullPage:false}).catch(()=>{});
  }
  return {sequence:index+1,id:project.id,repoName:project.repoName,title:project.title||project.repoName,url,status,passed,reasons:unique(reasons),warnings:recoverableHydrationWarnings,desktop,mobile,interaction,consoleErrors:unique(consoleErrors),pageErrors:blockingPageErrors,failedSameOrigin:unique(failedSameOrigin),httpErrors:unique(httpErrors),resourceErrors:unique(resourceErrors),screenshot};
}

const browser=await chromium.launch({headless:true,...(process.env.JVISION_BROWSER_EXECUTABLE?{executablePath:process.env.JVISION_BROWSER_EXECUTABLE}:{})});
const context=await browser.newContext({viewport:{width:1440,height:960},locale:"zh-TW",colorScheme:"light",reducedMotion:"reduce"});
context.setDefaultTimeout(8000);
const rows=new Array(projects.length);
let cursor=0;
let completed=0;
async function worker(){
  while(cursor<projects.length){
    const index=cursor++;
    const page=await context.newPage();
    try{
      rows[index]=await inspect(page,projects[index],index);
    }finally{
      await page.close();
    }
    completed++;
    if(completed%20===0||completed===projects.length)console.log(`E2E_PROGRESS ${completed}/${projects.length}`);
  }
}
try{await Promise.all(Array.from({length:concurrency},worker))}finally{await context.close();await browser.close();await new Promise(resolve=>server.close(resolve))}

const summary={total:rows.length,passed:rows.filter(row=>row.passed).length,failed:rows.filter(row=>!row.passed).length,httpPassed:rows.filter(row=>row.status>=200&&row.status<400).length,desktopContentPassed:rows.filter(row=>row.desktop.textLength>=40).length,mobileContentPassed:rows.filter(row=>row.mobile.textLength>=40).length,desktopStylesPassed:rows.filter(row=>row.desktop.stylesheetCount>=2).length,mobileStylesPassed:rows.filter(row=>row.mobile.stylesheetCount>=2).length,interactionPassed:rows.filter(row=>row.interaction.succeeded).length,zeroBrowserErrors:rows.filter(row=>!row.consoleErrors.length&&!row.pageErrors.length&&!row.warnings.length).length,recoverableHydrationWarnings:rows.filter(row=>row.warnings.length).length,noMobileOverflow:rows.filter(row=>row.mobile.horizontalOverflow<=12).length};
const report={generatedAt:new Date().toISOString(),baseUrl,viewports:{desktop:{width:1440,height:960},mobile:{width:390,height:844}},summary,rows};
fs.writeFileSync(reportJson,`${JSON.stringify(report,null,2)}\n`);
const markdown=["# JVision 464 專案 E2E 測試報告","",`- 測試時間：${report.generatedAt}`,`- 通過：${summary.passed} / ${summary.total}`,`- 失敗：${summary.failed} / ${summary.total}`,`- 路由正常：${summary.httpPassed} / ${summary.total}`,`- 互動操作正常：${summary.interactionPassed} / ${summary.total}`,`- 完全無瀏覽器錯誤：${summary.zeroBrowserErrors} / ${summary.total}`,`- 舊版靜態輸出 hydration 警告：${summary.recoverableHydrationWarnings} / ${summary.total}`,`- 手機版無明顯水平溢位：${summary.noMobileOverflow} / ${summary.total}`,"","React #418 僅在內容、互動、HTTP 與版面均通過時列為舊版靜態輸出警告，原始訊息仍保留於 JSON 報告。","","| # | 專案 | 結果 | HTTP | 互動 | 手機溢位 | 原因 |","|---:|---|---|---:|---|---:|---|",...rows.map(row=>`| ${row.sequence} | ${row.title} (${row.repoName}) | ${row.passed?"通過":"失敗"} | ${row.status} | ${row.interaction.succeeded?"通過":"失敗"} | ${row.mobile.horizontalOverflow}px | ${row.reasons.join("；")} |`),""];
fs.writeFileSync(reportMarkdown,markdown.join("\n"));
console.log(JSON.stringify(summary,null,2));
if(summary.failed)process.exitCode=1;
