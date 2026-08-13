import { chromium } from 'playwright';
const b=await chromium.launch({channel:'chrome'});const p=await(await b.newContext()).newPage();
const errs=[];p.on('pageerror',e=>errs.push((e.stack||e.message).split('\n').slice(0,3).join(' | ')));
await p.goto('http://localhost:4599/demos/jvision-property-management/#go=0',{waitUntil:'load'});await p.waitForTimeout(500);
const nav=await p.evaluate(()=>({dataI:document.querySelectorAll('[data-i]').length,navButtons:[...document.querySelectorAll('[data-i]')].map(b=>b.tagName).slice(0,14)}));
console.log('property-mgmt nav count:',nav.dataI,nav.navButtons.join(','));
console.log('err:',errs[0]||'none');
await b.close();
