import * as THREE from './vendor/three.module.js';

export const MODEL_PAINT='../assets/characters/lowpoly-proof/horse-worker-model-paint-v1.png';
// These are the exact neutral-reference cameras, independent of the viewing camera.
export const PAINT_FRAME={width:.925,height:1.85,centerY:.825,distance:4,near:.1,far:10};
export function paintCoordinates(p,view,frame=PAINT_FRAME){
 const across=[-p[2],p[0],p[2],-p[0]][view],toward=[p[0],p[2],-p[0],-p[2]][view];
 return {uv:[(view+across/frame.width+.5)/4,(p[1]-frame.centerY)/frame.height+.5],depth:(frame.distance-toward-frame.near)/(frame.far-frame.near)};
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

export function createModelPaint(renderer,horse,texture,{species='horse',frame=PAINT_FRAME,tailTexture=null}={}){
 if(tailTexture){tailTexture.colorSpace=THREE.SRGBColorSpace;tailTexture.wrapS=THREE.RepeatWrapping;tailTexture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());}
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
 const camera=new THREE.OrthographicCamera(-frame.width/2,frame.width/2,frame.height/2,-frame.height/2,frame.near,frame.far);
 renderer.setRenderTarget(target);renderer.outputColorSpace=THREE.LinearSRGBColorSpace;renderer.toneMapping=THREE.NoToneMapping;renderer.setClearColor(0,0);renderer.setScissorTest(false);renderer.clear();renderer.setScissorTest(true);
 for(let i=0;i<4;i++){const angle=i*Math.PI/2;camera.position.set(frame.distance*Math.cos(angle),frame.centerY,frame.distance*Math.sin(angle));camera.lookAt(0,frame.centerY,0);camera.updateProjectionMatrix();renderer.setViewport(i*512,0,512,1024);renderer.setScissor(i*512,0,512,1024);renderer.render(scene,camera);}
 renderer.setRenderTarget(oldTarget);renderer.outputColorSpace=oldSpace;renderer.toneMapping=oldTone;renderer.setClearColor(oldColor,oldAlpha);renderer.setViewport(oldViewport);renderer.setScissor(oldScissor);renderer.setScissorTest(oldScissorTest);
 idMaterials.forEach(m=>m.dispose());
 const debug={value:0},gripForearm={value:0};
 const material=new THREE.MeshBasicMaterial({toneMapped:false});
 material.onBeforeCompile=shader=>{
  Object.assign(shader.uniforms,{uModelPaint:{value:texture},uPaintDepth:{value:target.depthTexture},uPaintParts:{value:target.texture},uPaintMask:{value:mask},uPaintDebug:debug,uGripForearm:gripForearm});
  if(tailTexture){shader.uniforms.uTailPaint={value:tailTexture};shader.vertexShader='attribute vec3 paintTail; varying vec3 vTail;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvTail=paintTail;');shader.fragmentShader='uniform sampler2D uTailPaint; varying vec3 vTail;\n'+shader.fragmentShader;}
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute float paintPart; varying float vPaintPart; varying vec3 vPaintPosition; varying vec3 vPaintNormal;');
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvPaintPosition=position;vPaintNormal=normal;vPaintPart=paintPart;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
   uniform sampler2D uModelPaint,uPaintDepth,uPaintParts,uPaintMask; uniform float uPaintDebug,uGripForearm;
   varying vec3 vPaintPosition,vPaintNormal; varying float vPaintPart;
   vec3 fallbackPaint(float part){
    ${species==='skunk'?`if(part<1.5)return vec3(.62,.33,.035);
    if(part<2.5)return vec3(.13,.17,.058);
    if(abs(part-3.0)<.1||abs(part-5.0)<.1)return vPaintPosition.y>.918?vec3(.62,.33,.035):vec3(.035,.028,.023);
    if(part<6.5)return vec3(.17,.085,.032);
    return vec3(.035,.028,.023);`:''}
    ${species==='bull'?`if(part<1.5)return vec3(.67,.61,.43);
    if(part<2.5)return vec3(.09,.14,.10);
    if(abs(part-3.0)<.1||abs(part-5.0)<.1)return vPaintPosition.y>.918?vec3(.67,.61,.43):(vPaintPosition.y<.775?vec3(.065,.040,.025):vec3(.44,.18,.07));
    if(part<6.5)return vec3(.075,.050,.029);
    if(part<7.5)return vPaintPosition.y>1.54?vec3(.44,.28,.10):vec3(.44,.18,.07);
    return vPaintPosition.y<.415?vec3(.66,.49,.23):vec3(.38,.13,.038);`:''}
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
    float blazeOwner=${species==='goat'?'0.0':species==='bull'?'(1.0-smoothstep(.024,.065,abs(p.z)))*smoothstep(1.435,1.455,p.y)*smoothstep(.0,.04,p.x)*step(6.5,vPaintPart)*step(vPaintPart,7.5)':'(1.0-smoothstep(.024,.065,abs(p.z)))*smoothstep(1.375,1.415,p.y)*smoothstep(.0,.04,p.x)*step(6.5,vPaintPart)*step(vPaintPart,7.5)'};
    facing=view<.5?mix(facing,1.0,blazeOwner):facing*(1.0-blazeOwner);
    ${species==='skunk'?`float eyeOwner=(1.0-smoothstep(.75,1.15,length((p.xy-vec2(.050,1.474))/vec2(.045,.033))))*smoothstep(.060,.084,abs(p.z))*step(6.5,vPaintPart)*step(vPaintPart,7.5);
    float sideView=p.z>0.0?1.0:3.0;
    facing=abs(view-sideView)<.1?mix(facing,1.0,eyeOwner):facing*(1.0-eyeOwner);`:''}
    ${species==='bull'?`// Register each eye from its own profile without competing front contours.
    float eyeOwner=(1.0-smoothstep(.75,1.15,length((p.xy-vec2(.050,1.447))/vec2(.050,.035))))*smoothstep(.070,.100,abs(p.z))*step(6.5,vPaintPart)*step(vPaintPart,7.5);
    float sideView=p.z>0.0?1.0:3.0;
    facing=abs(view-sideView)<.1?mix(facing,1.0,eyeOwner):facing*(1.0-eyeOwner);`:''}
    ${species==='goat'?`// Side paintings own the eye and horn markings; frontal projection otherwise
    // smears their separately painted contours across the oblique surface.
    float eyeOwner=(1.0-smoothstep(.75,1.15,length((p.xy-vec2(.048,1.485))/vec2(.055,.040))))*smoothstep(.047,.065,abs(p.z));
    float hornOwner=smoothstep(1.54,1.57,p.y)*(1.0-smoothstep(-.055,-.025,p.x));
    float owner=max(eyeOwner,hornOwner)*step(6.5,vPaintPart)*step(vPaintPart,7.5);
    float sideView=p.z>0.0?1.0:3.0;
    facing=abs(view-sideView)<.1?mix(facing,1.0,owner):facing*(1.0-owner);`:''}
    vec2 local=vec2(across/${frame.width.toFixed(6)}+.5,(p.y-${frame.centerY.toFixed(6)})/${frame.height.toFixed(6)}+.5),uv=vec2((view+local.x)/4.0,local.y);
    float depth=(${frame.distance.toFixed(6)}-toward-${frame.near.toFixed(6)})/${(frame.far-frame.near).toFixed(6)},visible=1.0-smoothstep(.002/${(frame.far-frame.near).toFixed(6)},.009/${(frame.far-frame.near).toFixed(6)},depth-texture2D(uPaintDepth,uv).r);
    float sourcePart=texture2D(uPaintParts,uv).r*255.0;
    float samePart=1.0-step(.4,abs(sourcePart-vPaintPart));
    // A sleeve underlap may borrow shirt paint, but never skin or overall paint.
    if(!direct&&p.y>.925&&(abs(vPaintPart-3.0)<.1||abs(vPaintPart-5.0)<.1))samePart=max(samePart,1.0-step(.4,abs(sourcePart-1.0)));
    vec2 colorUV=uv;
    ${species==='skunk'?`// ImageGen preserved scale but translated the painted figures 33 pixels
    // upward in the 887px sheet. Register color/mask only; depth stays geometric.
    colorUV.y+=33.0/887.0;`:''}
    ${species==='goat'?`// Register the painted iris onto the visible orbital shelf, rather than
    // letting it fall entirely into the recessed lower surface at game elevation.
    if(abs(view-sideView)<.1){colorUV.x+=(view<2.0?-.006:.006)/(${frame.width.toFixed(6)}*4.0)*eyeOwner;colorUV.y-=.014/${frame.height.toFixed(6)}*eyeOwner;}`:''}
    vec3 color=texture2D(uModelPaint,colorUV).rgb;
    float valid=texture2D(uPaintMask,colorUV).r;
    float weight=(direct?pow(max(0.0,facing),4.0)*visible:pow(max(.4,facing),2.0))*samePart*valid;
    ${species==='skunk'?`// The ears and crown share one connected mesh. Profile ear interiors
    // must not be reused across the hidden crown between the ears.
    float crown=smoothstep(1.54,1.565,p.y)*(1.-smoothstep(.045,.070,abs(p.z)))*step(6.5,vPaintPart)*step(vPaintPart,7.5);
    if(abs(view-1.)<.1||abs(view-3.)<.1)weight*=1.-crown;`:''}
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
   ${species==='goat'||species==='bull'||species==='skunk'?`fill+=paintView(fillPosition,n,1.0,false)+paintView(fillPosition,n,3.0,false);`:''}
   float filled=smoothstep(.002,.025,fill.a);
   vec3 base=mix(fallbackPaint(vPaintPart),fill.rgb/max(.00001,fill.a),filled);
   diffuseColor.rgb=mix(base,paint.rgb/max(.00001,paint.a),coverage);
   // A +.25 UV phase turns the painted stripes clockwise viewed from tip toward root.
   ${tailTexture?`if(vPaintPart>7.5){vec2 tailUV=vec2(.50+atan(vTail.y,vTail.x)/6.28318530718,vTail.z);vec3 dx=dFdx(vTail),dy=dFdy(vTail);float radius2=max(dot(vTail.xy,vTail.xy),.000001);vec2 uvDx=vec2((vTail.x*dx.y-vTail.y*dx.x)/radius2/6.28318530718,dx.z),uvDy=vec2((vTail.x*dy.y-vTail.y*dy.x)/radius2/6.28318530718,dy.z);diffuseColor.rgb=textureGrad(uTailPaint,tailUV,uvDx,uvDy).rgb*(.83+.17*max(n.y,0.));coverage=1.;filled=1.;}`:''}
   ${species==='skunk'?`float strap=smoothstep(1.185,1.225,p.y)*(1.0-smoothstep(.035,.055,abs(abs(p.z)-.136)))*(1.0-step(.4,abs(vPaintPart-2.0)));
   vec4 strapPaint=paintView(vec3(.16,1.18,sign(p.z)*.136),vec3(1.,0.,0.),0.,false);
   if(strapPaint.a>.001){diffuseColor.rgb=mix(diffuseColor.rgb,strapPaint.rgb/strapPaint.a*(.86+.14*max(n.y,0.)),strap);coverage*=1.-strap;filled=mix(filled,1.,strap);}`:''}
   ${species==='bull'?`// The edited profiles provide plain pink shading. Reuse the frontal nasal
   // painting around the rounded pad with a broad feather into that compatible color.
   float nose=smoothstep(.155,.215,p.x)*(1.0-smoothstep(1.416,1.438,p.y))*smoothstep(1.348,1.37,p.y)*step(6.5,vPaintPart)*step(vPaintPart,7.5);
   vec4 nosePaint=paintView(vec3(.23,p.y,atan(p.z,max(.025,p.x-.15))*.058),vec3(1.,0.,0.),0.,false);
   if(nosePaint.a>.001){diffuseColor.rgb=mix(diffuseColor.rgb,nosePaint.rgb/nosePaint.a,nose);coverage*=1.-nose;filled=mix(filled,1.,nose);}`:''}
   ${species==='bull'?`// Reuse the same broad strap's front painting across its hidden upper turn.
   float strap=smoothstep(1.185,1.225,p.y)*(1.0-smoothstep(.035,.055,abs(abs(p.z)-.143)))*(1.0-step(.4,abs(vPaintPart-2.0)));
   vec4 strapPaint=paintView(vec3(.17,1.18,sign(p.z)*.143),vec3(1.,0.,0.),0.,false);
   if(strapPaint.a>.001){diffuseColor.rgb=mix(diffuseColor.rgb,strapPaint.rgb/strapPaint.a*(.86+.14*max(n.y,0.)),strap);coverage*=1.-strap;filled=mix(filled,1.,strap);}`:''}
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
 material.customProgramCacheKey=()=> 'worker-model-projection-v4-'+species+'-'+JSON.stringify(frame)+'-'+Boolean(tailTexture);
 let visibilityPixels;
 function visibility(p,part,view){
  if(!visibilityPixels){visibilityPixels=new Uint8Array(2048*1024*4);renderer.readRenderTargetPixels(target,0,0,2048,1024,visibilityPixels);}
  const {uv,depth}=paintCoordinates(p,view,frame),x=Math.floor(uv[0]*2048),y=Math.floor(uv[1]*1024);
  if(x<view*512||x>=(view+1)*512||y<0||y>=1024)return {visible:false,reason:'outside'};
  const k=(y*2048+x)*4,surfacePart=visibilityPixels[k],surfaceDepth=(visibilityPixels[k+1]*256+visibilityPixels[k+2])/65535;
  return {visible:surfacePart===part&&depth-surfaceDepth<.009/(frame.far-frame.near),surfacePart,depthErrorWorld:(depth-surfaceDepth)*(frame.far-frame.near)};
 }
 return {setGripForearm(value){gripForearm.value=value?1:0;},material,target,visibility,setDebug(value){debug.value=value?1:0;},dispose(){material.dispose();target.dispose();texture.dispose();mask.dispose();}};
}
