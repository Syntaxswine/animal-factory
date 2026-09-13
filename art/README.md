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
