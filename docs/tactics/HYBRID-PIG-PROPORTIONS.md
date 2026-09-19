# Pig proportion corrections

Addresses the architect's foreman review of `9d37b13` and director review of
`616ed74`. Both grey and painted correction gates reached **9/10** in independent
hostile review. Approval covers the bounded static proportion-and-paint pass.

## Foreman

The waist is lowered, the torso and upper trousers broadened, and the shirt
abdomen rounded. A single trouser envelope replaces the separate hip volumes;
the belt sits closer to the shirt, with trousers contained beneath it. These
changes recover a compact, heavy build at the existing standing height.

The accepted head, drooping ears, cap and boots are preserved. Arms move down
and outward with corresponding rest-joint changes. Rifle carry moves forward
0.04 world units for clearance; the separate rifle geometry is unchanged.

**29,978 author triangles → 9,988 character triangles.**

[Equal-height form comparison](hybrid-review/pig-foreman-proportions/form-comparison.html)
includes front, profile, three-quarter and gameplay views, grey and painted,
at close and native scale. The final carry comparison uses the actual author
and reduced variants, not two copies of the author mesh.

## Director

A taller, continuous trouser abdomen replaces the two separate hip bulges.
Thighs blend more broadly into that envelope, with a small rear correction
carrying the seat into the waistcoat hem. The face, ears, clothing identity,
watch chain and existing carry layout are preserved.

**29,996 author triangles → 9,998 character triangles.**

[Equal-height form comparison](hybrid-review/pig-director-proportions/form-comparison.html)
uses the same view and scale controls as the foreman comparison.

## Paint and reduction

Both retain their existing illustrated skin PNGs. Source rest coordinates and
normals are stored as `paintPosition` and `paintNormal`, allowing the registered
painting and its visibility map to follow the corrected geometry. Skin-weight
regions also use those source coordinates; the foreman's skeleton uses the
corrected joint positions. Other characters fall back to their ordinary rest
positions and normals.

The wider foreman carry exposes shirt and belt areas hidden by neutral arms
in the original painting. Local rear-shirt and leather samples remove misplaced
brass/leather details there and match the surrounding cloth values. Coverage
mode marks these as reused paint. The original paint-registration references
remain untouched; new grey turnarounds have separate filenames.

Both resolutions receive the same local proportion deformation after reduction.
`preProportionErrorWorld` records the simplifier error before that deformation;
it is not a measured error bound for the final corrected meshes. Visual review
compares the resulting surfaces at equal displayed height.

Standing height remains **1.65 world units**, and the prototype camera remains
**58 CSS pixels per world unit**. The separate rifle adds 480 triangles.

## Validation and limits

- **48 focused tests pass:** closed connected surfaces, triangle budgets,
  preserved head/ear positions, unit normals, body contours, rig weights,
  planted feet, actual hand proximity to rifle grips, neutral restoration,
  paint registration and regressions for the other characters and equipment.
- **256 browser configurations pass:** for each pig, 64 grey and 64 painted
  combinations of two meshes, two poses, eight headings and two scales.
  No browser, shader or asset errors. Other character browser regressions pass.
- Classified flat fallback is at most **0.49% close / 1.05% native** for the
  foreman and **0.20% / 0.69%** for the director. This measures mapping coverage,
  not artistic quality; native edge antialiasing makes the classifier coarse.
- Both grey gates and both final painted gates reached **9/10**. The foreman's
  last review inspected carry at 0 and ±45 degrees plus native comparisons.
- The Pages distribution build passes. It is a local packaging check.

Foreman close-ups retain some stretched underarm strokes and an angular armband
fold, accepted as nonblocking for this pass. The skin remains projected rather
than a finished UV atlas. Neutral and relaxed rifle carry are the tested poses;
walking, combat animation and gameplay integration remain unproven. This change
does not merge canonical graphics or publish the separate 3D project.

Reproduce the focused checks:

```
node --test tests/pig-proportions.test.mjs tests/pig-foreman.test.mjs tests/pig-director.test.mjs tests/skunk-worker.test.mjs tests/bull-worker.test.mjs tests/goat-worker.test.mjs tests/horse-light.test.mjs tests/horse-model-paint.test.mjs tests/weapon-models.test.mjs tests/weapon-grips.test.mjs
```

With the local server on port 4389 and `PLAYWRIGHT_PATH` configured, run each
pig's `tools/pig-<name>-review.mjs --grey --proportions`, then the same command
without `--grey`, and `tools/pig-<name>-form-review.mjs --proportions`.
Rebuild geometry with `tools/build-pig-foreman.mjs` and
`tools/build-pig-director.mjs`; both use `tools/pig-body-proportions.mjs`.
