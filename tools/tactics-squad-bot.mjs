import * as E from '../dist/tactics/engine.js';
import * as M from '../dist/tactics/maps.js';
import {accepts,reserve} from '../dist/tactics/inventory.js';

// Test-player decisions only: every action is executed through the game engine.
export function weaponValue(kind,rounds=1){
 const w=E.WEAPONS[kind];if(!w||w.blast||w.incendiary)return 0;
 if(w.mag&&!rounds)return 0;
 return w.range*.6+w.damage*(w.pellets?2:1)/w.cost*2+(w.accuracy||0)*.1;
}
const near=(s,u,p)=>M.levelOf(u)===M.levelOf(p)&&Math.abs(u.x-p.x)+Math.abs(u.y-p.y)<=1&&(u.x===p.x&&u.y===p.y||!M.blockedEdge(s,u,p));
const usable=(u,k)=>!E.WEAPONS[k].mag||u.ammo[k]>0||reserve(u,k)>0;
// A gun with an empty magazine only counts as ready when the reload it needs is affordable now (3 AP in combat, free otherwise);
// otherwise equipping it and falling back off it are both free slot swaps and the two decisions chase each other forever.
const ready=(s,u,k)=>!E.WEAPONS[k].mag||u.ammo[k]>0||(reserve(u,k)>0&&(['explore','won'].includes(s.phase)||u.ap>=3));
const bestHeld=u=>Math.max(...u.pack.filter(i=>i.type==='weapon').map(i=>weaponValue(i.kind,usable(u,i.kind)?1:0)),0);
export function lootOptions(s,u,{radius=20}={}){
 const options=[];
 for(const pile of s.loot||[]){if(!s.seen.has(E.key(pile.x,pile.y,M.levelOf(pile)))||E.distance(u,pile)>radius)continue;
  for(const [index,item] of E.pileContents(pile).entries()){
   const own=u.pack.find(i=>i.type==='weapon'&&i.kind===item.kind);let value=0,replace=null;
   if(item.type==='ammo'&&own&&item.count>0&&accepts(u,item)){
    const supply=(u.ammo[item.kind]||0)+reserve(u,item.kind),desired=E.WEAPONS[item.kind].mag*2;
    if(supply<desired)value=weaponValue(item.kind)+Math.min(item.count,desired-supply)*2+(!supply?40:0);
   }else if(item.type==='weapon'&&item.rounds>0){
    if(own){if(item.rounds>(u.ammo[item.kind]||0)){replace=u.pack.indexOf(own);if(accepts({...u,pack:u.pack.filter(i=>i!==own)},item))value=(item.rounds-u.ammo[item.kind])*3;}}
    else if(accepts(u,item)&&weaponValue(item.kind,item.rounds)>bestHeld(u)+1)value=40+weaponValue(item.kind,item.rounds)-bestHeld(u);
   }
   if(value>0)options.push({pile,index,item,replace,score:value/(1+E.distance(u,pile)*.3)});
  }
 }
 return options.sort((a,b)=>b.score-a.score);
}
export function equipBest(s,u){
 const current=weaponValue(u.weapon,ready(s,u,u.weapon)?1:0);
 const best=u.pack.filter(i=>i.type==='weapon'&&ready(s,u,i.kind)).sort((a,b)=>weaponValue(b.kind)-weaponValue(a.kind))[0];
 return !!best&&weaponValue(best.kind)>current+1&&E.equip(s,u,best.kind);
}
export function createSquadBot({cohesion=12,scavengeRadius=20,orders=[],quietOpening=false}={}){
 return {cohesion,scavengeRadius,orders:structuredClone(orders),quietOpening,cursor:0,events:[],routes:new Map()};
}
const event=(bot,s,u,type,detail)=>{bot.events.push({round:s.round,unit:u?.name,type,detail});return true;};
function oneStep(s,u,goals,bot){
 const start=E.key(u.x,u.y,M.levelOf(u)),ids=new Set(goals.map(p=>E.key(p.x,p.y,M.levelOf(p))));if(ids.has(start))return false;
 const signature=[...ids].sort().join('|');let cached=bot.routes.get(u.id);
 if(cached?.signature===signature){while(cached.path.length&&E.key(cached.path[0].x,cached.path[0].y,cached.path[0].z)===start)cached.path.shift();if(!cached.path.length||!E.movementNeighbors(s,u).some(q=>E.key(q.x,q.y,q.z)===E.key(cached.path[0].x,cached.path[0].y,cached.path[0].z))||E.occupant(s,cached.path[0].x,cached.path[0].y,cached.path[0].z))cached=null;}else cached=null;
 if(!cached){
  const occupied=new Set(s.units.filter(v=>v!==u&&(E.alive(v)||E.incapacitated(v))).map(v=>E.key(v.x,v.y,M.levelOf(v)))),parents=new Map([[start,null]]),points=new Map(),queue=[u],stairs=M.stairSet(s);let end=null;
  for(let i=0;i<queue.length&&!end;i++){const p=queue[i],key=E.key(p.x,p.y,M.levelOf(p));for(const q of M.neighbors(s,p,stairs)){const k=E.key(q.x,q.y,q.z);if(parents.has(k)||occupied.has(k)||q.z!==M.levelOf(p)&&E.stanceOf(u)!=='standing')continue;if(q.x!==p.x&&q.y!==p.y&&(occupied.has(E.key(q.x,p.y,q.z))||occupied.has(E.key(p.x,q.y,q.z))))continue;parents.set(k,key);points.set(k,q);if(ids.has(k)){end=k;break;}queue.push(q);}}
  if(!end)return false;const path=[];for(let k=end;k!==start;k=parents.get(k))path.push(points.get(k));cached={signature,path:path.reverse()};bot.routes.set(u.id,cached);
 }
 const q=cached.path[0];return E.move(s,u,q.x,q.y,q.z)&&E.stepMovement(s);
}
export function scavenge(s,u,bot,{travel=true,calm=true}={}){
 if(!E.canControl(s,u)||s.queue.length)return false;
 for(const choice of lootOptions(s,u,{radius:bot.scavengeRadius})){
  if(near(s,u,choice.pile)){
   if(choice.replace!==null&&!E.inventoryTransfer(s,u,choice.replace,'drop'))continue;
   if(E.inventoryTransfer(s,u,choice.index,'take',choice.pile))return event(bot,s,u,'scavenge',choice.item.type+' '+choice.item.kind);
  }else if(travel){const goals=[choice.pile,...M.neighbors(s,choice.pile,undefined,false)].filter(q=>near(s,q,choice.pile));if(oneStep(s,u,goals,bot))return event(bot,s,u,'seek-loot',choice.item.kind);}
 }
 // The player does not know what a body holds until someone searches it: the same rule for the test player. A body beside it is searched when no
 // guard threatens; bodies it has seen fall are walked to only while no guard is in sight (calm), and only by the nearest comrade, not the whole squad.
 for(const pile of (s.loot||[]).filter(p=>p.body!==undefined&&!p.searched&&s.seen.has(E.key(p.x,p.y,M.levelOf(p)))&&E.distance(u,p)<=bot.scavengeRadius).sort((a,b)=>E.distance(u,a)-E.distance(u,b))){
  if(near(s,u,pile)){if(E.searchBody(s,u,pile))return event(bot,s,u,'search',s.units[pile.body]?.name);}
  else if(travel&&calm&&!E.squad(s).some(v=>v!==u&&E.distance(v,pile)<E.distance(u,pile))){const goals=[pile,...M.neighbors(s,pile,undefined,false)].filter(q=>near(s,q,pile));if(oneStep(s,u,goals,bot))return event(bot,s,u,'seek-body',s.units[pile.body]?.name);}
 }
 return false;
}
// Optional explicit plan: sneak, move, cut, overwatch, attack, lure (withdraw to a waypoint).
// Coordinates come from the map author; there are no hidden teleport or free-AP operations.
export function followOrder(s,bot){
 const order=bot.orders[0];if(!order)return false;const u=s.units.find(u=>u.id===order.unit&&E.canControl(s,u));if(!u){if(!E.alive(s.units[order.unit]))bot.orders.shift();return false;}
 let done=false,acted=false;
 if(order.type==='sneak'){done=u.sneaking===(order.enabled??true);if(!done)acted=done=E.setSneaking(s,u);}
 else if(['move','lure'].includes(order.type)){done=u.x===order.x&&u.y===order.y&&M.levelOf(u)===(order.z||0);if(!done)acted=oneStep(s,u,[order],bot);}
 else if(order.type==='cut'){done=s.edges[order.edge]==='fence-cut';if(!done){const cells=M.edgeCells(order.edge);if(!cells.some(p=>p.x===u.x&&p.y===u.y&&p.z===M.levelOf(u)))acted=oneStep(s,u,cells,bot);else if(!u.slots.includes('wireCutters'))acted=E.equipCutters(s,u,1);else acted=done=E.cutFence(s,u,order.edge);}}
 else if(order.type==='overwatch'){if(u.overwatch)done=true;else{u.heading=order.heading??u.heading;E.refresh(s);acted=done=E.setOverwatch(s,u);}}
 else if(order.type==='attack'){const target=s.units[order.target];done=!target||!E.alive(target);if(!done){if(order.weapon&&u.weapon!==order.weapon)acted=E.equip(s,u,order.weapon);else{u.heading=E.headingTo(u,target);E.refresh(s);if(E.previewAttack(s,u,target,false,order.zone||'torso').ok)acted=E.attack(s,u,target,false,false,order.zone||'torso');else acted=oneStep(s,u,M.neighbors(s,target),bot);}done=!E.alive(target);}}
 if(done)bot.orders.shift();if(acted||done)return event(bot,s,u,'order',order.type);return false;
}
export function stepSquadBot(s,bot){
 if(['won','lost'].includes(s.phase))return false;
 if(s.phase==='enemy')return E.stepEnemy(s);
 // Real time runs for both sides: guards investigating or closing from beyond the two-turn threshold take their tick, as the browser's frame loop gives them.
 E.stepInvestigation(s);
 if(s.queue.length)return E.stepMovement(s);
 if(bot.orders.length){if(followOrder(s,bot))return true;return s.phase==='player'&&E.endTurn(s);}
 const team=E.squad(s),first=bot.cursor++%team.length,ordered=[...team.slice(first),...team.slice(0,first)];
 for(const u of ordered){if(!E.canControl(s,u)||u.overwatch)continue;
  for(const patient of s.units.filter(v=>v.casualty==='bleeding'))if(E.stabilizePreview(s,u,patient).ok&&E.stabilize(s,u,patient))return event(bot,s,u,'stabilize',patient.name);
  const visible=E.guards(s).filter(g=>s.detected.has(g.id)).sort((a,b)=>E.distance(u,a)-E.distance(u,b));
  const threatened=visible.some(g=>E.distance(u,g)<=E.WEAPONS[g.weapon].range&&E.lineOfSight(s,g,u));
  if(!threatened&&scavenge(s,u,bot,{calm:!visible.length}))return true;
  const opening=bot.quietOpening&&!bot.events.some(e=>e.type==='attack'),firstTarget=visible[0];
  const quietWeapon=opening&&firstTarget?(E.distance(u,firstTarget)<=1.5&&u.pack.some(i=>i.kind==='knife')?'knife':E.guards(s).every(g=>g===firstTarget||E.distance(u,g)>E.WEAPONS.pistol.range*2)&&u.pack.some(i=>i.kind==='pistol')?'pistol':null):null;
  if(quietWeapon&&u.weapon!==quietWeapon&&E.equip(s,u,quietWeapon))return event(bot,s,u,'equip',quietWeapon);
  if(!quietWeapon&&equipBest(s,u))return event(bot,s,u,'equip',u.weapon);
  const w=E.WEAPONS[u.weapon];if(w.mag&&u.ammo[u.weapon]===0&&E.reload(s,u))return event(bot,s,u,'reload',u.weapon);
  if(visible.length){u.heading=E.headingTo(u,visible[0]);E.refresh(s);}
  const shots=[];for(const g of visible)for(const burst of w.burstRounds?[false,true]:[false])for(const zone of ['torso','head','legs']){const p=E.previewAttack(s,u,g,burst,zone);if(p.ok&&!(p.obstruction?.kind==='unit'&&s.units.find(v=>v.id===p.obstruction.unitId)?.team==='squad'))shots.push({g,p,burst,zone,score:p.chance*Math.min(g.hp,p.damage*p.rounds)/p.cost});}
  shots.sort((a,b)=>b.score-a.score);if(shots.length){const shot=shots[0];if(E.attack(s,u,shot.g,shot.burst,false,shot.zone))return event(bot,s,u,'attack',shot.g.name);}
  if(threatened&&scavenge(s,u,bot,{travel:false}))return true;
  if(w.mag&&!u.ammo[u.weapon]){const fallback=u.pack.filter(i=>i.type==='weapon'&&i.kind!==u.weapon&&ready(s,u,i.kind)).sort((a,b)=>weaponValue(b.kind)-weaponValue(a.kind))[0];if(fallback&&E.equip(s,u,fallback.kind))return event(bot,s,u,'fallback',fallback.kind);}
  const laggard=team.filter(v=>v!==u).sort((a,b)=>E.distance(u,b)-E.distance(u,a))[0];
  if(laggard&&E.distance(u,laggard)>bot.cohesion){const center=team.reduce((p,v)=>({x:p.x+v.x/team.length,y:p.y+v.y/team.length}),{x:0,y:0}),anchor=team.filter(v=>v!==u).sort((a,b)=>E.distance(a,center)-E.distance(b,center))[0];if(E.distance(u,center)>bot.cohesion/3&&oneStep(s,u,M.neighbors(s,anchor),bot))return event(bot,s,u,'regroup',anchor.name);if(E.setOverwatch(s,u))return event(bot,s,u,'overwatch','cover regrouping');continue;}
  const target=visible[0]||E.guards(s).sort((a,b)=>E.distance(u,a)-E.distance(u,b))[0];
  if(target){if(bot.quietOpening&&!u.fired&&!u.sneaking&&E.setSneaking(s,u))return event(bot,s,u,'sneak','approach');if(oneStep(s,u,M.neighbors(s,target),bot))return event(bot,s,u,'advance',target.name);}
 }
 return s.phase==='player'&&E.endTurn(s);
}
