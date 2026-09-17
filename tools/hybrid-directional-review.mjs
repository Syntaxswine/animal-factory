import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {candidateError,SECTOR} from '../dist/tactics/hybrid-directional.js';
const landmarks=JSON.parse(fs.readFileSync(new URL('../dist/tactics/hybrid-directional-landmarks.json',import.meta.url))),records=[];
for(const stance of ['standing','kneeling','prone']){
 const cases=[];
 for(let i=0;i<17;i++)cases.push({kind:'center',heading:SECTOR.min+i*SECTOR.step});
 for(let i=0;i<16;i++)for(const offset of [.25,.5-1e-7,.5,.5+1e-7,.75])cases.push({kind:'between',heading:SECTOR.min+(i+offset)*SECTOR.step});
 for(let h=SECTOR.min;h<=SECTOR.max;h+=.05)cases.push({kind:'sweep',heading:h});
 records.push({stance,samples:cases.map(c=>({...c,...candidateError(stance,c.heading,landmarks)}))});
}
const directory=new URL('../docs/tactics/hybrid-review/directional-proof/',import.meta.url);
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH||'playwright'),browser=await chromium.launch({headless:true,channel:'msedge'});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))errors.push(r.url());});
 await page.goto('http://127.0.0.1:4389/tactics/hybrid-directional.html',{waitUntil:'networkidle'});
 for(const h of [22.5,43.59375-1e-5,43.59375+1e-5,45,46.40625,67.5]){
  await page.locator('#heading').evaluate((e,h)=>{e.value=String(h);e.dispatchEvent(new Event('input'));},h);
  const d=await page.evaluate(()=>directionalDiagnostics());assert.ok(Math.abs(d.heading-h)<1e-10,'browser must preserve the requested boundary angle');for(const m of d.metrics){const expected=candidateError(m.stance,h,landmarks);assert.equal(m.index,expected.index);assert.ok(Math.abs(expected.error-m.error)<1e-12);}
 }
 await page.locator('#heading').fill('45');await page.locator('#heading').dispatchEvent('input');
 for(const close of [false,true])for(const overlay of [false,true]){await page.locator('#close').setChecked(close);await page.locator('#overlays').setChecked(overlay);await page.screenshot({path:fileURLToPath(new URL(`candidate-${close?'close':'native'}-${overlay?'overlays':'clean'}.png`,directory))});}
 await page.locator('#play').click();const start=(await page.evaluate(()=>directionalDiagnostics())).heading;await page.waitForTimeout(200);assert.notEqual((await page.evaluate(()=>directionalDiagnostics())).heading,start);await page.locator('#play').click();assert.deepEqual(errors,[]);
 for(const stance of ['standing','kneeling','prone']){
  const atlas=await browser.newPage({viewport:{width:1402,height:1122}});await atlas.goto('http://127.0.0.1:4389/tactics/hybrid-directional.html');
  await atlas.evaluate(async({stance,points})=>{document.body.innerHTML='<canvas width="1402" height="1122"></canvas>';document.body.style.cssText='margin:0;background:#172520';const ctx=document.querySelector('canvas').getContext('2d'),img=new Image();img.src='../assets/characters/directional-proof/horse-rifle-'+stance+'-candidate.png';await img.decode();ctx.drawImage(img,0,0);ctx.strokeStyle='#00ffff';ctx.fillStyle='#fff';ctx.font='18px sans-serif';for(const [i,p]of points.entries()){ctx.beginPath();ctx.arc(...p,6,0,2*Math.PI);ctx.stroke();ctx.fillText(String(i),p[0]+9,p[1]-8);}}, {stance,points:landmarks[stance]});
  await atlas.screenshot({path:fileURLToPath(new URL('atlas-landmarks-'+stance+'.png',directory))});await atlas.close();
 }
 const summary=records.map(r=>({stance:r.stance,count:r.samples.length,minError:Math.min(...r.samples.map(s=>s.error)),maxError:Math.max(...r.samples.map(s=>s.error)),failedIncludingUncertainty:r.samples.filter(s=>s.assessment==='fail').length,uncertain:r.samples.filter(s=>s.assessment==='uncertain').length}));
 fs.writeFileSync(new URL('candidate-measurements.json',directory),JSON.stringify({status:'asset acceptance FAIL; diagnostic checks passed',tolerance:SECTOR.tolerance,estimatedLandmarkUncertaintyPixelsPerAxis:3,summary,records},null,2)+'\n');
 console.log(JSON.stringify(summary,null,2));
}finally{await browser.close();}
