import test from 'node:test';
import assert from 'node:assert/strict';
import { GAMBIT_SUIT_COLORS, drawGambitCard, drawGambitJoker, drawGambitDeck, drawGambitPack } from '../src/gambit-art.js';
import { GAMBIT_JOKERS } from '../src/gambit-rules.js';

function recordingContext() {
  const calls = [], fills = [], labels = [], stack = [];
  const state = { fillStyle: '#000', strokeStyle: '#000', lineWidth: 1, font: '', textAlign: 'left', textBaseline: 'alphabetic' };
  const ctx = new Proxy({
    save() { stack.push({ ...state }); calls.push(['save']); },
    restore() { assert.ok(stack.length, 'restore has a matching save'); Object.assign(state, stack.pop()); calls.push(['restore']); },
    fill() { fills.push(state.fillStyle); calls.push(['fill', state.fillStyle]); },
    fillText(value, ...args) { labels.push({ value: String(value), color: state.fillStyle }); calls.push(['fillText', String(value), ...args]); },
  }, {
    get(target, key) {
      if (key in target) return target[key];
      if (key in state) return state[key];
      return (...args) => { assert.ok(args.filter(arg => typeof arg === 'number').every(Number.isFinite), key + ' has finite coordinates'); calls.push([key, ...args]); };
    },
    set(_, key, value) { state[key] = value; return true; },
  });
  return { ctx, calls, fills, labels, state, stack };
}

function boundedContext() {
  const points = [], stack = [];
  let matrix = [1, 0, 0, 1, 0, 0];
  const state = { font: '10px monospace', textAlign: 'left' };
  const transform = (x, y) => {
    assert.ok(Number.isFinite(x) && Number.isFinite(y));
    points.push([matrix[0] * x + matrix[2] * y + matrix[4], matrix[1] * x + matrix[3] * y + matrix[5]]);
  };
  const multiply = ([A, B, C, D, E, F]) => {
    const [a, b, c, d, e, f] = matrix;
    matrix = [a * A + c * B, b * A + d * B, a * C + c * D, b * C + d * D, a * E + c * F + e, b * E + d * F + f];
  };
  const rect = (x, y, w, h) => { for (const [a, b] of [[x, y], [x + w, y], [x, y + h], [x + w, y + h]]) transform(a, b); };
  const ctx = new Proxy({
    save() { stack.push({ matrix: [...matrix], state: { ...state } }); },
    restore() { const old = stack.pop(); assert.ok(old); matrix = old.matrix; Object.assign(state, old.state); },
    translate(x, y) { multiply([1, 0, 0, 1, x, y]); },
    scale(x, y) { multiply([x, 0, 0, y, 0, 0]); },
    rotate(angle) { multiply([Math.cos(angle), Math.sin(angle), -Math.sin(angle), Math.cos(angle), 0, 0]); },
    moveTo: transform, lineTo: transform,
    roundRect: rect, fillRect: rect, strokeRect: rect,
    ellipse(x, y, rx, ry) { rect(x - rx, y - ry, rx * 2, ry * 2); },
    arc(x, y, r) { rect(x - r, y - r, r * 2, r * 2); },
    bezierCurveTo(...coords) { for (let i = 0; i < coords.length; i += 2) transform(coords[i], coords[i + 1]); },
    quadraticCurveTo(...coords) { for (let i = 0; i < coords.length; i += 2) transform(coords[i], coords[i + 1]); },
    fillText(value, x, y, maxWidth) {
      const size = Number(state.font.match(/([\d.]+)px/)?.[1] || 10);
      const width = Math.min(String(value).length * size * .6, maxWidth ?? Infinity);
      const start = state.textAlign === 'center' ? x - width / 2 : state.textAlign === 'right' ? x - width : x;
      rect(start, y - size, width, size);
    },
  }, {
    get(target, key) { return key in target ? target[key] : key in state ? state[key] : () => {}; },
    set(_, key, value) { state[key] = value; return true; },
  });
  return { ctx, points, stack };
}

test('four suits have distinct colors and number cards contain their actual pips plus mirrored corner suits', () => {
  assert.equal(new Set(GAMBIT_SUIT_COLORS).size, 4);
  assert.ok(Object.isFrozen(GAMBIT_SUIT_COLORS));
  for (let suit = 0; suit < 4; suit++) for (let rank = 2; rank <= 10; rank++) {
    const art = recordingContext(); drawGambitCard(art.ctx, suit * 13 + rank - 1, 5, 9, 70, 100);
    assert.equal(art.fills.filter(color => color === GAMBIT_SUIT_COLORS[suit]).length, rank + 2, `suit ${suit} rank ${rank} has exact pips`);
    assert.equal(art.labels.filter(label => label.value === String(rank)).length, 2, 'rank appears in both corners');
    assert.ok(art.calls.some(call => call[0] === 'rotate' && call[1] === Math.PI), 'lower indices are mirrored');
    assert.equal(art.stack.length, 0);
  }
});

