import test from 'node:test';
import assert from 'node:assert/strict';
import {PROP_ART} from '../dist/tactics/prop-art.js';
import {PROPS,EDGES,propCells} from '../dist/tactics/environment.js';
import {blankMap,factoryMap,parseMap,edgeKey,blockedEdge,sightEdge,validateMap,setTerrain} from '../dist/tactics/maps.js';
import {createEditor,applyBrush} from '../dist/tactics/editor-model.js';
import {createGame,walkable,coverAgainst} from '../dist/tactics/engine.js';
import {unitArt} from '../dist/tactics/red-hats-art.js';

test('walkable bush and parapet cover protects occupants while reeds and metal roofs do not',()=>{
 for(const kind of ['bush','reeds','roof-flat-parapet','roof-corrugated-flat','roof-corrugated-sloped']){
  const m=blankMap();m.props=[{x:10,y:10,z:0,kind}];const s=createGame(1,m,false);
  assert.equal(walkable(s,10,10,0),true);
  assert.equal(coverAgainst(s,{x:4,y:10,z:0},{x:10,y:10,z:0}),['bush','roof-flat-parapet'].includes(kind));
 }
});

test('roof modules remain walkable on upper floors and reject walls through any interior edge',()=>{
 assert.deepEqual(validateMap(factoryMap()),[]);
 for(const kind of ['roof-corrugated-flat','roof-corrugated-sloped','roof-flat-parapet']){
  const m=blankMap();for(let y=10;y<12;y++)for(let x=10;x<12;x++)setTerrain(m,x,y,1,'floor');
  const e=createEditor(m);assert.equal(applyBrush(e,'prop',10,10,null,{level:1,propKind:kind}),'');
  const s=createGame(1,e.map,false);for(const p of propCells(e.map.props[0]))assert.equal(walkable(s,p.x,p.y,p.z),true);
  assert.equal(PROPS[kind].groundLayer,true);
  for(const edge of [edgeKey('e',10,11,1),edgeKey('s',11,10,1)]){
   const blocked=structuredClone(e.map);blocked.edges[edge]='wall';
   assert.ok(validateMap(blocked,{connectivity:false}).includes('A prop footprint crosses a wall or fence.'));
   blocked.props=[];assert.match(applyBrush(createEditor(blocked),'prop',10,10,null,{level:1,propKind:kind}),/straddle/);
  }
 }
});
test('builder guard outfits survive export and use armed and prone Red Hats art in game',()=>{
 const e=createEditor(blankMap());assert.equal(applyBrush(e,'guard',8,8,null,{species:'skunk',weapon:'rifle',outfit:'red-hats'}),'');
 const map=parseMap(JSON.stringify(e.map)),guard=createGame(1,map,false).units[4];
 assert.match(unitArt(guard).src,/red-hats\/skunk-rifle-standing/);guard.stance='prone';assert.match(unitArt(guard).src,/red-hats\/skunk-rifle-prone/);
 applyBrush(e,'guard',8,8,null,{species:'skunk',weapon:'rifle',outfit:'normal'});assert.equal(e.map.guards[0].outfit,undefined);
});
test('every new prop can be placed, exported, reloaded and used by game collision in both orientations',()=>{
 const e=createEditor(blankMap());let x=10;
 for(const id of Object.keys(PROP_ART).filter(id=>PROPS[id]))for(const rotated of [false,true]){
  assert.equal(applyBrush(e,'prop',x,10,null,{propKind:id,rotated}),'',id);x+=3;
 }
 const map=parseMap(JSON.stringify(e.map)),game=createGame(1,map,false);
 for(const p of map.props)for(const cell of propCells(p))assert.equal(walkable(game,cell.x,cell.y,cell.z),!PROPS[p.kind].solid,p.kind);
});
test('jail barriers block movement but allow sight, and cut fence allows crossing',()=>{
 const m=blankMap(),a={x:8,y:8},b={x:9,y:8};
 for(const kind of ['jail-bars','jail-door-closed','fence-cut']){
  m.edges[edgeKey('e',8,8)]=kind;assert.equal(blockedEdge(m,a,b),kind!=='fence-cut');assert.equal(sightEdge(m,a,b),false);assert.ok(EDGES[kind].art);
 }
});
