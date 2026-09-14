import {PROPS,EDGES,GROUNDS} from '../dist/tactics/environment.js';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {TYPES} from '../dist/engine.js';
const root=new URL('../dist/',import.meta.url);
async function checkPNG(path,width,height,channels=6){
 const data=await readFile(new URL(path,root));
 assert.equal(data.subarray(1,4).toString(),'PNG',path);
 assert.equal(data.readUInt32BE(16),width,path);assert.equal(data.readUInt32BE(20),height,path);
 assert.equal(data[25],channels,`${path} has unexpected PNG channels`);
}
const manifest=JSON.parse(await readFile(new URL('assets/characters/manifest.json',root)));
assert.equal(Object.keys(manifest.characters).length,8);
for(const def of Object.values(manifest.characters)){
 assert.equal(def.frames.length,4);await checkPNG('assets/characters/'+def.sheet,768,256);
 for(const frame of def.frames)await checkPNG('assets/characters/'+frame,192,256);
}
for(const [type,t] of Object.entries(TYPES)){if(t.sprite)assert.match(await readFile(new URL('assets/machines/'+t.sprite,root),'utf8'),/<svg/);else await checkPNG(`assets/machines/${type}.png`,320,320);}
for(const type of ['mill','bakery','bottler','dairy'])await checkPNG(`assets/machines/industrial/${type}.png`,320,320);
for(const file of ['index.html','sprites.html','app.js','engine.js','people.js','renderer.js','isometric.js','style.css'])await readFile(new URL(file,root));
const environment=JSON.parse(await readFile(new URL('assets/environment/manifest.json',root)));
const artIds=[...Object.keys(PROPS),...new Set(Object.values(EDGES).map(r=>r.art).filter(Boolean)),...GROUNDS];
assert.deepEqual(environment.assets.map(a=>a.id).sort(),artIds.sort());
for(const a of environment.assets)await checkPNG('assets/environment/'+a.file,1254,1254,a.kind==='terrain'?2:6);
console.log('Verified 28 tactical environment assets;  32 character frames, 8 strips, 12 machine sprites, a depot illustration, 4 industrial variants, and entrypoints.');
