import {CHARACTER_SPECIES} from './character-art.js';
import {unitArt,RED_HAT_SPECIES} from './red-hats-art.js';
import {drawFlamethrower} from './flamethrower-art.js';
import {drawDeathDrops} from './loot-art.js';
import {FLAME,drawFlameBurst,nozzleOffset,torsoLift,missLanding,shooterShake,targetFlinch,holdsFallenSprite,TUFTS} from './flame-effect.js';

const $=id=>document.getElementById(id),images=new Map(),PAUSE=450,SEED=3;
const FILM_TIMES=[60,170,280,380,560,720,900,1100];
const DIRECTIONS=[['Right',1,-1],['Down-right',1,0],['Down',1,1],['Down-left',0,1],['Left',-1,1],['Up-left',-1,0],['Up',-1,-1],['Up-right',0,-1]];
let time=0,playing=!matchMedia('(prefers-reduced-motion: reduce)').matches,previous=null;

for(const species of CHARACTER_SPECIES)$('species').add(new Option(species.replaceAll('-',' '),species));
for(let range=1;range<=10;range++)$('range').add(new Option(range+(range===1?' tile':' tiles'),range));
$('toward').replaceChildren(...DIRECTIONS.map(([label,dx,dy])=>new Option(label,dx+','+dy)));
const query=new URLSearchParams(location.search);
for(const id of ['species','outfit','stance','outcome','range','toward','zoom','speed'])if([...$(id).options].some(o=>o.value===query.get(id)))$(id).value=query.get(id);
if(!query.has('range'))$('range').value='5';
if(query.has('t')){time=Math.max(0,Math.min(FLAME.end,Number(query.get('t'))||0));playing=false;}
if(query.get('filmstrip')==='1')$('filmstrip').checked=true;

function load(src){if(images.has(src))return images.get(src);const img=new Image();img.onload=()=>draw();img.src=src;images.set(src,img);return img;}

// The scene: a merc with the chosen outfit fires at a foreman guard standing `range` tiles away.
function scene(){
 const [dx,dy]=$('toward').value.split(',').map(Number),length=Math.hypot(dx,dy),range=Number($('range').value);
 const target={x:Math.round(dx/length*range),y:Math.round(dy/length*range)};
 if(!target.x&&!target.y)target.x=1;
 const facing=target.x-target.y>=0?1:-1;
 const species=$('species').value,outfit=$('outfit').value==='red-hats'&&RED_HAT_SPECIES.includes(species)?'red-hats':'normal';
 return {
  outcome:$('outcome').value,zoom:Number($('zoom').value),
  shooter:{x:0,y:0,z:0,species,outfit,weapon:'flamethrower',stance:$('stance').value,facing,team:'squad',hp:100},
  target:{...target,z:0,species:'pig-foreman',weapon:'pistol',stance:'standing',facing:-facing,team:'guard',hp:45,ammo:{pistol:8}},
 };
}

