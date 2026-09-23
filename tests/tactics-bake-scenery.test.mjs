import test from 'node:test';
import assert from 'node:assert/strict';
import {encodePNG} from '../tools/png-rgba.mjs';
import {GROUPS, TILE_HALF_WIDTH, HEIGHT_PER_GROUND_UNIT, checkCamera, catalogueRow, cropOf, assertFormsCovered,
 RIGS, rigFor, DEFAULT_LIGHT, MARK_RGBA, registrationMarks, marksFit, paintMarks}
 from '../tools/bake-scenery.mjs';

// tools/bake-scenery.mjs needs a browser, a served 3D tree and an installed Edge to take a
// picture, and none of that belongs in a unit test. What does belong is the arithmetic that turns
// a picture into catalog numbers, and the guards that are supposed to refuse. Those are pure.
//
// The probe below is a real measurement, printed by --calibrate against the 3D branch at 82e60cf:
// a ground unit stepping 407.136 x 203.568 px and a unit of height rising 498.637 px. If the
// branch ever retilts its camera these numbers change and the tool must refuse, so the test keeps
// a copy rather than recomputing one from the same formula the tool uses.
const TRUE_CAMERA = {o: [0, 0], ox: [407.136, 203.568], oz: [-407.136, 203.568], oy: [0, -498.637]};

test('the camera check passes the real GAME_CAMERA and fails anything else', () => {
 const {pxPerUnit, gameScale} = checkCamera(TRUE_CAMERA, 1e-5);
 assert.equal(pxPerUnit, 407.136);
 // dist/tactics/view.js projects x to (x - y) * 28 * zoom, so one world unit is 28 game px wide
 // at zoom 1. Spelled out rather than read back out of the module, or the constant cannot be
 // wrong: 407.136 bake px per unit, 28 game px per unit, so 0.068773 game px per bake px.
 assert.equal(TILE_HALF_WIDTH, 28);
 assert.ok(Math.abs(gameScale - 0.0687733) < 1e-6, `gameScale was ${gameScale}`);

 // The elevation HYBRID-MIGRATION.md once quoted, 35.264 degrees, is the specific wrong answer
 // this guard exists to catch: it still gives a symmetric diamond, so only the height ratio
 // betrays it. A guard that cannot fail on the documented mistake is not a guard.
 const el = Math.atan(1 / Math.SQRT2), run = 407.136;
 const tilted = {o: [0, 0], ox: [run, run * Math.sin(el)], oz: [-run, run * Math.sin(el)],
                 oy: [0, -run * Math.cos(el) / Math.cos(Math.PI / 4)]};
 assert.throws(() => checkCamera(tilted), /height projects/);
 // 1.73 : 1 instead of 2 : 1 -- the diamond that document also quoted.
 assert.throws(() => checkCamera({...TRUE_CAMERA, ox: [407.136, 235.060], oz: [-407.136, 235.060]}), /2\.000000/);
 // A mirror that is not a mirror: azimuth off 45 degrees.
 assert.throws(() => checkCamera({...TRUE_CAMERA, oz: [-300, 203.568]}), /mirror images/);
 // And the constant itself, so a typo in it is not silently blessed by the test above.
 assert.ok(Math.abs(HEIGHT_PER_GROUND_UNIT - 1.2247448713915892) < 1e-12);
});

// Two real rows out of docs/tactics/scenery-bake/out/bake-manifest.json, baked from the branch at
// 82e60cf. Invented numbers would only check the arithmetic against itself.
const DINING_TABLE = {crop: [24, 103, 1230, 1105], footCentre: [627, 851.879], tiles: [1, 2], gameScale: 0.06423840946107362};
const SCONCE = {crop: [155, 300, 1110, 1138], footCentre: [985.433, 2534.303], tiles: [1, 1], gameScale: 0.029938639638633482};

