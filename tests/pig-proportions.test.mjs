import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from '../dist/tactics/vendor/three.module.js';
import {createPigForeman} from '../dist/tactics/pig-foreman.js';
import {createPigDirector} from '../dist/tactics/pig-director.js';

for(const [species,create] of [['foreman',createPigForeman],['director',createPigDirector]])for(const detail of ['author','10k']){
 const data=JSON.parse(fs.readFileSync(new URL(`../dist/tactics/pig-${species}-${detail}-data.json`,import.meta.url)));
 test(`${species} ${detail}: corrected body preserves head, registered paint and unit normals`,()=>{
  const model=create(data);
  try{
   for(let part=0;part<data.parts.length;part++){
    const source=data.parts[part],a=model.parts[part].geometry.attributes;
    assert.equal(a.paintPosition.count,a.position.count);
    assert.equal(a.paintNormal.count,a.normal.count);
    assert.equal(source.paintPosition.length,source.position.length);
    if(source.name.includes('skull'))assert.deepEqual(source.position,source.paintPosition,'accepted head and ears unchanged');
    for(let i=0;i<a.normal.count;i++)assert.ok(Math.abs(new THREE.Vector3().fromBufferAttribute(a.normal,i).length()-1)<.00001);
   }
   if(species==='foreman'){
    const pants=data.parts[1],belt=[];
    for(let i=0;i<pants.position.length;i+=3){
     const oldY=pants.paintPosition[i+1],z=pants.paintPosition[i+2];
     if(Math.abs(oldY-.913)<.020&&Math.abs(z)<.2)belt.push(pants.position[i+1]);
     if(oldY>.95)assert.ok(Math.abs(Math.abs(z)-.178)<.04,'only braces extend above belt');
    }
    assert.ok(belt.length>4);assert.ok(belt.every(y=>y>.80&&y<.85),'belt sits near half the 1.65 standing height');
   }else{
    const ray=new THREE.Raycaster(),contour=[];
    for(let y=.60;y<=.851;y+=.025){ray.set(new THREE.Vector3(.7,y,.12),new THREE.Vector3(-1,0,0));const hit=ray.intersectObjects(model.parts.slice(0,2))[0];assert.ok(hit);contour.push(hit.point.x);}
    for(let i=1;i<contour.length;i++)assert.ok(contour[i]>contour[i-1]-.015,'abdomen tapers into thigh without an isolated lower bulge');
   }
  }finally{model.dispose();}
 });
}
