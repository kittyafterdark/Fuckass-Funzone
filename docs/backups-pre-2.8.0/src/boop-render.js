/** Boop-a-Bun canvas: a pastel garden with nine burrows, fluffy bunnies, golden bunnies and Gabu's robot decoys. */
import { BOOP_HOLES, BOOP_DURATION } from './boop.js';

const W = 360, H = 452, COLS = [70, 180, 290], ROWS = [168, 268, 368], RX = 44, RY = 14;
const rounded = (ctx, x, y, w, h, r, fill) => { ctx.fillStyle = fill; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); };
const drawTxt = (ctx, t, x, y, size, color = '#fbf3ef', align = 'left') => {
  ctx.font = `800 ${size}px ui-sans-serif,system-ui,sans-serif`; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.fillText(String(t), x, y); ctx.textAlign = 'left';
};
/** A tap on a raised critter belongs to that critter's burrow, even where its ears poke into the row above.
 * Otherwise the nearest burrow mouth wins, so a tap is never judged against a hole the player didn't aim at. */
export function boopHoleAt(x, y, game = null) {
  if (!Number.isFinite(x) || !Number.isFinite(y) || x < 14 || x >= 346 || y < 92 || y >= 410) return -1;
  let best = -1, bestDistance = Infinity;
  for (let i = 0; i < BOOP_HOLES && game; i++) {
    const rise = game.height?.(i) || 0; if (!game.holes?.[i] || rise <= 0) continue;
    const cx = COLS[i % 3], cy = ROWS[Math.floor(i / 3)], base = cy + 6 + (1 - rise) * 78;
    if (Math.abs(x - cx) <= 34 && y >= base - 84 && y <= cy + RY) {
      const distance = Math.abs(x - cx) + Math.abs(y - (base - 30)); if (distance < bestDistance) { bestDistance = distance; best = i; }
    }
  }
  if (best >= 0) return best;
  for (let i = 0; i < BOOP_HOLES; i++) {
    const distance = Math.hypot(x - COLS[i % 3], (y - ROWS[Math.floor(i / 3)]) * 1.4);
    if (distance < bestDistance) { bestDistance = distance; best = i; }
  }
  return bestDistance <= 80 ? best : -1;
}
/** A fluffy bunny (white or golden) or one of Gabu's little robots, drawn standing at the origin. */
export function drawCritter(ctx, kind, squish = 1) {
  ctx.save(); ctx.scale(1, squish); ctx.lineWidth = 1.6; ctx.lineJoin = 'round';
  if (kind === 'bot') {
    ctx.strokeStyle = '#4b3f7a'; ctx.beginPath(); ctx.moveTo(0, -52); ctx.lineTo(0, -64); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, -66, 4, 0, Math.PI * 2); ctx.fillStyle = '#ff8fb8'; ctx.fill(); ctx.stroke();
    rounded(ctx, -27, -52, 54, 56, 16, '#b8a7ff'); ctx.beginPath(); ctx.roundRect(-27, -52, 54, 56, 16); ctx.stroke();
    rounded(ctx, -20, -42, 40, 24, 9, '#2a2147');
    ctx.fillStyle = '#ffe9f7'; ctx.beginPath(); ctx.arc(-9, -30, 4, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.shadowColor = '#6ff3ff'; ctx.shadowBlur = 8; ctx.fillStyle = '#6ff3ff'; ctx.beginPath(); ctx.arc(9, -30, 5, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    ctx.strokeStyle = '#4b3f7a'; for (const x of [-10, -3, 4, 11]) { ctx.beginPath(); ctx.moveTo(x, -10); ctx.lineTo(x, -4); ctx.stroke(); }
    ctx.restore(); return;
  }
  const gold = kind === 'gold', fur = gold ? '#ffd36e' : '#fffaf6', ink = gold ? '#a36b1c' : '#8a6a7e', inner = gold ? '#ffb070' : '#ffc2d6';
  for (const sign of [-1, 1]) {
    ctx.save(); ctx.translate(sign * 11, -44); ctx.rotate(sign * .18);
    ctx.beginPath(); ctx.ellipse(0, -16, 8, 22, 0, 0, Math.PI * 2); ctx.fillStyle = fur; ctx.fill(); ctx.strokeStyle = ink; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, -15, 4, 16, 0, 0, Math.PI * 2); ctx.fillStyle = inner; ctx.fill(); ctx.restore();
  }
  ctx.beginPath(); ctx.ellipse(0, -22, 28, 27, 0, 0, Math.PI * 2); ctx.fillStyle = fur; ctx.fill(); ctx.strokeStyle = ink; ctx.stroke();
  ctx.fillStyle = '#3a2638'; ctx.beginPath(); ctx.arc(-10, -26, 3.2, 0, Math.PI * 2); ctx.arc(10, -26, 3.2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(-9, -27.5, 1.1, 0, Math.PI * 2); ctx.arc(11, -27.5, 1.1, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ff7fae'; ctx.beginPath(); ctx.moveTo(-3, -19); ctx.lineTo(3, -19); ctx.lineTo(0, -15.5); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#8a6a7e'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, -15.5); ctx.quadraticCurveTo(-2, -12, -5, -13); ctx.moveTo(0, -15.5); ctx.quadraticCurveTo(2, -12, 5, -13); ctx.stroke();
  ctx.globalAlpha = .6; ctx.fillStyle = '#ff9fc0'; ctx.beginPath(); ctx.ellipse(-17, -16, 4.5, 2.6, 0, 0, Math.PI * 2); ctx.ellipse(17, -16, 4.5, 2.6, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
  if (gold) for (const [x, y] of [[-30, -48], [28, -40], [-24, -6]]) { ctx.strokeStyle = '#fff6d6'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.lineTo(x + 4, y); ctx.moveTo(x, y - 4); ctx.lineTo(x, y + 4); ctx.stroke(); }
  ctx.restore();
}
// `cursor` is false until the player uses the keyboard, so taps never leave a stray highlight.
export function drawBoopABun(canvas, game, { best = 0, reduced = false, cursor = true } = {}) {
  if (!canvas?.getContext) return; const ctx = canvas.getContext('2d'); if (!ctx) return;
  ctx.save(); ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
  const grass = ctx.createLinearGradient(0, 0, 0, H); grass.addColorStop(0, '#c9efb4'); grass.addColorStop(1, '#93d48b'); ctx.fillStyle = grass; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 22; i++) {
    const x = (i * 83 + 17) % W, y = 96 + (i * 131 + 7) % 320; ctx.fillStyle = ['#ffd1e1', '#fff6d6', '#e6dcff'][i % 3];
    for (let p = 0; p < 5; p++) { const a = p * Math.PI * 2 / 5; ctx.beginPath(); ctx.arc(x + Math.cos(a) * 2.6, y + Math.sin(a) * 2.6, 2, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#ffcf5a'; ctx.beginPath(); ctx.arc(x, y, 1.6, 0, Math.PI * 2); ctx.fill();
  }
  rounded(ctx, 0, 0, W, 50, 0, '#2c1a33');
  ctx.save(); ctx.translate(26, 40); ctx.scale(.36, .36); drawCritter(ctx, 'bun'); ctx.restore();
  drawTxt(ctx, 'BOOP-A-BUN', 42, 31, 12, '#ffe6ef');
  drawTxt(ctx, `SCORE ${game.score}`, 196, 31, 11, '#fdfaf7', 'center');
  drawTxt(ctx, `BEST ${Math.max(best, game.score)}`, 342, 31, 11, '#ead4c4', 'right');
  const fraction = game.timeLeft / BOOP_DURATION, low = game.timeLeft <= 10;
  rounded(ctx, 20, 62, 200, 14, 7, '#ffffffa0'); rounded(ctx, 22, 64, Math.max(0, 196 * fraction), 10, 5, low ? '#ff6f9f' : '#7fcf8a');
  drawTxt(ctx, `${Math.ceil(game.timeLeft)}s`, 228, 74, 11, low ? '#c93a6c' : '#2f6b3a');
  drawTxt(ctx, game.combo >= 2 ? `COMBO ×${game.combo}` : String(game.pace).toUpperCase(), 340, 74, 11, game.combo >= 2 ? '#c93a6c' : '#2f6b3a', 'right');
  for (let i = 0; i < BOOP_HOLES; i++) {
    const cx = COLS[i % 3], cy = ROWS[Math.floor(i / 3)], h = game.holes[i], rise = game.height(i);
    // The cursor ring sits on the grass, under the burrow and anything climbing out of it.
    if (cursor && game.status === 'playing' && i === game.cursor) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5; ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.ellipse(cx, cy, RX + 9, RY + 9, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); }
    ctx.beginPath(); ctx.ellipse(cx, cy, RX + 6, RY + 6, 0, 0, Math.PI * 2); ctx.fillStyle = '#7bbf72'; ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx, cy, RX, RY, 0, 0, Math.PI * 2); ctx.fillStyle = '#5a3a2e'; ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx, cy + 3, RX - 6, RY - 5, 0, 0, Math.PI * 2); ctx.fillStyle = '#3b241c'; ctx.fill();
    if (h && rise > 0) {
      // Clip at the burrow mouth so the critter rises out of the ground instead of floating over it.
      ctx.save(); ctx.beginPath(); ctx.rect(cx - 70, cy - 110, 140, 110); ctx.ellipse(cx, cy, RX, RY, 0, 0, Math.PI); ctx.clip();
      ctx.translate(cx, cy + 6 + (1 - rise) * 78); drawCritter(ctx, h.kind, h.booped ? .78 : 1); ctx.restore();
    }
    ctx.strokeStyle = '#4f9a50'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(cx, cy, RX + 1, RY + 1, 0, 0, Math.PI); ctx.stroke();
  }
  for (const e of game.effects) {
    const cx = COLS[e.index % 3], cy = ROWS[Math.floor(e.index / 3)], lift = reduced ? 0 : e.age * 60;
    ctx.globalAlpha = Math.max(0, 1 - e.age / .7);
    if (e.kind === 'whiff') { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy - 6, 10 + e.age * 30, 0, Math.PI * 2); ctx.stroke(); }
    else drawTxt(ctx, e.points > 0 ? `+${e.points}` : String(e.points), cx, cy - 70 - lift, e.kind === 'gold' ? 18 : 15, e.kind === 'bot' ? '#6a58c8' : e.kind === 'gold' ? '#c48a1c' : '#e0477c', 'center');
    ctx.globalAlpha = 1;
  }
  rounded(ctx, 0, 412, W, 40, 0, '#2c1a33');
  drawTxt(ctx, 'BOOP THE BUNNIES  ·  SKIP GABU’S BOTS', 180, 428, 10, '#fdf2f7', 'center');
  drawTxt(ctx, 'TAP  ·  KEYS 1–9  ·  ARROWS + SPACE', 180, 443, 9, '#bfa9c4', 'center');
  if (game.status === 'dead') overlay(ctx, 'TIME’S UP!', `${game.boops} boops · best combo ${game.bestCombo}`, 'PRESS PLAY FOR ANOTHER ROUND', '#ff8fb8');
  else if (game.status === 'paused') overlay(ctx, 'PAUSED', 'The bunnies are hiding. Politely.', 'PRESS PLAY TO RESUME', '#b8a7ff');
  else if (game.status === 'idle') overlay(ctx, 'BOOP-A-BUN', 'Boop every bunny. Golden ones are worth more.', 'PRESS PLAY OR TAP TO START', '#7fcf8a');
  ctx.restore();
}
function overlay(ctx, message, sub, hint, accent) {
  ctx.fillStyle = '#1a1220a0'; ctx.fillRect(0, 50, W, H - 50);
  rounded(ctx, 30, 176, 300, 104, 14, accent); rounded(ctx, 32, 178, 296, 100, 12, '#2a1d31');
  drawTxt(ctx, message, 180, 220, 22, '#fff0f5', 'center'); drawTxt(ctx, sub, 180, 244, 11, '#ead5e4', 'center');
  drawTxt(ctx, hint, 180, 265, 9, '#ffd98c', 'center');
}
