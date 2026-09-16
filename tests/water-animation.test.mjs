import test from 'node:test';
import assert from 'node:assert/strict';
import {makePeriodic,waterPixel,renderWaterFrame,LOOP_SECONDS} from '../dist/tactics/water-animation.js';
const source=Uint8ClampedArray.from({length:32*32*4},(_,i)=>i%4===3?255:(i*37)%256);
const size=32,base=makePeriodic(source,32,32,size);
test('animation does not add brightness stripes to uniform water',()=>{
 const flat=new Uint8ClampedArray(32*32*4);
 for(let i=0;i<flat.length;i+=4)flat.set([90,100,70,255],i);
 const prepared=makePeriodic(flat,32,32,32);
 for(const t of [0,1,3,5.9])assert.deepEqual(renderWaterFrame(prepared,32,t),flat);
});
test('opposite water edges match throughout the loop, including corners',()=>{
 for(const t of [0,.25,1.8,3,5.99,6]){
  const frame=renderWaterFrame(base,size,t);
  for(let i=0;i<size;i++){
   assert.deepEqual(frame.slice(i*size*4,i*size*4+4),frame.slice((i*size+size-1)*4,(i*size+size)*4));
   assert.deepEqual(frame.slice(i*4,i*4+4),frame.slice(((size-1)*size+i)*4,((size-1)*size+i)*4+4));
  }
 }
});
test('animation closes exactly and actually changes between phases',()=>{
 assert.deepEqual(renderWaterFrame(base,size,0),renderWaterFrame(base,size,LOOP_SECONDS));
 assert.notDeepEqual(renderWaterFrame(base,size,0),renderWaterFrame(base,size,2));
 for(const [u,v] of [[.1,.8],[.7,.2],[0,0]]){
  const a=waterPixel(base,size,u,v,LOOP_SECONDS-.00001),b=waterPixel(base,size,u,v,.00001);
  assert.ok(a.every((n,i)=>Math.abs(n-b[i])<=1),'no temporal jump at wrap');
 }
});
