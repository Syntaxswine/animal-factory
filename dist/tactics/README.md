# Red Shift / mechanics test

Run `npm run serve:tactics`, then open http://127.0.0.1:4327/tactics/index.html. The map editor is at http://127.0.0.1:4327/tactics/editor.html and is linked from the game. The Animal Factory builder remains at `/index.html`.

## Local maps and overmap

The initial factory has four squad members and twelve guards. The overmap connects Factory test ↔ Yard test ↔ Workshop test, each with a distinct local layout. Gather every living squad member within two tiles of the blue travel marker, finish any active encounter and stop queued movement before traveling. Open **Overmap** to select an adjacent location.

Each visited map remembers its guards and explored terrain. Health, equipment, loaded ammunition and casualties follow the squad. Clearing a map leaves it walkable. The run remains in memory until restart or reload; this is not a campaign-save system yet. Opening the editor preserves your game in its existing tab.

Walls occupy shared tile edges, not whole tiles. Both neighboring tiles remain usable. Walls block crossing, sight and firing in either direction. Door edges are open passages in this slice; there is no open/close-door action yet. Crates occupy a whole tile and provide directional cover.

## Placement editor

Click or drag to paint yard, concrete, crates, walls, doorways or erased barriers. Wall tools snap to the nearest tile edge; other tools snap to tile centers. Click **Room block** to stamp a small room or workshop with floor, perimeter walls and two openings; rotation swaps the footprint dimensions. Units retain their own movement tiles inside and outside the walls.

Choose **Squad start** and a member to move one of the four starts. Choose **Guard start**, species and weapon to place a guard or edit one already present. Erase guards with **Erase guard**. Up to twelve guards are supported; zero-guard maps work for exploration tests. **Travel marker** moves the gathering location.

**Generate** uses the given whole-number seed to create a reproducible layout with four starts and twelve guards. **Blank map** and **Factory template** replace the working blueprint. These actions are undoable. A continuous brush stroke is one undo step; Ctrl+Z and Ctrl+Shift+Z also work outside form fields.

**Save draft / Load draft** use browser-local storage, including disconnected drafts awaiting repair. **Export JSON / Import JSON** provide portable backup and sharing. Structurally malformed or oversized imports are rejected without changing the working map. Disconnected maps can be imported, saved and exported, but cannot be playtested until the editor's reachability checks pass.

**Playtest map** opens the current blueprint in a contained game preview; playing does not modify the blueprint. Return to the editor with the preview's top button. The same map schema drives the editor, generator and game. Local maps are fixed at 28 × 24 tiles for now; overmap editing and arbitrary sizes are not part of this slice.

## Combat controls

Select a squad member with 1–4 or the cards. Click ground to walk; hover previews the route and cost. Movement costs 1 AP per tile during combat, and contact interrupts real-time movement. Click a guard or contact button to inspect a shot, then **Attack / F** to confirm. **Space** ends the squad turn; **R** reloads; **B** toggles AK burst; **Escape** stops movement. Right-drag or arrows pan; wheel or +/− zoom; **C** centers; **G** toggles the grid.

The existing test armoury remains: hands, NR-40, TT-33, Mosin-Nagant and AK-47. Everyone can test every weapon. Equip costs 2 AP in combat, reload costs 3 AP, and the AK burst costs 6 AP and three rounds. Magazines persist across switching; reserves remain unlimited in this original combat slice. Finite backpacks, two-slot free swapping, facing cones, medical care and leveling are recorded directions for later implementation, not features claimed in this map-tool update.

Squad: 100 HP, 12 AP and 85 base accuracy. Guards: 45 HP, 7 AP, 55 base accuracy and 65% weapon damage. Existing painted Animal Factory sprites are reused; dedicated armed poses and richer environment art remain future work. Story work is explicitly deferred.

## Verification

`npm run check` validates syntax, gameplay and map/editor/world regressions, plus inherited assets. `npm run check:tactics-balance` runs twenty complete combat simulations using legal actions; the navigation bot knows guard locations, so this is a balance smoke test rather than a substitute for player feedback. Reviews and scope notes are under `docs/tactics/`.
