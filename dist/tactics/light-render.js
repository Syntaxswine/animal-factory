// Artificial light on the map at night. Parcel I of docs/tactics/SCENERY-PORT-HANDOFF.md; see
// docs/tactics/ARTIFICIAL-LIGHTING.md.
//
// The light is not a picture of light, it is the tactical rule drawn: every tile gets the same
// lampStrength detection uses, from the same bulbs, through the same walls, at the height of a body's
// torso. So where the screen is lit is exactly where an animal is seen from the full range at night.
// Each tile becomes one pixel of a small light map, drawn through the isometric transform with smoothing,
// so a pool is soft but still stops at a wall.
import {addScenePass} from './scene-passes.js';
import {daylightStrength} from './daylight.js';
import {lightSources,lampStrength} from './light-sources.js';
import {inBounds,tileKey,W,H} from './maps.js';

const TORSO=1,FLOOR_HEIGHT=3;
// Tiles are lit out to fifteen from a bulb: the first three bands, 100%, 50% and 25% (12.5% where the bulb's
// height carries a ray just past fifteen). The faint remainder out to thirty is not drawn.
export const POOL_REACH=15;
// The strongest tint, at full night on a fully lit tile.
export const POOL_ALPHA=.3;
const rgb=c=>[c>>16&255,c>>8&255,c&255];

// Light per tile on one level: Map of "x,y" -> {light, color}, out to POOL_REACH from each bulb. The
// colour is the strongest bulb's: fires orange, electric lamps pale. The inBounds check only saves work:
// a ray from off the map is refused by the trace anyway.
export function litTiles(s,minutes,level){
 const lamps=lightSources(s.props,minutes),tiles=new Map();
 // Which tiles to draw: those within POOL_REACH of a bulb on this level.
 const candidates=new Set();
 for(const lamp of lamps){
  if(Math.floor(lamp.h/FLOOR_HEIGHT+1e-9)!==level)continue;
  for(let y=Math.floor(lamp.y-POOL_REACH);y<=Math.ceil(lamp.y+POOL_REACH);y++)for(let x=Math.floor(lamp.x-POOL_REACH);x<=Math.ceil(lamp.x+POOL_REACH);x++)
   if(Math.hypot(x-lamp.x,y-lamp.y)<=POOL_REACH&&inBounds(x,y,level))candidates.add(x+','+y);
 }
 // How lit each one is: every bulb detection would count, at any distance up to thirty, so the drawn light
 // and illuminationAt agree tile for tile.
 for(const k of candidates){
  const [x,y]=k.split(',').map(Number),origin={x,y,h:level*FLOOR_HEIGHT+TORSO};let light=0,best=0,color=0;
  for(const lamp of lamps){const l=lampStrength(s,lamp,origin);light+=l;if(l>best){best=l;color=lamp.color;}}
  if(light>0)tiles.set(k,{light:Math.min(1,light),color});
 }
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

// Only ground the squad has seen is lit on screen: light on an unexplored tile would give the lamp away.
export function seenOnly(tiles,seen,level){
 if(!seen)return tiles;
 for(const k of [...tiles.keys()]){const [x,y]=k.split(',').map(Number);if(!seen.has(tileKey(x,y,level)))tiles.delete(k);}
 return tiles;
}

// Two caches per state and level. The lit tiles are expensive (a trace per tile per bulb) and depend only on
// the lit bulbs and the solids: walls, doors, props. Animals are left out of the trace. The drawn map is
// cheap and also depends on what has been seen, which grows every step while exploring. So a step only
// refilters and repaints; the traces rerun when a bulb switches or a door or wall changes. The geometry key
// is only rebuilt when the state's revision moves.
const cache=new WeakMap();
function cachedMap(s,minutes,level,makeCanvas){
 let byLevel=cache.get(s);if(!byLevel){byLevel=new Map();cache.set(s,byLevel);}
 let entry=byLevel.get(level);if(!entry){entry={};byLevel.set(level,entry);}
 const lamps=lightSources(s.props,minutes).map(l=>`${l.x},${l.y},${l.h}`).join(';');
 if(entry.revision!==s.revision||entry.lamps!==lamps){
  const geometry=[lamps,Object.entries(s.edges||{}).join(';'),(s.props||[]).length].join('|');
  if(entry.geometry!==geometry){entry.geometry=geometry;entry.tiles=litTiles(s,minutes,level);entry.map=undefined;}
  entry.revision=s.revision;entry.lamps=lamps;
 }
 const seen=s.seen?.size??0;
 if(entry.map===undefined||entry.seen!==seen){entry.seen=seen;entry.map=lightMap(seenOnly(new Map(entry.tiles),s.seen,level),makeCanvas);}
 return entry.map;
}

// Draw one layer's light. Nothing by day, full strength at night, eased through dawn and dusk.
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

// Registers the pass and hands back its remover, so app.js needs the import and the call and nothing else.
// The overlay stage runs over the daylight wash, so the light lifts the dark instead of being darkened by it.
export const installLightPools=(makeCanvas,stage='overlay')=>addScenePass(stage,(ctx,view)=>paintLight(ctx,view,makeCanvas));
