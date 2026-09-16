import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,equipCutters,equip,stowWeapon,cutPreview,cutFence} from '../dist/tactics/engine.js';
import {blankMap} from '../dist/tactics/maps.js';
import {gridLayout} from '../dist/tactics/inventory.js';
function setup(){const s=createGame(1,blankMap()),u=s.units[0];s.edges['e:3:4']='fence-chainlink';return {s,u};}
for(const slot of [0,1])test('cutters must occupy held slot '+slot+' to open adjacent wire fence',()=>{
 const {s,u}=setup();assert.match(cutPreview(s,u,'e:3:4').reason,/held slot/);assert.equal(cutFence(s,u,'e:3:4'),false);
 const old=u.slots[slot],ap=u.ap;assert.equal(equipCutters(s,u,slot),true);assert.equal(u.ap,ap);assert.equal(u.slots[slot],'wireCutters');
 assert.ok(!gridLayout(u).entries.some(e=>e.key==='wireCutters'));assert.ok(gridLayout(u).entries.some(e=>e.item.kind===old));
 assert.equal(u.weapon,slot===0?'hands':'assault');assert.equal(equipCutters(s,u,1-slot),false);
 assert.equal(cutFence(s,u,'e:3:4'),true);assert.equal(s.edges['e:3:4'],'fence-cut');assert.equal(u.ap,ap);
 assert.equal(stowWeapon(s,u,slot),true);assert.ok(gridLayout(u).entries.some(e=>e.key==='wireCutters'));
 s.edges['e:3:4']='fence-chainlink';assert.equal(cutFence(s,u,'e:3:4'),false);
});
test('combat equip costs 3 AP, cutting costs 4 AP, and replacing cutters returns them to the bag',()=>{
 const {s,u}=setup();s.phase='player';u.ap=2;const before=structuredClone(u);assert.equal(equipCutters(s,u,1),false);assert.deepEqual(u,before);
 u.ap=7;assert.ok(equipCutters(s,u,1));assert.equal(u.ap,4);assert.ok(cutFence(s,u,'e:3:4'));assert.equal(u.ap,0);
 s.phase='player';u.ap=3;assert.ok(equip(s,u,'pistol',1));assert.ok(gridLayout(u).entries.some(e=>e.key==='wireCutters'));assert.ok(!u.slots.includes('wireCutters'));
});
test('equipping and stowing cutters reject full backpack without losing equipment',()=>{
 const {s,u}=setup();u.medkits=0;u.pack=u.pack.filter(i=>i.type==='weapon');for(let i=0;i<17;i++)u.pack.push({type:'ammo',kind:'test'+i,count:1,cell:i});
 let before=structuredClone(u);assert.equal(equipCutters(s,u,0),false);assert.deepEqual(u,before);
 assert.ok(equipCutters(s,u,1));u.pack.push({type:'ammo',kind:'last',count:1});before=structuredClone(u);assert.equal(stowWeapon(s,u,1),false);assert.deepEqual(u,before);
});
