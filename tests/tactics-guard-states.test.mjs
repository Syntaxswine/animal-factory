import test from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createGame,refresh,attack,endTurn,stepEnemy,stepInvestigation,emitNoise,alarm,threatens,distance,squad,guards,stateOf,setState,settleGuards,searchGoal,ALERT_ROUNDS,BROKEN_ROUNDS,SUSPICION_STEPS,SUSPICION_SWEEP,WARY_STEPS,WARY_HEARING,NERVE,ROUND_MINUTES,SEARCH_CELLS,REALTIME_ROUND_TICKS,REALTIME_RETRY,STANDOFF_TRIES} from '../dist/tactics/engine.js';
import {blankMap,edgeKey,parseMap,W} from '../dist/tactics/maps.js';
import {createWorld,currentMap,leave,TRAVEL_MINUTES} from '../dist/tactics/world.js';

// GUARDS.md G2. Squad on the west side at (14,30); optionally a wall along the east edge of x=20 from y=0 to y=59 (the alarm-test
// geometry: sound crosses it, sight does not). Guards face east (heading 0), so the squad sits in their rear notch unless a test turns them.
function scene(guardsList,{wall=true,seed=1}={}){
 const m=blankMap();m.starts=[{x:14,y:30,z:0},{x:15,y:30,z:0},{x:15,y:31,z:0},{x:14,y:31,z:0}];m.guards=guardsList.map(g=>({heading:0,...g}));
 if(wall)for(let y=0;y<60;y++)m.edges[edgeKey('e',20,y,0)]='wall';
 const s=createGame(seed,m,false);for(const g of s.units.slice(4))g.heading=0;place(s);refresh(s);
 return {s,u:s.units[0],gs:s.units.slice(4)};
}
const place=s=>{for(const p of s.units)p.lastAt=p.x+','+p.y+','+(p.z||0);};
const teleport=(u,x,y)=>{u.x=x;u.y=y;u.lastAt=x+','+y+',0';};
const alertAt=(g,x,y)=>{g.alert=true;g.lastKnown={x,y,z:0};};
const guardPhase=s=>{for(let i=0;i<80&&s.phase==='enemy';i++)stepEnemy(s);};
// One round of the turn clock, whatever the map's phase: the squad ends its turn, the guards act, settleRound runs at the end of their phase.
const round=s=>{s.phase='player';s.queue=[];assert.ok(endTurn(s));guardPhase(s);};
const run=(s,g,until,cap=400)=>{let n=0;while(stateOf(g)!==until&&n++<cap)stepInvestigation(s);return n;};

test('a footstep makes a resting guard Suspicious; it walks its step budget, sweeps two quarter turns, stands down, walks home and rests wary; a wary guard hears half again as far',()=>{
 const {s,u,gs:[g]}=scene([{x:26,y:30,z:0,species:'donkey',weapon:'knife'}]);
 assert.equal(stateOf(g),'rest');assert.deepEqual(g.post,{x:26,y:30,z:0,heading:0});assert.equal(distance(g,u),12);
 emitNoise(s,u,10);assert.equal(stateOf(g),'rest','twelve tiles is beyond a ten-tile footstep');
 g.wary=true;emitNoise(s,u,10);assert.equal(stateOf(g),'suspicious','wary: the ten-tile footstep carries fifteen');assert.equal(WARY_HEARING,1.5);
 assert.deepEqual(g.lastHeard,{x:12,y:30,z:0},'the approximate report cell');assert.equal(g.searchSteps,Math.round(SUSPICION_STEPS*WARY_STEPS),'a wary guard investigates longer');
 assert.ok(s.log.some(l=>l==='Boris: "Who\'s there?"'),'the bark is heard twelve tiles away');
 assert.equal(s.phase,'explore','suspicion is not contact');assert.equal(s.alerted.size,0,'and does not charge AP');
 const n=run(s,g,'rest');
 assert.equal(stateOf(g),'rest');assert.ok(g.wary);assert.equal(g.x,26);assert.equal(g.y,30);assert.equal(g.heading,0,'back at post, facing its post heading');
 assert.ok(g.steps<=Math.round(SUSPICION_STEPS*WARY_STEPS)*2+2,'the walk out was capped by the step budget and the walk back is the same length: '+g.steps);
 assert.ok(n<=Math.round(SUSPICION_STEPS*WARY_STEPS)*2+SUSPICION_SWEEP+4,'ticks: '+n);
 assert.equal(g.lastHeard,null);assert.equal(g.searchSteps,0);
});

