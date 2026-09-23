# Making scenery for the sprite game

Written 23 September 2026, after parcel K, by the session that built the foundation of
[SCENERY-PORT-HANDOFF.md](SCENERY-PORT-HANDOFF.md). Three documents now, and they answer
different questions:

| Document | Answers |
| --- | --- |
| [SCENERY-PORT-HANDOFF.md](SCENERY-PORT-HANDOFF.md) | what to build, who owns which file, what is still blocked |
| [SCENERY-PORT-FIELD-NOTES.md](SCENERY-PORT-FIELD-NOTES.md) | what is true about this tree, what cost me time, what I got wrong |
| this one | how to decide what a piece of scenery should be **made of**, with the numbers |

The plan says scenery means "producing paintings and catalog rows, never geometry." After
doing one content parcel I think that is right for the big things and wrong for the small
ones, and there is a measurement that tells you which is which. It is the only thing in this
document you have to remember.

## The one number

Every prop, barrier and ground texture in this game is a **1254 × 1254** painting drawn with
a single `drawImage` into a box a few dozen pixels across. The ratio between those two
numbers decides whether anything you paint will still be there.

```
node tools/drawn-size.mjs --all           # every entry, smallest first
node tools/drawn-size.mjs --zoom 1.15     # the zoom a new campaign opens at
node tools/drawn-size.mjs tree crate      # filter by id
```

Nothing in the tree stated this ratio before, so here it is. These are the catalogue as it
stands on `tactics-prototype`; run the tool again after the parcel stack merges, because A
adds two tree variants at 1.8× and the Stage 1 parcels add fifteen more kinds.

| | Drawn at zoom 1 | Source crop | Downscale |
| --- | --- | --- | --- |
| `tree-pine` | 79 × 130 | 727 × 1189 | 9 : 1 |
| `wall-concrete` | 79 × 72 | 1136 × 1033 | 14 : 1 |
| `bush` | 40 × 32 | 934 × 746 | 23 : 1 |
| `crate-wood` | 36 × 40 | 1016 × 1122 | 28 : 1 |
| any ground texture | 56 × 28 | 1254 × 1254 | 45 : 1 |
| `wire-cutters` | 12 × 12 | 1095 × 1068 | 89 : 1 |

The camera clamps to zoom .025–2.3 and the canvas takes a device pixel ratio up to 2, so the
most generous view the game can produce is 4.6×. Even there the range is **2 : 1 for a pine
tree to 19 : 1 for a pair of wire cutters**. At the default 1.15 on a 1× display it is 8 : 1
to 77 : 1.

For contrast, character art is drawn at `frame.width / 4`: a 192 × 256 sheet at 48 × 64 px,
**4 : 1**, and the pipeline that bakes it knows that. The environment pipeline paints
everything at 1254² regardless of whether it lands at 130 px or 12.

## The scale reference

The plan asks you to review art "beside a standing character". That is the right instruction
and nobody wrote down the number. Measured off the alpha ≥ 64 bounding box of
`cow-idle.png`, `hen-idle.png` and `horse-idle.png`, all three sheets 192 × 256 with content
in rows 8–243:

**A standing animal is 30 to 35 px wide and 59 px tall at zoom 1.**

Everything else falls into place against that. A wall is 72 px, a little over head height. A
tree is 105–130, twice an animal. A crate is 40, chest height. A bush is 32, knee height.
Loot is 12, at the hoof. A grass tuft from parcel K tops out at 13, ankle height, which is
the check that made me stop worrying whether doubling it was too much.

## Three routes, and which one a thing wants

**Paint it** when the thing is drawn above roughly 60 px on its long side: trees, walls,
towers, the truck, roof modules. At 9–15 : 1 a painted silhouette and painted material read
clearly, and this is what the whole existing catalogue is.

**Bake it** when the 3D branch already has the model and the thing is drawn between roughly
25 and 60 px: cargo, furniture, machines, conveyor sections, light fixtures. The two games
share a camera exactly — `GAME_CAMERA` is `{azimuth: π/4, elevation: π/6}`, and π/6 gives a
diamond of exactly 2.000000, the same as this game's 56 × 28 tile — so a render is already in
this game's projection and needs no reprojection. See the plan's camera section, and the
character-sprite session's `tools/bake-character-sprites.mjs` for a working baker. A render
is an underlay, never the deliverable: the branch shades at runtime and a sprite has to carry
its own light.

**Generate it** when the thing is drawn below roughly 25 px, or when there are hundreds of
them. Parcel K is the worked example and it shipped no artwork at all. The evidence was one
measurement: downscale `bush.png` to the 50 × 32 it is actually drawn at and look at it. It
is a speckled olive mound with no readable leaf detail. At that size a painted leaf and a
flat procedural blob are the same picture, so three canvas blobs stand beside the painted
bush without looking like a different game — and you can see them doing it in
`ground-cover.png`.

The boundaries are soft and the routes mix. What is not soft is the obligation to *measure
before choosing*, because both mistakes are invisible until you look:

- Paint detail below the downscale and you have painted nothing. A 12-pixel leaf at 23 : 1 is
  half a screen pixel.
- Draw a stroke below one screen pixel and it fades to nothing. Parcel K's first version of
  the grass was correct, tested, deterministic, byte-identical to the 3D branch over 64,800
  tiles — and invisible in the game. The fix was thickness and tonal range, not placement.
- And a feature has to clear the background's own noise as well as one pixel. The grass
  ground runs luma 44 to 105; the tufts had to reach 137 and 42 before they read as shapes
  rather than as more speckle.

## What every route still owes

The contract is in the plan under **What "keep the sprite aesthetic" means** and is not
repeated here. The three things that will actually fail your build:

