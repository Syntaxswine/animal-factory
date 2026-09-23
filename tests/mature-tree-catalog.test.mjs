import test from 'node:test';
import assert from 'node:assert/strict';
import {PROPS,TREE_VARIANTS,propCells,propBlocks,propTall} from '../dist/tactics/environment.js';
import {blankMap,parseMap,validateMap,passable} from '../dist/tactics/maps.js';
import {createEditor,applyBrush,beginStroke,endStroke,undo,redo} from '../dist/tactics/editor-model.js';
import {PROP_ART} from '../dist/tactics/prop-art.js';

test('mature trees round-trip through shared editor/map validation with unchanged trunk rules',()=>{
 for(const [kind,{base,scale}] of Object.entries(TREE_VARIANTS))for(const rotated of [false,true]){
  const e=createEditor(blankMap('Mature trees'));
  beginStroke(e);assert.equal(applyBrush(e,'prop',8,8,null,{propKind:kind,rotated}),'');endStroke(e);
  const p=e.map.props[0];assert.equal(p.kind,kind);assert.deepEqual(propCells(p),[{x:8,y:8,z:0}]);
  assert.deepEqual(validateMap(e.map),[]);const round=JSON.stringify(e.map);assert.deepEqual(parseMap(round),e.map);
  assert.equal(propBlocks(e.map,8,8),true);assert.equal(propTall(e.map,8,8),true);assert.equal(passable(e.map,{x:8,y:8}),false);assert.equal(passable(e.map,{x:9,y:8}),true);
  for(const field of ['w','h','solid','tall','cover'])assert.equal(PROPS[kind][field],PROPS[base][field]);
  assert.equal(PROPS[kind].visualHeight,PROPS[base].visualHeight*scale);assert.deepEqual(PROP_ART[kind],PROP_ART[base]);
  undo(e);assert.equal(e.map.props.length,0);redo(e);assert.equal(JSON.stringify(e.map),round);
 }
 const invalid=blankMap();invalid.props=[{kind:'tree-unknown-large',x:8,y:8}];assert.throws(()=>parseMap(JSON.stringify(invalid)),/Invalid environment props/);
});
