import test from 'node:test';
import assert from 'node:assert/strict';
import {Farm,line} from '../dist/engine.js';
import {findPath,walkable,efficiency,perimeter} from '../dist/people.js';
const run=(f,t)=>{for(let i=0;i<t*20;i++)f.advance(.05);};
test('streets provide crossings through belt walls and undo restores both layers',()=>{
 const f=new Farm();f.lay(line({x:8,y:0},{x:8,y:23}));assert.equal(findPath(f,{x:2,y:4},[{x:12,y:4}]),null);
 f.layRoad(line({x:2,y:4},{x:12,y:4}));assert.ok(walkable(f,8,4));assert.ok(findPath(f,{x:2,y:4},[{x:12,y:4}]));const saved=f.snapshot();
 f.remove([{x:8,y:4}]);assert.equal(f.roads['8,4'],undefined);assert.equal(f.belts['8,4'],undefined);f.restore(saved);assert.equal(f.snapshot(),saved);
});
test('travel prefers a faster street detour and roads cannot overlap buildings',()=>{
 const f=new Farm();f.layRoad([...line({x:1,y:1},{x:1,y:2}),...line({x:1,y:2},{x:10,y:2}),...line({x:10,y:2},{x:10,y:1})]);
 const path=findPath(f,{x:1,y:1},[{x:10,y:1}]);assert.ok(path.some(c=>c.y===2));assert.equal(f.place('field',4,2),false);
 f.place('field',15,2);const saved=f.snapshot();assert.equal(f.layRoad(line({x:12,y:3},{x:18,y:3})),false);assert.equal(f.snapshot(),saved);
});
test('production waits for the commute, stops for home time, and resumes next day',()=>{
 const f=new Farm(),home=f.place('residence',1,1),field=f.place('field',12,1);f.people.forEach(p=>p.satiety=100);
 const worker=f.people.find(p=>p.job===field.id);run(f,1);assert.equal(field.output,0);assert.equal(efficiency(f,field),0);
 run(f,25);assert.ok(field.output>0);assert.ok(efficiency(f,field)>0);
 run(f,142-f.clock);assert.equal(efficiency(f,field),0);run(f,30);
 assert.ok(perimeter(home).some(c=>c.x===worker.cell.x&&c.y===worker.cell.y));assert.equal(worker.status,'resting');
 field.output=0;run(f,40);assert.ok(field.output>0);
});
test('a street reduces actual commute time',()=>{
 const arrive=street=>{const f=new Farm();f.place('residence',1,1);const b=f.place('field',18,1);if(street)f.layRoad(line({x:4,y:2},{x:17,y:2}));f.people.forEach(p=>p.satiety=100);while(f.clock<40&&efficiency(f,b)===0)f.advance(.05);return f.clock;};
 assert.ok(arrive(true)<arrive(false)*.8);
});
