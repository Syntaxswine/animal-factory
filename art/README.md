# Animal Factory character art

Original painted character sheets are in `source/`. These preserve the image-generation output and are reference art, not transparent runtime assets.

Each sheet has four columns (idle, walking A, walking B, working/carrying) and two rows:

| Sheet | Top row | Bottom row |
| --- | --- | --- |
| workers-heavy | Horse, wheat sheaf | Donkey, flour sack |
| workers-barn | Cow, milk pail | Sheep, bread tray |
| workers-small | Goat, spade | Hen, grain basket |
| pigs | Pig foreman, clipboard | Pig director, bread |

The first cast comprises eight characters and 32 illustrated poses. The painted walk poses are a coarse animation draft, not a full multi-direction walk cycle. All face screen-right; a renderer can mirror them for left-facing motion.

Art direction: painterly socialist realism with animal faces, sturdy worker silhouettes, olive work clothes, cream canvas, wheat-gold highlights, and red accents. The pig foreman wears an olive uniform and red cap; the director wears a burgundy waistcoat and has a more indulgent silhouette.

See [prompts.md](prompts.md) for the exact generation and edit prompts. Built-in image generation was used.

## Finished runtime sprites

`../dist/assets/characters/` contains 32 transparent 192 × 256 PNG frames, eight 768 × 256 strips, and `manifest.json`. The shared anchor is (96, 244). Original artwork was segmented locally using rembg/isnet with user authorization, then scaled and aligned without repainting the characters.

`../dist/assets/machines/` contains twelve transparent 320 × 320 PNGs. Generated magenta backdrops were keyed out locally. [machine-prompts.md](machine-prompts.md) records the exact prompts and style reference. Original source sheets remain in `source/`.

`character-review.jpg` and `machine-review.jpg` show the finished assets composited against the farm palette. The in-game art viewer at `/sprites.html` provides light, dark and checkerboard inspection.

Reproduction: run `tools/prepare-sprites.py` for characters or `tools/prepare-sprites.py machines` for machines, with Pillow/numpy and (characters only) rembg[cpu] available in `.sprite-tools/`. Segmentation weights and local dependencies are ignored by Git; they are never required by the browser game.

## Soviet industrial alternatives

Four alternative sprites for the mill, bakery, bottling works, and dairy are saved under `../dist/assets/machines/industrial/`. They retain the 320 × 320 transparent frame format and are paired with the current machines in `/sprites.html#industrial`. They are visual alternatives; the active game still uses the original buildings.

The designs use silo towers, sawtooth factory roofs, brick and concrete factory blocks, large steel tanks, gantries, and external pipework. See [industrial-review.png](industrial-review.png) for the finished quartet and [industrial-prompts.md](industrial-prompts.md) for the exact built-in generation prompt. Reproduce the exports with `tools/prepare-sprites.py industrial`.
