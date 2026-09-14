# Large local maps and elevation

- Local maps: 240×240 tiles, organized as 10×10 sectors of 24×24 tiles. Three walkable levels (0, 1, 2). Four player units plus up to 46 opponents: 50 characters total.
- Ground is a dense plane; upper floors are sparse painted platforms with void elsewhere. Walls remain shared edges and have a level. Stairs connect matching XY cells on adjacent levels; each transition costs 2 AP, normal horizontal movement 1 AP.
- Pathfinding uses A* with level-aware occupancy. Floors block sight/fire across levels, with openings at stairs and beyond platform edges; walls block at their own elevation. Hidden actors on other levels never render on the current layer.
- Editor/game get level controls, sector navigation/overview and viewport-culling with sector detail at distant zoom. Editor offers upper floor placement, void erasure and stairs; generation demonstrates all three levels. Full generated maps have 50 characters, while the starting factory keeps a smaller training encounter.
- Definitions version 2; version-1 draft/JSON imports expand into the larger ground plane without losing their contents. Portable export and existing browser draft slot continue working. Unfinished drafts stay editable; playtests require reachable starts and valid stairs/support.
- Review gates: (1) schema, migration, 3D path/LOS and capacity; (2) editor and renderer/UI scaling; (3) full integration/performance check. Each needs >=4/5. No story work.

## Verification

- Schema/generation hostile review: 4/5. Engine/world review: initial 3.5/5 for false arrival contacts, then 4/5 after correction and regression tests. Editor/renderer review: 4/5. Final integration review: 4/5.
- All 73 automated tests pass. Original factory combat smoke test: 20/20 wins; this does not claim balance for a 46-opponent encounter.
- Browser: generated 50-character map validates and opens in editor playtest; full-map and upper-floor views checked. Training squad member climbed both stairs to level three and descended, with correct actor and view-level updates. No browser errors or warnings. Screenshots: scale-editor.png and scale-game.png. Existing user tabs and draft storage were left intact.
- Independent five-seed timings: full validation 68–113 ms; game creation 78–121 ms; far 471-AP paths 1–4 ms; visibility refresh 2.5–3.0 ms. Worst-case all-alert 50-character turns terminated in 373 simulation ticks / 0.78–0.91 seconds CPU. Current 110 ms visual pacing can take ~41 seconds for that worst case.
- Still open: whether height should confer aim/range bonuses; whether ladders and elevators should join stairs; preferred future generator mix of open yard, buildings and elevated walkways.
