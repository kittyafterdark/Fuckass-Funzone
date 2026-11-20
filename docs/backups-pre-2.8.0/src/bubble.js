/** Bubble Bloom: aim, bounce and pop clusters of three before the bubbles reach the cushion line.
 * Pure rules: no DOM or Spindle APIs. Rows are offset hex rows; `parity` flips when a row is pushed in.
 */
export const BUBBLE_KINDS = Object.freeze(['heart', 'star', 'fish', 'drop', 'moon', 'flower']);
// One export per line: the bundler lifts each exported name into the shared scope.
export const BUBBLE_R = 16;
export const BUBBLE_COLS = 10;
export const BUBBLE_ROWS = 12;
export const BUBBLE_DEATH_ROW = 11;
export const BUBBLE_LEFT = 20;
export const BUBBLE_TOP = 72;
export const BUBBLE_RH = BUBBLE_R * Math.sqrt(3);
export const LAUNCH_X = 180;
export const LAUNCH_Y = 414;
export const BUBBLE_PACES = Object.freeze(['chill', 'normal', 'chaos']);
const SPEED = 660, MIN_AIM = .2, MAX_AIM = Math.PI - .2;
// Pace changes real board colors and how many misses the ceiling forgives.
const PACE = Object.freeze({ chill: { kinds: -1, shots: 2 }, normal: { kinds: 0, shots: 0 }, chaos: { kinds: 1, shots: -1 } });
const pace = value => BUBBLE_PACES.includes(value) ? value : 'normal';
const unit = random => Math.max(0, Math.min(.999999999, Number(random()) || 0));
const whole = (value, max) => Number.isSafeInteger(value) && value >= 0 && value <= max;

