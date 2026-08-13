import { chromium } from 'playwright';
const repo=process.argv[2];
const b=await chromium.launch({channel:'chrome'});const ctx=await b.newContext();const p=await ctx.newPage();
const c=await ctx.newCDPSession(p);await c.send('Network.setCacheDisabled',{cacheDisabled:true});
await p.setViewportSize({width:1200,height:900});
const B='http://localhost:4599/demos/'+repo+'/';
const navN=await(async()=>{await p.goto(B,{waitUntil:'load'});await p.waitForTimeout(300);return p.evaluate(()=>document.querySelectorAll('[data-i]').length);})();
for(let g=0;g<navN;g++){await p.goto(B+'#go='+g,{waitUntil:'load'});await p.waitForTimeout(500);
 const r=await p.evaluate(()=>{const out=[];
  document.querySelectorAll('canvas').forEach(cn=>{const r=cn.getBoundingClientRect();out.push('canvas '+Math.round(r.width)+'x'+Math.round(r.height));});
  // echarts divs
  document.querySelectorAll('[_echarts_instance_]').forEach(d=>{const r=d.getBoundingClientRect();out.push('echartsDiv '+Math.round(r.width)+'x'+Math.round(r.height));});
  return out;});
 console.log('go='+g+': '+(r.length?r.join(', '):'(no chart elements)'));}
await b.close();
