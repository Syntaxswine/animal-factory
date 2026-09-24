// A prop tall enough to hide what stands behind it fades while the player is looking behind it: the
// cursor is over its sprite and the ground tile under the cursor lies behind the prop, or the selected
// animal stands behind it and inside its sprite. The way a wall would get out of the way.
// Parcel C of docs/tactics/SCENERY-PORT-HANDOFF.md; see docs/tactics/TOWERS.md.
export const SEE_THROUGH_ALPHA=.3;

// box: the prop's box on screen {x,y,w,h}. cells: its footprint tiles.
// targets: [{x,y,tile:{x,y}}], a screen point and the ground tile it stands for.
// A tile is behind the prop when it is outside the footprint and sorts before the footprint's front
// corner, which is also every tile the renderer paints under it: paint depth is x + y, and the prop sorts
// at its largest. So a tile beside a front face, which the sprite can wrongly cover, fades it too.
export function seeThroughAlpha(box,cells,targets){
 if(!box||!cells?.length)return 1;
 const front=Math.max(...cells.map(c=>c.x+c.y));
 for(const t of targets||[]){
  if(!t?.tile||!Number.isFinite(t.x)||!Number.isFinite(t.y))continue;
  if(t.x<box.x||t.x>box.x+box.w||t.y<box.y||t.y>box.y+box.h)continue;
  if(cells.some(c=>c.x===t.tile.x&&c.y===t.tile.y))continue;
  if(t.tile.x+t.tile.y<front)return SEE_THROUGH_ALPHA;
 }
 return 1;
}
