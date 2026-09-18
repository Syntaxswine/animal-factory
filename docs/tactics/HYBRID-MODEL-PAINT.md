# Painting on the horse model

A subsequent [10,300-triangle comparison](HYBRID-HORSE-10K.md) uses this same painted skin and keeps the original mesh selectable.

The user approved the sculpt but requested painting the skin while it is on the model. This pass renders the unchanged lightweight mesh, paints directly over those views, and projects the resulting artwork onto its skinned surfaces. It replaces the generic atlas/procedural marks in the default comparison. It does not change the approved shape, 28,886 triangles, skeleton, carry pose or prototype dimensions.

Open `/tactics/horse-light.html`. **Painted skin** is on by default. Disable it to compare the prior finish; **Previous graphic finish** then switches between the two earlier materials. Grey still shows the unchanged mesh. Turn, neutral/carry, and native/close controls work with every material.

## Authoring

`tools/horse-paint-reference.mjs` renders four neutral orthographic views into `hybrid-review/model-paint/neutral-paint-reference.png`: front (+X), side (+Z), back (-X), side (-Z). Each panel spans 0.925 by 1.85 world units, centered at Y=0.825. This is a painting reference camera; gameplay retains its existing isometric camera and 58 CSS pixels/world unit.

The built-in image tool, through the imagegen skill, painted that exact sheet with the original `dist/assets/characters/armed/horse-rifle.png` as the style reference. The saved prompt is `HYBRID-MODEL-PAINT-PROMPT.txt`. Output `exec-9bea939a-2efc-489e-95c6-1136e916f53d.png` is copied into the project as `dist/assets/characters/lowpoly-proof/horse-worker-model-paint-v1.png`. The generated sheet is 1774×887, preserving the requested 2:1 layout; mapping uses normalized panel coordinates. Paint detail includes illustrated eyelids/cheeks, mane locks, cream cotton creases, olive seams/folds, scarf, gloves and exposed hooves.

The mesh clips the paint to the approved silhouette. Generated outlines are not new geometry. Minor contour differences in a paintover cannot establish new anatomy or garment shapes.

## Surface attachment and coverage

`horse-model-paint.js` samples the artwork using neutral/bind-space positions and normals. Moving the skeleton or turning the character does not move the paint across the surface. The projection camera does not depend on the viewer camera. Four GPU depth/part-ID reference passes reject samples occluded by other body surfaces. The frontal image owns the central blaze; the side images own the cheeks, preventing two painted blaze edges from becoming separate stripes.

An explicit validity mask removes neutral background connected to the image border and erodes its boundary by two pixels. Enclosed grey paint remains valid. This is a mask for the specific controlled-background authoring sheet, not a general segmentation system.

Four views leave some surfaces unseen. Those areas reuse front/back paint from the same part, with a shirt-only exception for the sleeve underlap. This is deliberate fill, not visibility-verified source coverage. Any remaining gaps use a material-colored fallback. **Paint coverage** distinguishes direct projection (green), reused paint (blue), and flat fallback (magenta). The close-view captures measure approximately 1.36–3.0% flat fallback among classified visible character pixels, depending on pose/heading. These are screen-space measurements, not percentages of total mesh area; soles and other hidden surfaces are not validated by them.

The paint uses an unlit material because the authored image already contains illustrated form values. Previous shader marks and scene lighting are not stacked over it. Dynamic lighting response, baking into a conventional UV atlas, runtime cost across many units and production animation remain future work. This is a mapped-skin presentation experiment.

## Checks and review

- Five Node tests pass: existing mesh/rig/contact checks, projection agreement with actual reference cameras, and background-mask behavior including enclosed grey detail.
- Browser review captures neutral and carry at eight headings, native and close scale, plus coverage and the previous material. No browser, shader or resource errors.
- The GPU visibility regression accepts an actual head surface, rejects a point 0.08 units behind it even with the same part ID, and rejects a mismatched part ID.
- Pages build includes the projection module and PNG asset.

Evidence is in `hybrid-review/model-paint/`, including `checks.json`. First hostile review scored 8/10, requiring a single blaze, filled visible gaps and explicit background validity. After those corrections, independent hostile review scored **9/10 for the bounded mapped-skin prototype**, confirming the resolved blaze, improved garment/hoof gaps, gameplay-size readability and all five tests passing independently. Small flat-fill areas, minor projection seams and reused paint on unseen surfaces remain; this is not proof of complete coverage or unrestricted animation readiness. This does not authorize merging the graphics branch into canonical.
