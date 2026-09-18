import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,refresh,attack,endTurn,stepEnemy,emitNoise,squad,guards,stateOf,setState,restingBond,NERVE,SUSPICION_STEPS,ALERT_ROUNDS,BROKEN_ROUNDS,SEARCH_CELLS} from '../dist/tactics/engine.js';
import {ARCHETYPES,NAMES,WHEEL,bond,rungOf,retaliationScale,opposing,liked,drawArchetype,drawSquad,hearingScale,stepsScale,nerveFraction,brokenRoundsOf,shoutRadius,archetypeBark,describeArchetype} from '../dist/tactics/archetypes.js';
import {PERSONALITIES,friendlyReaction,driftBonds,personalityDescription} from '../dist/tactics/personalities.js';
import {blankMap,edgeKey} from '../dist/tactics/maps.js';
import {createWorld,currentMap,spendTime} from '../dist/tactics/world.js';

// GUARDS.md G3. The alarm-test geometry: squad west at (14,30), a wall along the east edge of x=20 (y 0..59), guards facing east.
function scene(guardsList,{wall=true,seed=1,social=false}={}){
 const m=blankMap();m.starts=[{x:14,y:30,z:0},{x:15,y:30,z:0},{x:15,y:31,z:0},{x:14,y:31,z:0}];m.guards=guardsList.map(g=>({heading:0,...g}));
 if(wall)for(let y=0;y<60;y++)m.edges[edgeKey('e',20,y,0)]='wall';
 const s=createGame(seed,m,false,'standard',{social});for(const p of s.units)p.lastAt=p.x+','+p.y+','+(p.z||0);refresh(s);
 return {s,u:s.units[0],gs:s.units.slice(4)};
}
const teleport=(u,x,y)=>{u.x=x;u.y=y;u.lastAt=x+','+y+',0';};
const give=(g,name)=>{g.archetype=name;g.traits={...ARCHETYPES[name].traits};};
const guardPhase=s=>{for(let i=0;i<80&&s.phase==='enemy';i++)stepEnemy(s);};
const round=s=>{s.phase='player';s.queue=[];assert.ok(endTurn(s));guardPhase(s);};

test('twelve archetypes, each with a want, a fear, a register, a failure, ten traits, a shout radius and two barks for every state',()=>{
 assert.equal(NAMES.length,12);assert.deepEqual([...NAMES].sort(),[...WHEEL].sort());
 for(const [name,a] of Object.entries(ARCHETYPES)){
  for(const k of ['wants','fears','speaks','fails'])assert.ok(typeof a[k]==='string'&&a[k].length>3,name+' '+k);
  assert.deepEqual(Object.keys(a.traits),['vigilance','nerve','initiative','obedience','aggression','pride','discipline','forgiveness','loyalty','humor']);
  for(const v of Object.values(a.traits))assert.ok(v>=0&&v<=100);
  assert.deepEqual(Object.keys(a.barks),['suspicious','alert','searching','standdown','rest','broken'],name);
  for(const lines of Object.values(a.barks)){assert.equal(lines.length,2);assert.notEqual(lines[0],lines[1]);}
 }
 assert.equal(ARCHETYPES.Ruler.radius,20);assert.equal(ARCHETYPES.Rebel.radius,0);assert.equal(ARCHETYPES.Everyman.radius,12);assert.equal(shoutRadius({archetype:'Hero'}),16);assert.equal(shoutRadius({}),12);
 assert.match(describeArchetype('Sage'),/wants to understand/);
});

test('the bond matrix is the documented one: allies, feuds, one-sided pairs, same-type values, and a fractious mean',()=>{
 assert.equal(bond('Explorer','Rebel'),41);assert.equal(bond('Rebel','Explorer'),41);
 assert.equal(bond('Rebel','Ruler'),-41);assert.equal(bond('Ruler','Rebel'),-41);
 assert.equal(bond('Hero','Creator'),-45);assert.equal(bond('Creator','Hero'),-30);
 assert.equal(bond('Sage','Explorer'),41);assert.equal(bond('Explorer','Sage'),26,'the Sage admires the Explorer more than the reverse');
 assert.equal(bond('Innocent','Innocent'),40);assert.equal(bond('Hero','Hero'),20);assert.equal(bond('Sage','Sage'),30);
 assert.equal(bond('Nobody','Sage'),0);
 let sum=0,neg=0,n=0;for(let i=0;i<12;i++)for(let j=i+1;j<12;j++){const ab=bond(WHEEL[i],WHEEL[j]),ba=bond(WHEEL[j],WHEEL[i]);sum+=ab+ba;n++;if(ab<0&&ba<0)neg++;}
 assert.ok(Math.abs(sum/n-(-7))<1,'mean pair sum '+(sum/n).toFixed(1));assert.equal(neg,32);
});

