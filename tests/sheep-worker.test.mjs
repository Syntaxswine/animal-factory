import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import * as THREE from '../dist/tactics/vendor/three.module.js';
import {createSheepWorker} from '../dist/tactics/sheep-worker.js';
import {surfaceComponents} from '../dist/tactics/grey-surface.js';
const load=file=>JSON.parse(fs.readFileSync(new URL('../dist/tactics/'+file,import.meta.url)));
const author=load('sheep-author-data.json'),reduced=load('sheep-10k-data.json');
function geometry(p){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p.position,3));g.setIndex(p.index);return g;}
for(const data of [author,reduced]){
 test(`${data.triangles}: closed connected surfaces, scale and species landmarks survive reduction`,()=>{
  assert.ok(data.triangles<=(data===author?30000:10500));assert.equal(data.parts.length,10);
  for(const p of data.parts){const g=geometry(p);assert.equal(surfaceComponents(g),1,p.name);const edges=new Map();for(let i=0;i<p.index.length;i+=3)for(let j=0;j<3;j++){const a=p.index[i+j],b=p.index[i+(j+1)%3];assert.notEqual(a,b);const key=Math.min(a,b)+':'+Math.max(a,b);edges.set(key,(edges.get(key)||0)+1);}for(const n of edges.values())assert.equal(n,2,p.name);if(p.name.includes("waistcoat"))assert.equal(p.position.length/3-edges.size+p.index.length/3,-4,"closed vest retains neck, hem and two enclosed arm openings");if(p.name.includes("neckerchief"))assert.equal(p.position.length/3-edges.size+p.index.length/3,0,"scarf is a closed band around the neck");assert.ok(p.errorWorld<.005);g.dispose();}
  const h=createSheepWorker(data);try{const d=h.diagnostics();assert.ok(Math.abs(d.min[1])<1e-6);assert.ok(Math.abs(d.max[1]-1.65)<.002);
   const skull=h.parts[6].geometry.attributes.position;let ear=[0,0],crown=0;for(let i=0;i<skull.count;i++){if(Math.abs(skull.getZ(i))>.19&&skull.getY(i)>1.38&&skull.getY(i)<1.55)ear[skull.getZ(i)<0?0:1]++;if(skull.getY(i)>1.59)crown++;}assert.ok(ear.every(n=>n>15),'broad lateral ears');assert.ok(crown>30,'wool cap survives');assert.ok(Math.max(...Array.from({length:skull.count},(_,i)=>skull.getX(i)))<.21,'short sheep muzzle');
   const ray=new THREE.Raycaster();for(const side of [-1,1]){const hoof=h.parts.find(p=>p.name==='exposed cloven hoof '+side),x=[];for(const dz of [0,-.035,.035]){ray.set(new THREE.Vector3(.4,.04,side*.232+dz),new THREE.Vector3(-1,0,0));const hit=ray.intersectObject(hoof)[0];assert.ok(hit);x.push(hit.point.x);}assert.ok(x[1]-x[0]>.035&&x[2]-x[0]>.035,'actual geometry has two separated toes');}
  }finally{h.dispose();}
 });
 test(`${data.triangles}: normalized rig, fixed feet, independent rifle grips and neutral restoration`,()=>{const h=createSheepWorker(data);try{assert.equal(h.bones.length,17);for(const m of h.parts){const a=m.geometry.attributes;for(let i=0;i<a.position.count;i++){let sum=0;for(let k=0;k<4;k++){const w=a.skinWeight.array[i*4+k];assert.ok(w>=0&&w<=1);sum+=w;}assert.ok(Math.abs(sum-1)<1e-6);const p=new THREE.Vector3().fromBufferAttribute(a.position,i);assert.ok(m.applyBoneTransform(i,p.clone()).distanceTo(p)<1e-6);}}
   for(const heading of [0,37,90,173,225,315]){h.pose('carry',heading);const d=h.diagnostics();assert.ok(Math.abs(d.min[1])<1e-6);assert.equal(d.contacts.length,2);for(const c of d.contacts){assert.ok(c.error<1e-6);const m=h.parts.find(p=>p.name==='forearm and hand '+c.side),a=m.geometry.attributes.position,grip=new THREE.Vector3(...c.grip);let distance=Infinity;for(let i=0;i<a.count;i++)if(a.getY(i)<.77){const p=new THREE.Vector3().fromBufferAttribute(a,i);m.applyBoneTransform(i,p);p.applyMatrix4(m.matrixWorld);distance=Math.min(distance,p.distanceTo(grip));}assert.ok(distance<.016,'actual hand surface near independent rifle grip');}}
   h.pose('neutral');assert.equal(h.rifle.root.visible,false);for(const m of h.parts){const p=m.geometry.attributes.position;for(let i=0;i<p.count;i++){const original=new THREE.Vector3().fromBufferAttribute(p,i);assert.ok(m.applyBoneTransform(i,original.clone()).distanceTo(original)<1e-6);}}
  }finally{h.dispose();}
 });
}
test('10k variant is reduced from the stored 30k author, preserving every garment and head component',()=>{assert.equal(reduced.sourceTriangles,author.triangles);assert.ok(reduced.triangles/author.triangles<.35);for(let i=0;i<author.parts.length;i++){assert.equal(reduced.parts[i].name,author.parts[i].name);assert.equal(reduced.parts[i].sourceTriangles,author.parts[i].triangles);}});
