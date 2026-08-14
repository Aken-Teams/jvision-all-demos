import { chromium } from 'playwright';
const b=await chromium.launch({channel:'chrome'});
const p=await(await b.newContext()).newPage();
const c=await p.context().newCDPSession(p);await c.send('Network.setCacheDisabled',{cacheDisabled:true});
var runPosted=false;
p.on('request',r=>{ if(r.url().includes(':4610/run')&&r.method()==='POST') runPosted=true; });
await p.goto('http://localhost:4599/agents-mission?q=%E5%B9%AB%E6%88%91%E6%8E%92%E7%94%9F%E7%94%A2%E5%B7%A5%E5%96%AE&mode=task',{waitUntil:'load'});
await p.waitForTimeout(1500);
const r=await p.evaluate(()=>({
  input:(document.querySelector('#missInput')||{}).value,
  missCode:(document.querySelector('#missCode')||{}).textContent,
  cannedIframeVisible: (function(){var f=document.querySelector('#resultFrame');return f? f.style.display!=='none':false;})(),
  caseTabsHTML: (document.querySelector('#caseTabs')||{}).innerHTML.slice(0,50),
  feedHasCanned: (document.querySelector('#logFeed')||{}).textContent.length
}));
console.log(JSON.stringify(r,null,1));
console.log('POST /run 已發出:', runPosted);
await b.close();
