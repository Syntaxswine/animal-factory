import * as THREE from '../dist/tactics/vendor/three.module.js';
const smooth=THREE.MathUtils.smoothstep;
export function bodyPoint(species,name,[x,y,z]){
 if(species==='pig-director'){
  if(!/shirt|trousers/.test(name))return [x,y,z];
  const rear=(1-smooth(x,-.03,.10))*Math.exp(-1*((y-.88)/.10)**2);
  return [x-.018*rear,y,z];
 }
 if(/skull|boot/.test(name))return [x,y,z];
 if(/forearm|upperArm|hand|fingers/.test(name))return [x,y-.060,z+Math.sign(z)*.060];
 const waist=smooth(y,.23,.88)*(1-smooth(y,.92,1.30));
 const broad=smooth(y,.23,.60)*(1-smooth(y,1.12,1.30));
 const round=Math.exp(-1*((y-.975)/.22)**2)*(1-smooth(Math.abs(z),.23,.34));
 let p=[x*(1+.12*broad)+.052*round*smooth(x,-.04,.14),y-.090*waist,z*(1+.24*broad)];
 if(name.includes('shirt')){const sleeve=smooth(Math.abs(z),.27,.37);p=p.map((v,a)=>THREE.MathUtils.lerp(v,[x,y-.060,z+Math.sign(z)*.060][a],sleeve));}
 return p;
}
// Preserve the accepted registered skin in the original rest coordinates.
// Both author and reduced surfaces receive the same smooth, local deformation.
export function proportionData(data){
 const map=(name,p)=>bodyPoint(data.species,name,p),parts=data.parts.map(part=>{
  const position=[],normal=[],eps=.0001;
  for(let i=0;i<part.position.length;i+=3){const p=part.position.slice(i,i+3),q=map(part.name,p);position.push(...q.map(v=>+v.toFixed(7)));
   const columns=[0,1,2].map(a=>{const lo=p.slice(),hi=p.slice();lo[a]-=eps;hi[a]+=eps;return new THREE.Vector3(...map(part.name,hi)).sub(new THREE.Vector3(...map(part.name,lo))).multiplyScalar(.5/eps);});
   const j=new THREE.Matrix3().set(columns[0].x,columns[1].x,columns[2].x,columns[0].y,columns[1].y,columns[2].y,columns[0].z,columns[1].z,columns[2].z).invert().transpose();
   normal.push(...new THREE.Vector3(...part.normal.slice(i,i+3)).applyMatrix3(j).normalize().toArray().map(v=>+v.toFixed(6)));
  }
  const {errorWorld,...rest}=part;return {...rest,position,normal,paintPosition:part.position,paintNormal:part.normal,preProportionErrorWorld:errorWorld};
 });
 const bonePositions={};
 if(data.species==='pig-foreman'){
  for(const [name,p]of [['hips',[0,.80,0]],['spine',[-.025,1.08,0]]])bonePositions[name]=map(name,p);
  for(const s of [-1,1])for(const [name,p]of [['upperArm',[-.045,1.191,s*.205]],['forearm',[.022,.991,s*.344]],['hand',[.061,.742,s*.355]],['fingers',[.072,.712,s*.355]],['thigh',[-.03,.77,s*.12]],['shin',[.024,.475,s*.196]]])bonePositions[name+s]=map(name,p);
 }
 return {...data,parts,bonePositions,proportionRevision:1};
}
