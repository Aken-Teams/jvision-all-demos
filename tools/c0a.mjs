import { chromium } from 'playwright';
const b=await chromium.launch({channel:'chrome'});const p=await(await b.newContext()).newPage();
const c=await p.context().newCDPSession(p);await c.send('Network.setCacheDisabled',{cacheDisabled:true});
await p.setViewportSize({width:1300,height:900});
await p.goto('http://localhost:4599/demos/jvision-smart-mfg-070-ai-aoi/#go=0',{waitUntil:'load'});await p.waitForTimeout(700);
const r=await p.evaluate(()=>{const el=document.getElementById('c0a');if(!el)return{noel:1};const canv=el.querySelector('.apexcharts-canvas');const bars=el.querySelectorAll('.apexcharts-bar-area, path.apexcharts-bar-area, rect');return{w:Math.round(el.getBoundingClientRect().width),h:Math.round(el.getBoundingClientRect().height),hasCanvas:!!canv,bars:bars.length,innerLen:el.innerHTML.length};});
console.log(JSON.stringify(r));
await b.close();
