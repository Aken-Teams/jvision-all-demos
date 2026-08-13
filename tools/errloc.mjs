import { chromium } from 'playwright';
const b=await chromium.launch({channel:'chrome'});const ctx=await b.newContext();const p=await ctx.newPage();
const c=await ctx.newCDPSession(p);await c.send('Network.setCacheDisabled',{cacheDisabled:true});
const errs=[];p.on('pageerror',e=>errs.push(e.stack||e.message));
await p.goto('http://localhost:4599/demos/jvision-ai-case-064-cpa-practice-ops/#go=1',{waitUntil:'load'});await p.waitForTimeout(500);
console.log(errs.slice(0,2).join('\n---\n'));
await b.close();
