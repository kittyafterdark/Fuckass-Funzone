/** Glow Stack canvas: a tower of glowing glass blocks on a neon pad, drawn at a three-quarter angle so each layer visibly
 * crosses the one below it and a pulled block leaves a real hole. */
import { pullableLayers, layerHeight, blockBox, project, ISO_X, ISO_Y, STACK_FLOOR } from './wafer.js';

const W = 360, H = 452;
// Jewel-tone glass: top face, left face, right face, glowing edge.
const GLASS = Object.freeze([
  ['#ffb3d4', '#ff7fb6', '#c94f8a', '#ffd6e8'], ['#d8c2ff', '#b18cff', '#7c5bd6', '#ece2ff'], ['#a8ecff', '#5fd3f0', '#2f9cc0', '#d9f7ff'],
  ['#b4f5d8', '#6fe0b0', '#38a87d', '#dcfff0'], ['#ffe2a1', '#ffc85e', '#c9902a', '#fff2cf'],
]);
const FEEL_COLORS = Object.freeze({ loose: '#7fcf8a', snug: '#ffcf5a', stuck: '#ff6f9f' });
const LEVEL_NAMES = Object.freeze({ chill: 'CHILL GABU', normal: 'NORMAL GABU', hard: 'HARD GABU' });
const rounded = (ctx, x, y, w, h, r, fill) => { ctx.fillStyle = fill; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); };
const drawTxt = (ctx, t, x, y, size, color = '#fbf3ef', align = 'left') => {
  ctx.font = `800 ${size}px ui-sans-serif,system-ui,sans-serif`; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.fillText(String(t), x, y); ctx.textAlign = 'left';
};
const drawSprite = (ctx, img, x, y, w, h) => { if (!img?.complete || !img.naturalWidth) return false; ctx.drawImage(img, x, y, w, h); return true; };
const polygon = (ctx, points) => { ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath(); };
// The wobble bar warms smoothly from mint through gold to pink as the tower gets shakier.
const wobbleColor = w => w < 50 ? mix('#7fcf8a', '#ffcf5a', w / 50) : mix('#ffcf5a', '#ff6f9f', (w - 50) / 50);
function mix(a, b, t) {
  const pa = [1, 3, 5].map(i => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map(i => parseInt(b.slice(i, i + 2), 16)), k = Math.max(0, Math.min(1, t));
  return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * k).toString(16).padStart(2, '0')).join('');
}
/** The faces of a box seen from the front: its top, its left face (the y side facing you) and its right face (the x side),
 * plus its outline. `P` turns box corners into screen points. */
