import {createRequire} from 'node:module';import {fileURLToPath} from 'node:url';import fs from 'node:fs';import assert from 'node:assert/strict';
import {blankMap} from '../dist/tactics/maps.js';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH||'playwright'),browser=await chromium.launch({headless:true,channel:'msedge'});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:4389/tactics/editor.html?renderer=hybrid',{waitUntil:'networkidle'});
 const map=blankMap();map.name='Hybrid editor workflow';await page.locator('#file').setInputFiles({name:'workflow.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(map))});await page.waitForFunction(()=>hybridEditorDiagnostics().map.name==='Hybrid editor workflow');
 async function clickTile(x,y,z=0){const p=await page.evaluate(({x,y,z})=>{const d=hybridEditorDiagnostics(),r=document.querySelector('#editor-map').getBoundingClientRect();return {x:r.left+d.camera.x+(x-y)*28*d.camera.zoom,y:r.top+d.camera.y+(x+y)*14*d.camera.zoom-z*2.12*28*Math.sqrt(2)*Math.cos(Math.PI/6)*d.camera.zoom};},{x,y,z});await page.mouse.click(p.x,p.y);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));}
 await page.locator('[data-tool="prop"]').click();await page.locator('#prop-kind').selectOption('table-steel');await clickTile(8,8);
 assert.ok(await page.evaluate(()=>hybridEditorDiagnostics().map.props.some(p=>p.x===8&&p.y===8&&p.kind==='table-steel')));
 await page.locator('[data-tool="erase-prop"]').click();await clickTile(8,8);assert.equal(await page.evaluate(()=>hybridEditorDiagnostics().map.props.length),0);
 await page.locator('#undo').click();assert.equal(await page.evaluate(()=>hybridEditorDiagnostics().map.props.length),1);await page.locator('#redo').click();assert.equal(await page.evaluate(()=>hybridEditorDiagnostics().map.props.length),0);
 await page.locator('#level').selectOption('1');await page.locator('[data-tool="roof-tile"]').click();await page.locator('#roof-kind').selectOption('roof-flat-parapet');await clickTile(8,8,1);
 assert.ok(await page.evaluate(()=>hybridEditorDiagnostics().map.props.some(p=>p.kind==='roof-flat-parapet'&&p.z===1)));
 await page.locator('#level').selectOption('0');await page.locator('[data-tool="ladder"]').click();await clickTile(7,8);
 assert.ok(await page.evaluate(()=>hybridEditorDiagnostics().map.stairs.some(p=>p.x===7&&p.y===8&&p.kind==='ladder')));
 const expected=await page.evaluate(()=>hybridEditorDiagnostics().map),download=page.waitForEvent('download');await page.locator('#export').click();const exported=JSON.parse(fs.readFileSync(await (await download).path(),'utf8'));assert.deepEqual(exported,expected);
 await page.locator('#file').setInputFiles({name:'roundtrip.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(exported))});await page.waitForFunction(name=>hybridEditorDiagnostics().map.name===name,expected.name);
 await page.waitForFunction(()=>!document.querySelector('#test').disabled);await page.locator('#test').click();const frame=page.frameLocator('#test-frame');await frame.locator('#map').waitFor();await page.waitForFunction(()=>document.querySelector('#test-frame').contentWindow.hybridGameDiagnostics?.().mode==='hybrid');
 await page.locator('#close-test').click();assert.deepEqual(errors,[]);await page.screenshot({path:fileURLToPath(new URL('../docs/tactics/hybrid-review/stage-4-editor-workflow.png',import.meta.url))});console.log('Pointer prop/erase/undo/redo, upper roof placement, ladder, exact export/import and hybrid playtest passed.');
}finally{await browser.close();}