test('a wall blocks every sight-based transition and none of the sound-based ones',()=>{
 const {s,u,gs:[g]}=scene([{x:22,y:30,z:0,species:'donkey',weapon:'knife'}]);
 g.heading=180;refresh(s);assert.equal(stateOf(g),'rest','facing the squad through the wall: nothing');
 teleport(u,13,30);refresh(s);assert.equal(stateOf(g),'rest','a moving worker behind a wall is no glimpse');
 emitNoise(s,u,10);assert.equal(stateOf(g),'suspicious','but its footstep carries');
 u.weapon='pistol';alarm(s,u,24);assert.equal(stateOf(g),'alert','and a shot alerts through the wall');
});

test('a resting guard cannot skip to Searching: only K rounds without an identification take an alert guard there, and a searching guard holds the economy but not contact',()=>{
 const {s,u,gs:[b]}=scene([{x:38,y:30,z:0,species:'donkey',weapon:'knife'}]);
 for(let i=0;i<ALERT_ROUNDS+1;i++)round(s);assert.equal(stateOf(b),'rest','rounds do nothing to a resting guard');
 alertAt(b,12,30);refresh(s);assert.equal(s.phase,'explore','alert behind the wall, out of reach');assert.ok(s.alerted.has(b.id));
 for(let i=1;i<ALERT_ROUNDS;i++){round(s);assert.equal(stateOf(b),'alert','round '+i+' of '+ALERT_ROUNDS);}
 round(s);assert.equal(stateOf(b),'searching','K rounds without identifying anyone');assert.equal(b.alert,false);
 assert.ok(s.alerted.has(b.id),'still hunting: the engagement economy holds');assert.equal(searchGoal(b)?.x,12,'it will still go to the last fix first');assert.equal(b.search.cells.length,1+Math.min(SEARCH_CELLS,4));
 // A searching guard four tiles from the squad, with a clear line of fire, is not contact until it identifies someone.
 const {s:t,u:v,gs:[c]}=scene([{x:18,y:30,z:0,species:'donkey',weapon:'knife'}],{wall:false});t.units.slice(1,4).forEach(p=>p.hp=0); // one worker, dead behind the guard
 setState(t,c,'searching',{x:30,y:30,z:0});refresh(t);assert.equal(t.phase,'explore');assert.equal(threatens(t,c),true,'it could reach them');assert.equal(c.alert,false);
 teleport(v,19,31);refresh(t);assert.equal(stateOf(c),'alert','the worker stepped into its view');assert.equal(t.phase,'player','and that is contact');
});

