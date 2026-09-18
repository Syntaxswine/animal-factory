import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const directory=fileURLToPath(new URL('../docs/tactics/hybrid-review/light-carry/',import.meta.url));fs.mkdirSync(directory,{recursive:true});
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH||'playwright'),browser=await chromium.launch({headless:true,channel:'msedge'});
try{const page=await browser.newPage({viewport:{width:1400,height:960}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('favicon'))errors.push(m.text());});page.on('response',r=>{if(r.status()>=400&&!r.url().includes('favicon'))errors.push(r.url());});
 await page.goto('http://127.0.0.1:4389/tactics/horse-light.html');await page.waitForFunction(()=>window.lightHorseReady);const checks=[];
 for(const close of [false,true]){await page.locator('#close').setChecked(close);for(const heading of [0,90,180,270]){await page.locator('#heading').fill(String(heading===270?-90:heading));await page.locator('#heading').dispatchEvent('input');const d=await page.evaluate(()=>lightHorseDiagnostics());assert.ok(Math.abs(d.pixelsPerUnit-(close?300:58))<1e-8);assert.ok(d.triangles<30000);for(const c of d.contacts)assert.ok(c.error<1e-5);checks.push({close,heading,...d});await page.screenshot({path:directory+`/carry-${heading}-${close?'close':'native'}.png`});}}
 await page.locator('#heading').fill('0');await page.locator('#heading').dispatchEvent('input');await page.locator('#grey').check();await page.locator('#pose').selectOption('neutral');await page.screenshot({path:directory+'/neutral-grey.png'});await page.locator('#wire').check();await page.screenshot({path:directory+'/neutral-topology.png'});await page.locator('#wire').uncheck();await page.locator('#grey').uncheck();await page.locator('#pose').selectOption('rifle');await page.screenshot({path:directory+'/rifle-alone.png'});
 assert.deepEqual(errors,[]);fs.writeFileSync(directory+'/checks.json',JSON.stringify({browser:browser.version(),errors,checks},null,2)+'\n');console.log('Light carry: native/close, four headings, neutral grey, topology, separate rifle; no browser errors.');
}finally{await browser.close();}
