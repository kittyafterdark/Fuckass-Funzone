/** Sugar Snap canvas: a disc of honeycomb toffee on a dark plate under a warm lamp, with Gabu's shape pressed into it. */
import { SUGAR_CX, SUGAR_CY, SUGAR_R } from './sugar.js';

const W = 360, H = 452;
const rounded = (ctx, x, y, w, h, r, fill) => { ctx.fillStyle = fill; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); };
const drawTxt = (ctx, t, x, y, size, color = '#fbf3ef', align = 'left') => {
  ctx.font = `800 ${size}px ui-sans-serif,system-ui,sans-serif`; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.fillText(String(t), x, y); ctx.textAlign = 'left';
};
const NAMES = Object.freeze({ heart: 'HEART', fish: 'FISH', mushroom: 'MUSHROOM', star: 'STAR', cat: 'CAT', moon: 'MOON', bot: 'GABU BOT', bolt: 'BOLT' });
const PACE_NAMES = Object.freeze({ chill: 'CHILL', normal: 'NORMAL', hard: 'HARD' });
// Fixed air bubbles, so the honeycomb texture never shimmers between frames.
const BUBBLES = Object.freeze(Array.from({ length: 84 }, (_, i) => {
  const a = i * 2.39996, d = Math.sqrt((i + .5) / 84) * (SUGAR_R - 9);
  return Object.freeze({ x: SUGAR_CX + Math.cos(a) * d, y: SUGAR_CY + Math.sin(a) * d, r: 1.4 + (i * 37 % 7) * .45 });
}));

