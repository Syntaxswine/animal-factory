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

| kind | tiles | drawn at zoom 1 | cover | downscale |
| --- | --- | --- | --- | --- |
| `floor-lamp` | 1 × 1 | 26 × 74 | — | 15.4 : 1 |
| `bedside-table-lamp` | 1 × 1 | 35 × 62 | 25 | 17.8 : 1 |
| `streetlight` | 1 × 1 | 32 × 110 | — | 10.2 : 1 |
| `streetlight-double` | 2 × 1 | 55 × 124 | — | 9.0 : 1 |
| `standing-torch` | 1 × 1 | 21 × 66 | — | 16.1 : 1 |
| `campfire` | 1 × 1 | 35 × 34 | — | 23.4 : 1 |
| `cooking-fire` | 2 × 2 | 74 × 98 | — | 10.0 : 1 |

The drawn box is the model at true world scale. It is extended down to the renderer's anchor
and made symmetric about the footprint centre by two invisible registration marks (below), so
it is a little wider and taller than the visible model. A standing animal is 59 px tall. A
floor lamp stands a head taller than a cow, and a streetlight nearly twice it.

The rules are the 3D branch's own, not a guess. Its `core/environment.js` does
`Object.assign(PROPS, LIGHT_PROPS)`, and `light-sources.js` builds each as
`{w, h, solid: !wall, cover: kind === 'bedside-table-lamp' ? 25 : 0}`. So every fixture blocks
its tile, only the bedside table is cover, and none is `tall`, which here is what blocks sight.
A map authored on either branch loads on the other, and the `lightMode` the 3D editor writes
onto a placed fixture survives a load here for parcel I to read.

## These are relit bakes, not paintings — a stated deviation

The plan says a render is an underlay and never the deliverable, and every painting in the
catalogue came out of Codex's built-in image generator (`art/environment-sources.json`). This
session has no image generator. B therefore ships bakes. **That is this parcel's deviation from
the plan, not a change to the plan's rule**; whether other parcels may do the same is
**open question 9** for the architect. The sprites can be painted over later without touching
their registration or their catalog rows.

What made the deviation defensible is a measurement. The plan's objection is that the 3D branch
shades at runtime while a sprite carries its own light, so the light was measured, at the size
the game draws the things, on the two subjects both lines have:

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
from the upper left. `--light=catalogue` puts one key light at (−1, 2, 3) with a hemisphere fill.
The crate then matches the painting on every measure. The barrel stays darker because the 3D
skins run darker than the painted palette, which is albedo, not light.

**The rig was fitted on one crate and checked on one barrel, and it missed the iron.** The 3D
iron is one fixed colour, `0x343b37`, in every finish, and it baked the streetlights near-black
(median luma 39, against 70 for `jail-bars`, the painted catalogue's iron). The rig now
re-tints the iron for the bake only, to `0x8c887e`: luma p10/p50/p90 32/65/103 against
`jail-bars`' 28/70/129. The tint whose *mean* colour matched `jail-bars` best, `0xbca480`,
read as tan wood at game size next to a torch that really is wood, so the final pick was made by
eye at drawn size after the numbers had narrowed it to four.

![Workshop light, top; the catalogue rig, bottom; 4x at drawn size beside a cow and the painted crate and barrel](lighting-relight.png)

Two traps the calibration turned up, both handled in the tool:

- **ACES tone mapping overshot the light direction on every rig tried**, to 2.5 to 9 where the
  paintings are about 2, so the rig renders without it.
- **With tone mapping off, three.js ignores `toneMappingExposure`.** The first sweep had an
  exposure knob that did nothing at every value. Brightness is a `gain` on both lights.

`--light=page` is still the baker's default; the catalogue rig is opt-in.

## Registration: two invisible marks

`environment-renderer.js` plants a crop's bottom centre `(w + h) * 5` px below the footprint
centre, and no prop field can move that point (SCENERY-BAKE.md, "The registration contract").
The rule assumes a subject that fills most of its footprint. A lamp on a round base doesn't, so
its bottom is above the anchor, and every one of these would have been drawn low:

| | residual before | after |
| --- | --- | --- |
| `streetlight-double` | −10.6 px | 0.0 |
| `standing-torch` | −6.1, 1.2 off-centre | 0.0 |
| `streetlight` | −5.6, 3.6 off-centre | 0.0 |
| `floor-lamp` | −4.5 | 0.0 |
| `bedside-table-lamp` | −2.5 | 0.0 |
| `campfire` | −2.3 | 0.0 |
| `cooking-fire` | −1.5, 4.6 off-centre | 0.0 |

`bake-scenery.mjs --register` puts two pixels on the anchor row, one either side of the
footprint centre at the same distance, just clear of the model. The renderer's alpha ≥ 64 crop
then ends exactly on the anchor and is centred exactly on the footprint. They are drawn at alpha
64, the crop threshold itself. At zoom 1 one such pixel, averaged into a 9–23 : 1 downscale, is under
0.3% of one screen pixel's coverage. At the most generous view the game allows (zoom 2.3 on a 2×
display, 4.6×) the tallest fixture downsamples about 2 : 1 and a mark is about 6% of one pixel, a
near-black fleck too faint to see. The
picture is exactly the model, as in the painted catalogue, with no cast shadow.

