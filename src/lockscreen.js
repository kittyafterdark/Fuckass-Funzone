/** Gabu's Lockscreen: guess the passcode on Gabu's phone one letter at a time. Every wrong guess tightens its face scan,
 * and when the scan locks on you are locked out. Each passcode cracked adds to the run; one lockout ends it.
 * Pure rules: no DOM or Spindle APIs.
 */
// One export per line: the bundler lifts each exported name into the shared scope.
export const LOCK_PACES = Object.freeze(['chill', 'normal', 'hard']);
export const LOCK_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
// Original word lists, all everyday words people know. Letters only, so every one can be typed on any keyboard.
// HOME shows on screen as AROUND THE HOUSE.
export const LOCK_WORDS = Object.freeze({
  FOOD: Object.freeze([
    'PIZZA', 'BURGER', 'PASTA', 'NOODLES', 'TACO', 'BURRITO', 'SUSHI', 'SALAD', 'CHEESE', 'BREAD', 'PANCAKE', 'WAFFLE', 'BACON', 'POTATO', 'FRIES',
    'NACHOS', 'POPCORN', 'COOKIE', 'DONUT', 'CUPCAKE', 'BANANA', 'CARROT', 'KETCHUP', 'AVOCADO', 'SANDWICH', 'SPAGHETTI', 'DUMPLING', 'CHOCOLATE',
    'STRAWBERRY', 'PINEAPPLE', 'WATERMELON', 'BROCCOLI', 'MEATBALL', 'MUSHROOM', 'CROISSANT', 'MILKSHAKE']),
  GAMES: Object.freeze([
    'JOYSTICK', 'TOKEN', 'JACKPOT', 'COMBO', 'PINBALL', 'PIXEL', 'RESPAWN', 'CONTROLLER', 'PLAYER', 'LEVEL', 'BONUS', 'TICKET', 'CHECKPOINT',
    'GLITCH', 'CREDITS', 'PRIZE', 'STREAK', 'LEADERBOARD', 'GAMEPAD', 'QUEST', 'PUZZLE', 'DICE', 'CARDS', 'CHESS', 'TOURNAMENT', 'CHAMPION',
    'VICTORY', 'ARCADE', 'CHECKERS', 'DOMINOES', 'TREASURE', 'DUNGEON', 'DRAGON', 'KNIGHT', 'WIZARD']),
  TECH: Object.freeze([
    'PASSWORD', 'FIREWALL', 'ROUTER', 'MALWARE', 'SERVER', 'CIRCUIT', 'SENSOR', 'DOWNLOAD', 'ANTIVIRUS', 'DATABASE', 'WIRELESS', 'HOLOGRAM',
    'LAPTOP', 'WIFI', 'KEYBOARD', 'MOUSE', 'MONITOR', 'SPEAKER', 'CHARGER', 'BATTERY', 'BLUETOOTH', 'EMAIL', 'WEBSITE', 'BROWSER', 'ROBOT',
    'COMPUTER', 'TABLET', 'SMARTPHONE', 'CAMERA', 'PRINTER', 'SCREEN', 'HEADSET', 'MICROPHONE', 'REMOTE', 'ANTENNA']),
  ANIMALS: Object.freeze([
    'BUNNY', 'KITTEN', 'PUPPY', 'HAMSTER', 'PENGUIN', 'DOLPHIN', 'OCTOPUS', 'GIRAFFE', 'ELEPHANT', 'KOALA', 'PANDA', 'RACCOON', 'HEDGEHOG',
    'FLAMINGO', 'SQUIRREL', 'TURTLE', 'BUTTERFLY', 'CROCODILE', 'KANGAROO', 'ZEBRA', 'MONKEY', 'PARROT', 'OTTER', 'WOLF', 'TIGER', 'LION', 'BEAR',
    'FROG', 'DUCK', 'SHARK', 'WHALE', 'JELLYFISH', 'LADYBUG', 'CHAMELEON', 'GORILLA']),
  HOME: Object.freeze([
    'HEADPHONES', 'HOODIE', 'UMBRELLA', 'SNACKS', 'STICKERS', 'PILLOW', 'BLANKET', 'POSTER', 'BEANBAG', 'BACKPACK', 'SNEAKERS', 'LAMP', 'PLUSHIE',
    'MIRROR', 'DESK', 'CHAIR', 'GUITAR', 'SKATEBOARD', 'CALENDAR', 'WINDOW', 'CURTAINS', 'CARPET', 'BOOKSHELF', 'NOTEBOOK', 'TOOTHBRUSH', 'CANDLE',
    'SLIPPERS', 'PAJAMAS', 'TOOLBOX', 'SCREWDRIVER', 'HAMMOCK', 'PLANT']),
});
export const LOCK_LABELS = Object.freeze({ FOOD: 'FOOD', GAMES: 'GAMES', TECH: 'TECH', ANIMALS: 'ANIMALS', HOME: 'AROUND THE HOUSE' });
export const LOCK_CATEGORIES = Object.freeze(Object.keys(LOCK_WORDS));
// Pace sets how many wrong guesses the face scan needs to lock on, which word lengths come up, and whether the category is shown.
const PACE = Object.freeze({
  chill: { misses: 7, min: 4, max: 7, hint: true },
  normal: { misses: 6, min: 5, max: 9, hint: true },
  hard: { misses: 5, min: 8, max: 13, hint: false },
});
const pace = value => LOCK_PACES.includes(value) ? value : 'normal';
const unit = random => Math.max(0, Math.min(.999999999, Number(random()) || 0));
const whole = (value, max) => Number.isSafeInteger(value) && value >= 0 && value <= max;
/** Every word for a pace, as [category, index] pairs into LOCK_WORDS. */
function poolFor(p) {
  const { min, max } = PACE[p], pool = [];
  for (const cat of LOCK_CATEGORIES) LOCK_WORDS[cat].forEach((word, index) => { if (word.length >= min && word.length <= max) pool.push(Object.freeze([cat, index])); });
  return Object.freeze(pool);
}
const POOLS = Object.freeze(Object.fromEntries(LOCK_PACES.map(p => [p, poolFor(p)])));
export const lockPool = value => POOLS[pace(value)];

