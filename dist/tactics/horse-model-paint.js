import * as THREE from './vendor/three.module.js';

export const MODEL_PAINT='../assets/characters/lowpoly-proof/horse-worker-model-paint-v1.png';
// These are the exact neutral-reference cameras, independent of the viewing camera.
export const PAINT_FRAME={width:.925,height:1.85,centerY:.825,distance:4,near:.1,far:10};
export function paintCoordinates(p,view){
 const across=[-p[2],p[0],p[2],-p[0]][view],toward=[p[0],p[2],-p[0],-p[2]][view];
 return {uv:[(view+across/PAINT_FRAME.width+.5)/4,(p[1]-PAINT_FRAME.centerY)/PAINT_FRAME.height+.5],depth:(4-toward-.1)/9.9};
}

// Connected-background segmentation is a validity mask, not a change to the artwork.
// Interior grey paint stays valid; only neutral background connected to the image border
// is removed, with a two-pixel guard against painted silhouette drift/antialiasing.
export function paintValidity(rgba,width,height){
 const size=width*height,background=new Uint8Array(size),queue=new Int32Array(size);let head=0,tail=0;
 const neutral=i=>{const k=i*4,a=rgba[k],b=rgba[k+1],c=rgba[k+2];return Math.max(a,b,c)-Math.min(a,b,c)<24&&Math.min(a,b,c)>90&&Math.max(a,b,c)<180;};
 function add(i){if(!background[i]&&neutral(i)){background[i]=1;queue[tail++]=i;}}
 for(let x=0;x<width;x++){add(x);add((height-1)*width+x);}for(let y=0;y<height;y++){add(y*width);add(y*width+width-1);}
 while(head<tail){const i=queue[head++],x=i%width;if(x>0)add(i-1);if(x<width-1)add(i+1);if(i>=width)add(i-width);if(i<size-width)add(i+width);}
 const valid=new Uint8Array(size);valid.fill(255);
 for(let i=0;i<size;i++)if(background[i]){const x=i%width,y=Math.floor(i/width);for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const xx=x+dx,yy=y+dy;if(xx>=0&&xx<width&&yy>=0&&yy<height)valid[yy*width+xx]=0;}}
 return valid;
}

