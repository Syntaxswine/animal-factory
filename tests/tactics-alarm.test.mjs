import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,refresh,attack,previewAttack,canSee,WEAPONS} from '../dist/tactics/engine.js';
import {blankMap,edgeKey} from '../dist/tactics/maps.js';

// A wall on the east edge of x=20 separates the shooter and its target (west) from the listeners (east). Listeners face east,
// so the shooter sits in their rear notch and nothing on the far side can be seen either way: only sound can carry.
function scene(weapon,listeners){
 const m=blankMap();m.starts=[{x:15,y:30,z:0},{x:14,y:30,z:0},{x:15,y:31,z:0},{x:14,y:31,z:0}];
 m.guards=[{x:18,y:30,z:0,species:'donkey',weapon:'knife'},...listeners.map(x=>({x,y:30,z:0,species:'donkey',weapon:'pistol'}))];
 for(let y=0;y<60;y++)m.edges[edgeKey('e',20,y,0)]='wall';
 const s=createGame(1,m);s.units.slice(1,4).forEach(p=>p.hp=0);const u=s.units[0];u.weapon=weapon;u.heading=0;
 for(const g of s.units.slice(4))g.heading=0;for(const p of s.units)p.lastAt=p.x+','+p.y+','+(p.z||0);refresh(s);
 return {s,u,target:s.units[4],listeners:s.units.slice(5)};
}

test('a pistol shot alerts guards within sixteen tiles and only makes those beyond suspicious',()=>{
 const {s,u,target,listeners:[near,far]}=scene('pistol',[30,33]);
 assert.equal(WEAPONS.pistol.range*2,16);assert.ok(!near.alert&&!far.alert);assert.ok(!canSee(s,near,u)&&!canSee(s,far,u),'no line of sight through the wall');
 assert.ok(previewAttack(s,u,target).ok);assert.ok(attack(s,u,target));
 assert.ok(near.alert,'fifteen tiles away hears the report as contact');assert.deepEqual(near.lastKnown,{x:18,y:30,z:0},'and converges on the approximate report');
 assert.ok(!far.alert,'eighteen tiles away is beyond twice the pistol range');assert.deepEqual(far.lastHeard,{x:18,y:30,z:0},'but the old thirty-tile suspicion still applies');
});

test('a rifle shot carries twenty-eight tiles',()=>{
 const {s,u,target,listeners:[near,far]}=scene('rifle',[42,46]);
 assert.equal(WEAPONS.rifle.range*2,28);assert.ok(attack(s,u,target));
 assert.ok(near.alert,'twenty-seven tiles');assert.ok(!far.alert,'thirty-one tiles');assert.equal(far.lastHeard,null,'and beyond thirty tiles nothing is heard');
});

test('a guard firing alerts its colleagues too, and an already alert guard keeps its own fix',()=>{
 const {s,u,target,listeners:[near]}=scene('pistol',[30]);
 near.alert=true;near.lastKnown={x:1,y:1,z:0};assert.ok(attack(s,u,target));
 assert.deepEqual(near.lastKnown,{x:1,y:1,z:0},'an alert guard is not redirected by the report');
 near.alert=false;near.lastKnown=null;target.weapon='pistol';target.alert=true;target.heading=180;s.phase='enemy';s.enemyIndex=4;
 const before=s.log.length;assert.ok(attack(s,target,u,false,true),'the guard returns fire');
 assert.ok(near.alert,'the colleague fifteen tiles behind the wall hears the guard shoot');assert.deepEqual(near.lastKnown,{x:18,y:30,z:0});
});

test('melee makes no report',()=>{
 const {s,u,target,listeners:[near]}=scene('knife',[21]);
 u.x=17;refresh(s);u.lastAt='17,30,0';assert.ok(previewAttack(s,u,target).ok);assert.ok(attack(s,u,target));
 assert.ok(!near.alert,'a knife four tiles from a listener behind the wall is silent');
});
