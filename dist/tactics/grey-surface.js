// Indexed isosurface mesher for the neutral sculpt. Adjacent cells share vertices.
// Garment connectivity is produced by the field, not by overlapping render parts.
import * as THREE from './vendor/three.module.js';

export const blend=(a,b,k=.03)=>{
 const h=Math.max(k-Math.abs(a-b),0)/k;
 return Math.min(a,b)-h*h*k*.25;
};
export function ellipsoid(x,y,z,c,r){
 x-=c[0];y-=c[1];z-=c[2];
 const k0=Math.hypot(x/r[0],y/r[1],z/r[2]);
 const k1=Math.hypot(x/(r[0]*r[0]),y/(r[1]*r[1]),z/(r[2]*r[2]));
 return k1<1e-9?-Math.min(...r):k0*(k0-1)/k1;
}
export function roundedBox(x,y,z,c,b,r=.02){
 const q=[Math.abs(x-c[0])-b[0]+r,Math.abs(y-c[1])-b[1]+r,Math.abs(z-c[2])-b[2]+r];
 return Math.hypot(...q.map(v=>Math.max(v,0)))+Math.min(Math.max(...q),0)-r;
}
export function tapered(x,y,z,a,b,r0,r1){
 const v=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],p=[x-a[0],y-a[1],z-a[2]];
 const t=Math.max(0,Math.min(1,(p[0]*v[0]+p[1]*v[1]+p[2]*v[2])/(v[0]**2+v[1]**2+v[2]**2)));
 return Math.hypot(p[0]-v[0]*t,p[1]-v[1]*t,p[2]-v[2]*t)-(r0+(r1-r0)*t);
}

export function sculptSurface(field,min,max,step=.010){
 const n=min.map((v,i)=>Math.ceil((max[i]-v)/step)+1),stride=n[0]*n[1];
 const spacing=min.map((v,i)=>(max[i]-v)/(n[i]-1));
 const samples=new Float32Array(n[0]*n[1]*n[2]);
 const id=(x,y,z)=>x+n[0]*y+stride*z;
 const point=i=>[min[0]+i%n[0]*spacing[0],min[1]+Math.floor(i/n[0])%n[1]*spacing[1],min[2]+Math.floor(i/stride)*spacing[2]];
 for(let z=0;z<n[2];z++)for(let y=0;y<n[1];y++)for(let x=0;x<n[0];x++)samples[id(x,y,z)]=field(min[0]+x*spacing[0],min[1]+y*spacing[1],min[2]+z*spacing[2]);
 const positions=[],normals=[],indices=[],edges=new Map(),welded=new Map();
 function vertex(a,b){
  const key=a<b?a+':'+b:b+':'+a;if(edges.has(key))return edges.get(key);
  const pa=point(a),pb=point(b),t=samples[a]/(samples[a]-samples[b]),p=pa.map((v,i)=>v+(pb[i]-v)*t),e=step*.12;
  const weldKey=p.map(v=>Math.round(v*1e7)).join(',');if(welded.has(weldKey)){const i=welded.get(weldKey);edges.set(key,i);return i;}
  const normal=new THREE.Vector3(field(p[0]+e,p[1],p[2])-field(p[0]-e,p[1],p[2]),field(p[0],p[1]+e,p[2])-field(p[0],p[1]-e,p[2]),field(p[0],p[1],p[2]+e)-field(p[0],p[1],p[2]-e)).normalize();
  const i=positions.length/3;positions.push(...p);normals.push(...normal.toArray());edges.set(key,i);welded.set(weldKey,i);return i;
 }
 function triangle(a,b,c){
  if(a===b||b===c||a===c)return;
  const p=i=>new THREE.Vector3(...positions.slice(i*3,i*3+3));
  const cross=p(b).sub(p(a)).cross(p(c).sub(p(a))),normal=new THREE.Vector3(...normals.slice(a*3,a*3+3));
  if(cross.lengthSq()<1e-30)return;
  if(cross.dot(normal)<0)indices.push(a,c,b);else indices.push(a,b,c);
 }
 const tetra=[[0,5,1,6],[0,1,2,6],[0,2,3,6],[0,3,7,6],[0,7,4,6],[0,4,5,6]];
 for(let z=0;z<n[2]-1;z++)for(let y=0;y<n[1]-1;y++)for(let x=0;x<n[0]-1;x++){
  const c=[id(x,y,z),id(x+1,y,z),id(x+1,y+1,z),id(x,y+1,z),id(x,y,z+1),id(x+1,y,z+1),id(x+1,y+1,z+1),id(x,y+1,z+1)];
  if(c.every(i=>samples[i]>0)||c.every(i=>samples[i]<=0))continue;
  for(const tet of tetra){
   const inside=tet.map(i=>c[i]).filter(i=>samples[i]<=0),outside=tet.map(i=>c[i]).filter(i=>samples[i]>0);
   if(inside.length===1)triangle(...outside.map(i=>vertex(inside[0],i)));
   if(inside.length===3)triangle(...inside.map(i=>vertex(outside[0],i)));
   if(inside.length===2){const a=vertex(inside[0],outside[0]),b=vertex(inside[0],outside[1]),c=vertex(inside[1],outside[0]),d=vertex(inside[1],outside[1]);triangle(a,b,c);triangle(b,d,c);}
  }
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));geometry.setIndex(indices);geometry.computeBoundingBox();geometry.computeBoundingSphere();return geometry;
}

export function surfaceComponents(geometry){
 const ix=geometry.index.array,parent=new Int32Array(geometry.attributes.position.count);for(let i=0;i<parent.length;i++)parent[i]=i;
 const find=a=>{while(parent[a]!==a){parent[a]=parent[parent[a]];a=parent[a];}return a;};
 for(let i=0;i<ix.length;i+=3){parent[find(ix[i+1])]=find(ix[i]);parent[find(ix[i+2])]=find(ix[i]);}
 return new Set(Array.from(ix,find)).size;
}
