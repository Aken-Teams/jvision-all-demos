import { chromium } from 'playwright';
const b=await chromium.launch({channel:'chrome'});const ctx=await b.newContext();const p=await ctx.newPage();
const c=await ctx.newCDPSession(p);await c.send('Network.setCacheDisabled',{cacheDisabled:true});
await p.setViewportSize({width:1200,height:900});
await p.goto('http://localhost:4599/demos/jvision-ai-case-055-ai-question-bank/#go=2',{waitUntil:'load'});await p.waitForTimeout(600);
const r=await p.evaluate(()=>{
 const el=document.getElementById('c_radar2');
 if(!el)return{noel:1};
 const rect=el.getBoundingClientRect();
 const svg=el.querySelector('svg');
 const series=el.querySelectorAll('.apexcharts-radar-series polygon, .apexcharts-series polygon, polygon');
 const pts=[...series].slice(0,4).map(pg=>({tag:pg.parentElement.getAttribute('class')||'',points:(pg.getAttribute('points')||'').slice(0,50)}));
 return{w:Math.round(rect.width),h:Math.round(rect.height),hasSvg:!!svg,svgW:svg?svg.getAttribute('width'):null,polys:pts.length,sample:pts};
});
console.log(JSON.stringify(r,null,1));
await b.close();
