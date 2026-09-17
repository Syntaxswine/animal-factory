import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {decodePNG} from '../tools/png-rgba.mjs';import {unitArt} from '../dist/tactics/red-hats-art.js';
import {alphaBounds,spriteVertex,rigidSpriteVertex,weaponLandmarks} from '../dist/tactics/hybrid-sprites.js';import {GAME_CAMERA,projectWorld} from '../dist/tactics/hybrid-world.js';
import {muzzlePoint} from '../dist/tactics/hybrid-combat.js';
test('rigid art preview preserves distances and ground anchor without heading-dependent deformation',()=>{
 const art={anchor:[128,244]},bounds={bottom:240},scale=1.65*Math.cos(GAME_CAMERA.elevation)/236;
 for(const stance of ['standing','kneeling','prone'])for(let heading=0;heading<360;heading+=45){
  const unit={stance,heading},a=rigidSpriteVertex(unit,art,bounds,100,130),b=rigidSpriteVertex(unit,art,bounds,190,200),anchor=rigidSpriteVertex(unit,art,bounds,128,240);
  assert.ok(Math.abs(Math.hypot(b[0]-a[0],b[1]-a[1])-Math.hypot(90,70)*scale)<1e-12);
  assert.equal(anchor[1],0);assert.equal(Math.abs(anchor[0]),0);
 }
});
test('opaque sprite bounds calibrate all stances and prone long axis follows eight headings',()=>{
 for(const species of ['horse','cow','skunk'])for(const outfit of ['normal','red-hats'])for(const stance of ['standing','kneeling','prone']){
  const unit={species,outfit,stance,weapon:'rifle',hp:100},art=unitArt(unit),png=decodePNG(fs.readFileSync(new URL('../dist/'+art.src.replace('../',''),import.meta.url))),b=alphaBounds(png.pixels,png.width,png.height);
  for(let heading=0;heading<360;heading+=45){unit.heading=heading;
   const left=spriteVertex(unit,art,b,b.left,b.bottom,GAME_CAMERA),right=spriteVertex(unit,art,b,b.right,b.bottom,GAME_CAMERA);assert.ok([...left,...right].every(Number.isFinite));
   if(stance==='prone'){const axis=projectWorld([Math.cos(heading*Math.PI/180),0,Math.sin(heading*Math.PI/180)],GAME_CAMERA),dx=right[0]-left[0],dy=right[1]-left[1];assert.ok(Math.abs(dx*axis[1]-dy*axis[0])<1e-9);assert.ok(dx*axis[0]+dy*axis[1]>0);}
  }
 }
});
test('measured painted muzzle maps to actual firing origin across all calibration poses',()=>{
 for(const species of ['horse','cow','skunk'])for(const outfit of ['normal','red-hats'])for(const stance of ['standing','kneeling','prone']){
  const unit={x:0,y:0,z:0,species,outfit,stance,weapon:'rifle',hp:100},art=unitArt(unit),png=decodePNG(fs.readFileSync(new URL('../dist/'+art.src.replace('../',''),import.meta.url))),b=alphaBounds(png.pixels,png.width,png.height);
  art.weaponLandmarks=weaponLandmarks(png.pixels,png.width,png.height,b,art.anchor[0]);assert.ok(art.weaponLandmarks);
  for(let heading=0;heading<360;heading+=45){unit.heading=heading;const actual=spriteVertex(unit,art,b,...art.weaponLandmarks.muzzle,GAME_CAMERA),tip=muzzlePoint({geometryMode:'hybrid'},unit),expected=projectWorld([tip.x,tip.h,tip.y],GAME_CAMERA);assert.ok(Math.hypot(actual[0]-expected[0],actual[1]-expected[1])<1e-9);}
 }
});
