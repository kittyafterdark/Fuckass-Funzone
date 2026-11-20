/** Wobbly Wafers: a wafer-cookie Jenga against Gabu. Slide a wafer out of the tower with your finger and it goes on top.
 * Every wafer has a hidden grip from the weight resting on it and how snugly it sits: loose ones slide out clean, stuck ones
 * shake the tower however gently you pull, and rushing shakes it more. Nudge one to feel it, push it back, try another.
 * The tower stands only while the weight above every layer sits over what that layer still has. Whoever topples it loses.
 * Pure rules: no DOM or Spindle APIs. Layers run bottom to top; each holds a left, middle and right wafer.
 */
export const WAFER_LEVELS = Object.freeze(['chill', 'normal', 'hard']);
export const WAFER_START_LAYERS = 12;
// Shared geometry, so falling wafers land on the same saucer and table the renderer draws.
// One export per line: the bundler lifts each exported name into the shared scope.
export const WAFER_BASE = 380;
export const WAFER_TABLE = 392;
export const WAFER_W = 52;
export const WAFER_GAP = 3;
export const SAUCER_RX = 100;
// How far a wafer slides before it is out: its own length. Side wafers slide sideways; a middle one slides out toward you.
export const WAFER_PULL = 52;
export const layerHeight = count => Math.min(22, 290 / count);
export const waferCenterX = slot => 180 + (slot - 1) * (WAFER_W + WAFER_GAP);
const LEVEL_BONUS = Object.freeze({ chill: 60, normal: 120, hard: 220 });
// Gabu's pulling hand: how fast he slides (pixels a second), how well he reads grip, and how often Chill picks blindly.
const GABU = Object.freeze({ chill: { speed: 100, read: 1.4, blind: .12 }, normal: { speed: 72, read: .6, blind: 0 }, hard: { speed: 34, read: .1, blind: 0 } });
// Shake: per pixel slid, a wafer's grip adds GRIP, and every pixel a second over SAFE adds RUSH more. The tower settles at
// SETTLE a second, but never below a floor that rises with every hole, so a holey tower stays nervy.
const TOPPLE = 100, GRIP = .65, RUSH = .0057, SAFE = 60, SETTLE = 5, HOLE = 2, SMOOTH = .2, KEY_STEP = 2, MARGIN = 3, GRAVITY = 650;
const level = value => WAFER_LEVELS.includes(value) ? value : 'normal';
const unit = random => Math.max(0, Math.min(.999999999, Number(random()) || 0));
const whole = (value, max) => Number.isSafeInteger(value) && value >= 0 && value <= max;
const full = layer => layer.every(Boolean);
/** A layer that holds anything up needs its middle wafer or both edges; a lone edge tips the layers above it, like real stacking. */
export const supports = layer => layer[1] || layer[0] && layer[2];

/** Layers you are allowed to pull from: never the unfinished top or the full layer just under it. */
export function pullableLayers(layers) {
  const blocked = full(layers[layers.length - 1]) ? 1 : 2;
  return Math.max(0, layers.length - blocked);
}
/** The lowest layer that cannot hold what rests on it, and which way the weight hangs off it, or null while the tower stands.
 * Above every layer, the middle of all the weight must sit over the span of wafers that layer still has. */
