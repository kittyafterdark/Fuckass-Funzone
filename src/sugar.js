/** Sugar Snap: Gabu presses a shape into a disc of honeycomb toffee, and you carve it out with a needle before the timer runs out.
 * Carve too fast or scratch off the line and the toffee strains; at full strain it snaps through the shape.
 * Pure rules: no DOM or Spindle APIs. Positions are in the 360 x 452 canvas space the renderer draws in.
 */
// One export per line: the bundler lifts each exported name into the shared scope.
export const SUGAR_CX = 180;
export const SUGAR_CY = 248;
export const SUGAR_R = 128;
export const SUGAR_PACES = Object.freeze(['chill', 'normal', 'hard']);
// The outline is cut into samples this far apart; carving marks samples, and a shape is free when every sample is carved.
const STEP = 3, SCALE = 84, HEARTS = 3, KEY_STEP = 4, COOL = .05, SMOOTH = .25, CRACKS = Object.freeze([.4, .7]);
// Pace sets how close to the line the needle must stay, how fast it can safely carve, how much a slip strains the toffee, and the time.
const PACE = Object.freeze({
  chill: { tol: 9, safe: 150, rush: .3, slip: .0015, time: 2.8, extra: 10 },
  normal: { tol: 6.5, safe: 115, rush: .45, slip: .0025, time: 2, extra: 6 },
  hard: { tol: 4.5, safe: 85, rush: .65, slip: .004, time: 1.45, extra: 3 },
});
const pace = value => SUGAR_PACES.includes(value) ? value : 'normal';
const unit = random => Math.max(0, Math.min(.999999999, Number(random()) || 0));
const whole = (value, max) => Number.isSafeInteger(value) && value >= 0 && value <= max;
const finite = (value, min, max) => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
const arc = (cx, cy, r, from, to, n) => Array.from({ length: n + 1 }, (_, i) => { const a = from + (to - from) * i / n; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; });
// Where two circles cross, ordered so the first point is the upper one.
function crossings(x1, y1, r1, x2, y2, r2) {
  const d = Math.hypot(x2 - x1, y2 - y1), a = (r1 * r1 - r2 * r2 + d * d) / (2 * d), h = Math.sqrt(r1 * r1 - a * a);
  const mx = x1 + a * (x2 - x1) / d, my = y1 + a * (y2 - y1) / d, ox = h * (y2 - y1) / d, oy = h * (x2 - x1) / d;
  return [[mx + ox, my - oy], [mx - ox, my + oy]].sort((p, q) => p[1] - q[1]);
}
/** Original outlines in a unit box (y points down), from the gentlest to the trickiest. Corners and thin tips are where they get hard. */
const OUTLINES = Object.freeze({
  heart: () => Array.from({ length: 160 }, (_, i) => {
    const t = i / 160 * Math.PI * 2;
    return [16 * Math.sin(t) ** 3 / 18, -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 18 + .05];
  }),
  fish: () => [...arc(-.2, 0, 1, .45, Math.PI * 2 - .45, 80).map(([x, y]) => [-.2 + (x + .2) * .6, y * .42]), [.75, -.42], [.6, 0], [.75, .42]],
  mushroom: () => [...arc(0, -.05, 1, Math.PI, Math.PI * 2, 60).map(([x, y]) => [x * .8, -.05 + (y + .05) * .66]), [.24, -.05], [.3, .72], [-.3, .72], [-.24, -.05]],
  star: () => Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? .4 : .88;
    return [Math.cos(a) * r, Math.sin(a) * r + .06];
  }),
  cat: () => {
    const head = (a, b, n) => arc(0, .1, .62, a, b, n);
    return [[-.58, -.8], ...head(-1.85, -1.29, 10), [.58, -.8], ...head(-.69, Math.PI * 2 - 2.45, 90)];
  },
  moon: () => {
    const [top, bottom] = crossings(0, 0, .82, .36, -.12, .7);
    const outerFrom = Math.atan2(top[1], top[0]), outerTo = Math.atan2(bottom[1], bottom[0]);
    const innerFrom = Math.atan2(bottom[1] + .12, bottom[0] - .36), innerTo = Math.atan2(top[1] + .12, top[0] - .36);
    // The outer edge runs the long way around the left; the inner edge comes back up through the inner circle's left side.
    return [...arc(0, 0, .82, outerFrom, outerTo > outerFrom ? outerTo - Math.PI * 2 : outerTo, 90).slice(0, -1),
      ...arc(.36, -.12, .7, innerFrom, innerTo < innerFrom ? innerTo + Math.PI * 2 : innerTo, 70).slice(0, -1)];
  },
  bot: () => {
    const r = .18, x0 = -.62, x1 = .62, y0 = -.36, y1 = .6, side = Math.asin(.06 / .14);
    return [[-.06, y0], [-.06, -.66], ...arc(0, -.78, .14, Math.PI / 2 + side, Math.PI * 2.5 - side, 30).slice(1, -1), [.06, -.66], [.06, y0],
      ...arc(x1 - r, y0 + r, r, -Math.PI / 2, 0, 8), ...arc(x1 - r, y1 - r, r, 0, Math.PI / 2, 8),
      ...arc(x0 + r, y1 - r, r, Math.PI / 2, Math.PI, 8), ...arc(x0 + r, y0 + r, r, Math.PI, Math.PI * 1.5, 8)];
  },
  bolt: () => [[-.12, -.88], [.42, -.88], [.12, -.2], [.45, -.2], [-.3, .9], [-.05, .12], [-.38, .12]],
});
export const SUGAR_SHAPES = Object.freeze(Object.keys(OUTLINES));
/** Resamples a closed outline into evenly spaced canvas points `STEP` apart. */
function sampleOutline(name) {
  const raw = OUTLINES[name]().map(([x, y]) => [SUGAR_CX + x * SCALE, SUGAR_CY + y * SCALE]);
  const lengths = [0];
  for (let i = 0; i < raw.length; i++) { const [ax, ay] = raw[i], [bx, by] = raw[(i + 1) % raw.length]; lengths.push(lengths[i] + Math.hypot(bx - ax, by - ay)); }
  const total = lengths[raw.length], n = Math.max(12, Math.round(total / STEP)), points = [];
  for (let k = 0, i = 0; k < n; k++) {
    const want = k * total / n;
    while (lengths[i + 1] < want) i++;
    const [ax, ay] = raw[i], [bx, by] = raw[(i + 1) % raw.length], t = (want - lengths[i]) / ((lengths[i + 1] - lengths[i]) || 1);
    points.push(Object.freeze({ x: ax + (bx - ax) * t, y: ay + (by - ay) * t }));
  }
  return Object.freeze(points);
}
const PATHS = Object.freeze(Object.fromEntries(SUGAR_SHAPES.map(name => [name, sampleOutline(name)])));
export const sugarPath = name => PATHS[name] || PATHS.heart;

