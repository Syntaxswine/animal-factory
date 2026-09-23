// Photograph the 3D branch's painted scenery libraries into registered sprite underlays.
//
// The two games share a camera exactly. `GAME_CAMERA` in the 3D branch's hybrid-world.js is
// {azimuth: PI/4, elevation: PI/6}, and PI/6 is 30 degrees, which projects a unit ground square to
// a diamond of exactly 2.000000 -- the same ratio as this game's 56 x 28 tile in view.js. So a
// model needs no reprojection to become a sprite. What it does need is a scale and an anchor, and
// those are what this tool measures. A render is an UNDERLAY: the branch shades at runtime and a
// sprite carries its own light, so the deliverable is a painting over this, never this.
//
//   node tools/bake-scenery.mjs --group=lighting
//   node tools/bake-scenery.mjs --form=campfire,streetlight --skin=all
//   node tools/bake-scenery.mjs --calibrate        the camera and the 59 px animal datum
//   node tools/bake-scenery.mjs --list             groups and forms, no browser
//
// Needs the 3D reference tree served and playwright-core with an installed Edge:
//
//   git worktree add --detach ../af-3dref codex/project/tactics-3d
//   cd ../af-3dref && PORT=4319 node tools/serve.mjs
//   node tools/bake-scenery.mjs --group=towers --playwright=../wasteland-crystals/node_modules/playwright-core
//
// Output goes to docs/tactics/scenery-bake/out/, which is gitignored, NOT to
// dist/assets/environment/ -- check-assets.mjs fails on any unreferenced PNG there.
//
// See docs/tactics/SCENERY-BAKE.md for what the manifest numbers mean and
// docs/tactics/MAKING-SCENERY.md for whether a given piece wants baking at all.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {decodePNG} from './png-rgba.mjs';

// --- what exists, and who owns it -------------------------------------------------------------
//
// The form lists are spelled out here rather than derived from the page, so that a form added on
// the 3D branch fails `assertFormsCovered` instead of being quietly left unbaked. They follow the
// parcel sections of docs/tactics/SCENERY-PORT-HANDOFF.md. `spotlight` sits with the towers
// because the plan counts the tower library as 17 forms, which is the 16 tower ids plus it, and
// parcel B's list of nine leaves it out.
export const GROUPS = {
 lighting: {parcel: 'B', page: 'painted-furniture.html', hook: 'furnitureWorkshop', forms: [
  'floor-lamp', 'bedside-table-lamp', 'gooseneck-sconce', 'streetlight', 'streetlight-double',
  'standing-torch', 'wall-torch', 'campfire', 'cooking-fire']},
 towers: {parcel: 'C', page: 'painted-furniture.html', hook: 'furnitureWorkshop', forms: [
  'spotlight', 'wooden-guard-tower', 'wood-stair-tower', 'iron-stair-tower', 'wood-wrap-tower',
  'iron-wrap-tower', 'wood-large-wrap-tower', 'iron-large-wrap-tower', 'wood-ladder-tower',
  'iron-ladder-tower', 'wood-rear-ladder-tower', 'iron-rear-ladder-tower', 'wood-large-ladder-tower',
  'iron-large-ladder-tower', 'iron-searchlight-ladder-tower', 'iron-searchlight-stair-tower',
  'wooden-spotlight-tower']},
 furniture: {parcel: 'E', page: 'painted-furniture.html', hook: 'furnitureWorkshop', forms: [
  'dining-table', 'coffee-table', 'single-bed', 'bedside-table', 'refrigerator', 'cabinet']},
 cargo: {parcel: 'D', page: 'painted-cargo.html', hook: 'cargoWorkshop', forms: [
  'crate-square', 'crate-long', 'crate-tall', 'crate-strapped', 'crate-stack', 'crate-pallet',
  'barrel-single', 'barrel-stack', 'barrel-row', 'barrel-pyramid', 'barrel-pile', 'barrel-block']},
};
// machines (F), conveyor (G) and vehicles (H) are not adapted. factory-machines.html and
// canvas-truck.html expose `machineStudy`/`truckStudy` with `{scene, trucks}` and no form
// selector -- each page carries one model in two levels of detail, so an adapter picks a variant
// and hides the other rather than calling select(). painted-conveyor.html is a tile editor whose
// subject is a laid-out run, so parcel G wants a bake per neighbour mask, not per form. All three
// are blocked on open question 1 anyway. See SCENERY-BAKE.md, "Adding a page".

// --- the arithmetic, which is testable without a browser ---------------------------------------

