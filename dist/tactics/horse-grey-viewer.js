import * as THREE from './vendor/three.module.js';
import {GAME_CAMERA} from './hybrid-world.js';
import {unitArt} from './red-hats-art.js';
import {alphaBounds,rigidSpriteVertex} from './hybrid-sprites.js';
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
const art=unitArt({species:'horse',outfit:'normal',weapon:'rifle',stance:'standing'});
const texture=await new THREE.TextureLoader().loadAsync(art.src);texture.colorSpace=THREE.SRGBColorSpace;texture.magFilter=texture.minFilter=THREE.NearestFilter;texture.generateMipmaps=false;
const source=document.createElement('canvas');source.width=art.width;source.height=art.height;const ctx=source.getContext('2d',{willReadFrequently:true});ctx.drawImage(texture.image,0,0);const bounds=alphaBounds(ctx.getImageData(0,0,art.width,art.height).data,art.width,art.height);
const spriteMaterial=new THREE.MeshBasicMaterial({map:texture,alphaTest:.4,side:THREE.DoubleSide,toneMapped:false});
const sprite=new THREE.Mesh(new THREE.PlaneGeometry(1,1),spriteMaterial);scene.add(sprite);sprite.visible=false;
const pos=sprite.geometry.attributes.position,uv=sprite.geometry.attributes.uv;
for(let i=0;i<pos.count;i++)pos.setXYZ(i,...rigidSpriteVertex({heading:0},art,bounds,uv.getX(i)*art.width,(1-uv.getY(i))*art.height,GAME_CAMERA));
sprite.geometry.computeBoundingSphere();
document.getElementById('status').textContent=`Standing height 1.65 · one shared scale in all views · ${d.triangles.toLocaleString()} sculpt triangles · connected shirt, overalls and head surfaces. Working proportion baseline; localized form review.`;
const flat=new THREE.MeshBasicMaterial({color:0x111111}),cameras=[0,1,2].map(()=>new THREE.OrthographicCamera());
function render(){
 const width=host.clientWidth,height=host.clientHeight;renderer.setSize(width,height);renderer.setScissorTest(true);
 const gameplay=document.getElementById('view').value==='gameplay';
 const count=gameplay?2:3;
 const span=gameplay?height/58:Math.max(1.96,3.1*height/width),directions=[[4.015,.84,0],document.getElementById('view').value==='rear'?[-3.985,.84,0]:[.015,.84,4],[4.015,1.65,4]];
 for(let i=0;i<count;i++){const x=Math.round(i*width/count),right=Math.round((i+1)*width/count),w=right-x,c=cameras[i];c.left=-span*w/height/2;c.right=span*w/height/2;c.top=span/2;c.bottom=-span/2;c.near=.1;c.far=50;c.position.fromArray(directions[i]);if(gameplay){const {azimuth:a,elevation:e}=GAME_CAMERA;c.position.set(Math.sin(a)*Math.cos(e)*4,.84+Math.sin(e)*4,Math.cos(a)*Math.cos(e)*4);c.lookAt(0,.84,0);}else c.lookAt(.015,.84,0);
 horse.root.visible=!gameplay||i===1;sprite.visible=gameplay&&i===0;sprite.quaternion.copy(c.quaternion);floor.visible=!gameplay&&!document.getElementById('silhouette').checked;c.updateProjectionMatrix();renderer.setViewport(x,0,w,height);renderer.setScissor(x,0,w,height);renderer.render(scene,c);}
 horse.root.visible=true;sprite.visible=false;renderer.setScissorTest(false);
}
function update(){const gameplay=document.getElementById('view').value==='gameplay';host.style.cssText=gameplay?'flex:none;width:min(480px,100%);height:240px;min-height:240px;align-self:center':'';document.getElementById('views').innerHTML=gameplay?'<span>ORIGINAL SPRITE</span><span>GREY MODEL</span>':'<span>FRONT</span><span id="middle">SIDE</span><span>THREE-QUARTER</span>';document.getElementById('views').style.gridTemplateColumns=gameplay?'repeat(2,1fr)':'repeat(3,1fr)';document.getElementById('views').style.width=gameplay?'min(480px,100%)':'100%';document.getElementById('views').style.alignSelf='center';document.getElementById('comparison-note').hidden=!gameplay;const silhouette=document.getElementById('silhouette').checked;for(const p of horse.parts)p.material=silhouette?flat:horse.material;horse.material.wireframe=document.getElementById('wire').checked;spriteMaterial.color.setHex(silhouette?0x000000:0xffffff);floor.visible=!silhouette;if(!gameplay)document.getElementById('middle').textContent=document.getElementById('view').value==='rear'?'REAR':'SIDE';render();}
for(const id of ['view','wire','silhouette'])document.getElementById(id).addEventListener('change',update);
new ResizeObserver(render).observe(host);if(new URLSearchParams(location.search).get('view')==='gameplay')document.getElementById('view').value='gameplay';update();
window.greyHorseDiagnostics=()=>({...d,view:document.getElementById('view').value,material:horse.material.color.getHexString(),comparison:{pixelsPerUnit:host.clientHeight/(cameras[0].top-cameras[0].bottom),azimuth:GAME_CAMERA.azimuth,elevation:GAME_CAMERA.elevation,sprite:art.src,viewportHeight:host.clientHeight,span:cameras[0].top-cameras[0].bottom},render:{triangles:renderer.info.render.triangles,calls:renderer.info.render.calls}});
window.greyHorseReady=true;
