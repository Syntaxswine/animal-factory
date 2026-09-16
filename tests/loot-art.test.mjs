import test from 'node:test';
import assert from 'node:assert/strict';
import {deathDropArt,fallenVisible,drawDeathDrops,inventoryArt,drawLootPile} from '../dist/tactics/loot-art.js';
import {createGame,refresh,key} from '../dist/tactics/engine.js';
import {blankMap} from '../dist/tactics/maps.js';

test('loot artwork follows remaining inventory and never leaves ghost guns after pickup',()=>{
 const pile={items:[{type:'weapon',kind:'rifle'},{type:'ammo',kind:'rifle',count:5}]},calls=[];
 const draw=()=>drawLootPile({drawImage:(img)=>calls.push(img.src)},src=>({src,complete:true,naturalWidth:1254}),pile,{x:0,y:0},1);
 assert.equal(draw(),true);assert.equal(calls.length,2);
 pile.items.splice(0,1);calls.length=0;draw();assert.deepEqual(calls,[inventoryArt(pile.items[0])]);
 pile.items=[];calls.length=0;assert.equal(draw(),false);assert.equal(calls.length,0);
 assert.deepEqual(deathDropArt({hp:0,weapon:'rifle',lootDropped:true}),[]);
 assert.equal(inventoryArt({type:'weapon',kind:'knife'}),null);
 assert.match(inventoryArt({type:'utility',kind:'medkits'}),/first-aid-kit/);
 assert.match(inventoryArt({type:'utility',kind:'wireCutters'}),/wire-cutters/);
});

test('dead firearm users show their equipped gun and only nonempty matching ammo',()=>{
 for(const weapon of ['pistol','rifle','assault']){
  const unit={hp:0,weapon,ammo:{[weapon]:1}};
  assert.deepEqual(deathDropArt(unit).map(d=>d.src),['gun','ammo'].map(k=>`../assets/environment/loot/${k}-${weapon}.png`));
  assert.equal(deathDropArt({...unit,hp:1}).length,0);
  assert.equal(deathDropArt({...unit,ammo:{[weapon]:0}}).length,1);
 }
 for(const weapon of ['hands','knife','unknown'])assert.equal(deathDropArt({hp:0,weapon}).length,0);
});

test('fallen guards remain drawable after refresh removes live detection, respecting floor and exploration',()=>{
 const map=blankMap();map.guards=[{x:5,y:5,z:0,species:'pig-foreman',weapon:'pistol'}];
 const state=createGame(1,map,false),unit=state.units[4];
 state.detected.add(unit.id);unit.hp=0;refresh(state);state.seen.add(key(unit.x,unit.y));
 assert.equal(state.detected.has(unit.id),false);
 assert.equal(fallenVisible(state,unit,0),true);
 assert.equal(fallenVisible(state,unit,1),false);
 state.seen.delete(key(unit.x,unit.y));assert.equal(fallenVisible(state,unit,0),false);
 unit.z=1;state.seen.add(key(unit.x,unit.y,1));assert.equal(fallenVisible(state,unit,1),true);
});

test('drop rendering skips pending images and scales the ground layout with camera zoom',()=>{
 const calls=[],ctx={drawImage:(...args)=>calls.push(args)},unit={hp:0,weapon:'rifle',ammo:{rifle:2}};
 drawDeathDrops(ctx,()=>({complete:false}),unit,{x:100,y:80},2);assert.equal(calls.length,0);
 drawDeathDrops(ctx,()=>({complete:true,naturalWidth:1254}),unit,{x:100,y:80},2);
 assert.equal(calls.length,2);assert.equal(calls[0][3],80);assert.equal(calls[1][3],34);
 assert.ok(calls[1][1]>calls[0][1]);
});