test('Searching visits the neighbouring report cells, one arrival per round in turn mode, then stands down; the post occupied, the guard rests on the nearest free tile',()=>{
 // A second guard, alert with an empty pistol and no reserve, stands in view of the squad far to the south: it holds contact every round and never fires,
 // so the searching guard gets whole turns (without a contact holder the round drops to real time after its first step).
 const {s,u,gs:[g,holder]}=scene([{x:40,y:100,z:0,species:'donkey',weapon:'knife'},{x:18,y:200,z:0,species:'donkey',weapon:'pistol',heading:180}],{wall:false});
 for(const p of squad(s))teleport(p,p.x,p.y+170);holder.ammo.pistol=0;holder.pack=holder.pack.filter(i=>i.type!=='ammo');alertAt(holder,14,200);refresh(s);assert.equal(s.phase,'player');
 setState(s,g,'searching',{x:40,y:90,z:0});const cells=g.search.cells.map(c=>c.x+','+c.y);assert.equal(cells[0],'40,90');assert.equal(cells.length,1+SEARCH_CELLS);
 for(const c of g.search.cells.slice(1))assert.ok(Math.abs(c.x-40)===6||Math.abs(c.y-90)===6,'a neighbouring 6-tile cell: '+c.x+','+c.y);
 // Turn mode: one cell per round.
 const visited=[];let rounds=0;while(rounds++<40&&stateOf(g)==='searching'){const goal=searchGoal(g);assert.equal(s.phase,'player','contact held by the other guard');assert.ok(endTurn(s));guardPhase(s);if(searchGoal(g)!==goal)visited.push(goal);}
 assert.equal(stateOf(g),'standdown','out of cells');assert.equal(visited.length,cells.length,'every cell was reached and left in turn mode');assert.ok(rounds>cells.length,'walking between cells takes rounds: '+rounds);assert.equal(stateOf(holder),'alert','the holder identified the squad every round');
 // The post is taken by a colleague standing on it (a worker there would be identified and re-alert the guard): it rests beside it.
 holder.alert=false;setState(s,holder,'rest');teleport(holder,40,100);refresh(s);assert.equal(s.phase,'explore');run(s,g,'rest');
 assert.equal(stateOf(g),'rest');assert.ok(g.wary);assert.ok(Math.abs(g.x-40)<=1&&Math.abs(g.y-100)<=1&&!(g.x===40&&g.y===100),'beside the occupied post: '+g.x+','+g.y);
});

test('a hit that leaves a guard at a third of its health breaks it: it runs from the shooter, does not fire, and comes back Alert after R rounds unshot',()=>{
 let picked=null;
 for(let seed=1;seed<40&&!picked;seed++){const w=scene([{x:30,y:30,z:0,species:'donkey',weapon:'knife'}],{wall:false,seed});const {s,u,gs:[g]}=w;
  g.heading=180;g.hp=40;teleport(u,25,30);u.heading=0;refresh(s);s.phase='player';u.ap=12;if(attack(s,u,g)&&g.hp<40&&g.hp>0)picked=w;}
 assert.ok(picked,'some seed lands a non-lethal assault hit');const {s,u,gs:[g]}=picked;
 assert.ok(g.hp<=g.maxHp*NERVE,'40 - 26 = 14 is under a third of 45: '+g.hp);assert.equal(stateOf(g),'broken');assert.deepEqual(g.threat,{x:25,y:30,z:0});assert.ok(s.log.some(l=>l==='Boris breaks and runs.'));
 assert.ok(s.alerted.has(g.id),'a broken guard keeps the economy live');assert.equal(g.alert,false,'but is not contact');
 assert.equal(s.phase,'explore','a broken guard beside the squad is not contact: real time');const d0=distance(g,u),hp=u.hp;round(s);
 assert.ok(distance(g,u)>d0,'it ran: '+d0+' -> '+distance(g,u));assert.equal(u.hp,hp,'and did not fire');assert.equal(stateOf(g),'broken','the hit round does not count');
 round(s);assert.equal(stateOf(g),'broken','one round unshot');round(s);assert.equal(stateOf(g),'alert','R rounds unshot with a known target: Alert again');assert.equal(BROKEN_ROUNDS,2);
});

test('cornered, a broken guard fights: no legal step increases its distance from the threat',()=>{
 let picked=null;
 for(let seed=1;seed<40&&!picked;seed++){const w=scene([{x:30,y:30,z:0,species:'donkey',weapon:'knife'}],{wall:false,seed});const {s,u,gs:[g]}=w;
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if((dx||dy)&&!(dx===-1&&dy===0))s.map[30+dy][30+dx]='void';
  g.heading=180;g.hp=40;teleport(u,29,30);u.heading=0;u.weapon='knife';refresh(s);s.phase='player';u.ap=12;if(attack(s,u,g)&&g.hp<40&&g.hp>0)picked=w;}
 assert.ok(picked,'some seed lands a non-lethal knife hit');const {s,u,gs:[g]}=picked;assert.equal(stateOf(g),'broken');
 round(s);
 assert.equal(g.x,30);assert.equal(g.y,30,'nowhere to run');assert.ok(g.ap<g.maxAp,'so it spent its turn on the worker in front of it');assert.equal(stateOf(g),'broken','fighting cornered is not recovery');
 // In real time there are no attacks: the cornered guard turns to fight instead, which is contact.
 s.phase='explore';assert.ok(stepInvestigation(s));assert.equal(stateOf(g),'alert');assert.equal(s.phase,'player');
});

