// Late-90s-style comparison asset: rigid-joint low-poly parts, one painted atlas.
// This is a pose-study rig, not a production animation/skeletal-skin pipeline.
import * as THREE from './vendor/three.module.js';
import {DIMENSIONS} from './hybrid-world.js';
export const HORSE_ATLAS='../assets/characters/lowpoly-proof/horse-worker-atlas-v1.png';
const V=p=>new THREE.Vector3(...p),Y=new THREE.Vector3(0,1,0);
export function solveLimb(a,b,upper,lower,bend){
 const start=V(a),end=V(b),axis=end.clone().sub(start),distance=axis.length();axis.normalize();
 if(distance>upper+lower+1e-7||distance<Math.abs(upper-lower)-1e-7)throw Error('Unreachable comparison-rig grip/contact');
 const along=(upper*upper-lower*lower+distance*distance)/(2*distance),height=Math.sqrt(Math.max(0,upper*upper-along*along));
 const normal=V(bend).addScaledVector(axis,-V(bend).dot(axis)).normalize();
 return start.addScaledVector(axis,along).addScaledVector(normal,height).toArray();
}
function atlasUV(geometry,panel){const uv=geometry.attributes.uv,colors=[];for(let i=0;i<uv.count;i++){uv.setXY(i,(panel%4+.025+uv.getX(i)*.95)/4,1-(Math.floor(panel/4)+.025+(1-uv.getY(i))*.95)/4);const value=[0,13].includes(panel)?1.5:panel===1?1.3:[3,4,5].includes(panel)?1.65:[2,15].includes(panel)?1.25:1;colors.push(value,value,value);}geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));return geometry;}
function loft(rings,panel){const pos=[],uv=[],indices=[],n=12;
 for(let i=0;i<rings.length;i++){const [x,y,ry,rz]=rings[i];for(let j=0;j<n;j++){const a=j/n*Math.PI*2;pos.push(x,y+Math.cos(a)*ry,Math.sin(a)*rz);uv.push(j/(n-1),i/(rings.length-1));}}
 for(let i=0;i<rings.length-1;i++)for(let j=0;j<n;j++){const a=i*n+j,b=i*n+(j+1)%n,c=(i+1)*n+j,d=(i+1)*n+(j+1)%n;indices.push(a,b,c,b,d,c);}
 for(const k of [0,rings.length-1])for(let j=1;j<n-1;j++)indices.push(k*n,k*n+(k===0?j+1:j),k*n+(k===0?j:j+1));
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return atlasUV(g,panel);
}
export function createHorseModel(texture=null){
 const root=new THREE.Group(),body=new THREE.Group(),rifle=new THREE.Group();root.name='Horse worker comparison';root.add(body,rifle);
 const material=new THREE.MeshStandardMaterial({map:texture,color:0xffffff,vertexColors:true,roughness:1,metalness:0,flatShading:false,side:THREE.DoubleSide});
 const dark=new THREE.MeshStandardMaterial({color:0x16120f,roughness:1}),white=new THREE.MeshBasicMaterial({color:0xd9c7a0});
 const bones={},parts=[],hands=[],grips=[],contacts=[];
 function add(g,parent=body,mat=material,name=''){const mesh=new THREE.Mesh(g,mat);mesh.name=name;mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);parts.push(mesh);return mesh;}
 function ellipsoid(size,panel,parent=body,name=''){const g=atlasUV(new THREE.SphereGeometry(1,12,8),panel);g.scale(...size);return add(g,parent,material,name);}
 function box(size,panel,parent=body,name=''){return add(atlasUV(new THREE.BoxGeometry(...size),panel),parent,material,name);}
 function segment(name,r1,r2,panel){const bone=new THREE.Bone();bone.name=name;body.add(bone);bones[name]=bone;const mesh=add(atlasUV(new THREE.CylinderGeometry(r2,r1,1,12,2),panel),bone,material,name);return {bone,mesh};}
 function placeSegment(segment,a,b){const delta=V(b).sub(V(a));segment.bone.position.copy(V(a).add(V(b)).multiplyScalar(.5));segment.bone.quaternion.setFromUnitVectors(Y,delta.clone().normalize());segment.mesh.scale.y=delta.length();}
 const torso=segment('spine',.205,.240,3);torso.mesh.scale.x=.80;
 const pelvis=ellipsoid([.17,.15,.205],3,body,'pelvis');
 function clothingPatch(front,panel){const p=[],uv=[],ix=[];for(const [row,y]of [-.16,.15].entries())for(let j=0;j<5;j++){const z=(j/4-.5)*.34,r=.205+.035*(y/.50+.5),x=Math.sqrt(Math.max(0,r*r-z*z))*.80+.006;p.push(front*x,y,z);uv.push(j/4,row);}for(let j=0;j<4;j++)ix.push(j,j+1,j+5,j+1,j+6,j+5);const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return add(atlasUV(g,panel),torso.bone,material,front===1?'overall bib':'overall back');}
 clothingPatch(1,4);clothingPatch(-1,5);
 const scarf=ellipsoid([.13,.045,.15],10,body,'neckerchief');
 const neck=segment('neck',.115,.105,0);neck.mesh.scale.z=.94;
 const head=new THREE.Bone();head.name='head';body.add(head);bones.head=head;
 add(loft([[-.105,.145,.090,.085],[-.055,.145,.110,.110],[0,.145,.115,.115],[.07,.126,.100,.103],[.145,.087,.078,.087],[.215,.052,.060,.085],[.265,.045,.053,.081],[.285,.045,.042,.071]],0),head,material,'horse skull and muzzle');
 const cheek=ellipsoid([.095,.100,.112],0,head,'horse cheek');cheek.position.set(-.005,.125,0);
 const nose=ellipsoid([.048,.049,.086],1,head,'soft muzzle');nose.position.set(.264,.046,0);
 for(const side of [-1,1]){
  const eye=add(new THREE.SphereGeometry(1,6,4),head,dark,'eye');eye.scale.set(.025,.017,.012);eye.position.set(.067,.178,side*.108);
  const shine=add(new THREE.SphereGeometry(.004,4,3),head,white);shine.position.set(.075,.183,side*.119);
  const nostril=add(new THREE.SphereGeometry(1,6,4),head,dark,'nostril');nostril.scale.set(.019,.010,.008);nostril.position.set(.270,.060,side*.077);
 }
 const blaze=new THREE.BufferGeometry();blaze.setAttribute('position',new THREE.Float32BufferAttribute([.006,.263,-.022,.006,.263,.022,.13,.181,-.018,.13,.181,.018,.244,.104,-.010,.244,.104,.010],3));blaze.setAttribute('uv',new THREE.Float32BufferAttribute([0,1,1,1,0,.5,1,.5,0,0,1,0],2));blaze.setIndex([0,2,1,1,2,3,2,4,3,3,4,5]);blaze.computeVertexNormals();add(atlasUV(blaze,12),head,material,'forehead blaze');
 const ears=[];for(const side of [-1,1]){const ear=new THREE.Bone();ear.position.set(-.026,.245,side*.059);head.add(ear);const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([-.02,0,-.025,.02,0,-.025,0,.105,0,-.02,0,.025,.02,0,.025],3));g.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,.5,1,0,0,1,0],2));g.setIndex([0,1,2,1,4,2,4,3,2,3,0,2,0,3,1,1,3,4]);g.computeVertexNormals();add(atlasUV(g,11),ear,material,'ear');ears.push(ear);}
 const mane=segment('mane',.045,.035,6);mane.mesh.scale.z=.85;
 const tail=segment('tail',.035,.018,6);
 const limbs=[];
 // Rounded sleeve caps and curled glove knuckles spend polygons on silhouette.

 for(const side of [-1,1]){
  const thigh=segment('thigh'+side,.105,.085,3),shin=segment('shin'+side,.079,.064,3),boot=add(loft([[-.115,0,.06,.058],[-.045,0,.06,.07],[.075,-.018,.042,.070],[.115,-.027,.030,.054]],7),body,material,'boot'+side);
  const sole=add(loft([[-.117,-.049,.011,.058],[.075,-.049,.011,.071],[.117,-.049,.009,.054]],14),boot,material,'sole'+side);
  const upper=segment('upper arm'+side,.095,.068,2),cuff=segment('rolled cuff'+side,.078,.080,15),forearm=segment('forearm'+side,.062,.043,13),hand=ellipsoid([.065,.044,.042],7,body,'glove'+side);
  const elbow=ellipsoid([.065,.065,.065],13,body,'elbow'+side),knee=ellipsoid([.085,.09117509,.085],3,body,'knee'+side);
  const shoulderCap=ellipsoid([.090,.068,.098],2,body,'shoulder sleeve'+side);
  for(let finger=0;finger<3;finger++){const knuckle=ellipsoid([.017,.027,.023],7,hand,'curled glove finger');knuckle.position.set((finger-1)*.030,.022,.022);}
  const thumb=ellipsoid([.031,.017,.021],7,hand,'glove thumb');thumb.position.set(.023,.025,-.029);thumb.rotation.y=-.4;
  limbs.push({side,thigh,shin,boot,upper,cuff,forearm,hand,elbow,knee,shoulderCap});hands.push(hand);contacts.push(boot);
 }
 const stock=add(loft([[-.12,-.036,.052,.028],[-.095,-.036,.052,.029],[-.025,-.026,.040,.026],[.025,-.017,.025,.025]],8),rifle,material,'rifle stock');
 const receiver=box([.24,.06,.045],9,rifle,'receiver');receiver.position.set(.12,0,0);
 const foreend=box([.20,.055,.05],8,rifle,'foreend');foreend.position.set(.29,-.022,0);
 const barrelGeometry=atlasUV(new THREE.CylinderGeometry(.014,.018,.40,8,1,false),9);barrelGeometry.rotateZ(-Math.PI/2);barrelGeometry.translate(.37,0,0);
 const barrel=add(barrelGeometry,rifle,material,'barrel');
 // The cap-center vertex is actual barrel geometry, not a muzzle marker.
 const bp=barrel.geometry.attributes.position;let tipIndex=-1,rearIndex=-1;
 for(let i=0;i<bp.count;i++){if(Math.abs(bp.getY(i))<1e-7&&Math.abs(bp.getZ(i))<1e-7){if(bp.getX(i)>.56)tipIndex=i;if(bp.getX(i)<.18)rearIndex=i;}}
 const opening=add(new THREE.CircleGeometry(.0105,8),rifle,dark,'muzzle bore');opening.rotation.y=Math.PI/2;opening.position.set(.57001,0,0);
 const sight=box([.013,.024,.012],9,rifle,'front sight');sight.position.set(.54,.019,0);
 const guard=add(atlasUV(new THREE.TorusGeometry(.031,.006,4,8),9),rifle,material,'trigger guard');guard.position.set(.09,-.05,0);
 for(const x of [.13,.31]){const grip=new THREE.Object3D();grip.position.set(x,-.047,0);rifle.add(grip);grips.push(grip);}
 function pose(stance='standing',heading=0,position=[0,0,0],motion={}){
  const prone=stance==='prone',k=motion.kneel??(stance==='kneeling'?1:0),mix=(a,b)=>V(a).lerp(V(b),k).toArray(),offset=prone?-.04:-.17,recoil=motion.recoil||0;
  root.position.fromArray(position);root.rotation.y=-heading*Math.PI/180;
  const hip=prone?[-.22,.18,offset]:mix([-.03,.72,offset],[-.06,.43,offset]),shoulder=prone?[.22,.27,offset]:mix([0,1.235,offset],[.035,.93,offset]);
  hip[1]-=motion.bob||0;shoulder[1]-=motion.bob||0;
  placeSegment(torso,hip,shoulder);pelvis.position.fromArray(hip);
  const headBase=prone?[.45,.19,-.20]:mix([-.015,DIMENSIONS.standing-.35,-.19],[.055,DIMENSIONS.kneeling-.35,-.19]);headBase[1]-=motion.bob||0;head.position.fromArray(headBase);
  placeSegment(neck,shoulder,[headBase[0]-.015,headBase[1]+.135,headBase[2]]);scarf.position.fromArray(shoulder);scarf.position.y+=.012;
  for(const ear of ears)ear.rotation.z=prone?Math.acos((DIMENSIONS.prone-headBase[1]-.245)/.105):0;
  placeSegment(mane,[shoulder[0]-.085,shoulder[1]+.025,headBase[2]],[headBase[0]-.090,headBase[1]+.21,headBase[2]]);
  placeSegment(tail,[hip[0]-.14,hip[1]+.03,offset],prone?[hip[0]-.29,.08,offset]:[hip[0]-.22,Math.max(.16,hip[1]-.32),offset]);
  rifle.rotation.z=motion.readyPitch||0;
  const pivot=new THREE.Vector3(-.075,-.036,0),pivotDelta=pivot.clone().sub(pivot.clone().applyQuaternion(rifle.quaternion));
  rifle.position.set((prone?.41:0)-recoil,prone?.35:1.2-.3*k,0);rifle.position.add(pivotDelta);
  const joints={};
  for(const l of limbs){const {side}=l,hipJoint=[hip[0],hip[1],offset+side*.12],stand=[.025,.07,offset+side*.15],down=side===1?[.23,.07,offset+.15]:[-.40,.07,offset-.15],ankle=prone?[-.85,.07,offset+side*.15]:mix(stand,down);
   if(motion.feet){ankle[0]+=motion.feet[side].x;ankle[1]+=motion.feet[side].lift;}
   const knee=solveLimb(hipJoint,ankle,.34,.34,prone?[0,.2,side]:[1,0,0]);placeSegment(l.thigh,hipJoint,knee);placeSegment(l.shin,knee,ankle);l.knee.position.fromArray(knee);l.boot.position.set(ankle[0]+.045,ankle[1]-.01,ankle[2]);
   const sh=[shoulder[0],shoulder[1]-.035,offset+side*.19],grip=grips[side===-1?1:0].position.clone().applyQuaternion(rifle.quaternion).add(rifle.position).toArray(),elbow=solveLimb(sh,grip,.28,.28,[0,-.8,side*.6]);
   l.shoulderCap.position.fromArray(sh);placeSegment(l.upper,sh,elbow);const cuffStart=V(sh).lerp(V(elbow),.82).toArray();placeSegment(l.cuff,cuffStart,elbow);placeSegment(l.forearm,elbow,grip);l.elbow.position.fromArray(elbow);l.hand.position.fromArray(grip);l.hand.quaternion.copy(rifle.quaternion);
   joints[side]={hip:hipJoint,knee,ankle,shoulder:sh,elbow,grip};
  }
  root.userData={stance,heading,joints,motion};root.updateMatrixWorld(true);
 }
 function vertex(mesh,index){return new THREE.Vector3().fromBufferAttribute(mesh.geometry.attributes.position,index).applyMatrix4(mesh.matrixWorld).toArray();}
 function diagnostics(){root.updateMatrixWorld(true);const bounds=new THREE.Box3();for(const p of parts)for(let i=0;i<p.geometry.attributes.position.count;i++)bounds.expandByPoint(new THREE.Vector3().fromBufferAttribute(p.geometry.attributes.position,i).applyMatrix4(p.matrixWorld));const triangles=parts.reduce((n,p)=>n+(p.geometry.index?.count||p.geometry.attributes.position.count)/3,0);
  return {tip:vertex(barrel,tipIndex),barrelRear:vertex(barrel,rearIndex),hands:hands.map(h=>h.getWorldPosition(new THREE.Vector3()).toArray()),grips:[grips[1],grips[0]].map(g=>g.getWorldPosition(new THREE.Vector3()).toArray()),min:bounds.min.toArray(),max:bounds.max.toArray(),triangles,meshes:parts.length,joints:root.userData.joints};
 }
 function dispose(){for(const p of parts)p.geometry.dispose();material.dispose();dark.dispose();white.dispose();}
 pose();return {root,pose,diagnostics,dispose,material,parts,barrel,head};
}
