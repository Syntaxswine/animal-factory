import test from 'node:test';import assert from 'node:assert/strict';
import {blankMap} from '../dist/tactics/maps.js';
import {createGame,refresh,distance,squad,endTurn,stepEnemy} from '../dist/tactics/engine.js';
import {createSquadBot,followOrder,stepSquadBot,rallied,wounded} from '../tools/tactics-squad-bot.mjs';
import {createRun,stepRun} from '../tools/south-fence-driver.mjs';

// Squad at the blank-map starts; one alert pistol guard within two-turn reach holds turn mode without ever firing (no rounds, no reserve).
function scene({phase='player'}={}){
 const m=blankMap();m.guards=[{x:14,y:12,z:0,species:'cow',weapon:'pistol'}];const s=createGame(1,m,false);const g=s.units[4];
 g.ammo.pistol=0;g.pack=g.pack.filter(i=>i.type!=='ammo');if(phase==='player')g.alert=true;else{g.x=200;g.y=200;}refresh(s);assert.equal(s.phase,phase);
 return {s,g};
}

test('a rally order completes only when every standing member is inside the radius; an exhausted straggler holds it open',()=>{
 const {s}=scene();const bot=createSquadBot({orders:[{type:'rally',x:8,y:5,z:0,radius:2}]});
 const straggler=s.units[3];straggler.x=2;straggler.y=20;straggler.ap=0;for(const u of squad(s).filter(u=>u!==straggler)){u.x=8+(u.id%2);u.y=5+(u.id>>1);}
 assert.equal(rallied(s,{x:8,y:5,z:0},2),false);
 assert.equal(followOrder(s,bot),false,'the only member out of the radius cannot step this turn: the order waits');assert.equal(bot.orders.length,1);
 // Turns pass as they must: when nobody can step, the squad ends its turn and the guard phase runs.
 straggler.ap=12;let n=0;while(bot.orders.length&&n++<200){if(!followOrder(s,bot)){assert.ok(endTurn(s));for(let i=0;i<40&&s.phase==='enemy';i++)stepEnemy(s);}}
 assert.equal(bot.orders.length,0,'the rally completes once the straggler is inside');assert.ok(distance(straggler,{x:8,y:5,z:0})<=2);assert.ok(bot.events.some(e=>e.type==='order'&&e.detail==='rally'));
 // A dead member does not hold a rally open.
 const {s:t}=scene();const b2=createSquadBot({orders:[{type:'rally',x:3,y:5,z:0,radius:3}]});t.units[3].hp=0;t.units[3].x=100;t.units[3].y=100;assert.equal(rallied(t,{x:3,y:5,z:0},3),true);assert.ok(followOrder(t,b2));assert.equal(b2.orders.length,0);
});

test('an attack order is leashed to where its target stood: a displaced target is reassessed, not chased across the map',()=>{
 const {s,g}=scene();const u=s.units[0];u.ap=12;g.hp=g.maxHp=1000;/* it must survive the test's shots */
 const bot=createSquadBot({orders:[{type:'attack',unit:0,target:4,weapon:'assault'}],leash:6});
 assert.ok(followOrder(s,bot));assert.deepEqual(bot.orders[0].anchor,{x:14,y:12,z:0},'the order remembers where it found the guard');
 g.x=14;g.y=17;assert.ok(followOrder(s,bot),'five tiles away is still inside the leash');assert.equal(bot.orders.length,1);
 g.x=14;g.y=40;const before=u.x+','+u.y;assert.ok(followOrder(s,bot));
 assert.equal(bot.orders.length,0,'the order is dropped');assert.equal(bot.events.at(-1).type,'reassess');assert.equal(u.x+','+u.y,before,'no step taken after the target');
});

