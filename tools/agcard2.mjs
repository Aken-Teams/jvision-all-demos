import { chromium } from 'playwright';
const b=await chromium.launch({channel:'chrome'});
const p=await(await b.newContext()).newPage();
const c=await p.context().newCDPSession(p);await c.send('Network.setCacheDisabled',{cacheDisabled:true});
await p.setViewportSize({width:1280,height:1000});
await p.goto('http://localhost:4599/agents.html',{waitUntil:'load'});
await p.waitForTimeout(700);
// caps variety across 選型顧問
const caps=await p.evaluate(()=>AGENTS.filter(a=>a.cat==='match'&&/^g/.test(a.id)).slice(0,5).map(a=>a.dom+': '+a.caps.join('/')));
console.log('標籤變化:');caps.forEach(x=>console.log('  '+x));
// chip row vertical alignment: measure top of each chip container in first row of cards
const tops=await p.evaluate(()=>{
  const chipRows=[...document.querySelectorAll('#grid a, #agentGrid a, main a')].map(card=>{
    const rows=card.querySelectorAll(':scope > div');
    const chip=[...card.querySelectorAll('div')].find(d=>d.className.includes('flex-wrap'));
    return chip?Math.round(chip.getBoundingClientRect().top):null;
  }).filter(v=>v!=null).slice(0,6);
  return chipRows;
});
console.log('前 6 張卡片 chip 列的 top（同列應接近相同）:',JSON.stringify(tops));
await b.close();
