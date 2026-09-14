import {W,H,stampRoom,tileKey} from './maps.js';
export function createEditor(map){return {map:structuredClone(map),undo:[],redo:[],before:null};}
export function beginStroke(editor){if(!editor.before)editor.before=structuredClone(editor.map);}
export function endStroke(editor){if(!editor.before)return false;const before=editor.before;editor.before=null;if(JSON.stringify(before)===JSON.stringify(editor.map))return false;editor.undo.push(before);if(editor.undo.length>50)editor.undo.shift();editor.redo=[];return true;}
export function replaceMap(editor,map){beginStroke(editor);editor.map=structuredClone(map);endStroke(editor);}
export function undo(editor){endStroke(editor);if(!editor.undo.length)return false;editor.redo.push(editor.map);editor.map=editor.undo.pop();return true;}
export function redo(editor){endStroke(editor);if(!editor.redo.length)return false;editor.undo.push(editor.map);editor.map=editor.redo.pop();return true;}
export function applyBrush(editor,tool,x,y,edge,options={}) {
 const m=editor.map;if(!Number.isInteger(x)||!Number.isInteger(y)||x<0||y<0||x>=W||y>=H)return 'Choose a tile inside the map.';
 const guard=m.guards.find(g=>g.x===x&&g.y===y),start=m.starts.findIndex(p=>p.x===x&&p.y===y),exit=m.exits.some(p=>p.x===x&&p.y===y);
 if(['wall','door','erase-edge'].includes(tool)){
  if(!/^(e|s):-?\d+:-?\d+$/.test(edge))return 'Choose a tile edge.';
  if(tool==='erase-edge')delete m.edges[edge];else m.edges[edge]=tool;return '';
 }
 if(['yard','floor','crate'].includes(tool)){if(tool==='crate'&&(guard||start>=0||exit))return 'Move the unit start or travel marker before placing a crate.';m.terrain[y][x]=tool;return '';}
 if(tool==='room'){const width=options.rotated?options.height:options.width,height=options.rotated?options.width:options.height;return stampRoom(m,x,y,width||6,height||5)?'':'The whole room must fit inside the map.';}
 if(tool==='remove-guard'){m.guards=m.guards.filter(g=>g!==guard);return '';}
 if(m.terrain[y][x]==='crate')return 'Remove the crate before placing a start or travel marker.';
 if(tool==='squad'){const id=Number(options.slot);if(!Number.isInteger(id)||id<0||id>3)return 'Choose squad member 1–4.';if(guard||(start>=0&&start!==id))return 'Another unit starts here.';m.starts[id]={x,y};return '';}
 if(tool==='guard'){if(start>=0)return 'A squad member starts here.';if(!guard&&m.guards.length>=12)return 'Maximum twelve guards. Remove one before placing another.';const next={x,y,species:options.species||'pig-foreman',weapon:options.weapon||'pistol'};if(guard)Object.assign(guard,next);else m.guards.push(next);return '';}
 if(tool==='exit'){m.exits=[{x,y}];return '';}
 return 'Choose a placement tool.';
}
