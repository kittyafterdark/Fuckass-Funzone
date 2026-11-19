import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/sprites/manifest.json'),'utf8'));
const read=(rel)=>fs.readFileSync(path.join(root,rel));
const sha=(bytes)=>crypto.createHash('sha256').update(bytes).digest('hex');
const runtime=[...Array.from({length:6},(_,i)=>`bird_flap_${i}`),...Array.from({length:6},(_,i)=>`gabi_fly_${i}`),
 'bird_dizzy','bird_dead','gabi_hurt','gabi_crash','gabi_dead','cloud','coin','star','heart','flame_0','flame_1','flame_2','record_flag','best_banner','game_over_banner'];

test('sprite manifest contains 32 unique independently cropped, validated files',()=>{
 assert.equal(manifest.version,2);
 assert.equal(manifest.method,'seeded-connected-component-alpha');
 const names=Object.keys(manifest.assets);
 assert.equal(names.length,32);
 assert.equal(new Set(names).size,32);
 for(const [name,meta] of Object.entries(manifest.assets)) {
  const png=read(`assets/sprites/${name}.png`);
  assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a',`${name}: must be PNG`);
  assert.equal(png[24],8,`${name}: expected 8-bit PNG`);
  assert.equal(png[25],6,`${name}: expected RGBA alpha PNG`);
  assert.deepEqual([png.readUInt32BE(16),png.readUInt32BE(20)],meta.size,`${name}: dimensions match source metadata`);
  assert.equal(meta.sha256,sha(png),`${name}: byte checksum is current`);
  assert.ok(meta.size[0]>30 && meta.size[1]>30 && Math.max(...meta.size)<=318,`${name}: no giant sheet crops`);
  assert.ok(meta.method==='curated-single-heart'||(meta.seed?.length===2 && meta.source_bounds?.length===4),`${name}: explicit validated source selection`);
 }
 assert.ok(manifest.assets.heart.size[0]<100 && manifest.assets.heart.size[1]<100,'heart is single icon, not three hearts');
 assert.ok(manifest.assets.cloud.source_bounds[2]<220,'cloud excludes its smaller neighbor');
 for(const name of ['flame_0','flame_1','flame_2','record_flag']) {
  const meta=manifest.assets[name];
  assert.equal(meta.source,'gabi',`${name} comes from the approved transparent jetpack sheet`);
  assert.ok(meta.source_bounds[2]<150,`${name} does not contain its neighbor`);
 }
 assert.ok(manifest.assets.record_flag.source_bounds[3]>150,'the complete flag pole is included');
});

test('each runtime sprite is embedded byte-for-byte in the production Spindle bundle',()=>{
 const bundle=read('dist/frontend.js').toString('utf8');
 assert.ok(bundle.includes(`Fuckass Funzone ${JSON.parse(read('spindle.json').toString('utf8')).version}`));
 for(const name of runtime) {
  const b64=read(`assets/sprites/${name}.png`).toString('base64');
  assert.ok(bundle.includes(`"${name}":"data:image/png;base64,${b64}"`),`${name}: corrected PNG must be embedded exactly`);
 }
 assert.doesNotMatch(bundle, /"(?:cover|icon)":"data:image\//);
 const logo=read('assets/funzone/funzone-logo-runtime.png');
 assert.deepEqual([logo.readUInt32BE(16),logo.readUInt32BE(20)],[530,139]);
 assert.ok(bundle.includes(`"funzone_logo":"data:image/png;base64,${logo.toString('base64')}"`));
});

test('source sheet identities are pinned for fail-before-write rebuilds',()=>{
 for(const [key,file] of [['bird','bird-arcade-sheet.png'],['gabi','gabi-jetpack-sheet.png']]) {
  assert.equal(sha(read(`assets/source/${file}`)),manifest.source_sha256[key],`${key} sheet source hash`);
 }
});
