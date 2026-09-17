import * as THREE from './vendor/three.module.js';
import {parseMap} from './maps.js';
import {createWorldModel,DIMENSIONS,GAME_CAMERA,toWorld} from './hybrid-world.js';
import {unitArt} from './red-hats-art.js';
const $=id=>document.getElementById(id),host=$('scene');
const source=await (await fetch('./fixtures/hybrid-room.json')).text();
const model=createWorldModel(parseMap(source)),original=model.map;
const renderer=new THREE.WebGLRenderer({antialias:false});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0x172520);renderer.outputColorSpace=THREE.SRGBColorSpace;host.prepend(renderer.domElement);
const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(),focus=new THREE.Vector3(5,1,5);
scene.add(new THREE.HemisphereLight(0xfff3d8,0x52634d,2));const sun=new THREE.DirectionalLight(0xffe2ac,2);sun.position.set(-4,9,5);scene.add(sun);
let azimuth=GAME_CAMERA.azimuth,elevation=GAME_CAMERA.elevation,zoom=1;
function resize(){const w=host.clientWidth,h=host.clientHeight,span=12/zoom;renderer.setSize(w,h);camera.left=-span*w/h/2;camera.right=span*w/h/2;camera.top=span/2;camera.bottom=-span/2;camera.near=.1;camera.far=100;camera.position.copy(focus).add(new THREE.Vector3(Math.sin(azimuth)*Math.cos(elevation),Math.sin(elevation),Math.cos(azimuth)*Math.cos(elevation)).multiplyScalar(30));camera.lookAt(focus);camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(host);
const structures=new THREE.Group(),bounds=new THREE.Group();scene.add(structures,bounds);
const colors={wall:0xb1a68a,floor:0x6b7963,roof:0x697b79,cover:0x997c52};
function clear(group){for(const c of [...group.children]){group.remove(c);c.geometry?.dispose();c.material?.dispose();}}
let traceLine=null,lastHit=null;
function rebuild(){clear(structures);clear(bounds);if(traceLine){scene.remove(traceLine);traceLine.geometry.dispose();traceLine.material.dispose();traceLine=null;}lastHit=null;
 for(const b of model.geometry.boxes){const g=new THREE.BoxGeometry(...b.size),material=new THREE.MeshStandardMaterial({color:b.id.endsWith(':door')?0x805f39:colors[b.kind],roughness:1});
  const mesh=new THREE.Mesh(g,material);mesh.position.fromArray(b.center);mesh.userData.id=b.id;structures.add(mesh);
  const wire=new THREE.LineSegments(new THREE.EdgesGeometry(g),new THREE.LineBasicMaterial({color:0xf0c879,depthTest:false,transparent:true,opacity:.5}));wire.position.copy(mesh.position);bounds.add(wire);
 }
 bounds.visible=$('bounds').checked;$('result').textContent='Geometry updated. Choose a path to inspect.';
 $('status').textContent=`${model.geometry.boxes.length} shared boxes · revision ${model.revision}\n`+(model.geometry.diagnostics.map(d=>`${d.source}: ${d.message}`).join('\n')||'All fixture content supported.');
}
const loader=new THREE.TextureLoader(),actors=[];
for(const [index,p]of original.starts.slice(0,2).entries()){
 const unit={...p,species:index?'cow':'horse',outfit:index?'red-hats':'normal',weapon:'rifle',stance:'standing'},art=unitArt(unit),texture=loader.load(art.src,undefined,()=>{$('status').textContent='Failed to load '+art.src;});texture.colorSpace=THREE.SRGBColorSpace;texture.magFilter=THREE.NearestFilter;texture.minFilter=THREE.NearestFilter;texture.generateMipmaps=false;
 const scale=DIMENSIONS.standing/art.contentHeight,geometry=new THREE.PlaneGeometry(art.width*scale,art.height*scale);
 // Translate the art's foot anchor to the geometry origin before billboarding.
 geometry.translate((art.width/2-art.anchor[0])*scale,(art.anchor[1]-art.height/2)*scale,0);
 const mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({map:texture,alphaTest:.4,side:THREE.DoubleSide}));mesh.position.fromArray(toWorld(unit));scene.add(mesh);actors.push(mesh);
}
const paths={door:[[5,1.2,9],[5,1.2,5]],window:[[7,1.2,9],[7,1.2,5]],wall:[[6,1.2,9],[6,1.2,5]],roof:[[3,4,3],[3,.5,3]]};
function fire(){if(traceLine){scene.remove(traceLine);traceLine.geometry.dispose();traceLine.material.dispose();}const [start,end]=paths[$('path').value];lastHit=model.trace(start,end);
 traceLine=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...start),new THREE.Vector3(...(lastHit?.point||end))]),new THREE.LineBasicMaterial({color:lastHit?0xf0a05f:0x91d7b1,depthTest:false}));scene.add(traceLine);
 $('result').textContent=lastHit?`BLOCKED · ${lastHit.id} · ${lastHit.distance.toFixed(2)} tiles`:'CLEAR · no structural intersection';
}
 $('fire').onclick=fire;$('door').onchange=()=>{model.update(m=>m.edges['s:5:7']=$('door').checked?'door-wood-closed':'doorway-concrete-open');rebuild();};
 $('roof').onchange=()=>{model.update(m=>{m.upper=$('roof').checked?structuredClone(original.upper):[{},{}];m.props=$('roof').checked?structuredClone(original.props):original.props.filter(p=>!p.kind.startsWith('roof'));});rebuild();};
 $('bounds').onchange=()=>bounds.visible=$('bounds').checked;
 $('reset').onclick=()=>{azimuth=GAME_CAMERA.azimuth;elevation=GAME_CAMERA.elevation;zoom=1;resize();};
 let drag=null;renderer.domElement.onpointerdown=e=>{if(!$('orbit').checked)return;drag=[e.clientX,e.clientY];renderer.domElement.setPointerCapture(e.pointerId);};renderer.domElement.onpointermove=e=>{if(!drag)return;azimuth-=(e.clientX-drag[0])*.007;elevation=THREE.MathUtils.clamp(elevation+(e.clientY-drag[1])*.005,.15,1.25);drag=[e.clientX,e.clientY];resize();};renderer.domElement.onpointerup=renderer.domElement.onpointercancel=()=>drag=null;
 renderer.domElement.addEventListener('wheel',e=>{e.preventDefault();zoom=THREE.MathUtils.clamp(zoom*Math.exp(-e.deltaY*.001),.6,2.5);resize();},{passive:false});
 // Read-only diagnostics for repeatable browser acceptance; no alternate action API.
 window.hybridDiagnostics=()=>({revision:model.revision,map:JSON.parse(model.serialize()),ids:structures.children.map(m=>m.userData.id),lastHit,camera:{azimuth,elevation,zoom},boxes:model.geometry.boxes.length});
 rebuild();resize();renderer.setAnimationLoop(()=>{for(const actor of actors)actor.quaternion.copy(camera.quaternion);renderer.render(scene,camera);});
