import {SECTOR,CANDIDATE_LAYOUT,candidateVertex,candidateError,candidateCrop} from './hybrid-directional.js';
import {bodyRegions} from './hybrid-combat.js';
import {projectWorld} from './hybrid-world.js';
const $=id=>document.getElementById(id),canvas=$('proof'),ctx=canvas.getContext('2d'),stances=['standing','kneeling','prone'];
const landmarks=await (await fetch('./hybrid-directional-landmarks.json')).json(),images={};
for(const stance of stances){const img=new Image();img.src='../assets/characters/directional-proof/horse-rifle-'+stance+'-candidate.png';await img.decode();images[stance]=img;}
let playing=false,last=performance.now(),heading=45,direction=1;
function draw(){ctx.clearRect(0,0,canvas.width,canvas.height);const metrics=[];
 for(const [column,stance]of stances.entries()){
  const measure=candidateError(stance,heading,landmarks),index=measure.index,origin=[column*460+230,410],zoom=$('close').checked?150:52;
  const screen=p=>[origin[0]+p[0]*zoom,origin[1]-p[1]*zoom];
  ctx.fillStyle='#eee5cd';ctx.font='18px system-ui';ctx.fillText(stance,column*460+24,30);ctx.font='14px system-ui';ctx.fillText('frame '+index+' / '+measure.frameHeading.toFixed(4)+'°',column*460+24,55);
  ctx.strokeStyle='#526357';ctx.strokeRect(column*460+.5,75,459,500);
  ctx.strokeStyle='#42644f';for(let t=-2;t<=2;t++){for(const axis of [0,1]){const a=axis?[t,0,-2]:[-2,0,t],b=axis?[t,0,2]:[2,0,t];ctx.beginPath();ctx.moveTo(...screen(projectWorld(a)));ctx.lineTo(...screen(projectWorld(b)));ctx.stroke();}}
  const img=images[stance],[sx,sy,sw,sh]=candidateCrop(stance,index);
  const top=candidateVertex(index,[sx,sy]),bottom=candidateVertex(index,[sx+sw,sy+sh]),at=screen(top);
  ctx.imageSmoothingEnabled=false;ctx.drawImage(img,sx,sy,sw,sh,at[0],at[1],(bottom[0]-top[0])*zoom,(top[1]-bottom[1])*zoom);
  if($('overlays').checked){
   const body=bodyRegions({geometryMode:'hybrid'},{x:0,y:0,z:0,hp:100,stance,heading});
   for(const region of body.regions){const points=[];for(const x of [region.min[0],region.max[0]])for(const y of [region.min[1],region.max[1]])for(const z of [region.min[2],region.max[2]])points.push(screen(projectWorld([x*Math.cos(body.heading)-z*Math.sin(body.heading),y,x*Math.sin(body.heading)+z*Math.cos(body.heading)])));
    ctx.strokeStyle={legs:'#80b4ef',torso:'#78d2b2',head:'#ffbb77',weapon:'#ffe287'}[region.zone];for(let i=0;i<8;i++)for(const mask of [1,2,4]){const j=i^mask;if(j>i){ctx.beginPath();ctx.moveTo(...points[i]);ctx.lineTo(...points[j]);ctx.stroke();}}
   }
   const physical=screen(measure.physical),painted=screen(measure.painted);ctx.strokeStyle='#ff66dd';ctx.beginPath();ctx.arc(...physical,SECTOR.tolerance*zoom,0,2*Math.PI);ctx.stroke();ctx.fillStyle='#ff66dd';ctx.fillRect(physical[0]-1,physical[1]-1,2,2);ctx.fillStyle='#66e8ff';ctx.beginPath();ctx.arc(...painted,2.5,0,2*Math.PI);ctx.fill();ctx.strokeStyle='#fff';ctx.beginPath();ctx.moveTo(origin[0]-7,origin[1]);ctx.lineTo(origin[0]+7,origin[1]);ctx.moveTo(origin[0],origin[1]-7);ctx.lineTo(origin[0],origin[1]+7);ctx.stroke();
  }
  ctx.fillStyle=measure.assessment==='fail'?'#ffb28b':'#ffd69d';ctx.fillText('Muzzle: '+measure.error.toFixed(3)+' tiles · '+measure.assessment,column*460+24,610);ctx.fillText('Estimated interval: '+measure.interval.map(n=>n.toFixed(3)).join('–')+' tiles',column*460+24,635);metrics.push({stance,...measure});
 }
 $('angle').textContent=heading.toFixed(2)+'°';$('status').textContent='FAIL — candidate asset registration needs correction. All three stances retain the fixed authoring scale and ground anchors.\nAngular sampling bound: 0.0241 tile prone; this does not include artwork error.';
 window.directionalDiagnostics=()=>({heading,metrics,layout:CANDIDATE_LAYOUT,scope:'sector candidate; not production',tolerance:SECTOR.tolerance});
}
$('heading').oninput=()=>{heading=Number($('heading').value);draw();};$('overlays').onchange=draw;$('close').onchange=draw;
$('play').onclick=()=>{playing=!playing;$('play').textContent=playing?'Pause sweep':'Sweep angles';};
function frame(now){if(playing){heading+=direction*Math.min((now-last)/1000,.1)*10;if(heading>=SECTOR.max){heading=SECTOR.max;direction=-1;}if(heading<=SECTOR.min){heading=SECTOR.min;direction=1;}$('heading').value=heading;draw();}last=now;requestAnimationFrame(frame);}draw();requestAnimationFrame(frame);
