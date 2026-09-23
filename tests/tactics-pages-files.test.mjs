import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {pagesFiles,EXCLUDE} from '../tools/pages-files.mjs';

// The Pages build copies a scanned file set; a module left out of it 404s on the public site and
// blanks the page. The test and the build read the same selection, so they cannot drift apart.
test('the tactics Pages build ships every local module and page its shipped files reference',()=>{
 const root=fileURLToPath(new URL('../',import.meta.url));
 const files=pagesFiles(root),listed=new Set(files),dist=new URL('../dist/tactics/',import.meta.url);
 const missing=[];
 for(const file of files){
  const text=readFileSync(new URL(file,dist),'utf8');
  const references=[...text.matchAll(/(?:from|import)\s*\(?\s*['"]\.\/([\w.-]+\.js)['"]/g),...text.matchAll(/(?:src|href)=["']?(?:\.\/)?([\w.-]+\.(?:js|css|html))/g),...text.matchAll(/new URL\(['"]\.\/([\w.-]+\.js)['"]/g)].map(m=>m[1]);
  for(const reference of references)if(!listed.has(reference)&&existsSync(new URL(reference,dist)))missing.push(`${file} → ${reference}`);
 }
 assert.deepEqual(missing,[]);
 for(const file of ['flame-effect.js','flame-nozzles.js','flame-art.html','flame-art-review.js'])assert.ok(listed.has(file),file);
});

// Counter-assertions: a scan that swept in everything, or dropped everything, would satisfy the
// reference walk above trivially. These pin both ends of the selection.
test('the scanned Pages selection holds back documentation and nothing else',()=>{
 const root=fileURLToPath(new URL('../',import.meta.url));
 const files=pagesFiles(root);
 assert.ok(files.length>60,`expected the app file set, got ${files.length}`);
 assert.deepEqual(files.filter(f=>f.endsWith('.md')),[],'documentation must not ship');
 assert.deepEqual(EXCLUDE.has('.js'),false,'excluding .js would blank every page');
 for(const file of ['index.html','app.js','style.css','environment.js','environment-groups.js','prop-art-groups.js'])
  assert.ok(files.includes(file),file);
 assert.deepEqual([...files].sort(),files,'the selection is sorted so the build output is stable');
});
