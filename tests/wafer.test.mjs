import test from 'node:test';
import assert from 'node:assert/strict';
import { WobblyWafersGame, pullableLayers, supports, weakLayer, waferGrip, safePull, WAFER_START_LAYERS, WAFER_BASE, WAFER_TABLE, WAFER_W } from '../src/wafer.js';
import { waferAt, drawWobblyWafers } from '../src/wafer-render.js';

const tower = (n = WAFER_START_LAYERS) => Array.from({ length: n }, () => [true, true, true]);

// Slides the wafer at (row, slot) out at `speed` pixels a second, one frame at a time, the way a finger would.
const pullOut = (g, row, slot, speed = 40) => {
  assert.equal(g.grab(row, slot), true);
  for (let i = 0; i < 600 && g.selected && g.phase === 'turn'; i++) { g.slide(speed / 60); g.update(1 / 60); }
};
const loosen = g => { g.snug = g.layers.map(() => [0, 0, 0]); };

test('Wobbly Wafers follows the stacking rules: top layers are off-limits and the weight above a layer must sit over it', () => {
  const layers = tower(); assert.equal(pullableLayers(layers), WAFER_START_LAYERS - 1, 'a full top layer blocks only itself');
  layers.push([true, false, false]); assert.equal(pullableLayers(layers), WAFER_START_LAYERS - 1, 'an unfinished top blocks the layer under it too');
  assert.equal(safePull(layers, WAFER_START_LAYERS - 1, 1), false);
  assert.equal(safePull(layers, 3, 1), true, 'pulling a middle leaves two edges standing');
  layers[3] = [true, false, true]; assert.equal(safePull(layers, 3, 0), false, 'a lone edge cannot hold the tower');
  assert.deepEqual(weakLayer([[false, false, true], ...tower(3)]), { row: 0, side: -1 }, 'the weight hangs off the left of a lone right edge');
  assert.equal(weakLayer([[false, true, false], ...tower(3)]), null, 'a lone middle wafer holds a centered tower');
  assert.deepEqual(weakLayer([[false, true, false], [true, false, false], [true, false, false]]), { row: 0, side: -1 }, 'a lopsided top tips over a narrow layer');
  assert.equal(supports([false, true, false]), true); assert.equal(supports([true, false, false]), false);
});

test('a wafer’s grip comes from the weight on it and how snugly it sits', () => {
  const layers = tower(), snug = layers.map(() => [.5, .5, .5]);
  assert.ok(waferGrip(layers, snug, 0, 1) > waferGrip(layers, snug, 8, 1), 'low wafers carry more of the tower');
  const holey = layers.map(l => [...l]); holey[2] = [true, true, false];
  assert.ok(waferGrip(holey, snug, 2, 0) > waferGrip(layers, snug, 2, 0), 'a wafer left with fewer neighbours carries more');
  snug[5][0] = 1; snug[5][2] = 0; assert.ok(waferGrip(layers, snug, 5, 0) > waferGrip(layers, snug, 5, 2) * 2, 'a snug wafer grips far harder than a loose one');
});

test('sliding a wafer out stacks it on top and scores; a slow, loose pull is clean; Gabu takes his turn', () => {
  const events = [], g = new WobblyWafersGame({ random: () => .5, onEvent: e => events.push(e) }); g.start(); loosen(g);
  pullOut(g, 8, 1, 40);
  assert.deepEqual(g.layers[8], [true, false, true]); assert.deepEqual(g.layers.at(-1), [true, false, false], 'the wafer went on top');
  assert.equal(g.score, 20, 'a clean pull earns the bonus'); assert.ok(events.includes('perfect'));
  assert.equal(g.turn, 2); for (let i = 0; i < 400 && g.turn === 2; i++) g.update(1 / 60);
  assert.equal(g.turn, 1); assert.ok(events.includes('gabu_pull'));
});

