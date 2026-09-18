import test from 'node:test';
import assert from 'node:assert/strict';
import {createGreyHorse} from '../dist/tactics/horse-grey-model.js';

test('grey sculpt has connected closed surfaces, finite normals and grounded prototype height',()=>{
 const horse=createGreyHorse();
 try{
  const d=horse.diagnostics();assert.ok(Math.abs(d.height-1.65)<1e-6);assert.ok(Math.abs(d.min[1])<1e-7);
  for(const p of d.parts){assert.equal(p.components,1,p.name);if(p.name.startsWith('work boot'))assert.ok(Math.abs(p.min[1])<1e-6);}
  for(const mesh of horse.parts){
   const geometry=mesh.geometry,edges=new Map(),ix=geometry.index.array;
   for(const attribute of ['position','normal'])for(const v of geometry.attributes[attribute].array)assert.ok(Number.isFinite(v),mesh.name+' nonfinite '+attribute);
   for(let i=0;i<ix.length;i+=3)for(let j=0;j<3;j++){
    const a=ix[i+j],b=ix[i+(j+1)%3];assert.notEqual(a,b);
    const key=Math.min(a,b)+':'+Math.max(a,b);edges.set(key,(edges.get(key)||0)+1);
   }
   for(const uses of edges.values())assert.equal(uses,2,mesh.name+' open or nonmanifold edge');
  }
  assert.equal(horse.material.map,null);
 }finally{horse.dispose();}
});
