import test from 'node:test';
import assert from 'node:assert/strict';
import {FLAME,SHOT_MS,eventMs,effectMs,effectClock,drawFlameBurst,nozzleOffset,torsoLift,missLanding,shooterShake,targetFlinch,holdsFallenSprite,TUFTS} from '../dist/tactics/flame-effect.js';
import {FLAME_NOZZLES} from '../dist/tactics/flame-nozzles.js';
import {WEAPON_EXPANSION_FRAMES} from '../dist/tactics/weapon-expansion-frames.js';
import {unitArt} from '../dist/tactics/red-hats-art.js';
import {CHARACTER_SPECIES} from '../dist/tactics/character-art.js';
import {measureAll,measureNozzle} from '../tools/measure-flame-nozzles.mjs';
import {recorder,area} from './canvas-recorder.mjs';

const burst=(overrides={})=>({from:{x:200,y:180},dir:{x:Math.cos(-.2),y:Math.sin(-.2)},to:{x:420,y:230},ground:{x:420,y:262},zoom:1.15,outcome:'hit',seed:7,tuft:TUFTS.horse,...overrides});

test('the nozzle table covers every flamethrower sprite and matches a fresh measurement of the PNGs',()=>{
 const frames=WEAPON_EXPANSION_FRAMES.filter(f=>f.weapon==='flamethrower');
 assert.equal(frames.length,48);
 assert.deepEqual(Object.keys(FLAME_NOZZLES).sort(),frames.map(f=>f.src).sort());
 assert.deepEqual(measureAll(),FLAME_NOZZLES,'Sprites changed: run node tools/measure-flame-nozzles.mjs');
 for(const frame of frames){const [x,y,angle]=FLAME_NOZZLES[frame.src];assert.ok(x>frame.width/2&&x<=frame.width&&y>0&&y<244&&Math.abs(angle)<30,frame.src);}
});

test('nozzle measurement finds the muzzle face and barrel axis, ignoring a flared tip',()=>{
 const image=(width,height,paint)=>{const pixels=new Uint8ClampedArray(width*height*4);for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(paint(x,y))pixels[(y*width+x)*4+3]=255;return {width,height,pixels};};
 // A level barrel on rows 28-33 with a wider muzzle over its last ten columns.
 assert.deepEqual(measureNozzle(image(120,60,(x,y)=>x>=20&&x<100&&y>=28&&y<=33||x>=90&&x<100&&y>=25&&y<=36)),[100,31,0]);
 // A barrel rising one pixel per four columns reads as a negative angle of about 14 degrees.
 const [tip,,angle]=measureNozzle(image(120,80,(x,y)=>x>=10&&x<100&&Math.abs(y-(60-(x-10)/4))<=2.5));
 assert.equal(tip,100);assert.ok(angle<-12&&angle>-16,String(angle));
});

test('nozzle offsets repeat the renderer sprite placement for both facings and the vector overlay',()=>{
 const unit={species:'horse',weapon:'flamethrower',stance:'standing',facing:1},frame=unitArt(unit);
 assert.equal(frame.src,'../assets/characters/weapon-expansion/normal/horse-flamethrower-standing.png');
 const [x,y,angle]=FLAME_NOZZLES[frame.src],right=nozzleOffset(unit,frame,2),left=nozzleOffset({...unit,facing:-1},frame,2);
 assert.equal(right.x,(x-frame.width/2)/4*2);assert.equal(right.y,(y-244)/4*2);assert.equal(left.x,-right.x);assert.equal(left.y,right.y);
 assert.ok(Math.abs(right.dx-Math.cos(angle*Math.PI/180))<1e-12&&Math.abs(left.dx+right.dx)<1e-12&&right.dy===left.dy);
 // Every animal and uniform the game can field resolves to a measured frame.
 for(const species of CHARACTER_SPECIES)for(const stance of ['standing','kneeling','prone'])for(const outfit of ['normal','red-hats']){
  const u={species,stance,outfit,weapon:'flamethrower',facing:1},art=unitArt(u);
  if(!art.overlay)assert.ok(FLAME_NOZZLES[art.src],`${outfit} ${species} ${stance}`);
 }
 // The director has no Red Hats uniform, so his flamethrower is the vector overlay with its pilot light at (27, -42 + 3).
 const director={species:'pig-director',outfit:'red-hats',stance:'standing',weapon:'flamethrower',facing:-1},overlay=unitArt(director);
 assert.equal(overlay.overlay,'flamethrower');assert.deepEqual(nozzleOffset(director,overlay,1),{x:-27,y:-36,dx:-1,dy:0});
});