export class SugarSnapGame {
  constructor({ random = Math.random, onEvent = () => {}, saved, pace: chosen = 'normal' } = {}) {
    this.random = random; this.onEvent = onEvent; this.pace = pace(chosen); this.reset(); if (saved) this.restore(saved);
  }
  reset(chosen = this.pace) {
    this.pace = pace(chosen); this.status = 'idle'; this.score = 0; this.round = 0; this.lives = HEARTS; this.freed = 0;
    this.setup(); this.onEvent('reset');
  }
  /** Shapes come in order from gentlest to trickiest; each lap after the first narrows the line and the clock a little. */
  get shape() { return SUGAR_SHAPES[this.round % SUGAR_SHAPES.length]; }
  get lap() { return Math.floor(this.round / SUGAR_SHAPES.length); }
  get path() { return sugarPath(this.shape); }
  get rules() {
    const p = PACE[this.pace], squeeze = Math.max(.7, .9 ** this.lap);
    return { ...p, tol: p.tol * squeeze, safe: p.safe * Math.max(.8, .95 ** this.lap) };
  }
  get progress() { return this.cut.reduce((n, c) => n + c, 0) / this.cut.length; }
  /** Fresh toffee for the current shape. */
  setup() {
    const path = this.path, r = this.rules;
    this.cut = Array(path.length).fill(0); this.stress = 0; this.peak = 0; this.cracks = []; this.scratches = [];
    this.limit = Math.round(path.length * STEP / r.safe * r.time + r.extra); this.time = this.limit;
    this.needle = null; this.last = -1; this.keyAt = -1; this.motion = 0; this.speed = 0; this.phase = 'carve'; this.result = null; this.earned = 0;
  }
  start() {
    if (this.status === 'playing') return;
    if (this.status === 'dead') this.reset();
    const resumed = this.status === 'paused'; this.status = 'playing'; this.onEvent(resumed ? 'resume' : 'start');
  }
  pause() { if (this.status === 'playing') { this.needle = null; this.status = 'paused'; this.onEvent('pause'); } }
  togglePause() { if (this.status === 'playing') this.pause(); else if (this.status === 'paused') this.start(); }
  get carving() { return this.status === 'playing' && this.phase === 'carve'; }
  /** The closest outline sample to a point, and how far away it is. */
  nearest(x, y) {
    let best = 0, gap = Infinity;
    this.path.forEach((p, i) => { const d = Math.hypot(p.x - x, p.y - y); if (d < gap) { gap = d; best = i; } });
    return { index: best, gap };
  }
  /** The needle touches down. A press never strains the toffee by itself; only moving does. */
  press(x, y) {
    if (!this.carving || !Number.isFinite(x) || !Number.isFinite(y)) return;
    this.needle = { x, y, down: true, on: false }; this.last = -1; this.touch(x, y, 0);
  }
  /** The needle moves while down. Long moves are walked in small steps so a quick flick cannot skip the line. */
  drag(x, y) {
    const n = this.needle;
    if (!this.carving || !n?.down || !Number.isFinite(x) || !Number.isFinite(y)) return;
    const length = Math.hypot(x - n.x, y - n.y), steps = Math.max(1, Math.ceil(length / 1.5)), fromX = n.x, fromY = n.y;
    this.motion += length;
    for (let i = 1; i <= steps && this.carving; i++) this.touch(fromX + (x - fromX) * i / steps, fromY + (y - fromY) * i / steps, length / steps);
  }
  lift() { if (this.needle) this.needle.down = false; this.last = -1; }
  touch(x, y, moved) {
    const n = this.needle; n.x = x; n.y = y;
    const { index, gap } = this.nearest(x, y), r = this.rules;
    n.on = gap <= r.tol;
    if (n.on) { this.mark(index); return; }
    this.last = -1;
    // Scratching the toffee away from the line strains it; the plate around the candy is safe to touch.
    if (moved > 0 && Math.hypot(x - SUGAR_CX, y - SUGAR_CY) < SUGAR_R) {
      this.strain(r.slip * moved, x, y);
      const s = this.scratches[this.scratches.length - 1];
      if (!s || Math.hypot(s.x - x, s.y - y) > 3) { this.scratches.push({ x, y }); if (this.scratches.length > 160) this.scratches.shift(); }
    }
  }
  /** Carves one sample, filling the short gap back to the last one so steady carving never leaves holes. */
  mark(index) {
    const count = this.cut.length, before = this.progress;
    const fill = i => { this.cut[(i + count) % count] = 1; };
    fill(index - 1); fill(index); fill(index + 1);
    if (this.last >= 0) {
      const ahead = (index - this.last + count) % count, behind = (this.last - index + count) % count;
      if (ahead <= 6) for (let k = 1; k < ahead; k++) fill(this.last + k);
      else if (behind <= 6) for (let k = 1; k < behind; k++) fill(index + k);
    }
    this.last = index;
    const after = this.progress;
    if (Math.floor(after * 4) > Math.floor(before * 4) && after < 1) this.onEvent('carve', { progress: after });
    if (after >= 1) this.free();
  }
  /** Keyboard carving: each press (or held repeat) carves a little further along the line from where it last stopped. */
  nudge() {
    if (!this.carving) return;
    const count = this.cut.length;
    if (this.keyAt < 0 || this.cut[this.keyAt]) { const open = this.cut.indexOf(0); if (open < 0) return; this.keyAt = (open - 1 + count) % count; }
    this.motion += KEY_STEP; let travelled = 0;
    while (travelled < KEY_STEP && this.carving) {
      this.keyAt = (this.keyAt + 1) % count; travelled += STEP;
      const p = this.path[this.keyAt]; this.needle = { x: p.x, y: p.y, down: false, on: true }; this.last = -1; this.mark(this.keyAt);
    }
  }
  strain(amount, x, y) {
    if (amount <= 0 || !this.carving) return;
    const before = this.stress; this.stress = Math.min(1, this.stress + amount); this.peak = Math.max(this.peak, this.stress);
    for (const [level, mark] of CRACKS.entries()) if (before < mark && this.stress >= mark) {
      // A crack starts near where the toffee was pushed hardest and runs off at a random angle.
      this.cracks.push({ x, y, a: unit(this.random) * Math.PI * 2, len: 18 + level * 12 });
      this.onEvent('crack', { level: level + 1 });
    }
    if (this.stress >= 1) this.endRound('snap', x, y);
  }
  free() {
    if (this.phase !== 'carve') return;
    // Each shape pays 100, plus 10 a second left, up to 100 for a clean carve, and 50 more for every lap.
    const earned = 100 + Math.round(this.time) * 10 + Math.round((1 - this.peak) * 100) + this.lap * 50;
    this.earned = earned; this.score = Math.min(999999999, this.score + earned); this.freed++;
    this.phase = 'over'; this.result = 'free'; this.needle = null;
    this.onEvent('score', { score: this.score, earned }); this.onEvent('free', { shape: this.shape, earned, clean: this.peak < .2 });
  }
  /** A snap or a timeout costs one candy; the last one ends the run. */
  endRound(result, x = SUGAR_CX, y = SUGAR_CY) {
    if (this.phase !== 'carve') return;
    this.phase = 'over'; this.result = result; this.needle = null; this.lives = Math.max(0, this.lives - 1); this.earned = 0;
    if (result === 'snap') this.cracks.push({ x, y, a: unit(this.random) * Math.PI * 2, len: 60 });
    this.onEvent(result, { shape: this.shape, lives: this.lives });
    if (!this.lives) { this.status = 'dead'; this.onEvent('death', { score: this.score }); }
  }
  /** After a result, the next tap brings the next shape. */
  nextRound() {
    if (this.status !== 'playing' || this.phase !== 'over') return;
    this.round++; this.setup(); this.onEvent('round', { shape: this.shape, round: this.round });
  }
  update(delta) {
    if (!Number.isFinite(delta) || delta <= 0) return;
    const dt = Math.min(delta, .12);
    if (!this.carving) { this.motion = 0; this.speed = 0; return; }
    // Carving faster than the toffee can take strains it; easing off lets it settle a little. Pointer events arrive in uneven
    // bursts, so the needle's speed is smoothed over about a quarter second before it is judged.
    const r = this.rules; this.speed += (this.motion / dt - this.speed) * (1 - Math.exp(-dt / SMOOTH)); this.motion = 0;
    if (this.speed > r.safe) { const n = this.needle; this.strain((this.speed - r.safe) / r.safe * r.rush * dt, n?.x ?? SUGAR_CX, n?.y ?? SUGAR_CY); }
    else this.stress = Math.max(0, this.stress - COOL * dt);
    if (!this.carving) return;
    this.time = Math.max(0, this.time - dt);
    if (!this.time) this.endRound('timeout');
  }
  snapshot() {
    return { version: 1, pace: this.pace, score: this.score, round: this.round, lives: this.lives, freed: this.freed, phase: this.phase, result: this.result,
      cut: this.cut.join(''), time: Math.round(this.time * 100) / 100, stress: Math.round(this.stress * 1000) / 1000, peak: Math.round(this.peak * 1000) / 1000,
      cracks: this.cracks.map(c => [Math.round(c.x), Math.round(c.y), Math.round(c.a * 100) / 100, c.len]), earned: this.earned,
      status: this.status === 'playing' ? 'paused' : this.status };
  }
  restore(data) {
    if (!data || data.version !== 1 || !SUGAR_PACES.includes(data.pace) || !whole(data.score, 999999999) || !whole(data.round, 100000) ||
      !whole(data.lives, HEARTS) || !whole(data.freed, 100000) || !['carve', 'over'].includes(data.phase) || !['idle', 'paused', 'playing', 'dead'].includes(data.status) ||
      !whole(data.earned, 999999999) || !Array.isArray(data.cracks) || data.cracks.length > 4) return false;
    const path = sugarPath(SUGAR_SHAPES[data.round % SUGAR_SHAPES.length]);
    if (typeof data.cut !== 'string' || data.cut.length !== path.length || /[^01]/.test(data.cut)) return false;
    const cut = [...data.cut].map(Number), done = cut.every(Boolean);
    // A carving round still has line left and a full candy; a finished one has a result that matches its line.
    if (data.phase === 'carve' && (data.result !== null || done)) return false;
    if (data.phase === 'over' && !(data.result === 'free' ? done : ['snap', 'timeout'].includes(data.result))) return false;
    if (!finite(data.time, 0, 600) || !finite(data.stress, 0, 1) || !finite(data.peak, 0, 1) || data.stress > data.peak) return false;
    if (!data.cracks.every(c => Array.isArray(c) && c.length === 4 && finite(c[0], 0, 360) && finite(c[1], 0, 452) && finite(c[2], 0, 7) && finite(c[3], 0, 60))) return false;
    const dead = data.status === 'dead';
    if (dead !== (data.lives === 0) || (dead && data.phase !== 'over')) return false;
    this.pace = data.pace; this.round = data.round;
    Object.assign(this, { score: data.score, lives: data.lives, freed: data.freed });
    this.setup();
    Object.assign(this, { cut, time: Math.min(data.time, this.limit), stress: data.stress, peak: data.peak, phase: data.phase, result: data.result, earned: data.earned,
      cracks: data.cracks.map(([x, y, a, len]) => ({ x, y, a, len })) });
    this.status = data.status === 'playing' ? 'paused' : data.status; return true;
  }
}
