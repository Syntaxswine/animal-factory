import test from 'node:test';
import assert from 'node:assert/strict';
import {DAWN_START,DAY_START,DUSK_START,NIGHT_START,MINUTES_PER_DAY,DEFAULT_START_MINUTES,
        daylightPhase,daylightStrength,daylightWashes,daylightAt,minuteOfDay} from '../dist/tactics/daylight.js';
import {blankMap,parseMap,validateMap,mapStartMinutes} from '../dist/tactics/maps.js';
import {createEditor,setStartTime,undo,redo} from '../dist/tactics/editor-model.js';
import {createWorld,worldPhaseLabel} from '../dist/tactics/world.js';
import {propPieceDepth,paintDepth,paintOrder,PROP_PIECE_SPAN,PROP_PIECE_MIN} from '../dist/tactics/paint-order.js';
import {addScenePass,runScenePass,clearScenePasses,scenePassCount} from '../dist/tactics/scene-passes.js';

test('the day schedule matches the boundaries the 3D branch uses',()=>{
 assert.deepEqual([DAWN_START,DAY_START,DUSK_START,NIGHT_START],[300,360,1080,1200]);
 assert.equal(daylightPhase(0),'night');
 assert.equal(daylightPhase(DAWN_START-1),'night');
 assert.equal(daylightPhase(DAWN_START),'dawn');
 assert.equal(daylightPhase(DAY_START-1),'dawn');
 assert.equal(daylightPhase(DAY_START),'day');
 assert.equal(daylightPhase(DUSK_START-1),'day');
 assert.equal(daylightPhase(DUSK_START),'dusk');
 assert.equal(daylightPhase(NIGHT_START-1),'dusk');
 assert.equal(daylightPhase(NIGHT_START),'night');
 assert.equal(daylightPhase(MINUTES_PER_DAY-1),'night');
 // Later days and a clock that ran backwards both land on the same minute of day.
 assert.equal(daylightPhase(MINUTES_PER_DAY*4+DAY_START),'day');
 assert.equal(minuteOfDay(-30),MINUTES_PER_DAY-30);
 assert.equal(daylightPhase(-30),'night');
});

test('strength matches the 3D branch expression, and eases rather than snapping',()=>{
 const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
 const reference=m=>m<DAY_START?smooth((m-DAWN_START)/(DAY_START-DAWN_START)):1-smooth((m-DUSK_START)/(NIGHT_START-DUSK_START));
 for(let m=0;m<MINUTES_PER_DAY;m+=7)assert.ok(Math.abs(daylightStrength(m)-reference(m))<1e-12,`minute ${m}`);
 assert.equal(daylightStrength(0),0);
 assert.equal(daylightStrength(DAWN_START),0);
 assert.equal(daylightStrength(DAY_START),1);
 assert.equal(daylightStrength(12*60),1);
 assert.equal(daylightStrength(DUSK_START),1);
 assert.equal(daylightStrength(NIGHT_START),0);
 // Monotone through each transition, so the wash never brightens as the sun goes down.
 for(let m=DAWN_START;m<DAY_START;m++)assert.ok(daylightStrength(m+1)>=daylightStrength(m),`dawn ${m}`);
 for(let m=DUSK_START;m<NIGHT_START;m++)assert.ok(daylightStrength(m+1)<=daylightStrength(m),`dusk ${m}`);
});

test('the washes are absent at noon, dark at night and warm only while the light changes',()=>{
 assert.deepEqual(daylightWashes(12*60),[],'midday must be untinted');
 const night=daylightWashes(2*60);
 assert.equal(night.length,1,'deep night is one cool wash, with no warmth left');
 assert.ok(night[0].alpha>.4);
 const midDusk=daylightWashes((DUSK_START+NIGHT_START)/2);
 assert.equal(midDusk.length,2,'a transition carries both washes');
 const warm=midDusk.find(w=>w.blend==='overlay');
 assert.ok(warm.alpha>.15,'the warm wash should peak mid-transition');
 // Counter-assertion: a tint that never changed would satisfy everything above trivially.
 assert.notDeepEqual(daylightWashes(2*60),daylightWashes(12*60));
 assert.notDeepEqual(daylightWashes(2*60),daylightWashes((DUSK_START+NIGHT_START)/2));
 assert.equal(daylightAt(21*60).label,'Night');
 assert.equal(daylightAt(12*60).label,'Day');
});

