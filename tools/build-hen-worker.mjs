import fs from 'node:fs';
import {createRequire} from 'node:module';
import * as T from '../dist/tactics/vendor/three.module.js';
import {blend,ellipsoid as E,tapered as C,sculptSurface} from '../dist/tactics/grey-surface.js';
const simplify=createRequire(import.meta.url)('./vendor/meshoptimizer/meshopt_simplifier.cjs');await simplify.ready;
const abs=Math.abs,clamp=T.MathUtils.clamp,smooth=T.MathUtils.smoothstep,edge=(...v)=>v.reduce((a,b)=>-blend(-a,-b,.004));
const parts=[];
function add(name,field,min,max,step,author,low){parts.push({name,g:sculptSurface(field,min,max,step),author,low});}
// A flattened feather whose long axis runs between two points. Broad rounded
// tip, tapered root; overlap gives a continuous vane rather than loose scales.
function feather(x,y,z,a,b,width,thickness,plane='side'){
 const d=new T.Vector3(...b).sub(new T.Vector3(...a)),len=d.length();d.divideScalar(len);
 const q=new T.Vector3(x-a[0],y-a[1],z-a[2]),along=q.dot(d);
 const normal=new T.Vector3(...(plane==='side'?[0,0,1]:[1,0,0]));normal.addScaledVector(d,-normal.dot(d)).normalize();
 const cross=new T.Vector3().crossVectors(normal,d).normalize();
 const t=clamp(along/len,0,1),w=width*(.65+.35*smooth(t,0,.3));
 const across=q.dot(cross),depth=q.dot(normal);
 return E(across,along,depth,[0,len*.5,0],[w,len*.54,thickness]);
}
function body(x,y,z){let d=blend(E(x,y,z,[-.015,.735,0],[.245,.365,.292]),E(x,y,z,[0,1.065,0],[.203,.225,.235]),.065);
 for(const s of [-1,1])d=blend(d,E(x,y,z,[-.005,.415,s*.135],[.133,.150,.135]),.085);
 return d;
}
add('feathered body',body,[-.30,.24,-.34],[.28,1.32,.34],.006,3100,1000);
function head(x,y,z){let d=blend(E(x,y,z,[-.024,1.266,0],[.148,.225,.160]),E(x,y,z,[.005,1.469,0],[.128,.121,.120]),.045);
 d=blend(d,E(x,y,z,[.073,1.405,0],[.097,.102,.103]),.030);
 for(const s of [-1,1]){d=blend(d,E(x,y,z,[.064,1.476,s*.097],[.041,.036,.025]),.018);d=blend(d,E(x,y,z,[.060,1.508,s*.099],[.044,.007,.023]),.013);}
 // Small overlapping nape points produce feather silhouette without a scalloped neck seam.
 for(let i=0;i<5;i++){const yy=1.20+i*.048;d=blend(d,E(x,y,z,[-.139,yy,0],[.040,.065,.093-i*.007]),.013);}
 return d;
}
add('head and feathered neck',head,[-.205,1.035,-.19],[.192,1.605,.19],.0045,4200,1400);
function comb(x,y,z){let d=E(x,y,z,[-.025,1.567,0],[.145,.042,.033]);
 for(const [xx,yy,rx,ry]of [[-.141,1.570,.037,.036],[-.111,1.606,.033,.039],[-.066,1.628,.027,.046],[-.018,1.645,.026,.048],[.027,1.622,.027,.046],[.066,1.591,.027,.043]])d=blend(d,E(x,y,z,[xx,yy,0],[rx,ry,.024]),.009);
 return d;
}
add('rounded comb',comb,[-.20,1.50,-.050],[.14,1.71,.050],.0035,1700,550);
function beak(x,y,z){const t=clamp((x-.10)/.145,0,1),center=1.445-.036*t*t,rz=.056*Math.sqrt(1-.94*t*t),ry=.037*(1-.80*t);
 let d=edge((Math.hypot(z/rz,(y-center)/ry)-1)*Math.min(rz,ry),.105-x,x-.246);
 d=blend(d,E(x,y,z,[.238,1.403,0],[.015,.018,.015]),.007);
 d=blend(d,E(x,y,z,[.160,1.399,0],[.066,.017,.043]),.004);
 d=blend(d,E(x,y,z,[.115,1.425,0],[.024,.033,.042]),.006);
 return d;
}
add('short hooked beak',beak,[.08,1.38,-.074],[.30,1.49,.074],.0025,1500,500);
add('paired wattles',(x,y,z)=>{let d=E(x,y,z,[.117,1.394,0],[.030,.032,.057]);for(const s of [-1,1])d=blend(d,E(x,y,z,[.133,1.350,s*.037],[.025,.066,.029]),.005);return d;},[.078,1.271,-.083],[.169,1.436,.083],.0035,1200,400);
function vest(x,y,z){const shell=body(x,y,z)-.021,inner=body(x,y,z)+.003;
 const front=smooth(x,.04,.17),neck=1.230-front*(.120*(1-smooth(abs(z),0,.18)));
 return edge(shell,-inner,.879-y,y-neck);
}
add('fitted waistcoat',vest,[-.31,.85,-.33],[.31,1.28,.33],.0045,3800,1250);
function apron(x,y,z){const t=clamp((.905-y)/.49,0,1),rx=.241+.053*Math.sin(t*Math.PI*.78),rz=.250+.047*Math.sin(t*Math.PI*.6);
 const radius=Math.hypot((x+.008)/rx,z/rz),dist=(radius-1)*Math.min(rx,rz);
 const fold=.005*Math.cos(z*29+t*1.7)*smooth(t,0,.45);
 const hem=.425+.025*(abs(z)/.30)**2;
 return edge(abs(dist+fold)-.011,hem-y,y-.926,-.047-x);
}
add('continuous apron',apron,[-.07,.40,-.34],[.33,.95,.34],.0045,3100,1050);
for(const s of [-1,1]){
 function wing(x,y,z){z*=s;let d=feather(x,y,z,[.018,1.186,.233],[-.114,.775,.307],.124,.065);
  d=blend(d,C(x,y,z,[-.018,1.17,.205],[-.022,1.10,.254],.060,.070),.032);
  for(let i=0;i<5;i++){const xx=.060-i*.053;d=blend(d,feather(x,y,z,[xx,1.007-i*.027,.290],[xx-.125,.544+i*.050,.351+i*.011],.058,.031),.012);}
  for(let i=0;i<4;i++)d=blend(d,feather(x,y,z,[.070-i*.049,1.117-i*.028,.292],[.018-i*.060,.826-i*.036,.363],.066,.032),.010);
  for(let i=0;i<3;i++)d=blend(d,feather(x,y,z,[.061-i*.052,1.166-i*.029,.263],[.021-i*.055,1.006-i*.04,.335],.061,.030),.009);
  return d;
 }
 add('layered wing '+s,wing,[-.34,.49,s<0?-.48:.10],[.17,1.28,s<0?-.10:.48],.0045,2800,900);
}
function tail(x,y,z){let d=E(x,y,z,[-.206,.876,0],[.077,.094,.15]);
 for(let i=-3;i<=3;i++){const tip=[-.425+.017*abs(i),1.213-.052*abs(i),i*.076];d=blend(d,feather(x,y,z,[-.254,.889,i*.024],tip,.076,.042,'rear'),.010);}
 for(let i=-2;i<=2;i++)d=blend(d,feather(x,y,z,[-.258,.868,i*.03],[-.396,1.102-abs(i)*.027,i*.082],.068,.028,'rear'),.010);
 for(const s of [-1,1])for(let i=0;i<3;i++)d=blend(d,feather(x,y,z,[-.268,.890,s*.075],[-.480+i*.018,1.180-i*.077,s*(.108+i*.026)],.063,.039),.010);
 return d;
}
add('upright tail fan',tail,[-.58,.74,-.34],[-.10,1.34,.34],.0045,2800,950);
for(const s of [-1,1]){
 const zz=s*.161;
 function foot(x,y,z){let d=C(x,y,z,[-.022,.336,zz],[-.014,.090,zz],.037,.029);d=blend(d,E(x,y,z,[.001,.065,zz],[.060,.045,.053]),.018);
  const toes=[[.203,.023,zz],[.153,.024,zz+.118],[.153,.024,zz-.102],[-.127,.025,zz+s*.045]];
  for(const end of toes){const rear=end[0]<0,mid=[end[0]*.48,.038,zz+(end[2]-zz)*.54];d=blend(d,C(x,y,z,[.004,.063,zz],mid,.026,.021),.007);d=blend(d,C(x,y,z,mid,end,.021,.013),.005);const nail=[end[0]+(rear?-.019:.019),.029,end[2]];d=blend(d,C(x,y,z,end,nail,.014,.011),.004);d=blend(d,C(x,y,z,nail,[end[0]+(rear?-.034:.034),.006,end[2]],.011,.003),.003);}
  return Math.max(d,.009-y);
 }
 add('scaly leg and four toes '+s,foot,[-.18,-.01,zz-.145],[.25,.38,zz+.16],.0035,1250,550);
}
add('apron waist tie',(x,y,z)=>{let d=edge(abs((Math.hypot((x+.008)/.249,z/.267)-1)*.249)-.012,abs(y-.906)-.020);d=blend(d,E(x,y,z,[-.264,.905,0],[.028,.025,.036]),.010);for(const s of [-1,1]){d=blend(d,E(x,y,z,[-.269,.915,s*.065],[.022,.039,.054]),.008);d=blend(d,feather(x,y,z,[-.263,.901,s*.033],[-.267,.766,s*.070],.035,.013,'rear'),.008);}return d;},[-.32,.71,-.31],[.29,.99,.31],.0035,1400,500);
// Normalize once, before authoring/reduction, to the established prototype height.
const top=Math.max(...parts.map(p=>{p.g.computeBoundingBox();return p.g.boundingBox.max.y;})),bottom=Math.min(...parts.map(p=>p.g.boundingBox.min.y)),scale=1.65/(top-bottom);
for(const p of parts){
 if(p.name==='apron waist tie'){const a=p.g.attributes.position,n=p.g.attributes.normal;for(let i=0;i<a.count;i++)if(a.getX(i)>-.247){const v=new T.Vector3((a.getX(i)+.008)/(.249**2),0,a.getZ(i)/(.267**2)).normalize();n.setXYZ(i,v.x,v.y,v.z);}}
 p.g.translate(0,-bottom,0);p.g.scale(scale,scale,scale);
}
function cleanFaces(ix){const faces=new Map();for(let i=0;i<ix.length;i+=3){const key=Array.from(ix.slice(i,i+3)).sort((a,b)=>a-b).join(':');if(!faces.has(key))faces.set(key,[]);faces.get(key).push(i);}const clean=[];for(const list of faces.values())if(list.length===1)clean.push(...ix.slice(list[0],list[0]+3));return new Uint32Array(clean);}
function reduce(name,g,target,tolerance){const p=g.attributes.position.array,input=cleanFaces(g.index.array);let [ix,error]=simplify.simplify(input,p,3,Math.min(input.length,Math.floor(target)*3),tolerance,['ErrorAbsolute']);ix=cleanFaces(ix);
 const [remap,n]=simplify.compactMesh(ix),pos=new Float32Array(n*3),normal=new Float32Array(n*3);for(let i=0;i<remap.length;i++)if(remap[i]!==0xffffffff){pos.set(p.subarray(i*3,i*3+3),remap[i]*3);normal.set(g.attributes.normal.array.subarray(i*3,i*3+3),remap[i]*3);}
 const mesh=new T.BufferGeometry();mesh.setAttribute('position',new T.BufferAttribute(pos,3));mesh.setAttribute('normal',new T.BufferAttribute(normal,3));mesh.setIndex(new T.BufferAttribute(ix,1));
 const out={name,position:Array.from(pos,v=>+v.toFixed(7)),normal:Array.from(mesh.attributes.normal.array,v=>+v.toFixed(6)),index:Array.from(ix),triangles:ix.length/3,sourceTriangles:g.index.count/3,errorWorld:error};mesh.dispose();return out;
}
// Keep the painted neutral registration while giving the hen a rounder body.
function roundPoint(name,[x,y,z]){
 if(name.includes('wing'))return [x,y,z+Math.sign(z)*.055];
 if(name.includes('tail'))return [x-.055,y,z];
 if(!/body|waistcoat|apron/.test(name))return [x,y,z];
 const w=smooth(y,.25,.56)*(1-smooth(y,1.02,1.25));
 return [x*(1+.25*w),y,z*(1+.25*w)];
}
function roundedParts(parts){return parts.map(p=>{const position=[],normal=[];for(let i=0;i<p.position.length;i+=3){const a=p.position.slice(i,i+3);position.push(...roundPoint(p.name,a).map(v=>+v.toFixed(7)));const columns=[0,1,2].map(axis=>{const lo=a.slice(),hi=a.slice();lo[axis]-=.0001;hi[axis]+=.0001;return new T.Vector3(...roundPoint(p.name,hi)).sub(new T.Vector3(...roundPoint(p.name,lo))).multiplyScalar(5000);});const j=new T.Matrix3().set(columns[0].x,columns[1].x,columns[2].x,columns[0].y,columns[1].y,columns[2].y,columns[0].z,columns[1].z,columns[2].z).invert().transpose();normal.push(...new T.Vector3(...p.normal.slice(i,i+3)).applyMatrix3(j).normalize().toArray().map(v=>+v.toFixed(6)));}const {errorWorld,...rest}=p;return {...rest,position,normal,paintPosition:p.position,paintNormal:p.normal,preRoundErrorWorld:errorWorld};});}
function save(file,data,sourceTriangles){const out={schema:1,species:'hen',height:1.65,source:'Hen-specific feathered body, wings, upright fan, bird feet, comb and wattles; author then reduced with registered round-body correction',sourceTriangles,triangles:data.reduce((n,p)=>n+p.triangles,0),parts:data};fs.writeFileSync(new URL('../dist/tactics/'+file,import.meta.url),JSON.stringify({...out,parts:roundedParts(data)})+'\n');console.log(file,out.triangles,data.map(p=>[p.name,p.triangles,p.errorWorld]));return out;}
const author=save('hen-author-data.json',parts.map(p=>reduce(p.name,p.g,p.author*.97,.012)),parts.reduce((n,p)=>n+p.g.index.count/3,0));
const low=author.parts.map((p,i)=>{const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p.position,3));g.setAttribute('normal',new T.Float32BufferAttribute(p.normal,3));g.setIndex(p.index);const target=p.name.includes('beak')?650:p.name.includes('waistcoat')?1400:parts[i].low*.95;const out=reduce(p.name,g,target,.0045);g.dispose();return out;});save('hen-10k-data.json',low,author.triangles);parts.forEach(p=>p.g.dispose());
