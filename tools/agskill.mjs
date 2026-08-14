import { chromium } from 'playwright';
import { readFileSync } from 'fs';
const b=await chromium.launch({channel:'chrome'});
const p=await(await b.newContext()).newPage();
const c=await p.context().newCDPSession(p);await c.send('Network.setCacheDisabled',{cacheDisabled:true});
for(const id of ['g13','g200','g5']){
  await p.goto('http://localhost:4599/agents-profile?id='+id,{waitUntil:'load'});
  await p.waitForTimeout(450);
  const profileSkills=await p.evaluate(()=>[...document.querySelectorAll('#pfCaps h5')].map(e=>e.textContent.trim()));
  const md=readFileSync('jvision-agents-office/agents/'+id+'/agent.md','utf8');
  const mdSkills=JSON.parse(md.match(/skills: (\[.*\])/)[1]);
  const same=JSON.stringify(profileSkills)===JSON.stringify(mdSkills);
  console.log(id, same?'✅一致':'❌不一致');
  console.log('  詳細頁:', profileSkills.join('/'));
  console.log('  agent.md:', mdSkills.join('/'));
}
await b.close();
