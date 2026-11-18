import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import { setup } from '../dist/frontend.js';
import { TetrisGame } from '../src/tetris.js';
import { FroggyGame } from '../src/froggy.js';
import { SnakeGame } from '../src/puzzles.js';
import { restoreShop } from '../src/shop.js';

class ElementMock {
  constructor(tag = 'div') {
    this.tagName = tag.toUpperCase(); this.children = []; this.listeners = new Map();
    this.attributes = new Map(); this.style = {}; this.dataset = {}; this.className = '';
    this.textContent = ''; this.complete = true; this.naturalWidth = this.naturalHeight = 120;
    this.classList = { toggle: (name, on) => {
      const classes = new Set(this.className.split(' ').filter(Boolean));
      if (on) classes.add(name); else classes.delete(name); this.className = [...classes].join(' ');
    } };
  }
  append(...nodes) { this.children.push(...nodes); }
  appendChild(node) { this.append(node); return node; }
  replaceChildren(...nodes) { this.children = nodes; this.textContent = ''; }
  setAttribute(key, value) { this.attributes.set(key, value); }
  getAttribute(key) { return this.attributes.get(key) ?? null; }
  addEventListener(name, fn) {
    if (!this.listeners.has(name)) this.listeners.set(name, new Set()); this.listeners.get(name).add(fn);
  }
  removeEventListener(name, fn) { this.listeners.get(name)?.delete(fn); }
  dispatch(name, payload = {}) {
    for (const fn of [...(this.listeners.get(name) || [])]) fn({ target: this, preventDefault() {}, stopPropagation() {}, ...payload });
  }
  focus() {}
  getBoundingClientRect() { return { left: 0, top: 0, width: 360, height: 452 }; }
  setPointerCapture() {}
  hasPointerCapture() { return false; }
  releasePointerCapture() {}
  getContext() {
    if (this.tagName !== 'CANVAS') return null;
    return new Proxy({ createLinearGradient: () => ({ addColorStop() {} }) }, {
      get(target, name) { return name in target ? target[name] : () => {}; },
      set(target, name, value) { target[name] = value; return true; }
    });
  }
}
const flatten = node => [node, ...node.children.flatMap(child => child instanceof ElementMock ? flatten(child) : [])];

function withHost(initial, run) {
  mock.timers.enable({ apis: ['setTimeout'] });
  const names = ['window', 'document', 'Image', 'HTMLElement', 'localStorage', 'requestAnimationFrame', 'cancelAnimationFrame'];
  const previous = Object.fromEntries(names.map(name => [name, globalThis[name]]));
  const key = 'fuckass_funzone:v1:classics-integration';
  const cache = new Map([[key, JSON.stringify(initial)]]), queued = new Map();
  const window = new ElementMock('window'), document = new ElementMock('document');
  document.createElement = tag => new ElementMock(tag); document.createElementNS = (_, tag) => new ElementMock(tag);
  document.hidden = false;
  Object.assign(globalThis, { window, document, HTMLElement: ElementMock,
    Image: class extends ElementMock { constructor() { super('img'); } },
    localStorage: { getItem: k => cache.get(k) || null, setItem: (k, v) => cache.set(k, v) }
  });
  let rafId = 0, clock = 0, stop, placements;
  globalThis.requestAnimationFrame = fn => { queued.set(++rafId, fn); return rafId; };
  globalThis.cancelAnimationFrame = id => queued.delete(id);
  const mount = () => {
    placements = {};
    const handle = () => ({ root: new ElementMock('section'), setVisible(value) { this.visible = value; }, destroy() {} });
    stop = setup({ host: { extensionInstallationId: 'classics-integration' }, events: { on: () => () => {} }, ui: {
      createFloatWidget: () => (placements.widget = handle()), registerDrawerTab: () => (placements.drawer = handle()),
      registerInputBarAction: () => (placements.action = { onClick(fn) { this.click = fn; return () => {}; }, destroy() {} })
    } });
  };
  const nodes = () => flatten(placements.widget.root);
  const findClass = name => nodes().find(node => node.className.split(' ').includes(name));
  const api = {
    save: () => { mock.timers.tick(250); return JSON.parse(cache.get(key)); }, window,
    pick(id) {
      findClass('bb-phone-button').dispatch('click');
      const app = nodes().find(node => node.className === 'bb-app' && node.dataset.game === id);
      assert.ok(app, `${id} appears in the real bundled launcher`); app.dispatch('click');
    },
    key(code, target) { findClass('bb-float').dispatch('keydown', { target: target || findClass('bb-canvas'), code }); },
    tap(x, y) {
      const canvas = findClass('bb-canvas');
      canvas.dispatch('pointerdown', { pointerType: 'touch', pointerId: 1, clientX: x, clientY: y });
      canvas.dispatch('pointerup', { pointerId: 1, clientX: x, clientY: y });
    },
    primary: () => findClass('bb-mainbutton'),
    frames(count = 1) {
      for (let i = 0; i < count; i++) {
        clock += 120;
        for (const [id, fn] of [...queued]) { queued.delete(id); fn(clock); }
      }
    },
    reload() { stop(); mount(); placements.action.click(); },
  };
  try { mount(); run(api); }
  finally {
    stop?.(); assert.equal(queued.size, 0, 'teardown cancels the animation loop');
    mock.timers.reset();
    for (const [name, value] of Object.entries(previous)) {
      if (value === undefined) delete globalThis[name]; else globalThis[name] = value;
    }
  }
}

