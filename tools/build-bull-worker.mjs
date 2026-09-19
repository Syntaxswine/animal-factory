import fs from 'node:fs';
import {createRequire} from 'node:module';
import * as THREE from '../dist/tactics/vendor/three.module.js';
import {blend,ellipsoid as E,roundedBox as B,tapered as C,sculptSurface} from '../dist/tactics/grey-surface.js';
const simplify=createRequire(import.meta.url)('./vendor/meshoptimizer/meshopt_simplifier.cjs');await simplify.ready;
const base=JSON.parse(fs.readFileSync(new URL('../dist/tactics/horse-light-data.json',import.meta.url)));
const geometries=[];function add(name,g){geometries.push({name,g});}
// Broad bovine ribcage, tapering back to the shared sleeve and hand bind positions.
for(const part of base.parts){if(/skull|mane|hoof/.test(part.name))continue;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(part.position,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(part.normal,3));g.setIndex(part.index);
 if(/shirt|overalls/.test(part.name)){const p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),torso=THREE.MathUtils.smoothstep(y,.66,.91),center=1-THREE.MathUtils.smoothstep(Math.abs(z),.18,.33),f=1+.10*torso*center;p.setXYZ(i,x*f,y,z*f);const n=g.attributes.normal,v=new THREE.Vector3(n.getX(i)/f,n.getY(i),n.getZ(i)/f).normalize();n.setXYZ(i,v.x,v.y,v.z);}}add(part.name,g);}
const hornPaths=[-1,1].map(s=>new THREE.CubicBezierCurve3(new THREE.Vector3(-.044,1.528,s*.080),new THREE.Vector3(-.055,1.55,s*.125),new THREE.Vector3(-.024,1.62,s*.139),new THREE.Vector3(.002,1.646,s*.103)).getPoints(18).map(p=>p.toArray()));
function head(x,y,z){
 let d=E(x,y,z,[-.069,1.286,0],[.112,.131,.107]);
 d=blend(d,E(x,y,z,[-.029,1.445,0],[.112,.108,.109]),.024);
 d=blend(d,E(x,y,z,[.008,1.383,0],[.105,.073,.106]),.021);
 d=blend(d,C(x,y,z,[.054,1.446,0],[.16,1.400,0],.071,.062),.018);
 d=blend(d,B(x,y,z,[.161,1.396,0],[.071,.041,.098],.027),.016);
 d=blend(d,E(x,y,z,[.130,1.366,0],[.084,.029,.082]),.008);
 for(const s of [-1,1]){
  // Wide leaf ears under the horn roots, with a shallow inner bowl.
  d=blend(d,E(x,y-.12*(Math.abs(z)-.10),z,[-.069,1.463,s*.148],[.047,.044,.084]),.016);
  d=-blend(-d,E(x,y-.12*(Math.abs(z)-.10),z,[-.031,1.468,s*.165],[.030,.030,.054]),.007);
  d=blend(d,E(x,y,z,[.008,1.402,s*.088],[.059,.050,.029]),.016);
  // Integrated open eye surface inside a shallow socket; paint supplies the iris.
  d=blend(d,E(x,y,z,[.030,1.467,s*.082],[.044,.016,.024]),.023);
  d=-blend(-d,E(x,y,z,[.050,1.445,s*.110],[.036,.024,.024]),.006);
  d=blend(d,E(x,y,z,[.050,1.445,s*.091],[.032,.020,.023]),.007);
  d=-blend(-d,E(x,y,z,[.216,1.405,s*.067],[.023,.013,.018]),.004);
  const path=hornPaths[s<0?0:1];let horn=Infinity;for(let i=0;i<18;i++)horn=Math.min(horn,C(x,y,z,path[i],path[i+1],.027*(1-i/18)+.0035,.027*(1-(i+1)/18)+.0035));d=blend(d,horn,.012);
 }
 // Restrained horizontal lip groove; the painted nose supplies finer anatomy.
 d+=.003*Math.exp(-(((y-1.371)/.004)**2))*THREE.MathUtils.smoothstep(x,.155,.21);
 return d;
}
const skull=sculptSurface(head,[-.23,1.10,-.26],[.27,1.70,.26],.0055);skull.computeBoundingBox();const top=skull.boundingBox.max.y,p=skull.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,p.getY(i)+1.65-top);add('unified bull skull ears and short horns',skull);
const tailPath=new THREE.CubicBezierCurve3(new THREE.Vector3(-.18,.90,0),new THREE.Vector3(-.28,.78,0),new THREE.Vector3(-.255,.54,.032),new THREE.Vector3(-.295,.397,.04)).getPoints(22).map(p=>p.toArray());
add('bull tail',sculptSurface((x,y,z)=>{let d=Infinity;for(let i=0;i<22;i++)d=Math.min(d,C(x,y,z,tailPath[i],tailPath[i+1],.020-i*.00045,.020-(i+1)*.00045));d=blend(d,E(x,y,z,[-.302,.350,.041],[.038,.057,.033]),.012);for(const [zz,yy,xx] of [[.015,.292,-.318],[.044,.260,-.301],[.065,.280,-.290]])d=blend(d,C(x,y,z,[-.302,.33,zz],[xx,yy,zz],.023,.0035),.011);return d;},[-.36,.24,-.04],[-.15,.94,.10],.0055));
for(const s of [-1,1])add('exposed cloven hoof '+s,sculptSurface((x,y,z)=>{const zz=z-s*.232,t=THREE.MathUtils.clamp(y/.098,0,1),rx=.089-.025*t,rz=.076-.019*t,cx=.006-.023*t;let d=Math.max((Math.hypot((x-cx)/rx,zz/rz)-1)*Math.min(rx,rz),-y,y-.098);const cleft=Math.max(Math.abs(zz)-.006,.011-x,y-.079);d=Math.max(d,-cleft);return blend(d,C(x,y,zz,[-.018,.107,0],[-.034,.203,0],.053,.067),.008);},[-.12,-.013,s*.232-.10],[.12,.29,s*.232+.10],.008));
const order=['connected shirt and sleeves','connected overalls seat and legs','forearm and hand -1','exposed cloven hoof -1','forearm and hand 1','exposed cloven hoof 1','unified bull skull ears and short horns','bull tail'];geometries.sort((a,b)=>order.indexOf(a.name)-order.indexOf(b.name));

