import { chromium } from 'playwright';
const b=await chromium.launch({channel:'chrome'});const p=await(await b.newContext()).newPage();
const c=await p.context().newCDPSession(p);await c.send('Network.setCacheDisabled',{cacheDisabled:true});
await p.setViewportSize({width:1200,height:900});
for(let g=0;g<6;g++){await p.goto('http://localhost:4599/demos/jvision-smart-mfg-026-warehouse-control-system/#go='+g,{waitUntil:'load'});await p.waitForTimeout(500);
 const r=await p.evaluate(()=>{const polys=[...document.querySelectorAll('.apexcharts-radar-series polygon')];if(!polys.length)return null;const nan=polys.some(pg=>(pg.getAttribute('points')||'').includes('NaN'));const first=polys[0].getAttribute('points')||'';return{n:polys.length,nan,sample:first.slice(0,60)};});
 if(r)console.log('go='+g+' radar:',JSON.stringify(r));}
await b.close();
