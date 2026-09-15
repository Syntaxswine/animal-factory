# Local maps, overmap and editor

Historical design record. The current implementation expands this foundation to 240 × 240 tiles, 24 × 24 sectors, three levels and 50 characters. See SCALE.md for current behavior.

Mechanics-only scope. Story work is deferred.

1. Walls are canonical shared edges. Both adjacent tiles remain walkable. The same barrier query drives pathfinding, sight, firing and AI. Door edges are open passages for this slice. Crates remain full-tile objects.
2. A three-location overmap connects distinct local layouts. Travel requires no active combat or movement and every living squad member within two tiles of the local travel marker. Keep each local map's guards, discoveries and positions in session memory; carry squad HP, ammunition and equipment between maps. Do not let travel respawn guards or heal the squad. Cleared maps remain traversable. Overmap adjacency limits travel.
3. The editor authors the same versioned map definition consumed by the game. Fixed 28×24 map size initially. Tools: yard, floor, crate, wall edge, doorway edge, erase edge, room stamp, four squad starts, up to twelve guard starts, travel marker. Seeded generation gives a reproducible starting layout. Undo/redo, explicit browser-local draft save/load, JSON import/export and playtest are part of the tool. Validation rejects malformed data, overlapping/blocked unit starts and unreachable starts/exit. Test maps may have zero guards; generated test maps have twelve.
4. Playtesting does not change the blueprint. Editor and live game are separate pages so opening the editor preserves an active game. Draft storage is local to this browser; exported JSON is the portable backup. Overmap run state is in memory only for now, not a campaign save system.

Review each part at >=4/5 before the next. Verify shared-edge geometry, persistence through travel, constraints during combat, authoring/import/undo correctness and generated map reachability. Keep existing individual squad control and combat tuning.

## Area and line painting

Drag Concrete or Floor / roof texture to preview an inclusive rectangle on the selected level, then release to apply. Upper-level floor areas provide roof platforms. Yard, water, bridge and floor removal use the same rectangle gesture. Wall, doorway and edge erasure gestures lock to the starting shared-edge direction and draw a straight line. Selections clip to the active 24×24 block or 240×240 map. Escape and interrupted gestures cancel; each applied selection is one undo entry. Existing saves and JSON exports retain the painted geometry.

Verification: 127 tracked and new shape tests pass, along with syntax and asset checks. An unrelated untracked Red Hats test currently references unfinished assets and was excluded. Browser checks confirmed an upper-floor rectangle, whole-selection undo/redo and a straight wall. Hostile review: 4/5 pass, including 48 outer-boundary probes.

## Procedural block connections

Reusable blocks can declare exactly one of None, Fence, Road, River, Wall or Cliff for each cardinal direction. Assign these in the block workspace, then save the design. Rules survive browser saves, block/map JSON, sector placement, capture and undo. Legacy blocks without rules remain manually placeable and are excluded from connection-based generation.

Connections are checked against the drawing, including after later edits. North/south offsets run west to east; east/west offsets run north to south. Roads are contiguous asphalt boundary strips and rivers are contiguous water strips; width and position must match, and solid seam barriers/props are rejected. Fences and walls continue perpendicular to a boundary: match endpoint position, material and level. Only one such continuation is permitted per direction. A cliff is one change in the highest supported floor along a boundary, matching its position and both elevations. This uses existing upper-floor ledges; no new rock artwork, solid earth volumes or climbing behavior is added. None matches only None at the same flat elevation. Ground road/fence/wall connections do not enforce upper-roof continuity.

The full-map command Generate from saved connected blocks assembles a seeded 10×10 layout from at most 128 saved blocks in their authored orientations. It checks matching neighbors, explicit shared-seam material conflicts, the 46-guard limit and final map validity/reachability. Either neighbor can own a seam barrier; conflicting explicit materials are rejected. Replacement preserves shared barriers belonging to connected neighbors. Outer map boundaries permit connections to continue off-map. Search is bounded to 20,000 nodes and failures leave the map unchanged. It does not automatically rotate blocks, invent missing continuations, guarantee a particular block is used, or enforce global feature counts such as exactly two bridges; the original river generator remains available for that rule.

The supplied road/fence checkpoint validates with north/south Fence and east/west Road. Its original file is unchanged; a regression fixture checks it. Verification: 140 tests plus syntax and asset checks pass. Browser testing confirmed assignment, save/reload, generated 100-block maps and undo. Hostile review passed 4/5 after fixing conflicting shared-seam ownership.
