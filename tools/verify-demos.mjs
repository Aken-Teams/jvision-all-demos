import { chromium } from 'playwright';
import { readFileSync, existsSync } from 'fs';
const repos = process.argv.slice(2);
const B = 'http://localhost:4599/demos/';
const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext();
let allok = true;
for (const r of repos) {
  const dp = 'content/details/' + r + '.json';
  const D = existsSync(dp) ? JSON.parse(readFileSync(dp)) : null;
  const steps = D && D.flow && D.flow.stages ? D.flow.stages.map(s => s.demo) : [];
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  let err = 0; const el = [];
  p.on('pageerror', e => { err++; el.push(e.message); });
  p.on('console', m => { if (m.type() === 'error') { err++; el.push(m.text()); } });
  const url = B + r + '/';
  const sigOf = () => p.evaluate(() => {
    function hh(str){ let h=5381; for(let i=0;i<str.length;i++){ h=((h<<5)+h+str.charCodeAt(i))>>>0; } return h; }
    const vis = e => e && e.offsetParent !== null;
    let main = [...document.querySelectorAll('#view,.view.on,main,.main,.wrap,.content')].find(e => vis(e) && (e.innerText||'').trim().length > 30) || document.body;
    const txt = (main.innerText || '').replace(/\s+/g, ' ').trim();
    return hh(txt) + '@' + txt.length;
  });
  const shots = [];
  for (const dv of steps) {
    const g = (dv || 'v0').replace(/\D/g, '');
    await p.goto(url + '#go=' + g, { waitUntil: 'load' });
    await p.waitForTimeout(220);
    shots.push(g + ':' + await sigOf());
  }
  const uniq = new Set(shots.map(s => s.split(':')[1]));
  const navN = await p.evaluate(() => document.querySelectorAll('[data-i]').length);
  const ov = {};
  for (const w of [1360, 768, 390]) {
    await p.setViewportSize({ width: w, height: 950 });
    let mx = 0;
    for (let g = 0; g < navN; g++) {
      await p.goto(url + '#go=' + g, { waitUntil: 'load' });
      await p.waitForTimeout(150);
      const o = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (o > mx) mx = o;
    }
    ov[w] = mx;
  }
  const distinctOK = steps.length > 0 && uniq.size === steps.length;
  const rwdOK = ov[1360] <= 0 && ov[768] <= 0 && ov[390] <= 1;
  const ok = distinctOK && rwdOK && err === 0;
  if (!ok) allok = false;
  console.log((ok ? 'OK ' : 'XX ') + r.padEnd(46) + ' nav=' + navN + ' steps=' + steps.length + ' distinct=' + uniq.size + ' ovMax=' + JSON.stringify(ov) + ' err=' + err + (err ? ' ' + el.slice(0, 2).join(' | ') : '') + (distinctOK ? '' : ' DUP'));
  await p.close();
}
await browser.close();
process.exit(allok ? 0 : 1);
