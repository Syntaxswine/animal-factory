// Diagnostic replay only: commands call the same exported actions as app.js.
import {createGame,move,stepMovement,setStance,turnTo,attack,refresh} from './engine.js';
import {bulletTrajectory,shotgunTrajectories} from './projectiles.js';
import {explosiveTrajectory,detonate} from './explosives.js';
export function probeHybridBoundaries(map){
 const s=createGame(1947,map,false,'standard',{geometryMode:'hybrid'}),a=s.units[0],b=s.units[1];s.units=[a,b];
 a.x=5;a.y=6.5;b.x=5;b.y=5;b.heading=90;b.stance='prone';
 const bullet=bulletTrajectory(s,a,b,{accurate:true,zone:'legs',reach:10},()=>0);
 b.heading=0;const pellets=shotgunTrajectories(s,a,b,{accurate:true,zone:'head',reach:10,pellets:1},()=>0);
 a.x=3;a.y=3;b.x=3;b.y=3;b.z=1;b.stance='standing';
 const roof=explosiveTrajectory(s,a,{x:3,y:5,z:0,ground:true},{arc:true,range:10},{chance:100},()=>.1);
 const victims=detonate(s,roof,{blast:4,damage:100}).hits.map(h=>({id:h.unit.id,damage:h.damage}));
 return {bullet,pellets,roof,victims};
}
export function replayHybrid(map,present=()=>{}){
 const definition=structuredClone(map);definition.guards=[{x:7,y:5,z:0,species:'cow',weapon:'rifle',outfit:'red-hats',heading:90}];
 const s=createGame(1947,definition,false,'standard',{geometryMode:'hybrid'}),events=[];
 // Fixed diagnostic knowledge, explicitly separate from a player observation API.
 for(let y=0;y<12;y++)for(let x=0;x<12;x++)s.seen.add(`${x},${y}`);
 refresh(s);const a=s.units[0],target=s.units[4];present(s);
 const record=(command,run)=>{const ok=run();events.push({command,ok,seed:s.seed,phase:s.phase,units:s.units.map(u=>({id:u.id,x:u.x,y:u.y,z:u.z,hp:u.hp,ap:u.ap,stance:u.stance,ammo:{...u.ammo}})),effect:structuredClone(s.effect),edges:{...s.edges}});present(s);};
 for(const y of [8,7])record(`move 0 5 ${y}`,()=>{if(!move(s,a,5,y))return false;let ticks=0;while(s.queue.length&&ticks++<20)stepMovement(s);return a.x===5&&a.y===y;});
 record('turn 0 315',()=>turnTo(s,a,315));record('kneel 0',()=>setStance(s,a,'kneeling'));
 record('attack 0 4 torso',()=>attack(s,a,target,false,false,'torso'));
 return {events,state:JSON.parse(JSON.stringify(s,(_key,value)=>value instanceof Set?[...value].sort():value))};
}
