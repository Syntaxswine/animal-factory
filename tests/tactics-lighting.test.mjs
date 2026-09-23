import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {decodePNG} from '../tools/png-rgba.mjs';
import {drawnProp} from '../tools/drawn-size.mjs';
import {GROUPS} from '../tools/bake-scenery.mjs';
import {PROPS as LIGHTING,DEFERRED,FOLDER} from '../dist/tactics/environment-props-lighting.js';
import {GROUP_PROP_ART} from '../dist/tactics/prop-art-lighting.js';
import {PROPS,propCells,propBlocks,propTall} from '../dist/tactics/environment.js';
import {blankMap,parseMap} from '../dist/tactics/maps.js';
import {createEditor,applyBrush} from '../dist/tactics/editor-model.js';
import {createGame,walkable} from '../dist/tactics/engine.js';

// Parcel B: seven light fixtures baked out of the 3D branch and registered by a contact shadow.
// See docs/tactics/LIGHTING.md.

// The 3D branch's rules, copied from its light-sources.js and core/environment.js at ec13c4a rather than
// derived: LIGHT_PROPS is {w,h,solid:!wall,cover:kind==='bedside-table-lamp'?25:0}, merged into PROPS.
const THREE_D={
 'floor-lamp':[1,1,0],'bedside-table-lamp':[1,1,25],'streetlight':[1,1,0],'streetlight-double':[2,1,0],
 'standing-torch':[1,1,0],'campfire':[1,1,0],'cooking-fire':[2,2,0]
};

test('the fixtures carry the 3D branch rules exactly, and none of them blocks sight',()=>{
 assert.deepEqual(Object.keys(LIGHTING).sort(),Object.keys(THREE_D).sort());
 for(const [kind,[w,h,cover]] of Object.entries(THREE_D)){
  const r=PROPS[kind];
  assert.ok(r,`${kind} is registered in the shared catalogue`);
  assert.deepEqual([r.w,r.h,r.cover,r.solid],[w,h,cover,true],kind);
  // `tall` is what makes a prop block line of sight here (visibility.js). A lamp post must not.
  assert.equal(r.tall,undefined,`${kind} would block sight`);
 }
 assert.equal(FOLDER,'lighting');
});

test('every form the baker knows for this group is either shipped or deferred with a reason',()=>{
 const shipped=Object.keys(LIGHTING),deferred=Object.keys(DEFERRED);
 assert.deepEqual([...shipped,...deferred].sort(),[...GROUPS.lighting.forms].sort());
 assert.equal(shipped.filter(k=>deferred.includes(k)).length,0);
 for(const [kind,why] of Object.entries(DEFERRED)){
  assert.match(why,/open question \d/,kind);
  assert.equal(PROPS[kind],undefined,`${kind} is deferred but registered`);
 }
});

const png=kind=>{const g=decodePNG(readFileSync(new URL('../dist/assets/environment/'+GROUP_PROP_ART[kind].file,import.meta.url)));return g;};

test('each sprite is registered by its own pixels: the crop bottom is the shadow, centred on the footprint',()=>{
 for(const kind of Object.keys(LIGHTING)){
  const {width,height,pixels}=png(kind),[x0,y0,x1,y1]=GROUP_PROP_ART[kind].crop;
  assert.deepEqual([width,height],[1254,1254],kind);
  // The renderer plants the crop's bottom centre at the anchor. For that to put the model on its
  // footprint centre, the crop has to be exactly the shadow ellipse: its bottom row the ellipse's
  // lowest point, its left and right edges the ellipse's. (The lowest point itself is off-centre on a
  // 2 x 1 -- the ellipse is long along x -- so it is the extent, not that point, that must be centred.)
  // Read it off the shipped PNG, not off the tool that made it.
  const shadow=[0x13,0x24,0x1d,0x48],isShadow=i=>shadow.every((v,c)=>pixels[i+c]===v);
  let sx0=Infinity,sx1=-Infinity,bottom=0;
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const i=(y*width+x)*4;if(isShadow(i)){sx0=Math.min(sx0,x);sx1=Math.max(sx1,x+1);}}
  for(let x=x0;x<x1;x++){const i=((y1-1)*width+x)*4;if(pixels[i+3]>=64){assert.ok(isShadow(i),`${kind}: the bottom row is not the contact shadow at x=${x}`);bottom++;}}
  assert.ok(bottom>0,kind);
  assert.deepEqual([sx0,sx1],[x0,x1],`${kind}: the model is wider than its shadow, so the crop is not centred on the footprint`);
  // And nothing opaque below the crop the catalogue records.
  for(let y=y1;y<height;y++)for(let x=0;x<width;x++)assert.ok(pixels[(y*width+x)*4+3]<64,`${kind}: stray pixel at ${x},${y}`);
 }
});

test('the renderer draws each at the baked scale, and both box sides agree on it',()=>{
 for(const [kind,r] of Object.entries(LIGHTING)){
  const [x0,y0,x1,y1]=GROUP_PROP_ART[kind].crop,sw=r.visualWidth/(x1-x0),sh=r.visualHeight/(y1-y0);
  // Rounding visualWidth and visualHeight to whole pixels is the only disagreement allowed.
  assert.ok(Math.abs(sw-sh)/sh<.02,`${kind}: width says ${sw.toFixed(5)}, height says ${sh.toFixed(5)}`);
  const d=drawnProp(kind);
  assert.ok(Math.abs(d.drawn[0]-r.visualWidth)<1&&Math.abs(d.drawn[1]-r.visualHeight)<1,`${kind}: drawn ${d.drawn}`);
 }
 // Two scale checks against things a reader can see: a standing animal is 59 px tall at zoom 1, and a
 // floor lamp is a little taller than that; a streetlight is nearly twice it.
 assert.ok(LIGHTING['floor-lamp'].visualHeight>59&&LIGHTING['floor-lamp'].visualHeight<90);
 assert.ok(LIGHTING.streetlight.visualHeight>100);
});

test('placed, exported, reloaded and walked into in both orientations, with a 3D light mode riding along',()=>{
 const e=createEditor(blankMap());let x=4;
 for(const kind of Object.keys(LIGHTING))for(const rotated of [false,true]){
  assert.equal(applyBrush(e,'prop',x,8,null,{propKind:kind,rotated}),'',kind);x+=3;
 }
 // The 3D editor writes lightMode onto a fixture it places. A map from there must still load here.
 const raw=JSON.parse(JSON.stringify(e.map));
 for(const p of raw.props)p.lightMode='on';
 const map=parseMap(JSON.stringify(raw)),game=createGame(1,map,false);
 assert.equal(map.props.length,Object.keys(LIGHTING).length*2);
 // And it survives the trip: parcel I will read it, and a round trip through this editor must not strip it.
 assert.ok(map.props.every(p=>p.lightMode==='on'),'lightMode was dropped on load');
 for(const p of map.props){
  const r=PROPS[p.kind],cells=propCells(p);
  assert.equal(cells.length,r.w*r.h,p.kind);
  for(const c of cells){
   assert.equal(walkable(game,c.x,c.y,c.z),false,`${p.kind} blocks its tile`);
   assert.equal(propBlocks(map,c.x,c.y,c.z),true);
   assert.equal(propTall(map,c.x,c.y,c.z),false,`${p.kind} would hide what is behind it`);
  }
 }
 // A wall fixture from the 3D branch is still an unknown kind here: open question 5, not a silent drop.
 const withTorch=blankMap();withTorch.props=[{kind:'wall-torch',x:3,y:3,z:0}];
 assert.throws(()=>parseMap(JSON.stringify(withTorch)),/Invalid environment props/);
});
