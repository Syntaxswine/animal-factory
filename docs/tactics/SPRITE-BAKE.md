# Bringing the 2D sprite sheet up to the 3D models

Opened 22 September 2026. The 3D line has overtaken the 2D line: it carries twelve rigged,
painted, animated characters where the sprite sheet has nine hand-drawn ones, and it models
twelve weapons where the sheet paints five. This document records how a sprite is photographed
out of a 3D model, what has been proven, and what is still in the way.

Nothing here touches the scenery registries. The parcels in `SCENERY-PORT-HANDOFF.md` own
`environment.js`, `prop-art.js`, `manifest.json`, `editor.js` and the Pages file list; this work
owns character art only, which that document fences off in its "Out of scope" section.

## The finding that makes this cheap

**The two games already share a camera.** This was measured by projecting a unit ground square
through both, not read from documentation:

| | azimuth | elevation | tile diamond |
| --- | --- | --- | --- |
| sprite game, `dist/tactics/view.js` | 45° | — | 56 : 28 = **2.000000** |
| 3D branch, `GAME_CAMERA` in `hybrid-world.js` | `PI/4` | `PI/6` | **2.000000** |

`HYBRID-MIGRATION.md` says the camera sits at 35.26° and produces 1.73:1 diamonds. That was
true on 17 September, in a section listing gaps that "the next stages must resolve". They were
resolved: `elevation: Math.PI/6` is now the only camera constant on the branch, and `PI/6` is
exactly 30°, which is exactly 2:1. Quoting that paragraph as current state is a trap — it is
the one factual error found in the scenery handoff, and it matters there too, because it means
the 3D scenery is also already in this game's projection.

So a model needs **no reprojection** to become a sprite. Only the scale is open, and that is
forced as well. One world unit steps `cos(45°) * ppu` pixels across the screen; the game wants
28 of them at zoom 1 (`view.js` projects `x` to `(x-y)*28*zoom`); sprites are stored at 4× the
drawn size (`app.js` draws `sw = frame.width/4`, `sh = 64`). Therefore:

```
ppu = 4 * 28 / cos(45°) = 158.392
```

## The sprite contract, measured rather than assumed

Every PNG under `dist/assets/characters` was measured for its alpha bounding box. The catalog
in `character-art.js` is honest: declared `contentHeight` equals measured alpha height exactly.

| sprite | canvas | content | last opaque row |
| --- | --- | --- | --- |
| `horse-idle.png` | 192 × 256 | 126 × 236 | 243 |
| `horse-rifle.png` | 256 × 256 | 160 × 236 | 243 |
| `cow-rifle.png` | 256 × 256 | 179 × 236 | 243 |
| `horse-rifle-kneeling.png` | 384 × 256 | 181 × 176 | 243 |

**Every sprite plants its foot on row 243**, which is the `anchor` y of 244 less one. That is the
baseline a bake has to hit.

The anchor is *not* the alpha bounding box. A walk cycle drives the model across the ground
(`worker.root` travels from `(0,0,0)` to `(0.819,0,0.574)` over the walk), and a raised muzzle
or a tail hangs past the feet. `worker.root` sits on the floor at `y = 0` and travels with the
animation, so projecting **that** point gives the tile the character is standing on. The baker
places it at `(width/2, 243)`.

## The tool

`tools/bake-character-sprites.mjs` drives the 3D study page headlessly and writes
spec-conformant PNGs plus a `bake-manifest.json` of measured content boxes.

```
node tools/bake-character-sprites.mjs --animal=horse --weapon=rifle --pose=idle,walk-a,kneeling
node tools/bake-character-sprites.mjs --animal=all --headings=0,45,90,135,180,225,270,315
```

It needs the 3D reference tree served and `playwright-core` with an installed Edge:

```
git remote add codex "C:/Users/baals/Local Storage/AI/GTP/animal-factory"
git fetch codex "refs/heads/*:refs/remotes/codex/*"
git worktree add --detach ../af-3dref-sprites codex/project/tactics-3d
cd ../af-3dref-sprites && PORT=4318 node tools/serve.mjs
```

The tool refuses rather than producing quietly wrong art in three places: it throws if a pose
time no longer lands on its expected `diagnostics().phase` (a retimed study is caught, not
baked), it reports per-edge `overflow` when a silhouette does not fit its slot instead of
cropping, and it refuses a weapon the rig will not actually carry (see below).

### Pose times

The study timeline runs once through walk → settle → kneel → aim → fire → lower → stand over
eleven seconds. Phase spans, read from `diagnostics().phase`:

