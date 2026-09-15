# Kneeling and prone sprites

80 new poses: eight characters × five equipment choices (Hands, NR-40, TT-33, Mosin-Nagant, AK-47) × kneeling/prone. Generated through the built-in image generation tool using the existing character/loadout art as identity references. Exact prompts and generation paths are in `stance-sources.json`.

Runtime: `dist/assets/characters/stances/<species>-<weapon>-<stance>.png`.
Originals: `art/source/stances/`. Export with `tools/prepare-stances.ps1` from PowerShell with System.Drawing.

Each frame is 384 × 256 RGBA, with anchor [192,244]. Visible heights: kneeling 176 px, prone 96 px (standing is 236 px). Aspect ratio is preserved when resizing, so the figures are posed rather than compressed. At 1:4 game scale, visible heights are 44, 24, and 59 pixels respectively. All poses face right; the renderer mirrors them for left facing.

The battlefield selects by equipped weapon and `stanceOf(unit)`. Standing hand-to-hand retains its existing walk animation; other combinations use held poses during movement. Portraits retain the standing loadout art. Movement costs, accuracy and stance rules remain in the game engine.

The character gallery offers a stance filter, all-stance comparison, game/detail scale, and mirrored facing.
