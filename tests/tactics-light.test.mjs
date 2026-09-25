import test from 'node:test';
import assert from 'node:assert/strict';
import {LIGHT_FORMS,LIGHT_RANGE,lightBrightness,lightEnabled,placedEmitters,lightSources,illuminationAt,lampStrength,lampLight,stateMinutes,sightScale,DARK_SIGHT} from '../dist/tactics/light-sources.js';
import {litTiles,seenOnly,paintLight,lightMap,POOL_REACH} from '../dist/tactics/light-render.js';
import {blankMap,parseMap,tileKey} from '../dist/tactics/maps.js';
import {createEditor,applyBrush} from '../dist/tactics/editor-model.js';
import {createGame,perceive,litSightRange,sightRange,detectionChance} from '../dist/tactics/engine.js';
import {createWorld,advanceTime,tickWorld,travel,currentMap} from '../dist/tactics/world.js';
import {setTerrain} from '../dist/tactics/maps.js';
import {forgetLight,lightEpoch} from '../dist/tactics/light-sources.js';
import {cachedTiles,TORSO} from '../dist/tactics/light-render.js';

// Parcel I: artificial light and what it does to sight. See docs/tactics/ARTIFICIAL-LIGHTING.md.
const NOON=720,MIDNIGHT=0;

test('the light forms are the 3D branch numbers, written out', ()=>{
 // light-sources.js at b23334c on project/tactics-3d: [w, h, fire, wall, emitters]. Spot sources are
 // listed there too and checked only for their flag here; parcel J owns their beams.
 const THREE_D={
  'campfire':[1,1,true,false,[[0,.32,0]]],
  'cooking-fire':[2,2,true,false,[[0,.32,0]]],
  'standing-torch':[1,1,true,false,[[0,1.36,0]]],
  'wall-torch':[1,1,true,true,[[0,2.06,.27]]],
  'floor-lamp':[1,1,false,false,[[0,1.48,0]]],
  'bedside-table-lamp':[1,1,false,false,[[0,.605+1.48*.48,-.045]]],
  'gooseneck-sconce':[1,1,false,true,[[0,1.62,.55]]],
  'streetlight':[1,1,false,false,[[.24,2.51,0]]],
  'streetlight-double':[2,1,false,false,[[-.66,2.51,0],[.66,2.51,0]]]
 };
 for(const [kind,[w,h,fire,wall,emitters]] of Object.entries(THREE_D)){
  const f=LIGHT_FORMS[kind];
  assert.deepEqual([f.w,f.h,!!f.fire,!!f.wall,f.emitters],[w,h,fire,wall,emitters],kind);
  assert.ok(!f.spot,kind);
 }
 for(const kind of ['wooden-spotlight-tower','iron-searchlight-stair-tower','iron-searchlight-ladder-tower','spotlight'])assert.equal(LIGHT_FORMS[kind].spot,true,kind);
 assert.equal(Object.keys(LIGHT_FORMS).length,13);
 assert.equal(LIGHT_RANGE,30);
});

test('brightness falls by half every five tiles and stops at thirty', ()=>{
 for(const [d,b] of [[0,1],[5,1],[5.01,.5],[10,.5],[10.01,.25],[15,.25],[20,.125],[25,.0625],[30,.03125],[30.01,0],[-1,0],[NaN,0],[Infinity,0]])
  assert.equal(lightBrightness(d),b,`at ${d}`);
});

test('electric lamps light for the night, fires always, and the prop can say otherwise', ()=>{
 const lamp={kind:'floor-lamp'},fire={kind:'campfire'};
 for(const [m,on] of [[0,true],[359,true],[360,false],[720,false],[1079,false],[1080,true],[1439,true],[1440+720,false],[-60,true]])
  assert.equal(lightEnabled(lamp,m),on,`floor lamp at ${m}`);
 for(const m of [0,720,1080])assert.equal(lightEnabled(fire,m),true,`fire at ${m}`);
 assert.equal(lightEnabled({...lamp,lightMode:'on'},NOON),true);
 assert.equal(lightEnabled({...fire,lightMode:'off'},MIDNIGHT),false);
 assert.equal(lightEnabled({...lamp,condition:99},MIDNIGHT),false,'a damaged lamp is dark');
 assert.equal(lightEnabled({kind:'crate-wood'},MIDNIGHT),false);
 // Beams are parcel J: a spotlight is enabled by the schedule but gives no light here yet.
 assert.equal(lightSources([{kind:'spotlight',x:1,y:1,z:0}],MIDNIGHT).length,0);
});

