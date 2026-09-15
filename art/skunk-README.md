# Skunk character set

30 hand-painted transparent sprites: normal worker and Red Hats outfits, each with standing, kneeling and prone poses for hands, NR-40 knife, TT-33 pistol, Mosin-Nagant rifle and AK-47.

Generated with the built-in image generation tool. Exact prompts and original generation paths are in `skunk-sources.json`; full-resolution copies are in `art/source/skunk/`. Run `pwsh -NoProfile -File tools/prepare-skunk.ps1` to export from these saved copies.

Runtime PNGs live under `dist/assets/characters/`: `skunk-idle.png`, `armed/skunk-<weapon>.png`, `stances/skunk-<weapon>-<stance>.png`, and matching `red-hats/skunk-...` files. Normal unarmed standing is 192×256; normal armed standing and Red Hats unarmed standing are 256×256; kneeling and Red Hats armed standing are 384×256; all skunk prone frames are 512×256 to preserve tail and weapon length. Anchors are [frame width/2,244]. Visible heights remain 236/176/96 px for standing/kneeling/prone; alpha and aspect ratio are preserved.

Skunks appear in both art galleries and the map editor's Guard species menu, and are accepted in playable map files. The normal outfit is used in gameplay. Red Hats artwork is available through `redHatArt`, matching the existing faction gallery workflow. These are held poses; unarmed movement uses the standing pose until dedicated walk animation is added. Existing squad identities and species traits are unchanged.
