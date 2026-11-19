import test from 'node:test';
import assert from 'node:assert/strict';
import { LockscreenGame, LOCK_PACES, LOCK_WORDS, LOCK_CATEGORIES, LOCK_LETTERS, lockPool } from '../src/lockscreen.js';
import { drawLockscreen, lockKeyAt } from '../src/lockscreen-render.js';

const playing = (options = {}) => { const g = new LockscreenGame({ random: () => .5, ...options }); g.start(); return g; };
const wrongLetters = g => [...LOCK_LETTERS].filter(ch => !g.word.includes(ch));

test('Lockscreen words: letters only, no repeats, and every difficulty has plenty in range', () => {
  const all = Object.values(LOCK_WORDS).flat();
  assert.ok(all.every(word => /^[A-Z]{4,13}$/.test(word))); assert.equal(new Set(all).size, all.length, 'no word appears twice');
  assert.deepEqual(LOCK_CATEGORIES, ['SWEETS', 'ARCADE', 'CYBER', 'GABU']);
  for (const pace of LOCK_PACES) {
    const pool = lockPool(pace); assert.ok(pool.length >= 40, `${pace} has enough words`);
    const lengths = pool.map(([cat, i]) => LOCK_WORDS[cat][i].length);
    assert.ok(Math.min(...lengths) >= { chill: 4, normal: 5, hard: 8 }[pace] && Math.max(...lengths) <= { chill: 7, normal: 9, hard: 13 }[pace]);
  }
});

test('found letters fill every slot they belong in; cracking pays for length, spare guesses and the streak', () => {
  const events = [], g = playing({ onEvent: e => events.push(e) }), word = g.word;
  assert.equal(g.guess(wrongLetters(g)[0]), true); assert.equal(g.misses, 1); assert.ok(events.includes('wrong'));
  assert.equal(g.guess(g.guessed), false, 'a repeated guess does nothing'); assert.equal(g.guess('7'), false); assert.equal(g.guess('ab'), false);
  for (const ch of new Set(word)) g.guess(ch.toLowerCase());
  assert.equal(g.phase, 'over'); assert.equal(g.result, 'cracked'); assert.ok(events.includes('win') && events.includes('letter'));
  assert.equal(g.score, 100 + word.length * 10 + (6 - 1) * 25, 'base, letters and five spare guesses on Normal');
  assert.equal(g.guess('Q'), false, 'no guessing while the result shows');
  g.nextWord(); assert.equal(g.phase, 'guess'); assert.equal(g.guessed, ''); assert.notEqual(`${g.category}:${g.index}`, g.used[0], 'a cracked password does not come straight back');
  for (const ch of new Set(g.word)) g.guess(ch);
  assert.equal(g.earned, 100 + g.word.length * 10 + 6 * 25 + 20, 'the second crack in a run earns the streak bonus');
});

test('every miss tightens the face scan; the last one locks you out and ends the run', () => {
  const events = [], g = playing({ pace: 'hard', onEvent: e => events.push(e) });
  const wrong = wrongLetters(g);
  for (let i = 0; i < 4; i++) g.guess(wrong[i]);
  assert.equal(g.left, 1); assert.ok(events.includes('last'), 'Gabu warns before the final part');
  g.guess(wrong[4]); assert.equal(g.status, 'dead'); assert.equal(g.result, 'caught'); assert.ok(events.includes('death'));
  assert.equal(g.guess(wrong[5]), false);
  g.start(); assert.equal(g.status, 'playing'); assert.equal(g.score, 0); assert.equal(g.cracked, 0); assert.equal(g.misses, 0);
});

test('difficulty sets the misses allowed, the word lengths and whether the category shows', () => {
  const [chill, normal, hard] = LOCK_PACES.map(pace => playing({ pace }));
  assert.deepEqual([chill.rules.misses, normal.rules.misses, hard.rules.misses], [7, 6, 5]);
  assert.equal(chill.rules.hint, true); assert.equal(hard.rules.hint, false);
  assert.ok(hard.word.length >= 8 && chill.word.length <= 7);
  assert.equal(new LockscreenGame({ pace: 'turbo' }).pace, 'normal');
  const reveal = []; const g = new LockscreenGame({ random: () => .5, onEvent: e => reveal.push(e) }); g.start();
  g.category = 'SWEETS'; g.index = LOCK_WORDS.SWEETS.indexOf('MARSHMALLOW'); g.guess('L');
  assert.ok(!reveal.includes('reveal')); g.guess('M'); g.guess('A'); assert.ok(!reveal.includes('reveal'), 'two of a letter is not a cluster');
});

