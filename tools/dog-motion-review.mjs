import fs from 'node:fs';import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {fileURLToPath} from 'node:url';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH||'playwright'),dir=new URL('../docs/tactics/hybrid-review/dog-motion/',import.meta.url);fs.mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({headless:true,channel:'msedge'});
try{
 const page=await browser.newPage({viewport:{width:1400,height:1100}}),errors=[],checks=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)errors.push(r.url());});
 await page.goto('http://127.0.0.1:4427/tactics/dog-motion.html?paused');await page.waitForFunction(()=>window.dogMotionReady);
 for(const close of [true,false]){await page.locator('#close').setChecked(close);for(const heading of [0,37,-91,173])for(const pitch of [-15,0,20]){
  await page.locator('#heading').fill(String(heading));await page.locator('#heading').dispatchEvent('input');await page.locator('#pitch').fill(String(pitch));await page.locator('#pitch').dispatchEvent('input');
  for(const t of [0,1.5,3.3,4.3,5.5,6.6,6.86,8.8,11]){await page.evaluate(t=>dogMotion.seek(t),t);const d=await page.evaluate(()=>dogMotion.diagnostics());assert.equal(d.triangles,10446);assert.ok(Math.abs(d.pixelsPerUnit-(close?300:58))<1e-9);assert.ok(d.contacts.every(c=>c.error<1e-7));checks.push({close,heading,pitch,t,contacts:d.contacts,phase:d.phase,shot:d.shot});}
 }}
 await page.locator('#heading').fill('0');await page.locator('#heading').dispatchEvent('input');await page.locator('#pitch').fill('0');await page.locator('#pitch').dispatchEvent('input');
 await page.locator('#close').check();for(const view of ['game','front','side','back','three']){await page.locator('#view').selectOption(view);for(const [phase,t]of [['walk',1.5],['kneel',4.4],['aim',6.5],['fire',6.62],['stand',8.7],['end',11]]){await page.evaluate(t=>dogMotion.seek(t),t);await page.locator('#scene').screenshot({path:fileURLToPath(new URL(`${view}-${phase}.png`,dir))});}}
 await page.locator('#view').selectOption('game');for(const close of [false,true]){
  await page.locator('#close').setChecked(close);await page.evaluate(()=>dogMotion.seek(0));
  await page.evaluate(()=>{const canvas=dogMotion.renderer.domElement,chunks=[],stream=canvas.captureStream(30),recorder=new MediaRecorder(stream,{mimeType:'video/webm',videoBitsPerSecond:2500000});window.motionRecording={recorder,chunks,stream};recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};recorder.start();});
  await page.locator('#replay').click();await page.waitForFunction(()=>!dogMotion.diagnostics().playing&&dogMotion.diagnostics().time===11,{},{timeout:30000});
  const video=await page.evaluate(()=>new Promise(resolve=>{const {recorder,chunks,stream}=motionRecording;recorder.onstop=()=>{stream.getTracks().forEach(t=>t.stop());const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.readAsDataURL(new Blob(chunks,{type:'video/webm'}));};recorder.stop();}));fs.writeFileSync(new URL(`sequence-${close?'close':'native'}.webm`,dir),Buffer.from(video,'base64'));
  await page.locator('#scene').screenshot({path:fileURLToPath(new URL(`end-${close?'close':'native'}.png`,dir))});
 }
 await page.locator('#grey').check();await page.evaluate(()=>dogMotion.seek(6.5));await page.locator('#view').selectOption('side');await page.locator('#scene').screenshot({path:fileURLToPath(new URL('grey-kneeling-side.png',dir))});
 // The existing static viewer must retain its17-bone approved rig and controls.
 await page.goto('http://127.0.0.1:4427/tactics/dog-guard.html?mesh=10k');await page.waitForFunction(()=>window.lightHorseReady);const baseline=await page.evaluate(()=>lightHorseDiagnostics());assert.equal(baseline.bones,17);assert.equal(baseline.triangles,10446);
 assert.deepEqual(errors,[]);fs.writeFileSync(new URL('browser-checks.json',dir),JSON.stringify({browser:browser.version(),errors,checks,staticBaseline:baseline},null,2)+'\n');console.log(checks.length+' motion samples, native/close videos and static regression passed.');
}finally{await browser.close();}