// This game draws a tile 56 x 28 px at zoom 1, so one world unit steps 28 px horizontally. The
// bake reports where the world origin and the unit axes landed in image pixels; the ratio between
// those is the only scale factor in the chain.
export const TILE_HALF_WIDTH = 28;
// At elevation PI/6 a unit of height rises this many screen pixels per pixel a ground unit runs
// sideways. At the 35.26 degrees HYBRID-MIGRATION.md once quoted it would be 1.000000 instead.
export const HEIGHT_PER_GROUND_UNIT = Math.cos(Math.PI / 6) / Math.cos(Math.PI / 4);

// A projection through GAME_CAMERA has to satisfy both of these exactly, or the render is not in
// this game's projection and every number downstream is wrong art. Refuse rather than bake.
export function checkCamera({o, ox, oz, oy}, tolerance = 1e-5) {
 const dx = ox[0] - o[0], dy = ox[1] - o[1], zx = oz[0] - o[0], zy = oz[1] - o[1];
 const up = o[1] - oy[1];
 const problems = [];
 if (!(dx > 0)) problems.push(`x axis steps ${dx.toFixed(3)} px, expected a positive step`);
 if (Math.abs(dx / dy - 2) > tolerance) problems.push(`ground diamond is ${(dx / dy).toFixed(6)} : 1, expected 2.000000 : 1`);
 if (Math.abs(zx + dx) > tolerance * dx || Math.abs(zy - dy) > tolerance * dx)
  problems.push('the two ground axes are not mirror images, so the azimuth is not 45 degrees');
 // A unit of height rises cos(30)/cos(45) screen pixels for every cos(45) a ground unit runs
 // sideways, which is what elevation PI/6 means and what an elevation of 35.26 degrees would not.
 if (Math.abs(up / dx - HEIGHT_PER_GROUND_UNIT) > tolerance)
  problems.push(`height projects ${(up / dx).toFixed(6)} per ground unit, expected ${HEIGHT_PER_GROUND_UNIT.toFixed(6)}`);
 if (problems.length) throw new Error('camera is not GAME_CAMERA: ' + problems.join('; '));
 return {pxPerUnit: dx, gameScale: TILE_HALF_WIDTH / dx};
}

// The alpha >= 64 bounding box, exclusive on the far edge, which is the crop rule
// environment-renderer.js uses and tools/catalog-environment.py writes.
export function cropOf(buffer) {
 const {width, height, pixels} = decodePNG(buffer);
 let x0 = width, y0 = height, x1 = -1, y1 = -1;
 for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (pixels[(y * width + x) * 4 + 3] >= 64) {
  if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
 }
 if (x1 < 0) return {width, height, crop: null};
 return {width, height, crop: [x0, y0, x1 + 1, y1 + 1]};
}

// What a catalog row would have to say for this bake to be drawn at true world scale, and how far
// off the renderer's own anchor rule then lands.
//
// environment-renderer.js draws a prop by fitting the crop into a box and planting the crop's
// BOTTOM CENTRE at the footprint centre pushed down (w + h) * 5 px. Nothing in a prop record can
// move that point, so a model whose base is inset from its declared footprint sits high and one
// that overhangs sits low, and an asymmetric model is off-centre. Those two residuals are
// properties of the renderer, not of the bake, and they are reported rather than corrected.
export function catalogueRow({crop, footCentre, tiles, gameScale}) {
 const [x0, y0, x1, y1] = crop, cw = x1 - x0, ch = y1 - y0;
 const [w, h] = tiles;
 const drawn = [cw * gameScale, ch * gameScale];
 const anchorWanted = (w + h) * 5;
 const anchorActual = (y1 - footCentre[1]) * gameScale;
 const centre = ((x0 + x1) / 2 - footCentre[0]) * gameScale;
 return {
  tiles: [w, h], crop, cropSize: [cw, ch], drawn,
  // Setting both makes min(maxWidth/cw, maxHeight/ch) land on exactly this scale.
  visualWidth: Math.round(drawn[0]), visualHeight: Math.round(drawn[1]),
  // The default box, for comparison: a parcel only needs to override when the model overflows it.
  defaultBox: [(w + h) * 25, (w + h) * 11 + 18],
  anchor: {wanted: anchorWanted, actual: anchorActual, residual: anchorActual - anchorWanted},
  centre,
 };
}

// --- the driver ---------------------------------------------------------------------------------

