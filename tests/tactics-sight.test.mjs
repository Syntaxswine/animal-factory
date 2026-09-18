import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,refresh,turnTo,previewAttack,attack,stepEnemy,canSee,perceive,stepInvestigation,key} from '../dist/tactics/engine.js';
import {blankMap} from '../dist/tactics/maps.js';
import {SIGHT,DEFAULT_SIGHT,sightOf,acuity,identifyRange,detectRange,bearingOffset,JOHNSON} from '../dist/tactics/perception.js';

const ROSTER=['horse','goat','donkey','sheep','cow','hen','pig-foreman','pig-director','skunk'];
const angles=[...Array(361).keys()].map(i=>i/2);

test('every roster species has a sight entry with bino <= field <= 360 and a usable fall-off',()=>{
 for(const sp of ROSTER){const t=SIGHT[sp];assert.ok(t,sp+' missing');assert.ok(t.bino<=t.field&&t.field<=360,sp+' field');assert.ok(t.e2>0&&t.floor>0&&t.floor<=1,sp+' fall-off');}
 assert.deepEqual(sightOf({species:'nothing',cone:120}),{...DEFAULT_SIGHT,field:120,bino:120});
});

test('identification range is non-increasing in bearing, full inside the binocular core and zero beyond the field',()=>{
 for(const sp of ROSTER){const t=SIGHT[sp];let last=Infinity;
  for(const e of angles){const f=acuity(e,t);assert.ok(f<=last+1e-12,sp+' rises at '+e);last=f;
   if(e<=t.bino/2)assert.equal(f,1,sp+' core at '+e);
   if(e>t.field/2+1e-8)assert.equal(f,0,sp+' beyond field at '+e);else assert.ok(f>=t.floor,sp+' below floor at '+e);}}
});

test('identification never exceeds detection at any bearing, and detection saturates inside the field',()=>{
 for(const sp of ROSTER)for(const e of angles){const a={x:0,y:0,heading:0,species:sp},b={x:100*Math.cos(e*Math.PI/180),y:100*Math.sin(e*Math.PI/180)};
  const id=identifyRange(a,b,60),det=detectRange(a,b,60);assert.ok(id<=det+1e-9,sp+' at '+e);
  if(e<=SIGHT[sp].field/2)assert.ok(det>=60*(SIGHT[sp].range??1)-1e-9,sp+' detection short at '+e);
  assert.ok(Math.min(1,JOHNSON.identify*SIGHT[sp].floor)===1,'floor times the Johnson ratio must saturate');}
});

test('a wider field with the same other parameters sees a superset of bearings',()=>{
 const narrow={field:200,bino:40,e2:30,floor:.3},wide={...narrow,field:320};
 for(const e of angles)assert.ok(acuity(e,wide)>=acuity(e,narrow)-1e-12,'at '+e);
});

test('a flat cone without a species keeps the old rule: full range inside, nothing outside',()=>{
 const a={x:0,y:0,heading:90,cone:120};
 assert.equal(identifyRange(a,{x:0,y:10},60),60);assert.equal(detectRange(a,{x:0,y:10},60),60);
 assert.equal(identifyRange(a,{x:10,y:10},60),60);assert.equal(identifyRange(a,{x:0,y:-10},60),0);
 assert.equal(bearingOffset({x:0,y:0},{x:5,y:5}),0,'omnidirectional observer');
});

function lone(m){const s=createGame(1,m);s.units.slice(1,4).forEach(p=>p.hp=0);return s;}
// Placing a unit by hand counts as movement for one refresh; stamp the positions first so the scene starts still.
function settle(s){for(const u of s.units)u.lastAt=u.x+','+u.y+','+(u.z||0);refresh(s);}

test('a still guard in the periphery beyond the identify lobe is unseen; a moving one is glimpsed, not identified',()=>{
 const m=blankMap();m.guards=[{x:30,y:70,z:0,species:'donkey',weapon:'pistol'}];const s=lone(m),u=s.units[0],g=s.units[4];
 u.x=30;u.y=30;u.heading=0;g.heading=0;settle(s);
 assert.equal(perceive(s,u,g),0);assert.ok(!s.detected.has(g.id));assert.ok(!s.glimpses[g.id]);assert.equal(s.phase,'explore');
 g.y=69;refresh(s);
 assert.equal(perceive(s,u,g),1);assert.ok(!s.detected.has(g.id));assert.deepEqual(s.glimpses[g.id],{x:30,y:69,z:0});
 assert.equal(previewAttack(s,u,g).reason,'Target not visible');assert.equal(s.phase,'explore','a glimpse is not contact');
 refresh(s);assert.equal(perceive(s,u,g),0,'standing still again hides it');assert.ok(!s.glimpses[g.id]);
 s.phase='player';assert.ok(turnTo(s,u,90));assert.ok(canSee(s,u,g),'facing it puts it in the binocular core');assert.ok(s.detected.has(g.id));
});

