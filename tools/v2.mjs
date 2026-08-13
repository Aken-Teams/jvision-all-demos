import { chromium } from 'playwright';
const B='http://localhost:4599';
const demo=B+'/demos/jvision-ai-case-002-work-order-dispatch/';
const b=await chromium.launch({channel:'chrome'});
const ctx=await b.newContext();const p=await ctx.newPage();
const cdp=await ctx.newCDPSession(p);await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
const errs=[];p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});p.on('pageerror',e=>errs.push('PE:'+e.message));
await p.goto(demo,{waitUntil:'networkidle'});
// distinct screens per hash
const titles={};
for(const g of [0,1,2,3,4,5,6]){await p.goto(demo+'#go='+g);await p.waitForTimeout(200);const on=await p.locator('.view.on').getAttribute('id');const vt=await p.locator('#vt').textContent();titles['go='+g]=on+':'+vt;}
// overflow
const ov={};
for(const w of [1360,768,390]){await p.setViewportSize({width:w,height:900});await p.goto(demo+'#go=2',{waitUntil:'load'});await p.waitForTimeout(250);ov[w]=await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);}
console.log('DEMO hash→view:',JSON.stringify(titles,null,0));
console.log('DEMO overflow:',JSON.stringify(ov),'| errors:',JSON.stringify(errs.slice(0,5)));

// detail embed with retry
const p2=await ctx.newPage();const cdp2=await ctx.newCDPSession(p2);await cdp2.send('Network.setCacheDisabled',{cacheDisabled:true});
const e2=[];p2.on('console',m=>{if(m.type()==='error')e2.push(m.text());});p2.on('pageerror',e=>e2.push('PE:'+e.message));
let ok=false;
for(let t=0;t<3&&!ok;t++){
  await p2.goto(B+'/project.html?repo=jvision-ai-case-002-work-order-dispatch',{waitUntil:'networkidle'});
  try{await p2.waitForFunction(()=>{const h=document.querySelector('h1');return h&&!/找不到/.test(h.textContent);},{timeout:8000});ok=true;}catch(e){await p2.reload({waitUntil:'networkidle'}).catch(()=>{});}
}
if(!ok){console.log('DETAIL still not loaded (playwright cache artifact). h1=',await p2.locator('h1').first().textContent().catch(()=>'?'));await b.close();process.exit(0);}
await p2.locator('button.tab-btn[data-tab="flow"]').click().catch(()=>{});
await p2.waitForTimeout(500);
// for each step, read embedded iframe src
const srcs=[];
const n=await p2.locator('.flow-step[data-step]').count();
for(let i=0;i<n;i++){await p2.locator('.flow-step[data-step="'+i+'"]').click();await p2.waitForTimeout(400);const s=await p2.evaluate(()=>{const f=document.querySelector('.flow-detail iframe');return f?f.getAttribute('src'):null;});srcs.push(i+':'+s);}
const ov2={};for(const w of [1360,390]){await p2.setViewportSize({width:w,height:1050});await p2.waitForTimeout(400);ov2[w]=await p2.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);}
await p2.setViewportSize({width:1360,height:1100});await p2.locator('.flow-step[data-step="2"]').click().catch(()=>{});await p2.waitForTimeout(700);
await p2.locator('[data-panel="flow"]').screenshot({path:'d:/tmp/002flow-fixed.png'}).catch(()=>{});
console.log('DETAIL flow step→iframe src:',JSON.stringify(srcs,null,0));
console.log('DETAIL overflow:',JSON.stringify(ov2),'| errors:',JSON.stringify(e2.slice(0,5)));
await b.close();
