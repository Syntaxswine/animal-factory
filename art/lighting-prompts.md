# Lighting sprite provenance

No prompts. These seven sprites are not generated images; they are bakes of the 3D branch's
painted furniture library, so what stands in for a prompt here is the recipe that reproduces them.
Parcel B of `docs/tactics/SCENERY-PORT-HANDOFF.md`; the reasoning, and why a bake ships here at
all (a stated deviation, open question 9), is in `docs/tactics/LIGHTING.md`.

## Recipe

```
git fetch codex "refs/heads/*:refs/remotes/codex/*"
git worktree add --detach ../af-3dref 8e7140f
cd ../af-3dref && PORT=4319 node tools/serve.mjs
node tools/bake-scenery.mjs --group=lighting --light=catalogue --register --out=<scratch>
```

- Source: `dist/tactics/painted-furniture.js` on `project/tactics-3d` at **`8e7140f`**, which is
  what was served. The branch tip when this was written, `ec13c4a`, differs in that file only in
  `iron-searchlight-ladder-tower`, so the lighting forms bake identically from either. (The
  earlier *underlays* in `docs/tactics/scenery-bake/out/` came from `82e60cf`; these do not.)
- Finish: `honey`, the workshop's first, for all seven.
- Camera: `GAME_CAMERA`, measured in the render at 2.000000 : 1 and 1.224745 height per ground
  unit; the tool refuses to bake otherwise.
- Light: `--light=catalogue`, key light at (−1, 2, 3), fill 0.5, key 2.8, gain 1.3, no tone mapping,
  flame meshes unlit, the `iron` material re-tinted to `0x8c887e`. Calibrated against painted
  `crate-wood`, `barrel-single` and `jail-bars`.
- Registration: `--register`, two `#13241d` pixels at alpha 64 on the anchor row, symmetric about
  the footprint centre. Each asset's `footCentre` and `gameScale` are recorded in
  `dist/assets/environment/manifest-lighting.json`.
- Canvas: 1254 × 1254 RGBA, 24 px margin, full fit for all seven.

Crops are the ones `tools/catalog-environment.py` writes into `dist/tactics/prop-art-lighting.js`.

Not baked for shipping: `wall-torch` and `gooseneck-sconce`, open question 5.
