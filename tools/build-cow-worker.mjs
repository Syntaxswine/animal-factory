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
 let d=E(x,y,z,[-.069,1.296,0],[.093,.131,.089]);
 d=blend(d,E(x,y,z,[-.029,1.476,0],[.100,.110,.098]),.024);
 d=blend(d,E(x,y,z,[.008,1.416,0],[.094,.073,.091]),.021);
 d=blend(d,C(x,y,z,[.047,1.467,0],[.155,1.421,0],.063,.053),.018);
 d=blend(d,E(x,y,z,[.157,1.420,0],[.069,.044,.083]),.016);
 d=blend(d,E(x,y,z,[.120,1.391,0],[.076,.029,.070]),.008);
 for(const s of [-1,1]){
  // Wide leaf ears on the hornless poll, with a shallow inner bowl.
  d=blend(d,E(x,y-.12*(Math.abs(z)-.10),z,[-.069,1.487,s*.148],[.047,.044,.084]),.016);
  d=-blend(-d,E(x,y-.12*(Math.abs(z)-.10),z,[-.013,1.492,s*.165],[.022,.030,.058]),.007);
  d=blend(d,E(x,y,z,[.008,1.427,s*.067],[.052,.046,.023]),.030);
  // Integrated open eye surface inside a shallow socket; paint supplies the iris.
  d=blend(d,E(x,y,z,[.034,1.460,s*.070],[.040,.030,.012]),.044);
  d=blend(d,E(x,y,z,[.032,1.484,s*.078],[.036,.012,.012]),.022);
  d=-blend(-d,E(x,y,z,[.205,1.430,s*.057],[.019,.011,.015]),.004);
 }
 // Restrained horizontal lip groove; the painted nose supplies finer anatomy.
 d+=.003*Math.exp(-(((y-1.397)/.004)**2))*THREE.MathUtils.smoothstep(x,.155,.21);
 // A few short rooted locks make the hornless poll distinct in silhouette.
 d=blend(d,E(x,y,z,[-.015,1.592,0],[.040,.020,.033]),.012);
 d=blend(d,C(x,y,z,[-.008,1.582,-.010],[.041,1.586,-.026],.026,.004),.010);
 d=blend(d,C(x,y,z,[-.025,1.583,.018],[.017,1.590,.033],.023,.004),.010);
 return d;
}
const skull=sculptSurface(head,[-.23,1.10,-.26],[.27,1.70,.26],.0055);skull.computeBoundingBox();const top=skull.boundingBox.max.y,p=skull.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i),neck=(1-smooth(y,1.34,1.40)),face=smooth(y,1.32,1.39);p.setXYZ(i,-.04+(p.getX(i)+.04)*(1+.10*face-.10*neck),y+1.60-top,p.getZ(i)*(1+.10*face-.10*neck));}skull.computeVertexNormals();add('unified cow skull ears and forehead tuft',skull);
const tailPath=new THREE.CubicBezierCurve3(new THREE.Vector3(-.18,.90,0),new THREE.Vector3(-.28,.78,0),new THREE.Vector3(-.255,.54,.032),new THREE.Vector3(-.295,.397,.04)).getPoints(22).map(p=>p.toArray());
add('cow tail',sculptSurface((x,y,z)=>{let d=Infinity;for(let i=0;i<22;i++)d=Math.min(d,C(x,y,z,tailPath[i],tailPath[i+1],.020-i*.00045,.020-(i+1)*.00045));d=blend(d,E(x,y,z,[-.302,.348,.041],[.047,.075,.043]),.012);for(const [zz,yy,xx] of [[.010,.269,-.321],[.044,.242,-.301],[.074,.263,-.286]])d=blend(d,C(x,y,z,[-.302,.33,zz],[xx,yy,zz],.023,.0035),.011);return d;},[-.37,.22,-.05],[-.15,.94,.10],.0055));
for(const s of [-1,1])add('exposed cloven hoof '+s,sculptSurface((x,y,z)=>{const zz=z-s*.232,t=THREE.MathUtils.clamp(y/.098,0,1),rx=.089-.025*t,rz=.076-.019*t,cx=.006-.023*t;let d=Math.max((Math.hypot((x-cx)/rx,zz/rz)-1)*Math.min(rx,rz),-y,y-.098);const cleft=Math.max(Math.abs(zz)-.006,.011-x,y-.079);d=Math.max(d,-cleft);return blend(d,C(x,y,zz,[-.018,.107,0],[-.034,.203,0],.053,.067),.008);},[-.12,-.013,s*.232-.10],[.12,.29,s*.232+.10],.008));
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

