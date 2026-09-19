import {proportionData} from './pig-body-proportions.mjs';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import * as THREE from '../dist/tactics/vendor/three.module.js';
import {blend,ellipsoid as E,tapered as C,sculptSurface} from '../dist/tactics/grey-surface.js';
const simplify=createRequire(import.meta.url)('./vendor/meshoptimizer/meshopt_simplifier.cjs');await simplify.ready;
const base=JSON.parse(fs.readFileSync(new URL('../dist/tactics/horse-light-data.json',import.meta.url)));
const geometries=[];function add(name,g){geometries.push({name,g});}
function copy(part){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(part.position,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(part.normal,3));g.setIndex(part.index);add(part.name,g);}
const abs=Math.abs,exp=Math.exp,edge=(...v)=>v.reduce((a,b)=>-blend(-a,-b,.008));
// Signed polygon distance in a plane, for broad ear outlines and collar leaves.
function polygon(u,v,points){let distance=Infinity,inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[j],b=points[i],dx=b[0]-a[0],dy=b[1]-a[1],t=THREE.MathUtils.clamp(((u-a[0])*dx+(v-a[1])*dy)/(dx*dx+dy*dy),0,1);distance=Math.min(distance,Math.hypot(u-a[0]-t*dx,v-a[1]-t*dy));if((a[1]>v)!==(b[1]>v)&&u<(b[0]-a[0])*(v-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return distance*(inside?-1:1);}
function shirt(x,y,z){
 let d=blend(E(x,y,z,[.020,1.100,0],[.282,.225,.335]),E(x,y,z,[-.028,1.258,0],[.204,.082,.292]),.045);
 d=blend(d,E(x,Math.max(y,.90),z,[.100,.957,0],[.299,.212,.338]),.05);
 for(const side of [-1,1]){
  d=blend(d,C(x,y,z,[-.035,1.217,side*.285],[.021,1.016,side*.429],.120,.103),.022);
  d=blend(d,C(x,y,z,[.013,1.041,side*.414],[.023,.993,side*.429],.110,.106),.009);
 }
 const front=THREE.MathUtils.smoothstep(x,.05,.20),hem=.865-.073*exp(-1*((abs(z)-.16)/.095)**2)*front;
 const sleeve=THREE.MathUtils.smoothstep(abs(z),.34,.41);
 d=edge(d,hem-y-sleeve*.14);
 d=Math.max(d,-E(x,y,z,[-.020,1.355,0],[.157,.063,.174]));
 for(const side of [-1,1]){const leaf=polygon(y,z*side,[[1.317,.112],[1.285,.176],[1.195,.088],[1.267,.038]]);d-=.013*(1-THREE.MathUtils.smoothstep(leaf,-.008,.012))*THREE.MathUtils.smoothstep(x,.09,.15);}
 return d;
}
add('connected shirt waistcoat and sleeves',sculptSurface(shirt,[-.33,.73,-.57],[.44,1.40,.57],.0065));
function trousers(x,y,z){
 let d=E(x,y,z,[.055,.890,0],[.315,.335,.330]);
 const front=THREE.MathUtils.smoothstep(x,.05,.20),hem=.865-.073*exp(-1*((abs(z)-.16)/.095)**2)*front;

 for(const side of [-1,1]){
  d=blend(d,C(x,y,z,[-.02,.73,side*.163],[.024,.43,side*.211],.180,.145),.070);
  d=blend(d,C(x,y,z,[.024,.43,side*.211],[-.024,.180,side*.232],.145,.108),.030);
  const front=exp(-1*((x-.12)/.08)**2)*exp(-1*((z-side*.211)/.1)**2);
  d+=.004*exp(-1*((y-.42-side*(z-side*.21)*.2)/.020)**2)*front;
 }
 const upper=E(x+.012,Math.max(y,.90),z,[.100,.957,0],[.299,.212,.338]);
 d=THREE.MathUtils.lerp(d,upper,THREE.MathUtils.smoothstep(y,.78,.87));
 return edge(d,y-hem-.012);
}
add('connected dress trousers',sculptSurface(trousers,[-.34,.04,-.43],[.43,1.03,.43],.006));
for(const p of base.parts)if(p.name.includes('forearm')){const moved={...p,position:p.position.map((v,i)=>i%3===2?v+Math.sign(v)*.085:v)};copy(moved);}
for(const side of [-1,1]){const z0=side*.232;add('dress boot '+side,sculptSurface((x,y,z)=>{let d=blend(E(x,y,z,[.025,.025,z0],[.165,.038,.100]),E(x,y,z,[.023,.065,z0],[.157,.058,.097]),.012);d=blend(d,E(x,y,z,[-.040,.113,z0],[.083,.066,.087]),.016);return Math.max(d,-y);},[-.17,-.01,z0-.13],[.22,.20,z0+.13],.0045));}
// A curved outline rather than a taper to a point: the lower lobe hangs below
// the outward-turned edge. Thickness stays solid; folds belong to the skin.
const earOutline=new THREE.CatmullRomCurve3([
 [.105,1.587],[.145,1.595],[.183,1.550],[.225,1.475],
 [.255,1.461],[.239,1.426],[.205,1.372],[.170,1.393],
 [.145,1.515],[.112,1.537]
].map(([z,y])=>new THREE.Vector3(z,y,0)),true,'centripetal').getPoints(64).slice(0,-1).map(p=>[p.x,p.y]);
function ear(x,y,z){
 y-=.040;z/=1.25;
 const spread=THREE.MathUtils.smoothstep(z,.13,.25),drop=THREE.MathUtils.smoothstep(1.505-y,0,.090);
 const centerX=-.020-.110*spread-.020*drop+.018*spread*spread*spread;
 const outline=polygon(z,y,earOutline),thickness=.016+.007*(1-spread);
 // Rounded intersection gives a soft rim without cutting an ear cavity.
 return edge(outline,abs(x-centerX)-thickness);
}
function head(x,y,z){
 let d=E(x,y,z,[-.045,1.327,0],[.148,.102,.168]);
 d=blend(d,E(x,y,z,[-.018,1.482,0],[.174,.168,.195]),.033);
 d=blend(d,E(x,y,z,[.040,1.377,0],[.173,.102,.173]),.033);
 d=blend(d,E(x,y,z,[.100,1.343,0],[.103,.058,.133]),.025);
 d=blend(d,C(x,y,z,[.090,1.472,0],[.195,1.492,0],.080,.063),.027);
 d=blend(d,E(x,y,z,[.226,1.501,0],[.031,.054,.075]),.012);
 d=blend(d,E(x,y,z,[.133,1.421,0],[.082,.029,.080]),.012);
 for(const side of [-1,1]){
  d=blend(d,E(x,y,z,[.047,1.439,side*.120],[.083,.072,.060]),.027);
  d=blend(d,E(x,y,z,[.068,1.545,side*.119],[.048,.016,.033]),.017);
  d=-blend(-d,E(x,y,z,[.098,1.531,side*.149],[.033,.016,.023]),.004);
  d=blend(d,E(x,y,z,[.093,1.530,side*.131],[.026,.011,.020]),.005);
  d=-blend(-d,E(x,y,z,[.254,1.508,side*.034],[.024,.023,.014]),.003);
  d=blend(d,ear(x,y,z*side),.009);
 }
 return d;
}
const skull=sculptSurface(head,[-.24,1.17,-.35],[.30,1.68,.35],.0045);skull.computeBoundingBox();const headScale=(1.65-1.28)/(skull.boundingBox.max.y-1.28);const hp=skull.attributes.position;for(let i=0;i<hp.count;i++)hp.setY(i,1.28+(hp.getY(i)-1.28)*headScale);skull.computeVertexNormals();add('unified director skull folded ears and snout',skull);
const curl=[];for(let i=0;i<=40;i++){const t=i/40,a=-Math.PI/2+t*Math.PI*1.8,r=.041*(1-.50*t);curl.push([-.305-.052*Math.min(1,t*5),.838+r*Math.sin(a),r*Math.cos(a)]);}
add('pig curly tail',sculptSurface((x,y,z)=>{let d=C(x,y,z,[-.258,.815,0],curl[0],.021,.016);for(let i=0;i<40;i++)d=blend(d,C(x,y,z,curl[i],curl[i+1],.015-i*.00012,.015-(i+1)*.00012),.004);return d;},[-.40,.77,-.07],[-.22,.91,.07],.0035));
const order=['connected shirt waistcoat and sleeves','connected dress trousers','forearm and hand -1','dress boot -1','forearm and hand 1','dress boot 1','unified director skull folded ears and snout','pig curly tail'];geometries.sort((a,b)=>order.indexOf(a.name)-order.indexOf(b.name));

function reduce(name,g,target,tolerance){const positions=g.attributes.position.array;let [indices,error]=simplify.simplify(new Uint32Array(g.index.array),positions,3,Math.min(target*3,g.index.count),tolerance,['ErrorAbsolute']);const faces=new Map();for(let i=0;i<indices.length;i+=3){const key=Array.from(indices.subarray(i,i+3)).sort((a,b)=>a-b).join(':');if(!faces.has(key))faces.set(key,[]);faces.get(key).push(i);}const clean=[];for(const v of faces.values())if(v.length===1)clean.push(...indices.subarray(v[0],v[0]+3));indices=new Uint32Array(clean);
 const [remap,count]=simplify.compactMesh(indices),position=new Float32Array(count*3),normal=new Float32Array(count*3);for(let i=0;i<remap.length;i++)if(remap[i]!==0xffffffff){position.set(positions.subarray(i*3,i*3+3),remap[i]*3);normal.set(g.attributes.normal.array.subarray(i*3,i*3+3),remap[i]*3);}if(name.includes('boot')){let snap=0;for(let i=1;i<position.length;i+=3)if(position[i]<.0003){snap=Math.max(snap,Math.abs(position[i]));position[i]=0;}error+=snap;}if(name.includes('boot')){const smooth=new THREE.BufferGeometry();smooth.setAttribute('position',new THREE.BufferAttribute(position,3));smooth.setIndex(new THREE.BufferAttribute(indices,1));smooth.computeVertexNormals();normal.set(smooth.attributes.normal.array);smooth.dispose();}if(/shirt|trousers/.test(name)){const field=name.includes('shirt')?shirt:trousers,e=.012;for(let i=0;i<position.length;i+=3){const [x,originalY,z]=position.subarray(i,i+3);const hem=.865-.073*exp(-1*((abs(z)-.16)/.095)**2)*THREE.MathUtils.smoothstep(x,.05,.20);const y=name.includes("shirt")&&abs(z)<.35?Math.max(originalY,hem+.035):originalY;const n=new THREE.Vector3(field(x+e,y,z)-field(x-e,y,z),field(x,y+e,z)-field(x,y-e,z),field(x,y,z+e)-field(x,y,z-e)).normalize();normal.set(n.toArray(),i);}}if(name.includes('folded ears')){const surface=new THREE.BufferGeometry();surface.setAttribute('position',new THREE.BufferAttribute(position,3));surface.setIndex(new THREE.BufferAttribute(indices,1));surface.computeVertexNormals();const averaged=surface.attributes.normal.array;for(let i=0;i<position.length;i+=3){const [x,y,z]=position.subarray(i,i+3);if(abs(z)>.135&&y>1.38&&x<.04)normal.set(averaged.subarray(i,i+3),i);}surface.dispose();}return {name,position:Array.from(position,v=>+v.toFixed(7)),normal:Array.from(normal,v=>+v.toFixed(6)),index:Array.from(indices),triangles:indices.length/3,sourceTriangles:g.index.count/3,errorWorld:error};}
const author=geometries.map(({name,g})=>reduce(name,g,name.includes('skull')?6100:name.includes('tail')?900:name.includes('boot')?1200:name.includes('shirt')?6800:name.includes('trousers')?5200:4300,.006));
function save(file,parts,sourceTriangles){const data={schema:1,species:'pig-director',source:'Pig director-specific broad belly, waistcoat, dress trousers, heavy jowls, curved ears and snout; shared worker rig with widened arms and low shoes',sourceTriangles,triangles:parts.reduce((n,p)=>n+p.triangles,0),parts};fs.writeFileSync(new URL('../dist/tactics/'+file,import.meta.url),JSON.stringify(proportionData(data))+'\n');console.log(file,data.triangles,parts.map(p=>[p.name,p.triangles,p.errorWorld]));return data;}
const high=save('pig-director-author-data.json',author,geometries.reduce((n,p)=>n+p.g.index.count/3,0));
const low=author.map(p=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p.position,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(p.normal,3));g.setIndex(p.index);const target=p.name.includes('shirt')?2350:p.name.includes('trousers')?2100:p.name.includes('skull')?2150:p.name.includes('tail')?300:p.name.includes('boot')?600:950;const result=reduce(p.name,g,target,.008);g.dispose();return result;});
save('pig-director-10k-data.json',low,high.triangles);for(const {g} of geometries)g.dispose();
