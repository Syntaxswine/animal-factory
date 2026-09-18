import * as THREE from './vendor/three.module.js';
import {createGreyHorse} from './horse-grey-model.js';
const host=document.getElementById('scene'),renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor(0x383838);
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;host.append(renderer.domElement);
const scene=new THREE.Scene();scene.add(new THREE.HemisphereLight(0xffffff,0x707070,1.15));
const key=new THREE.DirectionalLight(0xffffff,1.8);key.position.set(3,5,4);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-1.2,right:1.2,bottom:-1.2,top:1.2,near:.1,far:12});key.shadow.normalBias=.004;scene.add(key);
const fill=new THREE.DirectionalLight(0xffffff,1.05);fill.position.set(-3,2,-4);scene.add(fill);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({color:0x000000,opacity:.13}));floor.rotation.x=-Math.PI/2;floor.position.y=-.003;floor.receiveShadow=true;scene.add(floor);
await new Promise(resolve=>setTimeout(resolve,60));
const horse=createGreyHorse();scene.add(horse.root);for(const p of horse.parts)p.receiveShadow=false;const d=horse.diagnostics();
document.getElementById('status').textContent=`Standing height 1.65 · one shared scale in all views · ${d.triangles.toLocaleString()} sculpt triangles · connected shirt, overalls and head surfaces. Proportions await approval.`;
const flat=new THREE.MeshBasicMaterial({color:0x111111}),cameras=[0,1,2].map(()=>new THREE.OrthographicCamera());
function render(){
 const width=host.clientWidth,height=host.clientHeight;renderer.setSize(width,height);renderer.setScissorTest(true);
 const span=Math.max(1.96,3.1*height/width),directions=[[4.015,.84,0],document.getElementById('view').value==='rear'?[-3.985,.84,0]:[.015,.84,4],[4.015,1.65,4]];
 for(let i=0;i<3;i++){const x=Math.round(i*width/3),right=Math.round((i+1)*width/3),w=right-x,c=cameras[i];c.left=-span*w/height/2;c.right=span*w/height/2;c.top=span/2;c.bottom=-span/2;c.near=.1;c.far=50;c.position.fromArray(directions[i]);c.lookAt(.015,.84,0);c.updateProjectionMatrix();renderer.setViewport(x,0,w,height);renderer.setScissor(x,0,w,height);renderer.render(scene,c);}
 renderer.setScissorTest(false);
}
function update(){const silhouette=document.getElementById('silhouette').checked;for(const p of horse.parts)p.material=silhouette?flat:horse.material;horse.material.wireframe=document.getElementById('wire').checked;floor.visible=!silhouette;document.getElementById('middle').textContent=document.getElementById('view').value==='rear'?'REAR':'SIDE';render();}
for(const id of ['view','wire','silhouette'])document.getElementById(id).addEventListener('change',update);
new ResizeObserver(render).observe(host);update();
window.greyHorseDiagnostics=()=>({...d,view:document.getElementById('view').value,material:horse.material.color.getHexString(),render:{triangles:renderer.info.render.triangles,calls:renderer.info.render.calls}});
window.greyHorseReady=true;
