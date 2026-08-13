import { chromium } from 'playwright';
const B='http://localhost:4599/demos/';
const demos=["jvision-ai-case-001-production-scheduler","jvision-maintenance","jvision-bakery-pos","jvision-clinic","jvision-tms","jvision-smart-mfg-111-customer-relationship-management"];
const b=await chromium.launch({channel:'chrome'});
const ctx=await b.newContext();
for(const d of demos){
  const p=await ctx.newPage();const c=await ctx.newCDPSession(p);await c.send('Network.setCacheDisabled',{cacheDisabled:true});
  const errs=[];p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});p.on('pageerror',e=>errs.push('PE:'+e.message));
  const url=B+d+'/';
  const seen=[];
  for(const g of [0,1,3]){await p.goto(url+'#go='+g,{waitUntil:'load'});await p.waitForTimeout(300);
    const t=await p.evaluate(()=>{const el=document.querySelector('.on')&&document.querySelector('h1,h2,#vt');return (document.querySelector('#vt')||document.querySelector('.view-h h1,.vh h2,h1,h2')||{}).textContent||'?';});
    seen.push('go'+g+':'+(t||'').trim().slice(0,10));}
  // overflow at 390
  await p.setViewportSize({width:390,height:900});await p.goto(url+'#go=1',{waitUntil:'load'});await p.waitForTimeout(300);
  const ov=await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  console.log(d.slice(0,34).padEnd(34),'| views:',seen.join(' '),'| 390ov:',ov,'| err:',errs.length);
  await p.close();
}
await b.close();