export class BubbleGame {
  constructor({ random = Math.random, onEvent = () => {}, saved, pace: chosen = 'normal' } = {}) {
    this.random = random; this.onEvent = onEvent; this.pace = pace(chosen); this.reset(); if (saved) this.restore(saved);
  }
  reset(chosen = this.pace) {
    this.pace = pace(chosen); this.status = 'idle'; this.score = 0; this.level = 1; this.aim = Math.PI / 2; this.endReason = null;
    this.effects = []; this.shot = null; this.onEvent('reset'); this.deal();
  }
  /** A fresh board: more rows and more colors as levels climb, capped so it stays readable. */
  deal() {
    this.grid = Array.from({ length: BUBBLE_ROWS }, () => Array(BUBBLE_COLS).fill(-1)); this.parity = 0; this.misses = 0; this.shot = null;
    const kinds = this.kindCount(), rows = Math.min(7, 4 + Math.floor((this.level - 1) / 2));
    for (let r = 0; r < rows; r++) for (let c = 0; c < this.colsIn(r); c++) this.grid[r][c] = Math.floor(unit(this.random) * kinds);
    this.current = this.pickKind(); this.next = this.pickKind();
  }
  kindCount() { return Math.max(3, Math.min(BUBBLE_KINDS.length, 3 + this.level + PACE[this.pace].kinds)); }
  shotsPerRow() { return (this.level >= 3 ? 4 : 5) + PACE[this.pace].shots; }
  indented(r) { return (r + this.parity) % 2 === 1; }
  colsIn(r) { return this.indented(r) ? BUBBLE_COLS - 1 : BUBBLE_COLS; }
  center(r, c) { return { x: BUBBLE_LEFT + BUBBLE_R + c * BUBBLE_R * 2 + (this.indented(r) ? BUBBLE_R : 0), y: BUBBLE_TOP + BUBBLE_R + r * BUBBLE_RH }; }
  neighbors(r, c) {
    const shift = this.indented(r) ? 0 : -1, out = [[r, c - 1], [r, c + 1], [r - 1, c + shift], [r - 1, c + shift + 1], [r + 1, c + shift], [r + 1, c + shift + 1]];
    return out.filter(([nr, nc]) => nr >= 0 && nr < BUBBLE_ROWS && nc >= 0 && nc < this.colsIn(nr));
  }
  /** The loader only offers colors still on the board, so the last few bubbles stay winnable. */
  pickKind() {
    const present = [...new Set(this.grid.flat().filter(k => k >= 0))];
    const pool = present.length ? present : Array.from({ length: this.kindCount() }, (_, i) => i);
    return pool[Math.floor(unit(this.random) * pool.length)];
  }
  start() {
    if (this.status === 'playing') return;
    if (this.status === 'dead') this.reset();
    const resumed = this.status === 'paused'; this.status = 'playing'; this.onEvent(resumed ? 'resume' : 'start');
  }
  pause() { if (this.status === 'playing') { this.status = 'paused'; this.onEvent('pause'); } }
  togglePause() { if (this.status === 'playing') this.pause(); else if (this.status === 'paused') this.start(); }
  setAim(x, y) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    const angle = Math.atan2(LAUNCH_Y - Math.min(y, LAUNCH_Y - 8), x - LAUNCH_X);
    this.aim = Math.max(MIN_AIM, Math.min(MAX_AIM, angle));
  }
  nudgeAim(step) { if (Number.isFinite(step)) this.aim = Math.max(MIN_AIM, Math.min(MAX_AIM, this.aim + step)); }
  swap() {
    if (this.status !== 'playing' || this.shot) return false;
    [this.current, this.next] = [this.next, this.current]; this.onEvent('swap'); return true;
  }
  fire() {
    if (this.status === 'idle') { this.start(); return false; }
    if (this.status !== 'playing' || this.shot) return false;
    this.shot = { x: LAUNCH_X, y: LAUNCH_Y, vx: Math.cos(this.aim) * SPEED, vy: -Math.sin(this.aim) * SPEED, kind: this.current };
    this.current = this.next; this.next = this.pickKind(); this.onEvent('shoot'); return true;
  }
  /** Nearest empty cell that is attached to the ceiling or to another bubble. */
  snapCell(x, y) {
    let best = null, bestDistance = Infinity;
    for (let r = 0; r < BUBBLE_ROWS; r++) for (let c = 0; c < this.colsIn(r); c++) {
      if (this.grid[r][c] >= 0) continue;
      if (r > 0 && !this.neighbors(r, c).some(([nr, nc]) => this.grid[nr][nc] >= 0)) continue;
      const p = this.center(r, c), distance = (p.x - x) ** 2 + (p.y - y) ** 2;
      if (distance < bestDistance) { bestDistance = distance; best = [r, c]; }
    }
    return best;
  }
  cluster(r, c, same = true) {
    const kind = this.grid[r][c], seen = new Set([r * BUBBLE_COLS + c]), stack = [[r, c]], out = [];
    while (stack.length) {
      const [cr, cc] = stack.pop(); out.push([cr, cc]);
      for (const [nr, nc] of this.neighbors(cr, cc)) {
        const key = nr * BUBBLE_COLS + nc;
        if (seen.has(key) || this.grid[nr][nc] < 0 || same && this.grid[nr][nc] !== kind) continue;
        seen.add(key); stack.push([nr, nc]);
      }
    }
    return out;
  }
  settle(kind) {
    const cell = this.snapCell(this.shot.x, this.shot.y); this.shot = null;
    if (!cell) { this.finish(); return; }
    const [r, c] = cell; this.grid[r][c] = kind;
    const group = this.cluster(r, c);
    if (group.length >= 3) {
      for (const [gr, gc] of group) { const p = this.center(gr, gc); this.effects.push({ type: 'pop', x: p.x, y: p.y, kind: this.grid[gr][gc], age: 0 }); this.grid[gr][gc] = -1; }
      const anchored = new Set();
      for (let gc = 0; gc < this.colsIn(0); gc++) if (this.grid[0][gc] >= 0) for (const [ar, ac] of this.cluster(0, gc, false)) anchored.add(ar * BUBBLE_COLS + ac);
      let dropped = 0;
      for (let fr = 0; fr < BUBBLE_ROWS; fr++) for (let fc = 0; fc < BUBBLE_COLS; fc++) {
        if (this.grid[fr][fc] < 0 || anchored.has(fr * BUBBLE_COLS + fc)) continue;
        const p = this.center(fr, fc); this.effects.push({ type: 'fall', x: p.x, y: p.y, vy: -40 - unit(this.random) * 80, kind: this.grid[fr][fc], age: 0 });
        this.grid[fr][fc] = -1; dropped++;
      }
      const earned = group.length * 10 + dropped * 20 * (1 + Math.floor(dropped / 4));
      this.score = Math.min(999999999, this.score + earned); this.onEvent('score', { score: this.score, earned });
      this.onEvent(dropped >= 4 ? 'avalanche' : group.length >= 6 ? 'big_pop' : 'pop', { popped: group.length, dropped });
      if (this.grid.every(row => row.every(k => k < 0))) {
        const bonus = 250 * this.level; this.score = Math.min(999999999, this.score + bonus); this.level++;
        this.onEvent('score', { score: this.score, earned: bonus }); this.onEvent('clear', { level: this.level }); this.deal(); return;
      }
      if (![this.current, this.next].every(k => this.grid.flat().includes(k))) { this.current = this.pickKind(); this.next = this.pickKind(); }
    } else {
      this.misses++;
      this.onEvent('miss', { misses: this.misses, left: this.shotsPerRow() - this.misses });
      if (this.misses >= this.shotsPerRow()) this.pushRow();
    }
    if (this.grid[BUBBLE_DEATH_ROW].some(k => k >= 0)) this.finish();
  }
  /** Too many misses: every row slides down one and a new row arrives at the top. */
  pushRow() {
    this.misses = 0; this.parity ^= 1;
    this.grid.pop(); this.grid.unshift(Array(BUBBLE_COLS).fill(-1));
    const present = [...new Set(this.grid.flat().filter(k => k >= 0))], pool = present.length ? present : [0, 1, 2];
    // Shifting down one row and flipping parity together keep every old row's indent unchanged.
    for (let c = 0; c < this.colsIn(0); c++) this.grid[0][c] = pool[Math.floor(unit(this.random) * pool.length)];
    this.onEvent('ceiling');
  }
  finish() {
    if (this.status === 'dead') return;
    this.status = 'dead'; this.endReason = 'line'; this.shot = null; this.onEvent('death', { score: this.score, level: this.level });
  }
  update(delta) {
    if (!Number.isFinite(delta) || delta <= 0) return;
    const dt = Math.min(delta, .12);
    for (const e of this.effects) { e.age += dt; if (e.type === 'fall') { e.vy += 900 * dt; e.y += e.vy * dt; } }
    this.effects = this.effects.filter(e => e.age < (e.type === 'pop' ? .35 : 1.4));
    if (this.status !== 'playing' || !this.shot) return;
    const s = this.shot, steps = Math.ceil(SPEED * dt / 4);
    for (let i = 0; i < steps && this.shot; i++) {
      s.x += s.vx * dt / steps; s.y += s.vy * dt / steps;
      if (s.x < BUBBLE_LEFT + BUBBLE_R) { s.x = 2 * (BUBBLE_LEFT + BUBBLE_R) - s.x; s.vx = Math.abs(s.vx); this.onEvent('bounce'); }
      if (s.x > BUBBLE_LEFT + BUBBLE_COLS * BUBBLE_R * 2 - BUBBLE_R) { s.x = 2 * (BUBBLE_LEFT + BUBBLE_COLS * BUBBLE_R * 2 - BUBBLE_R) - s.x; s.vx = -Math.abs(s.vx); this.onEvent('bounce'); }
      let touching = s.y <= BUBBLE_TOP + BUBBLE_R;
      for (let r = 0; r < BUBBLE_ROWS && !touching; r++) for (let c = 0; c < this.colsIn(r) && !touching; c++) {
        if (this.grid[r][c] < 0) continue;
        const p = this.center(r, c); touching = (p.x - s.x) ** 2 + (p.y - s.y) ** 2 < (BUBBLE_R * 1.7) ** 2;
      }
      if (touching) this.settle(s.kind);
    }
  }
  /** Lowest occupied row, for the danger glow. */
  lowestRow() { for (let r = BUBBLE_ROWS - 1; r >= 0; r--) if (this.grid[r].some(k => k >= 0)) return r; return -1; }
  snapshot() {
    return { version: 1, grid: this.grid.map(row => [...row]), parity: this.parity, level: this.level, score: this.score, misses: this.misses,
      current: this.shot ? this.shot.kind : this.current, next: this.shot ? this.current : this.next, aim: Math.round(this.aim * 1000) / 1000,
      endReason: this.endReason, pace: this.pace, status: this.status === 'playing' ? 'paused' : this.status };
  }
  restore(data) {
    if (!data || data.version !== 1 || !Array.isArray(data.grid) || data.grid.length !== BUBBLE_ROWS || ![0, 1].includes(data.parity) ||
      data.grid.some(row => !Array.isArray(row) || row.length !== BUBBLE_COLS || row.some(k => !Number.isInteger(k) || k < -1 || k >= BUBBLE_KINDS.length)) ||
      !whole(data.level, 100000) || data.level < 1 || !whole(data.score, 999999999) || !whole(data.misses, 7) ||
      !whole(data.current, BUBBLE_KINDS.length - 1) || !whole(data.next, BUBBLE_KINDS.length - 1) || !Number.isFinite(data.aim) ||
      !['idle', 'paused', 'playing', 'dead'].includes(data.status)) return false;
    const savedPace = data.pace === undefined ? 'normal' : data.pace;
    if (!BUBBLE_PACES.includes(savedPace)) return false;
    this.parity = data.parity; this.pace = savedPace;
    if (data.grid.some((row, r) => this.indented(r) && row[BUBBLE_COLS - 1] !== -1)) return false;
    const dead = data.grid[BUBBLE_DEATH_ROW].some(k => k >= 0);
    if (dead !== (data.status === 'dead')) return false;
    this.grid = data.grid.map(row => [...row]); this.level = data.level; this.score = data.score; this.misses = Math.min(data.misses, this.shotsPerRow() - 1);
    this.current = data.current; this.next = data.next; this.aim = Math.max(MIN_AIM, Math.min(MAX_AIM, data.aim));
    this.endReason = dead ? 'line' : null; this.shot = null; this.effects = [];
    this.status = data.status === 'playing' ? 'paused' : data.status; return true;
  }
}
