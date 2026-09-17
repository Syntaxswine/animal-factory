import {createRequire} from 'node:module';import {fileURLToPath} from 'node:url';import fs from 'node:fs';import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH||'playwright'),browser=await chromium.launch({headless:true,channel:'msedge'}),out=new URL('../docs/tactics/hybrid-review/',import.meta.url);
try{
 const results=[];
 for(const mode of ['before','after']){
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))errors.push(r.url());});
  await page.goto('http://127.0.0.1:4389/tactics/hybrid-viewer.html'+(mode==='after'?'?visual=room':''),{waitUntil:'networkidle'});
  const initial=await page.evaluate(()=>hybridDiagnostics());assert.ok(Math.abs(initial.projectionRatio-2)<1e-8);
  for(const [name,zoom]of [['normal',.6],['close',1.2],['wide',.35]]){
   await page.locator('#reset').click();await page.mouse.move(500,500);await page.mouse.wheel(0,Math.log(1/zoom)*1000);await page.waitForTimeout(250);await page.screenshot({path:fileURLToPath(new URL(`visual-room-${mode}-${name}.png`,out))});
  }
  await page.locator('#reset').click();await page.locator('#bounds').check();await page.screenshot({path:fileURLToPath(new URL(`visual-room-${mode}-bounds.png`,out))});await page.locator('#bounds').uncheck();
  await page.locator('#gallery').check();await page.waitForTimeout(250);await page.screenshot({path:fileURLToPath(new URL(`visual-room-${mode}-heights.png`,out))});await page.locator('#gallery').uncheck();
  const paths=[];for(const path of ['door','window','wall','roof']){await page.locator('#path').selectOption(path);await page.locator('#fire').click();paths.push((await page.evaluate(()=>hybridDiagnostics())).lastHit);}
  const timing=await page.evaluate(async()=>{let last=performance.now();const gaps=[];for(let i=0;i<45;i++)await new Promise(r=>requestAnimationFrame(t=>{gaps.push(t-last);last=t;r();}));gaps.shift();gaps.sort((a,b)=>a-b);return {medianMs:gaps[Math.floor(gaps.length/2)],p95Ms:gaps[Math.floor(gaps.length*.95)],render:hybridDiagnostics().renderStats};});
  assert.deepEqual(errors,[]);results.push({mode,projectionRatio:initial.projectionRatio,ids:initial.ids,paths,timing});await page.close();
 }
 assert.deepEqual(results[0].ids,results[1].ids);assert.deepEqual(results[0].paths,results[1].paths);
 for(const mode of ['before','after']){const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:4389/tactics/hybrid-viewer.html?props=sample'+(mode==='after'?'&visual=room':''),{waitUntil:'networkidle'});await page.screenshot({path:fileURLToPath(new URL(`visual-props-${mode}.png`,out))});await page.locator('#bounds').check();await page.screenshot({path:fileURLToPath(new URL(`visual-props-${mode}-bounds.png`,out))});assert.deepEqual(errors,[]);await page.close();}
 fs.writeFileSync(new URL('visual-room-checks.json',out),JSON.stringify(results,null,2));console.log('Matched viewport/camera/zoom evidence captured; shared IDs and geometry query results unchanged.');
}finally{await browser.close();}