test('a bulb mirrors with the art when the prop is rotated', ()=>{
 // Here rotation is (x, y) -> (y, x). The streetlight's arm reaches .24 tile along x unrotated.
 const [a]=placedEmitters({kind:'streetlight',x:4,y:6,z:0}),[b]=placedEmitters({kind:'streetlight',x:4,y:6,z:0,rotated:true});
 assert.deepEqual([a.x,a.y,a.h],[4.24,6,2.51]);
 assert.deepEqual([b.x,b.y,b.h],[4,6.24,2.51]);
 // A 2 x 1 double streetlight turns into 1 x 2; its two bulbs sit either side of the new centre along y.
 const d=placedEmitters({kind:'streetlight-double',x:4,y:6,z:1,rotated:true});
 assert.deepEqual(d.map(e=>[+e.x.toFixed(6),+e.y.toFixed(6),e.h]),[[4,5.84,5.51],[4,7.16,5.51]]);
});

// A game on the blank map, at a chosen minute, with a goat guard 37 tiles east of Yakov looking at him.
function scene(minutes,props=[],edges={}){
 const m=blankMap();m.props=props;m.edges={...m.edges,...edges};
 m.guards=[{x:40,y:4,z:0,species:'goat',weapon:'pistol',heading:180}];
 const s=createGame(1,parseMap(JSON.stringify(m)),false);s.clock={minutes};
 const guard=s.units.find(u=>u.team==='guard'),yakov=s.units.find(u=>u.team==='squad'&&u.x===3&&u.y===4);
 return {s,guard,yakov};
}

test('by day nothing changes: full light, full range, whatever the lamps do', ()=>{
 const lit=scene(NOON,[{kind:'floor-lamp',x:5,y:4,z:0,lightMode:'on'}]),bare=scene(NOON);
 for(const {s,guard,yakov} of [lit,bare]){
  assert.equal(illuminationAt(s,yakov),1);
  assert.equal(litSightRange(s,guard,yakov),sightRange(guard,yakov));
  assert.equal(perceive(s,guard,yakov),2,'identified at 37 tiles by day');
 }
});

test('at night an unlit animal is seen from 15 tiles, a lamp-lit one from the full 60', ()=>{
 assert.equal(sightScale(0),DARK_SIGHT);assert.equal(DARK_SIGHT,.25);assert.equal(sightScale(1),1);assert.equal(sightScale(.5),.625);
 assert.equal(sightScale(-1),.25);assert.equal(sightScale(2),1);
 // Dark: 60 x 0.25 = 15 tiles, and Yakov is 37 away.
 const dark=scene(MIDNIGHT);
 assert.equal(illuminationAt(dark.s,dark.yakov),0);
 assert.equal(litSightRange(dark.s,dark.guard,dark.yakov),15);
 assert.equal(perceive(dark.s,dark.guard,dark.yakov),0,'unseen in the dark at 37 tiles');
 // Twelve tiles away, inside the 15, he is seen even unlit.
 dark.guard.x=15;assert.equal(perceive(dark.s,dark.guard,dark.yakov),2,'seen in the dark at 12 tiles');
 // A floor lamp two tiles from him: he is inside its first band, fully lit, and seen from 37 tiles again.
 const lit=scene(MIDNIGHT,[{kind:'floor-lamp',x:5,y:4,z:0}]);
 assert.equal(illuminationAt(lit.s,lit.yakov),1);
 assert.equal(litSightRange(lit.s,lit.guard,lit.yakov),60);
 assert.equal(perceive(lit.s,lit.guard,lit.yakov),2,'seen at 37 tiles in the lamplight');
 // Two lamps on him are still no more than daylight: light is capped at 1.
 const two=scene(MIDNIGHT,[{kind:'floor-lamp',x:5,y:4,z:0},{kind:'floor-lamp',x:4,y:3,z:0}]);
 assert.equal(lightSources(two.s.props,MIDNIGHT).filter(l=>lampStrength(two.s,l,{x:3,y:4,h:1})===1).length,2,'the premise: both reach him fully');
 assert.equal(illuminationAt(two.s,two.yakov),1);
 // The same lamp switched off by its author: dark again.
 const off=scene(MIDNIGHT,[{kind:'floor-lamp',x:5,y:4,z:0,lightMode:'off'}]);
 assert.equal(perceive(off.s,off.guard,off.yakov),0);
 // Seven tiles from the lamp: the second band, half light, 37.5 tiles of range; he is 37 away.
 const far=scene(MIDNIGHT,[{kind:'floor-lamp',x:10,y:4,z:0}]);
 assert.equal(illuminationAt(far.s,far.yakov),.5);
 assert.equal(litSightRange(far.s,far.guard,far.yakov),37.5);
});

