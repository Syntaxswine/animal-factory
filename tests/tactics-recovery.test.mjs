import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,refresh,attack,attackGround,endTurn,stepEnemy,stabilize,canControl,alive,recovering,RECOVERY_TURNS,RECOVERY_HP,beginRecovery,guards} from '../dist/tactics/engine.js';
import {blankMap,W} from '../dist/tactics/maps.js';
import {createWorld,currentMap,leave} from '../dist/tactics/world.js';

// One alert knife guard far from the squad keeps the map in turn mode without ever reaching anyone (its AP is zeroed each guard turn).
function scene(difficulty='standard'){const m=blankMap();m.guards=[{x:10,y:10,z:0,species:'pig-foreman',weapon:'knife'}];const s=createGame(1,m,false,difficulty);s.phase='player';s.round=1;s.units[4].alert=true;return s;}
// The real downing path: a guard with bare hands beside the victim in the guard phase, not a hand-set casualty.
function shoot(s,id){const u=s.units[id],g=s.units[4];u.hp=1;const at={x:g.x,y:g.y};g.x=u.x+1;g.y=u.y;g.weapon='hands';g.ap=7;s.phase='enemy';assert.ok(attack(s,g,u,false,true));g.x=at.x;g.y=at.y;g.weapon='knife';s.phase='player';refresh(s);return u;}
// One full cycle: squad turn ends, the guard turn runs to its end, the next squad turn begins.
function next(s){assert.ok(endTurn(s));s.units[4].ap=0;for(let i=0;i<40&&s.phase==='enemy';i++)stepEnemy(s);assert.equal(s.phase,'player');}
function medic(s,patient){const m=s.units[0];m.x=patient.x-1;m.y=patient.y;m.medical=100;m.ap=12;assert.ok(stabilize(s,m,patient));return m;}

test('going down maxes fatigue; a bleeding comrade is not recovering yet',()=>{
 const s=scene(),u=shoot(s,1);
 assert.equal(u.casualty,'bleeding');assert.equal(u.bleedTurns,6);assert.equal(u.hp,0);
 assert.equal(u.social.fatigue,100,'downed: total collapse');assert.equal(recovering(u),false);assert.equal(u.recoveryTurns,0);
});

test('a stabilized comrade stands after three full squad turns, at 5 HP, still exhausted, with the next turn\'s AP',()=>{
 const s=scene(),u=shoot(s,1);const round=s.round;medic(s,u);
 assert.equal(u.casualty,'stable');assert.equal(recovering(u),true);assert.equal(u.recoveryTurns,RECOVERY_TURNS);assert.equal(u.recoveryFrom,round);
 next(s);assert.equal(u.recoveryTurns,3,'the turn the medic worked in does not count');assert.equal(u.casualty,'stable');
 next(s);assert.equal(u.recoveryTurns,2);next(s);assert.equal(u.recoveryTurns,1);assert.equal(u.hp,0);assert.equal(canControl(s,u),false);
 assert.ok(endTurn(s));assert.equal(u.recoveryTurns,0);assert.equal(u.casualty,'stable','the counter is out but the comrade waits for its own turn, not the guards\' volley');s.units[4].ap=0;for(let i=0;i<40&&s.phase==='enemy';i++)stepEnemy(s);
 assert.equal(u.casualty,null,'up as the fourth turn begins');assert.equal(u.hp,RECOVERY_HP);assert.equal(s.round,round+4);
 assert.ok(alive(u));assert.ok(canControl(s,u));assert.equal(u.ap,u.maxAp,'the new round refills AP as for anyone standing');
 assert.equal(u.social.fatigue,100,'still exhausted: only rest works fatigue off');assert.ok(s.log.some(l=>l.includes('Anya is back on their feet')));
});

