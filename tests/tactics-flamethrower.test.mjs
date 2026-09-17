import test from 'node:test';
import assert from 'node:assert/strict';
import {blankMap,parseMap} from '../dist/tactics/maps.js';
import {createGame,WEAPONS,previewAttack,attack,tankExplosionChance,canControl,endTurn,stepEnemy,equip,reload,move,stepMovement,setStance,stabilize,refresh} from '../dist/tactics/engine.js';
import {itemSpan,reserve} from '../dist/tactics/inventory.js';
import {inventoryArt} from '../dist/tactics/loot-art.js';

function seedFor(second,hit=true){
 for(let seed=0;seed<1000000;seed++){
  const a=(Math.imul(seed,1664525)+1013904223)>>>0,b=(Math.imul(a,1664525)+1013904223)>>>0;
  if((hit?a/4294967296<.9:a/4294967296>.95)&&second(b/4294967296))return seed;
 }
 throw Error('No seed');
}
function setup(seed=1,difficulty='standard'){
 const m=blankMap();m.starts=[{x:14,y:20},{x:21,y:20},{x:25,y:20},{x:26,y:20}];
 m.guards=[{x:20,y:20,species:'pig-foreman',weapon:'flamethrower'},{x:23,y:20,species:'cow',weapon:'pistol'}];
 const s=createGame(seed,parseMap(JSON.stringify(m)),true,difficulty),a=s.units[0],b=s.units[4];
 equip(s,a,'pistol');a.accuracy=1000;a.heading=0;b.hp=b.maxHp=500;
 return {s,a,b};
}
function cycle(s){assert.equal(endTurn(s),true);for(let i=0;i<100&&s.phase==='enemy';i++)stepEnemy(s);assert.notEqual(s.phase,'enemy');}

