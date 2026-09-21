# Dog guard motion proof

Built on approved static dog `68b9e48`, in isolated `dog-guard-study`.

The approved **10,446-triangle** painted dog now performs an eleven-second **walk → settle → kneel → aim → fire/recover → stand** sequence with the separate 480-triangle rifle. It is a deterministic presentation proof, with no gameplay damage or action scheduling.

## Preview

`http://127.0.0.1:4427/tactics/dog-motion.html` with the worktree server running. Add `?paused` for inspection. Play/pause, replay, scrub, half/normal/fast speed, front/side/back/three-quarter/gameplay views, grey mode and contact guides are available. Aim direction is continuous; elevation ranges from -15° to +20°.

The native view retains **58 CSS pixels per world unit** and the prototype camera. Close view uses 300. The ground grid and camera stay fixed during each sequence. The dog walks one world unit. Direction/elevation controls orient the same presentation; they do not implement turning locomotion or target tracking.

## Implementation

- `dog-motion.js` evaluates every pose from the bind pose. Two-bone IK uses current shoulders/hips and actual rig lengths. The rigid soles remain fixed during support; upper pasterns follow the shins into the cuffs.
- The walking pelvis shifts toward the supporting paw, with modest pelvic roll/yaw and opposing shoulder motion. This rhythm eases in and out across the six steps. The rifle carry follows the upper body; the hands continue to solve to its grips.
- Motion-only weights keep cuffs with lower legs, preserve crotch/pelvis support, and blend jacket sleeves and waist continuously. Three tail bones lift the relaxed tail clear of the floor during kneeling. The motion rig has **20 bones**; the approved static viewer retains its 17-bone rig.
- The rifle rises to the shoulder and the head/upper body lean toward the sight line. Both gripping hands follow the independent rifle throughout. Discharge is at 6.60 seconds. Recoil starts immediately, reaches its peak in 25 ms during the 50 ms flash, then recovers over 525 ms before lowering the rifle.
- The flash follows the current physical muzzle during recoil. The emitted tracer retains the physical muzzle/bore transform evaluated at discharge. Heading and elevation are checked against the actual barrel direction.
- `dog-motion-paint.js` only repairs newly exposed bright inner-trouser projection artifacts with existing brown cloth paint. The underlying sculpt, reduced JSON, reference images, existing static paint and shared character helpers are unchanged.
- Replay, backward scrubbing and neutral restoration are deterministic. Cached discharge data is keyed by direction/elevation, not frame history.

## Verification

**23 focused and related tests pass**, including five motion tests:

1. 551 timeline samples verify bone lengths, actual paw geometry and world-space planted positions, hand-surface proximity, joint continuity and floor clearance. The kneeling rear knee cloth reaches the floor.
2. Six headings and three elevations verify the physical muzzle, intended bore direction, visible recoil within the first 10 ms, peak kick inside the flash and a substantially slower recovery.
3. Backward scrubbing reproduces prior diagnostics; neutral restoration reproduces the approved surfaces and normalized skin weights.
4. Plane intersections through actual deformed calf triangles retain width/depth; the painted eye landmark remains within 18 mm of the sight line at tested elevations, and the stock remains within 35 mm of the actual shoulder garment triangles. These are geometric checks, with visual review still required.
5. Actual hip/shoulder joints show pelvis transfer toward each planted paw and opposing torso rotation, settling before kneeling.

**456 browser samples pass** across close/native scales, four headings, three elevations and nineteen phase times, including alternating support and early recoil. Flash position follows the current muzzle; tracer origin stays at discharge. The static dog regression retains 17 bones and 10,446 triangles. Browser errors: none. Local 3D distribution build passes and includes all four motion modules/pages.

Evidence: `docs/tactics/hybrid-review/dog-motion/` includes machine-readable checks, front/side/back/gameplay/three-quarter phase renders, a grey kneeling side view, uninterrupted native/close WebM captures, alternating-support contact sheets at native/close scale, and a side-view recoil timing sheet.

Reproduce:

```text
node --test tests/dog-motion.test.mjs tests/dog-guard.test.mjs tests/rabbit-worker.test.mjs tests/horse-light.test.mjs tests/horse-model-paint.test.mjs
node tools/dog-motion-review.mjs
node tools/build-tactics-3d.mjs
```

The browser review needs Playwright (or its path in `PLAYWRIGHT_PATH`) and the local server on 4427.

## Independent hostile review

The first pass (`12b402e`) received **9/10 for the bounded sequence proof**, following a 7/10 hold for calf collapse, flat crotch paint and a low-ready aiming pose. Subsequent architect review requested more walking weight transfer and recoil synchronized to discharge.

This localized revision also passed independent hostile review at **9/10**. Hip/shoulder alternation was visible in close and gameplay-size samples. Independent normal-speed playback sampled 660 frames: the first observed kick was 10.6 ms after discharge and peak was at 27.2 ms, both during the flash. The flash remained attached to the muzzle and grip contacts stayed stable. These observed timings reflect sampled frame cadence; the authored peak is at 25 ms. Approved kneeling and aiming remained intact. This accepts the localized motion proof, not gameplay integration.

Remaining limits: a cautious six-step study, compressed trouser folds in deep kneeling, shared fingers, rigid ears following the head, no general locomotion controller, no turning gait and no gameplay integration. No canonical merge or published 3D deployment is included.