function reduce(name,g,target,tolerance){const positions=g.attributes.position.array;let [indices,error]=simplify.simplify(new Uint32Array(g.index.array),positions,3,Math.min(target*3,g.index.count),tolerance,['ErrorAbsolute']);const faces=new Map();for(let i=0;i<indices.length;i+=3){const key=Array.from(indices.subarray(i,i+3)).sort((a,b)=>a-b).join(':');if(!faces.has(key))faces.set(key,[]);faces.get(key).push(i);}const clean=[];for(const v of faces.values())if(v.length===1)clean.push(...indices.subarray(v[0],v[0]+3));indices=new Uint32Array(clean);
 const [remap,count]=simplify.compactMesh(indices),position=new Float32Array(count*3),normal=new Float32Array(count*3);for(let i=0;i<remap.length;i++)if(remap[i]!==0xffffffff){position.set(positions.subarray(i*3,i*3+3),remap[i]*3);normal.set(g.attributes.normal.array.subarray(i*3,i*3+3),remap[i]*3);}return {name,position:Array.from(position,v=>+v.toFixed(7)),normal:Array.from(normal,v=>+v.toFixed(6)),index:Array.from(indices),triangles:indices.length/3,sourceTriangles:g.index.count/3,errorWorld:error};}
const author=geometries.map(({name,g})=>reduce(name,g,name.includes('skull')?7800:name.includes('tail')?550:name.includes('hoof')?800:10000,.006));
function save(file,parts,sourceTriangles){const data={schema:1,species:'bull',source:'Bull-specific head, horns, tail and cloven hooves; adapted approved worker garments',sourceTriangles,triangles:parts.reduce((n,p)=>n+p.triangles,0),parts};fs.writeFileSync(new URL('../dist/tactics/'+file,import.meta.url),JSON.stringify(data)+'\n');console.log(file,data.triangles,parts.map(p=>[p.name,p.triangles,p.errorWorld]));return data;}
const high=save('bull-author-data.json',author,geometries.reduce((n,p)=>n+p.g.index.count/3,0));
const low=author.map(p=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p.position,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(p.normal,3));g.setIndex(p.index);const target=p.name.includes('shirt')?1650:p.name.includes('overalls')?2550:p.name.includes('skull')?2720:p.name.includes('tail')?280:p.name.includes('hoof')?400:1000;const result=reduce(p.name,g,target,p.name.includes('forearm')?.006:p.name.includes('hoof')?.006:.015);g.dispose();return result;});
save('bull-10k-data.json',low,high.triangles);for(const {g} of geometries)g.dispose();
