# Directional artwork experiment — not a passing solution

The formula in `HYBRID-DIRECTIONAL-REQUIREMENTS.md` is corrected to
`2r * sin(PI / (2N))`; a regression checks the exact midpoint displacement.
The quoted earlier numeric estimates were correct.

There is now a working **candidate diagnostic**, at
`tactics/hybrid-directional.html`, rather than only an authoring guide. It is
separate from the game, editor and approved environment viewer. The directional
production gate remains closed. No simulation headings, muzzle origins, collision
descriptions, prototype dimensions or tolerance changed.

## Experiments and results

First experiment: horse, normal uniform, rifle, standing/kneeling/prone, 17
requested angles per stance across 22.5°–67.5°. This crosses the difficult end-on
45° view. Requested spacing is 2.8125°; the resulting pictures do **not** reliably
follow that spacing. They drift in scale, ground registration and facing.
The requested fixed guide transform is retained so those failures remain visible.
Explicit source crops remove adjacent-row fragments without moving pixels.
No vertex deformation, automatic muzzle fitting or simulation snapping is used.

Each stance is evaluated at 998 center, boundary, intermediate and sweep samples.
The maximum measured displacements are approximately 0.456 standing, 0.792
kneeling and 0.664 prone, against the unchanged 0.05-tile requirement. Tip readings
are manual, with estimated ±3 source pixels per axis; error intervals include
the corresponding radial uncertainty. A nominal 0.033 result is therefore
uncertain, not a pass. Boundary probes preserve exact requested angles and check
both angle and chosen frame; the slider does not round them to hundredths.

Hostile review: **diagnostic 4/5; atlas artwork 2/5, rejected**. This distinction
does not permit advancement to the next migration section.

Second experiment: one individually generated standing 45° frame, followed by
three targeted rifle/hand edits. The fixed scale/ground anchor remain unchanged.
Measured endpoint error improved from 0.1173 to 0.0207 tiles, with an estimated
final interval of 0.0138–0.0276. That can fit the standing 0.05 requirement with
angular-sampling margin. The suggested 0.02 authoring target was conservative,
not a new user requirement and not by itself a reason to reject the frame.

Single-frame feasibility review: **3/5, not accepted**. Adjacent-frame consistency
has not been demonstrated; ground/body registration needs approval; the painted
barrel axis remains diagonal where the physical 45° axis projects vertically;
and repeated edits changed cloth/skin toward a shinier mottled finish. Endpoint
improvement alone does not validate a repeatable directional-art method. Other
individual stances and neighbors were not commissioned after this review.

## Evidence and next work

- [Candidate native scale](hybrid-review/directional-proof/candidate-native-clean.png)
  and [body/muzzle overlays](hybrid-review/directional-proof/candidate-close-overlays.png).
- [Single-frame comparison](hybrid-review/directional-proof/standing-45-comparison.png)
  and [body overlays](hybrid-review/directional-proof/standing-45-body-overlays.png).
- `atlas-landmarks-*.png` makes the manual readings independently inspectable.
- `candidate-measurements.json` contains the complete sampled results, including
  uncertainty; `standing-45-measurements.json` records the individual experiment.

The small proof is **unfinished**, not production approved. Further work must
establish repeatable authored ground/body/weapon registration and neighboring
views, starting with the single frame. A deterministic offline rig-to-sprite
workflow is another possible authoring method, but has not been implemented or
approved here. Do not generate a large atlas/catalog until that method works.
Full-map/editor propagation, water animation and representative full-map timing
remain later gates. The approved environment direction is preserved.

## Checks and reproduction

369 repository tests and asset checks pass; the Pages distribution builds with
89 app files. Browser diagnostic checks pass without page/resource errors.
These validate the diagnostic implementation, not rejected artwork acceptance.
Four new regression tests cover the corrected bound, frame boundaries, fixed
uniform scaling/anchors, landmark uncertainty and crop inclusion.

Run `tools/hybrid-sector-guide.mjs`, `tools/hybrid-directional-review.mjs` and
`tools/hybrid-single-frame-review.mjs` with Node and Playwright available via
`PLAYWRIGHT_PATH`. Browser review uses the local server on port 4389. The runtime
does not import these experimental assets through `unitArt` or the game renderer.

## Asset provenance and prompt set

Built-in image generation mode, not CLI/API fallback. All selected experimental
outputs are saved in the workspace:

- `dist/assets/characters/directional-proof/horse-rifle-{standing,kneeling,prone}-candidate.png`
  (1402×1122 RGBA). Standing is the corrected second attempt. These are rejected
  candidate atlases retained for reproducible review, not approved game assets.
- `docs/tactics/hybrid-review/directional-proof/standing-45-first.png` and
  `standing-45-corrected.png` (1254×1254 RGBA).

References were the repository's original normal-uniform horse rifle images and
geometry-derived guide PNGs. Prompt set, preserving the operative constraints:

1. Atlas: paint the exact five-column/four-row guide, first 17 cells occupied and
   last three transparent; chestnut horse, cream rolled sleeves, olive overalls,
   red neckerchief, gloves/boots and wood-stock rifle. Request 2560×2048 with
   512-square cells, fixed 30° elevated orthographic camera, 17 near-frontal views
   from 22.5° through 67.5° in 2.8125° increments. Ground origin (256,420), exact
   guide muzzle points, natural anatomy, straight rifle, no marks/grid/shadows,
   true transparent alpha. Use the matching original stance image as style and
   identity reference. Kneeling/prone prompts explicitly describe the stance,
   scale and foreshortening. Outputs did not meet this registration contract.
2. Standing atlas correction: preserve art, reduce size to about 70% cell height,
   keep ground at 50% width/82.03125% height; all rifles predominantly toward
   viewer, center frame 8 at muzzle (256,230); remove excessive side-on poses.
3. Individual standing: one square transparent frame, same identity/style and
   fixed elevated camera, ground (256,420), top near (256,60), muzzle (256,230)
   in a 512-coordinate guide. Natural hand/shoulder articulation and straight
   foreshortened rifle, no recentering or resizing, preserve margins.
4. Three localized edits on the 1254-square output: move muzzle from roughly
   (603,495) to (627,563); correct overshoot at (668,576) toward (627,563);
   then extend the barrel 15 pixels from (626,548) toward (627,563).
   Preserve body/feet/scale/canvas, articulate hands naturally, no body warp,
   true transparency. The final measured opening is about (628,576).

Requested coordinates are not claims about achieved pixels. Intermediate
discarded generations remain outside the project and are not runtime dependencies.
