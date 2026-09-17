# Hybrid migration review record

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
