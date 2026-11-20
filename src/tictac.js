/** Tic Tac Treats: your pocky crosses against Gabu's donuts, played as a win streak. Each side keeps only its three newest
 * treats on the board: placing a fourth eats your oldest, so the board keeps shifting and nobody can sit on a draw.
 * Pure rules and search: no DOM or Spindle APIs. Cells 0..8 run row-major from the top-left.
 */
export const TICTAC_LEVELS = Object.freeze(['chill', 'normal', 'hard']);
export const TICTAC_LINES = Object.freeze([[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]]);
// One export per line: the bundler lifts each exported name into the shared scope.
export const TICTAC_KEEP = 3;
// A round with this many treats placed and no line is a draw: the treats went stale.
export const TICTAC_STALE = 30;
// How often each level ignores its best move, and how far ahead it looks.
const SLIP = Object.freeze({ chill: .4, normal: .12, hard: 0 });
const DEPTH = Object.freeze({ chill: 2, normal: 4, hard: 7 });
const LEVEL_BONUS = Object.freeze({ chill: 40, normal: 80, hard: 160 });
const level = value => TICTAC_LEVELS.includes(value) ? value : 'normal';
const unit = random => Math.max(0, Math.min(.999999999, Number(random()) || 0));
const whole = (value, max) => Number.isSafeInteger(value) && value >= 0 && value <= max;
const fresh = () => ({ 1: [], 2: [] });

export function tictacLine(board) {
  for (const line of TICTAC_LINES) if (board[line[0]] && line.every(i => board[i] === board[line[0]])) return line;
  return null;
}
/** The board after `who` places on `cell`: with three treats already down, their oldest is eaten first. */
export function tictacAfter(board, queues, cell, who) {
  const next = [...board], order = { 1: [...queues[1]], 2: [...queues[2]] };
  if (order[who].length >= TICTAC_KEEP) next[order[who].shift()] = 0;
  next[cell] = who; order[who].push(cell);
  return { board: next, queues: order };
}
/** Empty cells that would complete a line for `who` right now, counting the treat that placing there would eat. */
export function tictacThreats(board, who, queues = fresh()) {
  return board.flatMap((v, i) => v ? [] : tictacLine(tictacAfter(board, queues, i, who).board) ? [i] : []);
}
// A rough read of a position for Gabu: open lines with two of his treats are worth more than lines with one.
function lean(board) {
  let value = 0;
  for (const line of TICTAC_LINES) {
    const gabu = line.filter(i => board[i] === 2).length, you = line.filter(i => board[i] === 1).length;
    if (gabu && !you) value += gabu === 2 ? 3 : 1; else if (you && !gabu) value -= you === 2 ? 3 : 1;
  }
  return value;
}
function search(board, queues, who, depth, ply, alpha, beta) {
  if (!depth) return who === 2 ? lean(board) : -lean(board);
  let best = -Infinity;
  for (let i = 0; i < 9; i++) {
    if (board[i]) continue;
    const next = tictacAfter(board, queues, i, who);
    const value = tictacLine(next.board) ? 100 - ply : -search(next.board, next.queues, 3 - who, depth - 1, ply + 1, -beta, -alpha);
    if (value > best) best = value;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }
  return best;
}
/** Gabu's cell. Every level takes a win in front of it; lower levels look less far ahead and sometimes slip. */
export function chooseTictacCell(board, levelName = 'normal', random = Math.random, queues = fresh()) {
  const open = board.flatMap((v, i) => v ? [] : [i]); if (!open.length) return -1;
  const wins = tictacThreats(board, 2, queues); if (wins.length) return wins[0];
  const name = level(levelName);
  if (unit(random) < SLIP[name]) return open[Math.floor(unit(random) * open.length)];
  let best = [], bestValue = -Infinity;
  for (const i of open) {
    const next = tictacAfter(board, queues, i, 2);
    const value = -search(next.board, next.queues, 1, DEPTH[name] - 1, 1, -Infinity, Infinity);
    if (value > bestValue) { bestValue = value; best = [i]; } else if (value === bestValue) best.push(i);
  }
  return best[Math.floor(unit(random) * best.length)];
}

