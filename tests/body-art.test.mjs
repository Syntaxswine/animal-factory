import test from 'node:test';
import assert from 'node:assert/strict';
import {BODY_FRAMES,bodyArt,drawBody} from '../dist/tactics/body-art.js';
import {CHARACTER_SPECIES} from '../dist/tactics/character-art.js';
import {RED_HAT_SPECIES} from '../dist/tactics/red-hats-art.js';
import {readFile} from 'node:fs/promises';

test('bodies cover every animal uniform with independent transparent PNGs',async()=>{
 assert.equal(BODY_FRAMES.length,16);assert.equal(new Set(BODY_FRAMES.map(f=>f.src)).size,16);
 for(const outfit of ['normal','red-hats'])for(const species of outfit==='normal'?CHARACTER_SPECIES:RED_HAT_SPECIES){
  const frame=bodyArt({species,outfit});assert.ok(frame,`${outfit}/${species}`);
  assert.equal(bodyArt({species,outfit,weapon:'flamethrower',casualty:'dead'}),frame);
  assert.equal(bodyArt({species,outfit,weapon:'hands',casualty:'stable'}),frame);
  const data=await readFile(new URL('../dist/'+frame.src.replace('../',''),import.meta.url));
  assert.equal(data.readUInt32BE(16),frame.width);assert.equal(data.readUInt32BE(20),frame.height);assert.equal(data[25],6);
  assert.deepEqual(frame.anchor,[frame.width/2,244]);assert.ok(frame.contentHeight<=160);
 }
 assert.equal(bodyArt({species:'pig-foreman',outfit:'red-hats'}),bodyArt({species:'pig-foreman'}));
});
test('body rendering preserves location and facing without drawing equipment',()=>{
 const calls=[],ctx=Object.fromEntries(['save','restore','translate','scale','drawImage'].map(k=>[k,(...args)=>calls.push([k,...args])]));
 const img={complete:true,naturalWidth:384},u={species:'horse',facing:-1},f=bodyArt(u);
 assert.equal(drawBody(ctx,()=>img,u,{x:20,y:30},2),true);
 assert.deepEqual(calls.find(c=>c[0]==='translate'),['translate',20,30]);
 assert.deepEqual(calls.find(c=>c[0]==='scale'),['scale',-1,1]);
 assert.deepEqual(calls.find(c=>c[0]==='drawImage'),['drawImage',img,-f.anchor[0]/2,-122,f.width/2,f.height/2]);
 assert.equal(drawBody(null,()=>({complete:false}),u,{x:0,y:0},1),false);
 assert.equal(drawBody(null,()=>img,{species:'unknown'},{x:0,y:0},1),false);
});
