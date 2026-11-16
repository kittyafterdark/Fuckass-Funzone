import test from 'node:test';
import assert from 'node:assert/strict';
import { SprinkleScurryGame, SCURRY_MAZE, SCURRY_COLS, SCURRY_ROWS, SCURRY_DIRS, SCURRY_PACES } from '../src/scurry.js';
import { drawSprinkleScurry, scurrySwipe, scurryLayout } from '../src/scurry-render.js';

const open = (c, r) => !'#=D'.includes(SCURRY_MAZE[r]?.[c] ?? '#');
const run = (g, seconds) => { for (let i = 0; i < Math.round(seconds * 60); i++) g.update(1 / 60); };
// Skips the get-ready pause and parks every bot on its charger, so a test controls who is where.
const quiet = g => { g.start(); g.ready = 0; g.phase = 'play'; for (const b of g.bots) Object.assign(b, { state: 'dock', wait: 999, c: 7, r: 5, t: 0 }); return g; };

test('Sprinkle Scurry maze: every aisle connects, none dead-ends, and every sprinkle can be reached', () => {
  assert.equal(SCURRY_MAZE.length, SCURRY_ROWS); assert.ok(SCURRY_MAZE.every(row => row.length === SCURRY_COLS));
  const cells = []; for (let r = 0; r < SCURRY_ROWS; r++) for (let c = 0; c < SCURRY_COLS; c++) if (open(c, r)) cells.push([c, r]);
  const exits = ([c, r]) => Object.values(SCURRY_DIRS).filter(([dx, dy]) => open(c + dx, r + dy)).length;
  assert.ok(cells.every(cell => exits(cell) >= 2), 'no aisle is a dead end, so the hamster can always run');
  const seen = new Set(['7,15']), queue = [[7, 15]];
  while (queue.length) { const [c, r] = queue.shift(); for (const [dx, dy] of Object.values(SCURRY_DIRS)) { const k = `${c + dx},${r + dy}`; if (open(c + dx, r + dy) && !seen.has(k)) { seen.add(k); queue.push([c + dx, r + dy]); } } }
  assert.equal(seen.size, cells.length, 'the hamster can reach every open cell');
  assert.equal(SCURRY_MAZE.join('').split('o').length - 1, 4, 'four sugar cubes');
});

test('the hamster eats as it runs, takes an early turn at the next opening, and can turn back mid-aisle', () => {
  const events = [], g = quiet(new SprinkleScurryGame({ random: () => .5, onEvent: e => events.push(e) }));
  const before = g.remaining; g.steer('left'); run(g, .5);
  assert.ok(g.remaining < before && g.score === (before - g.remaining) * 10, 'each sprinkle is worth 10'); assert.ok(events.includes('munch'));
  g.steer('up'); run(g, 2);
  assert.ok(g.hamster.r < 15, 'the turn asked for early is taken at the next opening');
  const h = g.hamster; h.c = 3; h.r = 15; h.dir = 'right'; h.t = .4; h.moving = true; g.steer('left');
  assert.deepEqual([h.c, h.dir, Math.round(h.t * 10) / 10], [4, 'left', .6], 'turning back flips mid-aisle without snapping to a cell');
  g.munches = 9; g.dots[15 * SCURRY_COLS + 2] = 1;
  h.c = 3; h.r = 15; h.t = 0; h.dir = 'left'; h.moving = true; g.want = 'left'; events.length = 0; run(g, .25);
  assert.ok(events.includes('score'), 'the score is reported every tenth sprinkle');
});

test('a sugar cube makes the bots dizzy; bonks send them home for doubling points; the rush wears off', () => {
  const events = [], g = quiet(new SprinkleScurryGame({ random: () => .5, onEvent: e => events.push(e) }));
  const [a, b] = g.bots; Object.assign(a, { state: 'chase', c: 3, r: 1, dir: 'left' }); Object.assign(b, { state: 'chase', c: 9, r: 3, dir: 'left' });
  g.eat(1, 1); assert.ok(g.sugar > 0 && a.scared && b.scared); assert.ok(events.includes('sugar'));
  const h = g.hamster; Object.assign(h, { c: 3, r: 1, t: 0, moving: false }); g.catchCheck();
  assert.equal(a.state, 'dock'); assert.equal(a.scared, false); assert.equal(g.lives, 3, 'a dizzy bot is bonked, not caught');
  Object.assign(h, { c: 9, r: 3 }); g.catchCheck(); assert.equal(b.state, 'dock');
  assert.equal(g.score, 50 + 100 + 200, 'sugar 50, then 100 and 200 for the bonks'); assert.equal(events.filter(e => e === 'bonk').length, 2);
  Object.assign(b, { state: 'chase', c: 5, r: 7, wait: 0 }); b.scared = true; run(g, g.sugar + .1);
  assert.equal(g.sugar, 0); assert.ok(g.bots.every(x => !x.scared), 'every bot recovers when the rush ends');
});

test('a chasing bot costs a heart and resets the board; the third catch ends the run', () => {
  const events = [], g = quiet(new SprinkleScurryGame({ random: () => .5, onEvent: e => events.push(e) }));
  const catchOnce = () => { g.phase = 'play'; Object.assign(g.bots[0], { state: 'chase', c: g.hamster.c, r: g.hamster.r, t: 0, scared: false }); g.catchCheck(); };
  catchOnce(); assert.equal(g.lives, 2); assert.equal(g.phase, 'ready', 'everyone goes back to the start with a moment to get ready'); assert.ok(events.includes('caught'));
  assert.equal(g.bots[0].state, 'chase'); assert.ok(g.bots.slice(1).every(b => b.state === 'dock'));
  catchOnce(); catchOnce(); assert.equal(g.lives, 0); assert.equal(g.status, 'dead'); assert.ok(events.includes('death'));
  g.start(); assert.equal(g.status, 'playing'); assert.equal(g.lives, 3); assert.equal(g.score, 0, 'a new run starts fresh');
});

