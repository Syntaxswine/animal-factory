# Red Shift — mechanics prototype

Historical first-slice contract. The current local-map, overmap and edge-wall editor behavior is documented in [README.md](README.md) and `docs/tactics/MAPS.md`. Story work is deferred.

An independent entry at /tactics/index.html using existing Animal Factory assets. No builder changes.

Stage 1 contract: 28x24 isometric factory, open yard, two roofless workshops, solid walls with door gaps, crates provide directional cover and block walking. Four named animal workers (horse, goat, sheep, donkey), twelve animal guards in three groups. All living actors occupy one tile, cardinal movement with BFS avoids walls and units, at 1 AP per tile during combat. Opening attacks during exploration enter combat and spend AP. Shared squad line of sight reveals tiles permanently; opponents render only when currently visible. Squad sight and contact detection are 9 tiles. Contact switches immediately from timed exploration movement to squad turns. No movement queue survives phase transition. Combat remains active while any alerted guard lives; guards pursue last known squad positions even after sight breaks. Defeating the alerted guards returns to exploration. This prevents repeated AP resets at corners. Victory requires defeating all 12, loss all 4. No revival or XP in this slice.

Weapons: hands, NR-40 knife, TT-33 pistol, Mosin-Nagant rifle, AK-47 assault rifle. Every squad member can equip any of these to test them. Changing weapon costs 2 AP in combat; ammunition is tracked separately per weapon and cannot be replenished by switching. Hands/knife have adjacent reach; firearms have different ranges, shot AP, magazine and damage. Reload costs AP, reserves unlimited for test. AK burst uses 3 rounds and extra AP, each round rolls separately. Chance and AP preview before attacks, hard line of sight, directional adjacent cover reduces hit chance. No shooting or movement during enemy resolution or after game over.

Balance: squad 100 HP / 12 AP / 85 base accuracy versus guards 45 HP / 7 AP / 55 accuracy, lower enemy damage. All guards act during their phase but only pursue detected squad targets; unseen guards hold. Deterministic seeded RNG, restart same seed. Enemy steps shown on a timed queue. No AP charged for unreachable/invalid actions.

Stage 2: pure mechanics module with automated tests for count, path/occupancy, visibility and walls, AP legality, weapons/ammo, death, phase transitions, AI and victory/defeat. Hostile review must score >=4/5 before UI stage.

Stage 3: canvas renderer with reused painted sprites, terrain and roofless workshop geometry, selection rings, movement/attack previews, squad cards, weapon controls, log, restart, pan/zoom and keyboard controls. Browser validation and hostile review >=4/5 before delivery. Document controls, limitations, final direction questions. Commit/push only this task branch; no publication of private repository contents.
