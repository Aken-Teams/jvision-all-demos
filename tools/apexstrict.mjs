import { chromium } from 'playwright';
import { readFileSync } from 'fs';
const repos=readFileSync(process.argv[2],'utf8').trim().split(/\n+/);
const b=await chromium.launch({channel:'chrome'});const ctx=await b.newContext();
for(const r of repos){
  const p=await ctx.newPage();const c=await ctx.newCDPSession(p);await c.send('Network.setCacheDisabled',{cacheDisabled:true});
  await p.setViewportSize({width:1280,height:950});
  const B='http://localhost:4599/demos/'+r+'/';
  let navN=0;try{await p.goto(B,{waitUntil:'load'});await p.waitForTimeout(300);navN=await p.evaluate(()=>document.querySelectorAll('[data-i]').length);}catch(e){}
  // whether source declares donut/pie/radar somewhere
  const src=readFileSync('demos/'+r+'/index.html','utf8');
  const wantPie=/type:"(donut|pie)"/.test(src), wantRadar=/type:"radar"/.test(src);
  let pie=0,radar=0,bar=0,line=0,canv=0;
  for(let g=0;g<navN;g++){await p.goto(B+'#go='+g,{waitUntil:'load'});await p.waitForTimeout(350);
    const rr=await p.evaluate(()=>({
      pie:document.querySelectorAll('.apexcharts-pie-area, .apexcharts-pie-slice').length,
      radar:document.querySelectorAll('.apexcharts-radar-series polygon, .apexcharts-radar path').length,
      bar:document.querySelectorAll('.apexcharts-bar-area').length,
      line:document.querySelectorAll('.apexcharts-line-series path.apexcharts-line, .apexcharts-area-series path').length,
      canv:document.querySelectorAll('.apexcharts-canvas').length
    }));
    pie+=rr.pie;radar+=rr.radar;bar+=rr.bar;line+=rr.line;canv=Math.max(canv,rr.canv);
  }
  const bug=(wantPie&&pie===0)||(wantRadar&&radar===0);
  console.log((bug?'XX ':'ok ')+r.padEnd(50)+' pie='+pie+' radar='+radar+' bar='+bar+' line='+line+(bug?'  <<< TYPE-FALLBACK BUG (wantPie='+wantPie+' wantRadar='+wantRadar+')':''));
  await p.close();
}
await b.close();
