import fs from 'node:fs';
import {createRequire} from 'node:module';
import * as THREE from '../dist/tactics/vendor/three.module.js';
import {blend,ellipsoid as E,tapered as C,sculptSurface} from '../dist/tactics/grey-surface.js';
const simplify=createRequire(import.meta.url)('./vendor/meshoptimizer/meshopt_simplifier.cjs');await simplify.ready;
const base=JSON.parse(fs.readFileSync(new URL('../dist/tactics/horse-light-data.json',import.meta.url)));
const geometries=[];
function add(name,g){geometries.push({name,g});}

const smooth=THREE.MathUtils.smoothstep,clamp=THREE.MathUtils.clamp,abs=Math.abs;
const edge=(...v)=>v.reduce((a,b)=>-blend(-a,-b,.007));
function shirt(x,y,z){
 let d=blend(E(x,y,z,[-.022,1.082,0],[.183,.202,.250]),E(x,y,z,[-.04,1.221,0],[.145,.068,.216]),.035);
 d=blend(d,E(x,y,z,[-.012,.965,0],[.177,.210,.233]),.036);
 for(const side of [-1,1]){d=blend(d,C(x,y,z,[-.045,1.191,side*.205],[.012,1.005,side*.335],.082,.086),.026);d=blend(d,C(x,y,z,[.012,1.037,side*.322],[.023,.993,side*.344],.090,.090),.009);}
 const hem=.81;
 d=edge(d,hem-y-Math.max(0,abs(z)-.245)*9);
 const sleeves=Math.exp(-1*((abs(z)-.32)/.07)**2)*Math.exp(-1*((y-1.035)/.08)**2);
 d+=.003*Math.sin(y*47+abs(z)*18)*sleeves;
 return d;
}
add('connected shirt and sleeves',sculptSurface(shirt,[-.25,.80,-.48],[.23,1.34,.48],.0058));

function trousers(x,y,z){let d=blend(E(x,y,z,[-.025,.795,0],[.183,.150,.238]),E(x,y,z,[-.013,.878,0],[.174,.089,.226]),.040);
 for(const s of [-1,1]){d=blend(d,C(x,y,z,[-.03,.77,s*.12],[.024,.475,s*.196],.142,.111),.045);d=blend(d,C(x,y,z,[.024,.475,s*.196],[-.035,.225,s*.232],.111,.09),.035);
 const local=z-s*.205,face=Math.exp(-1*((x-.09)/.07)**2)*Math.exp(-1*(local/.105)**2);d+=.005*Math.exp(-1*((y-.465-s*local*.32)/.015)**2)*face;d-=.004*Math.exp(-1*((y-.435+s*local*.22)/.020)**2)*face;
 d=blend(d,C(x,y,z,[-.032,.203,s*.232],[-.029,.24,s*.232],.096,.099),.007);}
 return edge(d,y-.96,.17-y);
}
add('connected work trousers seat and legs',sculptSurface(trousers,[-.25,.11,-.38],[.24,1.01,.38],.0058));
for(const part of base.parts.filter(p=>p.name.includes('forearm'))){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(part.position,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(part.normal,3));g.setIndex(part.index);const p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),w=smooth(y,.77,.83)*(1-smooth(y,.97,1.02)),n=new THREE.Vector3().fromBufferAttribute(g.attributes.normal,i);const amount=w*(.004+.002*Math.sin(y*63+z*37));p.setXYZ(i,x+n.x*amount,y+n.y*amount,z+n.z*amount);}g.computeVertexNormals();add(part.name,g);}

