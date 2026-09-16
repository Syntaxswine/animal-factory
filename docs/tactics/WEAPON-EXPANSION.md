# Weapon sprite expansion

Seven weapons: pump-action shotgun, PPSh-style submachine gun, scoped sniper rifle, belt-fed heavy machine gun, revolving grenade launcher, RPG, and hand grenade.

The collection contains 336 unique transparent PNGs: nine original animal outfits and seven Red Hats outfits, each with seven weapons in standing, kneeling, and prone poses. The pig foreman shares his existing uniform across factions; the director has no Red Hats variant.

The flamethrower addition supplies 48 more sprites (384 total): all nine base outfits and seven Red Hats outfits in standing, kneeling, and prone poses, with painted projector, hose, and backpack tanks. The foreman shares his existing uniform across factions. Flamethrower prompts, reference images, and built-in ImageGen output paths are recorded in `art/flamethrower-sources.json` and `art/red-hats-flamethrower-sources.json`, and included in the main source list. Filter the gallery with `?weapon=flamethrower` to review the set. Generate Red Hats contact sheets with `./tools/review-flamethrowers.ps1 -Outfit red-hats`.

## Sources and regeneration

Images were produced with the built-in ImageGen tool, editing the existing rifle sprite for the same animal, outfit, and stance. Each call creates one sprite. Exact prompts and reference paths are in `art/weapon-expansion-sources.json`; generation output paths are recorded in `art/weapon-expansion-generation.jsonl`. Full-resolution outputs are retained under `art/source/weapon-expansion/`.

Run `./tools/prepare-weapon-expansion.ps1` from PowerShell to crop transparent bounds, resize, and export the source PNGs. It preserves alpha and uses the established stance content heights: 236 pixels standing, 176 kneeling, and 96 prone. Frames are 256 pixels high, at least 384 pixels wide, with wider frames where a long weapon or tail needs room. The anchor is horizontally centered at y=244.

The exporter writes PNGs and a JSON manifest under `dist/assets/characters/weapon-expansion/`, plus `dist/tactics/weapon-expansion-frames.js`. Do not hand-edit generated frame metadata.

## Review and use

Open `dist/tactics/weapon-expansion.html` through the project server to filter by animal, uniform, weapon, and stance. The gallery includes scale and facing controls. Existing character and Red Hats galleries also include these weapons.

Generate a contact sheet with `./tools/review-weapon-expansion.ps1 -Outfit normal -Species horse`; use `red-hats` for faction uniforms.

`characterArt`, `redHatArt`, and `unitArt` resolve the new frames. The gameplay weapon ID `launcher` is an alias for the asset ID `grenade-launcher`. Sprite lookup supplies the artwork; weapon statistics and combat rules are separate.

Run `npm run check` to validate coverage, unique images, frame dimensions, alpha channels, anchors, stance sizes, faction resolution, and launcher aliasing alongside the existing game checks. Run `npm run build:tactics-pages` to include the assets and gallery in the Pages distribution.
