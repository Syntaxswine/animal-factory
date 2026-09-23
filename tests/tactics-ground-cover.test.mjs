import test from 'node:test';
import assert from 'node:assert/strict';
import {recorder} from './canvas-recorder.mjs';
import {TUFT_TERRAINS,COVER_TERRAIN,TILE_PX,UNIT_PX,TUFT_LIFT,TUFT_BOX,COVER_BOX,TUFT_FADE,COVER_FADE,
        tuftSeed,coverSeed,seedRandom,tuftCount,grassTufts,coverClumps,
        drawTuft,drawCover,groundCoverSprites,paintGroundCover,tileCover,clearCoverMemo,installGroundCover} from '../dist/tactics/ground-cover.js';
import {clearScenePasses,runScenePass,scenePassCount} from '../dist/tactics/scene-passes.js';
import {blankMap,setTerrain,tileKey,W,H} from '../dist/tactics/maps.js';

// The 3D branch's foliage-models.js, transcribed. The point of writing it out rather than importing
// ground-cover.js twice is that a typo in the port then shows up as a disagreement instead of
// agreeing with itself. A one-off rig compared the two implementations over 64,800 tiles and found
// 46,795 tuft placements and 32,400 undergrowth placements identical; this keeps them that way.
function tufts3d(x,y,z,material){
 if(!['yard','ground-grass','woodland'].includes(material))return [];
 const seed=(Math.imul(x+91,73856093)^Math.imul(y+37,19349663)^Math.imul(z+7,83492791))>>>0;
 const random=i=>((Math.imul(seed^(i*374761393),1597334677)>>>0)%10000)/10000;
 const count=material==='yard'?(seed%3===0?1:0):2;
 return Array.from({length:count},(_,i)=>({
  x:x+(random(i+1)-.5)*.72,y:y+(random(i+3)-.5)*.72,
  width:.20+random(i+7)*.12,height:.10+random(i+5)*.095,
 }));
}
function cover3d(x,y,z,material){
 if(material!=='woodland')return [];
 const seed=(Math.imul(x+17,73856093)^Math.imul(y+61,19349663)^Math.imul(z+3,83492791))>>>0;
 const random=i=>((Math.imul(seed^(i*374761393),1597334677)>>>0)%10000)/10000;
 return Array.from({length:3},(_,i)=>({
  x:x+(random(i+1)-.5)*.5,y:y+(random(i+7)-.5)*.5,
  width:.58+random(i+5)*.25,height:.55+random(i+3)*.6,pale:i===1,
 }));
}

test('tufts and undergrowth stand exactly where the 3D branch grows them',()=>{
 let tufts=0,clumps=0;
 for(let z=0;z<3;z++)for(let y=0;y<24;y++)for(let x=0;x<24;x++)
  for(const terrain of ['yard','ground-grass','woodland','floor','ground-concrete','water']){
   const mine=grassTufts(x,y,z,terrain),theirs=tufts3d(x,y,z,terrain);
   assert.equal(mine.length,theirs.length,`tuft count at ${x},${y},${z} ${terrain}`);
   mine.forEach((t,i)=>{
    tufts++;
    for(const field of ['x','y','width','height'])
     assert.equal(t[field],theirs[i][field],`tuft ${field} at ${x},${y},${z} ${terrain}`);
   });
   const mineCover=coverClumps(x,y,z,terrain),theirCover=cover3d(x,y,z,terrain);
   assert.equal(mineCover.length,theirCover.length);
   mineCover.forEach((c,i)=>{
    clumps++;
    for(const field of ['x','y','width','height','pale'])
     assert.equal(c[field],theirCover[i][field],`cover ${field} at ${x},${y},${z} ${terrain}`);
   });
  }
 assert.ok(tufts>6000&&clumps===5184,`compared ${tufts} tufts and ${clumps} clumps`);
});

