import {makePeriodic,renderWaterFrame,LOOP_SECONDS} from './water-animation.js';
import {makeBankOverlay,connectionMask,BANK_NAMES} from './river-banks.js';
const size=128,canvas=document.querySelector('#river'),ctx=canvas.getContext('2d');
const status=document.querySelector('#status'),play=document.querySelector('#play'),grid=document.querySelector('#grid');
const makeCanvas=()=>{const c=document.createElement('canvas');c.width=c.height=size;return c;};
async function texture(src){
 const img=new Image();img.src=src;await img.decode();const c=makeCanvas(),g=c.getContext('2d',{willReadFrequently:true});
 g.drawImage(img,0,0,size,size);return makePeriodic(g.getImageData(0,0,size,size).data,size,size,size);
}
let running=!matchMedia('(prefers-reduced-motion: reduce)').matches,time=0,last;
try{
 const [water,grass]=await Promise.all([texture('../assets/environment/foliage/river-water.png'),texture('../assets/environment/ground-grass.png')]);
 const waterCanvas=makeCanvas(),wc=waterCanvas.getContext('2d'),frame=wc.createImageData(size,size);
 const overlays=Array.from({length:16},(_,mask)=>{const c=makeCanvas();c.getContext('2d').putImageData(new ImageData(makeBankOverlay(mask,grass,size),size,size),0,0);return c;});
 const land=makeCanvas(),landPixels=new Uint8ClampedArray(grass);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++)landPixels.set(grass.subarray(((y%(size-1))*size+x%(size-1))*4,((y%(size-1))*size+x%(size-1))*4+4),(y*size+x)*4);
 land.getContext('2d').putImageData(new ImageData(landPixels,size,size),0,0);
 const layouts={
  meander:[[1,0],[1,1],[1,2],[2,2],[3,2],[3,3],[3,4]],
  fork:[[2,0],[2,1],[2,2],[1,2],[0,2],[3,2],[4,2],[2,3],[2,4]],
  pool:[[2,2]]
 };
 let cells;
 function setLayout(){cells=new Set(layouts[document.querySelector('#layout').value].map(p=>p.join(',')));}
 setLayout();
 const atlas=document.querySelector('#atlas'),ag=atlas.getContext('2d');
 function draw(){
  renderWaterFrame(water,size,time,frame.data);wc.putImageData(frame,0,0);
  for(let y=0;y<5;y++)for(let x=0;x<5;x++){
   if(cells.has(x+','+y)){ctx.drawImage(waterCanvas,x*size,y*size);ctx.drawImage(overlays[connectionMask(cells,x,y)],x*size,y*size);}
   else ctx.drawImage(land,x*size,y*size);
  }
  for(let mask=0;mask<16;mask++){const x=mask%4*size,y=Math.floor(mask/4)*size;ag.drawImage(waterCanvas,x,y);ag.drawImage(overlays[mask],x,y);}
  if(grid.checked){ctx.strokeStyle='#f1d591';ctx.beginPath();for(let n=1;n<5;n++){ctx.moveTo(n*size,0);ctx.lineTo(n*size,640);ctx.moveTo(0,n*size);ctx.lineTo(640,n*size);}ctx.stroke();}
  status.textContent='16 bank patterns · '+time.toFixed(2)+' / '+LOOP_SECONDS+' seconds';
 }
 play.textContent=running?'Pause':'Play';play.onclick=()=>{running=!running;play.textContent=running?'Pause':'Play';last=undefined;};
 document.querySelector('#layout').onchange=()=>{setLayout();draw();};grid.onchange=draw;
 document.querySelector('#download').onclick=()=>{
  const sheet=document.createElement('canvas');sheet.width=sheet.height=size*4;const g=sheet.getContext('2d');
  for(let i=0;i<16;i++)g.drawImage(overlays[i],i%4*size,Math.floor(i/4)*size);
  const a=document.createElement('a');a.href=sheet.toDataURL('image/png');a.download='river-banks-128px-4x4.png';a.click();
 };
 document.querySelector('#legend').textContent=BANK_NAMES.map((s,i)=>i+': '+s).join(' · ');
 let lastDraw=0;
 function tick(now){if(running&&!document.hidden){if(last!==undefined)time=(time+(now-last)/1000)%LOOP_SECONDS;if(now-lastDraw>1000/24){draw();lastDraw=now;}}last=document.hidden?undefined:now;requestAnimationFrame(tick);}
 draw();requestAnimationFrame(tick);
}catch(e){status.textContent='Unable to load river preview: '+e.message;}
