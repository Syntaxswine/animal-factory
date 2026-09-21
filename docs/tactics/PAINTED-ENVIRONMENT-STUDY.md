# Painted environment comparison

This isolated follow-up to `5ed8777` lives on `environment-painted-study` in the
`animal-factory-environment-painted` worktree. The original main commit is not
reverted or replaced. No catalog-wide treatment or gameplay change is included.

Open `tactics/painted-environment.html`. The comparison contains one brick wall,
an open doorway, a wooden crate, a blue steel drum and the existing approved
10,300-triangle horse. The two render passes share one unchanged horse instance,
paint projection, neutral pose, camera and lighting. The left environment uses
the actual `5ed8777` hybrid model/material code. The right uses the study models.

Native inspection is 58 CSS pixels per world unit, matching the approved horse
study. Close inspection is 110 px/unit; neither scale automatically zooms to make
an object look better. The default view is the 45°/30° isometric camera. Dragging
orbits both sides together. Narrow-screen comparisons stack vertically to retain
native scale. The viewer also permits either scene alone and environment wireframe.

## Art changes

- Broad painted bitmap material regions, using the approved horse's shirt,
  overalls and fur as the style reference. No procedural noise is added.
- Individually modeled brick courses with softened arrises, small alignment and
  depth variation, recessed mortar, a dressed-stone doorway and coping.
- Quiet warm brick midtones with independently varied paint strength. Stronger
  brush marks are reserved for a minority of bricks, avoiding a repeated diagonal
  patch on every face. The floor is deliberately quieter than the character.
- Individual crate planks, grain aligned to boards and braces, softened edges,
  nail heads and selective rubbed edges. Dense high-contrast grain is suppressed.
- Rounded drum shoulders, a mild belly and dent, rolled rings, lid and bung;
  blue paint, rust and sparse scuffs preserve a readable silhouette at native scale.

The brick opening remains clear through the same one-tile width and 1.65 height.
The decorative coping adds approximately .07 above the two-unit wall. The study
does not install these meshes as collision volumes or alter game outcomes.
Scenery totals 26,764 triangles; visual approval is about paint/form coherence,
not polygon count. This is not a many-object performance budget.

## Review

The independent reviewer explicitly replaced the previous technical/prototype
criteria with an art gate: 40% character/environment coherence, 25% purposeful
painted variation and material readability, 20% form/contacts/wear, and 15% native
scale readability. Technical checks could not increase the art score.

First pass: 7/10. Wall looked coppery, wood grain too polished, floor too busy.
Second pass: 8/10. Colour improved but every brick carried a strong diagonal
patch. Third pass: **9/10 artistic fit for this isolated comparison scene** after
varying paint contrast and reserving strong marks for fewer bricks. The reviewer
opened the live scene, orbited front/back and checked scale switches without
browser errors. Regular brick courses and some repeated crate grain remain
nonblocking polish. This is not architect/user signoff or catalog propagation
approval.

Final validation: `npm run check` passed all **462 tests** and asset validation;
`npm run build:tactics-3d` passed. The asset checker explicitly validates the new
1254×1254 RGB runtime atlas. Two focused tests check finite softened geometry and
the unobstructed doorway. Browser captures completed with zero console/page errors.

Evidence is in `painted-environment-review/`: matched native/close screenshots,
front/back/side views, mobile views, independent reviewer screenshots, browser
results and the check log. `tools/painted-environment-review.mjs` reproduces the
browser captures with Playwright/Edge against localhost:4329. Serve this worktree
with `PORT=4329 node tools/serve.mjs` (use shell-appropriate environment syntax).

## Texture provenance

Both atlases were made using the built-in imagegen tool. The final consumed asset
is `dist/assets/environment/painted-study/material-atlas-v2.png` (1254×1254 RGB).
V1 is retained only as review history in `painted-environment-review/`.
The four quadrants are clay, wood, blue steel and stone. GPU UV crops stay within
their assigned quadrant. Shader contrast/value treatments are presentation-only;
the approved horse texture is unchanged.

The exact prompt set and reference roles are recorded in
`painted-environment-review/texture-prompts.md`.
