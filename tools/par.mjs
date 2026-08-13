import { chromium } from 'playwright';
const b=await chromium.launch({channel:'chrome'});const p=await(await b.newContext()).newPage();
const c=await p.context().newCDPSession(p);await c.send('Network.setCacheDisabled',{cacheDisabled:true});
await p.setViewportSize({width:390,height:900});
await p.goto('http://localhost:4599/demos/jvision-smart-mfg-036-process-parameter-monitoring-system/#go=1',{waitUntil:'load'});await p.waitForTimeout:300;
await p.waitForTimeout(300);
const r=await p.evaluate(()=>{const cw=document.documentElement.clientWidth;let el=[...document.querySelectorAll('.stat')].find(e=>e.getBoundingClientRect().right>cw);if(!el)return'none';const par=el.parentElement;const cs=getComputedStyle(par);return{parClass:par.className,parTag:par.tagName,disp:cs.display,wrap:cs.flexWrap,w:Math.round(par.getBoundingClientRect().width),childW:Math.round([...par.children].reduce((a,c)=>a+c.getBoundingClientRect().width,0))};});
console.log(JSON.stringify(r));
await b.close();
