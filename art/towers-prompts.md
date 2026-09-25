# Tower sprite provenance

No prompts. These four sprites are not generated images. They are bakes of the 3D branch's painted
furniture library, so the recipe that reproduces them stands in for a prompt. Parcel C of
`docs/tactics/SCENERY-PORT-HANDOFF.md`. The reasoning, and why a bake ships here at all (a stated
deviation, open question 9, by the boss's call of 24 September 2026), is in `docs/tactics/TOWERS.md`.

## Recipe

```
git fetch codex "refs/heads/*:refs/remotes/codex/*"
git worktree add --detach ../af-3dref-towers b23334c
cd ../af-3dref-towers && PORT=4319 node tools/serve.mjs
node tools/bake-scenery.mjs --group=towers \
  --form=wooden-spotlight-tower,iron-searchlight-stair-tower,iron-searchlight-ladder-tower,spotlight \
  --light=catalogue --skin=honey --out=<scratch>
```

- **Source:** `dist/tactics/painted-furniture.js` on `project/tactics-3d` at **`b23334c`**, which is the
  tree that was served. It includes the `wideExit` doorway that `ec13c4a` gave
  `iron-searchlight-ladder-tower`, so these bakes are newer than the underlays in
  `docs/tactics/scenery-bake/out/`, which came from `82e60cf`.
- **Finish:** `honey` for all four.
- **Camera:** `GAME_CAMERA`, measured in the render at 2.000000 : 1 and 1.224745 height per ground unit.
  The tool refuses to bake otherwise.
- **Light:** `--light=catalogue`, parcel B's rig: key light at (−1, 2, 3), fill 0.5, key 2.8, gain 1.3, no
  tone mapping, flame meshes unlit, and the `iron` material re-tinted to `0x5c5f58`. The lenses of the
  searchlights and the spotlight are the library's own.
- **Registration:** none painted. The towers are planted by `foot`, the footprint centre the bake records.
  Each asset's `footCentre` and `gameScale` are in `dist/assets/environment/manifest-towers.json`, and
  `tools/catalog-environment.py` copies `footCentre` into `prop-art-towers.js` as `foot`.
- **Canvas:** 1254 × 1254 RGBA, 24 px margin, full fit for all four.

Crops are the ones `tools/catalog-environment.py` writes into `dist/tactics/prop-art-towers.js`. A repaint
keeps its placement as long as the painted subject stands where the bake's did. `foot` is a point in the
PNG, not a property of the pixels, so nothing needs restoring afterwards.

Not baked for shipping: the fourteen other towers in the gallery, which are not map kinds on either branch
(open question 1).
