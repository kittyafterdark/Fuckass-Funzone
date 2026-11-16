import test from 'node:test';
import assert from 'node:assert/strict';
import { setup } from '../dist/frontend.js';
import { ChessGame } from '../src/chess.js';

class ElementMock {
  constructor(tag = 'div') {
    this.tagName = tag.toUpperCase(); this.children = []; this.listeners = new Map();
    this.attributes = new Map(); this.style = {}; this.dataset = {}; this.className = '';
    this.textContent = ''; this.complete = true; this.naturalWidth = this.naturalHeight = 120; this.value = ''; this.hidden = false;
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
  dispatch(name, payload = {}) { for (const fn of [...(this.listeners.get(name) || [])]) fn({ type: name, target: this, preventDefault() {}, stopPropagation() {}, ...payload }); }
  focus() {}
  getBoundingClientRect() { return { left: 0, top: 0, width: 360, height: 452 }; }
  setPointerCapture() {} hasPointerCapture() { return false; } releasePointerCapture() {}
  getContext() {
    if (this.tagName !== 'CANVAS') return null;
    return new Proxy({ createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }) }, {
      get(target, name) { return name in target ? target[name] : () => {}; },
      set(target, name, value) { target[name] = value; return true; },
    });
  }
}
const flatten = node => [node, ...node.children.flatMap(child => child instanceof ElementMock ? flatten(child) : [])];

function withHost(initial, run) {
  const names = ['window', 'document', 'Image', 'HTMLElement', 'localStorage', 'requestAnimationFrame', 'cancelAnimationFrame'];
  const previous = Object.fromEntries(names.map(name => [name, globalThis[name]]));
  const key = 'fuckass_funzone:v1:sweets-integration';
  const cache = new Map([[key, JSON.stringify(initial)]]), queued = new Map(), audio = { contexts: 0, notes: 0 };
  const window = new ElementMock('window'), document = new ElementMock('document');
  document.createElement = tag => new ElementMock(tag); document.createElementNS = (_, tag) => new ElementMock(tag); document.hidden = false;
  const param = { setValueAtTime() {}, exponentialRampToValueAtTime() {} };
  window.AudioContext = class { constructor() { audio.contexts++; this.state = 'running'; this.currentTime = 0; this.destination = {}; }
    createOscillator() { audio.notes++; return { type: '', frequency: param, connect() {}, start() {}, stop() {} }; }
    createGain() { return { gain: param, connect() {} }; } close() {} };
  Object.assign(globalThis, { window, document, HTMLElement: ElementMock,
    Image: class extends ElementMock { constructor() { super('img'); } },
    localStorage: { getItem: k => cache.get(k) || null, setItem: (k, v) => cache.set(k, v) } });
  let rafId = 0, clock = 0, stop, placements;
  globalThis.requestAnimationFrame = fn => { queued.set(++rafId, fn); return rafId; };
  globalThis.cancelAnimationFrame = id => queued.delete(id);
  const mount = () => {
    placements = {};
    const handle = () => ({ root: new ElementMock('section'), setVisible(value) { this.visible = value; }, destroy() {} });
    stop = setup({ host: { extensionInstallationId: 'sweets-integration' }, events: { on: () => () => {} }, ui: {
      createFloatWidget: () => (placements.widget = handle()), registerDrawerTab: () => (placements.drawer = handle()),
      registerInputBarAction: () => (placements.action = { onClick(fn) { this.click = fn; return () => {}; }, destroy() {} }),
    } });
  };
  const nodes = () => flatten(placements.widget.root);
  const findClass = name => nodes().find(node => node.className.split(' ').includes(name));
  const api = {
    audio, window, save: () => JSON.parse(cache.get(key)),
    pick(id) {
      findClass('bb-phone-button').dispatch('click');
      const app = nodes().find(node => node.className === 'bb-app' && node.dataset.game === id);
      assert.ok(app, `${id} appears in the real bundled launcher`); app.dispatch('click');
    },
    key(code, target, extra = {}) { findClass('bb-float').dispatch('keydown', { target: target || findClass('bb-canvas'), code, ...extra }); },
    tap(x, y) {
      const canvas = findClass('bb-canvas');
      canvas.dispatch('pointerdown', { pointerType: 'touch', pointerId: 1, clientX: x, clientY: y });
      canvas.dispatch('pointerup', { pointerType: 'touch', pointerId: 1, clientX: x, clientY: y });
    },
    frames(count = 1) { for (let i = 0; i < count; i++) { clock += 120; for (const [id, fn] of [...queued]) { queued.delete(id); fn(clock); } } },
    primary: () => findClass('bb-mainbutton'), findClass,
    drawerSelect: label => flatten(placements.drawer.root).find(node => node.tagName === 'SELECT' && node.attributes.get('aria-label') === label),
    reaction: () => ({ hidden: findClass('bb-reaction').hidden, art: findClass('bb-reaction-face').dataset.art, line: findClass('bb-reaction-text').textContent }),
    reload() { stop(); mount(); placements.action.click(); },
  };
  try { mount(); placements.action.click(); run(api); }
  finally {
    stop?.(); assert.equal(queued.size, 0, 'teardown cancels the animation loop');
    for (const [name, value] of Object.entries(previous)) { if (value === undefined) delete globalThis[name]; else globalThis[name] = value; }
  }
}

