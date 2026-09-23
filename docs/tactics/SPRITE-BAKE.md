# Bringing the 2D sprite sheet up to the 3D models

Opened 22 September 2026. The 3D line has overtaken the 2D line: it carries twelve rigged,
painted, animated characters where the sprite sheet has nine hand-drawn ones. The sheet is not
the thin side: it is complete, 660 PNGs covering every species, weapon and stance, and the 3D
line is the better-looking but far less complete source. This document records how a sprite is
photographed out of a 3D model, what has been proven, and what is still in the way.

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

## The sheet is the work order

The 2D game is not missing character art. Counted and verified against the filesystem rather
than estimated, the normal-outfit matrix is **complete**: nine species × thirteen weapons ×
three stances = **351 sprites, every combination present**, no holes. Around it sit 41 root
frames (9 idle, 8 walk-a, 8 walk-b, 8 work, 8 portraits), 16 downed bodies, and a Red Hats
faction of 261 covering seven of the nine species — no pig-foreman, no pig-director. 660 in all.

That inverts how this work should be described. **The 3D line is more advanced, not more
complete.** It has better bodies — rigged, painted, animated, twelve characters where the sheet
has nine, twelve weapon models where the sheet paints thirteen poses of them — but as a *source
of sprites* it currently emits one weapon in a handful of poses. The sheet is the specification,
and every slot in it is a slot the bake has to fill before anything can be swapped wholesale.

Measured against that work order, the harness today reaches roughly **5%**: one weapon of
thirteen, two stances of three, no prone. The items below are therefore not polish. They are
almost the entire job.

## What is still in the way

1. **The weapon matrix.** `animal-motion.html` equips one Mosin-Nagant at load and builds the
   battle posture around it. `worker.equipWeapon()` mounts a different asset happily, but
   *posture*, not `equipWeapon`, is what moves the gun to the carry anchor and makes it visible,
   and posture is built once per animal. Swapping therefore leaves the rig holding an invisible
   weapon at the origin, which bakes as a flawless sprite of an unarmed character. The baker
   refuses this. The fix is to bake from an entry point that builds posture per weapon —
   `battle-3d.html` already calls `createWeaponModel(unit.weapon)` per unit — or to rebuild
   posture in the study page.
2. **Prone.** The sheet is fully stocked with prone: 45 in `stances/` and 72 in
   `weapon-expansion/normal`, every species and every weapon. What is missing is a way to *bake*
   it — the study timeline runs walk → kneel → aim → fire → stand and never goes prone. Prone
   lives in `animal-prone-motion.js` behind the viewer's `proneStudy` flag, with `proneAim`
   tuning per animal in `animal-motion-catalog.js`, so the body exists and the entry point does
   not. This is one stance of three, so it is a third of the matrix.
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

| # | Stage | Slots it unlocks | Depends on | State |
| --- | --- | --- | --- | --- |
| 1 | Projection proof, baker tool, in-game drop-in | ~5% reachable | — | **done, this document** |
| 2 | Per-weapon posture so the full weapon matrix bakes | 1 weapon → 13 | — | not started |
| 3 | Prone from `animal-prone-motion.js` | 2 stances → 3 | — | not started |
| 0 | Decide raw bake vs. painted-over underlay | gates 4 | — | **needs a decision first** |
| 4 | Re-bake the 351 normal-outfit slots | the sheet | 0, 2, 3 | not started |
| 5 | Headings: `characterArt(…, heading)`, retire `ctx.scale(u.facing,1)` | ×8 per slot | 4 | **needs a decision** |
| 6 | Red Hats faction, 261 slots over seven species | the faction | 4 | not started |
| 7 | Bull, rabbit and dog as playable species | +3 species | 4 | not started |
| 8 | Portable sheet: spec + manifest so the set drops into another game | the point | 4 | not started |

Stage 0 is numbered out of order deliberately: it is cheap, it is a judgement rather than a
build, and getting it wrong is only discovered after several hundred sprites have been baked.
Both this work and the scenery port arrived independently at the same caution — the 3D branch
shades at runtime while a sprite painting carries its own light, so a render may be an underlay
to paint over rather than the finished article.

Stage 8 is what the direction actually asks for. The sheet is meant to be a module that can be
recycled into other isometric projects, which makes the manifest, the 243 baseline and the 2:1
convention the deliverable — not the PNGs.
