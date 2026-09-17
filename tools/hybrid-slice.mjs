import fs from 'node:fs';
import {parseMap} from '../dist/tactics/maps.js';
import {createWorldModel} from '../dist/tactics/hybrid-world.js';
const path=process.argv[2]||new URL('../dist/tactics/fixtures/hybrid-room.json',import.meta.url);
const map=parseMap(fs.readFileSync(path,'utf8'),{allowDisconnected:true}),model=createWorldModel(map);
const ray=[[5,1.3,9],[5,1.3,5]],closed=model.trace(...ray);
model.update(m=>m.edges['s:5:7']='doorway-concrete-open');
const open=model.trace(...ray);
console.log(JSON.stringify({map:map.name,boxes:model.geometry.boxes.length,diagnostics:model.geometry.diagnostics,closed,open,revision:model.revision},null,2));
