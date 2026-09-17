# Directional proof requirements — 17 September 2026

Source: coordinator's `REVIEW-2026-09-17.md` in the separate
`animal-factory-tactics-retreat-review` worktree, supplied by the user.
The coordinator approves the room material/prop direction through f8217c6.
Next: demonstrate intact directional characters and matching physical muzzle
origins, then extend the approved environment direction to the opt-in map/editor.
Canonical default, muzzle tolerance and prototype dimensions remain unchanged.

## Continuous headings are part of the problem

The engine accepts arbitrary finite headings in `turnTo`; firing, victim reactions,
AI investigation and targeting assign angles from target positions. Eight artwork
facings are not enough to establish the existing 0.05-tile muzzle requirement.
The physical forward muzzle offset is 0.57 tiles upright and 0.98 prone.

For N evenly spaced directions, the maximum ground-plane discrepancy between an
exact heading and its nearest frame is `2 * offset * sin(PI / N)`. Orthographic
projection cannot enlarge that discrepancy. Eight directions can therefore miss
by about 0.222 tiles upright or 0.382 prone before any artwork error. This is
not solved by proving only the eight central headings.

`node tools/hybrid-directional-guide.mjs` regenerates an SVG authoring guide and
JSON with physical target points for three stances and eight reference headings.
Those eight reference columns are authoring examples, not sufficient coverage.
The JSON also samples continuous headings at 0.1-degree intervals to expose
nearest-frame error for 8/16/32/64/128 directions. These sampled maxima are not
analytical bounds. At 64 directions the prone error already uses approximately
0.048 of the 0.05-tile allowance, leaving inadequate room for ordinary artwork
anchor error. At 128 directions the conservative prone angular bound is about
0.0241 tiles. Dense direction sets are one possible approach, not a requirement
to commission every character/weapon variant before proving the method.

The guide uses the existing fixed gameplay camera and shared geometry. Its white
cross is the world ground anchor; magenta is the physical muzzle and projected
tolerance circle. Body outlines are collision references, not replacement anatomy.
Use explicit authored anchors, particularly for prone poses: alpha-bottom changes
with direction and is not the world ground origin. Authored muzzle landmarks must
identify the barrel tip even when it is not the rightmost opaque image pixel.

## First bounded proof and hostile review

One species, one uniform, one rifle, all three stances. Preserve anatomy with
uniform scaling/reflection; do not bend limbs/weapons or change physical geometry
to fit the image. Record explicit ground, body and muzzle landmarks. Check actual
rendered muzzle positions at frame centers, selection boundaries and intermediate
headings against the unchanged 0.05 limit. Include original/rendered clean images
at gameplay scale and separate body/muzzle overlays. Door/window shots and camera
changes must preserve simulation outcomes.

Independent hostile review confirmed these criteria and the continuous-angle
gap. No directional implementation or production approval is claimed by this
guide. A restricted-facing alternative requires explicit acceptance and must
address firing, AI, sight cones, overwatch and prone collision together; a UI-only
snap silently changes or misrepresents gameplay. The user has been asked to choose
directional artwork or a concrete restricted-facing proposal before that work.

Water animation and representative full-map performance remain later gates.
