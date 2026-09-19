// Headless player: map knowledge for navigation, normal engine rules for every action.
import fs from 'node:fs';
import {createGame,squad,guards,refresh,WEAPONS} from '../dist/tactics/engine.js';
import {enlist} from '../dist/tactics/world.js';
import {build,buildRecruit,recruitSocial} from '../dist/tactics/recruits.js';
import {parseMap} from '../dist/tactics/maps.js';
import {createSquadBot,stepSquadBot} from './tactics-squad-bot.mjs';
// --roster: a comma list of `cast` (the four comrades) and `gX` (a hired merc of grade X, 0..1: $100 a day at 0, $10,000 at 1, recruits.js).
// Recruits take the squad starts when the cast is absent (a merc fielded alone), and arrive beside the first comrade otherwise. `cast` alone is the control.
export function rosterCast(roster){const grades=roster.filter(t=>/^g[\d.]+$/.test(t)).map(t=>Number(t.slice(1)));return {cast:roster.includes('cast')||!grades.length,grades};}
export function simulate(seed,{map,maxActions=3000,roster=['cast'],...options}={}){
 const {cast,grades}=rosterCast(roster),recruits=grades.map((g,i)=>build({name:'Recruit '+String.fromCharCode(65+i),species:'horse',archetype:'Hero',grade:g}));
 const s=createGame(seed,map,true,'standard',{social:!!options.social,cast:cast?undefined:recruits.slice(0,4).map(c=>({name:c.name,species:c.species,weapon:c.kit.weapon}))}),bot=createSquadBot(options);let actions=0,stalled=false;
 if(recruits.length){for(const [i,c] of recruits.entries()){const u=cast?null:s.units.find(v=>v.team==='squad'&&v.name===c.name);if(u){buildRecruit(u,c,WEAPONS);recruitSocial(u,s.units.filter(v=>v.team==='squad'&&v!==u),!!options.social);}else enlist(s,c,{id:1000+i,social:!!options.social});}refresh(s);}
 while(!['won','lost'].includes(s.phase)&&actions++<maxActions){if(!stepSquadBot(s,bot)){stalled=true;break;}}
 return {seed,result:s.phase,actions,round:s.round,survivors:squad(s).length,guards:guards(s).length,hp:squad(s).reduce((n,u)=>n+u.hp,0),stalled,events:bot.events};
}
if(process.argv[1]?.endsWith('tactics-balance.mjs')){
 const args=process.argv.slice(2),value=name=>args[args.indexOf(name)+1],has=name=>args.includes(name);
 const map=has('--map')?parseMap(fs.readFileSync(value('--map'),'utf8')):undefined;
 const orders=has('--orders')?JSON.parse(fs.readFileSync(value('--orders'),'utf8')):[];
 const count=has('--runs')?Number(value('--runs')):map?1:20,seed=has('--seed')?Number(value('--seed')):1947;
 const results=Array.from({length:count},(_,i)=>simulate(seed+i,{map,orders,quietOpening:has('--quiet-opening'),social:has('--social'),roster:has('--roster')?value('--roster').split(','):['cast'],maxActions:has('--max-actions')?Number(value('--max-actions')):map?20000:3000}));
 console.table(results.map(({events,...r})=>({...r,scavenges:events.filter(e=>e.type==='scavenge').length,upgrades:events.filter(e=>e.type==='equip').length})));
 if(has('--output'))fs.writeFileSync(value('--output'),JSON.stringify(results,null,2));
 if(results.some(r=>!['won','lost'].includes(r.result)))process.exitCode=1;
}
