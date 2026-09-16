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
 assert.equal(w.current,'factory');assert.equal(u.ap,ap-2);assert.deepEqual(u.away,{destination:'yard',side:'east',x:W-1,y:100,ap:ap-2});
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

// Round-2 hostile-review fixes (2026-09-16): a crosser has no body, maps re-enter cleanly, the far border walks both ways.
import {recall,recallReason,downtimeReason} from '../dist/tactics/world.js';
import {attackGround,groundTarget,stepEnemy,canControl,WEAPONS} from '../dist/tactics/engine.js';

test('a crosser has no body: a guard firing along the row it left hits the comrade behind it, never the crosser',()=>{
 const m=blankMap('Factory');m.guards=[{x:W-1,y:100,z:0,species:'cow',weapon:'rifle'}];
 const w=createWorld(m);w.definitions.yard=blankMap('Yard');const s=currentMap(w);
 // Crosser at 237, comrade at 233 on the guard's row, the other two off it; the guard is made a marksman so its round is aligned and must pass the ghost tile.
 const at=[[W-3,100],[W-7,100],[W-9,104],[W-11,104]];squad(s).forEach((u,i)=>{u.x=at[i][0];u.y=at[i][1];u.heading=0;});const crosser=s.units[0],comrade=s.units[1],g=guards(s)[0];g.heading=180;g.alert=true;g.accuracy=100;refresh(s);
 assert.equal(s.phase,'player');assert.ok(leave(w,crosser,'east').ok);const hp=crosser.hp;
 assert.ok(endTurn(s));let steps=0;while(s.phase==='enemy'&&steps++<200)stepEnemy(s);
 assert.ok(s.log.some(l=>/→ (Anya|Misha|Vera)/.test(l)),'the guard fired at someone who stayed: '+s.log.slice(0,4).join(' | '));
 assert.equal(crosser.hp,hp,'the crosser took no round');assert.equal(crosser.casualty,null);assert.ok(crosser.away);
 assert.ok(!s.log.some(l=>/→ Yakov/.test(l)),'no round was logged against the crosser: '+s.log.slice(0,4).join(' | '));
});

test('a crosser has no body for a blast either',()=>{
 const {w,s}=world({guard:false});const crosser=s.units[0],thrower=s.units[1];thrower.x=W-6;thrower.y=100;refresh(s);
 assert.ok(leave(w,crosser,'east').ok);const hp=crosser.hp;
 thrower.weapon='grenade';thrower.ammo.grenade=1;thrower.heading=0;
 assert.ok(attackGround(s,thrower,groundTarget({x:W-1,y:100,z:0})),'the grenade was thrown at the tile the crosser left');
 assert.equal(crosser.hp,hp);assert.equal(crosser.casualty,null);assert.ok(crosser.away);
});

test('a waiting crosser can come back across the edge onto the tile it left, for a step of AP in combat, unless it is blocked',()=>{
 const {w,s}=world(),u=s.units[0];
 assert.ok(leave(w,u,'east').ok);assert.equal(u.ap,10);assert.match(recallReason(w,s.units[1]),/No one is waiting/);
 s.units[1].x=W-1;s.units[1].y=100;refresh(s);assert.match(recallReason(w,u),/blocked/);s.units[1].x=W-2;s.units[1].y=100;refresh(s);
 assert.equal(recallReason(w,u),'');const r=recall(w,u);assert.ok(r.ok);
 assert.equal(u.away,undefined);assert.ok(alive(u));assert.equal(u.x,W-1);assert.equal(u.y,100);assert.equal(u.ap,8);assert.equal(occupant(s,W-1,100,0),u);assert.ok(canControl(s,u));
 assert.equal(away(s).length,0);
});

test('rest and training wait for the squad to regroup',()=>{
 const {w,s}=world({guard:false});assert.equal(downtimeReason(w),'');
 assert.ok(leave(w,s.units[0],'east').ok);assert.match(downtimeReason(w),/Regroup first/);
 assert.ok(recall(w,s.units[0]).ok);assert.equal(downtimeReason(w),'');
});

test('crossing mid-turn does not refill the turn: a squad that crossed with 10 AP into a live contact keeps 10, and crossing clears overwatch',()=>{
 const m=blankMap('Factory');m.guards=[{x:200,y:120,z:0,species:'cow',weapon:'pistol'}];const yard=blankMap('Yard');yard.guards=[{x:8,y:100,z:0,species:'cow',weapon:'pistol'}];
 const w=createWorld(m);w.definitions.yard=yard;const s=currentMap(w);squad(s).forEach((u,i)=>{u.x=W-1-(i%2);u.y=100+Math.floor(i/2);});guards(s)[0].alert=true;refresh(s);
 assert.equal(s.phase,'player');s.units[0].overwatch={weapon:'assault',heading:0};
 for(const u of squad(s))assert.ok(leave(w,u,'east').ok);
 assert.equal(w.current,'yard');const y=currentMap(w);assert.equal(y.phase,'player','arrives into contact with the yard guard');
 for(const u of squad(y)){assert.equal(u.ap,u.maxAp-2,'kept the AP it had, not a fresh turn');assert.equal(u.overwatch,null);}
});

