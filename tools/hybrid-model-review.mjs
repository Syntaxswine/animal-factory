import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {createHorseModel} from '../dist/tactics/hybrid-horse-model.js';
import {muzzlePoint} from '../dist/tactics/hybrid-combat.js';
const directory=new URL('../docs/tactics/hybrid-review/model-comparison/',import.meta.url);fs.mkdirSync(directory,{recursive:true});
const model=createHorseModel(),sweep=[];
for(const stance of ['standing','kneeling','prone']){let maximum=0;for(let heading=0;heading<360;heading+=.25){model.pose(stance,heading);const d=model.diagnostics(),p=muzzlePoint({geometryMode:'hybrid'},{x:0,y:0,z:0,hp:100,stance,heading});maximum=Math.max(maximum,Math.hypot(d.tip[0]-p.x,d.tip[1]-p.h,d.tip[2]-p.y));}sweep.push({stance,headings:1440,maxBarrelTipError:maximum});assert.ok(maximum<1e-6);}model.dispose();
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH||'playwright'),browser=await chromium.launch({headless:true,channel:'msedge'});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],poses=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))errors.push(r.url());});
 await page.goto('http://127.0.0.1:4389/tactics/hybrid-model-comparison.html',{waitUntil:'networkidle'});
 const heading=async h=>{await page.locator('#heading').evaluate((e,h)=>{e.value=String(h);e.dispatchEvent(new Event('input'));},h);};
 for(const stance of ['standing','kneeling','prone']){await page.locator('#stance').selectOption(stance);await heading(0);
  for(const mode of ['both','sprite','model']){await page.locator('#mode').selectOption(mode);for(const close of [false,true]){await page.locator('#close').setChecked(close);await page.screenshot({path:fileURLToPath(new URL(`${stance}-${mode}-${close?'close':'native'}.png`,directory))});}}
  await page.locator('#mode').selectOption('both');await page.locator('#bounds').check();await page.screenshot({path:fileURLToPath(new URL(`${stance}-overlays.png`,directory))});await page.locator('#bounds').uncheck();
  poses.push(await page.evaluate(()=>modelComparisonDiagnostics()));
 }
 // Orbit affects presentation, not physical model vertices or map descriptions.
 const before=await page.evaluate(()=>modelComparisonDiagnostics());await page.locator('#orbit').check();await page.mouse.move(600,480);await page.mouse.down();await page.mouse.move(760,540);await page.mouse.up();const after=await page.evaluate(()=>modelComparisonDiagnostics());assert.deepEqual(after.tip,before.tip);assert.deepEqual(after.geometryIds,before.geometryIds);await page.locator('#reset').click();
 await page.locator('#stance').selectOption('standing');await page.locator('#mode').selectOption('model');await page.locator('#wire').check();await page.screenshot({path:fileURLToPath(new URL('standing-wireframe.png',directory))});await page.locator('#wire').uncheck();
 for(const h of [22.5,43.59374,43.59376,46.40624,46.40626,137.2,359.999]){await heading(h);const d=await page.evaluate(()=>modelComparisonDiagnostics());assert.ok(Math.abs(d.heading-h)<1e-9);assert.ok(Math.hypot(d.tip[0]-d.physical.x,d.tip[1]-d.physical.h,d.tip[2]-d.physical.y)<1e-6);}
 await page.waitForTimeout(100);const memoryBefore=(await page.evaluate(()=>modelComparisonDiagnostics())).render;
 for(let i=0;i<90;i++)await heading(i*4);await page.waitForTimeout(100);const memoryAfter=(await page.evaluate(()=>modelComparisonDiagnostics())).render;assert.equal(memoryAfter.geometries,memoryBefore.geometries);assert.equal(memoryAfter.textures,memoryBefore.textures);
 const timings={};for(const mode of ['sprite','model']){await page.locator('#mode').selectOption(mode);await page.locator('#sweep').click();timings[mode]=await page.evaluate(async()=>{const gaps=[];let last=performance.now();for(let i=0;i<90;i++)await new Promise(r=>requestAnimationFrame(t=>{gaps.push(t-last);last=t;r();}));gaps.shift();gaps.sort((a,b)=>a-b);return {medianMs:gaps[Math.floor(gaps.length*.5)],p95Ms:gaps[Math.floor(gaps.length*.95)],render:modelComparisonDiagnostics().render};});await page.locator('#sweep').click();}
 const frames=[];await page.locator('#mode').selectOption('model');await page.locator('#close').uncheck();
 for(const stance of ['standing','kneeling','prone'])for(const angle of [0,45,135,225,315]){await page.locator('#stance').selectOption(stance);await heading(angle);const d=await page.evaluate(()=>modelComparisonDiagnostics()),host=await page.locator('#scene').boundingBox(),f=d.screenFrame;const shot=await page.screenshot({clip:{x:host.x+f.x,y:host.y+f.y,width:f.width,height:f.height}});frames.push({stance,angle,width:f.width,height:f.height,src:'data:image/png;base64,'+shot.toString('base64')});}
 const sheet=await browser.newPage({viewport:{width:1650,height:1040}});await sheet.setContent('<style>body{margin:0;background:#172520}</style><canvas width="1650" height="1040"></canvas>');
 await sheet.evaluate(async frames=>{const c=document.querySelector('canvas').getContext('2d');c.fillStyle='#eee5cd';c.font='20px system-ui';c.fillText('Low-poly horse: five headings × three poses · native captures displayed at 2×',20,32);c.imageSmoothingEnabled=false;for(const [i,f]of frames.entries()){const img=new Image();img.src=f.src;await img.decode();const x=i%5*330,y=Math.floor(i/5)*310+55;c.font='15px system-ui';c.fillText(f.stance+' / '+f.angle+'°',x+15,y+20);c.drawImage(img,x+(330-f.width*2)/2,y+40,f.width*2,f.height*2);}},frames);
 await sheet.screenshot({path:fileURLToPath(new URL('heading-sheet.png',directory))});await sheet.close();
 assert.deepEqual(errors,[]);fs.writeFileSync(new URL('checks.json',directory),JSON.stringify({scope:'isolated comparison, horizontal aim only',browser:browser.version(),sweep,poses,memoryBefore,memoryAfter,timings},null,2)+'\n');console.log(JSON.stringify({sweep,memoryBefore,memoryAfter,timings},null,2));
}finally{await browser.close();}