test('only three terrains grow anything, and a yard grows a third as much',()=>{
 assert.deepEqual(TUFT_TERRAINS,['yard','ground-grass','woodland']);
 assert.equal(COVER_TERRAIN,'woodland');
 const per=terrain=>{let n=0,tiles=0;
  for(let y=0;y<60;y++)for(let x=0;x<60;x++){tiles++;n+=grassTufts(x,y,0,terrain).length;}
  return n/tiles;};
 assert.equal(per('ground-grass'),2);
 assert.equal(per('woodland'),2);
 // A third of tiles, one tuft each: the count rule is seed % 3 === 0, so this is exact, not close.
 assert.ok(Math.abs(per('yard')-1/3)<.02,`yard ${per('yard')}`);
 for(const terrain of ['floor','ground-concrete','ground-asphalt','water','bridge','void'])
  assert.deepEqual([grassTufts(5,7,0,terrain),coverClumps(5,7,0,terrain)],[[],[]]);
 // The two hashes disagree, so a woodland tile's undergrowth is not stacked on its own tufts.
 assert.notEqual(tuftSeed(4,9,0),coverSeed(4,9,0));
});

test('the same tile draws the same dressing however many times it is asked',()=>{
 // Determinism is the whole requirement: a reload, a camera move and a level switch must not reseed.
 const once=grassTufts(13,29,1,'ground-grass');
 for(let i=0;i<50;i++)assert.deepEqual(grassTufts(13,29,1,'ground-grass'),once);
 // Indexed rather than sequential: asking for draw 7 on its own gives what a full sweep gave.
 const random=seedRandom(tuftSeed(13,29,1));
 assert.equal(random(7),seedRandom(tuftSeed(13,29,1))(7));
 // Neighbouring tiles and levels are independent.
 assert.notDeepEqual(grassTufts(14,29,1,'ground-grass'),once);
 assert.notDeepEqual(grassTufts(13,29,0,'ground-grass'),once);
 assert.equal(tuftCount('yard',3),1);
 assert.equal(tuftCount('yard',4),0);
 assert.equal(tuftCount('floor',3),0);
});

test('sizes land in the ranges the painted catalogue expects',()=>{
 // A tuft is a low spreading clump and a clump of undergrowth is waist high. If either drifts out
 // of these ranges it stops matching the 50 x 32 px bush it stands beside.
 let tw=[Infinity,-Infinity],th=[Infinity,-Infinity],cw=[Infinity,-Infinity],ch=[Infinity,-Infinity];
 const span=(a,v)=>[Math.min(a[0],v),Math.max(a[1],v)];
 for(let y=0;y<40;y++)for(let x=0;x<40;x++){
  for(const t of grassTufts(x,y,0,'ground-grass')){tw=span(tw,t.width*TILE_PX);th=span(th,t.height*UNIT_PX);}
  for(const c of coverClumps(x,y,0,'woodland')){cw=span(cw,c.width*TILE_PX);ch=span(ch,c.height*UNIT_PX);}
 }
 assert.ok(tw[0]>5.5&&tw[1]<9.1,`tuft width ${tw}`);
 assert.ok(th[0]>3.3&&th[1]<6.8,`tuft model height ${th}`);
 assert.ok(cw[0]>16&&cw[1]<23.3,`clump width ${cw}`);
 assert.ok(ch[0]>18.8&&ch[1]<39.5,`clump height ${ch}`);
 // A clump is drawn at its model height; a tuft is drawn twice as tall, because at 3.4 px a clump
 // of blades averages into a stain. Even doubled it stays shorter than the bush it grows beside.
 assert.equal(TUFT_LIFT,2);
 assert.ok(th[1]*TUFT_LIFT<14&&th[1]*TUFT_LIFT>tw[1],`drawn tuft ${th[1]*TUFT_LIFT} should stand taller than it is wide (${tw[1]})`);
 assert.ok(ch[1]<40,'a clump stays under the 40 px the bush prop is drawn at plus a little');
 // One tile unit of height is the 3D branch's own lift, so waist high there is waist high here.
 assert.ok(Math.abs(UNIT_PX-34.2929)<1e-3,String(UNIT_PX));
});