export function createModelPaint(renderer,horse,texture,{species='horse'}={}){
 texture.colorSpace=THREE.SRGBColorSpace;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter;
 texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
 const image=texture.image,canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(image,0,0);
 const mask=new THREE.DataTexture(paintValidity(context.getImageData(0,0,image.width,image.height).data,image.width,image.height),image.width,image.height,THREE.RedFormat);
 mask.flipY=true;mask.minFilter=mask.magFilter=THREE.LinearFilter;mask.needsUpdate=true;
 const scene=new THREE.Scene(),idMaterials=[];
 // Static copies use bind positions, so generating visibility never changes the rig's pose.
 for(let i=0;i<horse.parts.length;i++){
  const source=horse.parts[i],id=i+1,material=new THREE.ShaderMaterial({uniforms:{partId:{value:id}},vertexShader:'void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'uniform float partId;void main(){float d=floor(gl_FragCoord.z*65535.0+.5);gl_FragColor=vec4(partId/255.0,floor(d/256.0)/255.0,mod(d,256.0)/255.0,1.0);}',toneMapped:false});
  const mesh=new THREE.Mesh(source.geometry,material);scene.add(mesh);idMaterials.push(material);
  source.geometry.setAttribute('paintPart',new THREE.Float32BufferAttribute(new Float32Array(source.geometry.attributes.position.count).fill(id),1));
 }
 const target=new THREE.WebGLRenderTarget(2048,1024,{minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter,depthTexture:new THREE.DepthTexture(2048,1024,THREE.UnsignedIntType)});
 const oldTarget=renderer.getRenderTarget(),oldColor=renderer.getClearColor(new THREE.Color()),oldAlpha=renderer.getClearAlpha(),oldTone=renderer.toneMapping,oldSpace=renderer.outputColorSpace;
 const oldViewport=renderer.getViewport(new THREE.Vector4()),oldScissor=renderer.getScissor(new THREE.Vector4()),oldScissorTest=renderer.getScissorTest();
 const camera=new THREE.OrthographicCamera(-.4625,.4625,.925,-.925,.1,10);
 renderer.setRenderTarget(target);renderer.outputColorSpace=THREE.LinearSRGBColorSpace;renderer.toneMapping=THREE.NoToneMapping;renderer.setClearColor(0,0);renderer.setScissorTest(false);renderer.clear();renderer.setScissorTest(true);
 for(let i=0;i<4;i++){const angle=i*Math.PI/2;camera.position.set(4*Math.cos(angle),.825,4*Math.sin(angle));camera.lookAt(0,.825,0);camera.updateProjectionMatrix();renderer.setViewport(i*512,0,512,1024);renderer.setScissor(i*512,0,512,1024);renderer.render(scene,camera);}
 renderer.setRenderTarget(oldTarget);renderer.outputColorSpace=oldSpace;renderer.toneMapping=oldTone;renderer.setClearColor(oldColor,oldAlpha);renderer.setViewport(oldViewport);renderer.setScissor(oldScissor);renderer.setScissorTest(oldScissorTest);
 idMaterials.forEach(m=>m.dispose());
 const debug={value:0},gripForearm={value:0};
 const material=new THREE.MeshBasicMaterial({toneMapped:false});
 material.onBeforeCompile=shader=>{
  Object.assign(shader.uniforms,{uModelPaint:{value:texture},uPaintDepth:{value:target.depthTexture},uPaintParts:{value:target.texture},uPaintMask:{value:mask},uPaintDebug:debug,uGripForearm:gripForearm});
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute float paintPart; varying float vPaintPart; varying vec3 vPaintPosition; varying vec3 vPaintNormal;');
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvPaintPosition=position;vPaintNormal=normal;vPaintPart=paintPart;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
   uniform sampler2D uModelPaint,uPaintDepth,uPaintParts,uPaintMask; uniform float uPaintDebug,uGripForearm;
   varying vec3 vPaintPosition,vPaintNormal; varying float vPaintPart;
   vec3 fallbackPaint(float part){
    ${species==='goat'?`if(part<1.5)return vec3(.52,.28,.055);
    if(part<2.5)return vec3(.13,.17,.058);
    if(abs(part-3.0)<.1||abs(part-5.0)<.1)return vPaintPosition.y>.918?vec3(.52,.28,.055):vec3(.60,.49,.30);
    if(part<6.5)return vec3(.10,.065,.035);
    if(part<7.5)return vPaintPosition.y>1.52?vec3(.25,.16,.078):vec3(.60,.49,.30);
    return vec3(.67,.56,.37);`:''}
    if(part<1.5)return vec3(.67,.61,.43);
    if(part<2.5)return vec3(.13,.17,.058);
    if(abs(part-3.0)<.1||abs(part-5.0)<.1)return vPaintPosition.y>.918?vec3(.67,.61,.43):(vPaintPosition.y<.775?vec3(.045,.033,.022):vec3(.38,.13,.038));
    if(part<6.5)return vec3(.075,.050,.029);
    if(part<7.5)return vec3(.38,.13,.038);
    return vec3(.060,.025,.009);
   }
   vec4 paintView(vec3 p,vec3 n,float view,bool direct){
    float across=view<.5?-p.z:(view<1.5?p.x:(view<2.5?p.z:-p.x));
    float toward=view<.5?p.x:(view<1.5?p.z:(view<2.5?-p.x:-p.z));
    float facing=view<.5?n.x:(view<1.5?n.z:(view<2.5?-n.x:-n.z));
    // The frontal painting owns the blaze; side paintings own cheeks/eyes.
    // This prevents two separately painted ridge edges from becoming two stripes.
    float blazeOwner=${species==='goat'?'0.0':'(1.0-smoothstep(.024,.065,abs(p.z)))*smoothstep(1.375,1.415,p.y)*smoothstep(.0,.04,p.x)*step(6.5,vPaintPart)*step(vPaintPart,7.5)'};
    facing=view<.5?mix(facing,1.0,blazeOwner):facing*(1.0-blazeOwner);
    ${species==='goat'?`// Side paintings own the eye and horn markings; frontal projection otherwise
    // smears their separately painted contours across the oblique surface.
    float eyeOwner=(1.0-smoothstep(.75,1.15,length((p.xy-vec2(.048,1.485))/vec2(.055,.040))))*smoothstep(.047,.065,abs(p.z));
    float hornOwner=smoothstep(1.54,1.57,p.y)*(1.0-smoothstep(-.055,-.025,p.x));
    float owner=max(eyeOwner,hornOwner)*step(6.5,vPaintPart)*step(vPaintPart,7.5);
    float sideView=p.z>0.0?1.0:3.0;
    facing=abs(view-sideView)<.1?mix(facing,1.0,owner):facing*(1.0-owner);`:''}
    vec2 local=vec2(across/.925+.5,(p.y-.825)/1.85+.5),uv=vec2((view+local.x)/4.0,local.y);
    float depth=(4.0-toward-.1)/9.9,visible=1.0-smoothstep(.002/9.9,.009/9.9,depth-texture2D(uPaintDepth,uv).r);
    float sourcePart=texture2D(uPaintParts,uv).r*255.0;
    float samePart=1.0-step(.4,abs(sourcePart-vPaintPart));
    // A sleeve underlap may borrow shirt paint, but never skin or overall paint.
    if(!direct&&p.y>.925&&(abs(vPaintPart-3.0)<.1||abs(vPaintPart-5.0)<.1))samePart=max(samePart,1.0-step(.4,abs(sourcePart-1.0)));
    vec2 colorUV=uv;
    ${species==='goat'?`// Register the painted iris onto the visible orbital shelf, rather than
    // letting it fall entirely into the recessed lower surface at game elevation.
    if(abs(view-sideView)<.1){colorUV.x+=(view<2.0?-.006:.006)/(.925*4.0)*eyeOwner;colorUV.y-=.014/1.85*eyeOwner;}`:''}
    vec3 color=texture2D(uModelPaint,colorUV).rgb;
    float valid=texture2D(uPaintMask,colorUV).r;
    float weight=(direct?pow(max(0.0,facing),4.0)*visible:pow(max(.4,facing),2.0))*samePart*valid;
    weight*=step(0.0,local.x)*step(local.x,1.0)*step(0.0,local.y)*step(local.y,1.0);
    return vec4(color*weight,weight);
   }
  `);
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   vec3 p=vPaintPosition,n=normalize(vPaintNormal);
   vec4 paint=paintView(p,n,0.0,true)+paintView(p,n,1.0,true)+paintView(p,n,2.0,true)+paintView(p,n,3.0,true);
   float coverage=smoothstep(.002,.025,paint.a);
   // Hidden inner surfaces reuse their own garment's front/back paint. This is
   // deliberately separate from visibility-verified projection and shown blue.
   vec3 fillPosition=p;
   if(vPaintPart<2.5&&vPaintPart>1.5&&p.y<.86){float center=.12+clamp(.8-p.y,0.0,.67)*.17;fillPosition.z=mix(p.z,sign(p.z)*center,.16);}
   if(abs(vPaintPart-4.0)<.1||abs(vPaintPart-6.0)<.1)fillPosition.z=mix(p.z,sign(p.z)*.232,.18);
   vec4 fill=paintView(fillPosition,n,0.0,false)+paintView(fillPosition,n,2.0,false);
   ${species==='goat'?`fill+=paintView(fillPosition,n,1.0,false)+paintView(fillPosition,n,3.0,false);`:''}
   float filled=smoothstep(.002,.025,fill.a);
   vec3 base=mix(fallbackPaint(vPaintPart),fill.rgb/max(.00001,fill.a),filled);
   diffuseColor.rgb=mix(base,paint.rgb/max(.00001,paint.a),coverage);
   ${species==='goat'?`// The top of a strap is hidden in all four level reference views. Reuse
   // the same strap's front paint continuously; keep this blue in coverage mode.
   float strap=smoothstep(1.185,1.225,p.y)*(1.0-smoothstep(.035,.055,abs(abs(p.z)-.13)))*(1.0-step(.4,abs(vPaintPart-2.0)));
   vec4 strapPaint=paintView(vec3(.16,1.18,sign(p.z)*.13),vec3(1.,0.,0.),0.,false);
   if(strapPaint.a>.001){diffuseColor.rgb=mix(diffuseColor.rgb,strapPaint.rgb/strapPaint.a*(.86+.14*max(n.y,0.)),strap);coverage*=1.-strap;filled=mix(filled,1.,strap);}`:''}
   // The overhand pose exposes the inner forearm, absent from the four neutral views.
   // Reuse the painted outer forearm at the same height, with broad form shading.
   if(uGripForearm>.5&&abs(vPaintPart-3.0)<.1){
    vec4 armPaint=paintView(vec3(.15,p.y,-.355),vec3(1.,0.,0.),0.,true);
    float armMask=smoothstep(.765,.785,p.y)*(1.-smoothstep(.903,.918,p.y));
    if(armPaint.a>.001)diffuseColor.rgb=mix(diffuseColor.rgb,armPaint.rgb/armPaint.a*(.80+.20*abs(n.x)),armMask);
   }
   if(uPaintDebug>.5)diffuseColor.rgb=mix(mix(vec3(.8,.0,.55),vec3(.03,.18,.95),filled),vec3(.04,.8,.12),coverage);
  `);
 };
 material.customProgramCacheKey=()=> 'worker-model-projection-v3-'+species;
 let visibilityPixels;
 function visibility(p,part,view){
  if(!visibilityPixels){visibilityPixels=new Uint8Array(2048*1024*4);renderer.readRenderTargetPixels(target,0,0,2048,1024,visibilityPixels);}
  const {uv,depth}=paintCoordinates(p,view),x=Math.floor(uv[0]*2048),y=Math.floor(uv[1]*1024);
  if(x<view*512||x>=(view+1)*512||y<0||y>=1024)return {visible:false,reason:'outside'};
  const k=(y*2048+x)*4,surfacePart=visibilityPixels[k],surfaceDepth=(visibilityPixels[k+1]*256+visibilityPixels[k+2])/65535;
  return {visible:surfacePart===part&&depth-surfaceDepth<.009/9.9,surfacePart,depthErrorWorld:(depth-surfaceDepth)*9.9};
 }
 return {setGripForearm(value){gripForearm.value=value?1:0;},material,target,visibility,setDebug(value){debug.value=value?1:0;},dispose(){material.dispose();target.dispose();texture.dispose();mask.dispose();}};
}
