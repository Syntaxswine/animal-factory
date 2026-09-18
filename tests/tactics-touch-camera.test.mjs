import test from 'node:test';
import assert from 'node:assert/strict';
import {touchCamera} from '../dist/tactics/touch-camera.js';
function setup(){const handlers={},captured=new Set(),camera={x:100,y:100,zoom:1};let taps=0;
 const canvas={addEventListener:(k,f)=>handlers[k]=f,focus(){},getBoundingClientRect:()=>({left:20,top:30}),setPointerCapture:id=>captured.add(id),hasPointerCapture:id=>captured.has(id),releasePointerCapture:id=>captured.delete(id)};
 touchCamera(canvas,camera,{onTap:()=>taps++});
 const event=(type,id,x,y,pointerType='touch')=>{let stopped=false;handlers[type]({pointerId:id,clientX:x+20,clientY:y+30,pointerType,preventDefault(){},stopImmediatePropagation(){stopped=true;}});return stopped;};
 return {camera,event,taps:()=>taps,captured};
}
test('single touch acts only on release; mouse events remain untouched',()=>{const s=setup();assert.equal(s.event('pointerdown',9,100,100,'mouse'),false);s.event('pointerdown',1,100,100);assert.equal(s.taps(),0);s.event('pointerup',1,100,100);assert.equal(s.taps(),1);assert.equal(s.captured.size,0);});
test('two fingers pan and pinch about their midpoint without any game action',()=>{const s=setup();s.event('pointerdown',1,100,100);s.event('pointerdown',2,200,100);s.event('pointermove',1,120,120);s.event('pointermove',2,220,120);assert.ok(Math.abs(s.camera.zoom-1)<1e-10);assert.ok(Math.abs(s.camera.x-120)<1e-10);assert.ok(Math.abs(s.camera.y-120)<1e-10);s.event('pointermove',1,70,120);s.event('pointermove',2,270,120);assert.ok(Math.abs(s.camera.zoom-2)<1e-10);assert.ok(Math.abs(s.camera.x-70)<1e-10);s.event('pointerup',2,270,120);s.event('pointerup',1,70,120);assert.equal(s.taps(),0);});
test('drag, cancellation and a remaining finger after a gesture cannot issue a tap',()=>{const s=setup();s.event('pointerdown',1,100,100);s.event('pointermove',1,130,100);s.event('pointerup',1,130,100);assert.equal(s.taps(),0);s.event('pointerdown',1,100,100);s.event('pointerdown',2,200,100);s.event('pointercancel',2,200,100);s.event('pointerup',1,100,100);assert.equal(s.taps(),0);s.event('pointerdown',1,100,100);s.event('pointerup',1,100,100);assert.equal(s.taps(),1);});
test('zoom clamps safely even when the fingers coincide',()=>{const s=setup();s.event('pointerdown',1,100,100);s.event('pointerdown',2,100,100);s.event('pointermove',2,101,100);s.event('pointermove',2,1000,100);assert.equal(s.camera.zoom,2.3);s.event('pointermove',2,100,100);assert.equal(s.camera.zoom,.025);assert.ok(Number.isFinite(s.camera.x));});
