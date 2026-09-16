import test from 'node:test';
import assert from 'node:assert/strict';
import {characterArt,CHARACTER_SPECIES,ARMED_WEAPONS,OVERLAY_WEAPONS} from '../dist/tactics/character-art.js';
import {WEAPONS} from '../dist/tactics/engine.js';
import {weaponExpansionArt,EXPANSION_WEAPONS} from '../dist/tactics/weapon-expansion-art.js';
import {drawFlamethrower} from '../dist/tactics/flamethrower-art.js';

test('finished explosive and flamethrower sprites suppress temporary equipment overlays',()=>{
 for(const weapon of ['grenade','launcher','rpg','flamethrower'])for(const stance of ['standing','kneeling','prone']){
  assert.ok(weaponExpansionArt('horse',weapon,stance));
  // Any canvas access would fail: the equipment is already painted into the sprite.
  assert.doesNotThrow(()=>drawFlamethrower(null,{species:'horse',weapon,stance},1));
 }
});
test('every equipped weapon has artwork for the full cast, with a common ground baseline',()=>{
 assert.deepEqual([...new Set([...ARMED_WEAPONS,...OVERLAY_WEAPONS,...EXPANSION_WEAPONS.filter(w=>WEAPONS[w])])].sort(),Object.keys(WEAPONS).filter(w=>w!=='hands').sort());
 for(const species of CHARACTER_SPECIES)for(const weapon of Object.keys(WEAPONS)){
  const frame=characterArt(species,weapon);
  assert.equal(frame.anchor[1],244);assert.equal(frame.height,256);assert.equal(frame.anchor[0],frame.width/2);
  if(weapon==='hands')assert.equal(frame.src,`../assets/characters/${species}-idle.png`);
  else assert.equal(characterArt(species,weapon,'walk-a').src,frame.src);
 }
 assert.equal(characterArt('horse','hands','walk-b').src,'../assets/characters/horse-walk-b.png');
});
test('stance artwork covers every loadout and stays grounded while changing silhouette',()=>{
 for(const species of CHARACTER_SPECIES)for(const weapon of Object.keys(WEAPONS)){
  const standing=characterArt(species,weapon),kneeling=characterArt(species,weapon,'idle','kneeling'),prone=characterArt(species,weapon,'idle','prone');
  assert.ok(standing.contentHeight>kneeling.contentHeight&&kneeling.contentHeight>prone.contentHeight);
  for(const [stance,frame]of [['kneeling',kneeling],['prone',prone]]){
   const expanded=weaponExpansionArt(species,weapon,stance);
   assert.equal(frame.src,expanded?.src||`../assets/characters/stances/${species}-${OVERLAY_WEAPONS.includes(weapon)?'hands':weapon}-${stance}.png`);
   if(expanded)assert.equal(frame.overlay,undefined);
   else if(OVERLAY_WEAPONS.includes(weapon))assert.equal(frame.overlay,weapon);
   assert.equal(frame.anchor[1],standing.anchor[1]);assert.equal(frame.anchor[0],frame.width/2);
   assert.equal(characterArt(species,weapon,'walk-b',stance).src,frame.src);
  }
 }
});
