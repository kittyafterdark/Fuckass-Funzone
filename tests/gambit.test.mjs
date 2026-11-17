import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { GambitGame, GAMBIT_TARGETS } from '../src/gambit.js';

const legacyFixtures=JSON.parse(fs.readFileSync(new URL('./fixtures/gambit-v1.json',import.meta.url),'utf8'));
const create = (options = {}) => new GambitGame({ seed: 12345, ...options });
const allCards = () => Array.from({ length: 52 }, (_, id) => id);
function assertDeck(game) {
  const cards = [...game.deck, ...game.hand, ...game.discard];
  assert.equal(cards.length, 52); assert.equal(new Set(cards).size, 52);
  assert.deepEqual([...cards].sort((a, b) => a - b), allCards());
}
function handFixture(game, cards) {
  const remaining = allCards().filter(id => !cards.includes(id));
  game.hand = [...cards, ...remaining.splice(0, 8 - cards.length)];
  game.deck = remaining; game.discard = []; game.selected = [];
  assertDeck(game);
}
function select(game, cards) { for (const id of cards) assert.equal(game.toggleCard(id), true); }
function clearRound(game) {
  // Set up one known legal scoring hand; do not bypass the scoring/clear transition.
  handFixture(game, [0, 9, 10, 11, 12]);
  game.roundScore = game.target - 1; game.score = Math.max(game.score, game.roundScore);
  select(game, game.boss?.id==='narrow_gate'?[0,9,10]:[0,9,10,11,12]); assert.equal(game.playHand(), true);
  assert.equal(game.phase, 'score'); assert.equal(game.continueScore(), true);
}
function shopping(options = {}) { const game = create(options); game.start(); clearRound(game); return game; }

test('seeded deals conserve a standard deck and cap selection without treating card zero as absent', () => {
  const game = create(), same = create(), different = create({ seed: 12346 });
  assert.deepEqual(game.snapshot(), same.snapshot()); assert.notDeepEqual(game.hand, different.hand);
  assert.equal(game.hand.length, 8); assertDeck(game);
  assert.equal(game.toggleCard(game.hand[0]), false, 'idle table does not play behind its overlay');
  game.start(); handFixture(game, [0, 1, 2, 3, 4, 5, 6, 7]);
  assert.equal(game.toggleCard(0), true); assert.ok(game.selected.includes(0));
  for (const id of [1, 2, 3, 4]) assert.equal(game.toggleCard(id), true);
  assert.equal(game.toggleCard(5), false); assert.equal(game.toggleCard(99), false);
  assert.equal(game.selected.length, 5); assert.equal(game.toggleCard(0), true);
  assert.equal(game.toggleCard(5), true); assertDeck(game);
});

test('rank and suit sorting preserve selected identities, run resources, random state, and reload order', () => {
  let observed;
  const game = create({ onEvent: event => { if (event === 'sort') observed = game.snapshot(); } });
  assert.equal(game.sortHand('rank'), false, 'idle sorting does not change a run');
  game.start(); handFixture(game, [1, 26, 12, 39, 15, 8, 38, 27]); select(game, [39, 15]);
  const before = game.snapshot();
  assert.equal(game.sortHand('rank'), true);
  assert.deepEqual(game.hand, [26, 39, 12, 38, 8, 15, 1, 27], 'Aces rank high with deterministic suit ties');
  assert.deepEqual(observed, game.snapshot(), 'sort observers see the final order');
  assert.deepEqual(game.selected, [39, 15], 'sorting moves cards without changing the selected identities');
  assert.deepEqual({ ...game.snapshot(), hand: before.hand }, before, 'only hand order changes');
  assert.equal(game.sortHand('suit'), true);
  assert.deepEqual(game.hand, [12, 8, 1, 15, 26, 38, 27, 39], 'suits group Clubs, Diamonds, Spades, Hearts with ranks descending');
  assertDeck(game);
  const sorted = game.snapshot(), restored = create({ saved: sorted });
  assert.equal(restored.status, 'paused'); assert.deepEqual(restored.snapshot(), sorted);
  assert.equal(game.sortHand('invalid'), false); assert.deepEqual(game.snapshot(), sorted);
  game.pause(); const paused = game.snapshot();
  assert.equal(game.sortHand('rank'), false); assert.deepEqual(game.snapshot(), paused);
  game.start(); game.playHand(); const scoring = game.snapshot();
  assert.equal(game.sortHand('suit'), false); assert.deepEqual(game.snapshot(), scoring, 'sorting is unavailable during scoring');
});

