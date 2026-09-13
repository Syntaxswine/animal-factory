export const COLS=38, ROWS=24;
export const DIRS=[[1,0],[0,1],[-1,0],[0,-1]];
export const TYPES={field:{name:'Wheat field',out:'wheat',time:3,color:'#b99a45'},mill:{name:'Mill',input:'wheat',out:'flour',amount:2,time:4,color:'#879a92'},bakery:{name:'Bakery',input:'flour',out:'bread',amount:2,time:5,color:'#bb7051'},house:{name:'Farmhouse',input:'bread',color:'#963f35'}};
export const key=(x,y)=>`${x},${y}`;
export function ports(b){const [dx,dy]=DIRS[b.dir];return {input:{x:b.x+1-dx,y:b.y+1-dy},output:{x:b.x+1+dx,y:b.y+1+dy}};}
export function line(a,b,fallback=0){let dx=b.x-a.x,dy=b.y-a.y;const horizontal=Math.abs(dx)>=Math.abs(dy);if(horizontal)dy=0;else dx=0;const dir=dx>0?0:dy>0?1:dx<0?2:dy<0?3:fallback;const [sx,sy]=DIRS[dir];return Array.from({length:Math.max(Math.abs(dx),Math.abs(dy))+1},(_,i)=>({x:a.x+sx*i,y:a.y+sy*i,dir}));}
export class Farm{
 constructor(){this.buildings=[];this.belts={};this.stats={wheat:0,flour:0,bread:0};this.clock=0;this.stepClock=0;this.nextId=1;}
 inside(x,y){return x>=0&&y>=0&&x<COLS&&y<ROWS;}
 at(x,y){return this.buildings.find(b=>x>=b.x&&x<b.x+3&&y>=b.y&&y<b.y+3);}
 canPlace(x,y){for(let j=y;j<y+3;j++)for(let i=x;i<x+3;i++)if(!this.inside(i,j)||this.at(i,j)||this.belts[key(i,j)])return false;return true;}
 place(type,x,y,dir=0){if(!TYPES[type]||!this.canPlace(x,y))return false;const b={id:this.nextId++,type,x,y,dir,input:0,output:0,progress:0};this.buildings.push(b);return b;}
 canLay(cells){return cells.every(c=>this.inside(c.x,c.y)&&!this.at(c.x,c.y));}
 lay(cells){if(!this.canLay(cells))return false;for(const c of cells){const old=this.belts[key(c.x,c.y)];this.belts[key(c.x,c.y)]={...c,item:old?.item??null};}return true;}
 remove(cells){let n=0;for(const c of cells){const b=this.at(c.x,c.y);if(b&&b.type!=='house'){this.buildings=this.buildings.filter(a=>a!==b);n++;}if(this.belts[key(c.x,c.y)]){delete this.belts[key(c.x,c.y)];n++;}}return n;}
 snapshot(){return JSON.stringify({buildings:this.buildings,belts:this.belts,stats:this.stats,clock:this.clock,stepClock:this.stepClock,nextId:this.nextId});}
 restore(s){Object.assign(this,JSON.parse(s));}
 advance(dt){this.clock+=dt;for(const b of this.buildings){const t=TYPES[b.type];if(b.type==='house')continue;if(b.output>=4||(t.input&&b.input<t.amount)){b.progress=0;continue;}b.progress+=dt;if(b.progress>=t.time){b.progress-=t.time;if(t.input)b.input-=t.amount;b.output++;this.stats[t.out==='bread'?'baked':t.out]=(this.stats[t.out==='bread'?'baked':t.out]??0)+1;}}
 this.stepClock+=dt;while(this.stepClock>=.3){this.stepClock-=.3;this.move();}}
 move(){const occupied=new Set(Object.entries(this.belts).filter(([,b])=>b.item).map(([k])=>k));const claimed=new Set();const moves=[];
 for(const [k,b]of Object.entries(this.belts)){if(!b.item)continue;const [dx,dy]=DIRS[b.dir],nx=b.x+dx,ny=b.y+dy,nk=key(nx,ny),target=this.belts[nk];if(target&&!occupied.has(nk)&&!claimed.has(nk)){claimed.add(nk);moves.push(()=>{target.item=b.item;b.item=null;});continue;}
 const building=this.at(nx,ny);if(!building)continue;const t=TYPES[building.type],p=ports(building).input;if(p.x!==nx||p.y!==ny||building.dir!==b.dir||t.input!==b.item||building.input>=8)continue;
 if(building.type==='house'){this.stats.bread++;b.item=null;}else{building.input++;b.item=null;}}
 for(const m of moves)m();
 for(const b of this.buildings){const t=TYPES[b.type];if(!t.out||!b.output)continue;const p=ports(b).output,[dx,dy]=DIRS[b.dir],target=this.belts[key(p.x+dx,p.y+dy)];if(target&&!target.item){target.item=t.out;b.output--;}}}
}
export function starter(connected=false){const f=new Farm();f.place('field',3,10);f.place('mill',11,10);f.place('bakery',19,10);f.place('house',29,10);if(connected)connectExample(f);return f;}
export function connectExample(f){const cells=[...line({x:6,y:11},{x:10,y:11}),...line({x:14,y:11},{x:18,y:11}),...line({x:22,y:11},{x:28,y:11})];return f.lay(cells);}
