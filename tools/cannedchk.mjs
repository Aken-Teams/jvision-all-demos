import { chromium } from 'playwright';
const b=await chromium.launch({channel:'chrome'});
const p=await(await b.newContext()).newPage();
const c=await p.context().newCDPSession(p);await c.send('Network.setCacheDisabled',{cacheDisabled:true});
// canned mode
await p.goto('http://localhost:4599/agents-mission?case=1',{waitUntil:'load'});await p.waitForTimeout(1200);
const canned=await p.evaluate(()=>({
  liveHidden: document.querySelector('#liveAsk')?.hidden,
  cannedShown: document.querySelector('#cannedAsk')?.hidden===false,
  question: document.querySelector('#demoQuestion')?.textContent?.slice(0,30),
  statsShown: document.querySelector('#cannedStats')?.hidden===false,
  agentChips: [...document.querySelectorAll('#runAgents *')].map(e=>e.textContent).filter(t=>t&&t.length<8).slice(0,8),
  hasSupervisorEng: document.body.innerText.includes('supervisor'),
  rightHasContent: (document.querySelector('#resultFrame')?.offsetParent!==null) || (document.querySelector('#livePanel')?true:false)
}));
console.log('CANNED ?case=1:', JSON.stringify(canned,null,1));
await b.close();
