import { chromium } from 'playwright';
const b=await chromium.launch({channel:'chrome'});
const p=await(await b.newContext()).newPage();
const c=await p.context().newCDPSession(p);await c.send('Network.setCacheDisabled',{cacheDisabled:true});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
const q=encodeURIComponent('幫我看一下目前 MES 狀況能不能做新產品');
await p.goto('http://localhost:4599/agents-mission?q='+q,{waitUntil:'load'});
// wait until FINAL (sections done) up to 120s
let done=false;
for(let i=0;i<60;i++){
  await p.waitForTimeout(2000);
  const s=await p.evaluate(()=>({
    sections: document.querySelectorAll('#lrSections > div').length,
    bubbles: document.querySelectorAll('#logFeed > div').length,
    hasCmd: (document.querySelector('#logFeed')?.textContent||'').includes('智策'),
    caseSwitcherHidden: document.querySelector('#caseSwitcher')?.hidden,
    finalWaitGone: !document.querySelector('#lrWait')
  }));
  if(s.finalWaitGone && s.sections>0){ done=true; console.log('DONE', JSON.stringify(s)); break; }
  if(i%5===0) console.log('...waiting', JSON.stringify(s));
}
const final=await p.evaluate(()=>({
  sections: document.querySelectorAll('#lrSections > div').length,
  sectionHasSVG: !!document.querySelector('#lrSections svg'),
  sectionHasKpiNums: /\d/.test(document.querySelector('#lrSections')?.textContent||''),
  bubbles: document.querySelectorAll('#logFeed > div').length,
  starRawLeft: (document.querySelector('#logFeed')?.textContent||'').includes('**')
}));
console.log('FINAL', JSON.stringify(final), 'errs:', JSON.stringify(errs.slice(0,2)));
await b.close();
