import * as THREE from './vendor/three.module.js';
import {parseMap} from './maps.js';
import {createWorldModel,DIMENSIONS,GAME_CAMERA,toWorld,projectWorld} from './hybrid-world.js';
import {unitArt} from './red-hats-art.js';
import {replayHybrid} from './hybrid-replay.js';
import {surfaceUV,surfacePixels,materialKind,materialGallery} from './hybrid-materials.js';
import {bodyRegions,muzzlePoint} from './hybrid-combat.js';
import {ROOM_PROP_SAMPLE,createRoomPropArt} from './hybrid-room-props.js';
import {createRoomArt} from './hybrid-room-art.js';
import {alphaBounds,spriteVertex,rigidSpriteVertex,weaponLandmarks} from './hybrid-sprites.js';
const $=id=>document.getElementById(id),host=$('scene');
const artPreview=new URLSearchParams(location.search).get('visual')==='room';
const source=await (await fetch('./fixtures/hybrid-room.json')).text();
const sampleProps=new URLSearchParams(location.search).get('props')==='sample',sourceMap=parseMap(source);if(sampleProps)sourceMap.props.push(...structuredClone(ROOM_PROP_SAMPLE));
const model=createWorldModel(sourceMap),original=model.map;
const renderer=new THREE.WebGLRenderer({antialias:false});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0x172520);renderer.outputColorSpace=THREE.SRGBColorSpace;host.prepend(renderer.domElement);
const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(),focus=new THREE.Vector3(5,1,5);
scene.add(new THREE.HemisphereLight(0xfff3d8,0x52634d,2));const sun=new THREE.DirectionalLight(0xffe2ac,2);sun.position.set(-4,9,5);scene.add(sun);
let azimuth=GAME_CAMERA.azimuth,elevation=GAME_CAMERA.elevation,zoom=1;
function resize(){const w=host.clientWidth,h=host.clientHeight,span=12/zoom;renderer.setSize(w,h);camera.left=-span*w/h/2;camera.right=span*w/h/2;camera.top=span/2;camera.bottom=-span/2;camera.near=.1;camera.far=100;camera.position.copy(focus).add(new THREE.Vector3(Math.sin(azimuth)*Math.cos(elevation),Math.sin(elevation),Math.cos(azimuth)*Math.cos(elevation)).multiplyScalar(30));camera.lookAt(focus);camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(host);
const structures=new THREE.Group(),bounds=new THREE.Group();scene.add(structures,bounds);
const colors={wall:0xb1a68a,floor:0x6b7963,roof:0x697b79,cover:0x997c52};
const roomArt=artPreview?createRoomArt(renderer):null,propArt=roomArt&&sampleProps?createRoomPropArt(roomArt):null;
if(artPreview){renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-14,right:14,top:14,bottom:-14,near:.1,far:40});sun.position.set(-4,15,10);sun.target.position.set(5,0,5);scene.add(sun.target);sun.shadow.bias=-.001;sun.shadow.normalBias=.04;const control=document.createElement('label');control.innerHTML='<input id="room-shadows" type="checkbox" checked> Architectural shadows';$('bounds').closest('label').before(control);$('room-shadows').onchange=()=>{sun.castShadow=renderer.shadowMap.enabled=$('room-shadows').checked;scene.traverse(o=>{for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[])m.needsUpdate=true;});};document.querySelector('header small').textContent='Visual revision · painted surfaces · rigid artwork · prototype proportions';}
const surfaceTextures=new Map();
function surfaceTexture(kind){if(!surfaceTextures.has(kind)){const p=surfacePixels(kind),t=new THREE.DataTexture(p.data,p.width,p.height);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.NearestFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.anisotropy=renderer.capabilities.getMaxAnisotropy();t.needsUpdate=true;surfaceTextures.set(kind,t);}return surfaceTextures.get(kind);}
function clear(group){for(const c of [...group.children]){group.remove(c);c.traverse(o=>{o.geometry?.dispose();if(!o.userData.sharedMaterial)o.material?.dispose();});}}
let traceLine=null,lastHit=null;
function rebuild(){clear(structures);clear(bounds);if(traceLine){scene.remove(traceLine);traceLine.geometry.dispose();traceLine.material.dispose();traceLine=null;}lastHit=null;
 const slabs=new Set(model.geometry.boxes.filter(b=>b.id.startsWith('floor:')).map(b=>[b.source.x,b.source.y,b.source.z||0].join(',')));
 const sampleIds=new Set(propArt?ROOM_PROP_SAMPLE.map(p=>`prop:${p.x},${p.y},${p.z}:${p.kind}`):[]);
 for(const b of model.geometry.boxes){const g=new THREE.BoxGeometry(...b.size),material=new THREE.MeshStandardMaterial({map:surfaceTexture(materialKind(b)),roughness:1});
  const positions=g.attributes.position,normals=g.attributes.normal,uv=g.attributes.uv;
  for(let i=0;i<positions.count;i++){const p=[positions.getX(i)+b.center[0],positions.getY(i)+b.center[1],positions.getZ(i)+b.center[2]],n=[normals.getX(i),normals.getY(i),normals.getZ(i)],mapped=surfaceUV(p,n);uv.setXY(i,...mapped);}uv.needsUpdate=true;
  const mesh=roomArt?roomArt.mesh(b,slabs):new THREE.Mesh(g,material);if(roomArt){g.dispose();material.dispose();}mesh.position.fromArray(b.center);mesh.userData={id:b.id,kind:b.kind,level:b.source?.z||0,sharedMaterial:artPreview};if(!sampleIds.has(b.source.prop))structures.add(mesh);else mesh.geometry.dispose();
  const wire=new THREE.LineSegments(new THREE.EdgesGeometry(g),new THREE.LineBasicMaterial({color:0xf0c879,depthTest:false,transparent:true,opacity:.5}));wire.position.copy(mesh.position);bounds.add(wire);
 }
 if(propArt)for(const p of ROOM_PROP_SAMPLE){const id=`prop:${p.x},${p.y},${p.z}:${p.kind}`,boxes=model.geometry.boxes.filter(b=>b.source.prop===id);if(boxes.length){const group=propArt.sample(p,boxes);group.userData.id=id;structures.add(group);}}
 bounds.visible=$('bounds').checked;$('result').textContent='Geometry updated. Choose a path to inspect.';
 $('status').textContent=`${model.geometry.boxes.length} shared boxes · revision ${model.revision}\n`+(model.geometry.diagnostics.map(d=>`${d.source}: ${d.message}`).join('\n')||'All fixture content supported.');
}
const contacts=new THREE.Group();scene.add(contacts);
const loader=new THREE.TextureLoader(),actors=[],textures=new Map(),bodyBounds=new THREE.Group();scene.add(bodyBounds);
function addActor(unit){
 if(roomArt)contacts.add(roomArt.contact(unit));
 const art=unitArt(unit);let texture=textures.get(art.src);if(!texture){texture=loader.load(art.src,t=>{const canvas=document.createElement('canvas');canvas.width=t.image.width;canvas.height=t.image.height;const context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(t.image,0,0);const pixels=context.getImageData(0,0,canvas.width,canvas.height).data;t.userData.bounds=alphaBounds(pixels,canvas.width,canvas.height);t.userData.weaponLandmarks=weaponLandmarks(pixels,canvas.width,canvas.height,t.userData.bounds,art.anchor[0]);},()=>{},()=>{$('status').textContent='Failed to load '+art.src;});texture.colorSpace=THREE.SRGBColorSpace;texture.magFilter=THREE.NearestFilter;texture.minFilter=THREE.NearestFilter;texture.generateMipmaps=false;textures.set(art.src,texture);}
 const scale=DIMENSIONS.standing/236,geometry=new THREE.PlaneGeometry(art.width*scale,art.height*scale,32,32);
 // Translate the art's foot anchor to the geometry origin before billboarding.
 geometry.translate((art.width/2-art.anchor[0])*scale,(art.anchor[1]-art.height/2)*scale,0);
 const mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({map:texture,alphaTest:.4,side:THREE.DoubleSide}));mesh.position.fromArray(toWorld(unit));mesh.userData={unit:{...unit,hp:unit.hp??100},art};scene.add(mesh);actors.push(mesh);
 const body=bodyRegions({geometryMode:'hybrid'},mesh.userData.unit),group=new THREE.Group();group.position.fromArray(body.origin);group.rotation.y=-body.heading;
 for(const region of body.regions){const g=new THREE.BoxGeometry(...region.size),color={head:0xffbb77,torso:0x78d2b2,legs:0x80b4ef,weapon:0xffe287}[region.zone],wire=new THREE.LineSegments(new THREE.EdgesGeometry(g),new THREE.LineBasicMaterial({color,depthTest:false,transparent:true,opacity:.85}));g.dispose();wire.position.fromArray(region.center);group.add(wire);const marker=new THREE.Mesh(new THREE.SphereGeometry(.035,8,6),new THREE.MeshBasicMaterial({color,depthTest:false}));marker.position.fromArray(region.center);group.add(marker);}
 const anchor=new THREE.Mesh(new THREE.SphereGeometry(.045,8,6),new THREE.MeshBasicMaterial({color:0xffffff,depthTest:false}));group.add(anchor);
 const muzzle=muzzlePoint({geometryMode:'hybrid'},mesh.userData.unit),tip=new THREE.Mesh(new THREE.SphereGeometry(.045,8,6),new THREE.MeshBasicMaterial({color:0xff66dd,depthTest:false}));tip.position.set(body.regions.find(r=>r.zone==='weapon').max[0],muzzle.h-body.origin[1],0);group.add(tip);bodyBounds.add(group);
}
for(const [index,p]of original.starts.slice(0,2).entries())addActor({...p,species:index?'cow':'horse',outfit:index?'red-hats':'normal',weapon:'rifle',stance:'standing'});
let replayResult=null;
$('replay').onclick=()=>{replayResult=replayHybrid(original,s=>{
 model.update(m=>{m.terrain=structuredClone(s.map);m.upper=structuredClone(s.upper);m.edges={...s.edges};m.props=structuredClone(s.props);});rebuild();
 resetActors();
 for(const unit of s.units)if(!unit.away&&unit.hp>0)addActor(unit);
 for(const actor of actors)actor.quaternion.copy(camera.quaternion);renderer.render(scene,camera);
 });$('door').checked=false;$('result').textContent=`Engine replay: ${replayResult.events.filter(e=>e.ok).length}/${replayResult.events.length} actions completed`;};
