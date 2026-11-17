import test from 'node:test';
import assert from 'node:assert/strict';
import { setup } from '../dist/frontend.js';
import { GambitGame, GAMBIT_PACKS } from '../src/gambit.js';
import { gambitActions } from '../src/gambit-render.js';

class ElementMock {
  constructor(tag = 'div') {
    this.tagName = tag.toUpperCase(); this.children = []; this.listeners = new Map(); this.attributes = new Map();
    this.style = {}; this.dataset = {}; this.className = ''; this.textContent = '';
    this.complete = true; this.naturalWidth = this.naturalHeight = 120;
    this.classList = { toggle: (name, on) => {
      const classes = new Set(this.className.split(' ').filter(Boolean));
      if (on) classes.add(name); else classes.delete(name); this.className = [...classes].join(' ');
    } };
  }
  append(...nodes) { this.children.push(...nodes); }
  appendChild(node) { this.append(node); return node; }
  replaceChildren(...nodes) { this.children = nodes; this.textContent = ''; }
  setAttribute(key, value) { this.attributes.set(key, value); }
  addEventListener(name, fn) { if (!this.listeners.has(name)) this.listeners.set(name, new Set()); this.listeners.get(name).add(fn); }
  removeEventListener(name, fn) { this.listeners.get(name)?.delete(fn); }
  dispatch(name, payload = {}) { for (const fn of [...(this.listeners.get(name) || [])]) fn({ target: this, preventDefault() {}, stopPropagation() {}, ...payload }); }
  focus() {}
  getBoundingClientRect() { return { left: 0, top: 0, width: 360, height: 452 }; }
  setPointerCapture() {}
  hasPointerCapture() { return false; }
  releasePointerCapture() {}
  getContext() {
    if (this.tagName !== 'CANVAS') return null;
    return new Proxy({ createLinearGradient: () => ({ addColorStop() {} }), measureText: value => ({ width: String(value).length * 6 }) }, {
      get(target, name) { return name in target ? target[name] : () => {}; }, set(target, name, value) { target[name] = value; return true; }
    });
  }
}
const flatten = node => [node, ...node.children.flatMap(child => child instanceof ElementMock ? flatten(child) : [])];
const UPSTREAM_MODES = ['bird', 'gabi', 'snake', '2048', 'match3', 'plinko', 'simon', 'duck', 'slots', 'tetris', 'solitaire', 'froggy',
  'chess', 'berry', 'tictac', 'cake', 'bubble', 'boop', 'wafer', 'memory'];