An earlier version of this parcel registered the sprites with a visible ground-contact ellipse
instead. The review rejected it. Its size was a choice presented as a constraint, it was larger
than a unit's own shadow, it read as a dark mat under the cooking fire, the painted neighbours
have no such thing, and the plan says no cast shadow. The marks do the registration and nothing
else.

They are a stopgap that works with today's renderer. **The bedrock fix is a registration field
on the prop record**, which the wall fixtures need anyway (open question 5). With one, the marks
go away.

`tests/tactics-lighting.test.mjs` checks the registration against numbers recorded at bake time,
not against the tool that made the PNGs. `manifest-lighting.json` carries each sprite's
`footCentre` (where the footprint centre fell, in that PNG's pixels) and `gameScale`. The test
asserts that the crop ends `(w + h) * 5` below that point and is centred on it to within 0.1 game
px, and that the crop's bottom row is exactly the two marks. Then, independently of the bake's
bookkeeping, it checks the round-based fixtures: the floor lamp and both streetlights stand on
their centre, so the centroid of the lowest band of solid pixels must be the recorded footprint
centre. All three sit within 0.01 game px of it.

## Rotation is a mirror here and a quarter turn there

A rotated prop in this game swaps its footprint and is drawn with `scale(-1, 1)`: a transpose,
`(x, y) → (y, x)`. The 3D branch rotates a quarter turn, `(x, y) → (−y, x)`. For a rectangle the
two occupy the same cells, so collision, cover and map interchange agree, and for these seven,
whose pictures are symmetric or nearly so, the drawing agrees too. They disagree about anything
asymmetric *within* the tile:

- **A wall fixture.** The 3D branch mounts a rotated one on the tile's east edge
  (`fixturePlacement`, `x + .48`). Mirroring the north-mounted sprite puts it on the **west**
  edge. Porting `fixturePlacement` as-is would hang a rotated wall torch on the opposite wall.
- **The bedside lamp's drawer and bulb.** Its emitter is 0.045 tile off centre. Parcel I must map
  emitters through the mirror, not through the 3D branch's `placedEmitters`, or the light comes
  from the wrong side of the table on a rotated one.
- **Light direction.** A mirrored sprite is lit from the upper right. The whole painted catalogue
  has the same property, so it matches its neighbours.

## What this parcel does not do

- **The wall torch and the gooseneck sconce.** Open question 5. They bake 36 and 52 px from
  where the renderer would plant them, and marks can't help, because their footprint centre is
  off the bottom of the canvas and nowhere near the subject. Until they land, **a 3D map
  carrying either is refused here** with `Invalid environment props.`, the same kind of live
  incompatibility parcel A fixed for mature trees. Both are listed in `DEFERRED` in
  `environment-props-lighting.js`. A test fails if the baker's `lighting` group ever holds a
  form that is neither shipped nor deferred, and another pins the refusal.
- **Flickering flames.** The three fires hold still. Their flames are the 3D branch's
  low-poly tongues drawn unlit: flat orange with paler facets, and no core or outline, which
  `flame-effect.js`'s rule would give them. They pass at 1.15 and look papery at 2 to 3. The
  fix is the tree's own fire idiom: `ground-fire.js` draws flame clumps as separate
  depth-sorted objects, and S2's `propPieceDepth` has the depth rule for that. But nothing in
  `app.js` pushes prop pieces into the sort, and `app.js` is not this parcel's. When it does,
  re-bake the three fires with their flame meshes hidden and draw clumps from `ground-fire.js`,
  honouring reduced motion. This parcel therefore did not touch `flame-effect.js`, which it owns.
- **Light.** Nothing emits. Parcel I reads `lightMode`, which survives load and export.
- **Scale.** These are at the 3D line's world scale, about 9% taller relative to the sprite
  sheet's animals (open question 8). The whole-pixel box moves the drawn scale by at most half a
  pixel on the side that binds: `streetlight-double`'s width rounds 55.49 down to 55 and draws
  0.9% small. The test bounds exactly that.

## Files this parcel touched

The Stage 1 Owns row for `lighting`: `dist/assets/environment/lighting/*`,
`environment-props-lighting.js`, `prop-art-lighting.js`, `manifest-lighting.json`,
`lighting-art.html`, `art/lighting-prompts.md`, `tests/tactics-lighting.test.mjs`, and this
document with its two figures.

Outside it, all of it under the plan's tools carve-out or recording what the parcel found:

- `tools/bake-scenery.mjs`: `--light`, the rig table and its iron tint, `--register` and the
  marks. `tests/tactics-bake-scenery.test.mjs`: their tests. `SCENERY-BAKE.md`: their
  documentation.
- `tools/drawn-size.mjs`: it read `PROP_ART` only and could not see a single group prop, and its
  main guard crashed when imported from `node -e`.
- `SCENERY-PORT-HANDOFF.md`: the claim, the status row, B's delivered record, a finding under
  open question 5, the new open question 9, and a note on the new-props sweep.
- `MAKING-SCENERY.md`: the new-props sweep does not see group props, which that document had told
  parcels to rely on.
- `SCENERY-PORT-FIELD-NOTES.md`: traps from this parcel, each marked *(parcel B)*.

Not touched, though found: `tests/tactics-new-props.test.mjs` reads `PROP_ART` only and so
sweeps no Stage 1 prop. It is a shared file. B tests its own placement round trip, and the plan
asks the integrator to widen it.

## Verification

- `npm run check` passes; the count is in the PR, with the tests on the baker's rig, marks and
  refusals and on the parcel.
- Mutation rounds on the parcel and the tool, all caught: shadow or mark geometry, compositing
  order, canvas checks, the rig table and tint, every catalog field that matters, the crop
  table, and `drawn-size`'s view of group art. The mutation list is in the commit messages.
- The review page renders all nine props with no console errors at zoom 0.6, 1, 1.15, 2 and 3,
  in both orientations.
- One independent hostile review, as the plan requires. The first round scored **7/10** and
  every must-fix is addressed above: the visible shadow replaced by marks, policy returned to the
  architect as open question 9 with `--light=page` restored as the default, the iron re-tinted,
  registration tested against recorded numbers and independent geometry, the rotation advice for
  open question 5 corrected, and this file list written down. The second round's score is in
  the PR.

## Reproducing the art

```
git worktree add --detach ../af-3dref 8e7140f        # or any later commit with the same painted-furniture.js lighting forms
cd ../af-3dref && PORT=4319 node tools/serve.mjs
node tools/bake-scenery.mjs --group=lighting --light=catalogue --register --out=<scratch>
```

then copy the seven PNGs into `dist/assets/environment/lighting/`, record each row's
`footCentre` and `gameScale` in `manifest-lighting.json`, and run
`python tools/catalog-environment.py`. That script rewrites every group's `prop-art-*.js`. On
Windows the rewrite changes only line endings in the others, so restore them rather than
committing them. Provenance is in `art/lighting-prompts.md`.
