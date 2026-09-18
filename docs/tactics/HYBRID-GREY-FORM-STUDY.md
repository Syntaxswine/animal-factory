# Horse worker: grey form study

This separate study responds to the request for deliberate character modeling before further texture or animation work. Open `/tactics/horse-grey.html` for neutral standing front, side and three-quarter views at a shared orthographic scale. The middle view can show the rear; silhouette and wireframe controls support form inspection.

The shirt and sleeves form one connected surface. The overalls join the bib, straps, waist, seat and both legs. The horse skull, cheeks, jaw, neck, ears and eye forms share one surface. Substantial forearms, a broad stance and exposed horse hooves restore the worker silhouette. Modeled folds describe sleeve compression and fabric around the knees, ankles and seat. All parts use the same plain grey material without texture maps.

Standing height remains 1.65 world units, with both hoof bearing surfaces at zero. Tactical rules and the existing renderer are unchanged. This is a static sculpt/proportion study: its 710,476 triangles are not a proposed gameplay budget. Retopology, UV authoring and rigging remain future work after the user approves the forms.

## Evidence and review

- `hybrid-review/grey-study/front-side-three-quarter.png`
- `hybrid-review/grey-study/front-rear-three-quarter.png`
- `hybrid-review/grey-study/silhouettes.png`
- `hybrid-review/grey-study/topology.png`
- `hybrid-review/grey-study/checks.json`

The hostile reviewer initially scored the study 8/10. Sleeve, forearm, eye, mouth and mane revisions raised the score to **9/10 for readiness to present the form decision**. Minor remaining observations concern sleepy eyelids, broadly blocked mane detail and strap edges. This review does not replace the user's approval of the proportions and garment shapes.

Validation passed: `node --test tests/horse-grey.test.mjs` and `node tools/horse-grey-review.mjs`. Geometry checks verify finite positions/normals, one connected component per part, closed manifold edges, the approved standing height, grounded soles and untextured materials. Browser checks found no page or network errors. The build manifest includes all four new viewer/model modules.

The previous high-detail textured experiment remains separate and uncommitted. This study introduces no new texture or animation. **User approval of these forms is pending.**

## Exposed hoof correction

The original `dist/assets/characters/armed/horse-rifle.png` shows exposed hooves below the trousers. Replaced the footwear shapes with single sloped hoof capsules and short exposed pasterns, removing the long boot toes, sole slabs and boot shafts. The neutral pose and approved standing height remain unchanged. Refreshed all four review images; geometry and browser checks pass.

Independent hostile review scored this bounded hoof correction **9/10**, with an independent geometry-test pass. This does not approve the full character or authorize texture/animation work.
