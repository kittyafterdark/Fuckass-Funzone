import test from 'node:test';
import assert from 'node:assert/strict';
import { ChessGame, initialPosition, perft, legalMoves, applyMove, outcome, chooseChessMove, inCheck, CHESS_LEVELS } from '../src/chess.js';
import { chessSquareAt, drawChess } from '../src/chess-render.js';

const sq = name => (8 - Number(name[1])) * 8 + name.charCodeAt(0) - 97;
function fen(text) {
  const [rows, turn, castling, ep, halfmove = '0', fullmove = '1'] = text.split(' '), board = [];
  for (const ch of rows.replace(/\//g, '')) if (/\d/.test(ch)) board.push(...Array(Number(ch)).fill('')); else board.push(ch);
  return { board, turn, castling: castling === '-' ? '' : castling, ep: ep === '-' ? -1 : sq(ep), halfmove: Number(halfmove), fullmove: Number(fullmove) };
}
const play = (game, from, to) => game.play(legalMoves(game.pos).find(m => m.from === sq(from) && m.to === sq(to) && (!m.promo || m.promo.toLowerCase() === 'q')));
const game = (events = []) => new ChessGame({ random: () => .5, onEvent: (e, d) => events.push([e, d]) });

test('Catmate move generation matches published perft counts, including castling, en passant and promotion', () => {
  assert.equal(perft(initialPosition(), 3), 8902);
  assert.equal(perft(fen('r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq -'), 2), 2039);
  assert.equal(perft(fen('8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - -'), 3), 2812);
  assert.equal(perft(fen('r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq -'), 2), 264);
});

test('Catmate scholar’s mate is a win with a checkmate bonus; fool’s mate is a loss', () => {
  const events = [], won = game(events); won.start();
  play(won, 'e2', 'e4'); play(won, 'e7', 'e5'); play(won, 'f1', 'c4'); play(won, 'b8', 'c6'); play(won, 'd1', 'h5'); play(won, 'g8', 'f6');
  play(won, 'h5', 'f7');
  assert.equal(won.status, 'dead'); assert.equal(won.result, 'win'); assert.equal(won.reason, 'checkmate');
  assert.ok(won.score > 300, 'mate bonus is added to captured material');
  assert.ok(events.some(([e]) => e === 'win')); assert.ok(events.some(([e]) => e === 'capture'));
  events.length = 0; const lost = game(events); lost.start();
  play(lost, 'f2', 'f3'); play(lost, 'e7', 'e5'); play(lost, 'g2', 'g4'); play(lost, 'd8', 'h4');
  assert.equal(lost.result, 'loss'); assert.ok(events.some(([e]) => e === 'death'));
});

test('Catmate tap flow selects only cream kittens, moves to glowing squares, and auto-queens', () => {
  const g = game(); g.start();
  assert.equal(g.select(sq('e7')), false); assert.equal(g.selected, -1, 'Gabu pieces cannot be selected');
  g.select(sq('e2')); assert.deepEqual(g.targets().map(m => m.to).sort((a, b) => a - b), [sq('e4'), sq('e3')]);
  assert.equal(g.select(sq('e4')), true); assert.equal(g.pos.board[sq('e4')], 'P'); assert.equal(g.pos.turn, 'b');
  const promo = new ChessGame({ random: () => .5 }); promo.pos = fen('7k/P7/8/8/8/8/8/K7 w - -'); promo.start();
  promo.select(sq('a7')); promo.select(sq('a8'));
  assert.equal(promo.pos.board[sq('a8')], 'Q');
});

test('Gabu replies only while playing, takes a mate in one at every level, and pausing freezes the think timer', () => {
  const g = game(); g.start(); play(g, 'e2', 'e4');
  g.pause(); g.update(5); assert.equal(g.pos.turn, 'b', 'paused Gabu cannot move');
  g.start(); for (let i = 0; i < 20 && g.pos.turn === 'b'; i++) g.update(.1);
  assert.equal(g.pos.turn, 'w'); assert.equal(g.pos.board.filter(Boolean).length, 32);
  const backRank = fen('kr6/8/8/8/8/8/5PPP/6K1 b - -');
  assert.equal(inCheck(backRank, 'w'), false, 'the puzzle starts legal');
  for (const level of CHESS_LEVELS) {
    const move = chooseChessMove(backRank, level, () => .5);
    assert.deepEqual([move.from, move.to], [sq('b8'), sq('b1')], `${level} Gabu finds the back-rank mate`);
    assert.equal(outcome(applyMove(backRank, move))?.reason, 'checkmate');
  }
});

test('Catmate undo takes back your move and Gabu’s reply without farming score', () => {
  const g = game(); g.start(); play(g, 'e2', 'e4'); play(g, 'd7', 'd5'); play(g, 'e4', 'd5');
  const scored = g.score; assert.equal(scored, 10);
  play(g, 'd8', 'd5'); assert.equal(g.undo(), true);
  assert.equal(g.pos.board[sq('d5')], 'p', 'Gabu\u2019s reply and your capture both come back');
  assert.equal(g.pos.board[sq('e4')], 'P'); assert.equal(g.pos.turn, 'w'); assert.equal(g.score, 0, 'score is recomputed from the position');
  play(g, 'e4', 'd5'); assert.equal(g.score, scored, 'replaying the capture earns the same score, not double');
  assert.equal(g.undo(), true); assert.equal(g.pos.turn, 'w', 'with Gabu still to move, undo returns only your move');
  assert.equal(g.pos.board[sq('e4')], 'P');
});

test('Catmate saves restore paused, and impossible positions are rejected', () => {
  const g = game(); g.start(); play(g, 'g1', 'f3'); const saved = g.snapshot();
  const back = new ChessGame({ saved }); assert.equal(back.status, 'paused'); assert.deepEqual(back.snapshot(), { ...saved, status: 'paused' });
  assert.equal(back.thinking > 0, true, 'a save made on Gabu’s turn resumes with Gabu thinking');
  const bad = patch => new ChessGame().restore({ ...saved, ...patch });
  assert.equal(bad({ board: saved.board.map(p => p === 'k' ? '' : p) }), false, 'missing king');
  assert.equal(bad({ board: saved.board.map((p, i) => i === 0 ? 'P' : p) }), false, 'pawn on the back rank');
  assert.equal(bad({ castling: 'XQ' }), false); assert.equal(bad({ level: 'impossible' }), false);
  assert.equal(bad({ status: 'dead' }), false, 'dead needs a real ending');
  const sideInCheck = fen('4k3/8/8/8/8/8/4R3/4K3 w - -');
  assert.equal(bad({ ...sideInCheck, status: 'paused' }), false, 'the side that just moved cannot be in check');
});

test('Catmate renderer hit-tests squares and draws every state without throwing', () => {
  assert.equal(chessSquareAt(21, 63), 0); assert.equal(chessSquareAt(339, 381), 63); assert.equal(chessSquareAt(10, 63), -1);
  const calls = [];
  const ctx = new Proxy({ createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }) }, {
    get(target, name) { return name in target ? target[name] : (...args) => { if (name === 'fillText') calls.push(args[0]); }; },
    set(target, name, value) { target[name] = value; return true; },
  });
  const canvas = { width: 720, height: 904, getContext: () => ctx };
  for (const status of ['idle', 'playing', 'paused']) { const g = game(); if (status !== 'idle') g.start(); if (status === 'paused') g.pause(); drawChess(canvas, g, {}); }
  const done = game(); done.start(); play(done, 'f2', 'f3'); play(done, 'e7', 'e5'); play(done, 'g2', 'g4'); play(done, 'd8', 'h4'); drawChess(canvas, done, {});
  assert.ok(calls.includes('GABU WINS')); assert.ok(calls.includes('YOU PLAY THE CREAM KITTENS'));
});
