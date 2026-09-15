import {characterArt,ARMED_WEAPONS,CHARACTER_STANCES} from "./character-art.js";
export const RED_HAT_SPECIES=["horse","goat","donkey","sheep","cow","hen","pig-foreman"];
export {ARMED_WEAPONS,CHARACTER_STANCES};
export function redHatArt(species,weapon="hands",stance="standing"){
 if(!RED_HAT_SPECIES.includes(species)||!CHARACTER_STANCES.includes(stance))return null;
 if(weapon!=="hands"&&!ARMED_WEAPONS.includes(weapon))return null;
 if(species==="pig-foreman")return characterArt(species,weapon,"idle",stance);
 if(weapon==="hands")return stance==="standing"?{src:`../assets/characters/red-hats/${species}-idle.png`,width:256,height:256,anchor:[128,244],contentHeight:236}:null;
 return {src:`../assets/characters/red-hats/${species}-${weapon}-${stance}.png`,width:384,height:256,anchor:[192,244],contentHeight:stance==="standing"?236:stance==="kneeling"?176:96};
}
