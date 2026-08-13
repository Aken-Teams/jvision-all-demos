import { chromium } from 'playwright';
const b=await chromium.launch({channel:'chrome'});const ctx=await b.newContext();const p=await ctx.newPage();
const c=await ctx.newCDPSession(p);await c.send('Network.setCacheDisabled',{cacheDisabled:true});
await p.setViewportSize({width:390,height:900});
await p.goto('http://localhost:4599/demos/jvision-ai-case-030-bakery-production-pos/#go=0',{waitUntil:'load'});await p.waitForTimeout(250);
const r=await p.evaluate(()=>{const cw=document.documentElement.clientWidth;const out=[];
 // find leaf-ish elements overflowing whose ancestors are NOT scroll containers
 document.querySelectorAll('*').forEach(el=>{const rr=el.getBoundingClientRect();if(rr.right<=cw+1)return;
   // skip if inside an overflow auto/hidden/scroll ancestor
   let a=el.parentElement,clipped=false;while(a){const cs=getComputedStyle(a);if(cs.overflowX==='auto'||cs.overflowX==='hidden'||cs.overflowX==='scroll'){clipped=true;break;}a=a.parentElement;}
   if(clipped)return;
   if(el.children.length<=1) out.push(el.tagName+'.'+((''+el.className).slice(0,24))+' w='+Math.round(el.offsetWidth)+' r='+Math.round(rr.right)+' txt='+(el.textContent||'').slice(0,14));
 });
 return out.slice(0,8);
});
console.log(JSON.stringify(r,null,1));
await b.close();
