# Lamps and fires — parcel B

Written 23 September 2026. Parcel B of [SCENERY-PORT-HANDOFF.md](SCENERY-PORT-HANDOFF.md):
the light fixtures of the 3D branch, as sprites, on the tiles the 3D editor puts them on. Art
and placement only. Nothing here emits light; that is parcel I.

![The seven fixtures in the game's own renderer, zoom 2, beside a standing cow and the painted crate and barrel](lighting.png)

*Drawn by `environment-renderer.js` at zoom 2 on the review page, `dist/tactics/lighting-art.html`.
The pale diamonds are the footprints and the orange crosses are where the renderer plants a
sprite's bottom. Every fixture stands on the middle of its own footprint.*

## What shipped

Seven kinds, all from `painted-furniture.js` on `project/tactics-3d`, honey finish:

| kind | tiles | model at zoom 1 | drawn box | cover | downscale |
| --- | --- | --- | --- | --- | --- |
| `floor-lamp` | 1 × 1 | 25 × 70 | 40 × 74 | — | 15.4 : 1 |
| `bedside-table-lamp` | 1 × 1 | 35 × 60 | 40 × 62 | 25 | 17.8 : 1 |
| `streetlight` | 1 × 1 | 24 × 104 | 40 × 110 | — | 10.2 : 1 |
| `streetlight-double` | 2 × 1 | 55 × 113 | 60 × 124 | — | 9.0 : 1 |
| `standing-torch` | 1 × 1 | 18 × 60 | 40 × 66 | — | 16.1 : 1 |
| `campfire` | 1 × 1 | 35 × 31 | 40 × 34 | — | 23.4 : 1 |
| `cooking-fire` | 2 × 2 | 65 × 96 | 80 × 98 | — | 10.0 : 1 |

"Model" is the fixture itself at true world scale; the drawn box is wider and a little taller
because it includes the ground-contact shadow that registers it (below). A standing animal is
59 px tall, so a floor lamp stands a head taller than a cow and a streetlight nearly twice it.

The rules are the 3D branch's own, not a guess. Its `core/environment.js` does
`Object.assign(PROPS, LIGHT_PROPS)`, and `light-sources.js` builds each as
`{w, h, solid: !wall, cover: kind === 'bedside-table-lamp' ? 25 : 0}`. So every fixture blocks
its tile, only the bedside table is cover, and none is `tall`, which here is what blocks sight.
A map authored on either branch loads on the other, and the `lightMode` the 3D editor writes
onto a placed fixture survives the trip for parcel I to read.

## Why these are bakes and not paintings

Every painting in the catalogue came out of Codex's built-in image generator
(`art/environment-sources.json` records the paths). This session has no image generator, so the
parcel had two choices: wait for one, or make the bake good enough to ship. The plan said
a bake is an underlay and never the deliverable, because the 3D branch shades at runtime and a
sprite carries its own light. That objection is about **light**, so it was measured rather than
argued, at the size the game draws the things, on the two subjects both lines have:

| | luma | sd | TL ÷ BR | saturation |
| --- | --- | --- | --- | --- |
| painted `crate-wood` | 82 | 30.2 | 1.92 | 0.44 |
| baked crate, workshop light | 104 | 18.9 | 1.23 | 0.48 |
| baked crate, **catalogue rig** | 83 | 29.6 | 2.19 | 0.41 |
| painted `barrel-single` | 64 | 24.4 | 2.26 | 0.64 |
| baked barrel, **catalogue rig** | 50 | 18.6 | 2.26 | 0.67 |

TL ÷ BR is the upper-left quadrant's mean luma over the lower-right's, which is the light
direction. The workshop's sun stands at (5, 7, 6) and lights the two visible side faces almost
equally, so its bakes come out flat, bright and directionless. The painted catalogue is lit hard
from the upper left. The catalogue rig puts one key light at (−1, 2, 3) with a hemisphere
fill, and after that the crate matches the painting on every measure. The barrel stays darker
because the nearest 3D skin, `oxide`, is a darker red than the painted one. That's albedo, not light.

![Workshop light, top; the catalogue rig with contact shadows, bottom; 4x at drawn size beside a cow and the painted crate and barrel](lighting-relight.png)

Two things the calibration turned up, both now in the tool:

- **ACES tone mapping overshot the light direction on every rig tried**, to 2.5 to 9 where the
  paintings are about 2, so the rig renders without it.
- **With tone mapping off, three.js ignores `toneMappingExposure`.** The first sweep had an
  exposure knob that silently did nothing at every value. Brightness now goes through a `gain`
  on both lights.

Flames on the 3D branch are ordinary lit meshes (the page flickers their colour), so under a
new key light they would shade like wood. The rig draws the meshes the page flickers unlit,
which is how a painted flame reads.

## Registration: the contact shadow

`environment-renderer.js` plants a crop's bottom centre `(w + h) * 5` px below the footprint
centre, and no prop field can move that point (SCENERY-BAKE.md, "The registration contract").
That rule assumes a subject that fills most of its footprint. A lamp on a round base doesn't,
so its bottom is higher than the anchor and every one of these would have been drawn low:

| | residual before | after |
| --- | --- | --- |
| `streetlight-double` | −10.6 px | 0.0 |
| `standing-torch` | −6.1, 1.2 off-centre | 0.0 |
| `streetlight` | −5.6, 3.6 off-centre | 0.0 |
| `floor-lamp` | −4.5 | 0.0 |
| `bedside-table-lamp` | −2.5 | 0.0 |
| `campfire` | −2.3 | 0.0 |
| `cooking-fire` | −1.5, 4.6 off-centre | 0.0 |

`bake-scenery.mjs --shadow` paints a flat ellipse under the model: the footprint's own shape,
scaled so its lowest point is exactly the anchor, centred on the footprint centre. The crop then
*is* that ellipse, vertically because its bottom is the anchor and horizontally because the
ellipse is symmetric about the footprint centre. The scale factor is 0.505 for a square, where
it just touches the edge midpoints, and 0.479 for a 2 × 1, so it never leaves the footprint.

It is the unit shadow's colour, `#13241d`, at alpha 72 instead of the unit's 102. The size is
fixed by the anchor, and at full strength a 40 × 20 px ellipse under a slim lamp read as a mat.
72 is the faintest that clears the renderer's alpha ≥ 64 crop rule with margin. On the game's
grass the difference from bare ground is about 6 luma, visible as grounding and not as an object.

`tests/tactics-lighting.test.mjs` checks this off the shipped PNGs, not off the tool: the
bottom row of every crop is shadow-coloured, and the crop's left and right edges are the
shadow's. On a 2 × 1 the lowest point of the ellipse is off-centre, since the ellipse is long
along x, so it is the extent that has to be centred, not that point.

## What this parcel does not do

- **The wall torch and the gooseneck sconce.** Open question 5. They bake 36 and 52 px from
  where the renderer would plant them, and a shadow can't help, because their footprint
  centre is off the bottom of the canvas and nowhere near the subject. The 3D branch does
  have a convention: `fixturePlacement` in `light-sources.js` shifts a wall fixture 0.48 tile
  north, or east when rotated. Porting it needs a renderer change this parcel does not own.
  Until then **a 3D map carrying either is refused here** with `Invalid environment props.`,
  the same kind of live incompatibility parcel A fixed for mature trees. Both are listed in
  `DEFERRED` in `environment-props-lighting.js`, and a test fails if the baker's `lighting`
  group ever holds a form that is neither shipped nor deferred.
- **Flickering flames.** The flames are baked into three sprites and hold still. The fire
  idiom this tree already has (`ground-fire.js`) draws flame clumps as separate depth-sorted
  objects, and `paint-order.js` has `propPieceDepth` for exactly that, but nothing in
  `app.js` pushes prop pieces into the sort yet, and `app.js` is not this parcel's. Once it
  does, re-bake the three fires with their flame meshes hidden and draw the clumps from
  `ground-fire.js`; honour reduced motion the way the ground fire already does.
- **Light.** Nothing emits. Parcel I reads `lightMode`, which survives load and export.
- **Mirroring flips the light.** A rotated prop is drawn with `scale(-1, 1)`, so its key light
  comes from the upper right. The whole painted catalogue has the same property, so it
  matches its neighbours; it is recorded here, not fixed.
- **Open question 8.** These are at the 3D line's world scale, which stands about 9% taller than
  the sprite sheet's animals. Nothing here corrects that.

## Verification

- `npm run check`: 522 pass, up from 513. Four of the new tests are on the baker's rig,
  shadow and refusals, five on the parcel; the asset gate passes with the seven new ids.
- **14 deliberate mutations, 14 caught** on the first round. They cover the shadow's
  geometry, compositing order and canvas check, the rig table, every catalog field that matters,
  the crop table and `drawn-size`'s view of group art.
- The review page renders all nine props with no console errors, both orientations, at every zoom.
- `tools/drawn-size.mjs` now reads the group catalogs, which it could not before. Its own test
  refused the moment the first group prop existed.

## Reproducing the art

```
node tools/bake-scenery.mjs --group=lighting --shadow --out=<scratch>
```

then copy the seven PNGs into `dist/assets/environment/lighting/` and run
`python tools/catalog-environment.py`. That script rewrites every group's `prop-art-*.js`. On
Windows the rewrite changes only line endings in the others, so restore them rather than
committing them. Provenance is in `art/lighting-prompts.md`.
