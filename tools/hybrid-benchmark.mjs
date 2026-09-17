import fs from 'node:fs';import {performance} from 'node:perf_hooks';
import {parseMap} from '../dist/tactics/maps.js';import {createGame} from '../dist/tactics/engine.js';import {traceProjectile} from '../dist/tactics/projectiles.js';
const map=parseMap(fs.readFileSync(new URL('../Factory-test.json',import.meta.url),'utf8')),mode=process.argv.includes('--hybrid')?'hybrid':'legacy',samples=[];
for(let trial=0;trial<3;trial++){
 const before=process.memoryUsage().heapUsed,t0=performance.now(),s=createGame(1947,map,true,'standard',{geometryMode:mode}),created=performance.now();
 for(let i=0;i<1000;i++){const a=s.units[0],angle=i*.618;traceProjectile(s,a,{x:a.x,y:a.y,h:1.2},{x:Math.cos(angle),y:Math.sin(angle),h:.03},60);}
 samples.push({createMs:created-t0,thousandQueriesMs:performance.now()-created,heapDeltaBytes:process.memoryUsage().heapUsed-before});
}
const result={mode,map:map.name,node:process.version,platform:process.platform,date:new Date().toISOString(),samples};
fs.writeFileSync(new URL(`../docs/tactics/hybrid-review/${mode}-benchmark.json`,import.meta.url),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
