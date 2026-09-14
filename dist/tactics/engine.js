export const W=28,H=24;
export const WEAPONS={
 hands:{name:'Workers’ fists',short:'Hands',cost:3,range:1,damage:16,mag:0},
 knife:{name:'NR-40 knife',short:'NR-40',cost:3,range:1,damage:27,mag:0},
 pistol:{name:'TT-33 pistol',short:'TT-33',cost:4,range:8,damage:27,mag:8},
 rifle:{name:'Mosin-Nagant',short:'Mosin',cost:6,range:14,damage:48,mag:5},
 assault:{name:'AK-47',short:'AK-47',cost:4,range:10,damage:26,mag:30}
};
export const key=(x,y)=>`${x},${y}`;
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export const alive=u=>u.hp>0;
export const squad=s=>s.units.filter(u=>u.team==='squad'&&alive(u));
export const guards=s=>s.units.filter(u=>u.team==='guard'&&alive(u));
export const occupant=(s,x,y)=>s.units.find(u=>alive(u)&&u.x===x&&u.y===y);
export const tile=(s,x,y)=>x<0||y<0||x>=W||y>=H?'wall':s.map[y][x];
export const walkable=(s,x,y)=>['floor','yard','door'].includes(tile(s,x,y));
export function log(s,message){s.log.unshift(message);s.log=s.log.slice(0,50);s.revision++;}
export function createGame(seed=1947){
 const s={map:Array.from({length:H},(_,y)=>Array.from({length:W},(_,x)=>x===0||y===0||x===W-1||y===H-1?'wall':'yard')),units:[],phase:'explore',round:0,selected:0,visible:new Set(),seen:new Set(),log:[],seed,revision:0,queue:[],enemyIndex:0,effect:null};
 for(const [x0,y0,x1,y1,doors] of [[10,3,18,10,[[10,7],[14,10],[18,7]]],[16,14,25,21,[[16,17],[21,14],[21,21]]]]){
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)s.map[y][x]=(x===x0||x===x1||y===y0||y===y1)?'wall':'floor';
  for(const [x,y]of doors)s.map[y][x]='door';
 }
 for(const [x,y]of [[7,6],[7,7],[5,12],[6,12],[9,15],[10,15],[13,5],[16,8],[13,12],[14,12],[20,6],[21,6],[20,18],[23,16],[23,19],[12,19],[7,20]])s.map[y][x]='crate';
 const add=(team,name,species,x,y,weapon)=>{s.units.push({id:s.units.length,team,name,species,x,y,hp:team==='squad'?100:45,maxHp:team==='squad'?100:45,ap:team==='squad'?12:7,maxAp:team==='squad'?12:7,accuracy:team==='squad'?85:55,weapon,ammo:Object.fromEntries(Object.entries(WEAPONS).map(([k,v])=>[k,v.mag])),alert:false,lastKnown:null,facing:1,steps:0});};
 [['Yakov','horse',3,4,'assault'],['Anya','goat',3,6,'rifle'],['Misha','donkey',2,5,'pistol'],['Vera','sheep',2,7,'knife']].forEach(a=>add('squad',...a));
 [['Boris','pig-foreman',12,6,'pistol'],['Lev','cow',15,5,'rifle'],['Grigori','pig-foreman',16,9,'pistol'],['Oleg','donkey',13,9,'knife'],['Pavel','pig-foreman',21,4,'assault'],['Igor','goat',24,6,'pistol'],['Anton','cow',22,9,'rifle'],['Vadim','pig-foreman',24,11,'pistol'],['Yuri','pig-foreman',18,16,'pistol'],['Sasha','donkey',23,17,'knife'],['Pyotr','cow',18,20,'rifle'],['Nikolai','pig-foreman',24,20,'assault']].forEach(a=>add('guard',...a));
 refresh(s);log(s,'Shift 07 / Enter the works. Defeat all 12 guards.');return s;
}
// Supercover grid traversal: touching a solid corner never grants sight through it.
export function lineOfSight(s,a,b){
 let x=a.x,y=a.y;const dx=b.x-a.x,dy=b.y-a.y,nx=Math.abs(dx),ny=Math.abs(dy),sx=Math.sign(dx),sy=Math.sign(dy);let ix=0,iy=0;
 while(ix<nx||iy<ny){const d=(1+2*ix)*ny-(1+2*iy)*nx;
  if(d===0){if(tile(s,x+sx,y)==='wall'||tile(s,x,y+sy)==='wall')return false;x+=sx;y+=sy;ix++;iy++;}
  else if(d<0){x+=sx;ix++;}else{y+=sy;iy++;}
  if(x===b.x&&y===b.y)return true;
  if(tile(s,x,y)==='wall')return false;
 }return true;
}
export function pathTo(s,u,x,y){
 if(!walkable(s,x,y)||(occupant(s,x,y)&&occupant(s,x,y)!==u))return null;
 const start=key(u.x,u.y),goal=key(x,y);const visited=new Map([[start,null]]),q=[[u.x,u.y]];
 for(let i=0;i<q.length;i++){const [cx,cy]=q[i];if(key(cx,cy)===goal){const path=[];let k=goal;while(k!==start){const [px,py]=k.split(',').map(Number);path.unshift({x:px,y:py});k=visited.get(k);}return path;}
  for(const [nx,ny]of [[cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]]){const k=key(nx,ny);if(!visited.has(k)&&walkable(s,nx,ny)&&!occupant(s,nx,ny)){visited.set(k,key(cx,cy));q.push([nx,ny]);}}
 }return null;
}
export function refresh(s){
 s.visible=new Set();for(const p of squad(s))for(let y=Math.max(0,p.y-9);y<=Math.min(H-1,p.y+9);y++)for(let x=Math.max(0,p.x-9);x<=Math.min(W-1,p.x+9);x++)if(distance(p,{x,y})<=9&&lineOfSight(s,p,{x,y}))s.visible.add(key(x,y));
 for(const k of s.visible)s.seen.add(k);
 if(!guards(s).length){if(s.phase!=='won')log(s,'Factory secured. All twelve guards defeated.');s.phase='won';s.queue=[];return;}
 if(!squad(s).length){if(s.phase!=='lost')log(s,'The squad has fallen. Restart the operation to try again.');s.phase='lost';s.queue=[];return;}
 for(const g of guards(s)){const targets=squad(s).filter(p=>distance(g,p)<=9&&lineOfSight(s,g,p));if(targets.length){g.alert=true;const p=targets.sort((a,b)=>distance(g,a)-distance(g,b))[0];g.lastKnown={x:p.x,y:p.y};}}
 const contact=guards(s).some(g=>g.alert);
 if(s.phase==='explore'&&contact){s.phase='player';s.round++;s.queue=[];for(const u of s.units)u.ap=u.maxAp;log(s,'CONTACT / Squad turn. Movement costs 1 AP per tile.');}
 else if((s.phase==='player'||s.phase==='enemy')&&!contact){s.phase='explore';s.queue=[];log(s,'Area clear. Real-time exploration resumed.');}
 if(!alive(s.units[s.selected]))s.selected=squad(s)[0].id;
 s.revision++;
}
export function canControl(s,u){return u&&alive(u)&&u.team==='squad'&&['explore','player'].includes(s.phase);}
export function move(s,u,x,y){
 if(!canControl(s,u))return false;const path=pathTo(s,u,x,y);if(!path?.length)return false;
 if(s.phase==='player'&&path.length>u.ap)return false;
 s.queue=path.map(p=>({id:u.id,...p}));return true;
}
export function stepMovement(s){
 if(!s.queue.length||!['explore','player'].includes(s.phase))return false;
 const step=s.queue.shift(),u=s.units[step.id];if(!canControl(s,u)||!walkable(s,step.x,step.y)||occupant(s,step.x,step.y)||(s.phase==='player'&&u.ap<1)){s.queue=[];return false;}
 u.facing=(step.x-u.x)-(step.y-u.y)>=0?1:-1;u.x=step.x;u.y=step.y;u.steps++;if(s.phase==='player')u.ap--;refresh(s);return true;
}
export function coverAgainst(s,a,b){
 const dx=a.x-b.x,dy=a.y-b.y;const cells=[];if(Math.abs(dx)>=Math.abs(dy)*.5)cells.push([b.x+Math.sign(dx),b.y]);if(Math.abs(dy)>=Math.abs(dx)*.5)cells.push([b.x,b.y+Math.sign(dy)]);
 return cells.some(([x,y])=>tile(s,x,y)==='crate'||tile(s,x,y)==='wall');
}
export function previewAttack(s,a,b,burst=false){
 if(!a||!b||!alive(a)||!alive(b)||a.team===b.team)return {ok:false,reason:'Choose a living opponent'};
 const w=WEAPONS[a.weapon],rounds=burst&&a.weapon==='assault'?3:1,cost=w.cost+(rounds===3?2:0),range=distance(a,b),melee=w.mag===0;
 const visible=a.team==='squad'?s.visible.has(key(b.x,b.y)):distance(a,b)<=9&&lineOfSight(s,a,b);
 const cover=!melee&&coverAgainst(s,a,b);
 const chance=Math.max(10,Math.min(95,a.accuracy+(melee?10:0)-Math.max(0,range-3)*3-(cover?25:0)-(rounds===3?10:0)));
 let reason='';
 if(!visible)reason='Target not visible';else if(range>w.range)reason='Out of range';else if(!lineOfSight(s,a,b))reason='Line of fire blocked';else if(w.mag&&a.ammo[a.weapon]<rounds)reason='Reload required';else if(s.phase!=='explore'&&a.ap<cost)reason='Not enough AP';
 return {ok:!reason,reason,cost,rounds,chance:Math.round(chance),cover,damage:w.damage,range:w.range};
}
function random(s){s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;return s.seed/4294967296;}
export function attack(s,a,b,burst=false,byAI=false){
 if(s.queue.length)return false;
 if(byAI?!(s.phase==='enemy'&&a?.team==='guard'&&alive(a)):!canControl(s,a))return false;
 const p=previewAttack(s,a,b,burst);if(!p.ok)return false;
 if(s.phase==='explore'){b.alert=true;refresh(s);} // Opening attacks always spend combat AP.
 a.ap-=p.cost;if(WEAPONS[a.weapon].mag)a.ammo[a.weapon]-=p.rounds;
 let damage=0;for(let i=0;i<p.rounds;i++)if(random(s)*100<p.chance)damage+=Math.round(p.damage*(a.team==='guard'?.65:1));
 b.hp=Math.max(0,b.hp-damage);a.facing=(b.x-a.x)-(b.y-a.y)>=0?1:-1;s.effect={ax:a.x,ay:a.y,bx:b.x,by:b.y,hit:damage>0};
 log(s,`${a.name} → ${b.name}: ${damage?`${damage} damage`:'miss'}${!alive(b)?' / down':''}.`);refresh(s);return true;
}
export function equip(s,u,id){if(!canControl(s,u)||s.queue.length||!WEAPONS[id]||u.weapon===id||(s.phase==='player'&&u.ap<2))return false;if(s.phase==='player')u.ap-=2;u.weapon=id;log(s,`${u.name} equipped ${WEAPONS[id].name}.`);return true;}
export function reload(s,u,byAI=false){
 if(byAI?!(s.phase==='enemy'&&u?.team==='guard'&&alive(u)):!canControl(s,u))return false;
 const w=WEAPONS[u.weapon];if(s.queue.length||!w.mag||u.ammo[u.weapon]===w.mag||(s.phase!=='explore'&&u.ap<3))return false;
 if(s.phase!=='explore')u.ap-=3;u.ammo[u.weapon]=w.mag;log(s,`${u.name} reloaded ${w.short}.`);return true;
}
export function endTurn(s){if(s.phase!=='player'||s.queue.length)return false;s.phase='enemy';s.enemyIndex=0;for(const g of guards(s))g.ap=g.maxAp;log(s,'Guard turn.');return true;}
export function stepEnemy(s){
 if(s.phase!=='enemy')return false;
 const g=s.units[s.enemyIndex];
 if(!g){s.phase='player';s.round++;for(const p of squad(s))p.ap=p.maxAp;refresh(s);log(s,`Squad turn / ${s.round}.`);return true;}
 if(g.team!=='guard'||!alive(g)||!g.alert||g.ap<1){s.enemyIndex++;return true;}
 const targets=squad(s).filter(p=>distance(g,p)<=9&&lineOfSight(s,g,p)).sort((a,b)=>distance(g,a)-distance(g,b));
 const target=targets[0];if(target)g.lastKnown={x:target.x,y:target.y};
 if(target&&previewAttack(s,g,target).ok){attack(s,g,target,false,true);return true;}
 if(target&&previewAttack(s,g,target).reason==='Not enough AP'){g.ap=0;s.enemyIndex++;return true;}
 if(WEAPONS[g.weapon].mag&&g.ammo[g.weapon]===0&&reload(s,g,true))return true;
 const dest=g.lastKnown;if(dest){let best=null;for(const [x,y]of [[dest.x+1,dest.y],[dest.x-1,dest.y],[dest.x,dest.y+1],[dest.x,dest.y-1]]){const path=pathTo(s,g,x,y);if(path?.length&&(!best||path.length<best.length))best=path;}
  if(best){const p=best[0];g.facing=(p.x-g.x)-(p.y-g.y)>=0?1:-1;g.x=p.x;g.y=p.y;g.steps++;g.ap--;refresh(s);return true;}}
 g.ap=0;s.enemyIndex++;return true;
}