const order=['connected shirt and sleeves','connected overalls seat and legs','forearm and hand -1','exposed cloven hoof -1','forearm and hand 1','exposed cloven hoof 1','unified cow skull ears and forehead tuft','cow tail','fitted neckerchief wrap','neckerchief knot','neckerchief end -1','neckerchief end 1'];geometries.sort((a,b)=>order.indexOf(a.name)-order.indexOf(b.name));

function reduce(name,g,target,tolerance){const positions=g.attributes.position.array;let [indices,error]=simplify.simplify(new Uint32Array(g.index.array),positions,3,Math.min(target*3,g.index.count),tolerance,['ErrorAbsolute']);const faces=new Map();for(let i=0;i<indices.length;i+=3){const key=Array.from(indices.subarray(i,i+3)).sort((a,b)=>a-b).join(':');if(!faces.has(key))faces.set(key,[]);faces.get(key).push(i);}const clean=[];for(const v of faces.values())if(v.length===1)clean.push(...indices.subarray(v[0],v[0]+3));indices=new Uint32Array(clean);
 const [remap,count]=simplify.compactMesh(indices),position=new Float32Array(count*3),normal=new Float32Array(count*3);for(let i=0;i<remap.length;i++)if(remap[i]!==0xffffffff){position.set(positions.subarray(i*3,i*3+3),remap[i]*3);normal.set(g.attributes.normal.array.subarray(i*3,i*3+3),remap[i]*3);}return {name,position:Array.from(position,v=>+v.toFixed(7)),normal:Array.from(normal,v=>+v.toFixed(6)),index:Array.from(indices),triangles:indices.length/3,sourceTriangles:g.index.count/3,errorWorld:error};}
const author=geometries.map(({name,g})=>reduce(name,g,name.includes('skull')?7140:name.includes('tail')?550:name.includes('hoof')?800:10000,.006));
function save(file,parts,sourceTriangles){const data={schema:1,species:'cow',source:'Hornless female cow worker: distinct skull, waist/hip silhouette, fitted scarf and cloven hooves; shared worker rig',sourceTriangles,triangles:parts.reduce((n,p)=>n+p.triangles,0),parts};fs.writeFileSync(new URL('../dist/tactics/'+file,import.meta.url),JSON.stringify(data)+'\n');console.log(file,data.triangles,parts.map(p=>[p.name,p.triangles,p.errorWorld]));return data;}
const high=save('cow-author-data.json',author,geometries.reduce((n,p)=>n+p.g.index.count/3,0));
const low=author.map(p=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p.position,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(p.normal,3));g.setIndex(p.index);const target=p.name.includes('neckerchief wrap')?224:p.name.includes('neckerchief knot')?80:p.name.includes('neckerchief end')?72:p.name.includes('shirt')?1650:p.name.includes('overalls')?2550:p.name.includes('skull')?2460:p.name.includes('tail')?280:p.name.includes('hoof')?400:1000;const result=reduce(p.name,g,target,p.name.includes('forearm')?.006:p.name.includes('hoof')?.006:.015);g.dispose();return result;});
save('cow-10k-data.json',low,high.triangles);for(const {g} of geometries)g.dispose();
