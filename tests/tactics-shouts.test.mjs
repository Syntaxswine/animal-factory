import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,refresh,attack,squad,guards,stateOf,setState,settleGuards,restingBond,bondOf,distance,GRIEF_STRESS,GRIEF_BOND,BARK_RANGE} from '../dist/tactics/engine.js';
import {ARCHETYPES,shoutRadius,bond} from '../dist/tactics/archetypes.js';
import {blankMap,edgeKey} from '../dist/tactics/maps.js';

// GUARDS.md G4. The alarm-test geometry: squad west at (14,30), optionally a wall along the east edge of x=20, guards facing east unless told otherwise.
function scene(guardsList,{wall=true,seed=1,social=true}={}){
 const m=blankMap();m.starts=[{x:14,y:30,z:0},{x:15,y:30,z:0},{x:15,y:31,z:0},{x:14,y:31,z:0}];m.guards=guardsList.map(g=>({heading:0,species:'donkey',weapon:'knife',...g}));
 if(wall)for(let y=0;y<60;y++)m.edges[edgeKey('e',20,y,0)]='wall';
 const s=createGame(seed,m,false,'standard',{social});for(const p of s.units)p.lastAt=p.x+','+p.y+','+(p.z||0);refresh(s);
 return {s,u:s.units[0],gs:s.units.slice(4)};
}
const give=(g,name)=>{g.archetype=name;g.traits={...ARCHETYPES[name].traits};};
const FIX={x:12,y:30,z:0};

test('off the knob a guard going Alert alerts nobody and rolls nothing: G2 to the count',()=>{
 const {s,gs:[g,h,k]}=scene([{x:30,y:30},{x:36,y:30},{x:30,y:36}],{social:false});
 assert.equal(h.social,undefined,'plain guards keep no ledger');
 setState(s,g,'alert',FIX);
 assert.equal(stateOf(h),'rest');assert.equal(stateOf(k),'rest');assert.equal(s.socialSeed,undefined,'no social roll');assert.ok(!s.log.some(l=>/shout/.test(l)));
});

test('a Ruler shouts twenty tiles: a bonded colleague takes its fix and goes Alert, a feud colleague only goes Suspicious toward the shouter, one beyond the radius hears nothing; the answer shouts in turn down a chain; the ballistic stream never moves',()=>{
 const {s,gs:[boris,lev,grigori,oleg,pavel]}=scene([{x:30,y:30},{x:45,y:30},{x:30,y:45},{x:30,y:8},{x:58,y:30}]);
 give(boris,'Ruler');give(lev,'Hero');give(grigori,'Everyman');give(oleg,'Everyman');give(pavel,'Everyman');
 assert.equal(shoutRadius(boris),20);assert.equal(distance(boris,lev),15);assert.equal(distance(boris,grigori),15);assert.ok(distance(boris,oleg)>20);assert.ok(distance(boris,pavel)>20);assert.equal(distance(lev,pavel),13,'within the Hero\'s sixteen');
 lev.social.bonds.Boris=80;grigori.social.bonds.Boris=-80;pavel.social.bonds.Lev=80;
 const ballistic=s.seed;
 setState(s,boris,'alert',FIX);
 assert.equal(stateOf(lev),'alert');assert.deepEqual(lev.lastKnown,FIX,'the shouter\'s fix, not the shouter');
 assert.equal(stateOf(grigori),'suspicious');assert.deepEqual(grigori.lastHeard,{x:30,y:30,z:0},'toward the shouter');
 assert.equal(stateOf(oleg),'rest','twenty-two tiles: out of the Ruler\'s reach');
 assert.equal(stateOf(pavel),'alert','twenty-eight tiles from the Ruler, thirteen from the Hero that answered');assert.deepEqual(pavel.lastKnown,FIX,'the chain carries the original fix');
 assert.equal(s.seed,ballistic,'no shout or obedience roll touches the ballistic stream');
 assert.ok(s.log.some(l=>l==='Boris: "Intruders! All posts, on me!"'),'the shout is the alert bark');
 assert.ok(s.log.some(l=>l==='1 guard answers Boris\'s shout.'),s.log.slice(0,6).join(' | '));
});

test('a Rebel shouts for nobody; a Jester is loud but not believed: even a bonded listener only goes Suspicious',()=>{
 const {s,gs:[g,h]}=scene([{x:30,y:30},{x:36,y:30}]);give(g,'Rebel');give(h,'Everyman');h.social.bonds.Boris=80;
 setState(s,g,'alert',FIX);assert.equal(stateOf(h),'rest');
 const {s:t,gs:[j,k]}=scene([{x:30,y:30},{x:36,y:30}]);give(j,'Jester');give(k,'Everyman');k.social.bonds.Boris=80;
 setState(t,j,'alert',FIX);assert.equal(stateOf(k),'suspicious');assert.deepEqual(k.lastHeard,{x:30,y:30,z:0});
});

