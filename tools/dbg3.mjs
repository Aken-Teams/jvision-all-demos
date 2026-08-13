import { chromium } from 'playwright';
const b=await chromium.launch({channel:'chrome'});
const p=await b.newPage();
const logs=[];p.on('console',m=>logs.push(m.type()+':'+m.text()));p.on('pageerror',e=>logs.push('PE:'+e.message));
await p.goto('http://localhost:4599/project.html?repo=jvision-ai-case-002-work-order-dispatch',{waitUntil:'networkidle'});
await p.waitForTimeout(1500);
const r=await p.evaluate(async()=>{
  try{const res=await fetch('./projects-index.json?v=20260730-2');const j=await res.json();const pr=j.projects.find(x=>x.repoName==='jvision-ai-case-002-work-order-dispatch');return{ok:res.ok,len:j.projects.length,found:!!pr};}catch(e){return{err:String(e)};}
});
const h1=await p.locator('h1').first().textContent().catch(()=>'?');
const fs=await p.locator('.flow-step').count();
console.log('inpage fetch:',JSON.stringify(r));
console.log('h1:',h1,'| flow-step count:',fs);
console.log('logs:',JSON.stringify(logs.slice(0,10)));
await b.close();
