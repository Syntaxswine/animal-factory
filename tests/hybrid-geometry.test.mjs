import test from 'node:test';
import assert from 'node:assert/strict';
import {roomBoxes,traceShot,segmentBox} from '../dist/tactics/hybrid-geometry.js';
const path=(x,y,options={})=>traceShot([x,y,2.2],[x,y,-2.2],roomBoxes(options));
test('door and window openings pass rays while solid wall and sill block them',()=>{
 assert.equal(path(-1.5,1.2),null);assert.equal(path(1.5,1.2),null);
 assert.equal(path(0,1.2).name,'Center wall');assert.equal(path(1.5,.5).name,'Window sill');
 assert.equal(path(-1.5,1.2,{doorClosed:true}).name,'Closed door');
 assert.equal(path(-1.5,1.8).name,'Door lintel');
});
test('vertical rays hit the optional roof and intersection chooses the nearest surface',()=>{
 assert.equal(traceShot([0,4,-2],[0,.2,-2],roomBoxes()),null);
 assert.equal(traceShot([0,4,-2],[0,.2,-2],roomBoxes({roof:true})).name,'Roof');
 const boxes=roomBoxes();assert.equal(traceShot([0,1,3],[0,1,-6],boxes.reverse()).name,'Center wall');
 assert.equal(segmentBox([0,1,0],[0,1,0],{min:[-1,0,-1],max:[1,2,1]}),0);
 assert.equal(segmentBox([2,1,0],[2,1,0],{min:[-1,0,-1],max:[1,2,1]}),null);
});
