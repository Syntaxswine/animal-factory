// Four visual samples only. Their location/extents come from shared-world proxies.
import * as THREE from './vendor/three.module.js';
import {PROP_ART} from './prop-art.js';
import {GAME_CAMERA,DIMENSIONS} from './hybrid-world.js';
export const ROOM_PROP_SAMPLE=Object.freeze([
 {x:10,y:10,z:0,kind:'tree-broadleaf'},
 {x:9,y:8,z:0,kind:'barrel-single'},
 {x:8,y:9,z:0,kind:'crate-wood'},
 {x:3,y:5,z:0,kind:'medical-exam-table'},
]);
export function createRoomPropArt(roomArt){
 let treeMaterial=null,barrelMaterial=null;
 const textureCache=new Map(),loader=new THREE.TextureLoader(),ownedMaterials=[];
 const dark=new THREE.MeshStandardMaterial({color:0x414b42,roughness:.78}),linen=new THREE.MeshStandardMaterial({color:0xc7c6ac,roughness:1}),pillow=new THREE.MeshStandardMaterial({color:0xe0dfcb,roughness:1});ownedMaterials.push(dark,linen,pillow);
 function sample(prop,boxes){
  const group=new THREE.Group();group.userData.sharedMaterial=true;group.userData.prop=prop.kind;
  const add=(geometry,material,center)=>{const m=new THREE.Mesh(geometry,material);m.position.fromArray(center);m.castShadow=true;m.receiveShadow=true;m.userData.sharedMaterial=true;group.add(m);return m;};
  if(prop.kind==='tree-broadleaf'){
   const art=PROP_ART[prop.kind],crop=art.crop,source='../assets/environment/'+art.file;let texture=textureCache.get(source);
   if(!texture){texture=loader.load(source,t=>{t.offset.set(crop[0]/t.image.width,1-crop[3]/t.image.height);t.repeat.set((crop[2]-crop[0])/t.image.width,(crop[3]-crop[1])/t.image.height);});texture.colorSpace=THREE.SRGBColorSpace;texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;textureCache.set(source,texture);}
   const top=Math.max(...boxes.map(b=>b.max[1])),base=prop.z*DIMENSIONS.floorSpacing,height=(top-base)*Math.cos(GAME_CAMERA.elevation),width=height*(crop[2]-crop[0])/(crop[3]-crop[1]);
   if(!treeMaterial){treeMaterial=new THREE.MeshBasicMaterial({map:texture,alphaTest:.4,side:THREE.DoubleSide});ownedMaterials.push(treeMaterial);}const material=treeMaterial;
   const g=new THREE.PlaneGeometry(width,height);g.translate(0,height/2,0);const card=add(g,material,[prop.x,base,prop.y]);card.castShadow=false;card.userData.billboard=true;
   group.add(roomArt.contact(prop));
   // Conservative trunk/canopy proxies remain inspectable; alpha-card corners do not
   // become collision. This retains painted foliage rather than making a box tree.
  }else if(prop.kind==='barrel-single'){
   for(const box of boxes){if(box.id.includes(':drum:')){if(!barrelMaterial){barrelMaterial=roomArt.material('metal').clone();barrelMaterial.color.setHex(0x7a8063);ownedMaterials.push(barrelMaterial);}const material=barrelMaterial;add(new THREE.CylinderGeometry(box.size[0]/2,box.size[0]/2,box.size[1],32),material,box.center);}
    else {const radius=(box.size[0]-.025)/2,ring=add(new THREE.TorusGeometry(radius,.012,6,32),dark,box.center);ring.rotation.x=Math.PI/2;}}
  }else{
   for(const box of boxes){const mesh=box.material==='linen'?add(new THREE.BoxGeometry(box.size[0],box.size[1]*.6,box.size[2]),linen,[box.center[0],box.min[1]+box.size[1]*.3,box.center[2]]):roomArt.mesh(box);if(!mesh.parent)group.add(mesh);mesh.userData.sharedMaterial=true;if(box.material==='linen')add(new THREE.BoxGeometry(box.size[0]*.24,box.size[1]*.4,box.size[2]*.85),pillow,[box.min[0]+box.size[0]*.16,box.max[1]-box.size[1]*.2,box.center[2]]);}
  }
  return group;
 }
 return {sample,dispose(){for(const t of textureCache.values())t.dispose();for(const m of ownedMaterials)m.dispose();}};
}
