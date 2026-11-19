import test from 'node:test';
import assert from 'node:assert/strict';
import { GAMBIT_HANDS, GAMBIT_JOKERS, evaluateGambitHand, scoreGambitHand, gambitCardData, gambitJokerModifiers, gambitJokerPayout, GAMBIT_SCORE_LIMIT } from '../src/gambit-rules.js';

const card = (rank, suit = 0) => suit * 13 + rank - 1;
const evaluate = (...cards) => evaluateGambitHand(cards);

test('all nine categories are recognized, including Ace-low and Ace-high straights', () => {
  assert.equal(evaluate(card(1), card(4, 1), card(8, 2)).id, 'high_card');
  assert.equal(evaluate(card(7), card(7, 1)).id, 'pair');
  assert.equal(evaluate(card(7), card(7, 1), card(12), card(12, 2)).id, 'two_pair');
  assert.equal(evaluate(card(8), card(8, 1), card(8, 2), card(3)).id, 'three_kind');
  assert.equal(evaluate(card(1), card(2, 1), card(3, 2), card(4, 3), card(5)).id, 'straight');
  assert.equal(evaluate(card(10), card(11, 1), card(12, 2), card(13, 3), card(1)).id, 'straight');
  assert.equal(evaluate(card(2, 1), card(4, 1), card(7, 1), card(11, 1), card(13, 1)).id, 'flush');
  assert.equal(evaluate(card(8), card(8, 1), card(8, 2), card(3), card(3, 3)).id, 'full_house');
  assert.equal(evaluate(card(8), card(8, 1), card(8, 2), card(8, 3), card(3)).id, 'four_kind');
  assert.equal(evaluate(card(1, 3), card(2, 3), card(3, 3), card(4, 3), card(5, 3)).id, 'straight_flush');
  assert.equal(evaluate(card(12), card(13, 1), card(1, 2), card(2, 3), card(3)).id, 'high_card', 'Ace cannot wrap through King to Two');
});

test('only contributing cards score; kicks and extra cards cannot trigger scoring-card boosts', () => {
  const pair = [card(5), card(5, 1), card(1, 3), card(11, 2), card(9, 2)];
  assert.deepEqual(evaluateGambitHand(pair).scoringCards, pair.slice(0, 2));
  const score = scoreGambitHand(pair, ['heart_hoarder', 'pocket_ace', 'face_value']);
  assert.equal(score.total, 40, '(10 base + two Fives) × 2');
  assert.equal(score.steps.length, 2, 'non-scoring Heart, Ace, and face card trigger nothing');
  const twoPair = [card(2), card(2, 1), card(13), card(13, 2), card(1, 3)];
  assert.deepEqual(evaluateGambitHand(twoPair).scoringCards, twoPair.slice(0, 4));
  const four = [card(2), card(2, 1), card(2, 2), card(2, 3), card(1)];
  assert.deepEqual(evaluateGambitHand(four).scoringCards, four.slice(0, 4));
  const trips = [card(3), card(3, 1), card(3, 2), card(13), card(1, 3)];
  assert.deepEqual(evaluateGambitHand(trips).scoringCards, trips.slice(0, 3));
  assert.deepEqual(evaluate(card(3), card(1, 1), card(13, 3)).scoringCards, [card(1, 1)]);
});

test('flushes and straights need five cards, while a full house scores all five', () => {
  assert.equal(evaluate(card(2), card(3), card(4), card(5)).id, 'high_card');
  const full = [card(9), card(9, 1), card(9, 2), card(4, 1), card(4, 2)];
  assert.deepEqual(evaluateGambitHand(full).scoringCards, full);
  assert.equal(scoreGambitHand(full, ['pair_gremlin']).mult, 8, 'a full house contains a repeated rank');
});

test('Jokers resolve flat chips, added Mult, then multiplied Mult regardless of slot order', () => {
  const pair = [card(7), card(7, 3)];
  const jokers = ['last_laugh', 'pair_gremlin', 'heart_hoarder'];
  const first = scoreGambitHand(pair, jokers, {}, { playsLeft: 1 });
  assert.equal(first.chips, 44); assert.equal(first.mult, 9); assert.equal(first.total, 396);
  assert.deepEqual(first.steps.slice(2).map(step => step.label.split(':')[0]), ['Heart Hoarder', 'Pair Gremlin', 'Last Laugh']);
  const reversed = scoreGambitHand(pair, [...jokers].reverse(), {}, { playsLeft: 1 });
  assert.equal(reversed.total, first.total);
  assert.equal(scoreGambitHand(pair, jokers, {}, { playsLeft: 2 }).mult, 6);
});