test('a map left mid-fight is re-entered as a fresh contact, not a frozen turn: guards stay alert, the round advances, AP is full',()=>{
 const {w,s}=world();const g=guards(s)[0],round=s.round;
 for(const u of squad(s))assert.ok(leave(w,u,'east').ok);assert.equal(w.current,'yard');
 const y=currentMap(w);assert.equal(y.phase,'won');for(const u of squad(y))assert.ok(leave(w,u,'west').ok);
 assert.equal(w.current,'factory');const back=currentMap(w);assert.equal(back,s);
 assert.equal(back.phase,'player');assert.ok(g.alert,'the guard kept its alert');assert.equal(back.round,round+1);for(const u of squad(back)){assert.equal(u.ap,u.maxAp);assert.ok(u.x>=W-BORDER);assert.equal(u.away,undefined);}
});

test('a map lost after a crossing can be re-entered: the fallen stay fallen, the record moves to the world, the survivor can act',()=>{
 const {w,s}=world();assert.ok(leave(w,s.units[0],'east').ok);
 for(const u of squad(s)){u.hp=0;u.casualty='bleeding';}refresh(s);assert.equal(s.phase,'lost');assert.ok(resolveRetreat(w).ok);
 const y=currentMap(w);assert.ok(y.log.some(l=>/Left on Factory: 3 dead, 0 captured/.test(l)),'the survivor is told what happened: '+y.log.slice(0,3).join(' | '));
 assert.ok(leave(w,y.units[0],'west').ok);assert.equal(w.current,'factory');const back=currentMap(w);
 assert.notEqual(back.phase,'lost');assert.equal(back.defeat,undefined);assert.equal(w.defeats.length,1);assert.equal(w.defeats[0].map,'factory');assert.equal(w.defeats[0].dead.length,3);
 assert.ok(canControl(back,back.units[0]));assert.equal(squad(back).length,1);for(const id of [1,2,3])assert.equal(back.units[id].casualty,'dead');
 assert.equal(back.phase,'player','the alert guard makes contact again');
});

test('a retreat from the yard westward resolves to the factory, not to a hard-coded neighbour',()=>{
 const {w,s}=world({guard:false});for(const u of squad(s))assert.ok(leave(w,u,'east').ok);
 const y=currentMap(w);y.units.push({...structuredClone(y.units[0]),id:y.units.length,team:'guard',name:'Boris',x:20,y:100,hp:45,maxHp:45,alert:true,away:undefined});refresh(y);
 assert.ok(leave(w,y.units[0],'west').ok);for(const u of squad(y)){u.hp=0;u.casualty='bleeding';}refresh(y);assert.equal(y.phase,'lost');
 assert.ok(resolveRetreat(w).ok);assert.equal(w.current,'factory');assert.ok(currentMap(w).units[0].x>=W-BORDER);
});

// Round-2 review residuals (2026-09-16): a waiting crosser gets each new turn, a return is a step, the record of the fallen is exact.
test('a comrade waiting beyond the edge gets the new round like everyone else, so a return is charged from a fresh turn',()=>{
 const {w,s}=world(),u=s.units[0];assert.ok(leave(w,u,'east').ok);assert.equal(u.ap,u.maxAp-2);
 assert.ok(endTurn(s));let n=0;while(s.phase==='enemy'&&n++<200)stepEnemy(s);assert.equal(s.phase,'player');
 assert.equal(u.ap,u.maxAp);assert.equal(u.away.ap,u.maxAp);
 assert.ok(recall(w,u).ok);assert.equal(u.ap,u.maxAp-2);
});

test('a return is a step: it walks into a fire on the tile and makes a footstep',()=>{
 const {w,s}=world({guard:false}),u=s.units[0];assert.ok(leave(w,u,'east').ok);
 s.fires=[{x:W-1,y:100,z:0,turns:3}];assert.ok(recall(w,u).ok);
 assert.ok(u.burningTurns>0,'ignited on the burning tile it returned to');
});

test('abandoned comrades are written to the run record once, and a second loss on the same map lists only what it cost',()=>{
 const {w,s}=world();s.units[1].hp=0;s.units[1].casualty='stable';refresh(s);
 assert.ok(leave(w,s.units[0],'east').ok);assert.ok(leave(w,s.units[2],'east').ok);assert.ok(leave(w,s.units[3],'east').arrived);
 assert.equal(w.defeats.length,1);assert.equal(w.defeats[0].cause,'abandoned');assert.deepEqual(w.defeats[0].captured.map(u=>u.name),['Anya']);assert.equal(w.defeats[0].map,'factory');
 const y=currentMap(w);for(const u of squad(y))assert.ok(leave(w,u,'west').ok);const back=currentMap(w);assert.equal(back,s);
 assert.ok(leave(w,back.units[0],'east').ok);for(const u of squad(back)){u.hp=0;u.casualty='bleeding';}refresh(back);
 assert.equal(back.phase,'lost');assert.deepEqual(back.defeat.dead.map(u=>u.name).sort(),['Misha','Vera']);assert.equal(back.defeat.captured.length,0,'Anya was recorded by the abandonment, not again');
 assert.ok(resolveRetreat(w).ok);assert.equal(w.defeats.length,2);assert.equal(w.defeats[1].dead.length,2);
});