test('a guard that glimpses a moving worker gains approximate suspicion, not alert; identification alerts it',()=>{
 const m=blankMap();m.starts=[{x:30,y:70,z:0},{x:31,y:70,z:0},{x:30,y:71,z:0},{x:31,y:71,z:0}];m.guards=[{x:30,y:30,z:0,species:'donkey',weapon:'pistol'}];
 // Starts face the guard's rear quarter so nobody identifies anybody at creation; the hand-placed tests above rely on the same.
 const s=lone(m),u=s.units[0],g=s.units[4];u.heading=45;g.heading=0;settle(s);
 assert.equal(perceive(s,g,u),0);assert.ok(!g.alert);assert.equal(g.lastHeard,null);
 u.y=69;refresh(s);
 assert.equal(perceive(s,g,u),1);assert.ok(!g.alert,'a glimpse does not alert');assert.deepEqual(g.lastHeard,{x:30,y:72,z:0});assert.equal(g.searchSteps,12);assert.equal(s.phase,'explore');
 assert.ok(stepInvestigation(s),'the guard turns toward the movement');
 assert.equal(g.heading,90);assert.ok(g.alert,'the binocular core now identifies the worker');
 assert.equal(s.phase,'explore','thirty-nine tiles with a pistol: alert, but no fight until it could reach the squad within two turns');assert.ok(s.log.some(l=>l.startsWith('You have been seen')),s.log.slice(0,3).join(' | '));
});

test('neither a glimpse nor identification passes a wall',()=>{
 const m=blankMap();m.guards=[{x:30,y:70,z:0,species:'donkey',weapon:'pistol'}];const s=lone(m),u=s.units[0],g=s.units[4];
 u.x=30;u.y=30;u.heading=90;g.heading=0;s.edges['s:30:49']='wall';settle(s);
 assert.equal(perceive(s,u,g),0);g.y=69;refresh(s);assert.equal(perceive(s,u,g),0);assert.ok(!s.glimpses[g.id]);
 delete s.edges['s:30:49'];refresh(s);assert.equal(perceive(s,u,g),2);
});

test('terrain reveal follows the species field, not a flat 120 degree cone',()=>{
 const m=blankMap();const s=lone(m),u=s.units[0];u.x=60;u.y=60;u.heading=0;settle(s);
 assert.ok(s.visible.has(key(60,100)),'a horse sees 90 degrees off axis');assert.ok(s.visible.has(key(20,64)),'and 174 degrees off axis, just inside the field');
 assert.ok(!s.visible.has(key(20,60)),'but not the rear blind spot');
});

test('a firing unit counts as moving for the next refresh',()=>{
 const m=blankMap();m.guards=[{x:30,y:70,z:0,species:'donkey',weapon:'pistol'}];const s=lone(m),u=s.units[0],g=s.units[4];
 u.x=30;u.y=30;u.heading=0;g.heading=0;settle(s);assert.equal(perceive(s,u,g),0);
 g.fired=true;refresh(s);assert.equal(perceive(s,u,g),1);
});

test('an attack from the blind notch spins the victim toward the attacker, so it can answer',()=>{
 const m=blankMap();m.starts=[{x:25,y:30,z:0},{x:24,y:30,z:0},{x:25,y:31,z:0},{x:24,y:31,z:0}];m.guards=[{x:30,y:30,z:0,species:'donkey',weapon:'knife'}];
 const s=lone(m),u=s.units[0],g=s.units[4];u.heading=0;g.heading=0;settle(s);
 assert.equal(perceive(s,g,u),0,'the worker stands in the guard’s rear notch');assert.ok(canSee(s,u,g));
 s.phase='player';assert.ok(previewAttack(s,u,g).ok);assert.ok(attack(s,u,g));
 assert.equal(g.heading,180);assert.ok(canSee(s,g,u),'the guard now faces its attacker');assert.ok(s.log.some(l=>l.includes('spins toward the attack')));
 g.x=26;g.heading=180;u.heading=180;settle(s);assert.equal(perceive(s,u,g),0,'the worker turned its back on the adjacent guard');
 s.phase='enemy';s.enemyIndex=4;g.ap=g.maxAp;assert.ok(stepEnemy(s));assert.ok(s.log.some(l=>l.includes('Sasha')||l.includes('Boris')),'the guard acted');
 assert.equal(u.heading,0,'the stab from behind spun the worker back around');assert.ok(canSee(s,u,g));
});
