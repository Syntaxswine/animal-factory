# Foliage and river collection 01

Seven assets generated with built-in image_gen using `dist/assets/environment/ground-grass.png` as the palette and texture reference. Files: `dist/assets/environment/foliage/`. Gallery: `dist/tactics/foliage-art.html`.

Plants are transparent isometric props: broadleaf tree, pine, low bush and reeds. Trees use one-tile solid trunks with canopy overhang; bushes provide walkable low cover and reeds are walkable dressing. Crops, scale and gameplay rules are registered in the shared game/editor renderer.

River assets are opaque top-down square textures for ground projection: open water, north/south straight channel, north/east bend. Rotations give other directions. The straight and bend files are superseded source studies, not runtime tiles. Gameplay uses animated river-water with the connected shore-tiles-atlas. Generated boundaries and ripple colors still vary; the bend east outlet is lower than the straight tile center. The gallery exposes these joins directly. Edge registration/blending is required before production map use. Open water is a separate fill texture, not a channel cap. No fork, source or shoreline transition set is included.

## Exact prompts

### tree-broadleaf

Use case: stylized-concept. Game asset for Animal Factory Tactics. One mature broadleaf tree, weathered branching trunk, irregular rounded canopy of muted olive and sage foliage, readable clustered leaves, visible lower trunk and small roots. No earth mound. Intended trunk occupancy one tile with canopy overhang. Match reference's muted olive grass palette, painterly texture and worn natural environment. Reference is color/material style only. Orthographic isometric view, ground axes +/-30 degrees, soft upper-left lighting. Single isolated plant centered entirely within 1254x1254 square canvas with clear margins. Genuine transparent alpha and gaps between branches, no ground plane or external cast shadow. No text, watermark, labels, people or buildings.

### tree-pine

Use case: stylized-concept. Game asset for Animal Factory Tactics. One tall pine tree with a tapered irregular layered crown, subdued dark green needles, visible brown trunk and small roots, asymmetrical natural branch groups. No earth mound. Intended trunk occupancy one tile with canopy overhang. Match reference's muted olive grass palette, painterly texture and worn natural environment. Reference is color/material style only. Orthographic isometric view, ground axes +/-30 degrees, soft upper-left lighting. Single isolated plant centered entirely within 1254x1254 square canvas with clear margins. Genuine transparent alpha and gaps between branches, no ground plane or external cast shadow. No text, watermark, labels, people or buildings.

### bush

Use case: stylized-concept. Game asset for Animal Factory Tactics. One low dense irregular shrub, muted olive and sage leaves, a few visible woody stems, broad soft silhouette, no flowers or berries. One tile ground footprint. No earth mound. Match reference's muted olive grass palette, painterly texture and worn natural environment. Reference is color/material style only. Orthographic isometric view, ground axes +/-30 degrees, soft upper-left lighting. Single isolated plant centered entirely within 1254x1254 square canvas with clear margins. Genuine transparent alpha and gaps between branches, no ground plane or external cast shadow. No text, watermark, labels, people or buildings.

### reeds

Use case: stylized-concept. Game asset for Animal Factory Tactics. One compact clump of riverside reeds and rushes, olive blade leaves and a few dry tan seed heads, visible grouped stem bases, no water or ground beneath. One tile ground footprint. Match reference's muted olive grass palette, painterly texture and worn natural environment. Reference is color/material style only. Orthographic isometric view, ground axes +/-30 degrees, soft upper-left lighting. Single isolated plant centered entirely within 1254x1254 square canvas with clear margins. Genuine transparent alpha and gaps between branches, no ground plane or external cast shadow. No text, watermark, labels, people or buildings.

### river-water

Use case: stylized-concept. Game asset for Animal Factory Tactics. A full square of calm muted gray-green river water, softly painted low-contrast ripples, no banks, no rocks, no plants, no reflections of objects. Uniform brightness and water hue across all edges, designed as a seamless repeating water texture. Match reference's muted olive grass palette, painterly texture and worn natural environment. Reference is existing square ground texture; match its scale of grass details. Strict orthographic TOP DOWN flat texture, NOT isometric, no diamond, no thickness. Opaque full-bleed 1254x1254 square, artwork reaches all edges, no padding or border. All water uses consistent desaturated gray-green, all grass matches reference. Tile connections follow the specified edge openings precisely. No text, watermark, labels, people or buildings.

### river-straight

Use case: stylized-concept. Game asset for Animal Factory Tactics. A modular top-down river ground tile. A straight gray-green water channel flows vertically north to south through the exact center. At TOP and BOTTOM boundaries, water occupies exactly x=25% through x=75% of tile width; outer quarters are olive grass over brown earth. Keep water width constant at the boundaries. Left and right edges entirely grassy land. Gently irregular soft muddy bank within tile interior; no large stones, bushes or trees. Water low contrast, banks without foam. Match reference's muted olive grass palette, painterly texture and worn natural environment. Reference is existing square ground texture; match its scale of grass details. Strict orthographic TOP DOWN flat texture, NOT isometric, no diamond, no thickness. Opaque full-bleed 1254x1254 square, artwork reaches all edges, no padding or border. All water uses consistent desaturated gray-green, all grass matches reference. Tile connections follow the specified edge openings precisely. No text, watermark, labels, people or buildings.

### river-bend

Use case: stylized-concept. Game asset for Animal Factory Tactics. A modular top-down river ground tile with a quarter-turn river connecting NORTH edge to EAST edge. At top boundary water occupies exactly x=25% to x=75%. At right boundary water occupies exactly y=25% to y=75%. Water smoothly bends between these centered openings, constant half-tile channel width, like quarter annulus centered on TOP RIGHT corner with inner radius 25% and outer radius 75% of tile. Top-right inside bend is grassy land; bottom and left boundaries entirely grassy land. Same muted gray-green water and olive grass with brown mud banks, low contrast, no large rocks, trees, foam or shadows. Match reference's muted olive grass palette, painterly texture and worn natural environment. Reference is existing square ground texture; match its scale of grass details. Strict orthographic TOP DOWN flat texture, NOT isometric, no diamond, no thickness. Opaque full-bleed 1254x1254 square, artwork reaches all edges, no padding or border. All water uses consistent desaturated gray-green, all grass matches reference. Tile connections follow the specified edge openings precisely. No text, watermark, labels, people or buildings.

### Revised bend

Reference: generated straight river tile. Improved width and water texture consistency; remaining outlet offset documented above.

Create a matching north-to-east quarter-turn river tile from this exact straight river tile. This is an edge-matching terrain edit. Keep the complete TOP boundary and top 15% strip exactly unchanged: identical water width, bank positions, grass and water texture. Bend the central water channel gently to exit RIGHT, whose middle 50% must match the supplied tile's bottom boundary rotated 90 degrees. Channel must stay as WIDE as the source, approximately half the tile width; no narrowing. Continue source gray-green water color and detailed ripple texture and muddy bank style throughout. Grassy land fills top-right inner corner and lower-left outer corner, bottom and left edges grass. Strict flat top-down full bleed square 1254x1254, no text, guides, margin, transparency or objects. Match source closely, including scale of grass leaves.
