/** Sprinkle Scurry: a hamster scurries through a candy-shop maze eating sprinkles while Gabu's vacuum bots give chase.
 * A sugar cube gives the hamster the zoomies: the bots get dizzy and flee, and a bonked bot goes back to its charger.
 * Pure rules: no DOM or Spindle APIs. Movers stand on a cell and slide toward the next one; `t` is how far along they are.
 */
// `#` shelf, `.` sprinkle, `o` sugar cube, `P` hamster start, `=` charger door, `D` charger. Only bots use the door and charger.
// Every aisle connects and none dead-ends, so the hamster can always run.
export const SCURRY_MAZE = Object.freeze([
  '###############',
  '#o...........o#',
  '#.###.###.###.#',
  '#.............#',
  '#.##.##=##.##.#',
  '#....#DDD#....#',
  '#.##.#####.##.#',
  '#.............#',
  '#.#.###.###.#.#',
  '#.#...#.#...#.#',
  '#.###.#.#.###.#',
  '#.............#',
  '#.##.##.##.##.#',
  '#o...........o#',
  '#.##.#.#.#.##.#',
  '#......P......#',
  '###############',
]);
// One export per line: the bundler lifts each exported name into the shared scope.
export const SCURRY_COLS = 15;
export const SCURRY_ROWS = 17;
export const SCURRY_PACES = Object.freeze(['chill', 'normal', 'chaos']);
export const SCURRY_DIRS = Object.freeze({ up: Object.freeze([0, -1]), down: Object.freeze([0, 1]), left: Object.freeze([-1, 0]), right: Object.freeze([1, 0]) });
const OPPOSITE = Object.freeze({ up: 'down', down: 'up', left: 'right', right: 'left' });
// Pace changes how many bots chase, how fast they roll, how often they lose the trail, and how long a sugar rush lasts.
const PACE = Object.freeze({
  chill: { bots: 2, speed: 3.4, wander: .45, sugar: 8 },
  normal: { bots: 3, speed: 4.1, wander: .25, sugar: 6 },
  chaos: { bots: 4, speed: 4.7, wander: .12, sugar: 4.5 },
});
// Cells per second. The hamster always outruns a chasing bot, and a dizzy bot is slower still.
const RUN = 5.2, DIZZY = 2.6, HEARTS = 3, READY = 1.4, CHARGE = 3, RELEASE = 2.5, CATCH = .6;
const pace = value => SCURRY_PACES.includes(value) ? value : 'normal';
const unit = random => Math.max(0, Math.min(.999999999, Number(random()) || 0));
const whole = (value, max) => Number.isSafeInteger(value) && value >= 0 && value <= max;
const cellAt = (c, r) => SCURRY_MAZE[r]?.[c] ?? '#';
const find = ch => { for (let r = 0; r < SCURRY_ROWS; r++) { const c = SCURRY_MAZE[r].indexOf(ch); if (c >= 0) return { c, r }; } return null; };
const START = find('P'), DOOR = find('='), EXIT = { c: DOOR.c, r: DOOR.r - 1 };
const CHARGER = SCURRY_MAZE.flatMap((row, r) => [...row].flatMap((ch, c) => ch === 'D' ? [{ c, r }] : []));
const FRESH = SCURRY_MAZE.flatMap(row => [...row].map(ch => ch === '.' ? 1 : ch === 'o' ? 2 : 0));
const hamsterCan = (c, r) => !'#=D'.includes(cellAt(c, r));
const botCan = (bot, c, r) => bot.state === 'exit' ? cellAt(c, r) !== '#' : hamsterCan(c, r);

