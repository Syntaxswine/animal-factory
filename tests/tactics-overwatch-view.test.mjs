import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,refresh,setOverwatch,resolveOverwatch,overwatchRange} from '../dist/tactics/engine.js';
import {blankMap} from '../dist/tactics/maps.js';
import {overwatchTiles} from '../dist/tactics/overwatch-view.js';
function scene(){const m=blankMap();m.guards=[{x:9,y:4,species:'cow',weapon:'pistol',heading:180}];const s=createGame(1,m),u=s.units[0],g=s.units[4];u.heading=0;g.alert=true;g.hp=500;refresh(s);return {s,u,g};}
test('a shorter reservation holds ammunition until enemy enters its radius',()=>{const {s,u,g}=scene();assert.equal(overwatchRange(u),24);assert.ok(setOverwatch(s,u,4));s.phase='enemy';resolveOverwatch(s,g);assert.equal(u.ammo.assault,30);assert.ok(u.overwatch);g.x=7;resolveOverwatch(s,g);assert.equal(u.ammo.assault,29);assert.equal(u.ap,8);assert.equal(u.overwatch,null);});
test('invalid ranges spend no AP; weapon changes clamp saved distance',()=>{const {s,u}=scene();for(const n of [0,-1,25,Infinity,NaN])assert.equal(setOverwatch(s,u,n),false);assert.equal(u.ap,12);u.watchRange=20;u.weapon='pistol';assert.equal(overwatchRange(u),12);});
test('overlay shades walls darker, opens door lanes, respects facing and distance',()=>{const {s,u}=scene();u.cone=90;s.edges['e:4:4']='wall';s.revision++;let cells=overwatchTiles(s,u,8);assert.equal(cells.find(p=>p.x===8&&p.y===4).clear,false);assert.ok(!cells.some(p=>p.x<3));assert.ok(cells.every(p=>Math.hypot(p.x-u.x,p.y-u.y)<=8));assert.equal(overwatchTiles(s,u,8),cells);s.edges['e:4:4']='door';s.revision++;cells=overwatchTiles(s,u,8);assert.equal(cells.find(p=>p.x===8&&p.y===4).clear,true);u.heading=180;assert.ok(!overwatchTiles(s,u,8).some(p=>p.x===8&&p.y===4));});
