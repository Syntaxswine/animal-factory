# Armed character sprites

32 standing variants: eight existing characters × NR-40 knife, TT-33 pistol, Mosin-Nagant rifle, and AK-47. Generated with the built-in image generation tool, using each original idle sprite as the identity/style reference. Exact prompts are recorded in `armed-sources.json`.

Runtime PNGs: `dist/assets/characters/armed/`. Full-resolution originals: `art/source/armed/`.

Frames are 256 × 256 RGBA, anchor [128, 244]. Visible character height is 236 px, matching the original 192 × 256 character frames at the same 1:4 game rendering scale. Wider transparent padding accommodates weapons without shrinking the body. Lower-body bounds determine the horizontal foot anchor. `tools/prepare-armed.ps1` reproduces normalization from the saved originals.

`dist/tactics/character-art.js` selects art by species and equipped weapon. Hands retain the original idle/walk poses. Armed characters retain their equipped standing pose while moving; armed animation cycles and distinct kneeling/prone artwork are not part of this set.

Review `dist/tactics/character-art.html` for the complete cast, detail/game scale, and mirrored facing.
