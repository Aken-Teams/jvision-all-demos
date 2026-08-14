import { chromium } from 'playwright';
const b=await chromium.launch({channel:'chrome'});const p=await(await b.newContext()).newPage();
const c=await p.context().newCDPSession(p);await c.send('Network.setCacheDisabled',{cacheDisabled:true});
await p.setViewportSize({width:1300,height:900});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:4599/demos/jvision-smart-mfg-199-automated-material-handling-dispatch/#go=2',{waitUntil:'load'});await p.waitForTimeout(600);
const r=await p.evaluate(()=>{const m=document.querySelector('.map svg');if(!m)return{no:1};return{rects:m.querySelectorAll('rect').length,paths:m.querySelectorAll('path').length,vehicles:m.querySelectorAll('.avhalo').length,texts:m.querySelectorAll('text').length,w:Math.round(m.getBoundingClientRect().width)};});
console.log(JSON.stringify(r),'errs:',JSON.stringify(errs.slice(0,2)));
await b.close();