test('six rungs on the bond scale and what each does to retaliation; opposing and liked are the G5 predicates',()=>{
 assert.deepEqual([60,59,25,24,0,-1,-34,-35,-69,-70,-100].map(v=>rungOf(v).name),['bonded','trusted','trusted','cautious trust','cautious trust','strained','strained','resented','resented','feud','feud']);
 assert.deepEqual([70,30,10,-10,-50,-90].map(retaliationScale),[0,.5,1,1.5,2,2]);
 assert.equal(opposing(-35),true);assert.equal(opposing(-34),false);assert.equal(liked(25),true);assert.equal(liked(24),false);assert.equal(rungOf(undefined).name,'cautious trust');
});

test('the draw is a hash of seed and index: deterministic, no RNG stream, every archetype reachable, a recruit squad distinct',()=>{
 assert.equal(drawArchetype(1947,0),drawArchetype(1947,0));assert.ok(NAMES.includes(drawArchetype(1947,0)));
 const seen=new Set();for(let seed=1947;seed<2047;seed++)for(let i=0;i<12;i++)seen.add(drawArchetype(seed,i));assert.equal(seen.size,12);
 const squad4=drawSquad(1947);assert.equal(squad4.length,4);assert.equal(new Set(squad4).size,4);
});

test('behind the knob: plain createGame leaves the G2 base numbers and no archetype; createWorld draws one per guard and tags the four mercs',()=>{
 const {s,gs:[g]}=scene([{x:24,y:30,z:0,species:'donkey',weapon:'knife'}]);
 assert.equal(s.rules.social,false);assert.equal(g.archetype,undefined);assert.equal(g.traits,undefined);assert.equal(nerveFraction(g),NERVE);assert.equal(hearingScale(g),1);assert.equal(brokenRoundsOf(g),BROKEN_ROUNDS);
 const {s:t,gs:[h]}=scene([{x:24,y:30,z:0,species:'donkey',weapon:'knife'}],{social:true});assert.equal(t.rules.social,true);assert.ok(NAMES.includes(h.archetype));assert.deepEqual(h.traits,ARCHETYPES[h.archetype].traits);
 const w=createWorld(blankMap());const f=currentMap(w);assert.equal(f.rules.social,true);
 assert.deepEqual(squad(f).map(u=>u.archetype),['Ruler','Rebel','Creator','Caregiver']);assert.deepEqual(squad(f)[0].social.resting,PERSONALITIES.Yakov.bonds);
 assert.equal(restingBond(squad(f)[0],squad(f)[1]),5,'authored beats derived: Yakov regards Anya at the authored +5, not the matrix -41');
 const [a,b]=guards(f).length>=2?guards(f):[null,null];if(a&&b)assert.equal(restingBond(a,b),bond(a.archetype,b.archetype),'guards rest at the matrix value');
 assert.match(personalityDescription(squad(f)[0]).join(' '),/Ruler: wants order and control/);
});

test('nerve decides who breaks: the same hit that breaks an Innocent leaves a Hero Alert; broken rounds follow nerve too',()=>{
 for(const [name,expect] of [['Innocent','broken'],['Hero','alert'],['Lover','broken'],['Everyman','alert']]){let done=false;
  for(let seed=1;seed<80&&!done;seed++){const {s,u,gs:[g]}=scene([{x:30,y:30,z:0,species:'donkey',weapon:'knife'}],{wall:false,seed});s.units.slice(1,4).forEach(p=>p.hp=0);
   give(g,name);g.heading=180;teleport(u,25,30);u.heading=0;refresh(s);s.phase='player';u.ap=12;if(attack(s,u,g)&&g.hp===45-26){assert.equal(stateOf(g),expect,name+' at 19/45 (threshold '+(45*nerveFraction(g)).toFixed(1)+')');done=true;}}
  assert.ok(done,name);}
 assert.equal(brokenRoundsOf({archetype:'Innocent'}),3);assert.equal(brokenRoundsOf({archetype:'Hero'}),1);assert.equal(brokenRoundsOf({archetype:'Everyman'}),2);
});

test('vigilance and initiative scale hearing, the search and the trail: a Sage hears fourteen tiles, an Explorer walks sixteen steps, a Sage keeps the trail four rounds',()=>{
 const {s,u,gs:[g]}=scene([{x:27,y:30,z:0,species:'donkey',weapon:'knife'}]);assert.equal(Math.hypot(27-14,0),13);
 emitNoise(s,u,10);assert.equal(stateOf(g),'rest','thirteen tiles: unheard at the base');
 give(g,'Sage');emitNoise(s,u,10);assert.equal(stateOf(g),'suspicious','a Sage hears 1.4x');assert.equal(g.searchSteps,Math.round(SUSPICION_STEPS*stepsScale(g)));assert.equal(g.searchSteps,8,'and investigates briefly: initiative 20');
 setState(s,g,'rest');give(g,'Explorer');setState(s,g,'suspicious',{x:12,y:30,z:0});assert.equal(g.searchSteps,16,'an Explorer goes furthest');
 give(g,'Hero');setState(s,g,'rest');setState(s,g,'suspicious',{x:12,y:30,z:0});assert.equal(g.searchSteps,17);
 // Trail: a Sage (vigilance 90) needs round(3*1.4)=4 rounds without an identification; a Jester (40) needs 3.
 const {s:t,gs:[b]}=scene([{x:38,y:30,z:0,species:'donkey',weapon:'knife'}]);give(b,'Sage');b.alert=true;b.lastKnown={x:12,y:30,z:0};refresh(t);
 for(let i=0;i<3;i++)round(t);assert.equal(stateOf(b),'alert','three rounds: a Sage still holds the trail');round(t);assert.equal(stateOf(b),'searching');
 assert.equal(b.search.cells.length,1+Math.min(8,Math.round(SEARCH_CELLS*1.4)),'and searches more cells');
 const {s:t2,gs:[c]}=scene([{x:38,y:30,z:0,species:'donkey',weapon:'knife'}]);give(c,'Jester');c.alert=true;c.lastKnown={x:12,y:30,z:0};refresh(t2);for(let i=0;i<ALERT_ROUNDS;i++)round(t2);assert.equal(stateOf(c),'searching');
});

