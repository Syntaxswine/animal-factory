import * as THREE from './vendor/three.module.js';
import {HybridRenderer} from './hybrid-renderer.js';
import {buildWorld} from './hybrid-world.js';
import {PROPS,EDGES,GROUNDS} from './environment.js';
export const entries=[...Object.keys(PROPS).map(kind=>({kind,type:'prop'})),...Object.keys(EDGES).map(kind=>({kind,type:'edge'})),...['yard','floor','bridge','woodland','water',...GROUNDS].map(kind=>({kind,type:'ground'})),{kind:'stairs',type:'stairs'},{kind:'ladder',type:'stairs'}];
const names=s=>s.split('-').map(w=>w[0].toUpperCase()+w.slice(1)).join(' '),asset=document.querySelector('#asset'),sceneSelect=document.querySelector('#scene'),stage=document.querySelector('#stage');
for(const [i,e]of entries.entries())asset.add(new Option(names(e.kind),String(i)));
document.querySelector('#count').textContent=`${Object.keys(PROPS).length} props · ${Object.keys(EDGES).length} boundaries · ${entries.length-Object.keys(PROPS).length-Object.keys(EDGES).length} terrain & access types`;
const hybrid=new HybridRenderer(),renderer=hybrid.renderer,scene=hybrid.scene,camera=hybrid.camera;
const canvas=renderer.domElement;canvas.setAttribute('aria-label','Interactive 3D environment model');stage.querySelector('canvas').replaceWith(canvas);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const sun=scene.children.find(o=>o.isDirectionalLight);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-10,right:10,top:10,bottom:-10,near:.1,far:35});sun.shadow.bias=-.0003;sun.shadow.normalBias=.025;
renderer.setPixelRatio(Math.min(devicePixelRatio,2));scene.background=new THREE.Color('#24382e');
const ground=new THREE.Mesh(new THREE.CylinderGeometry(3.1,3.1,.12,64),new THREE.MeshStandardMaterial({color:'#455441',roughness:1}));ground.position.y=-.19;ground.receiveShadow=true;scene.add(ground);
let azimuth=.7,elevation=.48,zoom=1,center=new THREE.Vector3(0,.8,0),extent=3.1;
const empty=()=>({terrain:Array.from({length:16},()=>Array(16).fill('void')),upper:[],props:[],edges:{},stairs:[],starts:[],guards:[]});
function makeMap(){
 const map=empty(),e=entries[+asset.value];
 if(sceneSelect.value==='single'){
  if(e.type==='prop'){map.props.push({x:0,y:0,z:e.kind.startsWith('roof-')?1:0,kind:e.kind});map.terrain[0][0]='yard';if(e.kind.startsWith('roof-'))map.upper=[{'0,0':'floor','0,1':'floor','1,0':'floor','1,1':'floor'}];}
  if(e.type==='edge'){map.edges['s:0:0']=e.kind;map.terrain[0][0]='yard';}
  if(e.type==='ground')for(let y=0;y<3;y++)for(let x=0;x<3;x++)map.terrain[y][x]=e.kind;
  if(e.type==='stairs')map.stairs.push({x:0,y:0,z:0,kind:e.kind});
 }else{
  for(let y=0;y<8;y++)for(let x=0;x<9;x++)map.terrain[y][x]=sceneSelect.value==='yard'?(x>5?'ground-grass':'ground-gravel'):'floor';
  for(let x=0;x<6;x++)map.edges[`s:${x}:0`]=x===2?'doorway-concrete-open':x===4?'window-brick':'wall-brick';
  for(let y=1;y<5;y++)map.edges[`e:0:${y}`]='wall-corrugated';
  const props=sceneSelect.value==='yard'?[[7,1,'tree-broadleaf'],[7,5,'tree-pine'],[6,6,'bush'],[8,3,'reeds'],[2,2,'barrels-cluster'],[4,2,'crate-stack'],[2,5,'pallet'],[4,5,'sandbags'],[6,3,'toolbox-open']]:[[2,2,'workbench-vise'],[4,2,'lab-bench'],[2,5,'hospital-bed'],[4,5,'iv-stand'],[5,5,'instrument-trolley'],[7,1,'medicine-cabinet-open'],[7,4,'botanical-chamber'],[7,6,'scrub-sink']];
  for(const [x,y,kind]of props)map.props.push({x,y,z:0,kind});
  if(sceneSelect.value==='yard'){for(let x=6;x<9;x++)map.edges[`s:${x}:0`]='fence-chainlink';for(let y=3;y<5;y++)for(let x=7;x<9;x++)map.terrain[y][x]='water';}
 }
 return map;
}
function rebuild(){
 const map=makeMap(),world=buildWorld(map);hybrid.rebuild(world,null,1,map);hybrid.world=world;for(const mesh of hybrid.structures.children){mesh.castShadow=!mesh.userData.boxes.every(b=>b.kind==='floor');mesh.receiveShadow=true;}
 const bounds=new THREE.Box3().setFromObject(hybrid.structures),size=new THREE.Vector3();bounds.getCenter(center);bounds.getSize(size);extent=Math.max(size.x,size.z,size.y)*.78+1;ground.scale.setScalar(sceneSelect.value==='single'?1:2.4);ground.position.x=center.x;ground.position.z=center.z;
 document.querySelector('#caption strong').textContent=sceneSelect.value==='single'?names(entries[+asset.value].kind):sceneSelect.selectedOptions[0].textContent;
 document.querySelector('#caption span').textContent=sceneSelect.value==='single'?'Modeled scenery · Drag to inspect':'An assembled scene using the same models as the hybrid renderer';
 for(const m of hybrid.materials.values())m.wireframe=document.querySelector('#wire').checked;
 document.querySelector('#stats').textContent=`${hybrid.structures.children.reduce((n,m)=>n+m.count,0)} modeled parts · ${hybrid.structures.children.length} draw groups`;
}
asset.onchange=()=>{sceneSelect.value='single';rebuild();};sceneSelect.onchange=rebuild;
for(const [id,step]of [['next',1],['previous',-1]])document.querySelector('#'+id).onclick=()=>{asset.value=(+asset.value+step+entries.length)%entries.length;asset.onchange();};
document.querySelector('#wire').onchange=()=>{for(const m of hybrid.materials.values())m.wireframe=document.querySelector('#wire').checked;};
document.querySelector('#reset').onclick=()=>{azimuth=.7;elevation=.48;zoom=1;};
const pointers=new Map();let pinch=0;
canvas.onpointerdown=e=>{canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,[e.clientX,e.clientY]);};
canvas.onpointermove=e=>{const old=pointers.get(e.pointerId);if(!old)return;pointers.set(e.pointerId,[e.clientX,e.clientY]);if(pointers.size===2){const [a,b]=[...pointers.values()],distance=Math.hypot(a[0]-b[0],a[1]-b[1]);if(pinch)zoom=Math.max(.35,Math.min(3,zoom*distance/pinch));pinch=distance;}else{azimuth-=(e.clientX-old[0])*.008;elevation=Math.max(.1,Math.min(1.45,elevation+(e.clientY-old[1])*.006));}};
canvas.onpointerup=canvas.onpointercancel=e=>{pointers.delete(e.pointerId);pinch=0;};canvas.onwheel=e=>{e.preventDefault();zoom=Math.max(.35,Math.min(3,zoom*Math.exp(-e.deltaY*.001)));};
function draw(){const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h,false);const aspect=w/h,r=extent/zoom/Math.min(aspect,1);camera.left=-r*aspect;camera.right=r*aspect;camera.top=r;camera.bottom=-r;camera.near=.1;camera.far=100;camera.position.set(center.x+Math.sin(azimuth)*20*Math.cos(elevation),center.y+20*Math.sin(elevation),center.z+Math.cos(azimuth)*20*Math.cos(elevation));camera.lookAt(center);camera.updateProjectionMatrix();if(document.querySelector('#spin').checked)azimuth+=.003;hybrid.animateMaterials(performance.now()/1000);renderer.render(scene,camera);requestAnimationFrame(draw);}
rebuild();draw();
// Stable diagnostics for browser acceptance without creating a separate renderer.
window.environmentWorkshop={entries,hybrid,select(kind){asset.value=entries.findIndex(e=>e.kind===kind);asset.onchange();},scene(value){sceneSelect.value=value;rebuild();},view(a,e,z=1){azimuth=a;elevation=e;zoom=z;},map:makeMap};
window.addEventListener('pagehide',()=>{ground.geometry.dispose();ground.material.dispose();hybrid.dispose();},{once:true});
