import test from 'node:test';
import assert from 'node:assert/strict';
import { TicTacTreatsGame, tictacLine, tictacThreats, chooseTictacCell } from '../src/tictac.js';
import { tictacCellAt, drawTicTacTreats } from '../src/tictac-render.js';

test('Hard Gabu never loses Tic Tac Treats against any sequence of player moves', () => {
  let games = 0;
  function explore(board, turn) {
    const line = tictacLine(board);
    if (line) { assert.notEqual(board[line[0]], 1, `player won with ${board.join('')}`); games++; return; }
    if (board.every(Boolean)) { games++; return; }
    if (turn === 2) { const next = [...board]; next[chooseTictacCell(board, 'hard', () => .5)] = 2; explore(next, 1); return; }
    for (let i = 0; i < 9; i++) if (!board[i]) { const next = [...board]; next[i] = 1; explore(next, 2); }
  }
  explore(Array(9).fill(0), 1); explore(Array(9).fill(0), 2);
  assert.ok(games > 100);
});

test('every level takes a win, and Chill sometimes misses a block', () => {
  for (const level of ['chill', 'normal', 'hard']) assert.equal(chooseTictacCell([2, 2, 0, 1, 1, 0, 0, 0, 0], level, () => .01), 2);
  const rolls = [.01, .99]; assert.equal(chooseTictacCell([1, 1, 0, 0, 2, 0, 0, 0, 0], 'chill', () => rolls.shift()), 8, 'a low roll lets Chill pick any open square');
  assert.equal(chooseTictacCell([1, 1, 0, 0, 2, 0, 0, 0, 0], 'hard', () => .01), 2);
  assert.deepEqual(tictacThreats([1, 1, 0, 0, 0, 0, 0, 0, 0], 1), [2]);
});

test('Tic Tac Treats reports forks and blocks, builds a streak, and ends it on a loss', () => {
  const events = [], g = new TicTacTreatsGame({ random: () => .99, level: 'chill', onEvent: e => events.push(e) }); g.start();
  g.board = [1, 0, 0, 0, 2, 0, 0, 0, 1]; g.place(6);
  assert.ok(events.includes('fork'));
  g.board = [1, 0, 1, 0, 2, 0, 1, 0, 0]; g.turn = 1; g.place(3);
  assert.equal(g.result, 'win'); assert.equal(g.wins, 1); assert.equal(g.phase, 'over');
  assert.equal(g.place(0), true); assert.equal(g.round, 2); assert.equal(g.starter, 2);
  for (let i = 0; i < 20 && g.turn === 2; i++) g.update(.1);
  assert.equal(g.board.filter(v => v === 2).length, 1);
  g.board = [2, 2, 0, 1, 0, 1, 0, 0, 0]; g.turn = 2; g.thinking = 0; g.update(.1);
  assert.equal(g.status, 'dead'); assert.ok(events.includes('death'));
});

test('Tic Tac Treats saves restore paused and reject impossible turn counts', () => {
  const g = new TicTacTreatsGame({ random: () => .5 }); g.start(); g.place(4); const saved = g.snapshot();
  const back = new TicTacTreatsGame({ saved }); assert.equal(back.status, 'paused'); assert.equal(back.turn, 2);
  const bad = patch => new TicTacTreatsGame().restore({ ...saved, ...patch });
  assert.equal(bad({ board: [1, 1, 0, 0, 0, 0, 0, 0, 0] }), false, 'two pocky crosses without a reply');
  assert.equal(bad({ turn: 1 }), false, 'the turn must follow from the counts');
  assert.equal(bad({ board: [2, 2, 2, 1, 1, 0, 1, 0, 0], phase: 'over', status: 'paused' }), false);
});

test('Tic Tac Treats renderer maps taps to squares and draws every state', () => {
  assert.equal(tictacCellAt(50, 106), 0); assert.equal(tictacCellAt(310, 366), 8); assert.equal(tictacCellAt(20, 106), -1);
  const ctx = new Proxy({ createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }) }, {
    get(target, name) { return name in target ? target[name] : () => {}; }, set(target, name, value) { target[name] = value; return true; },
  });
  const canvas = { width: 720, height: 904, getContext: () => ctx }, g = new TicTacTreatsGame();
  drawTicTacTreats(canvas, g, {}); g.start(); g.place(4); drawTicTacTreats(canvas, g, {}); g.pause(); drawTicTacTreats(canvas, g, {});
});
