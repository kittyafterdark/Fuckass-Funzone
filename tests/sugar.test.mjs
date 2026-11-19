import test from 'node:test';
import assert from 'node:assert/strict';
import { SugarSnapGame, SUGAR_SHAPES, SUGAR_PACES, SUGAR_CX, SUGAR_CY, SUGAR_R, sugarPath } from '../src/sugar.js';
import { drawSugarSnap } from '../src/sugar-render.js';

// Traces the current shape at a steady speed, one pointer move per frame, from sample `from` for `seconds`.
const trace = (g, speed, seconds, from = 0, offset = 0) => {
  const path = g.path, n = path.length; let along = from;
  g.press(path[from].x, path[from].y + offset);
  for (let f = 0; f < Math.round(seconds * 60) && g.phase === 'carve'; f++) {
    along += speed / 60 / 3; const p = path[Math.floor(along) % n]; g.drag(p.x, p.y + offset); g.update(1 / 60);
  }
};
const playing = (options = {}) => { const g = new SugarSnapGame({ random: () => .5, ...options }); g.start(); return g; };

test('Sugar Snap shapes: eight original outlines, evenly sampled, all well inside the toffee', () => {
  assert.deepEqual(SUGAR_SHAPES, ['heart', 'fish', 'mushroom', 'star', 'cat', 'moon', 'bot', 'bolt']);
  for (const name of SUGAR_SHAPES) {
    const path = sugarPath(name);
    assert.ok(path.length > 100, `${name} has enough samples`);
    path.forEach((p, i) => {
      const q = path[(i + 1) % path.length];
      assert.ok(Math.hypot(q.x - p.x, q.y - p.y) <= 3.05, `${name} samples are evenly spaced`);
      assert.ok(Math.hypot(p.x - SUGAR_CX, p.y - SUGAR_CY) < SUGAR_R - 30, `${name} stays clear of the toffee's rim`);
    });
  }
});

test('tracing the line carves it, frees the shape, and pays for time left and a clean carve', () => {
  const events = [], g = playing({ onEvent: e => events.push(e) });
  trace(g, 80, 12);
  assert.equal(g.phase, 'over'); assert.equal(g.result, 'free'); assert.equal(g.progress, 1);
  assert.equal(events.filter(e => e === 'carve').length, 3, 'a quarter, half and three quarters carved');
  assert.ok(events.includes('free') && events.includes('score'));
  assert.equal(g.score, 100 + Math.round(g.time) * 10 + Math.round((1 - g.peak) * 100), 'base, time bonus and clean bonus');
  assert.ok(g.peak < .05, 'a steady carve under the safe speed barely strains the toffee');
  g.nextRound(); assert.equal(g.shape, 'fish'); assert.equal(g.phase, 'carve'); assert.equal(g.progress, 0);
});

test('a needle off the line carves nothing and scratching the toffee strains it until it cracks, then snaps', () => {
  const events = [], g = playing({ onEvent: e => events.push(e) });
  trace(g, 60, 1, 0, 25);
  assert.equal(g.progress, 0, 'nothing is carved off the line'); assert.ok(g.stress > 0 && g.scratches.length > 0);
  g.lift(); g.press(SUGAR_CX + 200, SUGAR_CY); g.drag(SUGAR_CX + 200, SUGAR_CY + 80);
  const plate = g.stress; assert.ok(plate > 0); g.drag(SUGAR_CX + 200, SUGAR_CY + 120); assert.equal(g.stress, plate, 'the plate around the candy is safe to touch');
  // Sweeping fast across the plate, even off the canvas edge, is not carving speed, and any crack stays on the toffee.
  for (let i = 0; i < 30; i++) { g.drag(i % 2 ? -80 : 440, SUGAR_CY + 150); g.update(1 / 60); }
  assert.ok(g.stress <= plate, 'a fast sweep off the candy does not strain it (it even cools a little)');
  g.strain(.01, -500, -500); assert.ok(g.cracks.every(c => Math.hypot(c.x - SUGAR_CX, c.y - SUGAR_CY) < SUGAR_R), 'cracks start on the toffee');
  assert.ok(new SugarSnapGame().restore(g.snapshot()), 'so the save still loads');
  g.lift(); g.press(SUGAR_CX, SUGAR_CY + 20);
  for (let i = 0; i < 400 && g.phase === 'carve'; i++) g.drag(SUGAR_CX + (i % 2 ? 6 : -6), SUGAR_CY + 20);
  assert.deepEqual(events.filter(e => e === 'crack').length, 2, 'two warning cracks before it gives');
  assert.equal(g.result, 'snap'); assert.equal(g.lives, 2); assert.ok(events.includes('snap'));
});

test('rushing strains the toffee even on the line, a steady hand does not, and bursty pointer events are smoothed', () => {
  const fast = playing(); trace(fast, fast.rules.safe * 2.5, 2.5);
  assert.ok(fast.peak > .4, 'carving far over the safe speed strains it');
  const bursty = playing(), path = bursty.path; bursty.press(path[0].x, path[0].y);
  // Moves arrive one sample at a time every third frame: a steady 60 px/s, though each burst alone looks like 180.
  for (let f = 1; f < 240 && bursty.phase === 'carve'; f++) { if (f % 3 === 0) { const p = path[(f / 3) % path.length]; bursty.drag(p.x, p.y); } bursty.update(1 / 60); }
  assert.equal(bursty.peak, 0, 'the needle speed is judged over a moment, not per event');
});