test('plays use the visible preview once, pause freezes score animation, and Continue is explicit', () => {
  const game = create(); game.start(); handFixture(game, [1, 14, 2, 16, 31, 42, 8, 24]);
  assert.equal(game.playHand(), false); assert.equal(game.playsLeft, 4);
  select(game, [1, 14]); const preview = game.preview(); assert.ok(preview.total > 0);
  assert.equal(game.playHand(), true); assert.equal(game.phase, 'score');
  assert.equal(game.lastResult.total, preview.total); assert.equal(game.score, preview.total);
  assert.equal(game.playsLeft, 3); assert.equal(game.selected.length, 0); assertDeck(game);
  const afterPlay = game.snapshot();
  const restoredScore = create({ saved: afterPlay });
  assert.equal(restoredScore.status, 'paused'); assert.deepEqual(restoredScore.lastResult, preview);
  restoredScore.start(); restoredScore.continueScore();
  assert.equal(restoredScore.score, preview.total, 'resuming the score screen does not score the hand twice');
  assert.equal(game.playHand(), false); assert.equal(game.discardSelected(), false);
  assert.deepEqual(game.snapshot(), afterPlay, 'a scored hand cannot be replayed');
  game.pause(); const paused = game.snapshot(); game.update(.12); game.update(999);
  assert.equal(game.continueScore(), false); assert.deepEqual(game.snapshot(), paused);
  game.start(); for (let i = 0; i < 30; i++) game.update(.12);
  assert.equal(game.phase, 'score', 'reading the breakdown never auto-dismisses it');
  assert.equal(game.scoreTime, 1.2); assert.equal(game.continueScore(), true);
  assert.equal(game.phase, 'play'); assert.equal(game.score, preview.total);
});

test('discard choices spend one resource, refill the hand, and stop at the round limit', () => {
  const game = create(); game.start(); const startDeck = game.deck.length;
  assert.equal(game.discardSelected(), false); assert.equal(game.discardsLeft, 3);
  for (let i = 0; i < 3; i++) {
    select(game, game.hand.slice(0, 2)); assert.equal(game.discardSelected(), true);
    assert.equal(game.hand.length, 8); assert.equal(game.discardsLeft, 2 - i); assertDeck(game);
  }
  assert.equal(game.deck.length, startDeck - 6); assert.equal(game.score, 0);
  select(game, [game.hand[0]]); const before = game.snapshot();
  assert.equal(game.discardSelected(), false); assert.deepEqual(game.snapshot(), before);
});

test('round success pays once, redeals for each blind, and eight Antes unlock optional Endless', () => {
  const game = create(); game.start();
  for (let round = 1; round <= 24; round++) {
    const money = game.money; assert.equal(game.round, round); assert.ok(game.target >= GAMBIT_TARGETS[round - 1]);
    clearRound(game); assertDeck(game);
    if (round < 24) {
      assert.equal(game.phase, 'shop'); assert.ok(game.money >= money + 6 + game.playsLeft);
      const save = game.snapshot(); assert.equal(game.continueScore(), false);
      assert.deepEqual(game.snapshot(), save, 'a cleared round cannot pay again');
      assert.equal(game.nextRound(), true); assert.equal(game.playsLeft, game.maxPlays); assert.equal(game.discardsLeft, game.maxDiscards);
      assert.equal(game.roundScore, 0); assert.equal(game.hand.length, 8); assert.equal(game.phase, 'play');
    }
  }
  assert.equal(game.phase, 'victory'); assert.equal(game.won, true); assert.equal(game.finishRun(),true);
  assert.equal(game.nextRound(), false); assert.equal(game.playHand(), false);
  const restored = create({ saved: game.snapshot() }); assert.equal(restored.won, true); assert.equal(restored.status, 'dead');
});

