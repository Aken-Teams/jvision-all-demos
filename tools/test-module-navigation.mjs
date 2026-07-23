import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const catalog=JSON.parse(fs.readFileSync(path.join(root,"projects-index.json"),"utf8"));
const projects=catalog.projects.filter(project=>{
  const app=path.join(root,"demos",project.repoName,"app.js");
  const index=path.join(root,"demos",project.repoName,"index.html");
  return fs.existsSync(app)&&fs.existsSync(index)&&fs.readFileSync(app,"utf8").includes("JVISION_DISTINCT_FUNCTIONAL_MODULES")&&fs.readFileSync(index,"utf8").includes("data-module=");
});
const port=3234;
const baseUrl=`http://127.0.0.1:${port}`;
const mime={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".json":"application/json; charset=utf-8",".svg":"image/svg+xml",".png":"image/png",".jpg":"image/jpeg",".woff2":"font/woff2"};
const server=http.createServer((req,res)=>{
  let relative=decodeURIComponent(new URL(req.url,baseUrl).pathname).replace(/^\/+/,"");
  if(!relative||relative.endsWith("/"))relative+="index.html";
  const target=path.resolve(root,relative);
  if(!target.startsWith(root)){res.writeHead(403).end();return}
  fs.readFile(target,(error,data)=>{if(error){res.writeHead(404).end("Not found");return}res.writeHead(200,{"Content-Type":mime[path.extname(target)]||"application/octet-stream"}).end(data)});
});
await new Promise((resolve,reject)=>{server.once("error",reject);server.listen(port,"127.0.0.1",resolve)});

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:960},locale:"zh-TW",reducedMotion:"reduce"});
const rows=new Array(projects.length);
let cursor=0;
let completed=0;

async function testProject(page,project,index){
  const errors=[];
  const onError=error=>errors.push(String(error.message||error).slice(0,300));
  page.on("pageerror",onError);
  let status=0;
  let navigationError="";
  try{
    const response=await page.goto(`${baseUrl}${project.demoUrl}`,{waitUntil:"domcontentloaded",timeout:15000});
    status=response?.status()||0;
    await page.waitForFunction(()=>document.body.dataset.activeModuleIndex!==undefined,{timeout:5000});
  }catch(error){navigationError=String(error.message||error).slice(0,400)}

  const steps=[];
  if(!navigationError){
    const buttons=page.locator(".module-nav button[data-module]");
    const count=await buttons.count();
    for(let buttonIndex=0;buttonIndex<count;buttonIndex++){
      await buttons.nth(buttonIndex).click();
      await page.waitForTimeout(20);
      steps.push(await page.evaluate(expected=>{
        const visible=selector=>{const element=document.querySelector(selector);if(!element)return false;const rect=element.getBoundingClientRect();return getComputedStyle(element).display!=="none"&&rect.width>0&&rect.height>0};
        const modes=[visible(".fm-stats")&&visible(".fm-stages"),visible("#fmCaseRows")&&visible("#fmDetail"),visible("#fmCreate")&&visible(".fm-schema"),visible("#fmRunAi")&&visible(".fm-recommendation")];
        return {expected,activeIndex:Number(document.body.dataset.activeModuleIndex),activeButtons:document.querySelectorAll(".module-nav button.active").length,heading:document.querySelector(".fm-hero h2")?.textContent.trim()||"",signature:modes.map(Boolean).join(""),correctSurface:modes[expected]&&modes.filter(Boolean).length===1};
      },buttonIndex));
    }
  }
  const reasons=[];
  if(status!==200)reasons.push(`HTTP ${status||"failed"}`);
  if(navigationError)reasons.push(navigationError);
  if(steps.length<4)reasons.push(`only ${steps.length} module step(s)`);
  if(steps.some(step=>step.activeIndex!==step.expected||step.activeButtons!==1||!step.heading||!step.correctSurface))reasons.push("active module state or functional surface did not update");
  if(new Set(steps.map(step=>step.signature)).size<Math.min(4,steps.length))reasons.push("module content did not change for every option");
  if(errors.length)reasons.push(`${errors.length} page error(s)`);
  page.off("pageerror",onError);
  return {sequence:index+1,id:project.id,repoName:project.repoName,title:project.title||project.repoName,status,passed:reasons.length===0,reasons,steps,pageErrors:errors};
}

async function worker(){
  const page=await context.newPage();
  while(cursor<projects.length){const index=cursor++;rows[index]=await testProject(page,projects[index],index);completed++;if(completed%25===0||completed===projects.length)console.log(`MODULE_NAV_PROGRESS ${completed}/${projects.length}`)}
  await page.close();
}
try{await Promise.all(Array.from({length:10},worker))}finally{await context.close();await browser.close();await new Promise(resolve=>server.close(resolve))}

const summary={total:rows.length,passed:rows.filter(row=>row.passed).length,failed:rows.filter(row=>!row.passed).length,totalModuleClicks:rows.reduce((sum,row)=>sum+row.steps.length,0),zeroPageErrors:rows.filter(row=>!row.pageErrors.length).length};
const report={generatedAt:new Date().toISOString(),summary,rows};
fs.writeFileSync(path.join(root,"docs","MODULE_NAVIGATION_TEST_REPORT.json"),JSON.stringify(report,null,2)+"\n");
const markdown=["# JVision 左側模組導覽測試報告","",`- 測試專案：${summary.total}`,`- 通過：${summary.passed}`,`- 失敗：${summary.failed}`,`- 模組點擊：${summary.totalModuleClicks}`,`- 無頁面錯誤：${summary.zeroPageErrors}`,"","| # | 專案 | 結果 | 原因 |","|---:|---|---|---|",...rows.map(row=>`| ${row.sequence} | ${row.title} (${row.repoName}) | ${row.passed?"通過":"失敗"} | ${row.reasons.join("；")} |`),""];
fs.writeFileSync(path.join(root,"docs","MODULE_NAVIGATION_TEST_REPORT.md"),markdown.join("\n"));
console.log(JSON.stringify(summary,null,2));
if(summary.failed)process.exitCode=1;