test('bundled Catmate Chess plays by keyboard and touch, lets Gabu reply, pauses, and survives reload', () => {
  withHost({ tickets: 5 }, h => {
    h.pick('chess');
    h.key('ArrowUp'); h.key('Enter'); h.key('ArrowUp'); h.key('ArrowUp'); h.key('Enter');
    const afterMove = h.save().puzzles.chess;
    assert.equal(afterMove.board[36], 'P', 'keyboard moved the e-pawn two squares');
    assert.equal(afterMove.turn, 'b');
    h.key('KeyP'); h.frames(30); assert.equal(h.save().puzzles.chess.turn, 'b', 'paused Gabu does not move');
    h.key('KeyP'); h.frames(30);
    const replied = h.save().puzzles.chess; assert.equal(replied.turn, 'w', 'Gabu replied after thinking');
    h.tap(20 + 6 * 40 + 20, 62 + 7 * 40 + 20); h.tap(20 + 5 * 40 + 20, 62 + 5 * 40 + 20);
    assert.equal(h.save().puzzles.chess.board[45], 'N', 'touch moved the knight to f3');
    h.key('KeyZ'); assert.equal(h.save().puzzles.chess.board[62], 'N', 'Z takes the move back');
    h.reload(); assert.equal(h.primary().attributes.get('aria-label'), 'Resume');
    assert.deepEqual(h.save().puzzles.chess.board, replied.board);
  });
});

test('bundled Berry Drop, Tic Tac Treats, Cake Tower, Bubble Bloom, Boop-a-Bun, Wobbly Wafers and Gacha Match accept their controls and save', () => {
  withHost({}, h => {
    h.pick('berry'); h.key('Digit4'); h.frames(10);
    assert.equal(h.save().puzzles.berry.board.filter(v => v === 1).length, 1, 'key 4 dropped a strawberry');
    h.tap(30, 300); h.frames(10);
    assert.ok(h.save().puzzles.berry.board.filter(v => v === 1).length >= 1);
    h.pick('tictac'); h.key('Digit5');
    assert.equal(h.save().puzzles.tictac.board[4], 1, 'key 5 placed in the center');
    h.frames(10); assert.equal(h.save().puzzles.tictac.board.filter(v => v === 2).length, 1, 'Gabu answered');
    h.pick('cake'); h.key('Space'); h.frames(12);
    const cake = h.save().puzzles.cake; assert.ok(cake.tiers.length + (3 - cake.hearts) === 1, 'Space dropped exactly one tier');
    h.pick('bubble'); const before = h.save().puzzles.bubble;
    h.tap(180, 120); h.frames(12);
    const after = h.save().puzzles.bubble;
    assert.notDeepEqual(after.grid, before.grid, 'release fired a bubble into the board');
    h.key('KeyC'); assert.deepEqual([h.save().puzzles.bubble.current, h.save().puzzles.bubble.next], [after.next, after.current], 'C swaps');
    const typed = h.save().puzzles.bubble; h.key('Space', new ElementMock('textarea')); h.frames(6);
    assert.deepEqual(h.save().puzzles.bubble.grid, typed.grid, 'Space typed in the chat box never fires a bubble');
    h.pick('boop'); h.frames(12); h.key('Digit5'); h.key('ArrowLeft'); h.key('Space'); h.tap(70, 150);
    const boop = h.save().puzzles.boop; assert.ok(boop.timeLeft < 45, 'the round clock runs'); assert.equal(boop.cursor, 0, 'the tap moved the cursor to the first burrow');
    h.key('KeyP'); const pausedBoop = h.save().puzzles.boop; h.frames(10); assert.equal(h.save().puzzles.boop.timeLeft, pausedBoop.timeLeft, 'pause stops the clock');
    h.key('KeyP');
    h.pick('wafer'); h.tap(180, 290); h.frames(2); h.tap(5, 5); h.frames(1);
    const wafer = h.save().puzzles.wafer; assert.equal(wafer.layers.flat().filter(Boolean).length, 36, 'one wafer moved from the middle to the top');
    assert.ok(wafer.layers.length === 13 || wafer.status === 'dead', 'the pulled wafer started a new top layer');
    h.pick('memory'); h.key('Space'); h.key('Space'); h.key('ArrowRight'); h.key('Space');
    assert.equal(h.save().puzzles.memory.moves, 1, 'the first Space ends the countdown, then two keyboard flips make one turn');
    for (const id of ['berry', 'tictac', 'cake', 'bubble', 'boop', 'wafer', 'memory']) h.pick(id);
    h.reload(); assert.equal(h.primary().attributes.get('aria-label'), 'Resume', 'reload resumes the last game paused');
  });
});