test('a shot alerts suspicious, searching and standing-down guards; a broken one stays broken',()=>{
 const {s,u,gs}=scene([{x:24,y:30,z:0,species:'donkey',weapon:'knife'},{x:24,y:34,z:0,species:'donkey',weapon:'knife'},{x:24,y:38,z:0,species:'donkey',weapon:'knife'},{x:24,y:42,z:0,species:'donkey',weapon:'knife'}]);
 setState(s,gs[0],'suspicious',{x:12,y:30,z:0});setState(s,gs[1],'searching',{x:30,y:30,z:0});setState(s,gs[2],'standdown');setState(s,gs[3],'broken',{x:12,y:30,z:0});
 u.weapon='pistol';alarm(s,u,24);
 assert.deepEqual(gs.map(stateOf),['alert','alert','alert','broken']);assert.deepEqual(gs[0].lastKnown,{x:12,y:30,z:0});
});

test('barks reach the log within thirty tiles or in view, not beyond',()=>{
 const {s,u,gs:[near,far]}=scene([{x:26,y:30,z:0,species:'donkey',weapon:'knife'},{x:120,y:30,z:0,species:'donkey',weapon:'knife'}]);
 setState(s,far,'suspicious',{x:120,y:36,z:0});assert.ok(!s.log.some(l=>l.startsWith('Lev:')),'a hundred tiles off, unheard');
 setState(s,near,'suspicious',{x:12,y:30,z:0});assert.ok(s.log.some(l=>l==='Boris: "Who\'s there?"'));
});

test('the bot cannot exploit Area quiet by standing still in front of an alerted guard: identification, not motion, is the trigger',()=>{
 const {s,u,gs:[g]}=scene([{x:18,y:30,z:0,species:'donkey',weapon:'knife'}],{wall:false});s.units.slice(1,4).forEach(p=>p.hp=0);
 g.heading=180;alertAt(g,60,60);refresh(s);
 assert.equal(u.moved,false,'the worker has not moved');assert.deepEqual(g.lastKnown,{x:14,y:30,z:0},'the guard identified it anyway');assert.equal(s.phase,'player');
});

test('a map the squad has left settles by the campaign clock: an hour finds the guards searching around their fix, two hours finds them at post and wary',()=>{
 const make=()=>{const {s,gs:[g]}=scene([{x:40,y:100,z:0,species:'donkey',weapon:'knife'}],{wall:false});for(const p of squad(s))teleport(p,p.x,p.y+170);alertAt(g,40,90);refresh(s);return {s,g};};
 let {s,g}=make();settleGuards(s,20);assert.equal(stateOf(g),'alert','two rounds: still alert, still where it was');assert.equal(g.y,100);
 ({s,g}=make());settleGuards(s,60);assert.equal(ROUND_MINUTES,10);
 assert.equal(stateOf(g),'searching');assert.ok(Math.abs(g.x-40)<=1&&Math.abs(g.y-90)<=1,'moved to its fix: '+g.x+','+g.y);assert.equal(g.search.cells.length-g.search.index,SEARCH_CELLS-(6-ALERT_ROUNDS),'six rounds: three to get there, three cells checked');
 ({s,g}=make());settleGuards(s,120);
 assert.equal(stateOf(g),'rest');assert.ok(g.wary);assert.equal(g.x,40);assert.equal(g.y,100);assert.equal(g.alert,false);
 ({s,g}=make());setState(s,g,'suspicious',{x:40,y:90,z:0});settleGuards(s,10);assert.equal(stateOf(g),'rest','suspicion resolves within a round');assert.ok(g.wary);
});

