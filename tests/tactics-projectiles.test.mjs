import test from 'node:test';
import assert from 'node:assert/strict';
import {blankMap,edgeKey,setTerrain} from '../dist/tactics/maps.js';
import {traceProjectile,bulletTrajectory} from '../dist/tactics/projectiles.js';
import {createGame,attack,previewAttack} from '../dist/tactics/engine.js';

function scene(){
 const s=blankMap(),a={id:0,x:10,y:10,z:0,hp:100,team:'squad'},b={id:1,x:20,y:10,z:0,hp:100,team:'guard'};s.units=[a,b];
 return {s,a,b};
}
const straight=(s,a,d={x:1,y:0,h:0},reach=20,h=1.3)=>traceProjectile(s,a,{x:a.x,y:a.y,h},d,reach);

test('accurate shots strike the nearest unit regardless of team, including allies beside the muzzle',()=>{
 const {s,a,b}=scene();s.units.push({id:2,x:11,y:10,z:0,hp:100,team:'squad'});
 const hit=bulletTrajectory(s,a,b,{accurate:true,zone:'head',reach:20},()=>{throw Error('Accurate shot needs no scatter roll');});
 assert.equal(hit.unitId,2);assert.ok(hit.x<11);assert.equal(hit.zone,'torso');
 s.units[2].hp=0;assert.equal(straight(s,a).unitId,b.id);
});
test('missed rounds can hit a diagonally adjacent ally and never hit a unit behind the shooter',()=>{
 const {s,a,b}=scene();s.units.push({id:2,x:11,y:11,z:0,hp:100,team:'squad'},{id:3,x:9,y:9,z:0,hp:100,team:'squad'});
 const samples=[1,.5],hit=bulletTrajectory(s,a,b,{accurate:false,chance:10,burst:true,reach:20},()=>samples.shift());
 assert.equal(hit.unitId,2);assert.equal(hit.accurate,false);
});
test('a near miss continues past the intended target and can hit someone behind it',()=>{
 const {s,a,b}=scene();const rolls=[.85,.5],first=bulletTrajectory(s,a,b,{accurate:false,chance:70,reach:20},()=>rolls.shift());
 assert.equal(first.kind,'range');assert.ok(first.x>b.x);
 const scale=13/(first.x-a.x);s.units.push({id:2,x:23,y:a.y+(first.y-a.y)*scale,z:0,hp:100,team:'guard'});
 const again=[.85,.5],hit=bulletTrajectory(s,a,b,{accurate:false,chance:70,reach:20},()=>again.shift());assert.equal(hit.unitId,2);
});
test('walls and exact corner joins stop rays before units; open doors and chainlink pass rounds',()=>{
 const {s,a,b}=scene();s.edges[edgeKey('e',12,10)]='wall';const wall=straight(s,a);assert.equal(wall.kind,'wall');assert.equal(wall.x,12.5);
 for(const kind of ['doorway-concrete-open','fence-chainlink']){s.edges[edgeKey('e',12,10)]=kind;assert.equal(straight(s,a).unitId,b.id);}
 s.edges={};s.edges[edgeKey('e',10,10)]='wall';assert.equal(straight(s,a,{x:1,y:1,h:0}).kind,'wall');
});
test('low cover, window frames, stance height and upper floors participate in actual collision',()=>{
 const {s,a}=scene();s.terrain[10][12]='crate';assert.equal(straight(s,a,{x:1,y:0,h:0},20,.5).kind,'cover');assert.equal(straight(s,a).kind,'unit');
 s.terrain[10][12]='yard';s.edges[edgeKey('e',12,10)]='window-concrete';assert.equal(straight(s,a).kind,'unit');assert.equal(straight(s,a,{x:1,y:0,h:0},20,.5).kind,'wall');
 s.edges={};s.units[1].stance='prone';assert.equal(straight(s,a).kind,'range');assert.equal(straight(s,a,{x:1,y:0,h:0},20,.3).kind,'unit');
 setTerrain(s,12,10,1,'floor');assert.equal(straight(s,a,{x:1,y:0,h:1},20,1.3).kind,'floor');
});
test('bullets stop at ground and map bounds without leaving the playable map',()=>{
 const {s,a}=scene();assert.equal(straight(s,a,{x:1,y:0,h:-1}).kind,'floor');
 const hit=straight(s,a,{x:-1,y:0,h:0},40);assert.equal(hit.kind,'boundary');assert.equal(hit.x,-.5);
});
function combat(seed=1){
 const map=blankMap();map.starts=[{x:10,y:10},{x:11,y:10},{x:3,y:3},{x:3,y:5}];map.guards=[{x:16,y:10,species:'pig-foreman',weapon:'pistol'}];
 const s=createGame(seed,map),a=s.units[0],b=s.units[4];a.heading=0;a.accuracy=1000;return {s,a,b,ally:s.units[1]};
}
test('a real burst charges once, traces each round, damages the blocking ally and preserves target health',()=>{
 const {s,a,b,ally}=combat();ally.hp=ally.maxHp=500;const ap=a.ap,ammo=a.ammo.assault;
 const preview=previewAttack(s,a,b,true);assert.equal(preview.obstruction.id,ally.id);assert.equal(preview.obstruction.friendly,true);assert.equal(preview.ok,true);
 assert.equal(attack(s,a,b,true),true);assert.equal(a.ap,ap-6);assert.equal(a.ammo.assault,ammo-3);
 assert.equal(s.effect.trajectories.length,3);assert.equal(b.hp,45);assert.ok(ally.hp<500);assert.match(s.log[0],/friendly fire/);
});
test('incidental torso hits can detonate a friendly flamethrower and cancel remaining burst shots',()=>{
 const {s,a,b,ally}=combat(8);ally.weapon='flamethrower';ally.ammo.flamethrower=4;ally.pack.push({type:'weapon',kind:'flamethrower',rounds:4});
 // Choose a seed whose accurate first round is followed by a torso detonation roll.
 for(let seed=0;seed<10000;seed++){const r=(Math.imul(seed,1664525)+1013904223)>>>0,t=(Math.imul(r,1664525)+1013904223)>>>0;if(r/4294967296<.95&&t/4294967296<.25){s.seed=seed;break;}}
 const ammo=a.ammo.assault;attack(s,a,b,true);assert.equal(ally.tanksExploded,true);assert.equal(a.casualty,'dead');assert.equal(s.effect.trajectories.length,1);assert.equal(a.ammo.assault,ammo-1);
});
test('scatter is reproducible and enemies can hit other guards',()=>{
 const run=()=>{const {s,a,b}=combat(1947);attack(s,a,b,true);return [s.seed,s.effect.trajectories,s.units.map(u=>u.hp)];};assert.deepEqual(run(),run());
 const {s,a,b,ally}=combat();b.x=13;b.heading=180;b.accuracy=1000;ally.team='guard';s.phase='enemy';assert.equal(attack(s,b,a,false,true),true);assert.ok(ally.hp<ally.maxHp);assert.equal(a.hp,a.maxHp);
});
