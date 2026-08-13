import { chromium } from 'playwright';
const b=await chromium.launch({channel:'chrome'});const ctx=await b.newContext();const p=await ctx.newPage();
const c=await ctx.newCDPSession(p);await c.send('Network.setCacheDisabled',{cacheDisabled:true});
const logs=[];p.on('pageerror',e=>logs.push('PE:'+e.message));
await p.goto('http://localhost:4599/demos/jvision-ai-case-001-production-scheduler/#go=3',{waitUntil:'load'});
await p.waitForTimeout(300);
const r=await p.evaluate(()=>{
  const out={};
  out.hash=location.hash;
  out.reMatch=(location.hash||'').match(/(?:go=|v)(\d+)/);
  out.typeofShow=typeof show;
  out.dataiCount=document.querySelectorAll('[data-i]').length;
  out.vtBefore=(document.querySelector('#vt')||{}).textContent;
  try{show(3);out.calledShow3='ok';}catch(e){out.calledShow3='ERR:'+e.message;}
  out.vtAfter=(document.querySelector('#vt')||{}).textContent;
  return out;
});
console.log(JSON.stringify(r,null,1));
console.log('errs',logs);
await b.close();