test('light does not pass through a wall, and a lamp is not shadowed by its own footprint', ()=>{
 // A wall on the east edges of x = 4, y = 0..8, between Yakov at (3, 4) and the lamp at (5, 4).
 const edges=Object.fromEntries(Array.from({length:9},(_,y)=>[`e:4:${y}`,'wall']));
 const walled=scene(MIDNIGHT,[{kind:'floor-lamp',x:5,y:4,z:0}],edges);
 assert.equal(illuminationAt(walled.s,walled.yakov),0,'the wall stops the light');
 // The bedside table is the one light with cover (25), so it stops rays below 0.8 tile in its own tile.
 // A ray from low beside it, a prone body, crosses that tile under 0.8 on its way to the bulb. It must
 // still arrive: the fixture does not shadow itself.
 const beside=scene(MIDNIGHT,[{kind:'bedside-table-lamp',x:4,y:4,z:0}]);
 const [bulb]=lightSources(beside.s.props,MIDNIGHT);
 assert.equal(lampStrength(beside.s,bulb,{x:3,y:4,h:.2}),1);
 // The premise: the same table does stop a ray that is not going to its own bulb.
 const past={x:bulb.x,y:bulb.y,h:.5,prop:{}};
 assert.equal(lampStrength(beside.s,past,{x:3,y:4,h:.2}),0,'the table is cover to anything else');
 // Height matters on one tile: a floor lamp beyond the table lights a standing body over it, but not a
 // body lying behind it. Asked twice in one state, the memo must keep the two apart.
 const low=scene(MIDNIGHT,[{kind:'bedside-table-lamp',x:4,y:4,z:0,lightMode:'off'},{kind:'floor-lamp',x:6,y:4,z:0}]).s;
 assert.equal(lampLight(low,3,4,1,MIDNIGHT),1,'over the table');
 assert.equal(lampLight(low,3,4,.2,MIDNIGHT),0,'under it');
});

test('the map state reads the campaign clock, and falls back to its own start time', ()=>{
 const world=createWorld();
 const s=world.states.factory;
 assert.equal(s.clock,world.clock,'the same object, so it moves with the world');
 const before=stateMinutes(s);advanceTime(world,90);assert.equal(stateMinutes(s),before+90);
 // A plain game with no world: the map's authored start, or 08:00.
 const m=blankMap();m.time={startMinutes:1300};
 assert.equal(stateMinutes(createGame(1,parseMap(JSON.stringify(m)),false)),1300);
 assert.equal(stateMinutes(createGame(1,parseMap(JSON.stringify(blankMap())),false)),480);
});

test('the editor records a light mode on lamps and fires, and only there', ()=>{
 const e=createEditor(blankMap());
 assert.equal(applyBrush(e,'prop',10,12,null,{propKind:'floor-lamp',lightMode:'on'}),'');
 assert.equal(applyBrush(e,'prop',12,12,null,{propKind:'campfire',lightMode:'off'}),'');
 assert.equal(applyBrush(e,'prop',14,12,null,{propKind:'streetlight',lightMode:'auto'}),'');
 assert.equal(applyBrush(e,'prop',16,12,null,{propKind:'crate-wood',lightMode:'on'}),'');
 const back=parseMap(JSON.stringify(e.map)),mode=kind=>back.props.find(p=>p.kind===kind).lightMode;
 assert.equal(mode('floor-lamp'),'on');
 assert.equal(mode('campfire'),'off');
 assert.equal(mode('streetlight'),undefined,'automatic is the absence, so old maps are unchanged');
 assert.equal(mode('crate-wood'),undefined,'a crate has no light to switch');
});

