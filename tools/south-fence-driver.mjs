import * as E from '../dist/tactics/engine.js';
import * as M from '../dist/tactics/maps.js';
import {createSquadBot,stepSquadBot,followOrder,scavenge} from './tactics-squad-bot.mjs';
export function createRun(s){return {stage:'loadout',actions:0,waypoint:0,bot:createSquadBot(),events:[],initialEdges:{...s.edges},waypoints:[{x:30,y:45,z:0},{x:30,y:100,z:0},{x:46,y:100,z:0},{x:49,y:100,z:0},{x:68,y:105,z:0},{x:70,y:145,z:0},{x:94,y:145,z:0}],openingInitiallyAlert:s.units[4].alert};}
const note=(r,s,type,detail)=>r.events.push({action:r.actions,round:s.round,type,detail});
function advance(r,s,stage){note(r,s,'stage',stage);r.stage=stage;r.bot.orders=[];}
function order(r,s,o){if(!r.bot.orders.length)r.bot.orders=[o];return followOrder(s,r.bot);}
function groupToward(s,point,r){const offsets=[[-1,-1],[-1,1],[0,0],[-2,2]],choices=E.squad(s).map(u=>({u,p:{x:point.x+offsets[u.id][0],y:point.y+offsets[u.id][1],z:point.z}})).filter(({u,p})=>E.distance(u,p)>0&&E.canControl(s,u)&& (s.phase!=='player'||u.ap>=2)).sort((a,b)=>E.distance(b.u,b.p)-E.distance(a.u,a.p));for(const {u,p} of choices){r.bot.orders=[];if(order(r,s,{type:'move',unit:u.id,...p}))return true;}return false;}
function combat(r,s,{hold=false}={}){for(const u of E.squad(s)){if(!E.canControl(s,u)||u.overwatch)continue;for(const v of s.units.filter(v=>v.casualty==='bleeding'))if(E.stabilizePreview(s,u,v).ok)return E.stabilize(s,u,v);if(E.WEAPONS[u.weapon].mag&&!u.ammo[u.weapon]&&E.reload(s,u))return true;const foes=E.guards(s).filter(g=>s.detected.has(g.id)).sort((a,b)=>E.distance(u,a)-E.distance(u,b));for(const g of foes){E.turnTo(s,u,E.headingTo(u,g));const shot=E.previewAttack(s,u,g);if(shot.ok&&!(shot.obstruction?.kind==='unit'&&s.units.find(v=>v.id===shot.obstruction.unitId)?.team==='squad')){note(r,s,'attack',`${u.name} -> ${g.name}`);return E.attack(s,u,g);}}if(hold&&E.setOverwatch(s,u)){note(r,s,'overwatch',u.name);return true;}}return false;}
export function stepRun(s,r){r.actions++;if(['won','lost'].includes(s.phase))return false;if(s.phase==='enemy')return E.stepEnemy(s);if(s.queue.length){E.stepMovement(s);return true;}let acted=false;
 if(r.stage==='loadout'){
  const vera=s.units[3];const pile=s.loot.find(p=>p.items.some(i=>i.kind==='hmg'));if(pile&&E.canControl(s,vera)){const i=pile.items.findIndex(i=>i.kind==='hmg');if(i>=0&&E.inventoryTransfer(s,vera,i,'take',pile)){note(r,s,'scavenge','Vera collected HMG equipment');return true;}}
  if(vera.pack.some(i=>i.kind==='hmg'&&i.type==='weapon')&&vera.weapon!=='hmg'&&E.equip(s,vera,'hmg')){note(r,s,'equip','Vera equipped HMG');return true;}advance(r,s,'opening');return true;
 }
 if(r.stage==='opening'){
  if(!E.alive(s.units[4])){advance(r,s,'south');return true;}
  const scout=s.units[2];if(E.canControl(s,scout)){if(!scout.sneaking&&E.setSneaking(s,scout))return true;acted=order(r,s,{type:'attack',unit:2,target:4,weapon:'pistol',zone:'torso'});}
  if(!acted){for(const u of E.squad(s).filter(u=>u.id!==2))if(E.setOverwatch(s,u)){note(r,s,'overwatch',u.name+' covers opening');return true;}}
 }
 else if(r.stage==='south'){
  for(const u of E.squad(s))if(u.sneaking&&E.setSneaking(s,u))return true;
  if(r.waypoint===3&&s.edges['e:47:100']!=='fence-cut'){acted=order(r,s,{type:'cut',unit:2,edge:'e:47:100'});if(s.edges['e:47:100']==='fence-cut')note(r,s,'breach','e:47:100');}
  else if(r.waypoint===4&&E.alive(s.units[25])){acted=combat(r,s);if(!acted)acted=order(r,s,{type:'attack',unit:1,target:25,weapon:'rifle',zone:'torso'});}
  else {const p=r.waypoints[r.waypoint],lead=E.squad(s).find(u=>u.id===2)||E.squad(s)[0];if(!p){advance(r,s,'position');return true;}if(E.distance(lead,p)<1){note(r,s,'waypoint',p);r.waypoint++;r.bot.orders=[];return true;}acted=combat(r,s);if(!acted)acted=groupToward(s,p,r);}
 }
 else if(r.stage==='position'){
  const positions=[{unit:3,x:97,y:145,z:0},{unit:1,x:96,y:145,z:0},{unit:0,x:98,y:146,z:0},{unit:2,x:97,y:144,z:0}];const next=positions.find(p=>E.alive(s.units[p.unit])&&(s.units[p.unit].x!==p.x||s.units[p.unit].y!==p.y));if(!next){advance(r,s,'ambush');return true;}acted=combat(r,s);if(!acted)acted=order(r,s,{type:'move',...next});
 }
 else if(r.stage==='ambush'){
  for(const u of E.squad(s).filter(u=>u.id!==2)){E.turnTo(s,u,270);if(!u.overwatch&&E.setOverwatch(s,u)){note(r,s,'overwatch',u.name+' covers south doorway');return true;}}
  if(!E.alive(s.units[2])){advance(r,s,'clear');return true;}acted=order(r,s,{type:'move',unit:2,x:97,y:141,z:0});if(s.units[2].x===97&&s.units[2].y===141){advance(r,s,'lure');return true;}
 }
 else if(r.stage==='lure'){
  const scout=s.units[2];if(!E.alive(scout)){advance(r,s,'clear');return true;}
  if(!r.lureShot){acted=combat(r,s);r.lureShot=true;if(acted)return true;}
  acted=order(r,s,{type:'lure',unit:2,x:99,y:145,z:0});if(scout.x===99&&scout.y===145){advance(r,s,'hold');r.holdUntil=s.round+3;return true;}
 }
 else if(r.stage==='hold'){acted=combat(r,s,{hold:true});if(s.round>=r.holdUntil||s.phase==='explore'){advance(r,s,'clear');return true;}}
 else if(r.stage==='clear')return stepSquadBot(s,r.bot);
 if(acted)return true;for(const u of E.squad(s))if(scavenge(s,u,r.bot,{travel:false}))return true;
 if(s.phase==='player')return E.endTurn(s);return false;
}
export function summarize(s,r){return {stage:r.stage,phase:s.phase,round:s.round,actions:r.actions,guards:E.guards(s).length,openingInitiallyAlert:r.openingInitiallyAlert,doorsOpened:Object.keys(r.initialEdges).filter(k=>r.initialEdges[k].includes('closed')&&s.edges[k]!==r.initialEdges[k]).length,fenceCut:s.edges['e:47:100']==='fence-cut',squad:s.units.filter(u=>u.team==='squad').map(u=>({name:u.name,hp:u.hp,casualty:u.casualty,x:u.x,y:u.y,weapon:u.weapon,ammo:u.ammo[u.weapon]})),events:r.events,botEvents:r.bot.events,log:s.log};}
