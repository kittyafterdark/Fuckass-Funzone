/** Sprinkle Scurry canvas: a candy-shop maze of pink shelves, a hamster, sprinkles, sugar cubes, and Gabu's vacuum bots. */
import { SCURRY_MAZE, SCURRY_COLS, SCURRY_ROWS, SCURRY_DIRS } from './scurry.js';

const W = 360, H = 452, CELL = 20, X0 = (W - SCURRY_COLS * CELL) / 2, Y0 = 72;
const rounded = (ctx, x, y, w, h, r, fill) => { ctx.fillStyle = fill; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); };
const drawTxt = (ctx, t, x, y, size, color = '#fbf3ef', align = 'left') => {
  ctx.font = `800 ${size}px ui-sans-serif,system-ui,sans-serif`; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.fillText(String(t), x, y); ctx.textAlign = 'left';
};
const drawSprite = (ctx, img, x, y, w, h) => { if (!img?.complete || !img.naturalWidth) return false; ctx.drawImage(img, x, y, w, h); return true; };
const SPRINKLES = ['#ff7fae', '#ffcf5a', '#7fd8b0', '#7fb2ff', '#c39bff'];
// Each bot wears its own pastel shell; the screen, the pale left eye and the cyan right eye are Gabu's.
const SHELLS = ['#b8a7ff', '#9fe6d6', '#ffc0a3', '#9fd8ff'];
const wall = (c, r) => (SCURRY_MAZE[r]?.[c] ?? '#') === '#';
export const scurryLayout = () => ({ x0: X0, y0: Y0, cell: CELL });
const px = x => X0 + (x + .5) * CELL, py = y => Y0 + (y + .5) * CELL;

