import test from 'node:test';
import assert from 'node:assert/strict';
import {createHorseModel} from '../dist/tactics/hybrid-horse-model.js';
import {DIMENSIONS} from '../dist/tactics/hybrid-world.js';
import {muzzlePoint} from '../dist/tactics/hybrid-combat.js';
import {Box3,Vector3} from '../dist/tactics/vendor/three.module.js';
test('actual low-poly barrel cap and axis follow physical muzzle through continuous headings and floors',()=>{
 const model=createHorseModel();
 try{for(const stance of ['standing','kneeling','prone'])for(const heading of [0,22.5,43.59374,43.59376,45,46.40624,46.40626,90,179.9,225,315,359.999])for(const z of [0,2]){
  const u={x:4,y:9,z,hp:100,stance,heading};model.pose(stance,heading,[u.x,z*DIMENSIONS.floorSpacing,u.y]);const d=model.diagnostics(),expected=muzzlePoint({geometryMode:'hybrid'},u);
  assert.ok(Math.hypot(d.tip[0]-expected.x,d.tip[1]-expected.h,d.tip[2]-expected.y)<1e-6);
  const axis=new Vector3(...d.tip).sub(new Vector3(...d.barrelRear)).normalize(),a=heading*Math.PI/180;
  assert.ok(axis.distanceTo(new Vector3(Math.cos(a),0,Math.sin(a)))<1e-6);
  assert.ok(Math.abs(d.min[1]-z*DIMENSIONS.floorSpacing)<1e-6);assert.ok(Math.abs(d.max[1]-z*DIMENSIONS.floorSpacing-DIMENSIONS[stance])<1e-6);
 }}finally{model.dispose();}
});
test('pose rig preserves limb lengths and actual gloves intersect the rifle contact volumes',()=>{
 const model=createHorseModel(),distance=(a,b)=>new Vector3(...a).distanceTo(new Vector3(...b));
 try{for(const stance of ['standing','kneeling','prone']){model.pose(stance,137.2);const d=model.diagnostics();for(const joint of Object.values(d.joints)){
  assert.ok(Math.abs(distance(joint.hip,joint.knee)-.34)<1e-8);assert.ok(Math.abs(distance(joint.knee,joint.ankle)-.34)<1e-8);
  assert.ok(Math.abs(distance(joint.shoulder,joint.elbow)-.28)<1e-8);assert.ok(Math.abs(distance(joint.elbow,joint.grip)-.28)<1e-8);
 }
 for(let i=0;i<2;i++)assert.ok(distance(d.hands[i],d.grips[i])<1e-8);
 for(const [glove,weapon]of [['glove-1','foreend'],['glove1','receiver']]){
  const a=new Box3().setFromObject(model.parts.find(p=>p.name===glove)),b=new Box3().setFromObject(model.parts.find(p=>p.name===weapon));assert.ok(a.intersectsBox(b),stance+' '+glove);
 }
 assert.ok(d.triangles<6000);assert.ok(d.meshes<60);
 }}finally{model.dispose();}
});

test('relaxed carry lowers elbows while retaining hand contact and upright bounds',()=>{
 const model=createHorseModel();try{for(const stance of ['standing','kneeling'])for(const heading of [0,22.5,90,137.2,225,315]){
  model.pose(stance,heading);const aim=model.diagnostics();model.pose(stance,heading,[0,0,0],{carry:1});const carry=model.diagnostics();
  assert.ok(Math.abs(carry.max[1]-DIMENSIONS[stance])<1e-6);assert.ok(Math.abs(carry.min[1])<1e-6);
  for(const side of [-1,1])assert.ok(carry.joints[side].elbow[1]<aim.joints[side].elbow[1]);
  for(const [glove,weapon]of [['glove-1','foreend'],['glove1','receiver']])assert.ok(new Box3().setFromObject(model.parts.find(p=>p.name===glove)).intersectsBox(new Box3().setFromObject(model.parts.find(p=>p.name===weapon))));
 }}finally{model.dispose();}
});