test('the drawn light is the same rule: it stops at walls, hides in the fog, and is nothing by day', ()=>{
 const edges=Object.fromEntries(Array.from({length:40},(_,y)=>[`e:12:${y}`,'wall']));
 // Two lamps whose pools overlap, so a tile gets more than one bulb and the sum has to be capped.
 const {s}=scene(MIDNIGHT,[{kind:'floor-lamp',x:10,y:10,z:0},{kind:'floor-lamp',x:9,y:12,z:0}],edges);
 const tiles=litTiles(s,MIDNIGHT,0);
 assert.equal(tiles.get('10,10').light,1);
 assert.ok(tiles.has('12,10'),'lit up to the wall');
 assert.ok(![...tiles.keys()].some(k=>+k.split(',')[0]>12),'nothing lit beyond it');
 assert.ok([...tiles.values()].every(t=>t.light>=1/8&&t.light<=1),'the first three bands, never the faint tail');
 assert.equal(POOL_REACH,15);
 assert.ok([...tiles.keys()].every(k=>{const [x,y]=k.split(',').map(Number);return Math.hypot(x-10,y-10)<=15||Math.hypot(x-9,y-12)<=15;}),'out to fifteen tiles from a lamp');
 // Every drawn tile agrees with detection at a body's height on that tile.
 for(const [k,t] of tiles){const [x,y]=k.split(',').map(Number);assert.equal(Math.min(1,illuminationAt(s,{x,y,z:0},MIDNIGHT)),t.light,k);}
 // A lamp in the map's corner lights nothing off the map.
 const corner=scene(MIDNIGHT,[{kind:'floor-lamp',x:1,y:1,z:0}]).s;
 const cornerTiles=[...litTiles(corner,MIDNIGHT,0).keys()].map(k=>k.split(',').map(Number));
 assert.ok(cornerTiles.length>20&&cornerTiles.every(([x,y])=>x>=0&&y>=0),'lit only on the map');
 // Only seen ground is lit on screen.
 const seen=new Set([tileKey(10,10),tileKey(11,10)]);
 assert.deepEqual([...seenOnly(litTiles(s,MIDNIGHT,0),seen,0).keys()].sort(),['10,10','11,10']);
 // Drawing: nothing by day, one image at night.
 const drawn=[],ctx={save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},clip(){},transform(){},drawImage(c){drawn.push(c);},set globalAlpha(v){this.alpha=v;},get globalAlpha(){return this.alpha;}};
 const makeCanvas=(w,h)=>({width:w,height:h,getContext:()=>({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData(){}})});
 const view=minutes=>({project:(x,y)=>({x:(x-y)*28,y:(x+y)*14}),zoom:1,level:0,state:s,minutes});
 // A fresh game has seen nothing until the app first runs visibility, so nothing would be drawn at all.
 assert.equal(s.seen.size,0);assert.equal(paintLight(ctx,view(MIDNIGHT),makeCanvas),false,'fog hides every pool');
 for(const k of tiles.keys())s.seen.add(k);
 assert.equal(paintLight(ctx,view(NOON),makeCanvas),false);assert.equal(drawn.length,0);
 assert.equal(paintLight(ctx,view(MIDNIGHT),makeCanvas),true);assert.equal(drawn.length,1);
 assert.ok(Math.abs(ctx.alpha-.3)<1e-12,'full night draws at the full pool alpha');
 // A fire burns by day too, and still nothing is drawn: daylight drowns it.
 const fire=scene(NOON,[{kind:'campfire',x:10,y:10,z:0}]).s;
 assert.equal(lightSources(fire.props,NOON).length,1,'the premise: the fire is lit at noon');
 for(const k of litTiles(fire,MIDNIGHT,0).keys())fire.seen.add(k);
 assert.equal(paintLight(ctx,{...view(NOON),state:fire},makeCanvas),false);
 // The light map covers the lit tiles plus a dark border of one.
 const map=lightMap(tiles,makeCanvas);assert.equal(map.x0,Math.min(...[...tiles.keys()].map(k=>+k.split(',')[0]))-1);
});

// Review round 1.

