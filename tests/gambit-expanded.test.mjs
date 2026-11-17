import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {GambitGame,GAMBIT_TARGETS,GAMBIT_DECKS,GAMBIT_PACKS,GAMBIT_BOSSES} from '../src/gambit.js';
import {GAMBIT_JOKERS,gambitCardData} from '../src/gambit-rules.js';
const fixtures=JSON.parse(fs.readFileSync(new URL('./fixtures/gambit-v1.json',import.meta.url),'utf8'));
const create=seed=>new GambitGame({seed:seed||4261});
const restored=game=>new GambitGame({saved:game.snapshot()});
function layout(game,cards){const rest=game.deckCards.filter(id=>!cards.includes(id));game.hand=[...cards,...rest.splice(0,game.handSize-cards.length)];game.deck=rest;game.discard=[];game.selected=[];}
function clear(game){layout(game,[0,9,10,11,12]);game.roundScore=game.target-1;game.score=Math.max(game.score,game.roundScore);const cards=game.boss?.id==='narrow_gate'?[0,9,10]:[0,9,10,11,12];cards.forEach(id=>game.toggleCard(id));assert.equal(game.playHand(),true);assert.equal(game.continueScore(),true);}
function shop(){const game=create();game.start();clear(game);game.money=100;return game;}
function offerPack(game,kind,size='normal'){const p=GAMBIT_PACKS.find(p=>p.kind===kind&&p.size===size);game.shop[2]={kind:'pack',pack:kind,size,price:p.price,sold:false};assert.equal(game.buy(2),true);}
function conserved(game){const cards=[...game.deck,...game.hand,...game.discard];assert.equal(cards.length,game.deckCards.length);assert.equal(new Set(cards).size,cards.length);assert.deepEqual([...cards].sort((a,b)=>a-b),[...game.deckCards].sort((a,b)=>a-b));}
function checkSave(game){const receiver=create(1);assert.equal(receiver.restore(game.snapshot()),true,`${game.phase}/${game.round} restores`);assert.deepEqual(receiver.snapshot(),game.snapshot());return receiver;}

test('four starting decks produce distinct saved builds and cannot overwrite an active run',()=>{
  assert.equal(GAMBIT_DECKS.length,4);const signatures=[];
  for(const preset of GAMBIT_DECKS){const g=create();assert.equal(g.chooseDeck(preset.id),true);checkSave(g);conserved(g);signatures.push(JSON.stringify([g.money,g.jokers,g.handLevels,g.cardMods]));g.start();const before=g.snapshot();assert.equal(g.chooseDeck('classic'),false);assert.deepEqual(g.snapshot(),before);}
  assert.equal(new Set(signatures).size,4);
  const velvet=create();velvet.chooseDeck('velvet');assert.deepEqual([...new Set(velvet.deckCards.map(id=>gambitCardData(id,velvet.cardMods).suit))].sort(),[0,3]);
});

test('v1 saves migrate intact in every paid/score/terminal phase and can finish or extend the classic run',()=>{
  for(const [phase,saved] of Object.entries(fixtures)){
    const g=create();assert.equal(g.restore(saved),true,phase);assert.equal(g.legacy,true);assert.equal(g.campaignLength,6);assert.equal(g.jokerSlots,3);
    for(const key of ['money','deck','hand','discard','jokers','selected','round','roundScore','score'])assert.deepEqual(g[key],saved[key],`${phase}:${key}`);
    checkSave(g);if(phase==='score')assert.equal(g.lastResult.total,1128);
    if(phase==='pack'){assert.deepEqual(g.pack.options,saved.pack.options);assert.equal(g.pack.selected,saved.pack.selected);const money=g.money;g.start();g.claimPack();assert.equal(g.money,money);checkSave(g);}
  }
  const winner=new GambitGame({saved:fixtures.won});assert.equal(winner.canContinueEndless,true);assert.equal(winner.continueEndless(),true);assert.equal(winner.jokerSlots,5);assert.equal(winner.endless,true);checkSave(winner);winner.nextRound();assert.equal(winner.round,7);conserved(winner);checkSave(winner);
});

