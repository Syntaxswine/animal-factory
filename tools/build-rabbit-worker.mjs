import fs from 'node:fs';
import {createRequire} from 'node:module';
import * as THREE from '../dist/tactics/vendor/three.module.js';
import {blend,ellipsoid as E,tapered as C,sculptSurface} from '../dist/tactics/grey-surface.js';
const simplify=createRequire(import.meta.url)('./vendor/meshoptimizer/meshopt_simplifier.cjs');await simplify.ready;
const base=JSON.parse(fs.readFileSync(new URL('../dist/tactics/horse-light-data.json',import.meta.url)));
const geometries=[];function add(name,g){geometries.push({name,g});}
// Fit the shared worker clothes to this character while retaining hands and feet.
const smooth=THREE.MathUtils.smoothstep;
for(const part of base.parts){if(/skull|mane|hoof/.test(part.name))continue;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(part.position,3));g.setIndex(part.index);const p=g.attributes.position;
 for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);if(/shirt|overalls/.test(part.name)){const center=1-smooth(Math.abs(z),.18,.32),waist=Math.exp(-1*((y-.96)/.17)**2)*center,hip=Math.exp(-1*((y-.76)/.12)**2)*center,shoulder=smooth(y,1.05,1.20)*smooth(Math.abs(z),.09,.22);p.setXYZ(i,x*(1-.025*waist+.015*hip),y,z*(1-.035*waist+.025*hip-.075*shoulder));}if(part.name.includes('shirt')){const sleeve=smooth(Math.abs(z),.19,.26)*(1-smooth(y,1.08,1.22));p.setX(i,p.getX(i)*(1-.15*sleeve));p.setZ(i,Math.sign(z)*.325+(p.getZ(i)-Math.sign(z)*.325)*(1-.12*sleeve));}if(part.name.includes('overalls')&&x<-.02){const seat=Math.exp(-1*((y-.80)/.13)**2);p.setX(i,-.02+(p.getX(i)+.02)*(1-.14*seat));}if(/forearm/.test(part.name)){const t=THREE.MathUtils.clamp((.991-y)/.249,0,1),cx=.022+.039*t,cz=Math.sign(z)*(.344+.011*t),w=.13*smooth(y,.77,.83)*(1-smooth(y,.96,1.015));p.setXYZ(i,cx+(x-cx)*(1-w),y,cz+(z-cz)*(1-w));}}
 g.computeVertexNormals();add(part.name,g);
}
function head(x,y,z){
 let d=E(x,y,z,[-.066,1.286,0],[.084,.123,.082]);
 d=blend(d,E(x,y,z,[-.027,1.429,0],[.106,.116,.118]),.023);
 d=blend(d,E(x,y,z,[.049,1.386,0],[.085,.061,.080]),.018);
 for(const side of [-1,1]){
  d=blend(d,E(x,y,z,[.042,1.397,side*.070],[.077,.058,.060]),.030);
  d=blend(d,E(x,y,z,[.081,1.390,side*.029],[.050,.034,.039]),.014);
  // The continuous skull supplies the orbit. Separate raised eye/brow volumes
  // broke the forehead-to-muzzle contour; eyelids are painted on this surface.
  // Continuous leaf ear, outward lean with a softly rounded tip. Paint supplies the interior.
  const yy=y-1.598,zz=side*z-.093-.30*yy,xx=x+.052+.09*yy;
  d=blend(d,E(xx,yy,zz,[0,0,0],[.028,.140,.054*(1-.18*yy/.14)]),.020);
 }
 d=blend(d,E(x,y,z,[.130,1.400,0],[.017,.015,.022]),.008);
 d=blend(d,E(x,y,z,[.089,1.362,0],[.043,.021,.041]),.010);
 return d;
}
add('unified rabbit skull and leaf ears',sculptSurface(head,[-.20,1.10,-.23],[.20,1.78,.23],.0045));
add('rabbit tail',sculptSurface((x,y,z)=>{const t=THREE.MathUtils.clamp((.90-y)/.15,0,1);return blend(E(x,y,z,[-.198,.852,0],[.066,.071,.061]),C(x,y,z,[-.213,.838,0],[-.235,.773,0],.047,.013),.018);},[-.30,.74,-.09],[-.11,.95,.09],.006));
for(const side of [-1,1])add('furry rabbit foot '+side,sculptSurface((x,y,z)=>{
 const zz=z-side*.232;
 let d=E(x,y,zz,[.030,.065,0],[.148,.066,.096]);
 d=blend(d,C(x,y,zz,[-.035,.083,0],[-.034,.203,0],.051,.065),.015);
 for(const toe of [-1,0,1])d=blend(d,E(x,y,zz,[.132+(toe===0?.018:0),.048,toe*.055],[.062,.044,.038]),.013);
 return Math.max(d,-y);
},[-.14,-.01,side*.232-.12],[.23,.29,side*.232+.12],.006));
for(const {name,g} of geometries)if(name.includes('foot')){const p=g.attributes.position;for(let i=0;i<p.count;i++)if(p.getY(i)<.003)p.setY(i,0);g.computeVertexNormals();}
function scarfWrap(){const p=[],ix=[],n=32,rows=5,count=n*rows;for(let side=0;side<2;side++)for(let j=0;j<rows;j++)for(let i=0;i<n;i++){const t=j/(rows-1),a=i*2*Math.PI/n,inset=side?.006:0,front=Math.pow(Math.max(0,Math.cos(a)),3),rx=.145-.006*t,rz=.160-.018*t;const fold=.002*Math.sin(t*Math.PI)+.003*Math.sin(t*9+.9*Math.cos(a*2))*Math.sin(t*Math.PI);const width=.026+.018*Math.sin(a)**2,y=1.304+width*(t-.5)-.041*front+.004*Math.sin(a*3)*Math.sin(t*Math.PI)+.012*(1-front)*t*t,z=(rz-inset+fold)*Math.sin(a),x=-.040+(.146-.016*t-inset+fold+.002*front*Math.sin(a*9+t*5))*Math.cos(a);p.push(x,y,z);}for(let side=0;side<2;side++)for(let j=0;j<rows-1;j++)for(let i=0;i<n;i++){const a=side*count+j*n+i,b=side*count+j*n+(i+1)%n,c=b+n,d=a+n;if(side)ix.push(a,b,d,b,c,d);else ix.push(a,d,b,b,d,c);}for(let i=0;i<n;i++){const a=i,b=(i+1)%n,c=(rows-1)*n+i,d=(rows-1)*n+(i+1)%n;ix.push(a,b,a+count,b,b+count,a+count,c,c+count,d,d,c+count,d+count);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();return g;}

// Follow the real garment surface, including its V rim, with a small cloth
// clearance. These closed ribbons carry the painted ends instead of the chest.
const clothMeshes=geometries.filter(p=>/shirt|waistcoat/.test(p.name)).map(({g})=>new THREE.Mesh(g,new THREE.MeshBasicMaterial({side:THREE.DoubleSide})));
const clothRay=new THREE.Raycaster();
function clothFront(y,z){clothRay.set(new THREE.Vector3(.5,y,z),new THREE.Vector3(-1,0,0));return clothRay.intersectObjects(clothMeshes)[0]?.point.x??.11;}
const wrap=scarfWrap();const wp=wrap.attributes.position;for(let i=0;i<wp.count;i++)wp.setXYZ(i,-.04+(wp.getX(i)+.04)*.85,1.275+(wp.getY(i)-1.285)*.8,wp.getZ(i)*.82);wrap.computeVertexNormals();add('fitted neckerchief wrap',wrap);
function scarfEnd(side){const p=[],ix=[],n=8,rows=9;for(let j=0;j<rows;j++){const t=(j+.35)/(rows-.3),y=1.242-.104*t,z=side*(.016+.044*t),width=(.010+.016*Math.sin(t*Math.PI))*(1-Math.pow(t,3)*.95);for(let i=0;i<n;i++){const a=i*2*Math.PI/n,zz=z+width*Math.cos(a);p.push(clothFront(y,zz)+.008+(.004+.004*Math.sin(t*Math.PI))*(1+Math.sin(a)),y,zz);}}for(let j=0;j<rows-1;j++)for(let i=0;i<n;i++){const a=j*n+i,b=j*n+(i+1)%n,c=b+n,d=a+n;ix.push(a,b,d,b,c,d);}for(const end of [0,1]){const row=end?rows-1:0,index=p.length/3;let x=0,z=0;for(let i=0;i<n;i++){x+=p[(row*n+i)*3]/n;z+=p[(row*n+i)*3+2]/n;}p.push(x,end?1.138:1.244,z);for(let i=0;i<n;i++){const a=row*n+i,b=row*n+(i+1)%n;ix.push(...(end?[index,a,b]:[index,b,a]));}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));for(let i=0;i<ix.length;i+=3)[ix[i+1],ix[i+2]]=[ix[i+2],ix[i+1]];g.setIndex(ix);g.computeVertexNormals();return g;}
// Weld the parametric sphere seam/poles before reduction/manifold validation.
function scarfKnot(){const p=[],ix=[],n=12,rows=7;for(let j=1;j<rows;j++){const t=j*Math.PI/rows;for(let i=0;i<n;i++){const a=i*2*Math.PI/n,fold=1+.08*Math.cos(a*3);p.push(.120+.011*Math.sin(t)*Math.cos(a)*fold,1.254+.028*Math.cos(t),.026*Math.sin(t)*Math.sin(a)*(1-.18*Math.sin(t)**6));}}for(let j=0;j<rows-2;j++)for(let i=0;i<n;i++){const a=j*n+i,b=j*n+(i+1)%n;ix.push(a,b,a+n,b,b+n,a+n);}const top=p.length/3;p.push(.120,1.282,0,.120,1.226,0);for(let i=0;i<n;i++){const next=(i+1)%n;ix.push(top,next,i,top+1,(rows-2)*n+i,(rows-2)*n+next);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();return g;}
// Extend only the knot's hidden rear half to meet the wrap. Its painted front,
// tails and the approved character silhouette stay in place.
const knot=scarfKnot(),kp=knot.attributes.position;
for(let i=0;i<kp.count;i++){const back=1-smooth(kp.getX(i),.110,.126),upper=smooth(kp.getY(i),1.238,1.258);kp.setX(i,kp.getX(i)-.035*back*upper);}
knot.computeVertexNormals();add('neckerchief knot',knot);for(const side of [-1,1])add('neckerchief end '+side,scarfEnd(side));

const order=['connected shirt and sleeves','connected overalls seat and legs','forearm and hand -1','furry rabbit foot -1','forearm and hand 1','furry rabbit foot 1','unified rabbit skull and leaf ears','rabbit tail','fitted neckerchief wrap','neckerchief knot','neckerchief end -1','neckerchief end 1'];geometries.sort((a,b)=>order.indexOf(a.name)-order.indexOf(b.name));

function reduce(name,g,target,tolerance){const positions=g.attributes.position.array;let [indices,error]=simplify.simplify(new Uint32Array(g.index.array),positions,3,Math.min(target*3,g.index.count),tolerance,['ErrorAbsolute']);const faces=new Map();for(let i=0;i<indices.length;i+=3){const key=Array.from(indices.subarray(i,i+3)).sort((a,b)=>a-b).join(':');if(!faces.has(key))faces.set(key,[]);faces.get(key).push(i);}const clean=[];for(const v of faces.values())if(v.length===1)clean.push(...indices.subarray(v[0],v[0]+3));indices=new Uint32Array(clean);
 const [remap,count]=simplify.compactMesh(indices),position=new Float32Array(count*3),normal=new Float32Array(count*3);for(let i=0;i<remap.length;i++)if(remap[i]!==0xffffffff){position.set(positions.subarray(i*3,i*3+3),remap[i]*3);normal.set(g.attributes.normal.array.subarray(i*3,i*3+3),remap[i]*3);}return {name,position:Array.from(position,v=>+v.toFixed(7)),normal:Array.from(normal,v=>+v.toFixed(6)),index:Array.from(indices),triangles:indices.length/3,sourceTriangles:g.index.count/3,errorWorld:error};}
const author=geometries.map(({name,g})=>reduce(name,g,name.includes('skull')?7200:name.includes('tail')?360:name.includes('foot')?850:10000,.006));
function save(file,parts,sourceTriangles){const data={schema:1,species:'rabbit',source:'Female rabbit worker: leaf ears, short muzzle, broad furry feet and compact tail; shared worker rig',sourceTriangles,triangles:parts.reduce((n,p)=>n+p.triangles,0),parts};fs.writeFileSync(new URL('../dist/tactics/'+file,import.meta.url),JSON.stringify(data)+'\n');console.log(file,data.triangles,parts.map(p=>[p.name,p.triangles,p.errorWorld]));return data;}
const high=save('rabbit-author-data.json',author,geometries.reduce((n,p)=>n+p.g.index.count/3,0));
const low=author.map(p=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p.position,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(p.normal,3));g.setIndex(p.index);const target=p.name.includes('neckerchief wrap')?224:p.name.includes('neckerchief knot')?80:p.name.includes('neckerchief end')?72:p.name.includes('shirt')?1650:p.name.includes('overalls')?2550:p.name.includes('skull')?2490:p.name.includes('tail')?180:p.name.includes('foot')?420:1000;const result=reduce(p.name,g,target,p.name.includes('forearm')?.006:p.name.includes('foot')?.006:.015);g.dispose();return result;});
save('rabbit-10k-data.json',low,high.triangles);for(const {g} of geometries)g.dispose();