// Donkey head: broad muzzle, recessed eyes and tall cupped ears, separate from the horse anatomy.
function head(x,y,z){let d=E(x,y,z,[-.055,1.272,0],[.083,.113,.078]);
 d=blend(d,E(x,y,z,[-.040,1.371,0],[.099,.103,.087]),.027);
 d=blend(d,C(x,y,z,[.004,1.398,0],[.154,1.328,0],.070,.059),.021);
 d=blend(d,E(x,y,z,[.175,1.326,0],[.060,.048,.072]),.013);
 d=blend(d,C(x,y,z,[-.001,1.304,0],[.155,1.294,0],.060,.041),.019);
 for(const s of [-1,1]){d=blend(d,E(x,y,z,[-.007,1.343,s*.063],[.045,.044,.023]),.014);
 d=blend(d,E(x,y,z,[.017,1.410,s*.071],[.036,.014,.020]),.009);
 d=Math.max(d,-E(x,y,z,[.027,1.397,s*.087],[.026,.014,.016]));
 d=Math.max(d,-E(x,y,z,[.204,1.338,s*.052],[.019,.014,.014]));
 // Long tapered leaf volume with an inset inner bowl. Root remains continuous.
 const t=(y-1.44)/.21,zz=z-s*(.061+.055*t),xx=x+.058+.025*t;
 const ear=E(xx,y,zz,[0,1.535,0],[.023,.117,.033]);d=blend(d,ear,.009);
 d=Math.max(d,-E(xx-.018,y,zz,[0,1.543,0],[.016,.089,.023]));
 }
 d+=.0024*Math.exp(-1*((y-1.302)/.004)**2)*smooth(x,.14,.19);return d;}
