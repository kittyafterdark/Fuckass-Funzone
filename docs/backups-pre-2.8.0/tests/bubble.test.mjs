import test from 'node:test';
import assert from 'node:assert/strict';
import { BubbleGame, BUBBLE_ROWS, BUBBLE_COLS, BUBBLE_DEATH_ROW, BUBBLE_PACES, LAUNCH_X } from '../src/bubble.js';
import { drawBubbleBloom } from '../src/bubble-render.js';

const blank = () => Array.from({ length: BUBBLE_ROWS }, () => Array(BUBBLE_COLS).fill(-1));
function shoot(g, angle = Math.PI / 2) { g.aim = angle; assert.equal(g.fire(), true); for (let i = 0; i < 300 && g.shot; i++) g.update(1 / 60); }

test('Bubble Bloom deals rows within the pace color limit and only loads colors still on the board', () => {
  for (const pace of BUBBLE_PACES) {
    const g = new BubbleGame({ pace, random: () => .999 });
    assert.ok(g.grid.flat().every(k => k < g.kindCount())); assert.equal(g.grid[0].filter(k => k >= 0).length, BUBBLE_COLS);
  }
  const g = new BubbleGame({ random: () => .5 }); g.grid = blank(); g.grid[0][0] = 4;
  for (let i = 0; i < 6; i++) assert.equal(g.pickKind(), 4);
});

test('a matching shot pops its cluster and drops anything left hanging', () => {
  const events = [], g = new BubbleGame({ random: () => .5, onEvent: e => events.push(e) }); g.start();
  g.grid = blank(); g.parity = 0;
  for (const c of [3, 4, 5, 6]) g.grid[0][c] = 1;
  g.grid[1][4] = 2; g.grid[1][5] = 2; g.grid[2][4] = 0; g.grid[2][5] = 0; g.grid[3][4] = 3;
  // Land a heart beside the pair (row 1, col 6). Row 1 is indented, so the three touch.
  const spot = g.center(1, 6); g.shot = { x: spot.x + 2, y: spot.y + 3, vx: 0, vy: 0, kind: 2 }; g.settle(2);
  assert.equal(g.grid[1][4], -1); assert.equal(g.grid[1][5], -1); assert.equal(g.grid[1][6], -1);
  assert.equal(g.grid.slice(2).flat().filter(k => k >= 0).length, 0, 'everything below the popped anchor falls');
  assert.ok(events.includes('avalanche') || events.includes('pop')); assert.ok(g.score >= 30 + 3 * 20);
});

test('misses push a new row in without changing the indent of the rows already there', () => {
  const events = [], g = new BubbleGame({ random: () => .5, onEvent: e => events.push(e) }); g.start();
  g.grid = blank(); g.parity = 0; g.grid[0][0] = 1; g.grid[1][0] = 1;
  const before = g.center(1, 0);
  g.misses = g.shotsPerRow() - 1; g.current = 3; shoot(g, Math.PI - .25);
  assert.equal(g.misses, 0); assert.ok(events.includes('ceiling'));
  const after = g.center(2, 0); assert.equal(after.x, before.x, 'the old row keeps its indent after moving down');
  assert.equal(g.grid[2][0], 1);
});

test('Bubble Bloom ends at the cushion line and levels up when the board is clear', () => {
  const events = [], g = new BubbleGame({ random: () => .5, onEvent: e => events.push(e) }); g.start();
  g.grid = blank(); for (let r = 0; r < BUBBLE_DEATH_ROW; r++) g.grid[r][0] = r % 2 ? 1 : 3;
  g.current = 4; shoot(g, Math.PI - .22);
  assert.equal(g.status, 'dead'); assert.ok(events.includes('death'));
  const c = new BubbleGame({ random: () => .5, onEvent: e => events.push(e) }); c.start();
  c.grid = blank(); c.parity = 0; c.grid[0][4] = 2; c.grid[0][5] = 2; c.current = 2; shoot(c, Math.PI / 2);
  assert.equal(c.level, 2); assert.ok(events.includes('clear')); assert.ok(c.grid[0].some(k => k >= 0), 'a new board is dealt');
});

test('Bubble Bloom aim clamps, swap trades bubbles, pause freezes a shot, and saves restore paused', () => {
  const g = new BubbleGame({ random: () => .5 }); g.start();
  g.setAim(LAUNCH_X + 400, 420); assert.ok(g.aim >= .2); g.setAim(LAUNCH_X - 400, 420); assert.ok(g.aim <= Math.PI - .2);
  const [a, b] = [g.current, g.next]; g.swap(); assert.deepEqual([g.current, g.next], [b, a]);
  g.aim = Math.PI / 2; g.fire(); g.update(.05); g.pause(); const y = g.shot.y; g.update(1); assert.equal(g.shot.y, y);
  const saved = g.snapshot(); assert.equal(saved.current, g.shot.kind, 'a shot in flight is saved back into the launcher');
  const back = new BubbleGame({ saved }); assert.equal(back.status, 'paused'); assert.deepEqual(back.grid, g.grid);
  const bad = patch => new BubbleGame().restore({ ...saved, ...patch });
  const grid = saved.grid.map(r => [...r]); grid[1][BUBBLE_COLS - 1] = 0;
  assert.equal(bad({ grid, parity: 0 }), false, 'an indented row cannot use its missing last slot');
  assert.equal(bad({ status: 'dead' }), false); assert.equal(bad({ pace: 'turbo' }), false);
  const { pace, ...older } = saved; assert.equal(new BubbleGame().restore(older), true);
});

test('Bubble Bloom renderer draws idle, aiming, popping and overflow states', () => {
  const text = [];
  const ctx = new Proxy({ createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }) }, {
    get(target, name) { return name in target ? target[name] : (...args) => { if (name === 'fillText') text.push(args[0]); }; },
    set(target, name, value) { target[name] = value; return true; },
  });
  const canvas = { width: 720, height: 904, getContext: () => ctx }, g = new BubbleGame({ random: () => .5 });
  drawBubbleBloom(canvas, g, {}); g.start(); drawBubbleBloom(canvas, g, {}); g.fire(); g.update(.1); drawBubbleBloom(canvas, g, {});
  g.finish(); drawBubbleBloom(canvas, g, {});
  assert.ok(text.includes('BUBBLE OVERFLOW')); assert.ok(text.includes('BUBBLE BLOOM'));
});