test('the world rechecks detection as the light changes, with nobody moving', () => {
 // 05:25: daylight is 0.39, so Yakov is seen from about 33 tiles, and the goat is 37 away. By 05:50 it is
 // 0.97 and 58 tiles. Nobody moves; only the clock does.
 const m = blankMap(); m.time = {startMinutes: 325};
 m.guards = [{x: 40, y: 4, z: 0, species: 'goat', weapon: 'pistol', heading: 180}];
 const world = createWorld(parseMap(JSON.stringify(m))), s = currentMap(world), goat = s.units.find(u => u.team === 'guard');
 const where = () => s.units.map(u => [u.x, u.y]), before = where();
 assert.equal(s.detected.size, 0); assert.ok(!goat.alert, 'unseen and unaware at 05:25');
 for (let i = 0; i < 25; i++) tickWorld(world, 1000);
 assert.equal(Math.round(world.clock.minutes), 350);
 assert.deepEqual(where(), before, 'nobody moved');
 assert.equal(s.detected.size, 1, 'the squad sees the goat at dawn');
 assert.ok(goat.alert, 'and the goat has seen the squad');
 // The epoch changes every minute while daylight eases, and not otherwise: 06:00 ends the dawn (easing to
 // day), and the lamps' own switch at 06:00 and 18:00 falls in full daylight, where it changes no one's light.
 assert.notEqual(lightEpoch(325), lightEpoch(326));
 assert.equal(lightEpoch(600), lightEpoch(900)); assert.equal(lightEpoch(1250), lightEpoch(1400));
 assert.notEqual(lightEpoch(359), lightEpoch(360));
});

test('travel hands the new map the same clock', () => {
 const world = createWorld(parseMap(JSON.stringify(blankMap()))), s = currentMap(world), exit = world.definitions.factory.exits[0];
 let i = 0; for (const u of s.units.filter(u => u.team === 'squad')) { u.x = exit.x + (i % 2); u.y = exit.y + Math.floor(i / 2); i++; }
 assert.equal(travel(world, 'yard').ok, true);
 assert.equal(world.states.yard.clock, world.clock);
});

test('at night the chance of noticing and the glimpse lobe shrink with the light too', () => {
 // detectionChance is .95 - .5 x distance / range: with the range cut, a visible target is harder to notice.
 const noon = scene(NOON), dark = scene(MIDNIGHT), lit = scene(MIDNIGHT, [{kind: 'floor-lamp', x: 5, y: 4, z: 0}]);
 for (const t of [noon, dark, lit]) t.guard.x = 13;
 assert.ok(Math.abs(detectionChance(noon.s, noon.guard, noon.yakov) - (.95 - .5 * 10 / 60)) < 1e-12);
 assert.ok(Math.abs(detectionChance(dark.s, dark.guard, dark.yakov) - (.95 - .5 * 10 / 15)) < 1e-12);
 assert.equal(detectionChance(lit.s, lit.guard, lit.yakov), detectionChance(noon.s, noon.guard, noon.yakov));
 // A goat looking south sees Yakov, due west, at 90 degrees off its heading: outside the binocular core, so
 // it identifies out to 0.48 of the range but detects movement out to all of it. In the dark: 7.2 and 15.
 for (const t of [noon, dark, lit]) { t.guard.x = 15; t.guard.heading = 90; t.yakov.moved = true; }
 assert.equal(perceive(noon.s, noon.guard, noon.yakov), 2, 'noon: identified at 12');
 assert.equal(perceive(dark.s, dark.guard, dark.yakov), 1, 'dark: only glimpsed moving at 12');
 dark.yakov.moved = false; assert.equal(perceive(dark.s, dark.guard, dark.yakov), 0, 'and not at all standing still');
 // At 20 tiles the dark detect lobe (15) no longer reaches him, though the daylight one (60) would.
 for (const t of [noon, dark]) { t.guard.x = 23; t.yakov.moved = true; }
 assert.equal(perceive(noon.s, noon.guard, noon.yakov), 2, 'noon: identified at 20 (0.48 x 60 = 28.8)');
 assert.equal(perceive(dark.s, dark.guard, dark.yakov), 0, 'dark: not even glimpsed at 20');
 assert.equal(perceive(lit.s, lit.guard, lit.yakov), 2, 'lamplit: identified again');
});

