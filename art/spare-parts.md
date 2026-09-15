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

## Restore six-sided fasteners

Previous parallel-edge revision produced beveled rectangular blocks. Replaced with six-sided hexagonal heads and nuts, with threaded bolt tips visible through the near nuts. Edited using built-in image_gen and visually reviewed for hexagonal profiles and consistent orientation.

Edit this spare-parts sprite ONLY at the two foreground bolts. The current ends are WRONG: beveled rectangular blocks. Replace ALL FOUR end blocks with actual regular SIX-SIDED HEXAGONAL steel bolt heads / nuts, like standard hex fasteners. Each end face must visibly have SIX substantial sides with six corners, three pairs of opposite parallel edges; NOT a square or rectangle with tiny chamfered corners, NOT an octagon. Use a point-up hexagonal profile with a distinct top apex, upper-left and upper-right sloping edges, two side edges, lower-left and lower-right sloping edges, and a distinct bottom apex, projected consistently into the isometric camera. Thin extruded hexagonal prism, not a chunky cube. Near ends should be clear hexagonal nuts with centered threaded circular bore and a short visible bolt tip; far ends solid hex bolt heads. Threaded shaft centered and straight through both. On each bolt use the SAME hex profile orientation at both ends, simply translated along the shaft, so corresponding hex edges remain parallel with no twist. Preserve bolt locations, shafts, worn metal material and the entire surrounding sprite: gears, spring, copper wire, lighting, scale and transparency. Keep original square canvas and genuine alpha. No guides or text.

## Rounded corners and broader highlights

User-directed finishing edit using built-in image_gen: softened fastener corners and broadened pale highlights to reduce the prominence of facet boundaries. Visually reviewed before replacing the sprite.

Use case: precise-object-edit. Make a small painterly finishing adjustment ONLY to the heads and nuts of the two foreground bolts in this exact sprite. User direction: round the corners and expand the white highlight to make the geometry less clear. Gently round and wear down their sharp hexagonal corners; retain a recognizable softened hex fastener silhouette, not circular nuts. Broaden the existing ivory-white metal highlights across the top-facing edges and around adjacent corners, with soft feathered transitions into side faces. Break up the hard planar edge lines with broad rubbed-metal sheen so the exact facet boundaries become less prominent. Keep some worn steel texture visible; no blown-out pure-white blobs, glow or overall blur. Preserve all shafts, threads, bolt tips, positions, scale, gears, spring, copper wire, colors, overall lighting and original 1254-square framing. Everything outside the four bolt heads/nuts remains unchanged. Genuine transparent alpha background. No added objects, labels or guides.
