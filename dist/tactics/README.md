# Red Shift / mechanics test

Run `npm run serve:tactics`, then open http://127.0.0.1:4327/tactics/index.html. The map editor is at http://127.0.0.1:4327/tactics/editor.html and is linked from the game. The Animal Factory builder remains at `/index.html`.

## Local maps and overmap

The initial factory has four squad members and twelve guards. The overmap connects Factory test ↔ Yard test ↔ Workshop test, each with a distinct local layout. Gather every living squad member within two tiles of the blue travel marker, finish any active encounter and stop queued movement before traveling. Open **Overmap** to select an adjacent location. To retreat, or simply to leave on foot, walk a member onto the ground within three tiles of a map edge that has a map beyond it and press **Cross the … edge** under Equipment; it works in combat for one step of AP. Crossers wait on the far border; the squad regroups there when the last standing member crosses or falls. Downed comrades left behind are captured or die.

Each visited map remembers its guards and explored terrain. Health, equipment, loaded ammunition and casualties follow the squad. Clearing a map leaves it walkable. The run remains in memory until restart or reload; this is not a campaign-save system yet. Opening the editor preserves your game in its existing tab.

Walls occupy shared tile edges, not whole tiles. Both neighboring tiles remain usable. Walls block crossing, sight and firing in either direction. Door edges are open passages in this slice; there is no open/close-door action yet. Crates occupy a whole tile and provide directional cover.

## Placement editor

Click or drag to paint yard, concrete, crates, walls, doorways or erased barriers. Wall tools snap to the nearest tile edge; other tools snap to tile centers. Click **Room block** to stamp a small room or workshop with floor, perimeter walls and two openings; rotation swaps the footprint dimensions. Units retain their own movement tiles inside and outside the walls.

Choose **Squad start** and a member to move one of the four starts. Choose **Guard start**, species and weapon to place a guard or edit one already present. Erase guards with **Erase guard**. Up to 46 guards are supported (50 characters including the squad); zero-guard maps work for exploration tests. **Travel marker** moves the gathering location.

**Generate** uses the given whole-number seed to create a reproducible layout with four starts and 46 guards. **Blank map** and **Factory template** replace the working blueprint. These actions are undoable. A continuous brush stroke is one undo step; Ctrl+Z and Ctrl+Shift+Z also work outside form fields.

**Save draft / Load draft** use browser-local storage, including disconnected drafts awaiting repair. **Export JSON / Import JSON** provide portable backup and sharing. Structurally malformed or oversized imports are rejected without changing the working map. Disconnected maps can be imported, saved and exported, but cannot be playtested until the editor's reachability checks pass.

**Playtest map** opens the current blueprint in a contained game preview; playing does not modify the blueprint. Return to the editor with the preview's top button. The same map schema drives the editor, generator and game. Local maps are 240 × 240 tiles: 10 × 10 sectors of 24 × 24 tiles, with three walkable levels. Overmap editing is not part of this slice.

## Combat and character controls

Select individually or Shift-click cards/characters to form a group. Select all on layer gathers the current floor. Click ground for a formation order; Escape stops it. Standing/kneeling/prone costs2/4/8AP per cardinal step and diagonals cost1.5times. Sneaking adds2AP before the diagonal multiplier. Contact cancels movement.

Choose a facing and Turn for free. Sight is a species lobe rather than a flat cone: a wide total field with a narrow binocular core, full 60-tile identification on axis and shorter identification toward the edges, 75 tiles for landscape, all sharing terrain occlusion. Off-axis, a moving enemy is only glimpsed (an unknown-movement marker, no name or targeting) and a still one is missed; guards that glimpse you investigate rather than open fire. The cone guide draws both lobes. Sources and parameters are in docs/tactics/SIGHT.md. A gunshot alerts every guard within twice the weapon's range, whoever fired it (docs/tactics/GUARDS.md). Click an enemy, choose head/weapon/torso/legs (torso is selected by default), click again to fire; hover shows odds. Overwatch reserves one normal shot for the enemy turn. Turning, moving or changing equipment cancels it without refund.

Two equipped weapons swap for free. Equipping either ready slot from storage costs3AP in combat. Reload costs3AP and transfers finite compatible reserves. The backpack is a4×4grid. Rifles and assault rifles use two adjacent cells; pistols, ammo stacks and utilities one. Two ready slots each hold one rifle-sized weapon outside the backpack. The current catalog supports one weapon of each type. Drop/pick up and adjacent teammate transfers preserve loaded rounds. Nearby loot appears in the backpack panel; golden diamonds mark piles.

Choose Easy or Standard for the next run, then Restart. Easy automatically stabilizes fallen workers; Standard gives six squad-turn ends for medkit treatment. Stabilized workers return at5HP after the encounter. On whole-squad defeat, stabilized mercs are captured and bleeding mercs die. The run retains a captured roster; the mid-to-late-game rescue facility and campaign continuation are planned, not yet playable. Wire cutters and medical skill retain their existing rules.

Each defeated guard grants25sharedXP; every100XP gives a level and3assignable points, up tolevel10. Train between encounters using the character sheet. Species traits and trainable shooting/medical/stealth/vitality/mobility are separate. Values remain provisional; there are no respecs. Story direction is recorded in docs/tactics/STORY.md; campaign story systems are not yet implemented.

## Verification

`npm run check` validates syntax, gameplay and map/editor/world regressions, plus inherited assets. `npm run check:tactics-balance` runs twenty complete combat simulations using legal actions; the navigation bot knows guard locations, so this is a balance smoke test rather than a substitute for player feedback. Reviews and scope notes are under `docs/tactics/`.