test('barks come in the archetype register and alternate; without an archetype the G2 line stands',()=>{
 const {s,gs:[g]}=scene([{x:26,y:30,z:0,species:'donkey',weapon:'knife'}]);
 setState(s,g,'suspicious',{x:12,y:30,z:0});assert.equal(s.log[0],'Boris: "Who\'s there?"');
 setState(s,g,'rest');give(g,'Ruler');setState(s,g,'suspicious',{x:12,y:30,z:0});assert.equal(s.log[0],'Boris: "Who is there? Identify yourself."');
 setState(s,g,'rest');setState(s,g,'suspicious',{x:12,y:30,z:0});assert.equal(s.log[0],'Boris: "This area is under my control. Speak."');
 setState(s,g,'alert',{x:12,y:30,z:0});assert.equal(s.log[0],'Boris: "Intruders! All posts, on me!"');
 setState(s,g,'searching');assert.equal(s.log[0],'Boris: "They are on my ground. Find them."');
 setState(s,g,'standdown');assert.equal(s.log[0],'Boris: "The area is secured. Resume posts."');
 setState(s,g,'broken',{x:12,y:30,z:0});assert.equal(s.log[0],'Boris: "This is unacceptable! Fall back! Fall back!"');
 assert.equal(archetypeBark({archetype:'Jester'},'rest'),'Back at my post, which is also my best joke.');
});

test('rungs scale the friendly-fire retaliation chance under the campaign knob: bonded never, feud doubled; plain games keep the formula',()=>{
 const make=social=>{const m=blankMap();m.starts=[{x:10,y:10},{x:11,y:10},{x:3,y:3},{x:3,y:5}];m.guards=[{x:16,y:10,species:'pig-foreman',weapon:'pistol'}];const s=createGame(1,m,true,'standard',{social});const [a,b]=s.units;
  for(const u of [a,b]){u.weapon='pistol';u.ammo.pistol=2;u.hp=u.maxHp=1000;u.accuracy=1000;u.social.stress=100;}return {s,a,b};};
 const retaliations=(social,bondValue)=>{let n=0;for(let seed=1;seed<=40;seed++){const {s,a,b}=make(social);s.socialSeed=seed;b.social.bonds[a.name]=bondValue;b.social.incidents[a.name]={hits:8,damage:200,grudge:100};if(friendlyReaction(s,b,a,20,true).retaliate)n++;}return n;};
 assert.equal(retaliations(true,80),0,'bonded: never');assert.ok(retaliations(true,-90)>=retaliations(false,-90),'feud: at least the formula');
 assert.ok(retaliations(false,80)>0,'the plain formula still retaliates at bond 80 under maximum grudge and stress');
 assert.ok(retaliations(true,40)<=retaliations(false,40),'trusted: half');
});

test('rest pulls bonds ten percent of the way back to their resting level per eight hours, and the log says when a rung is crossed',()=>{
 const w=createWorld(blankMap());const f=currentMap(w);const [yakov,anya]=squad(f);
 yakov.social.bonds.Anya=45;anya.social.bonds.Yakov=-60;
 assert.deepEqual(driftBonds(yakov,8),[]);assert.ok(Math.abs(yakov.social.bonds.Anya-41)<1e-9,'45 -> 41: ten percent of the way to +5');
 const crossed=driftBonds(anya,80);assert.ok(Math.abs(anya.social.bonds.Yakov-5)<1e-9,'eighty hours: all the way');assert.equal(crossed.length,1);assert.match(crossed[0],/Anya again tolerates Yakov: cautious trust/);
 yakov.social.bonds.Anya=45;const r=spendTime(w,'rest',8);assert.ok(r.ok);assert.ok(Math.abs(yakov.social.bonds.Anya-41)<1e-9,'downtime rest drifts');
 const plain=createGame(1,blankMap());plain.units[0].social.bonds.Anya=45;assert.equal(plain.rules.social,false);
});