test('clearing the map does not skip the delay: the turns keep coming until the comrade stands, then the map is won',()=>{
 const s=scene(),u=shoot(s,1);medic(s,u);
 s.units[4].hp=0;refresh(s);
 assert.equal(s.phase,'player','a stabilized comrade is pending, like a bleeding one');assert.equal(u.hp,0);assert.equal(u.casualty,'stable');
 for(let i=0;i<3;i++){next(s);assert.equal(s.phase,'player');}
 assert.ok(endTurn(s));assert.equal(u.casualty,'stable');assert.equal(u.recoveryTurns,0);
 for(let i=0;i<40&&s.phase==='enemy';i++)stepEnemy(s);assert.equal(u.hp,RECOVERY_HP);assert.equal(u.casualty,null);assert.equal(s.phase,'won','nothing pending once the comrade stands');assert.ok(s.log.some(l=>l.startsWith('Local map cleared')));
});

test('Easy: automatic stabilization starts the count at the downing itself',()=>{
 const s=scene('easy'),u=shoot(s,1);const round=s.round;
 assert.equal(u.casualty,'stable');assert.equal(u.bleedTurns,0);assert.equal(recovering(u),true);assert.equal(u.recoveryFrom,round);assert.equal(u.social.fatigue,100);
 next(s);next(s);next(s);assert.equal(u.casualty,'stable');assert.equal(u.recoveryTurns,1);
 next(s);assert.equal(u.casualty,null);assert.equal(u.hp,RECOVERY_HP);
});

test('a hit while recovering kills; the dead and the captured never stand up',()=>{
 const s=scene(),u=shoot(s,1);medic(s,u);next(s);assert.equal(u.recoveryTurns,3);
 const thrower=s.units[2];thrower.weapon='grenade';thrower.x=u.x+6;thrower.y=u.y;thrower.ap=12;thrower.heading=270;
 assert.ok(attackGround(s,thrower,{x:u.x,y:u.y,z:0}),'a grenade lands on the casualty');
 assert.equal(u.casualty,'dead');assert.equal(u.recoveryTurns,0);
 for(let i=0;i<5;i++)next(s);assert.equal(u.casualty,'dead');assert.equal(u.hp,0);
 const c=scene();c.units[1].hp=0;c.units[1].casualty='captured';beginRecovery(c,c.units[1]);for(let i=0;i<5;i++)next(c);assert.equal(c.units[1].casualty,'captured');assert.equal(c.units[1].hp,0);
});

test('a comrade left recovering when the squad crosses the edge is captured and stays captured',()=>{
 const m=blankMap('Factory');m.guards=[{x:200,y:120,z:0,species:'cow',weapon:'pistol'}];const w=createWorld(m);w.definitions.yard=blankMap('Yard');const s=currentMap(w);
 for(const [i,u] of s.units.slice(0,4).entries()){u.x=W-1-(i%2);u.y=100+Math.floor(i/2);}guards(s)[0].alert=true;refresh(s);assert.equal(s.phase,'player');
 const down=s.units[1];down.hp=0;down.casualty='stable';beginRecovery(s,down);
 for(const id of [0,2,3]){const r=leave(w,s.units[id],'east');assert.ok(r.ok,r.error);}
 assert.equal(w.current,'yard');const moved=currentMap(w).units[1];
 assert.equal(down.casualty,'captured');assert.equal(down.recoveryTurns,0);assert.equal(moved.casualty,'captured');
 assert.equal(w.defeats.at(-1).cause,'abandoned');assert.equal(w.defeats.at(-1).captured[0].name,'Anya');
 refresh(currentMap(w));assert.equal(moved.hp,0);assert.equal(moved.casualty,'captured');
});

test('going down puts the fire out: a body on the ground does not panic-run, and the comrade stands unburnt',()=>{
 const s=scene(),u=s.units[1];u.burningTurns=3;shoot(s,1);
 assert.equal(u.casualty,'bleeding');assert.equal(u.burningTurns,0,'the fall smothers the fire');medic(s,u);
 for(let i=0;i<4;i++)next(s);assert.equal(u.casualty,null);assert.equal(u.burningTurns,0);assert.ok(canControl(s,u));
});
