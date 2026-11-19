import test from 'node:test';
import assert from 'node:assert/strict';
import { TicTacTreatsGame, tictacLine, tictacThreats, tictacAfter, chooseTictacCell, TICTAC_STALE } from '../src/tictac.js';
import { tictacCellAt, drawTicTacTreats } from '../src/tictac-render.js';

test('each side keeps only its three newest treats: a fourth eats the oldest, and the faded one is next to go', () => {
  const events = [], g = new TicTacTreatsGame({ random: () => .99, level: 'chill', onEvent: (e, d) => events.push([e, d]) }); g.start();
  g.board = [1, 0, 1, 2, 0, 2, 0, 1, 0]; g.queues = { 1: [0, 7, 2], 2: [3, 5] }; g.moves = 5; g.turn = 1;
  assert.equal(g.fading(1), 0); assert.equal(g.fading(2), -1);
  // Placing on 1 would complete the top row, but it eats the treat on 0 first, so it is not a win.
  assert.deepEqual(tictacThreats(g.board, 1, g.queues), [], 'a line that eats its own treat is not a threat');
  g.place(1); assert.equal(g.board[0], 0); assert.deepEqual(g.queues[1], [7, 2, 1]); assert.equal(g.result, null);
  assert.ok(events.some(([e, d]) => e === 'place' && d.eaten === 0)); assert.equal(g.eaten.length, 1);
  assert.ok(g.board.filter(v => v === 1).length <= 3);
  const after = tictacAfter([1, 1, 0, 0, 0, 0, 0, 0, 0], { 1: [0, 1], 2: [] }, 2, 1); assert.deepEqual(tictacLine(after.board), [0, 1, 2], 'with two down, a third completes the row');
});

test('every level takes a win; Chill sometimes slips; Hard blocks', () => {
  const q = { 1: [3, 4], 2: [0, 1] };
  for (const level of ['chill', 'normal', 'hard']) assert.equal(chooseTictacCell([2, 2, 0, 1, 1, 0, 0, 0, 0], level, () => .01, q), 2);
  const rolls = [.01, .99]; assert.equal(chooseTictacCell([1, 1, 0, 0, 2, 0, 0, 0, 0], 'chill', () => rolls.shift(), { 1: [0, 1], 2: [4] }), 8, 'a low roll lets Chill pick any open square');
  assert.equal(chooseTictacCell([1, 1, 0, 0, 2, 0, 0, 0, 0], 'hard', () => .01, { 1: [0, 1], 2: [4] }), 2);
  assert.deepEqual(tictacThreats([1, 1, 0, 0, 0, 0, 0, 0, 0], 1), [2]);
});

test('a long round with no line goes stale as a draw, so a game can never loop forever', () => {
  const events = [], g = new TicTacTreatsGame({ random: () => .5, onEvent: e => events.push(e) }); g.start();
  g.board = [1, 2, 1, 1, 2, 2, 0, 0, 0]; g.queues = { 1: [0, 2, 3], 2: [1, 4, 5] }; g.moves = TICTAC_STALE - 1; g.turn = 1;
  g.place(7); assert.equal(g.phase, 'over'); assert.equal(g.result, 'draw'); assert.equal(g.draws, 1); assert.ok(events.includes('draw'));
});

test('Tic Tac Treats reports blocks, builds a streak, and ends it on a loss; a fork is impossible with three treats', () => {
  const events = [], g = new TicTacTreatsGame({ random: () => .99, level: 'chill', onEvent: e => events.push(e) }); g.start();
  g.board = [2, 2, 0, 0, 1, 0, 0, 0, 0]; g.queues = { 1: [4], 2: [0, 1] }; g.moves = 3; g.turn = 1; g.place(2);
  assert.ok(events.includes('block'));
  // Only your two newest treats can make a threat, and two treats share just one line.
  g.board = [1, 0, 0, 0, 2, 0, 0, 0, 1]; g.queues = { 1: [0, 8], 2: [4] }; g.turn = 1; g.place(6);
  assert.deepEqual(g.queues[1], [0, 8, 6]); assert.equal(tictacThreats(g.board, 1, g.queues).length, 1, 'only 7 threatens: 3 would eat the treat on 0');
  g.board = [1, 0, 1, 0, 2, 0, 0, 0, 0]; g.queues = { 1: [0, 2], 2: [4] }; g.moves = 3; g.turn = 1; g.phase = 'turn'; g.place(1);
  assert.equal(g.result, 'win'); assert.equal(g.wins, 1); assert.equal(g.phase, 'over');
  assert.equal(g.place(0), true); assert.equal(g.round, 2); assert.equal(g.starter, 2);
  for (let i = 0; i < 20 && g.turn === 2; i++) g.update(.1);
  assert.equal(g.board.filter(v => v === 2).length, 1);
  g.board = [2, 2, 0, 1, 0, 1, 0, 0, 0]; g.queues = { 1: [3, 5], 2: [0, 1] }; g.turn = 2; g.thinking = 0; g.update(.1);
  assert.equal(g.status, 'dead'); assert.ok(events.includes('death'));
});

