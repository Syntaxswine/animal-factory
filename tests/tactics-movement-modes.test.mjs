import test from 'node:test';
import assert from 'node:assert/strict';
import {blankMap,addStairs} from '../dist/tactics/maps.js';
import {createGame,setMovementMode,setSneaking,movementModeOf,movementCost,movementNeighbors,effectiveStealth,sightRange,detectionChance,pathTo,pathCost,move,moveGroup,stepMovement} from '../dist/tactics/engine.js';
import {crossingCost} from '../dist/tactics/world.js';
function scene(){const map=blankMap();map.guards=[{x:220,y:220,z:0,species:'cow',weapon:'knife'}];const s=createGame(1,map);s.units[4].alert=true;s.phase='player';return s;}
test('movement percentages preserve exact cardinal, diagonal and stance costs',()=>{
 for(const [mode,factor]of [['walk',1],['run',.5],['sneak',1.5]])for(const [stance,base]of [['standing',2],['kneeling',4],['prone',8]]){
  const s=scene(),u=s.units[0];u.stance=stance;if(mode!=='walk')assert.ok(setMovementMode(s,u,mode));
  assert.equal(movementCost(u),base*factor);assert.equal(crossingCost(s,u),base*factor);
  assert.equal(pathCost(pathTo(s,u,4,4)),base*factor);assert.equal(pathCost(pathTo(s,u,4,3)),base*1.5*factor);
  s.phase='player';u.ap=base*1.5*factor;assert.ok(move(s,u,4,3));assert.ok(stepMovement(s));assert.equal(u.ap,0);
 }
});
test('floor costs use the same multiplier without bypassing stance restrictions',()=>{
 const m=blankMap();addStairs(m,3,4,0,'ladder');const s=createGame(1,m),u=s.units[0];
 for(const [mode,cost]of [['run',1.5],['sneak',4.5],['walk',3]]){assert.ok(setMovementMode(s,u,mode));assert.equal(movementNeighbors(s,u).find(p=>p.z===1).cost,cost);assert.equal(pathCost(pathTo(s,u,3,4,1)),cost);}
 u.stance='prone';assert.equal(movementNeighbors(s,u).some(p=>p.z===1),false);
});
test('sneak adds twenty effective stealth, caps at100 and never changes training',()=>{
 const s=scene(),u=s.units[0],g=s.units[4];g.x=8;g.y=4;g.heading=180;const skill=u.stealth,range=sightRange(g,u),chance=detectionChance(s,g,u);
 assert.ok(setMovementMode(s,u,'sneak'));assert.equal(effectiveStealth(u),skill+20);assert.equal(u.stealth,skill);assert.ok(sightRange(g,u)<range);assert.ok(detectionChance(s,g,u)<chance);
 u.stealth=95;assert.equal(effectiveStealth(u),100);assert.ok(setMovementMode(s,u,'run'));assert.equal(effectiveStealth(u),95);assert.equal(u.sneaking,false);assert.equal(u.running,true);
 assert.ok(setSneaking(s,u));assert.equal(u.running,false);assert.equal(movementModeOf(u),'sneak');assert.ok(setSneaking(s,u));assert.equal(movementModeOf(u),'walk');
 assert.equal(movementModeOf({}),'walk');
});
test('queued, unavailable and invalid mode changes are rejected without charging AP',()=>{
 const s=scene(),u=s.units[0],ap=u.ap;u.overwatch={};assert.ok(setMovementMode(s,u,'run'));assert.equal(u.overwatch,null);assert.equal(u.ap,ap);
 s.queue=[{}];assert.equal(setMovementMode(s,u,'sneak'),false);s.queue=[];assert.equal(setMovementMode(s,u,'invalid'),false);s.phase='enemy';assert.equal(setMovementMode(s,u,'walk'),false);
 s.phase='player';u.hp=0;assert.equal(setMovementMode(s,u,'walk'),false);
});
test('mixed group movement charges each members own pace and preserves formation',()=>{
 const s=scene(),a=s.units[0],b=s.units[1];b.x=3;b.y=10;Object.assign(s.units[4],{x:8,y:4,weapon:'pistol'});setMovementMode(s,a,'run');setMovementMode(s,b,'sneak');s.phase='player';
 const before=[a.ap,b.ap];assert.ok(moveGroup(s,[a.id,b.id],a,4,4));assert.ok(stepMovement(s));assert.deepEqual([a.x,b.x],[4,4]);assert.deepEqual([a.ap,b.ap],[before[0]-1,before[1]-3]);
});
