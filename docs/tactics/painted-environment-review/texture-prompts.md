# Built-in imagegen prompts

## Initial atlas

Reference (style only): `dist/assets/characters/lowpoly-proof/horse-worker-model-paint-v1.png`.

Create a square 2048x2048 production game MATERIAL ATLAS for a stylized industrial environment matching the supplied horse's painted finish. Reference image is STYLE ONLY: broad angular brush planes, confident warm highlight strokes, deep deliberate seams, richly colored matte paint. NO characters, no scene, no perspective, no text, no labels, no borders. Exactly FOUR equal square quadrants separated only at x=50% and y=50%, each filled fully edge to edge with an orthographic flat material texture. Top-left: warm burnt-sienna fired clay brick SURFACE, not a brick wall: no mortar joints, no rectangular brick grid; one continuous hand-painted clay surface with ochre and muted plum brush patches, a few sparse tiny chips, broad planar light strokes. Top-right: golden tobacco rough sawn WOOD surface with vertical directional broad brush strokes, subtle dark grain, occasional worn pale strokes; no separate planks, no frame. Bottom-left: rich desaturated petroleum-blue PAINTED STEEL surface with broad blue and teal brush planes, restrained rust-brown patches mostly near lower edge, selective cream-grey scuffs; no rivets, no hoops, no objects. Bottom-right: warm grey-taupe limestone/concrete surface with large restrained brush planes and worn ivory patches, no grid or paving joints. These textures will wrap real 3D meshes; no baked object outlines or strong directional shadows. Bold illustrated painterly material treatment consistent with reference clothing, not noisy procedural texture, not photorealism, not gradients or flat colors. Large brush shapes visible after reduction to gameplay scale.

## Revision (final bitmap)

Image 1 edit target: V1 atlas. Image 2 style reference: unchanged approved horse paint.

Edit Image1 material atlas, preserving exact equal 2x2 quadrant layout and no borders. Image2 is the approved horse STYLE reference, especially the broad quiet angular facets on its cream shirt and olive trousers. Replace ONLY the top two quadrants. Top LEFT: MATTE weathered fired clay material, dusty muted terracotta/rose/umber, broad quiet flat angular brush planes with low contrast. No mortar grid, no brick outlines, no light edge outlining. REMOVE ALL SHINY GOLD streaks and copper sheen. Colors should be gently desaturated dusty reds, mauve-brown shadows and a few restrained pale clay strokes. 20-30 large brush shapes across the quadrant rather than hundreds of scratchy marks. Top RIGHT: MATTE rough crate WOOD, tawny brown, warm umber with cream-worn broad strokes, broad vertical planar grain, LESS contrast and vastly FEWER fine streaks than original. No polished varnish, no dense narrow grain stripes. Think hand-painted wooden board material painted with a wide flat brush, not a photograph. Keep bottom left blue steel and bottom right stone essentially unchanged. Entire atlas should be painted in simple deliberate graphic patches like the horse's shirt, free of procedural noise, fine scratches or photographic impasto. No scene, objects, characters, lettering or borders. Flat orthographic texture only.

The tool returned 1254×1254 images. Runtime UV crops, material tint and per-brick
contrast refinement are documented in the scene module; no bitmap edits were
performed outside imagegen.
