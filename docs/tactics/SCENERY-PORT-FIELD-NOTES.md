# Field notes from the scenery port foundation

Written 22 September 2026, at the end of the session that built parcels A, S1 and S2
of [SCENERY-PORT-HANDOFF.md](SCENERY-PORT-HANDOFF.md). That document is the plan and
stays authoritative. This one is the things the plan cannot tell you: what is true
about this tree that reading it quickly will not reveal, what cost me time, and what
I got wrong.

If you are picking this up cold, read the plan first, then this, then
[MAKING-SCENERY.md](MAKING-SCENERY.md), then start. That third document was written after
the first content parcel and is the one that says how to decide what a piece of scenery
should be made of; it holds the measurements this one only gestures at.

## The stack, and why the order mattered

All of it is merged. `tactics-prototype` at `a3d2d6b` carries #13, #14, #16, #17 and #18 —
the plan, parcel A, S1, S2 and K — and the architect's verdicts are in
`INTEGRATION-REVIEW-2026-09-22.md` and `-23.md`. Two more are open on top: #19, the docs
this merge stranded, and #20, the scenery baker.

The chain was not cosmetic while it lasted. S1 replaces the Pages build's hand-written file
list with a directory scan, and any parcel that adds a module needs that scan or the Pages
test fails. I learned this by branching S2 off the prototype and watching the test fail with
five referenced-but-unshipped modules. The fix was to rebase onto S1, not to edit S1's file.
Now that S1 is in the trunk, **branch a Stage 1 parcel straight off `tactics-prototype`.**

**A merged PR is not the same as a merged branch tip.** #13 merged `tactics-scenery-handoff`
at `1b59013`, which was four commits behind where the branch actually stood, so
`SCENERY-PORT-FIELD-NOTES.md`, `MAKING-SCENERY.md` and `tools/drawn-size.mjs` were silently
absent from the trunk while GitHub showed the PR green and closed. Nothing warns you. After
a merge, check the commit you care about, not the PR:

```
git merge-base --is-ancestor <your-tip> origin/tactics-prototype && echo IN || echo NOT IN
```

Worktrees on this clone, all mine: `animal-factory-tactics-scenery` (now on
`tactics-scenery-baker`), `-trees`, `-seam`, `-daylight`, `-cover`. The four parcel worktrees
are removable — their branches are in the trunk. The main checkout sits on
`tactics-prototype`. Two worktrees are not mine: `-flame-animation` and `-sprites`. Leave both
alone. `af-3dref-sprites` is a detached read-only worktree of the 3D branch and is what the
bakers serve.

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

*Parcel B, later the same day:* that paragraph was right about raw renders and wrong as a rule.
The objection is about light, and light can be measured. At drawn size the workshop's bake of a
crate has half the painting's contrast and almost no light direction (upper-left over
lower-right 1.23 against 1.92). Relit with one key from the upper left it lands at 2.19 and
29.6 sd against the painting's 30.2. B shipped seven fixtures that way and said so, which
is what this paragraph was really asking for.

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

**`environment-gallery.html` is not a bake source.** It looks like one — 78 entries, every
canonical prop, in the right camera — but `buildWorld` builds a prop out of plain boxes whose
height it derives from *our own* catalogue: `rule.tall ? 2 : rule.cover ? 0.8 : rule.visualHeight
? min(1.8, visualHeight/40) : 0.2`. Baking from it and comparing with the paintings gives
ratios from 0.72× to 1.70×, which reads like a scale bug and is really a box standing in for a
model. The art lives in `painted-furniture.js`, `painted-cargo.js`, the two machine studies and
the conveyor, exactly as the plan's "four art libraries" section says. I spent a probe finding
this out; the control was noticing that `workbench-vise` and `table-wood` baked to the *same*
84 × 63 px, which a real model never would.

**A workshop's `select()` does not leave collection mode.** `furnitureWorkshop.select(id)` sets
the form dropdown and rebuilds, but if `#mode` is still `collection` the page rebuilds all 32
models and the render is the whole shelf. There is no error; the picture just silently contains
everything. Set `#mode` to `single` first, then assert `selection().length === 1` and that the
one placed model carries the id you asked for. Both assertions are in the tool.

**A manifest written per run clobbers the runs beside it.** Baking `--group=cargo` after
`--group=lighting` left twelve rows describing forty-four PNGs, with no error and no gap in the
directory listing. Merge against what is on disk and drop rows whose file has gone.

**`toneMappingExposure` does nothing when tone mapping is off.** The first lighting sweep had an
exposure knob; four values gave byte-identical statistics. three.js applies it inside the tone
mapping step and nowhere else. A knob that does nothing is worse than no knob, because the
sweep reports it as tried. Scale the lights instead.