test('both shapes draw inside their box and stand on the ground point',()=>{
 for(const [draw,box] of [[drawTuft,TUFT_BOX],[drawCover,COVER_BOX]])
  for(let variant=0;variant<6;variant++){
   const g=recorder();draw(g,box.ox,box.oy,box.w,box.h,variant);
   // Filled shapes come back as flattened polygons; stroked blades and stems only as their calls,
   // so a quadratic contributes both its control point and its tip.
   const points=g.fills.flatMap(f=>f.polygons.flat()).concat(
    g.calls.filter(c=>['moveTo','lineTo'].includes(c[0])).map(c=>[c[1],c[2]]),
    g.calls.filter(c=>c[0]==='quadraticCurveTo').flatMap(c=>[[c[1],c[2]],[c[3],c[4]]]));
   assert.ok(points.length>20,`variant ${variant} drew ${points.length} points`);
   const ys=points.map(p=>p[1]);
   // Nothing reaches below the ground point, and something reaches at least halfway up the box.
   assert.ok(Math.min(...ys)>=-.75,`variant ${variant} reached above the box at ${Math.min(...ys)}`);
   assert.ok(Math.max(...ys)<=box.oy+box.h*.12,`variant ${variant} sank to ${Math.max(...ys)}`);
   // Every variant stands up: measured, the shortest reaches .533 of its box and the tallest .883.
   assert.ok(Math.min(...ys)<box.oy-box.h*.5,`variant ${variant} only reached ${Math.min(...ys)}`);
   const xs=points.map(p=>p[0]);
   assert.ok(Math.min(...xs)>=-.75&&Math.max(...xs)<=box.w+.75,`variant ${variant} spilled to ${Math.min(...xs)}..${Math.max(...xs)}`);
  }
 // The pale middle clump is a different set of tones, not a different shape.
 const plain=recorder(),pale=recorder();
 drawCover(plain,COVER_BOX.ox,COVER_BOX.oy,COVER_BOX.w,COVER_BOX.h,2,false);
 drawCover(pale,COVER_BOX.ox,COVER_BOX.oy,COVER_BOX.w,COVER_BOX.h,2,true);
 // Geometry only: the recorder stamps the current style into every fill and stroke entry too.
 const shape=c=>c.calls.filter(x=>x[0]!=='set').map(x=>JSON.stringify(['fill','stroke'].includes(x[0])?[x[0]]:x)).join('|');
 assert.equal(shape(plain),shape(pale));
 assert.notEqual(plain.calls.filter(c=>c[0]==='set'&&c[1]==='fillStyle').join(),
                 pale.calls.filter(c=>c[0]==='set'&&c[1]==='fillStyle').join());
});

test('a sprite is drawn once per variant and stamped thereafter',()=>{
 const made=[],fake=(w,h)=>{const canvas={width:w,height:h,ctx:recorder(),getContext(){return this.ctx;}};made.push(canvas);return canvas;};
 const art=groundCoverSprites(fake),screen=recorder();
 const stamp=(kind,opts)=>art.draw(screen,kind,100,100,{zoom:1,width:8,height:6,...opts});
 stamp('tuft',{variant:0});
 assert.equal(made.length,1);
 for(let i=0;i<20;i++)stamp('tuft',{variant:0});
 assert.equal(made.length,1,'a repeated variant is stamped, not redrawn');
 assert.equal(screen.calls.filter(c=>c[0]==='drawImage').length,21);
 stamp('tuft',{variant:1});
 assert.equal(made.length,2);
 // The fogged copy is its own bitmap, so a remembered tile costs one extra render and no per-frame work.
 stamp('tuft',{variant:0,dim:true});
 assert.equal(made.length,3);
 assert.ok(made[2].ctx.fills.some(f=>f.style==='#182c2899'),'the fogged copy carries the wash drawTerrain paints');
 assert.ok(!made[0].ctx.fills.some(f=>f.style==='#182c2899'),'the lit copy does not');
 // A zero-size or invisible piece is skipped rather than stamped.
 const before=screen.calls.length;
 assert.equal(art.draw(screen,'tuft',0,0,{width:0,height:6}),false);
 assert.equal(art.draw(screen,'tuft',0,0,{width:8,height:6,alpha:0}),false);
 assert.equal(screen.calls.length,before);
 // Two pieces of different sizes at the same zoom share one step, or the cache would be cleared
 // between neighbouring tufts and never hold anything.
 const step=art.step;
 art.draw(screen,'cover',0,0,{zoom:1,width:23,height:39});
 art.draw(screen,'tuft',0,0,{zoom:1,width:5.6,height:3.4});
 assert.equal(art.step,step);
 assert.equal(art.size,4,'the four bitmaps so far all survive');
 // Zooming past a 1.5x step re-renders at the new resolution instead of stretching.
 art.draw(screen,'cover',0,0,{zoom:2.5,width:58,height:98});
 assert.notEqual(art.step,step);
 assert.equal(art.size,1,'a new step clears the cache');
});

