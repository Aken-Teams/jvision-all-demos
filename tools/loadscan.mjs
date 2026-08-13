import { chromium } from 'playwright';
const repos=process.argv.slice(2);
const b=await chromium.launch({channel:'chrome'});const ctx=await b.newContext();
for(const r of repos){
 const p=await ctx.newPage();const c=await ctx.newCDPSession(p);await c.send('Network.setCacheDisabled',{cacheDisabled:true});
 await p.setViewportSize({width:1200,height:900});
 let res='?';
 try{await p.goto('http://localhost:4599/demos/'+r+'/',{waitUntil:'load'});await p.waitForTimeout(400);
  const load=await p.evaluate(()=>(document.body.innerText||'').replace(/\s+/g,' ').length);
  // click nav 0
  await p.evaluate(()=>{const bt0=document.querySelector('[data-i="0"]');if(bt0)bt0.click();});await p.waitForTimeout(300);
  const clicked=await p.evaluate(()=>(document.body.innerText||'').replace(/\s+/g,' ').length);
  res=(load>=clicked-30)?'ok':'BLANK-ON-LOAD (load='+load+' vs click='+clicked+')';
 }catch(e){res='err';}
 console.log((res==='ok'?'ok    ':'XX    ')+r.replace('jvision-','')+' '+(res==='ok'?'':res));
 await p.close();
}
await b.close();
