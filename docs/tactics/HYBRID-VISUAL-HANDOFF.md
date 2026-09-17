# Hybrid renderer: visual revision handoff

Review target: `sprite-migration` at `a247836`, compared with the original hybrid demo introduced in `ea2b24a` (canonical snapshot `d972983`).

## Verdict and intended outcome

The shared-world implementation is useful technical progress, but the current presentation is a visual downgrade from the original demo. It is not approved as the game's visual replacement. Keep the geometry and simulation work; revise its presentation before default cutover. Do not restart the migration or discard its headless integration.

The user wants a tile-based game with low-resolution sprite characters and a rich, coherent environment. The move to 3D is meant to fix architectural perspective, parallel lines, proportions, texture stretching and geometric consistency. It is not a request for a voxel or generic block-built art style.

Earlier wall artwork had already been stretched when walls were resized to match the characters. The original demo reused that artwork, so it is a reference for visual richness and character, not a mandate to restore its distorted UVs or incorrect camera ratio.

## Preserve this work

- Existing map-format support and the shared structural geometry adapter.
- One simulation for browser and headless use, with rendering optional.
- Consistent world units, meaningful openings, real floor levels and stable geometry IDs.
- World-scale material mapping so resizing a wall does not resize its bricks.
- Existing gameplay rules, editor workflows, deterministic replay and regression coverage.

The coordinator ran 16 focused geometry/material/sprite/combat tests successfully and loaded both viewers without browser errors. Those checks support the technical work; they do not establish visual acceptance or constitute a complete gameplay audit.

## 1. Restore material richness without restoring stretching

`hybrid-materials.js` currently supplies basic colors, arithmetic noise and repeated lines. Brick, concrete, grass and metal consequently read as placeholder materials beside the painted characters. Surface detail, variation and wear present in the demo have largely disappeared.

Replace these with art-directed, repeating surface materials appropriate to the existing palette. They may be authored, generated or procedurally produced; the acceptance criterion is the rendered result, not the technique.

- Use flat surface artwork without baked architectural perspective.
- Maintain consistent world-space texel density and physical brick-course dimensions across walls, piers, lintels and corners.
- Include restrained variations in brick color, mortar, concrete wear, metal finish and ground surface. Avoid both uniform fills and excessive noisy detail.
- Handle wall tops, end caps, sills and trim deliberately. Do not wrap the same brick facade indiscriminately over every face.
- Keep edges straight through geometry. Changing wall height or length must reveal more surface pattern instead of stretching it.

Gate: show short and long walls, two wall heights and a windowed corner in the same image. Material scale must agree while surfaces retain at least the original demo's level of visual richness at normal gameplay zoom.

## 2. Separate visual detail from collision simplification

`hybrid-props.js` currently renders its box-based collision descriptions directly. This produces square barrels, stacked-box trees and equipment that often looks like interchangeable rectangular blocks. Catalog coverage is valuable, but having a box for every named prop is not finished art coverage.

Shared geometry means a common authoritative location, dimensions, openings and gameplay-relevant shape. It does not require every visible surface to be the exact collision primitive.

- Give barrels cylindrical silhouettes, foliage organic or suitably stylized outlines, and equipment recognizable construction.
- Use lightweight meshes, textured planes or other appropriate techniques for detail that does not affect play.
- Derive visible forms and collision proxies from shared object parameters. Preserve meaningful gaps, heights and cover extents; avoid a separate hand-maintained collision map.
- Keep decorative details from unexpectedly blocking shots. Where a visible obstruction should affect play, make that relationship explicit and test it.
- Reuse existing environment artwork where it works as surface detail or a suitable sprite element; do not replace quality assets simply to make everything a box.

Gate: trees, barrels, crates and one piece of medical/industrial equipment must be recognizable without captions and visually belong beside the character sprites. Include a collision-overlay comparison to show that improved silhouettes remain consistent with gameplay.

## 3. Preserve the character artwork

`hybrid-sprites.js` moves sprite-mesh vertices around weapon landmarks to align the painted muzzle with a physical source point. This can satisfy a numerical muzzle-error limit while distorting the weapon, hands or nearby anatomy. Numerical alignment is necessary where relevant, but is not sufficient visual validation.

- Preserve recognizable anatomy, pose, weapon proportions and artwork quality across standing, kneeling and prone stances.
- Review both uniforms and representative species at actual gameplay scale, not only in enlarged diagnostic views.
- Prefer calibrated pose/facing anchors and appropriate artwork variants over conspicuous deformation. Subtle adjustments are acceptable only when visually sound.
- Keep body regions and muzzle origins in world space; camera changes must not change hits or sight.
- Do not globally warp a prone painted figure to make it fit arbitrary projected headings. Use supported directional presentation, suitable assets or a clearly documented interim camera/facing constraint.
- Avoid shrinking, stretching or bending the body merely to satisfy a hitbox test. If visual and physical requirements cannot both be met by the current assets, report the asset requirement.

Gate: supply a compact pose/facing comparison showing the original sprite next to its rendered result, plus body/muzzle overlays separately. No obviously bent guns, distorted limbs, flattened bodies or unstable ground anchors. Keep the existing numerical calibration tests, but add human visual review as a distinct gate.

## 4. Match lighting and scene presentation

The richly shaded character sprites currently stand out against flatter surroundings. Review material color response, lighting direction, contrast, grounding and contact shadows together. Avoid baking a second conflicting perspective or lighting scheme into the textures.

Keep the corrected 2:1 gameplay camera. Use free orbit for diagnostics until the art supports broader camera angles. Low-resolution characters should stay readable and crisp without turning the environment into a voxel aesthetic. Test filtering at normal, close and wide zoom for blur, shimmer and style mismatch.

Water is currently a static surface in the migration branch. Track this as a visual regression from the existing game; do not call full visual parity complete while established environmental animation is absent.

## Revision sequence

1. Finish one representative room: brick walls, a door, window, floor, roof edge and two unchanged-looking characters. Restore material richness and demonstrate stable texture scale.
2. Add a small prop sample: tree, barrel, crate and medical/industrial equipment. Establish visual silhouettes and collision policy before rebuilding the whole catalog.
3. Review stance/facing presentation and muzzle/body alignment together. Identify genuinely needed sprite variants instead of disguising gaps through deformation.
4. Apply the approved material and prop direction to the full map and editor, then rerun performance and gameplay checks.

Do not expand into additional systems while these visual revisions are pending. The next deliverable should be a small, convincing scene that establishes the intended quality, not more nominal catalog coverage.

## Evidence and delivery

Use `hybrid-test.html` as the original visual reference and `hybrid-viewer.html` / `index.html?renderer=hybrid` as the migration views. The builder's existing comparison files on `a247836` include `docs/tactics/hybrid-review/stage-4-regression.png`, `hybrid-game.png` and `stage-4-environment-catalog.png`; the original demo reference is `art/hybrid-test-review.png`.

Provide before/after images with comparable viewport, apparent tile size, lighting/exposure and scene content. Camera corrections may remain; label framing differences rather than allowing them to obscure the material comparison. Include normal gameplay zoom, a close material view, a wide view, and separate collision overlays. Judge clean images with overlays off first.

Report visual improvements, remaining compromises, tests and performance deltas separately. Do not present a passing screenshot script, a muzzle tolerance, or a count of supported props as proof that the art direction is approved.

Continue in the existing isolated migration worktree/branch, preserving unrelated agents' work. Push reviewable commits and provide their IDs for coordinator review. Keep hybrid opt-in and leave the canonical default unchanged until visual and functional gates pass. The coordinator's standing authorization to merge approved work does not waive this visual review.
