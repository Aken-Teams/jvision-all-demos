import { chromium } from 'playwright';
const b=await chromium.launch({channel:'chrome'});
const p=await(await b.newContext()).newPage();
const c=await p.context().newCDPSession(p);await c.send('Network.setCacheDisabled',{cacheDisabled:true});
await p.goto('http://localhost:4599/agents.html',{waitUntil:'load'});await p.waitForTimeout(600);
const st=await p.evaluate(()=>{const s={};AGENTS.forEach(a=>s[a.status]=(s[a.status]||0)+1);
  // count green dots visible in grid
  const greenDots=[...document.querySelectorAll('.bg-success')].length;
  return {statuses:s, greenDotsOnPage:greenDots};});
console.log('狀態分佈:',JSON.stringify(st.statuses),'| 頁面綠點數:',st.greenDotsOnPage);
// profile activity hidden?
await p.goto('http://localhost:4599/agents-profile?id=g13',{waitUntil:'load'});await p.waitForTimeout(400);
const act=await p.evaluate(()=>{const el=document.querySelector('#pfActivity');const card=el?el.closest('div[hidden],.bg-white'):null;
  return {activityVisible: el? (el.offsetParent!==null):false};});
console.log('執行紀錄可見:',act.activityVisible,'(應為 false=已隱藏)');
await b.close();