test('light belongs to its floor: a lamp upstairs lights upstairs', () => {
 const m = blankMap();
 for (let y = 15; y <= 25; y++) for (let x = 15; x <= 25; x++) setTerrain(m, x, y, 1, 'floor');
 m.props = [{kind: 'floor-lamp', x: 20, y: 20, z: 1}];
 const s = createGame(1, parseMap(JSON.stringify(m)), false); s.clock = {minutes: MIDNIGHT};
 assert.equal(illuminationAt(s, {x: 22, y: 20, z: 1}), 1, 'beside it, upstairs');
 assert.equal(illuminationAt(s, {x: 22, y: 20, z: 0}), 0, 'below it, through the floor');
 const up = litTiles(s, MIDNIGHT, 1), down = litTiles(s, MIDNIGHT, 0);
 assert.equal(up.get('22,20').light, 1); assert.equal(down.size, 0, 'no pool drawn on the ground floor');
 // The fog filter reads the right floor's keys.
 const seen = new Set([tileKey(22, 20, 1)]);
 assert.deepEqual([...seenOnly(litTiles(s, MIDNIGHT, 1), seen, 1).keys()], ['22,20']);
});

test('opening a door lets the light through, for detection and for the drawing', () => {
 // A wall on the east edges of x = 12, with a closed wooden door at y = 10, and a lamp at (10, 10).
 const edges = Object.fromEntries(Array.from({length: 40}, (_, y) => [`e:12:${y}`, y === 10 ? 'door-wood-closed' : 'wall']));
 const {s} = scene(MIDNIGHT, [{kind: 'floor-lamp', x: 10, y: 10, z: 0}], edges);
 assert.equal(illuminationAt(s, {x: 14, y: 10, z: 0}), 0, 'shut: dark beyond the door');
 assert.ok(![...cachedTiles(s, MIDNIGHT, 0).keys()].some(k => +k.split(',')[0] > 12));
 // The engine opens doors without moving the revision; it calls forgetLight, as here.
 s.edges['e:12:10'] = 'doorway-concrete-open'; forgetLight(s);
 assert.equal(illuminationAt(s, {x: 14, y: 10, z: 0}), 1, 'open: lit through it');
 assert.ok(cachedTiles(s, MIDNIGHT, 0).has('14,10'), 'and drawn through it');
});

test('the drawn light is a standing body, and the pool eases in at dusk', () => {
 assert.equal(TORSO, 1.296);
 // Bulbs off the tile grid and at several heights, so a band edge can fall between two body heights.
 const props = [{kind: 'streetlight', x: 30, y: 30, z: 0}, {kind: 'standing-torch', x: 36, y: 33, z: 0}, {kind: 'campfire', x: 26, y: 36, z: 0}, {kind: 'streetlight-double', x: 33, y: 24, z: 0, rotated: true}];
 const {s} = scene(MIDNIGHT, props), tiles = litTiles(s, MIDNIGHT, 0);
 for (const [k, t] of tiles) { const [x, y] = k.split(',').map(Number); assert.equal(t.light, illuminationAt(s, {x, y, z: 0}, MIDNIGHT), k); }
 // Fires orange, electric lamps pale.
 assert.equal(tiles.get('26,36').color, 0xffae55); assert.equal(tiles.get('30,30').color, 0xffe5b2);
 // Dusk, 19:00: daylight is exactly half, and so is the pool.
 for (const k of tiles.keys()) s.seen.add(k);
 const ctx = {save() {}, restore() {}, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, clip() {}, transform() {}, drawImage() {}};
 const makeCanvas = (w, h) => ({width: w, height: h, getContext: () => ({createImageData: (w, h) => ({data: new Uint8ClampedArray(w * h * 4)}), putImageData() {}})});
 assert.equal(paintLight(ctx, {project: (x, y) => ({x, y}), zoom: 1, level: 0, state: s, minutes: 1140}, makeCanvas), true);
 assert.ok(Math.abs(ctx.globalAlpha - .15) < 1e-12, `alpha ${ctx.globalAlpha}`);
});

// Review round 2.

test('a blast that destroys a crate lets the fire light the ground behind it, drawn and detected', async () => {
 const {detonate} = await import('../dist/tactics/explosives.js');
 const {WEAPONS} = await import('../dist/tactics/engine.js');
 const m = blankMap(); m.props = [{kind: 'campfire', x: 6, y: 10, z: 0}]; setTerrain(m, 7, 10, 0, 'crate');
 const s = createGame(1, parseMap(JSON.stringify(m)), false); s.clock = {minutes: MIDNIGHT};
 const row = () => [8, 9, 10].map(x => [cachedTiles(s, MIDNIGHT, 0).get(x + ',10')?.light ?? 0, illuminationAt(s, {x, y: 10, z: 0}, MIDNIGHT)]);
 assert.deepEqual(row(), [[0, 0], [0, 0], [0, 0]], 'the crate shadows the low fire');
 const blast = detonate(s, {x: 9.4, y: 10, h: .08, z: 0}, WEAPONS.grenade);
 assert.ok(blast, 'the premise: the grenade went off');
 // What engine.js does after a blast: the ground changed, so every bulb is redone.
 forgetLight(s, true);
 assert.deepEqual(row(), [[1, 1], [1, 1], [1, 1]], 'lit, and drawn lit');
});

