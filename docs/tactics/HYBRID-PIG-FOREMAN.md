# Pig foreman study

Open `tactics/pig-foreman.html?mesh=10k`, or add `&stage=grey` for the form.
The character reference gallery links to the study.

Current review scope: the ear correction is approved by hostile review at **9/10**.
The architect's broader body-proportion concern remains pending. The earlier
whole-character review score did not establish reference fidelity.

## Construction

The stored **29,990-triangle author** is reduced to **9,990 triangles**.
Nine closed connected surfaces share the existing 17-bone worker rig.
The foreman has a broad belly, buttoned shirt with braces, trousers, solid
work boots, service cap, integrated snout and cheeks, and a small curled tail.
The cap follows the head; the tail follows the pelvis.

**Ear interiors are painted.** The ears have soft, solid folded silhouettes,
without carved undercuts or interior recesses, as requested. Nostril openings,
eyelid shelves, jowls and the jaw provide the face's structural landmarks;
paint supplies the finer expression and ear folds.

Height stays **1.65 world units**, with the unchanged prototype isometric
camera at **58 CSS pixels/world unit**. The author-to-reduced mesh reports
maximum error 0.00320 world units, approximately 0.19 native pixels. This
metric is not a guarantee of identical contours.

The separate rifle adds 480 triangles. Its carry moves forward to clear the
belly, with forward elbow poles keeping forearms in front of the braces.
Pig-specific sleeve weights preserve the belly while the outer sleeves follow
the arms. Other species retain their previous weighting.

## Paint

The built-in ImageGen tool edited the actual four-view neutral grey render,
using `pig-foreman-turnaround-v2.png` for character identity and illustrated
surface detail. The image was painted in model registration, then applied
through the existing rest-space projection shader.

- Saved skin: `dist/assets/characters/lowpoly-proof/pig-foreman-model-paint-v1.png`.
- Exact prompt: [PIG-FOREMAN-MODEL-PAINT-PROMPT.txt](PIG-FOREMAN-MODEL-PAINT-PROMPT.txt).
- Edit target: [neutral-paint-reference.png](hybrid-review/pig-foreman/neutral-paint-reference.png).
- Generation mode: built-in ImageGen image edit, with the registered render and approved turnaround as inputs.

Profile paint owns each eye. Cap masking keeps the gold badge on the front
of the cap and dark leather on the visor. The badge color registration is
raised slightly to remain visible above the physical visor. Rear belt samples
exclude the front buckle, and a locally reused seat sample removes the painted
tail-root halo. Hidden lateral hips reuse unoccluded front trouser cloth,
preventing neutral-arm shadow edges from appearing as pointed flaps in carry.
The boot paint registers six pixels above the geometric soles.
The red armband remains on the anatomical right upper arm.

Coverage mode shows direct projection in green, reused paint in blue, and
flat fallback in magenta. This identifies mapping coverage, not artistic
correctness; this remains a projected skin rather than a completed UV atlas.

## Review and validation

Grey hostile review reached **9/10** after correcting rigid ear shapes,
collar edges and the waist join. Painted hostile review reached **9/10**
for the initial study after badge registration, forearm/brace clearance and projected lateral
arm-shadow corrections. The reviewer inspected fresh turned and native views.
Some lateral hip paint stretches at close range; this was accepted as
nonblocking at gameplay size for this bounded static proof.

**38 focused tests pass**, covering the foreman, skunk, bull, goat, horse,
projection cameras and equipment. Foreman checks verify closed connected
topology, model height, nostrils, solid boots, ear/cap/tail landmarks, normalized
weights, planted feet, actual hand geometry near rifle grips, neutral
restoration, stable belly vertices during carry, reduction provenance and
complete framing in all four reference cameras.

**64 grey and 64 painted browser combinations** cover both meshes,
neutral/carry poses, eight headings and native/close scales. No browser,
shader or asset errors. Latest ear revision classified flat fallback is **1.37% close**
and **2.31% native**; native antialiasing makes this classifier coarse.
Horse, goat, bull and skunk browser regression views pass. The Pages
distribution build passes; building does not publish it.

Reproduce with `node tools/build-pig-foreman.mjs`, then:

```
node --test tests/pig-foreman.test.mjs tests/skunk-worker.test.mjs tests/bull-worker.test.mjs tests/goat-worker.test.mjs tests/horse-light.test.mjs tests/horse-model-paint.test.mjs tests/weapon-models.test.mjs tests/weapon-grips.test.mjs
```

With the server at port 4389 and Playwright available, run
`node tools/pig-foreman-review.mjs --grey` and
`node tools/pig-foreman-review.mjs`. Evidence is under
`docs/tactics/hybrid-review/pig-foreman/`.

This is a static character and rifle-carry study. Hands retain their known
limitations; walking, aiming, firing, transitions, other equipment poses and
gameplay integration remain unproven. The sprite's illustrated pose differs
from the model's neutral and relaxed carry poses. Delivery belongs to
`sprite-migration`; canonical graphics integration and the separate
published 3D project are outside this change.


## Ear correction after architect review of 3ec1e7c

The architect correctly identified pointed wedges in both mesh resolutions.
This ear-only revision replaces the linear taper with a curved closed perimeter:
a broad lower lobe hangs below the outward corner, and a backward sweep exposes
the flap in profile and three-quarter views. The surfaces remain solid.
Averaged mesh normals remove the spurious triangular creases along the thin rim.

The existing approved turnaround supplies locally registered ear color, with
painted root-fold shadow and a highlighted lower rim. Adjacent pink skin fills
the old projected ear outline on the skull. No new raster asset was generated;
the body skin is unchanged. Eight non-head parts, including garments, boots,
cap and tail, remain byte-identical in both stored model resolutions.
The facial field is unchanged; the connected head is remeshed with the new ears.

The first shape was refined for profile visibility. Independent review then
caught the rim shading and insufficient painted fold definition. Final **9/10** approval is
specifically for the ear correction, not the pending heavier/compact body shape.
No body-proportion changes are included in this pass.

[Equal-height comparison](hybrid-review/pig-foreman-ears/ear-comparison.html)
shows the reference, author grey, reduced grey and reduced painted model from
front, profile, three-quarter and gameplay angles. Reference artwork is scaled
to each model view's projected cap-to-sole height. Model scale and prototype
camera remain unchanged. Front/profile use the approved turnaround; other
views use the original sprite at its illustrated angle, which is approximate.
There are 32 focused renders, including native 58 px/unit views. The model is
neutral so that the ears remain unobscured.

Six foreman tests now additionally guard a lower lobe below the outward corner
and sufficient depth sweep for profile visibility. All **38 focused tests**,
**64 grey + 64 painted browser configurations**, the four other character
regression views and the distribution build pass. Reproduce fresh evidence
with `node tools/pig-foreman-review.mjs --grey --ears`,
`node tools/pig-foreman-review.mjs --ears` and
`node tools/pig-foreman-ear-review.mjs`.
