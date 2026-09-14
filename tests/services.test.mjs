import test from 'node:test';
import assert from 'node:assert/strict';
import {Farm,line} from '../dist/engine.js';
import {refreshServices,advanceServices} from '../dist/services.js';
import {advancePeople,perimeter} from '../dist/people.js';
const run=(f,t)=>{for(let i=0;i<t*20;i++)f.advance(.05);};
test('water coverage follows walkable access, respects range and is blocked by belts',()=>{
 const f=new Farm(),home=f.place('residence',1,1);f.place('well',10,1);refreshServices(f);assert.ok(home.services.water);
 f.lay(line({x:8,y:0},{x:8,y:23}));refreshServices(f);assert.equal(home.services.water,false);
 f.layRoad([{x:8,y:2}]);refreshServices(f);assert.equal(home.services.water,true);
 f.remove([{x:10,y:1}]);f.place('well',32,20);refreshServices(f);assert.equal(home.services.water,false);
});
test('clinic needs an assigned worker physically present and closes at home time',()=>{
 const f=new Farm(),clinic=f.place('clinic',6,1);const home=f.place('residence',1,1);refreshServices(f);assert.equal(home.services.clinic,false);
 run(f,10);refreshServices(f);assert.ok(home.services.clinic);
 const p=f.people[0];p.health=50;advanceServices(f,10);assert.ok(p.health>50);
 f.clock=145;refreshServices(f);assert.equal(home.services.clinic,false);
});
test('lack of water and food damages health and contentment; services improve both',()=>{
 const f=new Farm(),home=f.place('residence',1,1),p=f.people[0];p.health=70;p.happiness=60;p.satiety=0;
 refreshServices(f);advanceServices(f,30);assert.ok(p.health<70);assert.ok(p.happiness<60);
 f.place('well',6,1);p.satiety=100;refreshServices(f);const health=p.health,mood=p.happiness;advanceServices(f,30);
 assert.ok(home.services.water);assert.ok(p.health>health);assert.ok(p.happiness>mood);
});
test('communal kitchen serves stronger meals only with a physically present cook',()=>{
 const serve=cooked=>{
  const f=new Farm();f.place('residence',1,1);const kitchen=f.place('kitchen',6,1);kitchen.inventory.ration=3;
  f.people.forEach(p=>{p.satiety=100;p.wait=100;});const cook=f.people.find(p=>p.job===kitchen.id),guest=f.people.find(p=>p!==cook);
  const c=perimeter(kitchen)[0];Object.assign(guest,{x:c.x+.5,y:c.y+.5,cell:{...c},path:[],wait:0,target:`depot:${kitchen.id}`,satiety:20});
  Object.assign(cook,{status:cooked?'working':'commuting',x:c.x+.5,y:c.y+.5,cell:{...c},moving:false});
  advancePeople(f,.05);assert.equal(kitchen.inventory.ration,2);assert.equal(kitchen.mealsServed,1);return guest.satiety;
 };
 assert.ok(Math.abs(serve(true)-serve(false)-15)<.001);
});
test('service state and resident wellbeing survive undo together',()=>{
 const f=new Farm();f.place('residence',1,1);f.place('well',6,1);run(f,10);const saved=f.snapshot();f.remove([{x:6,y:1}]);run(f,30);f.restore(saved);assert.equal(f.snapshot(),saved);
});
