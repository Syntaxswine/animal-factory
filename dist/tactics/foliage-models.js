// Presentation geometry only: the existing tree footprints and collision boxes
// remain the authority for movement, line of sight and cover.
export function foliageModel(kind){
 const parts=[],add=(shape,material,center,size,rotation=[0,0,0])=>parts.push({shape,material,center,size,rotation});
 const branch=(a,b,width,shape='taper')=>{const v=b.map((n,i)=>n-a[i]);add(shape,'bark',a.map((n,i)=>(n+b[i])/2),[width,Math.hypot(...v),width],[Math.atan2(v[2],v[1]),0,-Math.atan2(v[0],Math.hypot(v[1],v[2]))]);};
 branch([0,.02,0],[-.035,.86,.018],.245);branch([-.035,.75,.018],[.055,1.62,-.02],.15);
 add('taper','bark',[0,.09,0],[.34,.22,.32]);
 for(let i=0;i<5;i++){const a=i*2.4;branch([0,.15,0],[Math.cos(a)*.33,-.065,Math.sin(a)*.30],.135,'cone');}
 if(kind==='tree-pine'){
  branch([.055,1.45,-.02],[.015,2.30,0],.07);
  for(let tier=0;tier<5;tier++)for(let i=0;i<5;i++){
   const angle=i*Math.PI*2/5+tier*.91,radius=.47-tier*.085,y=.82+tier*.30+Math.sin(i*3+tier)*.055;
   const x=Math.cos(angle)*radius,z=Math.sin(angle)*radius;
   branch([0,y+.22,0],[x,y-.03,z],.035);
   add('pine-fan','pine',[x*.74,y+.10,z*.74],[(.84-tier*.13)*(1+.08*Math.sin(i*7)),.33-tier*.03,.61-tier*.095],[0,-angle,.08*Math.sin(i*3)]);
  }
  for(let i=0;i<3;i++)add('pine-fan','pine',[.015,2.24+i*.025,0],[.27,.38,.18],[0,i*2.1,-.45]);
 }else{
  const limbs=[[-.46,1.47,-.18],[.40,1.59,.28],[-.22,1.81,.23],[.30,1.91,-.31]];
  add('broadleaf-crown','leaf-light',[.015,1.91,.01],[1.73,1.09,1.60],[0,.7,0]);
  for(const [i,tip]of limbs.entries()){
   branch([0,.83+i*.16,0],tip,.11-i*.012);
   const [x,y,z]=tip;branch([x*.6,y-.1,z*.6],[x*1.10,y+.13,z*1.1],.055);
  }
 }
 return parts;
}

// Stable local variation survives editor rebuilds, fog updates and camera moves.
export function grassTufts(box){
 if(box.kind!=='floor'||!['yard','ground-grass','woodland'].includes(box.material))return [];
 const {x,y,z=0}=box.source,seed=(Math.imul(x+91,73856093)^Math.imul(y+37,19349663)^Math.imul(z+7,83492791))>>>0;
 const random=i=>((Math.imul(seed^(i*374761393),1597334677)>>>0)%10000)/10000;
 const count=box.material==='yard'?(seed%3===0?1:0):2,top=box.center[1]+box.size[1]/2;
 return Array.from({length:count},(_,i)=>{
  const height=.10+random(i+5)*.095;
  return {id:box.id+':tuft:'+i,source:box.source,kind:'grass',material:'grass-blade',shape:'grass-tuft',center:[x+(random(i+1)-.5)*.72,top+height/2,y+(random(i+3)-.5)*.72],size:[.20+random(i+7)*.12,height,.18+random(i+9)*.12],rotation:[0,random(i+11)*Math.PI*2,0]};
 });
}
