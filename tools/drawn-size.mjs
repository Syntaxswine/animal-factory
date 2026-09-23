// How big is each piece of environment art on the screen, and how much of its painting survives?
//
// Every prop in this game is a 1254 x 1254 painting drawn with one drawImage into a box a few
// dozen pixels across. The ratio between those two numbers is the only thing that decides whether
// detail in the source is worth painting, and nothing in the tree stated it. This prints it.
//
// Read the last column. It is the finest feature, in source pixels, that still occupies one screen
// pixel after the downscale. Anything smaller than that is averaged away: at 19:1 a 12-pixel leaf
// is two thirds of a screen pixel and reads as noise, which is why the painted bush and a flat
// procedural blob are the same picture at 50 x 32 (see docs/tactics/GROUND-COVER.md).
//
//   node tools/drawn-size.mjs            every prop, sorted by how small it lands
//   node tools/drawn-size.mjs --zoom 2   at a zoom the player actually uses for aiming
//   node tools/drawn-size.mjs --all      props, barriers and ground textures
//   node tools/drawn-size.mjs crate tree filter by id substring
//
// The sizing arithmetic below is copied from environmentRenderer's prop() in
// dist/tactics/environment-renderer.js. It is duplicated on purpose: this is a measuring tool and
// must not need a DOM to run. If that function's formula changes, change it here and say so.
import {PROPS,EDGES,GROUNDS} from '../dist/tactics/environment.js';
import {PROP_ART} from '../dist/tactics/prop-art.js';
import {DOOR_ART} from '../dist/tactics/door-art.js';
// The scenery groups keep their crops in prop-art-<group>.js (parcel S1), and the renderer reads them
// after PROP_ART, so a measuring tool that stopped at PROP_ART could not see a single Stage 1 prop.
import {GROUP_PROP_ART} from '../dist/tactics/prop-art-groups.js';

const SOURCE=1254;
// environment-renderer.js keeps these two tables inline; they are the crops for the art that
// predates prop-art.js, and the five-number baselines for anything that stands on a tile edge.
const LEGACY_CROPS={'barrel-single':[322,88,931,1173],'barrels-cluster':[229,164,1047,1125],'crate-stack':[168,122,1110,1098],'crate-steel':[63,181,1207,1125],'crate-wood':[119,71,1135,1193],'fence-chainlink':[119,32,1142,1216],'fence-railing':[27,134,1241,1166],pallet:[98,268,1157,974],sandbags:[24,280,1230,1091],'table-steel':[78,68,1176,1181],'table-wood':[60,123,1195,1125],'wall-brick':[62,96,1206,1210],'wall-concrete':[75,143,1211,1176],'wall-corrugated':[154,51,1130,1214],'workbench-metal':[38,20,1233,1227],'workbench-vise':[47,25,1208,1227],'window-brick':[36,16,1221,1242],'window-concrete':[113,56,1175,1219],'window-corrugated':[81,9,1172,1240],'door-steel-closed':[122,27,1137,1211],'door-wood-closed':[157,22,1099,1232],'doorway-concrete-open':[116,66,1144,1200]};
// Edge art is scaled by height alone: walls, windows and doorways stand 72 px, a railing 20, a cut
// fence 44, and anything with its own `height` uses that.
const edgeHeight=id=>/^(wall-|window-|door-|doorway-)/.test(id)?72:DOOR_ART[id]?.height??PROP_ART[id]?.height??(id==='fence-railing'?20:44);

export function cropOf(id){
 const art=PROP_ART[id]||DOOR_ART[id]||GROUP_PROP_ART[id];
 return art?.crop||LEGACY_CROPS[id]||null;
}

