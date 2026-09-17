import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {nearestDirection,nearestDirectionBound,candidateVertex,candidateError,candidateCrop,physicalTip,SECTOR,CANDIDATE_LAYOUT} from '../dist/tactics/hybrid-directional.js';
test('nearest-direction bound covers angular midpoints and has the corrected denominator',()=>{
 assert.ok(Math.abs(nearestDirectionBound(.98,8)-.3823770311516114)<1e-12);
 for(const radius of [.57,.98])for(const count of [8,16,32,64,128]){
  const theta=Math.PI/count,actual=Math.hypot(radius*Math.cos(theta)-radius,radius*Math.sin(theta));
  assert.ok(Math.abs(actual-nearestDirectionBound(radius,count))<1e-12);
 }
});
test('sector selection rejects unsupported headings and chooses both sides of each boundary',()=>{
 for(const h of [NaN,Infinity,-1,0,22.49,67.51,360])assert.equal(nearestDirection(h),null);
 for(let i=0;i<17;i++)assert.equal(nearestDirection(SECTOR.min+i*SECTOR.step),i);
 for(let i=0;i<16;i++){const boundary=SECTOR.min+(i+.5)*SECTOR.step;assert.equal(nearestDirection(boundary-1e-8),i);assert.equal(nearestDirection(boundary),i+1);assert.equal(nearestDirection(boundary+1e-8),i+1);}
});
test('candidate cards preserve all pixel distances and fixed guide anchors without muzzle fitting',()=>{
 const factor=512*5/CANDIDATE_LAYOUT.width;
 for(let i=0;i<17;i++){
  const base=[i%5*512,Math.floor(i/5)*512],anchor=[(base[0]+256)/factor,(base[1]+420)/factor];
  const a=candidateVertex(i,anchor),b=candidateVertex(i,[anchor[0]+20,anchor[1]+30]);
  assert.ok(Math.hypot(...a)<1e-12);assert.ok(Math.abs(Math.hypot(b[0]-a[0],b[1]-a[1])-Math.hypot(20,30)*factor*CANDIDATE_LAYOUT.scale)<1e-12);
 }
 // The world muzzle continues moving even while the selected sprite stays fixed.
 assert.equal(nearestDirection(45),nearestDirection(45.5));
 assert.notDeepEqual(physicalTip('prone',45),physicalTip('prone',45.5));
});
test('manual landmark uncertainty prevents false passes and all measured tips remain in their crop',()=>{
 const landmarks=JSON.parse(fs.readFileSync(new URL('../dist/tactics/hybrid-directional-landmarks.json',import.meta.url)));
 const measure=candidateError('standing',45,landmarks);assert.ok(measure.error<.05);assert.equal(measure.assessment,'uncertain');assert.ok(measure.interval[1]>.05);
 for(const stance of ['standing','kneeling','prone'])for(const [i,[x,y]]of landmarks[stance].entries()){
  const [left,top,width,height]=candidateCrop(stance,i);assert.ok(x>=left&&x<=left+width&&y>=top&&y<=top+height,stance+' '+i);
 }
});
