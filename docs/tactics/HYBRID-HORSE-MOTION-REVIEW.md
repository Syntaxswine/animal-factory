# Horse refinement and motion proof

The architect recommended refining this horse and testing walk → kneel → aim → fire → stand. This revision implements that bounded sequence in the existing comparison page, with play/pause, replay, time scrubbing, and a return to static comparison.

Preview: http://127.0.0.1:4389/tactics/hybrid-model-comparison.html — select **Play sequence**. Close view changes only the camera scale. Heading remains adjustable; the action follows that heading. There is no gameplay damage or action scheduling.

## Visual refinement

The torso is broader and deeper, the shoulders are higher to shorten the exposed neck, sleeve caps are less spherical, and the body sits laterally behind the firing shoulder so the rifle is shouldered instead of spanning the collar. The same atlas is retained, with brighter clothing panel vertex colors for clearer cloth and highlights. The rear knee surface reaches the ground in the kneeling pose. No new species or texture catalog was introduced.

The model remains **5,316 triangles / 57 mesh parts**. All three static poses retain the approved 1.65 / 1.155 / .462 heights; the barrel and static firing axis retain physical alignment. The prone torso is repositioned to preserve clearance without scaling down its geometry.

Historical baseline: [043002f comparison](https://github.com/Syntaxswine/animal-factory/blob/043002f/docs/tactics/HYBRID-MODEL-COMPARISON.md). Current [matched static comparison](hybrid-review/model-comparison/standing-both-close.png) and [five-heading sheet](hybrid-review/model-comparison/heading-sheet.png) show the refinement.

## Sequence and evidence

- 0–3 s: walk two tiles with world-space planted-foot intervals.
- 3–3.5 s: settle the feet one at a time.
- 3.5–4.7 s: kneel while the front foot supports the body and the rear foot steps back.
- 4.7–6 s: raise the rifle from low ready and establish level aim.
- 6 s: discharge; a brief flash/tracer uses the measured barrel tip and axis.
- After the flash: recoil and recover, then hold.
- 7–8.5 s: stand with the front foot anchored; hold standing through 10 s.

The body shifts back .205 tile as it kneels to keep the front foot planted. This is weight positioning within the presentation, not an additional tactical move. Discharge is captured at that final position. The shot is aligned before recoil begins; a recoiling barrel is not claimed to remain at the fixed physical firing origin.

[Native-scale recording](hybrid-review/horse-motion/sequence-native.webm) · [Close recording](hybrid-review/horse-motion/sequence-close.webm).

[Walk](hybrid-review/horse-motion/walk-close.png) · [Lowering](hybrid-review/horse-motion/lowering-close.png) · [Aim](hybrid-review/horse-motion/aim-close.png) · [Discharge](hybrid-review/horse-motion/shot-close.png) · [Recoil](hybrid-review/horse-motion/recoil-close.png) · [Rising](hybrid-review/horse-motion/rising-close.png).

Recordings are browser canvas captures of real playback. [Browser records](hybrid-review/horse-motion/checks.json) include actual pose and shot measurements. Regenerate with tools/hybrid-horse-motion-review.mjs using the local preview and PLAYWRIGHT_PATH. The renderer creates the flash/tracer once and reuses them; the sequence function is deterministic and does not accumulate transform deltas.

## Verification and hostile review

Four focused model/motion tests pass. Static muzzle checks cover multiple headings and floor levels; the static browser sweep covers 1,440 headings per stance. Dense motion tests sample 1,001 timestamps and verify actual ground support, no floor penetration, constant arm/leg segment lengths, hand contact, planted walking feet, planted front foot through stance changes, bounded joint changes, actual discharge origin/axis, recoil separation, and repeatable evaluation.

The initial motion review caught simultaneous foot lifts during transitions. Sequential steps and anchored front-foot support corrected that issue; ground support is now a test requirement rather than just absence of penetration. The hostile reviewer independently sampled the corrected motion and passed all four focused tests.

**Bounded refinement/motion proof: 4/5. Production readiness: 3/5.** The reviewer found the broader build and aiming pose more convincing. Their visual assessment used checkpoint captures and dense checks; they did not independently assess the complete video playback. The recordings are supplied for the architect's motion judgment.

Browser verification plays both full recordings, checks eight timestamps per view, exercises pause/scrub/static controls, verifies shot origin, and confirms stable geometry/texture counts through repeated scrubbing. All 373 project tests and asset verification pass; Pages packaging succeeds with 93 app files including the sequence module.

## Remaining limits and decision

Upper-body weight transfer and recoil remain stiff. This is still a procedural rigid-part rig, not an authored skinned animation asset. There is no general shoulder contact or weapon/body collision solver. The motion does not establish vertical target aiming, uneven terrain support, combat timing, pathfinding, other weapons/species, or many-unit performance. Raising the rifle from low ready is an animation, not vertical target aiming.

The static model still costs roughly 56 more draw calls than the sprite in this isolated room. The new animation does not solve batching. Canonical gameplay, tile rules, and renderer cutover remain unchanged.

Architect decision requested: judge the recordings for the desired late-1990s tactical feel and specify the next animation/art corrections before a production rig or gameplay integration. This 4/5 gate approves the bounded proof, not a graphics merge.
