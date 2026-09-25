// Artificial light on the map at night. Parcel I of docs/tactics/SCENERY-PORT-HANDOFF.md; see
// docs/tactics/ARTIFICIAL-LIGHTING.md.
//
// The light is not a picture of light, it is the tactical rule drawn: every tile gets the same lampStrength
// sum detection uses, from the same bulbs, through the same walls, at the torso of a STANDING body (1.296
// tiles up). A kneeling or prone body sits lower and can be shadowed where a standing one is not; the
// drawing shows the standing case. Each tile becomes one pixel of a small light map, drawn through the
// isometric transform with smoothing, so a pool is soft but still stops at a wall.
import {daylightStrength} from './daylight.js';
import {lightSources,lampStrength,LIGHT_RANGE} from './light-sources.js';
import {targetHeight} from './projectiles.js';
import {inBounds,tileKey,W,H} from './maps.js';

const FLOOR_HEIGHT=3;
export const TORSO=targetHeight({},'torso');
// Tiles are drawn out to fifteen from a bulb: the first three bands, 100%, 50% and 25% (12.5% where the
// bulb's height carries a ray just past fifteen). Each one is lit by every bulb out to thirty, as detection is.
export const POOL_REACH=15;
// The strongest tint, at full night on a fully lit tile.
export const POOL_ALPHA=.3;
const rgb=c=>[c>>16&255,c>>8&255,c&255];
const bulbKey=l=>`${l.x},${l.y},${l.h}`;

// One bulb's light on one level: Map of "x,y" -> strength, for every tile within LIGHT_RANGE that it reaches.
// The inBounds check only saves work: a ray from off the map is refused by the trace anyway.
export function bulbTiles(s,lamp,level){
 const out=new Map();
 for(let y=Math.floor(lamp.y-LIGHT_RANGE);y<=Math.ceil(lamp.y+LIGHT_RANGE);y++)for(let x=Math.floor(lamp.x-LIGHT_RANGE);x<=Math.ceil(lamp.x+LIGHT_RANGE);x++){
  if(Math.hypot(x-lamp.x,y-lamp.y)>LIGHT_RANGE||!inBounds(x,y,level))continue;
  const l=lampStrength(s,lamp,{x,y,h:level*FLOOR_HEIGHT+TORSO});if(l>0)out.set(x+','+y,l);
 }
 return out;
}

// Light per tile on one level: Map of "x,y" -> {light, color}, for tiles within POOL_REACH of a bulb on this
// level, lit by every bulb (any level) that reaches them. The colour is the strongest bulb's: fires orange,
// electric lamps pale. `perBulb` supplies each bulb's tiles (cached by the caller); by default computed.
export function litTiles(s,minutes,level,perBulb=lamp=>bulbTiles(s,lamp,level)){
 const lamps=lightSources(s.props,minutes),tiles=new Map(),maps=lamps.map(perBulb);
 const candidates=new Set();
 for(const lamp of lamps){
  if(Math.floor(lamp.h/FLOOR_HEIGHT+1e-9)!==level)continue;
  for(let y=Math.floor(lamp.y-POOL_REACH);y<=Math.ceil(lamp.y+POOL_REACH);y++)for(let x=Math.floor(lamp.x-POOL_REACH);x<=Math.ceil(lamp.x+POOL_REACH);x++)
   if(Math.hypot(x-lamp.x,y-lamp.y)<=POOL_REACH&&inBounds(x,y,level))candidates.add(x+','+y);
 }
 for(const k of candidates){
  let light=0,best=0,color=0;
  lamps.forEach((lamp,i)=>{const l=maps[i].get(k)||0;light+=l;if(l>best){best=l;color=lamp.color;}});
  if(light>0)tiles.set(k,{light:Math.min(1,light),color});
 }
 return tiles;
}

// Only ground the squad has seen is lit on screen: light on an unexplored tile would give the lamp away.
export function seenOnly(tiles,seen,level){
 if(!seen)return tiles;
 for(const k of [...tiles.keys()]){const [x,y]=k.split(',').map(Number);if(!seen.has(tileKey(x,y,level)))tiles.delete(k);}
 return tiles;
}