test('at cautious trust the listener rolls its obedience on the social stream: an Everyman answers far more often than an Explorer; an Alert listener keeps its own fix and a broken one keeps running',()=>{
 const answers=name=>{let n=0;for(let seed=1;seed<=60;seed++){const {s,gs:[g,h]}=scene([{x:30,y:30},{x:40,y:30}]);give(g,'Ruler');give(h,name);h.social.bonds.Boris=0;s.socialSeed=(seed*2654435761)>>>0;const ballistic=s.seed;setState(s,g,'alert',FIX);assert.equal(s.seed,ballistic);if(stateOf(h)==='alert')n++;}return n;};
 const everyman=answers('Everyman'),explorer=answers('Explorer');
 assert.ok(everyman>=40&&everyman<60,'obedience 85 of 60: '+everyman);assert.ok(explorer<=25&&explorer>0,'obedience 20 of 60: '+explorer);
 const {s,gs:[g,h,k]}=scene([{x:30,y:30},{x:40,y:30},{x:30,y:40}]);give(g,'Ruler');give(h,'Everyman');give(k,'Everyman');h.social.bonds.Boris=80;k.social.bonds.Boris=80;
 const own={x:50,y:50,z:0};setState(s,h,'alert',own);setState(s,k,'broken',own);s.log=[];
 setState(s,g,'alert',FIX);assert.deepEqual(h.lastKnown,own,'already Alert: its own, better fix');assert.equal(stateOf(k),'broken');assert.ok(!s.log.some(l=>/answers/.test(l)));
});

test('in play: the guard that identifies a merc shouts, and a bonded colleague that cannot see the merc goes Alert on the merc\'s exact tile',()=>{
 const {s,u,gs:[a,b]}=scene([{x:24,y:30},{x:38,y:30}],{wall:false});s.units.slice(1,4).forEach(p=>p.hp=0);setState(s,a,'rest');setState(s,b,'rest');refresh(s);
 assert.equal(stateOf(a),'rest','both face east: the one merc left is dead astern, in the donkey ten-degree notch');assert.equal(stateOf(b),'rest');
 give(a,'Caregiver');give(b,'Everyman');b.social.bonds.Boris=80;assert.equal(distance(a,b),14);a.heading=180;
 refresh(s);
 assert.equal(stateOf(a),'alert');assert.equal(stateOf(b),'alert');assert.deepEqual(b.lastKnown,{x:u.x,y:u.y,z:0});
});

test('a colleague\'s bullet: the guard it lands on keeps a merc\'s ledger (a hit, a grudge, a bond loss, ten stress) and answers in register; off the knob nothing happens',()=>{
 const shoot=social=>{for(let seed=1;seed<200;seed++){const {s,u,gs:[a,b]}=scene([{x:30,y:30,heading:180,weapon:'rifle'},{x:22,y:30,heading:0,weapon:'knife'}],{wall:false,seed,social});
  if(social){give(a,'Hero');give(b,'Everyman');}a.accuracy=1000;s.phase='enemy';u.hp=1000;
  if(attack(s,a,u,false,true)&&b.hp<45)return {s,a,b,u};}
  assert.fail('no seed put the bullet into the colleague');};
 const {s,a,b}=shoot(true);
 assert.equal(b.social.incidents.Boris.hits,1);assert.ok(Math.abs(b.social.stress-(20+(45-b.hp)/45*35))<1e-9,'ten for the incident plus the injury strain a merc would take: '+b.social.stress);
 assert.ok(b.social.bonds.Boris<restingBond(b,a),'started at the matrix value ('+restingBond(b,a)+'), now '+b.social.bonds.Boris);
 assert.ok(s.log.some(l=>l==='Lev: “Oi. Other way, mate.”'),s.log.slice(0,6).join(' | '));
 const {s:t,b:c}=shoot(false);
 assert.equal(c.social,undefined);assert.equal(t.socialSeed,undefined,'no social roll off the knob');assert.ok(!t.log.some(l=>/Lev: “/.test(l)));
});

