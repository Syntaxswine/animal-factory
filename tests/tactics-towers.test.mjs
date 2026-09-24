import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {decodePNG} from '../tools/png-rgba.mjs';
import {drawnProp} from '../tools/drawn-size.mjs';
import {PROPS as TOWERS,FOLDER} from '../dist/tactics/environment-props-towers.js';
import {GROUP_PROP_ART} from '../dist/tactics/prop-art-towers.js';
import {PROPS,propCells,propBlocks,propTall} from '../dist/tactics/environment.js';
import {blankMap,parseMap} from '../dist/tactics/maps.js';
import {createEditor,applyBrush} from '../dist/tactics/editor-model.js';
import {createGame,walkable} from '../dist/tactics/engine.js';
import {seeThroughAlpha,SEE_THROUGH_ALPHA} from '../dist/tactics/see-through.js';

// Parcel C: three guard towers and the spotlight, baked out of the 3D branch and planted by the footprint
// centre the bake recorded. See docs/tactics/TOWERS.md.

// The 3D branch's rules, copied from its light-sources.js and core/environment.js at b23334c rather than
// derived: LIGHT_FORMS gives w and h, LIGHT_PROPS makes each {w,h,solid:!wall,cover:0}, merged into PROPS.
const THREE_D={'wooden-spotlight-tower':[5,5],'iron-searchlight-stair-tower':[6,5],'iron-searchlight-ladder-tower':[6,5],'spotlight':[1,1]};
const MANIFEST=JSON.parse(readFileSync(new URL('../dist/assets/environment/manifest-towers.json',import.meta.url),'utf8'));
const source=kind=>MANIFEST.assets.find(a=>a.id===kind).source;
const png=kind=>decodePNG(readFileSync(new URL('../dist/assets/environment/'+GROUP_PROP_ART[kind].file,import.meta.url)));

test('the towers carry the 3D branch rules exactly: solid, no cover, not tall; only the towers see through',()=>{
 assert.deepEqual(Object.keys(TOWERS).sort(),Object.keys(THREE_D).sort());
 for(const [kind,[w,h]] of Object.entries(THREE_D)){
  const r=PROPS[kind];
  assert.ok(r,`${kind} is registered in the shared catalogue`);
  assert.deepEqual([r.w,r.h,r.cover,r.solid],[w,h,0,true],kind);
  // `tall` is what makes a prop block line of sight here. It is not set there either.
  assert.equal(r.tall,undefined,`${kind} would block sight`);
 }
 assert.deepEqual(Object.keys(TOWERS).filter(k=>TOWERS[k].seeThrough).sort(),
  ['iron-searchlight-ladder-tower','iron-searchlight-stair-tower','wooden-spotlight-tower']);
 assert.equal(FOLDER,'towers');
});

// A stand-in for the browser: an image that is always loaded, and a context that records what it is told.
globalThis.Image??=class{constructor(){this.complete=true;this.naturalWidth=1254;this.naturalHeight=1254;}set src(v){this._src=v;}};
const {environmentRenderer,propScreenBox}=await import('../dist/tactics/environment-renderer.js');
function recorder(){
 const calls=[];let m=[1,0,0,1,0,0];const stack=[];
 return {calls,save(){stack.push(m.slice());},restore(){m=stack.pop();},
  translate(x,y){m=[m[0],m[1],m[2],m[3],m[4]+m[0]*x+m[2]*y,m[5]+m[1]*x+m[3]*y];},
  scale(a,b){m=[m[0]*a,m[1]*a,m[2]*b,m[3]*b,m[4],m[5]];},
  drawImage(img,sx,sy,sw,sh,dx,dy,dw,dh){calls.push({m:m.slice(),s:[sx,sy,sw,sh],d:[dx,dy,dw,dh]});}};
}
// Where a source pixel lands on screen, from what the renderer drew.
const lands=(c,[px,py])=>{const u=c.d[0]+(px-c.s[0])*c.d[2]/c.s[2],v=c.d[1]+(py-c.s[1])*c.d[3]/c.s[3];return [c.m[0]*u+c.m[2]*v+c.m[4],c.m[1]*u+c.m[3]*v+c.m[5]];};
const zoom=1.15,project=(x,y,z=0)=>({x:400+(x-y)*28*zoom,y:120+(x+y)*14*zoom-z*zoom});

