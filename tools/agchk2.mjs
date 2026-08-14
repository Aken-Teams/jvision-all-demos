import { chromium } from 'playwright';
const b=await chromium.launch({channel:'chrome'});
const p=await(await b.newContext()).newPage();
const c=await p.context().newCDPSession(p);await c.send('Network.setCacheDisabled',{cacheDisabled:true});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:4599/agents-profile.html?id=g200',{waitUntil:'load'});
await p.waitForTimeout(800);
const r=await p.evaluate(()=>{
  const grab=id=>{const e=document.getElementById(id);return e?e.textContent.trim().slice(0,40):'(#'+id+' none)';};
  // try common ids
  return {title:document.title, h:[...document.querySelectorAll('h1,h2')].map(x=>x.textContent.trim()).filter(Boolean).slice(0,3),
    bodyHas_g200:document.body.innerText.includes('數據洞察'),
    firstChip:(document.querySelector('.eyebrow,[class*=badge]')||{}).textContent};
});
console.log(JSON.stringify(r));
console.log('errs:',JSON.stringify(errs.slice(0,3)));
await b.close();
