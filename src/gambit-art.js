/** Original vector card artwork. Suit order matches the rules: C, D, S, H. */
import { GAMBIT_JOKERS } from './gambit-rules.js';

export const GAMBIT_SUIT_COLORS = Object.freeze(['#17765b', '#c05a11', '#244d93', '#c8324a']);

const ivory = '#fff9e9', ink = '#253748', gold = '#e7b84d';
const validRect = (ctx, x, y, w, h) => !!ctx && [x, y, w, h].every(Number.isFinite) && w > 0 && h > 0;
const frame = (ctx, x, y, w, h, fill, stroke = null, radius = 5, lineWidth = 1) => {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); ctx.fillStyle = fill; ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke(); }
};
const oval = (ctx, x, y, rx, ry, fill, stroke = null) => {
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
};
const polygon = (ctx, points, fill, stroke = null, lineWidth = 1) => {
  ctx.beginPath(); points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke(); }
};
const label = (ctx, value, x, y, size, color = ink, maxWidth = 90) => {
  ctx.font = `900 ${size}px ui-monospace,Consolas,monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = color; ctx.fillText(String(value), x, y, maxWidth);
};
const line = (ctx, points, color, width = 2) => {
  ctx.beginPath(); points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();
};

function suit(ctx, kind, x, y, size, color) {
  const r = size / 2;
  ctx.beginPath(); ctx.fillStyle = color;
  if (kind === 1) {
    ctx.moveTo(x, y - r); ctx.lineTo(x + r * .7, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r * .7, y); ctx.closePath();
  } else if (kind === 3) {
    ctx.moveTo(x, y + r);
    ctx.bezierCurveTo(x - r * 1.65, y - r * .1, x - r * .8, y - r * 1.5, x, y - r * .45);
    ctx.bezierCurveTo(x + r * .8, y - r * 1.5, x + r * 1.65, y - r * .1, x, y + r);
  } else if (kind === 2) {
    ctx.moveTo(x, y - r);
    ctx.bezierCurveTo(x - r * 1.8, y + r * .5, x - r * .55, y + r, x, y + r * .25);
    ctx.bezierCurveTo(x + r * .55, y + r, x + r * 1.8, y + r * .5, x, y - r);
    ctx.moveTo(x, y); ctx.lineTo(x - r * .38, y + r); ctx.lineTo(x + r * .38, y + r); ctx.closePath();
  } else {
    for (const [dx, dy] of [[0, -.48], [-.47, .15], [.47, .15]]) {
      ctx.moveTo(x + (dx + .5) * r, y + dy * r); ctx.arc(x + dx * r, y + dy * r, r * .5, 0, Math.PI * 2);
    }
    ctx.moveTo(x, y); ctx.lineTo(x - r * .38, y + r); ctx.lineTo(x + r * .38, y + r); ctx.closePath();
  }
  ctx.fill();
}

const pipPositions = Object.freeze({
  2: [[50, 39], [50, 101]],
  3: [[50, 36], [50, 70], [50, 104]],
  4: [[32, 39], [68, 39], [32, 101], [68, 101]],
  5: [[32, 39], [68, 39], [50, 70], [32, 101], [68, 101]],
  6: [[32, 36], [68, 36], [32, 70], [68, 70], [32, 104], [68, 104]],
  7: [[32, 36], [68, 36], [50, 53], [32, 70], [68, 70], [32, 104], [68, 104]],
  8: [[32, 36], [68, 36], [50, 53], [32, 70], [68, 70], [50, 87], [32, 104], [68, 104]],
  9: [[32, 33], [68, 33], [32, 57], [68, 57], [50, 70], [32, 83], [68, 83], [32, 107], [68, 107]],
  10: [[32, 33], [68, 33], [50, 45], [32, 57], [68, 57], [32, 83], [68, 83], [50, 95], [32, 107], [68, 107]],
});

function corner(ctx, rank, kind, color) {
  label(ctx, ({ 1: 'A', 11: 'J', 12: 'Q', 13: 'K' })[rank] || rank, 11, 21, 20, color, 21);
  suit(ctx, kind, 11, 31, 11, color);
}

function courtHalf(ctx, rank, kind, color) {
  const accent = ['#45ac8b', '#ef9a35', '#5687d1', '#e97987'][kind];
  // Each court uses the same mirrored framing, but a distinct headpiece and silhouette.
  polygon(ctx, [[28, 70], [34, 58], [45, 54], [55, 54], [66, 58], [72, 70]], color, ink);
  polygon(ctx, [[34, 70], [40, 57], [49, 62], [59, 57], [66, 70]], gold, ink);
  line(ctx, [[42, 59], [50, 68], [58, 59]], accent, 3);
  if (rank === 12) oval(ctx, 50, 48, 16, 17, '#5b4456');
  oval(ctx, 50, 47, 11, 13, '#f3d09e', ink);
  if (rank === 11) {
    polygon(ctx, [[36, 38], [38, 29], [51, 32], [59, 28], [64, 38]], color, ink);
    polygon(ctx, [[57, 33], [64, 21], [68, 22], [61, 35]], ivory, ink);
    frame(ctx, 37, 37, 28, 4, accent, ink, 1);
  } else if (rank === 12) {
    polygon(ctx, [[37, 36], [37, 27], [44, 32], [50, 23], [56, 32], [63, 27], [63, 36]], gold, ink);
    oval(ctx, 50, 31, 2.5, 3, color);
    oval(ctx, 35, 47, 2, 3, gold); oval(ctx, 65, 47, 2, 3, gold);
  } else {
    polygon(ctx, [[36, 36], [35, 24], [43, 29], [50, 19], [57, 29], [65, 24], [64, 36]], gold, ink);
    frame(ctx, 37, 34, 26, 5, accent, ink, 1);
    polygon(ctx, [[41, 51], [46, 53], [50, 62], [54, 53], [59, 51], [57, 60], [50, 65], [43, 60]], '#694535', ink);
  }
  line(ctx, [[42, 45], [46, 45]], ink, 1.6); line(ctx, [[54, 45], [58, 45]], ink, 1.6);
  line(ctx, [[50, 46], [48, 51], [52, 51]], '#a67d5c', 1);
  if (rank !== 13) line(ctx, [[46, 55], [50, 56], [54, 55]], '#8e4251', 1.3);
  suit(ctx, kind, 50, 67, 9, color);
}

/** Draw a full playing card; positions and hit testing remain the renderer's responsibility. */
export function drawGambitCard(ctx, id, x, y, w, h, { selected = false, boost = 0, tilt = 0, rank: changedRank, suit: changedSuit, enhancement = null, seal = null } = {}) {
  if (!validRect(ctx, x, y, w, h) || !Number.isInteger(id) || id < 0 || id > 4095 || !Number.isFinite(tilt)) return;
  // Physical card identity is independent of its face: copies and crafted cards keep their own ID.
  const face = id % 52, rank = Number.isInteger(changedRank) && changedRank >= 1 && changedRank <= 13 ? changedRank : face % 13 + 1;
  const kind = Number.isInteger(changedSuit) && changedSuit >= 0 && changedSuit <= 3 ? changedSuit : Math.floor(face / 13), color = GAMBIT_SUIT_COLORS[kind];
  const modifiers = { bonus: ['#307aad', 'CHIPS'], mult: ['#b33d58', '+MULT'], glass: ['#429ca4', 'GLASS'], steel: ['#526b83', 'HELD X'], gold: ['#a97922', 'GOLD'] };
  const modifier = Object.hasOwn(modifiers, enhancement) ? modifiers[enhancement] : null;
  ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.rotate(tilt); ctx.scale(w / 100, h / 140); ctx.translate(-50, -70);
  frame(ctx, 2, 4, 98, 136, '#10232d66', null, 6);
  frame(ctx, 0, 0, 98, 136, ivory, selected ? '#ffce5c' : '#aaaea3', 6, selected ? 3 : 1.5);
  frame(ctx, 3, 3, 92, 130, '#ffffff00', selected ? '#e4aa2f' : modifier ? modifier[0] : '#e3dcc8', 4, modifier ? 2 : .6);
  if (enhancement === 'glass') {
    polygon(ctx, [[25, 28], [71, 34], [65, 105], [30, 96]], '#d3f5f43d', '#9bd0d2', .8);
    line(ctx, [[28, 32], [61, 83], [38, 103]], '#abd7db', 1);
    line(ctx, [[61, 83], [70, 55]], '#abd7db', 1);
  } else if (enhancement === 'steel') {
    for (let i = 0; i < 4; i++) line(ctx, [[25, 35 + i * 19], [72, 26 + i * 19]], '#9bb3c332', 4);
  } else if (enhancement === 'gold') {
    for (const [px, py] of [[27, 38], [73, 96], [72, 41]]) star(ctx, px, py, 3.5, '#c3973b');
  }
  if (rank === 1) {
    suit(ctx, kind, 49, 73, 47, color);
    line(ctx, [[34, 109], [64, 109]], color, 1);
  } else if (rank < 11) {
    const size = rank <= 5 ? 20 : 16;
    for (const [px, py] of pipPositions[rank]) {
      ctx.save(); ctx.translate(px, py); if (py > 70) ctx.rotate(Math.PI);
      suit(ctx, kind, 0, 0, size, color); ctx.restore();
    }
  } else {
    frame(ctx, 24, 24, 50, 88, '#f7e7b8', color, 1.5, 1.2);
    courtHalf(ctx, rank, kind, color);
    ctx.save(); ctx.translate(98, 136); ctx.rotate(Math.PI); courtHalf(ctx, rank, kind, color); ctx.restore();
    line(ctx, [[25, 68], [73, 68]], color, .8);
  }
  corner(ctx, rank, kind, color);
  ctx.save(); ctx.translate(98, 136); ctx.rotate(Math.PI); corner(ctx, rank, kind, color); ctx.restore();
  if (modifier || Number.isFinite(boost) && boost > 0) {
    const bonus = Number.isFinite(boost) && boost > 0 ? '+' + Math.floor(boost) : '';
    frame(ctx, modifier ? 24 : 30, 115, modifier ? 51 : 39, 14, modifier ? modifier[0] : '#225f64', '#e6f0db', 3, .6);
    label(ctx, [bonus, modifier?.[1]].filter(Boolean).join(' '), 49.5, 125, modifier && bonus ? 7 : 9, '#fff9e9', modifier ? 47 : 36);
  }
  if (['red', 'blue', 'gold'].includes(seal)) {
    const sealColor = { red: '#b63e50', blue: '#3472a3', gold: '#b88826' }[seal];
    oval(ctx, 83, 18, 8, 8, sealColor, '#fff0bd');
    if (seal === 'red') {
      line(ctx, [[79, 16], [84, 13], [87, 17]], ivory, 1.2);
      line(ctx, [[87, 20], [82, 23], [79, 19]], ivory, 1.2);
    } else if (seal === 'blue') star(ctx, 83, 18, 5, ivory);
    else label(ctx, '$', 83, 22, 11, ivory, 11);
  }
  ctx.restore();
}

const jokerStyles = Object.freeze({
  pair_gremlin: ['#174d57', '#e9c554', ['PAIR', 'GREMLIN']],
  heart_hoarder: ['#7c2948', '#f59daf', ['HEART', 'HOARDER']],
  last_laugh: ['#59396d', '#edbc5b', ['LAST', 'LAUGH']],
  growing_suspicion: ['#174d3f', '#b5de6a', ['GROWING', 'SUSPICION']],
  pocket_ace: ['#285176', '#b1d2e5', ['POCKET', 'ACE']],
  club_regular: ['#38654d', '#f0c978', ['CLUB', 'REGULAR']],
  face_value: ['#825531', '#f1cb68', ['FACE', 'VALUE']],
  clean_slate: ['#345a6d', '#8ce0d6', ['CLEAN', 'SLATE']],
  little_scheme: ['#57315a', '#d3b2ee', ['LITTLE', 'SCHEME']],
  straight_talker: ['#286273', '#8be3dc', ['STRAIGHT', 'TALKER']],
  velvet_flush: ['#5d2b56', '#efa4d3', ['VELVET', 'FLUSH']],
  lonely_crown: ['#323760', '#edc46c', ['LONELY', 'CROWN']],
});

const familyStyles = Object.freeze({
  suit: ['#245d56', '#abe3a3', 'SUIT'], rank: ['#564079', '#d7b1ef', 'RANK'],
  hand: ['#235d7e', '#a8d9f1', 'HAND'], held: ['#3f546a', '#b9dfec', 'HOLD'],
  retrigger: ['#675335', '#f5d68b', 'ECHO'], growth: ['#355938', '#c8e49d', 'GROW'],
  economy: ['#735330', '#f3db83', 'COINS'], utility: ['#4b4f69', '#bfc8ed', 'TOOLS'],
  rule: ['#673c58', '#f0b6cd', 'RULE'],
});
const rarityColors = Object.freeze({ common: '#bedfc1', uncommon: '#89c7ee', rare: '#ecb384', legendary: '#e5b0f4' });
const catalogJoker = id => GAMBIT_JOKERS.find(joker => joker.id === id);
function jokerTitle(name) {
  const words = String(name).toUpperCase().split(/\s+/);
  if (words.length === 1) return [words[0], ''];
  let cut = 1, balance = Infinity;
  for (let i = 1; i < words.length; i++) {
    const score = Math.max(words.slice(0, i).join(' ').length, words.slice(i).join(' ').length);
    if (score < balance) { balance = score; cut = i; }
  }
  return [words.slice(0, cut).join(' '), words.slice(cut).join(' ')];
}

function crown(ctx, x, y, size, fill = gold) {
  polygon(ctx, [[x - size, y + size * .5], [x - size * 1.1, y - size * .6], [x - size * .45, y - size * .1],
    [x, y - size], [x + size * .45, y - size * .1], [x + size * 1.1, y - size * .6], [x + size, y + size * .5]], fill, '#573f2d', 1.4);
  frame(ctx, x - size, y + size * .4, size * 2, size * .3, '#dd9b3e', '#573f2d', 1.5);
}
function star(ctx, x, y, size, color) {
  polygon(ctx, Array.from({ length: 8 }, (_, i) => {
    const radius = i % 2 ? size * .24 : size, angle = -Math.PI / 2 + i * Math.PI / 4;
    return [x + Math.cos(angle) * radius, y + Math.sin(angle) * radius];
  }), color);
}
function jokerSymbol(ctx, id, accent) {
  if (id === 'pair_gremlin') {
    for (const [x, fill] of [[41, '#e6bb54'], [65, '#82d7bc']]) {
      polygon(ctx, [[x - 12, 61], [x - 19, 43], [x - 3, 49], [x + 13, 43], [x + 12, 64]], fill, ink);
      oval(ctx, x, 65, 14, 18, fill, ink); oval(ctx, x - 5, 61, 2.5, 3, ivory); oval(ctx, x + 5, 61, 2.5, 3, ivory);
      oval(ctx, x - 5, 62, 1, 1.8, ink); oval(ctx, x + 5, 62, 1, 1.8, ink);
      line(ctx, [[x - 7, 71], [x, 75], [x + 7, 70]], ink, 2);
    }
  } else if (id === 'heart_hoarder') {
    ctx.beginPath(); ctx.arc(54, 46, 14, Math.PI, Math.PI * 2); ctx.strokeStyle = gold; ctx.lineWidth = 4; ctx.stroke();
    suit(ctx, 3, 54, 68, 50, '#ef88a5');
    oval(ctx, 54, 67, 7, 8, gold, ink); line(ctx, [[54, 66], [54, 76]], ink, 3);
    for (const x of [30, 78]) oval(ctx, x, 49, 3.5, 3.5, gold, ink);
  } else if (id === 'last_laugh') {
    polygon(ctx, [[31, 50], [28, 29], [46, 41], [56, 23], [65, 41], [83, 30], [78, 52]], accent, ink);
    oval(ctx, 54, 67, 25, 28, '#f8e7cf', ink);
    line(ctx, [[36, 61], [42, 57], [47, 61]], '#62364e', 3); line(ctx, [[61, 61], [67, 57], [73, 61]], '#62364e', 3);
    ctx.beginPath(); ctx.moveTo(37, 72); ctx.quadraticCurveTo(54, 84, 72, 72); ctx.quadraticCurveTo(55, 104, 37, 72); ctx.fillStyle = '#7b2e49'; ctx.fill();
    line(ctx, [[43, 78], [67, 78]], ivory, 4); oval(ctx, 54, 68, 4, 4, '#dc596b');
  } else if (id === 'growing_suspicion') {
    ctx.beginPath(); ctx.moveTo(53, 96); ctx.bezierCurveTo(25, 75, 78, 58, 52, 31); ctx.strokeStyle = accent; ctx.lineWidth = 5; ctx.stroke();
    for (const [x, y, sign] of [[45, 84, -1], [61, 71, 1], [47, 40, -1]]) polygon(ctx, [[x, y], [x + sign * 17, y - 12], [x + sign * 15, y + 4]], '#6cab70', '#d0df83');
    ctx.beginPath(); ctx.moveTo(29, 57); ctx.quadraticCurveTo(54, 35, 80, 57); ctx.quadraticCurveTo(54, 79, 29, 57); ctx.fillStyle = '#f1df98'; ctx.fill();
    oval(ctx, 54, 57, 10, 13, '#799748'); oval(ctx, 54, 57, 4, 10, ink);
  } else if (id === 'pocket_ace') {
    ctx.save(); ctx.translate(43, 58); ctx.rotate(-.18); frame(ctx, -19, -28, 38, 55, '#ddded3', '#152b43', 3); label(ctx, 'A', 0, -8, 18, GAMBIT_SUIT_COLORS[2]); suit(ctx, 2, 0, 9, 19, GAMBIT_SUIT_COLORS[2]); ctx.restore();
    frame(ctx, 49, 30, 38, 55, ivory, '#152b43', 3); label(ctx, 'A', 68, 50, 18, GAMBIT_SUIT_COLORS[3]); suit(ctx, 3, 68, 66, 19, GAMBIT_SUIT_COLORS[3]);
    polygon(ctx, [[25, 72], [83, 72], [79, 94], [54, 102], [29, 94]], '#356d9c', '#acd4e9', 2);
    line(ctx, [[31, 78], [35, 90], [54, 96], [73, 90], [77, 78]], '#d0b778', 1.5);
  } else if (id === 'club_regular') {
    ctx.beginPath(); ctx.arc(78, 65, 15, -Math.PI / 2, Math.PI / 2); ctx.strokeStyle = '#e3be76'; ctx.lineWidth = 8; ctx.stroke();
    frame(ctx, 28, 46, 45, 46, '#c9e6c0', '#193c35', 6, 2); frame(ctx, 30, 45, 41, 7, '#f8e9bb', '#193c35', 3);
    suit(ctx, 0, 51, 70, 26, '#1b6f57');
    for (const x of [40, 54, 67]) { ctx.beginPath(); ctx.moveTo(x, 38); ctx.quadraticCurveTo(x - 7, 31, x, 24); ctx.strokeStyle = '#eff3c5'; ctx.lineWidth = 2; ctx.stroke(); }
  } else if (id === 'face_value') {
    oval(ctx, 54, 69, 29, 29, '#b77b28', '#ffe5a3'); oval(ctx, 54, 67, 24, 24, '#eac05c', '#76572c');
    oval(ctx, 54, 68, 10, 12, '#fff0bb'); line(ctx, [[48, 65], [50, 65]], '#79592f', 2); line(ctx, [[58, 65], [60, 65]], '#79592f', 2);
    line(ctx, [[49, 73], [54, 75], [59, 73]], '#79592f', 2); crown(ctx, 54, 38, 19, '#f2da86');
    for (const x of [23, 86]) star(ctx, x, 68, 5, ivory);
  } else if (id === 'clean_slate') {
    ctx.save(); ctx.translate(54, 64); ctx.rotate(-.13);
    frame(ctx, -27, -30, 54, 66, '#143941', '#b4d1c9', 4, 3); line(ctx, [[-17, -16], [15, -16]], '#6d9e9a', 2); line(ctx, [[-17, -7], [8, -7]], '#6d9e9a', 2);
    polygon(ctx, [[-16, 18], [-2, 3], [21, 15], [6, 31]], '#efaa9f', '#fbe4c4', 1.5); polygon(ctx, [[6, 31], [21, 15], [29, 20], [14, 36]], '#e8deba');
    ctx.restore(); star(ctx, 77, 34, 11, '#e9f9bc'); star(ctx, 28, 83, 6, '#e9f9bc');
  } else if (id === 'little_scheme') {
    line(ctx, [[30, 79], [54, 37], [78, 79], [30, 79]], '#cba0d8', 2);
    for (const [x, y, fill] of [[30, 79, '#8fd3c0'], [54, 37, '#edbf65'], [78, 79, '#dba4ce']]) {
      polygon(ctx, [[x, y - 15], [x + 14, y + 11], [x - 14, y + 11]], fill, '#273043', 2);
      oval(ctx, x, y + 2, 3, 4, '#273043');
    }
    star(ctx, 54, 70, 7, ivory);
  } else if (id === 'straight_talker') {
    const colors = ['#c78568', '#d5a754', '#9fc77e', '#74cdbb', '#78b8e0'];
    for (let i = 0; i < 5; i++) { const x = 26 + i * 11, y = 82 - i * 10; frame(ctx, x, y, 15, 17, colors[i], '#132f3c', 2); label(ctx, i + 1, x + 7.5, y + 12, 10, '#193746', 13); }
    line(ctx, [[28, 61], [48, 42], [72, 22]], '#e2f6cd', 4); polygon(ctx, [[64, 21], [78, 18], [76, 32]], '#e2f6cd');
  } else if (id === 'velvet_flush') {
    for (let i = 0; i < 4; i++) {
      ctx.save(); ctx.translate(54, 93); ctx.rotate((i - 1.5) * .22);
      frame(ctx, -16, -62, 32, 59, ivory, '#67334d', 3); suit(ctx, i, 0, -37, 21, GAMBIT_SUIT_COLORS[i]); ctx.restore();
    }
    oval(ctx, 54, 95, 6, 5, gold, '#603b42');
  } else if (id === 'lonely_crown') {
    polygon(ctx, [[54, 26], [28, 100], [82, 100]], '#52567e');
    frame(ctx, 37, 82, 34, 16, '#55416b', '#d4b775', 3); frame(ctx, 41, 92, 5, 9, '#d4b775', null, 1); frame(ctx, 63, 92, 5, 9, '#d4b775', null, 1);
    crown(ctx, 54, 57, 24); oval(ctx, 54, 56, 4, 6, '#bb4263'); star(ctx, 28, 35, 4, '#e8d3a5');
  } else {
    expandedJokerSymbol(ctx, id, accent);
  }
}

function littleCard(ctx, x, y, rank, kind, color = ivory) {
  frame(ctx, x - 13, y - 20, 26, 40, color, '#243849', 3, 1.2);
  label(ctx, rank, x, y - 5, 13, GAMBIT_SUIT_COLORS[kind], 22);
  suit(ctx, kind, x, y + 8, 14, GAMBIT_SUIT_COLORS[kind]);
}
function littleCoin(ctx, x, y, r = 11) {
  oval(ctx, x, y, r, r, '#e9c768', '#fff0b0');
  label(ctx, '$', x, y + r * .4, r * 1.25, '#76532d', r * 1.5);
}
function littleBook(ctx, x, y, color = '#b6d5c8') {
  polygon(ctx, [[x, y - 15], [x - 23, y - 20], [x - 23, y + 17], [x, y + 22], [x + 23, y + 17], [x + 23, y - 20]], color, '#263a4c', 1.4);
  line(ctx, [[x, y - 15], [x, y + 21]], '#263a4c', 1.3);
  for (let i = 0; i < 3; i++) { line(ctx, [[x - 17, y - 8 + i * 8], [x - 6, y - 6 + i * 8]], '#63877f', 1); line(ctx, [[x + 6, y - 6 + i * 8], [x + 17, y - 8 + i * 8]], '#63877f', 1); }
}
function littleMoon(ctx, x, y, r, color, background) {
  oval(ctx, x, y, r, r, color); oval(ctx, x + r * .5, y - r * .3, r * .9, r * .9, background);
}
function littleJar(ctx, color = '#a7c9c5') {
  frame(ctx, 35, 47, 39, 49, color, '#223b49', 6, 1.4);
  frame(ctx, 39, 40, 31, 10, '#c8d5c5', '#223b49', 2);
  line(ctx, [[41, 55], [41, 83]], '#edf4dc', 2);
}

/** Small individual illustrations carry the idea of a Joker even when its title is too small to read. */
function personalJokerSymbol(ctx, id, accent, secondary, background) {
  if (id === 'spade_scholar') {
    littleBook(ctx, 54, 71, '#c9d4af'); suit(ctx, 2, 54, 42, 25, '#a5cae9');
  } else if (id === 'scarlet_thread') {
    frame(ctx, 37, 40, 34, 49, '#9a5871', '#efc2bb', 4);
    frame(ctx, 31, 35, 46, 8, '#d9b596', '#263a4c', 2); frame(ctx, 31, 86, 46, 8, '#d9b596', '#263a4c', 2);
    for (let i = 0; i < 6; i++) line(ctx, [[40, 47 + i * 6], [68, 43 + i * 6]], '#f0aaa9', 1.4);
    suit(ctx, 3, 54, 62, 20, '#f7dac0');
  } else if (id === 'clover_chain') {
    for (let i = 0; i < 3; i++) { ctx.save(); ctx.translate(37 + i * 15, 50 + i * 15); ctx.rotate(-.55); oval(ctx, 0, 0, 11, 17, null, '#e6d69e'); ctx.restore(); }
    suit(ctx, 0, 54, 65, 25, '#a6d5bc');
  } else if (id === 'black_tie') {
    polygon(ctx, [[29, 43], [49, 55], [49, 73], [29, 83]], '#b8c0d4', '#263448', 1.8);
    polygon(ctx, [[79, 43], [59, 55], [59, 73], [79, 83]], '#b8c0d4', '#263448', 1.8);
    frame(ctx, 47, 54, 14, 21, '#2c3a4f', '#e3d8bd', 3);
    line(ctx, [[34, 53], [43, 60]], '#64758d', 2); line(ctx, [[73, 76], [65, 68]], '#64758d', 2);
  } else if (id === 'red_letter' || id === 'final_notice') {
    frame(ctx, 27, 43, 54, 42, '#efd5b5', '#52354e', 3, 1.6);
    polygon(ctx, [[27, 44], [54, 66], [81, 44]], '#dba3a6', '#52354e', 1.5);
    line(ctx, [[29, 83], [45, 66]], '#9b5b6b', 1.3); line(ctx, [[79, 83], [63, 66]], '#9b5b6b', 1.3);
    if (id === 'red_letter') suit(ctx, 3, 54, 67, 18, '#a74461');
    else { oval(ctx, 73, 37, 12, 12, '#dd845f', '#ffe0a2'); label(ctx, '!', 73, 44, 21, '#fef1c9', 13); }
  } else if (id === 'prime_suspect') {
    littleCard(ctx, 49, 60, '7', 2, '#d8cce2');
    oval(ctx, 58, 60, 17, 17, '#b7dcd536', '#edcc8c');
    line(ctx, [[69, 74], [80, 92]], '#e0b67c', 7); oval(ctx, 78, 90, 3, 3, '#654c66');
  } else if (id === 'low_profile') {
    polygon(ctx, [[52, 33], [72, 72], [61, 72], [61, 94], [43, 94], [43, 72], [32, 72]], '#c6a6e0', '#efe1bf', 1.5);
    littleCard(ctx, 52, 65, '2', 0, '#f1dfc1');
  } else if (id === 'royal_court') {
    for (const [x, y, fill] of [[36, 70, '#dcaab7'], [72, 70, '#a7cbd9'], [54, 50, '#f1d47f']]) crown(ctx, x, y, 13, fill);
    frame(ctx, 31, 83, 46, 8, '#a7b4c8', '#ecdbaf', 2);
  } else if (id === 'ten_to_one') {
    for (let i = 0; i < 3; i++) littleCoin(ctx, 37 + i * 15, 78 - i * 3, 11);
    littleCard(ctx, 53, 48, '10', 1, '#f2dec0');
  } else if (id === 'lucky_seven') {
    ctx.beginPath(); ctx.arc(54, 60, 23, -.7, Math.PI + .7); ctx.strokeStyle = '#e4bf73'; ctx.lineWidth = 11; ctx.stroke();
    for (let i = 0; i < 5; i++) { const a = i * Math.PI / 4; oval(ctx, 54 + Math.cos(a) * 23, 60 + Math.sin(a) * 23, 2, 2, '#796178'); }
    label(ctx, '7', 54, 64, 27, '#f5e7b8', 28); star(ctx, 32, 35, 6, secondary);
  } else if (id === 'twin_moons') {
    littleMoon(ctx, 42, 59, 18, '#e6cf87', background); littleMoon(ctx, 68, 78, 15, '#a8d8df', background); star(ctx, 76, 38, 5, secondary);
  } else if (id === 'crowded_house') {
    polygon(ctx, [[28, 59], [54, 34], [80, 59]], '#dfb57f', '#243f50', 1.5);
    frame(ctx, 33, 58, 42, 38, '#b3c8ce', '#243f50', 3); frame(ctx, 47, 75, 14, 21, '#5f7190', '#ecddb6', 2);
    for (const x of [41, 67]) oval(ctx, x, 68, 4, 5, '#efe6bd');
  } else if (id === 'three_wishes') {
    polygon(ctx, [[29, 71], [42, 60], [69, 60], [77, 68], [69, 78], [45, 81]], '#d6b36c', '#f7df9f', 1.2);
    oval(ctx, 77, 66, 10, 8, null, '#f7df9f'); frame(ctx, 44, 82, 23, 5, '#cbb579', null, 2);
    for (const [x, y, size] of [[38, 39, 5], [55, 48, 7], [71, 29, 6]]) star(ctx, x, y, size, secondary);
  } else if (id === 'square_deal') {
    for (const [x, y, rank, kind] of [[40, 47, '4', 0], [68, 47, '4', 1], [40, 79, '4', 2], [68, 79, '4', 3]]) littleCard(ctx, x, y, rank, kind, '#edddbd');
  } else if (id === 'double_trouble') {
    for (const [x, color] of [[39, '#e9aeaa'], [69, '#b2d2dc']]) { oval(ctx, x, 66, 15, 24, color, '#263c4e'); crown(ctx, x, 43, 11, '#dec383'); oval(ctx, x - 4, 62, 2, 3, '#344256'); oval(ctx, x + 4, 62, 2, 3, '#344256'); line(ctx, [[x - 5, 77], [x, 72], [x + 5, 77]], '#6b4964', 2); }
  } else if (id === 'royal_road') {
    for (let i = 0; i < 4; i++) frame(ctx, 28 + i * 11, 81 - i * 13, 18, 15, ['#8facc8', '#b2bdc8', '#d4c79f', '#e3ca81'][i], '#253a4b', 2);
    crown(ctx, 65, 35, 14, '#f1d58e');
  } else if (id === 'long_weekend') {
    frame(ctx, 30, 36, 49, 62, '#e7dcc3', '#293c50', 4, 1.5); frame(ctx, 30, 36, 49, 15, '#b86770', null, 3);
    for (const x of [41, 67]) line(ctx, [[x, 30], [x, 43]], '#dfc28b', 3);
    for (let i = 0; i < 6; i++) frame(ctx, 37 + i % 3 * 13, 59 + Math.floor(i / 3) * 15, 8, 8, i > 3 ? '#d7aa6d' : '#98b7c1', null, 1);
  } else if (id === 'solitary_star') {
    star(ctx, 54, 63, 29, '#f2d78e', '#fff0b3'); oval(ctx, 50, 60, 2.5, 3, '#476379'); oval(ctx, 60, 60, 2.5, 3, '#476379');
    for (const [x, y] of [[30, 31], [81, 88], [29, 94]]) oval(ctx, x, y, 2, 2, '#b6cdd9');
  } else if (id === 'five_alarm') {
    polygon(ctx, [[34, 82], [39, 68], [39, 51], [45, 40], [62, 40], [69, 51], [69, 68], [75, 82]], '#e1bd70', '#fff0b0', 1.5);
    oval(ctx, 54, 87, 6, 7, '#d6a066', '#e9cf93'); oval(ctx, 54, 36, 5, 5, '#c49a69');
    line(ctx, [[30, 45], [24, 40]], '#f0d8a2', 2); line(ctx, [[76, 45], [82, 40]], '#f0d8a2', 2);
  } else if (id === 'before_dawn') {
    oval(ctx, 54, 68, 20, 20, '#e6b76e'); frame(ctx, 26, 69, 56, 25, background, null, 0);
    for (let i = 0; i < 5; i++) { const a = Math.PI * (i + 1) / 6; line(ctx, [[54 + Math.cos(a) * 25, 68 - Math.sin(a) * 25], [54 + Math.cos(a) * 31, 68 - Math.sin(a) * 31]], '#e6c185', 2); }
    for (let i = 0; i < 3; i++) line(ctx, [[29 + i * 5, 75 + i * 8], [79 - i * 5, 75 + i * 8]], '#9ccdd0', 2);
  } else if (id === 'patience') {
    frame(ctx, 34, 31, 40, 6, '#ceb18b', null, 2); frame(ctx, 34, 92, 40, 6, '#ceb18b', null, 2);
    polygon(ctx, [[39, 38], [69, 38], [65, 55], [57, 65], [65, 75], [69, 91], [39, 91], [43, 75], [51, 65], [43, 55]], '#a9cdd055', '#d9e1cc', 1.5);
    polygon(ctx, [[44, 43], [64, 43], [59, 54], [54, 60], [49, 54]], '#e4c37b'); polygon(ctx, [[42, 88], [54, 76], [66, 88]], '#e4c37b');
    line(ctx, [[54, 65], [54, 75]], '#e4c37b', 1);
  } else if (id === 'royal_reserve') {
    littleCard(ctx, 54, 66, 'K', 2, '#d0d9df'); crown(ctx, 54, 38, 21, '#e8c682');
    polygon(ctx, [[30, 83], [38, 96], [68, 96], [79, 82], [69, 87], [39, 88]], '#bad4d0', '#2d4155', 1.5);
  } else if (id === 'cold_storage') {
    frame(ctx, 32, 31, 43, 67, '#b6d5de', '#263e52', 4, 1.5); line(ctx, [[34, 62], [73, 62]], '#728ca1', 2);
    frame(ctx, 64, 43, 3, 11, '#f2e8c5', null, 1); frame(ctx, 64, 70, 3, 15, '#f2e8c5', null, 1);
    for (const a of [0, Math.PI / 3, Math.PI * 2 / 3]) line(ctx, [[52 - Math.cos(a) * 10, 47 - Math.sin(a) * 10], [52 + Math.cos(a) * 10, 47 + Math.sin(a) * 10]], '#f0fbeb', 1.4);
  } else if (id === 'tea_break') {
    oval(ctx, 75, 67, 11, 12, null, '#d8e7cb'); frame(ctx, 30, 51, 42, 35, '#d8e7cb', '#2b4053', 5, 1.4);
    oval(ctx, 51, 51, 21, 6, '#b4c7b9', '#edf0d4'); oval(ctx, 51, 51, 16, 3, '#7b6655');
    crown(ctx, 51, 69, 11, '#cba979'); for (const x of [42, 59]) { ctx.beginPath(); ctx.moveTo(x, 41); ctx.quadraticCurveTo(x - 5, 34, x, 27); ctx.strokeStyle = '#c1e1d2'; ctx.lineWidth = 1.7; ctx.stroke(); }
    oval(ctx, 51, 91, 28, 4, '#b4d2ce');
  } else if (id === 'curtain_call') {
    frame(ctx, 28, 31, 53, 66, '#1f3544', '#ecd59c', 2);
    polygon(ctx, [[29, 33], [49, 33], [43, 63], [33, 79], [40, 96], [29, 96]], '#c27b8e', '#ecd0ae', 1);
    polygon(ctx, [[80, 33], [60, 33], [66, 63], [76, 79], [69, 96], [80, 96]], '#c27b8e', '#ecd0ae', 1);
    star(ctx, 54, 66, 14, '#dfc077');
  } else if (id === 'paper_trail') {
    for (let i = 0; i < 3; i++) { frame(ctx, 29 + i * 10, 35 + i * 9, 31, 40, '#e4dfbf', '#34464b', 2); line(ctx, [[35 + i * 10, 44 + i * 9], [51 + i * 10, 44 + i * 9]], '#80a590', 1.4); }
    for (const [x, y] of [[33, 91], [48, 98], [67, 92]]) { oval(ctx, x, y, 4, 2, '#b8dba3'); oval(ctx, x + 3, y - 4, 2, 2, '#b8dba3'); }
  } else if (id === 'practice_makes') {
    littleBook(ctx, 54, 73, '#d7dab3'); line(ctx, [[34, 76], [69, 34]], '#e1bf77', 7);
    polygon(ctx, [[30, 80], [34, 69], [41, 75]], '#f1dfb5', '#7b6a4e'); frame(ctx, 66, 28, 8, 9, '#d89fa8', '#ece2b9', 1);
  } else if (id === 'compost_heap') {
    polygon(ctx, [[27, 91], [38, 74], [52, 67], [67, 71], [81, 91]], '#806d4c', '#cfbc82', 1.3);
    for (let i = 0; i < 6; i++) { const x = 34 + i * 8, y = 72 + (i % 3) * 5; polygon(ctx, [[x, y], [x - 3, y - 12], [x + 8, y - 4]], i % 2 ? '#b7ce8d' : '#8db097', '#41664b', 1); }
    for (const x of [42, 59, 70]) { ctx.beginPath(); ctx.moveTo(x, 58); ctx.quadraticCurveTo(x - 6, 51, x, 44); ctx.strokeStyle = '#c5ddb1'; ctx.lineWidth = 1.5; ctx.stroke(); }
  } else if (id === 'second_thought') {
    oval(ctx, 54, 54, 22, 23, '#e3d88d', '#f7edbd'); polygon(ctx, [[42, 70], [46, 84], [62, 84], [66, 70]], '#b8c5ac', '#e4dda9', 1);
    for (let i = 0; i < 3; i++) line(ctx, [[45, 86 + i * 4], [63, 86 + i * 4]], '#bdceb2', 2);
    line(ctx, [[46, 60], [51, 56], [56, 61], [62, 55]], '#a19165', 2); star(ctx, 27, 35, 5, secondary);
  } else if (id === 'snowball') {
    oval(ctx, 54, 72, 24, 24, '#e0eadf', '#b6d5de'); oval(ctx, 48, 65, 14, 14, '#f3f5d9');
    for (const [x, y, r] of [[31, 43, 4], [72, 33, 3], [80, 90, 3], [27, 86, 2.5]]) star(ctx, x, y, r, '#d5e9d9');
    line(ctx, [[43, 80], [55, 85], [66, 77]], '#aac9d2', 1.3);
  } else if (id === 'growing_appetite') {
    oval(ctx, 54, 67, 27, 28, '#9ebf91', '#deedb3'); oval(ctx, 54, 72, 18, 13, '#314d40');
    polygon(ctx, [[40, 65], [45, 72], [50, 64], [57, 72], [63, 64], [68, 70], [68, 61], [40, 61]], '#f4e5b3');
    oval(ctx, 43, 52, 3, 4, '#304e40'); oval(ctx, 64, 52, 3, 4, '#304e40');
    littleCoin(ctx, 54, 30, 9);
  } else if (id === 'skinny_dip') {
    oval(ctx, 54, 71, 28, 18, '#a9d4ca', '#e2ecc0'); oval(ctx, 54, 71, 16, 9, background, '#668f87');
    for (const x of [29, 43, 63]) line(ctx, [[x, 95], [x + 9, 95]], '#8bbdb0', 1.8);
    ctx.beginPath(); ctx.moveTo(55, 31); ctx.bezierCurveTo(34, 52, 65, 56, 55, 31); ctx.fillStyle = '#b6e0d4'; ctx.fill();
  } else if (id === 'crowd_funding' || id === 'tip_jar') {
    littleJar(ctx, id === 'tip_jar' ? '#a1c4d3' : '#aac6a1'); littleCoin(ctx, 57, 73, 10);
    for (const [x, y] of id === 'tip_jar' ? [[48, 29]] : [[33, 31], [58, 27], [78, 37]]) littleCoin(ctx, x, y, 7);
  } else if (id === 'coin_cathedral') {
    polygon(ctx, [[28, 96], [28, 58], [38, 49], [38, 38], [54, 24], [70, 38], [70, 49], [80, 58], [80, 96]], '#b99b63', '#ecd59a', 1.5);
    for (const x of [36, 67]) frame(ctx, x, 64, 6, 21, '#604f43', '#f2d89a', 1);
    littleCoin(ctx, 54, 49, 11); frame(ctx, 47, 76, 14, 20, '#614f43', '#e7ca87', 4);
  } else if (id === 'frequent_flyer') {
    polygon(ctx, [[27, 61], [82, 35], [63, 94], [51, 72]], '#d7dfb7', '#f6edbe', 1.4);
    polygon(ctx, [[27, 61], [54, 64], [82, 35], [51, 72]], '#9ec5b5', '#486a5b', 1);
    line(ctx, [[54, 64], [57, 84], [63, 94]], '#5e8b75', 1); line(ctx, [[27, 87], [37, 78]], accent, 1.5);
  } else if (id === 'repeat_customer') {
    frame(ctx, 28, 48, 51, 41, '#a4bfaf', '#d9d9a5', 3); frame(ctx, 28, 40, 51, 12, '#d2ba8a', '#374a3d', 2);
    for (let i = 0; i < 4; i++) frame(ctx, 30 + i * 12, 41, 8, 14, i % 2 ? '#8bba9e' : '#e1d7ae', null, 1);
    frame(ctx, 49, 65, 14, 24, '#476654', '#ded4ac', 2); oval(ctx, 38, 68, 6, 7, '#c8d5b2');
    ctx.beginPath(); ctx.arc(57, 36, 17, 3.5, 6.2); ctx.strokeStyle = '#e8d991'; ctx.lineWidth = 2; ctx.stroke(); polygon(ctx, [[76, 29], [73, 39], [66, 33]], '#e8d991');
  } else if (id === 'night_school' || id === 'book_worm') {
    littleBook(ctx, 54, 74, '#c1d2b4');
    if (id === 'night_school') { littleMoon(ctx, 58, 38, 15, '#e3d795', background); star(ctx, 31, 36, 4, '#b3d0c1'); }
    else { for (let i = 0; i < 4; i++) oval(ctx, 39 + i * 9, 56 - Math.sin(i) * 6, 6, 6, i % 2 ? '#a6bf87' : '#c1d393', '#3e694d'); oval(ctx, 66, 50, 1.3, 2, '#365843'); }
  } else if (id === 'rust_collector' || id === 'gold_digger') {
    if (id === 'rust_collector') {
      ctx.beginPath(); ctx.arc(54, 60, 23, 0, Math.PI); ctx.strokeStyle = '#b87e68'; ctx.lineWidth = 11; ctx.stroke();
      frame(ctx, 26, 40, 10, 23, '#a5bec9', '#e3d9b7', 1); frame(ctx, 72, 40, 10, 23, '#a5bec9', '#e3d9b7', 1);
      for (const [x, y] of [[40, 34], [59, 29], [74, 32]]) polygon(ctx, [[x, y - 4], [x + 4, y], [x, y + 4], [x - 4, y]], '#c69c72');
    } else { line(ctx, [[33, 90], [68, 42]], '#c9b38c', 6); polygon(ctx, [[61, 37], [69, 31], [82, 45], [74, 53]], '#b3c5bd', '#3a4b42', 1.2); littleCoin(ctx, 39, 52, 12); littleCoin(ctx, 70, 85, 10); }
  } else if (id === 'seal_of_approval') {
    frame(ctx, 29, 69, 51, 22, '#c4d7d3', '#254153', 3); frame(ctx, 40, 59, 30, 14, '#ab6b77', '#f4dcb6', 3);
    line(ctx, [[54, 36], [54, 61]], '#c5b38d', 11); oval(ctx, 54, 34, 13, 10, '#d8c89f', '#f1dfac');
    polygon(ctx, [[44, 79], [51, 86], [67, 73]], null, '#a3566c', 3);
  } else if (id === 'glass_menagerie') {
    polygon(ctx, [[34, 51], [32, 31], [47, 43], [62, 43], [77, 31], [75, 54], [79, 71], [67, 90], [42, 90], [29, 71]], '#a8d9d66b', '#e1ecd4', 1.5);
    polygon(ctx, [[34, 51], [54, 64], [75, 54], [67, 90], [54, 64], [42, 90]], null, '#83b6b6', 1);
    oval(ctx, 42, 61, 3, 4, '#e1e9ca'); oval(ctx, 66, 61, 3, 4, '#e1e9ca'); polygon(ctx, [[49, 72], [59, 72], [54, 78]], '#ebd6ba');
  } else if (id === 'steel_magnolia') {
    line(ctx, [[55, 73], [52, 97]], '#a5c4c3', 3); polygon(ctx, [[53, 88], [33, 78], [36, 91]], '#6f8f9c', '#c9dfd0', 1);
    for (let i = 0; i < 6; i++) { ctx.save(); ctx.translate(54, 58); ctx.rotate(i * Math.PI / 3); oval(ctx, 0, -14, 10, 18, i % 2 ? '#adc8ce' : '#789cae', '#d4e4d1'); ctx.restore(); }
    oval(ctx, 54, 58, 8, 8, '#e5c886', '#f4e6bd');
  } else if (id === 'rainy_day') {
    polygon(ctx, [[27, 59], [34, 43], [48, 35], [61, 35], [76, 43], [83, 59], [69, 55], [54, 60], [40, 55]], '#95c0d3', '#e1e5c6', 1.3);
    line(ctx, [[54, 34], [54, 84]], '#e2c68a', 2.5); ctx.beginPath(); ctx.arc(47, 84, 7, 0, Math.PI); ctx.strokeStyle = '#e2c68a'; ctx.lineWidth = 2.5; ctx.stroke();
    for (const [x, y] of [[30, 77], [74, 83], [38, 30]]) line(ctx, [[x, y], [x - 3, y + 6]], '#b1d6d7', 2);
  } else if (id === 'dividend_demon') {
    polygon(ctx, [[34, 51], [30, 29], [47, 45], [63, 45], [79, 29], [74, 54]], '#d99b86', '#edcc9e', 1.2);
    oval(ctx, 54, 64, 24, 25, '#c28776', '#edcc9e'); oval(ctx, 44, 60, 3, 4, '#f8dd9f'); oval(ctx, 65, 60, 3, 4, '#f8dd9f');
    line(ctx, [[42, 76], [54, 81], [66, 75]], '#6f4654', 2); littleCoin(ctx, 54, 86, 10);
  } else if (id === 'pack_rat') {
    oval(ctx, 38, 47, 12, 12, '#a9b9c5', '#e3d4b5'); oval(ctx, 69, 47, 12, 12, '#a9b9c5', '#e3d4b5');
    polygon(ctx, [[34, 47], [73, 47], [67, 72], [54, 82], [40, 70]], '#bac6c5', '#263e4c', 1.5); oval(ctx, 54, 75, 4, 3, '#d3959a');
    oval(ctx, 42, 57, 2, 3, '#293f4b'); oval(ctx, 66, 57, 2, 3, '#293f4b'); frame(ctx, 33, 79, 43, 18, '#b88f6d', '#e8d9ae', 2); line(ctx, [[54, 80], [54, 96]], '#e1bd8e', 4);
  } else if (id === 'spare_pocket' || id === 'deep_pockets') {
    frame(ctx, 29, 35, 51, 61, '#6083a0', '#d3dfd2', 4, 1.6);
    polygon(ctx, [[35, 51], [74, 51], [72, 78], [54, 91], [36, 78]], id === 'spare_pocket' ? '#86a6b4' : '#3d5979', '#e6cd97', 1.4);
    if (id === 'spare_pocket') littleCard(ctx, 55, 52, 'A', 0, '#eee1bf');
    else { oval(ctx, 54, 67, 12, 16, '#263e58', '#9bb7b9'); star(ctx, 54, 69, 4, '#dace9e'); }
    line(ctx, [[35, 39], [74, 39]], '#e6cd97', 1);
  } else if (id === 'second_helping') {
    oval(ctx, 54, 64, 23, 23, '#d4dfd3', '#ecddb7'); oval(ctx, 54, 64, 16, 16, '#adc4c6', '#ecddb7');
    littleCoin(ctx, 54, 64, 9); line(ctx, [[25, 42], [25, 91]], '#e5d9b7', 2); for (const x of [22, 25, 28]) line(ctx, [[x, 38], [x, 51]], '#e5d9b7', 1.5);
    line(ctx, [[83, 62], [83, 91]], '#e5d9b7', 2); polygon(ctx, [[80, 39], [84, 39], [84, 65], [79, 65]], '#e5d9b7');
  } else if (id === 'waste_not') {
    for (let i = 0; i < 3; i++) { ctx.save(); ctx.translate(54, 65); ctx.rotate(i * Math.PI * 2 / 3); polygon(ctx, [[-16, -26], [2, -26], [9, -14], [14, -17], [14, -1], [0, -7], [4, -10], [-2, -19], [-16, -19]], '#b5d2bc', '#dce7c7', 1); ctx.restore(); }
  } else if (id === 'coupon_ghoul') {
    polygon(ctx, [[31, 38], [40, 42], [49, 38], [58, 42], [67, 38], [77, 42], [77, 91], [67, 87], [58, 92], [49, 87], [40, 92], [31, 88]], '#c4c9db', '#eadfc1', 1.2);
    oval(ctx, 44, 59, 4, 6, '#495871'); oval(ctx, 64, 59, 4, 6, '#495871'); oval(ctx, 54, 75, 5, 7, '#495871');
    for (const y of [47, 82]) line(ctx, [[37, y], [71, y]], '#8294ad', 1);
  } else if (id === 'cut_corners') {
    frame(ctx, 43, 31, 32, 50, '#e6d8b7', '#ebd39f', 2); polygon(ctx, [[64, 31], [75, 42], [64, 42]], '#9f7c95');
    line(ctx, [[38, 74], [75, 44]], '#c1d1d1', 5); line(ctx, [[38, 74], [65, 96]], '#c1d1d1', 5);
    oval(ctx, 34, 79, 8, 10, null, '#e0b180'); oval(ctx, 46, 87, 8, 10, null, '#e0b180'); oval(ctx, 43, 76, 3, 3, '#e4d6af');
  } else if (id === 'wide_awake') {
    ctx.beginPath(); ctx.moveTo(26, 64); ctx.quadraticCurveTo(54, 30, 82, 64); ctx.quadraticCurveTo(54, 98, 26, 64); ctx.fillStyle = '#ebdcc3'; ctx.fill(); ctx.strokeStyle = '#e8b8cf'; ctx.lineWidth = 1.5; ctx.stroke();
    oval(ctx, 54, 64, 15, 19, '#bf94bc', '#6b4a76'); oval(ctx, 54, 64, 6, 12, '#3e3757'); oval(ctx, 49, 57, 3, 4, '#fff2cd');
    for (const x of [36, 54, 72]) line(ctx, [[x, 41], [x + (x - 54) / 5, 33]], '#e8b8cf', 2);
  } else return false;
  return true;
}

/** Family colors organize the catalogue; individual emblems and constellations identify each card. */
function expandedJokerSymbol(ctx, id, accent) {
  const item = catalogJoker(id), index = Math.max(0, GAMBIT_JOKERS.findIndex(joker => joker.id === id));
  const family = familyStyles[item?.family] ? item.family : 'utility';
  const n = index % 5, secondary = ['#efaeaa', '#98d8d0', '#d8b1ee', '#edd68c', '#a1c7ee'][n];
  // A small personal constellation is separate from the family's central silhouette.
  const points = [[28 + index % 9, 29 + index % 7], [70 + index % 11, 35 + index % 6], [76 - index % 8, 91 - index % 9]];
  line(ctx, points, '#ffffff32', .7);
  points.forEach(([px, py], i) => star(ctx, px, py, i === index % 3 ? 3.8 : 2.5, accent));
  if (personalJokerSymbol(ctx, id, accent, secondary, familyStyles[family][0])) return;
  if (family === 'suit') {
    const kind = /club/.test(id) ? 0 : /diamond/.test(id) ? 1 : /spade/.test(id) ? 2 : /heart/.test(id) ? 3 : index % 4;
    polygon(ctx, [[27, 60], [29, 43], [43, 53], [54, 35], [65, 53], [79, 43], [81, 60], [69, 85], [54, 96], [39, 85]], '#122d3f', accent, 1.4);
    suit(ctx, kind, 54, 63, 39, secondary);
    for (let i = 0; i <= n; i++) oval(ctx, 39 + i * 7, 91, 2, 2, accent);
  } else if (family === 'rank') {
    for (let i = 0; i < 3; i++) {
      const px = 27 + i * 11, py = 40 - i * 5;
      frame(ctx, px, py, 35, 52, i === 2 ? ivory : '#c1c9d5', '#263746', 3, 1.2);
    }
    const rank = /ace/.test(id) ? 1 : /queen/.test(id) ? 12 : /king/.test(id) ? 13 : /jack/.test(id) ? 11 : 2 + index % 9;
    label(ctx, ({ 1: 'A', 11: 'J', 12: 'Q', 13: 'K' })[rank] || rank, 65, 52, 22, '#6b416d', 28);
    for (let i = 0; i < 3 + n; i++) oval(ctx, 65 + Math.cos(i * 1.2) * 10, 70 + Math.sin(i * 1.2) * 9, 1.9, 1.9, '#69558b');
    line(ctx, [[29, 95], [41 + n * 3, 100], [80, 91]], accent, 2);
  } else if (family === 'hand') {
    for (let i = 0; i < 3 + n % 3; i++) {
      ctx.save(); ctx.translate(53, 92); ctx.rotate((i - (2 + n % 3) / 2) * .22);
      frame(ctx, -13, -54, 27, 52, ivory, '#1e3549', 3);
      suit(ctx, (index + i) % 4, 0, -31, 16, GAMBIT_SUIT_COLORS[(index + i) % 4]);
      ctx.restore();
    }
    oval(ctx, 54, 91, 12 + n, 7, secondary, '#29384d');
    star(ctx, 54, 89, 5, '#fff4ce');
  } else if (family === 'held') {
    polygon(ctx, [[34, 92], [31, 70], [25, 60], [28, 56], [39, 65], [39, 41], [44, 39], [46, 64], [48, 33], [53, 33], [55, 64], [59, 38], [64, 39], [62, 66], [70, 48], [75, 50], [70, 76], [63, 94]], '#bfd3d7', '#26384b', 1.4);
    frame(ctx, 33, 89, 33, 10, '#557b94', accent, 2);
    polygon(ctx, [[53, 49 - n], [66, 64], [53, 79 + n], [40, 64]], secondary, '#fff3cf', 1);
    line(ctx, [[40, 64], [66, 64]], '#ffffffaa', .8);
  } else if (family === 'retrigger') {
    for (let i = 0; i < 2 + n % 3; i++) {
      const px = 32 + i * 9, py = 43 + i * 5;
      frame(ctx, px, py, 31, 42, i % 2 ? '#ede0ba' : '#c3b894', '#2b3b49', 3);
      star(ctx, px + 15, py + 21, 8 + n * .7, '#826528');
    }
    ctx.beginPath(); ctx.arc(53, 63, 28, -.8, 2.3); ctx.strokeStyle = accent; ctx.lineWidth = 3; ctx.stroke();
    polygon(ctx, [[27, 78], [28, 90], [40, 84]], accent);
    ctx.beginPath(); ctx.arc(53, 63, 28, 2.6, 5.4); ctx.stroke();
    polygon(ctx, [[80, 48], [77, 35], [67, 41]], accent);
  } else if (family === 'growth') {
    polygon(ctx, [[34, 81], [74, 81], [69, 101], [40, 101]], '#c59864', '#263c36', 1.4);
    frame(ctx, 32, 78, 44, 8, '#e1bb7f', '#263c36', 2);
    line(ctx, [[54, 79], [49 + n, 64], [58 - n, 48], [53, 28 + n]], '#a7d288', 3);
    for (let i = 0; i < 3 + n; i++) {
      const py = 39 + i * 6, sign = i % 2 ? 1 : -1, px = 54 + sign * 3;
      polygon(ctx, [[px, py + 5], [px + sign * (13 + n), py - 4], [px + sign * 15, py + 5]], i % 2 ? '#8cbf91' : secondary, '#25473c', .8);
    }
    oval(ctx, 53, 32 + n, 6 + n * .4, 6 + n * .4, secondary, ivory);
  } else if (family === 'economy') {
    frame(ctx, 27, 63, 54, 32, '#415965', '#f3d992', 5, 2);
    frame(ctx, 62, 69, 21, 16, '#af864b', '#f4dca0', 3);
    oval(ctx, 69, 77, 2, 2, '#f4dca0');
    for (let i = 0; i < 3 + n; i++) oval(ctx, 36 + i * 5, 61 - i * 4, 9, 4, '#edce74', '#7f6130');
    oval(ctx, 63, 43, 13 + n, 13 + n, '#d9b55f', '#f6df9a');
    label(ctx, '$', 63, 49, 19, '#72532d', 21);
    star(ctx, 31, 36 + n * 2, 6, secondary);
  } else if (family === 'rule') {
    polygon(ctx, [[32, 32], [76, 27 + n], [74, 86], [66, 93], [58, 88], [49, 97], [39, 89], [30, 95]], '#edd5b7', '#392f4c', 1.4);
    for (let i = 0; i < 3; i++) line(ctx, [[39, 43 + i * 15], [65, 40 + i * 15]], '#785275', 1.1);
    const nodes = Array.from({ length: 4 + n }, (_, i) => {
      const a = i * Math.PI * 2 / (4 + n) - Math.PI / 2;
      return [54 + Math.cos(a) * 17, 64 + Math.sin(a) * 19];
    });
    line(ctx, [...nodes, nodes[0], nodes[2]], '#8d487d', 2);
    nodes.forEach(([px, py]) => oval(ctx, px, py, 2.2, 2.2, '#f7edc4', '#8d487d'));
  } else {
    const teeth = 7 + n;
    polygon(ctx, Array.from({ length: teeth * 4 }, (_, i) => {
      const a = i * Math.PI * 2 / (teeth * 4), r = i % 4 < 2 ? 25 : 21;
      return [54 + Math.cos(a) * r, 63 + Math.sin(a) * r];
    }), '#9caec7', '#273448', 1.3);
    oval(ctx, 54, 63, 14, 14, '#3b465c', accent);
    ctx.save(); ctx.translate(54, 63); ctx.rotate(-.6 + n * .16);
    frame(ctx, -4, -19, 8, 48, '#e3cba5', '#4e4052', 2);
    oval(ctx, 0, -18, 9, 9, '#e3cba5', '#4e4052'); oval(ctx, 0, -18, 4, 4, '#3b465c');
    polygon(ctx, [[0, 20], [15, 20], [15, 25], [8, 25], [8, 29], [0, 29]], '#e3cba5', '#4e4052');
    ctx.restore(); star(ctx, 79, 37 + n, 5, secondary);
  }
}

/** Collectible Jokers share a frame, with family badges, rarity marks and individual vector illustrations. */
export function drawGambitJoker(ctx, id, x, y, w, h, { selected = false } = {}) {
  if (!validRect(ctx, x, y, w, h)) return;
  const item = catalogJoker(id), family = familyStyles[item?.family] || familyStyles.utility;
  const [background, accent, names] = jokerStyles[id] || [family[0], family[1], jokerTitle(item?.name || 'Unknown Joker')];
  ctx.save(); ctx.translate(x, y); ctx.scale(w / 100, h / 140);
  frame(ctx, 2, 4, 98, 136, '#10232d66', null, 6);
  frame(ctx, 0, 0, 98, 136, ivory, selected ? '#ffd763' : '#d3cfb7', 5, selected ? 3 : 1.4);
  frame(ctx, 5, 5, 88, 126, background, accent, 2, .7);
  // Original foil-like diagonal hatch, kept quieter than the central illustration.
  for (let yLine = 12; yLine < 100; yLine += 13) line(ctx, [[22, yLine], [86, yLine + 15]], '#ffffff0c', .6);
  frame(ctx, 24, 8, 61, 10, '#101d2b80', null, 2);
  label(ctx, family[2], 54.5, 15.5, 6.5, '#fff5d5', 56);
  for (let i = 0; i < 5; i++) label(ctx, 'JOKER'[i], 12, 22 + i * 11, 9, '#fff4ce', 10);
  ctx.save(); jokerSymbol(ctx, id, accent); ctx.restore();
  frame(ctx, 20, 106, 68, 23, '#fff1cf', accent, 2, .8);
  label(ctx, names[0], 54, 116, 8.7, background, 64); label(ctx, names[1], 54, 126, 8.7, background, 64);
  const rarity = rarityColors[item?.rarity] || rarityColors.common;
  if (item?.rarity === 'rare' || item?.rarity === 'legendary') star(ctx, 12, 119, 5, rarity);
  else if (item?.rarity === 'uncommon') polygon(ctx, [[12, 113], [16, 119], [12, 125], [8, 119]], rarity);
  else oval(ctx, 12, 119, 3.5, 3.5, rarity);
  ctx.restore();
}

function cardBack(ctx, x, y, w, h) {
  ctx.save(); ctx.translate(x, y); ctx.scale(w / 100, h / 140);
  frame(ctx, 0, 0, 98, 136, '#fcf0d6', '#9aa9ab', 5, 1.5);
  frame(ctx, 5, 5, 88, 126, '#245b81', '#bde1e1', 2, 1.2);
  for (let row = 0; row < 8; row++) for (let col = 0; col < 5; col++) {
    const px = 14 + col * 17, py = 17 + row * 14;
    polygon(ctx, [[px, py - 4], [px + 4, py], [px, py + 4], [px - 4, py]], null, '#79afbb', .8);
  }
  polygon(ctx, [[49, 35], [76, 68], [49, 101], [22, 68]], '#1b4b71', '#e7d6a0', 2);
  oval(ctx, 49, 68, 15, 20, null, '#e7d6a0');
  suit(ctx, 2, 49, 68, 21, '#f2e4bc');
  frame(ctx, 10, 10, 78, 116, '#ffffff00', '#d6dfc8', 1, .7);
  ctx.restore();
}

/** Backed draw pile, including a count contained within the supplied rectangle. */
export function drawGambitDeck(ctx, x, y, w, h, count, total = 52) {
  if (!validRect(ctx, x, y, w, h)) return;
  ctx.save();
  const offset = Math.min(w * .06, h * .03, 4), labelHeight = Math.min(h * .18, Math.max(9, h * .11)), cardHeight = Math.max(.1, h - labelHeight - offset * 2);
  for (let i = 2; i >= 0; i--) cardBack(ctx, x + i * offset, y + i * offset, w - offset * 2, cardHeight);
  const safeTotal = Number.isFinite(total) ? Math.max(0, Math.min(4096, Math.floor(total))) : 52;
  const safeCount = Number.isFinite(count) ? Math.max(0, Math.min(safeTotal, Math.floor(count))) : 0;
  label(ctx, safeCount + '/' + safeTotal, x + w / 2, y + h - 1, labelHeight * .85, '#f8efcf', w);
  ctx.restore();
}

/** An unopened booster has a sealed wrapper silhouette, not a playing-card face. */
export function drawGambitPack(ctx, kind, x, y, w, h, { size = 'normal' } = {}) {
  if (!validRect(ctx, x, y, w, h)) return;
  const styles = {
    joker: ['#734b86', '#ef9dcd', '#503364', 'JOKER'], upgrade: ['#237ca0', '#f0d365', '#165b7c', 'UPGRADE'],
    craft: ['#a64f49', '#f5c38c', '#733d43', 'CRAFT'], standard: ['#367158', '#cde6aa', '#234e46', 'STANDARD'],
  };
  const [background, accent, panel, name] = Object.hasOwn(styles, kind) ? styles[kind] : styles.upgrade;
  const mega = size === 'mega';
  ctx.save(); ctx.translate(x, y); ctx.scale(w / 100, h / 140);
  const seam = Array.from({ length: 13 }, (_, i) => [8 + i * 7, i % 2 ? 8 : 4]);
  polygon(ctx, [...seam, [92, 132], ...seam.slice().reverse().map(([px, py]) => [px, 140 - py]), [8, 8]], background, '#f7e9c5', 1.5);
  frame(ctx, 12, 14, 76, 111, panel, accent, 2, mega ? 2 : 1);
  if (mega) {
    for (let i = 0; i < 5; i++) polygon(ctx, [[13, 36 + i * 17], [87, 18 + i * 17], [87, 24 + i * 17], [13, 42 + i * 17]], '#ffffff13');
    polygon(ctx, [[14, 14], [31, 14], [14, 31]], accent);
    polygon(ctx, [[86, 125], [69, 125], [86, 108]], accent);
  }
  for (let i = 0; i < 4; i++) line(ctx, [[18, 19 + i * 3], [82, 19 + i * 3]], '#ffffff29', 1);
  if (kind === 'joker') {
    polygon(ctx, [[28, 54], [26, 34], [44, 47], [54, 27], [64, 47], [81, 34], [79, 57]], '#e5be65', '#352844', 1.5);
    oval(ctx, 53, 64, 23, 24, '#f7e3c5', '#3e2d50');
    line(ctx, [[36, 61], [42, 57], [47, 61]], '#73425b', 2.5); line(ctx, [[59, 61], [65, 57], [71, 61]], '#73425b', 2.5);
    line(ctx, [[42, 74], [53, 80], [65, 73]], '#a74669', 3); oval(ctx, 53, 68, 3, 3, '#de728d');
  } else if (kind === 'craft') {
    polygon(ctx, [[31, 32], [77, 35], [72, 85], [29, 81]], '#f2d1a5', '#3e3441', 1.2);
    for (let i = 0; i < 3; i++) line(ctx, [[38, 44 + i * 12], [64, 46 + i * 12]], '#b87f74', 1.5);
    line(ctx, [[30, 83], [70, 40]], '#eac88c', 6);
    polygon(ctx, [[56, 35], [65, 27], [82, 43], [74, 52]], '#adcad0', '#39374c', 1.5);
    polygon(ctx, [[28, 82], [31, 91], [38, 87]], '#765354', '#eac88c');
    star(ctx, 39, 39, 9, '#ffe5a4'); star(ctx, 76, 78, 6, '#f5b8a1');
  } else if (kind === 'standard') {
    for (let i = 0; i < 3; i++) {
      ctx.save(); ctx.translate(51, 85); ctx.rotate((i - 1) * .22);
      frame(ctx, -18, -54, 36, 58, ivory, '#20473c', 3, 1.5);
      suit(ctx, i === 0 ? 3 : i === 1 ? 2 : 1, 0, -30, 21, GAMBIT_SUIT_COLORS[i === 0 ? 3 : i === 1 ? 2 : 1]);
      ctx.restore();
    }
    oval(ctx, 51, 84, 8, 6, '#a4c978', '#f0e9ba');
  } else {
    star(ctx, 50, 58, 27, '#f1ce68');
    line(ctx, [[50, 74], [50, 44]], '#175f82', 6); polygon(ctx, [[36, 54], [50, 38], [64, 54]], '#175f82');
    for (const [px, py] of [[24, 38], [79, 72], [28, 85]]) star(ctx, px, py, 5, '#b8e9dc');
  }
  if (mega) {
    label(ctx, 'MEGA', 50, 96, 9, accent, 58);
    star(ctx, 23, 93, 4, accent); star(ctx, 77, 93, 4, accent);
  }
  label(ctx, name, 50, 107, 13, ivory, 72);
  label(ctx, 'PACK', 50, 120, 10, accent, 65);
  for (let i = 0; i < 3; i++) line(ctx, [[18, 129 + i * 2], [82, 129 + i * 2]], '#ffffff32', 1);
  ctx.restore();
}
