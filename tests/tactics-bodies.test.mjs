import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,refresh,attack,attackGround,rollLoot,searchBody,searchPreview,pileContents,pileOpen,inventoryTransfer,equip,SEARCH_COST,WEAPONS} from '../dist/tactics/engine.js';
import {reserve} from '../dist/tactics/inventory.js';
import {blankMap} from '../dist/tactics/maps.js';
import {createSquadBot,scavenge,lootOptions} from '../tools/tactics-squad-bot.mjs';

// One rifle guard three tiles east of Yakov; Yakov shoots it dead with an accurate assault rifle. A second, alert pistol guard with no rounds and no
// reserve stands in reach to the south so the map stays in turn mode after the kill (it never fires).
function fallen(seed=1){
 const m=blankMap();m.starts=[{x:10,y:10,z:0},{x:3,y:6,z:0},{x:2,y:5,z:0},{x:2,y:7,z:0}];m.guards=[{x:13,y:10,z:0,species:'cow',weapon:'rifle'},{x:10,y:20,z:0,species:'cow',weapon:'pistol'}];
 const s=createGame(seed,m,false),u=s.units[0],g=s.units[4],h=s.units[5];h.alert=true;h.ammo.pistol=0;h.pack=h.pack.filter(i=>i.type!=='ammo');h.heading=270;g.heading=180;g.alert=true;u.heading=0;u.accuracy=100;g.hp=1;s.phase='player';refresh(s);
 const carried=structuredClone(g.pack),loaded=g.ammo.rifle;
 assert.ok(attack(s,u,g),'the shot fires');assert.equal(g.hp,0);assert.equal(s.phase,'player');
 const pile=s.loot.find(p=>p.body===g.id);assert.ok(pile,'the body is a container');
 return {s,u,g,pile,carried,loaded};
}

test('a fallen guard is a closed container: contents rolled once from its own equipment, hidden until searched, never rerolled',()=>{
 const {s,u,g,pile,carried,loaded}=fallen();
 assert.equal(pile.searched,false);assert.deepEqual(pileContents(pile),[],'nothing is known before a search');assert.equal(pileOpen(pile),false);
 assert.ok(pile.items.length>=1);const gun=pile.items.find(i=>i.type==='weapon');assert.equal(gun.kind,'rifle');assert.equal(gun.rounds,loaded,'the gun keeps exactly the rounds it had loaded');
 for(const i of pile.items){const had=carried.find(c=>c.type===i.type&&c.kind===i.kind);assert.ok(had,'nothing the guard did not carry: '+i.kind);if(i.type==='ammo'){assert.ok(i.count>=1&&i.count<=had.count,'a reserve stack is 40-100% of what was carried');assert.ok(i.count>=Math.ceil(had.count*.4));}}
 assert.deepEqual(g.pack,[]);
 const snapshot=structuredClone(pile.items);u.x=12;u.y=10;u.ap=12;
 assert.equal(inventoryTransfer(s,u,0,'take',pile),false,'nothing can be taken from an unsearched body');
 assert.ok(searchBody(s,u,pile));assert.equal(pile.searched,true);assert.deepEqual(pile.items,snapshot,'searching reveals, it does not reroll');assert.deepEqual(pileContents(pile),snapshot);
 assert.equal(u.ap,12-SEARCH_COST);assert.equal(searchBody(s,u,pile),false,'a second search finds the same body already open');assert.deepEqual(pile.items,snapshot);
 assert.ok(s.log.some(l=>l.startsWith('Yakov searched Boris: Mosin ('+loaded+' loaded)')),s.log[1]);
});

test('searching needs a comrade beside the body and 3 AP in combat, is free while exploring, and take conserves the loaded rounds',()=>{
 const {s,u,pile,loaded}=fallen();u.ap=12;
 assert.equal(searchPreview(s,u,pile).reason,'Stand beside the body');u.x=12;u.y=10;u.ap=2;assert.equal(searchPreview(s,u,pile).reason,'Not enough AP');
 s.edges['e:12:10']='wall';u.ap=12;assert.equal(searchPreview(s,u,pile).reason,'Stand beside the body');delete s.edges['e:12:10'];
 s.units[5].alert=false;s.units[5].x=100;s.units[5].y=100;s.engaged=false;refresh(s);assert.equal(s.phase,'explore');assert.equal(searchPreview(s,u,pile).cost,0);assert.ok(searchBody(s,u,pile));assert.equal(u.ap,12,'free in real time');
 const v=s.units[1];v.x=13;v.y=11;const own=v.pack.findIndex(i=>i.type==='weapon'&&i.kind==='rifle');assert.ok(inventoryTransfer(s,v,own,'drop'),'Anya drops her own rifle first: one of a kind per pack');
 const gunIndex=pile.items.findIndex(i=>i.type==='weapon'&&i.kind==='rifle');assert.ok(inventoryTransfer(s,v,gunIndex,'take',pile));assert.equal(v.ammo.rifle,loaded,'the taken gun holds the rounds it was found with');
 assert.equal(pile.items.some(i=>i.type==='weapon'&&i.kind==='rifle'),false);
});