test('a bake becomes the catalog numbers the renderer would need', () => {
 const row = catalogueRow(DINING_TABLE);
 assert.deepEqual(row.cropSize, [1206, 1002]);
 assert.equal(row.visualWidth, 77);           // 1206 * 0.0642384
 assert.equal(row.visualHeight, 64);          // 1002 * 0.0642384
 // Setting both to the drawn size makes the renderer's min() land on exactly that scale, because
 // maxWidth/cropWidth and maxHeight/cropHeight then agree.
 const s = Math.min(row.visualWidth / row.cropSize[0], row.visualHeight / row.cropSize[1]);
 assert.ok(Math.abs(s - DINING_TABLE.gameScale) < 5e-4, `fitted scale ${s} against ${DINING_TABLE.gameScale}`);
 // A 1x2 prop with no visual overrides would be fitted into (1+2)*25 by (1+2)*11+18. This table
 // is half as wide again as that, which is why a parcel that skips the override paints it small.
 assert.deepEqual(row.defaultBox, [75, 51]);
 assert.ok(row.drawn[0] > row.defaultBox[0] && row.drawn[1] > row.defaultBox[1]);

 // The renderer plants the crop's bottom (1+2)*5 = 15 px below the footprint centre; this table's
 // own bottom is (1105 - 851.879) * gameScale = 16.26 px below it, so it sinks 1.3 px.
 assert.equal(row.anchor.wanted, 15);
 assert.ok(Math.abs(row.anchor.actual - 16.26) < 0.01, `anchor.actual was ${row.anchor.actual}`);
 assert.ok(Math.abs(row.anchor.residual - 1.26) < 0.01);
 assert.ok(Math.abs(row.centre) < 0.05, 'a symmetric model has nothing to report horizontally');

 // A model hung on a wall is the case these residuals exist to surface. The sconce's own bottom
 // is ABOVE its tile centre, not below it, so the renderer would drop it 52 px to the floor and
 // shift it 10.6 px off the tile. No field in a prop record can correct either.
 const sconce = catalogueRow(SCONCE);
 assert.ok(sconce.anchor.actual < 0, 'the sconce hangs above its own tile centre');
 assert.ok(Math.abs(sconce.anchor.residual + 51.8) < 0.1, `was ${sconce.anchor.residual}`);
 assert.ok(Math.abs(sconce.centre + 10.57) < 0.05, `was ${sconce.centre}`);
 // Nearly two tile heights. A wall fixture is not a rounding problem, which is open question 5.
 assert.ok(Math.abs(sconce.anchor.residual) > 28 * 1.5);
});

test('the crop is the alpha >= 64 box the renderer will use, exclusive on the far edge', () => {
 // Build a 10 x 10 frame by hand: one solid pixel at (3,4), one at (6,7), and a nearly clear one
 // at (1,1) that sits just under the threshold the renderer crops at.
 const w = 10, h = 10, pixels = new Uint8Array(w * h * 4);
 const put = (x, y, a) => { const i = (y * w + x) * 4; pixels[i] = 200; pixels[i + 1] = 180; pixels[i + 2] = 60; pixels[i + 3] = a; };
 put(1, 1, 63); put(3, 4, 255); put(6, 7, 64);
 const {crop, width, height} = cropOf(Buffer.from(encodePNG({width: w, height: h, pixels})));
 assert.deepEqual([width, height], [10, 10]);
 // x0,y0 inclusive at the first opaque pixel; x1,y1 one past the last. Alpha 63 is not content,
 // alpha 64 is -- so the 63 at (1,1) must not pull the box out to the top left.
 assert.deepEqual(crop, [3, 4, 7, 8]);
 // An empty frame is a refusal case in the driver, not a zero-sized crop.
 assert.equal(cropOf(Buffer.from(encodePNG({width: w, height: h, pixels: new Uint8Array(w * h * 4)}))).crop, null);
});

test('the group table partitions the branch, and says so when it does not', () => {
 const all = Object.values(GROUPS).flatMap(g => g.forms);
 assert.equal(new Set(all).size, all.length, 'a form appears in two groups');
 // Every group names a parcel in docs/tactics/SCENERY-PORT-HANDOFF.md and one page to drive.
 for (const [name, g] of Object.entries(GROUPS)) {
  assert.match(g.parcel, /^[A-Z]$/, name);
  assert.match(g.page, /\.html$/, name);
  assert.ok(g.forms.length > 0, name);
 }
 // The three furniture-page groups together are the 3D branch's FURNITURE_FORMS, all 32 of them.
 const onFurniturePage = Object.values(GROUPS).filter(g => g.page === 'painted-furniture.html')
  .flatMap(g => g.forms);
 assert.equal(onFurniturePage.length, 32);
 assert.equal(GROUPS.cargo.forms.length, 12);

 // assertFormsCovered is what runs against the live page. It must fail both ways: a form the
 // branch grew that no parcel claims, and a form this table claims that the branch dropped.
 assert.doesNotThrow(() => assertFormsCovered('painted-cargo.html', [...GROUPS.cargo.forms], GROUPS));
 assert.throws(() => assertFormsCovered('painted-cargo.html', [...GROUPS.cargo.forms, 'crate-new'], GROUPS),
  /Unclaimed on the page: crate-new/);
 assert.throws(() => assertFormsCovered('painted-cargo.html', GROUPS.cargo.forms.slice(1), GROUPS),
  /Claimed but absent: crate-square/);
});

// --- the catalogue light and the registration marks (parcel B) -----------------------------------

