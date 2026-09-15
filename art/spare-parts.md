# Spare parts

- Name: Spare parts
- Item ID: `spare-parts`
- Category: Junk / Quest item
- Description: i'm sure someone would think this is useful
- Sprite: `dist/assets/environment/loot/spare-parts.png`
- Design intent: material for repairing broken machines and modifying equipment.
- Status: sprite and gallery entry; inventory, quest consumption, repair and modification mechanics remain integration work. No costs, weight, recipes or drop rates established.

Generated with the built-in image_gen tool. Reference: `dist/assets/environment/loot/wire-cutters.png` (style and materials only). Original transparent alpha retained without processing.

## Exact prompt

Use case: stylized-concept. Asset type: inventory icon and ground loot sprite for Animal Factory Tactics. Primary request: one item called Spare parts, salvaged junk usable for machine repairs and equipment modifications. Reference image: style and materials ONLY, do not reproduce wire cutters. Subject: a compact overlapping cluster of useful industrial spare parts, one chunky worn steel gear as the main silhouette, a smaller brass cog, a short coiled steel spring, two large bolts with hex nuts, and a small loop of copper wire. No container, bag, tools or packaging. The objects touch or overlap as ONE readable pickup pile, not a scattered sheet. Worn and greasy but serviceable, modest rust, no futuristic electronics. Detailed hand-painted industrial tactics art matching reference, muted steel gray, brass and copper accents, soft upper-left illumination, strong readable silhouettes at 48 and 96 pixels. Orthographic isometric view looking down at ground objects, centered square 1254x1254 canvas, entire cluster fits inside 80 percent canvas with transparent margins. Genuine transparent alpha background and transparent gaps; no floor, cast shadow outside objects, labels, text, watermark, frame, glow or painted checkerboard.

## Bolt alignment correction

Edited with built-in image_gen using the first spare-parts sprite as the reference. Replaced the project sprite after visual review; the original remains in Git history.

Use case: precise-object-edit. Correct ONLY the crooked hex nut/bolt geometry on the two foreground bolts in this exact spare parts sprite. Align each hex nut's threaded bore concentrically along its bolt shaft; its bearing faces must be perpendicular to the shaft, with a straight continuous shaft axis through head, threads and nut. The left foreground bolt in particular currently has a skewed oversized foreground hex piece: straighten that piece to the thread axis. Make believable aligned hexagonal hardware using the SAME overall bolt positions, size, worn steel texture and perspective. Preserve the two gears, copper coil, central spring, composition, lighting, colors, silhouette, 1254 square canvas and all transparent background unchanged. No new objects or text. This is a minimal geometry correction, not a redesign. Genuine transparent alpha.

## Parallel-edge correction

Second geometry edit with built-in image_gen, checked visually against pairs of parallel straight guides on both bolts. Guides are review-only and are not part of the delivered sprite.

Precise local geometry edit. In the two foreground bolt assemblies, both hexagonal ends must have EXACTLY PARALLEL corresponding straight edges in this orthographic isometric drawing. Currently the near hexagonal ends are rotated/twisted left relative to the far ends. Correct that rotation. For EACH bolt, construct the near hexagonal end by translating the far hexagonal end shape along the straight bolt shaft, keeping the same edge angles; no rotating, skewing or changing perspective of the near end. All longitudinal edges of the bolt run parallel to its centerline. Both bearing planes perpendicular to the same straight shaft. Left bolt far-end top-face edge runs approximately from (116,697) to (198,620); near end corresponding edge must have that SAME slope (-77/82), not the current shallow slant. Apply same parallel-edge check to the upper AND lower edges, and to the right bolt too. Keep realistic metal hardware with nuts concentric to threads. Change ONLY the two bolt assemblies; preserve gears, spring, copper, layout, textures, lighting, canvas size and transparent background. Do not draw guides, lines, text or labels in final sprite. Retain hand-painted finish but geometrically straight machined hardware.
