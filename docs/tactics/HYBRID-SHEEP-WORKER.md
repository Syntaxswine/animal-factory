# Sheep worker study

Open `tactics/sheep-worker.html?mesh=10k`; add `&stage=grey` for the sculpt.
The character reference gallery also links to the study. The user approved
the hen before authorizing this next character.

## Form and reduction

**29,684 author triangles → 9,996 reduced triangles.** The reduced character
derives from the stored author mesh, preserving nine closed connected surfaces
and the shared 17-bone worker rig. Height is **1.65 world units**; the prototype
isometric camera and **58 CSS pixels/world unit** remain unchanged.

The sheep has a short broad grey face, rounded drooping ears, hornless wool cap
and ruff, wool forearms and pasterns, exposed cloven hooves, and a short wool tail.
The clothing follows the approved turnaround: cream rolled sleeves, olive
waistcoat with a V neck and pointed hem, red scarf, and brown work trousers.
The waistcoat uses a closed fitted surface independent of the shirt. Its rim
normals blend into the cloth to avoid a dark artificial neckline seam.
Two enclosed curved arm openings preserve the olive shoulder bridges while
clearing the sleeves. Sheep-specific sleeve weights keep the upper shirt
under those bridges during the rifle carry.

The viewer compares author/reduced geometry or the original sprite in neutral
and rifle-carry poses. The rifle is a separate 480-triangle asset. The carry
uses actual skinned arms and hands with the established attachment system.
Walking, firing, transitions and gameplay replacement remain outside this study.
Hands retain the accepted simplified worker construction.

## Painting

The built-in ImageGen tool painted the actual registered four-view grey render,
with the approved sheep turnaround as a style and identity reference.

- Main skin: [sheep-worker-model-paint-v1.png](../../dist/assets/characters/lowpoly-proof/sheep-worker-model-paint-v1.png).
- Target: [paint-registration-reference.png](hybrid-review/sheep-worker/paint-registration-reference.png).
- Prompt: [SHEEP-MODEL-PAINT-PROMPT.txt](SHEEP-MODEL-PAINT-PROMPT.txt).
- Garment supplement: [sheep-underlay-paint-v1.png](../../dist/assets/characters/lowpoly-proof/sheep-underlay-paint-v1.png).
- Supplement target: [underlay-paint-reference.png](hybrid-review/sheep-worker/underlay-paint-reference.png).
- Supplement prompt: [SHEEP-UNDERLAY-PAINT-PROMPT.txt](SHEEP-UNDERLAY-PAINT-PROMPT.txt).

The supplement paints the waistcoat and trousers with occluding body parts
hidden, preserving their registered cameras and coordinates. It prevents
resting-arm paint from appearing on the hips when the arms rise. Species-specific
projection rules place one iris around each orbital surface and keep ear
interior paint off the wool behind the ear. Small shoulder and crown underlaps
reuse paint from their own material regions.
The saved painting targets predate the localized armhole correction; the
current `neutral-paint-reference.png` records the corrected grey form. Original
registration references are retained rather than overwritten by review renders.

This is projected artwork, not a finished UV atlas. Coverage mode marks direct
projection green, reused/supplemental painting blue, and flat fallback magenta.
It measures screen-space coverage, not visual correctness or full mesh coverage.

## Validation and review

The grey form cleared the independent **9/10** hostile gate before painting.
The review caught capsule ears, an overhanging wool cap, raised eye surfaces
and the vest rim seam; those were corrected before advancing.

The final grey and painted static proof both cleared **9/10** after a localized
armhole correction. The painted review caught arm-shaped marks on the hips,
split eye registration, stretched ear wool and the vest/sleeve intersection.
The final review confirms restored shoulder bridges, enclosed armholes and
consistent native-size author/reduced appearance. Angular neckline edges and
some stretched cloth shading remain minor close-view limitations. Other
weapons and general animation were not approved by this static-pose review.

**59 focused tests pass**, including five sheep checks for closed connected
geometry, triangle budgets, sheep landmarks, cloven toes, normalized weights,
neutral restoration, fixed feet, real hand proximity to rifle grips, and
reduction provenance. Existing character and weapon checks also pass.

**64 grey and 64 painted browser configurations pass**: two meshes, two poses,
eight headings, and close/native scale. Seven earlier character pages also
render without browser, shader or asset errors. Classified flat fallback stays
below **0.50% close / 1.30% native**; native antialiasing makes this classifier
coarse. The distribution build passes.

[Equal-height comparisons](hybrid-review/sheep-worker/form-comparison.html)
include grey author/reduced and painted reduced front, profile, three-quarter
and gameplay views. Front/profile use the turnaround; the other views use the
original sprite at its approximate illustrated angle. The normal viewer keeps
the prototype scale, while the review page matches displayed standing height.

Reproduce geometry with `node tools/build-sheep-worker.mjs` and
`node --test tests/sheep-worker.test.mjs`. With the local server on port 4389
and `PLAYWRIGHT_PATH` set, run `node tools/sheep-worker-review.mjs --grey`,
`node tools/sheep-worker-review.mjs`, and
`node tools/sheep-worker-form-review.mjs`. The garment reference renderer is
`node tools/sheep-paint-underlay.mjs`.

This branch contains a presentation prototype. Building the distribution does
not publish it or merge the graphics branch into canonical gameplay.
