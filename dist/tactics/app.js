import {W,H,WEAPONS,key,alive,squad,guards,occupant,tile,walkable,createGame,pathTo,move,stepMovement,previewAttack,attack,equip,reload,endTurn,stepEnemy,canControl} from './engine.js';
const $=id=>document.getElementById(id),canvas=$('map'),ctx=canvas.getContext('2d'),mini=$('mini').getContext('2d');
let s=createGame(),targetId=null,burst=false,showGrid=false,hover=null,hoverActor=null,route=null,lastTick=0,lastRevision=-1,toast='',toastUntil=0,effectUntil=0,lastEffect=null,drag=null,width=1,height=1;
const camera={x:0,y:0,zoom:1.15},images=new Map(),sprites=[];
const selected=()=>s.units[s.selected],target=()=>s.units.find(u=>u.id===targetId&&alive(u)&&s.visible.has(key(u.x,u.y)));
function load(src){if(images.has(src))return images.get(src);const img=new Image();img.src=src;img.onerror=()=>message('An artwork file could not load. Reload the page to retry.');images.set(src,img);return img;}
for(const species of new Set(s.units.map(u=>u.species)))for(const pose of ['idle','walk-a','walk-b'])load(`../assets/characters/${species}-${pose}.png`);
for(const name of ['mill','bakery','bottler','dairy'])load(`../assets/machines/industrial/${name}.png`);
function project(x,y,z=0){return {x:camera.x+(x-y)*28*camera.zoom,y:camera.y+(x+y)*14*camera.zoom-z*camera.zoom};}
function pick(x,y){const px=(x-camera.x)/(28*camera.zoom),py=(y-camera.y)/(14*camera.zoom);return {x:Math.round((px+py)/2),y:Math.round((py-px)/2)};}
function center(){const p=selected();camera.x=width*.46-(p.x-p.y)*28*camera.zoom;camera.y=height*.48-(p.x+p.y)*14*camera.zoom;}
function overview(){camera.zoom=Math.max(.35,Math.min((width-70)/((W+H)*28),(height-100)/((W+H)*14)));camera.x=width/2-(W-H)*14*camera.zoom;camera.y=55;}
function resize(){const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);width=rect.width;height=rect.height;canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);if(camera.x===0)center();}
new ResizeObserver(resize).observe(canvas);
function poly(points,fill,stroke){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}}
function diamond(x,y,fill,stroke,z=0,scale=1){const p=project(x,y,z),a=28*camera.zoom*scale,b=14*camera.zoom*scale;poly([{x:p.x,y:p.y-b},{x:p.x+a,y:p.y},{x:p.x,y:p.y+b},{x:p.x-a,y:p.y}],fill,stroke);}
function block(x,y,h,top,left,right){const p=project(x,y),a=28*camera.zoom,b=14*camera.zoom,z=h*camera.zoom;poly([{x:p.x-a,y:p.y},{x:p.x,y:p.y+b},{x:p.x,y:p.y+b-z},{x:p.x-a,y:p.y-z}],left,'#242b2480');poly([{x:p.x,y:p.y+b},{x:p.x+a,y:p.y},{x:p.x+a,y:p.y-z},{x:p.x,y:p.y+b-z}],right,'#242b2480');diamond(x,y,top,'#555643',h);}
function textLabel(label,x,y,color='#ddcf9f',size=11){const p=project(x,y);ctx.font=`${size*camera.zoom}px monospace`;ctx.textAlign='center';ctx.fillStyle=color;ctx.fillText(label,p.x,p.y);}
function drawTerrain(){
 // Existing industrial sprites form the factory skyline, outside the walkable map.
 for(const [name,x,y,size]of [['mill',7,-3,225],['bakery',17,-3,245],['bottler',25,-2,220],['dairy',34,14,200]]){const p=project(x,y),img=load(`../assets/machines/industrial/${name}.png`);if(img.complete&&img.naturalWidth){ctx.globalAlpha=.58;ctx.drawImage(img,p.x-size*camera.zoom/2,p.y-size*camera.zoom,size*camera.zoom,size*camera.zoom);ctx.globalAlpha=1;}}
 for(let d=0;d<W+H;d++)for(let y=0;y<H;y++){const x=d-y;if(x<0||x>=W)continue;const k=key(x,y),seen=s.seen.has(k),visible=s.visible.has(k),t=tile(s,x,y),n=(x*37+y*13)%9;
  const base=t==='floor'?['#77745a','#7b765b','#736f56'][n%3]:['#6f7053','#737256','#696d51'][n%3];
  diamond(x,y,seen?base:'#303c34',showGrid&&seen?'#a3a17b45':seen?'#555e4533':'#37433644');
  if(seen){if(n===0||n===4){const p=project(x,y);ctx.strokeStyle='#3c473541';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(p.x-12*camera.zoom,p.y-4*camera.zoom);ctx.lineTo(p.x-5*camera.zoom,p.y);ctx.lineTo(p.x+5*camera.zoom,p.y-2*camera.zoom);ctx.stroke();}
   if(t==='door'){diamond(x,y,'#9f8e5244','#c9aa6866');const p=project(x,y);ctx.fillStyle='#e1c579';ctx.fillRect(p.x-3*camera.zoom,p.y-1*camera.zoom,6*camera.zoom,2*camera.zoom);}
   if(!visible)diamond(x,y,'#182c2899');
  }
 }
 for(const [label,x,y]of [['ENTRY / 07',3,2],['LOADING YARD',8,12],['NORTH WORKSHOP',14,7],['ASSEMBLY',21,18]])if(s.seen.has(key(x,y)))textLabel(label,x,y,'#d1c08c99',9);
}
function drawObjects(now){
 sprites.length=0;
 const objects=[];for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(s.seen.has(key(x,y))&&['wall','crate'].includes(tile(s,x,y)))objects.push({x,y,type:tile(s,x,y)});
 for(const u of s.units)if(u.team==='squad'||s.visible.has(key(u.x,u.y)))objects.push({...u,type:'actor',unit:u});
 objects.sort((a,b)=>(a.x+a.y)-(b.x+b.y)||(a.type==='actor'?1:-1));
 for(const obj of objects){const {x,y,type}=obj,visible=s.visible.has(key(x,y));ctx.globalAlpha=visible?1:.45;
  if(type==='wall'){block(x,y,23,'#9b8e6b','#625d49','#797158');const p=project(x,y,10);ctx.strokeStyle='#403f3477';ctx.beginPath();ctx.moveTo(p.x,p.y+14*camera.zoom);ctx.lineTo(p.x+28*camera.zoom,p.y);ctx.stroke();}
  else if(type==='crate'){block(x,y,14,'#ac8651','#695539','#866b42');const p=project(x,y,14);ctx.strokeStyle='#463d2bb0';ctx.beginPath();ctx.moveTo(p.x-15*camera.zoom,p.y-6*camera.zoom);ctx.lineTo(p.x+13*camera.zoom,p.y+7*camera.zoom);ctx.stroke();}
  else{const u=obj.unit,p=project(x,y),color=u.team==='guard'?'#e57862':u.id===s.selected?'#f2ce79':'#b6d5b0';
   if(!alive(u)){ctx.globalAlpha=.4;diamond(x,y,'#562e2566');ctx.font=`${15*camera.zoom}px monospace`;ctx.textAlign='center';ctx.fillStyle='#b5a17c';ctx.fillText('×',p.x,p.y+4);continue;}
   ctx.fillStyle='#13241d66';ctx.beginPath();ctx.ellipse(p.x,p.y+2*camera.zoom,15*camera.zoom,7*camera.zoom,0,0,Math.PI*2);ctx.fill();
   ctx.strokeStyle=color;ctx.lineWidth=u.id===s.selected?2.4:1.5;ctx.beginPath();ctx.ellipse(p.x,p.y,19*camera.zoom,9*camera.zoom,0,0,Math.PI*2);ctx.stroke();
   if(u.id===targetId)diamond(x,y,null,'#ffb28d',0,.9);
   const walking=(s.queue[0]?.id===u.id)||(s.phase==='enemy'&&s.units[s.enemyIndex]?.id===u.id);const pose=walking?(Math.floor(now/170)%2?'walk-a':'walk-b'):'idle',img=load(`../assets/characters/${u.species}-${pose}.png`),sw=48*camera.zoom,sh=64*camera.zoom;
   ctx.save();ctx.translate(p.x,p.y+3*camera.zoom);ctx.scale(u.facing,1);if(img.complete&&img.naturalWidth)ctx.drawImage(img,-sw/2,-sh,sw,sh);else{ctx.fillStyle=color;ctx.fillRect(-sw/4,-sh,sw/2,sh);}ctx.restore();
   ctx.globalAlpha=1;ctx.fillStyle='#14221d';ctx.fillRect(p.x-17*camera.zoom,p.y-66*camera.zoom,34*camera.zoom,4*camera.zoom);ctx.fillStyle=color;ctx.fillRect(p.x-17*camera.zoom,p.y-66*camera.zoom,34*camera.zoom*u.hp/u.maxHp,3*camera.zoom);
   ctx.font=`bold ${9*camera.zoom}px monospace`;ctx.textAlign='center';ctx.fillStyle=color;ctx.fillText(u.team==='squad'?`${u.id+1} ${u.name}`:u.name,p.x,p.y+17*camera.zoom);
   sprites.push({id:u.id,x:p.x-sw/2,y:p.y-sh,w:sw,h:sh+10*camera.zoom});
  }ctx.globalAlpha=1;
 }
 ctx.globalAlpha=1;
}
function drawPreview(){
 if(hover&&canControl(s,selected())&&!s.queue.length){const u=hoverActor!==null?s.units[hoverActor]:null;
  if(u?.team==='guard'){diamond(u.x,u.y,'#e87b5933','#ec9a70');const a=project(selected().x,selected().y,30),b=project(u.x,u.y,30);ctx.setLineDash([4,5]);ctx.strokeStyle=previewAttack(s,selected(),u,burst).ok?'#e6c87d':'#bb6d58';ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.setLineDash([]);}
  else if(route){route.forEach((p,i)=>diamond(p.x,p.y,i<selected().ap||s.phase==='explore'?'#ddba6744':'#c9634933',null,0,.28));diamond(hover.x,hover.y,'#e0c78133','#d2bb78');}
 }
}
function drawMinimap(){mini.fillStyle='#192921';mini.fillRect(0,0,168,144);for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(!s.seen.has(key(x,y)))continue;mini.fillStyle=tile(s,x,y)==='wall'?'#898567':tile(s,x,y)==='crate'?'#a28a52':s.visible.has(key(x,y))?'#566848':'#344636';mini.fillRect(x*6,y*6,5,5);}for(const u of s.units)if(alive(u)&&(u.team==='squad'||s.visible.has(key(u.x,u.y)))){mini.fillStyle=u.team==='guard'?'#ff9275':u.id===s.selected?'#ffda79':'#c8e5b6';mini.fillRect(u.x*6,u.y*6,5,5);}}
function draw(now){ctx.clearRect(0,0,width,height);ctx.fillStyle='#202c29';ctx.fillRect(0,0,width,height);drawTerrain();drawObjects(now);drawPreview();
 if(s.effect!==lastEffect){lastEffect=s.effect;effectUntil=now+350;}if(s.effect&&now<effectUntil){const a=project(s.effect.ax,s.effect.ay,30),b=project(s.effect.bx,s.effect.by,30);ctx.strokeStyle=s.effect.hit?'#ffe6a2':'#c2c5a0';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.beginPath();ctx.arc(b.x,b.y,7,0,7);ctx.stroke();}
}
function message(text){toast=text;toastUntil=performance.now()+3000;$('hint').textContent=text;}
function hitTest(e){const r=canvas.getBoundingClientRect(),px=e.clientX-r.left,py=e.clientY-r.top;hoverActor=null;for(const v of [...sprites].reverse())if(px>=v.x&&px<=v.x+v.w&&py>=v.y&&py<=v.y+v.h){hoverActor=v.id;break;}hover=pick(px,py);}
function updateHover(){
 route=null;if(!hover)return;const u=selected();if(hoverActor!==null&&s.units[hoverActor]?.team==='guard'){const t=s.units[hoverActor],p=previewAttack(s,u,t,burst);$('hint').textContent=`${t.name} / ${WEAPONS[t.weapon].short} / ${t.hp} HP · ${p.ok?`${p.chance}% · ${p.cost} AP${p.cover?' · COVER':''}`:p.reason} · Click to target`;return;}
 if(!s.seen.has(key(hover.x,hover.y))){$('hint').textContent='Unexplored ground. Approach to reveal the route.';return;}
 route=pathTo(s,u,hover.x,hover.y);$('hint').textContent=route?.length?`${hover.x}, ${hover.y} · ${route.length} tiles${s.phase==='player'?` / ${route.length} AP${route.length>u.ap?' · NOT ENOUGH AP':''}`:' / free movement'} · Click to move`:walkable(s,hover.x,hover.y)?'Tile occupied or already here.':'Solid obstacle · Find a doorway or go around.';
}
function sync(){
 const u=selected(),w=WEAPONS[u.weapon],t=target(),p=t?previewAttack(s,u,t,burst):null,control=canControl(s,u)&&!s.queue.length;
 if(!t)targetId=null;
 $('objective').textContent=`${12-guards(s).length} / 12 guards defeated`;
 $('phase').textContent=({explore:'REAL-TIME EXPLORATION',player:'SQUAD TURN',enemy:'GUARDS MOVING',won:'FACTORY SECURED',lost:'SQUAD LOST'})[s.phase];$('phase').classList.toggle('combat',s.phase==='player'||s.phase==='enemy');
 $('round').textContent=s.phase==='explore'?'SHIFT 07':`ROUND ${s.round}`;
 $('selected').innerHTML=`<img alt="${u.species}" src="../assets/characters/${u.species}-idle.png"><div><h2>${u.name}</h2><p>${u.species.toUpperCase()} / ${u.hp} HP</p><p>${s.phase==='explore'?'EXPLORING':`${u.ap} / ${u.maxAp} ACTION POINTS`}</p></div>`;
 $('equip-cost').textContent=s.phase==='explore'?'FREE IN EXPLORATION':'2 AP TO SWITCH';
 $('weapons').innerHTML=Object.entries(WEAPONS).map(([id,v])=>`<button data-weapon="${id}" aria-pressed="${u.weapon===id}" title="${v.name}" ${!control||(s.phase==='player'&&u.ap<2)?'disabled':''}>${id==='hands'?'Hands':v.short}</button>`).join('');
 $('weapon-stats').textContent=`${w.name} · ${w.damage} damage\n${w.cost} AP · ${w.range} tile range · ${w.mag?`${u.ammo[u.weapon]}/${w.mag} rounds`:'melee'}`;
 $('reload').disabled=!control||!w.mag||u.ammo[u.weapon]===w.mag||(s.phase==='player'&&u.ap<3);
 $('burst').disabled=!control||u.weapon!=='assault';$('burst').textContent=`Burst: ${burst?'on':'off'} [B]`;$('burst').setAttribute('aria-pressed',burst);
 const contacts=guards(s).filter(g=>s.visible.has(key(g.x,g.y)));$('contact-count').textContent=`${contacts.length} VISIBLE`;
 $('targets').innerHTML=contacts.map(g=>`<button data-target="${g.id}" aria-pressed="${targetId===g.id}">${g.name} · ${g.hp}</button>`).join('');
 $('target-info').innerHTML=t?`<b>${t.name}</b> / ${WEAPONS[t.weapon].short}<br>${p.ok?`<strong>${p.chance}%</strong> hit · ${p.cost} AP · ${p.rounds>1?'3 × ':''}${p.damage} damage${p.cover?' · COVER −25%':''}`:`${p.reason}${p.cover?' · in cover':''}`}`:'Select a visible guard to inspect a shot.';
 $('attack').disabled=!control||!p?.ok;$('attack').textContent=burst&&u.weapon==='assault'?'Fire 3-round burst [F]':w.mag?'Fire weapon [F]':'Melee attack [F]';
 $('end').disabled=s.phase!=='player'||s.queue.length>0;
 $('squad').innerHTML=s.units.filter(u=>u.team==='squad').map(u=>`<button class="squad-card" data-unit="${u.id}" aria-pressed="${s.selected===u.id}" ${!alive(u)?'disabled':''}><span class="num">0${u.id+1}</span><img alt="" src="../assets/characters/${u.species}-idle.png"><div class="info"><strong>${u.name}</strong><small>${alive(u)?`${WEAPONS[u.weapon].short} · ${u.hp} HP`:'FALLEN'}</small><div class="bar"><i style="width:${u.hp}%"></i></div><div class="bar ap"><i style="width:${u.ap/u.maxAp*100}%"></i></div><small>${s.phase==='explore'?'READY':`${u.ap} / ${u.maxAp} AP`}</small></div></button>`).join('');
 $('log').innerHTML=s.log.slice(0,6).map(l=>`<li>${l}</li>`).join('');
 const over=['won','lost'].includes(s.phase);$('outcome').hidden=!over;if(over){$('outcome').querySelector('h2').textContent=s.phase==='won'?'The works are yours.':'The shift is over.';$('outcome').querySelector('p').textContent=s.phase==='won'?`${squad(s).length} comrades survived. All twelve guards defeated.`:`${12-guards(s).length} guards defeated. Reposition, use cover, and keep the squad together on your next attempt.`;}
 drawMinimap();lastRevision=s.revision;if(performance.now()>toastUntil){if(s.phase==='enemy')$('hint').textContent='Guard turn · Your squad will regain AP when the guards finish.';else if(s.queue.length)$('hint').textContent='Moving · Escape to stop';else if(over)$('hint').textContent='Operation complete · Restart to play again';else if(hover)updateHover();else $('hint').textContent=s.phase==='player'?'Squad turn · Use all four workers before ending the turn.':'Click open ground to explore · Keep the squad together.';}
}
function select(id){if(!alive(s.units[id]))return;s.selected=id;targetId=null;burst=false;s.queue=[];sync();}
function tryAttack(){const t=target();if(t&&attack(s,selected(),t,burst))sync();else message('Attack unavailable. Check range, AP and ammunition.');}
function restart(){s=createGame();targetId=null;burst=false;hover=null;route=null;lastEffect=null;camera.zoom=1.15;center();sync();}
function zoom(factor){const cx=width/2,cy=height/2,z=camera.zoom,next=Math.max(.35,Math.min(2.3,z*factor));camera.x=cx+(camera.x-cx)*next/z;camera.y=cy+(camera.y-cy)*next/z;camera.zoom=next;}
$('squad').addEventListener('click',e=>{const b=e.target.closest('[data-unit]');if(b)select(Number(b.dataset.unit));});
$('weapons').addEventListener('click',e=>{const b=e.target.closest('[data-weapon]');if(b&&equip(s,selected(),b.dataset.weapon)){burst=false;sync();}});
$('targets').addEventListener('click',e=>{const b=e.target.closest('[data-target]');if(b){targetId=Number(b.dataset.target);sync();}});
$('attack').onclick=tryAttack;$('reload').onclick=()=>{reload(s,selected());sync();};$('end').onclick=()=>{endTurn(s);sync();};$('burst').onclick=()=>{if(selected().weapon==='assault'){burst=!burst;sync();}};
$('restart').onclick=restart;$('again').onclick=restart;$('help').onclick=()=>$('manual').showModal();$('manual-close').onclick=()=>$('manual').close();$('center').onclick=center;$('fit').onclick=overview;$('zoomin').onclick=()=>zoom(1.2);$('zoomout').onclick=()=>zoom(1/1.2);$('grid').onclick=()=>{showGrid=!showGrid;$('grid').setAttribute('aria-pressed',showGrid);};
canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('pointerdown',e=>{canvas.focus();if(e.button===2||e.button===1||e.altKey){drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);return;}if(e.button!==0)return;hitTest(e);
 if(hoverActor!==null){const u=s.units[hoverActor];if(u.team==='squad')select(u.id);else{targetId=u.id;sync();}return;}
 if(!hover||!s.seen.has(key(hover.x,hover.y))){message('Explore nearby ground first.');return;}if(!move(s,selected(),hover.x,hover.y))message('Cannot move there. Check the path and available AP.');sync();});