function solitaireFixture(foundations = [[], [], [], []], waste = [], tableau = [[], [], [], [], [], [], []]) {
  const used = new Set([...foundations.flat(), ...waste, ...tableau.flat().map(card => card.id)]);
  return { version: 1, status: 'paused', foundations, waste, tableau,
    stock: Array.from({ length: 52 }, (_, id) => id).filter(id => !used.has(id)),
    score: foundations.flat().length * 10, moves: 0, recycles: 0, won: false };
}

test('bundled classics route keyboard/touch input, freeze on pause, and preserve old and new saves across switching and reload', () => {
  const tetris = new TetrisGame({ random: () => .3 }); tetris.start();
  const snake = new SnakeGame({ random: () => .4 }).snapshot();
  const shop = restoreShop({ owned: ['cabinet_mint', 'snake_mint'], equipped: { cabinet: 'cabinet_mint', snake: 'snake_mint' } });
  withHost({ tickets: 43, bests: { bird: 23, snake: 7 }, shop,
    puzzles: { tetris: tetris.snapshot(), solitaire: solitaireFixture(), froggy: new FroggyGame({ random: () => .4 }).snapshot(), snake } }, h => {
    h.pick('tetris'); const originalX = h.save().puzzles.tetris.piece.x;
    h.key('ArrowLeft'); assert.equal(h.save().puzzles.tetris.piece.x, originalX - 1);
    h.tap(94, 415); assert.equal(h.save().puzzles.tetris.piece.x, originalX, 'touch Right reaches the same rules engine');
    const type = h.save().puzzles.tetris.piece.type;
    h.key('KeyC', new ElementMock('textarea')); assert.equal(h.save().puzzles.tetris.held, null, 'chat input does not hold a piece');
    h.key('KeyC'); assert.equal(h.save().puzzles.tetris.held, type, 'keyboard hold is persisted immediately');
    h.key('KeyP'); const pausedTetris = h.save().puzzles.tetris;
    h.key('ArrowLeft'); h.key('KeyC'); h.frames(12);
    assert.deepEqual(h.save().puzzles.tetris, pausedTetris, 'paused keys and animation cannot advance Tetris');
    assert.equal(h.primary().attributes.get('aria-label'), 'Resume');
    h.key('KeyP'); h.key('Space');
    const lockedTetris = h.save().puzzles.tetris;
    assert.ok(lockedTetris.board.flat().some(Boolean), 'hard drop locks actual cells in the bundled game');
    assert.ok(lockedTetris.score > 0);

    h.pick('solitaire'); const stock = h.save().puzzles.solitaire.stock.length;
    h.key('KeyD'); assert.equal(h.save().puzzles.solitaire.stock.length, stock - 1);
    h.tap(30, 80); assert.equal(h.save().puzzles.solitaire.stock.length, stock - 2, 'stock responds to touch');
    h.key('KeyZ'); assert.equal(h.save().puzzles.solitaire.stock.length, stock - 1);
    h.key('KeyP'); const pausedCards = h.save().puzzles.solitaire;
    h.key('KeyD'); h.key('KeyZ'); h.frames(4);
    assert.deepEqual(h.save().puzzles.solitaire, pausedCards, 'paused draw and undo do not alter the deal');

    h.pick('froggy'); h.frames(3); h.key('ArrowRight');
    assert.equal(h.save().puzzles.froggy.frog.x, 5);
    h.key('KeyP'); const pausedPond = h.save().puzzles.froggy;
    h.key('ArrowRight'); h.frames(10);
    assert.deepEqual(h.save().puzzles.froggy, pausedPond, 'paused traffic, logs, and frog remain frozen');
    h.key('KeyP'); h.frames(2); h.tap(300, 424);
    assert.equal(h.save().puzzles.froggy.frog.x, 6, 'touch pad performs a safe-bank hop');
    h.window.dispatch('blur'); assert.equal(h.primary().attributes.get('aria-label'), 'Resume');
    const blurPond = h.save().puzzles.froggy;
    h.pick('tetris'); assert.deepEqual(h.save().puzzles.tetris, lockedTetris, 'mode switching preserves stack, queue, and hold');
    h.pick('solitaire'); assert.deepEqual(h.save().puzzles.solitaire, pausedCards, 'mode switching preserves the card deal');
    h.pick('froggy'); h.window.dispatch('blur');
    assert.deepEqual(h.save().puzzles.froggy, blurPond);
    const beforeReload = h.save();
    h.reload(); assert.equal(h.primary().attributes.get('aria-label'), 'Resume', 'reload restores the selected game paused');
    h.key('ArrowLeft'); h.frames(3); h.key('KeyP'); h.key('KeyP');
    const reloaded = h.save();
    assert.deepEqual(reloaded.puzzles.froggy, beforeReload.puzzles.froggy);
    assert.deepEqual(reloaded.puzzles.tetris, beforeReload.puzzles.tetris);
    assert.deepEqual(reloaded.puzzles.solitaire, beforeReload.puzzles.solitaire);
    assert.deepEqual(reloaded.puzzles.snake, snake);
    assert.deepEqual(reloaded.shop, shop); assert.equal(reloaded.tickets, 43);
    assert.equal(reloaded.bests.bird, 23); assert.equal(reloaded.bests.snake, 7);
  });
});

