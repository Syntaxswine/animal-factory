import {createRequire} from 'node:module';import {fileURLToPath} from 'node:url';import fs from 'node:fs';import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH||'playwright'),browser=await chromium.launch({headless:true,channel:'msedge'});
const output=new URL('../docs/tactics/hybrid-review/',import.meta.url);fs.mkdirSync(output,{recursive:true});
try{
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4389/tactics/hybrid-viewer.html',{waitUntil:'networkidle'});
 await page.locator('#gallery').check();await page.screenshot({path:fileURLToPath(new URL('stage-3-materials.png',output))});
 await page.locator('#bounds').check();await page.screenshot({path:fileURLToPath(new URL('stage-3-materials-bounds.png',output))});
 await page.locator('#cutaway').check();await page.locator('#bounds').uncheck();await page.screenshot({path:fileURLToPath(new URL('stage-3-stairs-cutaway.png',output))});await page.locator('#cutaway').uncheck();await page.locator('#bounds').check();await page.locator('#gallery').uncheck();
 const frames=[];
 for(const species of ['horse','cow','skunk'])for(const stance of ['standing','kneeling','prone'])for(const heading of [0,45,90,135,180,225,270,315]){
  await page.locator('#species').selectOption(species);await page.locator('#stance').selectOption(stance);await page.locator('#heading').selectOption(String(heading));await page.waitForLoadState('networkidle');await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const muzzleErrors=await page.evaluate(()=>hybridDiagnostics().muzzleErrors);assert.ok(muzzleErrors.every(e=>e!==null&&e<.05),`${species} ${stance} ${heading}: actual mesh muzzle errors ${muzzleErrors}`);
  const buffer=await page.locator('#scene').screenshot();frames.push({label:`${species} · ${stance} · ${heading}°`,image:'data:image/png;base64,'+buffer.toString('base64')});
  if(species==='horse'&&stance==='prone'&&heading===45)fs.writeFileSync(new URL('stage-3-prone-45.png',output),buffer);
 }
 await page.locator('#bounds').uncheck();await page.locator('#species').selectOption('horse');await page.locator('#stance').selectOption('standing');await page.locator('#heading').selectOption('0');
 for(const [name,delta]of [['close',0],['normal',693],['wide',510]]){await page.mouse.move(450,450);await page.mouse.wheel(0,delta);await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await page.screenshot({path:fileURLToPath(new URL(`stage-3-${name}.png`,output))});}
 for(const mode of ['wall','roof']){await page.locator('#occlusion').selectOption(mode);await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await page.screenshot({path:fileURLToPath(new URL(`stage-3-occlusion-${mode}.png`,output))});}
 const contact=await browser.newPage({viewport:{width:2560,height:2560}});await contact.setContent('<body style="margin:0;background:#14251d;color:#e5d4ab;font:16px system-ui;display:grid;grid-template-columns:repeat(8,1fr)"></body>');
 await contact.evaluate(frames=>{for(const f of frames){const figure=document.createElement('figure');figure.style.margin='4px';const image=document.createElement('img');image.src=f.image;image.style.width='100%';const label=document.createElement('figcaption');label.textContent=f.label;figure.append(image,label);document.body.append(figure);}},frames);
 await contact.waitForFunction(()=>[...document.images].every(i=>i.complete));await contact.screenshot({path:fileURLToPath(new URL('stage-3-calibration.png',output)),fullPage:true});
 assert.deepEqual(errors,[]);console.log('Captured 72 stance/facing/species cases, both uniforms, material gallery, and three zoom levels without browser errors.');
}finally{await browser.close();}
