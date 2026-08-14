import { chromium } from 'playwright';
const b=await chromium.launch({channel:'chrome'});
const p=await(await b.newContext()).newPage();
const c=await p.context().newCDPSession(p);await c.send('Network.setCacheDisabled',{cacheDisabled:true});
for(const id of ['g200','orchestrator','g5']){
  await p.goto('http://localhost:4599/agents-profile?id='+id,{waitUntil:'load'});
  await p.waitForTimeout(500);
  const r=await p.evaluate(()=>({
    pfName:(document.querySelector('#pfName')||{}).textContent,
    pfSquad:(document.querySelector('#pfSquad')||{}).textContent,
    tagline:((document.querySelector('#pfTagline')||{}).textContent||'').slice(0,44)
  }));
  console.log(id,'→',JSON.stringify(r));
}
await b.close();
