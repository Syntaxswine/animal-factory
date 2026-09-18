import * as THREE from './vendor/three.module.js';
import {DIMENSIONS} from './hybrid-world.js';
import {blend,ellipsoid as E,roundedBox as B,tapered as C,sculptSurface,surfaceComponents} from './grey-surface.js';

// Neutral, untextured form study. Each garment is an independently connected surface.
// X faces forward; Y is height; Z is left/right. No source-rig spheres/cylinders render.
export function createGreyHorse(){
 const root=new THREE.Group(),parts=[];
 const material=new THREE.MeshStandardMaterial({color:0x999999,roughness:.88,metalness:0});
 const abs=Math.abs,exp=Math.exp;
 function add(name,field,min,max,step){const g=sculptSurface(field,min,max,step),m=new THREE.Mesh(g,material);m.name=name;m.castShadow=m.receiveShadow=true;parts.push(m);root.add(m);return m;}

 function shirt(x,y,z){
  let d=blend(E(x,y,z,[-.025,1.065,0],[.185,.245,.255]),E(x,y,z,[-.04,1.195,0],[.160,.100,.240]),.07);
  d=blend(d,E(x,y,z,[.005,.955,0],[.171,.125,.218]),.055);
  for(const side of [-1,1]){
   d=blend(d,C(x,y,z,[-.045,1.215,side*.205],[.012,1.005,side*.335],.105,.089),.050);
   d=blend(d,C(x,y,z,[.012,1.035,side*.322],[.023,.993,side*.344],.096,.096),.014);
  }
  // Broad sleeve compression near rolled cuffs; two diagonal underarm tension folds.
  const sleeve=exp(-(((abs(z)-.32)/.080)**2))*exp(-(((y-1.03)/.11)**2));
  d+=.0035*Math.sin((y-1.0)*45+abs(z)*12)*sleeve;
  const chest=exp(-(((x-.13)/.065)**2))*exp(-(((y-1.13)/.15)**2));
  d+=.0045*Math.sin((y+abs(z)*.52)*49)*chest;
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
  const front=-.015+.19*Math.sqrt(Math.max(.05,1-((y-1.055)/.27)**2-(z/.28)**2));
  d=blend(d,B(x-front,y,z,[.004,1.020,0],[.014,.145,.15],.010),.032);
  if(abs(abs(z)-.14)<.04&&y>1.115){const strap=Math.max(abs(shirt(x,y,z)-.005)-.006,abs(abs(z)-.14)-.017,1.13-y);d=blend(d,strap,.012);}
  const knee=exp(-(((y-.46)/.060)**2))*exp(-(((abs(z)-.19)/.12)**2));
  const ankle=exp(-(((y-.265)/.045)**2))*exp(-(((abs(z)-.23)/.11)**2));
  const seat=exp(-(((y-.70)/.07)**2))*exp(-(((x+.16)/.055)**2));
  d+=.0055*Math.sin((y+x*.40)*67)*knee+.004*Math.sin((y-x*.5)*94)*ankle+.0035*Math.sin((y-abs(z)*.25)*70)*seat;
  return d;
 }
 add('connected overalls seat and legs',trousers,[-.25,.12,-.37],[.23,1.36,.37],.0065);

 for(const side of [-1,1]){
  function arm(x,y,z){
   let d=C(x,y,z,[.022,.991,side*.344],[.060,.79,side*.355],.088,.059);
   d=blend(d,E(x,y,z,[.061,.742,side*.355],[.058,.073,.051]),.025);
   for(let i=0;i<4;i++)d=blend(d,C(x,y,z,[.073+(i-1.5)*.021,.717,side*.358],[.084+(i-1.5)*.019,.673,side*.355],.014,.012),.011);
   d=blend(d,C(x,y,z,[.095,.761,side*.325],[.121,.72,side*.327],.021,.016),.016);
   return d;
  }
  add('forearm and hand '+side,arm,[-.085,.64,side*.35-.14],[.16,1.08,side*.35+.14],.008);
  function boot(x,y,z){
   const zz=z-side*.232;
   let d=B(x,y,zz,[.040,.071,0],[.185,.064,.114],.060);
   d=blend(d,B(x,y,zz,[-.034,.161,0],[.105,.099,.098],.074),.027);
   d=Math.min(d,B(x,y,zz,[.040,.020,0],[.191,.020,.118],.011));
   // A shallow vamp break where the ankle bends into the weight-bearing toe.
   d+=.003*exp(-(((x-.055)/.035)**2))*exp(-(((y-.125)/.030)**2));
   return d;
  }
  add('work boot '+side,boot,[-.17,-.012,side*.232-.145],[.25,.29,side*.232+.145],.008);
 }

 function head(x,y,z){
  let d=C(x,y,z,[-.072,1.245,0],[-.058,1.424,0],.127,.098);
  d=blend(d,E(x,y,z,[-.025,1.465,0],[.113,.106,.104]),.043);
  d=blend(d,E(x,y,z,[-.017,1.410,0],[.105,.091,.121]),.035);
  d=blend(d,C(x,y,z,[.026,1.452,0],[.195,1.372,0],.078,.069),.036);
  d=blend(d,E(x,y,z,[.211,1.353,0],[.079,.059,.095]),.025);
  d=blend(d,C(x,y,z,[-.012,1.385,0],[.19,1.328,0],.064,.047),.025);
  for(const side of [-1,1]){
   d=blend(d,E(x,y,z,[-.062,1.567,side*.067],[.030,.085,.037]),.014);
   d=blend(d,E(x,y,z,[.037,1.461,side*.066],[.047,.033,.034]),.022);
   d=Math.max(d,-E(x,y,z,[.058,1.475,side*.101],[.032,.020,.020]));
   d=blend(d,E(x,y,z,[.056,1.473,side*.086],[.024,.013,.016]),.006);
   d=Math.max(d,-E(x,y,z,[.250,1.370,side*.077],[.021,.015,.020]));
   // Inner ear indentation and an integrated orbital ridge, not attached eye puffs.
   d=Math.max(d,-E(x,y,z,[-.039,1.589,side*.069],[.018,.044,.023]));
  }
  const lipY=1.322+.015*(z/.085)**2,lipMask=Math.max(0,Math.min(1,(x-.16)/.05));
  d+=.0040*exp(-(((y-lipY)/.006)**2))*lipMask;
  return d;
 }
 add('unified skull jaw neck and ears',head,[-.23,1.11,-.155],[.315,1.68,.155],.0055);

 // Hair is a single attached crest, following the rear neck/skull silhouette.
 function mane(x,y,z){
  const t=Math.max(0,Math.min(1,(y-1.225)/.33));
  return E(x,y,z,[-.19+.060*t,1.39,0],[.069,.165,.072]);
 }
 add('mane crest',mane,[-.26,1.19,-.10],[-.02,1.59,.10],.008);

 const raw=new THREE.Box3().setFromObject(root),scale=DIMENSIONS.standing/(raw.max.y-raw.min.y);
 // One uniform model scale fixes the approved overall height without changing proportions.
 root.scale.setScalar(scale);root.position.y=-raw.min.y*scale;root.updateMatrixWorld(true);
 function diagnostics(){const bounds=new THREE.Box3().setFromObject(root);return {height:bounds.max.y-bounds.min.y,min:bounds.min.toArray(),max:bounds.max.toArray(),scale,triangles:parts.reduce((n,p)=>n+p.geometry.index.count/3,0),parts:parts.map(p=>({name:p.name,components:surfaceComponents(p.geometry),vertices:p.geometry.attributes.position.count,triangles:p.geometry.index.count/3,min:new THREE.Box3().setFromObject(p).min.toArray()}))};}
 return {root,parts,material,diagnostics,dispose(){for(const p of parts)p.geometry.dispose();material.dispose();}};
}