add('unified donkey skull muzzle and long ears',sculptSurface(head,[-.19,1.12,-.16],[.26,1.68,.16],.0045));
function mane(x,y,z){let d=E(x,y,z,[-.137,1.365,0],[.032,.112,.021]);for(let i=0;i<9;i++){const cy=1.29+i*.019;d=blend(d,C(x,y,z,[-.135,cy,0],[-.175,cy+.023,0],.019,.002),.005);}return d;}
add('donkey mane crest',sculptSurface(mane,[-.21,1.21,-.055],[-.08,1.51,.055],.0045));
function tail(x,y,z){let d=C(x,y,z,[-.18,.84,0],[-.265,.58,0],.018,.014);d=blend(d,C(x,y,z,[-.265,.58,0],[-.29,.39,0],.014,.030),.008);d=blend(d,E(x,y,z,[-.29,.40,0],[.038,.090,.035]),.008);return d;}
add('donkey tail and tuft',sculptSurface(tail,[-.35,.29,-.06],[-.13,.88,.06],.005));
for(const part of base.parts.filter(p=>p.name.includes('hoof'))){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(part.position,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(part.normal,3));g.setIndex(part.index);add(part.name,g);}
function scarfWrap(){const p=[],ix=[],n=32,rows=5,count=n*rows;for(let side=0;side<2;side++)for(let j=0;j<rows;j++)for(let i=0;i<n;i++){const t=j/(rows-1),a=i*2*Math.PI/n,inset=side?.006:0,front=Math.pow(Math.max(0,Math.cos(a)),3),rx=.145-.006*t,rz=.160-.018*t;const fold=.002*Math.sin(t*Math.PI)+.003*Math.sin(t*9+.9*Math.cos(a*2))*Math.sin(t*Math.PI);const width=.026+.018*Math.sin(a)**2,y=1.304+width*(t-.5)-.041*front+.004*Math.sin(a*3)*Math.sin(t*Math.PI)+.012*(1-front)*t*t,z=(rz-inset+fold)*Math.sin(a),x=-.040+(.146-.016*t-inset+fold+.002*front*Math.sin(a*9+t*5))*Math.cos(a);p.push(x,y,z);}for(let side=0;side<2;side++)for(let j=0;j<rows-1;j++)for(let i=0;i<n;i++){const a=side*count+j*n+i,b=side*count+j*n+(i+1)%n,c=b+n,d=a+n;if(side)ix.push(a,b,d,b,c,d);else ix.push(a,d,b,b,d,c);}for(let i=0;i<n;i++){const a=i,b=(i+1)%n,c=(rows-1)*n+i,d=(rows-1)*n+(i+1)%n;ix.push(a,b,a+count,b,b+count,a+count,c,c+count,d,d,c+count,d+count);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();return g;}

// Follow the real garment surface, including its V rim, with a small cloth
// clearance. These closed ribbons carry the painted ends instead of the chest.
const clothMeshes=geometries.filter(p=>/shirt|waistcoat/.test(p.name)).map(({g})=>new THREE.Mesh(g,new THREE.MeshBasicMaterial({side:THREE.DoubleSide})));
const clothRay=new THREE.Raycaster();
function clothFront(y,z){clothRay.set(new THREE.Vector3(.5,y,z),new THREE.Vector3(-1,0,0));return clothRay.intersectObjects(clothMeshes)[0]?.point.x??.11;}
const wrap=scarfWrap();const wp=wrap.attributes.position;for(let i=0;i<wp.count;i++)wp.setXYZ(i,-.04+(wp.getX(i)+.04)*.72,wp.getY(i)-.005,wp.getZ(i)*.69);wrap.computeVertexNormals();add('fitted neckerchief wrap',wrap);
function scarfEnd(side){const p=[],ix=[],n=8,rows=9;for(let j=0;j<rows;j++){const t=(j+.35)/(rows-.3),y=1.242-.104*t,z=side*(.016+.044*t),width=(.010+.016*Math.sin(t*Math.PI))*(1-Math.pow(t,3)*.95);for(let i=0;i<n;i++){const a=i*2*Math.PI/n,zz=z+width*Math.cos(a);p.push(clothFront(y,zz)+.008+(.004+.004*Math.sin(t*Math.PI))*(1+Math.sin(a)),y,zz);}}for(let j=0;j<rows-1;j++)for(let i=0;i<n;i++){const a=j*n+i,b=j*n+(i+1)%n,c=b+n,d=a+n;ix.push(a,b,d,b,c,d);}for(const end of [0,1]){const row=end?rows-1:0,index=p.length/3;let x=0,z=0;for(let i=0;i<n;i++){x+=p[(row*n+i)*3]/n;z+=p[(row*n+i)*3+2]/n;}p.push(x,end?1.138:1.244,z);for(let i=0;i<n;i++){const a=row*n+i,b=row*n+(i+1)%n;ix.push(...(end?[index,a,b]:[index,b,a]));}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));for(let i=0;i<ix.length;i+=3)[ix[i+1],ix[i+2]]=[ix[i+2],ix[i+1]];g.setIndex(ix);g.computeVertexNormals();return g;}
// Weld the parametric sphere seam/poles before reduction/manifold validation.
function scarfKnot(){const p=[],ix=[],n=12,rows=7;for(let j=1;j<rows;j++){const t=j*Math.PI/rows;for(let i=0;i<n;i++){const a=i*2*Math.PI/n,fold=1+.08*Math.cos(a*3);p.push(.120+.011*Math.sin(t)*Math.cos(a)*fold,1.254+.028*Math.cos(t),.026*Math.sin(t)*Math.sin(a)*(1-.18*Math.sin(t)**6));}}for(let j=0;j<rows-2;j++)for(let i=0;i<n;i++){const a=j*n+i,b=j*n+(i+1)%n;ix.push(a,b,a+n,b,b+n,a+n);}const top=p.length/3;p.push(.120,1.282,0,.120,1.226,0);for(let i=0;i<n;i++){const next=(i+1)%n;ix.push(top,next,i,top+1,(rows-2)*n+i,(rows-2)*n+next);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();return g;}
add('neckerchief knot',scarfKnot());for(const side of [-1,1])add('neckerchief end '+side,scarfEnd(side));

const order=['connected shirt and sleeves','connected work trousers seat and legs','forearm and hand -1','exposed hoof -1','forearm and hand 1','exposed hoof 1','unified donkey skull muzzle and long ears','donkey mane crest','donkey tail and tuft'];geometries.sort((a,b)=>(order.includes(a.name)?order.indexOf(a.name):99)-(order.includes(b.name)?order.indexOf(b.name):99));
function reduce(name,g,target,tolerance){const positions=g.attributes.position.array;let [indices,error]=simplify.simplify(new Uint32Array(g.index.array),positions,3,Math.min(target*3,g.index.count),tolerance,['ErrorAbsolute']);const faces=new Map();for(let i=0;i<indices.length;i+=3){const key=Array.from(indices.subarray(i,i+3)).sort((a,b)=>a-b).join(':');if(!faces.has(key))faces.set(key,[]);faces.get(key).push(i);}const clean=[];for(const v of faces.values())if(v.length===1)clean.push(...indices.subarray(v[0],v[0]+3));indices=new Uint32Array(clean);
 const [remap,count]=simplify.compactMesh(indices),position=new Float32Array(count*3),normal=new Float32Array(count*3);for(let i=0;i<remap.length;i++)if(remap[i]!==0xffffffff){position.set(positions.subarray(i*3,i*3+3),remap[i]*3);normal.set(g.attributes.normal.array.subarray(i*3,i*3+3),remap[i]*3);}return {name,position:Array.from(position,v=>+v.toFixed(7)),normal:Array.from(normal,v=>+v.toFixed(6)),index:Array.from(indices),triangles:indices.length/3,sourceTriangles:g.index.count/3,errorWorld:error};}
const author=geometries.map(({name,g})=>reduce(name,g,name.includes('skull')?7000:name.includes('mane')?600:name.includes('tail')?700:name.includes('hoof')?700:name.includes('shirt')?4800:name.includes('trousers')?4700:4550,.006));
// Preserve the registered artwork and bind weights while extending the neck.
// Above the throat this is a translation, so skull, muzzle and ears keep their size.
function neckRevision(part){
 if(!/skull|mane|neckerchief wrap/.test(part.name))return part;
 const position=part.position.slice();
 for(let i=0;i<position.length;i+=3){const y=position[i+1];position[i+1]=part.name.includes('wrap')?1.26+(y-1.26)*.65:y+.11*smooth(y,1.18,1.30);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(position,3));g.setIndex(part.index);g.computeVertexNormals();
 const result={...part,position:Array.from(g.attributes.position.array),normal:Array.from(g.attributes.normal.array),paintPosition:part.position,paintNormal:part.normal};g.dispose();return result;
}
function save(file,parts,sourceTriangles){const data={schema:1,species:'donkey',source:'Donkey-specific head with extended visible neck and lowered scarf; registered original paint preserved',sourceTriangles,triangles:parts.reduce((n,p)=>n+p.triangles,0),parts:parts.map(neckRevision)};fs.writeFileSync(new URL('../dist/tactics/'+file,import.meta.url),JSON.stringify(data)+'\n');console.log(file,data.triangles,parts.map(p=>[p.name,p.triangles,p.errorWorld]));return data;}
const high=save('donkey-author-data.json',author,geometries.reduce((n,p)=>n+p.g.index.count/3,0));
const low=author.map(p=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p.position,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(p.normal,3));g.setIndex(p.index);const target=p.name.includes('neckerchief wrap')?240:p.name.includes('neckerchief knot')?80:p.name.includes('neckerchief end')?72:p.name.includes('shirt')?1500:p.name.includes('trousers')?2200:p.name.includes('skull')?2600:p.name.includes('mane')?250:p.name.includes('tail')?300:p.name.includes('hoof')?400:1000;const result=reduce(p.name,g,target,p.name.includes('forearm')?.006:p.name.includes('hoof')?.006:.015);g.dispose();return result;});
save('donkey-10k-data.json',low,high.triangles);for(const {g} of geometries)g.dispose();