1. `tools/check-assets.mjs` asserts the manifest's id list equals exactly the union of
   `PROPS` keys, `EDGES[*].art` values and `GROUNDS`, and fails on any unreferenced PNG under
   `dist/assets/environment/`. This is why an empty group folder holds a `.gitkeep` and not a
   placeholder image.
2. The same file asserts every environment PNG is exactly 1254 × 1254, RGBA for props and
   barriers, RGB for the six ground textures.
3. `tests/tactics-new-props.test.mjs` places, rotates, exports and reloads every id that has
   both a `PROP_ART` crop and a `PROPS` rule, so a new prop joins the suite the moment it is
   registered — and a half-registered one fails immediately.

Sizing, which is the arithmetic `tools/drawn-size.mjs` duplicates:

```
maxWidth  = (visualWidth  ?? (w + h) * 25)                              * zoom
maxHeight = (visualHeight ?? (w + h) * 11 + (tall ? 43 : 18))           * zoom
scale     = min(maxWidth / cropWidth, maxHeight / cropHeight)
```

anchored at the foot of the footprint diamond. A barrier ignores all of it and is scaled by
height alone from its five-number `baseline`: 72 px for walls, windows and doorways, 20 for a
railing, 44 for a cut fence.

## A parcel, end to end

The order that worked, on K:

1. **Claim it** in the plan's status table and push that one commit before starting. Branch
   off S1 or later if you will add a module, or the Pages test fails.
2. **Measure before designing.** `node tools/drawn-size.mjs` for anything that exists;
   `(visualWidth ?? (w+h)*25)` for anything that does not yet. Write the number in the module.
3. **Find the canonical source on the 3D branch and port it exactly** where there is one.
   K's placement is `foliage-models.js` hash for hash, and the test re-derives that branch's
   expression rather than calling our module twice, so a typo shows as a disagreement instead
   of agreeing with itself.
4. **Depart from it deliberately, in writing.** K has two departures, both about surviving a
   downscale rather than about where anything stands, and both are named in the module, the
   document and the commit.
5. **Prove the neutrality** of anything that touches an existing frame. The catalog render
   hash in the field notes is the rig; remember the renderer loads images lazily, so it takes
   two passes and an opaque-pixel count.
6. **Look at it beside the real neighbours, magnified.** A 4× nearest-neighbour crop of the
   same window from a before and an after panel, stacked, is the cheap instrument and it is
   what caught both of K's visibility problems. Screenshots of the whole map will not.
7. **Mutation-test the suite.** Twelve deliberate breaks, twelve caught. Two survived K's
   first round and both were the test's fault: one assertion too loose to notice a shape
   change, and one that read its thresholds back out of the constant it was checking, so
   narrowing the fade band to nothing still passed.
8. **Ship a review page.** `ground-cover.html` is the pattern: the before and after at any
   zoom, the fogged variant, every shape magnified, and the counters on the page. K's sprite
   cache was silently not caching and only the counter showed it.
9. **Record what you did not do**, against the parcel, in the plan. K left the woodland
   diamond and bush in place because they belong to another parcel's file, and said so rather
   than quietly reaching across.

## The instruments

`tools/drawn-size.mjs` ships, with `tests/tactics-drawn-size.test.mjs` pinning its formula to
a decoded PNG so the duplicate cannot drift.

Three more are worth rebuilding in a scratchpad when you need them; each is about twenty
lines on top of `tools/png-rgba.mjs`, which is a dependency-free PNG codec already in the
tree:

- **Palette sampler.** Bin a PNG's opaque pixels by high nibble, print the commonest tones
  with their share and luma, and print the four quadrant means. The quadrant means are the
  light direction: `bush.png` is #6a6135 top left and #5d5530 bottom right, 95.6 against 83.7
  in luma, and that ratio is what a new painting has to match.
- **Drawn-size downscaler.** Box-filter a 1254² PNG down to its real drawn size, then
  magnify it back with nearest neighbour. This is the single most useful twenty lines in this
  document: it is what proved painted leaves were unnecessary.
- **Canvas catcher.** A one-shot Node server that accepts one POST, writes the body's data
  URL to disk and exits. Fetch `canvas.toDataURL()` to it from the page instead of returning
  a quarter megabyte of base64 through a tool call.

## One tension, for the architect

`check-assets.mjs` requires every environment PNG to be 1254 × 1254. At the default zoom the
renderer then discards between 98.4% of those pixels (a pine tree) and 99.98% (a pair of wire
cutters), and which it is depends on a `visualHeight` in `environment.js` that the artist
never sees. Loot is the sharp case: nine 1254² paintings drawn at 12 px.

This costs disk and load time rather than correctness, and it is not a scenery-port decision
to make unilaterally — repainting is parcel M and the gate is shared with character art. But
a baker producing scenery has to choose an output resolution, and right now the only legal
answer is one the renderer does not want. **Open question 7 for the architect: should the
environment gate accept art baked at the resolution it is drawn at?**

## What I would tell you

Every claim in this port that turned out to be wrong was one I had read; every claim that
held was one I had measured. The camera was said to be incompatible and was identical. The
fire animation was said to live in two files I had never opened. The tufts were said to be
placed correctly and were, and were also invisible. A peer session caught the first two
because they opened the file, and a counter on a page caught the third.

So: open the file. Decode the PNG. Put the counter on the page. Render it beside the thing it
has to live next to and magnify the crop. The plan will tell you what to build and the field
notes will tell you where the traps are, but neither can tell you whether the thing you made
is actually there. Only looking can do that, and looking is cheap once you have built the
instrument.
