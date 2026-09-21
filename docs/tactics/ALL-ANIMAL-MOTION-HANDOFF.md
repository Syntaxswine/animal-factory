# All-animal motion test study

Based on published `3c04ab0`, in isolated `animal-motion-study`. The task is to test every completed smaller character against the approved dog sequence. This packet does not approve every character's animated art, integrate gameplay, or publish the graphics project.

## Preview and coverage

Run the worktree server on port 4428 and open `tactics/animal-motion.html`. The character selector and findings table cover all **12 completed characters**. The current time is preserved when switching, which allows like-for-like pose comparisons. Front, side, back, three-quarter and prototype cameras, grey mode, contact guides, continuous heading, elevation, replay and scrubbing are available.

Native scale stays at **58 CSS px/world unit**; close scale is 300. Meshes keep their authored dimensions. No character was enlarged or reduced to fit the viewer. Mammals walk one world unit through the eleven-second walk → kneel → aim → fire → stand study.

The **hen is an explicit exception**: her approved rig has wings, not hands or rifle contacts. Her separate adapter tests walk → crouch → observe → rise. It does not simulate aiming, firing or a rifle attachment. The viewer disables elevation and never displays shot effects for her.

## Results by character

All rows pass the mechanical checks applicable to their supported sequence. Visual status is a separate assessment; the findings are also displayed prominently in the viewer.

| Character | Triangles | Visual status / next work |
|---|---:|---|
| Dog guard | 10,446 | Approved published motion baseline retained. Cautious gait and kneeling cloth compression remain accepted prototype limits. |
| Goat | 9,994 | Review candidate: no new blocking defect in inspected poses; architect approval of this transfer is pending. |
| Pig director | 9,998 | Review candidate: wider aiming stance and forward rifle placement clear the heavier torso. Architect approval remains pending. |
| Horse | 10,300 | Hold: raised arms expose the underarm/overall junction. |
| Bull | 9,998 | Hold: sharply bounded, flat under-elbow paint. |
| Cow | 10,184 | Hold: cream/olive underarm discontinuity. |
| Donkey | 10,110 | Hold: exposed sleeve interior and lower-jacket paint patches. |
| Sheep | 10,476 | Hold: cream ring and olive wedge at the raised shoulder. Grey inspection points mainly to paint ownership. |
| Skunk | 9,998 | Hold: fragmented shirt/overall junction beneath the elbow. |
| Rabbit | 10,156 | Hold: exposed angular underarm paint. |
| Pig foreman | 9,988 | Hold: unfinished neck/collar coverage and loose-looking cap fit during head tilt. |
| Hen | 10,348 | Unarmed only, visual hold: crouching exposes flat upper-leg ends beyond the feathers. Wing weapon handling remains unauthored. |

The underarm defects become apparent when the arms rise. Passing neutral/carry art review does not establish coverage for these new poses. The next art work should address those exposed regions and the foreman's neck/cap presentation, followed by the hen's feather-to-leg deformation and a separate decision about wing weapon handling. Shared fingers and compressed kneeling trousers remain known limitations.

## Adapter changes

- The dog uses the published `createDogMotion` unchanged. Other mammals use an isolated adapter with the same timing, support-phased weight shift, 25 ms recoil attack and 525 ms recovery. Shared/static model modules, reduced JSON and raster paintings are unchanged.
- Kneeling depth and head pose are calibrated per animal. The first generic transfer sank both pigs' trousers into the floor and missed several species' sight lines; those functional issues were corrected. Eye checks use approximate authored landmarks and require visual confirmation, not a claim of exact painted-pupil alignment.
- The pigs retain their authored forward carries. A 60° oblique aiming stance and forward shoulder-stock offsets keep the firing grips reachable without placing the hands inside their bellies. Other mammals retain the 35° stance. Heading still matches the physical bore in world space.
- Garment weights preserve species sleeve assignments, support the waist and keep overall bibs attached to the spine. Cuffs blend into the shins while soles remain planted. These changes do not resolve all exposed paint or cloth shapes.
- Bull, cow and donkey have temporary tail chains for kneeling floor clearance. The skunk plume and short tails remain attached to the pelvis; horse mane and goat beard are never treated as tails.
- The hen receives two hidden thigh pivots for leg solving. Motion-only shank/feather blending remains visually incomplete. Her original eleven-bone rig and skin weights are restored on teardown.
- The viewer preserves each character's existing paint pipeline: foreman ear source, skunk tail coordinates/texture, sheep and hen underlays, and cow/rabbit/dog detail layers. Only one character is loaded at a time; switching disposes its temporary rig and paint resources.

## Validation and evidence

**504 tests pass** through `npm run check`, including **37 new cross-species tests**. The asset check and 3D distribution build pass.

- A catalog test checks the roster against every reduced `*-10k-data.json` asset so a species cannot silently disappear from the report.
- **551 timeline samples per character** check actual sole positions, support contact, fixed bone lengths, hand surface proximity where applicable, joint continuity and posed surface floor clearance.
- Six headings and three elevations check physical muzzle/bore alignment, early recoil during the flash and monotonically slower recovery for the armed characters. The hen explicitly has no rifle or shot data.
- Scrubbing is deterministic. Neutral restoration reproduces the original surfaces; teardown restores skin weights, bone hierarchy and bone positions.
- **2,992 browser samples** cover both scales, four headings, eleven phase times and three elevations for each of eleven mammals. The hen contributes 88 unarmed samples, with elevation omitted. There are no browser errors. The flash follows the current barrel while the tracer retains the discharge origin.

`docs/tactics/hybrid-review/animal-motion/` contains a machine-readable result file, five rendered view sheets per character, and uninterrupted close/native WebM captures for each character. Numerical contact checks do not detect every clothing intersection, paint registration problem or convincing grasp; the visual holds above remain open.

Reproduce:

```text
npm run check
node tools/build-tactics-3d.mjs
node tools/animal-motion-review.mjs
```

The browser tool needs Playwright, optionally supplied through `PLAYWRIGHT_PATH`, and the local server on port 4428. `--no-video` refreshes browser samples and stills; `--animal=hen` reruns one character and replaces its entry in the saved report.

## Hostile review

Independent hostile review: **9/10 for the diagnostic packet**, covering the twelve-character roster, 2,992 recorded browser samples, live findings table, handoff accuracy, actual contact tests, deterministic scrubbing and restoration. No remaining coverage or reporting blocker was found.

This is explicitly **not all-animal visual approval**. The dog retains its approved baseline; goat and director are review candidates; eight other mammals retain visual holds; the hen remains an unarmed study with a leg-deformation hold and unsupported aiming/firing. The requested threshold applies to this test delivery's coverage and accuracy, not approval of unfinished animated art.
