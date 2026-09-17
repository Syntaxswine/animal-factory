import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {parseMap,openDoorBetween,addStairs} from '../dist/tactics/maps.js';
import {createGame,refresh,lineOfSight} from '../dist/tactics/engine.js';
import {traceProjectile,bulletTrajectory,shotgunTrajectories} from '../dist/tactics/projectiles.js';
import {hybridWorld,invalidateHybrid,aimPoint} from '../dist/tactics/hybrid-combat.js';
import {explosiveTrajectory,detonate} from '../dist/tactics/explosives.js';
import {replayHybrid} from '../dist/tactics/hybrid-replay.js';
const fixture=()=>parseMap(fs.readFileSync(new URL('../dist/tactics/fixtures/hybrid-room.json',import.meta.url),'utf8'));
const scene=()=>createGame(1947,fixture(),false,'standard',{geometryMode:'hybrid'});
test('real engine movement opens shared geometry; rendered observer cannot change replay',()=>{
 const map=fixture(),headless=replayHybrid(map),rendered=replayHybrid(map,s=>{hybridWorld(s);for(const u of s.units)aimPoint(s,u);});
 assert.deepEqual(rendered,headless);assert.ok(headless.events.every(e=>e.ok),JSON.stringify(headless.events.map(e=>[e.command,e.ok])));
 assert.equal(headless.state.edges['s:5:7'],'doorway-concrete-open');assert.ok(headless.events.at(-1).effect.trajectories.length);
});
test('standing, kneeling and facing-aware prone volumes participate in nearest friendly fire',()=>{
 const s=scene(),a=s.units[0],b=s.units[1];s.units=[a,b];b.x=5;b.y=5;b.heading=0;
 const trace=(x,h)=>traceProjectile(s,a,{x,y:6.5,h},{x:0,y:-1,h:0},2);
 assert.equal(trace(5,1.2).unitId,b.id);b.stance='kneeling';assert.equal(trace(5,1.4).kind,'range');
 b.stance='prone';assert.equal(trace(5,.3).unitId,b.id);assert.equal(trace(5.55,.3).zone,'head');
 b.heading=90;assert.equal(trace(5.55,.3).kind,'range');b.away=true;assert.equal(trace(5,.3).kind,'range');
});
test('window geometry deliberately differs from legacy and sight uses actual aimed regions',()=>{
 const s=scene(),a=s.units[0],b=s.units[1];a.x=7;a.y=9;b.x=7;b.y=5;b.heading=90;
 assert.equal(lineOfSight(s,a,b),true);b.stance='prone';assert.equal(lineOfSight(s,a,b),false);
 const ray={x:0,y:-1,h:0},origin={x:7,y:9,h:1.8};assert.equal(traceProjectile(s,a,origin,ray,4).kind,'wall');
 assert.equal(traceProjectile({...s,geometryMode:undefined,units:[]},null,origin,ray,4).kind,'range');
});
test('upper floors, stair holes, door updates and destruction invalidate the shared world',()=>{
 const s=scene(),w=hybridWorld(s);openDoorBetween(s,{x:5,y:8},{x:5,y:7});assert.notEqual(hybridWorld(s),w);
 const ray=()=>traceProjectile({...s,units:[]},null,{x:2,y:2,h:3.5},{x:0,y:0,h:-1},3);
 assert.equal(ray().kind,'floor');s.stairs=[{x:2,y:2,z:0}];refresh(s);assert.equal(ray().kind,'range');
 const before=hybridWorld(s);detonate(s,{x:6,y:7.6,h:1,z:0},{blast:3,damage:220});assert.notEqual(hybridWorld(s),before);
});
test('grenades retain a swept parabola, roofs intercept arcs, and scatter stays seeded',()=>{
 const s=scene(),a=s.units[0];a.x=3;a.y=3;const target={x:3,y:5,z:0,ground:true};
 const hit=explosiveTrajectory(s,a,target,{arc:true,range:10},{chance:100},()=>.1);assert.equal(hit.kind,'floor');assert.ok(hit.path.length>2);assert.ok(hit.h>=2);
 const run=()=>{let n=12;return bulletTrajectory(s,a,s.units[1],{accurate:false,chance:40,reach:15},()=>((n=(Math.imul(n,1664525)+1013904223)>>>0)/2**32));};assert.deepEqual(run(),run());
});
test('roof underside blast leaves the impact face and still shields actors above it',()=>{
 const s=scene(),a=s.units[0],b=s.units[1];a.x=3;a.y=3;b.x=3;b.y=3;b.z=1;s.units=[a,b];
 const hit=explosiveTrajectory(s,a,{x:3,y:5,z:0,ground:true},{arc:true,range:10},{chance:100},()=>.1);
 assert.deepEqual(hit.normal,[0,-1,0]);const blast=detonate(s,hit,{blast:4,damage:100});
 assert.ok(blast.hits.some(h=>h.unit===a));assert.ok(!blast.hits.some(h=>h.unit===b));
 const floorHit=traceProjectile({...s,units:[]},null,{x:4,y:4,h:1},{x:0,y:0,h:-1},2);a.x=4;a.y=4;
 assert.ok(detonate(s,floorHit,{blast:2,damage:30}).hits.some(h=>h.unit===a));
});
test('requested aim cannot override a nearer physical region and pellets aim at prone head XY',()=>{
 const s=scene(),a=s.units[0],b=s.units[1];a.x=5;a.y=6.5;b.x=5;b.y=5;b.heading=90;b.stance='prone';s.units=[a,b];
 const hit=bulletTrajectory(s,a,b,{accurate:true,zone:'legs',reach:10},()=>0);assert.equal(hit.unitId,b.id);assert.equal(hit.zone,'torso');
 b.heading=0;const pellets=shotgunTrajectories(s,a,b,{accurate:true,zone:'head',reach:10,pellets:1},()=>0);assert.equal(pellets[0].zone,'head');
});
