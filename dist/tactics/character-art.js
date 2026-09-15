export const CHARACTER_SPECIES=['horse','goat','donkey','sheep','cow','hen','pig-foreman','pig-director'];
export const ARMED_WEAPONS=['knife','pistol','rifle','assault'];
export function characterArt(species,weapon='hands',pose='idle'){
 const armed=ARMED_WEAPONS.includes(weapon);
 return {src:armed?`../assets/characters/armed/${species}-${weapon}.png`:`../assets/characters/${species}-${pose}.png`,width:armed?256:192,height:256,anchor:[armed?128:96,244]};
}
