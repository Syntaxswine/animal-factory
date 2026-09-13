# Animal Factory character art prompts

Generated with the built-in image-generation tool. No CLI or external model API was used.

## Shared generation prompt

Use case: stylized-concept.
Asset type: production-ready transparent game sprite atlas for Animal Factory, an Animal Farm-inspired farming and conveyor logistics game.
Style: hand-painted 1930s Soviet socialist realism adapted into readable compact game sprites, sculptural heroic anatomy, thick economical painted shapes, dark olive outlines, warm ochre highlights, brick red accents, deep forest green clothing, cream canvas, earthy natural animal colors. Satirical but dignified animal characters, NOT human faces, not cute emoji, not pixel art, no photorealism.
Camera: consistent elevated three-quarter game view looking down about 35 degrees, all figures facing screen-right, full body and feet visible.
Atlas: exactly FOUR equal-width columns and TWO equal-height rows, ideally 1536 x 1024. One isolated full-body sprite in each of the eight cells. Consistent size and baseline within each cell, generous transparent padding, no overlap, no cropping. Every figure occupies about 65 percent of its cell width and 75 percent of cell height. All sprites in a row are the SAME character with exactly the same clothes, anatomy, colors and proportions.
Columns left to right: 1 idle standing, 2 walking first step left leg forward, 3 walking second step right leg forward, 4 working pose with role-specific tool. Work props stay within the cell.
Background: actual transparent alpha, no solid color, no checkerboard, no ground or shadow, no scenery. No labels, letters, text, panels, borders, grids, watermark.

## workers-heavy

TOP ROW: a strong chestnut HORSE worker, long horse muzzle and ears, cream rolled-sleeve work shirt, dark olive dungarees, red neckerchief, hoof hands and boots. Working pose carries a tied ochre wheat sheaf. BOTTOM ROW: a lean grey DONKEY worker, long donkey ears and pale muzzle, patched forest green work jacket, brown trousers, ochre neckerchief. Working pose carries a canvas flour sack. Anthropomorphic upright biped farm workers, identifiable horse and donkey heads.

## workers-barn

TOP ROW: a sturdy brown-and-cream COW worker, short horns and broad cow muzzle, dark green overalls over a cream work shirt, small red scarf. Working pose carries a metal milk pail. BOTTOM ROW: a stocky cream-wool SHEEP worker with grey sheep face, olive work vest, brown work trousers, red neckerchief. Working pose carries a shallow wooden tray of bread loaves. Anthropomorphic upright biped farm workers, identifiable cow and sheep heads.

## workers-small

TOP ROW: a lean beige GOAT worker, modest swept-back horns and a small goat beard, ochre work shirt, dark green overalls, red neckerchief. Working pose holds a short wooden-handled spade. BOTTOM ROW: a rust-red HEN worker, visible hen beak, red comb, feathered wings instead of arms, small cream apron and olive work waistcoat; stands naturally upright on two yellow bird feet. Working pose carries a shallow basket of grain using its wings. Goat is an anthropomorphic upright biped worker; hen remains distinctly bird-shaped.

## pigs

TOP ROW: a stout pink PIG FOREMAN with pig snout, floppy ears and small curly tail, olive green work jacket, brown trousers, red armband and cap, practical dark boots. Working pose checks a plain clipboard without legible writing. BOTTOM ROW: an exceptionally well-fed pink PIG DIRECTOR with jowls, round belly, pig snout and ears, burgundy waistcoat over cream shirt, dark trousers, polished boots. Working pose greedily holds a loaf of bread. Upright biped pigs with hoof-like hands, smug or officious expression, no human faces. Director is visibly larger and more luxurious than foreman.

## Background-extraction edit prompt

Use case: background-extraction. Edit target: the attached Animal Factory sprite atlas. Remove ONLY the entire brown painted background and replace it with genuine transparent alpha. Preserve all eight characters exactly, their colors, clothes, faces, poses, props, positions and image dimensions. Keep all opaque pixels of the animal figures and erase all the backdrop around and between their limbs, ears and props. Every character must be a clean isolated cutout on completely transparent pixels. NO colored background, NO checkerboard drawn into image, NO gradient, NO ground, NO shadow, NO new content. This is a transparent PNG sprite atlas for canvas compositing, not a presentation image.

The generator returned opaque backgrounds, including baked checkerboards on three extraction attempts. These are not valid transparent sprites; the final runtime sprites were instead extracted from the original approved artwork locally with user authorization. Their actual alpha channels were verified before runtime use.

