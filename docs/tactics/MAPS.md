# Local maps, overmap and editor

Mechanics-only scope. Story work is deferred.

1. Walls are canonical shared edges. Both adjacent tiles remain walkable. The same barrier query drives pathfinding, sight, firing and AI. Door edges are open passages for this slice. Crates remain full-tile objects.
2. A three-location overmap connects distinct local layouts. Travel requires no active combat or movement and every living squad member within two tiles of the local travel marker. Keep each local map's guards, discoveries and positions in session memory; carry squad HP, ammunition and equipment between maps. Do not let travel respawn guards or heal the squad. Cleared maps remain traversable. Overmap adjacency limits travel.
3. The editor authors the same versioned map definition consumed by the game. Fixed 28×24 map size initially. Tools: yard, floor, crate, wall edge, doorway edge, erase edge, room stamp, four squad starts, up to twelve guard starts, travel marker. Seeded generation gives a reproducible starting layout. Undo/redo, explicit browser-local draft save/load, JSON import/export and playtest are part of the tool. Validation rejects malformed data, overlapping/blocked unit starts and unreachable starts/exit. Test maps may have zero guards; generated test maps have twelve.
4. Playtesting does not change the blueprint. Editor and live game are separate pages so opening the editor preserves an active game. Draft storage is local to this browser; exported JSON is the portable backup. Overmap run state is in memory only for now, not a campaign save system.

Review each part at >=4/5 before the next. Verify shared-edge geometry, persistence through travel, constraints during combat, authoring/import/undo correctness and generated map reachability. Keep existing individual squad control and combat tuning.