test('hand levels and individual card enhancements affect the preview without mutation', () => {
  const cards = [card(6), card(6, 1), card(1, 2)];
  const levels = { pair: 2 }, cardBoosts = { [cards[0]]: 10, [cards[2]]: 30 };
  const initial = structuredClone({ cards, levels, cardBoosts });
  const score = scoreGambitHand(cards, [], levels, { cardBoosts });
  assert.equal(score.chips, 62); assert.equal(score.mult, 4); assert.equal(score.total, 248);
  assert.deepEqual({ cards, levels, cardBoosts }, initial, 'preview is a pure read');
  assert.equal(scoreGambitHand([0], [], Object.create({ high_card: 5 }), { cardBoosts: Object.create({ 0: 30 }) }).total, 16,
    'inherited properties do not masquerade as purchased upgrades');
});

test('all twelve original Joker effects have deterministic, conditional outcomes', () => {
  assert.equal(GAMBIT_JOKERS.length, 75); assert.equal(new Set(GAMBIT_JOKERS.map(joker => joker.id)).size, 75);
  const high = [card(13)], ace = [card(1)], pair = [card(2), card(2, 1)];
  assert.equal(scoreGambitHand(high, ['lonely_crown']).chips, 50);
  assert.equal(scoreGambitHand(pair, ['lonely_crown']).chips, 14);
  assert.equal(scoreGambitHand(ace, ['pocket_ace']).mult, 4);
  assert.equal(scoreGambitHand(high, ['face_value']).chips, 23);
  assert.equal(scoreGambitHand(high, ['club_regular']).chips, 27);
  assert.equal(scoreGambitHand(high, ['growing_suspicion'], {}, { round: 4 }).chips, 30);
  assert.equal(scoreGambitHand(high, ['clean_slate']).mult, 4);
  assert.equal(scoreGambitHand(high, ['clean_slate'], {}, { discardsUsed: 1 }).mult, 1);
  assert.equal(scoreGambitHand(pair, ['little_scheme']).mult, 5);
  const straight = [card(2), card(3, 1), card(4, 2), card(5, 3), card(6)];
  assert.equal(scoreGambitHand(straight, ['straight_talker']).mult, 6.4);
  const flush = [card(2), card(4), card(6), card(8), card(10)];
  assert.equal(scoreGambitHand(flush, ['velvet_flush']).mult, 6);
  const straightFlush = [card(2), card(3), card(4), card(5), card(6)];
  assert.equal(scoreGambitHand(straightFlush, ['straight_talker', 'velvet_flush']).mult, 19.2);
});

test('invalid or sparse hands and malformed effect data are rejected safely', () => {
  const invalid = [null, {}, [], [0, 0], [4096], [-1], [1.5], [NaN], [0, 1, 2, 3, 4, 5], Array(2)];
  for (const cards of invalid) { assert.equal(evaluateGambitHand(cards), null); assert.equal(scoreGambitHand(cards), null); }
  for (const jokers of [['missing'], ['pair_gremlin', 'pair_gremlin'], Array(1), {}, null]) assert.equal(scoreGambitHand([0], jokers), null);
  for (const levels of [null, [], { missing: 1 }, { pair: -1 }, { pair: 1000 }, { pair: 1.5 }]) assert.equal(scoreGambitHand([0], [], levels), null);
  for (const context of [null, [], { round: 0 }, { round: 10000 }, { playsLeft: 0 }, { playsLeft: 11 },
    { discardsUsed: 11 }, { cardBoosts: null }, { cardBoosts: { '01': 10 } }, { cardBoosts: { 4096: 10 } }, { cardBoosts: { 0: 301 } }]) {
    assert.equal(scoreGambitHand([0], [], {}, context), null);
  }
  assert.equal(Object.isFrozen(GAMBIT_HANDS), true); assert.equal(Object.isFrozen(GAMBIT_JOKERS[0]), true);
});

