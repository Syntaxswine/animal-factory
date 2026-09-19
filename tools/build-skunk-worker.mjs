import fs from 'node:fs';
import {createRequire} from 'node:module';
import * as THREE from '../dist/tactics/vendor/three.module.js';
import {blend,ellipsoid as E,roundedBox as B,tapered as C,sculptSurface} from '../dist/tactics/grey-surface.js';
const simplify=createRequire(import.meta.url)('./vendor/meshoptimizer/meshopt_simplifier.cjs');await simplify.ready;
const base=JSON.parse(fs.readFileSync(new URL('../dist/tactics/horse-light-data.json',import.meta.url)));
const geometries=[];function add(name,g){geometries.push({name,g});}
// Compact worker torso; shared sleeve ends and hand positions preserve the rig.
for(const part of base.parts){if(/skull|mane|hoof/.test(part.name))continue;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(part.position,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(part.normal,3));g.setIndex(part.index);
 if(/shirt|overalls/.test(part.name)){const p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),torso=THREE.MathUtils.smoothstep(y,.66,.91),center=1-THREE.MathUtils.smoothstep(Math.abs(z),.18,.33),f=1-.055*torso*center;p.setXYZ(i,x*f,y,z*f);const n=g.attributes.normal,v=new THREE.Vector3(n.getX(i)/f,n.getY(i),n.getZ(i)/f).normalize();n.setXYZ(i,v.x,v.y,v.z);}}add(part.name,g);}
function head(x,y,z){
 let d=E(x,y,z,[-.057,1.302,0],[.083,.121,.080]);
 d=blend(d,E(x,y,z,[-.032,1.483,0],[.107,.126,.100]),.024);
 d=blend(d,E(x,y,z,[.009,1.402,0],[.082,.058,.087]),.019);
 d=blend(d,C(x,y,z,[.041,1.435,0],[.143,1.408,0],.057,.031),.016);
 d=blend(d,E(x,y,z,[.167,1.413,0],[.027,.022,.036]),.010);
 d=blend(d,E(x,y,z,[.091,1.386,0],[.070,.023,.047]),.009);
 for(const s of [-1,1]){
  d=blend(d,E(x,y,z,[-.050,1.600,s*.085],[.035,.048,.041]),.013);
  d=-blend(-d,E(x,y,z,[-.018,1.606,s*.090],[.022,.031,.026]),.005);
  d=blend(d,E(x,y,z,[.010,1.420,s*.073],[.052,.045,.035]),.017);
  // Integrated open orbital surface, adapted from the approved bull construction.
  d=blend(d,E(x,y,z,[.008,1.434,s*.078],[.059,.048,.032]),.020);
  d=blend(d,E(x,y,z,[.030,1.495,s*.073],[.044,.016,.024]),.023);
  d=-blend(-d,E(x,y,z,[.050,1.473,s*.101],[.036,.024,.024]),.006);
  d=blend(d,E(x,y,z,[.050,1.473,s*.082],[.032,.020,.023]),.007);
  // Broad cheek ruff locks remain connected; smaller fur detail belongs in paint.
  d=blend(d,E(x,y,z,[-.055,1.431,s*.077],[.065,.059,.042]),.019);
 }
 return d;
}
const skull=sculptSurface(head,[-.19,1.15,-.16],[.22,1.69,.16],.0055);skull.computeBoundingBox();const top=skull.boundingBox.max.y,p=skull.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,p.getY(i)+1.65-top);add('unified skunk skull rounded ears and muzzle',skull);
// Anatomical right is +Z. The single root begins on the posterior centerline,
// below the waistband, before the plume sweeps backward and right.
const tailPath=new THREE.CatmullRomCurve3([
 new THREE.Vector3(-.175,.865,0),new THREE.Vector3(-.29,.865,.10),
 new THREE.Vector3(-.41,.95,.245),new THREE.Vector3(-.45,1.12,.28),
 new THREE.Vector3(-.425,1.31,.27),new THREE.Vector3(-.44,1.42,.25),
 new THREE.Vector3(-.50,1.45,.23),new THREE.Vector3(-.56,1.402,.205),
 new THREE.Vector3(-.607,1.329,.19)
]).getPoints(44).map(p=>p.toArray());
const radiusKeys=[[0,.035],[.08,.048],[.22,.11],[.43,.145],[.60,.162],[.74,.143],[.86,.103],[.94,.061],[1,.016]];
const radii=tailPath.map((p,i)=>{const t=i/44,k=radiusKeys.findIndex(a=>a[0]>=t);if(k===0)return radiusKeys[0][1];const [a,b]=[radiusKeys[k-1],radiusKeys[k]],u=THREE.MathUtils.smoothstep(t,a[0],b[0]);return a[1]+(b[1]-a[1])*u;});
add('skunk tail plume',sculptSurface((x,y,z)=>{let d=Infinity;for(let i=0;i<44;i++)d=blend(d,C(x,y,z,tailPath[i],tailPath[i+1],radii[i],radii[i+1]),.016);
 // Continuous flowing plume mass; fur locks will be painted along its curvature.
 return d;},[-.72,.65,-.09],[-.10,1.68,.51],.007));
