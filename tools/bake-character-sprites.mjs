// Bake character sprites out of the 3D line's rigged models, at this game's own projection.
//
// The two games already share a camera. dist/tactics/view.js draws a tile 56 x 28 px at zoom 1,
// and the 3D branch's GAME_CAMERA in hybrid-world.js is {azimuth: PI/4, elevation: PI/6}. A unit
// ground square through that camera is exactly 2.000000 wide for 1 tall, which is the same 2:1
// diamond. So a model can be photographed straight into a sprite slot with no reprojection --
// only the scale has to be chosen, and that is forced too: one world unit steps cos(45) * ppu
// pixels across the screen, the game wants 28 of them at zoom 1, and sprites are stored at 4x
// the drawn size, so ppu = 4 * 28 / cos(45) = 158.392.
//
// The anchor is NOT the alpha bounding box. A walk cycle drives the model across the ground, and
// a raised muzzle or a tail can hang past the feet. worker.root sits on the floor at y = 0 and
// travels with the animation, so projecting it gives the tile the character is standing on. That
// point is placed on the sprite baseline, which every existing sprite shares: measured, not
// assumed, every PNG in dist/assets/characters plants its last opaque row at y = 243 of 256.
//
//   node tools/bake-character-sprites.mjs --animal=horse --weapon=rifle --pose=idle
//   node tools/bake-character-sprites.mjs --animal=all --headings=0,45,90,135,180,225,270,315
//
// Needs the 3D reference tree served (see docs/tactics/SPRITE-BAKE.md) and playwright-core with
// an installed Edge. Nothing here reads or writes the scenery registries.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const arg = (name, fallback) => {
  const hit = process.argv.find(a => a.startsWith('--' + name + '='));
  return hit ? hit.slice(name.length + 3) : fallback;
};

const PORT = Number(arg('port', 4318));
const OUT = path.resolve(arg('out', 'docs/tactics/sprite-bake/out'));
const PLAYWRIGHT = arg('playwright', process.env.PLAYWRIGHT_PATH || 'playwright-core');
const HEADINGS = arg('headings', '0').split(',').map(Number);
const WEAPONS = arg('weapon', 'rifle').split(',');
const POSES = arg('pose', 'idle').split(',');

// The 3D study timeline runs walk -> settle -> kneel -> aim -> fire -> lower -> stand -> standing
// over eleven seconds. These are the moments that correspond to a sprite the 2D sheet holds; the
// phase names come from animalMotion.diagnostics().phase, so a retimed study is caught by the
// assertion below rather than silently baking the wrong body.
export const POSE_TIMES = {
  'idle':     {time: 10.50, phase: 'Standing'},
  'walk-a':   {time: 1.00,  phase: 'Walk'},
  'walk-b':   {time: 2.00,  phase: 'Walk'},
  'kneeling': {time: 5.00,  phase: 'Aim'},
  'aim':      {time: 6.50,  phase: 'Aim'},
  'fire':     {time: 6.70,  phase: 'Fire / recover'},
};

// Canvas sizes are the existing catalog's, read back out of dist/tactics/character-art.js.
// Anything wider than its slot is reported rather than cropped silently.
const CANVAS = {
  'idle':     {w: 192, h: 256},
  'walk-a':   {w: 192, h: 256},
  'walk-b':   {w: 192, h: 256},
  'kneeling': {w: 384, h: 256},
  'aim':      {w: 384, h: 256},
  'fire':     {w: 384, h: 256},
  'armed':    {w: 256, h: 256},
};
const BASELINE = 243;   // last opaque row of every sprite in dist/assets/characters
const PPU = 4 * 28 / Math.cos(Math.PI / 4);

const pw = require(PLAYWRIGHT);
fs.mkdirSync(OUT, {recursive: true});