test('four unsuccessful plays end the run with a restorable loss', () => {
  const game = create(); game.start(); game.jokers = [];
  for (let i = 0; i < 4; i++) { select(game, [game.hand[0]]); assert.equal(game.playHand(), true); game.continueScore(); }
  assert.equal(game.status, 'dead'); assert.equal(game.won, false); assert.equal(game.playsLeft, 0);
  const restored = create({ saved: game.snapshot() }); assert.deepEqual(restored.snapshot(), game.snapshot());
});

test('paid booster choices and seeded future offers survive reload without a second charge or reroll', () => {
  const game = shopping(); const money = game.money;
  assert.equal(game.claimPack(), false); assert.equal(game.buy(2), true);
  assert.equal(game.phase, 'pack'); assert.equal(game.money, money - 4); assert.equal(game.shop[2].sold, true);
  assert.equal(game.pack.options.length, 3); assert.equal(game.claimPack(), false, 'claim requires an explicit selection');
  game.selectPack(1); const paid = game.snapshot();
  const restored = create({ seed: 99, saved: paid });
  assert.equal(restored.status, 'paused'); assert.deepEqual(restored.snapshot(), paid);
  restored.start(); assert.equal(restored.buy(2), false); assert.equal(restored.money, money - 4);
  const expected = restored.pack.options[1].id; assert.equal(restored.claimPack(), true);
  assert.ok(restored.jokers.includes(expected)); assert.equal(restored.phase, 'shop');
  assert.equal(restored.money, money - 4); assert.equal(restored.buy(2), false);
  game.claimPack(); assert.deepEqual(restored.snapshot(), game.snapshot());
  restored.nextRound(); game.nextRound(); assert.deepEqual(restored.hand, game.hand, 'restored RNG resumes the same next deal');
});

test('a full Joker row requires replacement, paid skips stay spent, and upgrades persist', () => {
  const game = shopping(); game.money=99; assert.equal(game.buy(0), true); assert.equal(game.buy(1), true);
  game.jokers.push(...game.availableJokers().slice(0,2));
  assert.equal(game.jokers.length, 5); assert.equal(game.buy(2), true);
  const offered = game.pack.options[0].id, old = [...game.jokers]; game.selectPack(0); game.claimPack();
  assert.equal(game.phase, 'replace'); assert.equal(game.pendingJoker, offered); assert.deepEqual(game.jokers, old);
  const saved = game.snapshot(), restored = create({ saved }); restored.start();
  assert.equal(restored.replaceJoker(1), true); assert.equal(restored.jokers[1], offered);
  assert.equal(restored.phase, 'shop'); assert.equal(restored.jokers.length, 5);
  assert.equal(restored.replaceJoker(1), false); assert.equal(restored.money, saved.money);
  assert.equal(game.skipPack(), true); assert.deepEqual(game.jokers, old); assert.equal(game.money, saved.money);
  assert.equal(game.buy(2), false, 'abandoning a paid pack does not make it buyable again');
  assert.equal(game.buy(3), true); const upgrade = game.pack.options[0];
  assert.equal(upgrade.kind, 'hand'); game.selectPack(0); game.claimPack();
  assert.equal(game.handLevels[upgrade.id], 1); assert.equal(game.pack, null);
  const upgraded = create({ saved: game.snapshot() }); assert.equal(upgraded.handLevels[upgrade.id], 1);
  const beforeSale = game.money; assert.equal(game.sellJoker(0), true); assert.equal(game.money, beforeSale + 2);
  assert.equal(game.jokers.length, 4); assert.equal(game.sellJoker(99), false);
});

