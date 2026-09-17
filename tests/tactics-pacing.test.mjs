import test from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createGame,refresh,attack,attackGround,previewAttack,setOverwatch,pathTo,endTurn,stepEnemy,stepInvestigation,threatens,reachable,distance,squad,guards,reload,setStance,combatCosts,stateOf,WEAPONS,THREAT_TURNS,SWEEP_TICKS,REALTIME_RETRY} from '../dist/tactics/engine.js';
import {blankMap,edgeKey,parseMap,W} from '../dist/tactics/maps.js';
import {createWorld,currentMap,travelReason,leave,crossingCost} from '../dist/tactics/world.js';
import {createSquadBot,stepSquadBot} from '../tools/tactics-squad-bot.mjs';

// Squad on the west side at (14,30); a wall along the east edge of x=20 from y=0 to y=59 (the alarm-test geometry). Guards are placed per test.
function scene(guardsList,{wall=true,lone=false}={}){
 const m=blankMap();m.starts=[{x:14,y:30,z:0},{x:15,y:30,z:0},{x:15,y:31,z:0},{x:14,y:31,z:0}];m.guards=guardsList;
 if(wall)for(let y=0;y<60;y++)m.edges[edgeKey('e',20,y,0)]='wall';
 const s=createGame(1,m,false);if(lone)s.units.slice(1,4).forEach(p=>p.hp=0);for(const g of s.units.slice(4))g.heading=0;for(const p of s.units)p.lastAt=p.x+','+p.y+','+(p.z||0);refresh(s);
 return {s,u:s.units[0],gs:s.units.slice(4)};
}
const alertAt=(g,x,y)=>{g.alert=true;g.lastKnown={x,y,z:0};};
const guardPhase=s=>{for(let i=0;i<60&&s.phase==='enemy';i++)stepEnemy(s);};

test('a shot from real time opens a turn the squad must end; distant guards who heard it warn, then the map goes quiet',()=>{
 // The target dies to the shot; the listener at x=38 is 24 tiles off behind the wall with a knife: alerted, out of reach.
 const {s,u,gs:[target,listener]}=scene([{x:18,y:30,z:0,species:'donkey',weapon:'knife'},{x:38,y:30,z:0,species:'donkey',weapon:'knife'}],{lone:true});
 target.hp=1;u.weapon='pistol';u.heading=0;refresh(s);assert.equal(s.phase,'explore');
 assert.ok(attack(s,u,target));assert.equal(target.hp,0);
 assert.ok(listener.alert,'the pistol report carries twenty-four tiles');assert.deepEqual(listener.lastKnown,{x:12,y:30,z:0});assert.equal(threatens(s,listener),false);
 assert.equal(s.phase,'player','opening fire is contact: the turn stays open until the squad ends it');assert.equal(s.engaged,true);assert.equal(u.ap,u.maxAp-WEAPONS.pistol.cost,'the opening shot spent combat AP');
 const warned=()=>s.log.filter(l=>l.startsWith('You are pretty sure someone heard that.')).length;assert.equal(warned(),1,s.log.slice(0,5).join(' | '));
 assert.ok(endTurn(s));assert.equal(s.engaged,false);guardPhase(s);
 assert.equal(s.phase,'explore','nobody can reach the squad within two turns: real time');assert.ok(s.log.some(l=>l.startsWith('Area quiet')),s.log.slice(0,3).join(' | '));assert.equal(warned(),1,'warned once per newly alerted guard');
 assert.ok(listener.alert);assert.equal(u.ap,u.maxAp,'the guard phase ended the round: a fresh turn of AP');
});

test('real-time fire at a guard beyond reach is not free: every shot is charged, AP never goes negative, and a turn must be ended for more',()=>{
 const {s,u,gs:[g]}=scene([{x:36,y:30,z:0,species:'donkey',weapon:'pistol'}],{wall:false,lone:true});
 u.weapon='rifle';u.ammo.rifle=5;u.accuracy=100;u.heading=0;g.hp=g.maxHp=500;alertAt(g,14,30);g.x=36;refresh(s);assert.equal(s.phase,'explore','22 tiles: the pistol guard cannot close within two turns');
 assert.ok(previewAttack(s,u,g).ok);assert.ok(attack(s,u,g));assert.equal(s.phase,'player');assert.equal(u.ap,u.maxAp-WEAPONS.rifle.cost);
 assert.ok(attack(s,u,g)||!g.hp,'a second shot in the same turn');const spent=u.ap;assert.ok(spent>=0);
 if(g.hp>0){assert.equal(attack(s,u,g),false,'the third shot is unaffordable: 12 AP buys two rifle shots');assert.equal(u.ap,spent);assert.ok(u.ap>=0);}
 assert.ok(endTurn(s));guardPhase(s);assert.equal(u.ap,u.maxAp);
});

