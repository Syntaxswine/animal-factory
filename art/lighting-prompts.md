# Lighting sprite provenance

No prompts. These seven sprites are not generated images; they are bakes of the 3D branch's
painted furniture library, so what stands in for a prompt here is the recipe that reproduces them.
Parcel B of `docs/tactics/SCENERY-PORT-HANDOFF.md`; the reasoning is in `docs/tactics/LIGHTING.md`.

## Recipe

```
git fetch codex "refs/heads/*:refs/remotes/codex/*"
git worktree add --detach ../af-3dref codex/project/tactics-3d
cd ../af-3dref && PORT=4319 node tools/serve.mjs
node tools/bake-scenery.mjs --group=lighting --shadow --out=<scratch>
```

- Source library: `dist/tactics/painted-furniture.js` on `project/tactics-3d`, served from
  `8e7140f`. The only change to that file between there and the tip `ec13c4a` is in
  `iron-searchlight-ladder-tower`, so the lighting forms are the tip's.
- Finish: `honey`, the workshop's first, for all seven.
- Camera: `GAME_CAMERA`, measured in the render at 2.000000 : 1 and 1.224745 height per ground
  unit; the tool refuses to bake otherwise.
- Light: `--light=catalogue` (the default), key light at (−1, 2, 3), fill 0.5, key 2.8, gain 1.3,
  no tone mapping, flame meshes unlit. Calibrated against painted `crate-wood` and
  `barrel-single`.
- Registration: `--shadow`, a flat `#13241d` ellipse at alpha 72 whose lowest point is the
  renderer's anchor.
- Canvas: 1254 × 1254 RGBA, 24 px margin; `standing-torch` came out at the 0.92 fit so its
  shadow would stay on the canvas.

| id | file | crop (alpha ≥ 64) |
| --- | --- | --- |
| `floor-lamp` | `lighting/floor-lamp.png` | 320, 108, 934, 1246 |
| `bedside-table-lamp` | `lighting/bedside-table-lamp.png` | 278, 139, 989, 1244 |
| `streetlight` | `lighting/streetlight.png` | 387, 109, 796, 1232 |
| `streetlight-double` | `lighting/streetlight-double.png` | 356, 103, 898, 1224 |
| `standing-torch` | `lighting/standing-torch.png` | 330, 170, 976, 1230 |
| `campfire` | `lighting/campfire.png` | 158, 361, 1095, 1147 |
| `cooking-fire` | `lighting/cooking-fire.png` | 164, 263, 964, 1240 |

Not baked for shipping: `wall-torch` and `gooseneck-sconce`, open question 5.
