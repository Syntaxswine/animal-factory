# Hybrid migration review record

## Current visual revision gate

The architect rejected the earlier presentation; numeric calibration is not art
approval. See [visual revision review](HYBRID-VISUAL-REVIEW.md) for the bounded room
and prop sample (4/5 each), preserved-art pose assessment (4/5 evidence, 3/5 sprite
readiness), texture repeats and directional-art requirement. The coordinator's
17 September review now approves the environment direction. Physical sprite
alignment remains open; a directional proof precedes full-map propagation.
See [directional requirements](HYBRID-DIRECTIONAL-REQUIREMENTS.md). Default cutover
has not advanced. Historical stage records below remain for traceability.

## User-approved dimensions

The user explicitly confirmed prototype proportions on 2026-09-17, superseding the proposal's suggestion to retain old dimensions. Tile size 1; walls 2 high and .16 thick; window opening .85–1.55 high across one tile; doorway 1.65 high; standing character 1.65. Kneeling/prone prototype bounds are .7/.28 times standing height. Low cover remains .8 (not defined in the prototype). Slabs are .12 thick.

The prototype has one floor. For multiple floors this implementation derives a **2.12 floor spacing** from the prototype roof top (center 2.06, thickness .12). This is an implementation choice, not a separately approved prototype measurement. Saved integer floor indices stay unchanged. Logical `(x,y,z,h)` converts to Three.js `(x, z*2.12+h, y)`; tiles center on integers and edges on half coordinates. A floor slab lies immediately below its walkable surface. Roof props decorate the existing supported level.

These dimensions deliberately differ from legacy simulation (spacing 3, walls 2.7, standing 1.8, window 1–2.4). The optional slice does not change live gameplay. Integration must record changed shot/sight results instead of silently assuming old geometry parity. The fixed gameplay camera uses 45° azimuth and 30° elevation for 2:1 diamonds; orbit remains diagnostic.

## Stage 1 — shared-map vertical slice

Implemented: current-format JSON fixture (four valid starts, two displayed mercs), DOM-free geometry adapter, shared boxes for meshes and intersections, chunk-indexed segment queries, stable structural IDs, transactional rebuilds, door/window/roof/floor/low-cover subset, explicit unsupported-content diagnostics, map preservation, local browser viewer and Node driver. Existing command drivers call engine exports directly; no command-interface module or branch was found, and this stage adds no competing gameplay API.

Run `node tools/hybrid-slice.mjs`; serve with `node tools/serve-tactics.mjs` and open `/tactics/hybrid-viewer.html`. Fixture generation is reproducible with `node tools/create-hybrid-fixture.mjs`.

Deferred to subsequent gates: combat integration, stance/facing body calibration, surface materials, full catalog, editor integration, performance budgets and default cutover. The viewer's roof toggle edits the fixture geometry; it is not a presentation-only roof hiding policy. No gameplay outcomes change at this stage.

Review and verification results are recorded below as completed.

Stage 1 gate: hostile review 4/5; 350 repository tests and asset checks passed; six focused geometry tests and browser acceptance passed. Screenshots: hybrid-review/stage-1.png and stage-1-bounds.png. Reviewer noted coincident roof surfaces (fixed), duplicated dimension literals (carry into integration), and stronger actual-camera checks (carry into integration).

## Stage 2 — simulation integration

Optional createGame geometryMode=hybrid selects the shared structural intersection backend. Existing movement/AP/attack actions remain authoritative; bullets, pellet shots, LOS and swept explosive paths use the optional backend. Body regions are stance- and facing-aware, including horizontal prone head/torso/legs/weapon volumes. Cache invalidation follows door changes, refresh after map edits, and destruction. The browser engine-replay button invokes the same deterministic diagnostic replay as Node; full events and state are compared across runtimes. The replay explicitly uses unrestricted diagnostic knowledge and is not a player observation API.

Deliberate differences: window aperture is .85–1.55 instead of 1–2.4 (a ray at height 1.8 now hits the lintel); open doorways have a 1.65 lintel; upper slabs are at 2.12 per level; wall thickness .16 produces front-surface impacts rather than edge-center impacts; prone footprint rotates with world heading; standing muzzle is 1.2. Existing tile/AP/range budgets and random scatter distributions remain unchanged. Blast near-surface tolerance accounts for half the new wall thickness so a wall cannot shield its own center from destruction. Visual stance/region calibration and full catalog support remain later gates; unsupported hybrid content fails explicitly.


