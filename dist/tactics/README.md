# Red Shift / mechanics test

Run `npm run serve:tactics`, then open http://127.0.0.1:4327/tactics/index.html. The map editor is at http://127.0.0.1:4327/tactics/editor.html and is linked from the game. The Animal Factory builder remains at `/index.html`.

## Local maps and overmap

The initial factory has four squad members and twelve guards. The overmap connects Factory test ↔ Yard test ↔ Workshop test, each with a distinct local layout. Gather every living squad member within two tiles of the blue travel marker, finish any active encounter and stop queued movement before traveling. Open **Overmap** to select an adjacent location.

Each visited map remembers its guards and explored terrain. Health, equipment, loaded ammunition and casualties follow the squad. Clearing a map leaves it walkable. The run remains in memory until restart or reload; this is not a campaign-save system yet. Opening the editor preserves your game in its existing tab.

Walls occupy shared tile edges, not whole tiles. Both neighboring tiles remain usable. Walls block crossing, sight and firing in either direction. Door edges are open passages in this slice; there is no open/close-door action yet. Crates occupy a whole tile and provide directional cover.

## Placement editor

Click or drag to paint yard, concrete, crates, walls, doorways or erased barriers. Wall tools snap to the nearest tile edge; other tools snap to tile centers. Click **Room block** to stamp a small room or workshop with floor, perimeter walls and two openings; rotation swaps the footprint dimensions. Units retain their own movement tiles inside and outside the walls.

Choose **Squad start** and a member to move one of the four starts. Choose **Guard start**, species and weapon to place a guard or edit one already present. Erase guards with **Erase guard**. Up to 46 guards are supported (50 characters including the squad); zero-guard maps work for exploration tests. **Travel marker** moves the gathering location.

**Generate** uses the given whole-number seed to create a reproducible layout with four starts and 46 guards. **Blank map** and **Factory template** replace the working blueprint. These actions are undoable. A continuous brush stroke is one undo step; Ctrl+Z and Ctrl+Shift+Z also work outside form fields.

**Save draft / Load draft** use browser-local storage, including disconnected drafts awaiting repair. **Export JSON / Import JSON** provide portable backup and sharing. Structurally malformed or oversized imports are rejected without changing the working map. Disconnected maps can be imported, saved and exported, but cannot be playtested until the editor's reachability checks pass.

**Playtest map** opens the current blueprint in a contained game preview; playing does not modify the blueprint. Return to the editor with the preview's top button. The same map schema drives the editor, generator and game. Local maps are 240 × 240 tiles: 10 × 10 sectors of 24 × 24 tiles, with three walkable levels. Overmap editing is not part of this slice.

## Combat controls

Select a squad member with 1–4 or the cards. Click ground to walk; hover previews the route and cost. Movement costs 1 AP per tile during combat, and contact interrupts real-time movement. Click a guard or contact button to inspect a shot, then **Attack / F** to confirm. **Space** ends the squad turn; **R** reloads; **B** toggles AK burst; **Escape** stops movement. Right-drag or arrows pan; wheel or +/− zoom; **C** centers; **G** toggles the grid.

The existing test armoury remains: hands, NR-40, TT-33, Mosin-Nagant and AK-47. Everyone can test every weapon. Equip costs 2 AP in combat, reload costs 3 AP, and the AK burst costs 6 AP and three rounds. Magazines persist across switching; reserves remain unlimited in this original combat slice. Finite backpacks, two-slot free swapping, facing cones, medical care and leveling are recorded directions for later implementation, not features claimed in this map-tool update.

Squad: 100 HP, 12 AP and 85 base accuracy. Guards: 45 HP, 7 AP, 55 base accuracy and 65% weapon damage. Existing painted Animal Factory sprites are reused; dedicated armed poses remain future work. Story work is explicitly deferred.

## Verification

`npm run check` validates syntax, gameplay and map/editor/world regressions, plus inherited assets. `npm run check:tactics-balance` runs twenty complete combat simulations using legal actions; the navigation bot knows guard locations, so this is a balance smoke test rather than a substitute for player feedback. Reviews and scope notes are under `docs/tactics/`.

## Large maps and height

Use **Level** to inspect floors, **Sector X/Y** (1–10) and **View sector** to navigate, or **Overview / Fit map** to see the complete map. Double-click the overview to enter a sector. In the game, clicking the minimap also opens a sector. The editor offers a 24 × 24 room block. Zoom in before placing tiles.

Upper levels begin as empty space. Paint concrete or stamp rooms, then use **Stairs up** on level 1 or 2 to create floor endpoints and connect the next floor. **Erase stairs** removes connections touching the current floor; **Remove floor** creates openings. Starts and stairs are protected from blocked or missing support.

In the game, stand on a cyan stair marker and use **Stairs ↑ / ↓**. Transitions cost 2 AP in combat. Each floor has its own walls, occupancy and visibility. Solid floors block fire; stairs and platform edges can allow cross-level shots. Contact and squad labels show actor levels.

Version-1 drafts and JSON maps migrate into the larger ground plane; existing contents and boundary walls remain. New portable JSON files use version 2 with a 4 MB limit. Reachability checks run in a background worker before playtesting.

Validation: 95 automated checks pass; the original 12-guard factory balance smoke test wins 20/20 seeds. Full 50-character maps have separate population, pathfinding and enemy-turn checks. At current visual pacing, the worst-case all-alert guard turn takes about 41 seconds despite under one second of measured simulation CPU time.

## Environment palette and sector rules

The editor now places all 28 supplied environment assets: eleven props, eleven wall/fence/window/door materials and six walkable ground textures. Select **Environment prop**, choose its type, and use **Rotate room / prop** to turn its full footprint. **Erase prop** removes the entire object from either occupied cell. Material selection applies to **Wall edge**; fences and railings block crossing without blocking sight. Tall crate stacks block sight, low props provide directional cover, and pallets remain walkable. **Ground texture** paints the chosen texture.

Choose **Layout rules → River north–south / two bridges** or **River east–west / two bridges**, then Generate. The 100 sectors are assembled using matching land, road and water connections. Both bridge decks and complete approach corridors must remain open. The river is straight in this first template set; winding rivers, branches and a general rule-authoring UI remain future work. Water is impassable, bridge decks walkable. Use Fit map to see the full plan.

**Ladder up** connects the next floor for 3 AP, while stairs remain 2 AP. Climb buttons display the connection type and price. Gun range uses horizontal distance plus one extra tile per level uphill; downhill has no range penalty or bonus. Downward sight still increases by one tile per level. Uphill fire takes a 15-point cover penalty; stronger ordinary cover replaces this penalty rather than stacking. Solid floors and walls always retain their sight-blocking behavior.

Window walls block walking and provide cover. Shots and sight use a central aperture (middle 70% of the edge, height 1.0–2.4 within a 3-unit floor); solid sills and outer wall portions still block rays. Closed steel/wood door poses are static barriers for testing, and the open concrete doorway is passable. Door opening/closing is not implemented in this slice.

**Roof climb** marks an optional climbable edge: paint an upper roof tile, return to the lower level, then click the neighboring foothold close to that edge. The foothold must have empty space above it and the upper edge must be open. Gold R arrows mark both ends. Climbing up or down costs 6 AP and changes height by exactly one level. Use the climb buttons or click the destination on its level. Erase roof climb removes the link from either end. Roof links do not create stair holes through floors.
