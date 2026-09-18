# Hybrid 3D environment and 2D characters: implementation proposal

Status: approach approved for staged implementation; migration is not implemented by this document.

## Purpose and scope

Keep Animal Factory Tactics a tile-based tactical game with low-resolution sprite characters. Replace the environment's painted structural perspective and separate geometric approximations with a shared 3D world model, displayed through Three.js.

The primary goals are consistent sight and projectile obstruction, correct elevation and openings, straight architectural edges, and stable material scale when buildings change size. Existing walls were resized to match character proportions, stretching their artwork. A 3D renderer must solve that problem rather than reproduce it by stretching the same painted wall images onto boxes.

Preserve tile movement, AP, turns, inventory, aiming, seeded randomness, editor workflows, and existing maps. This is not authorization to rebalance weapon ranges, add free movement, replace characters with 3D models, or implement every planned campaign system. Gameplay differences caused by corrected geometry must be identified and reviewed explicitly.

## Prototype verdict

The prototype at `d972983` demonstrates that sprite characters and 3D architecture can work together. Door/window openings and solid surfaces produce the expected simple ray results. Building meshes and shot collisions come from the same boxes, and the geometry module runs in Node without a renderer. The reviewed snapshot passed 344 tests and browser checks.

Approval is for the direction, not a production cutover. The handcrafted room does not load game maps or use the main simulation. Prone character geometry does not match the displayed body footprint. Textures still stretch. The default 35.26-degree camera elevation produces approximately 1.73:1 tile diamonds; the current game's 2:1 projection requires 30 degrees at 45-degree azimuth. The next stages must resolve these gaps.

## Architecture: one simulation, optional rendering

| Component | Responsibility |
| --- | --- |
| Existing map data | Canonical tiles, floor levels, edges, doors, props, starts and links |
| World geometry adapter | Generate structural surfaces, openings, collision primitives and stable object IDs from map data |
| Simulation | Movement, AP, awareness, sight, trajectories, scatter, damage, AI and events |
| Three.js renderer | Meshes, materials, sprite cards, camera, lighting and visual effects |
| Command/observation interface | Explicit actions and player-limited state for UI and headless drivers |

The renderer consumes simulation state and events; it does not decide hits, visibility, damage, or turn advancement. Simulation and geometry modules must import without DOM, canvas, WebGL, animation frames, or renderer initialization. Loading Three.js for graphics must be optional for a headless run.

Inspect and coordinate with the command-interface work before adding another API. Buttons, hotkeys and headless commands must reach the same action functions. Existing headless tools may use thin adapters during migration, not duplicated combat rules.

### Coordinates and dimensions

Keep the existing logical tile coordinates and floor indices in saved maps. Define one documented conversion to the renderer's axes; the prototype uses Y-up while current game code uses x/y ground coordinates and z for levels. Units, heights, ray endpoints, normals and editor picking must all use that conversion.

Choose and record a common dimension table for tile size, floor spacing, floor thickness, walls, openings, stance heights and sprite anchors before building beyond the first room. The prototype's 2-unit walls and 1.65-unit animals are experimental, not a replacement for existing height rules. Correcting proportions must not silently move upper floors or change who can shoot through a window.

### Shared geometry and queries

- Generate the structural mesh and collision representation from the same parameters. Simplified collision is acceptable, but position, dimensions and meaningful openings must agree.
- Share geometric intersection services between sight and projectiles. Retain separate policies for transparent materials, foliage, penetration and perception: something visible need not be shootable, and visible need not mean noticed.
- Preserve the current ballistic/scatter distributions while replacing their intersection backend. Curved trajectories require segment or swept-path queries; a straight ray alone does not implement grenade gravity.
- Door changes, destruction, roof changes and editor mutations must update rendering and collision together and invalidate relevant visibility/spatial caches.
- Return stable object IDs, impact position, distance and surface information so effects use the simulation's actual impact, not a second visual trace.
- Use a spatial index or tile/chunk traversal for large maps. Do not test every projectile against every mesh triangle on a 240-by-240 map.

### Architecture and material scale

Build walls, frames, lintels, sills, corners, floors, roof edges and doors with geometry. Surface textures supply color, brickwork, wear and grain without baked-in isometric perspective. Do not stretch a complete painted wall image over arbitrary faces.

Define material density in world units. A brick course must remain the same height on a short wall, tall wall, pier and lintel; changing dimensions reveals more or fewer courses. Use consistent UV origins so adjacent modules align, with appropriate separate end-cap and trim materials. Use flat repeating material assets, not generated images that must also get architectural perspective and parallel lines correct.

