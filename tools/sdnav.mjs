import { chromium } from 'playwright';
const b=await chromium.launch({channel:'chrome'});const p=await(await b.newContext()).newPage();
await p.setViewportSize({width:1360,height:800});
await p.goto('http://localhost:4599/demos/jvision-store-design/#go=0',{waitUntil:'load'});await p.waitForTimeout(400);
await p.evaluate(()=>window.scrollTo(0,1200));
await p.waitForTimeout(300);
const r=await p.evaluate(()=>{
  const brand=document.querySelector('.brand');
  const side=document.querySelector('.side');
  const br=brand.getBoundingClientRect();
  const sr=side.getBoundingClientRect();
  return {brandTop:Math.round(br.top),brandVisible:br.top>=-5&&br.top<200,sideTop:Math.round(sr.top),sideH:Math.round(sr.height),vh:window.innerHeight,ov:document.documentElement.scrollWidth-document.documentElement.clientWidth};
});
console.log(JSON.stringify(r));
await b.close();
