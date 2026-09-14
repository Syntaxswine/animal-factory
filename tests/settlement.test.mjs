import test from 'node:test';
import assert from 'node:assert/strict';
import {Farm,line,starter,TYPES} from '../dist/engine.js';
import {efficiency,perimeter} from '../dist/people.js';
const run=(f,seconds)=>{for(let i=0;i<seconds*20;i++)f.advance(.05);};
test('machines require resident labor and never create population',()=>{
 const f=new Farm(),field=f.place('field',8,8);run(f,15);assert.equal(f.people.length,0);assert.equal(field.output,0);assert.equal(efficiency(f,field),0);
 f.place('residence',2,8);assert.equal(f.people.length,3);assert.equal(f.people.filter(p=>p.job===field.id).length,1);run(f,15);assert.ok(field.output>0);
});
test('three residents fill three unique jobs; a fourth stays vacant',()=>{
 const f=new Farm();f.place('residence',1,1);for(const [x,y] of [[6,1],[12,1],[6,7],[12,7]])f.place('field',x,y);
 const jobs=f.people.map(p=>p.job);assert.equal(new Set(jobs).size,3);assert.ok(jobs.every(Boolean));
 assert.equal(f.buildings.filter(b=>b.type==='field'&&!f.people.some(p=>p.job===b.id)).length,1);
});
test('conveyor walls block employment; demolition and undo preserve coherent population',()=>{
 const f=new Farm(),home=f.place('residence',1,1),field=f.place('field',12,1);f.lay(line({x:8,y:0},{x:8,y:23}));assert.equal(efficiency(f,field),0);
 f.remove([{x:8,y:4}]);assert.ok(f.people.some(p=>p.job===field.id));const saved=f.snapshot();f.remove([{x:home.x,y:home.y}]);assert.equal(f.people.length,0);assert.equal(efficiency(f,field),0);
 f.restore(saved);assert.equal(f.snapshot(),saved);assert.equal(f.people.length,3);
});
test('all starter production jobs can be staffed from their housing',()=>{
 for(const plan of ['bread','alcohol','cakes']){const f=starter(true,plan);for(const b of f.buildings.filter(b=>TYPES[b.type].worker&&b.type!=='house'))assert.ok(f.people.some(p=>p.job===b.id),`${plan}: ${b.type} vacant`);}
});
test('a distant meal trip never invalidates a nearby home job; sealed housing does',()=>{
 const f=new Farm(),home=f.place('residence',6,1),field=f.place('field',1,1),depot=f.place('depot',32,19);depot.inventory.ration=32;
 const worker=f.people.find(p=>p.job===field.id);run(f,33);f.lay([{x:0,y:23,dir:0}]);assert.equal(worker.job,field.id);
 run(f,200);assert.equal(worker.job,field.id);
 f.lay(perimeter(home).map(c=>({...c,dir:0})));assert.equal(efficiency(f,field),0);
 f.remove([{x:6,y:4}]);assert.ok(f.people.some(p=>p.job===field.id));
});
