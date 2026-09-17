import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {replayHybrid,probeHybridBoundaries} from '../dist/tactics/hybrid-replay.js';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const browser=await chromium.launch({headless:true,channel:'msedge'});
try{
 const page=await browser.newPage({viewport:{width:1400,height:940}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))errors.push(r.status()+' '+r.url());});
 await page.goto((process.env.HYBRID_URL||'http://127.0.0.1:4389/tactics/hybrid-viewer.html'),{waitUntil:'networkidle'});
 await page.waitForFunction(()=>window.hybridDiagnostics);await page.locator('#fire').click();
 const closed=await page.evaluate(()=>hybridDiagnostics());assert.equal(closed.lastHit.id,'edge:s:5:7:door');assert.ok(closed.ids.includes(closed.lastHit.id));
 assert.ok(Math.abs(closed.projectionRatio-2)<1e-9);
 await page.locator('#orbit').check();await page.mouse.move(450,350);await page.mouse.down();await page.mouse.move(600,400);await page.mouse.up();await page.locator('#fire').click();assert.deepEqual((await page.evaluate(()=>hybridDiagnostics())).lastHit,closed.lastHit);await page.locator('#reset').click();
 await page.locator('#door').uncheck();await page.locator('#fire').click();const open=await page.evaluate(()=>hybridDiagnostics());assert.equal(open.lastHit,null);assert.ok(!open.ids.includes('edge:s:5:7:door'));assert.equal(open.revision,closed.revision+1);
 await page.locator('#orbit').check();await page.mouse.move(450,350);await page.mouse.down();await page.mouse.move(600,400);await page.mouse.up();await page.mouse.wheel(0,-150);await page.locator('#fire').click();const orbit=await page.evaluate(()=>hybridDiagnostics());
 assert.deepEqual(orbit.map,open.map);assert.deepEqual(orbit.ids,open.ids);assert.equal(orbit.lastHit,open.lastHit);assert.notDeepEqual(orbit.camera,open.camera);
 await page.locator('#reset').click();await page.locator('#path').selectOption('window');await page.locator('#fire').click();assert.equal((await page.evaluate(()=>hybridDiagnostics())).lastHit,null);
 await page.locator('#path').selectOption('roof');await page.locator('#fire').click();assert.ok((await page.evaluate(()=>hybridDiagnostics())).lastHit);
 await page.locator('#roof').uncheck();await page.locator('#fire').click();assert.equal((await page.evaluate(()=>hybridDiagnostics())).lastHit,null);await page.locator('#roof').check();
 fs.mkdirSync(new URL('../docs/tactics/hybrid-review/',import.meta.url),{recursive:true});
 await page.locator('#replay').click();await page.waitForLoadState('networkidle');
 const browserReplay=(await page.evaluate(()=>hybridDiagnostics())).replayResult;
 const nodeReplay=replayHybrid(JSON.parse(fs.readFileSync(new URL('../dist/tactics/fixtures/hybrid-room.json',import.meta.url),'utf8')));assert.deepEqual(browserReplay,nodeReplay);
 const map=JSON.parse(fs.readFileSync(new URL('../dist/tactics/fixtures/hybrid-room.json',import.meta.url),'utf8'));
 const browserBoundaries=await page.evaluate(async map=>(await import('./hybrid-replay.js')).probeHybridBoundaries(map),map);
 assert.deepEqual(browserBoundaries,probeHybridBoundaries(map));assert.equal(browserBoundaries.bullet.zone,'torso');assert.equal(browserBoundaries.pellets[0].zone,'head');assert.deepEqual(browserBoundaries.victims.map(v=>v.id),[0]);
 await page.screenshot({path:fileURLToPath(new URL(process.argv.includes('--stage4')?'../docs/tactics/hybrid-review/stage-4-regression.png':'../docs/tactics/hybrid-review/stage-3.png',import.meta.url))});
 await page.locator('#bounds').check();await page.screenshot({path:fileURLToPath(new URL(process.argv.includes('--stage4')?'../docs/tactics/hybrid-review/stage-4-regression-bounds.png':'../docs/tactics/hybrid-review/stage-3-bounds.png',import.meta.url))});
 assert.deepEqual(errors,[]);console.log('Hybrid browser gates passed: shared mesh/collision door and roof updates, window aperture, camera independence, local assets.');
}finally{await browser.close();}