test('clearing the shop pays a bonus, refills it, and starts a faster level', () => {
  const events = [], g = quiet(new SprinkleScurryGame({ pace: 'normal', random: () => .5, onEvent: e => events.push(e) }));
  const slow = g.botSpeed({ scared: false, state: 'chase' });
  g.dots = g.dots.map(() => 0); g.dots[15 * SCURRY_COLS + 6] = 1; g.score = 0;
  g.steer('left'); run(g, .4);
  assert.ok(events.includes('win')); assert.equal(g.level, 2); assert.equal(g.score, 10 + 300);
  assert.equal(g.remaining, SCURRY_MAZE.join('').replace(/[^.o]/g, '').length, 'every sprinkle and sugar cube is back');
  assert.ok(g.botSpeed({ scared: false, state: 'chase' }) > slow, 'bots roll faster on later levels');
  g.level = 40; assert.ok(g.botSpeed({ scared: false, state: 'chase' }) < 5.2, 'but never catch up with a running hamster');
});

test('pace changes the real number of bots, their speed, and the length of a sugar rush', () => {
  const [chill, normal, chaos] = SCURRY_PACES.map(pace => quiet(new SprinkleScurryGame({ pace, random: () => .5 })));
  assert.deepEqual([chill.bots.length, normal.bots.length, chaos.bots.length], [2, 3, 4]);
  const speed = g => g.botSpeed({ scared: false, state: 'chase' }); assert.ok(speed(chill) < speed(normal) && speed(normal) < speed(chaos));
  for (const g of [chill, normal, chaos]) g.eat(1, 1);
  assert.ok(chill.sugar > normal.sugar && normal.sugar > chaos.sugar);
  const paused = new SprinkleScurryGame({ random: () => .5 }); paused.start(); paused.pause(); const before = JSON.stringify(paused.hamster); run(paused, 2);
  assert.equal(JSON.stringify(paused.hamster), before, 'pause freezes everything');
});

test('Sprinkle Scurry saves restore paused at the start positions and reject tampered shops', () => {
  const g = quiet(new SprinkleScurryGame({ pace: 'chaos', random: () => .5 })); g.steer('left'); run(g, 1);
  const saved = g.snapshot(), back = new SprinkleScurryGame({ saved });
  assert.equal(back.status, 'paused'); assert.equal(back.pace, 'chaos'); assert.equal(back.score, g.score); assert.equal(back.remaining, g.remaining);
  assert.deepEqual([back.hamster.c, back.hamster.r], [7, 15]); assert.equal(back.phase, 'ready');
  const bad = patch => new SprinkleScurryGame().restore({ ...saved, ...patch });
  assert.equal(bad({ dots: '1' + saved.dots.slice(1) }), false, 'a sprinkle cannot sit inside a shelf');
  assert.equal(bad({ dots: saved.dots.replace(/[12]/g, '0') }), false, 'a live run has sprinkles left');
  assert.equal(bad({ lives: 0 }), false, 'a live run has hearts'); assert.equal(bad({ status: 'dead' }), false, 'a finished run has none');
  assert.equal(bad({ pace: 'turbo' }), false); assert.equal(bad({ level: 0 }), false);
});

test('Sprinkle Scurry swipes and taps steer, and the renderer draws every state', () => {
  const g = new SprinkleScurryGame({ random: () => .5 }), { x0, y0, cell } = scurryLayout();
  assert.equal(scurrySwipe(g, { x: 100, y: 200 }, { x: 160, y: 210 }), 'right'); assert.equal(scurrySwipe(g, { x: 100, y: 200 }, { x: 95, y: 120 }), 'up');
  const hx = x0 + 7.5 * cell, hy = y0 + 15.5 * cell;
  assert.equal(scurrySwipe(g, { x: hx - 60, y: hy }, { x: hx - 58, y: hy + 1 }), 'left', 'a tap heads toward where it landed');
  assert.equal(scurrySwipe(g, { x: hx, y: hy }, { x: hx + 1, y: hy }), null, 'a tap on the hamster itself is not a direction');
  const text = [];
  const ctx = new Proxy({ createLinearGradient: () => ({ addColorStop() {} }) }, {
    get(target, name) { return name in target ? target[name] : (...args) => { if (name === 'fillText') text.push(args[0]); }; },
    set(target, name, value) { target[name] = value; return true; },
  });
  const canvas = { width: 720, height: 904, getContext: () => ctx };
  drawSprinkleScurry(canvas, g, {}); quiet(g); g.phase = 'ready'; g.ready = 1; drawSprinkleScurry(canvas, g, {});
  g.phase = 'play'; g.eat(1, 1); g.bots[0].state = 'chase'; drawSprinkleScurry(canvas, g, { reduced: true });
  g.lives = 1; g.catchCheck(); Object.assign(g.bots[0], { state: 'chase', c: g.hamster.c, r: g.hamster.r, t: 0, scared: false }); g.phase = 'play'; g.catchCheck(); drawSprinkleScurry(canvas, g, {});
  assert.ok(text.includes('SPRINKLE SCURRY')); assert.ok(text.includes('READY?')); assert.ok(text.includes('SUGAR RUSH! BONK THE DIZZY BOTS')); assert.ok(text.includes('VACUUMED UP!'));
});
