import { chromium } from 'playwright';
const b=await chromium.launch({channel:'chrome'});const ctx=await b.newContext();const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push('C:'+m.text());});
await p.goto('http://localhost:4599/demos/jvision-inventory/#go=0',{waitUntil:'networkidle'});await p.waitForTimeout(1000);
const r=await p.evaluate(()=>({apexType:typeof ApexCharts,apxCanvas:document.querySelectorAll('.apexcharts-canvas').length,chartDivs:[...document.querySelectorAll('[id]')].filter(e=>/chart|apx|c_|recv|trend|donut/i.test(e.id)).map(e=>e.id).slice(0,10)}));
console.log('ApexCharts loaded:',r.apexType,'| .apexcharts-canvas:',r.apxCanvas,'| candidate chart ids:',JSON.stringify(r.chartDivs));
console.log('errors:',JSON.stringify(errs.slice(0,4)));
await b.close();
