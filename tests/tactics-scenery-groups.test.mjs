import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {GROUPS,GROUP_PROPS,GROUP_LABELS} from '../dist/tactics/environment-groups.js';
import {GROUP_PROP_ART} from '../dist/tactics/prop-art-groups.js';
import {PROPS} from '../dist/tactics/environment.js';

// Parcel S1 of docs/tactics/SCENERY-PORT-HANDOFF.md: each scenery group owns one module, one
// generated crop catalog, one side manifest and one asset folder, so two parcels never meet in a
// shared registry. These checks are what keeps that true as the groups fill in.
const dist=new URL('../dist/',import.meta.url);

test('every scenery group is wired to its own four files',()=>{
 assert.ok(GROUPS.length>0,'no groups registered');
 for(const group of GROUPS){
  assert.equal(typeof group.FOLDER,'string');
  assert.equal(typeof group.LABEL,'string');
  assert.equal(typeof group.PROPS,'object');
  const folder=group.FOLDER;
  assert.ok(existsSync(new URL(`tactics/environment-props-${folder}.js`,dist)),`rules module for ${folder}`);
  assert.ok(existsSync(new URL(`tactics/prop-art-${folder}.js`,dist)),`crop catalog for ${folder}`);
  assert.ok(existsSync(new URL(`assets/environment/manifest-${folder}.json`,dist)),`manifest for ${folder}`);
  assert.ok(existsSync(new URL(`assets/environment/${folder}/`,dist)),`asset folder for ${folder}`);
  const manifest=JSON.parse(readFileSync(new URL(`assets/environment/manifest-${folder}.json`,dist),'utf8'));
  assert.equal(manifest.group,folder);
  assert.ok(Array.isArray(manifest.assets));
 }
});

test('group folders and labels are unique, and the generator agrees with the modules',()=>{
 const folders=GROUPS.map(g=>g.FOLDER),labels=GROUPS.map(g=>g.LABEL);
 assert.equal(new Set(folders).size,folders.length,'duplicate group folder');
 assert.equal(new Set(labels).size,labels.length,'duplicate palette heading');
 assert.deepEqual(Object.keys(GROUP_LABELS).sort(),folders.slice().sort());
 const generated=readFileSync(new URL('../tools/catalog-environment.py',import.meta.url),'utf8');
 for(const folder of folders)assert.match(generated,new RegExp(`'${folder}'`),`${folder} missing from the generator`);
});

test('a group’s rules and crops reach the shared catalogs',()=>{
 for(const group of GROUPS)for(const [kind,rule] of Object.entries(group.PROPS)){
  assert.deepEqual(PROPS[kind],rule,`${kind} did not reach PROPS`);
  assert.ok(GROUP_PROPS[kind],`${kind} did not reach GROUP_PROPS`);
 }
 // Every crop a group publishes must belong to a kind that group also registers, or the asset
 // checker's id bijection fails later with a much less obvious message.
 const registered=new Set(GROUPS.flatMap(g=>Object.keys(g.PROPS)));
 for(const kind of Object.keys(GROUP_PROP_ART))assert.ok(registered.has(kind),`crop for unregistered kind ${kind}`);
});

test('renderer loads a populated scenery group from its declared subfolder and uses its crop',async()=>{
 const kind='review-machine',previousImage=globalThis.Image,requests=[],draws=[];
 GROUP_PROP_ART[kind]={file:'machines/review-machine.png',crop:[2,3,22,33]};
 PROPS[kind]={w:1,h:1,solid:true,cover:0};
 globalThis.Image=class {complete=true;naturalWidth=40;set src(value){requests.push(value);}};
 try{
  const {environmentRenderer}=await import('../dist/tactics/environment-renderer.js?populated-group-test');
  const ctx={save(){},restore(){},translate(){},scale(){},drawImage(...args){draws.push(args);}};
  assert.equal(environmentRenderer().prop(ctx,()=>({x:0,y:0}),1,{x:0,y:0,kind}),true);
  assert.deepEqual(requests,['../assets/environment/machines/review-machine.png']);
  assert.deepEqual(draws[0].slice(1,5),[2,3,20,30]);
 }finally{delete GROUP_PROP_ART[kind];delete PROPS[kind];if(previousImage===undefined)delete globalThis.Image;else globalThis.Image=previousImage;}
});
