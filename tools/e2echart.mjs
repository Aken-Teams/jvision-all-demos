import { chromium } from 'playwright';
const b=await chromium.launch({channel:'chrome'});
const p=await(await b.newContext()).newPage();
const c=await p.context().newCDPSession(p);await c.send('Network.setCacheDisabled',{cacheDisabled:true});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
const q=encodeURIComponent('幫我看一下目前 MES 狀況能不能做新產品');
await p.goto('http://localhost:4599/agents-mission?q='+q,{waitUntil:'load'});
await p.waitForTimeout(1000);
// UX checks right after load
const ux=await p.evaluate(()=>({
  urlHasQ: location.search.includes('q='),
  caseSwitcherShown: (function(){var e=document.querySelector('#caseSwitcher');return e?getComputedStyle(e).display!=='none':false})(),
  cannedStatsShown: (function(){var e=document.querySelector('#cannedStats');return e?getComputedStyle(e).display!=='none':false})(),
  runBtnDisabled: document.querySelector('#missRun')?.disabled
}));
console.log('UX(載入後):', JSON.stringify(ux));
// wait for done
for(let i=0;i<70;i++){
  await p.waitForTimeout(2000);
  const s=await p.evaluate(()=>({secs:document.querySelectorAll('#lrSections > div').length, waitGone:!document.querySelector('#lrWait'), canvas:document.querySelectorAll('#lrSections canvas').length}));
  if(s.waitGone && s.secs>0){console.log('DONE',JSON.stringify(s));break;}
}
const fin=await p.evaluate(()=>({
  sections:document.querySelectorAll('#lrSections > div').length,
  echartsCanvas:document.querySelectorAll('#lrSections canvas').length,
  kpiCards:document.querySelectorAll('#lrSections .jv-kpi').length,
  runBtnEnabled: !document.querySelector('#missRun')?.disabled
}));
console.log('FINAL:', JSON.stringify(fin), 'errs:', JSON.stringify(errs.slice(0,2)));
await b.close();
