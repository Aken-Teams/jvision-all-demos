import { chromium } from 'playwright';
const B='http://localhost:4599';
const demo=B+'/demos/jvision-ai-case-002-work-order-dispatch/';
const b=await chromium.launch({channel:'chrome'});
const ctx=await b.newContext();const p=await ctx.newPage();
const errs=[];p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});p.on('pageerror',e=>errs.push('PE:'+e.message));
// find overflow culprit at 390 across views
await p.setViewportSize({width:390,height:900});
const culprits={};
for(const g of [0,1,2,3,4,5,6]){
  await p.goto(demo+'#go='+g,{waitUntil:'load'});await p.waitForTimeout(200);
  const r=await p.evaluate(()=>{const cw=document.documentElement.clientWidth;let worst=null,mx=cw;document.querySelectorAll('*').forEach(el=>{const b=el.getBoundingClientRect();if(b.right>mx+0.5){mx=b.right;worst=el.tagName+'.'+(el.className&&el.className.toString?el.className.toString().slice(0,24):'')+' w='+Math.round(b.width);}});return{ov:document.documentElement.scrollWidth-cw,worst};});
  culprits['go='+g]=r;
}
console.log('390 culprits:',JSON.stringify(culprits,null,0));
await b.close();