/** The hamster, drawn at the origin about one cell wide, looking left or right. */
export function drawHamster(ctx, facing = 1, step = 0) {
  ctx.save(); ctx.scale(facing, 1); ctx.lineWidth = 1.2; ctx.strokeStyle = '#a86b45';
  for (const [x, phase] of [[-4, 0], [4, Math.PI]]) { ctx.beginPath(); ctx.ellipse(x, 7.5 + Math.sin(step + phase) * .8, 2.2, 1.6, 0, 0, Math.PI * 2); ctx.fillStyle = '#ffd6c2'; ctx.fill(); }
  for (const x of [-5.5, 4.5]) { ctx.beginPath(); ctx.arc(x, -6.5, 3, 0, Math.PI * 2); ctx.fillStyle = '#f2a86b'; ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(x, -6.5, 1.5, 0, Math.PI * 2); ctx.fillStyle = '#ffb8c8'; ctx.fill(); }
  ctx.beginPath(); ctx.ellipse(0, 1, 9, 7.5, 0, 0, Math.PI * 2); ctx.fillStyle = '#f6b97f'; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(1.5, 3, 5.5, 4.2, 0, 0, Math.PI * 2); ctx.fillStyle = '#fff3e6'; ctx.fill();
  ctx.fillStyle = '#3b2632'; ctx.beginPath(); ctx.arc(2.5, -1.5, 1.3, 0, Math.PI * 2); ctx.arc(6.5, -1.5, 1.3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ff9fbd'; ctx.globalAlpha = .7; ctx.beginPath(); ctx.ellipse(.5, 1.5, 1.8, 1.1, 0, 0, Math.PI * 2); ctx.ellipse(8.2, 1.5, 1.5, 1, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
  ctx.fillStyle = '#e0607e'; ctx.beginPath(); ctx.arc(4.6, 1, .9, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
/** One of Gabu's vacuum bots at the origin. A dizzy bot goes pale and its eyes turn to swirls. */
export function drawVacuumBot(ctx, shell, dir = 'left', dizzy = 0) {
  const [dx, dy] = SCURRY_DIRS[dir] || [0, 0];
  ctx.save(); ctx.lineWidth = 1.2; ctx.lineJoin = 'round'; ctx.strokeStyle = '#4b3f7a';
  ctx.beginPath(); ctx.moveTo(0, -7.5); ctx.lineTo(0, -11); ctx.stroke(); ctx.beginPath(); ctx.arc(0, -12, 1.8, 0, Math.PI * 2); ctx.fillStyle = '#ff8fb8'; ctx.fill(); ctx.stroke();
  rounded(ctx, -8.5, -7.5, 17, 15, 6, dizzy ? '#e4e8f4' : shell); ctx.beginPath(); ctx.roundRect(-8.5, -7.5, 17, 15, 6); ctx.stroke();
  if (dizzy) { ctx.globalAlpha = 1 - dizzy; rounded(ctx, -8.5, -7.5, 17, 15, 6, shell); ctx.globalAlpha = 1; }
  rounded(ctx, -6, -4.5, 12, 7, 3, '#2a2147');
  if (dizzy > .35) {
    ctx.strokeStyle = '#ffe9f7'; ctx.lineWidth = .9;
    for (const x of [-3, 3]) { ctx.beginPath(); ctx.arc(x, -1, 1.6, 0, Math.PI * 1.6); ctx.stroke(); }
  } else {
    ctx.fillStyle = '#ffe9f7'; ctx.beginPath(); ctx.arc(-2.6 + dx * 1.2, -1 + dy * .9, 1.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6ff3ff'; ctx.beginPath(); ctx.arc(2.6 + dx * 1.2, -1 + dy * .9, 1.7, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = '#4b3f7a'; for (const x of [-5, 5]) { ctx.beginPath(); ctx.arc(x, 7.5, 1.8, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
}
function drawShelves(ctx) {
  ctx.fillStyle = '#fff6ee'; ctx.fillRect(X0, Y0, SCURRY_COLS * CELL, SCURRY_ROWS * CELL);
  ctx.fillStyle = '#ffeef4';
  for (let r = 0; r < SCURRY_ROWS; r++) for (let c = (r % 2); c < SCURRY_COLS; c += 2) ctx.fillRect(X0 + c * CELL, Y0 + r * CELL, CELL, CELL);
  // Shelf blocks join their neighbors, so the walls read as rounded candy shelves rather than a grid of squares.
  for (let r = 0; r < SCURRY_ROWS; r++) for (let c = 0; c < SCURRY_COLS; c++) {
    if (!wall(c, r)) continue;
    const x = X0 + c * CELL, y = Y0 + r * CELL;
    rounded(ctx, x + 2, y + 2, CELL - 4, CELL - 4, 6, '#ffb3cf');
    if (wall(c + 1, r) && c + 1 < SCURRY_COLS) rounded(ctx, x + CELL / 2, y + 2, CELL, CELL - 4, 0, '#ffb3cf');
    if (wall(c, r + 1) && r + 1 < SCURRY_ROWS) rounded(ctx, x + 2, y + CELL / 2, CELL - 4, CELL, 0, '#ffb3cf');
  }
  ctx.fillStyle = '#ffd3e3';
  // The shine runs unbroken along a shelf's top edge, from its first block to its last.
  for (let r = 0; r < SCURRY_ROWS; r++) for (let c = 0; c < SCURRY_COLS; c++) {
    if (!wall(c, r) || wall(c, r - 1)) continue;
    const left = wall(c - 1, r) && c > 0 && !wall(c - 1, r - 1) ? 0 : 4, right = wall(c + 1, r) && c + 1 < SCURRY_COLS && !wall(c + 1, r - 1) ? 0 : 4;
    ctx.fillRect(X0 + c * CELL + left, Y0 + r * CELL + 4, CELL - left - right, 2);
  }
  for (let r = 0; r < SCURRY_ROWS; r++) for (let c = 0; c < SCURRY_COLS; c++) {
    const ch = SCURRY_MAZE[r][c], x = X0 + c * CELL, y = Y0 + r * CELL;
    if (ch === 'D') {
      rounded(ctx, x + 1, y + 3, CELL - 2, CELL - 6, 4, '#e9e2ff');
      ctx.fillStyle = '#b8a7ff'; ctx.beginPath(); ctx.moveTo(x + 11, y + 5); ctx.lineTo(x + 7, y + 11); ctx.lineTo(x + 10, y + 11); ctx.lineTo(x + 9, y + 15); ctx.lineTo(x + 13, y + 9); ctx.lineTo(x + 10, y + 9); ctx.closePath(); ctx.fill();
    } else if (ch === '=') {
      ctx.strokeStyle = '#9fe6d6'; ctx.lineWidth = 2.5; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(x + 2, y + CELL / 2); ctx.lineTo(x + CELL - 2, y + CELL / 2); ctx.stroke(); ctx.setLineDash([]);
    }
  }
}
export function drawSprinkleScurry(canvas, game, { best = 0, images = {}, reduced = false, time = 0 } = {}) {
  if (!canvas?.getContext) return; const ctx = canvas.getContext('2d'); if (!ctx) return;
  ctx.save(); ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
  ctx.fillStyle = '#3a2a4d'; ctx.fillRect(0, 0, W, H);
  rounded(ctx, 0, 0, W, 48, 0, '#2c1a33');
  ctx.save(); ctx.translate(26, 26); drawHamster(ctx, 1, 0); ctx.restore();
  drawTxt(ctx, 'SPRINKLE SCURRY', 42, 31, 12, '#ffe6ef');
  drawTxt(ctx, `SCORE ${game.score}`, 230, 31, 11, '#fdfaf7', 'center');
  drawTxt(ctx, `BEST ${Math.max(best, game.score)}`, 342, 31, 11, '#ead4c4', 'right');
  drawTxt(ctx, `LEVEL ${game.level}`, 20, 64, 10, '#e2d4ef');
  for (let n = 0; n < 3; n++) {
    ctx.globalAlpha = n < game.lives ? 1 : .22;
    if (!drawSprite(ctx, images.heart, 76 + n * 16, 53, 14, 14)) { ctx.fillStyle = '#ff6f9f'; ctx.beginPath(); ctx.arc(83 + n * 16, 60, 5, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 1;
  }
  drawTxt(ctx, String(game.pace).toUpperCase(), 340, 64, 10, '#e2d4ef', 'right');
  drawShelves(ctx);
  game.dots.forEach((kind, i) => {
    if (!kind) return;
    const c = i % SCURRY_COLS, r = Math.floor(i / SCURRY_COLS), x = px(c), y = py(r);
    if (kind === 1) { ctx.save(); ctx.translate(x, y); ctx.rotate((i * 1.7) % Math.PI); rounded(ctx, -3, -1.2, 6, 2.4, 1.2, SPRINKLES[i % SPRINKLES.length]); ctx.restore(); return; }
    // A sugar cube: a lit top face over a shaded side, with a little sparkle. It bobs gently and never blinks.
    const bob = reduced ? 0 : Math.sin(time * 3 + i) * 1.2, top = y - 5.5 + bob;
    rounded(ctx, x - 5.5, top, 11, 11, 2.5, '#efe4dc'); rounded(ctx, x - 5.5, top, 11, 6.5, 2.5, '#ffffff');
    ctx.strokeStyle = '#c9b2a3'; ctx.lineWidth = 1; ctx.beginPath(); ctx.roundRect(x - 5.5, top, 11, 11, 2.5); ctx.stroke();
    ctx.fillStyle = '#e6d6ca'; for (const [sx, sy] of [[-2.5, 2.5], [1.5, 1.5], [-.5, -2], [2.5, -3]]) ctx.fillRect(x + sx, top + 5.5 + sy, 1.2, 1.2);
    ctx.strokeStyle = '#ffcf5a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x + 6, top - 3); ctx.lineTo(x + 6, top + 1); ctx.moveTo(x + 4, top - 1); ctx.lineTo(x + 8, top - 1); ctx.stroke();
  });
  for (const bot of game.bots) {
    const p = game.position(bot), dizzy = bot.scared ? Math.min(1, game.sugar / 1.5) : 0;
    ctx.save(); ctx.translate(px(p.x), py(p.y));
    if (dizzy && !reduced) ctx.rotate(Math.sin(time * 6 + bot.look) * .15);
    if (bot.state === 'dock') ctx.globalAlpha = .8;
    drawVacuumBot(ctx, SHELLS[bot.look % SHELLS.length], bot.dir, dizzy); ctx.restore();
  }
  const h = game.position(game.hamster);
  ctx.save(); ctx.translate(px(h.x), py(h.y));
  drawHamster(ctx, game.hamster.dir === 'left' ? -1 : 1, reduced || !game.hamster.moving ? 0 : time * 18); ctx.restore();
  for (const e of game.effects) {
    const lift = reduced ? 0 : e.age * 18; ctx.globalAlpha = Math.max(0, 1 - e.age / .9);
    if (e.kind === 'bonk') drawTxt(ctx, `+${e.points}`, px(e.x), py(e.y) - 10 - lift, 10, '#7a3d5c', 'center');
    else drawTxt(ctx, 'OOF!', px(e.x), py(e.y) - 12 - lift, 10, '#c93a6c', 'center');
    ctx.globalAlpha = 1;
  }
  if (game.status === 'playing' && game.phase === 'ready') {
    rounded(ctx, 110, 228, 140, 34, 10, '#2a1d31e8'); drawTxt(ctx, 'READY?', 180, 251, 14, '#ffe08a', 'center');
  }
  rounded(ctx, 0, 412, W, 40, 0, '#2c1a33');
  drawTxt(ctx, game.sugar > 0 ? 'SUGAR RUSH! BONK THE DIZZY BOTS' : 'EAT EVERY SPRINKLE  ·  DODGE GABU’S BOTS', 180, 430, 11, game.sugar > 0 ? '#ffe08a' : '#fdf2f7', 'center');
  // During a sugar rush the footer's second line becomes a draining bar, never anything that blinks. Gabu's line never covers the footer here.
  if (game.sugar > 0) { rounded(ctx, 120, 438, 120, 7, 3.5, '#ffffff22'); rounded(ctx, 120, 438, 120 * Math.min(1, game.sugar / 8), 7, 3.5, '#ffe08a'); }
  else drawTxt(ctx, 'SWIPE OR TAP  ·  ARROWS / WASD  ·  P PAUSES', 180, 445, 8, '#bfa9c4', 'center');
  if (game.status === 'dead') overlay(ctx, 'VACUUMED UP!', `Level ${game.level} · ${game.score} points · ${game.bonks} ${game.bonks === 1 ? 'bot' : 'bots'} bonked`, 'PRESS PLAY FOR A NEW RUN', '#ff8fb8');
  else if (game.status === 'paused') overlay(ctx, 'PAUSED', 'The bots are pretending not to look.', 'PRESS PLAY TO RESUME', '#b8a7ff');
  else if (game.status === 'idle') overlay(ctx, 'SPRINKLE SCURRY', 'Eat every sprinkle. Sugar cubes make the bots dizzy.', 'PRESS PLAY OR SWIPE TO START', '#ffcf5a');
  ctx.restore();
}
function overlay(ctx, message, sub, hint, accent) {
  ctx.fillStyle = '#1a1220a0'; ctx.fillRect(0, 48, W, H - 48);
  rounded(ctx, 30, 176, 300, 104, 14, accent); rounded(ctx, 32, 178, 296, 100, 12, '#2a1d31');
  drawTxt(ctx, message, 180, 220, 22, '#fff0f5', 'center'); drawTxt(ctx, sub, 180, 244, 11, '#ead5e4', 'center');
  drawTxt(ctx, hint, 180, 265, 9, '#ffd98c', 'center');
}
/** Turns a swipe, or a tap relative to the hamster, into a direction. Short wiggles count as taps. */
export function scurrySwipe(game, from, to) {
  if (![from?.x, from?.y, to?.x, to?.y].every(Number.isFinite)) return null;
  let dx = to.x - from.x, dy = to.y - from.y;
  if (Math.hypot(dx, dy) < 14) { const h = game.position(game.hamster); dx = to.x - px(h.x); dy = to.y - py(h.y); if (Math.hypot(dx, dy) < 6) return null; }
  return Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
}