test('the keyboard cursor moves on the 9-9-8 grid and Enter guesses its letter', () => {
  const g = playing(); g.cursor = 0;
  g.moveCursor(1); g.moveCursor(0, 1); assert.equal(LOCK_LETTERS[g.cursor], 'K');
  g.moveCursor(20, 20); assert.equal(LOCK_LETTERS[g.cursor], 'Z', 'the cursor stays on the keyboard');
  g.moveCursor(-20, -20); assert.equal(g.cursor, 0);
  g.guess(); assert.equal(g.guessed, 'A');
});

test('Lockscreen saves restore paused and reject tampered boards', () => {
  const g = playing({ pace: 'chill' }); g.guess(wrongLetters(g)[0]); g.guess(g.word[0]);
  const saved = g.snapshot(), back = new LockscreenGame({ saved });
  assert.equal(back.status, 'paused'); assert.equal(back.word, g.word); assert.equal(back.guessed, g.guessed); assert.equal(back.misses, 1);
  assert.equal(JSON.stringify(saved).includes(g.word), false, 'the save names the list and position, not the word');
  const bad = patch => new LockscreenGame().restore({ ...saved, ...patch });
  assert.equal(bad({ guessed: 'AA' }), false); assert.equal(bad({ guessed: 'a' }), false); assert.equal(bad({ category: 'SECRETS' }), false);
  assert.equal(bad({ index: 999 }), false); assert.equal(bad({ guessed: LOCK_LETTERS }), false, 'a live board cannot be over the miss limit');
  assert.equal(bad({ phase: 'over', result: 'cracked' }), false, 'a cracked board must be solved');
  assert.equal(bad({ status: 'dead' }), false); assert.equal(bad({ used: ['SWEETS:999'] }), false); assert.equal(bad({ pace: 'turbo' }), false);
});

test('the Lockscreen renderer draws every state and the keys hit-test where they are drawn', () => {
  assert.equal(LOCK_LETTERS[lockKeyAt(20, 275)], 'A'); assert.equal(LOCK_LETTERS[lockKeyAt(160, 345)], 'V'); assert.equal(LOCK_LETTERS[lockKeyAt(330, 320)], 'R');
  assert.equal(lockKeyAt(5, 5), -1); assert.equal(lockKeyAt(180, 345), -1, 'the gap between keys is not a key'); assert.equal(lockKeyAt(20, 345), -1, 'the short bottom row is centered');
  const text = [];
  const ctx = new Proxy({ createLinearGradient: () => ({ addColorStop() {} }) }, {
    get(target, name) { return name in target ? target[name] : (...args) => { if (name === 'fillText') text.push(args[0]); }; },
    set(target, name, value) { target[name] = value; return true; },
  });
  const canvas = { width: 720, height: 904, getContext: () => ctx }, g = new LockscreenGame({ random: () => .5 });
  drawLockscreen(canvas, g, {}); g.start(); g.guess(g.word[0]); drawLockscreen(canvas, g, { cursor: true, time: 1 });
  for (const ch of new Set(g.word)) g.guess(ch); drawLockscreen(canvas, g, {});
  g.nextWord(); g.pause(); drawLockscreen(canvas, g, {}); g.start();
  for (const ch of wrongLetters(g)) g.guess(ch); drawLockscreen(canvas, g, { reduced: true });
  for (const label of ['GABU’S LOCKSCREEN', 'ACCESS GRANTED', 'PAUSED', 'LOCKED OUT']) assert.ok(text.includes(label), label);
  const hard = new LockscreenGame({ pace: 'hard', random: () => .5 }); hard.start(); text.length = 0; drawLockscreen(canvas, hard, {});
  assert.ok(text.includes('CATEGORY HIDDEN') && !text.includes(hard.category), 'Hard keeps the category secret until the end');
});