test('the dressing pass covers the ground it should and skips the ground it should not',()=>{
 const map=blankMap('cover');
 for(let y=0;y<6;y++)for(let x=0;x<6;x++)setTerrain(map,x,y,0,'ground-grass');
 setTerrain(map,2,2,0,'floor');
 setTerrain(map,3,3,0,'woodland');
 map.props=[{x:4,y:4,z:0,kind:'crate-wood'}];
 const state={...map,seen:null,visible:null};
 const view={project:(x,y)=>({x:(x-y)*28,y:(x+y)*14}),zoom:1,level:0,bounds:{x0:0,y0:0,x1:5,y1:5},state};
 const seen=[];
 const art={draw(ctx,kind,x,y,o){seen.push({kind,x,y,...o});return true;}};
 const drawn=paintGroundCover(recorder(),view,art);
 assert.equal(drawn,seen.length);
 const at=(x,y)=>seen.filter(s=>Math.abs(s.x-(x-y)*28)<20&&Math.abs(s.y-(x+y)*14)<10);
 assert.equal(at(2,2).length,0,'concrete grows nothing');
 assert.equal(at(4,4).length,0,'a prop footprint is bare');
 assert.equal(seen.filter(s=>s.kind==='cover').length,3,'only the one woodland tile has undergrowth');
 // 36 tiles, less the concrete one and the crate one, two tufts each.
 assert.equal(seen.filter(s=>s.kind==='tuft').length,34*2);
 // Back to front: a clump 39 px tall leans over the tile in front of it, so order is not optional.
 const covers=seen.filter(s=>s.kind==='cover');
 assert.deepEqual(covers.map(c=>c.y),[...covers.map(c=>c.y)].sort((a,b)=>a-b));
});

test('fog, zoom and an unseen tile',()=>{
 const map=blankMap('fog');
 for(let y=0;y<3;y++)for(let x=0;x<3;x++)setTerrain(map,x,y,0,'ground-grass');
 const state={...map,seen:new Set(['0,0','1,1']),visible:new Set(['0,0'])};
 const view={project:(x,y)=>({x,y}),zoom:1,level:0,bounds:{x0:0,y0:0,x1:2,y1:2},state};
 const seen=[];
 paintGroundCover(recorder(),view,{draw:(c,k,x,y,o)=>{seen.push(o);return true;}});
 assert.equal(seen.length,4,'two remembered tiles, two tufts each');
 assert.equal(seen.filter(s=>s.dim).length,2,'the remembered but unwatched tile is stamped pre-fogged');
 // Fixed zooms, not zooms read back out of the constants, or narrowing the band to nothing would
 // still pass. Tufts fade in from .30 to .55, undergrowth from .18 to .38.
 const count=zoom=>{const out=[];paintGroundCover(recorder(),{...view,zoom},{draw:(c,k,x,y,o)=>{out.push(o);return true;}});return out;};
 assert.deepEqual([TUFT_FADE,COVER_FADE],[[.30,.55],[.18,.38]]);
 assert.equal(count(.30).length,0,'nothing at all below the band');
 assert.equal(count(.18).length,0);
 for(const zoom of [.35,.42,.50])assert.ok(count(zoom).every(o=>o.alpha>0&&o.alpha<1),`zoom ${zoom} is inside the band`);
 assert.ok(count(.42).some(o=>o.alpha>.4&&o.alpha<.6),'and rises across it');
 assert.ok(count(1).every(o=>o.alpha===1));
});