test('attack effects play back to back, flame bursts take their own time, and bullets keep the old rule',()=>{
 const flame={incendiary:true},shot={incendiary:false};
 assert.equal(eventMs(flame),FLAME.end);assert.equal(eventMs(shot),SHOT_MS);assert.equal(effectMs({sequence:[shot,flame,shot]}),SHOT_MS*2+FLAME.end);
 const mixed={sequence:[shot,flame,shot]};
 assert.equal(effectClock(mixed,SHOT_MS-1).index,0);assert.equal(effectClock(mixed,SHOT_MS).index,1);assert.equal(effectClock(mixed,SHOT_MS).local,0);
 assert.equal(effectClock(mixed,SHOT_MS+FLAME.end-1).index,1);assert.equal(effectClock(mixed,SHOT_MS+FLAME.end).index,2);
 assert.equal(effectClock(mixed,99999).index,2);assert.equal(effectClock({sequence:[]},10),null);
 // The renderer's previous rule for bullet-only sequences: floor(elapsed / 650), clamped to the last event.
 for(let n=1;n<=4;n++)for(let elapsed=0;elapsed<n*SHOT_MS+400;elapsed+=37)assert.equal(effectClock({sequence:Array(n).fill(shot)},elapsed).index,Math.max(0,Math.min(n-1,Math.floor(elapsed/650))));
 assert.equal(effectClock({incendiary:true},30).event.incendiary,true);
});

test('a burst draws finite, outlined, single-winding shapes for every outcome, facing and moment',()=>{
 const dirs=[{x:1,y:0},{x:-.97,y:-.24},{x:.2,y:.98}],landings=[{x:420,y:230},{x:60,y:120},{x:201,y:181},{x:200,y:180}];
 for(const outcome of ['hit','kill','miss'])for(const dir of dirs)for(const to of landings)for(const still of [false,true])for(let t=0;t<=FLAME.end;t+=still?250:10){
  const ctx=recorder();drawFlameBurst(ctx,burst({outcome,dir,to,still,t}));
  assert.ok(ctx.fills.length>0,`${outcome} drew nothing at ${t} ms`);
  for(const fill of ctx.fills)for(const polygon of fill.polygons){const a=area(polygon);assert.ok(a>-1e-6,`${outcome} ${t} ms: ${fill.style} subpath wound against the rest (area ${a})`);}
 }
 for(const t of [-1,FLAME.end+1,NaN]){const ctx=recorder();drawFlameBurst(ctx,burst({t}));assert.equal(ctx.calls.length,0);}
 // The jet lands at the impact moment: nothing is drawn at the landing point before it, flames are after.
 const near=(ctx,p,r)=>ctx.fills.filter(f=>f.style==='#de7a2c').some(f=>f.polygons.some(poly=>poly.some(([x,y])=>Math.hypot(x-p.x,y-p.y)<r)));
 const early=recorder();drawFlameBurst(early,burst({t:120}));assert.equal(near(early,{x:420,y:230},14),false);
 const landed=recorder();drawFlameBurst(landed,burst({t:FLAME.impact+80}));assert.equal(near(landed,{x:420,y:230},14),true);
});

test('bursts are deterministic for a seed and differ between seeds',()=>{
 const log=seed=>{const ctx=recorder();drawFlameBurst(ctx,burst({t:520,seed,outcome:'kill'}));return ctx.calls;};
 assert.deepEqual(log(11),log(11));assert.notDeepEqual(log(11),log(12));
});

test('pose helpers stay still outside their windows and a burned body is held until the flame lands',()=>{
 assert.deepEqual(shooterShake(FLAME.ignite-1,2,1),{x:0,y:0});assert.deepEqual(shooterShake(FLAME.cutoff+61,2,1),{x:0,y:0});
 const push=shooterShake(300,2,1),mirrored=shooterShake(300,2,-1);assert.ok(Math.abs(push.x)>0&&Math.abs(push.x)<=2.5);assert.equal(mirrored.x,-push.x);
 assert.deepEqual(targetFlinch(FLAME.impact-1,2,'miss'),{x:0,y:0});assert.ok(targetFlinch(FLAME.impact+120,2,'miss').y<-8);assert.deepEqual(targetFlinch(FLAME.impact+120,2,'kill'),{x:0,y:0});
 assert.equal(holdsFallenSprite(FLAME.impact),true);assert.equal(holdsFallenSprite(FLAME.impact+50),false);
 assert.ok(torsoLift({stance:'standing',hp:0},1)>torsoLift({stance:'kneeling',hp:0},1));
 assert.equal(torsoLift({stance:'prone',hp:0},1),torsoLift({stance:'prone',hp:30},1));
});

test('a miss lands on the floor beside the target, short of it, on a side chosen by the seed',()=>{
 const shot={ax:10,ay:10,bx:16,by:10};
 const left=missLanding(shot,2),right=missLanding(shot,3);
 for(const p of [left,right]){const d=Math.hypot(p.x-shot.bx,p.y-shot.by);assert.ok(d>.7&&d<1.4,String(d));assert.ok(p.x<shot.bx);}
 assert.ok(Math.sign(left.y-shot.by)!==Math.sign(right.y-shot.by));
 assert.deepEqual(missLanding(shot,5),missLanding(shot,5));
});