test('Gabu judges the new games with Kitty\u2019s face art, and Sound off stays silent', () => {
  withHost({ settings: { sound: false, gabuReactions: true } }, h => {
    h.pick('cake'); h.frames(1); h.key('Space'); h.frames(12);
    assert.equal(h.audio.notes, 0, 'no oscillator plays while Sound is off, exactly like the rest of the arcade');
    findControl(h, 'Toggle sound').dispatch('click'); assert.equal(h.save().settings.sound, true);
    h.key('Space'); h.frames(12);
    assert.ok(h.audio.notes > 0, 'the same synth plays the new games once Sound is on');
  });
  const board = Array(64).fill(''); board[4] = 'k'; board[27] = 'q'; board[36] = 'P'; board[60] = 'K';
  // A high existing best keeps the NEW BEST reaction out of the way, so this checks the queen reaction alone.
  withHost({ bests: { chess: 999 }, puzzles: { chess: { version: 1, board, turn: 'w', castling: '', ep: -1, halfmove: 0, fullmove: 12, level: 'normal', score: 0,
    result: null, reason: null, lastMove: null, status: 'paused' } } }, h => {
    h.pick('chess'); assert.equal(h.save().puzzles.chess.board[27], 'q', 'the hanging-queen save restored');
    h.tap(200, 242); h.tap(160, 202); h.frames(1);
    assert.equal(h.save().puzzles.chess.board[27], 'P', 'exd5 captured the queen');
    const shown = h.reaction();
    assert.equal(shown.hidden, false, 'Gabu reacts to losing the queen');
    assert.equal(shown.art, 'gabu_shock', 'with Kitty\u2019s existing shocked Gabu face');
    assert.ok(shown.line.length > 10);
  });
  withHost({ bests: { chess: 5 }, puzzles: { chess: { version: 1, board, turn: 'w', castling: '', ep: -1, halfmove: 0, fullmove: 12, level: 'normal', score: 0,
    result: null, reason: null, lastMove: null, status: 'paused' } } }, h => {
    h.pick('chess'); h.tap(200, 242); h.tap(160, 202); h.frames(1);
    assert.equal(h.reaction().art, 'gabu_hype', 'passing the old best of 5 announces a NEW BEST with the hype face');
  });
  // A reload in the middle of the run that set the record must not announce the same record again.
  const saved = { version: 1, board, turn: 'w', castling: '', ep: -1, halfmove: 0, fullmove: 12, level: 'normal', score: 0, result: null, reason: null, lastMove: null, status: 'paused' };
  const held = new ChessGame({ saved }).score; assert.ok(held > 0);
  withHost({ bests: { chess: held }, puzzles: { chess: saved } }, h => {
    h.pick('chess'); h.tap(200, 242); h.tap(160, 202); h.frames(1);
    assert.equal(h.reaction().art, 'gabu_shock', 'the run already holds the record, so Gabu reacts to the queen instead');
  });
});

test('difficulty and pace choices persist and apply to the next new game, not the current one', () => {
  withHost({}, h => {
    h.pick('chess'); h.key('ArrowUp'); h.key('Enter'); h.key('ArrowUp'); h.key('ArrowUp'); h.key('Enter');
    const select = h.drawerSelect('Catmate Chess difficulty'); assert.equal(select.value, 'normal');
    select.value = 'hard'; select.dispatch('change');
    assert.equal(h.save().gabuLevels.chess, 'hard'); assert.equal(h.save().puzzles.chess.level, 'normal', 'the running game keeps its level');
    findRestart(h).dispatch('click'); assert.equal(h.save().puzzles.chess.level, 'hard', 'restart starts a Hard game');
    const pace = h.drawerSelect('Bubble Bloom difficulty'); pace.value = 'chill'; pace.dispatch('change');
    h.pick('bubble'); findRestart(h).dispatch('click'); assert.equal(h.save().puzzles.bubble.pace, 'chill');
    h.reload(); assert.equal(h.drawerSelect('Catmate Chess difficulty').value, 'hard'); assert.equal(h.drawerSelect('Bubble Bloom difficulty').value, 'chill');
  });
});
function findControl(h, title) { return flatten(h.findClass('bb-controls')).find(n => n.title === title); }
function findRestart(h) { return findControl(h, 'Restart game'); }

test('touches on the phone are claimed so scrolling the launcher never drags the widget', () => {
  withHost({}, h => {
    const press = pointerType => { let claimed = false; h.findClass('bb-phone').dispatch('pointerdown', { pointerType, preventDefault() { claimed = true; } }); return claimed; };
    assert.equal(press('touch'), true, 'the host skips drags for prevented pointerdowns, so the list scrolls instead');
    assert.equal(press('mouse'), false, 'a mouse can still drag the widget from anywhere, as before');
  });
});
