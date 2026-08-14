import { chromium } from 'playwright';
const b=await chromium.launch({channel:'chrome'});
const ctx=await b.newContext();const p=await ctx.newPage();
const c=await p.context().newCDPSession(p);await c.send('Network.setCacheDisabled',{cacheDisabled:true});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
const q=encodeURIComponent('幫我看一下目前 MES 狀況能不能做新產品');
await p.goto('http://localhost:4599/agents-mission?q='+q,{waitUntil:'load'});
// after layout: skeleton blocks
await p.waitForTimeout(8000);
const early=await p.evaluate(()=>({
  gridBlocks: document.querySelectorAll('#lrGrid > .jvblk').length,
  skeletons: document.querySelectorAll('#lrGrid .jvskel').length,
  boundedHeight: (function(){var e=document.querySelector('#liveResult');return e?getComputedStyle(e).maxHeight:'?'})()
}));
console.log('骨架階段:', JSON.stringify(early));
// wait done
for(let i=0;i<70;i++){
  await p.waitForTimeout(2000);
  const s=await p.evaluate(()=>({filled:document.querySelectorAll('#lrGrid canvas').length, skel:document.querySelectorAll('#lrGrid .jvskel').length, busy:document.querySelector('#missRun')?.disabled}));
  if(s.filled>0 && s.busy===false){console.log('DONE',JSON.stringify(s));break;}
}
const fin=await p.evaluate(()=>({
  gridBlocks: document.querySelectorAll('#lrGrid > .jvblk').length,
  charts: document.querySelectorAll('#lrGrid canvas').length,
  kpis: document.querySelectorAll('#lrGrid .jv-kpi').length,
  remainingSkel: document.querySelectorAll('#lrGrid .jvskel').length,
  oneGrid: !!document.querySelector('#lrGrid'),
  resultHeight: Math.round(document.querySelector('#liveResult')?.getBoundingClientRect().height||0)
}));
console.log('FINAL:', JSON.stringify(fin));
// export new tab
const pagesBefore=ctx.pages().length;
await p.click('#resultOpen').catch(()=>{});
await p.waitForTimeout(800);
console.log('新分頁開啟:', ctx.pages().length>pagesBefore, '| errs:', JSON.stringify(errs.slice(0,2)));
await b.close();
