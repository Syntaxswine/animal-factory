import {EDGES, PROPS, propCells, GROUNDS} from './environment.js';
import {segmentBox} from './hybrid-geometry.js';

// Logical (x,y,h) -> renderer (X,Y,Z) = (x,h,y). Tile centers are integers.
export const DIMENSIONS=Object.freeze({tile:1,floorSpacing:2.12,slab:.12,wall:2,wallThickness:.16,doorThickness:.12,
 windowBottom:.85,windowTop:1.55,windowMargin:0,doorTop:1.65,lowCover:.8,standing:1.65,kneeling:1.155,prone:.462});
export const GAME_CAMERA=Object.freeze({azimuth:Math.PI/4,elevation:Math.PI/6});
export const toWorld=({x,y,z=0,h=0})=>[x,z*DIMENSIONS.floorSpacing+h,y];
export const fromWorld=([x,h,y])=>({x,y,z:Math.floor((h+1e-8)/DIMENSIONS.floorSpacing),h:h-Math.floor((h+1e-8)/DIMENSIONS.floorSpacing)*DIMENSIONS.floorSpacing});
export function projectWorld([x,y,z],{azimuth,elevation}=GAME_CAMERA){
 return [Math.cos(azimuth)*x-Math.sin(azimuth)*z,-Math.sin(elevation)*(Math.sin(azimuth)*x+Math.cos(azimuth)*z)+Math.cos(elevation)*y];
}
const supportedProps=new Set(['sandbags','crate-wood','crate-steel','crate-stack','barrel-single','roof-corrugated-flat']);
const grounds=new Set(['yard','floor','bridge',...GROUNDS]);
const chunk=8, D=DIMENSIONS;
export function buildWorld(map){
 const boxes=[],diagnostics=[],ids=new Set();
 const roofs=new Map();for(const p of map.props||[])if(p.kind==='roof-corrugated-flat')for(const q of propCells(p))roofs.set(`${q.x},${q.y},${q.z}`,p);
 function box(id,kind,material,center,size,source){
  if(ids.has(id))throw Error('Duplicate geometry ID: '+id);ids.add(id);
  boxes.push({id,name:id,kind,material,source,center,size,min:center.map((v,i)=>v-size[i]/2),max:center.map((v,i)=>v+size[i]/2)});
 }
 function tile(x,y,z,terrain){
  if(terrain==='void')return;
  if(!grounds.has(terrain)&&terrain!=='crate'){diagnostics.push({source:`tile:${x},${y},${z}`,kind:terrain,message:'Unsupported terrain'});return;}
  // Existing stairs leave the upper slab open; movement remains a simulation rule.
  const roof=roofs.get(`${x},${y},${z}`);
  if(!z||!(map.stairs||[]).some(p=>p.x===x&&p.y===y&&p.z===z-1))box(`floor:${x},${y},${z}`,roof?'roof':'floor',roof?.kind||terrain,[x,z*DIMENSIONS.floorSpacing-D.slab/2,y],[1,D.slab,1],{x,y,z});
  if(terrain==='crate')box(`cover:${x},${y},${z}`,'cover','crate-wood',[x,z*DIMENSIONS.floorSpacing+D.lowCover/2,y],[1,D.lowCover,1],{x,y,z});
 }
 const terrain=map.terrain||map.map;
 for(let y=0;y<terrain.length;y++)for(let x=0;x<terrain[y].length;x++)tile(x,y,0,terrain[y][x]);
 for(const [level,layer]of (map.upper||[]).entries())for(const [key,t]of Object.entries(layer)){const [x,y]=key.split(',').map(Number);tile(x,y,level+1,t);}
 for(const [key,kind]of Object.entries(map.edges||{})){
  const [axis,sx,sy,sz='0']=key.split(':'),x=Number(sx),y=Number(sy),z=Number(sz),rule=EDGES[kind];
  const part=(suffix,a,b,bottom,top,material=kind,thickness=D.wallThickness)=>box(`edge:${key}:${suffix}`,'wall',material,
   axis==='e'?[x+.5,z*DIMENSIONS.floorSpacing+(bottom+top)/2,y-.5+(a+b)/2]:[x-.5+(a+b)/2,z*DIMENSIONS.floorSpacing+(bottom+top)/2,y+.5],
   axis==='e'?[thickness,top-bottom,b-a]:[b-a,top-bottom,thickness],{edge:key});
  if(kind==='fence-cut')continue;
  if(kind==='door'||kind==='doorway-concrete-open'||kind==='door-steel-closed'||kind==='door-wood-closed'){
   part('lintel',0,1,D.doorTop,D.wall);if(kind.endsWith('-closed'))part('door',0,1,0,D.doorTop,kind,D.doorThickness);continue;
  }
  if(rule?.window){part('sill',0,1,0,D.windowBottom);part('lintel',0,1,D.windowTop,D.wall);}
  else if(rule?.opaque)part('wall',0,1,0,D.wall);
  else diagnostics.push({source:`edge:${key}`,kind,message:'Unsupported edge'});
 }
 for(const p of map.props||[]){
  const id=`prop:${p.x},${p.y},${p.z||0}:${p.kind}`;
  if(!supportedProps.has(p.kind)){diagnostics.push({source:id,kind:p.kind,message:'Unsupported prop'});continue;}
  if(p.kind==='roof-corrugated-flat')continue; // Surface material on existing slabs, never duplicate coplanar meshes.
  const cells=propCells(p),xs=cells.map(q=>q.x),ys=cells.map(q=>q.y),w=Math.max(...xs)-p.x+1,d=Math.max(...ys)-p.y+1;
  const roof=p.kind.startsWith('roof'),height=roof?D.slab:PROPS[p.kind].tall?D.wall:D.lowCover;
  box(id,roof?'roof':'cover',p.kind,[p.x+(w-1)/2,(p.z||0)*DIMENSIONS.floorSpacing+(roof?-D.slab/2:height/2),p.y+(d-1)/2],[w,height,d],{prop:id});
 }
 for(const p of map.stairs||[])diagnostics.push({source:`stairs:${p.x},${p.y},${p.z}`,kind:p.kind||'stairs',message:'Stair opening supported; stair mesh deferred'});
 const index=new Map();
 for(const b of boxes)for(let x=Math.floor(b.min[0]/chunk);x<=Math.floor(b.max[0]/chunk);x++)for(let z=Math.floor(b.min[2]/chunk);z<=Math.floor(b.max[2]/chunk);z++){
  const key=`${x},${z}`;if(!index.has(key))index.set(key,[]);index.get(key).push(b);
 }
 return {boxes,diagnostics,index};
}
// Traverse only chunks crossed by the segment, including both sides of boundaries.
export function traceWorld(world,start,end,{filter=()=>true}={}){
 if([...start,...end].some(v=>!Number.isFinite(v)))throw Error('Non-finite geometry query');
 const times=[0,1];
 for(const axis of [0,2]){const delta=end[axis]-start[axis];if(!delta)continue;
  const low=Math.min(start[axis],end[axis]),high=Math.max(start[axis],end[axis]);
  for(let boundary=Math.ceil(low/chunk)*chunk;boundary<=high;boundary+=chunk)times.push((boundary-start[axis])/delta);
 }
 times.sort((a,b)=>a-b);const candidates=new Set();
 for(let i=0;i<times.length;i++)for(const t of [times[i],i? (times[i]+times[i-1])/2:times[i]]){
  const x=start[0]+(end[0]-start[0])*t,z=start[2]+(end[2]-start[2])*t;
  for(const dx of [-1e-7,1e-7])for(const dz of [-1e-7,1e-7])for(const b of world.index.get(`${Math.floor((x+dx)/chunk)},${Math.floor((z+dz)/chunk)}`)||[])candidates.add(b);
 }
 let hit=null;const length=Math.hypot(...end.map((v,i)=>v-start[i]));
 for(const b of candidates){if(!filter(b))continue;const t=segmentBox(start,end,b);if(t===null||hit&&(t>hit.t||t===hit.t&&b.id>=hit.id))continue;
  const point=start.map((v,i)=>v+(end[i]-v)*t),normal=[0,0,0];
  for(let axis=0;axis<3;axis++){if(Math.abs(point[axis]-b.min[axis])<1e-7){normal[axis]=-1;break;}if(Math.abs(point[axis]-b.max[axis])<1e-7){normal[axis]=1;break;}}
  hit={id:b.id,kind:b.kind,material:b.material,source:b.source,t,distance:t*length,point,normal};
 }
 return hit;
}
// Map mutations are explicit transactions; consumers replace both meshes and queries.
export function createWorldModel(map){
 let snapshot=structuredClone(map),geometry=buildWorld(snapshot),revision=0;
 return {get map(){return structuredClone(snapshot);},get geometry(){return geometry;},get revision(){return revision;},
  update(change){const next=structuredClone(snapshot);change(next);const built=buildWorld(next);snapshot=next;geometry=built;return ++revision;},
  serialize(){return JSON.stringify(snapshot);},trace(start,end,options){return traceWorld(geometry,start,end,options);}};
}