test('physical copies and crafted faces unlock the three additional poker categories without aliasing identities', () => {
  assert.equal(GAMBIT_HANDS.length, 12);
  assert.deepEqual(gambitCardData(52), { rank: 1, suit: 0 });
  assert.deepEqual(gambitCardData(52, { 52: { rank: 9, suit: 2, enhancement: 'steel', seal: 'red' } }), { rank: 9, suit: 2, enhancement: 'steel', seal: 'red' });
  assert.equal(gambitCardData(4096), null); assert.equal(gambitCardData(52, { 52: {rank: 14} }), null);
  const copies = [0, 52, 104, 156, 208];
  assert.equal(evaluateGambitHand(copies).id, 'flush_five');
  const cardMods = { 52: {suit: 1}, 104: {suit: 2} };
  assert.equal(evaluateGambitHand(copies, {cardMods}).id, 'five_kind');
  const full = [6, 58, 110, 7, 59];
  assert.equal(evaluateGambitHand(full).id, 'flush_house');
  assert.deepEqual(evaluateGambitHand(full).scoringCards, full);
  assert.equal(evaluateGambitHand([0, 0], {cardMods}), null, 'copying a face does not permit duplicate physical IDs');
  assert.equal(evaluateGambitHand([0], null), null);
});

test('rule-changing Jokers retain complete five-card runs and use only the valid subset on partial runs', () => {
  const complete = [card(1), card(2), card(3), card(4), card(5)];
  const five = evaluateGambitHand(complete, {jokers: ['cut_corners']});
  assert.equal(five.id, 'straight_flush'); assert.deepEqual(five.scoringCards, complete);
  const partial = [card(3), card(4,1), card(5,2), card(6,3), card(12)];
  assert.equal(evaluateGambitHand(partial).id, 'high_card');
  assert.deepEqual(evaluateGambitHand(partial, {jokers: ['cut_corners']}).scoringCards, partial.slice(0,4));
  const pair = [card(3), card(3,1), card(1,3)];
  assert.equal(scoreGambitHand(pair, ['heart_hoarder']).chips, 16);
  const awake = scoreGambitHand(pair, ['wide_awake', 'heart_hoarder']);
  assert.deepEqual(awake.scoringCards, pair); assert.equal(awake.chips, 47, 'the Ace kicker contributes its chips and Heart bonus only with Wide Awake');
});

test('new suit, rank and poker specialists apply their stated conditional bonuses', () => {
  const cases = [
    ['diamond_digger', [card(2,1)], {}, 'chips', 16], ['spade_scholar', [card(2,2)], {}, 'mult', 2],
    ['scarlet_thread', [card(2,3)], {}, 'mult', 2], ['clover_chain', [card(2)], {}, 'mult', 1],
    ['black_tie', [card(2,2)], {}, 'chips', 12], ['red_letter', [card(2,3)], {}, 'chips', 12],
    ['even_odds', [card(4)], {}, 'mult', 4], ['odd_company', [card(1)], {}, 'chips', 18],
    ['prime_suspect', [card(7)], {}, 'mult', 3], ['low_profile', [card(5)], {}, 'chips', 25],
    ['royal_court', [card(11)], {}, 'mult', 2], ['ace_up_sleeve', [card(1)], {}, 'chips', 20],
    ['ten_to_one', [card(10)], {}, 'mult', 5],
    ['twin_moons', [card(4),card(4,1)], {}, 'chips', 20],
    ['crowded_house', [card(4),card(4,1),card(4,2),card(5),card(5,1)], {}, 'mult', 8],
    ['three_wishes', [card(4),card(4,1),card(4,2)], {}, 'mult', 10],
    ['square_deal', [card(4),card(4,1),card(4,2),card(4,3)], {}, 'chips', 100],
    ['long_weekend', [card(1),card(3,1),card(5,2),card(7,3),card(9)], {}, 'chips', 25],
    ['before_dawn', [card(5)], {playsLeft:5,maxPlays:5}, 'chips', 40],
    ['final_notice', [card(5)], {playsLeft:1}, 'mult', 12],
    ['patience', [card(5)], {discardsUsed:1,maxDiscards:4}, 'chips', 21],
    ['rust_collector', [card(5)], {cardMods: {[card(5)]:{enhancement:'bonus'}}}, 'chips', 20],
    ['seal_of_approval', [card(5)], {cardMods: {[card(5)]:{seal:'blue'}}}, 'mult', 4],
  ];
  for (const [joker,cards,context,property,increase] of cases) {
    const plain=scoreGambitHand(cards,[],{},context), enhanced=scoreGambitHand(cards,[joker],{},context);
    assert.equal(enhanced[property],plain[property]+increase,joker);
  }
  const multipliers = [
    ['lucky_seven',[card(7)],1.3], ['double_trouble',[card(2),card(2,1),card(7),card(7,1)],2],
    ['royal_road',[card(2),card(3),card(4),card(5),card(6)],2], ['solitary_star',[card(8)],2],
    ['five_alarm',[card(2),card(4),card(7),card(9),card(11)],2],
  ];
  for(const [joker,cards,factor] of multipliers) assert.equal(scoreGambitHand(cards,[joker]).mult,scoreGambitHand(cards).mult*factor,joker);
  assert.equal(scoreGambitHand([card(11)],['even_odds']).mult,1,'face-card ranks do not masquerade as even numbered cards');
  assert.equal(scoreGambitHand([card(6)],['lucky_seven']).mult,1);
  assert.equal(scoreGambitHand([card(6)],['before_dawn'],{}, {playsLeft:3}).chips,11,'first-play bonus stops after the first play');
});

