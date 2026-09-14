import test from 'node:test';
import assert from 'node:assert/strict';
import {Farm,allPorts,DIRS,key} from '../dist/engine.js';
import {estateOffer,advanceEstate,estateDemand} from '../dist/estate.js';
import {advanceServices} from '../dist/services.js';
const run=(f,t)=>{for(let i=0;i<t*20;i++)f.advance(.05);};
function deliver(f,house,good){const p=allPorts(house).find(p=>p.good===good),[dx,dy]=DIRS[p.dir],k=key(p.x-dx,p.y-dy);if(!f.belts[k])f.lay([{x:p.x-dx,y:p.y-dy,dir:p.dir}]);f.belts[k].item=good;f.move();f.advance(.05);}
test('ration policies conserve food portions and never share alcohol with workers',()=>{
 for(const share of [10,20,40]){const f=new Farm(),house=f.place('house',10,10);assert.ok(f.setRationShare(share));
  for(let i=0;i<20;i++)for(const good of ['bread','cake','alcohol'])deliver(f,house,good);
  const rationPortions=house.output+(house.rationReserve||0)/5;
  assert.ok(Math.abs(rationPortions-40*share/100)<1e-8);assert.ok(Math.abs(f.estate.stock.bread+f.estate.stock.cake+rationPortions-40)<1e-8);assert.equal(f.estate.stock.alcohol,20);
  assert.equal(f.setRationShare(100),false);assert.equal(f.rationShare,share);
 }
});
test('changing policy preserves pending rations and changes only future deliveries',()=>{
 const f=new Farm(),house=f.place('house',10,10);for(let i=0;i<4;i++)deliver(f,house,'bread');assert.equal(house.rationReserve,4);
 f.setRationShare(40);deliver(f,house,'bread');assert.equal(house.output,1);assert.equal(house.rationReserve,1);
});
test('estate expansion needs goods and resident labor, consumes costs once and stops at tier III',()=>{
 const f=new Farm();f.place('house',20,1);f.estate.stock={bread:100,alcohol:100,cake:100};assert.equal(f.expandEstate(),false);
 f.place('pavilion',6,1);assert.equal(f.expandEstate(),false);f.place('residence',1,1);
 const saved=f.snapshot();assert.ok(estateOffer(f).ready);assert.ok(f.expandEstate());assert.equal(f.estate.level,2);assert.deepEqual(f.estate.stock,{bread:80,alcohol:95,cake:100});
 assert.equal(f.expandEstate(),false);f.place('pavilion',10,1);assert.ok(f.expandEstate());assert.equal(f.estate.level,3);assert.deepEqual(f.estate.stock,{bread:45,alcohol:85,cake:92});assert.equal(f.expandEstate(),false);
 f.restore(saved);assert.equal(f.snapshot(),saved);
});
test('daily allowance consumes retained stock once and shortfalls lower approval',()=>{
 const f=new Farm();f.estate.stock.bread=10;f.clock=180;advanceEstate(f);assert.equal(f.estate.stock.bread,6);assert.equal(f.estate.approval,68);
 advanceEstate(f);assert.equal(f.estate.stock.bread,6);assert.equal(f.estate.approval,68);
 f.estate.stock.bread=0;f.clock=360;advanceEstate(f);assert.equal(f.estate.approval,56);assert.equal(f.estate.lastDay,2);
 assert.ok(estateDemand(3).bread>estateDemand(1).bread);
});
test('brief pavilion attendance cannot satisfy a full day of private service',()=>{
 const f=new Farm();f.place('residence',1,1);const b=f.place('pavilion',6,1);f.estate.level=2;f.estate.stock={bread:20,alcohol:10,cake:0};
 b.attendedToday=.05;f.clock=180;advanceEstate(f);assert.ok(f.estate.approval<61);
 b.attendedToday=60;f.clock=360;const before=f.estate.approval;advanceEstate(f);assert.equal(f.estate.approval,before+8);
});
test('a staffed pavilion actually accumulates service during physical attendance',()=>{
 const f=new Farm();f.place('residence',1,1);const b=f.place('pavilion',6,1);run(f,90);assert.ok(b.attendedToday>=60);assert.ok(b.attendedToday<=90);
});
test('austerity and estate privilege impose a contentment cost',()=>{
 const score=(share,level)=>{const f=new Farm();f.place('residence',1,1);f.rationShare=share;f.estate.level=level;f.people.forEach(p=>p.satiety=60);advanceServices(f,45);return f.people[0].happiness;};
 assert.ok(score(10,1)<score(20,1));assert.ok(score(20,3)<score(20,1));
});
