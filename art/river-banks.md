# Shoreline tiles with interchangeable variants

Preview: `dist/tactics/river-bank-art.html`. Generator: `shore-tiles.js`. This replaces the preview's earlier fixed-width channel approach.

## Atlas

`dist/assets/environment/foliage/shore-tiles-atlas.png` is 512×1536: four columns and twelve rows of 128×128 RGBA bank overlays. Three consecutive 4×4 blocks contain variants A, B and C. Index within each block is the corner mask 0–15, row-major. Land corner bits: NW=1, NE=2, SE=4, SW=8. Mask 0 is transparent open water; 15 is solid land. Those two uniform patterns are intentionally identical across variants.

Draw animated water beneath the bank layer. Keep water orientation and phase consistent between tiles. Adjacent tiles must agree on BOTH corners of their shared edge. A land/water boundary crosses a mixed edge at its midpoint; the entire boundary RGBA profile is identical across compatible tiles and variants. Interior contour variation fades out with zero slope at edges. The generator uses shared corner interpolation rather than fixed-width river paths, allowing wide rivers, coasts and lakes.

The preview swaps variants without changing meeting points and can display a grid with shoreline crossing markers. A dropdown selects A, B or C for tile-set inspection. Export saves all 48 cells as one overlay atlas. Separate gameplay integration remains outstanding.

## Validation

Exhaustive RGBA comparison of every compatible pairing across all 48 tiles; midpoint crossings, interior differences, all-land/all-water semantics and shared-corner mask tests. Existing water edge and loop tests pass. Browser checks cover river/lake/coast layouts, variant swaps, atlas selection, animation and PNG export. Connected river preview visually reviewed.

The previous `river-banks-atlas.png` and `river-banks.js` remain legacy fixed-channel assets; their connection-bit schema is different and must not be used to index this shoreline set. Existing painted water and grass are reused through the code renderer; no new image generation was needed for this geometry change.
