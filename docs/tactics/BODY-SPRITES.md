# Body sprites

Sixteen weapon-free, side-lying sprites cover nine original outfits and seven Red Hats outfits. The pig foreman shares his uniform across factions. There is no blood, gore, or visible injury.

Built-in ImageGen created each sprite from its standing rifle reference. Prompts, reference paths, generated output paths, and source PNGs are recorded in `art/body-sources.json`. Full-resolution originals are in `art/source/bodies/`.

Run `./tools/prepare-bodies.ps1` to preserve alpha, crop transparent bounds, and export into `dist/assets/characters/bodies/`. Visible width is 236 pixels, capped at 160 pixels high for tall tails. Frames use a centered x anchor and y=244. The game draws at one-quarter scale, retaining the unit's facing.

The same body artwork represents incapacitated and dead units, distinguished by existing status markers. Dropped weapons remain separate. Body sprites render before living actors at the same depth; captured units remain hidden. Combat, recovery, and inventory rules are unchanged.

Review every uniform and mirrored facing at `tactics/bodies.html`. A second face-down pose is a future expansion.