const HERE = path.dirname(fileURLToPath(import.meta.url));
const INJECT = `
const THREE = await import(window.__THREE_URL);
const AZ = Math.PI / 4, EL = Math.PI / 6;
window.__bakeForms = function (hook) {
 const W = window[hook];
 if (!W) throw new Error('no workshop hook: ' + hook);
 return [...document.querySelectorAll('#form option')].map(o => o.value);
};
window.__bake = function ({hook, id, skin, size, margin, shrink}) {
 const W = window[hook];
 const mode = document.getElementById('mode'); if (mode) mode.value = 'single';
 for (const box of ['tiles', 'horse', 'wire', 'flicker']) {
  const el = document.getElementById(box); if (el && el.type === 'checkbox') el.checked = false;
 }
 W.select(id);
 const skins = [...document.querySelectorAll('#skin option')].map(o => o.value);
 const chosen = skin && skins.includes(skin) ? skin : skins[0];
 if (chosen) W.select(id, chosen);
 const placed = W.selection();
 if (placed.length !== 1) throw new Error(id + ': expected one placed model, got ' + placed.length + ' (page not in single mode?)');
 if (placed[0].form.id !== id) throw new Error(id + ': the page selected ' + placed[0].form.id + ' instead');
 const subject = placed[0].root, r = W.renderer;
 let scene = subject; while (scene.parent) scene = scene.parent;
 let branch = subject; while (branch.parent && branch.parent !== scene) branch = branch.parent;
 const hidden = [];
 for (const o of scene.children) if (o !== branch && !o.isLight && o.visible) { hidden.push(o); o.visible = false; }
 for (const o of branch.children) if (o !== subject && o.visible) { hidden.push(o); o.visible = false; }
 const box = new THREE.Box3().setFromObject(subject);
 const centre = new THREE.Vector3(); box.getCenter(centre);
 const cam = new THREE.OrthographicCamera();
 const dir = new THREE.Vector3(Math.sin(AZ) * Math.cos(EL), Math.sin(EL), Math.cos(AZ) * Math.cos(EL));
 cam.position.copy(centre).add(dir.clone().multiplyScalar(60));
 cam.up.set(0, 1, 0); cam.lookAt(centre); cam.updateMatrixWorld(true);
 const pts = [];
 for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z])
  pts.push(new THREE.Vector3(x, y, z).applyMatrix4(cam.matrixWorldInverse));
 const spanX = Math.max(...pts.map(p => p.x)) - Math.min(...pts.map(p => p.x));
 const spanY = Math.max(...pts.map(p => p.y)) - Math.min(...pts.map(p => p.y));
 const ppu = Math.min((size - margin * 2) / spanX, (size - margin * 2) / spanY) * shrink;
 const oldRatio = r.getPixelRatio(), bg = scene.background;
 r.setPixelRatio(1); r.setSize(size, size, false); r.setClearAlpha(0); scene.background = null;
 cam.left = -size / ppu / 2; cam.right = size / ppu / 2; cam.top = size / ppu / 2; cam.bottom = -size / ppu / 2;
 cam.near = .1; cam.far = 200; cam.updateProjectionMatrix();
 r.render(scene, cam);
 const url = r.domElement.toDataURL('image/png');
 const at = p => { const v = new THREE.Vector3(p[0], p[1], p[2]).project(cam); return [(v.x + 1) * size / 2, (1 - v.y) * size / 2]; };
 const root = subject.position;
 const out = {url, ppu, size, id, skin: chosen, skins, tiles: placed[0].form.tiles,
  name: placed[0].form.name, note: placed[0].form.note,
  footCentre: at([root.x, 0, root.z]),
  o: at([0, 0, 0]), ox: at([1, 0, 0]), oz: at([0, 0, 1]), oy: at([0, 1, 0])};
 scene.background = bg; r.setPixelRatio(oldRatio);
 for (const o of hidden) o.visible = true;
 return out;
};
// The scale reference both painted workshops carry. docs/tactics/MAKING-SCENERY.md measured a
// standing animal at 59 px tall at zoom 1 off the sprite sheet; this bakes the 3D one for
// comparison, which is the only end-to-end check on the whole scale chain.
window.__bakeHorse = function ({hook, size, margin}) {
 const W = window[hook], subject = W.horse.root, r = W.renderer;
 if (!subject) throw new Error(hook + ' carries no reference horse');
 subject.visible = true;
 let scene = subject; while (scene.parent) scene = scene.parent;
 const hidden = [];
 for (const o of scene.children) if (o !== subject && !o.isLight && o.visible) { hidden.push(o); o.visible = false; }
 const box = new THREE.Box3().setFromObject(subject);
 const centre = new THREE.Vector3(); box.getCenter(centre);
 const cam = new THREE.OrthographicCamera();
 const dir = new THREE.Vector3(Math.sin(AZ) * Math.cos(EL), Math.sin(EL), Math.cos(AZ) * Math.cos(EL));
 cam.position.copy(centre).add(dir.clone().multiplyScalar(60));
 cam.up.set(0, 1, 0); cam.lookAt(centre); cam.updateMatrixWorld(true);
 const pts = [];
 for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z])
  pts.push(new THREE.Vector3(x, y, z).applyMatrix4(cam.matrixWorldInverse));
 const spanX = Math.max(...pts.map(p => p.x)) - Math.min(...pts.map(p => p.x));
 const spanY = Math.max(...pts.map(p => p.y)) - Math.min(...pts.map(p => p.y));
 const ppu = Math.min((size - margin * 2) / spanX, (size - margin * 2) / spanY);
 const oldRatio = r.getPixelRatio(), bg = scene.background;
 r.setPixelRatio(1); r.setSize(size, size, false); r.setClearAlpha(0); scene.background = null;
 cam.left = -size / ppu / 2; cam.right = size / ppu / 2; cam.top = size / ppu / 2; cam.bottom = -size / ppu / 2;
 cam.near = .1; cam.far = 200; cam.updateProjectionMatrix();
 r.render(scene, cam);
 const url = r.domElement.toDataURL('image/png');
 const at = p => { const v = new THREE.Vector3(p[0], p[1], p[2]).project(cam); return [(v.x + 1) * size / 2, (1 - v.y) * size / 2]; };
 const out = {url, ppu, size, worldHeight: box.max.y - box.min.y,
  o: at([0, 0, 0]), ox: at([1, 0, 0]), oz: at([0, 0, 1]), oy: at([0, 1, 0])};
 scene.background = bg; r.setPixelRatio(oldRatio);
 for (const o of hidden) o.visible = true;
 return out;
};
window.__bakeReady = true;
`;

