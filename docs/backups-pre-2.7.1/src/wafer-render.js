/** Wobbly Wafers canvas: a tea-party table, a swaying tower of pastel wafer cookies, and a steady-hand meter. */
import { pullRisk, pullableLayers, layerHeight, waferCenterX, WAFER_BASE, WAFER_TABLE, WAFER_W, SAUCER_RX } from './wafer.js';

const W = 360, H = 452, BASE = WAFER_BASE;
const FLAVORS = [['#ffb7c9', '#fff4f7', '#e8869f'], ['#f6d79a', '#fffaf0', '#cfa65c'], ['#a9765f', '#ffe9f1', '#7a4f3d'], ['#bfe3a4', '#f6fff0', '#86b86a']];
const rounded = (ctx, x, y, w, h, r, fill) => { ctx.fillStyle = fill; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); };
const drawTxt = (ctx, t, x, y, size, color = '#fbf3ef', align = 'left') => {
  ctx.font = `800 ${size}px ui-sans-serif,system-ui,sans-serif`; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.fillText(String(t), x, y); ctx.textAlign = 'left';
};
const drawSprite = (ctx, img, x, y, w, h) => { if (!img?.complete || !img.naturalWidth) return false; ctx.drawImage(img, x, y, w, h); return true; };
export const waferLayout = count => ({ layerH: layerHeight(count) });
const slotX = slot => waferCenterX(slot) - WAFER_W / 2;
export function waferAt(x, y, count, lean = 0) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  const { layerH } = waferLayout(count), row = Math.floor((BASE - y) / layerH), dx = lean * row / count, slot = [0, 1, 2].find(s => x - dx >= slotX(s) && x - dx < slotX(s) + WAFER_W);
  return row >= 0 && row < count && slot !== undefined ? { row, slot } : null;
}
/** One wafer: alternate layers show the striped side or the waffle top, so the tower reads as crossed layers. */
export function drawWafer(ctx, x, y, w, h, flavor, crossed) {
  const [shell, cream, line] = FLAVORS[flavor % FLAVORS.length];
  rounded(ctx, x, y, w, h, Math.min(5, h / 3), shell);
  ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w, h, Math.min(5, h / 3)); ctx.clip();
  if (crossed) { ctx.strokeStyle = line; ctx.lineWidth = 1; for (let gx = x + 5; gx < x + w; gx += 7) { ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx, y + h); ctx.stroke(); } ctx.beginPath(); ctx.moveTo(x, y + h / 2); ctx.lineTo(x + w, y + h / 2); ctx.stroke(); }
  else { ctx.fillStyle = cream; for (let i = 1; i <= 2; i++) ctx.fillRect(x + 2, y + h * i / 3 - 1, w - 4, Math.max(1.4, h / 9)); }
  ctx.restore();
  ctx.strokeStyle = line; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.roundRect(x + .5, y + .5, w - 1, h - 1, Math.min(5, h / 3)); ctx.stroke();
}
const LEVEL_NAMES = Object.freeze({ chill: 'CHILL GABU', normal: 'NORMAL GABU', hard: 'HARD GABU' });
// `cursor` is false until the player uses the keyboard, so taps never leave a stray highlight.
export function drawWobblyWafers(canvas, game, { best = 0, images = {}, reduced = false, cursor = true } = {}) {
  if (!canvas?.getContext) return; const ctx = canvas.getContext('2d'); if (!ctx) return;
  ctx.save(); ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
  const wall = ctx.createLinearGradient(0, 0, 0, H); wall.addColorStop(0, '#3a2a4d'); wall.addColorStop(1, '#2a1f38'); ctx.fillStyle = wall; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 8; i++) { ctx.fillStyle = '#ffffff08'; ctx.fillRect(i * 48, 50, 24, BASE - 40); }
  for (let i = 0; i < 12; i++) { ctx.fillStyle = i % 2 ? '#ffd1e1' : '#fff4f7'; ctx.fillRect(i * 30, WAFER_TABLE, 30, 22); }
  ctx.beginPath(); ctx.ellipse(W / 2, BASE + 4, SAUCER_RX, 10, 0, 0, Math.PI * 2); ctx.fillStyle = '#f4fbff'; ctx.fill(); ctx.strokeStyle = '#a9cde3'; ctx.lineWidth = 1.4; ctx.stroke();
  rounded(ctx, 0, 0, W, 48, 0, '#2c1a33');
  drawWafer(ctx, 15, 17, 22, 14, 0, false);
  drawTxt(ctx, 'WOBBLY WAFERS', 42, 31, 12, '#ffe6ef');
  drawTxt(ctx, `SCORE ${game.score}`, 214, 31, 11, '#fdfaf7', 'center');
  drawTxt(ctx, `BEST ${Math.max(best, game.score)}`, 342, 31, 11, '#ead4c4', 'right');
  drawTxt(ctx, `ROUND ${game.round}  ·  WINS ${game.wins}`, 20, 66, 10, '#e2d4ef');
  drawTxt(ctx, LEVEL_NAMES[game.level] || 'GABU', 340, 66, 10, '#e2d4ef', 'right');
  const wobble = Math.min(100, game.wobble);
  drawTxt(ctx, 'WOBBLE', 20, 84, 9, '#cdbbe0'); rounded(ctx, 66, 76, 120, 9, 4.5, '#ffffff22');
  rounded(ctx, 66, 76, 120 * wobble / 100, 9, 4.5, wobble >= 70 ? '#ff6f9f' : wobble >= 40 ? '#ffcf5a' : '#7fcf8a');
  const n = game.layers.length, { layerH } = waferLayout(n), lean = game.lean(reduced);
  const fallen = game.phase === 'over';
  for (let row = 0; row < n; row++) {
    const y = BASE - (row + 1) * layerH, dx = lean * row / n;
    for (let slot = 0; slot < 3; slot++) {
      // After a topple only the stump below the break stands; the wafer pulled out to cause it is gone.
      if (!game.layers[row][slot] || fallen && (row > game.breakRow || game.pulledOut?.row === row && game.pulledOut?.slot === slot)) continue;
      const x = slotX(slot) + dx, chosen = game.selected?.row === row && game.selected?.slot === slot;
      drawWafer(ctx, x + (chosen ? (slot === 0 ? -6 : slot === 2 ? 6 : 0) * game.meter : 0), y + 1, WAFER_W, layerH - 2, row + slot, row % 2 === 1);
      if (chosen) {
        const risk = pullRisk(game.layers, row, slot);
        ctx.strokeStyle = risk === Infinity ? '#ff5d8f' : risk >= 16 ? '#ffcf5a' : '#5fd8d2'; ctx.lineWidth = 2.6;
        ctx.beginPath(); ctx.roundRect(x - 2, y - 1, WAFER_W + 4, layerH + 2, 6); ctx.stroke();
      } else if (cursor && game.status === 'playing' && game.turn === 1 && game.phase === 'turn' && !game.selected && game.cursor.row === row && game.cursor.slot === slot) {
        ctx.strokeStyle = '#ffffffaa'; ctx.lineWidth = 2; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.roundRect(x - 2, y - 1, WAFER_W + 4, layerH + 2, 6); ctx.stroke(); ctx.setLineDash([]);
      }
    }
  }
  // Pullable layers end at a faint line, so the off-limits top is obvious.
  if (game.phase === 'turn') { const limit = BASE - pullableLayers(game.layers) * layerH; ctx.strokeStyle = '#ffffff30'; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(78, limit); ctx.lineTo(282, limit); ctx.stroke(); ctx.setLineDash([]); }
  for (const c of game.crumbs) {
    ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.spin);
    drawWafer(ctx, -WAFER_W / 2, -c.h / 2, WAFER_W, c.h, c.flavor, c.crossed); ctx.restore();
  }
  if (game.lastPull && game.lastPull.age < .4) {
    const p = game.lastPull, t = p.age / .4, dir = p.slot === 0 ? -1 : p.slot === 2 ? 1 : (p.row % 2 ? 1 : -1);
    ctx.globalAlpha = 1 - t; drawWafer(ctx, slotX(p.slot) + dir * t * 90, BASE - (p.row + 1) * layerH + 1, WAFER_W, layerH - 2, p.row + p.slot, p.row % 2 === 1); ctx.globalAlpha = 1;
  }
  rounded(ctx, 0, 412, W, 40, 0, '#2c1a33');
  const yourTurn = game.status === 'playing' && game.phase === 'turn' && game.turn === 1;
  if (yourTurn && game.selected) {
    const mx = 70, mw = 220, bar = ctx.createLinearGradient(mx, 0, mx + mw, 0);
    bar.addColorStop(0, '#ff6f9f'); bar.addColorStop(.3, '#ffcf5a'); bar.addColorStop(.5, '#7fcf8a'); bar.addColorStop(.7, '#ffcf5a'); bar.addColorStop(1, '#ff6f9f');
    rounded(ctx, mx, 418, mw, 10, 5, bar); rounded(ctx, mx + game.meter * mw - 2.5, 414, 5, 18, 2.5, '#ffffff');
    drawTxt(ctx, 'TAP AGAIN WHILE IT’S GREEN TO PULL', 180, 445, 9, '#fdf2f7', 'center');
  } else {
    const thinking = game.status === 'playing' && game.phase === 'turn' && game.turn === 2;
    if (thinking) drawSprite(ctx, images.gabu_smug, 74, 418, 24, 24);
    drawTxt(ctx, game.phase === 'over' ? (game.result === 'win' ? 'GABU TOPPLED IT! TAP FOR THE NEXT ROUND' : 'YOU TOPPLED IT') : yourTurn ? 'YOUR PULL: TAP A WAFER' : thinking ? 'GABU IS PULLING' : 'WOBBLY WAFERS',
      180, 430, 11, game.result === 'win' && game.phase === 'over' ? '#ffe08a' : '#fdf2f7', 'center');
    drawTxt(ctx, 'TAP  ·  ARROWS + SPACE  ·  ESC CANCELS', 180, 445, 8, '#bfa9c4', 'center');
  }
  if (game.status === 'dead') overlay(ctx, 'CRASH!', `Streak over: ${game.wins} ${game.wins === 1 ? 'win' : 'wins'}, ${game.score} points.`, 'PRESS PLAY FOR A NEW STREAK', '#ff8fb8');
  else if (game.status === 'paused') overlay(ctx, 'PAUSED', 'The wafers are holding their breath.', 'PRESS PLAY TO RESUME', '#b8a7ff');
  else if (game.status === 'idle') overlay(ctx, 'WOBBLY WAFERS', 'Pull a wafer, stack it on top. Don’t topple it.', 'PRESS PLAY OR TAP TO START', '#f6d79a');
  ctx.restore();
}
function overlay(ctx, message, sub, hint, accent) {
  ctx.fillStyle = '#1a1220a0'; ctx.fillRect(0, 48, W, H - 48);
  rounded(ctx, 30, 176, 300, 104, 14, accent); rounded(ctx, 32, 178, 296, 100, 12, '#2a1d31');
  drawTxt(ctx, message, 180, 220, 22, '#fff0f5', 'center'); drawTxt(ctx, sub, 180, 244, 11, '#ead5e4', 'center');
  drawTxt(ctx, hint, 180, 265, 9, '#ffd98c', 'center');
}
