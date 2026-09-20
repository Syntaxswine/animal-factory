import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import * as T from '../dist/tactics/vendor/three.module.js';
import {createHen,HEN_FRAME} from '../dist/tactics/hen-worker.js';
import {surfaceComponents} from '../dist/tactics/grey-surface.js';
import {paintCoordinates} from '../dist/tactics/horse-model-paint.js';
const author=JSON.parse(fs.readFileSync(new URL('../dist/tactics/hen-author-data.json',import.meta.url))),low=JSON.parse(fs.readFileSync(new URL('../dist/tactics/hen-10k-data.json',import.meta.url)));
for(const data of [author,low]){
 test(`${data.triangles}: closed connected bird and garment surfaces within budget`,()=>{
  assert.ok(data.triangles<=(data===author?30000:10500));assert.equal(data.parts.length,13);
  const h=createHen(data);try{for(const p of h.parts){assert.equal(surfaceComponents(p.geometry),1,p.name);const edges=new Map(),ix=p.geometry.index.array;for(let i=0;i<ix.length;i+=3)for(let j=0;j<3;j++){const a=ix[i+j],b=ix[i+(j+1)%3];assert.notEqual(a,b);const key=Math.min(a,b)+':'+Math.max(a,b);edges.set(key,(edges.get(key)||0)+1);}for(const n of edges.values())assert.equal(n,2,p.name+' closed manifold');}
   const d=h.diagnostics();assert.ok(Math.abs(d.max[1]-1.65)<.002);assert.ok(Math.abs(d.min[1])<.001);
   for(const p of h.parts)p.geometry.computeBoundingBox();
   const body=h.parts[0].geometry.boundingBox,apron=h.parts.find(p=>p.name==='continuous apron').geometry.boundingBox;
   assert.ok(body.max.z>.34&&body.min.x<-.30,'round breast and abdomen retain substantial depth and width');
   assert.ok(apron.max.x>.35&&apron.max.z>.36,'apron follows the round body');
   const tail=h.parts.find(p=>p.name==='upright tail fan').geometry.boundingBox;assert.ok(tail.max.y>1.16&&tail.min.x<-.44&&tail.max.z>.17,'raised fan at posterior pelvis');
   const ray=new T.Raycaster();for(const s of [-1,1]){const foot=h.parts.find(p=>p.name==='scaly leg and four toes '+s),b=foot.geometry.boundingBox;assert.ok(b.min.x<-.13&&b.max.x>.21,'forward toes and rear hallux');assert.ok(b.max.z-b.min.z>.20,'splayed toes');
    // At the distal toes the center and both outer branches have real gaps.
    const z=s*.157;for(const offset of [0,.085,-.075]){ray.set(new T.Vector3(offset===0?.177:.130,.10,z+offset),new T.Vector3(0,-1,0));assert.ok(ray.intersectObject(foot).length,'three forward toes');}
    ray.set(new T.Vector3(.135,.10,z+.041),new T.Vector3(0,-1,0));assert.equal(ray.intersectObject(foot).length,0,'gap between central and outer toes');
   }
  }finally{h.dispose();}
 });
 test(`${data.triangles}: wing articulation preserves feet, body and neutral restoration`,()=>{const h=createHen(data);try{assert.equal(h.bones.length,11);for(const p of h.parts){const a=p.geometry.attributes;for(let i=0;i<a.position.count;i++){const sum=[0,1,2,3].reduce((n,k)=>n+a.skinWeight.array[i*4+k],0);assert.ok(Math.abs(sum-1)<1e-6);const v=new T.Vector3().fromBufferAttribute(a.position,i);assert.ok(p.applyBoneTransform(i,v.clone()).distanceTo(v)<1e-6);}}
   h.pose('spread');let moved=0;for(const p of h.parts){const a=p.geometry.attributes.position;for(let i=0;i<a.count;i++){const v=new T.Vector3().fromBufferAttribute(a,i),q=p.applyBoneTransform(i,v.clone());if(p.name.includes('wing')){if(q.distanceTo(v)>.01)moved++;}else assert.ok(q.distanceTo(v)<1e-6,'only wings open');}}assert.ok(moved>100);
   for(const heading of [0,37,90,225]){h.pose('spread',heading);assert.ok(Math.abs(h.diagnostics().min[1])<.001);}
   h.pose();for(const p of h.parts){const a=p.geometry.attributes.position;for(let i=0;i<a.count;i++){const v=new T.Vector3().fromBufferAttribute(a,i);assert.ok(p.applyBoneTransform(i,v.clone()).distanceTo(v)<1e-6);}}
  }finally{h.dispose();}});
}
test('hen reduction derives from author and retains all species components',()=>{assert.equal(low.sourceTriangles,author.triangles);for(let i=0;i<author.parts.length;i++){assert.equal(low.parts[i].sourceTriangles,author.parts[i].triangles);assert.equal(low.parts[i].name,author.parts[i].name);assert.ok(low.parts[i].preRoundErrorWorld<.005);}});
test('hen four-view paint frame contains wings, comb, toes and tail',()=>{const f=HEN_FRAME,camera=new T.OrthographicCamera(-f.width/2,f.width/2,f.height/2,-f.height/2,f.near,f.far);for(let view=0;view<4;view++){camera.position.set(f.distance*Math.cos(view*Math.PI/2),f.centerY,f.distance*Math.sin(view*Math.PI/2));camera.lookAt(0,f.centerY,0);camera.updateMatrixWorld();for(const part of author.parts)for(let i=0;i<part.position.length;i+=3){const p=(part.paintPosition||part.position).slice(i,i+3),ndc=new T.Vector3(...p).project(camera),actual=paintCoordinates(p,view,f);assert.ok(Math.abs(ndc.x)<.99&&Math.abs(ndc.y)<.99);assert.ok(Math.abs(actual.uv[0]-(view+(ndc.x+1)/2)/4)<1e-12);assert.ok(Math.abs(actual.uv[1]-(ndc.y+1)/2)<1e-12);}}});
