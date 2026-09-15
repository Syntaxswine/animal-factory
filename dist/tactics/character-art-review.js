import {CHARACTER_SPECIES,characterArt} from './character-art.js';
const weapons=[['hands','Hand to hand · default'],['knife','NR-40 knife'],['pistol','TT-33 pistol'],['rifle','Mosin-Nagant'],['assault','AK-47']];
const gallery=document.querySelector('#gallery'),species=document.querySelector('#species');
for(const name of CHARACTER_SPECIES)species.add(new Option(name.replaceAll('-',' '),name));
function render(){gallery.innerHTML=CHARACTER_SPECIES.filter(s=>species.value==='all'||species.value===s).map(s=>`<section><h2>${s.replaceAll('-',' ')}</h2><div class="row">${weapons.map(([w,label])=>`<figure><div class="stage"><img src="${characterArt(s,w).src}" alt="${s} — ${label}"></div><figcaption>${label}</figcaption></figure>`).join('')}</div></section>`).join('');}
species.onchange=render;document.querySelector('#scale').onchange=e=>gallery.classList.toggle('small',e.target.value==='small');document.querySelector('#mirror').onchange=e=>gallery.classList.toggle('mirror',e.target.checked);render();
