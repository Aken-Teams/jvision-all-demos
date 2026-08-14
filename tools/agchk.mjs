import { chromium } from 'playwright';
const b=await chromium.launch({channel:'chrome'});
const p=await(await b.newContext()).newPage();
const c=await p.context().newCDPSession(p);await c.send('Network.setCacheDisabled',{cacheDisabled:true});
await p.setViewportSize({width:1280,height:900});
await p.goto('http://localhost:4599/agents.html',{waitUntil:'load'});
await p.waitForTimeout(600);
const info=await p.evaluate(()=>{
  const has=typeof AGENTS!=='undefined';
  return {total:has?AGENTS.length:-1, withDM:has?AGENTS.filter(a=>a.dataMode).length:-1,
    sample:has?{role:AGENTS.find(a=>a.id==='g200').role, dm:AGENTS.find(a=>a.id==='g200').dataMode}:null};
});
console.log('marketplace AGENTS:',info.total,'| 有 dataMode:',info.withDM,'| g200:',JSON.stringify(info.sample));
// profile page for g200 (生產製造·數據洞察)
await p.goto('http://localhost:4599/agents-profile.html?id=g200',{waitUntil:'load'});
await p.waitForTimeout(600);
const prof=await p.evaluate(()=>{
  const t=document.body.innerText;
  return {hasRole:t.includes('數據洞察'), hasDomain:t.includes('生產製造'), hasDetailKPI:t.includes('稼動')||t.includes('良率')};
});
console.log('profile g200:',JSON.stringify(prof));
await b.close();
