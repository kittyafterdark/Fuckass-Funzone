/** Bubble Bloom canvas: glossy symbol bubbles in one framed field, a cloud launcher, a dotted aim guide with one bounce,
 * and the Bloom meter that charges toward a rainbow bubble. */
import { BUBBLE_KINDS, BUBBLE_R, BUBBLE_COLS, BUBBLE_ROWS, BUBBLE_DEATH_ROW, BUBBLE_LEFT, BUBBLE_TOP, BUBBLE_RH, LAUNCH_X, LAUNCH_Y, BUBBLE_RAINBOW, BLOOM_FULL } from './bubble.js';

const W = 360, H = 452, RIGHT = BUBBLE_LEFT + BUBBLE_COLS * BUBBLE_R * 2;
// The framed field: everything the game shows sits inside it, so nothing hangs off the sides.
const PANEL = Object.freeze({ x: 14, y: 50, w: 332, h: 338 });
const RAINBOW = Object.freeze(['#ff7fae', '#ffcf5a', '#79d897', '#5fd3e3', '#7f97ff', '#b49cf2']);
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
/** The rainbow bubble: six colored slices under the same gloss, with a white star in the middle. */
function drawRainbow(ctx, x, y, r, alpha) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y);
  RAINBOW.forEach((color, i) => { const a = -Math.PI / 2 + i * Math.PI / 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r - .8, a, a + Math.PI / 3); ctx.closePath(); ctx.fillStyle = color; ctx.fill(); });
  ctx.beginPath(); ctx.arc(0, 0, r - .8, 0, Math.PI * 2); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.6; ctx.stroke();
  ctx.fillStyle = '#ffffff'; symbol(ctx, 'star', r * .5);
  ctx.globalAlpha = alpha * .6; ctx.beginPath(); ctx.ellipse(-r * .42, -r * .48, r * .26, r * .14, -.6, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
/** A glossy bubble. The symbol, not just the color, says what it is. */
export function drawBubble(ctx, kindIndex, x, y, r = BUBBLE_R, alpha = 1) {
  if (kindIndex === BUBBLE_RAINBOW) { drawRainbow(ctx, x, y, r, alpha); return; }
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
  ctx.save(); ctx.translate(LAUNCH_X, LAUNCH_Y + 13); ctx.scale(.85, .85);
  // Overlapping puffs, mirrored on a flat base so the cloud sits level. The outline is drawn as a slightly larger copy
  // underneath, so it traces the outside of the puffs without seams where they meet.
  const puffs = [[-18, 2, 10], [-8, -6, 11], [8, -6, 11], [18, 2, 10], [0, 1, 12]];
  const cloud = grow => { ctx.beginPath(); for (const [x, y, r] of puffs) { ctx.moveTo(x + r + grow, y); ctx.arc(x, y, r + grow, 0, Math.PI * 2); } ctx.rect(-18 - grow, 2, 36 + grow * 2, 10 + grow); ctx.fill(); };
  ctx.save(); ctx.beginPath(); ctx.rect(-40, -30, 80, 30 + 12 + 1.4); ctx.clip();
  ctx.fillStyle = '#8f86c9'; cloud(1.4); ctx.fillStyle = '#f4f2ff'; ctx.beginPath(); ctx.rect(-40, -30, 80, 42); ctx.clip(); cloud(0); ctx.restore();
  ctx.strokeStyle = '#4b3f7a'; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
  for (const x of [-7, 7]) { ctx.beginPath(); ctx.arc(x, 2, 2.4, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
  ctx.beginPath(); ctx.arc(0, 6, 2, .2, Math.PI - .2); ctx.stroke();
  ctx.fillStyle = '#ffb3cf'; ctx.globalAlpha = .7; ctx.beginPath(); ctx.ellipse(-13, 7, 3.4, 2, 0, 0, Math.PI * 2); ctx.ellipse(13, 7, 3.4, 2, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.save(); ctx.translate(LAUNCH_X, LAUNCH_Y); ctx.rotate(-game.aim + Math.PI / 2);
  rounded(ctx, -3, -32, 6, 12, 3, '#ffffffcc'); ctx.restore();
  if (!game.shot) drawBubble(ctx, game.current, LAUNCH_X, LAUNCH_Y);
}
/** Pops burst into a ring and sparks in the bubble's color; points and callouts float up and fade. */
function effects(ctx, game, reduced) {
  for (const e of game.effects) {
    if (e.type === 'pop') {
      const t = e.age / .45, tint = TINTS[BUBBLE_KINDS[e.kind]] || TINTS.heart;
      ctx.save(); ctx.globalAlpha = 1 - t; ctx.strokeStyle = tint[1]; ctx.lineWidth = 2.4 * (1 - t) + .6;
      ctx.beginPath(); ctx.arc(e.x, e.y, BUBBLE_R * (.7 + t * .9), 0, Math.PI * 2); ctx.stroke();
      if (!reduced) for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4 + e.x * .1, d = BUBBLE_R * (.8 + t * 1.6);
        ctx.beginPath(); ctx.arc(e.x + Math.cos(a) * d, e.y + Math.sin(a) * d, 2.2 * (1 - t) + .4, 0, Math.PI * 2); ctx.fillStyle = i % 2 ? tint[0] : '#ffffff'; ctx.fill();
      }
      ctx.restore();
    } else if (e.type === 'fall') drawBubble(ctx, e.kind, e.x, e.y, BUBBLE_R, Math.max(0, 1 - e.age / 1.4));
    else if (e.type === 'points') {
      const t = e.age / .9; ctx.save(); ctx.globalAlpha = 1 - t * t;
      drawTxt(ctx, e.text, e.x, e.y - 8 - (reduced ? 0 : t * 26), 12, '#ffe08a', 'center'); ctx.restore();
    }
  }
  // Only the newest callout shows, centered over the field.
  const call = [...game.effects].reverse().find(e => e.type === 'callout');
  if (call) {
    const t = call.age / 1.3, grow = reduced ? 1 : Math.min(1, .7 + call.age * 2);
    ctx.save(); ctx.globalAlpha = Math.min(1, (1 - t) * 3); ctx.translate(180, 214); ctx.scale(grow, grow);
    rounded(ctx, -92, -20, 184, 34, 17, '#1a1230d0');
    drawTxt(ctx, call.text, 0, 3, 17, call.text.startsWith('RAINBOW') ? '#9be7ff' : '#ffe08a', 'center'); ctx.restore();
  }
}
export function drawBubbleBloom(canvas, game, { best = 0, reduced = false, time = 0 } = {}) {
  if (!canvas?.getContext) return; const ctx = canvas.getContext('2d'); if (!ctx) return;
  ctx.save(); ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
  const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#2a1d44'); bg.addColorStop(1, '#150f22'); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  // Faint bubbles drift up behind everything. They hold still with reduced motion.
  for (let i = 0; i < 14; i++) {
    const rise = reduced ? 0 : time * (6 + i % 4 * 3), y = H - ((i * 97 + rise) % (H + 40)) + 20, x = (i * 71 + 17) % W;
    ctx.beginPath(); ctx.arc(x, y, 3 + i % 4, 0, Math.PI * 2); ctx.strokeStyle = '#ffffff14'; ctx.lineWidth = 1; ctx.stroke();
  }
  drawBubble(ctx, 5, 26, 25, 10);
  drawTxt(ctx, 'BUBBLE BLOOM', 42, 31, 12, '#ffe6ef');
  drawTxt(ctx, `SCORE ${game.score}`, 196, 31, 11, '#fdfaf7', 'center');
  drawTxt(ctx, `BEST ${Math.max(best, game.score)}`, 342, 31, 11, '#ead4c4', 'right');
  rounded(ctx, 20, 45, 320, 1, 0, '#45365c');
  // The field: one framed panel with a neon rim. The rim and the cushion line warm to red as the bubbles close in.
  const low = game.lowestRow(), danger = low >= BUBBLE_DEATH_ROW - 2;
  const field = ctx.createLinearGradient(0, PANEL.y, 0, PANEL.y + PANEL.h); field.addColorStop(0, '#3a2a5c'); field.addColorStop(1, '#22193a');
  ctx.save(); ctx.shadowColor = danger ? '#ff5d8f' : '#b49cf2'; ctx.shadowBlur = reduced ? 0 : 12;
  rounded(ctx, PANEL.x, PANEL.y, PANEL.w, PANEL.h, 18, danger ? '#ff5d8f' : '#8f7bd6'); ctx.restore();
  rounded(ctx, PANEL.x + 2, PANEL.y + 2, PANEL.w - 4, PANEL.h - 4, 16, field);
  rounded(ctx, PANEL.x + 2, PANEL.y + 2, PANEL.w - 4, 22, 16, '#00000030');
  drawTxt(ctx, `LEVEL ${game.level}  ·  ${String(game.pace).toUpperCase()}`, 28, 67, 9, '#cfc4ea');
  const shots = game.shotsPerRow(), left = shots - game.misses, firstDot = 332 - (shots - 1) * 11;
  drawTxt(ctx, 'NEW ROW IN', firstDot - 10, 67, 9, '#cfc4ea', 'right');
  for (let i = 0; i < shots; i++) { ctx.beginPath(); ctx.arc(firstDot + i * 11, 64, 4, 0, Math.PI * 2); ctx.fillStyle = i < left ? '#ffb3cf' : '#ffffff22'; ctx.fill(); }
  const dangerY = BUBBLE_TOP + BUBBLE_R + (BUBBLE_DEATH_ROW - .5) * BUBBLE_RH;
  ctx.strokeStyle = danger ? '#ff5d8f' : '#ffb3cf66'; ctx.lineWidth = 2; ctx.setLineDash([5, 6]);
  ctx.beginPath(); ctx.moveTo(BUBBLE_LEFT, dangerY); ctx.lineTo(RIGHT, dangerY); ctx.stroke(); ctx.setLineDash([]);
  for (let r = 0; r < BUBBLE_ROWS; r++) for (let c = 0; c < BUBBLE_COLS; c++) {
    const k = game.grid[r][c]; if (k < 0) continue; const p = game.center(r, c);
    drawBubble(ctx, k, p.x, p.y);
  }
  if (game.status === 'playing' && !game.shot) aimGuide(ctx, game);
  if (game.shot) {
    const s = game.shot;
    // A soft streak of small dots in the bubble's color trails the shot.
    const streak = s.kind === BUBBLE_RAINBOW ? '#ffffff' : (TINTS[BUBBLE_KINDS[s.kind]] || TINTS.heart)[0];
    if (!reduced) s.trail.forEach((p, i) => { const t = (i + 1) / s.trail.length; ctx.globalAlpha = t * .45; ctx.beginPath(); ctx.arc(p.x, p.y, 2 + t * 4, 0, Math.PI * 2); ctx.fillStyle = streak; ctx.fill(); });
    ctx.globalAlpha = 1; drawBubble(ctx, s.kind, s.x, s.y);
  }
  effects(ctx, game, reduced);
  launcher(ctx, game);
  // Under the cushion line: the next bubble on the left and the Bloom meter on the right, both inside the field.
  rounded(ctx, 26, 348, 64, 30, 10, '#ffffff12'); drawTxt(ctx, 'NEXT', 34, 367, 8, '#cfc4ea'); drawBubble(ctx, game.next, 73, 363, 10);
  const ready = game.current === BUBBLE_RAINBOW || game.next === BUBBLE_RAINBOW, charge = ready ? 1 : game.bloom / BLOOM_FULL;
  drawTxt(ctx, ready ? 'RAINBOW!' : 'BLOOM', 334, 360, 8, ready ? '#9be7ff' : '#cfc4ea', 'right');
  rounded(ctx, 252, 366, 82, 8, 4, '#ffffff18');
  if (charge > 0) {
    const fill = ctx.createLinearGradient(252, 0, 334, 0); RAINBOW.forEach((color, i) => fill.addColorStop(i / (RAINBOW.length - 1), color));
    rounded(ctx, 252, 366, Math.max(8, 82 * charge), 8, 4, fill);
  }
  drawTxt(ctx, 'DRAG OR ARROWS TO AIM  ·  RELEASE OR SPACE  ·  C SWAPS', 180, 410, 8, '#bfb3d8', 'center');
  drawTxt(ctx, 'POP AND DROP TO FILL THE BLOOM METER FOR A RAINBOW', 180, 424, 8, '#a99bc2', 'center');
  if (game.status === 'dead') overlay(ctx, 'BUBBLE OVERFLOW', `Level ${game.level} · ${game.score} points`, 'PRESS PLAY TO POP AGAIN', '#ff8fb8');
  else if (game.status === 'paused') overlay(ctx, 'PAUSED', 'The bubbles are holding their breath.', 'PRESS PLAY TO RESUME', '#b8a7ff');
  else if (game.status === 'idle') overlay(ctx, 'BUBBLE BLOOM', 'Match three. Fill the Bloom meter for a rainbow.', 'PRESS PLAY OR TAP TO START', '#7f97ff');
  ctx.restore();
}
function overlay(ctx, message, sub, hint, accent) {
  ctx.fillStyle = '#16121fa8'; ctx.fillRect(0, 53, W, H - 53);
  rounded(ctx, 30, 176, 300, 104, 14, accent); rounded(ctx, 32, 178, 296, 100, 12, '#251d36');
  drawTxt(ctx, message, 180, 220, 22, '#fff0f5', 'center'); drawTxt(ctx, sub, 180, 244, 11, '#ddd3f2', 'center');
  drawTxt(ctx, hint, 180, 265, 9, '#ffd98c', 'center');
}
