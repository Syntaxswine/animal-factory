# 2D integration review — September 22

Reviewed mature trees `bd999f5`, scenery-group foundation `eeb524c`, scenery handoff `1b59013`, and sprite-baking proof `ac68684` against 2D canonical `6e2782a`.

Fixed a missing group-art path lookup in environmentRenderer: grouped props had crop metadata but would request the root asset path instead of their declared subfolder. Added a populated-group rendering regression that verifies both image URL and crop. Empty-group catalog checks alone did not cover this case.

Validation: 488 tests and asset checks pass; the Pages build passes. Both mature tree variants import into the actual 2D editor and playtest without browser or asset errors. They reuse existing paintings at 1.8 scale and retain one-tile trunk rules.

The sprite tool is an experimental baker, not a replacement sprite catalog. A fresh horse/rifle sample at headings 0 and 90 for idle and kneeling generated four images; heading 90 reported bottom clipping of 13 and 7 pixels. Production sprite art is unchanged. Prone, other weapon coverage, framing and the raw-bake versus painted treatment decision remain work described by the handoff. The 3D project is unchanged by this integration.
