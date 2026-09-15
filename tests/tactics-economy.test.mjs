import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorld,currentMap,travel,factoryIncome,locationDistance,incomePerJourney} from '../dist/tactics/world.js';
import {blankMap} from '../dist/tactics/maps.js';
import {guards,squad,refresh} from '../dist/tactics/engine.js';
function gather(s){squad(s).forEach((u,i)=>{u.x=3+i%2;u.y=4+Math.floor(i/2);});}
function clear(s){guards(s).forEach(g=>g.hp=0);refresh(s);gather(s);}
test('factory income depends on shortest route from fixed start; yards and unreachable factories earn nothing',()=>{
 const w=createWorld();assert.equal(factoryIncome(w,'factory'),100);assert.equal(factoryIncome(w,'annex'),300);assert.equal(factoryIncome(w,'yard'),0);assert.equal(incomePerJourney(w),0);
 w.current='annex';assert.equal(factoryIncome(w,'annex'),300);
 w.links.push(['factory','annex']);assert.equal(locationDistance(w,'annex'),1);assert.equal(factoryIncome(w,'annex'),200);
 w.links=[];assert.equal(factoryIncome(w,'annex'),0);
});
test('only successful travel credits cleared factories, including return trips; reset clears treasury',()=>{
 const w=createWorld(),first=currentMap(w);clear(first);assert.equal(incomePerJourney(w),100);
 assert.equal(travel(w,'annex').ok,false);assert.equal(w.money,0);assert.equal(w.journeys,0);
 assert.equal(travel(w,'yard').income,100);assert.equal(w.money,100);
 clear(currentMap(w));assert.equal(incomePerJourney(w),100);
 assert.equal(travel(w,'annex').income,100);clear(currentMap(w));assert.equal(incomePerJourney(w),400);
 assert.equal(travel(w,'yard').income,400);assert.equal(w.money,600);assert.equal(w.journeys,3);
 assert.equal(travel(w,'yard').ok,false);assert.equal(w.money,600);
 const fresh=createWorld(blankMap());assert.equal(fresh.money,0);assert.equal(fresh.journeys,0);
});
