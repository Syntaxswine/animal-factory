import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const directory=fileURLToPath(new URL('../docs/tactics/hybrid-review/grey-study/',import.meta.url));fs.mkdirSync(directory,{recursive:true});
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH||'playwright'),browser=await chromium.launch({headless:true,channel:'msedge'});
try{
 const page=await browser.newPage({viewport:{width:1680,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().includes('favicon'))errors.push(r.url());});
 await page.goto('http://127.0.0.1:4389/tactics/horse-grey.html');await page.waitForFunction(()=>window.greyHorseReady,{},{timeout:60000});
 const d=await page.evaluate(()=>greyHorseDiagnostics());await page.screenshot({path:directory+'/front-side-three-quarter.png'});
 await page.locator('#view').selectOption('rear');await page.screenshot({path:directory+'/front-rear-three-quarter.png'});
 await page.locator('#silhouette').check();await page.screenshot({path:directory+'/silhouettes.png'});await page.locator('#silhouette').uncheck();
 await page.locator('#wire').check();await page.screenshot({path:directory+'/topology.png'});
 assert.deepEqual(errors,[]);assert.ok(Math.abs(d.height-1.65)<1e-6);for(const p of d.parts)assert.equal(p.components,1,p.name+' must be a single connected surface');
 for(const p of d.parts.filter(p=>p.name.startsWith('work boot')))assert.ok(Math.abs(p.min[1])<1e-5);
 fs.writeFileSync(directory+'/checks.json',JSON.stringify({browser:browser.version(),errors,...d},null,2)+'\n');console.log(JSON.stringify(d,null,2));
}finally{await browser.close();}
