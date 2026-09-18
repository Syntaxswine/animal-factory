import * as THREE from './vendor/three.module.js';
import {DIMENSIONS} from './hybrid-world.js';
import {blend,ellipsoid as E,roundedBox as B,tapered as C,sculptSurface,surfaceComponents} from './grey-surface.js';

// Neutral, untextured form study. Each garment is an independently connected surface.
// X faces forward; Y is height; Z is left/right. No source-rig spheres/cylinders render.
export function createGreyHorse(){
 const root=new THREE.Group(),parts=[];
 const material=new THREE.MeshStandardMaterial({color:0x999999,roughness:.88,metalness:0});
 const abs=Math.abs,exp=Math.exp;
 const clothEdge=(...fields)=>fields.reduce((a,b)=>-blend(-a,-b,.009));
 function add(name,field,min,max,step){const g=sculptSurface(field,min,max,step),m=new THREE.Mesh(g,material);m.name=name;m.castShadow=m.receiveShadow=true;parts.push(m);root.add(m);return m;}

 function shirt(x,y,z){
  let d=blend(E(x,y,z,[-.025,1.075,0],[.156,.216,.224]),E(x,y,z,[-.04,1.205,0],[.139,.067,.205]),.045);
  d=blend(d,E(x,y,z,[-.014,.965,0],[.142,.108,.183]),.035);
  for(const side of [-1,1]){
   d=blend(d,C(x,y,z,[-.045,1.191,side*.205],[.012,1.005,side*.335],.080,.085),.035);
   d=blend(d,C(x,y,z,[.012,1.035,side*.322],[.023,.993,side*.344],.086,.086),.010);
  }
  // Broad sleeve compression near rolled cuffs; two diagonal underarm tension folds.
  const sleeve=exp(-(((abs(z)-.32)/.080)**2))*exp(-(((y-1.03)/.11)**2));
  d+=.0035*Math.sin((y-1.0)*45+abs(z)*12)*sleeve;
  const chest=exp(-(((x-.13)/.065)**2))*exp(-(((y-1.13)/.15)**2));
  d+=.003*exp(-(((y-1.105-z*.28)/.018)**2))*chest;
  return d;
 }
 add('connected shirt and sleeves',shirt,[-.26,.80,-.48],[.23,1.34,.48],.010);

 function trousers(x,y,z){
  let d=E(x,y,z,[-.035,.78,0],[.180,.155,.225]);
  d=blend(d,E(x,y,z,[-.035,.895,0],[.164,.10,.211]),.045);
  for(const side of [-1,1]){
   d=blend(d,C(x,y,z,[-.03,.77,side*.12],[.024,.475,side*.196],.134,.105),.045);
   d=blend(d,C(x,y,z,[.024,.475,side*.196],[-.035,.225,side*.232],.105,.085),.04);
  }
  // Seat/waist and both legs are one field, with a real crotch arch.
  // Low bib follows the chest; straps rise from it rather than floating on a yoke.
  // Thin cloth follows the actual shirt field, merging into the waistband.
  const bib=clothEdge(shirt(x,y,z)-.017,abs(z)-.145,.91-y,y-1.15,.035-x);
  d=blend(d,bib,.018);
  const strapBottom=.94+.20*Math.max(0,Math.min(1,(x+.03)/.12));
  const strap=clothEdge(shirt(x,y,z)-.017,abs(abs(z)-.13)-.017,strapBottom-y);d=blend(d,strap,.012);
  // Local oblique creases: directional compression, never rings around the legs.
  for(const side of [-1,1]){
   const local=z-side*.205;
   const face=exp(-(((x-.090)/.070)**2))*exp(-((local/.105)**2));
   d+=.005*exp(-(((y-.465-side*local*.32)/.015)**2))*face;
   d-=.004*exp(-(((y-.435+side*local*.22)/.020)**2))*face;
   const outer=exp(-(((local-side*.065)/.050)**2));
   d+=.004*exp(-(((y-.285-x*.40)/.015)**2))*outer;
   d-=.003*exp(-(((y-.250+x*.23)/.019)**2))*outer;
  }
  return d;
 }
 add('connected overalls seat and legs',trousers,[-.25,.12,-.37],[.23,1.36,.37],.0058);

 for(const side of [-1,1]){
  function arm(x,y,z){
   let d=C(x,y,z,[.022,.991,side*.344],[.060,.79,side*.355],.088,.059);
   d=blend(d,E(x,y,z,[.061,.742,side*.355],[.058,.073,.051]),.025);
   for(let i=0;i<4;i++)d=blend(d,C(x,y,z,[.073+(i-1.5)*.021,.717,side*.358],[.084+(i-1.5)*.019,.673,side*.355],.014,.012),.011);
   d=blend(d,C(x,y,z,[.095,.761,side*.325],[.121,.72,side*.327],.021,.016),.016);
   return d;
  }
  add('forearm and hand '+side,arm,[-.085,.64,side*.35-.14],[.16,1.08,side*.35+.14],.008);
  function hoof(x,y,z){
   const zz=z-side*.232;
   // Exposed single horse hoof: sloped wall, broad bearing rim and narrower coronet.
   // No footwear sole, heel block or elongated boot toe.
   const t=Math.max(0,Math.min(1,y/.115));
   const cx=.009-.027*t,rx=.113-.033*t,rz=.094-.026*t;
   let d=Math.max((Math.hypot((x-cx)/rx,zz/rz)-1)*Math.min(rx,rz),-y,y-.115);
   // Short pastern enters the trouser opening above the hoof capsule.
   d=blend(d,C(x,y,zz,[-.018,.105,0],[-.034,.205,0],.065,.070),.010);
   return d;
  }
  add('exposed hoof '+side,hoof,[-.13,-.012,side*.232-.12],[.15,.29,side*.232+.12],.006);
 }

 function head(x,y,z){
  let d=C(x,y,z,[-.072,1.245,0],[-.058,1.424,0],.127,.098);
  d=blend(d,E(x,y,z,[-.025,1.465,0],[.113,.106,.104]),.043);
  d=blend(d,E(x,y,z,[-.017,1.410,0],[.105,.091,.121]),.035);
  d=blend(d,C(x,y,z,[.026,1.452,0],[.195,1.372,0],.078,.069),.036);
  d=blend(d,E(x,y,z,[.203,1.350,0],[.076,.049,.082]),.025);
  d=blend(d,C(x,y,z,[-.012,1.385,0],[.181,1.329,0],.060,.040),.025);
  for(const side of [-1,1]){
   d=blend(d,E(x,y,z,[-.062,1.567,side*.067],[.030,.085,.037]),.014);
   d=blend(d,E(x,y,z,[.030,1.473,side*.066],[.041,.021,.027]),.014);
   d=Math.max(d,-E(x,y,z,[.059,1.477,side*.098],[.027,.022,.020]));
   d=blend(d,E(x,y,z,[.056,1.477,side*.075],[.021,.016,.017]),.004);
   d=Math.max(d,-E(x,y,z,[.250,1.370,side*.077],[.021,.015,.020]));
   // Inner ear indentation and an integrated orbital ridge, not attached eye puffs.
   d=Math.max(d,-E(x,y,z,[-.039,1.589,side*.069],[.018,.044,.023]));
  }
  const lipY=1.329,lipMask=Math.max(0,Math.min(1,(x-.16)/.05));
  d+=.0025*exp(-(((y-lipY)/.006)**2))*lipMask;
  return d;
 }
 add('unified skull jaw neck and ears',head,[-.23,1.11,-.155],[.315,1.68,.155],.0055);

 // Hair is a single attached crest, following the rear neck/skull silhouette.
 function mane(x,y,z){
  // One swept crest with curved longitudinal channels; no stacked repeated lobes.
  const t=Math.max(0,Math.min(1,(y-1.23)/.32));
  const cx=-.212+.079*t+.014*Math.sin(t*Math.PI);
  const width=.040+.012*Math.sin(t*Math.PI);
  let d=E(x,y,z,[cx,1.39,0],[.044,.166,width]);
  const rear=exp(-(((x-cx+.032)/.035)**2));
  d+=.004*exp(-(((z-.014*Math.sin(t*3.2))/.009)**2))*rear;
  d+=.003*exp(-(((z+.025-.009*t)/.008)**2))*rear;
  return d;
 }
 add('mane crest',mane,[-.26,1.19,-.10],[-.02,1.59,.10],.008);

 const raw=new THREE.Box3().setFromObject(root),scale=DIMENSIONS.standing/(raw.max.y-raw.min.y);
 // One uniform model scale fixes the approved overall height without changing proportions.
 root.scale.setScalar(scale);root.position.y=-raw.min.y*scale;root.updateMatrixWorld(true);
 function diagnostics(){const bounds=new THREE.Box3().setFromObject(root);return {height:bounds.max.y-bounds.min.y,min:bounds.min.toArray(),max:bounds.max.toArray(),scale,triangles:parts.reduce((n,p)=>n+p.geometry.index.count/3,0),parts:parts.map(p=>({name:p.name,components:surfaceComponents(p.geometry),vertices:p.geometry.attributes.position.count,triangles:p.geometry.index.count/3,min:new THREE.Box3().setFromObject(p).min.toArray()}))};}
 return {root,parts,material,diagnostics,dispose(){for(const p of parts)p.geometry.dispose();material.dispose();}};
}
