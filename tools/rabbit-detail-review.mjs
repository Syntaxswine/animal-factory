import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH||'playwright');
const browser=await chromium.launch({headless:true,channel:'msedge'});
const dir=new URL('../docs/tactics/hybrid-review/rabbit-worker/',import.meta.url);
fs.mkdirSync(dir,{recursive:true});
try{
 const page=await browser.newPage({viewport:{width:1400,height:1050},deviceScaleFactor:2});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 page.on('response',r=>{if(r.status()>=400)errors.push(r.url());});
 await page.goto('http://127.0.0.1:4426/tactics/rabbit-worker.html?mesh=10k');
 await page.waitForFunction(()=>window.lightHorseReady);
 await page.locator('#close').check();
 const checks=[];
 for(const mesh of ['10k','28k']){
  await page.locator('#mesh').selectOption(mesh);
  for(const pose of ['neutral','carry']){
   await page.locator('#pose').selectOption(pose);
   for(const view of ['front','side','back','three','game']){
    await page.locator('#view').selectOption(view);
    const diagnostic=await page.evaluate(()=>lightHorseDiagnostics());
    assert.ok(Math.abs(diagnostic.pixelsPerUnit-300)<1e-9);
    const coverage=await page.evaluate(()=>lightPaintCoverage());
    assert.ok(coverage.fallbackPercent<3,'high-DPI projection must retain the painting');
    checks.push({mesh,pose,view,triangles:diagnostic.triangles,coverage});
    await page.screenshot({path:fileURLToPath(new URL(`detail-${mesh}-${pose}-${view}.png`,dir)),clip:{x:835,y:300,width:275,height:235}});
   }
  }
 }
 const regressions=[];
 for(const species of ['horse-light','goat-worker','bull-worker']){
  await page.goto(`http://127.0.0.1:4426/tactics/${species}.html?mesh=10k`);
  await page.waitForFunction(()=>window.lightHorseReady);await page.locator('#close').check();
  const coverage=await page.evaluate(()=>lightPaintCoverage());
  assert.ok(coverage.fallbackPercent<3,`${species}: high-DPI paint coverage`);
  regressions.push({species,coverage});
  await page.screenshot({path:fileURLToPath(new URL(`high-dpi-${species}.png`,dir)),clip:{x:835,y:300,width:275,height:235}});
 }
 assert.deepEqual(errors,[]);
 fs.writeFileSync(new URL('detail-checks.json',dir),JSON.stringify({browser:browser.version(),errors,checks,regressions},null,2)+'\n');
 console.log('Rabbit detail review: 20 close-up views and 3 high-DPI character regressions, no browser errors.');
}finally{await browser.close();}
