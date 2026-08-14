import { chromium } from 'playwright';
const b=await chromium.launch({channel:'chrome'});
const p=await(await b.newContext()).newPage();
const c=await p.context().newCDPSession(p);await c.send('Network.setCacheDisabled',{cacheDisabled:true});
const reqs=[];p.on('response',r=>{if(r.url().includes('agents.generated'))reqs.push(r.url().split('/').pop()+':'+r.status());});
await p.goto('http://localhost:4599/agents-profile.html?id=g200',{waitUntil:'load'});
await p.waitForTimeout(700);
const r=await p.evaluate(()=>({
  hasData: typeof window.__AGENTS_DATA!=='undefined' ? window.__AGENTS_DATA.length : 'undefined',
  agentsLen: typeof AGENTS!=='undefined'?AGENTS.length:-1,
  hasG200: typeof AGENTS!=='undefined'? !!AGENTS.find(a=>a.id==='g200') : false,
  dataPage: document.body.dataset.page
}));
console.log('generated.js requests:',JSON.stringify(reqs));
console.log(JSON.stringify(r));
await b.close();
