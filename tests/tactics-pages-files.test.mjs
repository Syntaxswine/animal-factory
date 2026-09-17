import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';

// The Pages build copies an explicit file list; a module missing from it 404s on the public site and blanks the page.
test('the tactics Pages build lists every local module and page its listed files reference',()=>{
 const source=readFileSync(new URL('../tools/build-tactics-pages.mjs',import.meta.url),'utf8');
 const files=JSON.parse(source.match(/const files=(\[[^\]]*\])/)[1].replaceAll("'",'"')),listed=new Set(files),dist=new URL('../dist/tactics/',import.meta.url);
 const missing=[];
 for(const file of files){
  const text=readFileSync(new URL(file,dist),'utf8');
  const references=[...text.matchAll(/(?:from|import)\s*\(?\s*['"]\.\/([\w.-]+\.js)['"]/g),...text.matchAll(/(?:src|href)=["']?(?:\.\/)?([\w.-]+\.(?:js|css|html))/g),...text.matchAll(/new URL\(['"]\.\/([\w.-]+\.js)['"]/g)].map(m=>m[1]);
  for(const reference of references)if(!listed.has(reference)&&existsSync(new URL(reference,dist)))missing.push(`${file} → ${reference}`);
 }
 assert.deepEqual(missing,[]);
 for(const file of ['flame-effect.js','flame-nozzles.js','flame-art.html','flame-art-review.js'])assert.ok(listed.has(file),file);
});
