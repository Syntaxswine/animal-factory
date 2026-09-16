import test from 'node:test';import assert from 'node:assert/strict';
import {createWorld,currentMap,travel,travelReason,leave,leaveReason,resolveRetreat,away,borderSides,beyond,linksFrom,crossingCost,BORDER} from '../dist/tactics/world.js';
import {blankMap,W,H,levelOf} from '../dist/tactics/maps.js';
import {guards,squad,alive,occupant,refresh,walkable,setStance,endTurn} from '../dist/tactics/engine.js';

// Factory with one guard far from the east edge; the yard is blank. Squad starts on the east border band.
function world({guard=true,phase='player'}={}){
 const m=blankMap('Factory');if(guard)m.guards=[{x:200,y:120,z:0,species:'cow',weapon:'pistol'}];
 const w=createWorld(m);w.definitions.yard=blankMap('Yard');const s=currentMap(w);
 squad(s).forEach((u,i)=>{u.x=W-1-(i%2);u.y=100+Math.floor(i/2);});
 if(guard&&phase==='player'){guards(s)[0].alert=true;}
 refresh(s);return {w,s};
}

test('the overmap is a grid: links derive from tile positions and the far side of each edge is known',()=>{
 const w=createWorld(blankMap());
 assert.deepEqual(w.positions,{factory:{x:0,y:0},yard:{x:1,y:0},annex:{x:2,y:0}});
 assert.deepEqual(linksFrom(w.positions).map(l=>l.join('-')).sort(),['annex-yard','factory-yard']);
 assert.equal(beyond(w,'factory','east'),'yard');assert.equal(beyond(w,'factory','west'),null);assert.equal(beyond(w,'yard','west'),'factory');assert.equal(beyond(w,'yard','east'),'annex');
 assert.deepEqual(borderSides({x:0,y:0}),['north','west']);assert.deepEqual(borderSides({x:W-BORDER,y:100}),['east']);assert.deepEqual(borderSides({x:BORDER,y:H-1}),['south']);assert.deepEqual(borderSides({x:BORDER,y:BORDER}),[]);
});

test('leaving needs the ground-level border band on a side with a map beyond it, and one step of AP in combat',()=>{
 const {w,s}=world(),u=s.units[0];
 assert.equal(s.phase,'player');assert.equal(leaveReason(w,u,'east'),'');
 assert.match(leaveReason(w,u,'west'),/band along the west edge/);
 u.x=BORDER;assert.match(leaveReason(w,u,'east'),/band along the east edge/);u.x=W-1;
 u.z=1;assert.match(leaveReason(w,u,'east'),/ground/);u.z=0;
 u.y=1;assert.match(leaveReason(w,u,'north'),/Nothing lies beyond/);u.y=100;
 s.queue=[{}];assert.match(leaveReason(w,u,'east'),/Stop movement/);s.queue=[];
 assert.equal(crossingCost(s,u),2);u.ap=1;assert.match(leaveReason(w,u,'east'),/AP/);u.ap=12;
 assert.ok(setStance(s,u,'prone'));assert.equal(crossingCost(s,u),8);u.sneaking=true;assert.equal(crossingCost(s,u),10);u.sneaking=false;assert.ok(setStance(s,u,'standing'));
 const {w:calm,s:quiet}=world({guard:false});assert.equal(quiet.phase,'won');assert.equal(crossingCost(quiet,quiet.units[0]),0);assert.equal(leaveReason(calm,quiet.units[0],'east'),'');
});

test('one crosser leaves the fight: off the map for guards and tiles, AP spent, comrades stay in combat',()=>{
 const {w,s}=world(),u=s.units[0],ap=u.ap;
 const r=leave(w,u,'east');assert.ok(r.ok);assert.equal(r.arrived,false);
 assert.equal(w.current,'factory');assert.equal(u.ap,ap-2);assert.deepEqual(u.away,{destination:'yard',side:'east',x:W-1,y:100});
 assert.equal(alive(u),false);assert.equal(squad(s).length,3);assert.equal(occupant(s,u.x,u.y,0),undefined);assert.deepEqual(away(s).map(a=>a.id),[0]);
 assert.equal(s.phase,'player');assert.ok(guards(s)[0].alert);assert.notEqual(s.selected,0);
 assert.match(leaveReason(w,u,'east'),/No one to move/);
 assert.ok(endTurn(s));assert.equal(s.phase,'enemy');
});

