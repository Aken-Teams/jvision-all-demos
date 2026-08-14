import { chromium } from 'playwright';
const b=await chromium.launch({channel:'chrome'});const p=await(await b.newContext()).newPage();
const c=await p.context().newCDPSession(p);await c.send('Network.setCacheDisabled',{cacheDisabled:true});
await p.setViewportSize({width:1300,height:900});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:4599/demos/jvision-smart-mfg-133-field-sales-management/',{waitUntil:'load'});await p.waitForTimeout(1200);
const r=await p.evaluate(()=>{const el=document.getElementById('visitmap');if(!el)return{noel:1};return{h:Math.round(el.getBoundingClientRect().height),tiles:el.querySelectorAll('.leaflet-tile').length,markers:el.querySelectorAll('.leaflet-marker-icon').length,poly:el.querySelectorAll('.leaflet-overlay-pane path').length};});
console.log('visitmap:',JSON.stringify(r),'errs:',JSON.stringify(errs.slice(0,2)));
await b.close();
