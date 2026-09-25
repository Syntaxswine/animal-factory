// Artificial light: which placed props give light, when, from where, and how much of it reaches a point.
// Parcel I of docs/tactics/SCENERY-PORT-HANDOFF.md; see docs/tactics/ARTIFICIAL-LIGHTING.md.
//
// Ported from the 3D branch's light-sources.js at b23334c: the bulb positions, the 30-tile range, the
// stepped falloff and the on/off schedule are the same numbers, so a map lit on one branch is lit the same
// on the other. What differs is rotation: there a rotated prop is turned a quarter, (x, y) -> (-y, x); here
// it is mirrored, (x, y) -> (y, x), and the bulb mirrors with the art.
import {MINUTES_PER_DAY,DAY_START,DUSK_START,daylightStrength,DEFAULT_START_MINUTES} from './daylight.js';
import {traceProjectile,targetHeight} from './projectiles.js';

const FLOOR_HEIGHT=3;
// Shared authored bulb positions in tile units: [X, height, map Y] from the footprint centre, unrotated.
const towerLight=(w,h,pivot,tilt)=>({w,h,spot:true,tower:true,angle:Math.PI/8,pivot,offset:.34,emitters:[[pivot[0],pivot[1]-.34*Math.sin(tilt),pivot[2]+.34*Math.cos(tilt)]]});
export const LIGHT_FORMS={
 'wooden-spotlight-tower':towerLight(5,5,[-1.35,7.97,1.10],.22),
 'iron-searchlight-stair-tower':towerLight(6,5,[-.95,6.92,1.99],.35),
 'iron-searchlight-ladder-tower':towerLight(6,5,[-.95,6.92,1.99],.35),
 'spotlight':{w:1,h:1,spot:true,emitters:[[0,2.6,0]]},
 'campfire':{w:1,h:1,fire:true,emitters:[[0,.32,0]]},
 'cooking-fire':{w:2,h:2,fire:true,emitters:[[0,.32,0]]},
 'standing-torch':{w:1,h:1,fire:true,emitters:[[0,1.36,0]]},
 'wall-torch':{w:1,h:1,fire:true,wall:true,emitters:[[0,2.06,.27]]},
 'floor-lamp':{w:1,h:1,emitters:[[0,1.48,0]]},
 'bedside-table-lamp':{w:1,h:1,emitters:[[0,.605+1.48*.48,-.045]]},
 'gooseneck-sconce':{w:1,h:1,wall:true,emitters:[[0,1.62,.55]]},
 'streetlight':{w:1,h:1,emitters:[[.24,2.51,0]]},
 'streetlight-double':{w:2,h:1,emitters:[[-.66,2.51,0],[.66,2.51,0]]}
};
export const LIGHT_RANGE=30;
// 100% within five tiles, then half for every five more, and nothing past thirty.
export function lightBrightness(distance){return !Number.isFinite(distance)||distance<0||distance>LIGHT_RANGE?0:2**-Math.max(0,Math.ceil(distance/5)-1);}
// Fires always burn and electric lamps come on for the night, unless the prop says otherwise.
// A damaged fixture (condition below 100) is dark.
export function lightEnabled(prop,minutes){
 const form=LIGHT_FORMS[prop.kind];
 if(!form||prop.lightMode==='off'||(prop.condition??100)<100)return false;
 if(prop.lightMode==='on'||form.fire)return true;
 const m=((minutes%MINUTES_PER_DAY)+MINUTES_PER_DAY)%MINUTES_PER_DAY;
 return m<DAY_START||m>=DUSK_START;
}
// The bulbs of one placed prop, on the map: {x, y, h, prop, index, color}. h is in tile units, three per
// floor. Wall fixtures are not placed by this game yet (open question 5).
export function placedEmitters(p){
 const f=LIGHT_FORMS[p.kind];if(!f)return [];
 const w=p.rotated?f.h:f.w,h=p.rotated?f.w:f.h,cx=p.x+(w-1)/2,cy=p.y+(h-1)/2;
 return f.emitters.map(([x,eh,y],index)=>({x:cx+(p.rotated?y:x),y:cy+(p.rotated?x:y),h:(p.z||0)*FLOOR_HEIGHT+eh,prop:p,index,color:f.fire?0xffae55:0xffe5b2}));
}
// Every lit bulb at this minute. Spot sources, the towers and the spotlight, are aimed beams that sweep;
// they are parcel J and give no light here yet.
export function lightSources(props,minutes){
 return (props||[]).filter(p=>!LIGHT_FORMS[p.kind]?.spot&&lightEnabled(p,minutes)).flatMap(placedEmitters);
}

