import { chromium } from 'playwright';
const b=await chromium.launch({channel:'chrome'});
const p=await b.newPage();
const fails=[];p.on('requestfailed',r=>fails.push(r.url()+' '+r.failure()?.errorText));
await p.goto('http://localhost:4599/project.html?repo=jvision-ai-case-002-work-order-dispatch',{waitUntil:'load'});
try{await p.waitForSelector('.flow-step',{timeout:9000});}catch(e){console.log('no flow-step; h1=',await p.locator('h1').first().textContent().catch(()=>'?'));console.log('failed req:',fails.slice(0,6));await b.close();process.exit(0);}
// activate flow tab
const ft=p.locator('button:has-text("運作流程"),[data-tab="flow"]').first();
if(await ft.count()){await ft.click();await p.waitForTimeout(300);}
await p.locator('.flow-step[data-step]').first().click().catch(()=>{});
await p.waitForTimeout(700);
for(const w of [1360,768,390]){
  await p.setViewportSize({width:w,height:1000});await p.waitForTimeout(300);
  const o=await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  const dd=await p.evaluate(()=>{const el=document.querySelector('.flow-detail');const f=document.querySelector('.flow-detail iframe');return{det:el?el.getBoundingClientRect().width|0:null,ifr:f?f.getBoundingClientRect().width|0:null,ifrH:f?f.getBoundingClientRect().height|0:null};});
  console.log('@'+w,'pageOverflow:',o,'detailW:',dd.det,'iframeW:',dd.ifr,'iframeH:',dd.ifrH);
  const sec=p.locator('[data-panel="flow"]');
  await sec.screenshot({path:'d:/tmp/002flow-'+w+'.png'}).catch(async()=>{await p.screenshot({path:'d:/tmp/002flow-'+w+'.png'});});
}
await b.close();
