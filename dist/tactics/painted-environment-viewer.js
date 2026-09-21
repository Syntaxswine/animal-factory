import * as THREE from './vendor/three.module.js';
import {HybridRenderer} from './hybrid-renderer.js';
import {buildWorld,GAME_CAMERA} from './hybrid-world.js';
import {createLightHorse,LIGHT_ATLAS} from './horse-light-model.js';
import {createModelPaint,MODEL_PAINT} from './horse-model-paint.js';
import {createPaintedEnvironment,PAINTED_ATLAS,STUDY_LAYOUT} from './painted-environment-scene.js';
const $=id=>document.getElementById(id),host=$('scene');
async function start(){
 const hybrid=new HybridRenderer(),renderer=hybrid.renderer,scene=hybrid.scene,camera=hybrid.camera;host.append(renderer.domElement);
 renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0x343331);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 // Calibrated horse-viewer light colours/intensities, identical on both sides.
 for(const light of [...scene.children].filter(o=>o.isLight))scene.remove(light);
 scene.add(new THREE.HemisphereLight(0xfff9ec,0x737775,2));const sun=new THREE.DirectionalLight(0xfff2dc,2.3);sun.position.set(5,7,6);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-6,right:6,top:6,bottom:-6,near:.1,far:25});sun.shadow.bias=-.0003;sun.shadow.normalBias=.015;scene.add(sun);const fill=new THREE.DirectionalLight(0xffffff,.7);fill.position.set(-2,2,-3);scene.add(fill);
 const map={terrain:Array.from({length:4},()=>Array(5).fill('floor')),edges:Object.fromEntries(Array.from({length:5},(_,x)=>[`s:${x}:0`,x===2?'doorway-concrete-open':'wall-brick'])),props:[{x:1,y:2,z:0,kind:'crate-wood'},{x:3,y:2,z:0,kind:'barrel-single'}],stairs:[],upper:[]};
 const world=buildWorld(map);hybrid.rebuild(world,null,0,map);const prototype=hybrid.structures;for(const mesh of prototype.children){mesh.castShadow=mesh.receiveShadow=true;}
 const loader=new THREE.TextureLoader(),[atlas,horseAtlas,horsePaint,data]=await Promise.all([loader.loadAsync(PAINTED_ATLAS),loader.loadAsync(LIGHT_ATLAS),loader.loadAsync(MODEL_PAINT),fetch('./horse-10k-data.json').then(r=>{if(!r.ok)throw Error('Horse model failed to load');return r.json();})]);
 for(const t of [atlas,horseAtlas]){t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());}
 const painted=createPaintedEnvironment(atlas);scene.add(painted.root);const horse=createLightHorse(data,horseAtlas),paint=createModelPaint(renderer,horse,horsePaint);for(const part of horse.parts){part.material=paint.material;part.castShadow=part.receiveShadow=true;}horse.pose('neutral',45);horse.root.position.set(...STUDY_LAYOUT.horse);scene.add(horse.root);
 let a=GAME_CAMERA.azimuth,e=GAME_CAMERA.elevation;const focus=new THREE.Vector3(2,.9,1.25);let drawing=false;
 function render(){if(drawing)return;drawing=true;try{const w=host.clientWidth,mode=$('view').value,ppu=+$('scale').value,count=mode==='both'?2:1,stacked=w<760&&count===2;host.style.height=stacked?'880px':'490px';const h=host.clientHeight;renderer.setSize(w,h,false);renderer.setScissorTest(true);const labels=document.querySelector('.labels');labels.style.gridTemplateColumns=count===2?'1fr 1fr':'1fr';labels.innerHTML=mode==='both'?'<span>5ed8777 · PROTOTYPE</span><span>PAINTED COMPARISON</span>':`<span>${mode==='painted'?'PAINTED COMPARISON':'5ed8777 · PROTOTYPE'}</span>`;
  if(stacked){labels.style.gridTemplateColumns='1fr';labels.innerHTML='<span>TOP: PROTOTYPE · BELOW: PAINTED COMPARISON</span>';}
  for(let i=0;i<count;i++){const width=stacked?w:w/count,height=stacked?h/count:h,showPaint=mode==='painted'||mode==='both'&&i===1;prototype.visible=!showPaint;painted.root.visible=showPaint;camera.left=-width/ppu/2;camera.right=width/ppu/2;camera.top=height/ppu/2;camera.bottom=-height/ppu/2;camera.near=.1;camera.far=40;camera.position.copy(focus).add(new THREE.Vector3(Math.sin(a)*Math.cos(e),Math.sin(e),Math.cos(a)*Math.cos(e)).multiplyScalar(12));camera.lookAt(focus);camera.updateProjectionMatrix();const vx=stacked?0:i*width,vy=stacked?(count-1-i)*height:0;renderer.setViewport(vx,vy,width,height);renderer.setScissor(vx,vy,width,height);renderer.render(scene,camera);}
  renderer.setScissorTest(false);$('status').textContent=`${ppu} CSS px/world unit · Approved horse: ${data.triangles.toLocaleString()} triangles · Painted scenery: ${Math.round(painted.diagnostics().triangles).toLocaleString()} triangles`;}
 finally{drawing=false;}}
 for(const id of ['scale','view'])$(id).onchange=render;$('reset').onclick=()=>{a=GAME_CAMERA.azimuth;e=GAME_CAMERA.elevation;render();};$('wire').onchange=()=>{for(const m of [...painted.materials,...hybrid.materials.values()])m.wireframe=$('wire').checked;render();};
 let pointer=null;const canvas=renderer.domElement;canvas.onpointerdown=event=>{canvas.setPointerCapture(event.pointerId);pointer=[event.pointerId,event.clientX,event.clientY];};canvas.onpointermove=event=>{if(!pointer||pointer[0]!==event.pointerId)return;a-=(event.clientX-pointer[1])*.008;e=THREE.MathUtils.clamp(e+(event.clientY-pointer[2])*.006,.12,1.3);pointer=[event.pointerId,event.clientX,event.clientY];render();};canvas.onpointerup=canvas.onpointercancel=()=>pointer=null;
 const resize=new ResizeObserver(render);resize.observe(host);render();window.paintedStudy={ready:true,renderer,scene,horse,painted,prototype,render,view(azimuth,elevation){a=azimuth;e=elevation;render();},diagnostics:()=>({ppu:+$('scale').value,horseTriangles:data.triangles,...painted.diagnostics()})};
 window.addEventListener('pagehide',()=>{resize.disconnect();painted.dispose();paint.dispose();atlas.dispose();horseAtlas.dispose();hybrid.dispose();},{once:true});
}
start().catch(error=>{$('error').textContent='Could not load the comparison: '+error.message;console.error(error);});
