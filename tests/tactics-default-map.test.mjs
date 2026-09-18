import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseMap} from '../dist/tactics/maps.js';
import {createGame} from '../dist/tactics/engine.js';

test('shipped default is the complete authored factory and starts with its intended guard facing',()=>{
 const authored=readFileSync(new URL('../Factory-test.json',import.meta.url),'utf8');
 const shipped=readFileSync(new URL('../dist/tactics/default-factory.json',import.meta.url),'utf8');
 assert.deepEqual(JSON.parse(shipped),JSON.parse(authored));
 const definition=parseMap(shipped),s=createGame(1947,definition);
 assert.equal(s.units.length,definition.guards.length+4);
 assert.ok(definition.guards.length>12);
 assert.equal(s.units[4].heading,45);
 assert.equal(s.phase,'explore');
});
