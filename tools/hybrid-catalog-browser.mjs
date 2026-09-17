import {createRequire} from 'node:module';import {fileURLToPath} from 'node:url';import fs from 'node:fs';import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH||'playwright'),browser=await chromium.launch({headless:true,channel:'msedge'}),output=new URL('../docs/tactics/hybrid-review/',import.meta.url);
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:4389/tactics/hybrid-viewer.html',{waitUntil:'networkidle'});
 const result=await page.evaluate(async()=>{
  const {unitArt}=await import('./red-hats-art.js'),{WEAPONS}=await import('./engine.js'),{HybridRenderer,hybridArtwork,calibratedLandmarks,TEXTURE_LIMIT}=await import('./hybrid-renderer.js'),{alphaBounds,spriteVertex}=await import('./hybrid-sprites.js'),{projectWorld,toWorld,GAME_CAMERA}=await import('./hybrid-world.js'),{muzzlePoint}=await import('./hybrid-combat.js'),{blankMap}=await import('./maps.js');
  const sheet=document.createElement('canvas');sheet.width=1440;sheet.height=Object.keys(WEAPONS).length*180;const ctx=sheet.getContext('2d');ctx.fillStyle='#182a25';ctx.fillRect(0,0,sheet.width,sheet.height);let cases=0,maxError=0;
  for(const species of ['horse','goat','donkey','sheep','cow','hen','skunk','pig-foreman','pig-director'])for(const [row,weapon]of Object.keys(WEAPONS).entries())for(const [column,stance]of ['standing','kneeling','prone'].entries())for(const [uniform,outfit]of ['normal','red-hats'].entries()){
   const unit={id:0,x:0,y:0,z:0,hp:100,species,weapon,stance,outfit,heading:0,facing:1},art=hybridArtwork(unit),img=new Image();img.src=art.src;await img.decode();const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(img,0,0);const pixels=g.getImageData(0,0,c.width,c.height).data,bounds=alphaBounds(pixels,c.width,c.height),landmarks=calibratedLandmarks(unit,art,pixels,c.width,c.height,bounds);
   if(landmarks)for(let heading=0;heading<360;heading+=45){unit.heading=heading;const p=spriteVertex(unit,{...art,weaponLandmarks:landmarks},bounds,...landmarks.muzzle,GAME_CAMERA),m=muzzlePoint({geometryMode:'hybrid'},unit),q=projectWorld(toWorld(m));maxError=Math.max(maxError,Math.hypot(p[0]-q[0],p[1]-q[1]));}
   if(species==='horse'){const x=(column*2+uniform)*240,y=row*180,scale=Math.min(225/img.width,145/img.height);ctx.drawImage(img,x,y+23,img.width*scale,img.height*scale);ctx.fillStyle='#eed9a1';ctx.font='12px monospace';ctx.fillText(weapon+' '+stance+' '+outfit,x+2,y+14);if(landmarks){ctx.fillStyle='#ff4747';ctx.beginPath();ctx.arc(x+landmarks.muzzle[0]*scale,y+23+landmarks.muzzle[1]*scale,3,0,7);ctx.fill();}}
   cases++;
  }
  const canvas=document.createElement('canvas');canvas.width=800;canvas.height=600;const renderer=new HybridRenderer(),map=blankMap();map.guards=[];const view={x:400,y:140,zoom:1},context=canvas.getContext('2d');map.starts=[{x:0,y:0,z:0}];
  // More than 64 distinct loaded poses across repeated map/pose changes.
  const snapshots=[];
  for(let i=0;i<90;i++){map.starts=[];map.guards=[{id:i,x:0,y:0,z:0,species:['horse','goat','cow'][Math.floor(i/30)],weapon:Object.keys(WEAPONS)[Math.floor(i/3)%10],stance:['standing','kneeling','prone'][i%3],heading:0}];renderer.draw(context,map,view,800,600,0,{editor:true});await new Promise(r=>setTimeout(r,20));renderer.draw(context,map,view,800,600,0,{editor:true});snapshots.push(renderer.stats());}
  const stats=renderer.stats();renderer.dispose();return {cases,maxError,sheet:sheet.toDataURL(),stats:{...stats,drawTimes:undefined},maxCached:Math.max(...snapshots.map(s=>s.cachedPoses)),maxActors:Math.max(...snapshots.map(s=>s.actors)),limit:TEXTURE_LIMIT,disposed:{textures:renderer.textures.size,actors:renderer.actors.size}};
 });
 assert.ok(result.maxError<.05,String(result.maxError));assert.ok(result.maxCached<=result.limit);assert.equal(result.maxActors,1);assert.deepEqual(result.disposed,{textures:0,actors:0});assert.deepEqual(errors,[]);
 fs.writeFileSync(new URL('stage-4-weapon-landmarks.png',output),Buffer.from(result.sheet.split(',')[1],'base64'));delete result.sheet;fs.writeFileSync(new URL('catalog-browser.json',output),JSON.stringify(result,null,2));console.log(result);
}finally{await browser.close();}