test('the estimate follows routes and walls, not the straight line',()=>{
 const walled=scene([{x:22,y:30,z:0,species:'donkey',weapon:'pistol'}]);alertAt(walled.gs[0],12,30);refresh(walled.s);
 assert.equal(walled.s.phase,'explore');assert.equal(threatens(walled.s,walled.gs[0]),false);
 const open=scene([{x:22,y:30,z:0,species:'donkey',weapon:'pistol'}],{wall:false});alertAt(open.gs[0],12,30);refresh(open.s);
 assert.equal(threatens(open.s,open.gs[0]),true);assert.equal(open.s.phase,'player');
 const walk=scene([{x:28,y:30,z:0,species:'donkey',weapon:'pistol'},{x:34,y:30,z:0,species:'donkey',weapon:'pistol'}],{wall:false});
 assert.equal(WEAPONS.pistol.range,12);assert.equal(walk.gs[0].maxAp,7);
 assert.equal(threatens(walk.s,walk.gs[0]),true);assert.equal(threatens(walk.s,walk.gs[1]),false);
 const alone=scene([{x:34,y:30,z:0,species:'donkey',weapon:'pistol'}],{wall:false});
 assert.equal(reachable(alone.s,alone.gs[0],THREAT_TURNS*7).filter(p=>p.y===30).map(p=>p.x).sort((a,b)=>a-b)[0],27,'two turns of 7 AP walk seven cardinal tiles');
 // A blade needs an open edge too: a knife guard adjacent across the wall is no threat; on the open diagonal it is.
 const blade=scene([{x:21,y:30,z:0,species:'donkey',weapon:'knife'}]);alertAt(blade.gs[0],14,30);blade.gs[0].x=21;blade.s.units[0].x=20;refresh(blade.s);
 assert.equal(threatens(blade.s,blade.gs[0]),false,'adjacent across a wall');
 const diag=scene([{x:16,y:32,z:0,species:'donkey',weapon:'knife'}],{wall:false});alertAt(diag.gs[0],15,31);refresh(diag.s);assert.equal(threatens(diag.s,diag.gs[0]),true,'diagonal adjacency counts for a blade');
});

test('an alert guard beyond reach closes in real time and the fight opens exactly when it could arrive within two turns',()=>{
 const {s,u,gs:[g]}=scene([{x:14,y:60,z:0,species:'donkey',weapon:'knife'}],{wall:false});alertAt(g,14,30);refresh(s);
 assert.equal(s.phase,'explore');const before=s.round;
 let ticks=0,last=g.y;while(s.phase==='explore'&&ticks++<60){assert.ok(stepInvestigation(s));assert.equal(g.y,last-1,'one step per tick');last=g.y;}
 assert.equal(s.phase,'player');assert.equal(s.round,before+1);
 const gap=()=>Math.min(...squad(s).map(p=>Math.max(Math.abs(g.x-p.x),Math.abs(g.y-p.y))));
 assert.equal(gap(),8,'contact opens at eight tiles from the nearest comrade');assert.equal(threatens(s,g),true);
 g.y+=1;assert.equal(threatens(s,g),false,'one tile further it could not have reached');
 assert.equal(stepInvestigation(s),false,'no real-time ticks once the fight is on');
});

