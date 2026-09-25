# Scenery port: what is left, 24 September 2026

Start here if you are picking up the scenery port. The plan itself is
[SCENERY-PORT-HANDOFF.md](SCENERY-PORT-HANDOFF.md), and it holds every parcel's full brief and delivered
record. This page is the short list of what is **not** done, in the order I would take it, and what
each item waits on.

Parcels A, S1, S2 and K are merged. B (lamps) and C (towers) are built, reviewed and waiting to merge.
Everything below is either a decision, a parcel nobody has started, or a follow-up that B or C left on
purpose and wrote down.

## 1. Waiting to merge: four stacked PRs

Merge them bottom-up, in this order. Each one is based on the one before, so merging out of order
drags the lower ones in unreviewed.

| PR | branch | what | review |
| --- | --- | --- | --- |
| [#19](https://github.com/Syntaxswine/animal-factory/pull/19) | `tactics-scenery-docs` | re-lands the scenery docs a merge left behind; records Stage 0 as closed | — |
| [#20](https://github.com/Syntaxswine/animal-factory/pull/20) | `tactics-scenery-baker` | `tools/bake-scenery.mjs` and SCENERY-BAKE.md | — |
| [#21](https://github.com/Syntaxswine/animal-factory/pull/21) | `tactics-lighting` | parcel B, seven lamps and fires; [LIGHTING.md](LIGHTING.md) | 7 → 8 → **9/10**, gate met |
| [#22](https://github.com/Syntaxswine/animal-factory/pull/22) | `tactics-towers` | parcel C, three towers and the spotlight; [TOWERS.md](TOWERS.md) | 8 → 8/10, **gate not met** |

At #22's tip, `npm run check` passes 534 tests.

**Before merging #22**, the boss decides one thing: whether to run a third hostile review on it. The
review cap allows two rounds and then asks. Neither round found anything broken in the game. Both
found checks that claimed more than they proved, and every one of those is fixed. So a third round is a
fair bet at 9/10, and so is sending it to the architect at 8.

**Also open with the boss:** PRs [#16](https://github.com/Syntaxswine/animal-factory/pull/16),
[#17](https://github.com/Syntaxswine/animal-factory/pull/17),
[#18](https://github.com/Syntaxswine/animal-factory/pull/18) and
[#5](https://github.com/Syntaxswine/animal-factory/pull/5) are still open, but their branches are
already ancestors of `tactics-prototype` (checked with `git merge-base --is-ancestor origin/<branch>
origin/tactics-prototype`). Closing them, and removing their branches and worktrees, needs the boss's
yes.

## 2. Waiting on the architect

These are the open questions at the end of the plan. They are ranked by how much work each one is
blocking. The plan has the full text and the measurements.

| # | question | blocks | state |
| --- | --- | --- | --- |
| 1 | Do furniture, cargo, machines, conveyor and the truck become prop kinds at all? | parcels **D, E, F, G, H** | open. D and E are 18 forms already baked and measured, so a yes is cheap |
| 9 | May a relit bake ship as the deliverable? | whether B and C are final or placeholders; how D and E get made | open. B and C both shipped bakes as stated deviations, C on the boss's call |
| 4 | Spotlight instant-reveal overrides sneaking; `STEALTH.md` promises the opposite | parcel **J** | open, a balance call |
| 5 | Edge-mounting convention for `wall-torch` and `gooseneck-sconce` | B's last two kinds; 3D maps carrying them are refused | **half done.** C added `foot`, so the renderer can draw a prop anywhere. What is left is which edge, and what rotation means for it, because rotation here is a mirror and there a quarter turn |
| 6 | Sorting and dimming for three-story props | nothing now | **answered** for the canonical towers by the boss (see-through). Still open: per-column sorting (§3) |
| 8 | Scenery at the 3D line's world scale, or the sprite sheet's animals? They differ by 9% | every baked parcel inherits it | open. B and C both used the 3D scale |
| 7 | Should the 1254² asset gate flex per entry? | disk and load time, not correctness | open. It wants a per-entry budget, not one number |
| 2, 3 | Mature trees repaint or upscale; does the game want a day cycle | nothing now | no answer recorded. A shipped the trees and S2 shipped the clock, with every map still opening at 08:00 unwashed |

## 3. Ready to build, no decision needed

In the order I would take them.

1. **Parcel I: artificial light and detection.**
   - It depends on S2 (merged) and B (#21), so it can start as soon as #21 merges, or be stacked on it.
   - The brief is in the plan: port the 3D branch's `light-sources.js`. That is the emitter offsets, the
     30-tile range, the stepped falloff, and `lightEnabled` with `lightMode` and condition.
   - Both B's and C's maps already keep `lightMode`, and C's keep a spotlight's `lightTargets`. Tests pin
     both, so I has data to read from day one.
2. **Flickering flames on B's four fires.**
   - The flames are baked into the sprite and do not move.
   - `app.js` needs to push per-prop flame pieces into the paint sort. S2's `propPieceDepth` in
     `paint-order.js` is the depth rule, and nothing calls it yet.
   - This is a drawing job against `flame-effect.js`, which B owns. There is no 3D source.
3. **Per-column sorting for tall props (C).**
   - A tower is one sprite sorted at its front corner, so an animal beside a front face is painted
     over.
   - The see-through fade hides the problem whenever the player looks there. The real fix is cutting
     a tall sprite into vertical strips, each sorted at its own depth.
   - That is a change to `app.js`'s draw loop and belongs to whoever holds `app.js`. Ask the architect
     first (open question 6's remainder).
4. **Small follow-ups C wrote down** ([TOWERS.md](TOWERS.md), "Not done"):
   - see-through in the map editor, which draws props through the same renderer but has no fade;
   - two `app.js` wiring mutants that `tools/see-through-proof.mjs` cannot see: the fade assigned
     instead of multiplied (only differs on a fogged tower) and the body point at other zooms. Adding a
     fogged-tower case and a zoomed case to the proof would close both.
5. **Small follow-ups B wrote down** ([LIGHTING.md](LIGHTING.md)):
   - Drop the two registration marks from the lamps at their next re-bake; `foot` has made them
     redundant.
   - Widen `tests/tactics-new-props.test.mjs` from `PROP_ART` to `GROUP_PROP_ART`. Today it sweeps no
     Stage 1 prop at all. It is a shared file, so this belongs to the integrator.
6. **Tooling vocabulary.**
   - The baker's manifest and SCENERY-BAKE.md say "float" and "sink" about where a model's base sits
     against the anchor, but the drawn error goes the other way.
   - C corrected the console output and added notes. Renaming the manifest fields themselves would
     touch B's tests and C's docs, so it wants one sweep of its own.

## 4. Not in the plan yet: climbing

The plan said climbing "is not wired on either branch". That was wrong: the 3D branch has had climb
actions since 22 September (`4a49177`). There, a tower has four posts 6.36 units up, and a guard can
start on one (`towerPost`). A shell of open windows blocks sight and shots, and there are ladder and
stair journeys with their own animation.

Here, a tower is a solid footprint that blocks nothing above the ground. **A 3D map that starts a guard or
a squad member on a tower post is refused here**, and a test in `tests/tactics-towers.test.mjs` pins
that. Porting climbing is a gameplay parcel, not an art one: elevation, sight, shots and movement. It
needs its own brief from the architect before anyone starts it.

## 5. Blocked or last

- **Parcels D–H**: open question 1. The baker has no adapters for `machines`, `conveyor` or `vehicles`
  yet; add one there rather than starting a second tool.
- **Parcel J**, sweeping spotlights: needs I first, and open question 4.
- **Parcel M**, repainting the existing catalog: runs alone, because it rewrites PNGs every other parcel
  reads. Take it first or last, never interleaved.
- **The fourteen gallery towers**: open question 1.

## 6. For whoever runs the next session

- **Check the 3D tip before baking anything.** Run
  `git fetch codex "refs/heads/*:refs/remotes/codex/*"`, then `git log <baked commit>..codex/project/tactics-3d`
  on the library file. B baked at `8e7140f`, C at `b23334c`. The tip was still `b23334c` when this was
  written.
- **Tools that proved themselves:**
  - `tools/bake-scenery.mjs --light=catalogue` for the look.
  - `foot` (automatic from the manifest) for placement.
  - `tools/see-through-proof.mjs` for anything drawn by `app.js`, which does not import in node: shoot
    the real game with and without the branch via `page.route`, and include a case that must *not*
    differ.
  - A mutation sandbox that copies the tree and passes unmutated before any mutant counts.
- **Traps, each cost time here:**
  - The Browser pane runs at most five dev servers per folder, and in a hidden pane
    `requestAnimationFrame` does not fire. Headless Edge through playwright-core is the dependable route.
  - `tools/catalog-environment.py` rewrites every `prop-art-*.js`. On Windows the ones you did not
    change differ only in line endings; restore them with `git checkout --` before staging.
  - Stage files by name, never `git add -A`: several sessions share this clone.
  - In the permission mode used here, a script that rewrites tracked files in place was refused as
    destructive, while the Edit tool was not.
  - The hostile-review cap is two rounds, then ask the boss.

Local environment, for the same machine:
- Worktrees are `AI/animal-factory-tactics-lighting` and `-towers`, plus the 3D reference
  `AI/af-3dref-towers`, detached at `b23334c`.
- The `animal-factory-tactics-towers` entry in the root `.claude/launch.json` serves port 4387.
- playwright-core is borrowed from `AI/wasteland-crystals/node_modules`.
