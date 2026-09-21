import fs from 'node:fs';import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {fileURLToPath} from 'node:url';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH||'playwright'),dir=new URL('../docs/tactics/hybrid-review/dog-motion/',import.meta.url);fs.mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({headless:true,channel:'msedge'});
try{
 const page=await browser.newPage({viewport:{width:1400,height:1100}}),errors=[],checks=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)errors.push(r.url());});
 await page.goto('http://127.0.0.1:4427/tactics/dog-motion.html?paused');await page.waitForFunction(()=>window.dogMotionReady);
 for(const close of [true,false]){await page.locator('#close').setChecked(close);for(const heading of [0,37,-91,173])for(const pitch of [-15,0,20]){
  await page.locator('#heading').fill(String(heading));await page.locator('#heading').dispatchEvent('input');await page.locator('#pitch').fill(String(pitch));await page.locator('#pitch').dispatchEvent('input');
  for(const t of [0,.25,.75,1.25,1.75,2.25,2.75,3.3,4.3,5.5,6.6,6.61,6.625,6.64,6.7,6.86,7.15,8.8,11]){await page.evaluate(t=>dogMotion.seek(t),t);const d=await page.evaluate(()=>dogMotion.diagnostics());assert.equal(d.triangles,10446);assert.ok(Math.abs(d.pixelsPerUnit-(close?300:58))<1e-9);assert.ok(d.contacts.every(c=>c.error<1e-7));if(d.flashVisible)assert.ok(Math.hypot(...d.flashPosition.map((x,i)=>x-d.muzzle.origin[i]))<1e-8,'flash follows actual recoiling muzzle');assert.ok(Math.hypot(...d.traceOrigin.map((x,i)=>x-d.shot.origin[i]))<1e-6,'trace retains discharge origin');checks.push({close,heading,pitch,t,contacts:d.contacts,phase:d.phase,shot:d.shot,recoil:d.recoil,flashPosition:d.flashPosition,muzzle:d.muzzle});}
 }}
 await page.locator('#heading').fill('0');await page.locator('#heading').dispatchEvent('input');await page.locator('#pitch').fill('0');await page.locator('#pitch').dispatchEvent('input');
 await page.locator('#close').check();for(const view of ['game','front','side','back','three']){await page.locator('#view').selectOption(view);for(const [phase,t]of [['walk',1.5],['kneel',4.4],['aim',6.5],['fire',6.62],['stand',8.7],['end',11]]){await page.evaluate(t=>dogMotion.seek(t),t);await page.locator('#scene').screenshot({path:fileURLToPath(new URL(`${view}-${phase}.png`,dir))});}}
 // Contact sheets preserve the viewer's displayed scale and show both support sides.
 for(const [name,view,close,times]of [['walk-front-close','front',true,[.25,.75,1.25,1.75,2.25,2.75]],['walk-front-native','front',false,[.25,.75,1.25,1.75,2.25,2.75]],['walk-game-native','game',false,[.25,.75,1.25,1.75,2.25,2.75]],['recoil-side-close','side',true,[6.6,6.61,6.625,6.7,6.86,7.15]]]){
  await page.locator('#close').setChecked(close);await page.locator('#view').selectOption(view);
  const png=await page.evaluate(({close,times})=>{const w=close?620:240,h=close?650:330,sheet=document.createElement('canvas');sheet.width=w*3;sheet.height=(h+28)*2;const ctx=sheet.getContext('2d');ctx.fillStyle='#353a32';ctx.fillRect(0,0,sheet.width,sheet.height);for(const [i,t]of times.entries()){dogMotion.seek(t);const canvas=dogMotion.renderer.domElement,x=(i%3)*w,y=Math.floor(i/3)*(h+28);ctx.drawImage(canvas,(canvas.width-w)/2,0,w,h,x,y+28,w,h);ctx.fillStyle='white';ctx.font='16px sans-serif';ctx.fillText(t.toFixed(3)+' s',x+12,y+21);}return sheet.toDataURL('image/png').split(',')[1];},{close,times});fs.writeFileSync(new URL(name+'.png',dir),Buffer.from(png,'base64'));
 }
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
