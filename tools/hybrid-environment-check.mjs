import {createRequire} from 'node:module';import {fileURLToPath} from 'node:url';import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH||'playwright'),browser=await chromium.launch({headless:true,channel:'msedge'});
try{
 const page=await browser.newPage({viewport:{width:1600,height:1200}});await page.goto('http://127.0.0.1:4389/tactics/hybrid-viewer.html',{waitUntil:'networkidle'});
 const result=await page.evaluate(async()=>{const {HybridRenderer}=await import('./hybrid-renderer.js'),{PROPS,EDGES}=await import('./environment.js'),{blankMap}=await import('./maps.js');const map=blankMap();map.terrain=map.terrain.map(row=>row.map(()=> 'void'));map.starts=[];map.guards=[];map.props=[];const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=1200;document.body.replaceChildren(canvas);document.body.style.margin=0;const renderer=new HybridRenderer(),ctx=canvas.getContext('2d'),view={x:800,y:60,zoom:.85};
 const entries=[...Object.keys(PROPS).map(kind=>({kind,type:'prop'})),...Object.keys(EDGES).map(kind=>({kind,type:'edge'}))];
 entries.forEach((entry,i)=>{const x=i%8*4,y=Math.floor(i/8)*4;entry.x=x;entry.y=y;for(let a=0;a<2;a++)for(let b=0;b<2;b++)map.terrain[y+b][x+a]='yard';if(entry.type==='edge')map.edges[`s:${x}:${y}`]=entry.kind;else map.props.push({x,y,z:0,kind:entry.kind});});
 renderer.draw(ctx,map,view,1600,1200,0,{editor:true});ctx.font='11px monospace';ctx.fillStyle='#fff0be';ctx.textAlign='center';for(const e of entries)ctx.fillText(e.kind,view.x+(e.x-e.y)*28*view.zoom,view.y+(e.x+e.y)*14*view.zoom+30);const stats=renderer.stats();return {count:entries.length,unsupported:stats.unsupported};});
 assert.deepEqual(result.unsupported,[]);await page.screenshot({path:fileURLToPath(new URL('../docs/tactics/hybrid-review/stage-4-environment-catalog.png',import.meta.url))});console.log(result);
}finally{await browser.close();}