test('a map may name the minute it opens at, and the schema rejects the rest',()=>{
 const map=blankMap('Start time');
 assert.deepEqual(validateMap(map),[]);
 assert.equal(mapStartMinutes(map),DEFAULT_START_MINUTES,'no time means the campaign default');
 map.time={startMinutes:21*60};
 assert.deepEqual(validateMap(map),[]);
 assert.equal(mapStartMinutes(map),1260);
 const text=JSON.stringify(map);
 assert.deepEqual(parseMap(text),map,'the start time survives a round trip');
 for(const bad of [{startMinutes:-1},{startMinutes:MINUTES_PER_DAY},{startMinutes:12.5},{startMinutes:'0900'},{},[21],'21:00',null]){
  const invalid={...map,time:bad};
  assert.ok(validateMap(invalid).some(e=>/start time/.test(e)),`should reject ${JSON.stringify(bad)}`);
 }
});

test('the opening map sets the campaign clock, and an ordinary map leaves it alone',()=>{
 const plain=blankMap('Plain');
 assert.equal(createWorld(plain).clock.minutes,DEFAULT_START_MINUTES);
 assert.equal(worldPhaseLabel(createWorld(plain)),'Day');
 const night={...blankMap('Night shift'),time:{startMinutes:22*60}};
 const world=createWorld(night);
 assert.equal(world.clock.minutes,1320);
 assert.equal(worldPhaseLabel(world),'Night');
});

test('the editor sets and clears the start time as one undoable edit',()=>{
 const editor=createEditor(blankMap('Editable'));
 assert.equal(setStartTime(editor,19*60),true);
 assert.equal(editor.map.time.startMinutes,1140);
 assert.deepEqual(validateMap(editor.map),[]);
 undo(editor);
 assert.equal(editor.map.time,undefined,'undo removes the whole field');
 redo(editor);
 assert.equal(editor.map.time.startMinutes,1140);
 assert.equal(setStartTime(editor,null),true);
 assert.equal(editor.map.time,undefined);
 for(const bad of [-1,MINUTES_PER_DAY,12.5,'0900'])assert.equal(setStartTime(editor,bad),false,`should refuse ${bad}`);
 assert.equal(editor.map.time,undefined,'a refused edit changes nothing');
});

test('a prop can paint pieces in front of and behind a unit on its own tile',()=>{
 const x=7,y=11,tile=paintDepth({x,y});
 const behind=propPieceDepth(x,y,'behind'),front=propPieceDepth(x,y,'front');
 assert.ok(behind<tile,'a behind piece paints before the unit');
 assert.ok(front>tile,'a front piece paints after the unit');
 assert.ok(tile-behind>=PROP_PIECE_MIN&&front-tile>=PROP_PIECE_MIN,'never ties with the unit');
 // Walls and fences on the tile's sides sort at +/-.5; a piece must not reach them.
 for(const depth of [behind,front])assert.ok(Math.abs(depth-tile)<.5,'a piece must stay inside the tile');
 // Tile depth is x+y, so these comparisons carry floating-point dust; compare within a tolerance.
 assert.ok(Math.abs((propPieceDepth(x,y,'front',99)-tile)-PROP_PIECE_SPAN)<1e-9,'a wild offset clamps to the span');
 assert.ok(Math.abs((tile-propPieceDepth(x,y,'behind',0))-PROP_PIECE_MIN)<1e-9,'a zero offset is pushed off the tie');
 const order=[{x,y,type:'actor',unit:{hp:1}},{x,y,depth:behind,type:'piece'},{x,y,depth:front,type:'piece'}].sort(paintOrder);
 assert.deepEqual(order.map(o=>o.depth??'actor'),[behind,'actor',front]);
});

test('scene passes run per stage, in order, and an empty stage does nothing',()=>{
 clearScenePasses();
 try{
  const seen=[];
  assert.equal(runScenePass('dressing',{},{}),0,'an empty stage runs nothing');
  addScenePass('dressing',()=>seen.push('first'));
  const remove=addScenePass('dressing',()=>seen.push('second'));
  addScenePass('overlay',()=>seen.push('overlay'));
  assert.equal(scenePassCount('dressing'),2);
  runScenePass('dressing',{},{});
  runScenePass('light',{},{});
  runScenePass('overlay',{},{});
  assert.deepEqual(seen,['first','second','overlay'],'registration order, and light stayed empty');
  remove();
  assert.equal(scenePassCount('dressing'),1);
  assert.throws(()=>addScenePass('nowhere',()=>{}),/Unknown scene stage/);
  assert.throws(()=>addScenePass('dressing','not a function'),/not a function/);
 } finally {clearScenePasses();}
});
