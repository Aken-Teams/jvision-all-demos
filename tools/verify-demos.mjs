import { chromium } from 'playwright';
import { readFileSync, existsSync } from 'fs';
const repos=process.argv.slice(2);
const B='http://localhost:4599/demos/';
const b=await chromium.launch({channel:'chrome'});const ctx=await b.newContext();
let allok=true;
for(const r of repos){
  const dp='content/details/'+r+'.json';
  const D=existsSync(dp)?JSON.parse(readFileSync(dp)):null;
  const steps=D&&D.flow&&D.flow.stages?D.flow.stages.map(s=>s.demo):[];
  const p=await ctx.newPage();const c=await ctx.newCDPSession(p);await c.send('Network.setCacheDisabled',{cacheDisabled:true});
  let err=0;const el=[];p.on('pageerror',e=>{err++;el.push(e.message);});p.on('console',m=>{if(m.type()==='error'){err++;el.push(m.text());}});
  const url=B+r+'/';
  // distinct screens per flow step
  const shots=[];
  for(const dv of steps){const g=(dv||'v0').replace(/\D/g,'');await p.goto(url+'#go='+g,{waitUntil:'load'});await p.waitForTimeout(200);
    const t=await p.evaluate(()=>{const v=document.querySelector('#vt');return v?v.textContent.trim():'?';});shots.push(g+':'+t);}
  const uniq=new Set(shots.map(s=>s.split(':')[1]));
  const navN=await p.evaluate(()=>document.querySelectorAll('[data-i]').length);
  // overflow per view at 3 widths
  const ov={};
  for(const w of [1360,768,390]){await p.setViewportSize({width:w,height:950});let mx=0;
    for(let g=0;g<navN;g++){await p.goto(url+'#go='+g,{waitUntil:'load'});await p.waitForTimeout(160);const o=await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);if(o>mx)mx=o;}
    ov[w]=mx;}
  const distinctOK=steps.length>0&&uniq.size===steps.length;
  const rwdOK=ov[1360]<=0&&ov[768]<=0&&ov[390]<=1;
  const ok=distinctOK&&rwdOK&&err===0;
  if(!ok)allok=false;
  console.log((ok?'✅':'❌')+' '+r.padEnd(46)+' nav='+navN+' steps='+steps.length+' distinct='+uniq.size+' ovMax='+JSON.stringify(ov)+' err='+err+(err?' '+el.slice(0,2).join('|'):'')+(distinctOK?'':' ⚠SAME:'+shots.join(',')));
  await p.close();
}
await b.close();
process.exit(allok?0:1);