test('AP is live across the engagement: breaking contact holds it, actions other than walking still cost, a fresh fight starts full',()=>{
 const {s,u,gs:[g]}=scene([{x:20,y:30,z:0,species:'donkey',weapon:'knife'}],{wall:false});alertAt(g,14,30);refresh(s);
 assert.equal(s.phase,'player');const round=s.round;u.ap=5;u.weapon='pistol';u.ammo.pistol=2;
 g.x=60;g.lastKnown={x:14,y:30,z:0};refresh(s);
 assert.equal(s.phase,'explore');assert.ok(s.log[0].startsWith('Area quiet'),s.log[0]);assert.equal(u.ap,5,'nothing refills in real time');
 assert.equal(combatCosts(s),true,'a guard is alert: the engagement economy holds');assert.ok(reload(s,u));assert.equal(u.ap,2,'reloading in real time while alerted costs its 3 AP');
 assert.equal(setStance(s,u,'kneeling'),true);assert.equal(u.ap,0);assert.equal(reload(s,u),false,'and runs out like in a turn');
 g.x=20;refresh(s);assert.equal(s.phase,'player');assert.equal(u.ap,0,'the resumed fight continues with the AP the squad has');assert.equal(s.round,round+1);
 for(const p of squad(s).slice(1))assert.equal(p.ap,p.maxAp,'comrades who spent nothing keep their full turn');
 // Contact lost during the guard turn ends that round: the next contact is a fresh turn.
 s.phase='enemy';g.x=60;refresh(s);assert.equal(s.phase,'explore');assert.equal(u.ap,u.maxAp);assert.equal(s.round,round+2);
 g.x=20;refresh(s);assert.equal(s.phase,'player');assert.equal(u.ap,u.maxAp);
 // No guard alert at all: real time is free again, and the next fight starts full.
 u.ap=2;g.alert=false;g.lastKnown=null;g.x=60;refresh(s);assert.equal(s.phase,'explore');assert.ok(s.log[0].startsWith('Area clear'));assert.equal(combatCosts(s),false);
 setStance(s,u,'standing');assert.equal(u.ap,2,'free without an alert');alertAt(g,14,30);g.x=20;refresh(s);assert.equal(s.phase,'player');assert.equal(u.ap,u.maxAp,'a fresh fight');
});

test('an alert guard that reaches its fix and finds nobody sweeps, searches the cells around it, walks home and rests wary, which frees travel and the free real time',()=>{
 const {s,gs:[g]}=scene([{x:40,y:100,z:0,species:'donkey',weapon:'knife'}],{wall:false});for(const p of squad(s)){p.y+=170;p.lastAt=p.x+','+p.y+',0';}alertAt(g,40,90);refresh(s);assert.equal(s.phase,'explore');/* the squad well out of sight of the cells the guard will search */
 let n=0;while(g.alert&&n++<80)stepInvestigation(s);
 assert.equal(g.alert,false,'out of Alert after the sweep');assert.equal(stateOf(g),'searching','G2: the sweep drops the guard to Searching, not straight to rest');assert.ok(n>=17&&n<=19,'walked ten tiles then swept eight: '+n);assert.equal(SWEEP_TICKS,8);
 assert.ok(Math.abs(g.x-40)<=1&&Math.abs(g.y-90)<=1,'it went to the fix');assert.ok(s.alerted.has(g.id),'a searching guard still holds the engagement economy');assert.equal(combatCosts(s),true);
 let j=0;while(stateOf(g)!=='rest'&&j++<400)stepInvestigation(s);
 assert.equal(stateOf(g),'rest','checked the neighbouring cells, gave up, walked home');assert.ok(g.wary,'and is wary for the rest of the map');assert.ok(Math.abs(g.x-40)<=1&&Math.abs(g.y-100)<=1,'back at post');assert.equal(g.heading,g.post.heading);
 assert.equal(s.alerted.size,0);assert.equal(combatCosts(s),false);
 // And with it the travel marker opens again where "Finish the active encounter" had blocked it.
 const w=createWorld(blankMap());w.definitions.yard=blankMap();const f=currentMap(w);const e=f.definition.exits[0];squad(f).forEach((p,i)=>{p.x=e.x+(i%2);p.y=e.y+Math.floor(i/2);});
 f.units.push({...g,id:f.units.length,x:100,y:100,hp:45,alert:true,lastKnown:{x:100,y:110,z:0},away:undefined});refresh(f);
 assert.match(travelReason(w,'yard'),/Finish the active encounter/);let k=0;while(f.units.at(-1).alert&&k++<80)stepInvestigation(f);assert.equal(travelReason(w,'yard'),'');
});

