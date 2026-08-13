import { chromium } from 'playwright';
const b=await chromium.launch({channel:'chrome'});const p=await(await b.newContext()).newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push('C:'+m.text());});
await p.goto('http://localhost:4599/demos/jvision-smart-mfg-036-process-parameter-monitoring-system/',{waitUntil:'networkidle'});
await p.waitForTimeout(1000);
const r=await p.evaluate(()=>({
  modLen: (typeof MODULES!=='undefined')?MODULES.length:'undef',
  navEl: !!document.getElementById('nav'),
  navHTML: (document.getElementById('nav')||{}).innerHTML?.length||0,
  dataI: document.querySelectorAll('[data-i]').length,
  bodyText: (document.body.innerText||'').slice(0,50)
}));
console.log(JSON.stringify(r),'errs:',JSON.stringify(errs.slice(0,3)));
await b.close();