Stage 2 hostile review: initial 3/5 (surface-origin blast self-occlusion, requested zone overriding physical region, and pellet aim missing prone XY); corrected and re-reviewed 4/5. Seven focused hybrid combat tests pass. Browser/Node replay and targeted boundary probes compare exact serialized outputs. Hybrid impact coordinates/distances use 1e-10 world-unit event precision to remove observed last-bit Math.hypot differences between the tested Node/Edge V8 builds. This is not a proof across every browser/platform. All legacy projectile/explosive checks and Pages module checks pass. Full-suite final result follows.

Stage 2 final verification: 357 tests passed, asset checks passed, browser replay and boundary probes passed. Stage 2 gate accepted at 4/5.

## Stage 3 — visual/material validation

Procedural flat surface textures use world-space UVs: bricks are .5 wide and .2 per course, independent of wall lengths/heights. The material gallery includes one- and two-storey buildings, corners, window lintels, open metal stair treads, and roof edges. Roof modules reuse floor surfaces; no coplanar duplicates. Tread boxes are shared visual/collision descriptors (open risers). Diagnostic cutaway hides meshes only, preserving collision.

Sprite alpha bounds are measured from the reused assets. Standing and kneeling opaque height follows physical height; prone cards follow the projected world body axis and fit its oriented bounds, avoiding horizontal poses for vertical projected headings. This is a bounded silhouette approximation, not new directional artwork or exact anatomical registration. Debug anchors, region centers and muzzle tips make it inspectable. The physical muzzle now starts at the held-weapon region tip, so close geometry and roof-edge clearance can differ from the previous body-center source. Roof regression shooter was moved one tile inward to continue exercising an underside impact after this deliberate source change; original expectations for underside shielding remain unchanged.

Visual suite covers 72 combinations (horse/cow/skunk, all stances, eight headings, both uniforms), three zooms, foreground wall/full roof occlusion, and a material comparison. Nearest magnification preserves sprite pixels; surfaces use mipmaps and anisotropy. Screenshots are in hybrid-review/stage-3*.png.


Stage 3 hostile review: initial 3/5 for upright weapon/muzzle mismatch. Corrected with a bounded mesh warp around measured rifle barrel landmarks. The physical muzzle is now an explicit UV grid vertex so interpolation cannot move the painted tip off the source point (a kneeling-skunk interpolation error found by browser checks was fixed this way). Independent re-review 4/5, conditional on final checks. This approves rifle calibration only; other weapon silhouettes require explicit handling in stage 4. The artwork warp is a deliberate visual compromise, not replacement directional artwork.

Stage 3 final gates: all 72 rendered calibration cases passed the .05-tile muzzle error limit, 360 repository tests passed, and asset checks passed. Hostile review 4/5.

## Stage 4 — editor and full-map integration

Implementation is available for validation at `tactics/index.html?renderer=hybrid` and `tactics/editor.html?renderer=hybrid`. Both use `HybridRenderer` and the same geometry adapter; campaign creation, restart and travel preserve the geometry option. Existing buttons/actions, AP, seeded combat and saved-map schema remain authoritative. No new command API or map version was introduced. Above-level geometry is hidden in this validation renderer; lower levels remain solid. The layer legend reflects this behavior.

The full environment catalog has explicit geometry families: open-legged furniture, crates and open containers, lab/medical equipment, trunk/canopy foliage, small equipment, roof details and ladders. All 63 prop/edge entries appear in `hybrid-review/stage-4-environment-catalog.png`. These are simple box-based silhouettes, not final sculpted models. Water is a static blue surface; barrels are blocky; sloped roofs use eight stepped underside strips that rise to the saved walkable roof datum. Roof tops remain walkable at the canonical floor height. A parapet is .4 high; it does not change tile movement rules. Transparent fences/bars preserve their existing movement-blocking but sight/shot-transparent policy, including gaps and cut fences.

New deliberate collision differences: shots can pass between furniture legs and through gaps around tree trunks/canopies; full-cell legacy cover did not expose those gaps. Roof parapets and sloped undersides, ladder rails/rungs and stair treads are real ray obstructions. These visible parts and intersection volumes share descriptors and stable IDs. Woodland attenuation remains a separate perception policy. The physical 2.12 floor spacing now also determines hybrid terrain-visibility distance; legacy mode remains unchanged. Prototype wall, opening and character dimensions remain as recorded above.

