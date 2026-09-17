import fs from 'node:fs';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {physicalTip,CANDIDATE_LAYOUT} from '../dist/tactics/hybrid-directional.js';
import {bodyRegions} from '../dist/tactics/hybrid-combat.js';
import {projectWorld} from '../dist/tactics/hybrid-world.js';
const directory=new URL('../docs/tactics/hybrid-review/directional-proof/',import.meta.url),physical=physicalTip('standing',45),samples=[];
for(const [file,muzzle]of [['standing-45-first.png',[603,495]],['standing-45-corrected.png',[628,576]]]){
 const bytes=fs.readFileSync(new URL(file,directory)),width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20),scale=CANDIDATE_LAYOUT.scale*512/width,anchor=[width/2,420*width/512],target=[anchor[0]+physical[0]/scale,anchor[1]-physical[1]/scale];
 const error=Math.hypot((muzzle[0]-target[0])*scale,(muzzle[1]-target[1])*scale),uncertainty=3*Math.SQRT2*scale;
 samples.push({file,width,height,muzzle,scale,anchor,target,error,estimatedInterval:[Math.max(0,error-uncertainty),error+uncertainty],src:'data:image/png;base64,'+bytes.toString('base64')});
}
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH||'playwright'),browser=await chromium.launch({headless:true,channel:'msedge'});
try{
 const page=await browser.newPage({viewport:{width:1200,height:760}});
 await page.setContent('<style>body{margin:0;background:#172520;color:#eee5cd;font:16px system-ui}</style><canvas width="1200" height="760"></canvas>');
 await page.evaluate(async samples=>{const ctx=document.querySelector('canvas').getContext('2d');ctx.imageSmoothingEnabled=false;ctx.fillStyle='#eee5cd';ctx.font='24px system-ui';ctx.fillText('Single-frame experiment — standing 45°',24,36);ctx.font='16px system-ui';ctx.fillText('Required tolerance: 0.05 tile. Endpoint improvement alone does not approve direction, body or continuity.',24,67);
  for(const [i,s]of samples.entries()){const image=new Image();image.src=s.src;await image.decode();const x=i*600+20,y=110,size=480;ctx.fillStyle='#eee5cd';ctx.fillText(i?'After three localized edits':'First individual generation',x,100);ctx.drawImage(image,x,y,size,size);ctx.strokeStyle='#ff66dd';ctx.beginPath();ctx.arc(x+s.target[0]/s.width*size,y+s.target[1]/s.height*size,7,0,2*Math.PI);ctx.stroke();ctx.fillStyle='#66e8ff';ctx.beginPath();ctx.arc(x+s.muzzle[0]/s.width*size,y+s.muzzle[1]/s.height*size,3,0,2*Math.PI);ctx.fill();ctx.strokeStyle='#fff';const ax=x+s.anchor[0]/s.width*size,ay=y+s.anchor[1]/s.height*size;ctx.beginPath();ctx.moveTo(ax-8,ay);ctx.lineTo(ax+8,ay);ctx.moveTo(ax,ay-8);ctx.lineTo(ax,ay+8);ctx.stroke();ctx.fillStyle='#ffd69d';ctx.fillText('Error '+s.error.toFixed(4)+' · interval '+s.estimatedInterval.map(n=>n.toFixed(4)).join('–')+' tiles',x,620);ctx.imageSmoothingEnabled=false;const native=s.width*s.scale*52;ctx.drawImage(image,x+450,480,native,native);ctx.fillStyle='#eee5cd';ctx.fillText('Native scale',x+430,650);}
  ctx.fillStyle='#eee5cd';ctx.fillText('Magenta: physical muzzle target · cyan: measured painted muzzle · white: fixed world ground anchor',24,716);
 },samples);
 await page.screenshot({path:fileURLToPath(new URL('standing-45-comparison.png',directory))});
 const body=bodyRegions({geometryMode:'hybrid'},{x:0,y:0,z:0,hp:100,stance:'standing',heading:45}),lines=[];
 for(const r of body.regions){const points=[];for(const x of [r.min[0],r.max[0]])for(const y of [r.min[1],r.max[1]])for(const z of [r.min[2],r.max[2]])points.push(projectWorld([x*Math.cos(body.heading)-z*Math.sin(body.heading),y,x*Math.sin(body.heading)+z*Math.cos(body.heading)]));for(let i=0;i<8;i++)for(const mask of [1,2,4]){const j=i^mask;if(j>i)lines.push([points[i],points[j]]);}}
 await page.evaluate(({samples,lines})=>{const ctx=document.querySelector('canvas').getContext('2d');ctx.strokeStyle='#78d2b2';for(const [i,s]of samples.entries())for(const [x,y,size]of [[i*600+20,110,480],[i*600+470,480,s.width*s.scale*52]]){const pixel=p=>[x+(s.anchor[0]+p[0]/s.scale)/s.width*size,y+(s.anchor[1]-p[1]/s.scale)/s.height*size];for(const [a,b]of lines){ctx.beginPath();ctx.moveTo(...pixel(a));ctx.lineTo(...pixel(b));ctx.stroke();}}},{samples,lines});
 await page.screenshot({path:fileURLToPath(new URL('standing-45-body-overlays.png',directory))});
}finally{await browser.close();}
fs.writeFileSync(new URL('standing-45-measurements.json',directory),JSON.stringify({status:'endpoint improved; direction, body registration, style and adjacent-frame continuity not approved',estimatedUncertaintyPixelsPerAxis:3,samples:samples.map(({src,...s})=>s)},null,2)+'\n');
console.log(samples.map(({src,...s})=>s));
