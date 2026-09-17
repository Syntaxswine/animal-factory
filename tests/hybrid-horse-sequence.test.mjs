import test from 'node:test';
import assert from 'node:assert/strict';
import {createHorseModel} from '../dist/tactics/hybrid-horse-model.js';
import {horseSequence,SHOT_TIME} from '../dist/tactics/hybrid-horse-sequence.js';
import {muzzlePoint} from '../dist/tactics/hybrid-combat.js';
import {Vector3,Box3} from '../dist/tactics/vendor/three.module.js';
const distance=(a,b)=>new Vector3(...a).distanceTo(new Vector3(...b));
test('animated poses retain limb lengths, ground clearance and planted walking contacts',()=>{
 const m=createHorseModel();let previous=null;
 try{for(let i=0;i<=1000;i++){
  const t=i/100,s=horseSequence(t);m.pose(s.stance,0,[s.distance,0,0],s.motion);const d=m.diagnostics();
  assert.ok(Math.abs(d.min[1])<1e-6,`ground support at ${t}: ${d.min[1]}`);
  for(const side of [-1,1]){const j=d.joints[side];
   for(const [a,b,length]of [[j.hip,j.knee,.34],[j.knee,j.ankle,.34],[j.shoulder,j.elbow,.28],[j.elbow,j.grip,.28]])assert.ok(Math.abs(distance(a,b)-length)<1e-7);
   if(previous&&t<3&&s.motion.feet[side].planted&&previous.state.motion.feet[side].planted){const before=previous.d.joints[side].ankle[0]+previous.state.distance,now=j.ankle[0]+s.distance;assert.ok(Math.abs(now-before)<1e-7,'planted foot slid');}
   if(previous&&t>3.5&&side===1){assert.ok(Math.abs(j.ankle[0]+s.distance-previous.d.joints[side].ankle[0]-previous.state.distance)<1e-7,'front support foot slid during stance change');}
   if(previous)for(const key of ['hip','knee','ankle','shoulder','elbow','grip'])assert.ok(distance(j[key],previous.d.joints[side][key])<.04,`joint jump at ${t}/${key}`);
  }
  for(let h=0;h<2;h++)assert.ok(distance(d.hands[h],d.grips[h])<1e-7);
  previous={state:s,d};
 }
 const s=horseSequence(5.9);m.pose(s.stance,0,[0,0,0],s.motion);
 const knee=new Box3().setFromObject(m.parts.find(p=>p.name==='knee-1'));
 assert.ok(Math.abs(knee.min.y)<1e-6,'kneeling rear knee must support on floor');
 }finally{m.dispose();}
});
test('discharge uses physical muzzle before recoil and timestamp evaluation is repeatable',()=>{
 const m=createHorseModel();try{for(const heading of [0,22.5,137.2,315]){
  const shot=horseSequence(SHOT_TIME);assert.equal(shot.motion.recoil,0);assert.ok(Math.abs(shot.motion.readyPitch)<1e-10);
  m.pose('kneeling',heading,[4,0,7],shot.motion);const before=m.diagnostics(),p=muzzlePoint({geometryMode:'hybrid'},{x:4,y:7,z:0,hp:100,stance:'kneeling',heading});
  assert.ok(distance(before.tip,[p.x,p.h,p.y])<1e-6);
  const a=heading*Math.PI/180;assert.ok(new Vector3(...before.tip).sub(new Vector3(...before.barrelRear)).normalize().distanceTo(new Vector3(Math.cos(a),0,Math.sin(a)))<1e-6);
  const recoil=horseSequence(6.2);m.pose('kneeling',heading,[4,0,7],recoil.motion);assert.ok(distance(before.tip,m.diagnostics().tip)>.01);
  m.pose('kneeling',heading,[4,0,7],shot.motion);assert.deepEqual(m.diagnostics(),before);
 }}finally{m.dispose();}
});
