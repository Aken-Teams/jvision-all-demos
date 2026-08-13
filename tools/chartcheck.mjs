import { chromium } from 'playwright';
const repo=process.argv[2];
const b=await chromium.launch({channel:'chrome'});const ctx=await b.newContext();const p=await ctx.newPage();
const c=await ctx.newCDPSession(p);await c.send('Network.setCacheDisabled',{cacheDisabled:true});
await p.setViewportSize({width:1200,height:900});
const B='http://localhost:4599/demos/'+repo+'/';
const navN=await (async()=>{await p.goto(B,{waitUntil:'load'});await p.waitForTimeout(300);return await p.evaluate(()=>document.querySelectorAll('[data-i]').length);})();
const out=[];
for(let g=0;g<navN;g++){await p.goto(B+'#go='+g,{waitUntil:'load'});await p.waitForTimeout(500);
 const r=await p.evaluate(()=>{
   const res=[];
   // ApexCharts
   document.querySelectorAll('.apexcharts-canvas').forEach(cv=>{
     const paths=cv.querySelectorAll('path,polygon,circle,rect.apexcharts-bar-area');
     let drawn=0;paths.forEach(pa=>{const bb=pa.getBBox?pa.getBBox():{width:0,height:0};if(bb.width>2&&bb.height>2)drawn++;});
     res.push('apex:'+drawn+'shapes');
   });
   // Chart.js / canvas
   document.querySelectorAll('canvas').forEach(cn=>{
     if(cn.closest('.apexcharts-canvas'))return;
     const ctx=cn.getContext('2d');let nonblank=false;try{const d=ctx.getImageData(0,0,cn.width,cn.height).data;for(let k=3;k<d.length;k+=400){if(d[k]!==0){nonblank=true;break;}}}catch(e){nonblank='?';}
     res.push('canvas:'+(cn.width>0?'sized':'0w')+(nonblank===true?'/drawn':nonblank==='?'?'/?':'/BLANK'));
   });
   // ECharts
   document.querySelectorAll('canvas[data-zr-dom-id],div _echarts_instance_').forEach(()=>{});
   return res;
 });
 if(r.length)out.push('go='+g+': '+r.join(', '));
}
console.log(repo);console.log(out.join('\n')||'(no apex/canvas charts found)');
await b.close();
