import fs from 'node:fs';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH||'playwright');
const dir=new URL('../docs/tactics/hybrid-review/model-paint/',import.meta.url);fs.mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({headless:true,channel:'msedge'});
try{const page=await browser.newPage();await page.goto('http://127.0.0.1:4389/tactics/horse-light.html');await page.waitForFunction(()=>window.lightHorseReady);
const png=await page.evaluate(async()=>{const T=await import('./vendor/three.module.js');const horse=window.lightHorse;horse.pose('neutral');horse.setGraphic(true);horse.root.visible=true;horse.parts.forEach(p=>{p.visible=true;p.material=horse.material;});
const scene=new T.Scene();scene.add(horse.root);scene.add(new T.HemisphereLight(0xffffff,0xbbbbcc,2));const sun=new T.DirectionalLight(0xffffff,1.4);sun.position.set(2,4,3);scene.add(sun);
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(2048,1024);renderer.setClearColor(0x808080);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;
const camera=new T.OrthographicCamera(-.4625,.4625,.925,-.925,.1,10);renderer.setScissorTest(true);
for(let i=0;i<4;i++){const angle=i*Math.PI/2;camera.position.set(4*Math.cos(angle),.825,4*Math.sin(angle));camera.lookAt(0,.825,0);camera.updateProjectionMatrix();renderer.setViewport(i*512,0,512,1024);renderer.setScissor(i*512,0,512,1024);renderer.render(scene,camera);}return renderer.domElement.toDataURL('image/png').split(',')[1];});fs.writeFileSync(new URL('neutral-paint-reference.png',dir),Buffer.from(png,'base64'));
console.log('Saved four orthographic paint references.');}finally{await browser.close();}