test('all eight booster variants resolve real choices, with Mega second picks frozen across reload',()=>{
  assert.equal(GAMBIT_PACKS.length,8);
  for(const p of GAMBIT_PACKS){const g=shop();offerPack(g,p.kind,p.size);assert.equal(g.pack.options.length,p.options);assert.equal(g.pack.remaining,p.choose);checkSave(g);
    const before=g.money;g.selectPack(0);const c=checkSave(g);c.start();assert.equal(c.claimPack(),true);assert.equal(c.money,before);conserved(c);checkSave(c);
    if(p.choose===2){assert.equal(c.phase,'pack');assert.equal(c.pack.remaining,1);assert.deepEqual(c.pack.claimed,[0]);assert.equal(c.selectPack(0),false);const options=structuredClone(c.pack.options);const second=checkSave(c);second.start();assert.deepEqual(second.pack.options,options);assert.equal(second.selectPack(1),true);assert.equal(second.claimPack(),true);assert.equal(second.phase,'shop');checkSave(second);conserved(second);}
  }
});

test('a full five-slot row resolves two Mega Joker replacements without losing the paid second choice',()=>{
  const g=shop();g.jokers=GAMBIT_JOKERS.slice(0,5).map(j=>j.id);offerPack(g,'joker','mega');const money=g.money,options=structuredClone(g.pack.options);
  g.selectPack(0);g.claimPack();assert.equal(g.phase,'replace');assert.equal(g.pack.remaining,1);const c=checkSave(g);c.start();c.replaceJoker(2);assert.equal(c.phase,'pack');assert.deepEqual(c.pack.options,options);assert.equal(c.money,money);
  c.selectPack(1);c.claimPack();assert.equal(c.phase,'replace');const last=checkSave(c);last.start();last.skipPack();assert.equal(last.phase,'shop');assert.equal(last.pack,null);assert.equal(last.jokers.length,5);checkSave(last);
});

test('Standard packs add distinct physical cards; deck construction and enhancements persist between blinds',()=>{
  const g=shop();offerPack(g,'standard','mega');const original=new Set(g.deckCards),expected=g.pack.options[0];g.selectPack(0);g.claimPack();
  const id=g.deckCards.find(id=>!original.has(id));assert.equal(id,52);assert.equal(gambitCardData(id,g.cardMods).rank,expected.id%13+1);assert.equal(gambitCardData(id,g.cardMods).suit,Math.floor(expected.id/13));assert.equal(g.cardMods[id].enhancement,expected.enhancement);
  g.selectPack(1);g.claimPack();assert.equal(g.deckCards.length,54);assert.equal(g.stats.cardsAdded,2);const c=checkSave(g);c.start();c.nextRound();assert.equal(c.deckCards.length,54);assert.deepEqual(c.cardMods,g.cardMods);conserved(c);checkSave(c);
});

test('Craft choices target different cards so removing one cannot invalidate a remaining Mega choice',()=>{
  let removals=0;
  for(let seed=1;seed<=25;seed++){const g=shop();g.rngState=seed;offerPack(g,'craft','mega');assert.equal(new Set(g.pack.options.map(o=>o.id)).size,g.pack.options.length);
    const index=g.pack.options.findIndex(o=>o.kind==='remove');if(index<0)continue;removals++;const id=g.pack.options[index].id;g.selectPack(index);g.claimPack();assert.equal(g.deckCards.includes(id),false);assert.equal(g.stats.cardsRemoved,1);const c=checkSave(g);c.start();const next=c.pack.options.findIndex((o,i)=>i!==index);c.selectPack(next);c.claimPack();conserved(c);checkSave(c);}
  assert.ok(removals>0);
});

test('shop rerolls charge rising prices without replacing or refunding packs, and seeded reload agrees',()=>{
  const g=shop();g.buy(2);g.skipPack();const packs=structuredClone(g.shop.slice(2)),price=g.rerollPrice,money=g.money;const c=checkSave(g);c.start();
  assert.equal(g.rerollShop(),true);assert.equal(c.rerollShop(),true);assert.deepEqual(c.snapshot(),g.snapshot());assert.equal(g.money,money-price);assert.equal(g.rerollPrice,price+1);assert.equal(g.stats.rerolls,1);assert.deepEqual(g.shop.slice(2),packs);assert.equal(g.buy(2),false);
  const before=g.snapshot();g.money=0;assert.equal(g.rerollShop(),false);g.money=before.money;assert.deepEqual(g.snapshot(),before);
});

