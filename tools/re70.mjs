import { chromium } from 'playwright';
const b=await chromium.launch({channel:'chrome'});const p=await(await b.newContext()).newPage();
const c=await p.context().newCDPSession(p);await c.send('Network.setCacheDisabled',{cacheDisabled:true});
await p.setViewportSize({width:1300,height:900});
const B='http://localhost:4599/demos/jvision-smart-mfg-070-ai-aoi/';
await p.goto(B+'#go=0',{waitUntil:'load'});await p.waitForTimeout(500);
const h1=await p.evaluate(()=>Math.round((document.getElementById('c0a')||{}).getBoundingClientRect?.().height||-1));
// click to go=1 then back to go=0 via nav
await p.evaluate(()=>{const b1=document.querySelector('[data-i="1"]');if(b1)b1.click();});await p.waitForTimeout(400);
await p.evaluate(()=>{const b0=document.querySelector('[data-i="0"]');if(b0)b0.click();});await p.waitForTimeout(500);
const h2=await p.evaluate(()=>Math.round((document.getElementById('c0a')||{}).getBoundingClientRect?.().height||-1));
console.log('c0a height on first load:',h1,'| after nav-away-back:',h2);
await b.close();
