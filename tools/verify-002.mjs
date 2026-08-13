import { chromium } from 'playwright';
const B='http://localhost:4599';
const demo=B+'/demos/jvision-ai-case-002-work-order-dispatch/';
const detail=B+'/project.html?repo=jvision-ai-case-002-work-order-dispatch';
const browser=await chromium.launch({channel:'chrome'});
const errs=[];
const page=await browser.newPage();
page.on('console',m=>{if(m.type()==='error')errs.push('DEMO console: '+m.text());});
page.on('pageerror',e=>errs.push('DEMO pageerror: '+e.message));
await page.goto(demo,{waitUntil:'networkidle'});
// click every nav + hash deep-link check
const navCount=await page.locator('#nav button').count();
for(let i=0;i<navCount;i++){await page.locator('#nav button').nth(i).click();await page.waitForTimeout(120);}
// hash deep-link
for(const h of ['v0','v1','v2','v3','v4','v5']){await page.goto(demo+'#'+h);await page.waitForTimeout(150);const on=await page.locator('.view.on').getAttribute('id');if(on!==h)errs.push('HASH '+h+' -> shows '+on);}
// overflow across widths
for(const w of [1360,768,390]){await page.setViewportSize({width:w,height:900});await page.waitForTimeout(200);const o=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);if(o>0)errs.push('DEMO overflow @'+w+': '+o+'px');}
await page.setViewportSize({width:1360,height:900});
await page.goto(demo,{waitUntil:'networkidle'});
await page.screenshot({path:'d:/tmp/002-demo.png',fullPage:true});

// detail page flow embed
const errs2=[];
const p2=await browser.newPage();
p2.on('console',m=>{if(m.type()==='error')errs2.push('DETAIL console: '+m.text());});
p2.on('pageerror',e=>errs2.push('DETAIL pageerror: '+e.message));
await p2.goto(detail,{waitUntil:'networkidle'});
await p2.waitForTimeout(600);
// go to 運作流程 tab (find tab with 流程)
const tabs=p2.locator('#tabBar button, [data-tab]');
const flowTab=p2.locator('text=運作流程').first();
if(await flowTab.count()){await flowTab.click();await p2.waitForTimeout(400);}
// count flow steps and iframe presence
const steps=await p2.locator('.flow-step').count();
// click step 2 to confirm swap
if(steps>1){await p2.locator('.flow-step').nth(1).click();await p2.waitForTimeout(500);}
const frameSrc=await p2.locator('.flow-step').count()? await p2.evaluate(()=>{const f=document.querySelector('iframe[src*="/demos/"][src*="#v"]');return f?f.getAttribute('src'):null;}):null;
await p2.screenshot({path:'d:/tmp/002-detail-flow.png',fullPage:false});
console.log('demo nav views:',navCount,'| flow steps:',steps,'| embedded iframe src:',frameSrc);
console.log('ERRORS:',JSON.stringify([...errs,...errs2],null,1));
await browser.close();
