import { chromium } from 'playwright';
const b=await chromium.launch({channel:'chrome'});const p=await(await b.newContext()).newPage();
const c=await p.context().newCDPSession(p);await c.send('Network.setCacheDisabled',{cacheDisabled:true});
const B='http://localhost:4599/demos/jvision-store-design/#go=0';
for(const w of [1360,900,700,390]){
  await p.setViewportSize({width:w,height:950});
  await p.goto(B,{waitUntil:'load'});await p.waitForTimeout(350);
  const r=await p.evaluate(()=>{
    const e=document.querySelector('.editor');
    const sec=document.querySelector('.sec');
    const st=document.querySelector('.sec .st');
    return {cols:e?getComputedStyle(e).gridTemplateColumns:'none',
      secW:sec?Math.round(sec.getBoundingClientRect().width):0,
      stW:st?Math.round(st.getBoundingClientRect().width):0,
      docOv:document.documentElement.scrollWidth-document.documentElement.clientWidth};
  });
  console.log('w='+w, JSON.stringify(r));
}
await b.close();
