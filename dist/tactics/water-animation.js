// CPU reference renderer: one shared frame can be reused by every water tile.
export const LOOP_SECONDS=6;
const TAU=Math.PI*2;
const wrap=x=>((x%1)+1)%1;
function sample(src,w,h,u,v,c){
 const x=wrap(u)*w,y=wrap(v)*h,ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;
 const at=(a,b)=>src[((b%h)*w+(a%w))*4+c];
 return (at(ix,iy)*(1-fx)+at(ix+1,iy)*fx)*(1-fy)+(at(ix,iy+1)*(1-fx)+at(ix+1,iy+1)*fx)*fy;
}
// Each source wrap is hidden by a zero-weight band. Unlike mirroring, this
// preserves ripple direction; both value and first derivative remain periodic.
export function makePeriodic(src,w,h,size=192){
 const out=new Uint8ClampedArray(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const u=x/size,v=y/size,ax=Math.sin(Math.PI*u)**2,ay=Math.sin(Math.PI*v)**2,i=(y*size+x)*4;
  for(let c=0;c<3;c++)out[i+c]=
   sample(src,w,h,u,v,c)*ax*ay+
   sample(src,w,h,u+.5,v,c)*(1-ax)*ay+
   sample(src,w,h,u,v+.5,c)*ax*(1-ay)+
   sample(src,w,h,u+.5,v+.5,c)*(1-ax)*(1-ay);
  out[i+3]=255;
 }
 return out;
}
export function waterPixel(base,size,u,v,seconds){
 u=wrap(u);v=wrap(v);
 const phase=TAU*wrap(seconds/LOOP_SECONDS);
 const du=.012*Math.sin(TAU*v+phase)+.005*Math.sin(TAU*(u+v)-phase*2);
 const dv=.009*Math.cos(TAU*u-phase)+.004*Math.sin(TAU*(u-v)+phase);
 const light=1+.025*Math.sin(TAU*(2*u+v)-phase);
 return [0,1,2].map(c=>Math.round(Math.min(255,Math.max(0,sample(base,size,size,u+du,v+dv,c)*light)))).concat(255);
}
export function renderWaterFrame(base,size,seconds,out=new Uint8ClampedArray(size*size*4)){
 // Duplicate terminal samples so opposite edges match exactly at every phase.
 for(let y=0;y<size;y++)for(let x=0;x<size;x++)out.set(waterPixel(base,size,x/(size-1),y/(size-1),seconds),(y*size+x)*4);
 return out;
}