test('the shortest there-and-back across a border is two hours, so a squad that steps out and straight back always finds the guards stood down and wary',()=>{
 const m=blankMap('Factory');m.guards=[{x:120,y:100,z:0,species:'cow',weapon:'pistol'}];const w=createWorld(m);w.definitions.yard=blankMap('Yard');const s=currentMap(w);
 squad(s).forEach((u,i)=>teleport(u,W-1-(i%2),100+Math.floor(i/2)));const g=guards(s)[0];alertAt(g,W-1,100);refresh(s);
 assert.equal(s.phase,'explore','alerted, far out of reach: the squad steps off the map in real time');const t0=w.clock.minutes;
 for(const u of squad(s))assert.ok(leave(w,u,'east').ok);assert.equal(w.current,'yard');assert.equal(s.leftAt,t0,'the map remembers when it was left');assert.equal(stateOf(g),'alert','and its guard is frozen mid-alert');
 const y=currentMap(w);for(const u of squad(y))assert.ok(leave(w,u,'west').ok);assert.equal(w.current,'factory');
 assert.equal(w.clock.minutes,t0+2*TRAVEL_MINUTES);const f=currentMap(w),fg=guards(f)[0];
 assert.equal(stateOf(fg),'rest');assert.ok(fg.wary);assert.equal(fg.x,120);assert.equal(fg.y,100);assert.equal(f.phase,'explore','no contact on return');assert.equal(f.leftAt,undefined);
});

test('a shot that misses a broken guard does not cure it: it learns where the shooter is and keeps running (review D1)',()=>{
 let picked=null;
 for(let seed=1;seed<80&&!picked;seed++){const w=scene([{x:28,y:30,z:0,species:'donkey',weapon:'knife'}],{wall:false,seed});const {s,u,gs:[g]}=w;s.units.slice(1,4).forEach(p=>p.hp=0);
  g.hp=10;setState(s,g,'broken',{x:18,y:30,z:0});teleport(u,18,30);u.heading=0;u.weapon='pistol';refresh(s);s.phase='explore';u.ap=12;const before=s.log.length;const ok=attack(s,u,g,false,false,'head');if(ok&&g.hp===10)picked=w;}
 assert.ok(picked,'some seed misses');const {s,u,gs:[g]}=picked;
 assert.equal(stateOf(g),'broken');assert.equal(g.alert,false);assert.equal(g.brokenRounds,BROKEN_ROUNDS);assert.deepEqual(g.threat,{x:18,y:30,z:0},'the miss told it where the shooter is');
 assert.equal(s.phase,'player','the squad opened fire: engaged, not the guard');assert.ok(endTurn(s));guardPhase(s);assert.equal(stateOf(g),'broken');
});

test('exactly K rounds on the clock is the boundary between Alert and Searching; a burning map burns out first (review D3, M13)',()=>{
 const make=()=>{const {s,gs:[g]}=scene([{x:40,y:100,z:0,species:'donkey',weapon:'knife'}],{wall:false});for(const p of squad(s))teleport(p,p.x,p.y+170);alertAt(g,40,90);refresh(s);return {s,g};};
 let {s,g}=make();settleGuards(s,ROUND_MINUTES*(ALERT_ROUNDS-1));assert.equal(stateOf(g),'alert');
 ({s,g}=make());settleGuards(s,ROUND_MINUTES*ALERT_ROUNDS);assert.equal(stateOf(g),'searching','K rounds: at its fix, searching');assert.equal(g.search.cells.length-g.search.index,SEARCH_CELLS);
 ({s,g}=make());settleGuards(s,ROUND_MINUTES*(ALERT_ROUNDS+SEARCH_CELLS));assert.equal(stateOf(g),'rest','K + M rounds: home');
 ({s,g}=make());g.burningTurns=3;s.fires=[{x:5,y:5,z:0,turns:3}];settleGuards(s,120);refresh(s);
 assert.equal(g.burningTurns,0);assert.deepEqual(s.fires,[]);assert.equal(stateOf(g),'rest');assert.equal(s.phase,'explore','nothing pending on return');
});

