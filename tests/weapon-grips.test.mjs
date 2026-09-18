import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from '../dist/tactics/vendor/three.module.js';
import {createWeaponModel} from '../dist/tactics/weapon-models.js';
import {createLightHorse} from '../dist/tactics/horse-light-model.js';
import {surfaceComponents} from '../dist/tactics/grey-surface.js';
const data=JSON.parse(fs.readFileSync(new URL('../dist/tactics/horse-10k-data.json',import.meta.url)));
function capCenters(mesh){
 const g=mesh.geometry,p=g.attributes.position;
 return g.groups.slice(1,3).map(group=>{const v=new T.Vector3();for(let i=group.start;i<group.start+group.count;i++)v.add(new T.Vector3().fromBufferAttribute(p,g.index.getX(i)));return v.multiplyScalar(1/group.count).applyMatrix4(mesh.matrixWorld);});
}
test('PPSh drum end caps, rims and hub face along the actual bore',()=>{
 const w=createWeaponModel('smg');try{w.root.updateMatrixWorld(true);
  const [a,b]=capCenters(w.parts.find(p=>p.name==='drum magazine')),[c,d]=capCenters(w.parts.find(p=>p.name==='barrel'));
  assert.ok(Math.abs(a.sub(b).normalize().dot(c.sub(d).normalize()))>1-1e-8);
  for(const rim of w.parts.filter(p=>p.name==='drum rim'))assert.ok(Math.abs(new T.Vector3(0,0,1).applyQuaternion(rim.quaternion).x)>1-1e-8);
  for(const hub of w.parts.filter(p=>p.name==='drum hub')){const [x,y]=capCenters(hub);assert.ok(Math.abs(x.sub(y).normalize().x)>1-1e-8);}
 }finally{w.dispose();}
});
test('launcher bore aligns with a real top chamber, above the drum center',()=>{
 const w=createWeaponModel('launcher');try{w.root.updateMatrixWorld(true);
  const center=capCenters(w.parts.find(p=>p.name==='revolving cylinder'))[0],barrel=capCenters(w.parts.find(p=>p.name==='barrel'))[0];
  assert.ok(barrel.y-center.y>.045);assert.ok(Math.abs(barrel.z-center.z)<1e-7);
  assert.ok(w.parts.filter(p=>p.name.startsWith('chamber ridge')).some(p=>{const v=capCenters(p)[0];return Math.hypot(v.y-barrel.y,v.z-barrel.z)<1e-7;}));
  assert.ok(Math.abs(w.anchors.muzzle.position.y-barrel.y)<1e-7);
 }finally{w.dispose();}
});
test('HMG grasp surrounds the named handle with fingers, palm and opposing thumb and clears the shroud',()=>{
 const h=createLightHorse(data),w=createWeaponModel('hmg');h.equipWeapon(w);
 try{for(const heading of [0,37,90,180,-90]){
  h.pose('carry',heading);const hand=h.gripHands[0],handle=w.gripTargets.support;
  assert.equal(handle.name,'upper handle grip');assert.ok(hand.visible);
  assert.equal(surfaceComponents(hand.geometry),1);
  const anchor=w.anchors.support.getWorldPosition(new T.Vector3()),q=w.root.getWorldQuaternion(new T.Quaternion());
  const ends=capCenters(handle),mid=ends[0].clone().add(ends[1]).multiplyScalar(.5);
  assert.ok(anchor.distanceTo(mid)<1e-7,'anchor must be on the actual graspable bar');
  // Rays originate inside the handle channel. Hits must land on opposing glove
  // surfaces close to the 0.013-radius bar, not on any convenient weapon mesh.
  for(const x of [-.033,-.011,.011,.033])for(const direction of [[0,1,0],[0,0,-1],[0,-1,0]]){
   const origin=anchor.clone().add(new T.Vector3(x,0,0).applyQuaternion(q)),ray=new T.Raycaster(origin,new T.Vector3(...direction).applyQuaternion(q));
   const hit=ray.intersectObject(hand,false)[0];assert.ok(hit,`missing wrap at finger ${x}, ${direction}`);
   assert.ok(hit.distance>=.010&&hit.distance<.035,`grip channel radius ${hit.distance}`);
  }
  const thumbRay=new T.Raycaster(anchor.clone().add(new T.Vector3(-.04,0,0).applyQuaternion(q)),new T.Vector3(0,0,1).applyQuaternion(q));
  assert.ok(thumbRay.intersectObject(hand,false)[0]?.distance<.043,'opposing thumb');
  // A separating plane bounds entire rendered triangles, so this also excludes
  // crossings between vertices (unlike a nearest-point-only contact check).
  const shroud=w.parts.find(p=>p.name==='heavy barrel shroud');shroud.geometry.computeBoundingBox();
  const top=shroud.geometry.boundingBox.max.y;
  for(const mesh of [hand,...hand.children]){const p=mesh.geometry.attributes.position;for(let i=0;i<p.count;i++){
   const v=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);w.root.worldToLocal(v);
   assert.ok(v.y>top+.015,'glove/cuff triangle envelope intersects shroud clearance plane');
   if(mesh!==hand)assert.ok(v.y>w.anchors.support.position.y+.015,'cuff crosses the graspable bar');
  }}
 }}finally{h.equipWeapon();w.dispose();h.dispose();}
});
test('changing equipment restores the original hand, skin weights, mesh and triangle budget',()=>{
 const h=createLightHorse(data),w=createWeaponModel('hmg'),arm=h.parts.find(p=>p.name==='forearm and hand -1');
 const original={index:arm.geometry.index,position:arm.geometry.attributes.position,weights:arm.geometry.attributes.skinWeight};
 try{h.equipWeapon(w);h.pose('carry');assert.ok(h.gripHands[0].visible);assert.notEqual(arm.geometry.index,original.index);
  h.equipWeapon();h.pose('carry');assert.equal(h.gripHands[0].visible,false);assert.deepEqual(Array.from(arm.geometry.index.array),Array.from(original.index.array));
  assert.equal(arm.geometry.attributes.position,original.position);assert.equal(arm.geometry.attributes.skinWeight,original.weights);assert.equal(h.diagnostics().triangles,10300);
 }finally{w.dispose();h.dispose();}
});