Travel/stair/roof-climb markers, guard heading/start labels, sight cones, overlays, picking and playtesting are retained. Hybrid flame effects project the physical muzzle instead of legacy sprite pixels. Weapon calibration explicitly excludes non-guns, uses authored flamethrower nozzles, and measures firearm barrel tips. Pig-director loadouts without dedicated expansion artwork retain composed equipment overlays with explicit anchors; generic firearm overlays are a documented fallback. `hybrid-catalog-browser.mjs` exercises 702 species/weapon/stance/uniform combinations and eight headings where a muzzle exists. The numeric checks verify anchor mapping, not anatomical or artistic accuracy; the horse source contact sheet provides visual evidence across all weapons. Rifle presentation has the earlier 72-case rendered review.

Instanced structures are grouped by material and 16-tile chunks; unchanged chunks survive edits and replaced instance buffers are disposed. One shared box geometry and a finite material palette bound structural allocations. Invisible actor geometry is disposed; pose textures use an LRU cap of 64 (active actors cannot exceed the map's 50-unit limit). Character textures have no mipmaps, and the existing maximum 512×256 source dimensions bound 64 RGBA poses to approximately 32 MiB before driver overhead. The 90-pose browser sweep reached exactly 64 cached poses, one active actor, 65 GPU textures including its surface, and two geometries. Explicit disposal clears textures, actor resources, chunks and scene references.

Verification: the real Factory-test 240×240 map loads in both game and editor without unsupported-content diagnostics. Browser tests use actual camera dragging, unit movement, pointer wall painting and twelve undo/redo cycles. A separate editor workflow covers prop placement/erasing, undo/redo, upper parapet roof placement, ladder placement, exact JSON export/import and the hybrid playtest iframe. Headless campaign travel/return preserves mode and squad health. Shared-room browser/Node deterministic replays and boundary probes still pass after catalog changes.

Recorded same-machine measurements (Windows, Node 24.15.0, headless Edge; exact browser version in JSON; 1440×1000 viewport):

| Workload | Legacy | Hybrid |
| --- | ---: | ---: |
| Full-map game load | 1.151 s | 1.082 s |
| Full-map editor import/load | 1.866 s | 2.087 s |
| Active camera p95 frame interval, game/editor | 16.8 / 16.8 ms | 16.8 / 16.8 ms |
| Maximum of 12 editor undo responses | 114 ms | 172 ms |
| Retained game/editor JS heap after explicit GC | 10.8 / 8.2 MiB | 31.9 / 50.1 MiB |
| Node create with visibility, three trials | 269–346 ms | 689–824 ms |
| Node 1,000 geometry queries, three trials | 19–27 ms | 29–41 ms |

These are local measurements, not guarantees for other hardware. Browser load includes network-idle waiting; editor import includes a fixed settling wait. Edit response includes Playwright/UI dispatch and rendering. Active camera frame intervals include browser scheduling; `drawTimes` separately record CPU render submission/canvas copy, not isolated GPU time. Uncollected editor heap peaked at 193 MiB in the recorded run and fell to 50 MiB after GC. Source JSON files and repeatable tools are in `hybrid-review` and `tools`. An earlier full-rebuild implementation reached 552 ms on undo; unchanged-chunk reuse reduced the recorded maximum to 172 ms.

Review status: initial hostile review 2/5, followed by implementation approximately 4/5 after fixes; **overall Stage 4 remains 3/5 pending performance-budget agreement**. Proposed limits sent to the user: load ≤4 s, active-view p95 frame interval ≤33 ms, editor response ≤500 ms, retained JS heap ≤200 MiB, and 1,000 geometry queries ≤50 ms on this machine. They are not yet agreed. Stage 5/default cutover, old-renderer removal and deployed Pages publication have not started. Integration remains on the separate sprite-migration branch for the coordinator.

Stage 4 final verification: 362 repository tests and asset checks passed; shared-room browser replay/boundary regressions passed; editor interaction/export/playtest and 702-case catalog/cache checks passed; the Pages distribution builds with all 83 app files and local assets. Overall gate remains pending the user’s budget agreement; no default switch or deployment was performed.