function withHost(initial, run) {
  const names = ['window', 'document', 'Image', 'HTMLElement', 'localStorage', 'requestAnimationFrame', 'cancelAnimationFrame'];
  const previous = Object.fromEntries(names.map(name => [name, globalThis[name]]));
  const key = 'fuckass_funzone:v1:gambit-integration', cache = new Map([[key, JSON.stringify(initial)]]), queued = new Map();
  const window = new ElementMock('window'), document = new ElementMock('document');
  document.createElement = tag => new ElementMock(tag); document.createElementNS = (_, tag) => new ElementMock(tag); document.hidden = false;
  Object.assign(globalThis, { window, document, HTMLElement: ElementMock, Image: class extends ElementMock { constructor() { super('img'); } },
    localStorage: { getItem: k => cache.get(k) || null, setItem: (k, v) => cache.set(k, v) } });
  let rafId = 0, clock = 0, stop, placements;
  globalThis.requestAnimationFrame = fn => { queued.set(++rafId, fn); return rafId; };
  globalThis.cancelAnimationFrame = id => queued.delete(id);
  const mount = () => {
    placements = {};
    const handle = () => ({ root: new ElementMock('section'), setVisible(value) { this.visible = value; }, destroy() {} });
    stop = setup({ host: { extensionInstallationId: 'gambit-integration' }, events: { on: () => () => {} }, ui: {
      createFloatWidget: () => (placements.widget = handle()), registerDrawerTab: () => (placements.drawer = handle()),
      registerInputBarAction: () => (placements.action = { onClick(fn) { this.click = fn; return () => {}; }, destroy() {} })
    } });
  };
  const nodes = () => flatten(placements.widget.root);
  const findClass = name => nodes().find(node => node.className.split(' ').includes(name));
  const api = {
    save: () => JSON.parse(cache.get(key)), window,
    pick(id = 'gambit', autoStart = true) {
      findClass('bb-phone-button').dispatch('click');
      const app = nodes().find(node => node.className === 'bb-app' && node.dataset.game === id);
      assert.ok(app, `${id} has an entry in the production launcher`); app.dispatch('click');
      if(id==='gambit'&&autoStart&&api.save().puzzles.gambit.status==='idle')api.key('Space');
    },
    key(code, target) { findClass('bb-float').dispatch('keydown', { target: target || findClass('bb-canvas'), code }); },
    tap(x, y) {
      const canvas = findClass('bb-canvas'); canvas.dispatch('pointerdown', { pointerType: 'touch', pointerId: 1, clientX: x, clientY: y });
      canvas.dispatch('pointerup', { pointerId: 1, clientX: x, clientY: y });
    },
    action(kind, index, view) {
      const game = new GambitGame({ saved: api.save().puzzles.gambit }); if(game.status==='paused')game.start();
      const item = gambitActions(game, view).find(action => action.kind === kind && (index === undefined || action.index === index || action.mode === index || action.direction === index));
      assert.ok(item?.enabled, `${kind} is an enabled visible control`); api.tap(item.hitX ?? item.x + item.w / 2, item.hitY ?? item.y + item.h / 2);
    },
    keyboardAction(kind, index, view) {
      const game = new GambitGame({ saved: api.save().puzzles.gambit }); if(game.status==='paused')game.start();
      const actions = gambitActions(game, view);
      const focusIndex = actions.findIndex(action => action.kind === kind && (index === undefined || action.index === index || action.mode === index || action.direction === index));
      assert.ok(focusIndex >= 0 && actions[focusIndex].enabled, `${kind} is available to keyboard focus`);
      api.key('Escape');
      for (let step = 0; step <= focusIndex; step++) api.key('ArrowRight');
      api.key('Enter');
    },
    primary: () => findClass('bb-mainbutton'),
    announcements: () => nodes().filter(node => node.attributes.get('aria-live') === 'polite').map(node => node.textContent).join(' '),
    frames(count = 1) { for (let i = 0; i < count; i++) { clock += 120; for (const [id, fn] of [...queued]) { queued.delete(id); fn(clock); } } },
    reload() { stop(); mount(); placements.action.click(); },
  };
  try { mount(); run(api); } finally {
    stop?.(); assert.equal(queued.size, 0, 'teardown cancels the cabinet animation loop');
    for (const [name, value] of Object.entries(previous)) { if (value === undefined) delete globalThis[name]; else globalThis[name] = value; }
  }
}
function knownRun() {
  const game = new GambitGame({ seed: 123 }); game.start();
  game.hand = [1, 14, 2, 16, 31, 42, 8, 24];
  game.deck = Array.from({ length: 52 }, (_, id) => id).filter(id => !game.hand.includes(id)); game.discard = [];
  return game;
}
function shopRun() {
  const game = knownRun(); game.roundScore = game.target - 1; game.score = game.roundScore;
  game.toggleCard(1); game.playHand(); game.continueScore(); assert.equal(game.phase, 'shop'); return game;
}

test('bundled Gambit routes number/Space/D and touch controls, reports score, pauses, and keeps other games saved', () => {
  const game = knownRun(), futurePuzzles = { future_arcade: { version: 2, board: ['keep this newer save'] } };
  withHost({ tickets: 73, bests: { gambit: 0, tetris: 2345, solitaire: 110, froggy: 900, future_arcade: 808 }, puzzles: { ...futurePuzzles, gambit: game.snapshot() } }, h => {
    h.pick(); h.frames();
    h.key('Digit8', new ElementMock('textarea')); assert.deepEqual(h.save().puzzles.gambit.selected, [], 'chat typing never selects a card');
    h.key('Digit8'); assert.equal(h.save().puzzles.gambit.selected.length, 1);
    h.key('KeyD'); assert.equal(h.save().puzzles.gambit.discardsLeft, 2); assert.equal(h.save().puzzles.gambit.selected.length, 0);
    h.key('Digit1'); h.key('Digit2');
    const selected = new GambitGame({ saved: h.save().puzzles.gambit }), expected = selected.preview();
    assert.equal(expected.id, 'pair'); assert.match(h.announcements(), new RegExp(`Pair, ${expected.total} points`));
    h.key('Space'); assert.equal(h.save().puzzles.gambit.phase, 'score');
    assert.equal(h.save().puzzles.gambit.score, expected.total); assert.equal(h.save().puzzles.gambit.playsLeft, 3);
    h.key('KeyP'); const paused = h.save().puzzles.gambit;
    h.key('Digit1'); h.key('KeyD'); h.frames(20); assert.deepEqual(h.save().puzzles.gambit, paused);
    assert.equal(h.primary().attributes.get('aria-label'), 'Resume');
    h.key('KeyP'); h.frames(20); assert.equal(h.save().puzzles.gambit.phase, 'score', 'score screen waits for player');
    h.key('Space'); assert.equal(h.save().puzzles.gambit.phase, 'play');
    h.action('card', 0); assert.equal(h.save().puzzles.gambit.selected.length, 1, 'touch selects a real card');
    h.window.dispatch('blur'); assert.equal(h.primary().attributes.get('aria-label'), 'Resume');
    const beforeReload = h.save(); h.reload();
    assert.deepEqual(h.save().puzzles.gambit, beforeReload.puzzles.gambit, 'reload restores the selected hand paused');
    assert.equal(h.primary().attributes.get('aria-label'), 'Resume');
    for (const id of Object.keys(futurePuzzles)) assert.deepEqual(h.save().puzzles[id], futurePuzzles[id]);
    assert.equal(h.save().bests.tetris, 2345); assert.equal(h.save().bests.solitaire, 110); assert.equal(h.save().bests.froggy, 900);
    assert.equal(h.save().bests.future_arcade, 808, 'a newer game record survives this build');
    assert.equal(h.save().tickets, 73, 'Gambit coins and scoring cannot spend or mint arcade tickets');
  });
});

