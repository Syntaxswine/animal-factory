# Animated open water

Preview: `dist/tactics/water-art.html`. Source: existing `dist/assets/environment/foliage/river-water.png`, unchanged.

This is a code-rendered animation of the existing painted asset, not new generated imagery. The preview resamples it to 192 square pixels, blends four half-period offsets using complementary sine-squared weights, and applies periodic displacement and gentle brightness variation over six seconds. Each source wrapping boundary has zero contribution at its cut. The resulting surface repeats in both directions without mirroring.

`water-animation.js` exports the periodic preparation and frame renderer. Prepare once, render one shared frame, and reuse it across all open-water tiles with the same clock and UV orientation. Do not randomize per-tile animation phase: that would break continuity. Output duplicates the opposite edge samples for exact pixel agreement. The preview updates at 24 fps and supports pause, scrubbing, tile guides and an isometric projection. Reduced-motion preferences start it paused.

Validation: unit tests cover every output edge at multiple phases, exact loop closure and motion between phases. Browser validation with the actual source PNG measured zero RGB difference across opposite edges at seconds 0–6; controls and reduced motion passed without page errors. The 3×3 preview was visually reviewed.

Scope: open-water preview and reusable renderer only. The earlier riverbank art still needs alignment; no bank masks, gameplay integration, swimming or collision rules are included. This CPU renderer prioritizes a reviewable reference implementation; profile it before integrating at larger resolution.
