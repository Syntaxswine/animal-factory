import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../dist/tactics/vendor/three.module.js';
import {softBox,createPaintedEnvironment,STUDY_LAYOUT} from '../dist/tactics/painted-environment-scene.js';
test('softened parts retain finite surfaces and intended depth at small and structural sizes',()=>{
 for(const size of [[.197,.77,.055],[.5,.234,.27],[5,.13,4]]){const g=softBox(...size);g.computeBoundingBox();const extents=g.boundingBox.getSize(new THREE.Vector3());assert(Math.abs(extents.z-size[2])<1e-6);for(let i=0;i<3;i++)assert(extents.getComponent(i)<=size[i]+.025);assert([...g.attributes.normal.array,...g.attributes.uv.array,...g.attributes.position.array].every(Number.isFinite));g.dispose();}
});
test('painted doorway retains a clear one-tile opening and horse asset is not part of scenery',()=>{
 const atlas=new THREE.Texture(),model=createPaintedEnvironment(atlas);model.root.updateMatrixWorld(true);
 // Ray through every part of the usable doorway, above the floor and below lintel.
 for(const x of [1.55,2,2.45])for(const y of [.1,.8,1.6]){
  const ray=new THREE.Raycaster(new THREE.Vector3(x,y,-.2),new THREE.Vector3(0,0,1),0,1.1);
  assert.equal(ray.intersectObject(model.root,true).length,0,`doorway blocked at ${x},${y}`);
 }
 assert(model.root.children.every(o=>!o.isSkinnedMesh));assert.equal(STUDY_LAYOUT.doorHeight,1.65);assert(model.diagnostics().triangles<30000);model.dispose();atlas.dispose();
});
