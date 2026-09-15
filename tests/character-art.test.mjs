import test from 'node:test';
import assert from 'node:assert/strict';
import {characterArt,CHARACTER_SPECIES,ARMED_WEAPONS} from '../dist/tactics/character-art.js';
import {WEAPONS} from '../dist/tactics/engine.js';
test('every equipped weapon has artwork for the full cast, with a common ground baseline',()=>{
 assert.deepEqual(ARMED_WEAPONS.slice().sort(),Object.keys(WEAPONS).filter(w=>w!=='hands').sort());
 for(const species of CHARACTER_SPECIES)for(const weapon of Object.keys(WEAPONS)){
  const frame=characterArt(species,weapon);
  assert.equal(frame.anchor[1],244);assert.equal(frame.height,256);assert.equal(frame.anchor[0],frame.width/2);
  if(weapon==='hands')assert.equal(frame.src,`../assets/characters/${species}-idle.png`);
  else assert.equal(characterArt(species,weapon,'walk-a').src,frame.src);
 }
 assert.equal(characterArt('horse','hands','walk-b').src,'../assets/characters/horse-walk-b.png');
});