test('the roll is deterministic per seed and spends no combat randomness',()=>{
 const a=fallen(7),b=fallen(7);assert.deepEqual(a.pile.items,b.pile.items);
 const s=createGame(3,blankMap()),g={pack:[{type:'weapon',kind:'pistol',rounds:5},{type:'ammo',kind:'pistol',count:10}],ammo:{pistol:5}};
 const seed=s.seed;const roll=rollLoot(s,g);assert.equal(s.seed,seed,'the ballistic stream is untouched');
 assert.deepEqual(roll[0],{type:'weapon',kind:'pistol',rounds:5});assert.ok(roll[1].count>=4&&roll[1].count<=10);
 assert.deepEqual(rollLoot(createGame(3,blankMap()),g),roll,'same seed, same body');
});

test('hand-overs between comrades conserve items and loaded rounds; supply piles and dropped items stay open',()=>{
 const s=createGame(1,blankMap()),u=s.units[0],v=s.units[1];v.x=u.x+1;v.y=u.y;s.phase='explore';
 for(const p of s.loot)assert.equal(pileOpen(p),true,'the starting supplies are not bodies');
 u.ammo.assault=9;const gun=u.pack.findIndex(i=>i.type==='weapon'&&i.kind==='assault');const before=u.pack.length+v.pack.length;
 assert.ok(inventoryTransfer(s,u,gun,'give',v));assert.equal(v.ammo.assault,9);assert.equal(u.pack.some(i=>i.kind==='assault'&&i.type==='weapon'),false);assert.equal(u.pack.length+v.pack.length,before);
 const stack=u.pack.findIndex(i=>i.type==='ammo'&&i.kind==='rifle'),count=u.pack[stack].count,theirs=reserve(v,'rifle');
 assert.ok(inventoryTransfer(s,u,stack,'give',v));assert.equal(reserve(v,'rifle'),theirs+count);assert.equal(reserve(u,'rifle'),0);
 const dropped=v.pack.findIndex(i=>i.type==='weapon'&&i.kind==='assault');assert.ok(inventoryTransfer(s,v,dropped,'drop'));const pile=s.loot.find(p=>p.x===v.x&&p.y===v.y);assert.equal(pileOpen(pile),true);assert.equal(pile.items[0].rounds,9);
});

test('the automated player values nothing it has not searched, then searches the body and takes what it finds',()=>{
 const {s,u,pile}=fallen();u.ap=12;u.ammo.assault=0;const bot=createSquadBot();
 pile.items=[{type:'ammo',kind:'assault',count:20},{type:'weapon',kind:'rifle',rounds:3}];
 assert.deepEqual(lootOptions(s,u),[],'an unsearched body offers no options, however good its contents');
 assert.ok(scavenge(s,u,bot,{travel:false})===false,'not adjacent: nothing to do without travelling');
 u.x=12;u.y=10;assert.ok(scavenge(s,u,bot));assert.equal(bot.events.at(-1).type,'search');assert.equal(pile.searched,true);assert.equal(u.ap,12-SEARCH_COST);
 assert.ok(lootOptions(s,u).length>0);assert.ok(scavenge(s,u,bot));assert.equal(bot.events.at(-1).type,'scavenge');assert.equal(u.ammo.assault,0);assert.equal(reserve(u,'assault'),20);
});

