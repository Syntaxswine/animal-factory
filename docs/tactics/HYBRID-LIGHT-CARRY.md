# Lightweight horse: first skinned carry test

The grey forms at `ec5d468` are the approved working reference. This experiment advances that character only; it does not merge the graphics branch or integrate a gameplay replacement.

The current default skin is the subsequent [model-painted skin experiment](HYBRID-MODEL-PAINT.md). Disable **Painted skin** to inspect the earlier finishes documented below.

Open `/tactics/horse-light.html`. The initial view compares the original rifle sprite with one textured carry pose at the existing prototype camera and 58 CSS pixels per world unit. Close view, neutral grey, wireframe, turning and rifle-only inspection are available. The sprite remains the fixed illustration while the model turns; carry is not a firing pose.

## Graphic paint direction

The follow-up art direction is bright, high-contrast painted detail like the original illustration. **Graphic paint** is enabled by default; disable it to compare the softer finish delivered at `72b110a`. This material pass preserves the mesh, skin weights, carry pose and prototype dimensions.

`horse-graphic-paint.js` places broad chestnut cheek/jaw values, ivory shirt highlights, olive fold shadows, a crisp bib-pocket rim, and red neckerchief knot/tails in bind space so they follow the skinned surfaces. Short tapered cuff and knee strokes describe local folds rather than repeated bands. The existing atlas supplies restrained grain underneath these larger graphic shapes; the new detail is shader paint, not a replacement atlas or added polygons.

Evidence includes graphic native/close views at four headings and `soft-baseline-native.png` / `soft-baseline-close.png` in `hybrid-review/light-carry/`. The first hostile review scored this pass 8/10 and flagged stripe-like folds and a disconnected scarf symbol. Those marks were localized and tapered, and the scarf was raised and broadened to meet the neck band. Independent review of the revision scored **9/10 for the material-only pass**, confirming localized folds, a connected scarf and clearer color separation at gameplay size. All three existing model tests, the browser/shader checks and the Pages build passed. Broader animation and production readiness remain unproven.

## Mesh and rig

- Approved reference: 856,076 triangles, retained unchanged in the grey viewer.
- Reduced character: 28,886 triangles across eight connected surfaces, about 96.6% fewer triangles.
- Rifle: separate 480-triangle asset with named stock, grip, support and muzzle anchors.
- Skeleton: 17 hierarchical bones; eight real `SkinnedMesh` surfaces with normalized blended skin weights. Shoulder/elbow/wrist, finger and leg/hoof influences are present.
- Neutral height after reduction: 1.65 world units within floating-point precision. Feet remain at zero.

`tools/build-horse-light.mjs` runs the approved sculpt offline, reduces its indexed surfaces with pinned MIT-licensed [meshoptimizer v0.25](https://github.com/zeux/meshoptimizer/tree/v0.25/js), removes coincident collapsed face pairs and compacts the vertices. The simplifier uses a 0.006-world-unit error setting for garments, 0.002 for hands, 0.0025 for the head and 0.0008 for hooves. Regularization applies to deforming cloth/limbs; rigid regions retain more fine geometry. The deliberate experiment budget is 30,000 triangles. This is an algorithmic error estimate, not a measured maximum surface-distance guarantee. The browser loads the resulting mesh data and never rebuilds the reference sculpt.

This is a skinned triangle reduction for a deformation experiment, not artist-authored quad retopology. The current carry demonstrates weighted arm deformation and hand contact. Walk, kneel, firing, transitions, extreme deformation, mesh LODs and multi-character performance remain to be validated before a gameplay-ready claim.

## Texture and rifle

The new `horse-worker-light-atlas.png` derives from the earlier painted atlas, with reduced fabric/fur contrast and the same 4×4 layout. Rest-space shader masks place the blaze, eyes, neck band and glove/cuff boundaries without triangle-shaped color breaks. A restrained base palette reduces the atlas grain contrast. UV regions place cotton on shirt/sleeves, olive cloth and pocket detail on overalls, chestnut coat on the head/forearms, dark gloves/hooves, mane and forehead blaze. A red cloth band at the neck is texture-only. This is one uniform and one horse, with no expansion of the catalog.

Image generation used the imagegen skill and the built-in image tool, with `horse-worker-atlas-v1.png` as the reference. The generated source is `exec-269d0432-dc43-40f7-bf7b-5fe9b4cd7bf6.png`; a project copy is tracked. The prompt specified a strict 4×4 atlas matching the previous panel order, chestnut short coat, cream cotton, faded olive overalls, dark gloves/hooves, walnut rifle wood, a thin blaze, and restrained painted grain and highlights.

`horse-rifle.js` is independent of character construction. Two-bone arm solving places the hands against its grip/support anchors. The muzzle anchor is checked against an actual barrel cap vertex; it is not treated as proof of firing/gameplay integration.

## Validation and evidence

`node --test tests/horse-light.test.mjs` checks reduced connectivity/manifold edges, triangle budget, valid skinning, neutral bind-pose identity, grounded feet, actual arm deformation, actual hand-geometry proximity to the grips, and the barrel endpoint. The hand-surface proximity limit is 0.015 world units (less than one pixel at native scale); surface distances are independently checked against that limit.

`node tools/horse-light-review.mjs` captures native and close carry views at four headings, neutral grey, topology and the independent rifle under `hybrid-review/light-carry/`. It verifies the actual orthographic scale and contact anchors and records browser/network errors.

The first hostile review scored 7/10: it required more local geometry at eyelids, fingertips and hoof rims, continuous texture boundaries, and less woodgrain-like fur. The revised 28,886-triangle mesh spends the extra geometry on those areas, and the material uses smooth surface masks and subdued grain. Final review remains pending. The earlier unapproved high-detail experiment remains outside this delivery.

The second hostile review scored 8.5/10, requesting a continuous sleeve underlap and deliberate garment detail after texture contrast was reduced. The finishing pass uses identical shirt UVs and cloth shading across the underlap, plus a placed bib pocket seam, brass buttons and restrained sleeve/knee shading. The browser review now also captures console errors, including shader compilation failures.

Final independent hostile review: **9/10 for the bounded lightweight textured-carry proof**. The reviewer confirmed resolved cuff mismatch, restrained garment definition, readable native-size carry, preserved broad forms, and all three tests passing independently. This completes the single-pose proof; production retopology, broader deformation and gameplay integration remain unvalidated.
