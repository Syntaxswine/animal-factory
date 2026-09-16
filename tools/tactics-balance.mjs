// Deterministic balance smoke test. This bot knows guard locations for navigation,
// but uses the normal visibility, path, AP, hit, damage and AI rules for all actions.
import {createGame,squad,guards,move,stepMovement,previewAttack,attack,reload,endTurn,stepEnemy,pathTo,pathCost,distance} from '../dist/tactics/engine.js';
export function simulate(seed){const s=createGame(seed);let actions=0;
 while(!['won','lost'].includes(s.phase)&&actions++<1500){
  if(s.phase==='enemy'){stepEnemy(s);continue;}
  let acted=false;
  for(const u of squad(s)){
   const targets=guards(s).map(g=>({g,p:previewAttack(s,u,g,u.weapon==='assault')})).filter(v=>v.p.ok).sort((a,b)=>b.p.chance-a.p.chance);
   if(targets.length){attack(s,u,targets[0].g,u.weapon==='assault');acted=true;break;}
   if(u.ammo[u.weapon]===0&&reload(s,u)){acted=true;break;}
   const nearest=guards(s).sort((a,b)=>distance(u,a)-distance(u,b))[0];
   if(!nearest)break; // all guards down but fires or bleeding keep combat pending: end turns until it clears
   const paths=[[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dy])=>pathTo(s,u,nearest.x+dx,nearest.y+dy)).filter(p=>p?.length).sort((a,b)=>pathCost(a)-pathCost(b));
   if(paths.length&&u.ap>0){const limit=['explore','won'].includes(s.phase)?Infinity:u.ap;let spent=0;const affordable=paths[0].slice(0,3).filter(p=>(spent+=p.cost)<=limit),p=affordable.at(-1);if(p&&move(s,u,p.x,p.y,p.z)){while(s.queue.length)stepMovement(s);acted=true;break;}}
  }
  if(!acted){if(s.phase==='player')endTurn(s);else break;}
 }
 return {seed,result:s.phase,actions,round:s.round,survivors:squad(s).length,guards:guards(s).length,hp:squad(s).reduce((a,u)=>a+u.hp,0)};
}
if(process.argv[1]?.endsWith('tactics-balance.mjs')){const results=Array.from({length:20},(_,i)=>simulate(1947+i));console.table(results);console.log(`Wins: ${results.filter(r=>r.result==='won').length}/${results.length}`);if(results.some(r=>!['won','lost'].includes(r.result)))process.exitCode=1;}