test('adding Gambit to a twenty-game profile preserves every existing save, record, and preset through switching and reload', () => {
  const bests = Object.fromEntries(UPSTREAM_MODES.map((id, index) => [id, 10000 + index]));
  const gabuLevels = { chess: 'hard', berry: 'chill', tictac: 'hard', wafer: 'chill' };
  const toyPaces = { cake: 'chill', bubble: 'chaos', boop: 'chill', memory: 'classic' };
  let profile;
  // Capture real engine snapshots, including a held Tetris piece, pending Gabu reply, and played memory turn.
  withHost({ tickets: 83, bests, gabuLevels, toyPaces }, h => {
    h.pick('tetris'); h.key('KeyC'); assert.ok(h.save().puzzles.tetris.held);
    h.pick('chess'); h.key('ArrowUp'); h.key('Enter'); h.key('ArrowUp'); h.key('ArrowUp'); h.key('Enter');
    assert.equal(h.save().puzzles.chess.turn, 'b');
    h.pick('memory'); h.key('Space'); h.key('Space'); h.key('ArrowRight'); h.key('Space');
    assert.equal(h.save().puzzles.memory.moves, 1);
    h.window.dispatch('blur'); profile = h.save();
  });
  delete profile.puzzles.gambit; delete profile.bests.gambit;
  const previousPuzzles = structuredClone(profile.puzzles);
  assert.equal(Object.keys(previousPuzzles).length, 18, 'the twenty upstream games have eighteen saved engines; flight runs do not persist');
  withHost(profile, h => {
    h.pick(); h.key('Digit1'); h.key('KeyD'); h.key('Digit2');
    const gambit = h.save().puzzles.gambit;
    assert.equal(gambit.discardsLeft, 2); assert.equal(gambit.selected.length, 1);
    for (const id of ['chess', 'memory', 'tetris']) h.pick(id);
    h.pick(); h.window.dispatch('blur'); h.reload();
    const after = h.save();
    assert.deepEqual(after.puzzles.gambit, gambit, 'switching to upstream games preserves the selected Gambit hand and remaining resources');
    for (const [id, snapshot] of Object.entries(previousPuzzles))
      assert.deepEqual(after.puzzles[id], snapshot, `${id} progress survives adding, playing, and reloading Gambit`);
    for (const id of UPSTREAM_MODES) assert.equal(after.bests[id], bests[id], `${id} record remains independent of Gambit`);
    assert.deepEqual(after.gabuLevels, gabuLevels); assert.deepEqual(after.toyPaces, toyPaces);
    assert.equal(after.tickets, 83, 'switching games and Gambit actions do not change the arcade wallet');
    assert.equal(after.arcadeGame, 'gambit'); assert.equal(h.primary().attributes.get('aria-label'), 'Resume');
  });
});

