import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseMap,validateMap,blankMap} from '../dist/tactics/maps.js';
import {buildWorld,createWorldModel,traceWorld,toWorld,fromWorld,projectWorld,DIMENSIONS} from '../dist/tactics/hybrid-world.js';
const fixture=()=>parseMap(fs.readFileSync(new URL('../dist/tactics/fixtures/hybrid-room.json',import.meta.url),'utf8'));
test('canonical fixture validates and round-trips unknown metadata without mutation',()=>{
 const map=fixture(),before=structuredClone(map),model=createWorldModel(map);assert.deepEqual(validateMap(map),[]);
 assert.deepEqual(JSON.parse(model.serialize()),map);assert.deepEqual(map,before);const copy=model.map;copy.name='changed';assert.equal(model.map.name,map.name);
});
test('prototype dimensions, upper floor and 2:1 diamond use one axis conversion',()=>{
 assert.equal(DIMENSIONS.wall,2);assert.equal(DIMENSIONS.standing,1.65);
 for(const p of [{x:3,y:6,z:0,h:.5},{x:-.5,y:4,z:2,h:.75}]){const q=fromWorld(toWorld(p));for(const k of Object.keys(p))assert.ok(Math.abs(q[k]-p[k])<1e-9);}
 const projected=[[-.5,0,-.5],[.5,0,-.5],[.5,0,.5],[-.5,0,.5]].map(p=>projectWorld(p));
 const width=Math.max(...projected.map(p=>p[0]))-Math.min(...projected.map(p=>p[0])),height=Math.max(...projected.map(p=>p[1]))-Math.min(...projected.map(p=>p[1]));assert.ok(Math.abs(width/height-2)<1e-10);
});
test('door transaction, window boundaries, lintel and roof hit actual shared surfaces',()=>{
 const model=createWorldModel(fixture()),ray=(x,h)=>model.trace([x,h,9],[x,h,5]);
 assert.equal(ray(5,1.2).id,'edge:s:5:7:door');const stable=ray(6,1.2);
 model.update(m=>m.edges['s:5:7']='doorway-concrete-open');assert.equal(ray(5,1.2),null);assert.equal(ray(5,1.8).id,'edge:s:5:7:lintel');
 assert.deepEqual(ray(6,1.2),stable);assert.equal(ray(7,1.2),null);assert.ok(ray(7,.85));assert.equal(ray(7,.85001),null);assert.ok(ray(7,1.55));
 const roof=model.trace([3,4,3],[3,.5,3]);assert.ok(Math.abs(roof.point[1]-2.12)<1e-9);assert.deepEqual(roof.normal,[0,1,0]);
 model.update(m=>{m.upper=[{},{}];m.props=m.props.filter(p=>!p.kind.startsWith('roof'));});assert.equal(model.trace([3,4,3],[3,.5,3]),null);
});
test('unsupported content has explicit diagnostics and stair opening is preserved',()=>{
 const m=fixture();m.props.push({x:1,y:1,z:0,kind:'tree-pine'});m.edges['e:1:1']='fence-chainlink';m.terrain[0][0]='water';m.stairs=[{x:2,y:2,z:0}];m.props=m.props.filter(p=>!p.kind.startsWith('roof'));
 const w=buildWorld(m);assert.equal(w.diagnostics.length,3);assert.equal(traceWorld(w,[2,3,2],[2,.5,2]),null);assert.ok(w.boxes.some(b=>b.kind==='stairs'));
});
test('negative boundary edges and diagonal chunk traversal agree with brute force',()=>{
 const m=fixture();m.edges['e:-1:1']='wall';const w=buildWorld(m);assert.equal(traceWorld(w,[-1,1,1],[1,1,1]).id,'edge:e:-1:1:wall');
 let seed=12;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
 for(let i=0;i<200;i++){const start=[random()*30-5,random()*4,random()*30-5],end=[random()*30-5,random()*4,random()*30-5];
  const brute={index:new Map()};for(let x=-1;x<=4;x++)for(let y=-1;y<=4;y++)brute.index.set(`${x},${y}`,w.boxes);
  assert.deepEqual(traceWorld(w,start,end),traceWorld(brute,start,end));
 }
});
test('upper floor and rotated cover use map coordinates; IDs independent of prop order',()=>{
 const m=fixture(),a=buildWorld(m);m.props.reverse();const b=buildWorld(m);assert.deepEqual(a.boxes.map(b=>b.id).sort(),b.boxes.map(b=>b.id).sort());
 assert.ok(a.boxes.some(b=>b.id==='floor:2,2,1'&&Math.abs(b.max[1]-2.12)<1e-9));
});
