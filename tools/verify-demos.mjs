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
    const t=await p.evaluate(()=>{const vis=el=>el&&el.offsetParent!==null;const v=document.querySelector("#vt");if(v&&vis(v)&&v.textContent.trim())return v.textContent.trim();const hs=[...document.querySelectorAll(".vh h2,.view-h h1,#view h2,#view h1,main h2,main h1,section h2,.head h2,.phead h1")];for(const h of hs){if(vis(h)&&h.textContent.trim())return h.textContent.trim();}const cont=[...document.querySelectorAll("#view,.vbody,.view,section,main,.wrap")].find(e=>vis(e)&&e.innerText&&e.innerText.trim().length>20);return cont?cont.innerText.slice(0,60).replace(/s+/g," ").trim():"?";});shots.push(g+":"+t);}
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