test('bundled Joker inspection blocks play shortcuts until dismissed', () => {
  withHost({ tickets: 11, puzzles: { gambit: knownRun().snapshot() } }, h => {
    h.pick(); h.key('Digit1'); const before = h.save().puzzles.gambit;
    h.action('joker', 0); h.key('Digit2'); h.key('Space'); h.key('KeyD');
    assert.deepEqual(h.save().puzzles.gambit, before, 'inspection does not pass hotkeys through to the table');
    h.key('Escape'); h.key('Digit2'); assert.equal(h.save().puzzles.gambit.selected.length, 2);
    h.key('Space'); assert.equal(h.save().puzzles.gambit.phase, 'score');
  });
});

test('bundled booster purchase, keyboard choice, and reload preserve one paid set of offers', () => {
  const game = shopRun(), money = game.money;
  withHost({ tickets: 25, puzzles: { gambit: game.snapshot() } }, h => {
    h.pick(); h.action('buy', 2);
    h.keyboardAction('packOption', 0);
    const paid = h.save().puzzles.gambit;
    assert.equal(paid.phase, 'pack'); assert.equal(paid.money, money - 4); assert.equal(paid.shop[2].sold, true);
    assert.equal(paid.pack.selected, 0, 'keyboard can inspect a pack option');
    for (const id of UPSTREAM_MODES) {
      h.pick(id);
      assert.deepEqual(h.save().puzzles.gambit, paid, `${id} cannot reroll, charge, or claim the paused booster choice`);
      assert.equal(h.save().tickets, 25, `${id} switching leaves the arcade wallet intact`);
    }
    h.pick(); assert.deepEqual(h.save().puzzles.gambit, paid, 'returning to Gambit keeps the pending choice');
    h.reload(); assert.equal(h.primary().attributes.get('aria-label'), 'Resume');
    assert.deepEqual(h.save().puzzles.gambit, paid, 'reload does not reroll or charge the unopened choice again');
    h.key('Space');
    h.action('claim'); const saved = h.save().puzzles.gambit;
    assert.equal(saved.phase, 'shop'); assert.ok(saved.jokers.includes(paid.pack.options[0].id));
    assert.equal(saved.money, money - 4); assert.equal(saved.shop[2].sold, true); assert.equal(h.save().tickets, 25);
    h.reload(); assert.deepEqual(h.save().puzzles.gambit, saved, 'claimed Joker and charge survive another reload');
  });
});


test('bundled fan hit targets and rank/suit sorting preserve the selected cards and run resources', () => {
  withHost({ tickets: 19, puzzles: { gambit: knownRun().snapshot() } }, h => {
    h.pick(); h.action('card', 0); h.action('card', 7);
    const before = h.save().puzzles.gambit;
    assert.deepEqual(before.selected, [before.hand[0], before.hand[7]], 'exposed fan edges select the intended cards');
    h.action('sort', 'rank');
    const ranked = h.save().puzzles.gambit;
    assert.deepEqual(ranked.selected, before.selected, 'sorting preserves selection by card identity');
    const rank = id => id % 13 === 0 ? 14 : id % 13 + 1;
    assert.ok(ranked.hand.every((id, index) => !index || rank(ranked.hand[index - 1]) >= rank(id)));
    h.action('sort', 'suit');
    const suited = h.save().puzzles.gambit;
    assert.ok(suited.hand.every((id, index) => !index || Math.floor(suited.hand[index - 1] / 13) <= Math.floor(id / 13)));
    for (const field of ['deck', 'discard', 'selected', 'playsLeft', 'discardsLeft', 'score', 'roundScore', 'money', 'rngState'])
      assert.deepEqual(suited[field], before[field], `${field} is unchanged by hand sorting`);
    assert.equal(h.save().tickets, 19);
    h.reload(); assert.deepEqual(h.save().puzzles.gambit.hand, suited.hand, 'sorted order survives reload');
  });
});

test('shop offer inspection explains an item before its separate purchase control spends run coins', () => {
  const game = shopRun();
  withHost({ tickets: 25, puzzles: { gambit: game.snapshot() } }, h => {
    h.pick(); const before = h.save().puzzles.gambit;
    h.action('offer', 0); h.key('Space'); h.key('KeyD'); h.key('Digit1');
    assert.deepEqual(h.save().puzzles.gambit, before, 'inspecting the card cannot buy it or pass shortcuts through');
    h.action('buy', 0, { inspection: { offer: 0 } });
    const after = h.save().puzzles.gambit;
    assert.equal(after.money, before.money - before.shop[0].price);
    assert.ok(after.jokers.includes(before.shop[0].id));
    assert.equal(after.shop[0].sold, true); assert.equal(h.save().tickets, 25);
  });
});


