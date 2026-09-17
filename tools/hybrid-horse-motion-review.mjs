import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const directory=fileURLToPath(new URL('../docs/tactics/hybrid-review/horse-motion/',import.meta.url));fs.mkdirSync(directory,{recursive:true});
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH||'playwright'),browser=await chromium.launch({headless:true,channel:'msedge'}),errors=[],records=[];
try{
 for(const close of [false,true]){
  const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4389/tactics/hybrid-model-comparison.html',{waitUntil:'networkidle'});await page.locator('#close').setChecked(close);
  await page.evaluate(()=>{window.motionChunks=[];window.motionRecorder=new MediaRecorder(document.querySelector('#scene canvas').captureStream(30),{mimeType:'video/webm'});motionRecorder.ondataavailable=e=>motionChunks.push(e.data);motionRecorder.start();});
  await page.locator('#replay').click();await page.waitForFunction(()=>document.querySelector('#phase').textContent.includes('10.00 s'),{},{timeout:20000});
  const videoData=await page.evaluate(()=>new Promise(resolve=>{motionRecorder.onstop=()=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.readAsDataURL(new Blob(motionChunks,{type:'video/webm'}));};motionRecorder.stop();}));fs.writeFileSync(`${directory}/sequence-${close?'close':'native'}.webm`,Buffer.from(videoData,'base64'));
  for(const [name,time]of [['walk',1.15],['plant',3.5],['lowering',4.1],['aim',5.9],['shot',6.01],['recoil',6.2],['rising',7.7],['standing',10]]){
   const d=await page.evaluate(t=>{setHorseSequenceTime(t);return horseSequenceDiagnostics();},time);await page.screenshot({path:`${directory}/${name}-${close?'close':'native'}.png`});if(!close)records.push(d);
   assert.ok(Math.abs(d.model.min[1])<1e-6);if(name==='shot')assert.ok(Math.hypot(...d.model.tip.map((v,i)=>v-d.shot.origin[i]))<1e-6);
  }
  // Pause/scrub/replay is deterministic and reuses all existing GPU objects.
  const before=await page.evaluate(()=>modelComparisonDiagnostics().render);
  await page.evaluate(()=>{for(let i=0;i<120;i++)setHorseSequenceTime((i%101)/10);});await page.waitForTimeout(100);
  const after=await page.evaluate(()=>modelComparisonDiagnostics().render);assert.equal(after.geometries,before.geometries);assert.equal(after.textures,before.textures);
  await page.locator('#sequence').click();await page.waitForTimeout(100);await page.locator('#sequence').click();const paused=await page.locator('#time').inputValue();await page.waitForTimeout(150);assert.equal(await page.locator('#time').inputValue(),paused);
  await page.locator('#static').click();assert.equal(await page.locator('#stance').isEnabled(),true);
  await context.close();
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(`${directory}/checks.json`,JSON.stringify({browser:browser.version(),errors,records},null,2)+'\n');console.log('Motion browser proof passed: two recorded sequences, eight checkpoints per view, stable resources and pause/static controls.');
}finally{await browser.close();}
