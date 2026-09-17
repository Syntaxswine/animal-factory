// Test helper (not a test file): a Canvas2D stand-in that records every call, refuses non-finite numbers,
// and flattens each filled path into polygons (arcs, ellipses and curves sampled) so winding and bounds
// can be checked. Transforms are recorded but not applied to the polygons.
const TAU=Math.PI*2;
export function recorder(){
 const calls=[],fills=[];let path=[],current=null,last=[0,0];
 const finite=(name,values)=>{for(const v of values)if(typeof v==='number'&&!Number.isFinite(v))throw Error(`${name} received ${v}`);};
 const lineTo=(x,y)=>{if(!current){current=[];path.push(current);}current.push([x,y]);last=[x,y];};
 const moveTo=(x,y)=>{current=[[x,y]];path.push(current);last=[x,y];};
 const sweep=(a0,a1,ccw)=>{const d=ccw?a0-a1:a1-a0;const s=d>=TAU?TAU:((d%TAU)+TAU)%TAU;return ccw?-s:s;};
 const ellipse=(cx,cy,rx,ry,rotation,a0,a1,ccw=false)=>{
  const span=sweep(a0,a1,ccw),c=Math.cos(rotation),s=Math.sin(rotation);
  for(let i=0;i<=24;i++){const a=a0+span*i/24,x=rx*Math.cos(a),y=ry*Math.sin(a);lineTo(cx+x*c-y*s,cy+x*s+y*c);}
 };
 const style={fillStyle:'',strokeStyle:'',lineWidth:1,globalAlpha:1,lineJoin:'miter',lineCap:'butt',font:'',textAlign:'start'};
 const ctx={calls,fills,
  save(){calls.push(['save']);},restore(){calls.push(['restore']);},
  beginPath(){calls.push(['beginPath']);path=[];current=null;},
  closePath(){calls.push(['closePath']);current=null;},
  moveTo(x,y){finite('moveTo',[x,y]);calls.push(['moveTo',x,y]);moveTo(x,y);},
  lineTo(x,y){finite('lineTo',[x,y]);calls.push(['lineTo',x,y]);lineTo(x,y);},
  quadraticCurveTo(cx,cy,x,y){finite('quadraticCurveTo',[cx,cy,x,y]);calls.push(['quadraticCurveTo',cx,cy,x,y]);const [x0,y0]=last;for(let i=1;i<=8;i++){const t=i/8;lineTo((1-t)**2*x0+2*(1-t)*t*cx+t*t*x,(1-t)**2*y0+2*(1-t)*t*cy+t*t*y);}},
  arc(x,y,r,a0,a1,ccw=false){finite('arc',[x,y,r,a0,a1]);if(r<0)throw Error('arc radius '+r);calls.push(['arc',x,y,r,a0,a1,ccw]);ellipse(x,y,r,r,0,a0,a1,ccw);},
  ellipse(x,y,rx,ry,rotation,a0,a1,ccw=false){finite('ellipse',[x,y,rx,ry,rotation,a0,a1]);if(rx<0||ry<0)throw Error('ellipse radius');calls.push(['ellipse',x,y,rx,ry,rotation,a0,a1,ccw]);ellipse(x,y,rx,ry,rotation,a0,a1,ccw);},
  fill(){calls.push(['fill',style.fillStyle,style.globalAlpha]);fills.push({style:style.fillStyle,polygons:path.map(p=>p.slice())});},
  stroke(){calls.push(['stroke',style.strokeStyle,style.lineWidth,style.globalAlpha]);},
  translate(x,y){finite('translate',[x,y]);calls.push(['translate',x,y]);},
  rotate(a){finite('rotate',[a]);calls.push(['rotate',a]);},
  setTransform(...m){finite('setTransform',m);calls.push(['setTransform',...m]);},
  drawImage(...args){finite('drawImage',args.slice(1));calls.push(['drawImage',...args]);},
 };
 for(const key of Object.keys(style))Object.defineProperty(ctx,key,{get:()=>style[key],set:v=>{if(typeof v==='number')finite(key,[v]);style[key]=v;calls.push(['set',key,v]);}});
 return ctx;
}
// Signed area in screen coordinates: positive for the clockwise-on-screen winding canvas arcs use.
export const area=polygon=>polygon.reduce((sum,[x,y],i)=>{const [u,v]=polygon[(i+1)%polygon.length];return sum+x*v-u*y;},0)/2;
