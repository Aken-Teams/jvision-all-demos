import { chromium } from 'playwright';
import { readFileSync } from 'fs';
const B='http://localhost:4599/demos/';
const repos=["jvision-ai-case-001-production-scheduler","jvision-ai-case-002-work-order-dispatch","jvision-maintenance","jvision-bakery-pos","jvision-clinic","jvision-tms","jvision-smart-mfg-111-customer-relationship-management"];
const b=await chromium.launch({channel:'chrome'});const ctx=await b.newContext();
for(const r of repos){
  const D=JSON.parse(readFileSync('content/details/'+r+'.json'));
  const steps=D.flow.stages.map(s=>s.demo);
  const p=await ctx.newPage();const c=await ctx.newCDPSession(p);await c.send('Network.setCacheDisabled',{cacheDisabled:true});
  let err=0;p.on('pageerror',()=>err++);
  const shots=[];
  for(const dv of steps){const g=dv.replace(/\D/g,'');await p.goto(B+r+'/#go='+g,{waitUntil:'load'});await p.waitForTimeout(220);
    const t=await p.evaluate(()=>{const v=document.querySelector('#vt');if(v)return v.textContent;const h=document.querySelector('.view-h h1,.vh h2,.on');return h?h.textContent:'?';});
    shots.push(g+':'+(t||'').trim().slice(0,8));}
  const uniq=new Set(shots.map(s=>s.split(':')[1]));
  console.log((uniq.size===steps.length?'✅':'⚠️ DUP')+' '+r.slice(0,40).padEnd(40)+' steps='+steps.length+' distinctScreens='+uniq.size+'  '+shots.join(' | ')+' err='+err);
  await p.close();
}
await b.close();