for(const s of [-1,1])add('work boot '+s,sculptSurface((x,y,z)=>{const zz=z-s*.232;
 const toe=(Math.hypot((x-.075)/.088,zz/.079)-1)*.079,heel=(Math.hypot((x+.040)/.065,zz/.065)-1)*.065;
 let d=-blend(-blend(toe,heel,.018),-(Math.abs(y-.020)-.020),.004);
 d=blend(d,E(x,y,zz,[.081,.057,0],[.077,.047,.074]),.012);
 d=blend(d,C(x,y,zz,[-.024,.078,0],[-.032,.204,0],.067,.057),.014);
 d=blend(d,E(x,y,zz,[.013,.103,0],[.067,.041,.061]),.013);
 // A restrained raised tongue; laces and eyelets are painted on the curved vamp.
 d=blend(d,E(x,y,zz,[.040,.114,0],[.041,.057,.032]),.008);
 return Math.max(d,-y);
},[-.13,-.014,s*.232-.11],[.18,.29,s*.232+.11],.0035));
const order=['connected shirt and sleeves','connected overalls seat and legs','forearm and hand -1','work boot -1','forearm and hand 1','work boot 1','unified skunk skull rounded ears and muzzle','skunk tail plume'];geometries.sort((a,b)=>order.indexOf(a.name)-order.indexOf(b.name));

function reduce(name,g,target,tolerance){const positions=g.attributes.position.array;let [indices,error]=simplify.simplify(new Uint32Array(g.index.array),positions,3,Math.min(target*3,g.index.count),tolerance,['ErrorAbsolute']);const faces=new Map();for(let i=0;i<indices.length;i+=3){const key=Array.from(indices.subarray(i,i+3)).sort((a,b)=>a-b).join(':');if(!faces.has(key))faces.set(key,[]);faces.get(key).push(i);}const clean=[];for(const v of faces.values())if(v.length===1)clean.push(...indices.subarray(v[0],v[0]+3));indices=new Uint32Array(clean);
 const [remap,count]=simplify.compactMesh(indices),position=new Float32Array(count*3),normal=new Float32Array(count*3);for(let i=0;i<remap.length;i++)if(remap[i]!==0xffffffff){position.set(positions.subarray(i*3,i*3+3),remap[i]*3);normal.set(g.attributes.normal.array.subarray(i*3,i*3+3),remap[i]*3);}if(name.includes('boot')){let snap=0;for(let i=1;i<position.length;i+=3)if(position[i]<.0003){snap=Math.max(snap,Math.abs(position[i]));position[i]=0;}error+=snap;const smooth=new THREE.BufferGeometry();smooth.setAttribute('position',new THREE.BufferAttribute(position,3));smooth.setIndex(new THREE.BufferAttribute(indices,1));smooth.computeVertexNormals();normal.set(smooth.attributes.normal.array);smooth.dispose();}return {name,position:Array.from(position,v=>+v.toFixed(7)),normal:Array.from(normal,v=>+v.toFixed(6)),index:Array.from(indices),triangles:indices.length/3,sourceTriangles:g.index.count/3,errorWorld:error};}
const author=geometries.map(({name,g})=>reduce(name,g,name.includes('skull')?4500:name.includes('tail')?3400:name.includes('boot')?1200:10000,.006));
function save(file,parts,sourceTriangles){const data={schema:1,species:'skunk',source:'Skunk-specific skull, rounded ears, centered tail root and raised plume, and work boots; adapted approved worker garments',sourceTriangles,triangles:parts.reduce((n,p)=>n+p.triangles,0),parts};fs.writeFileSync(new URL('../dist/tactics/'+file,import.meta.url),JSON.stringify(data)+'\n');console.log(file,data.triangles,parts.map(p=>[p.name,p.triangles,p.errorWorld]));return data;}
const high=save('skunk-author-data.json',author,geometries.reduce((n,p)=>n+p.g.index.count/3,0));
const low=author.map(p=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p.position,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(p.normal,3));g.setIndex(p.index);const target=p.name.includes('shirt')?1550:p.name.includes('overalls')?2350:p.name.includes('skull')?2000:p.name.includes('tail')?1000:p.name.includes('boot')?600:950;const result=reduce(p.name,g,target,.008);g.dispose();return result;});
save('skunk-10k-data.json',low,high.triangles);for(const {g} of geometries)g.dispose();
