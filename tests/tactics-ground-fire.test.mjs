import test from 'node:test';
import assert from 'node:assert/strict';
import {FIRE_FRAMES,FIRE_LOOP_MS,CLUMP_BOX,SCORCH_BOX,fireStage,fireClumps,igniteDelay,igniteGrowth,fireFrame,flicker,drawFireClump,drawScorch,fireSprites} from '../dist/tactics/ground-fire.js';
import {FLAME_PALETTE} from '../dist/tactics/flame-effect.js';
import {paintOrder} from '../dist/tactics/paint-order.js';
import {recorder,area} from './canvas-recorder.mjs';

test('every burning tile splits into flame clumps behind and in front of whatever stands on it',()=>{
 for(let y=-12;y<=12;y++)for(let x=-12;x<=12;x++)for(const z of [0,1]){
  const clumps=fireClumps({x,y,z,turns:3}),offsets=clumps.map(c=>c.depth-(x+y));
  assert.equal(clumps.length,3);
  assert.deepEqual(fireClumps({x,y,z,turns:1}),clumps,'placement does not change as the fire dies down');
  assert.ok(offsets.some(u=>u<0)&&offsets.some(u=>u>0),`${x},${y} has clumps on both sides`);
  for(const [i,clump] of clumps.entries()){
   assert.ok(Math.abs(offsets[i])>.05&&Math.abs(offsets[i])<.45,`${x},${y}: depth offset ${offsets[i]}`);
   assert.ok(Math.abs(clump.depth-(clump.x+clump.y))<1e-9,'a clump sorts where it stands');
   assert.ok(Math.abs(clump.x-x)<.45&&Math.abs(clump.y-y)<.45,'inside its tile');
   assert.ok([0,1,2].includes(clump.variant)&&clump.phase>=0&&clump.phase<1&&clump.size>=.85&&clump.size<=1.15);
   assert.equal(clump.z,z);
  }
 }
 assert.notDeepEqual(fireClumps({x:3,y:4,z:0}),fireClumps({x:4,y:3,z:0}));
});

test('in paint order a tile\'s back clump is behind what stands on it and its front clumps are behind the next tile and its walls',()=>{
 const x=10,y=7,fire={x,y,z:0,turns:3},unit=(ux,uy,hp=100)=>({x:ux,y:uy,type:'actor',unit:{x:ux,y:uy,hp}});
 const clumps=fireClumps(fire).map(c=>({...c,type:'fire',fire})),back=clumps.filter(c=>c.depth<x+y),front=clumps.filter(c=>c.depth>x+y);
 const scorch={x,y,type:'scorch',fire},roof={x:x-1,y:y-1,z:0,kind:'roof-corrugated-flat',type:'prop',depth:x+y};
 const standing=unit(x,y),fallen=unit(x,y,0),crate={x,y,type:'crate'};
 const ahead=[unit(x+1,y),unit(x,y+1)],behind=[unit(x-1,y),unit(x,y-1)];
 const frontWalls=[{x:x+.5,y,type:'edge',kind:'wall'},{x,y:y+.5,type:'edge',kind:'wall'}],backWalls=[{x:x-.5,y,type:'edge',kind:'wall'},{x,y:y-.5,type:'edge',kind:'wall'}];
 const painted=[...clumps,scorch,roof,standing,fallen,crate,...ahead,...behind,...frontWalls,...backWalls].reverse().sort(paintOrder),at=o=>painted.indexOf(o);
 const before=(earlier,later)=>{for(const a of earlier)for(const b of later)assert.ok(at(a)<at(b),`${a.type} ${a.x},${a.y} should paint before ${b.type} ${b.x},${b.y}`);};
 before([roof],[scorch]);before([scorch],painted.filter(o=>o!==roof&&o!==scorch));
 before(backWalls,clumps);before(clumps,frontWalls);
 before(behind,clumps);before(clumps,ahead);
 before(back,[standing,fallen,crate]);before([standing,fallen,crate],front);
});

test('clump and scorch frames wrap, animate, and draw finite outlined shapes inside their sprite boxes',()=>{
 const inside=(ctx,box,label)=>{for(const fill of ctx.fills)for(const polygon of fill.polygons){
  assert.ok(area(polygon)>-1e-6,`${label}: ${fill.style} subpath wound against the rest`);
  for(const [px,py] of polygon)assert.ok(px>=0&&px<=box.w&&py>=0&&py<=box.h,`${label} leaves its box at ${px.toFixed(1)},${py.toFixed(1)}`);
 }};
 const clump=(turns,frame,variant)=>{const ctx=recorder();drawFireClump(ctx,CLUMP_BOX.ox,CLUMP_BOX.oy,1,turns,frame,variant);return ctx;};
 const scorch=(turns,frame)=>{const ctx=recorder();drawScorch(ctx,SCORCH_BOX.ox,SCORCH_BOX.oy,1,turns,frame);return ctx;};
 for(const turns of [3,2,1]){
  for(const variant of [0,1,2]){
   assert.deepEqual(clump(turns,FIRE_FRAMES,variant).calls,clump(turns,0,variant).calls);
   assert.notDeepEqual(clump(turns,3,variant).calls,clump(turns,0,variant).calls);
   for(let frame=0;frame<FIRE_FRAMES;frame++)inside(clump(turns,frame,variant),CLUMP_BOX,`clump ${turns}/${variant}/${frame}`);
  }
  assert.deepEqual(scorch(turns,FIRE_FRAMES).calls,scorch(turns,0).calls);
  for(let frame=0;frame<FIRE_FRAMES;frame++)inside(scorch(turns,frame),SCORCH_BOX,`scorch ${turns}/${frame}`);
 }
 // Flames shrink as the tile burns out.
 const top=ctx=>Math.min(...ctx.fills.filter(f=>f.style===FLAME_PALETTE.rim).flatMap(f=>f.polygons.flat().map(p=>p[1])));
 assert.ok(top(clump(1,0,1))>top(clump(2,0,1))&&top(clump(2,0,1))>top(clump(3,0,1)));
});

