import fs from 'node:fs';
import {createRequire} from 'node:module';
import * as THREE from '../dist/tactics/vendor/three.module.js';
import {blend,ellipsoid as E,roundedBox as B,tapered as C,sculptSurface} from '../dist/tactics/grey-surface.js';
const simplify=createRequire(import.meta.url)('./vendor/meshoptimizer/meshopt_simplifier.cjs');await simplify.ready;
const base=JSON.parse(fs.readFileSync(new URL('../dist/tactics/horse-light-data.json',import.meta.url)));
const boots=JSON.parse(fs.readFileSync(new URL('../dist/tactics/skunk-author-data.json',import.meta.url)));
const geometries=[];function add(name,g){geometries.push({name,g});}
function copy(part){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(part.position,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(part.normal,3));g.setIndex(part.index);add(part.name,g);}
const abs=Math.abs,exp=Math.exp,edge=(...v)=>v.reduce((a,b)=>-blend(-a,-b,.008));
// Signed polygon distance in a plane, for folded ears and pointed collar leaves.
function polygon(u,v,points){let distance=Infinity,inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[j],b=points[i],dx=b[0]-a[0],dy=b[1]-a[1],t=THREE.MathUtils.clamp(((u-a[0])*dx+(v-a[1])*dy)/(dx*dx+dy*dy),0,1);distance=Math.min(distance,Math.hypot(u-a[0]-t*dx,v-a[1]-t*dy));if((a[1]>v)!==(b[1]>v)&&u<(b[0]-a[0])*(v-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return distance*(inside?-1:1);}
function shirt(x,y,z){
 let d=blend(E(x,y,z,[.010,1.064,0],[.241,.231,.264]),E(x,y,z,[-.035,1.216,0],[.173,.076,.240]),.041);
 d=blend(d,E(x,y,z,[.065,.969,0],[.224,.137,.259]),.045);
 for(const s of [-1,1]){
  d=blend(d,C(x,y,z,[-.045,1.191,s*.235],[.021,1.016,s*.344],.105,.087),.025);
  d=blend(d,C(x,y,z,[.012,1.041,s*.328],[.023,.993,s*.344],.094,.091),.010);
 }
 const sleeve=exp(-1*((abs(z)-.34)/.065)**2)*exp(-1*((y-1.027)/.095)**2);
 d+=.003*Math.sin((y-1.0)*42+abs(z)*10)*sleeve;
 // Waist tuck and the open collar are construction; pocket/stitch detail is paint.
 d=edge(d,.897-y-Math.max(0,abs(z)-.275)*8);
 d=Math.max(d,-E(x,y,z,[-.020,1.31,0],[.13,.056,.14]));
 for(const s of [-1,1]){
  const leaf=polygon(y,z*s,[[1.289,.095],[1.251,.159],[1.191,.124],[1.239,.057]]);
  const collar=.014*(1-THREE.MathUtils.smoothstep(leaf,-.008,.012))*THREE.MathUtils.smoothstep(x,.04,.08);
  d-=collar;
 }
 d+=.003*exp(-1*((y-1.035+z*.15)/.022)**2)*exp(-1*((x-.24)/.05)**2);
 return d;
}
add('connected shirt and sleeves',sculptSurface(shirt,[-.28,.80,-.49],[.34,1.36,.49],.0065));
function trousers(x,y,z){
 let d=blend(E(x,y,z,[-.025,.789,0],[.226,.179,.269]),E(x,y,z,[.015,.896,0],[.237,.070,.264]),.033);
 for(const s of [-1,1]){
  d=blend(d,C(x,y,z,[-.03,.77,s*.14],[.024,.475,s*.202],.151,.116),.040);
  d=blend(d,C(x,y,z,[.024,.475,s*.202],[-.035,.225,s*.232],.116,.085),.030);
  const local=z-s*.205,front=exp(-1*((x-.10)/.070)**2)*exp(-1*(local/.11)**2);
  d+=.0045*exp(-1*((y-.46-s*local*.32)/.016)**2)*front;
  d-=.0035*exp(-1*((y-.430+s*local*.22)/.023)**2)*front;
 }
 // Belt and both braces belong to the same continuous garment surface.
 const belt=edge(shirt(x,y,z)-.014,abs(y-.913)-.024,abs(z)-.279);
 d=blend(d,belt,.018);
 for(const s of [-1,1]){
  const strap=edge(shirt(x,y,z)-.012,abs(z-s*.178)-.017,.915-y);
  d=blend(d,strap,.009);
 }
 return d;
}
add('connected trousers belt and braces',sculptSurface(trousers,[-.30,.13,-.40],[.35,1.34,.40],.006));
for(const p of base.parts)if(p.name.includes('forearm'))copy(p);
for(const p of boots.parts)if(p.name.includes('boot'))copy(p);
function head(x,y,z){
 let d=E(x,y,z,[-.048,1.292,0],[.138,.107,.153]);
 d=blend(d,E(x,y,z,[-.022,1.431,0],[.141,.141,.151]),.030);
 d=blend(d,E(x,y,z,[.029,1.355,0],[.132,.071,.134]),.031);
 d=blend(d,C(x,y,z,[.067,1.430,0],[.175,1.423,0],.071,.058),.028);
 d=blend(d,E(x,y,z,[.205,1.425,0],[.030,.050,.068]),.012);
 d=blend(d,E(x,y,z,[.123,1.372,0],[.079,.026,.075]),.011);
 for(const s of [-1,1]){
  d=blend(d,E(x,y,z,[.027,1.399,s*.098],[.070,.056,.050]),.024);
  // Narrow open eyes under a firm brow, integrated into broad cheek planes.
  d=blend(d,E(x,y,z,[.061,1.485,s*.099],[.051,.020,.035]),.020);
  d=-blend(-d,E(x,y,z,[.088,1.468,s*.125],[.033,.018,.022]),.004);
  d=blend(d,E(x,y,z,[.083,1.466,s*.109],[.027,.013,.020]),.005);
  d=-blend(-d,E(x,y,z,[.231,1.432,s*.031],[.024,.022,.013]),.003);
  // Overlapping oval sections form a soft drooping flap that narrows to its tip.
  // Its thickness tapers as well as its outline; the interior stays solid.
  for(let i=0;i<=8;i++){const t=i/8,earX=-.040+.024*t+.012*Math.sin(t*Math.PI);d=blend(d,E(x,y,z,[earX,1.503-.059*t,s*(.126+.108*t)],[.025-.015*t,.056*(1-t)+.010,.017]),.010);}
  // Inner-ear shading is painted; no sculpted recess or undercut.
 }
 d+=.0025*exp(-1*((y-1.376)/.007)**2)*THREE.MathUtils.smoothstep(x,.13,.20);
 return d;
}
add('unified pig skull folded ears and snout',sculptSurface(head,[-.22,1.14,-.28],[.27,1.60,.28],.0045));
const curl=[];for(let i=0;i<=40;i++){const t=i/40,a=-Math.PI/2+t*Math.PI*1.8,r=.041*(1-.50*t);curl.push([-.257-.052*Math.min(1,t*5),.838+r*Math.sin(a),r*Math.cos(a)]);}
add('pig curly tail',sculptSurface((x,y,z)=>{let d=C(x,y,z,[-.214,.815,0],curl[0],.021,.016);for(let i=0;i<40;i++)d=blend(d,C(x,y,z,curl[i],curl[i+1],.015-i*.00012,.015-(i+1)*.00012),.004);return d;},[-.35,.77,-.07],[-.18,.91,.07],.0035));
function cap(x,y,z){
 const yy=y-.20*x;let d=B(x,yy,z,[-.023,1.548,0],[.134,.021,.139],.018);
 d=blend(d,E(x,yy,z,[-.010,1.589,0],[.178,.057,.180]),.025);
 d=blend(d,edge(E(x,yy,z,[.104,1.541,0],[.111,.015,.138]),.033-x),.009);
 return d;
}
const capMesh=sculptSurface(cap,[-.24,1.49,-.22],[.25,1.72,.22],.0045);capMesh.computeBoundingBox();capMesh.translate(0,1.65-capMesh.boundingBox.max.y,0);add('skull service cap crown band and visor',capMesh);
const order=['connected shirt and sleeves','connected trousers belt and braces','forearm and hand -1','work boot -1','forearm and hand 1','work boot 1','unified pig skull folded ears and snout','pig curly tail','skull service cap crown band and visor'];geometries.sort((a,b)=>order.indexOf(a.name)-order.indexOf(b.name));

function reduce(name,g,target,tolerance){const positions=g.attributes.position.array;let [indices,error]=simplify.simplify(new Uint32Array(g.index.array),positions,3,Math.min(target*3,g.index.count),tolerance,['ErrorAbsolute']);const faces=new Map();for(let i=0;i<indices.length;i+=3){const key=Array.from(indices.subarray(i,i+3)).sort((a,b)=>a-b).join(':');if(!faces.has(key))faces.set(key,[]);faces.get(key).push(i);}const clean=[];for(const v of faces.values())if(v.length===1)clean.push(...indices.subarray(v[0],v[0]+3));indices=new Uint32Array(clean);
 const [remap,count]=simplify.compactMesh(indices),position=new Float32Array(count*3),normal=new Float32Array(count*3);for(let i=0;i<remap.length;i++)if(remap[i]!==0xffffffff){position.set(positions.subarray(i*3,i*3+3),remap[i]*3);normal.set(g.attributes.normal.array.subarray(i*3,i*3+3),remap[i]*3);}if(name.includes('boot')){let snap=0;for(let i=1;i<position.length;i+=3)if(position[i]<.0003){snap=Math.max(snap,Math.abs(position[i]));position[i]=0;}error+=snap;}if(name.includes('boot')){const smooth=new THREE.BufferGeometry();smooth.setAttribute('position',new THREE.BufferAttribute(position,3));smooth.setIndex(new THREE.BufferAttribute(indices,1));smooth.computeVertexNormals();normal.set(smooth.attributes.normal.array);smooth.dispose();}if(/shirt|trousers/.test(name)){const field=name.includes('shirt')?shirt:trousers,e=.009;for(let i=0;i<position.length;i+=3){const [x,y,z]=position.subarray(i,i+3),n=new THREE.Vector3(field(x+e,y,z)-field(x-e,y,z),field(x,y+e,z)-field(x,y-e,z),field(x,y,z+e)-field(x,y,z-e)).normalize();normal.set(n.toArray(),i);}}return {name,position:Array.from(position,v=>+v.toFixed(7)),normal:Array.from(normal,v=>+v.toFixed(6)),index:Array.from(indices),triangles:indices.length/3,sourceTriangles:g.index.count/3,errorWorld:error};}
const author=geometries.map(({name,g})=>reduce(name,g,name.includes('cap')?2200:name.includes('skull')?5300:name.includes('tail')?900:name.includes('boot')?1200:name.includes('shirt')?5400:name.includes('trousers')?5200:4300,.006));
function save(file,parts,sourceTriangles){const data={schema:1,species:'pig-foreman',source:'Pig foreman-specific shirt, belly, trousers, braces, folded ears, snout, cap and curled tail; shared worker arms and boots',sourceTriangles,triangles:parts.reduce((n,p)=>n+p.triangles,0),parts};fs.writeFileSync(new URL('../dist/tactics/'+file,import.meta.url),JSON.stringify(data)+'\n');console.log(file,data.triangles,parts.map(p=>[p.name,p.triangles,p.errorWorld]));return data;}
const high=save('pig-foreman-author-data.json',author,geometries.reduce((n,p)=>n+p.g.index.count/3,0));
const low=author.map(p=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p.position,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(p.normal,3));g.setIndex(p.index);const target=p.name.includes('cap')?700:p.name.includes('shirt')?1850:p.name.includes('trousers')?2000:p.name.includes('skull')?2050:p.name.includes('tail')?300:p.name.includes('boot')?600:950;const result=reduce(p.name,g,target,.008);g.dispose();return result;});
save('pig-foreman-10k-data.json',low,high.triangles);for(const {g} of geometries)g.dispose();