export class SprinkleScurryGame {
  constructor({ random = Math.random, onEvent = () => {}, saved, pace: chosen = 'normal' } = {}) {
    this.random = random; this.onEvent = onEvent; this.pace = pace(chosen); this.reset(); if (saved) this.restore(saved);
  }
  reset(chosen = this.pace) {
    this.pace = pace(chosen); this.status = 'idle'; this.score = 0; this.level = 1; this.lives = HEARTS; this.munches = 0; this.bonks = 0;
    this.dots = [...FRESH]; this.effects = []; this.place(); this.onEvent('reset');
  }
  /** Puts the hamster on its start and the bots on their charger, then holds everyone still for a moment. */
  place() {
    this.hamster = { c: START.c, r: START.r, dir: 'left', t: 0, moving: false }; this.want = null;
    const p = PACE[this.pace];
    // The first bot starts outside the charger; the rest leave it one after another.
    this.bots = Array.from({ length: p.bots }, (_, i) => {
      const spot = i === 0 ? EXIT : CHARGER[(i - 1) % CHARGER.length];
      return { c: spot.c, r: spot.r, dir: 'left', t: 0, state: i === 0 ? 'chase' : 'dock', wait: i * RELEASE, scared: false, look: i, wander: p.wander * (1 + i * .3) };
    });
    this.sugar = 0; this.chain = 0; this.phase = 'ready'; this.ready = READY;
  }
  start() {
    if (this.status === 'playing') return;
    if (this.status === 'dead') this.reset();
    const resumed = this.status === 'paused'; this.status = 'playing'; this.onEvent(resumed ? 'resume' : 'start');
  }
  pause() { if (this.status === 'playing') { this.status = 'paused'; this.onEvent('pause'); } }
  togglePause() { if (this.status === 'playing') this.pause(); else if (this.status === 'paused') this.start(); }
  get remaining() { return this.dots.reduce((n, d) => n + (d ? 1 : 0), 0); }
  /** Where a mover is drawn, in cells. */
  position(mover) { const [dx, dy] = SCURRY_DIRS[mover.dir]; return { x: mover.c + dx * mover.t, y: mover.r + dy * mover.t }; }
  botSpeed(bot) {
    if (bot.scared) return DIZZY;
    const base = Math.min(RUN - .3, PACE[this.pace].speed + (this.level - 1) * .15);
    return bot.state === 'exit' ? base * .8 : base;
  }
  /** Steering is remembered until the next turning is open, so a swipe made a little early still takes the turn. */
  steer(dir) {
    if (!SCURRY_DIRS[dir]) return false;
    if (this.status === 'idle') { this.start(); this.want = dir; return false; }
    if (this.status !== 'playing') return false;
    this.want = dir;
    const h = this.hamster;
    // Turning back is allowed anywhere, even between two cells.
    if (h.moving && h.t > 0 && dir === OPPOSITE[h.dir]) {
      const [dx, dy] = SCURRY_DIRS[h.dir]; h.c += dx; h.r += dy; h.t = 1 - h.t; h.dir = dir;
    }
    return true;
  }
  open(c, r, dir) { const [dx, dy] = SCURRY_DIRS[dir]; return hamsterCan(c + dx, r + dy); }
  moveHamster(dt) {
    const h = this.hamster;
    if (!h.moving) {
      if (!this.want || !this.open(h.c, h.r, this.want)) return;
      h.dir = this.want; h.moving = true;
    }
    h.t += RUN * dt;
    while (h.t >= 1) {
      const [dx, dy] = SCURRY_DIRS[h.dir]; h.t -= 1; h.c += dx; h.r += dy;
      if (this.eat(h.c, h.r)) return;
      if (this.want && this.want !== h.dir && this.open(h.c, h.r, this.want)) h.dir = this.want;
      else if (!this.open(h.c, h.r, h.dir)) { h.t = 0; h.moving = false; return; }
    }
  }
  /** Eats whatever is on the cell. Returns true when that cleared the shop and everyone was put back. */
  eat(c, r) {
    const i = r * SCURRY_COLS + c, kind = this.dots[i]; if (!kind) return false;
    this.dots[i] = 0;
    if (kind === 1) {
      this.munches++; this.score = Math.min(999999999, this.score + 10); this.onEvent('munch', { left: this.remaining });
      // The score is reported every few sprinkles rather than on each one, so saves and rewards are not written many times a second.
      if (this.munches % 10 === 0) this.onEvent('score', { score: this.score, earned: 100 });
    } else {
      this.score = Math.min(999999999, this.score + 50); this.chain = 0;
      this.sugar = Math.max(2.5, PACE[this.pace].sugar - (this.level - 1) * .4);
      for (const b of this.bots) if (b.state === 'chase') b.scared = true;
      this.onEvent('score', { score: this.score, earned: 50 }); this.onEvent('sugar', { seconds: this.sugar });
    }
    if (!this.remaining) { this.clear(); return true; }
    return false;
  }
  clear() {
    const bonus = 200 + 100 * this.level; this.score = Math.min(999999999, this.score + bonus);
    this.onEvent('score', { score: this.score, earned: bonus }); this.onEvent('win', { level: this.level, score: this.score });
    this.level = Math.min(999, this.level + 1); this.dots = [...FRESH]; this.place();
  }
  /** Bots pick a turning at each cell: toward the hamster, away from it while dizzy, or now and then anywhere at all. */
  decide(bot) {
    if (bot.state === 'exit') {
      if (bot.c !== DOOR.c) return bot.c < DOOR.c ? 'right' : 'left';
      return 'up';
    }
    const all = Object.keys(SCURRY_DIRS).filter(d => { const [dx, dy] = SCURRY_DIRS[d]; return botCan(bot, bot.c + dx, bot.r + dy); });
    const forward = all.filter(d => d !== OPPOSITE[bot.dir]), options = forward.length ? forward : all;
    if (!options.length) return bot.dir;
    if (unit(this.random) < (bot.scared ? .5 : bot.wander)) return options[Math.floor(unit(this.random) * options.length)];
    const h = this.position(this.hamster), far = d => { const [dx, dy] = SCURRY_DIRS[d]; return (bot.c + dx - h.x) ** 2 + (bot.r + dy - h.y) ** 2; };
    return options.reduce((best, d) => (bot.scared ? far(d) > far(best) : far(d) < far(best)) ? d : best);
  }
  moveBot(bot, dt) {
    if (bot.state === 'dock') {
      bot.wait -= dt; if (bot.wait > 0) return;
      bot.state = 'exit'; bot.t = 0; bot.dir = this.decide(bot);
    }
    bot.t += this.botSpeed(bot) * dt;
    while (bot.t >= 1) {
      const [dx, dy] = SCURRY_DIRS[bot.dir]; bot.t -= 1; bot.c += dx; bot.r += dy;
      if (bot.state === 'exit' && bot.c === EXIT.c && bot.r === EXIT.r) bot.state = 'chase';
      bot.dir = this.decide(bot);
    }
  }
  catchCheck() {
    const h = this.position(this.hamster);
    for (const bot of this.bots) {
      if (bot.state !== 'chase') continue;
      const b = this.position(bot); if (Math.hypot(b.x - h.x, b.y - h.y) >= CATCH) continue;
      if (bot.scared) { this.bonk(bot, b); continue; }
      this.lives--; this.effects.push({ kind: 'caught', x: h.x, y: h.y, age: 0 });
      if (this.lives <= 0) { this.lives = 0; this.status = 'dead'; this.phase = 'over'; this.onEvent('death', { score: this.score, level: this.level }); }
      else { this.onEvent('caught', { lives: this.lives }); this.place(); }
      return;
    }
  }
  /** A bonked bot rolls back onto its charger and sits out a few seconds. Each bonk in one sugar rush is worth double the last. */
  bonk(bot, at) {
    const earned = 100 * 2 ** Math.min(3, this.chain); this.chain++; this.bonks++;
    this.score = Math.min(999999999, this.score + earned); this.effects.push({ kind: 'bonk', x: at.x, y: at.y, points: earned, age: 0 });
    const spot = CHARGER[bot.look % CHARGER.length];
    Object.assign(bot, { c: spot.c, r: spot.r, t: 0, dir: 'up', state: 'dock', wait: CHARGE, scared: false });
    this.onEvent('score', { score: this.score, earned }); this.onEvent('bonk', { earned, chain: this.chain });
  }
  update(delta) {
    if (!Number.isFinite(delta) || delta <= 0) return;
    let left = Math.min(delta, .12);
    // Small steps keep a fast mover from passing through a bot between two frames.
    while (left > 0) { const dt = Math.min(left, 1 / 60); left -= dt; this.step(dt); }
  }
  step(dt) {
    for (const e of this.effects) e.age += dt;
    this.effects = this.effects.filter(e => e.age < .9);
    if (this.status !== 'playing') return;
    if (this.phase === 'ready') { this.ready -= dt; if (this.ready <= 0) this.phase = 'play'; return; }
    if (this.sugar > 0) { this.sugar = Math.max(0, this.sugar - dt); if (!this.sugar) for (const b of this.bots) b.scared = false; }
    const level = this.level;
    this.moveHamster(dt); if (this.level !== level) return;
    this.catchCheck(); if (this.status !== 'playing' || this.phase !== 'play') return;
    for (const bot of this.bots) this.moveBot(bot, dt);
    this.catchCheck();
  }
  snapshot() {
    return { version: 1, dots: this.dots.join(''), score: this.score, level: this.level, lives: this.lives, munches: this.munches, bonks: this.bonks,
      pace: this.pace, status: this.status === 'playing' ? 'paused' : this.status };
  }
  restore(data) {
    if (!data || data.version !== 1 || typeof data.dots !== 'string' || data.dots.length !== FRESH.length || !whole(data.score, 999999999) ||
      !whole(data.level, 999) || data.level < 1 || !whole(data.lives, HEARTS) || !whole(data.munches, 100000000) || !whole(data.bonks, 100000000) ||
      !SCURRY_PACES.includes(data.pace) || !['idle', 'paused', 'playing', 'dead'].includes(data.status)) return false;
    // A sprinkle or sugar cube can only be where the shop put one.
    const dots = [...data.dots].map(Number);
    if (dots.some((d, i) => d !== 0 && d !== FRESH[i])) return false;
    const dead = data.status === 'dead';
    if (dead !== (data.lives === 0) || (!dead && !dots.some(Boolean))) return false;
    this.pace = data.pace; this.dots = dots; this.effects = [];
    Object.assign(this, { score: data.score, level: data.level, lives: data.lives, munches: data.munches, bonks: data.bonks });
    // Movers are not saved; a resumed run starts from the start positions with a moment to get ready.
    this.place(); if (dead) this.phase = 'over';
    this.status = data.status === 'playing' ? 'paused' : data.status; return true;
  }
}
