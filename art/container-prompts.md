# Lootable container sprites

Four closed/open pairs. Art preview only; placement, loot contents, locks and gameplay interactions are not wired into the game.

All PNGs retain the original square transparent canvas. Closed crate, chest and cabinet are copies of existing assets; open states edit those exact references. Toolbox uses the steel chest as a style reference, then its own closed image for the open edit. Open interiors are empty; the closed cabinet still shows its original supplies.

`dist/tactics/container-art.js` holds the pair registry and preview translations in source pixels. The chest open image is shifted up 47 px to align its lowest body corner with the closed reference. Images are drawn at identical scale within each pair, never independently fitted to opaque bounds. Registration is approximate: painted hardware and wall details can vary between states. World scale is not calibrated.

## Exact generation prompts

### Wooden shipping crate — open

Reference: `dist/assets/environment/crate-wood.png`

Use case: precise-object-edit. Game asset: lootable container state for Animal Factory Tactics. Modify this exact wooden crate to show its OPEN state. Remove only the top lid panel including its diagonal lid brace; lid is removed from scene entirely. Reveal a dark EMPTY wooden interior with thick rim and visible inner walls and floor. Keep both exterior side walls, braces, corner ironwork, all bottom corners, silhouette of base, width and height of the crate BODY in precisely the same image coordinates. No lid floating beside it. No loot inside. Preserve the reference's orthographic isometric camera, worn industrial painterly art, muted colors, soft upper-left lighting and exact original 1254x1254 canvas. For edits change only the opening and visible interior, keep exterior body design and ground anchor invariant. Single isolated object on genuine transparent alpha background, transparent gaps, no ground plane, no shadow backdrop, no people, text, labels, watermark, glow or checkerboard pattern. All object parts fully visible.

### Steel supply chest — open

Reference: `dist/assets/environment/crate-steel.png`

Use case: precise-object-edit. Game asset: lootable container state for Animal Factory Tactics. Modify this exact olive steel supply chest to show its OPEN state. Unfasten its two latches and hinge the original lid upward about 60 degrees around its far rear long edge. Reveal a dark EMPTY metal interior. Keep all exterior body panels, carrying handle, feet, corners, base and body size at exactly the source image coordinates. No enlarging, shrinking, shifting or rotating the BODY to fit the lid. Use the existing transparent headroom for the raised lid, and keep it entirely in frame. Preserve the same ribbed lid design and hardware, only change its hinge angle. No loot inside. Preserve the reference's orthographic isometric camera, worn industrial painterly art, muted colors, soft upper-left lighting and exact original 1254x1254 canvas. For edits change only the opening and visible interior, keep exterior body design and ground anchor invariant. Single isolated object on genuine transparent alpha background, transparent gaps, no ground plane, no shadow backdrop, no people, text, labels, watermark, glow or checkerboard pattern. All object parts fully visible.

### Medicine cabinet — open

Reference: `dist/assets/environment/facility/medicine-cabinet.png`

Use case: precise-object-edit. Game asset: lootable container state for Animal Factory Tactics. Modify this exact medicine cabinet to show its OPEN state. Swing both existing glass upper doors outward about 60 degrees on their original outer-side hinges. Cabinet carcass, top slab, sides, feet, two lower closed drawers, shelving, camera and body size MUST remain at precisely the original pixel positions. Reveal EMPTY shelves with no bottles, bandages or tins; remove the stored items but retain all shelves. Doors must remain fully visible inside transparent side margins. Preserve the ivory paint and hardware. The cabinet BODY must not be shrunk or widened. Preserve the reference's orthographic isometric camera, worn industrial painterly art, muted colors, soft upper-left lighting and exact original 1254x1254 canvas. For edits change only the opening and visible interior, keep exterior body design and ground anchor invariant. Single isolated object on genuine transparent alpha background, transparent gaps, no ground plane, no shadow backdrop, no people, text, labels, watermark, glow or checkerboard pattern. All object parts fully visible.

### Maintenance toolbox — closed

Reference: `dist/assets/environment/crate-steel.png`

Use case: stylized-concept. Game asset: lootable container state for Animal Factory Tactics. Create ONE CLOSED small portable industrial toolbox matching this reference's painterly style. Low rectangular dark brick-red enamel steel toolbox with a single flat hinged lid, centered folding metal carry handle resting on top, two small metal front latches and scuffed steel corner edges. No tools outside or inside visible. Compact 2:1 long-to-short footprint, isometric long axis lower-left to upper-right. BODY occupies central 65 percent canvas width and lower 55 percent canvas height, bottom at 88 percent canvas height; reserve the upper 30 percent of the canvas as empty transparent headroom for its later open-lid counterpart. Clearly smaller than a shipping crate, not a large trunk. Preserve the reference's orthographic isometric camera, worn industrial painterly art, muted colors, soft upper-left lighting and exact original 1254x1254 canvas. For edits change only the opening and visible interior, keep exterior body design and ground anchor invariant. Single isolated object on genuine transparent alpha background, transparent gaps, no ground plane, no shadow backdrop, no people, text, labels, watermark, glow or checkerboard pattern. All object parts fully visible.

### Toolbox — open

Reference: generated toolbox closed PNG.

Edit this exact toolbox into its open state. Preserve all bottom body corners, the red exterior front and left walls, latches and dimensions exactly in their original pixel coordinates. Hinge the existing lid upward toward the upper left using the rear long edge, reveal an EMPTY dark metal interior. Keep the bottommost corner at x395 y1200 and body outer left/right bounds near x105 and x1200 on the original 1254 square canvas. No shifting or scaling the body. Raised lid fully visible in existing headroom. Same painterly weathered red enamel and steel hardware, isometric camera and lighting. Genuine transparent alpha background, no text, ground or contents. Single object.

### Supply chest — replacement open

First attempt rejected for shortened body. Final image uses this prompt with original steel crate as reference:

Precise edit of supplied CLOSED steel chest to OPEN. The box BODY must stay pixel aligned with the source: bottom front corner x410 y1125, bottom left x65 y915, bottom right x1200 y770. Keep the front wall full original height, NOT shorter or squashed. Original side carrying handle remains exactly at original coordinates. Original front corner top is near x410 y800; expose rim there. Lift only the lid on the far rear long hinge edge into the existing headroom; lid can open only 30 degrees if needed to fit, rather than shifting the body. Keep empty dark interior. Entire object within original square canvas with genuine transparent background. Preserve exact source olive steel design, painterly textures, lighting, isometric camera. No ground, no labels. Base/body pixel alignment is more important than a dramatic lid opening.
