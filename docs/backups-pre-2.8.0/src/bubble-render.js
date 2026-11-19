/** Bubble Bloom canvas: glossy symbol bubbles, a cloud launcher, and a dotted aim guide with one bounce. */
import { BUBBLE_KINDS, BUBBLE_R, BUBBLE_COLS, BUBBLE_ROWS, BUBBLE_DEATH_ROW, BUBBLE_LEFT, BUBBLE_TOP, BUBBLE_RH, LAUNCH_X, LAUNCH_Y } from './bubble.js';

const W = 360, H = 452, RIGHT = BUBBLE_LEFT + BUBBLE_COLS * BUBBLE_R * 2;
const TINTS = Object.freeze({
  heart: ['#ffc2d8', '#ff7fae', '#c94a7d'], star: ['#fff1b8', '#ffcf5a', '#c48a1c'], fish: ['#c8f6fb', '#5fd3e3', '#2a8fa0'],
  drop: ['#e6dcff', '#b49cf2', '#6f58b8'], moon: ['#d4ddff', '#7f97ff', '#3f50b8'], flower: ['#d4f8dc', '#79d897', '#2f8a4f'],
});
const rounded = (ctx, x, y, w, h, r, fill) => { ctx.fillStyle = fill; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); };
const drawTxt = (ctx, t, x, y, size, color = '#fbf3ef', align = 'left') => {
  ctx.font = `800 ${size}px ui-sans-serif,system-ui,sans-serif`; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.fillText(String(t), x, y); ctx.textAlign = 'left';
};
function symbol(ctx, kind, s) {
  ctx.beginPath();
  if (kind === 'heart') { ctx.moveTo(0, s * .75); ctx.bezierCurveTo(-s * 1.2, -s * .05, -s * .55, -s * .95, 0, -s * .3); ctx.bezierCurveTo(s * .55, -s * .95, s * 1.2, -s * .05, 0, s * .75); }
  else if (kind === 'star') { for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? s * .42 : s; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } }
  else if (kind === 'fish') { ctx.ellipse(-s * .15, 0, s * .62, s * .4, 0, 0, Math.PI * 2); ctx.moveTo(s * .4, 0); ctx.lineTo(s * .95, -s * .45); ctx.lineTo(s * .95, s * .45); }
  else if (kind === 'drop') { ctx.moveTo(0, -s * .95); ctx.bezierCurveTo(s * .2, -s * .5, s * .7, -s * .05, s * .7, s * .3); ctx.arc(0, s * .3, s * .7, 0, Math.PI); ctx.bezierCurveTo(-s * .7, -s * .05, -s * .2, -s * .5, 0, -s * .95); }
  else if (kind === 'moon') { ctx.arc(0, 0, s * .8, Math.PI * .3, Math.PI * 1.7); ctx.arc(s * .35, -s * .05, s * .58, Math.PI * 1.55, Math.PI * .45, true); }
  else { for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5 - Math.PI / 2; ctx.moveTo(Math.cos(a) * s * .5 + s * .32, Math.sin(a) * s * .5); ctx.arc(Math.cos(a) * s * .5, Math.sin(a) * s * .5, s * .32, 0, Math.PI * 2); } }
  ctx.closePath(); ctx.fill();
  if (kind === 'flower') { ctx.beginPath(); ctx.arc(0, 0, s * .26, 0, Math.PI * 2); ctx.fillStyle = '#ffe08a'; ctx.fill(); }
  if (kind === 'fish') { ctx.beginPath(); ctx.arc(-s * .42, -s * .08, s * .09, 0, Math.PI * 2); ctx.fillStyle = TINTS.fish[2]; ctx.fill(); }
}
/** A glossy bubble. The symbol, not just the color, says what it is. */
export function drawBubble(ctx, kindIndex, x, y, r = BUBBLE_R, alpha = 1) {
  const kind = BUBBLE_KINDS[kindIndex], tint = TINTS[kind]; if (!tint) return;
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y);
  const fill = ctx.createRadialGradient(-r * .35, -r * .4, r * .1, 0, 0, r); fill.addColorStop(0, tint[0]); fill.addColorStop(.7, tint[1]); fill.addColorStop(1, tint[2]);
  ctx.beginPath(); ctx.arc(0, 0, r - .8, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill();
  ctx.strokeStyle = tint[2]; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.globalAlpha = alpha * .95; symbol(ctx, kind, r * .5);
  ctx.globalAlpha = alpha * .6; ctx.beginPath(); ctx.ellipse(-r * .42, -r * .48, r * .26, r * .14, -.6, 0, Math.PI * 2); ctx.fillStyle = '#ffffff'; ctx.fill();
  ctx.restore();
}
/** Dotted guide that follows one wall bounce, so bank shots are planned, not guessed.
 * Dots sit at fixed distances along the path and never animate: a moving or blinking guide is hard on sensitive eyes. */