const arg = (name, fallback) => {
 const hit = process.argv.find(a => a.startsWith('--' + name + '='));
 return hit === undefined ? fallback : hit.slice(name.length + 3);
};
const flag = name => process.argv.includes('--' + name);

export async function openWorkshop(browser, {port, page: file, hook}) {
 const page = await browser.newPage({viewport: {width: 1100, height: 850}});
 const errors = [];
 page.on('pageerror', e => errors.push('page error: ' + e.message));
 page.on('response', r => { if (r.status() >= 400) errors.push(r.status() + ' ' + r.url()); });
 await page.goto(`http://127.0.0.1:${port}/tactics/${file}`);
 await page.waitForFunction(h => window[h]?.ready || window[h]?.entries, hook, {timeout: 60000});
 await page.evaluate(u => { window.__THREE_URL = u; }, `http://127.0.0.1:${port}/tactics/vendor/three.module.js`);
 await page.addScriptTag({type: 'module', content: INJECT});
 await page.waitForFunction(() => window.__bakeReady, null, {timeout: 20000});
 if (errors.length) throw new Error(`${file} did not load cleanly: ${errors.join('; ')}`);
 return {page, errors};
}

// A form the plan does not list is a form nobody will paint. Refuse the whole run rather than
// bake a subset and leave the gap for a reader of the manifest to notice.
export function assertFormsCovered(file, onPage, groups) {
 const claimed = new Set();
 for (const g of Object.values(groups)) if (g.page === file) for (const id of g.forms) claimed.add(id);
 const missing = onPage.filter(id => !claimed.has(id));
 const phantom = [...claimed].filter(id => !onPage.includes(id));
 if (missing.length || phantom.length) throw new Error(
  `${file}: this tool's groups no longer match the branch. ` +
  (missing.length ? `Unclaimed on the page: ${missing.join(', ')}. ` : '') +
  (phantom.length ? `Claimed but absent: ${phantom.join(', ')}. ` : '') +
  'Update GROUPS in tools/bake-scenery.mjs and the parcel sections it follows.');
}

