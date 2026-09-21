import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import * as T from '../dist/tactics/vendor/three.module.js';
import {createDogWorker} from '../dist/tactics/dog-guard.js';
import {createDogMotion,DOG_SHOT_TIME} from '../dist/tactics/dog-motion.js';
const data=JSON.parse(fs.readFileSync(new URL('../dist/tactics/dog-guard-10k-data.json',import.meta.url))),v=a=>new T.Vector3(...a),distance=(a,b)=>v(a).distanceTo(v(b));
function create(){const worker=createDogWorker(data),motion=createDogMotion(worker);return {worker,motion,dispose(){motion.dispose();worker.dispose();}};}
function points(mesh,predicate=()=>true){const p=mesh.geometry.attributes.position,out=[];for(let i=0;i<p.count;i++)if(predicate(p,i)){const q=new T.Vector3().fromBufferAttribute(p,i);mesh.applyBoneTransform(i,q);out.push(q.applyMatrix4(mesh.matrixWorld));}return out;}
test('dog motion: dense sampling preserves bone lengths, actual paw support, grip surfaces and continuity',()=>{
 const m=create();try{
  const lengths=new Map();for(const b of m.worker.bones)if(b.parent.isBone)lengths.set(b.name,b.position.length());
  const soles=[-1,1].map(side=>m.worker.parts.find(p=>p.name==='furry dog foot '+side));let previous;
  for(let i=0;i<=550;i++){
   const time=i*.02;m.motion.apply(time);const d=m.motion.diagnostics();
   for(const b of m.worker.bones)if(lengths.has(b.name))assert.ok(Math.abs(b.position.length()-lengths.get(b.name))<1e-8,'bone length '+b.name);
   let support=false;
   const currentSoles=soles.map((mesh,index)=>{const p=points(mesh,(a,j)=>a.getY(j)<.075),min=Math.min(...p.map(q=>q.y)),side=index===0?-1:1;assert.ok(min>=-1e-6,`paw floor ${time}/${side}`);if(d.feet[side].planted){assert.ok(Math.abs(min)<1e-6,`planted sole ${time}/${side}`);support=true;}if(previous&&d.feet[side].planted&&previous.d.feet[side].planted){for(let j=0;j<p.length;j++)assert.ok(p[j].distanceTo(previous.soles[index][j])<1e-7,`world planted paw slid ${time}/${side}`);}return p;});
   assert.ok(support,'at least one actual paw supports the pose');
   for(const c of d.contacts){assert.ok(c.error<1e-7);if(i%5===0){const hand=m.worker.parts.find(p=>p.name==='forearm and hand '+c.side);assert.ok(Math.min(...points(hand,(a,j)=>a.getY(j)<.77).map(p=>p.distanceTo(v(c.grip))))<.016,'hand mesh reaches rifle');}}
   if(previous)for(const side of [-1,1])for(const key of Object.keys(d.joints[side]))assert.ok(distance(d.joints[side][key],previous.d.joints[side][key])<.07,`joint jump ${time}/${side}/${key}`);
   if(i%5===0){for(const mesh of m.worker.parts.filter(p=>/tail|trousers/.test(p.name)))assert.ok(Math.min(...points(mesh).map(p=>p.y))>-.002,`floor penetration ${time}/${mesh.name}`);}
   previous={d,soles:currentSoles};
  }
  m.motion.apply(6.5);const trousers=m.worker.parts[1],rearKnee=points(trousers,(a,i)=>a.getZ(i)<0&&a.getY(i)>.39&&a.getY(i)<.54);assert.ok(Math.min(...rearKnee.map(p=>p.y))<.008,'rear knee cloth reaches floor');
 }finally{m.dispose();}
});
test('dog shot uses physical barrel, continuous heading/elevation and recoil after discharge',()=>{
 const m=create();try{for(const heading of [-179,-43.7,0,22.5,137.2,180])for(const pitch of [-15,0,20]){
  for(const time of [0,4.2,5.3,6.6,6.8,8.3,11])m.motion.apply(time,{heading,pitch});
  m.motion.apply(DOG_SHOT_TIME,{heading,pitch});const d=m.motion.diagnostics();assert.equal(d.recoil,0);assert.equal(d.aim,1);
  const bore=m.worker.rifle.parts.find(p=>p.name==='muzzle opening').getWorldPosition(new T.Vector3());assert.ok(bore.distanceTo(v(d.shot.origin))<.0002,'physical muzzle opening');
  const a=heading*Math.PI/180,p=pitch*Math.PI/180,expected=new T.Vector3(Math.cos(a)*Math.cos(p),Math.sin(p),Math.sin(a)*Math.cos(p));assert.ok(expected.distanceTo(v(d.shot.direction))<1e-7);
  const before=d.muzzle.origin;m.motion.apply(6.86,{heading,pitch});assert.ok(distance(before,m.motion.diagnostics().muzzle.origin)>.005,'rifle recoils');
  m.motion.apply(7.4,{heading,pitch});assert.ok(distance(before,m.motion.diagnostics().muzzle.origin)<1e-7,'rifle recovers before lowering');
 }}finally{m.dispose();}
});
test('scrubbing is deterministic and restoring the approved neutral surface removes all deformation',()=>{
 const m=create();try{const samples=[0,.23,1.7,3.6,4.43,5.5,6.6,6.82,8.61,11],expected=samples.map(t=>{m.motion.apply(t,{heading:37.3,pitch:12});return JSON.stringify(m.motion.diagnostics());});for(let i=samples.length-1;i>=0;i--){m.motion.apply(samples[i],{heading:37.3,pitch:12});assert.equal(JSON.stringify(m.motion.diagnostics()),expected[i]);}
  m.motion.restore();for(const mesh of m.worker.parts){const p=mesh.geometry.attributes.position;for(let i=0;i<p.count;i++){const q=new T.Vector3().fromBufferAttribute(p,i);assert.ok(mesh.applyBoneTransform(i,q.clone()).distanceTo(q)<1e-6,'neutral geometry');}const a=mesh.geometry.attributes.skinWeight;for(let i=0;i<a.count;i++)assert.ok(Math.abs(a.getX(i)+a.getY(i)+a.getZ(i)+a.getW(i)-1)<1e-6);}
 }finally{m.dispose();}
});
test('kneeling calf retains cross-section volume and rifle is at the painted eye/shoulder',()=>{
 const m=create();try{
  for(const time of [4.4,6.6,8.8]){m.motion.apply(time);const d=m.motion.diagnostics(),mesh=m.worker.parts[1],p=mesh.geometry.attributes.position,ix=mesh.geometry.index,posed=points(mesh);
   for(const side of [-1,1]){const knee=v(d.joints[side].knee),ankle=v(d.joints[side].ankle),center=knee.clone().lerp(ankle,.55),axis=ankle.clone().sub(knee).normalize(),u=axis.clone().cross(new T.Vector3(0,0,1)).normalize(),w=axis.clone().cross(u).normalize(),section=[];
    for(let i=0;i<ix.count;i+=3){const ids=[ix.getX(i),ix.getX(i+1),ix.getX(i+2)],y=ids.reduce((n,j)=>n+p.getY(j)/3,0);if(y>.44||y<.14||!ids.every(j=>Math.sign(p.getZ(j))===side))continue;for(let e=0;e<3;e++){const a=posed[ids[e]],b=posed[ids[(e+1)%3]],da=a.clone().sub(center).dot(axis),db=b.clone().sub(center).dot(axis);if(da*db<0)section.push(a.clone().lerp(b,da/(da-db)).sub(center));}}
    assert.ok(section.length>=6,'actual calf surface crosses the section plane');for(const basis of [u,w]){const q=section.map(p=>p.dot(basis));assert.ok(Math.max(...q)-Math.min(...q)>.12,'calf must retain volume in both axes');}
   }
  }
  for(const pitch of [-15,0,20]){m.motion.apply(6.6,{pitch});const d=m.motion.diagnostics(),head=m.worker.bones[2],eye=new T.Vector3(.04,1.47,.075).applyMatrix4(m.worker.skeleton.boneInverses[2]).applyMatrix4(head.matrixWorld),sight=new T.Vector3(.48,.045,0).applyMatrix4(m.worker.rifle.root.matrixWorld),axis=v(d.muzzle.direction),offset=eye.sub(sight);assert.ok(offset.addScaledVector(axis,-offset.dot(axis)).length()<.018,'painted eye landmark follows sight line');
   const jacket=m.worker.parts[0],p=jacket.geometry.attributes.position,ix=jacket.geometry.index,posed=points(jacket),stock=v(d.stock);let nearest=Infinity;
   for(let i=0;i<ix.count;i+=3){const ids=[ix.getX(i),ix.getX(i+1),ix.getX(i+2)];if(!ids.every(j=>p.getY(j)>1.10&&p.getZ(j)>.07))continue;const q=new T.Triangle(...ids.map(j=>posed[j])).closestPointToPoint(stock,new T.Vector3());nearest=Math.min(nearest,q.distanceTo(stock));}assert.ok(nearest<.035,'stock is against actual shoulder garment');
  }
 }finally{m.dispose();}
});
