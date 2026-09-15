import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {characterArt,CHARACTER_SPECIES,CHARACTER_STANCES,ARMED_WEAPONS} from '../dist/tactics/character-art.js';
import {redHatArt,RED_HAT_SPECIES} from '../dist/tactics/red-hats-art.js';
import {blankMap,validateMap} from '../dist/tactics/maps.js';
import {createGame} from '../dist/tactics/engine.js';

test('skunk has all 30 outfit, weapon and stance combinations',async()=>{
 assert.ok(CHARACTER_SPECIES.includes('skunk'));assert.ok(RED_HAT_SPECIES.includes('skunk'));
 const paths=new Set();
 for(const selector of [(w,s)=>characterArt('skunk',w,'idle',s),(w,s)=>redHatArt('skunk',w,s)]){
  for(const stance of CHARACTER_STANCES)for(const weapon of ['hands',...ARMED_WEAPONS]){
   const frame=selector(weapon,stance);assert.ok(frame);paths.add(frame.src);
   const png=await readFile(new URL('../dist/tactics/'+frame.src,import.meta.url));
   assert.equal(png.readUInt32BE(16),frame.width);assert.equal(png.readUInt32BE(20),frame.height);assert.equal(png[25],6);
   assert.deepEqual(frame.anchor,[frame.width/2,244]);
   if(stance==='prone')assert.equal(frame.width,512);
  }
 }
 assert.equal(paths.size,30);
 assert.equal(characterArt('skunk','hands','walk-a').src,characterArt('skunk').src);
 assert.equal(characterArt('skunk','hands','walk-b').src,characterArt('skunk').src);
});

test('skunk guards survive map validation and game creation with every weapon',()=>{
 const map=blankMap();map.guards=['hands',...ARMED_WEAPONS].map((weapon,i)=>({x:10+i,y:10,z:0,species:'skunk',weapon}));
 assert.deepEqual(validateMap(map),[]);
 const game=createGame(1947,JSON.parse(JSON.stringify(map)),false);
 assert.deepEqual(game.units.filter(u=>u.team==='guard').map(u=>[u.species,u.weapon]),map.guards.map(u=>[u.species,u.weapon]));
});