test('replacing the props redoes the drawn light', () => {
 const {s} = scene(MIDNIGHT, [{kind: 'campfire', x: 10, y: 10, z: 0}]);
 assert.equal(cachedTiles(s, MIDNIGHT, 0).get('12,10').light, 1);
 // A crate beside the fire: a new props array and a new revision, as a map change would bring.
 s.props = [...s.props, {kind: 'crate-wood', x: 11, y: 10, z: 0}]; s.revision = (s.revision || 0) + 1;
 const now = illuminationAt(s, {x: 12, y: 10, z: 0}, MIDNIGHT);
 assert.ok(now < 1, 'the premise: the crate shadows (12, 10) from the fire');
 assert.equal(cachedTiles(s, MIDNIGHT, 0).get('12,10')?.light ?? 0, now);
});

test('a door far from one lamp still redoes that lamp, where its light meets another pool', () => {
 // Lamp A at (10, 10), lamp B at (32, 10), a wall on the east edges of x = 20 with a door at y = 10. Tile
 // (23, 10) is 9 from B (half light) and 13 from A through the doorway (a quarter): the door is 10 from A.
 const edges = Object.fromEntries(Array.from({length: 40}, (_, y) => [`e:20:${y}`, y === 10 ? 'door-wood-closed' : 'wall']));
 const {s} = scene(MIDNIGHT, [{kind: 'floor-lamp', x: 10, y: 10, z: 0}, {kind: 'floor-lamp', x: 32, y: 10, z: 0}], edges);
 assert.equal(cachedTiles(s, MIDNIGHT, 0).get('23,10').light, .5, 'only B, while the door is shut');
 s.edges['e:20:10'] = 'doorway-concrete-open'; forgetLight(s);
 assert.equal(illuminationAt(s, {x: 23, y: 10, z: 0}), .75, 'the premise: A reaches it through the doorway');
 assert.equal(cachedTiles(s, MIDNIGHT, 0).get('23,10').light, .75, 'and the drawing redid A');
});

test('a notice roll that failed in the dark succeeds as the light comes up, with nobody moving', () => {
 // A goat 7 tiles from Yakov, looking at him, from 04:50 to 06:10. In the dark its chance of noticing is
 // .717; in daylight .892. Its one draw for this stamp falls between the two (the premise, checked below),
 // so it fails at night and must succeed by sunrise, without anyone moving and without a fresh roll.
 const start = (minutes) => {
  const m = blankMap(); m.time = {startMinutes: minutes};
  m.guards = [{x: 10, y: 4, z: 0, species: 'goat', weapon: 'pistol', heading: 180}];
  const world = createWorld(parseMap(JSON.stringify(m))), s = currentMap(world);
  return {world, s, goat: s.units.find(u => u.team === 'guard'), yakov: s.units.find(u => u.team === 'squad' && u.x === 3 && u.y === 4)};
 };
 const dawn = start(290);
 assert.ok(!dawn.goat.alert, 'the premise: in the dark the roll failed');
 const record = dawn.goat.noticed?.[dawn.yakov.id];
 assert.ok(record && record.draw > detectionChance(dawn.s, dawn.goat, dawn.yakov), 'the premise: the draw is above the dark chance');
 const before = JSON.stringify(dawn.s.units.map(u => [u.x, u.y]));
 for (let i = 0; i < 80; i++) tickWorld(dawn.world, 1000);
 assert.equal(JSON.stringify(dawn.s.units.map(u => [u.x, u.y])), before, 'nobody moved');
 assert.ok(record.draw < detectionChance(dawn.s, dawn.goat, dawn.yakov), 'the premise: and below the daylight one');
 assert.ok(dawn.goat.alert, 'by 06:10 the goat has noticed him');
 // Control: the same map opened at 06:10.
 assert.ok(start(370).goat.alert);
});
