import test from 'node:test';
import assert from 'node:assert/strict';
import {Farm,starter,line,key,allPorts,DIRS} from '../dist/engine.js';
import {walkable,findPath,advancePeople,efficiency} from '../dist/people.js';
import {project,unproject} from '../dist/isometric.js';

const run=(farm,seconds)=>{for(let i=0;i<seconds*20;i++)farm.advance(.05);};
function feed(farm,house,good){
  const p=allPorts(house).find(p=>p.role==='input'&&p.good===good),[dx,dy]=DIRS[p.dir];
  const x=p.x-dx,y=p.y-dy;
  if(!farm.belts[key(x,y)])farm.lay([{x,y,dir:p.dir}]);
  const belt=farm.belts[key(x,y)];belt.item=good;farm.move();
  return !belt.item;
}

test('isometric picking recovers tiles after zoom and pan on both diagonal axes',()=>{
  for(const scale of [8,19.7,60,85])for(const [x,y] of [[0,0],[4,11],[37,23],[10,5]]){
    const p=project(x+.5,y+.5,scale),camera={x:-137.4,y:81.8};
    const tile=unproject(p.x+camera.x-camera.x,p.y+camera.y-camera.y,scale);
    assert.equal(Math.floor(tile.x),x);assert.equal(Math.floor(tile.y),y);
  }
  const from={x:4,y:11};
  for(const to of [{x:10,y:11},{x:4,y:17},{x:1,y:11},{x:4,y:3}]){
    const screen=project(to.x+.5,to.y+.5,27),world=unproject(screen.x,screen.y,27);
    assert.deepEqual(line(from,{x:Math.floor(world.x),y:Math.floor(world.y)}).at(-1),{...to,dir:to.x>from.x?0:to.y>from.y?1:to.x<from.x?2:3});
  }
});

test('workers and pigs stay off footprints and conveyors through all connected plans',()=>{
  for(const plan of ['bread','alcohol','cakes']){
    const f=starter(true,plan),starts=f.people.map(p=>({x:p.x,y:p.y}));let moved=false;
    for(let i=0;i<3600;i++){
      f.advance(.05);
      for(const [j,p] of f.people.entries()){
        assert.ok(walkable(f,Math.floor(p.x),Math.floor(p.y)),`${plan}: ${p.name} on blocked ground`);
        if(Math.hypot(p.x-starts[j].x,p.y-starts[j].y)>2)moved=true;
      }
    }
    assert.ok(moved,`${plan}: animals should actually travel`);
    if(plan!=='alcohol')assert.ok(f.rationsEaten>0,`${plan}: workers should reach food`);
  }
});

test('walking routes go around buildings and cannot cross a conveyor wall',()=>{
  const f=new Farm();f.place('mill',5,5);
  const path=findPath(f,{x:4,y:6},[{x:8,y:6}]);assert.ok(path.length>4);
  let previous={x:4,y:6};
  for(const p of path){assert.ok(walkable(f,p.x,p.y));assert.equal(Math.abs(p.x-previous.x)+Math.abs(p.y-previous.y),1);previous=p;}
  f.lay(line({x:10,y:0},{x:10,y:23}));
  assert.equal(findPath(f,{x:4,y:6},[{x:11,y:6}]),null);
});

test('farmhouse converts exactly five food deliveries into one ration, excluding alcohol',()=>{
  const f=new Farm(),house=f.place('house',10,10);
  for(const good of ['bread','cake','bread','cake']){assert.ok(feed(f,house,good));f.advance(.05);}
  assert.equal(house.output,0);
  for(let i=0;i<8;i++){feed(f,house,'alcohol');f.advance(.05);}
  assert.equal(house.output,0);assert.equal(house.rationReserve,4);
  feed(f,house,'bread');f.advance(.05);
  assert.equal(house.output,1);assert.equal(house.rationReserve,0);assert.equal(f.produced.ration,1);
});

test('ration outlet emits on its marked outside tile in all four rotations',()=>{
  for(let dir=0;dir<4;dir++){
    const f=new Farm(),house=f.place('house',10,10,dir);house.rationReserve=5;
    const p=allPorts(house).find(p=>p.role==='output'),[dx,dy]=DIRS[p.dir];
    assert.equal(p.good,'ration');f.lay([{x:p.x+dx,y:p.y+dy,dir}]);f.advance(.3);
    assert.equal(f.belts[key(p.x+dx,p.y+dy)].item,'ration');assert.equal(house.output,0);
  }
});

test('a hungry worker reaches the belt end, eats a parcel, and recovers productivity',()=>{
  const f=new Farm(),mill=f.place('mill',3,3);f.lay(line({x:8,y:6},{x:11,y:6}));
  f.belts[key(11,6)].item='ration';const worker=f.people[0];worker.satiety=0;
  assert.equal(efficiency(f,mill),.5);
  for(let i=0;i<1200&&!f.rationsEaten;i++)advancePeople(f,.05);
  assert.equal(f.rationsEaten,1);assert.equal(worker.meals,1);assert.equal(f.belts[key(11,6)].item,null);
  assert.equal(Math.abs(worker.cell.x-11)+Math.abs(worker.cell.y-6),1);
  assert.ok(worker.satiety>24);assert.ok(efficiency(f,mill)>.9);
});

test('unreachable rations remain on the belt until a walking route opens',()=>{
  const f=new Farm();f.place('field',1,2);f.lay(line({x:8,y:0},{x:8,y:23}));
  f.lay([{x:12,y:5,dir:0}]);f.belts[key(12,5)].item='ration';f.people[0].satiety=0;
  run(f,30);assert.equal(f.rationsEaten,0);assert.equal(f.belts[key(12,5)].item,'ration');
  f.remove([{x:8,y:5}]);run(f,30);assert.equal(f.rationsEaten,1);
});

test('building over an animal relocates it to open ground; removing its home removes it',()=>{
  const f=new Farm();const mill=f.place('mill',3,3),worker=f.people[0],cell={...worker.cell};
  assert.ok(f.lay([{...cell,dir:0}]));
  assert.ok(walkable(f,Math.floor(worker.x),Math.floor(worker.y)));
  assert.notDeepEqual(worker.cell,cell);assert.equal(worker.path.length,0);
  f.remove([{x:mill.x,y:mill.y}]);assert.equal(f.people.length,0);
});

test('blocked ration outlet stops food intake with bounded storage and resumes when opened',()=>{
  const f=new Farm(),house=f.place('house',10,10);
  for(let i=0;i<40;i++){feed(f,house,'bread');f.advance(.05);}
  assert.equal(house.output,4);assert.equal(house.rationReserve,5);assert.equal(f.delivered.bread,25);
  const p=allPorts(house).find(p=>p.role==='output'),[dx,dy]=DIRS[p.dir];
  f.lay([{x:p.x+dx,y:p.y+dy,dir:p.dir}]);f.move();f.advance(.05);
  assert.equal(house.rationReserve,0);assert.ok(feed(f,house,'bread'));
});

test('undo restores animal positions, hunger, ration inventory and meals together',()=>{
  const f=starter(true);run(f,150);assert.ok(f.rationsEaten);const saved=f.snapshot();
  f.remove([{x:11,y:10}]);run(f,20);f.restore(saved);assert.equal(f.snapshot(),saved);
  for(const p of f.people)assert.ok(walkable(f,Math.floor(p.x),Math.floor(p.y)));
});