function boxFaces(box, P) {
  const [x0, x1] = box.x, [y0, y1] = box.y, [z0, z1] = box.z;
  return {
    top: [P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)],
    left: [P(x0, y1, z1), P(x1, y1, z1), P(x1, y1, z0), P(x0, y1, z0)],
    right: [P(x1, y0, z1), P(x1, y1, z1), P(x1, y1, z0), P(x1, y0, z0)],
    outline: [P(x0, y0, z1), P(x1, y0, z1), P(x1, y0, z0), P(x1, y1, z0), P(x0, y1, z0), P(x0, y1, z1)],
  };
}
/** A tower block's faces, nudged sideways by the tower's lean. */
const faces = (box, dx = 0) => boxFaces(box, (x, y, z) => { const p = project(x, y, z); return { x: p.x + dx, y: p.y }; });
function drawBox(ctx, f, color, alpha = 1) {
  const [top, left, right, edge] = GLASS[((color % GLASS.length) + GLASS.length) % GLASS.length];
  ctx.save(); ctx.globalAlpha = alpha; ctx.lineJoin = 'round';
  polygon(ctx, f.left); ctx.fillStyle = left; ctx.fill();
  polygon(ctx, f.right); ctx.fillStyle = right; ctx.fill();
  polygon(ctx, f.top); ctx.fillStyle = top; ctx.fill();
  // A soft shine across the top face and a glowing rim make the blocks read as glass.
  ctx.globalAlpha = alpha * .45; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(f.top[0].x + (f.top[3].x - f.top[0].x) * .3, f.top[0].y + (f.top[3].y - f.top[0].y) * .3);
  ctx.lineTo(f.top[1].x + (f.top[2].x - f.top[1].x) * .3, f.top[1].y + (f.top[2].y - f.top[1].y) * .3); ctx.stroke();
  ctx.globalAlpha = alpha * .8; ctx.strokeStyle = edge; ctx.lineWidth = .9; polygon(ctx, f.outline); ctx.stroke();
  ctx.restore();
}
const inside = (pts, x, y) => {
  let sign = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length], cross = (b.x - a.x) * (y - a.y) - (b.y - a.y) * (x - a.x);
    if (cross) { if (sign && Math.sign(cross) !== sign) return false; sign = Math.sign(cross); }
  }
  return true;
};
/** Which block is under a point, front-most first. The block you are holding is found where it is drawn, even part-way out. */
export function stackBlockAt(x, y, layers, lean = 0, held = null) {
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Array.isArray(layers)) return null;
  const n = layers.length;
  for (let row = n - 1; row >= 0; row--) for (let slot = 2; slot >= 0; slot--) {
    if (!layers[row][slot]) continue;
    const out = held && held.row === row && held.slot === slot ? held.progress * 3 : 0;
    if (inside(faces(blockBox(row, slot, n, out), lean * row / n).outline, x, y)) return { row, slot };
  }
  return null;
}
// `cursor` is false until the player uses the keyboard, so taps never leave a stray highlight.
export function drawGlowStack(canvas, game, { best = 0, images = {}, reduced = false, cursor = true } = {}) {
  if (!canvas?.getContext) return; const ctx = canvas.getContext('2d'); if (!ctx) return;
  ctx.save(); ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
  const room = ctx.createLinearGradient(0, 0, 0, H); room.addColorStop(0, '#1f1734'); room.addColorStop(1, '#0e0b18'); ctx.fillStyle = room; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 14; i++) { ctx.fillStyle = i % 3 ? '#8fe8ff12' : '#ff8fb81c'; ctx.fillRect((i * 71 + 13) % W, (i * 109 + 23) % H, 2, 2); }
  // The neon pad the tower stands on, and the floor in front of it.
  ctx.fillStyle = '#ffffff08'; ctx.fillRect(0, STACK_FLOOR, W, H - STACK_FLOOR);
  const pad = [project(-1.9, -1.9, 0), project(1.9, -1.9, 0), project(1.9, 1.9, 0), project(-1.9, 1.9, 0)];
  ctx.save(); ctx.shadowColor = '#ff78b5'; ctx.shadowBlur = reduced ? 0 : 14; polygon(ctx, pad); ctx.fillStyle = '#2b2046'; ctx.fill(); ctx.restore();
  polygon(ctx, pad); ctx.strokeStyle = '#ff78b5aa'; ctx.lineWidth = 1.6; ctx.stroke();
  // The header: a little glass block, the title, score and best; then round, Gabu's level, the wobble meter and how the held block feels.
  rounded(ctx, 0, 0, W, 48, 0, '#1a1228');
  drawBox(ctx, boxFaces({ x: [-.6, .6], y: [-.6, .6], z: [-4, 4] }, (x, y, z) => ({ x: 26 + (x - y) * 8, y: 24 + (x + y) * 4.6 - z })), 0);
  drawTxt(ctx, 'GLOW STACK', 44, 31, 12, '#ffe6ef');
  drawTxt(ctx, `SCORE ${game.score}`, 200, 31, 11, '#fdfaf7', 'center');
  drawTxt(ctx, `BEST ${Math.max(best, game.score)}`, 342, 31, 11, '#ead4c4', 'right');
  drawTxt(ctx, `ROUND ${game.round}  ·  WINS ${game.wins}`, 20, 66, 10, '#e2d4ef');
  drawTxt(ctx, LEVEL_NAMES[game.level] || 'GABU', 340, 66, 10, '#e2d4ef', 'right');
  const wobble = Math.min(100, game.wobble);
  drawTxt(ctx, 'WOBBLE', 20, 84, 9, '#cdbbe0'); rounded(ctx, 66, 76, 120, 9, 4.5, '#ffffff22');
  if (wobble > 0) rounded(ctx, 66, 76, Math.max(9, 120 * wobble / 100), 9, 4.5, wobbleColor(wobble));
  const held = game.selected || game.gabuPull, feel = held ? game.feel(held.row, held.slot) : null;
  if (feel) drawTxt(ctx, `${game.selected ? 'FEELS' : 'GABU’S FEELS'} ${feel.toUpperCase()}`, 340, 84, 9, FEEL_COLORS[feel], 'right');
  // The tower, bottom layer first and back to front within each layer, so nearer glass covers farther glass.
  const n = game.layers.length, lean = game.lean(reduced), fallen = game.phase === 'over';
  const keyCursor = cursor && game.status === 'playing' && game.turn === 1 && game.phase === 'turn' && !game.selected;
  for (let row = 0; row < n; row++) {
    const dx = lean * row / n;
    for (let slot = 0; slot < 3; slot++) {
      // After a topple only the stump below the break stands; the block pulled out to cause it is gone.
      if (!game.layers[row][slot] || fallen && (row > game.breakRow || game.pulledOut?.row === row && game.pulledOut?.slot === slot)) continue;
      const moving = held?.row === row && held?.slot === slot, f = faces(blockBox(row, slot, n, moving ? held.progress * 3 : 0), dx);
      drawBox(ctx, f, row * 3 + slot);
      if (moving && feel) { ctx.strokeStyle = FEEL_COLORS[feel]; ctx.lineWidth = 2.4; polygon(ctx, f.outline); ctx.stroke(); }
      else if (keyCursor && game.cursor.row === row && game.cursor.slot === slot) {
        ctx.strokeStyle = '#ffffffcc'; ctx.lineWidth = 2; ctx.setLineDash([4, 3]); polygon(ctx, f.outline); ctx.stroke(); ctx.setLineDash([]);
      }
    }
  }
  // Pullable layers end at faint marks on both sides, so the off-limits top is obvious.
  if (game.phase === 'turn') {
    const limit = pullableLayers(game.layers), z = limit * layerHeight(n), dx = lean * limit / n, left = project(-1.5, 1.5, z), right = project(1.5, -1.5, z);
    ctx.strokeStyle = '#ffffff40'; ctx.lineWidth = 1.4; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(left.x + dx - 18, left.y); ctx.lineTo(left.x + dx - 4, left.y); ctx.moveTo(right.x + dx + 4, right.y); ctx.lineTo(right.x + dx + 18, right.y); ctx.stroke(); ctx.setLineDash([]);
  }
  // The block that just came out carries on toward you and fades as it heads for the top.
  if (game.lastPull && game.lastPull.age < .4) {
    const p = game.lastPull, t = p.age / .4;
    drawBox(ctx, faces(blockBox(p.row, p.slot, n, 3 + t * 1.5)), p.row * 3 + p.slot, 1 - t);
  }
  // Fallen blocks keep their shape and tumble as their outline does in the physics.
  const local = (x, y, z) => ({ x: (x - y) * ISO_X, y: (x + y) * ISO_Y - z });
  for (const c of game.crumbs) {
    const lx = c.alongX ? 3 : .94, ly = c.alongX ? .94 : 3, f = boxFaces({ x: [-lx / 2, lx / 2], y: [-ly / 2, ly / 2], z: [-c.depth / 2, c.depth / 2] }, local);
    ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.spin); drawBox(ctx, f, c.color); ctx.restore();
  }
  // The footer: the pull bar while you hold a block, otherwise whose turn it is and the controls.
  rounded(ctx, 0, 412, W, 40, 0, '#1a1228');
  const yourTurn = game.status === 'playing' && game.phase === 'turn' && game.turn === 1;
  if (yourTurn && game.selected) {
    const p = game.selected.progress;
    rounded(ctx, 90, 419, 180, 7, 3.5, '#ffffff22'); if (p > 0) rounded(ctx, 90, 419, Math.max(7, 180 * p), 7, 3.5, FEEL_COLORS[feel]);
    drawTxt(ctx, game.selected.row % 2 === 0 ? 'DRAG DOWN AND RIGHT, SLOWLY  ·  ESC PUSHES IT BACK' : 'DRAG DOWN AND LEFT, SLOWLY  ·  ESC PUSHES IT BACK', 180, 441, 9, '#fdf2f7', 'center');
  } else {
    const thinking = game.status === 'playing' && game.phase === 'turn' && game.turn === 2;
    if (thinking) drawSprite(ctx, images.gabu_smug, 74, 418, 24, 24);
    drawTxt(ctx, game.phase === 'over' ? (game.result === 'win' ? 'GABU TOPPLED IT! TAP FOR THE NEXT ROUND' : 'YOU TOPPLED IT') : yourTurn ? 'YOUR PULL: GRAB A BLOCK AND SLIDE IT OUT' : thinking ? (game.gabuPull ? 'GABU IS PULLING' : 'GABU IS PICKING') : 'GLOW STACK',
      180, 430, 11, game.result === 'win' && game.phase === 'over' ? '#ffe08a' : '#fdf2f7', 'center');
    drawTxt(ctx, 'NUDGE TO FEEL IT  ·  ARROWS, THEN HOLD SPACE', 180, 445, 8, '#bfa9c4', 'center');
  }
  if (game.status === 'dead') overlay(ctx, 'CRASH!', `Streak over: ${game.wins} ${game.wins === 1 ? 'win' : 'wins'}, ${game.score} points.`, 'PRESS PLAY FOR A NEW STREAK', '#ff8fb8');
  else if (game.status === 'paused') overlay(ctx, 'PAUSED', 'The tower is holding its breath.', 'PRESS PLAY TO RESUME', '#b8a7ff');
  else if (game.status === 'idle') overlay(ctx, 'GLOW STACK', 'Slide a block out toward you. Loose ones are safest.', 'PRESS PLAY OR TAP TO START', '#8fe8ff');
  ctx.restore();
}
function overlay(ctx, message, sub, hint, accent) {
  ctx.fillStyle = '#120e1ca8'; ctx.fillRect(0, 48, W, H - 48);
  rounded(ctx, 30, 176, 300, 104, 14, accent); rounded(ctx, 32, 178, 296, 100, 12, '#211a33');
  drawTxt(ctx, message, 180, 220, 22, '#fff0f5', 'center'); drawTxt(ctx, sub, 180, 244, 11, '#ead5e4', 'center');
  drawTxt(ctx, hint, 180, 265, 9, '#ffd98c', 'center');
}
