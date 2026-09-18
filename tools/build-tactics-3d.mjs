import './build-tactics-pages.mjs';
import fs from 'node:fs';
const root=new URL('../',import.meta.url);
fs.copyFileSync(new URL('dist/tactics-3d.html',root),new URL('.pages-output/index.html',root));
fs.writeFileSync(new URL('.pages-output/README.md',root),'# Animal Factory Tactics 3D\n\nIndependent experimental presentation project. See the landing page for available demos and their scope.\n');
console.log('Built Animal Factory Tactics 3D landing page.');