// The minute of day a map's state is at: the campaign clock when the world has handed it one, otherwise the
// map's own start time.
export const stateMinutes=s=>s?.clock?.minutes??s?.definition?.time?.startMinutes??DEFAULT_START_MINUTES;

// How much of one bulb reaches a point: its falloff, if nothing solid lies between them. Traced through the
// same solids sight and bullets use, without bodies, and without the fixture's own footprint.
export function lampStrength(s,lamp,origin){
 const ray={x:lamp.x-origin.x,y:lamp.y-origin.y,h:lamp.h-origin.h},distance=Math.hypot(ray.x,ray.y,ray.h),strength=lightBrightness(distance);
 if(!strength||distance<1e-6)return strength;
 const hit=traceProjectile({...s,units:[],props:(s.props||[]).filter(p=>p!==lamp.prop)},null,origin,ray,distance);
 return hit.kind==='range'||hit.distance>=distance-1e-6?strength:0;
}
// Lamplight at one point, summed over every bulb. Memoised per state for one revision and one minute:
// forty guards looking at four animals ask about four points, and bulbs only switch on whole minutes.
const lampCache=new WeakMap();
export function lampLight(s,x,y,h,minutes){
 const key=`${s.revision??0}|${Math.floor(minutes)}`;let c=lampCache.get(s);
 if(!c||c.key!==key){c={key,at:new Map()};lampCache.set(s,c);}
 const k=`${x},${y},${h}`;let v=c.at.get(k);
 if(v===undefined){v=0;for(const lamp of lightSources(s.props,minutes))v+=lampStrength(s,lamp,{x,y,h});c.at.set(k,v);}
 return v;
}
// How lit a unit's body is, 0 to 1: daylight, plus every lamp that reaches its torso, capped at full day.
export function illuminationAt(s,u,minutes=stateMinutes(s)){
 const day=daylightStrength(minutes);
 if(day>=1)return 1;
 return Math.min(1,day+lampLight(s,u.x,u.y,(u.z||0)*FLOOR_HEIGHT+targetHeight(u,'torso'),minutes));
}

// A name for the lighting at a minute that changes whenever detection could change on the clock alone,
// with nobody moving: every minute while daylight is easing (dawn, dusk). The electric lamps switch at 06:00
// and 18:00, but daylight is exactly 1 at both, so that switch changes no one's light and needs no recheck.
// The world refreshes detection when this changes (world.js tickWorld).
export function lightEpoch(minutes){
 const d=daylightStrength(minutes);
 return d>=1?'day':d<=0?'night':`easing|${Math.floor(minutes)}`;
}
// Opening a door, cutting a fence or blowing a wall changes where light reaches without moving the state's
// revision. The engine calls this wherever it does one of those: it drops the lamp memo, and bumps
// s.lightVersion, which light-render.js's drawing cache also watches.
export const forgetLight=s=>{lampCache.delete(s);s.lightVersion=(s.lightVersion||0)+1;};

// Sight through the dark, by the boss's rule of 24 September 2026: an unlit animal is seen from a quarter of
// the daylight range (15 of 60 tiles), one lit by a lamp from the full range, and in between in proportion.
export const DARK_SIGHT=.25;
export const sightScale=light=>DARK_SIGHT+(1-DARK_SIGHT)*Math.max(0,Math.min(1,light));
