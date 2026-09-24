// The see-through fade in the real game, not on a review page. app.js does not import in node, so this
// shoots dist/tactics/index.html?map=custom twice in headless Edge, with a playtest map that stands the
// squad behind a wooden tower: once as shipped, and once with environment-props-towers.js served without
// `seeThrough`. Everything else is the same page, so any difference between the two is the app.js branch.
//
//   node tools/serve-tactics.mjs            (or any static server for dist/, note its port)
//   node tools/see-through-proof.mjs --port=4387 --out=<dir> [--playwright=<path to playwright-core>]
//
// Writes <out>/see-through-on.png and <out>/see-through-off.png and prints how many pixels differ.
// Refuses (exit 1) when the page errors or the two shots are identical. Parcel C; docs/tactics/TOWERS.md.
import {createRequire} from 'node:module';
import {mkdirSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {blankMap, parseMap} from '../dist/tactics/maps.js';
import {createEditor, applyBrush} from '../dist/tactics/editor-model.js';
import {decodePNG} from './png-rgba.mjs';

const arg = (name, fallback) => { const hit = process.argv.find(a => a.startsWith('--' + name + '=')); return hit ? hit.slice(name.length + 3) : fallback; };
const port = Number(arg('port', 4387)), out = path.resolve(arg('out', '.'));
const require = createRequire(import.meta.url);
const pw = require(arg('playwright', process.env.PLAYWRIGHT_PATH || 'playwright-core'));

// The blank map's squad starts at (3,4), (3,6), (2,5), (2,7); a 5 x 5 tower at (5,6) stands in front of them.
const editor = createEditor(blankMap());
const refused = applyBrush(editor, 'prop', 5, 6, null, {propKind: 'wooden-spotlight-tower', rotated: false});
if (refused) throw new Error('could not place the tower: ' + refused);
const map = JSON.stringify(editor.map);
parseMap(map);

mkdirSync(out, {recursive: true});
const browser = await pw.chromium.launch({headless: true, channel: 'msedge'});
const shots = {};
try {
 for (const [name, off] of [['see-through-on', false], ['see-through-off', true]]) {
  const page = await browser.newPage({viewport: {width: 1400, height: 900}}), problems = [];
  page.on('pageerror', e => problems.push('page error: ' + e.message));
  await page.addInitScript(m => sessionStorage.setItem('red-shift-playtest', m), map);
  if (off) await page.route('**/environment-props-towers.js', async route => {
   const res = await route.fetch(), body = (await res.text()).replaceAll(',seeThrough:true', '');
   await route.fulfill({response: res, body});
  });
  await page.goto(`http://127.0.0.1:${port}/tactics/index.html?map=custom`);
  await page.waitForTimeout(4000);
  if (problems.length) throw new Error(`${name}: ${problems.join('; ')}`);
  shots[name] = await page.locator('#map').screenshot();
  writeFileSync(path.join(out, name + '.png'), shots[name]);
  await page.close();
 }
} finally { await browser.close(); }

const a = decodePNG(shots['see-through-on']), b = decodePNG(shots['see-through-off']);
let differ = 0;
for (let i = 0; i < a.pixels.length; i += 4) if (a.pixels[i] !== b.pixels[i] || a.pixels[i + 1] !== b.pixels[i + 1] || a.pixels[i + 2] !== b.pixels[i + 2]) differ++;
console.log(`${differ} of ${a.width * a.height} pixels differ between see-through on and off; shots in ${out}`);
if (!differ) { console.error('identical: the see-through branch changed nothing'); process.exit(1); }
