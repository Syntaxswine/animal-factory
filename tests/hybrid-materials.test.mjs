import test from 'node:test';import assert from 'node:assert/strict';
import {surfaceUV,surfacePixels,MATERIAL_DENSITY} from '../dist/tactics/hybrid-materials.js';
test('brick density follows world distances across tall, short and neighboring faces',()=>{
 for(const normal of [[1,0,0],[0,0,1]]){
  const a=surfaceUV([0,0,0],normal),b=surfaceUV([0,2,0],normal),c=surfaceUV([0,.8,0],normal);
  assert.equal((b[1]-a[1])/MATERIAL_DENSITY.brickCourse,10);assert.equal((c[1]-a[1])/MATERIAL_DENSITY.brickCourse,4);
 }
 assert.deepEqual(surfaceUV([2,1,3],[0,0,1]),surfaceUV([2,1,3],[0,0,-1]));
 assert.deepEqual(surfacePixels('brick'),surfacePixels('brick'));assert.equal(surfacePixels('metal').data.length,128*128*4);
});
