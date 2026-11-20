/** Gacha Match canvas: a toy-shop tray of gacha capsules that pop open to show one of ten hand-drawn charms. */
import { CHARMS } from './memory.js';

const W = 360, H = 452, TOP = 78, BOTTOM = 404;
const rounded = (ctx, x, y, w, h, r, fill) => { ctx.fillStyle = fill; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); };
const drawTxt = (ctx, t, x, y, size, color = '#fbf3ef', align = 'left') => {
  ctx.font = `800 ${size}px ui-sans-serif,system-ui,sans-serif`; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.fillText(String(t), x, y); ctx.textAlign = 'left';
};
export function memoryLayout(cols, rows) {
  const gap = 8, cw = Math.min(68, (W - 40 - gap * (cols - 1)) / cols), ch = Math.min(cw * 1.3, (BOTTOM - TOP - gap * (rows - 1)) / rows);
  const x0 = (W - (cw * cols + gap * (cols - 1))) / 2, y0 = TOP + (BOTTOM - TOP - (ch * rows + gap * (rows - 1))) / 2;
  return { gap, cw, ch, x0, y0 };
}
export function capsuleAt(x, y, cols, rows) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return -1;
  const { gap, cw, ch, x0, y0 } = memoryLayout(cols, rows), col = Math.floor((x - x0) / (cw + gap)), row = Math.floor((y - y0) / (ch + gap));
  if (col < 0 || col >= cols || row < 0 || row >= rows || x - x0 - col * (cw + gap) > cw || y - y0 - row * (ch + gap) > ch) return -1;
  return row * cols + col;
}
function face(ctx, s, ink = '#3a2638') {
  ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(-s * .22, 0, s * .07, 0, Math.PI * 2); ctx.arc(s * .22, 0, s * .07, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = ink; ctx.lineWidth = s * .05; ctx.beginPath(); ctx.arc(0, s * .1, s * .1, .2, Math.PI - .2); ctx.stroke();
}
/** Each charm is distinct by shape as well as color. `s` is the charm radius. */
export function drawCharm(ctx, kind, s) {
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const fillStroke = (fill, ink) => { ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = ink; ctx.lineWidth = s * .07; ctx.stroke(); };
  if (kind === 'star') { ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? s * .45 : s; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); fillStroke('#ffd36e', '#b07a1a'); ctx.translate(0, s * .1); face(ctx, s * .8); }
  else if (kind === 'moon') { ctx.beginPath(); ctx.arc(0, 0, s * .85, Math.PI * .35, Math.PI * 1.65); ctx.arc(s * .4, -s * .05, s * .62, Math.PI * 1.5, Math.PI * .5, true); ctx.closePath(); fillStroke('#c9c0ff', '#5a4fb0'); ctx.translate(-s * .53, 0); face(ctx, s * .42); }
  else if (kind === 'rainbow') { for (const [r, c] of [[1, '#ff7fae'], [.8, '#ffcf5a'], [.6, '#7fcf8a'], [.42, '#7fb2ff']]) { ctx.beginPath(); ctx.arc(0, s * .35, s * r, Math.PI, 0); ctx.lineTo(s * r - s * .17, s * .35); ctx.arc(0, s * .35, s * r - s * .17, 0, Math.PI, true); ctx.closePath(); ctx.fillStyle = c; ctx.fill(); }
    for (const x of [-.72, .72]) { ctx.beginPath(); ctx.arc(x * s, s * .42, s * .24, 0, Math.PI * 2); ctx.arc(x * s + s * .2, s * .38, s * .2, 0, Math.PI * 2); ctx.fillStyle = '#ffffff'; ctx.fill(); } }
  else if (kind === 'cloud') { ctx.beginPath(); ctx.arc(-s * .45, s * .1, s * .38, Math.PI * .5, Math.PI * 1.5); ctx.arc(0, -s * .2, s * .48, Math.PI, 0); ctx.arc(s * .48, s * .1, s * .38, Math.PI * 1.5, Math.PI * .5); ctx.closePath(); fillStroke('#f4f7ff', '#7f8cc4'); ctx.translate(0, s * .1); face(ctx, s * .8); }
  else if (kind === 'mushroom') { ctx.beginPath(); ctx.roundRect(-s * .28, -s * .05, s * .56, s * .75, s * .2); fillStroke('#fff1dc', '#b08a6a'); ctx.beginPath(); ctx.arc(0, 0, s * .85, Math.PI, 0); ctx.closePath(); fillStroke('#ff6f8f', '#a8324f');
    ctx.fillStyle = '#ffffff'; for (const [x, y, r] of [[-.45, -.35, .14], [.1, -.6, .12], [.5, -.25, .13]]) { ctx.beginPath(); ctx.arc(x * s, y * s, r * s, 0, Math.PI * 2); ctx.fill(); } ctx.translate(0, s * .32); face(ctx, s * .55); }
  else if (kind === 'flower') { ctx.fillStyle = '#ffb3cf'; for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5 - Math.PI / 2; ctx.beginPath(); ctx.arc(Math.cos(a) * s * .5, Math.sin(a) * s * .5, s * .38, 0, Math.PI * 2); ctx.fill(); } ctx.beginPath(); ctx.arc(0, 0, s * .36, 0, Math.PI * 2); fillStroke('#ffd36e', '#b07a1a'); face(ctx, s * .55); }
  else if (kind === 'planet') { ctx.beginPath(); ctx.arc(0, 0, s * .6, 0, Math.PI * 2); fillStroke('#9fe6d6', '#2f7d6d'); ctx.strokeStyle = '#ffb3cf'; ctx.lineWidth = s * .14; ctx.beginPath(); ctx.ellipse(0, 0, s * .98, s * .3, -.35, Math.PI * .1, Math.PI * .9); ctx.stroke(); face(ctx, s * .6); }
  else if (kind === 'ghost') { ctx.beginPath(); ctx.arc(0, -s * .15, s * .62, Math.PI, 0); ctx.lineTo(s * .62, s * .7); for (let i = 0; i < 3; i++) ctx.quadraticCurveTo(s * (.42 - i * .42), s * .45, s * (.2 - i * .42), s * .7); ctx.lineTo(-s * .62, s * .7); ctx.closePath(); fillStroke('#ffffff', '#8a7fb0');
    ctx.translate(0, -s * .1); face(ctx, s * .7); ctx.fillStyle = '#ffb3cf'; ctx.globalAlpha = .7; ctx.beginPath(); ctx.ellipse(-s * .32, s * .12, s * .1, s * .06, 0, 0, Math.PI * 2); ctx.ellipse(s * .32, s * .12, s * .1, s * .06, 0, 0, Math.PI * 2); ctx.fill(); }
  else if (kind === 'cherry') { ctx.strokeStyle = '#4f9a50'; ctx.lineWidth = s * .08; ctx.beginPath(); ctx.moveTo(-s * .35, s * .2); ctx.quadraticCurveTo(-s * .1, -s * .6, s * .15, -s * .75); ctx.moveTo(s * .4, s * .25); ctx.quadraticCurveTo(s * .3, -s * .4, s * .15, -s * .75); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(s * .32, -s * .78, s * .26, s * .12, -.4, 0, Math.PI * 2); ctx.fillStyle = '#7fcf8a'; ctx.fill(); for (const x of [-.38, .42]) { ctx.beginPath(); ctx.arc(x * s, s * .42, s * .34, 0, Math.PI * 2); fillStroke('#ff4f7b', '#8f2148'); } }
  else { ctx.fillStyle = '#ffb347'; for (let i = 0; i < 8; i++) { ctx.save(); ctx.rotate(i * Math.PI / 4); ctx.beginPath(); ctx.moveTo(-s * .16, -s * .62); ctx.lineTo(0, -s * .98); ctx.lineTo(s * .16, -s * .62); ctx.closePath(); ctx.fill(); ctx.restore(); }
    ctx.beginPath(); ctx.arc(0, 0, s * .58, 0, Math.PI * 2); fillStroke('#ffd36e', '#c47a1c'); face(ctx, s * .7); }
  ctx.restore();
}
const SIZE_NAMES = Object.freeze({ cozy: 'COZY · 6 PAIRS', classic: 'CLASSIC · 8 PAIRS', busy: 'BUSY · 10 PAIRS' });
// Lid colors follow a capsule's place in the tray, never its charm, so a closed capsule gives nothing away.
const LIDS = ['#ff9fc0', '#9fd8ff', '#c9b6ff', '#9fe6b8', '#ffd36e'];
/** One gacha capsule. `open` runs 0..1: the lid lifts and tips back on its hinge to show the charm inside. */
function drawCapsule(ctx, cx, cy, r, lid, open, charm, matched) {
  ctx.save(); ctx.translate(cx, cy);
  ctx.beginPath(); ctx.ellipse(0, r * .92, r * .8, r * .16, 0, 0, Math.PI * 2); ctx.fillStyle = '#00000022'; ctx.fill();
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI); ctx.closePath(); ctx.fillStyle = matched ? '#effff1' : '#fff6ec'; ctx.fill();
  ctx.strokeStyle = matched ? '#7fcf8a' : '#c9a98f'; ctx.lineWidth = 1.6; ctx.stroke();
  if (open > 0) {
    ctx.save(); ctx.globalAlpha = Math.min(1, open * 1.6); ctx.translate(0, -r * .1 * open); drawCharm(ctx, charm, r * .55 * (.6 + .4 * open)); ctx.restore();
  }
  // The lid hinges at its left edge, lifting and tipping back as the capsule opens. The tilt keeps it inside its own cell.
  ctx.save(); ctx.translate(-r, 0); ctx.rotate(-open * .55); ctx.translate(r, -open * r * .15);
  ctx.beginPath(); ctx.arc(0, 0, r, Math.PI, 0); ctx.closePath();
  ctx.globalAlpha = open > 0 ? .9 : 1; ctx.fillStyle = lid; ctx.fill();
  ctx.globalAlpha = 1; ctx.strokeStyle = '#00000033'; ctx.lineWidth = 1.6; ctx.stroke();
  ctx.globalAlpha = .55; ctx.beginPath(); ctx.ellipse(-r * .38, -r * .52, r * .26, r * .12, -.6, 0, Math.PI * 2); ctx.fillStyle = '#ffffff'; ctx.fill();
  ctx.restore();
  ctx.strokeStyle = '#ffffffaa'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-r + 2, 0); ctx.lineTo(r - 2, 0); ctx.stroke();
  if (matched) for (const [x, y] of [[-r * .9, -r * .7], [r * .95, -r * .2]]) { ctx.strokeStyle = '#ffe08a'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.lineTo(x + 4, y); ctx.moveTo(x, y - 4); ctx.lineTo(x, y + 4); ctx.stroke(); }
  ctx.restore();
}
// `cursor` is false until the player uses the keyboard, so taps never leave a stray highlight.
export function drawGachaMatch(canvas, game, { best = 0, reduced = false, cursor = true } = {}) {
  if (!canvas?.getContext) return; const ctx = canvas.getContext('2d'); if (!ctx) return;
  ctx.save(); ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
  const shop = ctx.createLinearGradient(0, 0, 0, H); shop.addColorStop(0, '#c9f0ec'); shop.addColorStop(1, '#a9dcf2'); ctx.fillStyle = shop; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#ffffff40'; for (let i = 0; i < 18; i++) { ctx.beginPath(); ctx.arc((i * 71 + 15) % W, 70 + (i * 97 + 11) % 330, 2 + i % 3, 0, Math.PI * 2); ctx.fill(); }
  rounded(ctx, 0, 0, W, 48, 0, '#2c1a33');
  drawCapsule(ctx, 26, 25, 10, LIDS[0], 0, 0, false);
  drawTxt(ctx, 'GACHA MATCH', 42, 31, 12, '#ffe6ef');
  drawTxt(ctx, `SCORE ${game.score}`, 214, 31, 11, '#fdfaf7', 'center');
  drawTxt(ctx, `BEST ${Math.max(best, game.score)}`, 342, 31, 11, '#ead4c4', 'right');
  const time = Math.floor(game.elapsed);
  drawTxt(ctx, `PAIRS ${game.matches}/${game.cards.length / 2}  ·  MISSES ${game.misses}  ·  ${Math.floor(time / 60)}:${String(time % 60).padStart(2, '0')}`, 20, 66, 10, '#2f5b66');
  drawTxt(ctx, game.streak >= 2 ? `STREAK ×${game.streak}` : SIZE_NAMES[game.size], 340, 66, 10, game.streak >= 2 ? '#c93a6c' : '#2f5b66', 'right');
  const { gap, cw, ch, x0, y0 } = memoryLayout(game.cols, game.rows), r = Math.min(cw, ch) * .4;
  game.cards.forEach((card, i) => {
    const x = x0 + (i % game.cols) * (cw + gap), y = y0 + Math.floor(i / game.cols) * (ch + gap), open = reduced ? (card.up || card.matched || game.preview > 0 ? 1 : 0) : card.turn;
    // Found pairs fade back so the capsules still in play stand out; the ones you just opened glow.
    if (card.matched) ctx.globalAlpha = .38;
    rounded(ctx, x, y, cw, ch, 14, card.up && !card.matched ? '#ffffffcc' : '#ffffff55');
    if (card.up && !card.matched) { ctx.strokeStyle = '#ff7fae'; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(x, y, cw, ch, 14); ctx.stroke(); }
    drawCapsule(ctx, x + cw / 2, y + ch / 2 + r * .15, r, LIDS[i % LIDS.length], open, CHARMS[card.kind], card.matched);
    ctx.globalAlpha = 1;
    if (cursor && game.status === 'playing' && i === game.cursor) { ctx.strokeStyle = '#2f5b66'; ctx.lineWidth = 2.5; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.roundRect(x - 2, y - 2, cw + 4, ch + 4, 15); ctx.stroke(); ctx.setLineDash([]); }
  });
  rounded(ctx, 0, 412, W, 40, 0, '#2c1a33');
  const memorizing = game.status === 'playing' && game.preview > 0;
  drawTxt(ctx, game.status === 'dead' ? 'ALL PAIRS FOUND!' : memorizing ? `MEMORIZE THE CHARMS · ${Math.ceil(game.preview)}` : game.faceUp().length === 2 ? 'NOT A MATCH. REMEMBER THEM!' : game.faceUp().length === 1 ? 'NOW FIND ITS MATCH' : 'OPEN TWO CAPSULES TO FIND A PAIR', 180, 430, 11, game.status === 'dead' || memorizing ? '#ffe08a' : '#fdf2f7', 'center');
  drawTxt(ctx, memorizing ? 'TAP TO START EARLY' : 'TAP  ·  ARROWS + SPACE', 180, 445, 8, '#bfa9c4', 'center');
  if (game.status === 'dead') overlay(ctx, 'ALL MATCHED!', `${game.moves} turns · ${game.misses} misses · best streak ${game.bestStreak}`, 'PRESS PLAY FOR A NEW TRAY', '#7fcf8a');
  else if (game.status === 'paused') overlay(ctx, 'PAUSED', 'No peeking. Gabu is watching.', 'PRESS PLAY TO RESUME', '#b8a7ff');
  else if (game.status === 'idle') overlay(ctx, 'GACHA MATCH', 'Pop open two capsules. Find every matching charm.', 'PRESS PLAY OR TAP TO START', '#9fd8ff');
  ctx.restore();
}
function overlay(ctx, message, sub, hint, accent) {
  ctx.fillStyle = '#1a1220a0'; ctx.fillRect(0, 48, W, H - 48);
  rounded(ctx, 30, 176, 300, 104, 14, accent); rounded(ctx, 32, 178, 296, 100, 12, '#2a1d31');
  drawTxt(ctx, message, 180, 220, 22, '#fff0f5', 'center'); drawTxt(ctx, sub, 180, 244, 11, '#ead5e4', 'center');
  drawTxt(ctx, hint, 180, 265, 9, '#ffd98c', 'center');
}
