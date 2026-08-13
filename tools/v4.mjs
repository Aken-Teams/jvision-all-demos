import { chromium } from 'playwright';
const B='http://localhost:4599';
const demo=B+'/demos/jvision-ai-case-002-work-order-dispatch/';
const detail=B+'/project?repo=jvision-ai-case-002-work-order-dispatch';
const b=await chromium.launch({channel:'chrome'});
const ctx=await b.newContext();
// DEMO overflow recheck
const p=await ctx.newPage();const c1=await ctx.newCDPSession(p);await c1.send('Network.setCacheDisabled',{cacheDisabled:true});
const de=[];p.on('console',m=>{if(m.type()==='error')de.push(m.text());});p.on('pageerror',e=>de.push('PE:'+e.message));
const ov={};for(const w of [1360,768,390]){await p.setViewportSize({width:w,height:900});await p.goto(demo+'#go=2',{waitUntil:'load'});await p.waitForTimeout(200);ov[w]=await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);}
console.log('DEMO overflow:',JSON.stringify(ov),'errors:',JSON.stringify(de.slice(0,4)));
// DETAIL via clean url
const p2=await ctx.newPage();const c2=await ctx.newCDPSession(p2);await c2.send('Network.setCacheDisabled',{cacheDisabled:true});
const e2=[];p2.on('console',m=>{if(m.type()==='error')e2.push(m.text());});p2.on('pageerror',e=>e2.push('PE:'+e.message));
await p2.goto(detail,{waitUntil:'networkidle'});
await p2.waitForSelector('.flow-step',{timeout:10000}).catch(()=>{});
const h1=await p2.locator('h1').first().textContent().catch(()=>'?');
await p2.locator('button.tab-btn[data-tab="flow"]').click().catch(()=>{});
await p2.waitForTimeout(500);
const srcs=[];const n=await p2.locator('.flow-step[data-step]').count();
for(let i=0;i<n;i++){await p2.locator('.flow-step[data-step="'+i+'"]').click();await p2.waitForTimeout(450);const s=await p2.evaluate(()=>{const f=document.querySelector('.flow-detail iframe');return f?f.getAttribute('src'):null;});srcs.push(i+'→'+(s?s.split('/').pop():null));}
const ov2={};for(const w of [1360,390]){await p2.setViewportSize({width:w,height:1050});await p2.waitForTimeout(400);ov2[w]=await p2.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);}
await p2.setViewportSize({width:1360,height:1150});await p2.locator('.flow-step[data-step="2"]').click().catch(()=>{});await p2.waitForTimeout(800);
await p2.locator('[data-panel="flow"]').screenshot({path:'d:/tmp/002flow-final.png'}).catch(()=>{});
await p2.locator('.flow-step[data-step="3"]').click().catch(()=>{});await p2.waitForTimeout(800);
await p2.locator('[data-panel="flow"]').screenshot({path:'d:/tmp/002flow-step4.png'}).catch(()=>{});
console.log('DETAIL h1:',h1);
console.log('DETAIL flow step→iframe:',JSON.stringify(srcs));
console.log('DETAIL overflow:',JSON.stringify(ov2),'errors:',JSON.stringify(e2.slice(0,4)));
await b.close();