export class LockscreenGame {
  constructor({ random = Math.random, onEvent = () => {}, saved, pace: chosen = 'normal' } = {}) {
    this.random = random; this.onEvent = onEvent; this.pace = pace(chosen); this.reset(); if (saved) this.restore(saved);
  }
  reset(chosen = this.pace) {
    this.pace = pace(chosen); this.status = 'idle'; this.score = 0; this.cracked = 0; this.used = []; this.cursor = 0;
    this.pick(); this.onEvent('reset');
  }
  get rules() { return PACE[this.pace]; }
  get word() { return LOCK_WORDS[this.category][this.index]; }
  get misses() { return [...this.guessed].filter(letter => !this.word.includes(letter)).length; }
  get left() { return this.rules.misses - this.misses; }
  get solved() { return [...this.word].every(letter => this.guessed.includes(letter)); }
  /** A fresh password, never one already cracked this run until the whole pool has been used. */
  pick() {
    const pool = lockPool(this.pace), fresh = pool.filter(([cat, i]) => !this.used.includes(`${cat}:${i}`));
    const from = fresh.length ? fresh : pool;
    if (!fresh.length) this.used = [];
    const [category, index] = from[Math.floor(unit(this.random) * from.length)];
    this.category = category; this.index = index; this.guessed = ''; this.phase = 'guess'; this.result = null; this.earned = 0; this.flash = null;
  }
  start() {
    if (this.status === 'playing') return;
    if (this.status === 'dead') this.reset();
    const resumed = this.status === 'paused'; this.status = 'playing'; this.onEvent(resumed ? 'resume' : 'start');
  }
  pause() { if (this.status === 'playing') { this.status = 'paused'; this.onEvent('pause'); } }
  togglePause() { if (this.status === 'playing') this.pause(); else if (this.status === 'paused') this.start(); }
  /** Guesses a letter, or the letter under the keyboard cursor. Repeats and non-letters do nothing. */
  guess(letter = LOCK_LETTERS[this.cursor]) {
    if (this.status !== 'playing' || this.phase !== 'guess') return false;
    letter = String(letter || '').toUpperCase();
    if (letter.length !== 1 || !LOCK_LETTERS.includes(letter) || this.guessed.includes(letter)) return false;
    this.guessed += letter; this.cursor = LOCK_LETTERS.indexOf(letter);
    const found = [...this.word].filter(ch => ch === letter).length;
    this.flash = { letter, hit: found > 0, age: 0 };
    if (!found) {
      this.onEvent('wrong', { letter, left: this.left });
      if (this.left === 1) this.onEvent('last', { letter });
      if (this.left <= 0) this.caught();
      return true;
    }
    this.onEvent('letter', { letter, found });
    if (found >= 3) this.onEvent('reveal', { letter, found });
    if (this.solved) this.crack();
    return true;
  }
  /** Each password pays 100, 10 a letter, 25 for every spare guess, and 20 more for each password already cracked this run. */
  crack() {
    const earned = 100 + this.word.length * 10 + this.left * 25 + this.cracked * 20;
    this.earned = earned; this.score = Math.min(999999999, this.score + earned); this.cracked++;
    this.used.push(`${this.category}:${this.index}`); this.phase = 'over'; this.result = 'cracked';
    this.onEvent('score', { score: this.score, earned }); this.onEvent('win', { word: this.word, earned });
  }
  caught() {
    this.phase = 'over'; this.result = 'caught'; this.status = 'dead';
    this.onEvent('death', { word: this.word, score: this.score });
  }
  /** After a cracked password, the next tap or key brings a new one. */
  nextWord() {
    if (this.status !== 'playing' || this.phase !== 'over') return;
    this.pick(); this.onEvent('round', { cracked: this.cracked });
  }
  moveCursor(dx, dy = 0) {
    const row = Math.floor(this.cursor / 9), col = this.cursor % 9;
    const r = Math.max(0, Math.min(2, row + dy)), c = Math.max(0, Math.min(8, col + dx));
    this.cursor = Math.min(LOCK_LETTERS.length - 1, r * 9 + c);
  }
  update(delta) {
    if (!Number.isFinite(delta) || delta <= 0 || !this.flash) return;
    this.flash.age += Math.min(delta, .12); if (this.flash.age > .6) this.flash = null;
  }
  snapshot() {
    return { version: 1, pace: this.pace, category: this.category, index: this.index, guessed: this.guessed, score: this.score, cracked: this.cracked,
      used: [...this.used], phase: this.phase, result: this.result, earned: this.earned, cursor: this.cursor,
      status: this.status === 'playing' ? 'paused' : this.status };
  }
  restore(data) {
    if (!data || data.version !== 1 || !LOCK_PACES.includes(data.pace) || !LOCK_CATEGORIES.includes(data.category) ||
      !whole(data.index, LOCK_WORDS[data.category]?.length - 1) || typeof data.guessed !== 'string' || !whole(data.score, 999999999) ||
      !whole(data.cracked, 100000) || !whole(data.earned, 999999999) || !whole(data.cursor, LOCK_LETTERS.length - 1) ||
      !Array.isArray(data.used) || data.used.length > 200 || !['guess', 'over'].includes(data.phase) || !['idle', 'paused', 'playing', 'dead'].includes(data.status)) return false;
    // Each letter once, letters only; the board must agree with the saved result.
    if (!/^[A-Z]*$/.test(data.guessed) || new Set(data.guessed).size !== data.guessed.length) return false;
    if (!data.used.every(key => typeof key === 'string' && /^[A-Z]+:\d+$/.test(key) && LOCK_WORDS[key.split(':')[0]]?.[+key.split(':')[1]])) return false;
    const word = LOCK_WORDS[data.category][data.index], misses = [...data.guessed].filter(l => !word.includes(l)).length, max = PACE[data.pace].misses;
    const solved = [...word].every(l => data.guessed.includes(l));
    if (data.phase === 'guess' && (data.result !== null || solved || misses >= max || data.status === 'dead')) return false;
    if (data.phase === 'over' && !(data.result === 'cracked' ? solved && data.status !== 'dead' : data.result === 'caught' && misses >= max && data.status === 'dead')) return false;
    if (data.status === 'dead' && data.phase !== 'over') return false;
    Object.assign(this, { pace: data.pace, category: data.category, index: data.index, guessed: data.guessed, score: data.score, cracked: data.cracked,
      used: [...data.used], phase: data.phase, result: data.result, earned: data.earned, cursor: data.cursor, flash: null });
    this.status = data.status === 'playing' ? 'paused' : data.status; return true;
  }
}
