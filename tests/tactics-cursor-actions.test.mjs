import test from 'node:test';
import assert from 'node:assert/strict';
import {contextAction,fenceAtCursor,actionCost} from '../dist/tactics/cursor-actions.js';
import {createGame,equipCutters,cutFence} from '../dist/tactics/engine.js';
import {blankMap,tileKey} from '../dist/tactics/maps.js';
const setup=()=>createGame(1,blankMap());

test('movement cost reflects free exploration, combat budget and unavailable routes',()=>{
 const s=setup(),u=s.units[0],action={action:'move'},route=[{x:4,y:4,z:0,cost:2}];s.seen.add(tileKey(4,4));
 assert.deepEqual(actionCost(s,u,action,{route}),{cost:0,valid:true,reason:'',estimated:false});
 s.phase='player';u.ap=2;assert.equal(actionCost(s,u,action,{route}).cost,2);assert.equal(actionCost(s,u,action,{route}).valid,true);
 u.ap=1;assert.equal(actionCost(s,u,action,{route}).valid,false);
 assert.equal(actionCost(s,u,action).cost,null);assert.equal(actionCost(s,u,action).valid,false);
 s.seen.clear();assert.equal(actionCost(s,u,action,{route}).estimated,true);
});

test('attack labels retain weapon cost when ammunition or AP prevents shooting',()=>{
 const s=setup(),u=s.units[0];u.heading=0;u.cone=360;s.phase='player';
 const enemy={...u,id:4,team:'guard',x:u.x+2};s.units.push(enemy);s.detected.add(4);
 const action={action:'target',id:4},ready=actionCost(s,u,action);assert.equal(ready.valid,true);assert.ok(ready.cost>0);
 u.ap=0;assert.equal(actionCost(s,u,action).valid,false);assert.equal(actionCost(s,u,action).cost,ready.cost);
 u.ap=20;u.ammo[u.weapon]=0;assert.equal(actionCost(s,u,action).reason,'Reload required');
 assert.equal(actionCost(s,u,{action:'select'}).cost,0);assert.equal(actionCost(s,u,{action:'loot'}).valid,true);
});

test('ground, friendly selection and detected enemy targeting match their cursors',()=>{
 const s=setup(),u=s.units[0];assert.equal(contextAction(s,u,{point:{x:8,y:8}}).kind,'walk');
 assert.equal(contextAction(s,u,{actorId:1}).action,'select');assert.equal(contextAction(s,u,{actorId:1}).kind,'interact');
 s.units.push({id:4,team:'guard',hp:45});s.detected.add(4);assert.equal(contextAction(s,u,{actorId:4}).kind,'shoot');
 u.weapon='knife';assert.equal(contextAction(s,u,{actorId:4}).kind,'interact');s.detected.clear();assert.equal(contextAction(s,u,{actorId:4}).action,'move');
 s.phase='enemy';assert.equal(contextAction(s,u,{point:{x:8,y:8}}).kind,'wait');
});
test('bolt cutter action requires held cutters, reachable known wire fence, and enough AP',()=>{
 const s=setup(),u=s.units[0],edge='e:3:4';s.edges[edge]='fence-chainlink';s.seen.add(tileKey(3,4));
 assert.equal(actionCost(s,u,contextAction(s,u,{edge})).valid,false);equipCutters(s,u,1);assert.equal(contextAction(s,u,{edge}).kind,'cut');assert.equal(contextAction(s,u,{edge,actorId:u.id}).kind,'cut');
 s.phase='player';u.ap=3;assert.equal(contextAction(s,u,{edge}).kind,'cut');assert.equal(actionCost(s,u,contextAction(s,u,{edge})).valid,false);u.ap=4;assert.equal(contextAction(s,u,{edge}).kind,'cut');
 assert.ok(cutFence(s,u,edge));assert.notEqual(contextAction(s,u,{edge}).kind,'cut');
 s.edges[edge]='fence-railing';assert.notEqual(contextAction(s,u,{edge}).kind,'cut');s.edges[edge]='fence-chainlink';u.z=1;assert.notEqual(contextAction(s,u,{edge}).kind,'cut');
});
test('fence picking uses its raised visible face, selected floor and adjacent edge',()=>{
 const s=setup(),u=s.units[0];s.edges['e:3:4']='fence-chainlink';const project=(x,y)=>({x:(x-y)*28,y:(x+y)*14});
 assert.equal(fenceAtCursor(s,u,{x:-14,y:85},project,1,0),'e:3:4');
 assert.equal(fenceAtCursor(s,u,{x:-14,y:20},project,1,0),null);assert.equal(fenceAtCursor(s,u,{x:-14,y:85},project,1,1),null);
 u.x=10;assert.equal(fenceAtCursor(s,u,{x:-14,y:85},project,1,0),null);
});
test('hand interactions respect loot visibility, adjacency and blocking edges',()=>{
 const s=setup(),u=s.units[0],point={x:4,y:4,z:0};s.loot.push({...point,items:[{type:'ammo',kind:'rifle',count:1}]});s.visible.add(tileKey(4,4));
 assert.equal(contextAction(s,u,{point}).action,'loot');s.edges['e:3:4']='fence-chainlink';assert.equal(contextAction(s,u,{point}).action,'move');delete s.edges['e:3:4'];
 s.visible.delete(tileKey(4,4));assert.equal(contextAction(s,u,{point}).action,'move');
 const exit=s.definition.exits[0];s.visible.add(tileKey(exit.x,exit.y));assert.equal(contextAction(s,u,{point:exit}).action,'travel');
});
