import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {blankMap} from '../dist/tactics/maps.js';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH||'playwright');
const browser=await chromium.launch({channel:'msedge',headless:true}),results=[];
try{
 for(const mode of ['hybrid','2d']){
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.url());});
  await page.goto(`http://127.0.0.1:4428/tactics/editor.html?renderer=${mode}`,{waitUntil:'networkidle'});
  const map=blankMap();map.name='Mature trees integration';map.props=[{kind:'tree-broadleaf-large',x:8,y:8,z:0},{kind:'tree-pine-large',x:12,y:8,z:0,rotated:true}];
  await page.locator('#file').setInputFiles({name:'mature.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(map))});
  await page.waitForFunction(()=>hybridEditorDiagnostics().map.name==='Mature trees integration');
  for(const p of map.props)await page.locator('#prop-kind').selectOption(p.kind);
  const download=page.waitForEvent('download');await page.locator('#export').click();const exported=JSON.parse(fs.readFileSync(await (await download).path(),'utf8'));assert.deepEqual(exported.props,map.props);
  if(mode==='hybrid'){
   await page.waitForFunction(()=>!document.querySelector('#test').disabled);await page.locator('#test').click();
   await page.waitForFunction(()=>document.querySelector('#test-frame').contentWindow.hybridGameDiagnostics?.().stats?.calls>0);
   const stats=await page.evaluate(()=>document.querySelector('#test-frame').contentWindow.hybridGameDiagnostics().stats);assert.deepEqual(stats.diagnostics,[]);
  }
  await page.waitForLoadState('networkidle');assert.deepEqual(errors,[]);results.push({mode,kinds:exported.props.map(p=>p.kind),exportPreserved:true,playtest:mode==='hybrid',errors});await page.close();
 }
 fs.writeFileSync(new URL('../docs/tactics/hybrid-review/foliage/editor-checks.json',import.meta.url),JSON.stringify(results,null,2)+'\n');console.log(results);
}finally{await browser.close();}
