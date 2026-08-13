import { chromium } from 'playwright';
const repo=process.argv[2], hashes=process.argv.slice(3);
const b=await chromium.launch({channel:'chrome'});const ctx=await b.newContext();const p=await ctx.newPage();
const c=await ctx.newCDPSession(p);await c.send('Network.setCacheDisabled',{cacheDisabled:true});
await p.setViewportSize({width:390,height:900});
const B='http://localhost:4599/demos/'+repo+'/';
for(const g of hashes){await p.goto(B+'#go='+g,{waitUntil:'load'});await p.waitForTimeout(220);
const r=await p.evaluate(()=>{const cw=document.documentElement.clientWidth;const bad=[];document.querySelectorAll('*').forEach(el=>{const b=el.getBoundingClientRect();if(b.right>cw+1&&el.offsetWidth>60){const vis=el.offsetParent!==null;if(vis)bad.push(el.tagName+'.'+((''+el.className).slice(0,28))+' w='+Math.round(el.offsetWidth)+' r='+Math.round(b.right));}});return{ov:document.documentElement.scrollWidth-cw,bad:bad.slice(0,4)};});
if(r.ov>0)console.log('go='+g,'ov',r.ov,JSON.stringify(r.bad,null,0));}
await b.close();