// The box a prop is fitted into, and the size it actually comes out at once the crop's own aspect
// has had its say. A tall, narrow painting in a wide box is limited by the box's height, not width.
export function drawnProp(id,zoom=1){
 const rule=PROPS[id],crop=cropOf(id);
 if(!rule||!crop)return null;
 const {w,h}=rule,[x0,y0,x1,y1]=crop,cw=x1-x0,ch=y1-y0;
 if(rule.groundLayer){
  const dw=(w+h)*28*zoom,dh=(w+h)*(id==='roof-corrugated-sloped'?19:16)*zoom;
  return {id,w,h,crop:[cw,ch],box:[dw,dh],drawn:[dw,dh],limit:'stretched to the footprint'};
 }
 const maxWidth=(rule.visualWidth??((w+h)*25))*zoom;
 const maxHeight=(rule.visualHeight??((w+h)*11+(rule.tall?43:id==='pallet'?1:18)))*zoom;
 const scale=Math.min(maxWidth/cw,maxHeight/ch);
 return {id,w,h,crop:[cw,ch],box:[maxWidth,maxHeight],drawn:[cw*scale,ch*scale],
         limit:maxWidth/cw<maxHeight/ch?'width':'height'};
}

export function drawnEdge(id,zoom=1){
 const crop=cropOf(id);if(!crop)return null;
 const [x0,y0,x1,y1]=crop,cw=x1-x0,ch=y1-y0,height=edgeHeight(id)*zoom;
 return {id,w:1,h:1,crop:[cw,ch],box:[cw*height/ch,height],drawn:[cw*height/ch,height],limit:'height'};
}

// A ground texture is squeezed into the 56 x 28 tile diamond, so its downscale is fixed and brutal.
export const drawnGround=(id,zoom=1)=>({id,w:1,h:1,crop:[SOURCE,SOURCE],box:[56*zoom,28*zoom],
 drawn:[56*zoom,28*zoom],limit:'the tile diamond'});

// Source pixels per screen pixel, then the finest feature that still fills one screen pixel.
export const downscale=e=>Math.max(e.crop[0]/e.drawn[0],e.crop[1]/e.drawn[1]);

function main(argv){
 const zoomAt=argv.indexOf('--zoom'),zoom=zoomAt>=0?Number(argv[zoomAt+1]):1;
 const all=argv.includes('--all');
 const filters=argv.filter((a,i)=>!a.startsWith('--')&&argv[i-1]!=='--zoom');
 const rows=[];
 for(const id of Object.keys(PROPS)){const e=drawnProp(id,zoom);if(e)rows.push({...e,kind:'prop'});}
 if(all){
  for(const id of [...new Set(Object.values(EDGES).map(r=>r.art).filter(Boolean))])
   {const e=drawnEdge(id,zoom);if(e)rows.push({...e,kind:'edge'});}
  for(const id of GROUNDS)rows.push({...drawnGround(id,zoom),kind:'ground'});
 }
 const shown=rows.filter(r=>!filters.length||filters.some(f=>r.id.includes(f)))
                 .sort((a,b)=>a.drawn[0]*a.drawn[1]-b.drawn[0]*b.drawn[1]);
 const missing=Object.keys(PROPS).filter(id=>!cropOf(id));
 const pad=(s,n)=>String(s).padEnd(n),num=(v,n)=>v.toFixed(0).padStart(n);
 console.log(`Environment art at zoom ${zoom}. ${shown.length} entries, smallest first.\n`);
 console.log(`${pad('id',30)}${pad('tiles',7)}${pad('drawn px',12)}${pad('source crop',14)}${pad('down',7)}finest detail that survives`);
 console.log('-'.repeat(104));
 for(const r of shown){
  const d=downscale(r);
  console.log(pad(r.id,30)+pad(`${r.w}x${r.h}`,7)
   +pad(`${num(r.drawn[0],3)} x ${num(r.drawn[1],3)}`,12)
   +pad(`${num(r.crop[0],4)} x ${num(r.crop[1],4)}`,14)
   +pad(d.toFixed(1)+':1',7)
   +`${d.toFixed(0)} source px`);
 }
 const worst=shown.reduce((a,r)=>Math.max(a,downscale(r)),0);
 const best=shown.reduce((a,r)=>Math.min(a,downscale(r)),Infinity);
 console.log(`\nDownscale runs ${best.toFixed(1)}:1 to ${worst.toFixed(1)}:1.`);
 console.log('A feature has to be about that many source pixels across to be worth painting.');
 if(missing.length)console.log(`\n${missing.length} prop kinds have a rule but no crop yet: ${missing.join(', ')}`);
}

if(import.meta.url===`file://${process.argv[1]?.replace(/\\/g,'/')}`||process.argv[1]?.endsWith('drawn-size.mjs'))main(process.argv.slice(2));