test('a badly wounded merc hangs back with the group instead of advancing on guards, and still shoots what it sees',()=>{
 const {s,g}=scene();const bot=createSquadBot();const v=s.units[3];v.hp=5;assert.ok(wounded(bot,v));assert.equal(wounded(bot,s.units[0]),false);
 g.x=30;g.y=30;g.heading=225;refresh(s);
 for(const u of squad(s))u.ap=12;bot.cursor=3;/* Vera decides first */
 const wasAt=v.x+','+v.y;assert.ok(stepSquadBot(s,bot));const e=bot.events.at(-1);
 assert.notEqual(e.type==='advance'&&e.unit==='Vera',true,'the 5 HP merc does not advance on the guard');
 // Left alone far from the group she closes on a healthy comrade, not on the guard.
 v.x=3;v.y=30;for(const u of squad(s))u.ap=12;bot.cursor=3;stepSquadBot(s,bot);const last=bot.events.filter(x=>x.unit==='Vera').at(-1);
 assert.ok(last&&['hang-back','regroup'].includes(last.type),JSON.stringify(bot.events.slice(-4)));assert.ok(distance(v,g)>=distance({x:3,y:30},g)-1.5,'not toward the guard');
});

test('the scripted route advances a waypoint only when the whole squad has rallied there, not when its lead arrives',()=>{
 const {s}=scene({phase:'explore'});const r=createRun(s);r.stage='south';r.waypoint=0;r.waypoints=[{x:10,y:5,z:0}];r.rally=3;
 const lead=s.units[2];lead.x=10;lead.y=5;const laggard=s.units[3];laggard.x=3;laggard.y=40;
 let n=0;while(r.waypoint===0&&n++<200){stepRun(s,r);if(laggard.y>30)assert.equal(r.waypoint,0,'the lead standing on the waypoint does not complete it while a comrade is far');}
 assert.equal(r.waypoint,1,'completed once everyone is within the rally radius');assert.ok(squad(s).every(u=>distance(u,{x:10,y:5,z:0})<=3));
});

test('review round 1: an unreachable rally point is dropped, not stalled on; farthest member moves first; the threshold is a quarter',()=>{
 const {s}=scene();for(let y=0;y<240;y++)for(let x=100;x<=104;x++)s.map[y][x]='void';/* a wall of void across the map */
 const bot=createSquadBot({orders:[{type:'rally',x:150,y:100,z:0,radius:2}]});for(const u of squad(s))u.ap=12;
 assert.ok(followOrder(s,bot),'the controller acts (drops the order) instead of returning false');assert.equal(bot.orders.length,0);assert.equal(bot.events.at(-1).type,'reassess');
 const waiting=createSquadBot({orders:[{type:'rally',x:8,y:5,z:0,radius:2}]});squad(s)[3].x=2;squad(s)[3].y=20;for(const u of squad(s).slice(0,3)){u.x=8+(u.id%2);u.y=5+(u.id>>1);}squad(s)[3].ap=0;
 assert.equal(followOrder(s,waiting),false,'out of AP is waiting, not unreachable');assert.equal(waiting.orders.length,1);
 const order=createSquadBot({orders:[{type:'rally',x:8,y:5,z:0,radius:1}]});const a=squad(s)[2],b=squad(s)[3];a.x=8;a.y=12;a.ap=12;b.x=8;b.y=30;b.ap=12;const before=b.y;
 assert.ok(followOrder(s,order));assert.equal(b.y,before-1,'the farthest member steps first');
 const bot2=createSquadBot();const v=s.units[0];v.hp=Math.floor(v.maxHp*.25);assert.ok(wounded(bot2,v));v.hp=Math.floor(v.maxHp*.25)+1;assert.equal(wounded(bot2,v),false);
});

test('when every merc is wounded nobody hides behind anybody: the squad fights on and the harness does not stall',()=>{
 const {s,g}=scene({phase:'explore'});const bot=createSquadBot();for(const u of squad(s)){u.hp=10;u.ap=12;}
 assert.ok(stepSquadBot(s,bot),'the controller still acts');assert.ok(['advance','regroup','scavenge','seek-loot','seek-body','equip'].includes(bot.events.at(-1)?.type),JSON.stringify(bot.events.at(-1)));
});
