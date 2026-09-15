# Red Hats faction

Six recruits (horse, goat, donkey, sheep, cow, hen) wear the pig foreman's red cap, olive shirt, red armband, suspenders and brown trousers.

## Artwork

- Six existing standing unarmed uniform variants.
- 72 armed sprites: six animals × four weapons (NR-40, TT-33, Mosin-Nagant, AK-47) × three stances (standing, kneeling, prone).
- Pig foreman artwork is reused from the existing armed and stance collections, supplying another 12 armed combinations.

Created with the built-in image generation tool. Exact prompts: `red-hats-sources.json` and `red-hats-armed-sources.json`. Full-resolution sources: `art/source/red-hats/` and `art/source/red-hats-armed/`.

Runtime assets: `dist/assets/characters/red-hats/`. Unarmed files are `<species>-idle.png` (256 × 256, anchor [128,244]). Armed files are `<species>-<weapon>-<stance>.png` (384 × 256, anchor [192,244]). All are RGBA with transparent backgrounds. Visible heights are standing 236 px, kneeling 176 px, prone 96 px; aspect ratio is preserved. Export using `tools/prepare-red-hats.ps1` and `tools/prepare-red-hats-armed.ps1` respectively.

## Preview and integration

`dist/tactics/red-hats.html` offers character, weapon, stance, original-outfit comparison, mirror and scale controls. `red-hats-art.js` exposes faction artwork by species/weapon/stance, reusing pig-foreman artwork. Unsupported combinations return null. The six new recruits have unarmed standing art only; all four armed loadouts have all three stances.

This is a sprite collection and gallery. It does not assign faction membership or alter gameplay rules. These are held poses, not new movement animation frames.
