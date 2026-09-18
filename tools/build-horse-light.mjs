import fs from 'node:fs';
import {createRequire} from 'node:module';
import * as THREE from '../dist/tactics/vendor/three.module.js';
import {createGreyHorse} from '../dist/tactics/horse-grey-model.js';
const {MeshoptSimplifier}= {MeshoptSimplifier:createRequire(import.meta.url)('./vendor/meshoptimizer/meshopt_simplifier.cjs')};
await MeshoptSimplifier.ready;
const horse=createGreyHorse(),parts=[];
for(const mesh of horse.parts){
 const g=mesh.geometry.clone().applyMatrix4(mesh.matrixWorld),positions=g.attributes.position.array;
 const target=mesh.name.includes('shirt')?4500:mesh.name.includes('overalls')?6500:mesh.name.includes('skull')?6500:mesh.name.includes('mane')?800:mesh.name.includes('hoof')?900:2100;
 const rigid=mesh.name.includes('skull')||mesh.name.includes('hoof')||mesh.name.includes('mane');
 const tolerance=mesh.name.includes('hoof')?.0008:mesh.name.includes('forearm')?.002:mesh.name.includes('skull')?.0025:.006;
 let [indices,error]=MeshoptSimplifier.simplify(new Uint32Array(g.index.array),positions,3,target*3,tolerance,rigid?['ErrorAbsolute']:['Regularize','ErrorAbsolute']);
 // Edge collapse can leave coincident opposite triangles around tiny closed features.
 // Remove both faces of each coincident pair before compaction; validate manifold output.
 const faces=new Map();for(let i=0;i<indices.length;i+=3){const key=Array.from(indices.subarray(i,i+3)).sort((a,b)=>a-b).join(':');if(!faces.has(key))faces.set(key,[]);faces.get(key).push(i);}
 const clean=[];for(const starts of faces.values())if(starts.length===1)clean.push(...indices.subarray(starts[0],starts[0]+3));indices=new Uint32Array(clean);
 const [remap,count]=MeshoptSimplifier.compactMesh(indices),p=new Float32Array(count*3),n=new Float32Array(count*3);
 for(let i=0;i<remap.length;i++)if(remap[i]!==0xffffffff){p.set(positions.subarray(i*3,i*3+3),remap[i]*3);n.set(g.attributes.normal.array.subarray(i*3,i*3+3),remap[i]*3);}
 parts.push({name:mesh.name,position:Array.from(p,v=>+v.toFixed(7)),normal:Array.from(n,v=>+v.toFixed(6)),index:Array.from(indices),sourceTriangles:g.index.count/3,triangles:indices.length/3,errorWorld:error});
 g.dispose();
}
const data={schema:1,source:'ec5d468 approved grey form',sourceTriangles:horse.diagnostics().triangles,triangles:parts.reduce((n,p)=>n+p.triangles,0),parts};
fs.writeFileSync(new URL('../dist/tactics/horse-light-data.json',import.meta.url),JSON.stringify(data)+'\n');
console.log(JSON.stringify({source:data.sourceTriangles,triangles:data.triangles,parts:parts.map(p=>({name:p.name,triangles:p.triangles,error:p.errorWorld}))},null,2));horse.dispose();
