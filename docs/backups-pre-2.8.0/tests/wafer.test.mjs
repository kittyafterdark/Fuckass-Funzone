import test from 'node:test';
import assert from 'node:assert/strict';
import { WobblyWafersGame, pullRisk, pullableLayers, supports, WAFER_START_LAYERS, WAFER_BASE, WAFER_TABLE, layerHeight } from '../src/wafer.js';
import { waferAt, drawWobblyWafers } from '../src/wafer-render.js';

const tower = (n = WAFER_START_LAYERS) => Array.from({ length: n }, () => [true, true, true]);

test('Wobbly Wafers follows the stacking rules: top layers are off-limits and lone edges cannot hold the tower', () => {
  const layers = tower(); assert.equal(pullableLayers(layers), WAFER_START_LAYERS - 1, 'a full top layer blocks only itself');
  layers.push([true, false, false]); assert.equal(pullableLayers(layers), WAFER_START_LAYERS - 1, 'an unfinished top blocks the layer under it too');
  assert.equal(pullRisk(layers, WAFER_START_LAYERS - 1, 1), Infinity);
  assert.ok(Number.isFinite(pullRisk(layers, 3, 1)), 'pulling a middle leaves two edges standing');
  layers[3] = [true, false, true]; assert.equal(pullRisk(layers, 3, 0), Infinity, 'a lone edge cannot hold the tower');
  layers[4] = [false, true, false]; assert.equal(pullRisk(layers, 4, 1), Infinity, 'an empty layer cannot hold the tower');
  assert.equal(supports([false, true, false]), true); assert.equal(supports([true, false, false]), false);
});

test('a clean pull stacks the wafer on top and scores; Gabu answers; a doomed pull topples on you', () => {
  const events = [], g = new WobblyWafersGame({ random: () => .5, onEvent: e => events.push(e) }); g.start();
  assert.equal(g.choose(4, 1), true); g.meter = .5; assert.equal(g.choose(4, 1), true, 'tapping the same wafer pulls it');
  assert.deepEqual(g.layers[4], [true, false, true]); assert.deepEqual(g.layers.at(-1), [true, false, false], 'the wafer went on top');
  assert.equal(g.score, 20, 'a centered pull earns the perfect bonus'); assert.ok(events.includes('perfect'));
  assert.equal(g.turn, 2); for (let i = 0; i < 30 && g.turn === 2; i++) g.update(.1);
  assert.equal(g.turn, 1); assert.ok(events.includes('gabu_pull'));
  g.layers[2] = [true, false, true]; g.choose(2, 0); g.meter = .5; g.pull();
  assert.equal(g.status, 'dead'); assert.equal(g.result, 'loss'); assert.ok(events.includes('death'));
});

test('a shaky pull adds more wobble than a clean one, and Gabu toppling the tower extends your streak', () => {
  const clean = new WobblyWafersGame({ random: () => .5 }), shaky = new WobblyWafersGame({ random: () => .5 });
  for (const [g, meter] of [[clean, .5], [shaky, .02]]) { g.start(); g.choose(5, 1); g.meter = meter; g.pull(); }
  assert.ok(shaky.wobble > clean.wobble + 20);
  const events = [], g = new WobblyWafersGame({ random: () => .5, level: 'hard', onEvent: e => events.push(e) }); g.start();
  g.choose(5, 1); g.meter = .5; g.pull(); g.wobble = 99;
  for (let i = 0; i < 30 && g.phase === 'turn'; i++) g.update(.1);
  assert.equal(g.phase, 'over'); assert.equal(g.result, 'win'); assert.equal(g.wins, 1); assert.ok(events.includes('win'));
  assert.equal(g.choose(), true, 'a tap after Gabu’s crash deals the next round'); assert.equal(g.round, 2); assert.equal(g.starter, 2);
});