test('growth and held-card scoring previews are pure, then freeze their exact report through save and Continue',()=>{
  const g=create();g.start();g.jokers=['pair_gremlin','growing_appetite','snowball','tip_jar','patience'];g.stats.packsOpened=12;g.stats.roundsCleared=7;layout(g,[1,14]);g.cardMods[27]={enhancement:'steel'};g.toggleCard(1);g.toggleCard(14);
  const before=g.snapshot(),report=g.preview();assert.ok(report);assert.deepEqual(g.preview(),report);assert.deepEqual(g.snapshot(),before);g.playHand();assert.equal(g.stats.handsPlayed,1);const c=checkSave(g);assert.deepEqual(c.lastResult,report);assert.equal(c.money,9);c.start();c.continueScore();assert.equal(c.score,report.total);assert.ok(c.money>=9);
});

test('Glass break randomness is committed once and all observed events expose coherent snapshots',()=>{
  const run=[];for(let seed=1;seed<=20;seed++){const g=create(seed);g.start();layout(g,[0]);g.cardMods[0]={enhancement:'glass',seal:'red'};g.toggleCard(0);const before=g.rngState;g.preview();assert.equal(g.rngState,before);g.playHand();const broken=g.lastPlay.breaks.includes(0),c=checkSave(g);c.start();g.continueScore();c.continueScore();assert.deepEqual(c.snapshot(),g.snapshot());assert.equal(g.deckCards.includes(0),!broken);conserved(g);run.push(broken);}assert.ok(run.includes(true));assert.ok(run.includes(false));
});

test('boss restrictions apply to both preview and play, resources and exact categories are explained',()=>{
  assert.equal(GAMBIT_BOSSES.length,8);
  for(const boss of GAMBIT_BOSSES){const g=create();g.round=3;g.bossOrder=[boss.id,...GAMBIT_BOSSES.filter(b=>b.id!==boss.id).map(b=>b.id)];g.dealRound();g.start();assert.equal(g.boss.id,boss.id);checkSave(g);
    if(boss.id==='short_fuse')assert.equal(g.maxPlays,3);if(boss.id==='dry_well')assert.equal(g.maxDiscards,1);
    if(boss.id==='narrow_gate'||boss.id==='full_table'){layout(g,[0,1,2,3,4]);for(const id of boss.id==='narrow_gate'?[0,1,2,3]:[0])g.toggleCard(id);assert.ok(g.selectionError());assert.equal(g.preview(),null);assert.equal(g.playHand(),false);}
    if(boss.id==='echo_chamber'){layout(g,[0,14]);g.toggleCard(0);g.playHand();g.continueScore();g.toggleCard(g.hand[0]);assert.match(g.selectionError(),/different/);}
  }
});

test('interest rewards saving once, while Locked Purse blocks it and economy modifiers affect the next deal',()=>{
  const g=create();g.start();g.money=25;const before=g.money;clear(g);assert.equal(g.money,before+6+g.playsLeft+5);const after=g.money;assert.equal(g.continueScore(),false);assert.equal(g.money,after);
  g.jokers=['spare_pocket','second_helping','waste_not','coupon_ghoul','deep_pockets'];g.nextRound();assert.equal(g.handSize,9);assert.equal(g.maxPlays,5);assert.equal(g.maxDiscards,4);assert.equal(g.rerollPrice,1);checkSave(g);
  const locked=create();locked.round=3;locked.bossOrder=['locked_purse',...GAMBIT_BOSSES.filter(b=>b.id!=='locked_purse').map(b=>b.id)];locked.dealRound();locked.start();locked.money=25;clear(locked);assert.equal(locked.money,25+6+locked.playsLeft);checkSave(locked);
});

test('campaign victory offers an explicit choice; Endless keeps the whole build and rises past the former ceiling',()=>{
  const g=create();g.start();for(let round=1;round<=24;round++){clear(g);if(round<24)g.nextRound();}
  assert.equal(GAMBIT_TARGETS.length,24);assert.equal(g.phase,'victory');assert.equal(g.won,true);assert.ok(g.target>=70000);const build=structuredClone([g.jokers,g.handLevels,g.deckCards,g.cardMods,g.stats]);assert.equal(g.canContinueEndless,true);checkSave(g);
  assert.equal(g.continueEndless(),true);assert.deepEqual([g.jokers,g.handLevels,g.deckCards,g.cardMods,g.stats],build);checkSave(g);g.nextRound();assert.equal(g.round,25);assert.equal(g.ante,9);assert.ok(g.target>70000);checkSave(g);assert.equal(g.continueEndless(),false);
});