test('the renderer plants each tower by its recorded footprint centre, exactly, in both orientations',()=>{
 const art=environmentRenderer();
 for(const kind of Object.keys(TOWERS))for(const rotated of [false,true]){
  const c=recorder(),p={kind,x:7,y:3,z:0,rotated};
  assert.equal(art.prop(c,project,zoom,p),true,kind);
  const r=PROPS[kind],w=rotated?r.h:r.w,h=rotated?r.w:r.h,q=project(p.x+(w-1)/2,p.y+(h-1)/2);
  // Every tile's middle sits (dx - dy) * 28 across and (dx + dy) * 14 down from the next; the footprint
  // centre is the middle of the rectangle of tiles. The recorded foot must land there to the rounding.
  const [sx,sy]=lands(c.calls[0],GROUP_PROP_ART[kind].foot);
  assert.ok(Math.abs(sx-q.x)<1e-9&&Math.abs(sy-q.y)<1e-9,`${kind}${rotated?' rotated':''}: foot lands ${(sx-q.x).toFixed(3)}, ${(sy-q.y).toFixed(3)} off`);
  // The screen box the see-through test uses is the box that was drawn.
  const b=propScreenBox(project,zoom,p),[ax,ay]=lands(c.calls[0],GROUP_PROP_ART[kind].crop.slice(0,2)),[bx,by]=lands(c.calls[0],GROUP_PROP_ART[kind].crop.slice(2));
  assert.ok(Math.abs(b.x-Math.min(ax,bx))<1e-9&&Math.abs(b.x+b.w-Math.max(ax,bx))<1e-9&&Math.abs(b.y-ay)<1e-9&&Math.abs(b.y+b.h-by)<1e-9,`${kind}: screen box`);
 }
});

test('a sprite without a recorded foot is drawn exactly as before the field existed',()=>{
 // The old rule, written out: the crop's bottom middle goes (w + h) * 5 below the footprint centre.
 const art=environmentRenderer();
 for(const kind of ['crate-wood','barrel-single','tree-pine','workbench-vise'])for(const rotated of [false,true]){
  const c=recorder(),p={kind,x:4,y:9,z:0,rotated},r=PROPS[kind];
  if(!art.prop(c,project,zoom,p))continue;
  const w=rotated?r.h:r.w,h=rotated?r.w:r.h,q=project(p.x+(w-1)/2,p.y+(h-1)/2),{s:[x0,y0,cw,ch],d}=c.calls[0];
  const [bx,by]=lands(c.calls[0],[x0+cw/2,y0+ch]);
  assert.ok(Math.abs(bx-q.x)<1e-9&&Math.abs(by-(q.y+(w+h)*5*zoom))<1e-9,`${kind}: moved`);
  assert.ok(Math.abs(d[2]/cw-d[3]/ch)<1e-12,`${kind}: stretched`);
 }
});

test('the recorded footprint centre agrees with the pixels',()=>{
 for(const kind of Object.keys(TOWERS)){
  const {width,height,pixels}=png(kind),{footCentre:[fx,fy],gameScale:gs}=source(kind),r=TOWERS[kind];
  assert.deepEqual([width,height],[1254,1254],kind);
  assert.deepEqual(GROUP_PROP_ART[kind].foot,[fx,fy],`${kind}: the catalogue carries the manifest's foot`);
  // The model stands inside its footprint diamond: corners (w + h) / 2 * 28 game px either side of the
  // centre, and (w + h) / 2 * 14 below it. A foot in the wrong place pushes the model out of it.
  const [x0,,x1,y1]=GROUP_PROP_ART[kind].crop,half=(r.w+r.h)/2,slack=1.5/gs;
  assert.ok(x0>=fx-half*28/gs-slack&&x1<=fx+half*28/gs+slack,`${kind}: wider than its footprint`);
  assert.ok(y1<=fy+half*14/gs+slack,`${kind}: stands ${((y1-fy)*gs-half*14).toFixed(1)} px below its front corner`);
  // Nothing opaque outside the crop the catalogue records.
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(y<GROUP_PROP_ART[kind].crop[1]||y>=y1||x<x0||x>=x1)
   assert.ok(pixels[(y*width+x)*4+3]<64,`${kind}: stray pixel at ${x},${y}`);
 }
 // Sharper, where the model allows it: the wooden tower is square and symmetric, so its front leg stands
 // straight below the footprint centre on screen. The lowest band of solid pixels is that leg.
 const {width,pixels}=png('wooden-spotlight-tower'),{footCentre:[fx],gameScale:gs}=source('wooden-spotlight-tower');
 let bottom=-1;for(let i=3;i<pixels.length;i+=4)if(pixels[i]>=250)bottom=Math.max(bottom,Math.floor((i>>2)/width));
 let n=0,sx=0;for(let y=bottom-12;y<=bottom;y++)for(let x=0;x<width;x++)if(pixels[(y*width+x)*4+3]>=250){n++;sx+=x+.5;}
 assert.ok(Math.abs((sx/n-fx)*gs)<.25,`wooden front leg ${((sx/n-fx)*gs).toFixed(2)} px off the recorded centre`);
});

test('the renderer draws each at the baked scale',()=>{
 for(const [kind,r] of Object.entries(TOWERS)){
  const [x0,y0,x1,y1]=GROUP_PROP_ART[kind].crop,d=drawnProp(kind),{gameScale}=source(kind),scale=d.drawn[0]/(x1-x0);
  // Both box sides say the same scale, so neither binds early; rounding to whole pixels is all they differ by.
  const sw=r.visualWidth/(x1-x0),sh=r.visualHeight/(y1-y0);
  assert.ok(Math.abs(sw-sh)/sh<.02,`${kind}: width says ${sw.toFixed(5)}, height says ${sh.toFixed(5)}`);
  const bound=.5/(Math.min(r.visualWidth,r.visualHeight)-.5);
  assert.ok(Math.abs(scale/gameScale-1)<=bound,`${kind}: drawn at ${(scale/gameScale*100).toFixed(2)}% of the baked scale`);
 }
 // Against things a reader can see: a standing animal is 59 px tall at zoom 1, a tower six or seven times
 // that, and the spotlight's pole nearly twice it.
 for(const kind of ['wooden-spotlight-tower','iron-searchlight-stair-tower','iron-searchlight-ladder-tower'])
  assert.ok(TOWERS[kind].visualHeight>350&&TOWERS[kind].visualHeight<420,kind);
 assert.ok(TOWERS.spotlight.visualHeight>100&&TOWERS.spotlight.visualHeight<120);
});

