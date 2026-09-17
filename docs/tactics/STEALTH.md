# Stealth and woodland

Squad visibility no longer alerts guards reciprocally. Species sight cones and
physical occlusion establish whether identification is possible; guards then roll
to acquire a target. Distance, directional cover, sneaking skill and stance lower
the chance. Once acquired, a target stays identified until geometric sight breaks.
Failed rolls are cached for the current positions, guard heading, movement steps
and turn. UI refreshes do not reroll or consume combat randomness.

The editor's **Woodland zone** rectangle brush paints walkable foliage. Each tile
length of woodland traversed by a sight ray adds nine tiles of optical distance.
This affects identification, movement glimpses and terrain fog. Woodland also
reduces acquisition chance. Rays above its floor layer are unaffected. Paint Yard
to clear a zone. Existing bush sprites mark the painted tiles.

**Guard facing (degrees)** sets an initial map heading when placing or repainting
a guard: 0 east, 90 south, 180 west, 270 north. Direction lines show authored
headings in the editor. Export/import preserves them; older maps retain the
previous default unless edited.

The first guard in `Factory-test.json` now faces southeast (45 degrees), away
from the west entrance at 15,18. Reimport that file to update an existing browser
design. The built-in factory template's first guard faces east away from its west
entrance. Historical playtest maps are unchanged.

Validation: 329 tests and the asset check passed. Headless Edge loaded game/editor
without page errors and exercised the woodland/facing controls. The full custom
factory starts in exploration with zero alerted guards; its first guard cannot
see a merc on the rear diagonal at 17,19, while the merc can see him.

Remaining separate mechanics: knives still deal normal damage (no guaranteed
silent one-hit takedown) and nearby footsteps can trigger investigation. The
two-turn threat threshold for entering and leaving combat shipped 2026-09-17
(RULES.md, "Local alerts and combat pacing").
