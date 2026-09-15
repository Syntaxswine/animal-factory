import test from 'node:test';
import assert from 'node:assert/strict';
import {brushPoints,createEditor,beginStroke,endStroke,applyBrush,undo,redo} from '../dist/tactics/editor-model.js';
import {blankMap,terrainAt} from '../dist/tactics/maps.js';
test('rectangles include both corners, reverse, shrink and clamp to workspace',()=>{
 const a={x:4,y:5};assert.equal(brushPoints('floor',a,{x:6,y:8},24).length,12);
 assert.deepEqual(brushPoints('floor',a,{x:2,y:3},24),brushPoints('floor',{x:2,y:3},a,24));
 assert.equal(brushPoints('texture',a,a,24).length,1);
 assert.equal(brushPoints('floor',{x:22,y:22},{x:999,y:999},24).length,4);
 assert.deepEqual(brushPoints('floor',{x:-1,y:2},a,24),[]);
});
test('wall lines lock starting axis and preserve outer boundary and elevation',()=>{
 assert.deepEqual(brushPoints('wall',{x:0,y:2,edge:'e:-1:2:2'},{x:8,y:4},24).map(p=>p.edge),['e:-1:2:2','e:-1:3:2','e:-1:4:2']);
 assert.deepEqual(brushPoints('wall',{x:4,y:0,edge:'s:4:-1'},{x:2,y:8},24).map(p=>p.edge),['s:2:-1','s:3:-1','s:4:-1']);
 assert.equal(brushPoints('wall',{x:239,y:239,edge:'e:239:239'},{x:500,y:500}).length,1);
});
test('roof rectangle and wall line each form one reversible saved-map change',()=>{
 const e=createEditor(blankMap()),before=JSON.stringify(e.map);
 beginStroke(e);for(const p of brushPoints('texture',{x:8,y:8},{x:10,y:10},24))assert.equal(applyBrush(e,'texture',p.x,p.y,p.edge,{level:1,groundKind:'ground-concrete'}),'');endStroke(e);
 assert.equal(e.undo.length,1);assert.equal(terrainAt(e.map,9,9,1),'ground-concrete');
 const saved=JSON.stringify(e.map);undo(e);assert.equal(JSON.stringify(e.map),before);redo(e);assert.equal(JSON.stringify(e.map),saved);
 beginStroke(e);for(const p of brushPoints('wall',{x:8,y:8,edge:'s:8:8:1'},{x:10,y:12}))applyBrush(e,'wall',p.x,p.y,p.edge,{level:1});endStroke(e);
 assert.equal(e.undo.length,2);assert.equal(Object.keys(e.map.edges).length,3);undo(e);assert.equal(JSON.stringify(e.map),saved);
});
