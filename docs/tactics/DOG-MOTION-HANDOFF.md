# Dog guard motion proof

Built on approved static dog `68b9e48`, in isolated `dog-guard-study`.

The approved **10,446-triangle** painted dog now performs an eleven-second **walk → settle → kneel → aim → fire/recover → stand** sequence with the separate 480-triangle rifle. It is a deterministic presentation proof, with no gameplay damage or action scheduling.

## Preview

`http://127.0.0.1:4427/tactics/dog-motion.html` with the worktree server running. Add `?paused` for inspection. Play/pause, replay, scrub, half/normal/fast speed, front/side/back/three-quarter/gameplay views, grey mode and contact guides are available. Aim direction is continuous; elevation ranges from -15° to +20°.

The native view retains **58 CSS pixels per world unit** and the prototype camera. Close view uses 300. The ground grid and camera stay fixed during each sequence. The dog walks one world unit. Direction/elevation controls orient the same presentation; they do not implement turning locomotion or target tracking.

## Implementation

- `dog-motion.js` evaluates every pose from the bind pose. Two-bone IK uses current shoulders/hips and actual rig lengths. The rigid soles remain fixed during support; upper pasterns follow the shins into the cuffs.
- Motion-only weights keep cuffs with lower legs, preserve crotch/pelvis support, and blend jacket sleeves and waist continuously. Three tail bones lift the relaxed tail clear of the floor during kneeling. The motion rig has **20 bones**; the approved static viewer retains its 17-bone rig.
- The rifle rises to the shoulder and the head/upper body lean toward the sight line. Both gripping hands follow the independent rifle throughout. Discharge is at 6.60 seconds; recoil starts after the 50ms flash and recovers before lowering the rifle.
- Flash and tracer use the physical muzzle/bore transform evaluated at discharge, independent of later recoil. Heading and elevation are checked against the actual barrel direction.
- `dog-motion-paint.js` only repairs newly exposed bright inner-trouser projection artifacts with existing brown cloth paint. The underlying sculpt, reduced JSON, reference images, existing static paint and shared character helpers are unchanged.
- Replay, backward scrubbing and neutral restoration are deterministic. Cached discharge data is keyed by direction/elevation, not frame history.

## Verification

**22 focused and related tests pass**, including four new motion tests:

1. 551 timeline samples verify bone lengths, actual paw geometry and world-space planted positions, hand-surface proximity, joint continuity and floor clearance. The kneeling rear knee cloth reaches the floor.
2. Six headings and three elevations verify the physical muzzle, intended bore direction and post-discharge recoil/recovery.
3. Backward scrubbing reproduces prior diagnostics; neutral restoration reproduces the approved surfaces and normalized skin weights.
4. Plane intersections through actual deformed calf triangles retain width/depth; the painted eye landmark remains within18mm of the sight line at tested elevations, and the stock remains within35mm of the actual shoulder garment triangles. These are geometric checks, with visual review still required.

**216 browser samples pass** across close/native scales, four headings, three elevations and nine phase times. The static dog regression retains17bones and10,446triangles. Browser errors: none. Local 3D distribution build passes and includes all four motion modules/pages.

Evidence: `docs/tactics/hybrid-review/dog-motion/` includes machine-readable checks, front/side/back/gameplay/three-quarter phase renders, a grey kneeling side view, and uninterrupted native/close WebM captures.

Reproduce:

```text
node --test tests/dog-motion.test.mjs tests/dog-guard.test.mjs tests/rabbit-worker.test.mjs tests/horse-light.test.mjs tests/horse-model-paint.test.mjs
node tools/dog-motion-review.mjs
node tools/build-tactics-3d.mjs
```

The browser review needs Playwright (or its path in `PLAYWRIGHT_PATH`) and the local server on4427.

## Independent hostile review

Final **9/10 for the bounded sequence proof**, following a7/10 hold for calf collapse, flat crotch paint and a low-ready aiming pose. The reviewer inspected refreshed renders, implementation/tests and independent live temporal samples through all phases; this was not a claim to have watched the full real-time video.

Remaining limits: cautious/stiff gait, compressed trouser folds in deep kneeling, shared fingers, rigid ears following the head, no general locomotion controller, no turning gait and no gameplay integration. No canonical merge or published 3D deployment is included.
