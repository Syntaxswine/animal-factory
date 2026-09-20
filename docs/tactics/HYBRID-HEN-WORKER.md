# Hen worker study

Open `tactics/hen-worker.html?mesh=10k`; add `&stage=grey` for the sculpt.
The reference gallery links to the model. The pigs and skunk were accepted by
the user before work advanced to the hen.

## Character and construction

The reference is a female hen: a modest rounded comb, paired wattles, short
curved beak, copper feathers, olive waistcoat, cream apron and bare bird feet.
Each foot has three separated forward toes and a rear toe with curved claws.
The tail is an upright fan attached at the posterior pelvis. Overlapping broad
wing layers retain feathered tips.

**29,952 author triangles → 10,348 reduced triangles.** Both have 13 closed,
connected surfaces and an 11-bone bird rig. The reduced mesh comes from the
stored author mesh. It retains a little more geometry around the beak and vest
to preserve the closed surfaces and silhouette.

The user's request for a rounder chicken is incorporated: breast and abdomen
gain up to 25% in depth and width, with the vest and apron following that volume.
The correction tapers into the neck and lower body; wings move outward to fit
and the tail root moves back with the pelvis. Height remains **1.65 world
units**, with the unchanged prototype camera at **58 CSS pixels/world unit**.

The two poses are neutral and a small wing opening. Equipment grip, walking,
combat animation and gameplay integration remain unproven. This bird uses its
own wing articulation; no human hands or gloves were substituted.

## Paint provenance and registration

The **built-in ImageGen tool** painted the actual registered four-view grey
render, using the approved hen turnaround for identity and style.

- Skin: [hen-model-paint-v1.png](../../dist/assets/characters/lowpoly-proof/hen-model-paint-v1.png).
- Supplements: [body and garment underlay](../../dist/assets/characters/lowpoly-proof/hen-underlay-paint-v1.png), [isolated tail](../../dist/assets/characters/lowpoly-proof/hen-tail-paint-v1.png).
- Supplement prompts: [HEN-SUPPLEMENT-PAINT-PROMPTS.txt](HEN-SUPPLEMENT-PAINT-PROMPTS.txt); both use the built-in ImageGen tool on grey renders from `tools/hen-paint-underlays.mjs`.
- Exact prompt: [HEN-MODEL-PAINT-PROMPT.txt](HEN-MODEL-PAINT-PROMPT.txt).
- Edit target: [paint-registration-reference.png](hybrid-review/hen-worker/paint-registration-reference.png).
- Style reference: [hen-turnaround-v2.png](../../dist/assets/characters/model-references/hen-turnaround-v2.png).

The rounder revision keeps source `paintPosition` and `paintNormal` attributes
so the existing painting follows the fuller form. The current grey turnaround
is saved separately as `neutral-paint-reference.png`. Rebuilding it does not
replace the image used to generate the skin. Simplifier error is recorded as
`preRoundErrorWorld`; it is not a measured bound on the final expanded surfaces.

Hen-specific projection rules register the eyes, keep red wattle paint off the
neck behind, and use additional registered paintings for the body beneath
the wings, rear waistcoat, apron tie and isolated tail fan. The supplement
renderer hides the occluding parts while keeping the same camera and source
coordinates. Rear cloth uses a broad interior footprint with a smooth transition
into the original front painting; feather color cannot bleed onto the vest. Coverage mode shows direct projection green, reused paint blue,
and flat fallback magenta. Supplemental projection is conservatively shown blue. This remains a projected skin rather than a finished
UV atlas; coverage alone does not establish visual quality.

## Evidence and checks

[Equal-height comparison](hybrid-review/hen-worker/form-comparison.html) includes
grey author/reduced models and the painted model in front, profile,
three-quarter and gameplay views. Front/profile use the approved turnaround;
the other views use the original illustrated sprite at its approximate angle.
Close and native comparisons use equal displayed standing height.

The revised rounder grey form and final painted neutral/wing-opening study
both cleared independent **9/10** hostile gates. The painted review caught
duplicated eyes, misplaced rear buttons, feather/cloth contamination, stretched
source footprints and a hard vest seam; all blockers were corrected. Minor
close-view feather joins and simplified rear ties remain study limitations.
The initial grey review caught the narrow spiky tail, finger-like wings,
pointed beak, small eye surfaces and waistband shading; those were corrected
before the paint stage. Fine feather definition comes primarily from the skin.

**54 focused tests pass**, including six hen tests for closed connected surfaces,
budgets, bird landmarks, separated toes, normalized weights, wing movement,
stationary feet/body, neutral restoration, reduction provenance and camera
registration. The existing horse, goat, bull, skunk, pigs and equipment checks
also pass.

**64 grey and 64 painted browser configurations pass:** two meshes, two poses,
eight headings and close/native scale, plus six other character regressions.
No browser, shader or asset errors. Classified flat fallback stays below
**1.50% close / 2.37% native**. Native antialiasing makes this classifier coarse.
The distribution build passes; building does not publish the project.

Reproduce with `node tools/build-hen-worker.mjs` and
`node --test tests/hen-worker.test.mjs`. With the server on port 4389 and
`PLAYWRIGHT_PATH` configured, run `node tools/hen-worker-review.mjs --grey`,
`node tools/hen-worker-review.mjs`, and
`node tools/hen-worker-form-review.mjs`.

Delivery belongs to `sprite-migration`; canonical graphics integration and
publishing the separate 3D project are outside this study.
