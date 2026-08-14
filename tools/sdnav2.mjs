import { chromium } from 'playwright';
const b=await chromium.launch({channel:'chrome'});const p=await(await b.newContext()).newPage();
for(const w of [1360,390]){
  await p.setViewportSize({width:w,height:800});
  await p.goto('http://localhost:4599/demos/jvision-store-design/#go=0',{waitUntil:'load'});await p.waitForTimeout(350);
  await p.evaluate(()=>window.scrollTo(0,1200));await p.waitForTimeout(250);
  const r=await p.evaluate(()=>{
    const brand=document.querySelector('.brand').getBoundingClientRect();
    const main=document.querySelector('.main').getBoundingClientRect();
    return {w:window.innerWidth,brandTop:Math.round(brand.top),brandVisible:brand.top>-5&&brand.top<120,mainLeft:Math.round(main.left),ov:document.documentElement.scrollWidth-document.documentElement.clientWidth};
  });
  console.log(JSON.stringify(r));
}
await b.close();