test('flicker is a whole number of cycles per loop, so the wrap from the last frame to the first is seamless',()=>{
 // A sampled sine obeys s[k+1] = 2 cos(w) s[k] - s[k-1] with w = 2 pi cycles / frames. Checking every step, the
 // wrap included, fails for any flicker that is not whole cycles (frame 8 is frame 0, so comparing them cannot).
 for(const cycles of [1,2,3])for(const phase of [0,.7,2.9]){
  const s=k=>flicker(k,cycles,phase),c=2*Math.cos(2*Math.PI*cycles/FIRE_FRAMES);
  for(let k=1;k<=FIRE_FRAMES;k++)assert.ok(Math.abs(s(k+1)-(c*s(k)-s(k-1)))<1e-9,`cycles ${cycles}, step ${k}`);
 }
});

test('tiles light in a ripple with a springy pop, clumps flicker out of step, and rounds map to stages',()=>{
 const fires=[];for(let y=0;y<6;y++)for(let x=0;x<6;x++)fires.push({x,y,z:0});
 const delays=new Set(fires.map(igniteDelay));assert.ok(delays.size>=4);
 for(const fire of fires){
  const d=igniteDelay(fire);assert.ok(d>=0&&d<=175);
  assert.equal(igniteGrowth(fire,d),0);assert.ok(igniteGrowth(fire,d+190)>0);assert.equal(igniteGrowth(fire,d+380),1);assert.equal(igniteGrowth(fire,d+60000),1);
 }
 const fire=fires[7];assert.ok(Math.max(...Array.from({length:39},(_,i)=>igniteGrowth(fire,igniteDelay(fire)+i*10)))>1.05,'the pop overshoots');
 assert.equal(fireFrame(0),0);assert.equal(fireFrame(FIRE_LOOP_MS),FIRE_FRAMES);assert.equal(fireFrame(0,.5),FIRE_FRAMES/2);
 assert.deepEqual([7,3,2,1,0].map(fireStage),[3,3,2,1,1]);
});

test('fire sprites render once per stage, design and frame, and again only when the scale step changes',()=>{
 const made=[],fake=(w,h)=>{const canvas={width:w,height:h,ctx:recorder(),getContext(){return this.ctx;}};made.push(canvas);return canvas;};
 const sprites=fireSprites(fake),screen=recorder(),stamps=()=>screen.calls.filter(c=>c[0]==='drawImage');
 sprites.draw(screen,'clump',100,200,{zoom:1.15,turns:3,variant:1,frame:2});
 assert.equal(made.length,1);assert.equal(sprites.step,1.5);
 assert.deepEqual([made[0].width,made[0].height],[Math.ceil(CLUMP_BOX.w*1.5),Math.ceil(CLUMP_BOX.h*1.5)]);
 assert.deepEqual(made[0].ctx.calls[0],['setTransform',1.5,0,0,1.5,0,0]);
 assert.equal(stamps()[0][1],made[0]);
 assert.deepEqual(stamps()[0].slice(2),[100-CLUMP_BOX.ox*1.15,200-CLUMP_BOX.oy*1.15,CLUMP_BOX.w*1.15,CLUMP_BOX.h*1.15]);
 // A wrapped frame, a design number past three, more rounds than three and a zoom inside the same step reuse it.
 sprites.draw(screen,'clump',0,0,{zoom:1.3,turns:3,variant:4,frame:2+FIRE_FRAMES});
 sprites.draw(screen,'clump',0,0,{zoom:1.2,turns:5,variant:1,frame:2});
 assert.equal(made.length,1);assert.equal(stamps().length,3);assert.ok(stamps().every(c=>c[1]===made[0]));
 sprites.draw(screen,'clump',0,0,{zoom:1.2,turns:3,variant:1,frame:3});assert.equal(made.length,2,'another frame is another sprite');
 // Growth scales about the ground point.
 sprites.draw(screen,'clump',100,200,{zoom:1.2,turns:3,variant:1,frame:2,grow:.5});
 assert.deepEqual(stamps().at(-1).slice(2),[100-CLUMP_BOX.ox*.6,200-CLUMP_BOX.oy*.6,CLUMP_BOX.w*.6,CLUMP_BOX.h*.6]);
 sprites.draw(screen,'scorch',0,0,{zoom:1.2,turns:3,variant:2,frame:2});sprites.draw(screen,'scorch',0,0,{zoom:1.2,turns:3,variant:0,frame:2});
 assert.equal(made.length,3,'the scorch has one design');
 sprites.draw(screen,'clump',0,0,{zoom:1.2,turns:2,variant:1,frame:2});assert.equal(made.length,4);assert.equal(sprites.size,4);
 // Zooming past a step drops the cache and renders at the new step; device pixels count and the step is capped.
 sprites.draw(screen,'clump',0,0,{zoom:1.6,turns:3,variant:1,frame:2});
 assert.equal(sprites.step,2.25);assert.equal(sprites.size,1);assert.equal(made.at(-1).width,Math.ceil(CLUMP_BOX.w*2.25));
 sprites.draw(screen,'clump',0,0,{zoom:2.3,pixelRatio:2,turns:3});assert.equal(sprites.step,3.375);
 // A tile that has not lit yet draws nothing.
 const count=stamps().length;sprites.draw(screen,'clump',0,0,{zoom:2.3,pixelRatio:2,turns:3,grow:0});assert.equal(stamps().length,count);
});