export class TicTacTreatsGame {
  constructor({ random = Math.random, onEvent = () => {}, saved, level: chosen = 'normal' } = {}) {
    this.random = random; this.onEvent = onEvent; this.level = level(chosen); this.reset(); if (saved) this.restore(saved);
  }
  reset(chosen = this.level) {
    this.level = level(chosen); this.status = 'idle'; this.score = 0; this.wins = 0; this.draws = 0; this.round = 1; this.cursor = 4;
    this.onEvent('reset'); this.clearBoard(1);
  }
  clearBoard(starter) {
    this.board = Array(9).fill(0); this.queues = fresh(); this.moves = 0; this.starter = starter; this.turn = starter; this.phase = 'turn';
    this.line = null; this.result = null; this.thinking = starter === 2 ? .6 : 0; this.placed = Array(9).fill(0); this.eaten = []; this.glow = 0;
  }
  start() {
    if (this.status === 'playing') return;
    if (this.status === 'dead') this.reset();
    const resumed = this.status === 'paused'; this.status = 'playing'; this.onEvent(resumed ? 'resume' : 'start');
  }
  pause() { if (this.status === 'playing') { this.status = 'paused'; this.onEvent('pause'); } }
  togglePause() { if (this.status === 'playing') this.pause(); else if (this.status === 'paused') this.start(); }
  /** The treat `who` loses on their next placement, or -1 while they have fewer than three down. */
  fading(who) { return this.queues[who].length >= TICTAC_KEEP ? this.queues[who][0] : -1; }
  nextRound() {
    if (this.status !== 'playing' || this.phase !== 'over') return false;
    this.round++; this.clearBoard(this.round % 2 ? 1 : 2); this.onEvent('round', { round: this.round, starter: this.starter }); return true;
  }
  moveCursor(dx, dy) {
    const col = Math.max(0, Math.min(2, this.cursor % 3 + dx)), row = Math.max(0, Math.min(2, Math.floor(this.cursor / 3) + dy));
    this.cursor = row * 3 + col;
  }
  place(cell = this.cursor) {
    if (this.status !== 'playing') return false;
    if (this.phase === 'over') return this.nextRound();
    if (this.turn !== 1 || !Number.isInteger(cell) || cell < 0 || cell > 8 || this.board[cell]) return false;
    this.cursor = cell; this.mark(cell, 1); return true;
  }
  mark(cell, who) {
    const blocked = tictacThreats(this.board, 3 - who, this.queues).includes(cell), gone = this.fading(who);
    const next = tictacAfter(this.board, this.queues, cell, who);
    this.board = next.board; this.queues = next.queues; this.moves++; this.placed[cell] = .001;
    if (gone >= 0) { this.placed[gone] = 0; this.eaten.push({ cell: gone, who, age: 0 }); }
    this.onEvent(who === 1 ? 'place' : 'gabu_place', { cell, eaten: gone });
    const line = tictacLine(this.board);
    if (line) {
      this.line = line; this.phase = 'over'; this.glow = 0;
      if (who === 1) {
        this.wins++; this.result = 'win';
        const earned = 100 + LEVEL_BONUS[this.level];
        this.score = Math.min(999999999, this.score + earned);
        this.onEvent('score', { score: this.score, earned }); this.onEvent('win', { score: this.score, wins: this.wins });
      } else { this.result = 'loss'; this.status = 'dead'; this.onEvent('death', { score: this.score, wins: this.wins }); }
      return;
    }
    if (this.moves >= TICTAC_STALE) {
      this.phase = 'over'; this.result = 'draw'; this.draws++; this.score = Math.min(999999999, this.score + 25);
      this.onEvent('score', { score: this.score, earned: 25 }); this.onEvent('draw', { score: this.score }); return;
    }
    if (blocked) this.onEvent(who === 1 ? 'block' : 'gabu_block', { cell });
    this.turn = 3 - who;
    if (this.turn === 2) this.thinking = .4 + unit(this.random) * .35;
  }
  update(delta) {
    if (!Number.isFinite(delta) || delta <= 0) return;
    const dt = Math.min(delta, .12);
    this.placed = this.placed.map(t => t > 0 ? Math.min(1, t + dt * 5) : 0);
    for (const e of this.eaten) e.age += dt;
    this.eaten = this.eaten.filter(e => e.age < .35);
    if (this.status !== 'playing') return;
    this.glow += dt;
    if (this.phase !== 'turn' || this.turn !== 2) return;
    this.thinking -= dt; if (this.thinking > 0) return;
    const cell = chooseTictacCell(this.board, this.level, this.random, this.queues);
    if (cell >= 0) this.mark(cell, 2);
  }
  snapshot() {
    return { version: 2, board: [...this.board], queues: { 1: [...this.queues[1]], 2: [...this.queues[2]] }, moves: this.moves, turn: this.turn,
      starter: this.starter, round: this.round, score: this.score, wins: this.wins, draws: this.draws, level: this.level, phase: this.phase,
      cursor: this.cursor, status: this.status === 'playing' ? 'paused' : this.status };
  }
  restore(data) {
    if (!data || ![1, 2].includes(data.version) || ![1, 2].includes(data.starter) || !whole(data.round, 100000) || data.round < 1 ||
      !whole(data.score, 999999999) || !whole(data.wins, 100000) || !whole(data.draws, 100000) || !TICTAC_LEVELS.includes(data.level) ||
      !whole(data.cursor, 8) || !['idle', 'paused', 'playing', 'dead'].includes(data.status)) return false;
    const keep = () => { this.round = data.round; this.score = data.score; this.wins = data.wins; this.draws = data.draws; this.level = data.level; this.cursor = data.cursor; };
    if (data.version === 1) {
      // Saves from before treats could be eaten keep their streak and start the round on a fresh board.
      keep(); this.clearBoard(data.starter);
      if (data.status === 'dead') { this.phase = 'over'; this.result = 'loss'; }
      this.status = data.status === 'playing' ? 'paused' : data.status; return true;
    }
    const q = data.queues;
    if (!Array.isArray(data.board) || data.board.length !== 9 || data.board.some(v => ![0, 1, 2].includes(v)) || !q || !Array.isArray(q[1]) || !Array.isArray(q[2]) ||
      !whole(data.moves, TICTAC_STALE) || ![1, 2].includes(data.turn) || !['turn', 'over'].includes(data.phase)) return false;
    // Each side's queue lists exactly its treats on the board, at most three, and matches how many it has placed.
    const placedBy = who => who === data.starter ? Math.ceil(data.moves / 2) : Math.floor(data.moves / 2);
    for (const who of [1, 2]) {
      const order = q[who];
      if (order.length !== Math.min(TICTAC_KEEP, placedBy(who)) || new Set(order).size !== order.length || order.some(c => !whole(c, 8))) return false;
      if (data.board.some((v, i) => (v === who) !== order.includes(i))) return false;
    }
    const line = tictacLine(data.board), winner = line ? data.board[line[0]] : 0, over = !!line || data.moves >= TICTAC_STALE;
    if (data.phase === 'over' !== over || data.status === 'dead' !== (winner === 2)) return false;
    if (!over && data.turn !== (data.moves % 2 ? 3 - data.starter : data.starter)) return false;
    keep(); this.clearBoard(data.starter);
    this.board = [...data.board]; this.queues = { 1: [...q[1]], 2: [...q[2]] }; this.moves = data.moves; this.turn = data.turn; this.phase = data.phase;
    this.line = line; this.result = winner === 1 ? 'win' : winner === 2 ? 'loss' : over ? 'draw' : null;
    this.placed = this.board.map(v => v ? 1 : 0); this.thinking = this.turn === 2 ? .5 : 0;
    this.status = data.status === 'playing' ? 'paused' : data.status; return true;
  }
}