test('invalid v2 fields, altered frozen scoring inputs, and unpurchased packs reject atomically without throwing',()=>{
  const g=create(),before=g.snapshot();const bad=[{...before,round:25},{...before,nextCardId:1},{...before,deckCards:before.deckCards.slice(1)},{...before,cardMods:{0:{rank:14}}},{...before,stats:{...before.stats,handsPlayed:-1}}];
  for(const value of bad){assert.equal(g.restore(value),false);assert.deepEqual(g.snapshot(),before);}
  assert.equal(g.restore({...before,target:999,preview:null,onEvent:null}),true);assert.equal(typeof g.preview,'function');assert.equal(typeof g.onEvent,'function');
  g.start();g.toggleCard(g.hand[0]);g.playHand();const scoring=g.snapshot();for(const field of ['cardMods','cardBoosts','stats','deckSize']){const altered=structuredClone(scoring);if(field==='cardMods')altered.lastPlay.context.cardMods={0:{enhancement:'bonus'}};if(field==='cardBoosts')altered.lastPlay.context.cardBoosts={0:300};if(field==='stats')altered.lastPlay.context.stats.handsPlayed=5;if(field==='deckSize')altered.lastPlay.context.deckSize=9;assert.equal(g.restore(altered),false,field);assert.deepEqual(g.snapshot(),scoring);}
  const buyer=shop();offerPack(buyer,'joker','mega');const paid=buyer.snapshot();paid.shop[2].sold=false;assert.equal(g.restore(paid),false);assert.deepEqual(g.snapshot(),scoring);
});

test('only cards held before the winning play grant Gold income and Blue seal levels, never replacement draws',()=>{
  const g=create();g.start();layout(g,[0,1,2,3,4,5,6,7]);g.money=0;
  g.cardMods[1]={enhancement:'gold',seal:'blue'};g.cardMods[51]={enhancement:'gold',seal:'blue'};
  g.roundScore=g.target-1;g.score=g.roundScore;g.toggleCard(0);g.playHand();assert.ok(g.hand.includes(51),'the next draw really has a Gold/Blue card');
  assert.equal(g.lastPlay.context.heldCards.includes(51),false);checkSave(g);g.continueScore();assert.equal(g.money,12,'$6 clear + $3 remaining hands + one $3 Gold held card');assert.equal(g.handLevels.high_card,1,'one original held Blue seal, not the new draw');checkSave(g);
});

test('reaching the physical-deck cap mid-Mega pack leaves a coherent paid choice that can be skipped',()=>{
  const g=shop();for(let id=52;id<127;id++){g.deckCards.push(id);g.deck.push(id);}g.nextCardId=127;conserved(g);offerPack(g,'standard','mega');g.selectPack(0);g.claimPack();assert.equal(g.deckCards.length,128);assert.equal(g.pack.remaining,1);checkSave(g);g.selectPack(1);const before=g.snapshot();assert.equal(g.claimPack(),false);assert.deepEqual(g.snapshot(),before);assert.equal(g.skipPack(),true);assert.equal(g.phase,'shop');checkSave(g);conserved(g);
});

test('rarity-weighted shops make every original Joker reachable rather than filling the larger catalog with dead entries',()=>{
  const g=create();g.jokers=[];const seen=new Set(),counts={common:0,uncommon:0,rare:0};
  for(let roll=0;roll<1500;roll++)for(const id of g.drawJokers(2)){seen.add(id);counts[GAMBIT_JOKERS.find(j=>j.id===id).rarity]++;}
  assert.equal(seen.size,GAMBIT_JOKERS.length);assert.ok(counts.common>counts.uncommon);assert.ok(counts.uncommon>counts.rare);assert.ok(counts.rare>0);
});

test('a malformed legacy victory phase rejects atomically instead of creating an unrestorable migrated save',()=>{
  const g=create(),before=g.snapshot();assert.equal(g.restore({...fixtures.idle,status:'paused',phase:'victory'}),false);assert.deepEqual(g.snapshot(),before);
});
