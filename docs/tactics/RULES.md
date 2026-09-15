# Sector generation, height and environment test rules

This slice implements mechanics only.

- Elevated sight uses the existing three-dimensional ray checks, plus one tile of downward sight distance per level. Solid walls and floors remain authoritative.
- Guns use horizontal distance plus 1 tile per level uphill for range and distance-based accuracy. Downhill shots use normal horizontal distance with no range bonus or penalty. Melee range does not change. An elevated target gives a 15 percentage-point uphill cover penalty; ordinary directional cover remains 25 points and the two do not stack. Direct vertical stair shots have no imaginary platform-cover bonus.
- Stairs cost 2 AP per level, ladders 3 AP. Old untyped connections remain stairs. Both connect matching XY cells on adjacent levels. Elevators are reserved for later travel between local maps and are not implemented here.
- Environment props have explicit footprints independent of artwork. Tables and workbenches occupy 2x1 cells, or 1x2 when mirrored. Low props provide directional cover; stacked crates block sight; pallets can be walked over. Fences and railings block crossing while leaving sight open. Wall art remains on shared tile edges.
- Ground textures are six alternatives for walkable surfaces. Water is impassable. Bridge decks and approach roads remain walkable.
- A river layout uses a deterministic 10x10 sector plan with matching north/east/south/west sockets. The first templates are yard, workshop, river, bridge and approach road. North-south and east-west rivers use the same templates with the whole plan rotated. The river runs continuously across the map with exactly two separate 4-tile-wide bridges and continuous approach roads.
- This is the first rule set, not a general constraint editor or winding-river solver. Room placement remains available independently. Generated river channels and approaches are validated after edits; violations prevent playtesting until repaired. General map validation also checks all starts and the travel marker are reachable.
- Existing version-1 and version-2 maps remain loadable. Props, sector metadata and typed vertical links extend the current version-2 format without requiring older maps to supply them.

Review gates: core rules and geometry >=4/5; editor/rendering integration >=4/5; final checks and sprite playtest >=4/5.

## Window and door additions

Six more source assets arrived during integration, bringing the usable palette to 28. Window walls provide 25-point directional cover and block crossing. Their central aperture accepts rays within the middle 70% of an edge, between height 1.0 and 2.4 of a 3-unit level. Decorative mullions are ignored; sills and outer wall portions remain solid. Closed steel and wooden door sprites are fixed barriers for this test; the open concrete frame is passable. No opening/closing interaction or matched door animation is claimed.

## Verification results

All 88 automated tests and all 28 environment asset checks pass. The original factory balance smoke test won 20/20 seeds, in 5–7 rounds with 3–4 survivors. This does not establish balance for every 50-character generated map. Browser checks confirmed sprite placement, readable window and door openings, and squad traversal across a generated bridge.

Independent hostile review gates passed at 4/5 for core mechanics, editor integration, the six additional window/door assets, and the final overall review. No blocking findings remain. Evidence screenshots accompany this document.

## Uphill distance correction and roof climbs

Uphill gunfire adds one tile of effective horizontal distance per level; downhill has no distance penalty or bonus. Melee retains its original three-dimensional reach. Existing elevated cover and downward sight rules remain.

Optional marked roof edges connect adjacent tiles exactly one level apart. Climbing costs 6 AP in either direction (twice a ladder), allowing the 7 AP guards to use these routes. Roof support, empty foothold headroom, an open upper edge, and unoccupied endpoints are required. Roof links do not cut sight holes through floors. The editor provides placement and erasure from either endpoint; JSON and world state preserve links. Multiple links can share a foothold: climb buttons choose the first route, while selecting a destination tile allows other routes.

Validation: 95 automated tests pass, including actual enemy roof traversal and AP accounting. Browser playtesting confirmed editor placement and player ascent/descent. Hostile review passed at 4/5 after correcting the initial unaffordable guard climb cost.

## Stance movement

Three actor states: standing (2 AP/tile), kneeling (4), prone (8). Direct stance changes cost 2 AP in combat and are free outside combat. Dead characters, enemy turns, insufficient AP, active movement, invalid stances and redundant changes cannot spend AP. Stairs/ladders/roof links require standing and retain 2/3/6 AP costs. Actor-aware path costs drive previews, movement, queued-step revalidation and enemy movement. Stance persists with squad state through local travel. No new shooting or visibility modifiers are inferred. Current sprites retain standing poses; UI and map labels expose stance.

Validation: 102 tests pass; factory balance smoke test wins 20/20 seeds in 7–10 rounds with 3–4 survivors. The bot uses actual route costs and stays standing. Browser checks confirm all three stance controls and labels. Hostile review: 4/5 pass. The review found and resolved a distant-path slowdown by making the A* estimate account for stance movement costs.
