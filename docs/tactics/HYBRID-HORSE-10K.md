# Painted horse at approximately 10,000 triangles

The user requested the same detailed skin on a roughly 10,000-triangle character. The new mesh has **10,300 character triangles**, compared with the previous 28,886: a **64.34% reduction**. The separate 480-triangle rifle brings the carry total to 10,780. The painted artwork, material treatment, skeleton, carry pose, camera and prototype dimensions are retained.

Open `/tactics/horse-light.html?mesh=10k`. The default comparison is 28,886 triangles on the left and 10,300 on the right, with matched headings, pose, material and scale. **Model** switches the right model; **Compare with** selects the original sprite or the higher-detail mesh. Native/close, grey, wireframe and paint-coverage inspection remain available. The plain URL retains the previous mesh as its default.

## Reduction

`node tools/build-horse-light.mjs --10k` independently reduces the approved 856,076-triangle grey sculpt into `dist/tactics/horse-10k-data.json`. Running without the flag still builds the existing 28,886-triangle asset; neither reference asset is replaced.

| Surface | Triangles |
| --- | ---: |
| Shirt and sleeves | 1,700 |
| Overalls and legs | 2,600 |
| Forearms and hands | 2,502 |
| Hooves | 700 |
| Skull, jaw, neck and ears | 2,498 |
| Mane | 300 |
| **Character total** | **10,300** |

The hands retain slightly more than their nominal allocation because the simplifier reaches its 0.004-world-unit error limit first. The largest reported simplifier error is approximately 0.00897 world units on the overalls. These are algorithmic estimates, not measured maximum surface distances. The same normalized weighting function produces 17 bones and eight skinned surfaces. Neutral height remains 1.65 world units and hoof minima remain at zero.

The exact same painted sheet is projected on the reduced geometry. Visibility depth and part-ID buffers are built from the selected mesh, so its source coverage is checked again rather than inherited as an assumption. All four source projections remain attached in bind space. The comparison viewer loads both models and their projection buffers for inspection; it is not a runtime performance benchmark.

## Validation and limits

Eight Node tests pass across both meshes: closed connected surfaces, triangle/error budgets, valid normalized skinning, bind-pose identity, unchanged height/grounding, actual arm deformation and hand contact, plus projection-camera and validity-mask checks. The separate rifle's muzzle endpoint is also retained.

`node tools/horse-model-paint-review.mjs --10k` captures neutral and carry at eight headings, both native and close scale. It also records matched coverage measurements for both models, grey/wire comparisons and the original sprite comparison. Browser, shader, resource and projection-visibility checks pass. The Pages build includes the new asset.

Among classified visible character pixels in the close captures, flat fallback occupies approximately **1.17–2.68%** on the reduced mesh. Every matched close view is slightly below the previous mesh's fallback percentage. This is screen-space evidence, not a total-surface measurement. Paint reuse and small projection seams remain as documented in [the painted-skin experiment](HYBRID-MODEL-PAINT.md).

Grey and wireframe reveal simpler small folds and hoof edges. Grey mode also exposes dark triangular hoof shading from the reduced surface normals; correct that before using lit materials. It does not materially affect the current unlit painted comparison. This is a lower-detail version of the existing single-pose experiment; walk, kneel, firing, unrestricted deformation, full lighting response and multi-unit performance remain unproven. Fewer triangles alone do not establish a frame-time improvement.

Evidence: `hybrid-review/horse-10k/`, including `checks.json`. Independent hostile review scored **9/10 for the bounded 10k mapped-skin comparison**, confirming preserved gameplay-size silhouette, facial detail and carry readability with modest close-view simplification. The reviewer independently ran all eight tests and checked live switching at 58 CSS pixels/world unit without browser errors. Canonical gameplay and the full graphics merge remain outside this change.
