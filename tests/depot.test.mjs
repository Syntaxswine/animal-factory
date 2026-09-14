import test from 'node:test';
import assert from 'node:assert/strict';
import {Farm,starter,allPorts,DIRS,key,line,TYPES} from '../dist/engine.js';
import {advancePeople,perimeter,walkable} from '../dist/people.js';
function residents(f,count=1){f.place('residence',0,16);f.people.forEach((p,i)=>p.satiety=i<count?60:100);}
const run=(f,seconds)=>{for(let i=0;i<seconds*20;i++)f.advance(.05);};
function input(f,depot){const p=allPorts(depot)[0],[dx,dy]=DIRS[p.dir];f.lay([{x:p.x-dx,y:p.y-dy,dir:p.dir}]);return f.belts[key(p.x-dx,p.y-dy)];}

test('depots accept only rations at the marked input in every rotation and stockpile 32',()=>{
  for(let dir=0;dir<4;dir++){
    const f=new Farm(),depot=f.place('depot',10,10,dir),belt=input(f,depot);
    belt.item='bread';f.move();assert.equal(belt.item,'bread');assert.equal(depot.inventory.ration,undefined);
    for(let i=0;i<32;i++){belt.item='ration';f.move();assert.equal(belt.item,null);}
    assert.equal(depot.inventory.ration,TYPES.depot.capacity);
    belt.item='ration';f.move();assert.equal(belt.item,'ration');assert.equal(depot.inventory.ration,32);
    depot.inventory.ration--;f.move();assert.equal(belt.item,null);assert.equal(depot.inventory.ration,32);
    assert.equal(f.people.length,0,'a depot should not create a new food consumer');
  }
});

test('workers prefer a reachable stocked depot and each consume exactly one reserved portion',()=>{
  const f=new Farm();f.place('field',1,1);f.place('mill',1,7);const depot=f.place('depot',8,4);
  depot.inventory.ration=2;
  f.lay([{x:4,y:5,dir:0}]);f.belts[key(4,5)].item='ration';
  residents(f,2);
  advancePeople(f,.05);
  assert.ok(f.people.filter(p=>p.satiety<72).every(p=>p.target===`depot:${depot.id}`));
  run(f,30);
  assert.equal(depot.inventory.ration,0);assert.equal(depot.mealsServed,2);
  assert.equal(f.people.filter(p=>p.meals===1).length,2);assert.equal(f.belts[key(4,5)].item,'ration');
});

test('unreachable or empty depots preserve conveyor-end fallback',()=>{
  for(const blocked of [true,false]){
    const f=new Farm();f.place('field',1,1);const depot=f.place('depot',11,4);
    if(blocked){depot.inventory.ration=4;f.lay(line({x:8,y:0},{x:8,y:23}));}
    f.lay([{x:5,y:5,dir:0}]);f.belts[key(5,5)].item='ration';residents(f);f.people[0].satiety=60;
    run(f,30);assert.equal(f.rationsEaten,1);assert.equal(depot.mealsServed||0,0);
    if(blocked)assert.equal(depot.inventory.ration,4);
  }
});

test('deleting a targeted depot cancels the trip and undo restores its stock',()=>{
  const f=new Farm();f.place('field',1,1);const depot=f.place('depot',11,4);depot.inventory.ration=12;residents(f);
  advancePeople(f,.05);assert.equal(f.people[0].target,`depot:${depot.id}`);const saved=f.snapshot();
  f.remove([{x:11,y:4}]);run(f,10);assert.equal(f.rationsEaten,0);assert.notEqual(f.people[0].target,`depot:${depot.id}`);
  f.restore(saved);assert.equal(f.snapshot(),saved);run(f,30);
  assert.equal(f.buildings.find(b=>b.id===depot.id).inventory.ration,11);
});

test('full depot backs up the return belt but never blocks bread deliveries',()=>{
  const f=starter(true),depot=f.buildings.find(b=>b.type==='depot');depot.inventory.ration=32;
  // Keep residents fed so the full supply chain cannot drain during this regression.
  f.people.forEach(p=>p.satiety=10000);run(f,3000);
  assert.ok(f.delivered.bread>30);assert.equal(depot.inventory.ration,32);
  assert.ok(f.buildings.find(b=>b.type==='house').rationReserve>5);
});

test('starter food chains deliver to depots and workers eat outside their footprints',()=>{
  for(const plan of ['bread','cakes']){
    const f=starter(true,plan),depot=f.buildings.find(b=>b.type==='depot');run(f,240);
    assert.ok(depot.mealsServed>0,plan);assert.ok(f.rationsEaten>0);
    const parcels=Object.values(f.belts).filter(b=>b.item==='ration').length;
    const ready=f.buildings.find(b=>b.type==='house').output;
    assert.equal(f.produced.ration,ready+parcels+(depot.inventory.ration||0)+f.rationsEaten);
    for(const p of f.people)assert.ok(walkable(f,Math.floor(p.x),Math.floor(p.y)));
    assert.ok(perimeter(depot).some(p=>walkable(f,p.x,p.y)));
  }
});
