# Field notes from the scenery port foundation

Written 22 September 2026, at the end of the session that built parcels A, S1 and S2
of [SCENERY-PORT-HANDOFF.md](SCENERY-PORT-HANDOFF.md). That document is the plan and
stays authoritative. This one is the things the plan cannot tell you: what is true
about this tree that reading it quickly will not reveal, what cost me time, and what
I got wrong.

If you are picking this up cold, read the plan first, then this, then start.

## The stack, and why the order matters

Five pull requests, four of them a chain. Merge bottom to top.

| PR | Branch | Onto | What |
| --- | --- | --- | --- |
| #13 | `tactics-scenery-handoff` | `tactics-prototype` | the plan, docs only |
| #14 | `tactics-mature-trees` | `tactics-prototype` | parcel A |
| #16 | `tactics-catalog-seam` | `tactics-mature-trees` | parcel S1 |
| #17 | `tactics-daylight` | `tactics-catalog-seam` | parcel S2 |
| #18 | `tactics-ground-cover` | `tactics-daylight` | parcel K |

The chain is not cosmetic. S1 replaces the Pages build's hand-written file list with
a directory scan, and any parcel that adds a module needs that scan or the Pages test
fails. I learned this by branching S2 off the prototype and watching the test fail
with five referenced-but-unshipped modules. The fix was to rebase onto S1, not to
edit S1's file. **If you add a module, branch off S1 or later.**

Worktrees on this clone, all mine, all removable once their PR merges:
`animal-factory-tactics-scenery`, `-trees`, `-seam`, `-daylight`, `-cover`. The main checkout
sits on `tactics-prototype`. Two worktrees are not mine: `-flame-animation` and
`-sprites`. Leave both alone.

## The fork the next tranche turns on

**This session has no image-generation tool.** I checked rather than assumed. That
matters because every Stage 1 parcel is described as painting 1254 × 1254 sprites,
and the 3D branch's own documents describe a workflow built on an imagegen tool its
author had. You may not have one either.

The way through is already proven, by the session working on character sprites in
`animal-factory-tactics-sprites`. Because the two games share a camera exactly, a
model can be photographed straight into a sprite with no reprojection. Their
`tools/bake-character-sprites.mjs` does it with playwright-core against an installed
Edge, serving a detached worktree of the 3D branch. Read `docs/tactics/SPRITE-BAKE.md`
on their branch before writing the scenery equivalent; their scale derivation
transfers unchanged.

One difference you must handle. Their anchor is the sprite baseline every character
PNG shares, measured at row 243 of 256. Scenery has no such shared baseline: a prop
is scaled to fit `visualWidth × visualHeight` and anchored at the foot of its
footprint diamond, and barrier art has a five-number `baseline` instead. So the
scenery baker has to place the model's ground origin on the footprint centre, not on
a fixed row.

A render is an underlay, not the deliverable. The 3D branch shades at runtime; a
sprite carries its own light. Expect a paint pass over anything baked, and say so
rather than shipping a render and calling it art.

## Traps, with the control that caught each one

**Two localhost ports are two storage origins.** I nearly filed an editor regression
that did not exist. The control that saved it: reverting the change on the noisy port
and finding the symptom still there. A control that fails to clear the symptom is
telling you the variable is not the one you are holding. Re-serve the same tree on a
port you have never used this session.

**A hidden browser pane pauses the game's frame loop.** `document.hidden` goes true,
`requestAnimationFrame` stops, and reading the map canvas returns solid black even
though a screenshot of the same moment looks correct, because the screenshot forces a
paint. Do not snapshot the live canvas for a figure. Drive the renderer yourself.

**The environment renderer loads images lazily on first call.** The first
`prop()`/`ground()`/`edge()` for an id kicks off the load and returns false. Any
one-pass render is nearly blank and will hash identically on both sides of an A/B,
which looks like a clean result and proves nothing. Always two passes: one to warm,
wait, one to draw, and report an opaque-pixel count so the probe can be seen to be
alive.

**`tools/catalog-environment.py` was not reproducible** before S1. Running it
reordered `prop-art.js`, because upstream hand-edited that file and added the tool
lines separately. Same entries, same values, different order. It is a no-op again
now; if you change it, re-run it and check the diff is empty.

**`check-assets.mjs` has two gates that will bite a careless port.** The manifest id
list must equal exactly the union of `PROPS` keys, `EDGES[*].art` values and
`GROUNDS`; and any PNG under `dist/assets/environment/` that nothing references fails
the build. That is why the empty group folders hold a `.gitkeep` and not a
placeholder image.

**A sprite cache keyed off the thing being drawn clears itself.** Parcel K renders each shape
once into a small canvas and stamps it, the way `ground-fire.js` does. I picked the render
resolution from each piece's own measured size rather than from the zoom, so two neighbouring
tufts of different sizes flipped the step and cleared the cache between them. Nothing looked
wrong; the page said `2 cached bitmaps` where it should have said 18. Put the counter on the
page. A cache that is quietly not caching looks exactly like one that is.