function aimGuide(ctx, game) {
  let x = LAUNCH_X, y = LAUNCH_Y, vx = Math.cos(game.aim), vy = -Math.sin(game.aim), travelled = 0, bounces = 0, nextDot = 30;
  const occupied = [], reach = (BUBBLE_R * 1.7) ** 2;
  for (let r = 0; r < BUBBLE_ROWS; r++) for (let c = 0; c < BUBBLE_COLS; c++) if (game.grid[r][c] >= 0) occupied.push(game.center(r, c));
  ctx.fillStyle = '#ffffffb0';
  for (let step = 0; step < 260 && y > BUBBLE_TOP + BUBBLE_R; step++) {
    x += vx * 2; y += vy * 2; travelled += 2;
    if (x < BUBBLE_LEFT + BUBBLE_R || x > RIGHT - BUBBLE_R) { if (++bounces > 1) break; vx = -vx; }
    if (occupied.some(p => (p.x - x) ** 2 + (p.y - y) ** 2 < reach)) break;
    if (travelled >= nextDot) { nextDot += 14; ctx.beginPath(); ctx.arc(x, y, 2.2, 0, Math.PI * 2); ctx.fill(); }
  }
}
function launcher(ctx, game) {
  // A sleepy little cloud launcher; the loaded bubble rests on top of it.
  ctx.save(); ctx.translate(LAUNCH_X, LAUNCH_Y + 16);
  ctx.beginPath(); ctx.arc(-16, 2, 11, Math.PI * .5, Math.PI * 1.5); ctx.arc(-5, -8, 12, Math.PI, Math.PI * 1.9); ctx.arc(10, -6, 11, Math.PI * 1.2, Math.PI * 2);
  ctx.arc(19, 3, 9, Math.PI * 1.5, Math.PI * .5); ctx.closePath();
  ctx.fillStyle = '#f4f2ff'; ctx.fill(); ctx.strokeStyle = '#8f86c9'; ctx.lineWidth = 1.4; ctx.stroke();
  ctx.strokeStyle = '#4b3f7a'; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
  for (const x of [-7, 7]) { ctx.beginPath(); ctx.arc(x, 2, 2.4, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
  ctx.beginPath(); ctx.arc(0, 6, 2, .2, Math.PI - .2); ctx.stroke();
  ctx.fillStyle = '#ffb3cf'; ctx.globalAlpha = .7; ctx.beginPath(); ctx.ellipse(-13, 7, 3.4, 2, 0, 0, Math.PI * 2); ctx.ellipse(13, 7, 3.4, 2, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.save(); ctx.translate(LAUNCH_X, LAUNCH_Y); ctx.rotate(-game.aim + Math.PI / 2);
  rounded(ctx, -3, -30, 6, 12, 3, '#ffffffcc'); ctx.restore();
  if (!game.shot) drawBubble(ctx, game.current, LAUNCH_X, LAUNCH_Y);
}
export function drawBubbleBloom(canvas, game, { best = 0 } = {}) {
  if (!canvas?.getContext) return; const ctx = canvas.getContext('2d'); if (!ctx) return;
  ctx.save(); ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
  const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#2a1d44'); bg.addColorStop(1, '#1a1428'); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  drawBubble(ctx, 5, 26, 25, 10);
  drawTxt(ctx, 'BUBBLE BLOOM', 42, 31, 12, '#ffe6ef');
  drawTxt(ctx, `SCORE ${game.score}`, 188, 31, 11, '#fdfaf7', 'center');
  drawTxt(ctx, `BEST ${Math.max(best, game.score)}`, 342, 31, 11, '#ead4c4', 'right');
  rounded(ctx, 20, 45, 320, 1, 0, '#45365c');
  const field = ctx.createLinearGradient(0, BUBBLE_TOP, 0, 400); field.addColorStop(0, '#3a2a5a'); field.addColorStop(1, '#2b2045');
  rounded(ctx, BUBBLE_LEFT - 6, BUBBLE_TOP - 18, RIGHT - BUBBLE_LEFT + 12, H - BUBBLE_TOP + 4, 14, field);
  for (let i = 0; i < 16; i++) { ctx.fillStyle = '#ffffff0f'; ctx.beginPath(); ctx.arc(30 + (i * 67) % 300, 90 + (i * 113) % 300, 3 + i % 4, 0, Math.PI * 2); ctx.fill(); }
  drawTxt(ctx, `LEVEL ${game.level}  ·  ${String(game.pace).toUpperCase()}`, 26, BUBBLE_TOP - 5, 9, '#cfc4ea');
  const shots = game.shotsPerRow(), left = shots - game.misses, firstDot = 334 - (shots - 1) * 11;
  drawTxt(ctx, 'NEW ROW IN', firstDot - 10, BUBBLE_TOP - 5, 9, '#cfc4ea', 'right');
  for (let i = 0; i < shots; i++) { ctx.beginPath(); ctx.arc(firstDot + i * 11, BUBBLE_TOP - 8, 4, 0, Math.PI * 2); ctx.fillStyle = i < left ? '#ffb3cf' : '#ffffff22'; ctx.fill(); }
  const dangerY = BUBBLE_TOP + BUBBLE_R + (BUBBLE_DEATH_ROW - .5) * BUBBLE_RH, low = game.lowestRow();
  ctx.strokeStyle = low >= BUBBLE_DEATH_ROW - 2 ? '#ff5d8f' : '#ffb3cf66'; ctx.lineWidth = 2; ctx.setLineDash([5, 6]);
  ctx.beginPath(); ctx.moveTo(BUBBLE_LEFT, dangerY); ctx.lineTo(RIGHT, dangerY); ctx.stroke(); ctx.setLineDash([]);
  for (let r = 0; r < BUBBLE_ROWS; r++) for (let c = 0; c < BUBBLE_COLS; c++) {
    const k = game.grid[r][c]; if (k < 0) continue; const p = game.center(r, c);
    drawBubble(ctx, k, p.x, p.y);
  }
  for (const e of game.effects) {
    if (e.type === 'pop') {
      const t = e.age / .35; ctx.save(); ctx.globalAlpha = 1 - t; ctx.strokeStyle = TINTS[BUBBLE_KINDS[e.kind]][1]; ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3, d = BUBBLE_R * (.6 + t); ctx.beginPath(); ctx.moveTo(e.x + Math.cos(a) * d * .6, e.y + Math.sin(a) * d * .6); ctx.lineTo(e.x + Math.cos(a) * d, e.y + Math.sin(a) * d); ctx.stroke(); }
      ctx.restore();
    } else drawBubble(ctx, e.kind, e.x, e.y, BUBBLE_R, Math.max(0, 1 - e.age / 1.4));
  }
  if (game.status === 'playing' && !game.shot) aimGuide(ctx, game);
  if (game.shot) drawBubble(ctx, game.shot.kind, game.shot.x, game.shot.y);
  launcher(ctx, game);
  rounded(ctx, 30, 400, 66, 34, 10, '#3f2f60'); drawTxt(ctx, 'NEXT', 38, 421, 8, '#cfc4ea'); drawBubble(ctx, game.next, 79, 417, 11);
  drawTxt(ctx, 'DRAG OR ARROWS TO AIM', 326, 413, 8, '#bfb3d8', 'right'); drawTxt(ctx, 'RELEASE / SPACE · C SWAPS', 326, 427, 8, '#bfb3d8', 'right');
  if (game.status === 'dead') overlay(ctx, 'BUBBLE OVERFLOW', `Level ${game.level} · ${game.score} points`, 'PRESS PLAY TO POP AGAIN', '#ff8fb8');
  else if (game.status === 'paused') overlay(ctx, 'PAUSED', 'The bubbles are holding their breath.', 'PRESS PLAY TO RESUME', '#b8a7ff');
  else if (game.status === 'idle') overlay(ctx, 'BUBBLE BLOOM', 'Match three of a kind. Pop what holds the rest up.', 'PRESS PLAY OR TAP TO START', '#7f97ff');
  ctx.restore();
}
function overlay(ctx, message, sub, hint, accent) {
  ctx.fillStyle = '#16121fa8'; ctx.fillRect(0, 53, W, H - 53);
  rounded(ctx, 30, 176, 300, 104, 14, accent); rounded(ctx, 32, 178, 296, 100, 12, '#251d36');
  drawTxt(ctx, message, 180, 220, 22, '#fff0f5', 'center'); drawTxt(ctx, sub, 180, 244, 11, '#ddd3f2', 'center');
  drawTxt(ctx, hint, 180, 265, 9, '#ffd98c', 'center');
}
