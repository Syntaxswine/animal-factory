// Lamps, torches and fires. Art and placement only; light emission is parcel I.
// Parcel B of docs/tactics/SCENERY-PORT-HANDOFF.md owns this file; see docs/tactics/LIGHTING.md.
export const FOLDER='lighting';
export const LABEL='Lamps and fires';

// The rules are the 3D branch's, exactly: its core/environment.js does Object.assign(PROPS,LIGHT_PROPS),
// and light-sources.js builds each one as {w,h,solid:!wall,cover:kind==='bedside-table-lamp'?25:0}. So a
// fixture blocks its tile, only the bedside table is cover, and none is `tall` -- a lamp post does not
// block sight here any more than it does there. A map authored on either branch loads on the other.
//
// visualWidth and visualHeight are what tools/bake-scenery.mjs --register reports: the model at true world
// scale, widened to be symmetric about the footprint centre and extended down to the renderer's anchor by
// two invisible registration marks (docs/tactics/LIGHTING.md). Both are set, so
// min(maxWidth/cropWidth, maxHeight/cropHeight) has two equal arguments and neither can bind early.
const fixture=(w,h,visualWidth,visualHeight,cover=0)=>({w,h,cover,solid:true,visualWidth,visualHeight});
export const PROPS={
 'floor-lamp':fixture(1,1,26,74),
 'bedside-table-lamp':fixture(1,1,35,62,25),
 'streetlight':fixture(1,1,32,110),
 'streetlight-double':fixture(2,1,55,124),
 'standing-torch':fixture(1,1,21,66),
 'campfire':fixture(1,1,35,34),
 'cooking-fire':fixture(2,2,74,98)
};
// The two the 3D branch also has and this parcel does not ship. It mounts them on a tile edge
// (light-sources.js fixturePlacement shifts them .48 tile north, or east when rotated) and this renderer
// has no way to draw a prop off its footprint centre: baked, they land 36 and 52 px from where it would
// plant them. Until then a 3D map carrying one is refused here as an unknown prop kind.
export const DEFERRED={'wall-torch':'open question 5: edge mounting','gooseneck-sconce':'open question 5: edge mounting'};