test('a card enhancement remains tied to its card across reload and the next shuffled round', () => {
  const game = create({saved:legacyFixtures.shop}); game.start(); game.buy(3);
  const index = game.pack.options.findIndex(option => option.kind === 'card'); assert.ok(index >= 0);
  const id = game.pack.options[index].id; game.selectPack(index); game.claimPack();
  assert.equal(game.cardBoosts[id], 10);
  const restored = create({ saved: game.snapshot() }); restored.start(); restored.nextRound();
  assert.equal(restored.cardBoosts[id], 10); assertDeck(restored);
  handFixture(restored, [id]); select(restored, [id]);
  const enhanced = restored.preview(); restored.cardBoosts = {}; const plain = restored.preview();
  assert.equal(enhanced.chips, plain.chips + 10);
  assert.equal(enhanced.total - plain.total, 10 * plain.mult, 'the specific enhanced card changes actual scoring');
});

test('corrupt saves fail atomically, unknown fields cannot overwrite game behavior, and packs require payment', () => {
  const game = create(), before = game.snapshot();
  const invalid = [null, {}, { ...before, rngState: 0 }, { ...before, money: NaN },
    { ...before, hand: before.hand.slice(1) }, { ...before, selected: [99] },
    { ...before, jokers: ['pair_gremlin', 'pair_gremlin'] }, { ...before, handLevels: { pair: 1000 } },
    { ...before, cardBoosts: { 0: 15 } }, { ...before, phase: 'shop' }, { ...before, won: true }];
  const sparse = structuredClone(before); delete sparse.hand[0]; invalid.push(sparse);
  for (const data of invalid) { assert.equal(game.restore(data), false); assert.deepEqual(game.snapshot(), before); }
  assert.equal(game.restore({ ...before, onEvent: null, preview: null, target: 999 }), true);
  assert.equal(typeof game.preview, 'function'); assert.equal(typeof game.onEvent, 'function'); assert.equal(game.target, GAMBIT_TARGETS[0]);
  game.start(); assert.equal(game.status, 'playing');
  const buyer = shopping(); buyer.buy(2); const pack = buyer.snapshot(); pack.shop[2].sold = false;
  assert.equal(game.restore(pack), false, 'reload cannot claim a pack without its persisted purchase');
  const maxed = buyer.snapshot(); maxed.pack = { kind: 'upgrade', options: [{ kind: 'hand', id: 'pair' }], selected: 0 };
  maxed.shop[3].sold = true; maxed.handLevels.pair = 999;
  assert.equal(game.restore(maxed), false, 'packs cannot promise an already capped upgrade');
});

test('significant game events expose coherent snapshots, including packs and terminal states', () => {
  let game; const events = [];
  game = create({ onEvent: event => {
    if (!game) return;
    events.push(event); const snapshot = game.snapshot(), receiver = create();
    assert.equal(receiver.restore(snapshot), true, `${event} must expose a restorable state`);
  } });
  game.start(); clearRound(game); game.buy(0); game.buy(1); game.buy(2); game.selectPack(0); game.claimPack(); game.replaceJoker(0);
  game.buy(3); game.selectPack(0); game.claimPack(); game.sellJoker(0); game.nextRound();
  for (let round = 2; round <= 24; round++) { clearRound(game); if (round < 24) game.nextRound(); }
  assert.ok(events.includes('win')); assert.ok(events.includes('purchase')); assert.ok(events.includes('upgrade'));
  game.reset(1); game.start(); game.jokers = [];
  for (let i = 0; i < 4; i++) { select(game, [game.hand[0]]); game.playHand(); game.continueScore(); }
  assert.ok(events.includes('death'));
});