test('Aces use a large central suit and court ranks have distinct mirrored illustrations', () => {
  const ace = recordingContext(); drawGambitCard(ace.ctx, 0, 0, 0, 70, 100);
  assert.equal(ace.fills.filter(color => color === GAMBIT_SUIT_COLORS[0]).length, 3, 'Ace has one central suit and two corner suits');
  assert.equal(ace.labels.filter(label => label.value === 'A').length, 2);
  const geometry = [];
  for (let rank = 11; rank <= 13; rank++) {
    const art = recordingContext(); drawGambitCard(art.ctx, rank - 1, 0, 0, 70, 100);
    const label = ({11:'J',12:'Q',13:'K'})[rank];
    assert.equal(art.labels.filter(item => item.value === label).length, 2);
    geometry.push(JSON.stringify(art.calls.filter(call => call[0] !== 'fillText')));
  }
  assert.equal(new Set(geometry).size, 3, 'Jack, Queen, and King differ in drawing geometry, not just letters');
});

test('every Joker has distinct original geometry and a card silhouette', () => {
  assert.equal(GAMBIT_JOKERS.length, 75, 'the expanded collection has seventy-five illustrated Jokers');
  const drawings = [];
  for (const joker of GAMBIT_JOKERS) {
    const art = recordingContext(); drawGambitJoker(art.ctx, joker.id, 17, 4, 60, 86, { selected: true });
    assert.ok(art.calls.some(call => call[0] === 'roundRect' && call[3] === 98 && call[4] === 136), joker.id + ' uses a playing-card frame');
    assert.equal(art.calls.filter(call => call[0] === 'fillText' && call[2] === 12 && 'JOKER'.includes(call[1])).length, 5, 'Joker has its vertical label');
    assert.equal(art.stack.length, 0);
    drawings.push(JSON.stringify(art.calls.filter(call => !['fillText', 'fill', 'stroke'].includes(call[0]))));
  }
  assert.equal(new Set(drawings).size, GAMBIT_JOKERS.length, 'every collectible Joker has different path geometry, independently of its name and colors');
});

test('card fanning, boosts, sealed boosters, and deck counts keep the parent canvas state intact', () => {
  const art = recordingContext(); art.ctx.fillStyle = '#123456'; art.ctx.font = '12px serif';
  drawGambitCard(art.ctx, 51, 10, 20, 56, 80, { selected: true, boost: 20, tilt: -.12 });
  assert.ok(art.calls.some(call => call[0] === 'rotate' && call[1] === -.12));
  assert.ok(art.labels.some(label => label.value === '+20'));
  assert.equal(art.state.fillStyle, '#123456'); assert.equal(art.state.font, '12px serif');
  drawGambitDeck(art.ctx, 10, 20, 50, 80, 37);
  assert.ok(art.labels.some(label => label.value === '37/52'));
  const joker = recordingContext(), upgrade = recordingContext();
  drawGambitPack(joker.ctx, 'joker', 0, 0, 55, 85); drawGambitPack(upgrade.ctx, 'upgrade', 0, 0, 55, 85);
  assert.ok(joker.labels.some(label => label.value === 'JOKER')); assert.ok(upgrade.labels.some(label => label.value === 'UPGRADE'));
  assert.notDeepEqual(joker.calls.filter(call => call[0] !== 'fillText'), upgrade.calls.filter(call => call[0] !== 'fillText'));
  assert.equal(art.stack.length, 0); assert.equal(art.state.fillStyle, '#123456');
});

test('invalid card coordinates and IDs paint nothing, while narrow art still has finite coordinates', () => {
  const art = recordingContext();
  drawGambitCard(art.ctx, -1, 0, 0, 50, 70); drawGambitCard(art.ctx, 4096, 0, 0, 50, 70);
  drawGambitCard(art.ctx, 0, NaN, 0, 50, 70); drawGambitCard(art.ctx, 0, 0, 0, 0, 70);
  assert.equal(art.calls.length, 0);
  for (const [w, h] of [[28,40], [50,70], [88,126]]) {
    drawGambitCard(art.ctx, 38, 0, 0, w, h); drawGambitJoker(art.ctx, 'last_laugh', 0, 0, w, h);
    drawGambitDeck(art.ctx, 0, 0, w, h, 0); drawGambitPack(art.ctx, 'upgrade', 0, 0, w, h);
  }
  assert.equal(art.stack.length, 0);
});