test('bundled Solitaire awards a new foundation milestone once even after keyboard undo and replay', () => {
  const foundations = [Array.from({ length: 9 }, (_, id) => id), [], [], []];
  withHost({ tickets: 14, bests: { solitaire: 90 }, puzzles: { solitaire: solitaireFixture(foundations, [9]) } }, h => {
    h.pick('solitaire');
    h.tap(80, 85); h.key('KeyF');
    assert.equal(h.save().puzzles.solitaire.score, 100);
    assert.equal(h.save().tickets, 15); assert.equal(h.save().bests.solitaire, 100);
    h.key('KeyZ'); assert.equal(h.save().puzzles.solitaire.score, 90);
    assert.equal(h.save().tickets, 15, 'undo keeps the earned ticket and the best milestone');
    h.tap(80, 85); h.key('KeyF');
    assert.equal(h.save().puzzles.solitaire.score, 100);
    assert.equal(h.save().tickets, 15, 'replaying the same foundation card cannot farm tickets');
    h.reload(); h.key('KeyP'); h.key('KeyZ');
    assert.equal(h.save().puzzles.solitaire.score, 100, 'reload preserves the board and clears only session undo');
    assert.equal(h.save().tickets, 15);
  });
});

test('bundled Solitaire keyboard undo remains available after the winning move', () => {
  const foundations = Array.from({ length: 4 }, (_, suit) =>
    Array.from({ length: suit === 3 ? 12 : 13 }, (__, rank) => suit * 13 + rank));
  withHost({ tickets: 2, bests: { solitaire: 510 }, puzzles: { solitaire: solitaireFixture(foundations, [51]) } }, h => {
    h.pick('solitaire'); h.tap(80, 85); h.key('KeyF');
    assert.equal(h.save().puzzles.solitaire.won, true);
    assert.equal(h.save().puzzles.solitaire.status, 'dead');
    h.key('KeyZ');
    assert.equal(h.save().puzzles.solitaire.won, false);
    assert.equal(h.save().puzzles.solitaire.score, 510);
    assert.deepEqual(h.save().puzzles.solitaire.waste, [51]);
    assert.equal(h.primary().attributes.get('aria-label'), 'Pause', 'undo returns the won deal to active play');
    h.tap(80, 85); h.key('KeyF');
    assert.equal(h.save().puzzles.solitaire.won, true);
    assert.equal(h.save().tickets, 2, 'replaying victory does not create a new score milestone');
  });
});
