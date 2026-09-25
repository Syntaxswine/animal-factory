import test from 'node:test';
import assert from 'node:assert/strict';
import {LIGHT_FORMS,LIGHT_RANGE,lightBrightness,lightEnabled,placedEmitters,lightSources,illuminationAt,lampStrength,lampLight,stateMinutes,sightScale,DARK_SIGHT} from '../dist/tactics/light-sources.js';
import {litTiles,seenOnly,paintLight,lightMap,POOL_REACH} from '../dist/tactics/light-render.js';
import {blankMap,parseMap,tileKey} from '../dist/tactics/maps.js';
import {createEditor,applyBrush} from '../dist/tactics/editor-model.js';
import {createGame,perceive,litSightRange,sightRange} from '../dist/tactics/engine.js';
import {createWorld,advanceTime} from '../dist/tactics/world.js';

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
