import { chromium } from 'playwright';
const b=await chromium.launch({channel:'chrome'});const p=await(await b.newContext()).newPage();
const c=await p.context().newCDPSession(p);await c.send('Network.setCacheDisabled',{cacheDisabled:true});
await p.setViewportSize({width:1360,height:900});
await p.goto('http://localhost:4599/demos/jvision-smart-mfg-067-outgoing-quality-control/#go=1',{waitUntil:'load'});await p.waitForTimeout(500);
const r=await p.evaluate(()=>{
 // find element containing 外觀檢查 that is very narrow
 let sq=null;document.querySelectorAll('*').forEach(el=>{if(/外觀檢查/.test(el.textContent||'')&&el.children.length<=3){const w=el.getBoundingClientRect().width;if(w<80&&w>0&&!sq)sq=el;}});
 if(!sq)return'none';let par=sq;const chain=[];for(let k=0;k<4&&par;k++){const cs=getComputedStyle(par);chain.push(par.tagName+'.'+((''+par.className).slice(0,20))+' w='+Math.round(par.getBoundingClientRect().width)+' disp='+cs.display+' gtc='+cs.gridTemplateColumns.slice(0,50));par=par.parentElement;}
 return chain;
});
console.log(JSON.stringify(r,null,1));
await b.close();
