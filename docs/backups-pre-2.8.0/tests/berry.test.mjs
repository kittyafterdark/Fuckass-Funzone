import test from 'node:test';
import assert from 'node:assert/strict';
import { BerryDropGame, BERRY_COLS, BERRY_ROWS, lineThrough, winningColumns, chooseBerryColumn, dropRow, BERRY_LEVELS } from '../src/connect.js';
import { berryColumnAt, drawBerryDrop } from '../src/connect-render.js';

const empty = () => Array(BERRY_COLS * BERRY_ROWS).fill(0);
const at = (row, col) => row * BERRY_COLS + col;
const settle = g => { for (let i = 0; i < 200 && (g.falling || g.turn === 2 && g.phase === 'turn' && g.status === 'playing'); i++) g.update(.1); };

test('Berry Drop finds rows, columns and both diagonals through the newest berry', () => {
  for (const cells of [[at(5, 0), at(5, 1), at(5, 2), at(5, 3)], [at(5, 6), at(4, 6), at(3, 6), at(2, 6)], [at(5, 0), at(4, 1), at(3, 2), at(2, 3)], [at(5, 6), at(4, 5), at(3, 4), at(2, 3)]]) {
    const b = empty(); for (const c of cells) b[c] = 1;
    assert.deepEqual(lineThrough(b, cells[3]), [...cells].sort((x, y) => x - y));
  }
  const b = empty(); b[at(5, 0)] = 1; b[at(5, 1)] = 1; b[at(5, 2)] = 2; b[at(5, 3)] = 1;
  assert.equal(lineThrough(b, at(5, 3)), null);
  assert.equal(dropRow(b, 0), 4);
});

test('Gabu takes a win first and blocks yours at every level', () => {
  for (const level of BERRY_LEVELS) {
    const win = empty(); win[at(5, 0)] = 2; win[at(5, 1)] = 2; win[at(5, 2)] = 2; win[at(5, 6)] = 1; win[at(4, 6)] = 1; win[at(3, 6)] = 1;
    assert.equal(chooseBerryColumn(win, level, () => .99), 3, `${level} wins instead of blocking`);
    const block = empty(); block[at(5, 2)] = 1; block[at(5, 3)] = 1; block[at(5, 4)] = 1;
    assert.ok([1, 5].includes(chooseBerryColumn(block, level, () => .99)), `${level} blocks an open three`);
  }
});

test('Berry Drop rounds build a streak, alternate starters, and one loss ends the run', () => {
  const events = [], g = new BerryDropGame({ random: () => .99, level: 'chill', onEvent: e => events.push(e) }); g.start();
  g.board = empty(); for (const c of [0, 1, 2]) g.board[at(5, c)] = 1; g.board[at(4, 0)] = 2; g.board[at(4, 1)] = 2; g.board[at(4, 6)] = 2;
  assert.equal(g.drop(3), true); assert.equal(g.drop(4), false, 'one berry in the air at a time'); settle(g);
  assert.equal(g.phase, 'over'); assert.equal(g.result, 'win'); assert.equal(g.wins, 1); assert.ok(g.score > 100);
  assert.ok(events.includes('win') && events.includes('score'));
  assert.equal(g.drop(0), true, 'a tap after the round deals the next one'); assert.equal(g.round, 2); assert.equal(g.starter, 2);
  settle(g); assert.equal(g.board.filter(v => v === 2).length, 1, 'Gabu opens round two');
  g.board = empty(); for (const c of [0, 1, 2]) g.board[at(5, c)] = 2; g.turn = 2; g.thinking = 0; settle(g);
  assert.equal(g.status, 'dead'); assert.equal(g.result, 'loss'); assert.ok(events.includes('death'));
  g.start(); assert.equal(g.score, 0, 'a new streak starts fresh'); assert.equal(g.round, 1);
});

test('Berry Drop judges blocks on the board the drop saw, and pausing freezes a falling berry', () => {
  const events = [], g = new BerryDropGame({ random: () => .5, onEvent: e => events.push(e) }); g.start();
  g.board = empty(); g.board[at(5, 0)] = 2; g.board[at(5, 1)] = 2; g.board[at(5, 2)] = 2; g.board[at(5, 6)] = 1;
  g.drop(3); g.update(.05); g.pause(); const y = g.falling.y; g.update(1); assert.equal(g.falling.y, y);
  g.start(); settle(g); assert.ok(events.includes('block'));
});

test('Berry Drop saves restore paused and reject floating or contradictory boards', () => {
  const g = new BerryDropGame({ random: () => .4 }); g.start(); g.drop(3); g.update(.05);
  const saved = g.snapshot(); assert.deepEqual(saved.falling, { col: 3, who: 1 });
  const back = new BerryDropGame({ saved }); assert.equal(back.status, 'paused'); assert.equal(back.falling.col, 3);
  const bad = patch => new BerryDropGame().restore({ ...saved, falling: null, ...patch });
  const floating = empty(); floating[at(2, 2)] = 1;
  assert.equal(bad({ board: floating }), false);
  const won = empty(); for (const c of [0, 1, 2, 3]) won[at(5, c)] = 2;
  assert.equal(bad({ board: won, phase: 'turn' }), false, 'a finished board must be over');
  assert.equal(bad({ board: won, phase: 'over', status: 'paused' }), false, 'Gabu’s line means the run is dead');
  assert.equal(bad({ board: won, phase: 'over', status: 'dead' }), true);
  assert.equal(bad({ level: 'nope' }), false);
});

test('Berry Drop renderer maps taps to columns and draws every state', () => {
  assert.equal(berryColumnAt(27, 200), 0); assert.equal(berryColumnAt(333, 200), 6); assert.equal(berryColumnAt(10, 200), -1); assert.equal(berryColumnAt(100, 30), -1);
  const ctx = new Proxy({ createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }) }, {
    get(target, name) { return name in target ? target[name] : () => {}; }, set(target, name, value) { target[name] = value; return true; },
  });
  const canvas = { width: 720, height: 904, getContext: () => ctx };
  const g = new BerryDropGame({ random: () => .5 }); drawBerryDrop(canvas, g, {}); g.start(); g.drop(3); drawBerryDrop(canvas, g, {}); g.pause(); drawBerryDrop(canvas, g, {});
  assert.ok(winningColumns(empty(), 1).length === 0);
});