test('a fix on void, water or off the map sends the guard to the nearest walkable tile instead of freezing it',()=>{
 const {s,gs:[g]}=scene([{x:40,y:100,z:0,species:'donkey',weapon:'knife'}],{wall:false});
 for(let y=88;y<=92;y++)for(let x=38;x<=42;x++)s.map[y][x]='void';alertAt(g,40,90);refresh(s);
 const start=g.y;stepInvestigation(s);assert.equal(g.y,start-1,'it walks toward the nearest ground beside the void');
 let n=0;while(g.alert&&n++<60)stepInvestigation(s);assert.equal(g.alert,false);assert.notEqual(s.map[g.y][g.x],'void');assert.ok(Math.hypot(g.x-40,g.y-90)<=3.2,'stood on the nearest ground to the fix: '+g.x+','+g.y);
 const off=scene([{x:5,y:100,z:0,species:'donkey',weapon:'knife'}],{wall:false});alertAt(off.gs[0],-6,100);off.gs[0].lastKnown={x:-6,y:100,z:0};refresh(off.s);
 const x0=off.gs[0].x;stepInvestigation(off.s);assert.equal(off.gs[0].x,x0-1,'an off-map fix pulls it to the map edge');
});

test('a pending casualty or fire keeps the turns coming even when no guard can reach; timers tick on ends of turn only',()=>{
 const {s,u,gs:[g]}=scene([{x:100,y:100,z:0,species:'donkey',weapon:'knife'}],{wall:false});alertAt(g,14,30);
 const p=s.units[1];p.hp=0;p.casualty='bleeding';p.bleedTurns=6;refresh(s);
 assert.equal(s.phase,'player','bleeding is pending');assert.equal(threatens(s,g),false);
 assert.ok(endTurn(s));assert.equal(p.bleedTurns,5);guardPhase(s);assert.equal(s.phase,'player');
 assert.equal(stepInvestigation(s),false,'turn mode: no real-time investigation');
 p.casualty='dead';refresh(s);assert.equal(s.phase,'explore','nothing pending, nobody in reach');
});

test('every searching or closing guard moves each tick, the headless player gives them that tick, and a whole run through real time finishes',()=>{
 const {s,gs:[a,b]}=scene([{x:14,y:80,z:0,species:'donkey',weapon:'knife'},{x:40,y:80,z:0,species:'donkey',weapon:'knife'}],{wall:false});
 alertAt(a,14,30);b.lastHeard={x:36,y:30,z:0};b.searchSteps=12;refresh(s);assert.equal(s.phase,'explore');
 assert.ok(stepInvestigation(s));assert.equal(a.y,79);assert.equal(b.y,79,'the suspicious guard does not wait its turn behind the alert one');assert.equal(b.searchSteps,11);
 const bot=createSquadBot();const ay=a.y;stepSquadBot(s,bot);assert.ok(a.y<ay,'the headless player runs the guards\' real-time tick too');
 // Two pistol guards alerted forty tiles away: the squad bot fights through the real-time approach and the run ends without the action cap.
 const m=blankMap();m.guards=[{x:60,y:60,z:0,species:'donkey',weapon:'pistol'},{x:64,y:60,z:0,species:'donkey',weapon:'pistol'}];const r=createGame(1948,m);for(const g of guards(r))alertAt(g,r.units[0].x,r.units[0].y);refresh(r);
 assert.equal(r.phase,'explore');const rb=createSquadBot();let n=0,realtimeMoves=0;const pos=()=>guards(r).map(g=>g.x+','+g.y).join(' ');let last=pos();
 while(!['won','lost'].includes(r.phase)&&n++<3000){const was=r.phase;stepSquadBot(r,rb);const now=pos();if(was==='explore'&&now!==last)realtimeMoves++;last=now;}
 assert.ok(n<3000,'the run terminates');assert.ok(realtimeMoves>0,'guards closed in real time before the fight');assert.ok(['won','lost'].includes(r.phase));
});