const browser = await pw.chromium.launch({headless: true, channel: 'msedge'});
const records = [];
try {
  const page = await browser.newPage({viewport: {width: 900, height: 700}});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => { if (r.status() >= 400) errors.push(r.status() + ' ' + r.url()); });

  await page.goto('http://127.0.0.1:' + PORT + '/tactics/animal-motion.html?paused');
  await page.waitForFunction(() => window.animalMotionReady, null, {timeout: 60000});

  const all = await page.evaluate(() => [...document.querySelectorAll('#animal option')].map(o => o.value));
  const animals = arg('animal', 'horse') === 'all' ? all : arg('animal', 'horse').split(',');
  for (const id of animals) if (!all.includes(id)) throw new Error('unknown animal: ' + id);

  await page.evaluate(ppu => { window.BAKE_PPU = ppu; }, PPU);
  await page.addScriptTag({type: 'module', content: `
    const THREE = await import('http://127.0.0.1:${PORT}/tactics/vendor/three.module.js');
    const {createWeaponModel, WEAPON_MODELS} = await import('http://127.0.0.1:${PORT}/tactics/weapon-models.js');
    // equipWeapon takes a built asset, not an id. Keep the old one alive until the new one is
    // mounted, then dispose it; swapping to a half-built asset leaves the rig without a grip.
    window.bakeWeapons = Object.keys(WEAPON_MODELS);
    // The motion study equips one Mosin-Nagant at load and builds the battle posture around it.
    // equipWeapon() mounts a different asset happily, but posture -- not equipWeapon -- is what
    // moves the gun to the carry anchor and makes it visible, and posture is built once per
    // animal. Swapping therefore yields a rig holding an invisible weapon at the origin, which
    // bakes as a perfectly clean sprite of an unarmed character. Refuse instead of shipping that.
    window.bakeEquip = function (id) {
      const previous = animalMotion.worker.weapon;
      animalMotion.worker.equipWeapon(createWeaponModel(id));
      animalMotion.seek(10.5);
      const mounted = animalMotion.worker.weapon;
      if (!mounted?.root?.visible) {
        if (previous) { animalMotion.worker.equipWeapon(previous); animalMotion.seek(10.5); }
        return 'posture does not carry "' + id + '" on this harness (weapon mounts hidden at the ' +
               'origin); animal-motion.html only poses the rifle it was built with';
      }
      return true;
    };
    window.bakeFrame = function ({heading, time, w, h, baseline}) {
      const r = animalMotion.renderer, cam = animalMotion.camera, sc = animalMotion.scene;
      document.getElementById('heading').value = heading;
      document.getElementById('pitch').value = 0;
      animalMotion.seek(time);                       // the viewer poses the rig and sets its own camera
      const hidden = [];                             // the studio floor and grid are not the character
      for (const o of sc.children)
        if ((o.type === 'Mesh' && o.geometry?.type === 'PlaneGeometry') || o.type === 'GridHelper') {
          hidden.push([o, o.visible]); o.visible = false;
        }
      const P = window.BAKE_PPU, AZ = Math.PI / 4, EL = Math.PI / 6;
      // Render generously, then place by the ground anchor. A tight frame would clip a raised
      // muzzle at some headings, and the crop has to be decided after the silhouette is known.
      const RW = 768, RH = 768;
      r.setSize(RW, RH, false); r.setClearAlpha(0);
      cam.left = -RW/P/2; cam.right = RW/P/2; cam.top = RH/P/2; cam.bottom = -RH/P/2;
      cam.near = 0.1; cam.far = 40;
      const foot = new THREE.Vector3();
      animalMotion.worker.root.getWorldPosition(foot);          // on the floor, travels with the walk
      const focus = foot.clone().setY(foot.y + 0.8);
      cam.position.copy(focus).add(new THREE.Vector3(
        Math.sin(AZ)*Math.cos(EL), Math.sin(EL), Math.cos(AZ)*Math.cos(EL)).multiplyScalar(12));
      cam.lookAt(focus); cam.updateProjectionMatrix();
      r.render(sc, cam);
      const ndc = foot.clone().project(cam);
      const anchorX = (ndc.x + 1) / 2 * RW, anchorY = (1 - ndc.y) / 2 * RH;
      const src = document.createElement('canvas'); src.width = RW; src.height = RH;
      src.getContext('2d').drawImage(r.domElement, 0, 0);
      for (const [o, v] of hidden) o.visible = v;
      const px = src.getContext('2d').getImageData(0, 0, RW, RH).data;
      let x0 = RW, y0 = RH, x1 = -1, y1 = -1;
      for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++)
        if (px[(y*RW+x)*4+3] > 16) { if(x<x0)x0=x; if(x>x1)x1=x; if(y<y0)y0=y; if(y>y1)y1=y; }
      // Place the ground anchor at (w/2, baseline) of the sprite canvas.
      const out = document.createElement('canvas'); out.width = w; out.height = h;
      const g = out.getContext('2d');
      const dx = Math.round(w / 2 - anchorX), dy = Math.round(baseline - anchorY);
      g.drawImage(src, dx, dy);
      const overflow = {
        left: Math.max(0, -(x0 + dx)), right: Math.max(0, (x1 + dx) - (w - 1)),
        top: Math.max(0, -(y0 + dy)), bottom: Math.max(0, (y1 + dy) - (h - 1)),
      };
      const q = g.getImageData(0, 0, w, h).data;
      let a0 = w, b0 = h, a1 = -1, b1 = -1, n = 0;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++)
        if (q[(y*w+x)*4+3] > 16) { n++; if(x<a0)a0=x; if(x>a1)a1=x; if(y<b0)b0=y; if(y>b1)b1=y; }
      return {
        png: out.toDataURL('image/png').split(',')[1],
        bbox: [a0, b0, a1, b1], contentW: a1-a0+1, contentH: b1-b0+1, opaque: n,
        anchor: [Math.round(w/2), baseline], overflow,
        phase: animalMotion.diagnostics().phase,
      };
    };
  `});

  for (const id of animals) {
    await page.evaluate(i => animalMotion.loadAnimal(i), id);
    await page.waitForFunction(() => !animalMotion.diagnostics().loading, null, {timeout: 60000});
    const unarmed = await page.evaluate(() => !!animalMotion.diagnostics().unarmed);
    for (const weapon of WEAPONS) {
      // 'rifle' is what the study already holds; re-equipping it would lose the posture binding.
      if (!unarmed && weapon !== 'rifle') {
        const ok = await page.evaluate(w => {
          if (!window.bakeWeapons.includes(w)) return 'unknown weapon model: ' + w;
          try { return window.bakeEquip(w); } catch (e) { return e.message; }
        }, weapon);
        if (ok !== true) { console.log('  ! ' + id + ' ' + weapon + ': ' + ok); continue; }
      }
      for (const pose of POSES) {
        const spec = POSE_TIMES[pose];
        if (!spec) throw new Error('unknown pose: ' + pose);
        const box = CANVAS[pose === 'idle' && weapon !== 'hands' ? 'armed' : pose] || CANVAS.idle;
        for (const heading of HEADINGS) {
          const f = await page.evaluate(a => window.bakeFrame(a),
            {heading, time: spec.time, w: box.w, h: box.h, baseline: BASELINE});
          if (f.phase !== spec.phase)
            throw new Error('timeline moved: ' + pose + ' at t=' + spec.time + ' is now "' + f.phase + '", expected "' + spec.phase + '"');
          const name = [id, weapon, pose, HEADINGS.length > 1 ? 'h' + heading : null].filter(Boolean).join('-') + '.png';
          fs.writeFileSync(path.join(OUT, name), Buffer.from(f.png, 'base64'));
          const clipped = Object.values(f.overflow).some(v => v > 0);
          records.push({file: name, animal: id, weapon, pose, heading, canvas: [box.w, box.h],
            bbox: f.bbox, contentW: f.contentW, contentH: f.contentH, anchor: f.anchor,
            overflow: f.overflow, clipped});
          console.log('  ' + name + '  ' + f.contentW + 'x' + f.contentH +
            (clipped ? '  CLIPPED ' + JSON.stringify(f.overflow) : ''));
        }
      }
    }
  }
  if (errors.length) { console.log('PAGE ERRORS:'); for (const e of errors) console.log('  ' + e); }
} finally {
  await browser.close();
}

fs.writeFileSync(path.join(OUT, 'bake-manifest.json'), JSON.stringify({
  bakedAt: new Date().toISOString(),
  projection: {azimuth: 'PI/4', elevation: 'PI/6', diamond: '2:1', pixelsPerUnit: PPU, baseline: BASELINE},
  source: 'project/tactics-3d animal-motion.html',
  records,
}, null, 2) + '\n');
const clipped = records.filter(r => r.clipped);
console.log(records.length + ' sprites baked into ' + OUT);
if (clipped.length) console.log(clipped.length + ' CLIPPED — the slot is too small for that heading: ' +
  [...new Set(clipped.map(r => r.pose))].join(', '));
