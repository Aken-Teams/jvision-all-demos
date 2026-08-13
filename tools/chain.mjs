import { chromium } from 'playwright';
const b=await chromium.launch({channel:'chrome'});const ctx=await b.newContext();const p=await ctx.newPage();
const c=await ctx.newCDPSession(p);await c.send('Network.setCacheDisabled',{cacheDisabled:true});
await p.setViewportSize({width:390,height:900});
await p.goto('http://localhost:4599/demos/jvision-ai-case-030-bakery-production-pos/#go=0',{waitUntil:'load'});await p.waitForTimeout(250);
const r=await p.evaluate(()=>{let el=document.querySelector('.board-in');const chain=[];while(el&&el!==document.body){const cs=getComputedStyle(el);chain.push(el.tagName+'.'+((''+el.className).slice(0,22))+' w='+Math.round(el.getBoundingClientRect().width)+' ov='+cs.overflowX+' mw='+cs.minWidth+' disp='+cs.display);el=el.parentElement;}return chain;});
console.log(r.join('\n'));
await b.close();
