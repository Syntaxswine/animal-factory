# Goat worker: second-species prototype

The goat tests the approved workflow: a roughly 30,000-triangle authoring asset,
bright painted surface detail, then a roughly 10,000-triangle character. This is a
standalone presentation experiment, not a graphics-branch merge or gameplay replacement.

Open `tactics/goat-worker.html?mesh=10k`. Compare the original sprite with either
mesh, or compare author and reduced versions directly. Neutral uses the idle
sprite; carry uses the rifle sprite. The front/side/back controls inspect the
model; the original sprite remains its existing single illustrated view.

## Geometry and equipment

- Author: **29,586 triangles**. Reduced character: **9,994 triangles**.
- Independent existing worker rifle: **480 triangles**; existing rifle wood atlas.
- Eight connected, closed surfaces and the shared 17-bone worker rig.
- Prototype height **1.65 world units**, including horns. Native preview uses
  the unchanged prototype camera and **58 CSS pixels/world unit**.
- Adapted the approved worker clothing to a narrower torso. Built a goat-specific
  skull, swept horns, hollow ears, short swept goatee and genuinely split hooves.
  Retained the accepted shared hands and clothing construction.
- The stored 29k geometry is the actual input to the 10k reduction. The field
  mesher is an offline construction tool; its intermediate triangles are not
  shipped as the character or used as a second hidden sculpt asset.
- Reduction's largest reported absolute error is about **0.00254 world units**,
  approximately **0.15 pixels** at native scale. This is a simplifier metric,
  not proof that every projected contour is identical.

## Painted skin

The built-in ImageGen tool painted the four registered neutral model views using
the original goat sprite for identity and the approved horse skin for brushwork.
The final asset is
`dist/assets/characters/lowpoly-proof/goat-worker-model-paint-v1.png`.
The complete prompt is in `GOAT-MODEL-PAINT-PROMPT.txt`; the grey edit target is
`hybrid-review/goat-worker/neutral-paint-reference.png`.

The skin uses cream fur, ochre horn ridges, a mustard shirt, olive overalls and
red scarf. The goat does not inherit the horse blaze or chestnut fallback colors.
The same image is used on both mesh resolutions. Side projections own the eye
and horn markings to reduce competing contours.

This retains the horse prototype's unlit, rest-space projection material. It is
not a finished conventional UV atlas. Visibility and part IDs protect direct
projection; hidden surfaces reuse paint from their own part across four views.
The coverage toggle distinguishes direct projection (green), reused paint
(blue), and flat fallback (magenta). A low fallback percentage alone does not
establish correct paint registration. Close inspection and turning remain
necessary; the image generation can shift fine features slightly.

## Review and reproduction

The grey form underwent hostile review at 6.5, 7.5 and 8/10 before the corrected
horns, eye surfaces and beard reached **9/10 for beginning paint**. This is a
stage-specific gate, not final art or animation approval.

The painted prototype subsequently reached **9/10**, after correcting eye
registration onto the visible orbital surface and reusing the front strap paint
continuously across its hidden upper turn. That reuse remains blue in the
coverage display. The reviewer accepted the matched author/reduced native and
close views. A small scarf/collar transition remains visible close up and is a
nonblocking prototype limitation.

Validation: **21 focused tests passed**. **64 browser combinations** cover both
mesh resolutions, neutral/carry, eight headings, and native/close scale; there
were no browser, shader or asset errors. The approved horse also rendered through
the shared shader unchanged. The Pages distribution build passed; this task does
not publish to the separate 3D project.

Rebuild meshes with `node tools/build-goat-worker.mjs`.
Run `node --test tests/goat-worker.test.mjs tests/horse-light.test.mjs
tests/horse-model-paint.test.mjs tests/weapon-models.test.mjs
tests/weapon-grips.test.mjs` (one command).
With the local server on port 4389 and Playwright available, run
`node tools/goat-worker-review.mjs --grey` for the reference sheet and grey checks,
then `node tools/goat-worker-review.mjs` for the painted evidence.

Tests cover closed connected geometry, preserved horn/hoof landmarks, normalized
weights, neutral restoration, planted feet, actual hand surfaces near rifle
grips, and reduction provenance. The browser checks both meshes in neutral and
carry at eight headings and both scales, plus the reference inspection views. Shared horse and
weapon tests protect existing behavior.

Limits: static neutral/rifle-carry poses only. Walking, firing, transitions,
other equipment poses and gameplay integration are unproven for this goat.
The shared hands remain a known visual weakness. The rifle and broader weapon
material refinements remain their separate task.