/** A small toffee disc, used as the title icon and the candy counter. */
function toffee(ctx, x, y, r, alpha = 1) {
  ctx.save(); ctx.globalAlpha = alpha;
  const g = ctx.createRadialGradient(x - r * .3, y - r * .3, 1, x, y, r); g.addColorStop(0, '#ffd27a'); g.addColorStop(1, '#c97a22');
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = '#7a4513'; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.fillStyle = '#9a5a1688'; for (const [dx, dy] of [[-.3, .1], [.25, -.2], [.1, .35]]) { ctx.beginPath(); ctx.arc(x + dx * r, y + dy * r, r * .14, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
}
function tracePath(ctx, points, close = true) {
  ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); if (close) ctx.closePath();
}
/** A crack wanders off from where the toffee gave, with one short branch. Its shape is fixed by its angle. */
function crack(ctx, c) {
  const pts = [[c.x, c.y]]; let x = c.x, y = c.y, a = c.a;
  for (let i = 1; i <= 6; i++) { a += Math.sin(c.a * 7 + i * 2.1) * .7; x += Math.cos(a) * c.len / 6; y += Math.sin(a) * c.len / 6; pts.push([x, y]); }
  ctx.save(); ctx.beginPath(); ctx.arc(SUGAR_CX, SUGAR_CY, SUGAR_R - 1, 0, Math.PI * 2); ctx.clip();
  ctx.strokeStyle = '#3b1f08'; ctx.lineWidth = 1.8; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.beginPath(); pts.forEach(([px, py], i) => i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)); ctx.stroke();
  const [bx, by] = pts[3], b = c.a + 1.1; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(b) * c.len * .3, by + Math.sin(b) * c.len * .3); ctx.lineTo(bx + Math.cos(b + .5) * c.len * .45, by + Math.sin(b + .5) * c.len * .45); ctx.stroke();
  ctx.strokeStyle = '#ffe1a055'; ctx.lineWidth = .8; ctx.beginPath(); pts.forEach(([px, py], i) => i ? ctx.lineTo(px + .9, py + .9) : ctx.moveTo(px + .9, py + .9)); ctx.stroke();
  ctx.restore();
}
/** The carving needle: a steel pin with a pink bead. Its tip glows mint on the line and red off it. */
function needle(ctx, n, reduced, time) {
  ctx.save(); ctx.lineCap = 'round';
  const glow = n.on ? '#7dffcf' : '#ff5d8f', pulse = reduced ? 1 : .8 + Math.sin(time * 10) * .2;
  ctx.globalAlpha = .45 * pulse; ctx.beginPath(); ctx.arc(n.x, n.y, 6, 0, Math.PI * 2); ctx.fillStyle = glow; ctx.fill(); ctx.globalAlpha = 1;
  ctx.strokeStyle = '#5c6478'; ctx.lineWidth = 3.2; ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(n.x + 15, n.y - 28); ctx.stroke();
  ctx.strokeStyle = '#e3e8f2'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(n.x + 15, n.y - 28); ctx.stroke();
  ctx.beginPath(); ctx.arc(n.x + 16, n.y - 30, 4.4, 0, Math.PI * 2); ctx.fillStyle = '#ff78b5'; ctx.fill(); ctx.strokeStyle = '#8f2a5c'; ctx.lineWidth = 1; ctx.stroke();
  ctx.beginPath(); ctx.arc(n.x + 14.6, n.y - 31.4, 1.3, 0, Math.PI * 2); ctx.fillStyle = '#ffd6ea'; ctx.fill();
  ctx.restore();
}
function meter(ctx, x, y, w, label, value, color) {
  drawTxt(ctx, label, x, y + 7, 8, '#cfc4ea'); const bx = x + 42, bw = w - 42;
  rounded(ctx, bx, y, bw, 8, 4, '#ffffff1a'); if (value > 0) rounded(ctx, bx, y, Math.max(8, bw * Math.min(1, value)), 8, 4, color);
}
function overlay(ctx, message, sub, hint, accent) {
  ctx.fillStyle = '#140f1ea8'; ctx.fillRect(0, 53, W, H - 53);
  rounded(ctx, 30, 176, 300, 104, 14, accent); rounded(ctx, 32, 178, 296, 100, 12, '#251c33');
  drawTxt(ctx, message, 180, 220, 22, '#fff0f5', 'center'); drawTxt(ctx, sub, 180, 244, 11, '#ead5e4', 'center');
  drawTxt(ctx, hint, 180, 265, 9, '#ffd98c', 'center');
}
export function drawSugarSnap(canvas, game, { best = 0, reduced = false, time = 0 } = {}) {
  if (!canvas?.getContext) return; const ctx = canvas.getContext('2d'); if (!ctx) return;
  ctx.save(); ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
  // A dark cabinet with a warm lamp pooled over the plate.
  const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#271a35'); bg.addColorStop(1, '#130f1d'); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 14; i++) { ctx.fillStyle = i % 3 ? '#ffc8e014' : '#fff3c722'; ctx.fillRect((i * 71 + 13) % W, (i * 109 + 23) % H, 2, 2); }
  const lamp = ctx.createRadialGradient(SUGAR_CX, SUGAR_CY - 20, 20, SUGAR_CX, SUGAR_CY, 190); lamp.addColorStop(0, '#ffb45a2e'); lamp.addColorStop(1, '#ffb45a00');
  ctx.fillStyle = lamp; ctx.fillRect(0, 50, W, H - 50);
  toffee(ctx, 26, 25, 9);
  drawTxt(ctx, 'SUGAR SNAP', 42, 31, 12, '#ffe6ef');
  drawTxt(ctx, `SCORE ${game.score}`, 196, 31, 11, '#fdfaf7', 'center');
  drawTxt(ctx, `BEST ${Math.max(best, game.score)}`, 342, 31, 11, '#ead4c4', 'right');
  rounded(ctx, 20, 45, 320, 1, 0, '#4a3546');
  for (let i = 0; i < 3; i++) toffee(ctx, 28 + i * 18, 62, 6.5, i < game.lives ? 1 : .22);
  const percent = Math.floor(game.progress * 100);
  drawTxt(ctx, `${NAMES[game.shape] || 'SHAPE'}  ·  ${percent}%${game.lap ? `  ·  LAP ${game.lap + 1}` : ''}`, 180, 66, 10, '#f4e8ff', 'center');
  drawTxt(ctx, PACE_NAMES[game.pace] || 'NORMAL', 340, 66, 9, '#cfc4ea', 'right');
  // The clock and the strain gauge sit above the plate, where Gabu's line never reaches.
  const left = game.limit ? game.time / game.limit : 0, hot = game.stress >= .7;
  meter(ctx, 20, 76, 150, `${Math.ceil(game.time)}s`, left, left < .25 ? '#ff5d8f' : '#ffd36e');
  meter(ctx, 190, 76, 150, 'STRAIN', game.stress, hot ? '#ff5d8f' : game.stress >= .4 ? '#ffb15c' : '#7dffcf');
  // The plate: dark glaze with a thin neon rim.
  ctx.beginPath(); ctx.arc(SUGAR_CX, SUGAR_CY, SUGAR_R + 16, 0, Math.PI * 2); ctx.fillStyle = '#2b2140'; ctx.fill();
  ctx.strokeStyle = '#ff78b566'; ctx.lineWidth = 2; ctx.stroke();
  ctx.beginPath(); ctx.arc(SUGAR_CX, SUGAR_CY + 5, SUGAR_R + 2, 0, Math.PI * 2); ctx.fillStyle = '#0d0a1499'; ctx.fill();
  // The toffee, a touch darker at the rim like real honeycomb candy, with its air bubbles.
  const shake = !reduced && game.carving && hot ? Math.sin(time * 60) * .8 : 0;
  ctx.save(); ctx.translate(shake, 0);
  const body = ctx.createRadialGradient(SUGAR_CX - 30, SUGAR_CY - 36, 10, SUGAR_CX, SUGAR_CY, SUGAR_R);
  body.addColorStop(0, '#f6c768'); body.addColorStop(.7, '#e09a3c'); body.addColorStop(1, '#b56a1d');
  ctx.beginPath(); ctx.arc(SUGAR_CX, SUGAR_CY, SUGAR_R, 0, Math.PI * 2); ctx.fillStyle = body; ctx.fill();
  ctx.strokeStyle = '#8a4f16'; ctx.lineWidth = 2.5; ctx.stroke();
  for (const b of BUBBLES) {
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fillStyle = '#9a5a1650'; ctx.fill();
    ctx.beginPath(); ctx.arc(b.x - b.r * .35, b.y - b.r * .35, b.r * .35, 0, Math.PI * 2); ctx.fillStyle = '#fff1c740'; ctx.fill();
  }
  const path = game.path, freed = game.phase === 'over' && game.result === 'free';
  if (freed) {
    // The carved shape pops loose and lifts a little off the disc.
    ctx.save(); ctx.translate(0, -4); ctx.shadowColor = '#ffcf5a'; ctx.shadowBlur = reduced ? 6 : 14;
    tracePath(ctx, path); ctx.fillStyle = '#f9cf75'; ctx.fill(); ctx.restore();
    ctx.save(); ctx.translate(0, -4); tracePath(ctx, path); ctx.strokeStyle = '#7a4513'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
  } else {
    // Gabu's stamp: a pressed line with a soft highlight below it.
    tracePath(ctx, path); ctx.strokeStyle = '#ffe1a066'; ctx.lineWidth = 1.2; ctx.save(); ctx.translate(.9, 1.1); ctx.stroke(); ctx.restore();
    tracePath(ctx, path); ctx.strokeStyle = '#8a4f16'; ctx.lineWidth = 2.2; ctx.stroke();
    // Carved runs are deep grooves.
    ctx.strokeStyle = '#3b1f08'; ctx.lineWidth = 3.6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const n = path.length;
    ctx.beginPath();
    for (let i = 0; i < n; i++) if (game.cut[i] && game.cut[(i + 1) % n]) { const a = path[i], b = path[(i + 1) % n]; ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); }
    ctx.stroke();
  }
  ctx.fillStyle = '#6b3a10aa'; for (const s of game.scratches) { ctx.beginPath(); ctx.arc(s.x, s.y, 1.1, 0, Math.PI * 2); ctx.fill(); }
  for (const c of game.cracks) crack(ctx, c);
  ctx.restore();
  if (game.needle && game.carving) needle(ctx, game.needle, reduced, time);
  // Round results sit over the top of the plate, so the freed shape or the snap stays in view.
  if (game.status === 'playing' && game.phase === 'over') {
    const [title, sub, accent] = game.result === 'free' ? ['POPPED IT!', `+${game.earned} points`, '#ffd36e'] :
      game.result === 'snap' ? ['SNAP!', 'It cracked right through the shape.', '#ff8fb8'] : ['TIME!', 'The toffee set before you finished.', '#b8a7ff'];
    rounded(ctx, 50, 94, 260, 60, 12, accent); rounded(ctx, 52, 96, 256, 56, 10, '#251c33');
    drawTxt(ctx, title, 180, 115, 16, '#fff0f5', 'center'); drawTxt(ctx, sub, 180, 131, 10, '#ead5e4', 'center');
    drawTxt(ctx, 'TAP FOR THE NEXT SHAPE', 180, 145, 8, '#ffd98c', 'center');
  }
  drawTxt(ctx, hot && game.carving ? 'IT’S STRAINING. EASE OFF A SECOND' : 'DRAG ALONG THE LINE  ·  HOLD SPACE TO CARVE', 180, 413, 9, hot && game.carving ? '#ff8fb8' : '#bfb3d8', 'center');
  drawTxt(ctx, 'TOO FAST OR OFF THE LINE AND IT CRACKS', 180, 427, 8, '#a99bc2', 'center');
  if (game.status === 'dead') overlay(ctx, 'OUT OF CANDY', `${game.freed} ${game.freed === 1 ? 'shape' : 'shapes'} carved · ${game.score} points`, 'PRESS PLAY FOR A FRESH BATCH', '#ff8fb8');
  else if (game.status === 'paused') overlay(ctx, 'PAUSED', 'The toffee is cooling. Gabu is not touching it.', 'PRESS PLAY TO RESUME', '#b8a7ff');
  else if (game.status === 'idle') overlay(ctx, 'SUGAR SNAP', 'Carve Gabu’s shape out before the toffee snaps.', 'PRESS PLAY OR TAP TO START', '#ffd36e');
  ctx.restore();
}
