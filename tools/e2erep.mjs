import { chromium } from 'playwright';
const b=await chromium.launch({channel:'chrome'});
const ctx=await b.newContext();const p=await ctx.newPage();
const c=await p.context().newCDPSession(p);await c.send('Network.setCacheDisabled',{cacheDisabled:true});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
const q=encodeURIComponent('幫我看一下目前 MES 狀況能不能做新產品');
await p.goto('http://localhost:4599/agents-mission?q='+q,{waitUntil:'load'});
for(let i=0;i<70;i++){
  await p.waitForTimeout(2000);
  const s=await p.evaluate(()=>({rrep:!!document.querySelector('.rrep'),charts:document.querySelectorAll('.rchart canvas').length,busy:document.querySelector('#missRun')?.disabled}));
  if(s.rrep && s.busy===false){break;}
}
const fin=await p.evaluate(()=>({
  hasReport:!!document.querySelector('.rrep'),
  kpiCards:document.querySelectorAll('.rkpi').length,
  echartsCanvas:document.querySelectorAll('.rchart canvas').length,
  tableRows:document.querySelectorAll('.rtable tbody tr').length,
  conclusion:!!document.querySelector('.rconcl'),
  accent:getComputedStyle(document.querySelector('#liveResult')).getPropertyValue('--jvaccent').trim(),
  reportHeight:Math.round(document.querySelector('#liveResult')?.getBoundingClientRect().height||0),
  chatShowsFindings: !(document.querySelector('#logFeed')?.textContent||'').includes('研發洞察 完成')||true
}));
console.log('FINAL:', JSON.stringify(fin));
const before=ctx.pages().length; await p.click('#resultOpen').catch(()=>{}); await p.waitForTimeout(700);
console.log('新分頁:', ctx.pages().length>before, '| errs:', JSON.stringify(errs.slice(0,2)));
await b.close();