test('physical copies and crafted faces draw their resolved ranks and suits rather than their identity', () => {
  const original = recordingContext(), copy = recordingContext();
  drawGambitCard(original.ctx, 0, 0, 0, 60, 84);
  drawGambitCard(copy.ctx, 52, 0, 0, 60, 84);
  assert.deepEqual(copy.calls, original.calls, 'a copied Ace has the same face as the original, with its own physical ID');
  const crafted = recordingContext(), king = recordingContext();
  drawGambitCard(crafted.ctx, 52, 0, 0, 60, 84, { rank: 13, suit: 3 });
  drawGambitCard(king.ctx, 51, 0, 0, 60, 84);
  assert.deepEqual(crafted.calls, king.calls, 'rank and suit crafting changes pips, corner indices and the court portrait');
  for (let suit = 0; suit < 4; suit++) {
    const art = recordingContext(); drawGambitCard(art.ctx, 1024 + suit, 0, 0, 60, 84, { rank: 8, suit });
    assert.equal(art.fills.filter(color => color === GAMBIT_SUIT_COLORS[suit]).length, 10);
    assert.equal(art.labels.filter(label => label.value === '8').length, 2);
  }
});

test('enhancements and seals retain the card face while adding distinct visible marks', () => {
  const enhanced = [];
  for (const enhancement of ['bonus', 'mult', 'glass', 'steel', 'gold']) {
    const art = recordingContext(); drawGambitCard(art.ctx, 61, 0, 0, 60, 84, { enhancement });
    assert.equal(art.labels.filter(label => label.value === '10').length, 2, 'enhancing a card does not erase its two rank indices');
    assert.ok(art.labels.some(label => ['CHIPS', '+MULT', 'GLASS', 'HELD X', 'GOLD'].includes(label.value)));
    assert.equal(art.stack.length, 0); enhanced.push(JSON.stringify(art.calls));
  }
  assert.equal(new Set(enhanced).size, 5, 'all five enhancements have a distinct visible treatment');
  const sealed = [];
  for (const seal of ['red', 'blue', 'gold']) {
    const art = recordingContext(); drawGambitCard(art.ctx, 51, 0, 0, 60, 84, { seal });
    assert.equal(art.labels.filter(label => label.value === 'K').length, 2);
    sealed.push(JSON.stringify(art.calls)); assert.equal(art.stack.length, 0);
  }
  assert.equal(new Set(sealed).size, 3, 'red, blue and gold seals differ in shape as well as color');
});

test('all eight booster wrappers communicate family and Mega size, and deck labels reflect permanent additions', () => {
  const drawings = [];
  for (const kind of ['joker', 'upgrade', 'craft', 'standard']) for (const size of ['normal', 'mega']) {
    const art = recordingContext(); drawGambitPack(art.ctx, kind, 0, 0, 50, 70, { size });
    assert.ok(art.labels.some(label => label.value === kind.toUpperCase()));
    assert.equal(art.labels.some(label => label.value === 'MEGA'), size === 'mega');
    assert.equal(art.stack.length, 0); drawings.push(JSON.stringify(art.calls));
  }
  assert.equal(new Set(drawings).size, 8);
  const art = recordingContext(); drawGambitDeck(art.ctx, 0, 0, 40, 65, 41, 57);
  assert.ok(art.labels.some(label => label.value === '41/57'));
});

test('all collectible art stays within its supplied rectangle at narrow and high-DPI sizes', () => {
  const draws = [
    ...GAMBIT_JOKERS.map(joker => [joker.id, (ctx, x, y, w, h) => drawGambitJoker(ctx, joker.id, x, y, w, h)]),
    ...['bonus', 'mult', 'glass', 'steel', 'gold'].map(enhancement => [enhancement, (ctx, x, y, w, h) => drawGambitCard(ctx, 4095, x, y, w, h, { rank: 13, suit: 3, enhancement, seal: 'gold' })]),
    ...['joker', 'upgrade', 'craft', 'standard'].flatMap(kind => ['normal', 'mega'].map(size => [kind + size, (ctx, x, y, w, h) => drawGambitPack(ctx, kind, x, y, w, h, { size })])),
    ['deck', (ctx, x, y, w, h) => drawGambitDeck(ctx, x, y, w, h, 41, 57)],
  ];
  for (const [name, draw] of draws) for (const [w, h] of [[28, 40], [60, 84], [88, 126]]) {
    const art = boundedContext(), x = 17, y = 23; draw(art.ctx, x, y, w, h);
    assert.ok(art.points.length > 10, name + ' paints actual geometry');
    for (const [a, b] of art.points) assert.ok(a >= x - 1 && a <= x + w + 1 && b >= y - 1 && b <= y + h + 1,
      `${name} at ${w}×${h} stays in its rectangle (${a}, ${b})`);
    assert.equal(art.stack.length, 0);
  }
});
