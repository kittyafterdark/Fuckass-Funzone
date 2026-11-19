/** Tic Tac Treats: your pocky crosses against Gabu's donuts, played as a win streak.
 * Pure rules and search: no DOM or Spindle APIs. Cells 0..8 run row-major from the top-left.
 */
export const TICTAC_LEVELS = Object.freeze(['chill', 'normal', 'hard']);
export const TICTAC_LINES = Object.freeze([[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]]);
// How often each level ignores the perfect move. Hard never does, so beating it is impossible by design.
const SLIP = Object.freeze({ chill: .45, normal: .18, hard: 0 });
const LEVEL_BONUS = Object.freeze({ chill: 40, normal: 80, hard: 0 });
const level = value => TICTAC_LEVELS.includes(value) ? value : 'normal';
const unit = random => Math.max(0, Math.min(.999999999, Number(random()) || 0));
const whole = (value, max) => Number.isSafeInteger(value) && value >= 0 && value <= max;

export function tictacLine(board) {
  for (const line of TICTAC_LINES) if (board[line[0]] && line.every(i => board[i] === board[line[0]])) return line;
  return null;
}
/** Empty cells that would complete a line for `who` right now. */
export function tictacThreats(board, who) {
  return board.flatMap((v, i) => {
    if (v) return [];
    const next = [...board]; next[i] = who; return tictacLine(next) ? [i] : [];
  });
}
function minimax(board, who, depth) {
  const line = tictacLine(board);
  if (line) return board[line[0]] === 2 ? 10 - depth : depth - 10;
  if (board.every(Boolean)) return 0;
  let best = who === 2 ? -Infinity : Infinity;
  for (let i = 0; i < 9; i++) {
    if (board[i]) continue; board[i] = who;
    const value = minimax(board, 3 - who, depth + 1); board[i] = 0;
    best = who === 2 ? Math.max(best, value) : Math.min(best, value);
  }
  return best;
}
/** Gabu's cell. Every level takes a win in front of it; lower levels sometimes miss a block. */
export function chooseTictacCell(board, levelName = 'normal', random = Math.random) {
  const open = board.flatMap((v, i) => v ? [] : [i]); if (!open.length) return -1;
  const wins = tictacThreats(board, 2); if (wins.length) return wins[0];
  if (unit(random) < SLIP[level(levelName)]) return open[Math.floor(unit(random) * open.length)];
  let best = [], bestValue = -Infinity;
  for (const i of open) {
    const next = [...board]; next[i] = 2; const value = minimax(next, 1, 1);
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
    this.board = Array(9).fill(0); this.starter = starter; this.turn = starter; this.phase = 'turn'; this.line = null; this.result = null;
    this.thinking = starter === 2 ? .6 : 0; this.placed = Array(9).fill(0); this.glow = 0;
  }
  start() {
    if (this.status === 'playing') return;
    if (this.status === 'dead') this.reset();
    const resumed = this.status === 'paused'; this.status = 'playing'; this.onEvent(resumed ? 'resume' : 'start');
  }
  pause() { if (this.status === 'playing') { this.status = 'paused'; this.onEvent('pause'); } }
  togglePause() { if (this.status === 'playing') this.pause(); else if (this.status === 'paused') this.start(); }
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
    const blocked = tictacThreats(this.board, 3 - who).includes(cell);
    this.board[cell] = who; this.placed[cell] = .001;
    this.onEvent(who === 1 ? 'place' : 'gabu_place', { cell });
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
    if (this.board.every(Boolean)) {
      this.phase = 'over'; this.result = 'draw'; this.draws++; this.score = Math.min(999999999, this.score + 25);
      this.onEvent('score', { score: this.score, earned: 25 }); this.onEvent('draw', { score: this.score }); return;
    }
    if (blocked) this.onEvent(who === 1 ? 'block' : 'gabu_block', { cell });
    if (who === 1 && tictacThreats(this.board, 1).length >= 2) this.onEvent('fork', { cell });
    this.turn = 3 - who;
    if (this.turn === 2) this.thinking = .4 + unit(this.random) * .35;
  }
  update(delta) {
    if (!Number.isFinite(delta) || delta <= 0) return;
    const dt = Math.min(delta, .12);
    this.placed = this.placed.map(t => t > 0 ? Math.min(1, t + dt * 5) : 0);
    if (this.status !== 'playing') return;
    this.glow += dt;
    if (this.phase !== 'turn' || this.turn !== 2) return;
    this.thinking -= dt; if (this.thinking > 0) return;
    const cell = chooseTictacCell(this.board, this.level, this.random);
    if (cell >= 0) this.mark(cell, 2);
  }
  snapshot() {
    return { version: 1, board: [...this.board], turn: this.turn, starter: this.starter, round: this.round, score: this.score, wins: this.wins, draws: this.draws,
      level: this.level, phase: this.phase, cursor: this.cursor, status: this.status === 'playing' ? 'paused' : this.status };
  }
  restore(data) {
    if (!data || data.version !== 1 || !Array.isArray(data.board) || data.board.length !== 9 || data.board.some(v => ![0, 1, 2].includes(v)) ||
      ![1, 2].includes(data.turn) || ![1, 2].includes(data.starter) || !whole(data.round, 100000) || data.round < 1 || !whole(data.score, 999999999) ||
      !whole(data.wins, 100000) || !whole(data.draws, 100000) || !TICTAC_LEVELS.includes(data.level) || !['turn', 'over'].includes(data.phase) ||
      !whole(data.cursor, 8) || !['idle', 'paused', 'playing', 'dead'].includes(data.status)) return false;
    const mine = data.board.filter(v => v === 1).length, gabu = data.board.filter(v => v === 2).length;
    const firstCount = data.starter === 1 ? mine : gabu, secondCount = data.starter === 1 ? gabu : mine;
    if (firstCount - secondCount < 0 || firstCount - secondCount > 1) return false;
    const line = tictacLine(data.board), winner = line ? data.board[line[0]] : 0, over = !!line || data.board.every(Boolean);
    if (data.phase === 'over' !== over || data.status === 'dead' !== (winner === 2)) return false;
    if (!over && data.turn !== (firstCount === secondCount ? data.starter : 3 - data.starter)) return false;
    this.board = [...data.board]; this.turn = data.turn; this.starter = data.starter; this.round = data.round; this.score = data.score;
    this.wins = data.wins; this.draws = data.draws; this.level = data.level; this.phase = data.phase; this.cursor = data.cursor;
    this.line = line; this.result = winner === 1 ? 'win' : winner === 2 ? 'loss' : over ? 'draw' : null; this.glow = 0;
    this.placed = this.board.map(v => v ? 1 : 0); this.thinking = this.turn === 2 ? .5 : 0;
    this.status = data.status === 'playing' ? 'paused' : data.status; return true;
  }
}