const paths={door:[[5,1.2,9],[5,1.2,5]],window:[[7,1.2,9],[7,1.2,5]],wall:[[6,1.2,9],[6,1.2,5]],roof:[[3,4,3],[3,.5,3]]};
function fire(){if(traceLine){scene.remove(traceLine);traceLine.geometry.dispose();traceLine.material.dispose();}const [start,end]=paths[$('path').value];lastHit=model.trace(start,end);
 traceLine=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...start),new THREE.Vector3(...(lastHit?.point||end))]),new THREE.LineBasicMaterial({color:lastHit?0xf0a05f:0x91d7b1,depthTest:false}));scene.add(traceLine);
 $('result').textContent=lastHit?`BLOCKED · ${lastHit.id} · ${lastHit.distance.toFixed(2)} tiles`:'CLEAR · no structural intersection';
}
 $('fire').onclick=fire;$('door').onchange=()=>{model.update(m=>m.edges['s:5:7']=$('door').checked?'door-wood-closed':'doorway-concrete-open');rebuild();};
 $('roof').onchange=()=>{model.update(m=>{m.upper=$('roof').checked?structuredClone(original.upper):[{},{}];m.props=$('roof').checked?structuredClone(original.props):original.props.filter(p=>!p.kind.startsWith('roof'));});rebuild();};
 $('bounds').onchange=()=>{bounds.visible=$('bounds').checked;bodyBounds.visible=$('bounds').checked;};
 $('reset').onclick=()=>{azimuth=GAME_CAMERA.azimuth;elevation=GAME_CAMERA.elevation;zoom=1;focus.set(5,1,5);resize();};
 $('gallery').onchange=()=>{model.update(m=>Object.assign(m,$('gallery').checked?materialGallery(original):structuredClone(original)));focus.set($('gallery').checked?8:5,1,5);zoom=$('gallery').checked?.8:1;rebuild();resize();};
 $('cutaway').onchange=()=>{for(const mesh of structures.children)mesh.visible=!$('cutaway').checked||mesh.userData.kind==='stairs'||mesh.userData.kind!=='wall'&&!mesh.userData.level;focus.set(4,1,4);zoom=2;resize();};
 let drag=null;renderer.domElement.onpointerdown=e=>{if(!$('orbit').checked)return;drag=[e.clientX,e.clientY];renderer.domElement.setPointerCapture(e.pointerId);};renderer.domElement.onpointermove=e=>{if(!drag)return;azimuth-=(e.clientX-drag[0])*.007;elevation=THREE.MathUtils.clamp(elevation+(e.clientY-drag[1])*.005,.15,1.25);drag=[e.clientX,e.clientY];resize();};renderer.domElement.onpointerup=renderer.domElement.onpointercancel=()=>drag=null;
 renderer.domElement.addEventListener('wheel',e=>{e.preventDefault();zoom=THREE.MathUtils.clamp(zoom*Math.exp(-e.deltaY*.001),.3,2.5);resize();},{passive:false});
 // Read-only diagnostics for repeatable browser acceptance; no alternate action API.
 function muzzleMeshError(actor){const {unit,muzzleVertex}=actor.userData,landmark=actor.material.map.userData.weaponLandmarks;if(!landmark||muzzleVertex===undefined)return null;const p=actor.geometry.attributes.position,actual=[p.getX(muzzleVertex),p.getY(muzzleVertex)];
  const tip=muzzlePoint({geometryMode:'hybrid'},unit),expected=projectWorld([tip.x-unit.x,tip.h-(unit.z||0)*DIMENSIONS.floorSpacing,tip.y-unit.y],{azimuth,elevation});return Math.hypot(actual[0]-expected[0],actual[1]-expected[1]);
 }
 function spriteFrames(){return actors.map(a=>{a.geometry.computeBoundingBox();const b=a.geometry.boundingBox,points=[];for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])points.push(new THREE.Vector3(x,y,0).applyMatrix4(a.matrixWorld).project(camera));const xs=points.map(p=>(p.x+1)*host.clientWidth/2),ys=points.map(p=>(1-p.y)*host.clientHeight/2);return {src:a.userData.art.src,width:a.userData.art.width,height:a.userData.art.height,x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)};});}
