import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {RED_HAT_SPECIES,ARMED_WEAPONS,CHARACTER_STANCES,redHatArt} from "../dist/tactics/red-hats-art.js";
test("Red Hats have every armed stance with valid transparent frames and a shared baseline",async()=>{
 const paths=new Set();
 for(const species of RED_HAT_SPECIES)for(const weapon of ARMED_WEAPONS)for(const stance of CHARACTER_STANCES){
  const frame=redHatArt(species,weapon,stance);assert.ok(frame);assert.equal(frame.anchor[1],244);assert.equal(frame.anchor[0],frame.width/2);
  assert.ok(!paths.has(frame.src));paths.add(frame.src);
  const png=await readFile(new URL("../dist/tactics/"+frame.src,import.meta.url));
  assert.equal(png.subarray(1,4).toString(),"PNG");assert.equal(png.readUInt32BE(16),frame.width);assert.equal(png.readUInt32BE(20),frame.height);assert.equal(png[25],6);
 }
 assert.equal(paths.size,84);
 assert.equal(redHatArt("horse","hands","prone"),null);
 assert.equal(redHatArt("unknown","rifle"),null);
 assert.ok(redHatArt("horse","hands","standing"));
});