| phase | span (s) | kneel | aim | used for |
| --- | --- | --- | --- | --- |
| Walk | 0 – 2.99 | 0 | 0 | `walk-a` (1.0), `walk-b` (2.0) |
| Settle | 3.0 – 3.59 | 0 | 0 | — |
| Kneel | 3.6 – 4.99 | 0 → 1 | 0 | — |
| Aim | 5.0 – 6.59 | 1 | 0 → 1 | `kneeling` (5.0), `aim` (6.5) |
| Fire / recover | 6.6 – 7.39 | 1 | 1 | `fire` (6.7) |
| Lower rifle | 7.4 – 7.99 | 1 | 1 → 0.886 | — |
| Stand | 8.0 – 9.59 | 1 → 0 | 0.878 → 0 | — |
| Standing | 9.6 – 11 | 0 | 0 | `idle` (10.5) |

## What has been proven

`docs/tactics/sprite-bake/` holds the evidence.

- **`game-comparison.png`** — the decisive one. Misha the goat in the running game, before and
  after swapping one PNG on disk. Same map, same scene, same filename, **no engine change and no
  catalog change**. The baked figure lands at the right scale, plants on its tile and sorts
  correctly against the selection ring and the grenade in front of it.
- **`roster.png`** — all twelve 3D characters baked at this game's projection. Three of them —
  **bull, rabbit and dog** — have no 2D sprite at all today.
- **`heading-comparison-horse.png`** — the capability gap. The sheet holds one view per
  character, mirrored by `ctx.scale(u.facing,1)` in `app.js`, so a unit carries a full
  `u.heading` in degrees for sight cones and overwatch while its body can only face two ways.
  The bottom row is eight real renders.

The first A/B attempt was blind and said so: it swapped `horse-rifle.png`, but Yakov carries an
AK-47 and is drawn from `horse-assault.png`, so the frames came back byte-identical. The test
was redone on the goat, who actually holds a rifle. A comparison that cannot fail proves nothing.

## What is still in the way

1. **The weapon matrix.** `animal-motion.html` equips one Mosin-Nagant at load and builds the
   battle posture around it. `worker.equipWeapon()` mounts a different asset happily, but
   *posture*, not `equipWeapon`, is what moves the gun to the carry anchor and makes it visible,
   and posture is built once per animal. Swapping therefore leaves the rig holding an invisible
   weapon at the origin, which bakes as a flawless sprite of an unarmed character. The baker
   refuses this. The fix is to bake from an entry point that builds posture per weapon —
   `battle-3d.html` already calls `createWeaponModel(unit.weapon)` per unit — or to rebuild
   posture in the study page.
2. **Prone.** The study timeline has no prone phase. Prone lives in `animal-prone-motion.js`
   behind the viewer's `proneStudy` flag, and the sheet has 30 prone sprites.
3. **Headings.** Adding real headings is an engine change, not an art change: `characterArt()`
   takes no heading, and `app.js` mirrors by `u.facing`. Undecided — see below.
4. **Art direction.** The bakes read cleaner and softer than the hand-drawn sprites, which carry
   stronger contrast and a painted edge. `game-comparison.png` shows this honestly. The 3D line's
   own paint is good, but "in line with the 3D models" is not automatically "looks better in this
   game at 59 screen pixels tall". This is the boss's call, not a technical one.
5. **Walk frames overflow the slot** by 3 rows below the baseline, reported by the tool rather
   than cropped. The existing sheet leaves 12 rows under the baseline; the walk silhouette wants
   more. Either the baseline shifts for walk poses or the canvas grows.

## Staged plan

| # | Stage | Depends on | State |
| --- | --- | --- | --- |
| 1 | Projection proof, baker tool, in-game drop-in | — | **done, this document** |
| 2 | Per-weapon posture so the full weapon matrix bakes | — | not started |
| 3 | Prone from `animal-prone-motion.js` | — | not started |
| 4 | Re-bake the nine existing species over the current sheet | 2, 3 | not started |
| 5 | Headings: `characterArt(…, heading)`, retire `ctx.scale(u.facing,1)` | 4 | **needs a decision** |
| 6 | Bull, rabbit and dog as playable species | 4 | not started |
| 7 | Portable sheet: spec + manifest so the set drops into another game | 4 | not started |

Stage 5 is the one that changes the game rather than its art, and stage 7 is the one the
direction actually asks for — the sheet is meant to be a module that can be recycled into other
isometric projects, which means the manifest and the baseline convention are the deliverable,
not just the PNGs.
