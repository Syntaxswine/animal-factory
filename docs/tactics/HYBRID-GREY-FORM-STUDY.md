# Horse worker: grey form study

This separate study responds to the request for deliberate character modeling before further texture or animation work. Open `/tactics/horse-grey.html` for neutral standing front, side and three-quarter views at a shared orthographic scale. The middle view can show the rear; silhouette and wireframe controls support form inspection.

The shirt and sleeves form one connected surface. The overalls join the bib, straps, waist, seat and both legs. The horse skull, cheeks, jaw, neck, ears and eye forms share one surface. Substantial forearms, a broad stance and exposed horse hooves restore the worker silhouette. Modeled folds describe sleeve compression and fabric around the knees, ankles and seat. All parts use the same plain grey material without texture maps.

Standing height remains 1.65 world units, with both hoof bearing surfaces at zero. Tactical rules and the existing renderer are unchanged. This is a static sculpt/proportion study: its 790,924 triangles are not a proposed gameplay budget. Retopology, UV authoring and rigging remain future work after the user approves the forms.

## Evidence and review

- `hybrid-review/grey-study/front-side-three-quarter.png`
- `hybrid-review/grey-study/front-rear-three-quarter.png`
- `hybrid-review/grey-study/silhouettes.png`
- `hybrid-review/grey-study/topology.png`
- `hybrid-review/grey-study/checks.json`

For the initial version, the hostile reviewer scored the study 8/10. Sleeve, forearm, eye, mouth and mane revisions raised the score to **9/10 for readiness to present the form decision**. Minor remaining observations concern sleepy eyelids, broadly blocked mane detail and strap edges. This review does not replace the user's approval of the proportions and garment shapes.

Validation passed: `node --test tests/horse-grey.test.mjs` and `node tools/horse-grey-review.mjs`. Geometry checks verify finite positions/normals, one connected component per part, closed manifold edges, the approved standing height, grounded soles and untextured materials. Browser checks found no page or network errors. The build manifest includes all four new viewer/model modules.

The previous high-detail textured experiment remains separate and uncommitted. This study introduces no new texture or animation. **User approval of these forms is pending.**

## Exposed hoof correction

The original `dist/assets/characters/armed/horse-rifle.png` shows exposed hooves below the trousers. Replaced the footwear shapes with single sloped hoof capsules and short exposed pasterns, removing the long boot toes, sole slabs and boot shafts. The neutral pose and approved standing height remain unchanged. Refreshed all four review images; geometry and browser checks pass.

Independent hostile review scored this bounded hoof correction **9/10**, with an independent geometry-test pass. This does not approve the full character or authorize texture/animation work.

## Targeted grey proportion pass after architect review

The architect did not approve proportions at `252e2b5`; the earlier review scores were not proportion approval. This pass reduces shoulder and sleeve inflation, fits the bib to the shirt surface and waist, seats the eyes within the skull, straightens and reduces the rounded mouth, reshapes the mane as a swept crest, and replaces repeated trouser rings with localized diagonal creases. Stance, exposed hooves, connected surfaces and the 1.65 standing height remain intact.

The first revision received 8/10 for remaining bead-like eyes, rigid mane locks, rough garment edges and regular chest creases. A second revision addresses those findings. Geometry and browser checks pass; refreshed front, side, rear, three-quarter, silhouette and topology evidence is in the same review directory. This remains an untextured, static proportion study awaiting the user’s visual approval.

The second visual review scored 8.5/10, requesting less hollow eyes and cleaner bib/strap borders. The third revision brings the eye surface forward within the socket and bevels cloth boundaries with consistent clearance from the underlying shirt. Both focused checks pass on this revision.

Final independent hostile review: **9/10 for the targeted finishing corrections**. The reviewer found the eyes seated within their sockets, continuous clean bib/strap borders across views, and independently passing geometry checks. Overall proportions still require the user's approval before texture or animation.
