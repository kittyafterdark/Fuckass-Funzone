/**
 * Developer-only, deterministic legal-play smoke test. This is a limited greedy
 * policy, not an estimate of player win rates. No scores, money, decks or round
 * counters are changed by the harness. Only selection is assigned temporarily
 * while inspecting the same pure preview available to the player.
 *
 * node scripts/gambit-balance.mjs --seeds 6
 * node scripts/gambit-balance.mjs --seeds 12 --decks classic,velvet,scholar --trace
 * --all-packs also buys Craft and Playing Card packs; the default reproduces the
 * initial balance pass using Joker and Upgrade packs only. JSON goes to stdout.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { GambitGame, GAMBIT_DECKS } from '../src/gambit.js';
import { gambitCardData } from '../src/gambit-rules.js';

const args = process.argv.slice(2);
const argument = (name, fallback) => {
  const index = args.indexOf(name);
  return index < 0 ? fallback : args[index + 1];
};
const seedCount = Number(argument('--seeds', 6));
const firstSeed = Number(argument('--first-seed', 1));
const deckIds = String(argument('--decks', GAMBIT_DECKS.map(deck => deck.id).join(','))).split(',');
const allPacks = args.includes('--all-packs'), includeAllTraces = args.includes('--trace');
if (!Number.isSafeInteger(seedCount) || seedCount < 1 || seedCount > 1000 ||
    !Number.isSafeInteger(firstSeed) || firstSeed < 1 || firstSeed + seedCount > 0xffffffff ||
    !deckIds.length || new Set(deckIds).size !== deckIds.length || deckIds.some(id => !GAMBIT_DECKS.some(deck => deck.id === id))) {
  throw Error('Use --seeds 1..1000, --first-seed 1..4294967294 and comma-separated valid --decks.');
}

const priorities = ['paper_trail', 'repeat_customer', 'snowball', 'growing_appetite', 'coin_cathedral',
  'practice_makes', 'compost_heap', 'second_thought', 'skinny_dip', 'night_school', 'book_worm',
  'crowd_funding', 'five_alarm', 'royal_reserve', 'curtain_call', 'tiny_echo', 'encore',
  'wide_awake', 'cut_corners', 'three_wishes', 'even_odds'];
const jokerValue = id => priorities.includes(id) ? priorities.length - priorities.indexOf(id) : 0;
const worstJoker = game => game.jokers.reduce((worst, id, index) => jokerValue(id) < jokerValue(game.jokers[worst]) ? index : worst, 0);
const worthwhile = (game, id) => !game.jokers.includes(id) &&
  (game.jokers.length < game.jokerSlots || jokerValue(id) > jokerValue(game.jokers[worstJoker(game)]));

function verifySave(game, action) {
  const snapshot = game.snapshot(), restored = new GambitGame({ seed: 1 });
  assert.equal(restored.restore(snapshot), true, `${action}: save must restore`);
  assert.deepEqual(restored.snapshot(), snapshot, `${action}: reload must preserve every persisted field`);
}

function bestPlay(game) {
  const before = game.selected, rng = game.rngState;
  let best = null;
  try {
    for (let mask = 1; mask < 2 ** game.hand.length; mask++) {
      const cards = game.hand.filter((_, index) => mask & (1 << index));
      if (cards.length > 5) continue;
      game.selected = cards;
      const report = game.preview();
      if (report && (!best || report.total > best.report.total || report.total === best.report.total && cards.length < best.cards.length))
        best = { cards, report };
    }
  } finally {
    game.selected = before;
    assert.equal(game.rngState, rng, 'searching previews must never consume run RNG');
  }
  return best;
}

function select(game, cards) {
  for (const id of [...game.selected]) assert.equal(game.toggleCard(id), true);
  for (const id of cards) assert.equal(game.toggleCard(id), true);
}

function replacement(game, trace) {
  if (game.phase !== 'replace') return;
  const incoming = game.pendingJoker, index = worstJoker(game);
  if (jokerValue(incoming) > jokerValue(game.jokers[index])) {
    trace.push({ action: 'replace', round: game.round, remove: game.jokers[index], add: incoming });
    assert.equal(game.replaceJoker(index), true);
  } else assert.equal(game.skipPack(), true);
  verifySave(game, 'replacement');
}

function optionValue(game, option) {
  if (option.kind === 'joker') return worthwhile(game, option.id) ? 100 + jokerValue(option.id) : -1;
  if (option.kind === 'hand') return 20 + (game.stats.handCounts[option.id] || 0);
  if (option.kind === 'card') return 1;
  const face = gambitCardData(option.id, game.cardMods);
  if (option.kind === 'remove') return (face.rank > 1 && face.rank < 6 ? 4 : 1) + (game.jokers.includes('skinny_dip') ? 10 : 0);
  if (option.kind === 'playing') return ({ glass: 12, steel: 10, mult: 6, bonus: 4, gold: 2 }[option.enhancement] || 0) + (option.seal === 'red' ? 5 : 0);
  if (option.kind === 'modify') return ({ glass: 15, steel: 12, mult: 8, bonus: 6, gold: 3 }[option.enhancement] || 0) +
    ({ red: 12, blue: 9, gold: 4 }[option.seal] || 0) + (option.suit !== undefined && game.deckPreset === 'velvet' && [0, 3].includes(option.suit) ? 5 : 0);
  return -1;
}

function claimChoices(game, trace) {
  while (game.phase === 'pack' || game.phase === 'replace') {
    if (game.phase === 'replace') { replacement(game, trace); continue; }
    const options = game.pack.options.map((option, index) => ({ option, index, value: optionValue(game, option) }))
      .filter(item => !game.pack.claimed.includes(item.index) && game.optionAvailable(item.option))
      .sort((a, b) => b.value - a.value || a.index - b.index);
    if (!options.length || options[0].value < 0) { assert.equal(game.skipPack(), true); verifySave(game, 'skip pack'); continue; }
    const choice = options[0];
    assert.equal(game.selectPack(choice.index), true); verifySave(game, 'select paid pack choice');
    trace.push({ action: 'claim', round: game.round, kind: game.pack.kind, choice: choice.option });
    assert.equal(game.claimPack(), true); verifySave(game, 'claim paid pack choice');
  }
}

function buyJokers(game, trace) {
  for (let index = 0; index < 2; index++) {
    const offer = game.shop[index];
    if (offer.sold || game.money < offer.price || !worthwhile(game, offer.id)) continue;
    trace.push({ action: 'buy Joker', round: game.round, id: offer.id, price: offer.price });
    assert.equal(game.buy(index), true); verifySave(game, 'buy Joker'); replacement(game, trace);
  }
}

function shop(game, trace) {
  buyJokers(game, trace);
  for (let index = 2; index < 4; index++) {
    const offer = game.shop[index];
    if (offer.sold || game.money < offer.price || !allPacks && !['joker', 'upgrade'].includes(offer.pack)) continue;
    trace.push({ action: 'buy pack', round: game.round, kind: offer.pack, size: offer.size, price: offer.price });
    assert.equal(game.buy(index), true); verifySave(game, 'buy pack'); claimChoices(game, trace);
  }
  if (game.money >= 12) {
    trace.push({ action: 'reroll', round: game.round, price: game.rerollPrice });
    assert.equal(game.rerollShop(), true); verifySave(game, 'paid reroll'); buyJokers(game, trace);
  }
  assert.equal(game.nextRound(), true); verifySave(game, 'next blind');
}

function simulate(seed, deck) {
  const game = new GambitGame({ seed });
  assert.equal(game.chooseDeck(deck), true); game.reset(seed); game.start();
  const trace = [];
  let highestHand = 0, highestTargetCleared = 0, actions = 0, stopped = null;
  while (game.status === 'playing' && game.phase !== 'victory' && actions++ < 600) {
    if (game.phase === 'shop') { shop(game, trace); continue; }
    assert.equal(game.phase, 'play', 'each blind must return to a playable state');
    const best = bestPlay(game);
    if (!best) {
      if (game.discardsLeft > 0 && game.deck.length > 0) {
        const suits = [0, 1, 2, 3].map(suit => game.hand.filter(id => gambitCardData(id, game.cardMods).suit === suit));
        const keep = suits.sort((a, b) => b.length - a.length)[0];
        const discards = game.hand.filter(id => !keep.includes(id)).slice(0, 5);
        select(game, discards.length ? discards : game.hand.slice(0, 5));
        assert.equal(game.discardSelected(), true); verifySave(game, 'discard to find a legal category'); continue;
      }
      stopped = 'No legal category remains in the current hand and no discard can draw new cards.';
      trace.push({ action: 'policy stopped', round: game.round, reason: stopped }); break;
    }
    const needed = (game.target - game.roundScore) / game.playsLeft;
    if (best.report.total < needed * .65 && game.discardsLeft > 0 && game.deck.length > 0) {
      const discards = game.hand.filter(id => !best.cards.includes(id)).slice(0, 5);
      select(game, discards.length ? discards : [game.hand[0]]);
      assert.equal(game.discardSelected(), true); verifySave(game, 'discard'); continue;
    }
    select(game, best.cards);
    assert.equal(game.playHand(), true); verifySave(game, 'play');
    highestHand = Math.max(highestHand, game.lastResult.total);
    trace.push({ action: 'play', round: game.round, boss: game.boss?.id || null, target: game.target,
      hand: best.report.id, cards: best.cards, chips: best.report.chips, mult: best.report.mult,
      total: best.report.total, roundScore: game.roundScore, money: game.money });
    if (game.roundScore >= game.target) highestTargetCleared = Math.max(highestTargetCleared, game.target);
    assert.equal(game.continueScore(), true); verifySave(game, 'continue score');
  }
  assert.ok(actions < 600, 'simulation must terminate without an action loop');
  return { seed, deck, won: game.won, phase: game.phase, stopped, roundReached: game.round,
    roundsCleared: game.stats.roundsCleared, highestTargetCleared, highestHand, score: game.score,
    jokers: [...game.jokers], handLevels: { ...game.handLevels }, stats: { ...game.stats }, trace };
}

const results = [];
for (const deck of deckIds) for (let offset = 0; offset < seedCount; offset++) results.push(simulate(firstSeed + offset, deck));
const strongest = results.reduce((best, run) => !best || run.score > best.score ? run : best, null);
const byDeck = Object.fromEntries(deckIds.map(deck => {
  const runs = results.filter(run => run.deck === deck);
  return [deck, { runs: runs.length, wins: runs.filter(run => run.won).length,
    averageRoundsCleared: runs.reduce((sum, run) => sum + run.roundsCleared, 0) / runs.length,
    highestTargetCleared: Math.max(...runs.map(run => run.highestTargetCleared)),
    highestHand: Math.max(...runs.map(run => run.highestHand)) }];
}));
console.log(JSON.stringify({
  warning: 'Greedy development heuristic, not player win-rate evidence. All committed actions use game methods; every action save is restored and compared.',
  settings: { firstSeed, seedCount, decks: deckIds, allPacks, policy: 'max-score hand search; weak-hand discards; fixed growth-Joker priorities; frequent-hand levels; one affordable reroll per shop' },
  sourceHashes: Object.fromEntries(['gambit.js', 'gambit-rules.js'].map(name => [name, createHash('sha256').update(readFileSync(new URL('../src/' + name, import.meta.url))).digest('hex')])),
  runs: results.length, wins: results.filter(run => run.won).length, byDeck,
  clearedHistogram: Object.fromEntries([...new Set(results.map(run => run.roundsCleared))].sort((a, b) => a - b).map(round => [round, results.filter(run => run.roundsCleared === round).length])),
  strongest,
  results: results.map(run => includeAllTraces ? run : Object.fromEntries(Object.entries(run).filter(([key]) => key !== 'trace'))),
}, null, 2));
