import test from 'node:test';import assert from 'node:assert/strict';
import {surfaceUV,surfacePixels,MATERIAL_DENSITY} from '../dist/tactics/hybrid-materials.js';
import {ROOM_SURFACES,createRoomArt,cullInternalSlabFaces} from '../dist/tactics/hybrid-room-art.js';
import {BoxGeometry} from '../dist/tactics/vendor/three.module.js';
test('brick density follows world distances across tall, short and neighboring faces',()=>{
 for(const normal of [[1,0,0],[0,0,1]]){
  const a=surfaceUV([0,0,0],normal),b=surfaceUV([0,2,0],normal),c=surfaceUV([0,.8,0],normal);
  assert.equal((b[1]-a[1])/MATERIAL_DENSITY.brickCourse,10);assert.equal((c[1]-a[1])/MATERIAL_DENSITY.brickCourse,4);
 }
 assert.deepEqual(surfaceUV([2,1,3],[0,0,1]),surfaceUV([2,1,3],[0,0,-1]));
 assert.deepEqual(surfacePixels('brick'),surfacePixels('brick'));assert.equal(surfacePixels('metal').data.length,128*128*4);
});
test('painted room material keeps four brick widths and ten courses per repeat',()=>{
 assert.equal(ROOM_SURFACES.brick.period/MATERIAL_DENSITY.brickWidth,4);
 assert.equal(ROOM_SURFACES.brick.period/MATERIAL_DENSITY.brickCourse,10);
 // Importing the presentation module performs no DOM/renderer initialization.
 assert.equal(typeof createRoomArt,'function');
});
test('shared slab sides are culled while perimeter and stair-hole edges remain',()=>{
 const box={id:'floor:4,4,1',source:{x:4,y:4,z:1}},g=new BoxGeometry(1,.12,1);
 cullInternalSlabFaces(g,box,new Set(['5,4,1','3,4,1','4,5,1','4,3,1']));assert.equal(g.index.count,12);assert.deepEqual(g.groups.map(g=>g.materialIndex),[2,3]);g.dispose();
 const edge=new BoxGeometry(1,.12,1);cullInternalSlabFaces(edge,box,new Set(['5,4,1','3,4,1','4,5,1','4,3,0']));assert.ok(edge.groups.some(g=>g.materialIndex===5),'missing same-level neighbor exposes stair/void edge');assert.equal(edge.index.count,18);edge.dispose();
});
