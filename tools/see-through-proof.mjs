// The see-through fade in the real game, not on a review page. app.js does not import in node, so this
// shoots dist/tactics/index.html?map=custom in headless Edge, each time twice: as shipped, and with
// environment-props-towers.js served without `seeThrough`. Everything else is the same page, so a
// difference between the two is the app.js branch. Both of its paths are driven:
//
//   selected  the squad starts behind a wooden tower; the selected animal is behind it.     must differ
//   hover     the tower stands elsewhere, animal 4 is selected, clear of it:
//               pointer off the canvas (nothing looked at)                                  must NOT differ
//               pointer on the tower's platform, ground behind the tower under it           must differ
//               pointer on the tower's lower legs, its own footprint under it               must NOT differ
//
//   node tools/serve-tactics.mjs            (or any static server for dist/, note its port)
//   node tools/see-through-proof.mjs --port=4387 --out=<dir> [--playwright=<path to playwright-core>]
//
// Writes a pair of PNGs per case into <out> (the current directory if --out is not given) and prints the
// pixel counts. Exit 1 when a page errors, a tower image never loads, or any case goes the wrong way.
// Pointer positions are canvas pixels at a 1400 x 900 viewport after the game centres on the selection.
// Parcel C; docs/tactics/TOWERS.md.
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

// The blank map's squad starts at (3,4), (3,6), (2,5), (2,7).
function mapWithTower(x, y) {
 const editor = createEditor(blankMap());
 const refused = applyBrush(editor, 'prop', x, y, null, {propKind: 'wooden-spotlight-tower', rotated: false});
 if (refused) throw new Error('could not place the tower: ' + refused);
 const map = JSON.stringify(editor.map);
 parseMap(map);
 return map;
}
const CASES = [
 {name: 'selected-behind', map: mapWithTower(5, 6), pointer: null, select: null, differ: true},
 {name: 'hover-nothing', map: mapWithTower(12, 0), pointer: null, select: '4', differ: false},
 {name: 'hover-platform', map: mapWithTower(12, 0), pointer: [950, 250], select: '4', differ: true},
 {name: 'hover-own-legs', map: mapWithTower(12, 0), pointer: [880, 500], select: '4', differ: false}
];

mkdirSync(out, {recursive: true});
const browser = await pw.chromium.launch({headless: true, channel: 'msedge'});
const failures = [];
async function shoot(c, seeThrough) {
 const page = await browser.newPage({viewport: {width: 1400, height: 900}}), problems = [];
 page.on('pageerror', e => problems.push('page error: ' + e.message));
 let towerLoaded = false;
 page.on('response', r => { if (/towers\/wooden-spotlight-tower\.png$/.test(r.url()) && r.ok()) towerLoaded = true; });
 await page.addInitScript(m => sessionStorage.setItem('red-shift-playtest', m), c.map);
 if (!seeThrough) await page.route('**/environment-props-towers.js', async route => {
  const res = await route.fetch(), body = (await res.text()).replaceAll(',seeThrough:true', '');
  await route.fulfill({response: res, body});
 });
 await page.goto(`http://127.0.0.1:${port}/tactics/index.html?map=custom`);
 await page.waitForTimeout(3500);
 const canvas = page.locator('#map'), box = await canvas.boundingBox();
 await page.mouse.move(box.x + 5, box.y + box.height + 40);
 if (c.select) await page.keyboard.press(c.select);
 if (c.pointer) await page.mouse.move(box.x + c.pointer[0], box.y + c.pointer[1]);
 await page.waitForTimeout(600);
 const shot = await canvas.screenshot();
 await page.close();
 if (problems.length) throw new Error(`${c.name}: ${problems.join('; ')}`);
 if (!towerLoaded) throw new Error(`${c.name}: the tower image never loaded, so the shot proves nothing`);
 writeFileSync(path.join(out, `${c.name}-${seeThrough ? 'on' : 'off'}.png`), shot);
 return decodePNG(shot);
}
try {
 for (const c of CASES) {
  const a = await shoot(c, true), b = await shoot(c, false);
  let n = 0;
  for (let i = 0; i < a.pixels.length; i += 4) if (a.pixels[i] !== b.pixels[i] || a.pixels[i + 1] !== b.pixels[i + 1] || a.pixels[i + 2] !== b.pixels[i + 2]) n++;
  const ok = c.differ ? n > 0 : n === 0;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${c.name.padEnd(16)} ${String(n).padStart(6)} of ${a.width * a.height} px differ; expected ${c.differ ? 'a fade' : 'none'}`);
  if (!ok) failures.push(c.name);
 }
} finally { await browser.close(); }
console.log(`shots in ${out}`);
if (failures.length) { console.error('wrong way: ' + failures.join(', ')); process.exit(1); }
