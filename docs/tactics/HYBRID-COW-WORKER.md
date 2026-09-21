# Hornless female cow worker

This is a new female worker variant alongside the existing bull. The user
explicitly requested a hornless cow; both the turnaround and geometry follow
that direction. The existing bull and gameplay species roster are unchanged.

Preview `tactics/cow-worker.html?mesh=10k`; add `&stage=grey` for the sculpt.
The gallery distinguishes the original bull reference from this new cow sheet.
The left sprite comparison is labeled **Original bovine sprite** because it is
the existing horned character, not a matching female sprite. The new female
turnaround appears below the viewer. Select the author mesh for an equal-scale
comparison of the two model resolutions.

## Construction

The stored **29,988-triangle author** is the actual source of the
**10,184-triangle reduced character**. Twelve closed connected surfaces use the
existing 17-bone worker rig. This follows the approved roughly 30k → 10k workflow.
Largest reported simplification error is 0.003475 world units, approximately
0.20 pixels at native scale; it is an algorithmic metric, not a visual guarantee.

The cow has a distinct rounded muzzle, broad lateral ears, a short swept forelock,
narrower shoulders and forearms, a restrained waist/hip transition, exposed
cloven hooves and a slender tail with a fuller cream tuft. The crown reaches
1.60 world units: removing horns does not enlarge the underlying character to
replace their height. The prototype camera and 58 CSS pixels/world unit remain
unchanged. Close inspection uses 300 CSS pixels/world unit.

The scarf has separate shallow wrap, knot and end geometry. The tail is attached
to the pelvis without independent tail animation. The separate rifle adds 480
triangles and uses the existing attachments. Hands retain the accepted simplified
baseline; this task does not establish production-quality fingers or grips.

## Reference and skin

Built-in ImageGen produced these selected assets:

- `dist/assets/characters/model-references/cow-woman-turnaround-v1.png`
- `dist/assets/characters/lowpoly-proof/cow-woman-model-paint-v1.png`

The reference used the original bovine costume/style, then corrected fur marks
on fabric and removed horns at the user's direction. The skin was painted onto
the actual approved grey mesh's four registered views, using the new sheet for
identity. Prompts are saved in `COW-WOMAN-REFERENCE-PROMPT.txt` and
`COW-WOMAN-MODEL-PAINT-PROMPT.txt`. The exact grey paint target is
`hybrid-review/cow-worker/neutral-paint-reference.png`.

The material projects this painting in rest space; it is not a finished UV atlas.
Bovine eye/blaze ownership and nasal/strap reuse are shared with the bull.
Cow-specific footprints keep red cloth on the physical scarf, clear duplicate
strap/scarf paint from the shirt and throat, and provide trouser detail for hips
hidden by the neutral arms. Debug coverage shows direct projection in green,
borrowed paint in blue and flat fallback in magenta. Its screen-space classifier
does not establish correct paint registration or complete surface coverage.

## Review and validation

The independent hostile review gate is **9/10**. Reference and grey stages passed
that gate. Grey revisions reduced sleeve/seat inflation, strengthened the head,
shortened the neck impression, smoothed orbital transitions and swept the
forelock. Painted review progressed **7.5 → 8 → 8.5 → 9/10**. It caught scarf
interruptions, shoulder strap ghosts, a flat exposed hip patch and a throat/collar
paint mismatch. Local projection footprints resolved those defects without
changing the approved geometry. The final review accepts the static neutral/carry
prototype; borrowed cloth and throat fur remain simplified at close range.

### Scarf and throat close-up polish

The subsequent architect review accepted the lighter build and face but requested
closer scarf/throat polish. A dedicated ImageGen atlas,
`dist/assets/characters/lowpoly-proof/cow-neck-detail-v1.png`, supplies directional
cream fur and bright red gathered-cloth folds. The exact prompt is in
`COW-NECK-DETAIL-PROMPT.txt`. `cow-neck-paint.js` maps these details in bind space,
keeps cream paint off the turned knot/ends, and clears the duplicated scarf paint
from the rear neck and shirt collar. The original character painting is retained.

Only the knot's hidden upper rear half extends toward the wrap to close a small
physical gap. Every other stored mesh part is byte-for-byte unchanged, including
the face and body; triangle totals remain 29,988 and 10,184. Existing grey evidence
and the registered paint target show the original knot, before this local fit.

The high-resolution inspection also exposed an existing projection-atlas bug:
Three.js scales viewport/scissor setters by device pixel ratio even when drawing
into a fixed-size texture. The visibility bake now compensates for that scale.
`cow-neck-review.mjs` checks 20 cow close-ups at 2× device pixel ratio and three
additional horse/goat/bull paint regressions, including actual paint coverage.
These pass with the 18 focused tests and the 64 standard browser combinations.
This follow-up does not broaden approval beyond the neutral/carry prototype.
The localized hostile review progressed **8 → 8.5 → 9/10**, accepting the final
fur/cloth boundary, nape cleanup, attached knot and red folds in both mesh budgets.
Existing eye/forelock paint artifacts identified at extreme zoom are outside this
scarf/throat approval. Maximum flat fallback in the 20 high-DPI cow views is 0.86%
(rounded up); the three additional character checks are each below 3%.

Validation passed: **18 focused tests**, **64 grey browser combinations** and
**64 painted browser combinations**, with no browser, shader or asset errors.
Maximum classified flat fallback was 1.02% close and 1.90% native (rounded up);
native antialiasing makes this classifier coarse. Horse, goat and bull shader
regression renders passed. The local distribution build passed.

Focused tests check closed connected topology, the hornless crown and broad ears,
cloven hoof geometry, scale, normalized weights, neutral restoration, planted
feet, intermediate-heading grip contact and reduction provenance. Browser checks
cover two resolutions, two poses, eight headings and two scales, with saved
front, profile, rear, three-quarter and gameplay evidence. Shared shader checks
also render the horse, goat and bull.

Reproduce with Node:

```
node tools/build-cow-worker.mjs
node --test tests/cow-worker.test.mjs tests/bull-worker.test.mjs tests/horse-light.test.mjs tests/horse-model-paint.test.mjs
```

With `tools/serve.mjs` serving this worktree on port 4424 and Playwright available
(`PLAYWRIGHT_PATH` may point to its installed module):

```
node tools/cow-worker-review.mjs --grey
node tools/cow-worker-review.mjs
node tools/cow-neck-review.mjs
node tools/build-tactics-pages.mjs
```

Delivery is on `cow-worker-study`. This presentation prototype does not merge
canonical or publish the separate 3D project. Walking, aiming, firing, transitions,
other weapons and gameplay integration remain unproven for this cow.