test('stuck wafers and rushing shake the tower; pushing one back lets you try another; the tower settles', () => {
  const wobbleAfter = (snug, speed) => { const g = new WobblyWafersGame({ random: () => .5 }); g.start(); g.snug = g.layers.map(() => [snug, snug, snug]); pullOut(g, 3, 1, speed); return g.wobble; };
  assert.ok(wobbleAfter(1, 40) > wobbleAfter(0, 40) * 2, 'a stuck wafer shakes the tower far more than a loose one');
  assert.ok(wobbleAfter(.5, 240) > wobbleAfter(.5, 40) + 5, 'yanking shakes it more than sliding');
  const g = new WobblyWafersGame({ random: () => .5 }); g.start();
  g.grab(3, 0); g.slide(12); assert.ok(g.selected.progress > .2);
  g.grab(3, 2); assert.equal(g.selected.slot, 2, 'grabbing another wafer pushes the first back'); assert.equal(g.layers[3][0], true);
  g.wobble = 30; g.release(); g.cancel(); for (let i = 0; i < 120; i++) g.update(1 / 60);
  assert.ok(g.wobble < 30, 'left alone, the tower settles'); assert.ok(g.wobble >= g.holes * 2 - 1e-9);
});

test('a pull that leaves the tower unbalanced topples it on you; Gabu toppling it extends your streak', () => {
  const events = [], g = new WobblyWafersGame({ random: () => .5, onEvent: e => events.push(e) }); g.start(); loosen(g);
  g.layers[2] = [true, false, true]; pullOut(g, 2, 0);
  assert.equal(g.status, 'dead'); assert.equal(g.result, 'loss'); assert.ok(events.includes('death'));
  const h = new WobblyWafersGame({ random: () => .5, level: 'hard', onEvent: e => events.push(e) }); h.start(); loosen(h);
  pullOut(h, 8, 1);
  for (let i = 0; i < 300 && !h.gabuPull; i++) h.update(1 / 60);
  h.snug = h.snug.map(l => l.map(() => 1)); h.wobble = 99.5; // Mid-pull on a stuck wafer, the tower is one shiver from going.
  for (let i = 0; i < 900 && h.phase === 'turn'; i++) h.update(1 / 60);
  assert.equal(h.phase, 'over'); assert.equal(h.result, 'win'); assert.equal(h.wins, 1); assert.ok(events.includes('win'));
  assert.equal(h.grab(), true, 'a tap after Gabu’s crash deals the next round'); assert.equal(h.round, 2); assert.equal(h.starter, 2);
});

test('Gabu never pulls a wafer that would drop the tower when a safe one exists, and picks loose ones', () => {
  const g = new WobblyWafersGame({ random: () => .5, level: 'hard' });
  g.layers = tower(); for (let r = 0; r < 10; r++) g.layers[r] = [true, false, true];
  const pick = g.gabuChoice(); assert.ok(safePull(g.layers, pick.row, pick.slot));
  const h = new WobblyWafersGame({ random: () => .5, level: 'hard' }); h.snug = h.layers.map(() => [1, 1, 1]); h.snug[6][2] = 0;
  assert.deepEqual([h.gabuChoice().row, h.gabuChoice().slot], [6, 2], 'Hard Gabu finds the loose one');
});

test('Wobbly Wafers saves restore paused and reject impossible towers', () => {
  const g = new WobblyWafersGame({ random: () => .5 }); g.start(); loosen(g); pullOut(g, 3, 0);
  const saved = g.snapshot(), back = new WobblyWafersGame({ saved });
  assert.equal(back.status, 'paused'); assert.deepEqual(back.layers, g.layers); assert.deepEqual(back.snug, saved.snug); assert.equal(back.wobble, saved.wobble);
  const bad = patch => new WobblyWafersGame().restore({ ...saved, ...patch });
  assert.equal(bad({ layers: [[true, false, false], ...tower(5)], snug: tower(6).map(() => [0, 0, 0]) }), false, 'a standing tower cannot rest on a lone edge');
  assert.equal(bad({ wobble: 150 }), false); assert.equal(bad({ status: 'dead' }), false); assert.equal(bad({ level: 'nope' }), false);
  assert.equal(bad({ snug: saved.snug.slice(1) }), false); assert.equal(bad({ snug: saved.snug.map(l => [2, 0, 0]) }), false);
  const { snug, holes, ...older } = saved; const old = new WobblyWafersGame(); assert.equal(old.restore({ ...older, version: 1 }), true, 'older saves get fresh snugness');
  assert.equal(old.snug.length, old.layers.length);
});