async function bakeOne(page, {hook, id, skin, size, margin}) {
 // A silhouette that touches the canvas edge has been cropped by the frame, which is the defect
 // the 23 September integration review found in the character baker. Try once at a tighter fit,
 // then refuse; a clipped underlay is worse than none because the loss is invisible downstream.
 for (const shrink of [1, 0.92]) {
  const res = await page.evaluate(a => window.__bake(a), {hook, id, skin, size, margin, shrink});
  const buffer = Buffer.from(res.url.split(',')[1], 'base64');
  const {width, height, crop} = cropOf(buffer);
  if (!crop) throw new Error(`${id}: rendered nothing -- the alpha channel is empty`);
  if (crop[0] > 0 && crop[1] > 0 && crop[2] < width && crop[3] < height) {
   const {gameScale} = checkCamera(res);
   return {buffer, res, row: catalogueRow({crop, footCentre: res.footCentre, tiles: res.tiles, gameScale}), gameScale};
  }
 }
 throw new Error(`${id}: the silhouette still touches the canvas edge at a 0.92 fit; raise --size or --margin`);
}

async function main() {
 const port = Number(arg('port', 4319));
 const size = Number(arg('size', 1254));
 const margin = Number(arg('margin', 24));
 const out = path.resolve(arg('out', path.join(HERE, '..', 'docs', 'tactics', 'scenery-bake', 'out')));
 const wantSkins = arg('skin', '');

 const groupNames = arg('group', '') ? arg('group', '').split(',') : [];
 const formNames = arg('form', '') ? arg('form', '').split(',') : [];
 for (const g of groupNames) if (!GROUPS[g]) throw new Error(`unknown group "${g}"; have ${Object.keys(GROUPS).join(', ')}`);

 if (flag('list')) {
  for (const [name, g] of Object.entries(GROUPS))
   console.log(`${name.padEnd(10)} parcel ${g.parcel}  ${String(g.forms.length).padStart(2)} forms  ${g.page}\n   ${g.forms.join(' ')}`);
  return;
 }

 // Resolve the work into one entry per (group, form).
 const jobs = [];
 if (formNames.length) for (const id of formNames) {
  const name = Object.keys(GROUPS).find(n => GROUPS[n].forms.includes(id));
  if (!name) throw new Error(`unknown form "${id}"; run --list`);
  jobs.push({group: name, id});
 } else for (const name of (groupNames.length ? groupNames : Object.keys(GROUPS)))
  for (const id of GROUPS[name].forms) jobs.push({group: name, id});

 const require = createRequire(import.meta.url);
 const pw = require(arg('playwright', process.env.PLAYWRIGHT_PATH || 'playwright-core'));
 const browser = await pw.chromium.launch({headless: true, channel: 'msedge'});
 const manifest = [];
 try {
  if (flag('calibrate')) { await calibrate(browser, {port, size, margin, out}); return; }
  const byPage = new Map();
  for (const job of jobs) {
   const g = GROUPS[job.group];
   if (!byPage.has(g.page)) byPage.set(g.page, {hook: g.hook, jobs: []});
   byPage.get(g.page).jobs.push(job);
  }
  for (const [file, {hook, jobs: pageJobs}] of byPage) {
   const {page} = await openWorkshop(browser, {port, page: file, hook});
   assertFormsCovered(file, await page.evaluate(h => window.__bakeForms(h), hook), GROUPS);
   for (const job of pageJobs) {
    const first = await bakeOne(page, {hook, id: job.id, skin: '', size, margin});
    const skins = wantSkins === 'all' ? first.res.skins : [first.res.skin];
    for (const skin of skins) {
     const baked = skin === first.res.skin ? first : await bakeOne(page, {hook, id: job.id, skin, size, margin});
     const dir = path.join(out, job.group);
     fs.mkdirSync(dir, {recursive: true});
     const file = `${job.id}${skins.length > 1 ? '-' + skin : ''}.png`;
     fs.writeFileSync(path.join(dir, file), baked.buffer);
     manifest.push({group: job.group, parcel: GROUPS[job.group].parcel, id: job.id, skin: baked.res.skin,
      file: `${job.group}/${file}`, name: baked.res.name, ppu: +baked.res.ppu.toFixed(2),
      // The point every residual below is measured from, so a reader can redo the arithmetic.
      footCentre: baked.res.footCentre.map(v => +v.toFixed(3)), gameScale: baked.gameScale, ...baked.row});
     const r = baked.row;
     console.log(`${job.id.padEnd(30)}${(r.tiles.join('x')).padEnd(5)}` +
      `crop ${String(r.cropSize[0]).padStart(4)} x ${String(r.cropSize[1]).padStart(4)}   ` +
      `drawn ${r.drawn[0].toFixed(0).padStart(3)} x ${r.drawn[1].toFixed(0).padStart(3)} px   ` +
      `anchor ${r.anchor.residual >= 0 ? '+' : ''}${r.anchor.residual.toFixed(1).padStart(5)}   ` +
      `centre ${r.centre >= 0 ? '+' : ''}${r.centre.toFixed(1).padStart(5)}`);
    }
   }
   await page.close();
  }
  // A run of one group must not drop the rows of the groups already on disk beside it, or the
  // manifest silently stops describing the PNGs sitting next to it.
  fs.mkdirSync(out, {recursive: true});
  const manifestPath = path.join(out, 'bake-manifest.json');
  const kept = fs.existsSync(manifestPath)
   ? JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
     .filter(row => !manifest.some(m => m.file === row.file) && fs.existsSync(path.join(out, row.file)))
   : [];
  const merged = [...kept, ...manifest].sort((a, b) => a.file.localeCompare(b.file));
  fs.writeFileSync(manifestPath, JSON.stringify(merged, null, 1));
  console.log(`\n${manifest.length} baked into ${out}; the manifest now describes ${merged.length}`);
  const sunk = manifest.filter(m => m.anchor.residual < -2), high = manifest.filter(m => m.anchor.residual > 2);
  const off = manifest.filter(m => Math.abs(m.centre) > 2);
  if (sunk.length) console.log(`${sunk.length} sit ABOVE the renderer's anchor and will float: ${sunk.map(m => m.id).join(', ')}`);
  if (high.length) console.log(`${high.length} sit BELOW it and will sink: ${high.map(m => m.id).join(', ')}`);
  if (off.length) console.log(`${off.length} ${off.length === 1 ? 'is' : 'are'} off-centre by more than 2 px: ${off.map(m => `${m.id} ${m.centre.toFixed(1)}`).join(', ')}`);
  if (sunk.length || high.length || off.length)
   console.log('Those two residuals are the renderer\'s, not the bake\'s. See SCENERY-BAKE.md, "What cannot be fixed here".');
 } finally { await browser.close(); }
}