test('the light table refuses a rig it does not know', () => {
 assert.equal(rigFor('page'), null, 'page means: leave the workshop lights alone');
 // And it is the default: every other parcel re-bakes under it, so moving it is a policy change
 // (open question 9), not a tool tweak.
 assert.equal(DEFAULT_LIGHT, 'page');
 // The calibrated rig, spelled out: a key from the screen's upper left, no tone mapping, and the
 // 3D iron re-tinted to the painted catalogue's. Read back from RIGS it could not be wrong.
 assert.deepEqual(rigFor('catalogue'),
  {from: [-1, 2, 3], fill: .5, key: 2.8, gain: 1.3, tone: 'none', flamesUnlit: true, tints: {iron: 0x8c887e}});
 assert.equal(rigFor('catalogue'), RIGS.catalogue);
 assert.throws(() => rigFor('studio'), /unknown --light="studio"; have catalogue, page/);
 // Inherited properties are not rigs either.
 assert.throws(() => rigFor('toString'), /unknown --light/);
});

// A frame with a model in it: a 20 px lamp post from y 200 to 600, right of the footprint centre.
function postFrame(size = 1254) {
 const png = {width: size, height: size, pixels: new Uint8Array(size * size * 4)};
 for (let y = 200; y < 600; y++) for (let x = 660; x < 680; x++) png.pixels.set([40, 40, 40, 255], (y * size + x) * 4);
 return png;
}

test('two marks put the crop bottom on the renderer anchor and its middle on the footprint', () => {
 const {gameScale} = checkCamera(TRUE_CAMERA);
 const foot = [627.4, 700], png = postFrame();
 const model = cropOf(Buffer.from(encodePNG(png))).crop;
 const before = catalogueRow({crop: model, footCentre: foot, tiles: [1, 1], gameScale});
 // Its bottom is 100 bake px ABOVE the footprint centre, where the renderer wants it 10 game px =
 // 145.4 bake px below; and it is 3.4 game px right of centre.
 assert.ok(before.anchor.residual < -16, `without marks it floats ${before.anchor.residual} px`);
 assert.ok(before.centre > 2, 'and sits off-centre');

 const marks = registrationMarks({footCentre: foot, crop: model, tiles: [1, 1], gameScale});
 // The anchor row: round(700 + 10 / 0.0687733) - 1 = 845 - 1.
 assert.equal(marks.row, 844);
 assert.ok(marksFit(marks, 1254, 1254));
 paintMarks(png, marks);
 const after = catalogueRow({crop: cropOf(Buffer.from(encodePNG(png))).crop, footCentre: foot, tiles: [1, 1], gameScale});
 // Within one bake pixel (0.069 game px) both ways, from a footprint centre that is not a whole pixel.
 assert.ok(Math.abs(after.anchor.residual) < gameScale, `residual ${after.anchor.residual}`);
 assert.ok(Math.abs(after.centre) < gameScale, `centre ${after.centre}`);
 // The box is the model reflected about the centre: its far edge is 680 - 627.4 = 52.6 px out, the
 // left mark goes one pixel further and is floored to x 573, so 2 * (627.4 - 573) = 108.8 -> 109 px.
 assert.deepEqual(after.cropSize, [109, 845 - 200]);

 // Deeper footprints drop further: 15 and 20 game px for a 2 x 1 and a 2 x 2.
 for (const [tiles, px] of [[[2, 1], 15], [[2, 2], 20]])
  assert.equal(registrationMarks({footCentre: foot, crop: model, tiles, gameScale}).row, Math.round(700 + px / 0.0687733) - 1);
});

test('the marks are two pixels at the crop threshold, never painted over the model', () => {
 // The renderer crops at alpha >= 64: a mark any fainter would not reach the crop, and any stronger
 // would be more visible than it needs to be.
 assert.deepEqual(MARK_RGBA, [0x13, 0x24, 0x1d, 64]);
 const w = 9, h = 3, pixels = new Uint8Array(w * h * 4);
 pixels.set([200, 30, 30, 255], (1 * w + 7) * 4);   // model pixel where the right mark would go
 paintMarks({width: w, height: h, pixels}, {row: 1, left: 1, right: 7});
 const at = (x, y) => [...pixels.slice((y * w + x) * 4, (y * w + x) * 4 + 4)];
 assert.deepEqual(at(1, 1), [0x13, 0x24, 0x1d, 64], 'a clear pixel takes the mark');
 assert.deepEqual(at(7, 1), [200, 30, 30, 255], 'the model is never overwritten');
 let painted = 0;
 for (let i = 3; i < pixels.length; i += 4) if (pixels[i]) painted++;
 assert.equal(painted, 2, 'two pixels, nothing else');

 // A wall fixture's footprint centre is far below its subject, off the canvas: no marks at all,
 // rather than clipped ones whose crop would claim a registration it does not have.
 assert.equal(marksFit({row: 2534, left: 800, right: 1170}, 1254, 1254), false);
 assert.equal(marksFit({row: 700, left: -1, right: 1000}, 1254, 1254), false, 'left edge');
 assert.equal(marksFit({row: 700, left: 200, right: 1254}, 1254, 1254), false, 'right edge');
 assert.equal(marksFit({row: 700, left: 200, right: 1000}, 1254, 1254), true);
});
