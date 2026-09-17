# Textured 3D horse versus sprite: architect comparison

The user requested a bounded comparison and prefers simple geometry with a richer painted skin, in the spirit of late-1990s games. Their follow-up requested more polygons. The revised horse now has **5,316 triangles / 57 mesh parts**, up from the initial 1,892 / 47, with fuller neck and muzzle, more skull contour rings, rounded shoulder caps, curled glove fingers, and a shorter shaped rifle stock.

Preview: http://127.0.0.1:4389/tactics/hybrid-model-comparison.html

This is one horse, one worker outfit, one rifle, standing/kneeling/prone. The original sprites remain available beside the model and in a matched single-character view. It is a separate comparison page; canonical gameplay and the graphics merge remain pending.

## What to compare

Use native scale first, then Close, continuous heading sweep, and Wireframe. Both single-character modes use the same world location, camera, scale, and room. Side-by-side roots share a projected ground baseline. The original standing sprite carries its rifle in an idle pose; the model holds a level readied rifle, so these are not identical firing-pose references. A painted billboard and a lit model also respond differently to lighting and viewpoint.

- [Five headings across all three stances](hybrid-review/model-comparison/heading-sheet.png): native captures enlarged 2× without smoothing.
- [Standing, native](hybrid-review/model-comparison/standing-both-native.png) and [close](hybrid-review/model-comparison/standing-both-close.png).
- [Kneeling, close](hybrid-review/model-comparison/kneeling-both-close.png) and [prone, close](hybrid-review/model-comparison/prone-both-close.png).
- [Actual mesh wireframe](hybrid-review/model-comparison/standing-wireframe.png) and [physical overlays](hybrid-review/model-comparison/standing-overlays.png).
- [Recorded browser measurements](hybrid-review/model-comparison/checks.json).

## Mechanical result and cost

The model turns continuously without requiring directional raster frames. Tests measure actual barrel-cap vertices and barrel axis against the physical muzzle, not a marker copied to that location. The browser proof sweeps 1,440 headings per stance; maximum tip error is approximately 7.16e-9 tile. Fixed arm and leg segment lengths, glove contact volumes, floor contact, and approved maximum heights pass. Heights remain 1.65 standing, 1.155 kneeling, and .462 prone; room dimensions remain the approved prototype dimensions.

A 3D character shifts work from repeated directional frame authoring into modeling, UVs, rigging, and animation. This proof supports the continuous-horizontal-aim advantage. It does not establish a production effort estimate or prove that final art will be cheaper. Species, equipment, and pose variations still require deliberate authoring, but do not intrinsically need a fresh image for each facing direction.

The revised model uses one painted 1,254×1,254 diffuse atlas plus small solid-color eye/bore materials. It is a procedural rigid-joint pose rig, **not** a production skinned mesh or animation pipeline. Fifty-seven separate parts add approximately 56 draw calls in this scene (model 217 versus sprite 161). Both modes measured around 16.7 ms median and 16.7–16.8 ms p95 on this machine. This is a tiny room feasibility check, not a many-unit performance guarantee. Both alternatives remain loaded, so resource counts do not establish comparative memory savings. Geometry/texture counts remain stable through 90 heading updates.

Validation: full suite 371 tests and asset checks passed for the initial comparison; both focused model tests and the complete browser proof passed again after the extra geometry. Pages packaging succeeds with 92 app files. Orbit leaves world-space barrel geometry unchanged. Browser proof reports no page errors.

## Remaining art and integration work

The hostile reviewer independently passed both focused tests and reviewed the revised heading sheet: **comparison readiness 4/5; production art 3/5**. The added geometry improves muzzle, cheeks, sleeves, and limbs; the shortened stock removes the conspicuous rear protrusion. Remaining issues are the long neck/narrow torso, spherical shoulder caps, rifle held across the collar, and softer/muddier clothing texture than the original sprite. Passing this comparison is not production graphics approval.

The fuller geometry improves silhouette, but the model still needs art direction: face/neck proportions, clothing brightness, and the rifle-to-shoulder relationship need judgment against the original character. Shortening the stock reduces its rearward protrusion; hand contact tests do not prove a convincing firing stance. Overall floor contact does not prove every anatomical support point: the kneeling rear knee remains approximately .009 tile above the floor. Coarse gameplay body proxies are preserved and are not a perfect mesh envelope.

Only horizontal aiming and three static poses are demonstrated. Vertical aiming, recoil, locomotion, reload, stance transitions, additional equipment/species, exportable animation assets, mesh batching, and multi-unit performance remain unproven. No large sprite catalog or model catalog should be produced from this proof alone.

**Decision requested from the architect:** Does this textured 3D direction justify a further character/rig refinement pass, given the user's preference? If yes, specify silhouette and firing-pose corrections and a production rig/performance gate before integration. The mechanical result supports that next experiment; it does not authorize the graphics merge.

## Texture provenance and authoring prompt

Asset: [horse-worker-atlas-v1.png](../../dist/assets/characters/lowpoly-proof/horse-worker-atlas-v1.png). Generated with the builtin image generation tool, then mapped onto authored geometry. No generated directional sprites are used by the model.

Prompt set: one flat, opaque, hand-painted diffuse atlas for a chestnut horse worker with cream shirt, olive work overalls, red neckerchief, dark leather gloves/boots and a wood-stock rifle. Exactly four rows and four columns with no borders, labels, text, perspective, or character illustration. Panels, left to right:

1. Chestnut short fur; warm muzzle hide without facial features; worn cream linen; faded olive canvas.
2. Overall bib with sewn pocket and brass buttons; overall back with suspenders; dark mane strands; worn dark leather.
3. Walnut rifle wood; blued gunmetal; dark red cotton; warm inner-ear suede.
4. Chestnut forehead with narrow cream blaze; plain fur; boot sole; cream rolled cuff.

Request rich painted surface detail and restrained shading on simple geometry, an earthy 1998–2000 game palette, no photographic noise or glossy PBR appearance, no directional cast shadows or vignette, and exact quarter-grid panel alignment. Requested 1,024 square; returned 1,254 square. UV insets limit atlas-panel bleeding; the texture is not a directional character sheet.