test('tank detonation thresholds are per successful hit: torso 25%, weapon 90%',()=>{
 for(const [zone,threshold] of [['torso',.25],['weapon',.9]])for(const explode of [false,true]){
  const seed=seedFor(n=>explode?n>=threshold-.001&&n<threshold:n>=threshold&&n<threshold+.001);
  const {s,a,b}=setup(seed);assert.equal(previewAttack(s,a,b,false,zone).tankChance,threshold);
  assert.equal(attack(s,a,b,false,false,zone),true);assert.equal(!!b.tanksExploded,explode);
  assert.equal(b.hp===0,explode);
 }
});
test('misses, head/leg hits, empty tanks and absent tanks never detonate',()=>{
 for(const zone of ['head','legs']){const {s,a,b}=setup(seedFor(n=>n<.1));attack(s,a,b,false,false,zone);assert.equal(b.tanksExploded,undefined);}
 const {s,a,b}=setup(seedFor(()=>true,false));attack(s,a,b,false,false,'weapon');assert.equal(b.hp,500);assert.equal(b.tanksExploded,undefined);
 b.ammo.flamethrower=0;assert.equal(tankExplosionChance(b,'torso'),0);
 b.ammo.flamethrower=4;b.weapon='pistol';b.pack=[];assert.equal(tankExplosionChance(b,'torso'),0);
});
test('explosion kills wearer and adjacent allies permanently, ignites through radius five, and respects floors',()=>{
 const {s,a,b}=setup(seedFor(n=>n<.1),'easy');
 const upper={...s.units[5],id:6,x:20,y:20,z:1};s.units.push(upper);
 attack(s,a,b,false,false,'weapon');
 assert.equal(b.hp,0);assert.equal(s.units[1].casualty,'dead');assert.equal(s.units[1].bleedTurns,0);
 assert.equal(stabilize(s,a,s.units[1]),false);
 assert.equal(s.units[2].burningTurns,3);assert.equal(s.units[3].burningTurns,undefined);assert.equal(upper.hp,45);
 assert.ok(s.fires.some(p=>p.x===25&&p.y===20));assert.ok(!s.fires.some(p=>p.x===26&&p.y===20));
 assert.ok(!s.loot.flatMap(p=>p.items).some(i=>i.kind==='flamethrower'));
 refresh(s);assert.equal(s.units[1].casualty,'dead');
});
test('burning units cannot act, flee on three turns, then recover even after combat ends',()=>{
 const {s,a,b}=setup(seedFor(n=>n<.1));attack(s,a,b,false,false,'weapon');
 const u=s.units[2],guard=s.units[5],start=[u.x,u.y];
 assert.equal(canControl(s,u),false);assert.equal(move(s,u,26,21),false);assert.equal(setStance(s,u,'prone'),false);
 assert.equal(equip(s,u,'pistol'),false);assert.equal(reload(s,u),false);
 for(let n=2;n>=0;n--){cycle(s);assert.equal(u.burningTurns,n);assert.equal(guard.burningTurns,n);if(n)assert.equal(canControl(s,u),false);}
 assert.notDeepEqual([u.x,u.y],start);assert.equal(canControl(s,u),true);assert.equal(s.fires.length,0);
});
test('short-range flame hits are lethal for either team and survivors panic',()=>{
 const {s,a,b}=setup(1);a.weapon='flamethrower';a.ammo.flamethrower=4;b.weapon='pistol';b.pack=[];
 assert.equal(previewAttack(s,a,b).ok,true);a.x=17;b.hp=45;
 assert.equal(previewAttack(s,a,b).range,10);assert.equal(attack(s,a,b),true);assert.equal(b.hp,0);assert.equal(a.ammo.flamethrower,3);
 const other=setup(1,'easy');other.b.x=15;other.b.heading=180;other.b.accuracy=1000;other.s.phase='enemy';
 assert.equal(attack(other.s,other.b,other.a,false,true),true);assert.equal(other.a.casualty,'dead');
 const durable=setup(1);durable.a.x=17;durable.a.weapon='flamethrower';durable.b.weapon='pistol';durable.b.pack=[];
 attack(durable.s,durable.a,durable.b);assert.ok(durable.b.hp>0);assert.equal(durable.b.burningTurns,3);
});
test('flamethrower supports inventory size, fuel reload and editor roundtrip',()=>{
 const {s,b}=setup();assert.equal(itemSpan({type:'weapon',kind:'flamethrower'}),2);
 b.ammo.flamethrower=0;s.phase='enemy';assert.equal(reload(s,b,true),true);assert.equal(b.ammo.flamethrower,WEAPONS.flamethrower.mag);assert.equal(reserve(b,'flamethrower'),0);
 assert.match(inventoryArt({type:'weapon',kind:'flamethrower'}),/flamethrower.svg$/);
 assert.match(inventoryArt({type:'ammo',kind:'flamethrower'}),/fuel.svg$/);
});
test('fire keeps turn mode alive after the final guard dies and expires after three rounds',()=>{
 const {s,a,b}=setup(seedFor(n=>n<.1));s.units[5].hp=0;attack(s,a,b,false,false,'weapon');
 assert.equal(s.phase,'player');cycle(s);cycle(s);assert.equal(s.phase,'player');cycle(s);assert.equal(s.phase,'won');
 assert.equal(s.units[1].casualty,'dead');
});
test('walking into fire cancels the route and ignition during an enemy turn still lasts three panic turns',()=>{
 const {s,a}=setup();s.fires=[{x:15,y:20,z:0,turns:3}];
 assert.equal(move(s,a,16,20),true);stepMovement(s);assert.equal(a.x,15);assert.equal(a.burningTurns,3);assert.equal(s.queue.length,0);
 const late=setup(1);late.s.phase='enemy';late.b.x=15;late.b.heading=180;late.b.accuracy=1000;late.a.hp=late.a.maxHp=500;
 attack(late.s,late.b,late.a,false,true);assert.equal(late.a.burningTurns,3);
 late.s.enemyIndex=late.s.units.length;stepEnemy(late.s);assert.equal(late.a.burningTurns,3);
});
test('attack events name the shooter and target and list every unit the shot put down',()=>{
 const pick=e=>({shooter:e.shooter,target:e.target,incendiary:e.incendiary,hit:e.hit,downed:[...e.downed].sort((x,y)=>x-y)});
 const burn=setup(1);burn.a.weapon='flamethrower';burn.a.ammo.flamethrower=4;burn.b.weapon='pistol';burn.b.pack=[];burn.a.x=17;burn.b.hp=45;
 assert.equal(attack(burn.s,burn.a,burn.b),true);
 assert.deepEqual(pick(burn.s.effect.sequence[0]),{shooter:burn.a.id,target:burn.b.id,incendiary:true,hit:true,downed:[burn.b.id]});
 const scorch=setup(seedFor(()=>true,false));scorch.a.weapon='flamethrower';scorch.a.ammo.flamethrower=4;scorch.b.weapon='pistol';scorch.b.pack=[];scorch.a.x=17;
 assert.equal(attack(scorch.s,scorch.a,scorch.b),true);
 assert.deepEqual(pick(scorch.s.effect.sequence[0]),{shooter:scorch.a.id,target:scorch.b.id,incendiary:true,hit:false,downed:[]});
 // A tank blast downs the wearer and the ally beside him in the same event.
 const blast=setup(seedFor(n=>n<.1));attack(blast.s,blast.a,blast.b,false,false,'weapon');
 assert.deepEqual(pick(blast.s.effect.sequence[0]),{shooter:blast.a.id,target:blast.b.id,incendiary:false,hit:true,downed:[1,blast.b.id]});
 const graze=setup(seedFor(n=>n>.5));attack(graze.s,graze.a,graze.b,false,false,'torso');
 assert.deepEqual(graze.s.effect.sequence[0].downed,[]);assert.ok(graze.b.hp>0);
});