test('held-card builds use unplayed identities, while retriggers repeat chips and per-card effects', () => {
  const played=[card(4)], heldCards=[card(13),card(12,1),card(2,2)];
  assert.equal(scoreGambitHand(played,['spare_change'],{}, {heldCards}).mult,4);
  assert.equal(scoreGambitHand(played,['empty_hands'],{}, {heldCards}).mult,5);
  assert.equal(scoreGambitHand(played,['royal_reserve'],{}, {heldCards}).mult,1.25);
  assert.equal(scoreGambitHand(played,['cold_storage'],{}, {heldCards}).chips,17);
  assert.equal(scoreGambitHand(played,['tea_break'],{}, {heldCards}).mult,3);
  assert.equal(scoreGambitHand(played,['steel_magnolia'],{}, {heldCards,cardMods:{[heldCards[0]]:{enhancement:'steel'}}}).mult,10.5);
  assert.equal(scoreGambitHand(played,['encore']).chips,13,'the first scoring Four pays chips twice');
  assert.equal(scoreGambitHand([card(11)],['curtain_call','face_value']).chips,41,'Jack: 5 base + two ten-chip triggers + two eight-chip Face Value triggers');
  assert.equal(scoreGambitHand(played,['tiny_echo','club_regular']).chips,37,'Four: 5 base + two four-chip triggers + two twelve-chip Club Regular triggers');
  const cardMods={[played[0]]:{enhancement:'mult',seal:'red'}};
  assert.equal(scoreGambitHand(played,[],{}, {cardMods}).chips,13); assert.equal(scoreGambitHand(played,[],{}, {cardMods}).mult,9);
  const glass=scoreGambitHand(played,['tiny_echo','glass_menagerie'],{}, {cardMods:{[played[0]]:{enhancement:'glass',seal:'red'}}});
  assert.equal(glass.chips,17); assert.equal(glass.mult,12,'Glass repeats three times, then Glass Menagerie adds ×1.5');
  assert.equal(scoreGambitHand(played,[],{}, {heldCards:played}),null,'a played card cannot also be held');
});

