import fs from 'node:fs';
import path from 'node:path';

// Every app file in dist/tactics ships to Pages. Scanned rather than hand-listed, so adding a
// module or a review page cannot 404 by being forgotten; see docs/tactics/SCENERY-PORT-HANDOFF.md.
// Documentation is the only thing held back.
export const EXCLUDE=new Set(['.md']);

export function pagesFiles(root){
 return fs.readdirSync(path.join(root,'dist/tactics'),{withFileTypes:true})
  .filter(entry=>entry.isFile()&&!EXCLUDE.has(path.extname(entry.name)))
  .map(entry=>entry.name)
  .sort();
}
