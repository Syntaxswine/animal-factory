import fs from 'node:fs';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH||'playwright');
const browser=await chromium.launch({headless:true,channel:'msedge'});
try {
 const page=await browser.newPage();await page.goto('http://127.0.0.1:4389/tactics/hen-worker.html?stage=grey');await page.waitForFunction(()=>window.lightHorseReady);
 for(const kind of ['underlay','tail']){
  const png=await page.evaluate(async kind=>{
   const T=await import('./vendor/three.module.js'),{HEN_FRAME:f}=await import('./hen-worker.js'),hen=henWorkerVariants['28k'].horse;
   const scene=new T.Scene();
   for(let i=0;i<hen.parts.length;i++){
    if(kind==='tail'?i!==9:[7,8,9].includes(i))continue;
    const g=hen.parts[i].geometry.clone();g.setAttribute('position',g.getAttribute('paintPosition'));g.setAttribute('normal',g.getAttribute('paintNormal'));scene.add(new T.Mesh(g,hen.grey));
   }
   scene.add(new T.HemisphereLight(0xffffff,0xbbbbcc,2));const sun=new T.DirectionalLight(0xffffff,1.4);sun.position.set(2,4,3);scene.add(sun);
   const r=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});r.setSize(2048,1024);r.setClearColor(0x808080);r.outputColorSpace=T.SRGBColorSpace;r.toneMapping=T.ACESFilmicToneMapping;
   const c=new T.OrthographicCamera(-f.width/2,f.width/2,f.height/2,-f.height/2,f.near,f.far);r.setScissorTest(true);
   for(let i=0;i<4;i++){const a=i*Math.PI/2;c.position.set(f.distance*Math.cos(a),f.centerY,f.distance*Math.sin(a));c.lookAt(0,f.centerY,0);c.updateProjectionMatrix();r.setViewport(i*512,0,512,1024);r.setScissor(i*512,0,512,1024);r.render(scene,c);}
   return r.domElement.toDataURL('image/png').split(',')[1];
  },kind);
  fs.writeFileSync(new URL('../docs/tactics/hybrid-review/hen-worker/'+kind+'-paint-reference.png',import.meta.url),Buffer.from(png,'base64'));
 }
}finally{await browser.close();}
