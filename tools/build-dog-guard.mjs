import fs from 'node:fs';
import {createRequire} from 'node:module';
import * as THREE from '../dist/tactics/vendor/three.module.js';
import {blend,ellipsoid as E,tapered as C,sculptSurface} from '../dist/tactics/grey-surface.js';
const simplify=createRequire(import.meta.url)('./vendor/meshoptimizer/meshopt_simplifier.cjs');await simplify.ready;
const base=JSON.parse(fs.readFileSync(new URL('../dist/tactics/horse-light-data.json',import.meta.url)));
const geometries=[];function add(name,g){geometries.push({name,g});}
// Retain the accepted shared hand silhouette with slightly slimmer forearms.
const smooth=THREE.MathUtils.smoothstep;
for(const part of base.parts){if(/skull|mane|hoof|shirt|overalls/.test(part.name))continue;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(part.position,3));g.setIndex(part.index);const p=g.attributes.position;
 for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);const t=THREE.MathUtils.clamp((.991-y)/.249,0,1),cx=.022+.039*t,cz=Math.sign(z)*(.344+.011*t),w=.13*smooth(y,.77,.83)*(1-smooth(y,.96,1.015));p.setXYZ(i,cx+(x-cx)*(1-w),y,cz+(z-cz)*(1-w));}
 g.computeVertexNormals();add(part.name,g);
}
// Connected work jacket with a real hem, lapels and rolled sleeves.
function jacket(x,y,z){
 let d=blend(E(x,y,z,[-.025,1.075,0],[.155,.216,.216]),E(x,y,z,[-.04,1.205,0],[.139,.067,.198]),.045);
 const flare=THREE.MathUtils.clamp((.94-y)/.12,0,1);
 const radial=(Math.hypot((x+.025)/(.167+.025*flare),z/(.218+.022*flare))-1)*.167;
 const hem=-blend(-radial,-(.817-y),.009);
 d=THREE.MathUtils.lerp(d,hem,1-smooth(y,.98,1.12));
 d=blend(d,E(x,y,z,[-.067,1.254,0],[.105,.037,.107]),.012);
 for(const side of [-1,1]){
  d=blend(d,C(x,y,z,[-.045,1.191,side*.205],[.012,1.005,side*.335],.078,.080),.035);
  d=blend(d,C(x,y,z,[.012,1.035,side*.322],[.023,.993,side*.344],.082,.082),.010);
 }
 const sleeve=Math.exp(-1*((Math.abs(z)-.32)/.08)**2-((y-1.03)/.11)**2);
 d+=.0035*Math.sin((y-1)*45+Math.abs(z)*12)*sleeve;
 // Short front/rear hem splits; the rear one frames the tail root.
 if(y<.870){const split=Math.max(Math.abs(z)-(.004+(.865-y)*.28),y-.865, .08-Math.abs(x+.035));d=-blend(-d,split,.004);}
 return d;
}
add('connected jacket shirt and sleeves',sculptSurface(jacket,[-.26,.76,-.47],[.25,1.34,.47],.007));
function trousers(x,y,z){
 let d=blend(E(x,y,z,[-.035,.78,0],[.178,.153,.219]),E(x,y,z,[-.035,.88,0],[.162,.08,.205]),.035);
 for(const side of [-1,1]){
  d=blend(d,C(x,y,z,[-.03,.77,side*.12],[.024,.475,side*.196],.128,.102),.045);
  d=blend(d,C(x,y,z,[.024,.475,side*.196],[-.035,.225,side*.232],.102,.085),.04);
  const local=z-side*.205,face=Math.exp(-1*((x-.09)/.07)**2-1*(local/.105)**2);
  d+=.005*Math.exp(-1*((y-.465-side*local*.32)/.015)**2)*face;
  d-=.004*Math.exp(-1*((y-.435+side*local*.22)/.020)**2)*face;
 }
 return d;
}
add('connected trousers seat and legs',sculptSurface(trousers,[-.25,.12,-.36],[.23,1.00,.36],.007));
function head(x,y,z){
 let d=E(x,y,z,[-.067,1.296,0],[.092,.138,.090]);
 d=blend(d,E(x,y,z,[-.031,1.447,0],[.102,.113,.100]),.026);
 d=blend(d,E(x,y,z,[-.015,1.396,0],[.094,.076,.112]),.025);
 d=blend(d,C(x,y,z,[.032,1.443,0],[.177,1.404,0],.061,.044),.024);
 d=blend(d,E(x,y,z,[.182,1.408,0],[.037,.026,.046]),.012);
 d=blend(d,E(x,y,z,[.110,1.376,0],[.087,.029,.057]),.018);
 for(const side of [-1,1]){
  // Broad triangular ears with their interior supplied by paint.
  const t=THREE.MathUtils.clamp((y-1.50)/.20,0,1),zz=z-side*(.076+.035*t),xx=x+.057+.015*t;
  const ear=E(xx,y,zz,[0,1.588,0],[.027*(1-.65*t),.110,.069*(1-.75*t)]);
  d=blend(d,ear,.025);
  // Cheek ruff joins skull and neck, not separate hair beads.
  d=blend(d,C(x,y,z,[-.045,1.420,side*.078],[-.093,1.355,side*.102],.049,.017),.023);
 }
 d+=.0025*Math.exp(-1*((y-1.385)/.004)**2)*smooth(x,.12,.19);
 return d;
}
add('unified dog skull and upright ears',sculptSurface(head,[-.23,1.10,-.21],[.24,1.73,.21],.0045));
const path=new THREE.CubicBezierCurve3(new THREE.Vector3(-.182,.875,0),new THREE.Vector3(-.31,.85,0),new THREE.Vector3(-.40,.56,.025),new THREE.Vector3(-.35,.36,.04)).getPoints(24);
add('dog tail',sculptSurface((x,y,z)=>{let d=Infinity;for(let i=0;i<24;i++){const t=i/24,r=.034+.045*Math.sin(Math.PI*t)-.025*t;d=Math.min(d,C(x,y,z,path[i].toArray(),path[i+1].toArray(),r,Math.max(.008,r-.004)));}return d;},[-.50,.33,-.11],[-.12,.94,.13],.0055));
for(const side of [-1,1])add('furry dog foot '+side,sculptSurface((x,y,z)=>{
 const zz=z-side*.232;let d=E(x,y,zz,[.015,.062,0],[.119,.063,.090]);
 d=blend(d,C(x,y,zz,[-.035,.083,0],[-.034,.203,0],.052,.065),.015);
 for(const toe of [-1.5,-.5,.5,1.5])d=blend(d,E(x,y,zz,[.100+(Math.abs(toe)<1?.010:0),.043,toe*.038],[.047,.037,.026]),.008);
 return Math.max(d,-y);
},[-.13,-.01,side*.232-.12],[.18,.29,side*.232+.12],.006));
for(const {name,g} of geometries)if(name.includes('foot')){const p=g.attributes.position;for(let i=0;i<p.count;i++)if(p.getY(i)<.003)p.setY(i,0);g.computeVertexNormals();}
// Low rounded leather pouches sit against the front-side hip, outside carry hands.
for(const side of [-1,1])add('utility pouch '+side,sculptSurface((x,y,z)=>{
 const xx=x-.112,zz=z-side*.190,t=smooth(y,.82,.91);
 const q=[Math.abs(xx)-.023,Math.abs(y-.883)-.047,Math.abs(zz)-(.034+.009*t)];
 let d=Math.hypot(...q.map(v=>Math.max(v,0)))+Math.min(Math.max(...q),0)-.014;
 d=blend(d,E(x,y,zz,[.144,.925,0],[.014,.027,.052]),.004);
 return d;
},[.05,.79,side*.190-.08],[.18,.97,side*.190+.08],.0045));
const beltPositions=[],beltIndices=[],beltSides=48;
function jacketRadius(a,y){let r=.02;while(r<.34&&jacket(-.025+r*Math.cos(a),y,r*Math.sin(a))<0)r+=.003;let lo=r-.003,hi=r;for(let i=0;i<12;i++){const m=(lo+hi)/2;if(jacket(-.025+m*Math.cos(a),y,m*Math.sin(a))<0)lo=m;else hi=m;}return (lo+hi)/2;}
for(let row=0;row<6;row++)for(let i=0;i<beltSides;i++){const a=i*2*Math.PI/beltSides,inner=row>2,y=[.920,.941,.962,.962,.941,.920][row],r=jacketRadius(a,y)+(inner?-.005:.010);beltPositions.push(-.025+r*Math.cos(a),y,r*Math.sin(a));}
for(let row=0;row<6;row++)for(let i=0;i<beltSides;i++){const a=row*beltSides+i,b=row*beltSides+(i+1)%beltSides,c=((row+1)%6)*beltSides+(i+1)%beltSides,d=((row+1)%6)*beltSides+i;beltIndices.push(a,d,b,b,d,c);}
const belt=new THREE.BufferGeometry();belt.setAttribute('position',new THREE.Float32BufferAttribute(beltPositions,3));belt.setIndex(beltIndices);belt.computeVertexNormals();add('utility belt',belt);
function jacketFront(y,z){let x=.32;while(x>-.2&&jacket(x,y,z)>0)x-=.002;let lo=x,hi=x+.002;for(let i=0;i<12;i++){const m=(lo+hi)/2;if(jacket(m,y,z)<0)lo=m;else hi=m;}return (lo+hi)/2;}
for(const side of [-1,1]){
 const vertices=[],indices=[],lookup=new Map(),n=4,tri=[[.062,1.277],[.147,1.241],[.068,1.187]];
 for(let i=0;i<=n;i++)for(let j=0;j<=n-i;j++){const u=i/n,v=j/n,w=1-u-v,z=side*(tri[0][0]*w+tri[1][0]*u+tri[2][0]*v),y=tri[0][1]*w+tri[1][1]*u+tri[2][1]*v;lookup.set(i+':'+j,vertices.length/3);vertices.push(jacketFront(y,z)+.009+.004*Math.sin(u*Math.PI)*Math.sin(v*Math.PI),y,z);}
 for(let i=0;i<n;i++)for(let j=0;j<n-i;j++){const a=lookup.get(i+':'+j),b=lookup.get((i+1)+':'+j),c=lookup.get(i+':'+(j+1));indices.push(...(side>0?[a,c,b]:[a,b,c]));if(j<n-i-1){const d=lookup.get((i+1)+':'+(j+1));indices.push(...(side>0?[b,c,d]:[b,d,c]));}}
 const count=vertices.length/3,front=indices.slice(),edges=new Map();for(let i=0;i<front.length;i+=3)for(let k=0;k<3;k++){const a=front[i+k],b=front[i+(k+1)%3],key=Math.min(a,b)+':'+Math.max(a,b);if(edges.has(key))edges.delete(key);else edges.set(key,[a,b]);}
 for(let i=0;i<count;i++)vertices.push(jacketFront(vertices[i*3+1],vertices[i*3+2])-.004,vertices[i*3+1],vertices[i*3+2]);
 for(let i=0;i<front.length;i+=3)indices.push(front[i]+count,front[i+2]+count,front[i+1]+count);
 for(const [a,b] of edges.values())indices.push(a,b+count,b,a,a+count,b+count);
 for(let i=0;i<indices.length;i+=3)[indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();add('collar flap '+side,g);
}
function scarfWrap(){const p=[],ix=[],n=32,rows=5,count=n*rows;for(let side=0;side<2;side++)for(let j=0;j<rows;j++)for(let i=0;i<n;i++){const t=j/(rows-1),a=i*2*Math.PI/n,inset=side?.006:0,front=Math.pow(Math.max(0,Math.cos(a)),3),rx=.145-.006*t,rz=.160-.018*t;const fold=.002*Math.sin(t*Math.PI)+.003*Math.sin(t*9+.9*Math.cos(a*2))*Math.sin(t*Math.PI);const width=.026+.018*Math.sin(a)**2,y=1.304+width*(t-.5)-.041*front+.004*Math.sin(a*3)*Math.sin(t*Math.PI)+.012*(1-front)*t*t,z=(rz-inset+fold)*Math.sin(a),x=-.040+(.146-.016*t-inset+fold+.002*front*Math.sin(a*9+t*5))*Math.cos(a);p.push(x,y,z);}for(let side=0;side<2;side++)for(let j=0;j<rows-1;j++)for(let i=0;i<n;i++){const a=side*count+j*n+i,b=side*count+j*n+(i+1)%n,c=b+n,d=a+n;if(side)ix.push(a,b,d,b,c,d);else ix.push(a,d,b,b,d,c);}for(let i=0;i<n;i++){const a=i,b=(i+1)%n,c=(rows-1)*n+i,d=(rows-1)*n+(i+1)%n;ix.push(a,b,a+count,b,b+count,a+count,c,c+count,d,d,c+count,d+count);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();return g;}

// Follow the real garment surface, including its V rim, with a small cloth
// clearance. These closed ribbons carry the painted ends instead of the chest.
const clothMeshes=geometries.filter(p=>/shirt|waistcoat/.test(p.name)).map(({g})=>new THREE.Mesh(g,new THREE.MeshBasicMaterial({side:THREE.DoubleSide})));
const clothRay=new THREE.Raycaster();
function clothFront(y,z){clothRay.set(new THREE.Vector3(.5,y,z),new THREE.Vector3(-1,0,0));return clothRay.intersectObjects(clothMeshes)[0]?.point.x??.11;}
const wrap=scarfWrap();const wp=wrap.attributes.position;for(let i=0;i<wp.count;i++){
 const x=(wp.getX(i)+.04)*.85,y=1.275+(wp.getY(i)-1.285)*.8,z=wp.getZ(i)*.82,a=Math.atan2(z,x);
 let r=.015;while(r<.28&&Math.min(jacket(-.04+r*Math.cos(a),y,r*Math.sin(a)),head(-.04+r*Math.cos(a),y,r*Math.sin(a)))<0)r+=.0005;
 r=Math.max(Math.hypot(x,z),r+(i<160?.006:.001));wp.setXYZ(i,-.04+r*Math.cos(a),y,r*Math.sin(a));
}wrap.computeVertexNormals();add('fitted neckerchief wrap',wrap);
function scarfEnd(side){const p=[],ix=[],n=8,rows=9;for(let j=0;j<rows;j++){const t=(j+.35)/(rows-.3),y=1.242-.104*t,z=side*(.016+.044*t),width=(.010+.016*Math.sin(t*Math.PI))*(1-Math.pow(t,3)*.95);for(let i=0;i<n;i++){const a=i*2*Math.PI/n,zz=z+width*Math.cos(a);p.push(clothFront(y,zz)+.008+(.004+.004*Math.sin(t*Math.PI))*(1+Math.sin(a)),y,zz);}}for(let j=0;j<rows-1;j++)for(let i=0;i<n;i++){const a=j*n+i,b=j*n+(i+1)%n,c=b+n,d=a+n;ix.push(a,b,d,b,c,d);}for(const end of [0,1]){const row=end?rows-1:0,index=p.length/3;let x=0,z=0;for(let i=0;i<n;i++){x+=p[(row*n+i)*3]/n;z+=p[(row*n+i)*3+2]/n;}p.push(x,end?1.138:1.244,z);for(let i=0;i<n;i++){const a=row*n+i,b=row*n+(i+1)%n;ix.push(...(end?[index,a,b]:[index,b,a]));}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));for(let i=0;i<ix.length;i+=3)[ix[i+1],ix[i+2]]=[ix[i+2],ix[i+1]];g.setIndex(ix);g.computeVertexNormals();return g;}
// Weld the parametric sphere seam/poles before reduction/manifold validation.
function scarfKnot(){const p=[],ix=[],n=12,rows=7;for(let j=1;j<rows;j++){const t=j*Math.PI/rows;for(let i=0;i<n;i++){const a=i*2*Math.PI/n,fold=1+.08*Math.cos(a*3);p.push(.120+.011*Math.sin(t)*Math.cos(a)*fold,1.254+.028*Math.cos(t),.026*Math.sin(t)*Math.sin(a)*(1-.18*Math.sin(t)**6));}}for(let j=0;j<rows-2;j++)for(let i=0;i<n;i++){const a=j*n+i,b=j*n+(i+1)%n;ix.push(a,b,a+n,b,b+n,a+n);}const top=p.length/3;p.push(.120,1.282,0,.120,1.226,0);for(let i=0;i<n;i++){const next=(i+1)%n;ix.push(top,next,i,top+1,(rows-2)*n+i,(rows-2)*n+next);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();return g;}
// Extend only the knot's hidden rear half to meet the wrap. Its painted front,
// tails and the approved character silhouette stay in place.
const knot=scarfKnot(),kp=knot.attributes.position;
for(let i=0;i<kp.count;i++){const back=1-smooth(kp.getX(i),.110,.126),upper=smooth(kp.getY(i),1.238,1.258);kp.setX(i,kp.getX(i)-.035*back*upper);}
knot.computeVertexNormals();add('neckerchief knot',knot);for(const side of [-1,1])add('neckerchief end '+side,scarfEnd(side));

const order=['connected jacket shirt and sleeves','connected trousers seat and legs','forearm and hand -1','furry dog foot -1','forearm and hand 1','furry dog foot 1','unified dog skull and upright ears','dog tail','fitted neckerchief wrap','neckerchief knot','neckerchief end -1','neckerchief end 1','utility pouch -1','utility pouch 1','utility belt','collar flap -1','collar flap 1'];geometries.sort((a,b)=>order.indexOf(a.name)-order.indexOf(b.name));

function reduce(name,g,target,tolerance){const positions=g.attributes.position.array;let [indices,error]=simplify.simplify(new Uint32Array(g.index.array),positions,3,Math.min(target*3,g.index.count),tolerance,['ErrorAbsolute']);const faces=new Map();for(let i=0;i<indices.length;i+=3){const key=Array.from(indices.subarray(i,i+3)).sort((a,b)=>a-b).join(':');if(!faces.has(key))faces.set(key,[]);faces.get(key).push(i);}const clean=[];for(const v of faces.values())if(v.length===1)clean.push(...indices.subarray(v[0],v[0]+3));indices=new Uint32Array(clean);
 const [remap,count]=simplify.compactMesh(indices),position=new Float32Array(count*3),normal=new Float32Array(count*3);for(let i=0;i<remap.length;i++)if(remap[i]!==0xffffffff){position.set(positions.subarray(i*3,i*3+3),remap[i]*3);normal.set(g.attributes.normal.array.subarray(i*3,i*3+3),remap[i]*3);}return {name,position:Array.from(position,v=>+v.toFixed(7)),normal:Array.from(normal,v=>+v.toFixed(6)),index:Array.from(indices),triangles:indices.length/3,sourceTriangles:g.index.count/3,errorWorld:error};}
const author=geometries.map(({name,g})=>reduce(name,g,name.includes('skull')?5950:name.includes('tail')?1200:name.includes('belt')?576:name.includes('pouch')?350:name.includes('foot')?700:name.includes('shirt')?4700:name.includes('trousers')?5500:5000,.006));
function save(file,parts,sourceTriangles){const data={schema:1,species:'dog',source:'Female shepherd dog guard: collared jacket, paired utility pouches, tapered muzzle, upright ears and hanging tail; shared worker rig',sourceTriangles,triangles:parts.reduce((n,p)=>n+p.triangles,0),parts};fs.writeFileSync(new URL('../dist/tactics/'+file,import.meta.url),JSON.stringify(data)+'\n');console.log(file,data.triangles,parts.map(p=>[p.name,p.triangles,p.errorWorld]));return data;}
const high=save('dog-guard-author-data.json',author,geometries.reduce((n,p)=>n+p.g.index.count/3,0));
const low=author.map(p=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p.position,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(p.normal,3));g.setIndex(p.index);const target=p.name.includes('neckerchief wrap')?224:p.name.includes('neckerchief knot')?80:p.name.includes('neckerchief end')?72:p.name.includes('shirt')?1800:p.name.includes('trousers')?2120:p.name.includes('skull')?2250:p.name.includes('tail')?500:p.name.includes('belt')?256:p.name.includes('pouch')?150:p.name.includes('foot')?330:1000;const result=reduce(p.name,g,target,p.name.includes('forearm')?.006:p.name.includes('foot')?.006:.015);g.dispose();return result;});
save('dog-guard-10k-data.json',low,high.triangles);for(const {g} of geometries)g.dispose();
