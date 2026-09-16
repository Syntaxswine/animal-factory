import test from 'node:test';
import assert from 'node:assert/strict';
import {makeBankOverlay,connectionMask} from '../dist/tactics/river-banks.js';
const size=32,grass=Uint8ClampedArray.from({length:size*size*4},(_,i)=>i%4===3?255:60+(i*7)%80);
const tiles=Array.from({length:16},(_,m)=>makeBankOverlay(m,grass,size));
test('all compatible bank edges match RGBA, including unconnected land edges',()=>{
 for(let a=0;a<16;a++)for(let b=0;b<16;b++)for(let i=0;i<size;i++){
  const pixel=(m,x,y)=>tiles[m].slice((y*size+x)*4,(y*size+x)*4+4);
  if(Boolean(a&2)===Boolean(b&8))assert.deepEqual(pixel(a,size-1,i),pixel(b,0,i));
  if(Boolean(a&4)===Boolean(b&1))assert.deepEqual(pixel(a,i,size-1),pixel(b,i,0));
 }
});
test('banks remain land at closed edges, transparent at connected openings',()=>{
 for(let m=0;m<16;m++)for(const [bit,x,y] of [[1,16,0],[2,31,16],[4,16,31],[8,0,16]])
  assert.equal(tiles[m][(y*size+x)*4+3],m&bit?0:255);
 assert.equal(connectionMask(new Set(['1,0','2,1','1,2','0,1']),1,1),15);
});