test('one real-time tick on the thirty-six-guard playtest map, every guard alert, costs a fraction of the browser frame budget',()=>{
 const m=parseMap(fs.readFileSync(new URL('../docs/tactics/playtests/2026-09-17-south-fence/map.json',import.meta.url),'utf8'));
 const s=createGame(1947,m,false);const start={x:s.units[0].x,y:s.units[0].y};
 // The squad hides in the far corner; every guard is alert on the squad's start, a route across the whole map away.
 const corner=[];for(let y=239;y>=200&&corner.length<4;y--)for(let x=239;x>=200&&corner.length<4;x--)if(s.map[y][x]==='yard'&&!corner.some(c=>c.x===x&&c.y===y))corner.push({x,y});
 squad(s).forEach((p,i)=>{p.x=corner[i].x;p.y=corner[i].y;});for(const g of guards(s))alertAt(g,start.x,start.y);refresh(s);assert.equal(s.phase,'explore',s.log[0]);
 // Reference measured in the same run, so machine load scales both sides: ONE unbounded pathTo from the farthest guard to the fix (~250 ms standalone).
 // The old code did nine of these per alert guard per tick, 36 guards: 26-117 s. Standalone the ticks measure ~90 ms worst / ~50 ms mean.
 const far=guards(s).sort((a,b)=>distance(b,start)-distance(a,start))[0];const t0=performance.now();pathTo(s,far,start.x,start.y,0);const ref=performance.now()-t0;
 const ticks=[];for(let i=0;i<14;i++){const t=performance.now();stepInvestigation(s);ticks.push(performance.now()-t);}
 assert.ok(Math.max(...ticks)<Math.max(400,1.5*ref),'worst tick vs one unbounded search ('+ref.toFixed(0)+' ms): '+ticks.map(t=>t.toFixed(0)).join(' '));const mean=ticks.reduce((a,b)=>a+b,0)/ticks.length;assert.ok(mean<Math.max(200,ref),'mean tick with partial routes extended three at a time: '+mean.toFixed(0)+' vs ref '+ref.toFixed(0));
 assert.ok(guards(s).every(g=>g.route),'after fourteen ticks every guard holds a route: '+guards(s).filter(g=>!g.route).length+' without');assert.ok(guards(s).every(g=>g.steps>0),'and every guard has moved');
 // An unreachable fix costs a bounded search once, then waits REALTIME_RETRY ticks before trying again.
 const g=guards(s).find(g=>g.alert);g.lastKnown={x:-6,y:-6,z:0};for(let y=0;y<3;y++)for(let x=0;x<3;x++)s.map[y][x]='void';const t1=performance.now();stepInvestigation(s);stepInvestigation(s);assert.ok(performance.now()-t1<400);assert.ok(g.route?.wait>0&&g.route.wait<=REALTIME_RETRY);
});

test('a real-time shot that clears the map leaves nothing engaged: the won map is free real time again',()=>{
 const {s,u,gs:[g]}=scene([{x:18,y:30,z:0,species:'donkey',weapon:'knife'}],{wall:false,lone:true});
 g.hp=1;u.weapon='pistol';u.heading=0;refresh(s);assert.equal(s.phase,'explore');
 assert.ok(attack(s,u,g));assert.equal(g.hp,0);assert.equal(s.phase,'won');assert.equal(s.engaged,false,'the engagement ended with the last guard');assert.equal(combatCosts(s),false);
 u.ap=1;assert.ok(reload(s,u)||u.ammo.pistol===WEAPONS.pistol.mag,'real time on a cleared map is free again');assert.equal(u.ap,1);
});

test('a guard boxed in, or facing a detour longer than its search budget, sweeps while it waits and stands down in seconds, not minutes',()=>{
 const {s,gs:[g]}=scene([{x:40,y:100,z:0,species:'donkey',weapon:'knife'}],{wall:false});
 for(let y=97;y<=103;y++)for(let x=37;x<=43;x++)if(Math.abs(x-40)===3||Math.abs(y-100)===3)s.map[y][x]='void';alertAt(g,40,60);refresh(s);assert.equal(s.phase,'explore');
 let n=0;while(g.alert&&n++<60)stepInvestigation(s);assert.equal(g.alert,false,'boxed in: sweeps, then drops to Searching');assert.ok(n<=10,'within ten ticks, not a forty-tick retry cycle: '+n);assert.equal(stateOf(g),'searching');
 let k=0;while(stateOf(g)!=='rest'&&k++<200)stepInvestigation(s);assert.equal(stateOf(g),'rest','each unreachable cell is swept while its retry waits, then the guard rests at its post');assert.ok(k<=60,'seconds, not minutes: '+k);assert.equal(s.alerted.size,0);
});