**The baker's page script is a template literal.** A backtick in a comment inside `INJECT`
closes the string and the tool fails `node --check` far from the edit. Quote with plain
quotes in there.

**`sed -i` in Git Bash rewrites CRLF to LF.** Harmless under `autocrlf`, but the next
patch that matches `\r\n` finds nothing. Patch through a script that detects the file's line
ending rather than assuming one.

**`catalog-environment.py` rewrites every group's `prop-art-*.js`.** On Windows the others
come back with only their line endings changed. `git diff --ignore-cr-at-eol` shows nothing,
so restore them rather than committing seven files you did not change.

**`tactics-new-props.test.mjs` does not see group props,** and `tools/drawn-size.mjs` did not
either until B. Both were written before S1 split the catalogue, so they read `PROP_ART` and stop.
The drawn-size test caught its own blind spot the moment the first group prop existed; the
new-props sweep passes silently.

**A contact shadow's lowest point is off-centre on a non-square footprint.** The ellipse is long
along x on a 2 × 1, so its lowest pixel sits right of the middle. My first registration test
asserted it was centred and failed on `streetlight-double`, which was correct. What has to be
centred is the ellipse's *extent*, because the renderer plants the crop's bottom *centre*.

**The Browser pane allows five dev servers per folder.** With other chats holding all five,
`preview_start` refuses. The headless Edge the baker already uses verified the review page
instead: it captures console errors and the canvas, and costs nobody else a server.

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

**Driving a 3D workshop page headlessly.** Every viewer on the 3D branch exposes a
`window.<name>Workshop` or `<name>Study` object built for exactly this, and between them they
give you `{ready, renderer, models | scene | trucks, selection(), select(id, skin), view(a, e),
diagnostics()}`. You do not need the page's camera: import three.js from the served tree, make
your own `OrthographicCamera`, and reach the scene by walking `.parent` from any placed object.
That is what makes one adapter shape serve four pages, and it leaves the page's own view
untouched. `--playwright=<path>` points at a `playwright-core` borrowed from another project;
this tree has no `node_modules`.

**Asking the render where a world point landed.** The only honest way to check registration:
project known points — the origin, the unit axes, the footprint centre — through the same
camera that drew the frame and report their pixel coordinates beside the alpha crop. That is
how the 2.000000 diamond was confirmed in the picture rather than in the source, and how the
anchor and centre residuals were measured. A bake that reports only an image cannot be
checked; one that reports the image plus three projected points can.

**Measuring a look.** To ask whether two sprites "match", box-filter each crop to the size the
game draws it, premultiplied, then report luma mean and sd, the upper-left over lower-right
quadrant ratio, saturation, and the mean luma of the silhouette's outer ring against its
interior. The quadrant ratio is the light direction, and the ring test says whether a painting
carries an outline (these don't: ring and interior sit within 6 luma). Sweep a rig against
subjects both lines have and score on the ratios, not on mean luma, which is mostly albedo.

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
2. ~~**The scenery baker**, as its own tool, before parcels B and C.~~ Done, PR #20.
   `tools/bake-scenery.mjs` and [SCENERY-BAKE.md](SCENERY-BAKE.md). All 44 forms for groups
   `lighting`, `towers`, `furniture` and `cargo` are registered and measured; `machines`,
   `conveyor` and `vehicles` are not adapted and are blocked on open question 1 regardless.
3. **Parcels B and C**, which have canonical prop kinds already and need no
   architect's answer for the art. *B done on `tactics-lighting`, seven of nine kinds; see
   [LIGHTING.md](LIGHTING.md).* The route B found (relight, shadow, ship) is open to D and E too
   if open question 1 comes back yes, and they are the best-behaved groups in the baker. C carries the one real rendering problem in the plan: a
   three-story tower on a 28-pixel tile, drawn at ground level, dimmed by the layer
   compositor whenever the player inspects an upper floor. Decide that rule before
   painting anything — and the baker has added a number to it, because the towers also sit
   10 to 27 px off the renderer's anchor and the ladder variants 20.7 px off-centre. B also
   now has a consumer for S2's `propPieceDepth` and a worked example of the dressing pass to
   copy, in `ground-cover.js`, and two of its nine forms are the wall fixtures of open
   question 5, which the baker measured at one to two tile heights out of place. Start there.

Five parcels are blocked on open question one, whether the furniture, cargo,
machines, conveyor and truck become prop kinds at all. Do not start them on a guess.

Two questions are new and cheap for the architect to settle, and both get more expensive the
longer they wait because every parcel inherits them: **open question 7**, whether the 1254²
gate should flex per entry, and **open question 8**, whether scenery honours the 3D line's
world scale or the sprite sheet's animals, which differ by 9%.
