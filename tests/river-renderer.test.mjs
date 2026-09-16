import test from 'node:test';
import assert from 'node:assert/strict';
import {riverMasks} from '../dist/tactics/river-renderer.js';
test('river banks retain open centers in isolated pools and open water under bridges',()=>{
 assert.deepEqual(riverMasks(()=> 'water',0,0),[0,0,0,0]);
 assert.deepEqual(riverMasks((x,y)=>x===0&&y===0?'water':'yard',0,0),[11,7,13,14]);
 assert.deepEqual(riverMasks((x,y)=>x===1?'bridge':'water',0,0),[0,0,0,0]);
});
test('adjacent water quadrants agree on shared edge corners across surrounding terrain',()=>{
 for(let seed=0;seed<256;seed++){
  const terrain=(x,y)=>y===0&&(x===0||x===1)?'water':seed&(1<<(((x+3)*5+(y+3)*3)%8))?'yard':'water';
  const a=riverMasks(terrain,0,0),b=riverMasks(terrain,1,0);
  for(const [left,right]of [[a[1],b[0]],[a[3],b[2]],[a[0],a[1]],[a[2],a[3]]]){assert.equal(!!(left&2),!!(right&1));assert.equal(!!(left&4),!!(right&8));}
  for(const [top,bottom]of [[a[0],a[2]],[a[1],a[3]]]){assert.equal(!!(top&8),!!(bottom&1));assert.equal(!!(top&4),!!(bottom&2));}
 }
});