window.hybridDiagnostics=()=>{const points=[[-.5,0,-.5],[.5,0,-.5],[.5,0,.5],[-.5,0,.5]].map(p=>new THREE.Vector3(...p).project(camera));return {revision:model.revision,map:JSON.parse(model.serialize()),ids:structures.children.map(m=>m.userData.id),lastHit,camera:{azimuth,elevation,zoom},projectionRatio:(Math.max(...points.map(p=>p.x))-Math.min(...points.map(p=>p.x)))*host.clientWidth/((Math.max(...points.map(p=>p.y))-Math.min(...points.map(p=>p.y)))*host.clientHeight),boxes:model.geometry.boxes.length,replayResult,spriteFrames:spriteFrames(),renderStats:{calls:renderer.info.render.calls,textures:renderer.info.memory.textures,geometries:renderer.info.memory.geometries},presentation:artPreview?'rigid-art-preview':'calibrated',muzzleErrors:actors.map(muzzleMeshError)};};
 function resetActors(){clear(contacts);for(const actor of actors){scene.remove(actor);actor.geometry.dispose();actor.material.dispose();}actors.length=0;for(const group of [...bodyBounds.children]){clear(group);bodyBounds.remove(group);}}
 function calibration(){resetActors();const stance=$('stance').value,heading=Number($('heading').value),species=$('species').value;
  addActor({x:5,y:9,z:0,species,weapon:'rifle',stance,heading,outfit:'normal'});addActor({x:7,y:9,z:0,species,weapon:'rifle',stance,heading,outfit:'red-hats'});bodyBounds.visible=$('bounds').checked;focus.set(6,.6,9);zoom=2;resize();
 }
 for(const id of ['stance','heading','species'])$(id).onchange=calibration;
 $('occlusion').onchange=()=>{const mode=$('occlusion').value;if(mode==='none'){model.update(m=>Object.assign(m,structuredClone(original)));rebuild();calibration();return;}
  model.update(m=>{Object.assign(m,structuredClone(original));if(mode==='roof')for(let y=2;y<8;y++)for(let x=2;x<9;x++)m.upper[0][`${x},${y}`]='floor';});rebuild();resetActors();addActor({x:6,y:mode==='roof'?4:7,z:0,species:'horse',weapon:'rifle',stance:'standing',heading:0});focus.set(6,1,5);zoom=1.4;resize();
 };
 rebuild();resize();bodyBounds.visible=false;renderer.setAnimationLoop(()=>{for(const actor of actors){actor.quaternion.copy(camera.quaternion);const {unit}=actor.userData,art={...actor.userData.art,weaponLandmarks:actor.material.map.userData.weaponLandmarks},b=actor.material.map.userData.bounds||{left:0,right:art.width,top:art.height-art.contentHeight,bottom:art.height},signature=JSON.stringify([b,azimuth,elevation,unit.stance,unit.heading]);if(signature===actor.userData.signature)continue;actor.userData.signature=signature;const p=actor.geometry.attributes.position,uv=actor.geometry.attributes.uv;if(art.weaponLandmarks){const [mx,my]=art.weaponLandmarks.muzzle,ux=mx/art.width,uy=1-my/art.height,column=Math.max(1,Math.min(31,Math.round(ux*32))),row=Math.max(1,Math.min(31,Math.round((1-uy)*32)));for(let j=0;j<=32;j++){uv.setX(j*33+column,ux);uv.setY(row*33+j,uy);}actor.userData.muzzleVertex=row*33+column;uv.needsUpdate=true;}for(let i=0;i<p.count;i++)p.setXYZ(i,...(artPreview?rigidSpriteVertex:spriteVertex)(unit,art,b,uv.getX(i)*art.width,(1-uv.getY(i))*art.height,{azimuth,elevation}));p.needsUpdate=true;actor.geometry.computeBoundingSphere();}structures.traverse(o=>{if(o.userData.billboard)o.quaternion.copy(camera.quaternion);});renderer.render(scene,camera);});