test('a sweep counts from the last move or fix change, never from an earlier stand',()=>{
 const {s,gs:[g]}=scene([{x:40,y:100,z:0,species:'donkey',weapon:'knife'}],{wall:false});alertAt(g,40,100);refresh(s);
 for(let i=0;i<5;i++)stepInvestigation(s);assert.ok(g.alert);assert.equal(g.sweep,3,'five quarter turns in');
 g.lastKnown={x:40,y:88,z:0};let n=0;while(g.alert&&n++<60)stepInvestigation(s);assert.ok(n>=12+7,'twelve tiles walked then a full eight-tick sweep, not the three left over: '+n);
});

test('entering a map whose guards kept an alert from before is still a fresh fight when contact opens later',()=>{
 const m=blankMap('Factory');m.guards=[{x:228,y:100,z:0,species:'cow',weapon:'pistol'}];const yard=blankMap('Yard');yard.guards=[{x:120,y:100,z:0,species:'cow',weapon:'knife'}];
 const w=createWorld(m);w.definitions.yard=yard;const s=currentMap(w);squad(s).forEach((u,i)=>{u.x=W-1-(i%2);u.y=100+Math.floor(i/2);});const g=guards(s)[0];g.ammo.pistol=0;g.pack=g.pack.filter(i=>i.type!=='ammo');g.alert=true;refresh(s);assert.equal(s.phase,'player');
 for(const u of squad(s))u.ap=4;for(const u of squad(s))assert.ok(leave(w,u,'east').ok);
 const y=currentMap(w);const yg=guards(y)[0];assert.equal(y.phase,'explore','the yard guard is alert but 120 tiles off');
 yg.alert=true;yg.lastKnown={x:2,y:100,z:0};refresh(y);assert.equal(y.phase,'explore');assert.equal(combatCosts(y),true);
 yg.x=6;refresh(y);assert.equal(y.phase,'player');for(const u of squad(y))assert.equal(u.ap,u.maxAp,'a new map is a new fight: full turn, not the 2 AP the crossing left');
});

test('Area clear drops overwatch reservations; crossing an edge in alerted real time costs its step; a blast on a won map is free and never negative',()=>{
 const {s,u,gs:[g]}=scene([{x:20,y:30,z:0,species:'donkey',weapon:'knife'}],{wall:false});alertAt(g,14,30);refresh(s);assert.equal(s.phase,'player');
 u.ap=12;assert.ok(setOverwatch(s,u));assert.ok(u.overwatch);g.x=60;refresh(s);assert.equal(s.phase,'explore');assert.ok(u.overwatch,'a paid reservation survives a quiet drop');
 g.alert=false;g.lastKnown=null;refresh(s);assert.ok(s.log[0].startsWith('Area clear'));assert.equal(u.overwatch,null,'and is cleared when the alert is over');
 const m=blankMap('Factory');m.guards=[{x:150,y:100,z:0,species:'cow',weapon:'knife'}];const w=createWorld(m);w.definitions.yard=blankMap('Yard');const f=currentMap(w);squad(f).forEach((p,i)=>{p.x=W-1-(i%2);p.y=100+Math.floor(i/2);});
 const fg=guards(f)[0];fg.alert=true;fg.lastKnown={x:200,y:100,z:0};refresh(f);assert.equal(f.phase,'explore');assert.equal(combatCosts(f),true);
 const c=squad(f)[0];c.ap=12;assert.equal(crossingCost(f,c),2);assert.ok(leave(w,c,'east').ok);assert.equal(c.ap,10,'the step off the map is charged while a guard is alert');
 const won=scene([{x:18,y:30,z:0,species:'donkey',weapon:'knife'}],{wall:false,lone:true});won.gs[0].hp=0;refresh(won.s);assert.equal(won.s.phase,'won');
 won.u.weapon='grenade';won.u.ap=1;assert.ok(attackGround(won.s,won.u,{x:22,y:30,z:0}));assert.equal(won.u.ap,1,'nothing to fight: nothing charged, nothing negative');
});
