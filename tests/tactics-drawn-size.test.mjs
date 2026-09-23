import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {decodePNG} from '../tools/png-rgba.mjs';
import {drawnProp,drawnEdge,drawnGround,downscale,cropOf} from '../tools/drawn-size.mjs';
import {PROPS,GROUNDS} from '../dist/tactics/environment.js';

// tools/drawn-size.mjs duplicates environmentRenderer's sizing arithmetic so it can run without a
// DOM. A duplicate that nothing checks is a duplicate that drifts, so these pin it to numbers that
// come from somewhere else: a decoded PNG, and the formula worked by hand.

test('the crop table agrees with the artwork it claims to describe',async()=>{
 // Alpha >= 64 is the crop rule stated in environment-renderer.js. Decode the real file and see.
 for(const [id,file] of [['bush','foliage/bush.png'],['crate-wood','crate-wood.png']]){
  const {width,height,pixels}=decodePNG(await readFile(new URL('../dist/assets/environment/'+file,import.meta.url)));
  assert.deepEqual([width,height],[1254,1254],id);
  let x0=width,y0=height,x1=0,y1=0;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(pixels[(y*width+x)*4+3]>=64){
   if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}
  const [cx0,cy0,cx1,cy1]=cropOf(id);
  // The stored crop is the bounding box, exclusive on the far edge.
  assert.deepEqual([cx0,cy0,cx1,cy1],[x0,y0,x1+1,y1+1],`${id} crop`);
 }
});

test('a prop is fitted to its box the way the renderer fits it',()=>{
 // bush: 1x1, visualHeight 32, so the box is (1+1)*25 = 50 wide by 32 tall. Its crop is 934 x 746,
 // which is wider than it is tall, so the height binds: 32/746 scales the width to 40.
 const bush=drawnProp('bush');
 assert.deepEqual(bush.crop,[934,746]);
 assert.deepEqual(bush.box,[50,32]);
 assert.equal(bush.limit,'height');
 assert.equal(Math.round(bush.drawn[0]),40);
 assert.equal(Math.round(bush.drawn[1]),32);
 // Zoom is the one lever that buys detail back: three times the zoom is a third of the downscale.
 assert.equal(drawnProp('bush',2).drawn[1],bush.drawn[1]*2);
 assert.equal(downscale(drawnProp('bush',3)),downscale(bush)/3);
 // A 2x1 prop with no visual overrides: box (2+1)*25 = 75 by (2+1)*11 + 18 = 51.
 assert.deepEqual(drawnProp('table-wood').box,[75,51]);
 // tall adds 43 instead of 18.
 assert.ok(PROPS['tree-pine'].tall);
 assert.deepEqual(drawnProp('tree-pine').box,[100,130]);
 // A wall stands 72 px whatever its painting measures; a railing 20.
 assert.equal(drawnEdge('wall-concrete').drawn[1],72);
 assert.equal(drawnEdge('fence-railing').drawn[1],20);
 // A ground texture is the whole 1254 squeezed into the tile diamond, so 1254/28 on the short axis.
 assert.equal(downscale(drawnGround(GROUNDS[0])),1254/28);
});

test('every prop kind in the catalogue can be measured',()=>{
 const missing=Object.keys(PROPS).filter(id=>!cropOf(id));
 assert.deepEqual(missing,[],'a prop with a rule but no crop cannot be sized, or drawn');
 const rows=Object.keys(PROPS).map(id=>drawnProp(id));
 assert.ok(rows.every(r=>r&&r.drawn[0]>0&&r.drawn[1]>0));
 // The spread this whole measurement exists to show: the catalogue's art is downscaled by very
 // different amounts, and nothing in the pipeline knows that. If these ever converge, the note in
 // docs/tactics/MAKING-SCENERY.md about painting to the drawn size has been acted on.
 const ratios=rows.map(downscale);
 assert.ok(Math.min(...ratios)<12,`best served prop is only ${Math.min(...ratios).toFixed(1)}:1`);
 assert.ok(Math.max(...ratios)>60,`worst served prop is only ${Math.max(...ratios).toFixed(1)}:1`);
});