test('Wobbly Wafers renderer finds the held wafer where it is drawn and draws every state', () => {
  assert.deepEqual(waferAt(180, 370, 12), { row: 0, slot: 1 }); assert.equal(waferAt(20, 370, 12), null); assert.equal(waferAt(180, 30, 12), null);
  const held = { row: 0, slot: 0, progress: 1 }; assert.deepEqual(waferAt(127 - WAFER_W, 370, 12, 0, held), held && { row: 0, slot: 0 }, 'a wafer slid out is still found where it is');
  const text = [];
  const ctx = new Proxy({ createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }) }, {
    get(target, name) { return name in target ? target[name] : (...args) => { if (name === 'fillText') text.push(args[0]); }; },
    set(target, name, value) { target[name] = value; return true; },
  });
  const canvas = { width: 720, height: 904, getContext: () => ctx }, g = new WobblyWafersGame({ random: () => .5 });
  drawWobblyWafers(canvas, g, {}); g.start(); g.grab(3, 1); g.slide(20); drawWobblyWafers(canvas, g, {});
  g.cancel(); g.layers[2] = [true, false, true]; pullOut(g, 2, 0); drawWobblyWafers(canvas, g, {});
  assert.ok(text.includes('CRASH!')); assert.ok(text.some(t => /^FEELS /.test(t))); assert.ok(text.includes('DRAG DOWN SLOWLY TO SLIDE IT OUT TOWARD YOU'));
});

test('Wobbly Wafers physics: the tower breaks at the pulled layer, the stump stands, and every falling wafer lands on something', () => {
  const g = new WobblyWafersGame({ random: () => .5 }); g.start();
  g.layers[5] = [true, false, true]; pullOut(g, 5, 0);
  assert.equal(g.result, 'loss'); assert.equal(g.breakRow, 5, 'the break is the layer that lost its support');
  const above = g.layers.slice(6).flat().filter(Boolean).length; assert.equal(g.crumbs.length, above, 'exactly the wafers above the break fall');
  assert.equal(g.tip.side, -1, 'with only the right edge left, the weight sits over the empty left side, so the top tips left');
  const middle = () => g.crumbs.reduce((sum, c) => sum + c.x, 0) / g.crumbs.length, before = middle();
  for (let i = 0; i < 6; i++) g.update(.05);
  assert.ok(middle() < before - 10 && g.crumbs.every(c => c.spin === g.crumbs[0].spin), 'the top section turns left about its hinge as one rigid piece');
  for (let i = 0; i < 80; i++) g.update(.05);
  assert.ok(g.crumbs.every(c => c.rest), 'every wafer comes to rest');
  for (const c of g.crumbs) {
    const bottom = c.y + c.h / 2;
    assert.ok([WAFER_BASE, WAFER_TABLE].some(y => Math.abs(bottom - y) < .01), `a wafer lies on the saucer or the table, not in the air (bottom ${bottom.toFixed(2)})`);
  }
  const saved = g.snapshot(), back = new WobblyWafersGame({ saved });
  assert.equal(back.breakRow, 5); assert.deepEqual(back.pulledOut, { row: 5, slot: 0 });
});

test('Wobbly Wafers: fallen wafers fall flat about the corner they land on, stay on screen, and never flip over in the air', () => {
  let seed = 5; const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let round = 0; round < 60; round++) {
    const g = new WobblyWafersGame({ random }); g.start();
    const row = 1 + round % 5; g.layers[row] = [true, false, true]; loosen(g); pullOut(g, row, round % 2 ? 0 : 2);
    const count = g.crumbs.length;
    for (let i = 0; i < 80; i++) {
      g.update(.05);
      for (const c of g.crumbs) {
        if (c.grounded) {
          for (let k = 0; k < 4; k++) assert.ok(c.y + g.cornerOffset(c, k).y <= c.grounded.floor + .01, 'no corner sinks into the ground');
          const touching = c.x + g.cornerOffset(c, c.grounded.k).x; assert.ok(Math.abs(touching - c.grounded.x) < .01, 'the corner on the ground never slides');
        } else if (!c.attached && !c.rest && c.vy !== 0) assert.ok(Math.abs(c.spin) < 1.8, 'a wafer never flips over in the air');
      }
    }
    assert.equal(g.crumbs.length, count, 'no fallen wafer leaves the screen');
    for (const c of g.crumbs) {
      assert.ok(c.rest && c.spin === 0, 'every fallen wafer settles flat');
      assert.ok(c.x - WAFER_W / 2 >= -.01 && c.x + WAFER_W / 2 <= 360.01, 'and stays fully on screen');
      assert.ok([WAFER_BASE, WAFER_TABLE].some(y => Math.abs(c.y + c.h / 2 - y) < .01), 'on the saucer or the table, never on top of another wafer');
    }
  }
});