test('a tower fades while the player looks behind it, and only then',()=>{
 const box={x:100,y:0,w:280,h:363},cells=propCells({kind:'wooden-spotlight-tower',x:10,y:10,z:0});
 const at=(x,y,tile)=>[{x,y,tile}];
 // The cursor over the tower's cabin points at ground far behind it.
 assert.equal(seeThroughAlpha(box,cells,at(240,80,{x:6,y:5})),SEE_THROUGH_ALPHA);
 // Over the tower, but at a tile in front of it: nothing hidden, no fade.
 assert.equal(seeThroughAlpha(box,cells,at(240,350,{x:15,y:16})),1);
 // At the tower's own footprint: that is the tower, not something behind it.
 assert.equal(seeThroughAlpha(box,cells,at(240,340,{x:12,y:12})),1);
 // Behind it, but the cursor is not over the sprite.
 assert.equal(seeThroughAlpha(box,cells,at(60,80,{x:6,y:5})),1);
 // Beside a front face, where the sprite paints over what stands there: fade too.
 assert.equal(seeThroughAlpha(box,cells,at(360,300,{x:15,y:12})),SEE_THROUGH_ALPHA);
 // Level with the front corner is not behind it: (15, 13) is outside the footprint and sorts with (14, 14).
 assert.equal(Math.max(...cells.map(c=>c.x+c.y)),15+13,'the fixture is level with the front corner');
 assert.equal(seeThroughAlpha(box,cells,at(360,300,{x:15,y:13})),1);
 // The selected animal behind it, with the cursor elsewhere entirely.
 assert.equal(seeThroughAlpha(box,cells,[{x:900,y:900,tile:{x:1,y:1}},{x:200,y:150,tile:{x:8,y:9}}]),SEE_THROUGH_ALPHA);
 // Nothing to look at, or nothing to fade.
 assert.equal(seeThroughAlpha(box,cells,[]),1);
 assert.equal(seeThroughAlpha(null,cells,at(240,80,{x:6,y:5})),1);
});

test('placed, exported, reloaded and walked into in both orientations, with the 3D fields riding along',()=>{
 const e=createEditor(blankMap());let x=4;
 for(const kind of Object.keys(TOWERS))for(const rotated of [false,true]){
  assert.equal(applyBrush(e,'prop',x,12,null,{propKind:kind,rotated}),'',kind);x+=kind==='spotlight'?2:7;
 }
 // The 3D editor writes lightMode, and a spotlight's sweep as lightTargets. Parcel J will read both.
 const raw=JSON.parse(JSON.stringify(e.map)),sweep=[{x:0,y:8,z:0},{x:4,y:8,z:0}];
 for(const p of raw.props){p.lightMode='auto';p.lightTargets=sweep;}
 const map=parseMap(JSON.stringify(raw)),game=createGame(1,map,false);
 assert.equal(map.props.length,Object.keys(TOWERS).length*2);
 assert.ok(map.props.every(p=>p.lightMode==='auto'&&JSON.stringify(p.lightTargets)===JSON.stringify(sweep)),'a 3D field was dropped on load');
 for(const p of map.props){
  const r=PROPS[p.kind],cells=propCells(p);
  assert.equal(cells.length,r.w*r.h,p.kind);
  for(const c of cells){
   assert.equal(walkable(game,c.x,c.y,c.z),false,`${p.kind} blocks its tile`);
   assert.equal(propBlocks(map,c.x,c.y,c.z),true);
   assert.equal(propTall(map,c.x,c.y,c.z),false,`${p.kind} would hide what is behind it from sight`);
  }
 }
 // The gap, pinned so it cannot change unnoticed: the 3D branch lets a guard start on a tower post (a
 // climber standing on top). Nobody climbs here, so that map is refused, by name, not loaded wrong.
 const posted=blankMap();posted.props=[{kind:'wooden-spotlight-tower',x:20,y:20,z:0}];
 const guard={x:21,y:21,z:0,species:'goat',weapon:'pistol',towerPost:{dx:-1,dy:-1,kind:'wooden-spotlight-tower'}};
 posted.guards=[guard];
 assert.throws(()=>parseMap(JSON.stringify(posted)),/Unit start needs a walkable floor at 21,21/);
 guard.x=30;guard.y=30;delete guard.towerPost;
 assert.doesNotThrow(()=>parseMap(JSON.stringify(posted)),'the same guard on open ground loads');
});