canvas.addEventListener('pointermove',e=>{if(drag){camera.x+=e.clientX-drag.x;camera.y+=e.clientY-drag.y;drag={x:e.clientX,y:e.clientY};return;}hitTest(e);updateHover();});
canvas.addEventListener('pointerup',()=>drag=null);canvas.addEventListener('pointercancel',()=>drag=null);canvas.addEventListener('pointerleave',()=>{hover=null;hoverActor=null;route=null;});
canvas.addEventListener('wheel',e=>{e.preventDefault();zoom(e.deltaY<0?1.1:1/1.1);},{passive:false});
document.addEventListener('keydown',e=>{if($('manual').open)return;if(e.ctrlKey||e.metaKey||e.altKey)return;if(['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName))return;const k=e.key.toLowerCase();if('1234'.includes(k)&&k.length===1)select(Number(k)-1);else if(k===' '){e.preventDefault();endTurn(s);sync();}else if(k==='r'){reload(s,selected());sync();}else if(k==='f')tryAttack();else if(k==='b'&&selected().weapon==='assault'){burst=!burst;sync();}else if(k==='c')center();else if(k==='g')$('grid').click();else if(k==='?'||k==='h')$('manual').showModal();else if(k==='escape'){s.queue=[];sync();}else if(k==='+'||k==='=')zoom(1.2);else if(k==='-')zoom(1/1.2);else if(k.startsWith('arrow')){e.preventDefault();if(k==='arrowleft')camera.x+=50;if(k==='arrowright')camera.x-=50;if(k==='arrowup')camera.y+=50;if(k==='arrowdown')camera.y-=50;}});
function frame(now){if(!$('manual').open&&now-lastTick>(s.phase==='enemy'?110:130)){lastTick=now;if(s.phase==='enemy')stepEnemy(s);else if(s.queue.length)stepMovement(s);if(s.revision!==lastRevision)sync();}draw(now);requestAnimationFrame(frame);}resize();sync();requestAnimationFrame(frame);
