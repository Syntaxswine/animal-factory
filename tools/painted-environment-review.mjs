import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH||'playwright'),browser=await chromium.launch({headless:true,channel:'msedge'}),out=new URL('../docs/tactics/painted-environment-review/',import.meta.url);fs.mkdirSync(out,{recursive:true});
try{
 const page=await browser.newPage({viewport:{width:1500,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('http://127.0.0.1:4329/tactics/painted-environment.html');await page.waitForFunction(()=>window.paintedStudy?.ready);
 const capture=async name=>{await page.screenshot({path:fileURLToPath(new URL(name+'.png',out))});};
 await capture('comparison-native');await page.locator('#scale').selectOption('110');await capture('comparison-close');
 await page.locator('#view').selectOption('painted');await capture('painted-close');
 for(const [name,a,e]of [['front',0,.35],['back',Math.PI+.5,.5],['side',Math.PI/2,.45]]){await page.evaluate(([a,e])=>paintedStudy.view(a,e),[a,e]);await capture(name);}
 await page.locator('#reset').click();await page.locator('#scale').selectOption('58');await page.setViewportSize({width:390,height:844});await capture('mobile-native');
 await page.locator('#view').selectOption('both');await page.screenshot({path:fileURLToPath(new URL('mobile-comparison.png',out)),fullPage:true});
 const info=await page.evaluate(()=>paintedStudy.diagnostics());assert.equal(info.ppu,58);assert.equal(info.horseTriangles,10300);assert.deepEqual(errors,[]);fs.writeFileSync(new URL('results.json',out),JSON.stringify({errors,...info},null,2));console.log({errors,...info});
}finally{await browser.close();}
