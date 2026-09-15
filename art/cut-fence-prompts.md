# Cut chain-link fence

Asset: `dist/assets/environment/fence-chainlink-cut.png` (1254 × 1254 RGBA).

Corrected by directly modifying `dist/assets/environment/fence-chainlink.png`, as requested. `tools/cut-fence.ps1` reproduces the doorway cutout by clearing mesh pixels to transparent. No image generation, resizing, repainting or reprojection is used for this correction. Every pixel outside the cutout is retained. Both posts, top rail and bottom rail remain intact, preserving the original fence proportions and placement baseline.

The earlier generated variant was replaced because its proportions did not match. The source fence remains unchanged.

Art only: wire-cutting interaction and traversal changes remain separate work.