test('the clock runs out for a candy, and the third lost candy ends the run', () => {
  const events = [], g = playing({ onEvent: e => events.push(e) });
  for (let i = 0; i < 3; i++) { for (let t = 0; t < g.limit * 60 + 5 && g.phase === 'carve'; t++) g.update(1 / 60); if (i < 2) { assert.equal(g.result, 'timeout'); g.nextRound(); } }
  assert.equal(events.filter(e => e === 'timeout').length, 3); assert.equal(g.lives, 0); assert.equal(g.status, 'dead'); assert.ok(events.includes('death'));
  g.nextRound(); assert.equal(g.round, 2, 'a finished run takes no more shapes');
  g.start(); assert.equal(g.status, 'playing'); assert.equal(g.lives, 3); assert.equal(g.round, 0); assert.equal(g.score, 0);
  const paused = playing(); paused.pause(); const left = paused.time; paused.update(2); assert.equal(paused.time, left, 'pause stops the clock');
});

test('difficulty changes the time, the width of the line and how much the toffee takes; laps tighten it', () => {
  const [chill, normal, hard] = SUGAR_PACES.map(pace => playing({ pace }));
  assert.ok(chill.limit > normal.limit && normal.limit > hard.limit);
  assert.ok(chill.rules.tol > normal.rules.tol && normal.rules.tol > hard.rules.tol);
  assert.ok(chill.rules.safe > normal.rules.safe && normal.rules.safe > hard.rules.safe);
  const first = normal.rules.tol; normal.round = SUGAR_SHAPES.length; normal.setup();
  assert.equal(normal.shape, 'heart'); assert.ok(normal.rules.tol < first, 'the second lap narrows the line');
  assert.equal(new SugarSnapGame({ pace: 'turbo' }).pace, 'normal');
});

test('holding Space carves on along the line; on Hard, holding it without a breath strains the toffee', () => {
  const g = playing({ pace: 'chill' });
  for (let i = 0; i < 400 && g.phase === 'carve'; i++) { g.nudge(); if (i % 2) g.update(1 / 60); }
  assert.equal(g.result, 'free', 'keyboard carving frees the shape');
  const hard = playing({ pace: 'hard' });
  for (let i = 0; i < 120 && hard.phase === 'carve'; i++) { hard.nudge(); hard.update(1 / 30); }
  assert.ok(hard.peak > .3, 'a held key at full repeat is too fast for Hard toffee');
});

test('Sugar Snap saves restore paused and reject tampered candy', () => {
  const g = playing({ pace: 'hard' }); trace(g, 50, 3);
  const saved = g.snapshot(), back = new SugarSnapGame({ saved });
  assert.equal(back.status, 'paused'); assert.equal(back.pace, 'hard'); assert.equal(back.progress, g.progress); assert.equal(back.time, saved.time);
  const bad = patch => new SugarSnapGame().restore({ ...saved, ...patch });
  assert.equal(bad({ cut: saved.cut.slice(1) }), false, 'the carved line must match its shape');
  assert.equal(bad({ cut: saved.cut.replace(/0/g, '1') }), false, 'a fully carved line is not still carving');
  assert.equal(bad({ cut: saved.cut.replace('0', '2') }), false);
  assert.equal(bad({ phase: 'over', result: null }), false); assert.equal(bad({ stress: .9, peak: .1 }), false);
  assert.equal(bad({ lives: 0 }), false); assert.equal(bad({ status: 'dead' }), false); assert.equal(bad({ pace: 'turbo' }), false);
  assert.equal(bad({ cracks: [[1, 2, 3]] }), false); assert.equal(bad({ time: -1 }), false);
});

test('the Sugar Snap renderer draws every state', () => {
  const text = [];
  const ctx = new Proxy({ createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }) }, {
    get(target, name) { return name in target ? target[name] : (...args) => { if (name === 'fillText') text.push(args[0]); }; },
    set(target, name, value) { target[name] = value; return true; },
  });
  const canvas = { width: 720, height: 904, getContext: () => ctx }, g = new SugarSnapGame({ random: () => .5 });
  drawSugarSnap(canvas, g, {}); g.start(); trace(g, 60, 1); drawSugarSnap(canvas, g, { time: 1 });
  trace(g, 80, 12, g.cut.indexOf(0)); drawSugarSnap(canvas, g, { reduced: true });
  g.nextRound(); g.strain(1, SUGAR_CX, SUGAR_CY); drawSugarSnap(canvas, g, {});
  g.nextRound(); g.update(999); for (let t = 0; t < g.limit * 9 && g.phase === 'carve'; t++) g.update(.12); drawSugarSnap(canvas, g, {});
  g.nextRound(); g.pause(); drawSugarSnap(canvas, g, {});
  g.start(); g.strain(1, SUGAR_CX, SUGAR_CY); drawSugarSnap(canvas, g, {});
  for (const label of ['SUGAR SNAP', 'POPPED IT!', 'SNAP!', 'TIME!', 'PAUSED', 'OUT OF CANDY']) assert.ok(text.includes(label), label);
});
