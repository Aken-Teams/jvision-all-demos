import { chromium } from 'playwright';
import { readFileSync, existsSync } from 'fs';
const repos=process.argv.slice(2).filter(r=>{try{return !readFileSync('demos/'+r+'/index.html','utf8').includes('shared/jvision-demo-app');}catch(e){return false;}});
const b=await chromium.launch({channel:'chrome'});const ctx=await b.newContext();
for(const r of repos){
 const p=await ctx.newPage();const c=await ctx.newCDPSession(p);await c.send('Network.setCacheDisabled',{cacheDisabled:true});
 await p.setViewportSize({width:1200,height:900});
 const B='http://localhost:4599/demos/'+r+'/';
 let navN=0;try{await p.goto(B,{waitUntil:'load'});await p.waitForTimeout(300);navN=await p.evaluate(()=>document.querySelectorAll('[data-i]').length);}catch(e){}
 let totalCharts=0,drawnCharts=0,usesLib='none';
 const src=readFileSync('demos/'+r+'/index.html','utf8');
 usesLib=/apexcharts/i.test(src)?'apex':/chart\.umd|new Chart/i.test(src)?'chartjs':/echarts/i.test(src)?'echarts':'none';
 for(let g=0;g<navN;g++){await p.goto(B+'#go='+g,{waitUntil:'load'});await p.waitForTimeout(400);
  const r2=await p.evaluate(()=>{let t=0,d=0;
   document.querySelectorAll('.apexcharts-canvas').forEach(cv=>{t++;const s=cv.querySelectorAll('path,polygon,rect,circle');let ok=false;s.forEach(x=>{try{const bb=x.getBBox();if(bb.width>2&&bb.height>2)ok=true;}catch(e){}});if(ok)d++;});
   document.querySelectorAll('canvas').forEach(cn=>{if(cn.closest('.apexcharts-canvas'))return;t++;try{const cx=cn.getContext('2d');const im=cx.getImageData(0,0,cn.width,cn.height).data;for(let k=3;k<im.length;k+=800){if(im[k]!==0){d++;break;}}}catch(e){}});
   document.querySelectorAll('[_echarts_instance_] canvas').forEach(cn=>{t++;try{const cx=cn.getContext('2d');const im=cx.getImageData(0,0,cn.width,cn.height).data;for(let k=3;k<im.length;k+=800){if(im[k]!==0){d++;break;}}}catch(e){}});
   return{t,d};});
  totalCharts+=r2.t;drawnCharts+=r2.d;}
 const flag=(usesLib!=='none'&&totalCharts===0)?' <<< NO CHARTS RENDERED':(drawnCharts<totalCharts?' <<< '+(totalCharts-drawnCharts)+' BLANK':'');
 console.log((flag?'XX ':'OK ')+r.padEnd(52)+' lib='+usesLib+' charts='+drawnCharts+'/'+totalCharts+flag);
 await p.close();
}
await b.close();