// The light map: one pixel per tile, premultiplied by how lit it is, over the bounding rectangle of the lit
// tiles plus a dark border of one, so smoothing fades each pool out instead of clipping it.
export function lightMap(tiles,makeCanvas){
 if(!tiles.size)return null;
 let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
 for(const k of tiles.keys()){const [x,y]=k.split(',').map(Number);x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
 x0--;y0--;x1++;y1++;
 const w=x1-x0+1,h=y1-y0+1,canvas=makeCanvas(w,h),g=canvas.getContext('2d'),image=g.createImageData(w,h);
 for(const [k,t] of tiles){const [x,y]=k.split(',').map(Number),i=((y-y0)*w+(x-x0))*4,[r,gr,b]=rgb(t.color);image.data.set([r,gr,b,Math.round(255*t.light)],i);}
 g.putImageData(image,0,0);
 return {canvas,x0,y0};
}

// Caches, per state and level. Each bulb's tiles are the expensive part, a trace per tile, and depend only on
// the solids between: walls, doors, props. Animals are left out of the trace, so moving never recomputes.
// The edges are compared whenever the revision or s.lightVersion (bumped by the engine's forgetLight) moves;
// only bulbs within reach of a changed edge are redone, so a door across the map costs nothing. The drawn
// map is cheap and is rebuilt when the tiles change or more ground has been seen, which is every step while
// exploring.
const cache=new WeakMap();
function changedEdgeCells(before,after){
 const cells=[];
 for(const k of new Set([...Object.keys(before),...Object.keys(after)]))if(before[k]!==after[k]){const [,x,y]=k.split(':');cells.push([Number(x),Number(y)]);}
 return cells;
}
export function cachedTiles(s,minutes,level){
 let byLevel=cache.get(s);if(!byLevel){byLevel=new Map();cache.set(s,byLevel);}
 let entry=byLevel.get(level);if(!entry){entry={bulbs:new Map(),edges:{},props:null};byLevel.set(level,entry);}
 const lamps=lightSources(s.props,minutes),keys=lamps.map(bulbKey).join(';'),edges=s.edges||{};
 if(entry.revision===s.revision&&entry.lightVersion===s.lightVersion&&entry.keys===keys&&entry.tiles)return entry.tiles;
 if(entry.props!==s.props){entry.bulbs.clear();entry.props=s.props;}
 const changed=changedEdgeCells(entry.edges,edges);
 if(changed.length)for(const [k,lamp] of [...entry.bulbs])if(changed.some(([x,y])=>Math.hypot(x-lamp.x,y-lamp.y)<=LIGHT_RANGE+2))entry.bulbs.delete(k);
 let recomputed=!!changed.length||entry.keys!==keys;
 const perBulb=lamp=>{const k=bulbKey(lamp);let b=entry.bulbs.get(k);if(!b){b={x:lamp.x,y:lamp.y,tiles:bulbTiles(s,lamp,level)};entry.bulbs.set(k,b);recomputed=true;}return b.tiles;};
 const tiles=litTiles(s,minutes,level,perBulb);
 if(recomputed||!entry.tiles){entry.tiles=tiles;entry.map=undefined;}
 entry.edges={...edges};entry.keys=keys;entry.revision=s.revision;entry.lightVersion=s.lightVersion;
 return entry.tiles;
}
function cachedMap(s,minutes,level,makeCanvas){
 const tiles=cachedTiles(s,minutes,level),entry=cache.get(s).get(level),seen=s.seen?.size??0;
 if(entry.map===undefined||entry.seen!==seen||entry.mapTiles!==tiles){entry.seen=seen;entry.mapTiles=tiles;entry.map=lightMap(seenOnly(new Map(tiles),s.seen,level),makeCanvas);}
 return entry.map;
}

// Draw the viewed layer's light, over the finished scene and its night wash, under the interface. Nothing by
// day, full strength at night, eased through dawn and dusk. app.js calls it straight after paintDaylight.
export function paintLight(ctx,{project,zoom,level,state,minutes},makeCanvas){
 const dark=1-daylightStrength(minutes);if(dark<=.001||!state)return false;
 const map=cachedMap(state,minutes,level,makeCanvas);if(!map)return false;
 // Map pixel (u, v) is tile (x0 + u - .5, y0 + v - .5): a tile's middle sits on its pixel's middle.
 const o=project(map.x0-.5,map.y0-.5),a=28*zoom,b=14*zoom;
 ctx.save();
 // Smoothing reaches half a tile past the last lit one; keep that on the map, never over the void around it.
 const corners=[[-.5,-.5],[W-.5,-.5],[W-.5,H-.5],[-.5,H-.5]].map(([x,y])=>project(x,y));
 ctx.beginPath();corners.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.clip();
 ctx.globalCompositeOperation='lighter';ctx.globalAlpha=POOL_ALPHA*dark;ctx.imageSmoothingEnabled=true;
 ctx.transform(a,b,-a,b,o.x,o.y);ctx.drawImage(map.canvas,0,0);ctx.restore();
 return true;
}