test('in real time a broken guard with a known fix comes back Alert after R rounds of ticks (M14)',()=>{
 const {s,u,gs:[g]}=scene([{x:30,y:30,z:0,species:'donkey',weapon:'knife'}],{wall:false});s.units.slice(1,4).forEach(p=>p.hp=0);teleport(u,25,30);u.heading=180;refresh(s);
 setState(s,g,'broken',{x:25,y:30,z:0});g.lastKnown={x:25,y:30,z:0};assert.equal(s.phase,'explore');
 let n=0;while(stateOf(g)==='broken'&&n++<40)stepInvestigation(s);
 assert.equal(n,BROKEN_ROUNDS*REALTIME_ROUND_TICKS,'R rounds of ticks');assert.equal(stateOf(g),'alert','a known fix: Alert again');assert.ok(distance(g,{x:25,y:30,z:0})>5,'and it ran meanwhile');
});

test('a broken guard never steps into ground fire (review D4)',()=>{
 // A fire line east of the guard holds turn mode open (fires are pending), so this runs on the turn clock: the guard flees north or south along the line, never onto it.
 const {s,u,gs:[g]}=scene([{x:30,y:30,z:0,species:'donkey',weapon:'knife'}],{wall:false});s.units.slice(1,4).forEach(p=>p.hp=0);teleport(u,25,30);u.heading=180;
 s.fires=[];for(let y=22;y<=38;y++)s.fires.push({x:32,y,z:0,turns:3});for(let y=22;y<=38;y++)s.fires.push({x:31,y,z:0,turns:3});refresh(s);
 setState(s,g,'broken',{x:25,y:30,z:0});g.lastKnown={x:25,y:30,z:0};assert.equal(s.phase,'player','the fires hold the turn');
 round(s);
 assert.ok(!g.burningTurns,'never walked into the fire line');assert.ok(g.x<31,'stayed west of the fire: '+g.x+','+g.y);assert.ok(distance(g,{x:25,y:30,z:0})>5,'but did run: '+g.x+','+g.y);assert.equal(stateOf(g),'broken');
});

test('a footstep re-centres a searching guard on the sound; the nerve and wary-step numbers are what the doc says (M17, M06, M23)',()=>{
 const {s,u,gs:[g]}=scene([{x:24,y:30,z:0,species:'donkey',weapon:'knife'}]);
 setState(s,g,'searching',{x:36,y:36,z:0});assert.deepEqual(g.search.cells[0],{x:36,y:36,z:0});
 emitNoise(s,u,12);assert.equal(stateOf(g),'searching');assert.deepEqual(g.search.cells[0],{x:12,y:30,z:0},'the search now starts at the heard cell');assert.equal(g.search.index,0);
 assert.equal(NERVE,1/3);assert.equal(SUSPICION_STEPS,12);assert.equal(WARY_STEPS,1.5);g.wary=true;setState(s,g,'suspicious',{x:12,y:30,z:0});assert.equal(g.searchSteps,18);
 // A hit that leaves 16 of 45 does not break; 15 does.
 for(const [hp,expect] of [[42,'alert'],[41,'broken']]){let done=false;
  for(let seed=1;seed<80&&!done;seed++){const {s:t,u:v,gs:[c]}=scene([{x:30,y:30,z:0,species:'donkey',weapon:'knife'}],{wall:false,seed});t.units.slice(1,4).forEach(p=>p.hp=0);
   c.heading=180;c.hp=hp;teleport(v,25,30);v.heading=0;refresh(t);t.phase='player';v.ap=12;if(attack(t,v,c)&&c.hp===hp-26){assert.equal(stateOf(c),expect,hp+' - 26 = '+(hp-26));done=true;}}
  assert.ok(done,'a 26-damage hit was found for hp '+hp);}
});