test('a fresh bundled run offers deck selection and starts the chosen preset through keyboard controls', () => {
  withHost({},h=>{
    h.pick('gambit',false);assert.equal(h.save().puzzles.gambit.status,'idle');
    h.action('deckCycle',1);assert.equal(h.save().puzzles.gambit.deckPreset,'velvet');
    h.keyboardAction('start');const run=h.save().puzzles.gambit;
    assert.equal(run.deckPreset,'velvet');assert.equal(h.primary().attributes.get('aria-label'),'Pause');
    assert.equal(run.jokers[0],'velvet_flush');assert.ok(Object.keys(run.cardMods).length>0);
    h.reload();assert.equal(h.save().puzzles.gambit.deckPreset,'velvet');
    assert.equal(h.primary().attributes.get('aria-label'),'Resume');
  });
});

test('the bundled collection exposes all rarities and Joker inspections without altering the run', () => {
  withHost({puzzles:{gambit:knownRun().snapshot()}},h=>{
    h.pick();const before=h.save().puzzles.gambit;h.key('KeyI');
    h.action('collection',undefined,{inspection:{info:true}});
    assert.match(h.announcements(),/Joker collection/);
    h.action('catalogFilter',undefined,{inspection:{collection:true,page:0,filter:'all'}});
    assert.match(h.announcements(),/common rarities/);
    h.action('catalogJoker',undefined,{inspection:{collection:true,page:0,filter:'common'}});
    h.key('Space');h.key('Digit1');h.key('KeyD');
    assert.deepEqual(h.save().puzzles.gambit,before,'collection browsing never plays or spends');
    h.key('Escape');h.key('Digit1');assert.equal(h.save().puzzles.gambit.selected.length,1);
  });
});

test('bundled Mega packs keep their first choice, remaining claim, charge and physical cards across reload', () => {
  for(const kind of ['joker','upgrade','craft','standard']){
    const game=shopRun(),pack=GAMBIT_PACKS.find(pack=>pack.kind===kind&&pack.size==='mega');
    game.shop[2]={kind:'pack',pack:kind,size:'mega',price:pack.price,sold:false};
    withHost({tickets:64,puzzles:{gambit:game.snapshot()}},h=>{
      h.pick();h.action('buy',2);let paid=h.save().puzzles.gambit;
      assert.equal(paid.pack.remaining,2);assert.equal(paid.pack.options.length,5);
      h.action('packOption',0);h.action('claim');const partial=h.save().puzzles.gambit;
      assert.equal(partial.pack.remaining,1);assert.deepEqual(partial.pack.claimed,[0]);
      if(kind==='standard')assert.equal(partial.deckCards.length,53);
      h.reload();assert.deepEqual(h.save().puzzles.gambit,partial);
      h.key('Space');const restored=new GambitGame({saved:partial});restored.start();
      const second=restored.pack.options.findIndex((option,index)=>!restored.pack.claimed.includes(index)&&restored.optionAvailable(option));
      assert.ok(second>=0);h.action('packOption',second);h.action('claim');
      const claimed=h.save().puzzles.gambit;
      assert.equal(claimed.phase,'shop');assert.equal(claimed.pack,null);
      assert.equal(claimed.money,paid.money);assert.equal(h.save().tickets,64);
      if(kind==='standard')assert.equal(claimed.deckCards.length,54);
      h.reload();assert.deepEqual(h.save().puzzles.gambit,claimed);
    });
  }
});

test('shop rerolls preserve booster charges and the bundled victory screen continues the saved build into Endless', () => {
  const game=shopRun();game.money=100;
  withHost({puzzles:{gambit:game.snapshot()}},h=>{
    h.pick();h.action('buy',2);h.action('skip');const before=h.save().puzzles.gambit;
    h.action('reroll');const after=h.save().puzzles.gambit;
    assert.deepEqual(after.shop.slice(2),before.shop.slice(2));assert.equal(after.rerollsInShop,1);assert.ok(after.money<before.money);
  });
  const won=shopRun();won.round=24;won.roundScore=won.target;won.score=won.roundScore;won.phase='victory';won.won=true;won.shop=[];
  withHost({puzzles:{gambit:won.snapshot()}},h=>{
    h.pick();h.action('endless');let after=h.save().puzzles.gambit;
    assert.equal(after.endless,true);assert.deepEqual(after.jokers,won.jokers);assert.equal(after.round,24);
    h.action('next');assert.equal(h.save().puzzles.gambit.round,25);
    h.reload();assert.equal(h.save().puzzles.gambit.round,25);assert.equal(h.save().puzzles.gambit.endless,true);
  });
});