test('review round 1: drops never fall into a closed body, bare hands are not loot, roll bounds and reach pinned, one body per corpse',()=>{
 const {s,u,g,pile}=fallen();u.x=13;u.y=10;u.ap=12;/* Yakov stands on the corpse */
 const stack=u.pack.findIndex(i=>i.type==='ammo'&&i.kind==='pistol');assert.ok(inventoryTransfer(s,u,stack,'drop'));
 assert.equal(pile.items.some(i=>i.kind==='pistol'),false,'the closed body did not swallow the drop');const open=s.loot.find(p=>p!==pile&&p.x===13&&p.y===10);assert.ok(open&&pileOpen(open)&&open.items[0].kind==='pistol','it lies in an open pile on the same tile');
 assert.equal(rollLoot(s,{pack:[{type:'weapon',kind:'hands',rounds:0},{type:'weapon',kind:'knife',rounds:0}],ammo:{hands:0,knife:0}}).map(i=>i.kind).join(),'knife','bare hands are not an item');
 const one=createGame(100,blankMap()),rolls=Array.from({length:40},()=>rollLoot(one,{pack:[{type:'ammo',kind:'rifle',count:30}],ammo:{}})[0].count);/* forty draws from ONE stream: consecutive seeds would give one value */
 assert.ok(rolls.every(c=>c>=12&&c<=30),'40-100% of thirty, rounded up: '+rolls.join(' '));assert.ok(rolls.some(c=>c<18)&&rolls.some(c=>c>26),'the roll spans the range');assert.ok(!rolls.includes(11)&&rolls.every(c=>c>=12),'rounded up, never below forty percent');
 const sevens=Array.from({length:40},()=>rollLoot(one,{pack:[{type:'ammo',kind:'pistol',count:7}],ammo:{}})[0].count);assert.ok(sevens.every(c=>c>=3&&c<=7),'40% of seven is 2.8: rounded UP to 3, never 2: '+sevens.join(' '));
 assert.equal(pileOpen({body:0,searched:false,items:[]}),false,'a guard id of 0 would still be a closed body');
 assert.equal(searchPreview(s,{...u,x:11,y:10},pile).reason,'Stand beside the body','two tiles off is out of reach');
 u.overwatch={weapon:'assault',heading:0};u.x=12;assert.ok(searchBody(s,u,pile));assert.equal(u.overwatch,null,'searching drops a reservation');
 const bodies=()=>s.loot.filter(p=>p.body===g.id).length;assert.equal(bodies(),1);const thrower=s.units[2];thrower.weapon='grenade';thrower.x=g.x;thrower.y=g.y+6;thrower.ap=12;thrower.heading=270;attackGround(s,thrower,{x:g.x,y:g.y,z:0});assert.equal(bodies(),1,'a second lethal hit on the corpse makes no second body');
});

test('the roll counts the rounds a gun has left after the fight, not its magazine',()=>{
 const m=blankMap();m.starts=[{x:10,y:10,z:0},{x:3,y:6,z:0},{x:2,y:5,z:0},{x:2,y:7,z:0}];m.guards=[{x:13,y:10,z:0,species:'cow',weapon:'rifle'},{x:10,y:20,z:0,species:'cow',weapon:'pistol'}];
 const s=createGame(5,m,false),u=s.units[0],g=s.units[4],h=s.units[5];h.alert=true;h.ammo.pistol=0;h.pack=h.pack.filter(i=>i.type!=='ammo');g.heading=180;g.alert=true;u.heading=0;g.hp=500;s.phase='enemy';g.ap=7;
 assert.ok(attack(s,g,u,false,true),'the guard fires once');assert.equal(g.ammo.rifle,WEAPONS.rifle.mag-1);
 s.phase='player';u.accuracy=100;u.ap=12;g.hp=1;assert.ok(attack(s,u,g));const pile=s.loot.find(p=>p.body===g.id);assert.equal(pile.items.find(i=>i.type==='weapon').rounds,WEAPONS.rifle.mag-1);
});

test('the bot walks to a body only when no guard is in sight and only as the nearest comrade',()=>{
 const {s,u,pile}=fallen();for(const v of s.units.slice(0,4))v.ap=12;const bot=createSquadBot();
 pile.items=[{type:'ammo',kind:'assault',count:20}];u.ammo.assault=0;const far=s.units[1];far.x=2;far.y=6;
 assert.equal(scavenge(s,u,bot,{calm:false}),false,'a guard in sight: even the nearest comrade does not go body-hunting');assert.equal(bot.events.length,0);
 assert.equal(scavenge(s,far,bot,{calm:true}),false,'calm, but Yakov is nearer to the body: Anya stays');
 assert.ok(scavenge(s,u,bot,{calm:true}));assert.equal(bot.events.at(-1).type,'seek-body');
});