test('a guard with a gun and a grudge shoots back at the colleague, bounded by the same retaliation rule as a merc',()=>{
 let retaliated=0,hits=0;
 for(let seed=1;seed<=80&&!retaliated;seed++){const {s,u,gs:[a,b]}=scene([{x:30,y:30,heading:180,weapon:'rifle'},{x:22,y:30,heading:0,weapon:'pistol'}],{wall:false,seed});
  give(a,'Hero');give(b,'Rebel');a.accuracy=1000;b.accuracy=1000;b.social.stress=100;b.social.bonds.Boris=-90;b.social.incidents.Boris={hits:8,damage:200,grudge:100};s.phase='enemy';u.hp=1000;
  const before=a.hp;if(!attack(s,a,u,false,true)||b.hp===45)continue;hits++;
  if(s.log.some(l=>/Lev → Boris: .*retaliation/.test(l))){retaliated++;assert.ok(a.hp<before||s.log.some(l=>/Lev → Boris: miss/.test(l)));}}
 assert.ok(hits>0);assert.ok(retaliated>0,'a Rebel at feud with maximum stress and grudge shot back at least once in '+hits+' hits');
});

test('grief: a liked colleague falling within earshot costs stress by rung; past its nerve the guard breaks on the spot toward the killer; a feud colleague and a distant one cost nothing',()=>{
 const fall=(rung,archetype,stress=0,far=false)=>{for(let seed=1;seed<200;seed++){const {s,u,gs:[a,b]}=scene([{x:24,y:30,heading:180},{x:far?58:34,y:far?58:30}],{wall:false,seed});
  s.units.slice(1,4).forEach(p=>p.hp=0);give(a,'Everyman');give(b,archetype);b.social.bonds.Boris=rung;b.social.stress=stress;a.hp=1;u.accuracy=1000;s.phase='player';u.ap=12;
  if(attack(s,u,a)&&a.hp===0)return {s,b};}assert.fail('no kill');};
 let r=fall(80,'Innocent');assert.equal(r.b.social.stress,GRIEF_STRESS.bonded);assert.equal(stateOf(r.b),'alert','twenty-five stress does not pass an Innocent\'s nerve of thirty; it is Alert from the gunshot');
 assert.ok(r.s.log.some(l=>l==='Lev saw Boris fall.'));assert.match(r.b.social.memories[0],/Boris was killed beside me/);
 r=fall(80,'Innocent',10);assert.equal(r.b.social.stress,35);assert.equal(stateOf(r.b),'broken');assert.deepEqual(r.b.threat,{x:14,y:30,z:0},'toward the killer');
 r=fall(80,'Hero',60);assert.equal(r.b.social.stress,85);assert.equal(stateOf(r.b),'alert','a Hero\'s nerve is 85: not passed');
 r=fall(30,'Innocent');assert.equal(r.b.social.stress,GRIEF_STRESS.trusted);
 r=fall(-80,'Innocent');assert.equal(r.b.social.stress,0);assert.ok(!r.s.log.some(l=>/saw Boris fall/.test(l)));
 r=fall(80,'Innocent',0,true);assert.equal(r.b.social.stress,0,'thirty-nine tiles away: out of earshot');
 assert.equal(BARK_RANGE,30);
});

test('a liked colleague killed by another guard\'s bullet: the mourner\'s bond toward the killer drops the G5 quantity and its grudge rises by the same',()=>{
 for(let seed=1;seed<200;seed++){const {s,u,gs:[c,a,b]}=scene([{x:30,y:30,heading:180,weapon:'rifle'},{x:22,y:30,heading:0},{x:22,y:40}],{wall:false,seed});
  give(c,'Hero');give(a,'Everyman');give(b,'Caregiver');b.social.bonds.Lev=80;a.hp=1;c.accuracy=1000;s.phase='enemy';u.hp=1000;
  if(!attack(s,c,u,false,true)||a.hp>0)continue;
  assert.equal(b.social.stress,GRIEF_STRESS.bonded);
  assert.equal(b.social.bonds.Boris,bond('Caregiver','Hero')-GRIEF_BOND.bonded,'the matrix value minus forty');assert.equal(b.social.incidents.Boris.grudge,GRIEF_BOND.bonded);
  assert.equal(bondOf(b,c),b.social.bonds.Boris);return;}
 assert.fail('no seed killed the colleague in the line of fire');
});

test('the campaign clock works guard stress off at the mercs\' resting rate',()=>{
 const {s,gs:[g]}=scene([{x:30,y:30}]);g.social.stress=50;settleGuards(s,60);assert.equal(g.social.stress,45);
 const {s:t,gs:[h]}=scene([{x:30,y:30}],{social:false});settleGuards(t,60);assert.equal(h.social,undefined);
});
