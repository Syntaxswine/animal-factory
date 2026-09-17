import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH||'playwright');
const browser=await chromium.launch({headless:true,channel:'msedge'});
try {
 const page=await browser.newPage({viewport:{width:1500,height:550}});
 await page.goto('http://127.0.0.1:4389/tactics/hybrid-viewer.html');
 await page.evaluate(async()=>{
  document.body.replaceChildren();document.body.style.cssText='margin:0;background:#192922;color:#fff;font:18px sans-serif;display:flex;gap:12px;padding:12px';
  for(const file of ['brick-factory-v1.png','wood-factory-v2.png','metal-factory-v1.png']){
   const column=document.createElement('div'),label=document.createElement('p'),canvas=document.createElement('canvas');label.textContent=file+' — 3 × 3';canvas.width=canvas.height=480;
   const img=new Image();img.src='/assets/environment/hybrid-surfaces/'+file;await img.decode();
   const ctx=canvas.getContext('2d');for(let y=0;y<3;y++)for(let x=0;x<3;x++)ctx.drawImage(img,x*160,y*160,160,160);
   column.append(label,canvas);document.body.append(column);
  }
 });
 await page.screenshot({path:fileURLToPath(new URL('../docs/tactics/hybrid-review/visual-selected-texture-repeats.png',import.meta.url))});
}finally{await browser.close();}
