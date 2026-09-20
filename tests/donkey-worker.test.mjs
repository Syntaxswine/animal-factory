import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from '../dist/tactics/vendor/three.module.js';
import {createDonkeyWorker} from '../dist/tactics/donkey-worker.js';
import {surfaceComponents} from '../dist/tactics/grey-surface.js';
const load=name=>JSON.parse(fs.readFileSync(new URL('../dist/tactics/'+name,import.meta.url)));
const author=load('donkey-author-data.json'),low=load('donkey-10k-data.json');
for(const data of [author,low]){
 test(`donkey ${data.triangles}: closed connected surfaces and species landmarks`,()=>{
  assert.ok(data.triangles<=(data===author?30000:10500));assert.equal(data.parts.length,13);
  for(const part of data.parts){
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(part.position,3));g.setIndex(part.index);
   assert.equal(surfaceComponents(g),1,part.name);
   const edges=new Map();for(let i=0;i<part.index.length;i+=3)for(let j=0;j<3;j++){const a=part.index[i+j],b=part.index[i+(j+1)%3];assert.notEqual(a,b);const key=Math.min(a,b)+':'+Math.max(a,b);edges.set(key,(edges.get(key)||0)+1);}for(const count of edges.values())assert.equal(count,2,part.name);
   assert.ok(part.errorWorld<.005,part.name);g.dispose();
  }
  const h=createDonkeyWorker(data);try{
   const d=h.diagnostics();assert.ok(Math.abs(d.min[1])<1e-6);assert.ok(d.max[1]>1.75&&d.max[1]<1.77);
   const skull=h.parts[6].geometry.attributes.position,ears=[0,0];let nose=-Infinity;
   for(let i=0;i<skull.count;i++){if(skull.getY(i)>1.53&&Math.abs(skull.getZ(i))>.06)ears[skull.getZ(i)<0?0:1]++;nose=Math.max(nose,skull.getX(i));}
   assert.ok(ears.every(n=>n>20),'both long ears survive reduction');assert.ok(nose>.22&&nose<.25,'broad projecting donkey muzzle');
   const mane=h.parts[7].geometry.attributes.position;for(let i=0;i<mane.count;i++)assert.ok(mane.getY(i)>1.29&&mane.getY(i)<1.60,'short crest stays bounded behind head');
  }finally{h.dispose();}
 });
 test(`donkey ${data.triangles}: rig weights, stable feet and rifle contact`,()=>{
  const h=createDonkeyWorker(data);try{
   assert.equal(h.bones.length,17);
   for(const m of h.parts){const a=m.geometry.attributes;for(let i=0;i<a.position.count;i++){let sum=0;for(let j=0;j<4;j++){const w=a.skinWeight.array[i*4+j];assert.ok(w>=0&&w<=1);sum+=w;}assert.ok(Math.abs(sum-1)<1e-6);}}
   for(const heading of [0,37,90,173,225,315]){h.pose('carry',heading);const d=h.diagnostics();assert.ok(Math.abs(d.min[1])<1e-6);assert.equal(d.contacts.length,2);for(const c of d.contacts){assert.ok(c.error<1e-6);const m=h.parts.find(p=>p.name==='forearm and hand '+c.side),a=m.geometry.attributes.position,grip=new THREE.Vector3(...c.grip);let distance=Infinity;for(let i=0;i<a.count;i++)if(a.getY(i)<.77){const p=new THREE.Vector3().fromBufferAttribute(a,i);m.applyBoneTransform(i,p);p.applyMatrix4(m.matrixWorld);distance=Math.min(distance,p.distanceTo(grip));}assert.ok(distance<.016,'actual hand surface near rifle grip');}}
   h.pose('neutral');assert.equal(h.rifle.root.visible,false);for(const m of h.parts){const a=m.geometry.attributes.position;for(let i=0;i<a.count;i++){const p=new THREE.Vector3().fromBufferAttribute(a,i);assert.ok(m.applyBoneTransform(i,p.clone()).distanceTo(p)<1e-6);}}
  }finally{h.dispose();}
 });
}
test('donkey reduction preserves all author components',()=>{assert.equal(low.sourceTriangles,author.triangles);assert.ok(low.triangles/author.triangles<.36);for(let i=0;i<author.parts.length;i++){assert.equal(low.parts[i].name,author.parts[i].name);assert.equal(low.parts[i].sourceTriangles,author.parts[i].triangles);}});
test('neck separates jaw from scarf while preserving the skull size and paint registration',()=>{
 for(const data of [author,low]){
  const head=data.parts[6],wrap=data.parts[9];let jaw=Infinity,collar=-Infinity;
  for(let i=0;i<head.position.length;i+=3){
   const p=head.position,original=head.paintPosition;
   if(original[i+1]>=1.33){assert.ok(Math.abs(p[i]-original[i])<1e-7);assert.ok(Math.abs(p[i+2]-original[i+2])<1e-7);}
   if(original[i+1]>=1.30)assert.ok(Math.abs(p[i+1]-original[i+1]-.11)<1e-6,'upper head is translated without scaling');
   if(p[i]>.12)jaw=Math.min(jaw,p[i+1]);
  }
  for(let i=1;i<wrap.position.length;i+=3)collar=Math.max(collar,wrap.position[i]);
  assert.ok(jaw-collar>.015,'jaw clears even the highest scarf fold');
  const worker=createDonkeyWorker(data);try{
   const ray=new THREE.Raycaster(new THREE.Vector3(-.04,1.33,.5),new THREE.Vector3(0,0,-1));
   const hit=ray.intersectObjects(worker.parts)[0];assert.ok(hit);assert.equal(hit.object.name,head.name,'neck is exposed above clothing in profile');
  }finally{worker.dispose();}
 }
});
