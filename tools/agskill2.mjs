import { chromium } from 'playwright';
const b=await chromium.launch({channel:'chrome'});
const p=await(await b.newContext()).newPage();
const c=await p.context().newCDPSession(p);await c.send('Network.setCacheDisabled',{cacheDisabled:true});
await p.goto('http://localhost:4599/agents.html',{waitUntil:'load'});await p.waitForTimeout(600);
// card chips for 選型顧問 across domains
const cards=await p.evaluate(()=>AGENTS.filter(a=>a.cat==='match'&&/^g/.test(a.id)).slice(0,4).map(a=>a.dom+': '+a.caps.join('/')));
console.log('卡片標籤（選型顧問，各領域應不同且聚焦）:');cards.forEach(x=>console.log('  '+x));
// profile g13 skills
await p.goto('http://localhost:4599/agents-profile?id=g13',{waitUntil:'load'});await p.waitForTimeout(400);
const ps=await p.evaluate(()=>[...document.querySelectorAll('#pfCaps h5')].map(e=>e.textContent.trim()));
console.log('g13 詳細頁技能:', ps.join(' / '));
await b.close();