test('Tic Tac Treats saves restore paused, reject impossible boards, and old saves keep their streak', () => {
  const g = new TicTacTreatsGame({ random: () => .5 }); g.start(); g.place(4); for (let i = 0; i < 20 && g.turn === 2; i++) g.update(.1); g.place(g.board.indexOf(0));
  const saved = g.snapshot(), back = new TicTacTreatsGame({ saved });
  assert.equal(back.status, 'paused'); assert.deepEqual(back.board, g.board); assert.deepEqual(back.queues, g.queues); assert.equal(back.turn, g.turn);
  const bad = patch => new TicTacTreatsGame().restore({ ...saved, ...patch });
  assert.equal(bad({ queues: { 1: [4, 4], 2: saved.queues[2] } }), false, 'a cell cannot be queued twice');
  assert.equal(bad({ board: saved.board.map((v, i) => i === saved.queues[1][0] ? 0 : v) }), false, 'the queue must match the board');
  assert.equal(bad({ turn: 3 - saved.turn }), false, 'the turn must follow from the moves');
  assert.equal(bad({ moves: saved.moves + 2 }), false); assert.equal(bad({ moves: TICTAC_STALE + 1 }), false);
  const old = new TicTacTreatsGame({ saved: { version: 1, board: [1, 2, 1, 0, 2, 0, 0, 0, 0], turn: 1, starter: 1, round: 4, score: 360, wins: 3, draws: 1, level: 'hard', phase: 'turn', cursor: 4, status: 'paused' } });
  assert.equal(old.score, 360); assert.equal(old.wins, 3); assert.equal(old.round, 4); assert.equal(old.level, 'hard'); assert.ok(old.board.every(v => v === 0), 'the round restarts on a fresh board');
});

test('Gabu gets stronger with each level against the same player', () => {
  let seed = 3; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  const swap = b => b.map(v => v ? 3 - v : 0), player = g => chooseTictacCell(swap(g.board), 'normal', rnd, { 1: g.queues[2], 2: g.queues[1] });
  const lossRate = level => { let lost = 0; for (let r = 0; r < 40; r++) { const g = new TicTacTreatsGame({ level, random: rnd }); g.start(); if (r % 2) { g.phase = 'over'; g.nextRound(); }
    while (g.phase === 'turn') { if (g.turn === 1) g.place(player(g)); else { g.thinking = 0; g.update(.01); } } if (g.result === 'loss') lost++; } return lost; };
  const [chill, , hard] = ['chill', 'normal', 'hard'].map(lossRate);
  assert.ok(chill < hard, `Chill took ${chill} of 40 against a steady player, Hard took ${hard}`);
});

test('Tic Tac Treats renderer maps taps to squares and draws every state', () => {
  assert.equal(tictacCellAt(50, 106), 0); assert.equal(tictacCellAt(310, 366), 8); assert.equal(tictacCellAt(20, 106), -1);
  const ctx = new Proxy({ createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }) }, {
    get(target, name) { return name in target ? target[name] : () => {}; }, set(target, name, value) { target[name] = value; return true; },
  });
  const canvas = { width: 720, height: 904, getContext: () => ctx }, g = new TicTacTreatsGame();
  drawTicTacTreats(canvas, g, {}); g.start(); g.place(4); drawTicTacTreats(canvas, g, {}); g.pause(); drawTicTacTreats(canvas, g, {});
});
