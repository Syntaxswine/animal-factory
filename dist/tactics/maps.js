// Map geometry is shared by the simulation, editor and procedural generator.
export const W = 28, H = 24;
export const tileKey = (x, y) => `${x},${y}`;
export const edgeKey = (axis, x, y) => `${axis}:${x}:${y}`;
export function edgeBetween(a, b) {
  if (Math.abs(a.x-b.x)+Math.abs(a.y-b.y)!==1) return null;
  return a.x!==b.x ? edgeKey('e',Math.min(a.x,b.x),a.y) : edgeKey('s',a.x,Math.min(a.y,b.y));
}
export function blockedEdge(map, a, b) { const k=edgeBetween(a,b); return !k || map.edges?.[k]==='wall'; }
export function edgeCells(k) { const [axis,xs,ys]=k.split(':'),x=Number(xs),y=Number(ys);return [{x,y},{x:x+(axis==='e'?1:0),y:y+(axis==='s'?1:0)}]; }
export function edgePoints(k) {const [axis,xs,ys]=k.split(':'),x=Number(xs),y=Number(ys);return axis==='e'?[{x:x+.5,y:y-.5},{x:x+.5,y:y+.5}]:[{x:x-.5,y:y+.5},{x:x+.5,y:y+.5}];}
export function nearestEdge(fx,fy) {const x=Math.round(fx),y=Math.round(fy),dx=fx-x,dy=fy-y;return Math.abs(dx)>=Math.abs(dy)?edgeKey('e',dx<0?x-1:x,y):edgeKey('s',x,dy<0?y-1:y);}
export const SPECIES=['horse','goat','donkey','sheep','cow','hen','pig-foreman','pig-director'];
export const WEAPON_IDS=['hands','knife','pistol','rifle','assault'];
export function blankMap(name='Untitled local map') {
  const m={version:1,width:W,height:H,name,terrain:Array.from({length:H},()=>Array(W).fill('yard')),edges:{},starts:[{x:3,y:4},{x:3,y:6},{x:2,y:5},{x:2,y:7}],guards:[],exits:[{x:3,y:5}]};
  for(let y=0;y<H;y++){m.edges[edgeKey('e',-1,y)]='wall';m.edges[edgeKey('e',W-1,y)]='wall';}
  for(let x=0;x<W;x++){m.edges[edgeKey('s',x,-1)]='wall';m.edges[edgeKey('s',x,H-1)]='wall';}
  return m;
}
export function stampRoom(m,x,y,w=7,h=6) {
  if(x<0||y<0||x+w>W||y+h>H)return false;
  for(let cy=y;cy<y+h;cy++)for(let cx=x;cx<x+w;cx++)m.terrain[cy][cx]='floor';
  for(let cy=y;cy<y+h;cy++){m.edges[edgeKey('e',x-1,cy)]='wall';m.edges[edgeKey('e',x+w-1,cy)]='wall';}
  for(let cx=x;cx<x+w;cx++){m.edges[edgeKey('s',cx,y-1)]='wall';m.edges[edgeKey('s',cx,y+h-1)]='wall';}
  m.edges[edgeKey('e',x-1,y+Math.floor(h/2))]='door';
  m.edges[edgeKey('s',x+Math.floor(w/2),y+h-1)]='door';return true;
}
export function factoryMap() {
  const m=blankMap('Factory test');stampRoom(m,10,3,9,8);stampRoom(m,16,14,10,8);
  m.edges[edgeKey('e',18,7)]='door';m.edges[edgeKey('s',21,13)]='door';
  for(const [x,y]of [[7,6],[7,7],[5,12],[6,12],[9,15],[10,15],[13,5],[16,8],[13,12],[14,12],[20,6],[21,6],[20,18],[23,16],[23,19],[12,19],[7,20]])m.terrain[y][x]='crate';
  [[12,6,'pig-foreman','pistol'],[15,5,'cow','rifle'],[16,9,'pig-foreman','pistol'],[13,9,'donkey','knife'],[21,4,'pig-foreman','assault'],[24,6,'goat','pistol'],[22,9,'cow','rifle'],[24,11,'pig-foreman','pistol'],[18,16,'pig-foreman','pistol'],[23,17,'donkey','knife'],[18,20,'cow','rifle'],[24,20,'pig-foreman','assault']].forEach(([x,y,species,weapon])=>m.guards.push({x,y,species,weapon}));return m;
}
function reachable(m) {
  const seen=new Set(),q=[m.starts[0]];if(!q[0])return seen;seen.add(tileKey(q[0].x,q[0].y));
  for(let i=0;i<q.length;i++){const a=q[i];for(const b of [{x:a.x+1,y:a.y},{x:a.x-1,y:a.y},{x:a.x,y:a.y+1},{x:a.x,y:a.y-1}]){const k=tileKey(b.x,b.y);if(b.x<0||b.y<0||b.x>=W||b.y>=H||seen.has(k)||m.terrain[b.y][b.x]==='crate'||blockedEdge(m,a,b))continue;seen.add(k);q.push(b);}}
  return seen;
}
export function validateMap(raw,{connectivity=true}={}) {
  const errors=[],integer=n=>Number.isInteger(n),point=p=>p&&integer(p.x)&&integer(p.y)&&p.x>=0&&p.y>=0&&p.x<W&&p.y<H;
  if(!raw||raw.version!==1||raw.width!==W||raw.height!==H)return ['Expected a version 1, 28 × 24 local map.'];
  if(typeof raw.name!=='string'||raw.name.length<1||raw.name.length>60)errors.push('Map name must contain 1–60 characters.');
  if(!Array.isArray(raw.terrain)||raw.terrain.length!==H||raw.terrain.some(r=>!Array.isArray(r)||r.length!==W||r.some(t=>!['yard','floor','crate'].includes(t))))return [...errors,'Terrain must contain exactly 28 × 24 yard, floor or crate tiles.'];
  if(!raw.edges||typeof raw.edges!=='object'||Array.isArray(raw.edges))return [...errors,'Missing edge barriers.'];
  for(const [k,v]of Object.entries(raw.edges)){const parts=/^(e|s):(-?\d+):(-?\d+)$/.exec(k);if(!parts){errors.push('Invalid edge key.');break;}const x=Number(parts[2]),y=Number(parts[3]);if(!['wall','door'].includes(v)||k!==edgeKey(parts[1],x,y)||(parts[1]==='e'?(x< -1||x>=W||y<0||y>=H):(x<0||x>=W||y< -1||y>=H))){errors.push('Invalid edge location or type.');break;}}
  if(!Array.isArray(raw.starts)||raw.starts.length!==4||raw.starts.some(p=>!point(p)))return [...errors,'Place exactly four valid squad starts.'];
  if(!Array.isArray(raw.guards)||raw.guards.length>12||raw.guards.some(g=>!point(g)||!SPECIES.includes(g.species)||!WEAPON_IDS.includes(g.weapon)))return [...errors,'Use up to twelve valid guard starts with a supported species and weapon.'];
  if(!Array.isArray(raw.exits)||raw.exits.length!==1||raw.exits.some(p=>!point(p)))return [...errors,'Place one valid travel marker.'];
  const positions=new Set();for(const p of [...raw.starts,...raw.guards]){const k=tileKey(p.x,p.y);if(positions.has(k))errors.push(`Overlapping unit starts at ${k}.`);positions.add(k);if(raw.terrain[p.y][p.x]==='crate')errors.push(`Unit start on a crate at ${k}.`);}
  if(raw.terrain[raw.exits[0].y][raw.exits[0].x]==='crate')errors.push('Travel marker cannot be on a crate.');
  if(errors.length||!connectivity)return errors;
  const reached=reachable(raw);for(const p of [...raw.starts,...raw.guards,...raw.exits])if(!reached.has(tileKey(p.x,p.y)))errors.push(`Unreachable start or travel marker at ${p.x},${p.y}. Add a doorway.`);
  return errors;
}
export function parseMap(text,{allowDisconnected=false}={}) {if(typeof text!=='string'||text.length>250000)throw Error('Map file is too large (250 KB maximum).');const raw=JSON.parse(text),errors=validateMap(raw,{connectivity:!allowDisconnected});if(errors.length)throw Error(errors.join(' '));return structuredClone(raw);}
export function generateMap(seed=7,name='Generated test') {
  let state=Number(seed)>>>0;const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
  const m=blankMap(name);stampRoom(m,10+Math.floor(random()*3),2+Math.floor(random()*3),6+Math.floor(random()*3),6);stampRoom(m,16,14,7+Math.floor(random()*3),7);
  const reserved=new Set([...m.starts,...m.exits].map(p=>tileKey(p.x,p.y)));
  for(let n=0;n<28;n++){const x=5+Math.floor(random()*21),y=2+Math.floor(random()*20),k=tileKey(x,y);if(reserved.has(k)||m.terrain[y][x]==='crate')continue;const old=m.terrain[y][x];m.terrain[y][x]='crate';if(validateMap(m).length)m.terrain[y][x]=old;}
  const reach=reachable(m),places=[];for(let y=2;y<H-2;y++)for(let x=12;x<W-2;x++)if(reach.has(tileKey(x,y))&&!reserved.has(tileKey(x,y)))places.push({x,y});
  for(let i=0;i<12;i++){const index=Math.floor(random()*places.length),p=places.splice(index,1)[0];m.guards.push({...p,species:['pig-foreman','cow','donkey','goat'][i%4],weapon:['pistol','rifle','knife','assault'][i%4]});}return m;
}
