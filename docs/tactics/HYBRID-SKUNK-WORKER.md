# Skunk worker study

Open `tactics/skunk-worker.html?mesh=10k`, or add `&stage=grey` for the form.
The reference gallery links to this study. It uses the corrected
`skunk-turnaround-v2.png` with a central tailbone attachment.

## Construction

The stored **29,934-triangle author** is reduced to **9,998 triangles**.
Eight closed connected surfaces share the approved 17-bone worker rig.
The skunk has an integrated pointed muzzle, compact round ears, work boots,
and a raised curled plume rooted inside the center of the trouser seat.
The shared garments and hands retain their established construction.
The tail follows the pelvis and has no independent animation.

Standing height stays **1.65 world units**. Native comparison uses the unchanged
prototype isometric camera and **58 CSS pixels/world unit**. The paint-reference
camera is widened to 1.40 by 2.80 to contain the tail; this does not change
gameplay dimensions. The maximum reported reduction error is 0.00254 world
units, about 0.15 native pixels. This metric does not guarantee identical contours.
The separate 480-triangle rifle uses the existing carry attachment system.

## Paint

The built-in ImageGen tool painted the actual registered neutral render using
the corrected skunk turnaround for identity and bright illustrated detail.
Saved body skin: `dist/assets/characters/lowpoly-proof/skunk-worker-model-paint-v1.png`.
Prompt: [SKUNK-MODEL-PAINT-PROMPT.txt](SKUNK-MODEL-PAINT-PROMPT.txt).
Edit target: `hybrid-review/skunk-worker/neutral-paint-reference.png`.
The output translated the figures upward by about 33 pixels in an 887px sheet.
Color and validity-mask coordinates compensate for this; geometric visibility
coordinates remain tied to the original render.

The body uses rest-space projection, with profile ownership for the eyes,
and frontal paint reuse for hidden upper straps. The connected skull's central
crown excludes profile ear-interior samples, fixing the orange paint bleeding
between the ears that the user identified.

The tail has a dedicated painted texture,
`dist/assets/characters/lowpoly-proof/skunk-tail-paint-v1.png`, also generated
with the built-in tool. Prompt:
[SKUNK-TAIL-PAINT-PROMPT.txt](SKUNK-TAIL-PAINT-PROMPT.txt).
The stripe layout is rotated 90 degrees clockwise around the tail, viewed
from tip toward root, using a quarter-turn UV phase offset.
Two cream stripes wrap around a continuous flow spine running from the root
past the crown. Excluding the overlapping return-tip branch from this mapping
prevents stripe pinching at the inner curl. Radial components interpolate across
triangles; explicit angular derivatives prevent mip artifacts at the wrap.
This is a tail texture layout, not a completed body UV atlas.

Coverage view shows direct body projection and actual tail texture mapping in
green, reused body paint in blue, and flat fallback in magenta. Coverage does
not establish correct registration or artistic quality.

## Validation and scope

Grey hostile review reached 9/10 after tail, eye and sole corrections.
Paint review caught the crown seam and then the inner-curl stripe pinch.
The final painted stage reached **9/10** after the tail flow mapping and
user-identified ear/crown correction. Minor close-view compression at the
curled tip remains acceptable for this static proof.

**32 focused tests pass**, covering the skunk, bull, goat, horse, projection
cameras and equipment. Skunk checks include closed connected topology, height,
ear landmarks, central buried tail root, solid boots, normalized skin weights,
planted feet, actual hand surfaces near rifle contacts, neutral restoration,
reduction provenance and complete framing in all four paint cameras.

**64 grey and 64 painted browser combinations** cover both meshes, neutral/carry,
eight headings and native/close scales. No browser, shader or asset errors.
Maximum classified fallback: 1.36% close, 2.15% native. Native antialiasing makes
this classifier coarse. Horse, goat and bull shader regression views pass.
The Pages distribution build passes.

Reproduce with `node tools/build-skunk-worker.mjs`, then:

```
node --test tests/skunk-worker.test.mjs tests/bull-worker.test.mjs tests/goat-worker.test.mjs tests/horse-light.test.mjs tests/horse-model-paint.test.mjs tests/weapon-models.test.mjs tests/weapon-grips.test.mjs
```

With the local server at port 4389 and Playwright available, run
`node tools/skunk-worker-review.mjs --grey` and
`node tools/skunk-worker-review.mjs`. Evidence is under
`docs/tactics/hybrid-review/skunk-worker/`.

This is a static presentation prototype. Hands retain known limitations;
walking, aiming, firing, transitions, tail motion, other equipment poses and
gameplay integration remain unproven. Sprite comparison uses its illustrated
single direction; its firing pose does not match the model's relaxed carry.
Delivery belongs to `sprite-migration`; the canonical graphics merge and
separate published 3D project are outside this change.
