import fs from 'node:fs';import path from 'node:path';
import {pagesFiles} from './pages-files.mjs';
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'.pages-output');fs.mkdirSync(path.join(out,'tactics'),{recursive:true});
fs.copyFileSync(path.join(root,'Factory-test.json'),path.join(root,'dist/tactics/default-factory.json'));
const files=pagesFiles(root);
for(const file of files)fs.copyFileSync(path.join(root,'dist/tactics',file),path.join(out,'tactics',file));
for(const directory of ['characters','environment','machines/industrial']){const dest=path.join(out,'assets',directory);fs.mkdirSync(dest,{recursive:true});const copyPNGs=(source,target)=>{fs.mkdirSync(target,{recursive:true});for(const entry of fs.readdirSync(source,{withFileTypes:true})){if(entry.isDirectory())copyPNGs(path.join(source,entry.name),path.join(target,entry.name));else if(entry.name.endsWith('.png'))fs.copyFileSync(path.join(source,entry.name),path.join(target,entry.name));}};copyPNGs(path.join(root,'dist/assets',directory),dest);}
fs.cpSync(path.join(root,'dist/assets/equipment'),path.join(out,'assets/equipment'),{recursive:true});
// The base manifest and every scenery group's side manifest.
for(const name of fs.readdirSync(path.join(root,'dist/assets/environment')).filter(f=>f.startsWith('manifest')&&f.endsWith('.json')))
 fs.copyFileSync(path.join(root,'dist/assets/environment',name),path.join(out,'assets/environment',name));
fs.writeFileSync(path.join(out,'.nojekyll'),'');
fs.writeFileSync(path.join(out,'index.html'),'<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Red Shift</title><style>body{background:#192b24;color:#ecddb9;font:20px system-ui;max-width:680px;margin:12vh auto;padding:24px}a{display:block;color:#ffd988;margin:24px 0;font-size:26px}</style><h1>Red Shift</h1><p>Soviet animal tactics · Mechanics prototype</p><a href="tactics/index.html">Play the game →</a><a href="tactics/editor.html">Open the map editor →</a><p>Design reusable24×24 blocks and240×240 maps. Save in your browser or export JSON.</p></html>');
fs.writeFileSync(path.join(out,'README.md'),'# Red Shift\n\nPublic web distribution of the tactical game and map editor.\n\n- [Game](https://syntaxswine.github.io/animal-factory-tactics-pages/tactics/index.html)\n- [Map editor](https://syntaxswine.github.io/animal-factory-tactics-pages/tactics/editor.html)\n\nDesign saves stay in your browser. Export JSON for backups and moving between devices.\n');
console.log('Built Pages distribution: '+out+' ('+files.length+' app files plus PNG assets).');

fs.cpSync(path.join(root,'dist/tactics/vendor'),path.join(out,'tactics/vendor'),{recursive:true});