test('the memo answers with the same objects and the pass registers itself once',()=>{
 clearCoverMemo();
 const first=tileCover(9,9,0,'woodland');
 assert.equal(tileCover(9,9,0,'woodland'),first,'a second frame reuses the first frame\'s answer');
 clearCoverMemo();
 assert.notEqual(tileCover(9,9,0,'woodland'),first);
 assert.deepEqual(tileCover(9,9,0,'woodland').tufts,grassTufts(9,9,0,'woodland'));
 // The memo sorts its clumps back to front; the raw list keeps the 3D branch's order.
 const sorted=tileCover(9,9,0,'woodland').clumps.map(c=>c.x+c.y);
 assert.deepEqual(sorted,[...sorted].sort((a,b)=>a-b));

 clearScenePasses();
 assert.equal(scenePassCount('dressing'),0);
 const remove=installGroundCover((w,h)=>({width:w,height:h,getContext:()=>recorder()}));
 assert.equal(scenePassCount('dressing'),1);
 const map=blankMap('install');setTerrain(map,0,0,0,'ground-grass');
 const ctx=recorder();
 runScenePass('dressing',ctx,{project:(x,y)=>({x,y}),zoom:1,level:0,bounds:{x0:0,y0:0,x1:0,y1:0},state:{...map,seen:null,visible:null}});
 assert.equal(ctx.calls.filter(c=>c[0]==='drawImage').length,2);
 remove();
 assert.equal(scenePassCount('dressing'),0);
 clearScenePasses();
});

test('nothing here touches what woodland costs to see through',async()=>{
 // Parcel K is the look. Two ways it could stop being only the look, both checked behaviourally:
 // by reaching into the mechanics modules, or by writing to the state it is handed.
 const source=await (await import('node:fs/promises')).readFile(new URL('../dist/tactics/ground-cover.js',import.meta.url),'utf8');
 assert.deepEqual([...source.matchAll(/from '\.\/([\w-]+)\.js'/g)].map(m=>m[1]).sort(),
                  ['environment','maps','scene-passes']);

 const map=blankMap('frozen');
 for(let y=0;y<4;y++)for(let x=0;x<4;x++)setTerrain(map,x,y,0,x<2?'woodland':'ground-grass');
 const state={...map,seen:new Set(),visible:new Set()};
 for(let y=0;y<4;y++)for(let x=0;x<4;x++)state.seen.add(tileKey(x,y,0));
 const before=JSON.stringify({terrain:state.terrain,props:state.props,upper:state.upper});
 const view={project:(x,y)=>({x:(x-y)*28,y:(x+y)*14}),zoom:1,level:0,bounds:{x0:0,y0:0,x1:3,y1:3},state};
 // The exact depth a shot through this woodland pays, before and after the map is dressed.
 const {woodlandDepth}=await import('../dist/tactics/woodland.js');
 const depth=woodlandDepth(state,{x:0,y:0,z:0},{x:3,y:3,z:0});
 paintGroundCover(recorder(),view,{draw:()=>true});
 assert.equal(woodlandDepth(state,{x:0,y:0,z:0},{x:3,y:3,z:0}),depth);
 assert.ok(depth>0,'the fixture really does run a ray through woodland');
 assert.equal(JSON.stringify({terrain:state.terrain,props:state.props,upper:state.upper}),before);
 assert.equal(state.seen.size,16,'the pass reads the fog sets and writes neither');
 assert.ok(W>0&&H>0&&tileKey(1,2,3)==='1,2,3');
});
