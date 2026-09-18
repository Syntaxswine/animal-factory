import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../dist/tactics/vendor/three.module.js';
import {paintCoordinates,paintValidity,PAINT_FRAME} from '../dist/tactics/horse-model-paint.js';

test('paint projection matches actual reference cameras at every cardinal view',()=>{
 const f=PAINT_FRAME,camera=new THREE.OrthographicCamera(-f.width/2,f.width/2,f.height/2,-f.height/2,f.near,f.far);
 for(let view=0;view<4;view++){
  camera.position.set(f.distance*Math.cos(view*Math.PI/2),f.centerY,f.distance*Math.sin(view*Math.PI/2));camera.lookAt(0,f.centerY,0);camera.updateMatrixWorld();
  for(const p of [[.07,1.45,.085],[-.035,.12,-.232],[.12,1.04,0],[.025,.48,.2]]){
   const ndc=new THREE.Vector3(...p).project(camera),actual=paintCoordinates(p,view);
   assert.ok(Math.abs(actual.uv[0]-(view+(ndc.x+1)/2)/4)<1e-12);
   assert.ok(Math.abs(actual.uv[1]-(ndc.y+1)/2)<1e-12);
   assert.ok(Math.abs(actual.depth-(ndc.z+1)/2)<1e-12);
  }
 }
});

test('paint validity removes connected neutral background, preserving enclosed grey paint',()=>{
 const width=32,height=32,pixels=new Uint8ClampedArray(width*height*4);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const k=(y*width+x)*4,inside=x>=5&&x<27&&y>=5&&y<27,grey=x>=12&&x<20&&y>=12&&y<20;
  pixels.set(inside&&!grey?[160,65,22,255]:[128,128,128,255],k);
 }
 const mask=paintValidity(pixels,width,height);
 assert.equal(mask[0],0);assert.equal(mask[16*width+16],255,'grey garment detail must remain valid');
 assert.equal(mask[5*width+16],0,'erode the silhouette edge');assert.equal(mask[8*width+16],255);
});
