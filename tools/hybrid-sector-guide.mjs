import fs from 'node:fs';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {bodyRegions,muzzlePoint} from '../dist/tactics/hybrid-combat.js';
import {DIMENSIONS,GAME_CAMERA,projectWorld} from '../dist/tactics/hybrid-world.js';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH||'playwright');
const directory=new URL('../docs/tactics/hybrid-review/directional-proof/',import.meta.url);
fs.mkdirSync(directory,{recursive:true});
const scale=DIMENSIONS.standing*Math.cos(GAME_CAMERA.elevation)/360;
const frame={width:512,height:512,anchor:[256,420],worldUnitsPerPixel:scale};
const headings=Array.from({length:17},(_,i)=>22.5+i*2.8125);
const pixel=p=>{const q=projectWorld(p);return [256+q[0]/scale,420-q[1]/scale];};
const browser=await chromium.launch({headless:true,channel:'msedge'});
try{
 for(const stance of ['standing','kneeling','prone']){
  const frames=headings.map((heading,index)=>{const unit={x:0,y:0,z:0,hp:100,heading,stance},body=bodyRegions({geometryMode:'hybrid'},unit),tip=muzzlePoint({geometryMode:'hybrid'},unit);
   return {index,heading,stance,rect:[index%5*512,Math.floor(index/5)*512,512,512],muzzle:pixel([tip.x,tip.h,tip.y]),regions:body.regions.map(r=>{const points=[];for(const x of [r.min[0],r.max[0]])for(const y of [r.min[1],r.max[1]])for(const z of [r.min[2],r.max[2]])points.push(pixel([x*Math.cos(body.heading)-z*Math.sin(body.heading),y,x*Math.sin(body.heading)+z*Math.cos(body.heading)]));return {zone:r.zone,points};})};});
  const page=await browser.newPage({viewport:{width:2560,height:2048}});
  await page.setContent('<style>body{margin:0}canvas{display:block}</style><canvas width="2560" height="2048"></canvas>');
  await page.evaluate(({frames})=>{const c=document.querySelector('canvas').getContext('2d');c.fillStyle='#eeeeee';c.fillRect(0,0,2560,2048);
   for(const f of frames){c.save();c.translate(f.rect[0],f.rect[1]);c.strokeStyle='#cccccc';c.strokeRect(.5,.5,511,511);c.font='18px sans-serif';c.fillStyle='#555';c.fillText(f.index+' / '+f.stance+' / '+f.heading+' degrees',16,24);
    for(const r of f.regions){c.strokeStyle={legs:'#7e9ab2',torso:'#548575',head:'#997654',weapon:'#78622f'}[r.zone];c.lineWidth=r.zone==='weapon'?3:1;for(let i=0;i<8;i++)for(const mask of [1,2,4]){const j=i^mask;if(j>i){c.beginPath();c.moveTo(...r.points[i]);c.lineTo(...r.points[j]);c.stroke();}}}
    c.strokeStyle='#444';c.beginPath();c.moveTo(246,420);c.lineTo(266,420);c.moveTo(256,410);c.lineTo(256,430);c.stroke();c.fillStyle='#ff00a8';c.beginPath();c.arc(...f.muzzle,3,0,2*Math.PI);c.fill();c.restore();
   }
  },{frames});
  await page.screenshot({path:fileURLToPath(new URL(stance+'-guide.png',directory))});
  await page.screenshot({path:fileURLToPath(new URL(stance+'-45-guide.png',directory)),clip:{x:1536,y:512,width:512,height:512}});await page.close();
  fs.writeFileSync(new URL(stance+'-guide.json',directory),JSON.stringify({frame,columns:5,rows:4,frames},null,2)+'\n');
 }
}finally{await browser.close();}
