import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {TYPES} from '../dist/engine.js';
const root=new URL('../dist/',import.meta.url);
async function checkPNG(path,width,height){
 const data=await readFile(new URL(path,root));
 assert.equal(data.subarray(1,4).toString(),'PNG',path);
 assert.equal(data.readUInt32BE(16),width,path);assert.equal(data.readUInt32BE(20),height,path);
 assert.equal(data[25],6,`${path} must have RGBA channels`);
}
const manifest=JSON.parse(await readFile(new URL('assets/characters/manifest.json',root)));
assert.equal(Object.keys(manifest.characters).length,8);
for(const def of Object.values(manifest.characters)){
 assert.equal(def.frames.length,4);await checkPNG('assets/characters/'+def.sheet,768,256);
 for(const frame of def.frames)await checkPNG('assets/characters/'+frame,192,256);
}
for(const type of Object.keys(TYPES))await checkPNG(`assets/machines/${type}.png`,320,320);
for(const type of ['mill','bakery','bottler','dairy'])await checkPNG(`assets/machines/industrial/${type}.png`,320,320);
for(const file of ['index.html','sprites.html','app.js','engine.js','style.css'])await readFile(new URL(file,root));
console.log('Verified 32 character frames, 8 strips, 12 machine sprites, 4 industrial variants, and entrypoints.');