function render(ctx,width,height,t,{fit=false}={}){
 const view=scene();let zoom=view.zoom;
 const spanX=Math.abs(view.target.x-view.target.y)*28+130,spanY=(Math.abs(view.target.x+view.target.y))*14+150;
 if(fit)zoom=Math.min(zoom,width/spanX,height/spanY);
 const mid={x:(view.target.x+view.shooter.x)/2,y:(view.target.y+view.shooter.y)/2};
 const camera={x:width/2-(mid.x-mid.y)*28*zoom,y:height/2-(mid.x+mid.y)*14*zoom+26*zoom};
 const project=(x,y,z=0)=>({x:camera.x+(x-y)*28*zoom,y:camera.y+(x+y)*14*zoom-z*zoom});
 ctx.fillStyle='#202c29';ctx.fillRect(0,0,width,height);
 // Ground in the game's floor colours, with its faint grid.
 const reach=Math.ceil(Math.max(width,height)/(28*zoom))+2;
 for(let y=Math.floor(mid.y)-reach;y<=mid.y+reach;y++)for(let x=Math.floor(mid.x)-reach;x<=mid.x+reach;x++){
  const p=project(x,y),a=28*zoom,b=14*zoom,n=((x*37+y*13)%9+9)%9;if(p.x<-a||p.x>width+a||p.y<-b||p.y>height+b)continue;
  ctx.beginPath();ctx.moveTo(p.x,p.y-b);ctx.lineTo(p.x+a,p.y);ctx.lineTo(p.x,p.y+b);ctx.lineTo(p.x-a,p.y);ctx.closePath();ctx.fillStyle=['#77745a','#7b765b','#736f56'][n%3];ctx.fill();ctx.strokeStyle='#555e4533';ctx.lineWidth=1;ctx.stroke();
 }
 const shooterPoint=project(view.shooter.x,view.shooter.y),targetPoint=project(view.target.x,view.target.y);
 const fallen=view.outcome==='kill'&&!holdsFallenSprite(t);
 const units=[{unit:view.shooter,point:shooterPoint,offset:shooterShake(t,zoom,view.shooter.facing)},{unit:view.target,point:targetPoint,offset:targetFlinch(t,zoom,view.outcome),fallen}];
 units.sort((a,b)=>(a.unit.x+a.unit.y)-(b.unit.x+b.unit.y)||(a.fallen?-1:1));
 // Units are placed exactly as app.js draws them.
 for(const {unit,point:p,offset,fallen:down} of units){
  const colour=unit.team==='guard'?'#e57862':'#b6d5b0';
  if(down){
   ctx.beginPath();ctx.moveTo(p.x,p.y-14*zoom);ctx.lineTo(p.x+28*zoom,p.y);ctx.lineTo(p.x,p.y+14*zoom);ctx.lineTo(p.x-28*zoom,p.y);ctx.closePath();ctx.fillStyle='#562e2566';ctx.fill();
   drawDeathDrops(ctx,load,{...unit,hp:0},p,zoom);ctx.font=`${10*zoom}px monospace`;ctx.textAlign='center';ctx.fillStyle='#b5a17c';ctx.fillText('×',p.x-17*zoom,p.y+7*zoom);continue;
  }
  ctx.fillStyle='#13241d66';ctx.beginPath();ctx.ellipse(p.x,p.y+2*zoom,15*zoom,7*zoom,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=colour;ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(p.x,p.y,19*zoom,9*zoom,0,0,Math.PI*2);ctx.stroke();
  const frame=unitArt(unit),img=load(frame.src),sw=frame.width/4*zoom,sh=64*zoom;
  ctx.save();ctx.translate(p.x+offset.x,p.y+3*zoom+offset.y);ctx.scale(unit.facing,1);if(img.complete&&img.naturalWidth)ctx.drawImage(img,-sw/2,-sh,sw,sh);drawFlamethrower(ctx,unit,zoom);ctx.restore();
 }
 // The burst, positioned the way app.js positions it.
 const nozzle=nozzleOffset(view.shooter,unitArt(view.shooter),zoom),shake=shooterShake(t,zoom,view.shooter.facing);
 const from={x:shooterPoint.x+nozzle.x+shake.x,y:shooterPoint.y+nozzle.y+shake.y};
 let to;
 if(view.outcome==='miss'){const q=missLanding({ax:0,ay:0,bx:view.target.x,by:view.target.y},SEED);to=project(q.x,q.y);}
 else to={x:targetPoint.x,y:targetPoint.y-torsoLift(view.target,zoom)};
 drawFlameBurst(ctx,{from,dir:{x:nozzle.dx,y:nozzle.dy},to,ground:targetPoint,t,zoom,outcome:view.outcome,seed:SEED,tuft:TUFTS[view.target.species]});
 return zoom;
}

function sized(canvas){
 const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2),w=Math.round(rect.width*dpr),h=Math.round(rect.height*dpr);
 if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
 const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);return {ctx,width:rect.width,height:rect.height};
}

function draw(){
 const {ctx,width,height}=sized($('stage')),t=Math.min(time,FLAME.end);
 if($('filmstrip').checked){
  // One contact sheet of fixed moments, so the whole burst can be judged (and shared) as a single image.
  const columns=width<640?2:4,rows=Math.ceil(FILM_TIMES.length/columns),w=width/columns,h=height/rows;
  FILM_TIMES.forEach((moment,i)=>{const x=i%columns*w,y=Math.floor(i/columns)*h;ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();ctx.translate(x,y);render(ctx,w,h,moment,{fit:true});ctx.fillStyle='#17241fdd';ctx.fillRect(0,h-22,76,22);ctx.fillStyle='#f5e6c9';ctx.font='13px monospace';ctx.textAlign='left';ctx.fillText(moment+' ms',8,h-7);ctx.strokeStyle='#63755f';ctx.strokeRect(.5,.5,w-1,h-1);ctx.restore();});
 }else render(ctx,width,height,t);
 $('scrub').value=String(Math.round(t));$('time').textContent=time>FLAME.end?'pause':`${Math.round(t)} ms`;
}

function frame(now){
 if(playing&&previous!==null){time+=(now-previous)*Number($('speed').value);if(time>FLAME.end+PAUSE)time=0;}
 previous=now;if(playing)draw();requestAnimationFrame(frame);
}

$('play').textContent=playing?'Pause':'Play';
$('play').addEventListener('click',()=>{playing=!playing;$('play').textContent=playing?'Pause':'Play';if(playing&&time>=FLAME.end)time=0;draw();});
$('scrub').addEventListener('input',()=>{time=Number($('scrub').value);playing=false;$('play').textContent='Play';draw();});
for(const id of ['species','outfit','stance','outcome','range','toward','zoom','speed'])$(id).addEventListener('change',draw);
$('filmstrip').addEventListener('change',()=>{$('stage').classList.toggle('sheet',$('filmstrip').checked);draw();});
new ResizeObserver(draw).observe($('stage'));
$('stage').classList.toggle('sheet',$('filmstrip').checked);draw();requestAnimationFrame(frame);
