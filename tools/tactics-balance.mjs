// Headless player: map knowledge for navigation, normal engine rules for every action.
import fs from 'node:fs';
import {createGame,squad,guards} from '../dist/tactics/engine.js';
import {parseMap} from '../dist/tactics/maps.js';
import {createSquadBot,stepSquadBot} from './tactics-squad-bot.mjs';
export function simulate(seed,{map,maxActions=3000,...options}={}){
 const s=createGame(seed,map,true,'standard',{social:!!options.social}),bot=createSquadBot(options);let actions=0,stalled=false;
 while(!['won','lost'].includes(s.phase)&&actions++<maxActions){if(!stepSquadBot(s,bot)){stalled=true;break;}}
 return {seed,result:s.phase,actions,round:s.round,survivors:squad(s).length,guards:guards(s).length,hp:squad(s).reduce((n,u)=>n+u.hp,0),stalled,events:bot.events};
}
if(process.argv[1]?.endsWith('tactics-balance.mjs')){
 const args=process.argv.slice(2),value=name=>args[args.indexOf(name)+1],has=name=>args.includes(name);
 const map=has('--map')?parseMap(fs.readFileSync(value('--map'),'utf8')):undefined;
 const orders=has('--orders')?JSON.parse(fs.readFileSync(value('--orders'),'utf8')):[];
 const count=has('--runs')?Number(value('--runs')):map?1:20,seed=has('--seed')?Number(value('--seed')):1947;
 const results=Array.from({length:count},(_,i)=>simulate(seed+i,{map,orders,quietOpening:has('--quiet-opening'),social:has('--social'),maxActions:has('--max-actions')?Number(value('--max-actions')):map?20000:3000}));
 console.table(results.map(({events,...r})=>({...r,scavenges:events.filter(e=>e.type==='scavenge').length,upgrades:events.filter(e=>e.type==='equip').length})));
 if(has('--output'))fs.writeFileSync(value('--output'),JSON.stringify(results,null,2));
 if(results.some(r=>!['won','lost'].includes(r.result)))process.exitCode=1;
}
