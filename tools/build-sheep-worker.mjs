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
 const hem=.86;
 d=edge(d,hem-y-Math.max(0,abs(z)-.245)*9);
 const sleeves=Math.exp(-1*((abs(z)-.32)/.07)**2)*Math.exp(-1*((y-1.035)/.08)**2);
 d+=.003*Math.sin(y*47+abs(z)*18)*sleeves;
 return d;
}
add('connected shirt and sleeves',sculptSurface(shirt,[-.25,.80,-.48],[.23,1.34,.48],.0058));

function torso(x,y,z){let d=blend(E(x,y,z,[-.022,1.082,0],[.183,.202,.250]),E(x,y,z,[-.04,1.221,0],[.145,.068,.216]),.035);return blend(d,E(x,y,z,[-.012,.965,0],[.177,.210,.233]),.036);}
function coatMesh(){
 const n=96,m=40,p=[],ix=[];
 function point(a,t,layer){const front=smooth(Math.cos(a),.05,.65),hem=.871-.055*Math.exp(-1*((Math.abs(Math.sin(a))-.43)/.23)**2)*front,neck=1.292-.120*Math.pow(Math.max(0,Math.cos(a)),1.4),y=hem+(neck-hem)*t;
 let lo=0,hi=.40;const yy=Math.max(y-.024*smooth(y,1.19,1.27),.916);for(let j=0;j<18;j++){const r=(lo+hi)/2;if(torso(-.018+r*Math.cos(a),yy,r*Math.sin(a))<0)lo=r;else hi=r;}
 const shoulder=smooth(y,1.15,1.23)*Math.pow(Math.abs(Math.sin(a)),4)*.027;const r=(lo+hi)/2+shoulder+(layer?-.005:.012);return[-.018+r*Math.cos(a),y,r*Math.sin(a)];}
 const normals=[];
 for(let layer=0;layer<2;layer++)for(let j=0;j<=m;j++)for(let i=0;i<n;i++){const a=i*Math.PI*2/n,t=j/m;p.push(...point(a,t,layer));const u=new THREE.Vector3(...point(a+.0001,t,layer)).sub(new THREE.Vector3(...point(a-.0001,t,layer))),v=new THREE.Vector3(...point(a,t+.0001,layer)).sub(new THREE.Vector3(...point(a,t-.0001,layer)));const normal=new THREE.Vector3().crossVectors(v,u).normalize().multiplyScalar(layer?-1:1);if(j===0||j===m){const inward=new THREE.Vector3(-Math.cos(a),0,-Math.sin(a)),cap=new THREE.Vector3().crossVectors(inward,u).normalize().multiplyScalar(j===m?1:-1);normal.multiplyScalar(.75).addScaledVector(cap,.75).normalize();}normals.push(...normal.toArray());}
 const count=n*(m+1),outer=[],edges=new Map();
 // Enclosed lateral armholes preserve the olive bridge over each shoulder.
 function hole(i){const x=p[i*3],y=p[i*3+1],z=p[i*3+2];return Math.abs(z)>.13&&((x+.025)/.114)**2+((y-1.121)/.090)**2<1;}
 for(let j=0;j<m;j++)for(let i=0;i<n;i++){const a=j*n+i,b=j*n+(i+1)%n,c=b+n,d=a+n;if([a,b,c,d].some(hole))continue;outer.push([a,d,b],[b,d,c]);}
 for(const tri of outer){ix.push(...tri,...tri.slice().reverse().map(i=>i+count));for(let k=0;k<3;k++){const a=tri[k],b=tri[(k+1)%3],key=Math.min(a,b)+':'+Math.max(a,b);if(edges.has(key))edges.delete(key);else edges.set(key,[a,b]);}}
 // Relax the stair-step opening boundary on the parametric shell, then bridge
 // outer/inner copies. Top/hem rims remain at their authored positions.
 const holeEdges=[...edges.values()].filter(e=>e.every(i=>i>=n&&i<m*n));
 const neighbors=new Map();for(const [a,b]of holeEdges){for(const [u,v]of [[a,b],[b,a]]){if(!neighbors.has(u))neighbors.set(u,[]);neighbors.get(u).push(v);}}
 for(let pass=0;pass<5;pass++){const updates=[];for(const [i,ns]of neighbors){for(const layer of [0,1]){const q=i+layer*count,pos=p.slice(q*3,q*3+3);for(let k=0;k<3;k++){let avg=0;for(const j of ns)avg+=p[(j+layer*count)*3+k]/ns.length;pos[k]=pos[k]*.35+avg*.65;}updates.push([q,pos]);}}for(const [i,pos]of updates)p.splice(i*3,3,...pos);}
 for(const [a,b]of edges.values())ix.push(b,a,a+count,b,a+count,b+count);
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));g.setIndex(ix);return g;
}
add('fitted waistcoat with pointed hem',coatMesh());
function trousers(x,y,z){let d=blend(E(x,y,z,[-.025,.795,0],[.183,.150,.238]),E(x,y,z,[-.013,.878,0],[.174,.089,.226]),.040);
 for(const s of [-1,1]){d=blend(d,C(x,y,z,[-.03,.77,s*.12],[.024,.475,s*.196],.142,.111),.045);d=blend(d,C(x,y,z,[.024,.475,s*.196],[-.035,.225,s*.232],.111,.09),.035);
 const local=z-s*.205,face=Math.exp(-1*((x-.09)/.07)**2)*Math.exp(-1*(local/.105)**2);d+=.005*Math.exp(-1*((y-.465-s*local*.32)/.015)**2)*face;d-=.004*Math.exp(-1*((y-.435+s*local*.22)/.020)**2)*face;
 d=blend(d,C(x,y,z,[-.032,.203,s*.232],[-.029,.24,s*.232],.096,.099),.007);}
 return edge(d,y-.96,.17-y);
}
add('connected work trousers seat and legs',sculptSurface(trousers,[-.25,.11,-.38],[.24,1.01,.38],.0058));
for(const part of base.parts.filter(p=>p.name.includes('forearm'))){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(part.position,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(part.normal,3));g.setIndex(part.index);const p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),w=smooth(y,.77,.83)*(1-smooth(y,.97,1.02)),n=new THREE.Vector3().fromBufferAttribute(g.attributes.normal,i);const amount=w*(.004+.002*Math.sin(y*63+z*37));p.setXYZ(i,x+n.x*amount,y+n.y*amount,z+n.z*amount);}g.computeVertexNormals();add(part.name,g);}
const wool=[];
// Broad overlapping locks rooted in a continuous cap and neck ruff.
for(let i=0;i<25;i++){const a=i*2.399963,up=.18+.82*(i+.5)/25,rad=Math.sqrt(1-up*up);wool.push([-.045+.101*rad*Math.cos(a),1.536+.073*up,.101*rad*Math.sin(a),.023+(i%4)*.002]);}
for(let i=0;i<34;i++){const a=i*2.399963,up=-.90+1.80*(i+.5)/34,rad=Math.sqrt(1-up*up);if(Math.cos(a)>.42&&up>-.20)continue;wool.push([-.059+.108*rad*Math.cos(a),1.398+.144*up,.119*rad*Math.sin(a),.027+(i%3)*.003]);}
function head(x,y,z){
 let d=blend(E(x,y,z,[-.05,1.36,0],[.116,.117,.123]),E(x,y,z,[-.026,1.485,0],[.117,.130,.105]),.025);
 d=blend(d,E(x,y,z,[.039,1.411,0],[.102,.077,.098]),.025);
 d=blend(d,C(x,y,z,[.050,1.483,0],[.131,1.403,0],.060,.050),.020);
 d=blend(d,E(x,y,z,[.145,1.395,0],[.044,.034,.059]),.014);
 d=blend(d,E(x,y,z,[.099,1.365,0],[.067,.030,.068]),.018);
 for(const side of [-1,1]){
  d=blend(d,E(x,y,z,[.043,1.441,side*.080],[.044,.042,.029]),.013);
  d=blend(d,E(x,y,z,[.050,1.484,side*.086],[.044,.031,.018]),.031);

  // Curved broad leaf outline; a solid soft rim, with interior painted later.
  const zz=z*side,t=clamp((zz-.095)/.18,0,1),centerY=1.516-.070*t+.006*Math.sin(t*Math.PI),centerX=-.025-.108*t+.020*t*t+.012*((y-centerY)/.05)**2*t;
  const width=.008+.050*Math.pow(Math.max(0,Math.sin(Math.PI*t)),.7);
  const leaf=edge(abs(y-centerY)-width,.095-zz,zz-.275,abs(x-centerX)-(.010+.013*Math.sin(Math.PI*t)));
  d=blend(d,leaf,.016);
  d=blend(d,E(x,y,z,[-.037,1.501,side*.111],[.032,.038,.042]),.014);
 }
 d=blend(d,E(x,y,z,[-.046,1.556,0],[.112,.089,.109]),.012);
 d=blend(d,E(x,y,z,[-.072,1.418,0],[.122,.178,.131]),.018);
 for(const [xx,yy,zz,r]of wool)d=blend(d,E(x,y,z,[xx,yy,zz],[r,r*.85,r]),.019);
 return d;
}
const skull=sculptSurface(head,[-.22,1.16,-.30],[.23,1.70,.30],.0045);skull.computeBoundingBox();const top=skull.boundingBox.max.y,p=skull.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,p.getY(i)+1.65-top);add('unified sheep skull ears and wool',skull);
add('short woolly tail',sculptSurface((x,y,z)=>blend(C(x,y,z,[-.18,.854,0],[-.219,.783,0],.042,.031),E(x,y,z,[-.215,.790,0],[.038,.056,.038]),.012),[-.28,.71,-.06],[-.12,.94,.06],.0055));
for(const s of [-1,1])add('exposed cloven hoof '+s,sculptSurface((x,y,z)=>{
 const zz=z-s*.232,t=THREE.MathUtils.clamp(y/.098,0,1),rx=.084-.022*t,rz=.073-.018*t,cx=.006-.023*t;
 let d=Math.max((Math.hypot((x-cx)/rx,zz/rz)-1)*Math.min(rx,rz),-y,y-.098);
 // Deep anterior cleft separates the two toes; heel and pastern remain connected.
 const cleft=Math.max(Math.abs(zz)-.006,.011-x,y-.079);d=Math.max(d,-cleft);
 d=blend(d,C(x,y,zz,[-.018,.107,0],[-.034,.203,0],.051,.067),.008);
 for(let i=0;i<7;i++){const a=i*6.283185/7,cy=.138+.010*Math.sin(i*2.4);d=blend(d,E(x,y,zz,[-.026+.047*Math.cos(a),cy,.049*Math.sin(a)],[.023,.035,.023]),.012);}return d;
},[-.12,-.013,s*.232-.10],[.12,.29,s*.232+.10],.008));
// A thin closed cloth wrap bridges shirt, neck and vest instead of relying on
// overlapping scarf paint on three different surfaces.
function scarfWrap(){const p=[],ix=[],n=32,rows=5,count=n*rows;for(let side=0;side<2;side++)for(let j=0;j<rows;j++)for(let i=0;i<n;i++){const t=j/(rows-1),a=i*2*Math.PI/n,inset=side?.006:0,front=Math.pow(Math.max(0,Math.cos(a)),3),rx=.145-.006*t,rz=.160-.018*t;const fold=.002*Math.sin(t*Math.PI)+.003*Math.sin(t*9+.9*Math.cos(a*2))*Math.sin(t*Math.PI);const width=.026+.018*Math.sin(a)**2,y=1.304+width*(t-.5)-.041*front+.004*Math.sin(a*3)*Math.sin(t*Math.PI)+.012*(1-front)*t*t,z=(rz-inset+fold)*Math.sin(a),x=-.040+(.146-.016*t-inset+fold+.002*front*Math.sin(a*9+t*5))*Math.cos(a);p.push(x,y,z);}for(let side=0;side<2;side++)for(let j=0;j<rows-1;j++)for(let i=0;i<n;i++){const a=side*count+j*n+i,b=side*count+j*n+(i+1)%n,c=b+n,d=a+n;if(side)ix.push(a,b,d,b,c,d);else ix.push(a,d,b,b,d,c);}for(let i=0;i<n;i++){const a=i,b=(i+1)%n,c=(rows-1)*n+i,d=(rows-1)*n+(i+1)%n;ix.push(a,b,a+count,b,b+count,a+count,c,c+count,d,d,c+count,d+count);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();return g;}

// Follow the real garment surface, including its V rim, with a small cloth
// clearance. These closed ribbons carry the painted ends instead of the chest.
const clothMeshes=geometries.filter(p=>/shirt|waistcoat/.test(p.name)).map(({g})=>new THREE.Mesh(g,new THREE.MeshBasicMaterial({side:THREE.DoubleSide})));
const clothRay=new THREE.Raycaster();
function clothFront(y,z){clothRay.set(new THREE.Vector3(.5,y,z),new THREE.Vector3(-1,0,0));return clothRay.intersectObjects(clothMeshes)[0]?.point.x??.11;}
add('fitted neckerchief wrap',scarfWrap());
function scarfEnd(side){const p=[],ix=[],n=8,rows=9;for(let j=0;j<rows;j++){const t=(j+.35)/(rows-.3),y=1.242-.104*t,z=side*(.016+.044*t),width=(.010+.016*Math.sin(t*Math.PI))*(1-Math.pow(t,3)*.95);for(let i=0;i<n;i++){const a=i*2*Math.PI/n,zz=z+width*Math.cos(a);p.push(clothFront(y,zz)+.008+(.004+.004*Math.sin(t*Math.PI))*(1+Math.sin(a)),y,zz);}}for(let j=0;j<rows-1;j++)for(let i=0;i<n;i++){const a=j*n+i,b=j*n+(i+1)%n,c=b+n,d=a+n;ix.push(a,b,d,b,c,d);}for(const end of [0,1]){const row=end?rows-1:0,index=p.length/3;let x=0,z=0;for(let i=0;i<n;i++){x+=p[(row*n+i)*3]/n;z+=p[(row*n+i)*3+2]/n;}p.push(x,end?1.138:1.244,z);for(let i=0;i<n;i++){const a=row*n+i,b=row*n+(i+1)%n;ix.push(...(end?[index,a,b]:[index,b,a]));}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));for(let i=0;i<ix.length;i+=3)[ix[i+1],ix[i+2]]=[ix[i+2],ix[i+1]];g.setIndex(ix);g.computeVertexNormals();return g;}
// Weld the parametric sphere seam/poles before reduction/manifold validation.
function scarfKnot(){const p=[],ix=[],n=12,rows=7;for(let j=1;j<rows;j++){const t=j*Math.PI/rows;for(let i=0;i<n;i++){const a=i*2*Math.PI/n,fold=1+.08*Math.cos(a*3);p.push(.120+.011*Math.sin(t)*Math.cos(a)*fold,1.254+.028*Math.cos(t),.026*Math.sin(t)*Math.sin(a)*(1-.18*Math.sin(t)**6));}}for(let j=0;j<rows-2;j++)for(let i=0;i<n;i++){const a=j*n+i,b=j*n+(i+1)%n;ix.push(a,b,a+n,b,b+n,a+n);}const top=p.length/3;p.push(.120,1.282,0,.120,1.226,0);for(let i=0;i<n;i++){const next=(i+1)%n;ix.push(top,next,i,top+1,(rows-2)*n+i,(rows-2)*n+next);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();return g;}
add('neckerchief knot',scarfKnot());for(const side of [-1,1])add('neckerchief end '+side,scarfEnd(side));
// Stable part order is also the paint ownership order shared with the horse.
const order=['connected shirt and sleeves','connected work trousers seat and legs','forearm and hand -1','exposed cloven hoof -1','forearm and hand 1','exposed cloven hoof 1','unified sheep skull ears and wool','short woolly tail','fitted waistcoat with pointed hem','fitted neckerchief wrap','neckerchief knot','neckerchief end -1','neckerchief end 1'];geometries.sort((a,b)=>order.indexOf(a.name)-order.indexOf(b.name));
function reduce(name,g,target,tolerance){const positions=g.attributes.position.array;let [indices,error]=simplify.simplify(new Uint32Array(g.index.array),positions,3,Math.min(target*3,g.index.count),tolerance,['ErrorAbsolute']);const faces=new Map();for(let i=0;i<indices.length;i+=3){const key=Array.from(indices.subarray(i,i+3)).sort((a,b)=>a-b).join(':');if(!faces.has(key))faces.set(key,[]);faces.get(key).push(i);}const clean=[];for(const v of faces.values())if(v.length===1)clean.push(...indices.subarray(v[0],v[0]+3));indices=new Uint32Array(clean);
 const [remap,count]=simplify.compactMesh(indices),position=new Float32Array(count*3),normal=new Float32Array(count*3);for(let i=0;i<remap.length;i++)if(remap[i]!==0xffffffff){position.set(positions.subarray(i*3,i*3+3),remap[i]*3);normal.set(g.attributes.normal.array.subarray(i*3,i*3+3),remap[i]*3);}return {name,position:Array.from(position,v=>+v.toFixed(7)),normal:Array.from(normal,v=>+v.toFixed(6)),index:Array.from(indices),triangles:indices.length/3,sourceTriangles:g.index.count/3,errorWorld:error};}
const author=geometries.map(({name,g})=>reduce(name,g,name.includes('waistcoat')?2000:name.includes('skull')?7800:name.includes('tail')?350:name.includes('hoof')?700:name.includes('shirt')?4800:name.includes('trousers')?4700:4550,.006));
function save(file,parts,sourceTriangles){const data={schema:1,species:'sheep',source:'Sheep-specific broad face, drooping ears, continuous wool cap and ruff, waistcoat, work trousers and cloven hooves; shared worker rig',sourceTriangles,triangles:parts.reduce((n,p)=>n+p.triangles,0),parts};fs.writeFileSync(new URL('../dist/tactics/'+file,import.meta.url),JSON.stringify(data)+'\n');console.log(file,data.triangles,parts.map(p=>[p.name,p.triangles,p.errorWorld]));return data;}
const high=save('sheep-author-data.json',author,geometries.reduce((n,p)=>n+p.g.index.count/3,0));
const low=author.map(p=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p.position,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(p.normal,3));g.setIndex(p.index);const target=p.name.includes('neckerchief wrap')?256:p.name.includes('neckerchief knot')?80:p.name.includes('neckerchief end')?72:p.name.includes('waistcoat')?1000:p.name.includes('shirt')?1400:p.name.includes('trousers')?2100:p.name.includes('skull')?2600:p.name.includes('tail')?200:p.name.includes('hoof')?350:1000;const result=reduce(p.name,g,target,p.name.includes('waistcoat')?.004:p.name.includes('forearm')?.006:p.name.includes('hoof')?.006:.015);g.dispose();return result;});
save('sheep-10k-data.json',low,high.triangles);for(const {g} of geometries)g.dispose();
