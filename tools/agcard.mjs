import { chromium } from 'playwright';
const b=await chromium.launch({channel:'chrome'});
const p=await(await b.newContext()).newPage();
const c=await p.context().newCDPSession(p);await c.send('Network.setCacheDisabled',{cacheDisabled:true});
await p.goto('http://localhost:4599/agents.html',{waitUntil:'load'});
await p.waitForTimeout(600);
const cards=await p.evaluate(()=>{
  // filter to 選型顧問 cat then read card titles
  const gen=AGENTS.filter(a=>a.cat==='match'&&/^g/.test(a.id)).slice(0,6);
  return gen.map(a=>({title:a.label, sub:a.sub}));
});
console.log('選型顧問 6 張卡片標題/副標:');
cards.forEach(c=>console.log('  '+c.title+' / '+c.sub));
await b.close();