## Large maps and height

Use **Level** to inspect floors, **Sector X/Y** (1–10) and **View sector** to navigate, or **Overview / Fit map** to see the complete map. Double-click the overview to enter a sector. In the game, clicking the minimap also opens a sector. The editor offers a 24 × 24 room block. Zoom in before placing tiles.

Upper levels begin as empty space. Paint concrete or stamp rooms, then use **Stairs up** on level 1 or 2 to create floor endpoints and connect the next floor. **Erase stairs** removes connections touching the current floor; **Remove floor** creates openings. Starts and stairs are protected from blocked or missing support.

In the game, stand on a cyan stair marker and use **Stairs ↑ / ↓**. Transitions cost 2 AP in combat. Each floor has its own walls, occupancy and visibility. Solid floors block fire; stairs and platform edges can allow cross-level shots. Contact and squad labels show actor levels.

Version-1 drafts and JSON maps migrate into the larger ground plane; existing contents and boundary walls remain. New portable JSON files use version 2 with a 4 MB limit. Reachability checks run in a background worker before playtesting.

Validation: 109 automated checks pass; the original 12-guard factory balance smoke test wins 20/20 seeds. Full 50-character maps have separate population, pathfinding and enemy-turn checks. At current visual pacing, the worst-case all-alert guard turn takes about 41 seconds despite under one second of measured simulation CPU time.

## Environment palette and sector rules

The editor now places all 28 supplied environment assets: eleven props, eleven wall/fence/window/door materials and six walkable ground textures. Select **Environment prop**, choose its type, and use **Rotate room / prop** to turn its full footprint. **Erase prop** removes the entire object from either occupied cell. Material selection applies to **Wall edge**; fences and railings block crossing without blocking sight. Tall crate stacks block sight, low props provide directional cover, and pallets remain walkable. **Ground texture** paints the chosen texture.

Choose **Layout rules → River north–south / two bridges** or **River east–west / two bridges**, then Generate. The 100 sectors are assembled using matching land, road and water connections. Both bridge decks and complete approach corridors must remain open. The river is straight in this first template set; winding rivers, branches and a general rule-authoring UI remain future work. Water is impassable, bridge decks walkable. Use Fit map to see the full plan.

**Ladder up** connects the next floor for 3 AP, while stairs remain 2 AP. Climb buttons display the connection type and price. Gun range uses horizontal distance plus one extra tile per level uphill; downhill has no range penalty or bonus. Downward sight still increases by one tile per level. Uphill fire takes a 15-point cover penalty; stronger ordinary cover replaces this penalty rather than stacking. Solid floors and walls always retain their sight-blocking behavior.

Window walls block walking and provide cover. Shots and sight use a central aperture (middle 70% of the edge, height 1.0–2.4 within a 3-unit floor); solid sills and outer wall portions still block rays. Closed steel/wood door poses are static barriers for testing, and the open concrete doorway is passable. Door opening/closing is not implemented in this slice.

**Roof climb** marks an optional climbable edge: paint an upper roof tile, return to the lower level, then click the neighboring foothold close to that edge. The foothold must have empty space above it and the upper edge must be open. Gold R arrows mark both ends. Climbing up or down costs 6 AP and changes height by exactly one level. Use the climb buttons or click the destination on its level. Erase roof climb removes the link from either end. Roof links do not create stair holes through floors.

## Stances

Standing, kneeling and prone movement costs 2, 4 and 8 AP per horizontal tile. Use the stance buttons beside the selected character. Any change to another stance costs 2 AP in combat, including standing directly to prone; repeating the current stance costs nothing. Changes are free in exploration. Movement must stop before changing stance. Climbing requires standing and retains its existing fixed AP cost. Stance persists between turns and local maps. Guards currently remain standing and pay 2 AP per tile.

Map labels use [K] for kneeling and [P] for prone; standing has no suffix. Character artwork still uses existing idle/walk frames. Stance-specific shooting, cover, sight and stealth effects are not part of this movement-cost change.

## Reusable blocks and saved designs

Choose **Design size** to switch between a240×240 map and a24×24 block workspace. Each workspace keeps its own current design and undo history during the session. Blocks include all three levels of terrain, walls, props, guards, stairs and roof climbs. Squad starts and travel markers belong to full maps.

**Save design** updates the current named browser-library record; **Save new copy** creates another record. Choose a record and **Open selected** to reload it. Saves use IndexedDB and remain local to this browser, device and website origin. **Export design JSON** creates a portable backup; **Import design JSON** recognizes either format. Existing full-map drafts still load. Export localhost designs before moving to a hosted editor: browser storage does not migrate automatically.

In the full-map workspace, choose Sector X/Y and **Save sector as block** to capture it. Choose a saved block and **Place selected block** to replace that sector on all three levels; Undo restores it. Placement preserves squad starts/travel markers and rejects conflicts, broken river rules and objects crossing sector boundaries. Blocks become playable when placed into a valid full map.

## Live GitHub Pages

- Game: https://syntaxswine.github.io/animal-factory-tactics-pages/tactics/index.html
- Editor: https://syntaxswine.github.io/animal-factory-tactics-pages/tactics/editor.html

Pages publishes the public distribution repository. Run `npm run build:tactics-pages` after source checks, then commit and push the reviewed `.pages-output` distribution to update the live site. Publishing the private development branch alone does not update Pages.
