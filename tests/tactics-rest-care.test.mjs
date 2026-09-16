import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorld,currentMap,spendTime,medicalRestPreview} from '../dist/tactics/world.js';
import {blankMap} from '../dist/tactics/maps.js';
function setup(){const world=createWorld(blankMap()),s=currentMap(world);for(const u of s.units)u.hp=1;return {world,s};}
test('ordinary rest heals gradually over two days, independent of rest chunk size',()=>{
 const a=setup(),b=setup();spendTime(a.world,'rest',24);assert.equal(a.s.units[0].hp,56);assert.ok(a.s.units[0].hp<a.s.units[0].maxHp);
 for(let i=0;i<24;i++)spendTime(b.world,'rest',1);assert.deepEqual(a.s.units.map(u=>u.hp),b.s.units.map(u=>u.hp));
 spendTime(a.world,'rest',24);for(const u of a.s.units)assert.equal(u.hp,u.maxHp);
 assert.equal(a.s.units.reduce((sum,u)=>sum+u.medkits,0),4);
});
test('selected trained medic and one kit per wounded troop restore health in one day',()=>{
 const {world,s}=setup(),preview=medicalRestPreview(world,1);assert.ok(preview.ok);assert.equal(preview.medic.name,'Anya');assert.equal(preview.kitsNeeded,4);
 const result=spendTime(world,'medical-rest',24,1);assert.ok(result.ok);assert.match(result.message,/Anya/);assert.equal(world.clock.minutes,480+1440);assert.equal(world.money,2400);
 for(const u of s.units){assert.equal(u.hp,u.maxHp);assert.equal(u.medkits,0);assert.equal(u.medicalRestHours,0);}
});
test('short courses heal gradually and continue without consuming another medkit',()=>{
 const {world,s}=setup();assert.ok(spendTime(world,'medical-rest',1,3).ok);assert.equal(s.units[0].hp,5);assert.equal(s.units[0].medicalRestHours,23);
 for(let i=0;i<23;i++){assert.equal(medicalRestPreview(world,3).kitsNeeded,0);assert.ok(spendTime(world,'medical-rest',1,3).ok);}
 for(const u of s.units){assert.equal(u.hp,u.maxHp);assert.equal(u.medkits,0);}
});
test('ordinary rest continues an existing medical course',()=>{
 const {world,s}=setup();spendTime(world,'medical-rest',8,3);spendTime(world,'rest',8);spendTime(world,'rest',8);
 for(const u of s.units)assert.equal(u.hp,u.maxHp);
});
test('medical care rejects untrained, unavailable medics and insufficient kits atomically',()=>{
 const {world,s}=setup();let before=structuredClone(world);
 assert.equal(spendTime(world,'medical-rest',24,0).ok,false);assert.deepEqual(world,before);
 s.units[3].hp=0;s.units[3].casualty='captured';before=structuredClone(world);assert.equal(spendTime(world,'medical-rest',24,3).ok,false);assert.deepEqual(world,before);
 for(const u of s.units)u.medkits=0;before=structuredClone(world);assert.equal(spendTime(world,'medical-rest',24,1).ok,false);assert.deepEqual(world,before);
});
test('healthy, dead and captured troops consume no medical supplies and cannot be revived',()=>{
 const {world,s}=setup();s.units[0].hp=s.units[0].maxHp;s.units[1].hp=0;s.units[1].casualty='dead';s.units[2].hp=0;s.units[2].casualty='captured';
 assert.equal(medicalRestPreview(world,3).kitsNeeded,1);assert.ok(spendTime(world,'medical-rest',24,3).ok);assert.equal(s.units[1].hp,0);assert.equal(s.units[2].hp,0);assert.equal(s.units[3].hp,s.units[3].maxHp);
 const before=world.clock.minutes;assert.equal(spendTime(world,'medical-rest',24,3).ok,false);assert.equal(world.clock.minutes,before);
});