async function calibrate(browser, {port, size, margin, out}) {
 const {page} = await openWorkshop(browser, {port, page: 'painted-furniture.html', hook: 'furnitureWorkshop'});
 const res = await page.evaluate(a => window.__bakeHorse(a), {hook: 'furnitureWorkshop', size, margin});
 const buffer = Buffer.from(res.url.split(',')[1], 'base64');
 fs.mkdirSync(out, {recursive: true});
 fs.writeFileSync(path.join(out, 'calibration-horse.png'), buffer);
 const {crop} = cropOf(buffer);
 const {pxPerUnit, gameScale} = checkCamera(res);
 const drawn = [(crop[2] - crop[0]) * gameScale, (crop[3] - crop[1]) * gameScale];
 const dy = res.ox[1] - res.o[1];
 console.log('Camera, measured in the render rather than read from the branch:');
 console.log(`  one ground unit steps ${pxPerUnit.toFixed(3)} x ${dy.toFixed(3)} px  ->  ${(pxPerUnit / dy).toFixed(6)} : 1   (2.000000 wanted)`);
 console.log(`  one unit of height    steps ${(res.o[1] - res.oy[1]).toFixed(3)} px  ->  ${((res.o[1] - res.oy[1]) / pxPerUnit).toFixed(6)} per ground unit   (${HEIGHT_PER_GROUND_UNIT.toFixed(6)} wanted)`);
 console.log(`  so one bake pixel is ${gameScale.toFixed(6)} game px at zoom 1\n`);
 console.log(`Reference horse: ${res.worldHeight.toFixed(3)} world units tall, silhouette ${crop[2] - crop[0]} x ${crop[3] - crop[1]} px at ppu ${res.ppu.toFixed(1)}`);
 console.log(`  baked   ${drawn[0].toFixed(1)} x ${drawn[1].toFixed(1)} px at zoom 1`);
 console.log('  painted 30-35 x 59 px  (alpha bounding box of cow/hen/horse-idle.png, see MAKING-SCENERY.md)');
 console.log(`  the 3D line stands ${((drawn[1] / 59 - 1) * 100).toFixed(1)}% taller than the sprite sheet`);
 if (drawn[1] < 40 || drawn[1] > 80) throw new Error(
  `the reference horse bakes at ${drawn[1].toFixed(1)} px where the sprite sheet says 59; the scale chain is broken, not merely disagreeing`);
 await page.close();
}

if (process.argv[1]?.endsWith('bake-scenery.mjs')) await main();
