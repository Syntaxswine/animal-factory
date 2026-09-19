# Pig director study

Open `tactics/pig-director.html?mesh=10k`; add `&stage=grey` to inspect the form.
The character reference gallery links to this study.

The latest abdomen/seat correction and validation are recorded in
[the two-pig proportion pass](HYBRID-PIG-PROPORTIONS.md). Earlier review results
below are historical evidence for the initial study.

## Construction

The stored **29,996-triangle author** reduces to **9,998 character triangles**.
Eight closed connected surfaces use the shared 17-bone worker rig. The separate
rifle adds 480 triangles. Height remains **1.65 world units**, with the prototype
isometric camera unchanged at **58 CSS pixels per world unit**.

The director has a projecting belly beneath a fitted waistcoat, full trousers,
low dress shoes, broad drooping ears, heavy cheeks, a raised snout and a curled
tail. Ear interiors remain solid; paint supplies the inner folds. The author
mesh is the source of the reduction, rather than an independently rebuilt shape.

Director-specific arm spacing and sleeve weights accommodate the larger torso.
The rifle carry moves forward and up to clear the belly. Other characters retain
their existing joint positions and weight rules. The carry is a static pose proof;
movement, aiming, recoil and animation transitions remain unproven for this body.

## Paint

Built-in ImageGen edited the actual registered four-view grey render, using
`pig-director-turnaround-v2.png` for identity and illustrated surface detail.

- Saved skin: `dist/assets/characters/lowpoly-proof/pig-director-model-paint-v1.png`.
- Exact prompt: [PIG-DIRECTOR-MODEL-PAINT-PROMPT.txt](PIG-DIRECTOR-MODEL-PAINT-PROMPT.txt).
- Edit target: [neutral-paint-reference.png](hybrid-review/pig-director/neutral-paint-reference.png).
- Mode: built-in ImageGen image edit with registered render and approved reference.

The rest-space projection follows the shared workflow. Each profile owns its
eye, while the front owns the anatomical-right watch chain. Local cloth reuse
keeps sleeve paint off the waistcoat and the chain off the cuffs. Upper sleeve
samples stay inside the cream shirt artwork. Central rear-head paint removes
profile-ear ghosts; unoccluded trouser samples remove the tail-root halo and
neutral-arm shadows at the hips. These are director-only mapping corrections.

Coverage mode marks direct projection green, reused paint blue and flat fallback
magenta. This is a projected skin, not a finished UV atlas. A fine sleeve outline
and some stretched side-cloth shading remain visible close up.

## Review evidence

Evidence and equal-height comparisons are in `hybrid-review/pig-director/`.
Front and profile comparisons use the approved turnaround. Three-quarter and
gameplay comparisons use the original sprite; its viewing angle is approximate.

Both grey and painted hostile review gates reached **9/10**. The grey pass
corrected a pinched waist, thin lower legs, low ear roots and uneven hem shading.
The painted pass corrected duplicate/overlapping features and sleeve ownership.
The approval covers the static neutral and rifle-carry presentation only.

**44 focused tests pass**, including all six director checks and regressions for
the horse, goat, bull, skunk, foreman, projection cameras and equipment. Director
checks cover closed connected surfaces, triangle budgets, dimensions, snout and
shoe landmarks, normalized weights, planted feet, actual hand proximity to rifle
grips, stable torso weighting, neutral restoration and reduction provenance.

**64 grey and 64 painted browser configurations** cover two meshes, two poses,
eight headings and close/native scales, with no browser, shader or asset errors.
Horse, goat, bull, skunk and foreman browser regressions pass. Classified flat
fallback stays below 0.2% close and 0.7% native; this measures coverage, not visual
quality. The Pages distribution build passes. No production deployment or
canonical graphics merge is part of this study.

Rebuild with `node tools/build-pig-director.mjs`. Run the geometry and rig checks
with `node --test tests/pig-director.test.mjs`. With the local server on port 4389
and Playwright available, run `node tools/pig-director-review.mjs --grey` and
`node tools/pig-director-form-review.mjs --grey` for the grey evidence. Omit
`--grey` to check the final painted model.
