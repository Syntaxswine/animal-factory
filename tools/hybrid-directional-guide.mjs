// Authorship guide only: physical geometry is the input, never inferred from art.
import fs from 'node:fs';
import {DIMENSIONS,GAME_CAMERA,projectWorld} from '../dist/tactics/hybrid-world.js';
import {bodyRegions,muzzlePoint} from '../dist/tactics/hybrid-combat.js';
const scale=DIMENSIONS.standing*Math.cos(GAME_CAMERA.elevation)/236;
const headings=Array.from({length:8},(_,i)=>i*45),stances=['standing','kneeling','prone'];
const frame={width:384,height:320,anchor:[192,256],worldUnitsPerPixel:scale};
const pixel=p=>{const q=projectWorld(p);return [frame.anchor[0]+q[0]/scale,frame.anchor[1]-q[1]/scale];};
const records=[],groups=[],colors={legs:'#80b4ef',torso:'#78d2b2',head:'#ffbb77',weapon:'#ffe287'};
for(const [row,stance]of stances.entries())for(const [column,heading]of headings.entries()){
 const u={x:0,y:0,z:0,hp:100,stance,heading},body=bodyRegions({geometryMode:'hybrid'},u),tip=muzzlePoint({geometryMode:'hybrid'},u),muzzle=pixel([tip.x,tip.h,tip.y]),lines=[];
 for(const region of body.regions){
  const points=[];for(const x of [region.min[0],region.max[0]])for(const y of [region.min[1],region.max[1]])for(const z of [region.min[2],region.max[2]])points.push(pixel([x*Math.cos(body.heading)-z*Math.sin(body.heading),y,x*Math.sin(body.heading)+z*Math.cos(body.heading)]));
  for(let i=0;i<8;i++)for(const mask of [1,2,4]){const j=i^mask;if(j>i)lines.push(`<path d="M${points[i]}L${points[j]}" stroke="${colors[region.zone]}"/>`);}
 }
 records.push({stance,heading,frame,muzzlePixel:muzzle,muzzleWorld:tip});
 groups.push(`<g transform="translate(${column*384},${row*350+50})"><rect width="384" height="320" fill="#172520"/><g fill="none" stroke-width="1">${lines.join('')}<path d="M180,256h24M192,244v24" stroke="white"/><circle cx="${muzzle[0]}" cy="${muzzle[1]}" r="${.05/scale}" stroke="#ff66dd"/></g><circle cx="${muzzle[0]}" cy="${muzzle[1]}" r="2" fill="#ff66dd"/><text x="12" y="20" fill="white">${stance} / ${heading}°</text></g>`);
}
// A finite facing set also needs off-axis validation: engine aim is continuous.
const quantization=[8,16,32,64,128].map(count=>{const worst={};for(const stance of stances){let max=0;for(let h=0;h<360;h+=.1){const nearest=Math.round(h*count/360)*360/count,a=muzzlePoint({geometryMode:'hybrid'},{x:0,y:0,z:0,hp:100,stance,heading:h}),b=muzzlePoint({geometryMode:'hybrid'},{x:0,y:0,z:0,hp:100,stance,heading:nearest});const pa=projectWorld([a.x,a.h,a.y]),pb=projectWorld([b.x,b.h,b.y]);max=Math.max(max,Math.hypot(pa[0]-pb[0],pa[1]-pb[1]));}worst[stance]=max;}return {count,maxProjectedMuzzleError:worst};});
const out=new URL('../docs/tactics/hybrid-review/',import.meta.url);
fs.writeFileSync(new URL('directional-authoring-guide.svg',out),`<svg xmlns="http://www.w3.org/2000/svg" width="3072" height="1100" viewBox="0 0 3072 1100"><rect width="3072" height="1100" fill="#172520"/><text x="12" y="28" fill="white" font-size="20">Authoring geometry — white: world ground anchor; magenta: physical muzzle and 0.05-tile projected tolerance. Not sprite artwork.</text>${groups.join('')}</svg>`);
fs.writeFileSync(new URL('directional-authoring-guide.json',out),JSON.stringify({camera:GAME_CAMERA,frame,tolerance:.05,records,quantization},null,2)+'\n');
console.log(JSON.stringify(quantization,null,2));
