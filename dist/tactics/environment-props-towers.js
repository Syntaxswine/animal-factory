// Guard towers and the spotlight. Art, placement and see-through only; nobody climbs them here, and the
// beams are parcel J. Parcel C of docs/tactics/SCENERY-PORT-HANDOFF.md owns this file; see docs/tactics/TOWERS.md.
export const FOLDER='towers';
export const LABEL='Guard towers';

// The rules are the 3D branch's, exactly: its core/environment.js does Object.assign(PROPS,LIGHT_PROPS), and
// light-sources.js lists these four in LIGHT_FORMS, so each is {w,h,solid:true,cover:0} and none is `tall`.
// The whole footprint blocks movement, as it does there for anything that is not a climber on a tower post.
// A map authored on either branch loads on the other, except one whose guard starts on a tower post.
//
// visualWidth and visualHeight are the model at true world scale, as tools/bake-scenery.mjs reports it.
// The sprites are planted by the footprint centre the bake recorded (`foot` in prop-art-towers.js), not by
// the bottom of the alpha box, which would sink the stair tower 10 px and slide the ladder tower 18.
//
// seeThrough: the tower fades while the cursor is over it and pointing at something behind it, or while
// the selected animal stands behind it -- the way a wall would get out of the way (app.js, see-through.js).
const tower=(w,h,visualWidth,visualHeight)=>({w,h,cover:0,solid:true,visualWidth,visualHeight,seeThrough:true});
export const PROPS={
 'wooden-spotlight-tower':tower(5,5,280,363),
 'iron-searchlight-stair-tower':tower(6,5,249,413),
 'iron-searchlight-ladder-tower':tower(6,5,201,377),
 'spotlight':{w:1,h:1,cover:0,solid:true,visualWidth:29,visualHeight:109}
};
