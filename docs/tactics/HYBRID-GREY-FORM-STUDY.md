# Horse worker: grey form study

This separate study responds to the request for deliberate character modeling before further texture or animation work. Open `/tactics/horse-grey.html` for neutral standing front, side and three-quarter views at a shared orthographic scale. The middle view can show the rear; silhouette and wireframe controls support form inspection.

The shirt and sleeves form one connected surface. The overalls join the bib, straps, waist, seat and both legs. The horse skull, cheeks, jaw, neck, ears and eye forms share one surface. Substantial forearms, a broad stance and exposed horse hooves restore the worker silhouette. Modeled folds describe sleeve compression and fabric around the knees, ankles and seat. All parts use the same plain grey material without texture maps.

Standing height remains 1.65 world units, with both hoof bearing surfaces at zero. Tactical rules and the existing renderer are unchanged. This is a static sculpt/proportion study: its 856,076 triangles are not a proposed gameplay budget. Retopology, UV authoring and rigging remain future work after the user approves the forms.

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

## Local face and waist corrections; gameplay-size comparison

The architect accepted `1fc4f94` proportions as the working baseline, requesting localized corrections before texture or animation. The shirt torso now tucks into the waist instead of hanging beneath the armpits. The lower bib widens and blends into the waist. Almond eyelid rims frame recessed eye surfaces, with integrated cheek/jaw volumes and a shallow muzzle plane break. Overall stance and prototype height remain unchanged.

Select **Gameplay-size sprite comparison**, or open `/tactics/horse-grey.html?view=gameplay`. Both panels use the existing prototype camera (45-degree azimuth, 30-degree elevation) and native comparison scale of 58 CSS pixels per world unit. The original rifle sprite uses the existing `rigidSpriteVertex` calibration; the grey model keeps its physical dimensions. The silhouette toggle applies to both. The sprite is armed and posed while the model is neutral and unarmed, so rifle/arm silhouettes differ; no pose-matching claim is made.

Evidence: `hybrid-review/grey-study/gameplay-size.png` and `gameplay-silhouettes.png`, alongside refreshed close views. The geometry test passes; browser checks verify actual camera pixels per unit and viewport size, and found no browser/network errors. This remains a sculpt study, not a runtime mesh, and texture/animation work is still pending review of this comparison.

The first hostile review scored this local pass 8.5/10, accepting the native comparison implementation but flagging triangular lower-bib flaps. The revision eases the bib width, tapers cloth clearance into the waist, and progressively blends the surfaces. Eyelid separation is slightly increased. Geometry and browser checks pass again. At native size, ears, muzzle and stance carry most of the character recognition; the small facial details require the close views to judge. Pose differences remain visible and disclosed.

Final independent hostile review: **9/10 for the localized corrections and native comparison**. The reviewer confirmed smooth curved bib-to-waist edges, retained cheek/jaw definition, correct comparison scale, disclosed pose differences, and an independently passing geometry test. Texture and animation remain pending.