test('a walled-in stand-down rests within the retry budget, never stalls (M21); a searching guard phase on the south-fence map is bounded (review D2)',()=>{
 const {s,gs:[g]}=scene([{x:40,y:100,z:0,species:'donkey',weapon:'knife'}],{wall:false});for(const p of squad(s))teleport(p,p.x,p.y+170);
 for(let y=57;y<=63;y++)for(let x=57;x<=63;x++)if(Math.abs(x-60)===3||Math.abs(y-60)===3)s.map[y][x]='void';teleport(g,60,60);setState(s,g,'standdown');refresh(s);
 const n=run(s,g,'rest',600);assert.equal(stateOf(g),'rest');assert.ok(n<=REALTIME_RETRY*STANDOFF_TRIES+10,'ticks: '+n);assert.ok(g.wary);assert.ok(Math.abs(g.x-60)<=2&&Math.abs(g.y-60)<=2,'inside the pocket: '+g.x+','+g.y);
 const m=parseMap(fs.readFileSync(new URL('../docs/tactics/playtests/2026-09-17-south-fence/map.json',import.meta.url),'utf8'));const t=createGame(1,m,false);
 const gs=guards(t);assert.ok(gs.length>=30);const holder=gs[0];for(const p of squad(t))teleport(p,holder.x+(p.id%2)+1,holder.y+Math.floor(p.id/2));holder.heading=0;holder.ammo[holder.weapon]=0;holder.pack=holder.pack.filter(i=>i.type!=='ammo');alertAt(holder,holder.x+1,holder.y);
 for(const q of gs.slice(1))setState(t,q,'searching',{x:squad(t)[0].x,y:squad(t)[0].y,z:0});refresh(t);
 const t0=performance.now();t.phase='player';t.queue=[];assert.ok(endTurn(t));for(let i=0;i<400&&t.phase==='enemy';i++)stepEnemy(t);const ms=performance.now()-t0;
 assert.ok(ms<20000,'bound loose because node runs test files in parallel; the defect was 104 s: one guard phase with '+(gs.length-1)+' searchers: '+Math.round(ms)+' ms');
});

test('the real-time Broken timeout chooses by the fix: a known target brings Alert, none brings Stand-down (review M14, worker out of sight)',()=>{
 for(const [fix,expect] of [[{x:25,y:30,z:0},'alert'],[null,'standdown']]){
  const {s,u,gs:[g]}=scene([{x:30,y:30,z:0,species:'donkey',weapon:'knife'}],{wall:false});s.units.slice(1,4).forEach(p=>p.hp=0);teleport(u,200,200);refresh(s);
  setState(s,g,'broken',{x:25,y:30,z:0});g.lastKnown=fix;assert.equal(s.phase,'explore');
  let n=0;while(stateOf(g)==='broken'&&n++<40)stepInvestigation(s);
  assert.equal(n,BROKEN_ROUNDS*REALTIME_ROUND_TICKS);assert.equal(stateOf(g),expect,'fix '+JSON.stringify(fix));assert.equal(g.alert,expect==='alert');}
});

test('cornered in turn mode, a broken guard strikes at what it can see: the worker in front of it loses health (review M33)',()=>{
 let struck=false;
 for(let seed=1;seed<80&&!struck;seed++){const {s,u,gs:[g]}=scene([{x:30,y:30,z:0,species:'donkey',weapon:'knife'}],{wall:false,seed});s.units.slice(1,4).forEach(p=>p.hp=0);
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if((dx||dy)&&!(dx===-1&&dy===0))s.map[30+dy][30+dx]='void';
  g.heading=180;teleport(u,29,30);u.heading=0;refresh(s);setState(s,g,'broken',{x:29,y:30,z:0});g.lastKnown={x:29,y:30,z:0};
  const hp=u.hp;round(s);assert.equal(g.x,30);assert.equal(g.y,30);assert.equal(stateOf(g),'broken');if(u.hp<hp)struck=true;}
 assert.ok(struck,'over eighty seeds a cornered knife lands at least once');
});
