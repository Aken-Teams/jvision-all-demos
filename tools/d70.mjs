import { chromium } from 'playwright';
const b=await chromium.launch({channel:'chrome'});const p=await(await b.newContext()).newPage();
const c=await p.context().newCDPSession(p);await c.send('Network.setCacheDisabled',{cacheDisabled:true});
const errs=[];p.on('pageerror',e=>errs.push((e.stack||e.message).split('\n').slice(0,2).join(' | ')));p.on('console',m=>{if(m.type()==='error')errs.push('C:'+m.text());});
await p.setViewportSize({width:1300,height:900});
await p.goto('http://localhost:4599/demos/jvision-smart-mfg-070-ai-aoi/#go=0',{waitUntil:'load'});await p.waitForTimeout(800);
const r=await p.evaluate(()=>{
 const built=[...document.querySelectorAll('.apexcharts-canvas')].map(cv=>cv.closest('[id]')?.id||'?');
 const chartDivs=[...document.querySelectorAll('#c0a,#c0b,#c0c,[id^="c0"]')].map(e=>e.id+':h'+Math.round(e.getBoundingClientRect().height));
 return{built,chartDivs};
});
console.log('built apex canvases in:',JSON.stringify(r.built));
console.log('chart divs heights:',JSON.stringify(r.chartDivs));
console.log('errors:',JSON.stringify(errs.slice(0,4)));
await b.close();
