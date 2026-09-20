# Donkey worker study

First painted donkey study on the shared 17-bone worker rig. The original sprite and `donkey-turnaround-v2.png` guide the long cupped ears, broad pale muzzle, short dark mane, olive jacket, yellow scarf, brown trousers and single left-knee patch. The neutral and rifle-carry poses are a study, not a complete animation set or battle integration.

- Author mesh: 28,898 triangles; reduced mesh: 10,110 triangles; separate rifle: 480 triangles.
- Thirteen closed connected surfaces, including a physical scarf wrap, knot and two ends. Jacket lapels and pockets are painted detail.
- Species-specific geometry lives in `tools/build-donkey-worker.mjs`; regenerate with Node 22+.
- Viewer: `dist/tactics/donkey-worker.html?mesh=10k`, with sprite/author comparison, grey, wireframe and coverage modes. `stage=grey` skips paint loading.
- Coverage distinguishes direct projection, borrowed paint and fallback. Hidden cloth surfaces reuse existing paint; this is not a fully unwrapped production texture atlas.

## Validation

All 440 project tests passed. Donkey tests check closed connected surfaces, scale, both ears, muzzle and bounded mane; normalized skin weights, foot stability, actual hand proximity to the rifle grips and return to neutral. The low mesh retains every author component.

`tools/donkey-browser-review.mjs` checks both meshes at eight headings, two poses and close/native scales (64 combinations), saves screenshots and coverage data, and checks horse/goat rendering after the shared shader changes. Set `PLAYWRIGHT_PATH` to the installed Playwright module and optionally `REVIEW_ORIGIN` (defaults to localhost:4423). Serve with `PORT=4423 node tools/serve.mjs`. Browser run passed without console, resource or shader errors.

Review screenshots and the exact grey paint target are in `docs/reviews/donkey-study`. The model reads clearly at gameplay size; close-up hand shapes, thin scarf edges, and facial projection transitions remain polish items. User visual approval remains separate from these technical checks.

## Paint provenance

Built-in ImageGen edit, using the exact four-camera grey render first and the existing donkey turnaround second. Output copied unchanged to `dist/assets/characters/lowpoly-proof/donkey-worker-model-paint-v1.png`. Generated output was 1774 × 887 (same 2:1 layout as the requested 2048 × 1024); projection coordinates are normalized. No external API or image-processing edits were used.

Prompt:

> Use case: precise-object-edit. Image 1 is an exact registered four-camera grey mesh render for a game texture projection. Paint ONLY its existing surfaces, preserving every silhouette, pixel position, neutral pose, camera, panel layout and grey background. Output 2048x1024. Image 2 is identity and illustrated painting reference ONLY: do not adopt its pose, framing or proportions. Paint the donkey from image 1 as the worker in image 2: warm grey-brown fur, cream muzzle and inner ears, expressive dark eyes on existing eye indentations, short black mane and dark tufted tail, olive green work JACKET with lapels pockets and buttons over narrow cream shirt front, rolled olive sleeves, brown trousers, black-brown single equine hooves, yellow neckerchief on the existing wrap knot and two sculpted tails. Jacket ends where sculpt ends. Upper arm tan sewn patches as reference; exactly ONE tan knee repair patch on anatomical LEFT knee (viewer-right in first front panel and in FOURTH panel left-facing profile), no patch on second right-facing profile knee. Bright readable painterly game illustration, coherent lighting, no grey bare surfaces on character, no added geometry or text, no backgrounds, no weapons. Four panels are front, right-facing profile, back, left-facing profile. Keep eyes single and aligned. Preserve the first image tightly for projection registration.
