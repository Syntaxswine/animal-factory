# Visual revision checkpoint

Review scene: `tactics/hybrid-viewer.html?visual=room&props=sample`.
Prototype dimensions, 2:1 camera, collision descriptors and simulation are preserved.
The new presentation is confined to the viewer; the game/editor keep their previous
opt-in renderer.

Room and four-prop sample: **4/5 hostile review each**. Repeating painted brick,
wood and metal use fixed world-space density. Concrete caps/reveals and dark roof
edges separate surfaces. Internal slab sides are omitted to remove dotted floor
seams without changing collision. Shadows ground the scene. Sample props are a
cylindrical barrel, existing painted tree, wood crate and padded medical table.

Rigid sprite assessment: **4/5 evidence, 3/5 production readiness**. Uniform scale
and reflection preserve original anatomy. Actual muzzle displacement remains
**0.208–0.633 tiles**, failing the existing 0.05-tile limit. Existing numerical
tests still test the calibrated path, not this rigid preview. Two mirrored images
cannot represent eight headings. Directional armed poses with ground/weapon
anchors are needed, or an explicitly approved interim facing constraint. Do not
restore conspicuous deformation to conceal the mismatch.

The coordinator's 17 September review approves the material and prop direction
for continued development. Production sprite approval remains outstanding. Its
next handoff requires a directional solution proof before carrying the approved
environment treatment into the opt-in map/editor. See
[directional requirements](HYBRID-DIRECTIONAL-REQUIREMENTS.md). No default cutover
is approved by the environment decision.
Earlier numeric stage-3 success is not visual approval. Performance-budget
agreement remains outstanding; water animation remains a tracked regression.

## Evidence and compromises

- [Selected textures repeated 3×3](hybrid-review/visual-selected-texture-repeats.png):
  visually tileable at gameplay scale, not guaranteed pixel-perfect periodicity.
  Revised wood removes the first attempt's broad horizontal seam. Repeated knots
  and small boundary changes remain discernible close up.
- `visual-room-before/after-{normal,close,wide,heights,bounds}.png`: matching
  1440×1000 viewport/camera/zoom. Before is the prior migration, not the original
  prototype. Intensity is retained; sun direction/filtering/contact shadows change.
- [Prop sample](hybrid-review/visual-props-after.png) and
  [collision overlay](hybrid-review/visual-props-after-bounds.png).
- [Original/rendered poses](hybrid-review/visual-rigid-comparison.png),
  [separate overlays](hybrid-review/visual-rigid-overlays.png),
  [actual muzzle errors](hybrid-review/visual-rigid-muzzle-errors.json).

The barrel keeps its conservative box proxy (approximately 0.135-tile corner
excess). The tree uses a painted billboard and contact blob, with unchanged
conservative trunk/canopy collision. Medical decorations stay inside shared bounds.
This is a bounded sample, not completed catalog or directional sprite coverage.

## Reproduction

Run `npm run check` and `npm run build:tactics-pages`. Browser scripts are
`tools/hybrid-room-review.mjs`, `tools/hybrid-rigid-review.mjs` and
`tools/hybrid-texture-review.mjs`, using port 4389 and Playwright (optionally set
`PLAYWRIGHT_PATH`). Room checks assert matching geometry IDs/query results, 2:1
projection and no resource/browser errors. Pose checks record the mismatch instead
of weakening the tolerance. New unit checks cover material scale, internal slab
face removal and rigid pose distances/anchors.

The short local room sample records median frame interval 16.7 ms before/after,
p95 16.7/16.8 ms (`visual-room-checks.json`). This includes browser scheduling;
45 frames do not establish a full-map budget. Independent hostile review found
stable 201 geometries/10 textures through 20 prop-scene rebuilds.

## Generated asset provenance

Built-in image generation mode was used, not the CLI/API fallback. Selected PNGs
are saved in `dist/assets/environment/hybrid-surfaces/`. Concrete, grass and tree
art reuse repository assets; no character art was generated. Prompt specifications:

- `brick-factory-v1.png`: flat orthographic aged russet/umber factory brick,
  four brick widths and ten running-bond courses, thin warm-grey straight mortar,
  restrained chips/lime stains, diffuse lighting, no perspective/trim/text,
  requested seamless wrap on both axes.
- `wood-factory-v2.png`: edit of generated six-plank aged brown oak with grain
  and knots. Preserve palette and plank count; continue grain/lightness across
  top/bottom; normal narrow left/right joint; remove nail rows and brightness
  bands which emphasized repetition; no perspective, border or labels.
- `metal-factory-v1.png`: flat orthographic corrugated galvanized factory roof,
  requested twelve vertical ribs, slate/sage-grey zinc, worn ridges and restrained
  oxidation/scratches, even diffuse lighting, no perspective/bolts/frame/text,
  requested seamless wrap on both axes.

These are requested visual properties, not guarantees about generated pixels.
The first wood output is superseded and excluded from runtime assets. Final
selection was inspected as 3×3 repeats and in the room.
