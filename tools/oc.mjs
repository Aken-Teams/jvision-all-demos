import { chromium } from 'playwright';
const repo=process.argv[2];
const b=await chromium.launch({channel:'chrome'});const ctx=await b.newContext();const p=await ctx.newPage();
const c=await ctx.newCDPSession(p);await c.send('Network.setCacheDisabled',{cacheDisabled:true});
await p.setViewportSize({width:390,height:900});
const B='http://localhost:4599/demos/'+repo+'/';
const navN=await(async()=>{await p.goto(B,{waitUntil:'load'});await p.waitForTimeout(300);return p.evaluate(()=>document.querySelectorAll('[data-i]').length);})();
for(let g=0;g<navN;g++){await p.goto(B+'#go='+g,{waitUntil:'load'});await p.waitForTimeout(250);
 const r=await p.evaluate(()=>{const cw=document.documentElement.clientWidth;const ov=document.documentElement.scrollWidth-cw;if(ov<=1)return null;
  const bad=[];document.querySelectorAll('*').forEach(el=>{const r=el.getBoundingClientRect();if(r.right>cw+1&&el.offsetWidth>60){let a=el.parentElement,clip=false;while(a){const cs=getComputedStyle(a);if(/(auto|hidden|scroll)/.test(cs.overflowX)){clip=true;break;}a=a.parentElement;}if(!clip&&el.children.length<=2)bad.push(el.tagName+'.'+((''+el.className).slice(0,26))+' w='+Math.round(el.offsetWidth));}});
  return{ov,bad:[...new Set(bad)].slice(0,3)};});
 if(r)console.log(repo.slice(-24)+' go='+g+' ov='+r.ov+' '+JSON.stringify(r.bad));}
await b.close();