**Anything small loses its detail to the downscale, in both directions.** At the 50 x 32 px
it is drawn at, `bush.png` is a speckled olive mound with no readable leaf detail — which is
why parcel K could use flat procedural blobs beside it and ship no artwork at all. The same
arithmetic cuts the other way: a stroke thinner than one screen pixel fades to nothing, and
the first version of the grass tufts was measurably present and visually absent. Before
painting anything for parcels B to H, work out its size on screen. Several of them are
small.

**Bash heredocs and escaping.** Patching dense one-line JS through a shell heredoc
into Python into a regex loses backslashes in ways that are hard to see. Twice I fell
back to writing the whole file with the editor tool instead, which was faster than
debugging the quoting. Do that sooner than I did.

## Rigs worth reusing

**Catalog render hash.** For any change that must not alter what the game draws: draw
all six grounds, forty-nine props and sixteen edges through the real environment
renderer onto one canvas, hash the PNG, and compare across two servings. S1's
acceptance was hash `7884ce1`, 603,634 bytes, 103,138 opaque pixels, 70 of 71
elements drawing, the one holdout being the art-less `door` edge. Two passes, as
above.

**Getting an image out of the browser without burning context.** A canvas data URL is
a quarter of a megabyte of base64 and pulling it through a tool result is wasteful. I
ran a throwaway Node server in the scratchpad that accepted one POST, wrote the PNG
to disk and exited, then `fetch`ed the data URL to it from the page. Two files, no
context cost.

**Before/after on the parser.** Import the same module from two worktrees with
`pathToFileURL` and run the same input through both. That is how parcel A's
`Invalid environment props.` to accepted round trip was measured rather than
asserted.

## Decisions that look arbitrary and are not

**Parcel A's two mature trees stay in `environment.js`** instead of moving into the
`trees-large` group the plan originally called for. Moving them would cost the
byte-identity with the architect's commit `e529f4b`, and buy nothing. There is no
`trees-large` group.

**S1's change to `environment.js` is two lines**, an import and an `Object.assign` at
the end, rather than a restructure. The architect already solved this on the 3D
branch the same way: `core/environment.js` ends with
`Object.assign(PROPS, LIGHT_PROPS)`. Keeping the 47 existing entries where they are
also keeps the file close to the upstream source that branch regenerates from.

**S2's daylight is a wash, not a relight**, and at midday it paints nothing at all.
Every sprite has its upper-left light baked into the painting, so there is no honest
way to move a shadow. Painting nothing at noon is also what keeps every existing map
pixel-identical.

**`propPieceDepth` clamps to ±.45 and never zero** because walls and fences on a
tile's sides sort at ±.5 and a unit standing on the tile sorts at 0. Those two
numbers are the whole reason the constant is what it is.

## What I got wrong

Three times in one session, and a peer session caught all three. The pattern is the
same each time: I cited a document instead of reading the thing it described.

1. I wrote a plan whose prose recommended a "cheap win" in three files that my own
   ownership table had already assigned to another parcel. Each half was defensible;
   only the pair was wrong.
2. I told that peer which two files held this tree's fire animation. I had opened
   neither. Both were character art. The real idiom was in two files I had never
   mentioned, plus a depth convention in a third that the parcel could not have
   guessed and would have got silently wrong.
3. I wrote that the 3D branch's camera was incompatible with ours, quoting a line
   from `HYBRID-MIGRATION.md`. That line is a gap statement from 17 September in a
   sentence ending "The next stages must resolve these gaps." They resolved it. The
   cameras match exactly, and that single correction is what makes most of Stage 1
   cheap instead of expensive.

If you are the next agent here: the peer was right every time because they opened the
file. Open the file.

## What I would do next

1. ~~**Parcel K, ground cover.**~~ Done, PR #18. It turned out to need no artwork at all:
   at the size these shapes are drawn, painted leaves and flat procedural blobs are the same
   picture. That is worth knowing before commissioning art for anything else small.
2. **The scenery baker**, as its own tool, before parcels B and C. It is the thing
   that unblocks all the art at once, and it is a better use of a session than
   hand-building one prop family.
3. **Parcels B and C**, which have canonical prop kinds already and need no
   architect's answer. C carries the one real rendering problem in the plan: a
   three-story tower on a 28-pixel tile, drawn at ground level, dimmed by the layer
   compositor whenever the player inspects an upper floor. Decide that rule before
   painting anything. B also now has a consumer for S2's `propPieceDepth` and a worked
   example of the dressing pass to copy, in `ground-cover.js`.

Five parcels are blocked on open question one, whether the furniture, cargo,
machines, conveyor and truck become prop kinds at all. Do not start them on a guess.
