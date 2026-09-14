# Tactical environment collection 01

28 original PNG assets generated with the built-in image_gen tool. Exact prompts are recorded in [environment-prompts.md](environment-prompts.md).

## Files and preview

- Art: `dist/assets/environment/*.png`, all 1254 × 1254.
- Manifest: `dist/assets/environment/manifest.json`.
- Preview: `dist/tactics/environment-art.html` (works directly from disk or via `npm run serve:tactics`).
- Generation provenance: `art/environment-sources.json`. Local generation paths are provenance only; every image is copied into the repository.

## Inventory

- Wooden crate, steel supply chest, stacked crates.
- Wooden table, steel table, wooden vise workbench, metal drawer workbench.
- Single oil barrel and three-barrel cluster.
- Concrete, corrugated metal and brick wall sections.
- Chain-link fence and open iron railing.
- Sandbag barricade and empty pallet.
- Dirt, gravel, sparse grass, concrete, asphalt and factory floor tile textures.

## Integration contract

This delivery is an art pack and preview, not a map-schema or gameplay change. The manifest's `suggestedRules` are intended defaults for the next editor integration. Keep traversal, sight and cover separate: fences block movement but do not block sight or grant cover. Solid walls block both movement and sight. Low props block occupancy and can provide cover without being full-height sight blockers.

Walls and fences belong on shared tile edges. Ground textures are square overhead images and should be mapped to the game's diamond using its projection. Props retain their original framing; calculate trimmed bounds and a ground anchor when creating runtime atlases. Footprints are suggestions, not calibrated game scale. Mirroring supports the opposite isometric axis but reverses baked lighting.

Generated texture joins are not guaranteed pixel-exact. The viewer provides 2× and 4× repeats for inspection; production terrain blending and transitions remain integration work. Full-resolution originals retain generated alpha without keying, repainting or destructive processing.

## Windows and doors expansion

Concrete, brick and corrugated-metal window wall sections; closed steel and wooden doors; and an open concrete doorway. Window apertures and the open doorway retain genuine transparency. Suggested edge rules distinguish movement and sight: windows block crossing but allow sight, closed doors block both, and the open doorway permits both. These are visual variants, not aligned open/close animation frames. Door interaction, aperture-specific ray tests, glass and climbing remain integration work. Additional provenance is in `art/openings-sources.json`.

## Standalone doors (v2)

User-requested polygon crops remove the surrounding wall from the steel door, wooden door and concrete doorway. `tools/crop-doors.ps1` reproduces the three 1254-square transparent v2 files and `dist/tactics/door-art.js` placement metadata. Originals remain intact. Runtime and catalog now use the crops at a full tile edge width and 72 px nominal height (player visible height 59 px); walls and windows are unchanged. The scale review compares original art on the left with v2 on the right. No new image generation was used.