export function weakLayer(layers) {
  let mass = 0, moment = 0, weak = null;
  for (let row = layers.length - 1; row >= 0; row--) {
    const present = [0, 1, 2].filter(s => layers[row][s]);
    if (mass > 0) {
      const middle = moment / mass;
      if (!present.length) weak = { row, side: 0 };
      else {
        const lo = waferCenterX(present[0]) - WAFER_W / 2 + MARGIN, hi = waferCenterX(present[present.length - 1]) + WAFER_W / 2 - MARGIN;
        if (middle < lo || middle > hi) weak = { row, side: middle < lo ? -1 : 1 };
      }
    }
    for (const s of present) { mass++; moment += waferCenterX(s); }
  }
  return weak;
}
/** How hard a wafer is held: the weight above it, shared by what is left in its layer, times how snugly it sits (0 to 1). */
export function waferGrip(layers, snug, row, slot) {
  if (!layers[row]?.[slot]) return 0;
  let above = 0; for (let r = row + 1; r < layers.length; r++) above += layers[r].filter(Boolean).length;
  const load = Math.max(.12, Math.min(1.6, above / layers[row].filter(Boolean).length / 12));
  return load * (.25 + .75 * (snug[row]?.[slot] ?? .5));
}
/** Whether pulling this wafer out would leave a tower that stands. */
export function safePull(layers, row, slot) {
  if (!Number.isInteger(row) || row < 0 || row >= pullableLayers(layers) || !layers[row]?.[slot]) return false;
  const after = layers.map(l => [...l]); after[row][slot] = false;
  return after[row].some(Boolean) && !weakLayer(after);
}
export class WobblyWafersGame {
  constructor({ random = Math.random, onEvent = () => {}, saved, level: chosen = 'normal' } = {}) {
    this.random = random; this.onEvent = onEvent; this.level = level(chosen); this.reset(); if (saved) this.restore(saved);
  }
  reset(chosen = this.level) {
    this.level = level(chosen); this.status = 'idle'; this.score = 0; this.wins = 0; this.round = 1;
    this.onEvent('reset'); this.newTower(1);
  }
  newTower(starter) {
    this.layers = Array.from({ length: WAFER_START_LAYERS }, () => [true, true, true]);
    this.snug = this.layers.map(() => [0, 1, 2].map(() => unit(this.random)));
    this.wobble = 0; this.starter = starter; this.turn = starter; this.phase = 'turn'; this.result = null; this.holes = 0;
    this.selected = null; this.speed = 0; this.motion = 0; this.jiggle = 0; this.cursor = { row: 4, slot: 1 }; this.crumbs = []; this.tip = null; this.sway = 0;
    this.lastPull = null; this.breakRow = -1; this.pulledOut = null; this.gabuPull = null;
    this.thinking = starter === 2 ? .8 : 0;
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
    this.round++; this.newTower(this.round % 2 ? 1 : 2); this.onEvent('round', { round: this.round, starter: this.starter }); return true;
  }
  /** How far the top of the tower leans right now, in pixels: a slow sway that grows with the wobble, plus a quick shiver
   * while a wafer is being pulled. Shared by the drawing and the tap test so they always agree. */
  lean(reduced = false) {
    if (reduced) return 0;
    return Math.sin(this.sway * 2.4) * Math.min(100, this.wobble) / 100 * 8 + Math.sin(this.sway * 31) * this.jiggle * 2.5;
  }
  grip(row, slot) { return waferGrip(this.layers, this.snug, row, slot); }
  /** How a held wafer feels, for the readout: loose, snug or stuck. */
  feel(row, slot) { const g = this.grip(row, slot); return g < .22 ? 'loose' : g < .55 ? 'snug' : 'stuck'; }
  moveCursor(dx, dy) {
    const top = Math.max(0, pullableLayers(this.layers) - 1);
    this.cursor = { row: Math.max(0, Math.min(top, this.cursor.row + dy)), slot: Math.max(0, Math.min(2, this.cursor.slot + dx)) };
  }
  canPull(row, slot) { return Number.isInteger(row) && row >= 0 && row < pullableLayers(this.layers) && !!this.layers[row]?.[slot]; }
  /** Takes hold of a wafer. A different wafer you had partly out slides back in first, with a little shake. */
  grab(row = this.cursor.row, slot = this.cursor.slot) {
    if (this.status !== 'playing') return false;
    if (this.phase === 'over') return this.nextRound();
    if (this.turn !== 1 || !this.canPull(row, slot)) return false;
    const held = this.selected;
    if (held && held.row === row && held.slot === slot) return true;
    if (held) this.pushBack();
    this.selected = { row, slot, progress: 0, peak: 0 }; this.cursor = { row, slot }; this.onEvent('select', { row, slot, feel: this.feel(row, slot) }); return true;
  }
  /** Keeps the old tap-to-pick name for the keyboard and taps: a tap picks a wafer; on the held one it slides it a step. */
  choose(row = this.cursor.row, slot = this.cursor.slot) {
    if (this.phase === 'over') return this.nextRound();
    const held = this.selected;
    if (held && held.row === row && held.slot === slot) return this.slide(KEY_STEP);
    return this.grab(row, slot);
  }
  /** Slides the held wafer out by `amount` pixels (negative pushes it back in). Its grip shakes the tower as it moves,
   * more when you rush. At its full length it comes out and goes on top. */
  slide(amount) {
    const held = this.selected;
    if (!held || this.status !== 'playing' || this.phase !== 'turn' || this.turn !== 1 || !Number.isFinite(amount) || !amount) return false;
    this.move(1, held, amount); return true;
  }
  move(who, held, amount) {
    const step = Math.max(-held.progress * WAFER_PULL, Math.min((1 - held.progress) * WAFER_PULL, amount)), d = Math.abs(step);
    if (!d) return;
    held.progress += step / WAFER_PULL; this.motion += d;
    const grip = this.grip(held.row, held.slot), rush = Math.max(0, this.speed - SAFE);
    const shake = d * (grip * GRIP + rush * RUSH * (.3 + grip)) * (step < 0 ? .5 : 1);
    this.wobble += shake; held.peak += shake; this.jiggle = Math.min(1, this.jiggle + shake * .08);
    if (this.wobble >= TOPPLE) { this.topple(who, 'wobble'); return; }
    // A quarter of the way out on a stuck wafer, Gabu notices.
    if (who === 1 && !held.warned && held.progress >= .25 && this.feel(held.row, held.slot) === 'stuck') { held.warned = true; this.onEvent('stuck', { row: held.row, slot: held.slot }); }
    if (held.progress >= 1 - 1e-9) this.take(who, held);
  }
  /** Lets go. A wafer left part-way out stays there, still yours to finish or push back. */
  release() { if (this.selected && this.selected.progress <= 0) this.selected = null; }
  /** Pushes a part-pulled wafer back in, with a little shake, and lets go of it. */
  pushBack() {
    const held = this.selected; if (!held) return;
    this.speed = 0; if (held.progress > 0) this.move(1, held, -held.progress * WAFER_PULL);
    if (this.phase === 'turn') this.selected = null;
  }
  cancel() { this.pushBack(); }
  /** The wafer is out: it goes on top, and the tower has to hold without it. */
  take(who, held) {
    const { row, slot } = held, mine = who === 1;
    this.selected = null; this.gabuPull = null; this.lastPull = { who, row, slot, age: 0 };
    this.layers[row][slot] = false;
    const weak = weakLayer(this.layers);
    // The tower is left as it stood when it fell, pulled wafer included and marked, so a finished game still saves a valid tower.
    if (weak) { this.layers[row][slot] = true; this.topple(who, 'support', row, slot, weak); return; }
    this.holes++;
    const top = this.layers[this.layers.length - 1];
    if (full(top)) { this.layers.push([true, false, false]); this.snug.push([unit(this.random), unit(this.random), unit(this.random)]); }
    else { const i = top.indexOf(false); top[i] = true; this.snug[this.layers.length - 1][i] = unit(this.random); }
    const clean = held.peak < 3;
    this.onEvent(mine ? 'pull' : 'gabu_pull', { row, slot, wobble: this.wobble, clean });
    if (mine) {
      const earned = 10 + (clean ? 10 : 0);
      this.score = Math.min(999999999, this.score + earned); this.onEvent('score', { score: this.score, earned });
      if (clean) this.onEvent('perfect', { peak: held.peak });
      if (this.wobble >= 70) this.onEvent('risky', { wobble: this.wobble });
    } else if (this.wobble >= 70) this.onEvent('gabu_risky', { wobble: this.wobble });
    this.turn = 3 - who; this.speed = 0;
    if (this.turn === 2) this.thinking = .8 + unit(this.random) * .6;
  }
  /** The tower breaks at its real weak point: the layer that can no longer hold what is on it, or for a wobble, its lowest
   * gappy layer. Everything above the break falls toward the side its weight hangs over; the rest keeps standing. */
  topple(who, reason, row = -1, slot = -1, weak = null) {
    this.phase = 'over'; this.selected = null; this.gabuPull = null;
    const n = this.layers.length, gappy = this.layers.findIndex((layer, i) => i < n - 1 && !full(layer));
    this.breakRow = weak ? weak.row : gappy >= 0 ? gappy : Math.floor(n / 2);
    this.pulledOut = reason === 'support' ? { row, slot } : null;
    const side = weak?.side || Math.sign(this.lean()) || (unit(this.random) < .5 ? -1 : 1);
    const lh = layerHeight(n), lean = this.lean();
    // Everything above the break tips over as one piece, hinged on the outer edge of what still stands in the break layer
    // on the falling side, and speeds up like a falling stick. A wobble topple starts with a shove.
    const gone = (r, s) => this.pulledOut?.row === r && this.pulledOut?.slot === s;
    const standing = [0, 1, 2].filter(s => this.layers[this.breakRow][s] && !gone(this.breakRow, s));
    const edges = (standing.length ? standing : [0, 1, 2]).map(s => waferCenterX(s) + side * WAFER_W / 2);
    const height = Math.max(40, (n - this.breakRow - 1) * lh);
    this.tip = { x: (side > 0 ? Math.max(...edges) : Math.min(...edges)) + lean * this.breakRow / n, y: WAFER_BASE - (this.breakRow + 1) * lh,
      side, angle: .03, omega: reason === 'wobble' ? .6 : .25, k: 3 * GRAVITY / (2 * height) };
    for (let r = this.breakRow + 1; r < n; r++) this.layers[r].forEach((on, s) => {
      if (!on || gone(r, s)) return;
      const x = waferCenterX(s) + lean * r / n, y = WAFER_BASE - (r + .5) * lh;
      this.crumbs.push({ x, y, rx: x - this.tip.x, ry: y - this.tip.y, attached: true, h: lh - 2, vx: 0, vy: 0, side, spin: 0, spinRate: 0, flavor: r + s, crossed: r % 2 === 1, rest: false });
    });
    if (who === 2) {
      this.result = 'win'; this.wins++;
      const earned = 100 + LEVEL_BONUS[this.level]; this.score = Math.min(999999999, this.score + earned);
      this.onEvent('score', { score: this.score, earned }); this.onEvent('win', { score: this.score, wins: this.wins, reason });
    } else { this.result = 'loss'; this.status = 'dead'; this.onEvent('death', { score: this.score, wins: this.wins, reason }); }
  }
  /** Gabu picks the wafer that feels loosest to him and never one that would drop the tower, unless Chill picks blindly.
   * How well he reads grip depends on his level. */
  gabuChoice() {
    const options = [], g = GABU[this.level];
    for (let row = 0; row < pullableLayers(this.layers); row++) for (let slot = 0; slot < 3; slot++) {
      if (this.layers[row][slot]) options.push({ row, slot, safe: safePull(this.layers, row, slot), grip: this.grip(row, slot) });
    }
    if (!options.length) return null;
    if (unit(this.random) < g.blind) return options[Math.floor(unit(this.random) * options.length)];
    const safe = options.filter(o => o.safe), pool = safe.length ? safe : options;
    return pool.map(o => ({ ...o, feel: o.grip * (1 + (unit(this.random) - .5) * g.read) })).sort((a, b) => a.feel - b.feel)[0];
  }
  /** Advances the topple in small steps, so a fast fall never skips past the ground between two frames. */
  settleCrumbs(dt) {
    for (let left = dt; left > 0; left -= 1 / 60) this.stepCrumbs(Math.min(left, 1 / 60));
    this.crumbs = this.crumbs.filter(c => c.x > -WAFER_W && c.x < 360 + WAFER_W);
  }
  /** The tipping section turns about its hinge as one rigid piece. Once it has leaned far enough, or a wafer reaches the ground,
   * it breaks apart: each wafer flies on with the speed and spin the turn gave it, drops in front of the stump, and lands on the
   * saucer or the table, where the bump takes most of its speed and it flops flat. Wafers never rest on the stump or each other. */
  stepCrumbs(dt) {
    const tip = this.tip;
    if (tip) {
      tip.omega += tip.k * Math.max(.2, Math.sin(tip.angle + .15)) * dt; tip.angle += tip.omega * dt;
      const a = tip.side * tip.angle, w = tip.side * tip.omega, cos = Math.cos(a), sin = Math.sin(a);
      let release = tip.angle >= .45;
      for (const c of this.crumbs) {
        if (!c.attached) continue;
        c.x = tip.x + c.rx * cos - c.ry * sin; c.y = tip.y + c.rx * sin + c.ry * cos; c.spin = a;
        c.vx = (-c.rx * sin - c.ry * cos) * w; c.vy = (c.rx * cos - c.ry * sin) * w;
        if (c.y + this.reach(c) >= this.floorAt(c.x)) release = true;
      }
      if (!release) return;
      // Pulling apart costs the wafers a little speed and spin, so they tumble less than a quarter turn before landing,
      // without a visible jolt where the section breaks up.
      for (const c of this.crumbs) if (c.attached) { c.attached = false; c.vx = c.vx * .85 + (unit(this.random) - .5) * 8; c.vy *= .85; c.spinRate = Math.max(-1.6, Math.min(1.6, w * .8)); }
      this.tip = null;
    }
    for (const c of this.crumbs) {
      if (c.rest || c.attached) continue;
      if (c.grounded) { this.tipOnGround(c, dt); continue; }
      c.vy += GRAVITY * dt; c.x += c.vx * dt; c.y += c.vy * dt; c.spin += c.spinRate * dt;
      // The edges of the screen are the walls of the room: a wafer bumps off them instead of leaving.
      if (c.x < WAFER_W / 2 || c.x > 360 - WAFER_W / 2) { c.x = Math.max(WAFER_W / 2, Math.min(360 - WAFER_W / 2, c.x)); c.vx = -c.vx * .3; }
      const floor = this.floorAt(c.x), reach = this.reach(c);
      if (c.y + reach < floor) continue;
      c.y = floor - reach;
      if (c.vy > 220) { c.vy = -c.vy * .18; c.vx *= .35; c.spinRate *= .35; continue; }
      // Touching down for good: friction holds the lowest corner where it landed, and gravity tips the wafer about that corner.
      const k = this.lowestCorner(c); c.vy = 0; c.vx = 0; c.spinRate *= .3;
      c.grounded = { k, x: c.x + this.cornerOffset(c, k).x, floor, roll: 0 };
    }
  }
  /** Where one corner of a turned wafer sits, relative to its middle. Corners 0 to 3 go round the wafer; 0 and 3 share an end. */
  cornerOffset(c, k) {
    const x = (k === 0 || k === 3 ? -1 : 1) * WAFER_W / 2, y = (k < 2 ? -1 : 1) * c.h / 2, cos = Math.cos(c.spin), sin = Math.sin(c.spin);
    return { x: x * cos - y * sin, y: x * sin + y * cos };
  }
  lowestCorner(c) { return [0, 1, 2, 3].reduce((low, k) => this.cornerOffset(c, k).y > this.cornerOffset(c, low).y + 1e-9 ? k : low, 0); }
  /** A wafer on the ground pivots about the corner touching it, like any rigid block: gravity pulls its middle down past the
   * corner, harder the further it hangs out, until a long side lies flat. The corner never slides, and each time a new corner
   * takes the weight the bump soaks up some of the turn. Wafer cookies have rounded ends, so one that comes up onto an end
   * cannot balance there: it rolls on over the end, the way it was already turning, and lands on its other face. */
  tipOnGround(c, dt) {
    const g = c.grounded, a = WAFER_W / 2, b = c.h / 2, inertia = 4 / 3 * (a * a + b * b);
    let pivot = this.cornerOffset(c, g.k);
    const partner = this.cornerOffset(c, [3, 2, 1, 0][g.k]), onEnd = pivot.y - partner.y < c.h * .4;
    if (onEnd) {
      g.roll ||= Math.sign(c.spinRate) || c.side || 1;
      c.spinRate += g.roll * (GRAVITY * Math.abs(pivot.x) / inertia + 4) * dt;
    } else { g.roll = 0; c.spinRate += GRAVITY * -pivot.x / inertia * dt; }
    const flat = Math.round(c.spin / Math.PI) * Math.PI, next = c.spin + c.spinRate * dt;
    if ((c.spin - flat) * (next - flat) <= 0 && Math.abs(c.spin - flat) < .6) {
      // A long side is down: it comes to rest flat, where its corner touched.
      c.spin = flat; pivot = this.cornerOffset(c, g.k);
      Object.assign(c, { x: Math.max(WAFER_W / 2, Math.min(360 - WAFER_W / 2, g.x - pivot.x)), y: g.floor - c.h / 2, spin: 0, spinRate: 0, rest: true, grounded: null });
      return;
    }
    c.spin = next; pivot = this.cornerOffset(c, g.k);
    c.x = g.x - pivot.x; c.y = g.floor - pivot.y;
    // When another corner comes down to the ground, it takes the weight and becomes the new pivot.
    const low = this.lowestCorner(c);
    if (low !== g.k && this.cornerOffset(c, low).y > pivot.y + .01) {
      g.k = low; pivot = this.cornerOffset(c, low); g.x = c.x + pivot.x; c.y = g.floor - pivot.y; c.spinRate *= .6;
    }
  }
  floorAt(x) { return Math.abs(x - 180) <= SAUCER_RX ? WAFER_BASE : WAFER_TABLE; }
  /** How far below its center a turned wafer reaches. */
  reach(c) { return Math.abs(WAFER_W / 2 * Math.sin(c.spin)) + Math.abs(c.h / 2 * Math.cos(c.spin)); }
  update(delta) {
    if (!Number.isFinite(delta) || delta <= 0) return;
    const dt = Math.min(delta, .12);
    this.settleCrumbs(dt);
    if (this.lastPull) this.lastPull.age += dt;
    this.jiggle = Math.max(0, this.jiggle - dt * 2.5);
    if (this.status !== 'playing') return;
    this.sway += dt;
    if (this.phase !== 'turn') return;
    // How fast the held wafer is moving, smoothed over a moment, since pointer events arrive in bursts.
    this.speed += (this.motion / dt - this.speed) * (1 - Math.exp(-dt / SMOOTH)); this.motion = 0;
    // The tower settles while nothing is pulling at it, down to a floor set by how many holes it has.
    const pulling = this.turn === 1 ? !!this.selected : !!this.gabuPull;
    this.wobble = Math.max(Math.min(this.wobble, this.holes * HOLE), this.wobble - (pulling ? SETTLE * .4 : SETTLE) * dt);
    if (this.turn !== 2) return;
    if (!this.gabuPull) {
      this.thinking -= dt; if (this.thinking > 0) return;
      const pick = this.gabuChoice(); if (!pick) return;
      this.gabuPull = { row: pick.row, slot: pick.slot, progress: 0, peak: 0 }; this.onEvent('gabu_select', { row: pick.row, slot: pick.slot });
    }
    const speed = GABU[this.level].speed * (.85 + unit(this.random) * .3);
    this.move(2, this.gabuPull, speed * dt);
  }
  snapshot() {
    return { version: 2, layers: this.layers.map(l => [...l]), snug: this.snug.map(l => l.map(v => Math.round(v * 100) / 100)), holes: this.holes,
      wobble: Math.round(this.wobble * 100) / 100, turn: this.turn, starter: this.starter, round: this.round,
      score: this.score, wins: this.wins, level: this.level, phase: this.phase, result: this.result, cursor: { ...this.cursor },
      breakRow: this.breakRow, pulledOut: this.pulledOut ? { ...this.pulledOut } : null,
      status: this.status === 'playing' ? 'paused' : this.status };
  }
  restore(data) {
    if (!data || ![1, 2].includes(data.version) || !Array.isArray(data.layers) || data.layers.length < 2 || data.layers.length > 80 ||
      data.layers.some(l => !Array.isArray(l) || l.length !== 3 || l.some(v => typeof v !== 'boolean') || !l.some(Boolean)) ||
      !Number.isFinite(data.wobble) || data.wobble < 0 || data.wobble > TOPPLE * 2 || ![1, 2].includes(data.turn) || ![1, 2].includes(data.starter) ||
      !whole(data.round, 100000) || data.round < 1 || !whole(data.score, 999999999) || !whole(data.wins, 100000) || !WAFER_LEVELS.includes(data.level) ||
      !['turn', 'over'].includes(data.phase) || !['idle', 'paused', 'playing', 'dead'].includes(data.status) ||
      !data.cursor || !whole(data.cursor.row, 79) || !whole(data.cursor.slot, 2)) return false;
    // Version 2 adds how snugly each wafer sits; older saves get fresh, random snugness.
    if (data.version === 2 && (!Array.isArray(data.snug) || data.snug.length !== data.layers.length ||
      data.snug.some(l => !Array.isArray(l) || l.length !== 3 || l.some(v => typeof v !== 'number' || !(v >= 0 && v <= 1))) || !whole(data.holes, 10000))) return false;
    const over = data.phase === 'over';
    if (!over && (data.wobble >= TOPPLE || weakLayer(data.layers))) return false;
    if ((data.status === 'dead') !== (over && data.result === 'loss') || over && !['win', 'loss'].includes(data.result)) return false;
    this.layers = data.layers.map(l => [...l]); this.wobble = data.wobble; this.turn = data.turn; this.starter = data.starter; this.round = data.round;
    this.snug = data.version === 2 ? data.snug.map(l => [...l]) : this.layers.map(() => [0, 1, 2].map(() => unit(this.random)));
    this.holes = data.version === 2 ? data.holes : this.layers.slice(0, -1).flat().filter(v => !v).length;
    this.score = data.score; this.wins = data.wins; this.level = data.level; this.phase = data.phase; this.result = over ? data.result : null;
    this.cursor = { row: Math.min(data.cursor.row, Math.max(0, pullableLayers(this.layers) - 1)), slot: data.cursor.slot };
    // A finished tower keeps its break; the fallen wafers themselves are not saved.
    this.breakRow = over && Number.isInteger(data.breakRow) && data.breakRow >= 0 && data.breakRow < this.layers.length ? data.breakRow : over ? Math.floor(this.layers.length / 2) : -1;
    const pulled = data.pulledOut;
    this.pulledOut = over && pulled && whole(pulled.row, this.layers.length - 1) && whole(pulled.slot, 2) ? { row: pulled.row, slot: pulled.slot } : null;
    this.selected = null; this.speed = 0; this.motion = 0; this.jiggle = 0; this.crumbs = []; this.tip = null; this.sway = 0; this.lastPull = null; this.gabuPull = null;
    this.thinking = this.turn === 2 ? .7 : 0;
    this.status = data.status === 'playing' ? 'paused' : data.status; return true;
  }
}