test('Gabu avoids pulls that would topple the tower whenever a safe one exists', () => {
  const g = new WobblyWafersGame({ random: () => .5, level: 'normal' });
  g.layers = tower(); for (let r = 0; r < 10; r++) g.layers[r] = [true, false, true];
  const pick = g.gabuChoice(); assert.ok(Number.isFinite(pullRisk(g.layers, pick.row, pick.slot)));
});

test('Wobbly Wafers saves restore paused and reject impossible towers', () => {
  const g = new WobblyWafersGame({ random: () => .5 }); g.start(); g.choose(3, 0); g.meter = .4; g.pull();
  const saved = g.snapshot(), back = new WobblyWafersGame({ saved });
  assert.equal(back.status, 'paused'); assert.deepEqual(back.layers, g.layers); assert.equal(back.wobble, saved.wobble);
  const bad = patch => new WobblyWafersGame().restore({ ...saved, ...patch });
  assert.equal(bad({ layers: [[true, false, false], ...tower(5)] }), false, 'a standing tower cannot rest on a lone edge');
  assert.equal(bad({ wobble: 150 }), false); assert.equal(bad({ status: 'dead' }), false); assert.equal(bad({ level: 'nope' }), false);
});

test('Wobbly Wafers renderer hit-tests wafers and draws every state', () => {
  assert.deepEqual(waferAt(180, 370, 12), { row: 0, slot: 1 }); assert.equal(waferAt(20, 370, 12), null); assert.equal(waferAt(180, 30, 12), null);
  const text = [];
  const ctx = new Proxy({ createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }) }, {
    get(target, name) { return name in target ? target[name] : (...args) => { if (name === 'fillText') text.push(args[0]); }; },
    set(target, name, value) { target[name] = value; return true; },
  });
  const canvas = { width: 720, height: 904, getContext: () => ctx }, g = new WobblyWafersGame({ random: () => .5 });
  drawWobblyWafers(canvas, g, {}); g.start(); g.choose(3, 1); drawWobblyWafers(canvas, g, {}); g.layers[2] = [true, false, true]; g.cancel(); g.choose(2, 0); g.pull(); drawWobblyWafers(canvas, g, {});
  assert.ok(text.includes('CRASH!')); assert.ok(text.includes('TAP AGAIN WHILE IT’S GREEN TO PULL'));
});

test('Wobbly Wafers physics: the tower breaks at the pulled layer, the stump stands, and every falling wafer lands on something', () => {
  const g = new WobblyWafersGame({ random: () => .5 }); g.start();
  g.layers[5] = [true, false, true]; g.choose(5, 0); g.meter = .5; g.pull();
  assert.equal(g.result, 'loss'); assert.equal(g.breakRow, 5, 'the break is the layer that lost its support');
  const above = g.layers.slice(6).flat().filter(Boolean).length; assert.equal(g.crumbs.length, above, 'exactly the wafers above the break fall');
  assert.ok(g.crumbs.every(c => c.vx < 0), 'with only the right edge left, the weight sits over the empty left side, so the top tips left');
  for (let i = 0; i < 80; i++) g.update(.05);
  assert.ok(g.crumbs.every(c => c.rest), 'every wafer comes to rest');
  const stumpTop = WAFER_BASE - 6 * layerHeight(g.layers.length);
  for (const c of g.crumbs) {
    const bottom = c.y + c.h / 2, surfaces = [stumpTop, WAFER_BASE, WAFER_TABLE, ...g.crumbs.filter(o => o !== c).map(o => o.y - o.h / 2)];
    assert.ok(surfaces.some(y => Math.abs(bottom - y) < .01), `a wafer rests on a surface, not in the air (bottom ${bottom.toFixed(2)})`);
    assert.ok(bottom <= WAFER_TABLE + .01, 'nothing sinks through the table');
  }
  const saved = g.snapshot(), back = new WobblyWafersGame({ saved });
  assert.equal(back.breakRow, 5); assert.deepEqual(back.pulledOut, { row: 5, slot: 0 });
});