test('the last standing member crossing moves the squad: crossers land on the far border at their row, the clock advances an hour',()=>{
 const {w,s}=world({guard:false});const minutes=w.clock.minutes;
 for(const u of squad(s).slice(0,3))assert.equal(leave(w,u,'east').arrived,false);
 assert.equal(w.current,'factory');
 const r=leave(w,squad(s)[0],'east');assert.ok(r.ok);assert.equal(r.arrived,true);
 assert.equal(w.current,'yard');const y=currentMap(w);assert.equal(r.state,y);assert.equal(w.journeys,1);assert.equal(w.clock.minutes,minutes+60);
 for(const u of squad(y)){assert.ok(u.x<BORDER,'lands in the west band, got x='+u.x);assert.ok(Math.abs(u.y-100.5)<=2,'lands at its own row, got y='+u.y);assert.equal(levelOf(u),0);assert.equal(u.away,undefined);assert.ok(walkable(y,u.x,u.y,0));}
 assert.equal(new Set(squad(y).map(u=>u.x+','+u.y)).size,4);assert.equal(squad(y).length,4);assert.ok(alive(y.units[y.selected]));
 assert.ok(y.log.some(l=>/Arrived from the overmap/.test(l.text??l)));
});

test('downed comrades left behind meet the defeat rule: stabilized are captured, bleeding die',()=>{
 const {w,s}=world();
 s.units[1].hp=0;s.units[1].casualty='stable';s.units[2].hp=0;s.units[2].casualty='bleeding';s.units[2].bleedTurns=4;refresh(s);
 assert.equal(leave(w,s.units[0],'east').arrived,false);
 const r=leave(w,s.units[3],'east');assert.ok(r.ok);assert.equal(r.arrived,true);assert.deepEqual(r.left.map(u=>u.id),[1,2]);
 assert.equal(s.units[1].casualty,'captured');assert.equal(s.units[2].casualty,'dead');assert.equal(s.units[2].bleedTurns,0);
 const y=currentMap(w);assert.equal(y.units[1].casualty,'captured');assert.equal(y.units[2].casualty,'dead');assert.equal(squad(y).length,2);
 assert.ok(s.log.some(l=>/Left behind: Anya \(captured\), Misha \(dead\)/.test(l.text??l)),'origin log names who was left');
});

test('a fight lost after a comrade crossed is not a wipe: the crosser arrives, the fallen are recorded, the run continues',()=>{
 const {w,s}=world();
 assert.ok(leave(w,s.units[0],'east').ok);
 for(const u of squad(s)){u.hp=0;u.casualty='bleeding';}refresh(s);
 assert.equal(s.phase,'lost');assert.deepEqual(s.defeat.escaped.map(u=>u.id),[0]);assert.equal(s.defeat.dead.length,3);assert.equal(s.units[0].casualty,null);assert.equal(s.units[0].hp,s.units[0].maxHp);
 const r=resolveRetreat(w);assert.ok(r.ok);assert.equal(w.current,'yard');const y=currentMap(w);
 assert.equal(squad(y).length,1);assert.equal(y.units[0].away,undefined);assert.ok(alive(y.units[0]));assert.equal(y.units[1].casualty,'dead');assert.notEqual(y.phase,'lost');
 assert.equal(resolveRetreat(w).ok,false);
});

test('crossers commit the squad to one destination; the travel marker follows them and merges arrivals',()=>{
 const {w,s}=world({guard:false});
 w.definitions.north=blankMap('North');w.positions.north={x:0,y:-1};w.links=linksFrom(w.positions);
 assert.ok(leave(w,s.units[0],'east').ok);
 s.units[1].x=1;s.units[1].y=1;assert.match(leaveReason(w,s.units[1],'north'),/already crossing to Yard; use the east edge/);
 const e=s.definition.exits[0];squad(s).forEach((u,i)=>{u.x=e.x+(i%2);u.y=e.y+Math.floor(i/2);});refresh(s);
 assert.match(travelReason(w,'north'),/waiting beyond the east edge, in Yard/);assert.equal(travelReason(w,'yard'),'');
 assert.ok(travel(w,'yard').ok);const y=currentMap(w);
 assert.ok(y.units[0].x<BORDER&&y.units[0].y===100,'the crosser waited on the west border');
 for(const u of squad(y).slice(1)){const st=y.definition.starts[u.id];assert.ok(Math.abs(u.x-st.x)+Math.abs(u.y-st.y)<=2,'marker travellers land at their starts');}
});

test('crossing into a generated map with water or void on its edge still lands on walkable ground near the entry row',()=>{
 const w=createWorld(blankMap('Factory')),s=currentMap(w);
 squad(s).forEach((u,i)=>{u.x=W-1;u.y=60+i;});refresh(s);
 for(const u of squad(s))assert.ok(leave(w,u,'east').ok);
 const y=currentMap(w);assert.equal(y.definition.name,'Freight yard');
 for(const u of squad(y)){assert.ok(walkable(y,u.x,u.y,0));assert.ok(u.x<BORDER+2,'stays near the border, got x='+u.x);assert.ok(Math.abs(u.y-61)<=8,'stays near the entry rows, got y='+u.y);}
});