test('saved run history powers distinct growth routes and a five-Joker build can pass the old score ceiling', () => {
  const cards=[card(7),card(7,1)], levels={pair:8,flush:3};
  const stats={cardsPlayed:30,handsPlayed:14,cardsDiscarded:12,discardsUsed:6,roundsCleared:10,packsOpened:8,cardsRemoved:4,cardsAdded:3,handCounts:{pair:7,flush:2},lastHand:'pair',sameHandStreak:2};
  const context={stats,money:60,round:11};
  const base=scoreGambitHand(cards,[],levels,context);
  for(const [id,property,amount] of [['paper_trail','chips',90],['practice_makes','mult',7],['compost_heap','chips',48],['second_thought','mult',6],['crowd_funding','mult',9],['repeat_customer','mult',21],['night_school','mult',16],['book_worm','chips',55]])
    assert.equal(scoreGambitHand(cards,[id],levels,context)[property],base[property]+amount,id);
  for(const [id,factor] of [['snowball',2.2],['growing_appetite',2.2],['skinny_dip',1.6],['coin_cathedral',3],['frequent_flyer',1.5]])
    assert.equal(scoreGambitHand(cards,[id],levels,context).mult,base.mult*factor,id);
  const build=['paper_trail','repeat_customer','snowball','growing_appetite','coin_cathedral'];
  const report=scoreGambitHand(cards,build,levels,context);
  assert.ok(report.total>50000,`the composed growth engine scores ${report.total}`);
  const before=structuredClone({cards,build,levels,context});
  assert.deepEqual(scoreGambitHand(cards,build,levels,context),report);assert.deepEqual({cards,build,levels,context},before,'preview neither grows counters nor consumes resources');
  assert.equal(scoreGambitHand(cards,[...build].reverse(),levels,context).total,report.total,'slot order remains irrelevant');
  assert.ok(scoreGambitHand(cards,build,{pair:999},context).total>report.total,'levels can continue growing beyond five');
});

test('resource and economy Jokers return explicit one-event changes without modifying their inputs', () => {
  assert.deepEqual(gambitJokerModifiers(['spare_pocket','second_helping','waste_not','coupon_ghoul','deep_pockets']),{handSize:1,plays:1,discards:1,rerollDiscount:2,interestCap:5});
  assert.equal(gambitJokerPayout(['tip_jar'],{},'hand'),1);
  assert.equal(gambitJokerPayout(['rainy_day'],{},'discard'),1);
  assert.equal(gambitJokerPayout(['dividend_demon'],{},'round'),3);
  assert.equal(gambitJokerPayout(['pack_rat'],{},'pack'),2);
  assert.equal(gambitJokerPayout(['pack_rat'],{},'reroll'),0,'buying a shop reroll does not open a booster');
  const cards=[card(5,1)],context={cards,scoringCards:cards,heldCards:[card(13)],cardMods:{[cards[0]]:{seal:'gold'},[card(13)]:{enhancement:'gold'}}};
  const before=structuredClone(context);
  assert.equal(gambitJokerPayout(['gold_digger','tiny_echo','tip_jar'],{},'hand',context),7,'two Diamond and gold-seal triggers plus Tip Jar');
  assert.equal(gambitJokerPayout([],{},'round',context),3,'held Gold pays at the round boundary');
  assert.deepEqual(context,before);
  assert.equal(gambitJokerPayout(['not_real'],{},'hand'),0);
});

test('expanded rules reject contradictory inputs and retain finite capped scores', () => {
  for(const context of [{heldCards:[0,0]},{heldCards:[4096]},{money:Infinity},{money:-1},{stats:{cardsAdded:-1}},{stats:{handCounts:{not_a_hand:1}}},{cardMods:{0:{rank:0}}},{cardMods:{0:{seal:'forged'}}},{cardMods:{0:{enhancement:'invincible'}}}])
    assert.equal(scoreGambitHand([1],[],{},context),null);
  assert.equal(scoreGambitHand([0],['tip_jar','tip_jar']),null);
  assert.equal(scoreGambitHand([0],['spare_pocket','second_helping','waste_not','coupon_ghoul','deep_pockets','tip_jar']),null);
  const cards=[0,52,104,156,208],cardMods=Object.fromEntries(cards.map(id=>[id,{enhancement:'glass',seal:'red'}]));
  const result=scoreGambitHand(cards,['encore','royal_road','growing_appetite','skinny_dip','coin_cathedral'],{flush_five:999},{cardMods,money:99999,stats:{packsOpened:1e9,cardsRemoved:1e9}});
  assert.ok(result.total>1e9,'large runs no longer stop at one billion');
  assert.ok(result.total<=GAMBIT_SCORE_LIMIT&&Number.isFinite(result.total));
  assert.ok(result.steps.every(step=>Number.isFinite(step.chips)&&Number.isFinite(step.mult)));
  assert.equal(new Set(GAMBIT_JOKERS.map(item=>item.name)).size,75);assert.equal(new Set(GAMBIT_JOKERS.map(item=>item.description)).size,75);
  assert.ok(GAMBIT_JOKERS.every(item=>item.family&&[4,6,8].includes(item.price)&&Object.isFrozen(item)));
});