Preserve readable, low-resolution characters. Select texture filtering, mipmaps and render resolution deliberately; compare at normal play scale and at zoom limits before deciding. Avoid accidental blur, shimmer, or lighting that makes unlit painted sprites look unrelated to their environment. Reuse existing character assets first; new surface assets should be a bounded material task.

### Character presentation and physical shape

Characters remain sprite-based and tile-anchored. Use a fixed orthographic gameplay view initially, matching 2:1 tile diamonds. Keep free orbit as a diagnostic control until directional artwork and occlusion are demonstrated to work at other angles.

Define stance- and facing-aware body volumes, including the horizontal footprint of a prone body and the head, torso, legs and held-weapon regions used by aiming. These volumes must remain attached to the character's world pose, not rotate with the camera-facing sprite card. Debug overlays must make intentional approximations visible.

Calibrate sprite anchors, displayed scale, muzzle origins and body regions against representative animals and both uniforms. Occlusion by walls and roofs must preserve transparent sprite cutouts without rectangular masks or sprites visibly intersecting unrelated surfaces. Rendering animations must not advance simulation or change collision results.

## Delivery stages and gates

### 1. Shared-map vertical slice

Replace the handcrafted prototype room with an adapter for one existing map-format fixture: two floor levels, a roof, door, window, solid wall, low cover and two mercs. Use a subset of the existing prop catalog with explicit unsupported-content diagnostics.

Deliver a graphical viewer and Node driver consuming the same map and geometry. Gate: opening/closing the door changes both meshes and collision; changing the camera changes neither; current map JSON round-trips without data loss. Verify coordinate conversion and the 2:1 camera with numeric projection checks.

### 2. Simulation integration

Connect movement, sight and existing projectile/scatter queries to the adapter through current action functions. Replace overlapping geometry logic incrementally rather than maintaining a second combat engine. Keep the prototype query code only where it becomes part of the shared implementation or serves as a small test oracle.

Gate: identical map, seed, commands and simulation steps produce identical gameplay events and final state in rendered and headless modes. Cover standing/kneeling/prone, window and doorway boundaries, upper floors, roof occlusion, nearest impact, friendly fire, misses, explosives, and characters that have left the map. Explicitly record expected differences from the old geometry; do not rewrite assertions merely to make new outcomes pass.

### 3. Visual and material validation

Replace perspective-painted wall skins with surface materials at fixed world density. Validate a character-scale room and a building with different wall lengths/heights, corners, window lintels, stairs and roof edges.

Gate: changing wall height does not stretch bricks; adjacent wall modules maintain material scale; sprite anchors and physical volumes agree across stances and facings; foreground walls and roofs occlude sprites correctly. Supply repeatable screenshots at normal play scale, close zoom and wide zoom, plus collision overlays.

### 4. Editor and full-map support

Have the map builder and game consume the same dimensions and geometry adapter. Preserve painting, selection, roof placement, erasing, undo/redo, export/import and playtesting. Add explicit dimensional metadata only where existing map data cannot express it; supply versioned defaults and migration tests if the format changes.

Gate: support the complete currently playable environment catalog with no silently dropped objects. Test at least one real full-size map, map transitions and repeated edits. Compare frame time, memory, load time and headless simulation throughput with a recorded baseline on the same machine; agree on numerical budgets from those measurements before cutover. Bound texture memory, mesh count and disposal of replaced GPU resources.

### 5. Cutover and cleanup

Make the hybrid renderer selectable during validation, then switch the default only after the prior gates pass. Retain a known-good release for rollback. Remove obsolete runtime geometry and the old renderer once migration is accepted; do not commit to maintaining two full rendering or collision systems indefinitely.

Gate: the main game, map builder and deployed Pages package load all modules/assets locally, browser checks pass, and a headless run requires no browser or GPU. Document any remaining visual compromises and deliberate gameplay changes.

## Verification and builder handoff

Use focused geometry and command tests, deterministic scenario replays, and browser interaction tests. Headless players receive only player-visible observations; unrestricted state remains a separate diagnostic facility. Visual testing remains necessary even when simulation parity passes.

Build the shared-map slice first. Do not undertake a whole-game rewrite before its gate is reviewed. Keep each stage independently reviewable and report: implemented scope, deferred scope, checks/results, representative screenshots, changed gameplay outcomes, and performance measurements where applicable.

Work in a distinct worktree and branch from the latest canonical `tactics-prototype`. Coordinate geometry/schema changes with agents working on commands, gameplay and the map editor through the integration coordinator. Commit only task files and push the branch. Approved changes should be integrated and pushed by the coordinator once relevant checks pass and conflicts are resolved; concurrent work must be preserved. Publishing a proposal or merging an optional prototype does not make the hybrid renderer the default.
