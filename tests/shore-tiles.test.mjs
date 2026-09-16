import test from 'node:test';
import assert from 'node:assert/strict';
import {makeShoreOverlay,shoreField,shoreMask} from '../dist/tactics/shore-tiles.js';
const size=24,grass=Uint8ClampedArray.from({length:size*size*4},(_,i)=>i%4===3?255:70+i%50);
const tiles=Array.from({length:48},(_,i)=>makeShoreOverlay(i%16,Math.floor(i/16),grass,size));
test('all compatible corner tile boundaries match across every variant',()=>{
 const px=(t,x,y)=>tiles[t].slice((y*size+x)*4,(y*size+x)*4+4);
 for(let a=0;a<48;a++)for(let b=0;b<48;b++){
  const m=a%16,n=b%16;
  const horizontal=Boolean(m&2)===Boolean(n&1)&&Boolean(m&4)===Boolean(n&8);
  const vertical=Boolean(m&8)===Boolean(n&1)&&Boolean(m&4)===Boolean(n&2);
  for(let i=0;i<size;i++){
   if(horizontal)assert.deepEqual(px(a,size-1,i),px(b,0,i));
   if(vertical)assert.deepEqual(px(a,i,size-1),px(b,i,0));
  }
 }
});
test('variants change interiors while preserving midpoint crossings',()=>{
 assert.notDeepEqual(tiles[3],tiles[19]);assert.notDeepEqual(tiles[19],tiles[35]);
 for(let v=0;v<3;v++){assert.ok(Math.abs(shoreField(1,.5,0,v))<1e-10);assert.ok(Math.abs(shoreField(1,0,.5,v))<1e-10);}
 assert.equal(shoreMask((x,y)=>x===0&&y===0,0,0),1);
 for(let i=3;i<tiles[0].length;i+=4)assert.equal(tiles[0][i],0);
 for(let i=3;i<tiles[15].length;i+=4)assert.equal(tiles[15][i],255);
});
