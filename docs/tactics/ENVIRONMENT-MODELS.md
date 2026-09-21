# Modeled environment milestone — 21 September 2026

The environment workshop at `tactics/environment-gallery.html` exposes 47 props,
16 boundary types, 11 terrain types and two access structures. The hybrid game
and editor now use the same presentation models for props and boundary details.
The standalone older `hybrid-viewer` remains a historical geometry/material lab.

The new catalog includes branching broadleaf trees, layered pine crowns, roots,
shrubs, cattail reeds, round drums and hoops, rounded sandbags, braced wooden
containers, open chests, front-opening medicine cabinets and shelves, workbench
vises, beds and castors, sinks and taps, IV stands, lab equipment and loose tools.
Equipment uses painted steel independently of architectural corrugated metal.
Chain-link fences have clipped diagonal wire geometry. Water has continuous
animated normal highlights rather than a static blue material. The gallery
includes courtyard and clinic compositions, orbit, zoom, wireframe, automatic
rotation, and portrait controls/camera fitting.

## Scope and remaining limits

These are stylized low-poly models, not individually sculpted/painted final art.
Sloped roof undersides now use a continuous wedge rather than eight box steps;
roof tops deliberately retain the saved flat walkable datum. Corrugated roof
ribs and parapets remain geometric details. The main sprite game and default
renderer are unchanged. Character studies are still separate from gameplay.

Presentation descriptors are separate from collision boxes. `environmentVisuals`
does not mutate map data or the world's query volumes. New trees, curved props,
fence wires and cabinet doors therefore do not redefine hits, movement or sight.
The old hybrid prototype's collision rules are still experimental; this is not
the shared-core parity release described in THREED-PROJECT.md.

Rendering retains material/shape/chunk instancing, unchanged-chunk reuse, fog
and floor filtering. Ten shared primitive geometries are disposed with their
renderer. Gallery shadows are enabled only for inspection scenes. Gameplay and
editor retain their existing lighting budget.

## Independent review and validation

An independent reviewer rated the first pass 8/10 and requested front-opening
cabinet doors, smooth equipment metal, and mobile framing fixes. After those
changes, the reviewer rated the environment milestone **9/10**, conditional on
final required checks and game/editor integration checks; all subsequently passed.
The score does not cover gameplay parity or a default renderer switch.

- `npm run check`: **460/460 tests passed**, including four new catalog,
  geometry, rotation, and collision-preservation checks; asset validation passed.
- `npm run build:tactics-3d`: passed, with all five new browser modules/pages.
- `tools/environment-review.mjs`: all 76 gallery entries, zero browser errors;
  screenshots and results in `environment-review/`.
- Independent browser review: 228 rendered views over three catalog cycles,
  stable chunk identities on identical rebuild, 10 geometries and 19 textures
  after the sweep, rotated rectangular props and desktop/mobile screenshots.
- Editor workflow: pointer placement/erasing, undo/redo, upper roof placement,
  ladder, exact JSON export/import and hybrid playtest passed.
- Full Factory-test map: legacy/hybrid game and editor loading, camera movement,
  game movement and 12 editor undo/redo cycles passed with no unsupported content
  or application errors. Measured hybrid load: 3.17 s game / 2.34 s editor;
  active-pan p95: 33.3 ms / 16.8 ms; retained JS heap: 32.5 / 55.3 MiB.
  These are local Windows/Edge observations, not hardware-independent budgets;
  the check suite ran concurrently during this measurement.

For browser checks set `PLAYWRIGHT_PATH` to an installed Playwright module and
serve `dist` at localhost:4318. `REVIEW_URL` can point the gallery review at the
published site. The full-map and editor workflows derive from the existing
`hybrid-full-browser.mjs` and `hybrid-editor-check.mjs` drivers with their server
port changed from 4389 to 4318; saved results include browser version and timings.
