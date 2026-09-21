import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH||'playwright');
const browser=await chromium.launch({headless:true,channel:'msedge'}),out=new URL('../docs/tactics/environment-review/',import.meta.url);fs.mkdirSync(out,{recursive:true});
try{
 const page=await browser.newPage({viewport:{width:1500,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto(process.env.REVIEW_URL||'http://127.0.0.1:4318/tactics/environment-gallery.html');await page.waitForFunction(()=>window.environmentWorkshop);
 const result=await page.evaluate(()=>{const w=window.environmentWorkshop,rows=[];for(const e of w.entries){w.select(e.kind);const s=w.hybrid.stats();rows.push({kind:e.kind,parts:w.hybrid.structures.children.reduce((n,m)=>n+m.count,0),unsupported:s.unsupported});}return rows;});
 assert(result.every(r=>r.parts>0&&r.unsupported.length===0));
 for(const kind of ['tree-broadleaf','tree-pine','barrel-single','roof-corrugated-sloped','fence-chainlink','hospital-bed','botanical-chamber','wooden-crate-open','water']){await page.evaluate(k=>window.environmentWorkshop.select(k),kind);await page.waitForTimeout(120);await page.screenshot({path:fileURLToPath(new URL(kind+'.png',out))});}
 for(const scene of ['yard','clinic']){await page.evaluate(s=>window.environmentWorkshop.scene(s),scene);await page.waitForTimeout(150);await page.screenshot({path:fileURLToPath(new URL(scene+'.png',out))});}
 assert.deepEqual(errors,[]);fs.writeFileSync(new URL('results.json',out),JSON.stringify({count:result.length,errors,entries:result},null,2));console.log(JSON.stringify({count:result.length,errors}));
}finally{await browser.close();}
