import { chromium } from 'playwright';
const b=await chromium.launch({channel:'chrome'});
const ctx=await b.newContext();
const p=await ctx.newPage();
const cdp=await ctx.newCDPSession(p);
await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
const errs=[];p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});p.on('pageerror',e=>errs.push('PE:'+e.message));
await p.goto('http://localhost:4599/project.html?repo=jvision-ai-case-002-work-order-dispatch',{waitUntil:'load'});
await p.waitForFunction(()=>{const h=document.querySelector('h1');return h&&h.textContent&&h.textContent!=='找不到這個專案';},{timeout:12000}).catch(()=>{});
await p.waitForSelector('.flow-step',{timeout:12000}).catch(()=>{});
const ft=p.locator('button.tab-btn[data-tab="flow"]');
if(await ft.count()){await ft.click();await p.waitForTimeout(500);}
await p.waitForTimeout(600);
for(const w of [1360,390]){
  await p.setViewportSize({width:w,height:1050});await p.waitForTimeout(500);
  const o=await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  const m=await p.evaluate(()=>{const wrap=document.querySelector('.jv-flow-embed');const f=document.querySelector('.jv-flow-frame');if(!wrap)return{no:1};return{wrapW:wrap.clientWidth|0,wrapH:wrap.clientHeight|0,scale:f?f.style.transform:null,src:f?(f.src||f.dataset.src):null};});
  console.log('@'+w,'pageOverflow:',o,'| embed:',JSON.stringify(m));
  const sec=p.locator('[data-panel="flow"]');
  await (await sec.count()?sec.screenshot({path:'d:/tmp/f-'+w+'.png'}).catch(()=>p.screenshot({path:'d:/tmp/f-'+w+'.png'})):p.screenshot({path:'d:/tmp/f-'+w+'.png'}));
}
// click step 2 and screenshot to confirm swap works
await p.setViewportSize({width:1360,height:1050});await p.waitForTimeout(300);
await p.locator('.flow-step[data-step="1"]').click().catch(()=>{});
await p.waitForTimeout(700);
await p.locator('[data-panel="flow"]').screenshot({path:'d:/tmp/f-step2.png'}).catch(()=>{});
const h1=await p.locator('h1').first().textContent().catch(()=>'?');
console.log('h1:',h1,'| errors:',JSON.stringify(errs.slice(0,6)));
await b.close();
