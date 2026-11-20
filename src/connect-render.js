/** Star Drop canvas: a night-sky chart where your golden stars and Gabu's ringed planets drop into seven columns.
 * Four in a row lights up a constellation. (The game keeps Berry Drop's id and save keys, so bests and streaks carry over.) */
import { BERRY_COLS, BERRY_ROWS } from './connect.js';

const W = 360, H = 452, CELL = 44, BX = 26, BY = 108, R = 17, SEATED = 14.5;
const rounded = (ctx, x, y, w, h, r, fill) => { ctx.fillStyle = fill; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); };
const drawTxt = (ctx, t, x, y, size, color = '#fbf3ef', align = 'left') => {
  ctx.font = `800 ${size}px ui-sans-serif,system-ui,sans-serif`; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.fillText(String(t), x, y); ctx.textAlign = 'left';
};
const drawSprite = (ctx, img, x, y, w, h) => { if (!img?.complete || !img.naturalWidth) return false; ctx.drawImage(img, x, y, w, h); return true; };
export const starColumnAt = (x, y) => {
  if (!Number.isFinite(x) || !Number.isFinite(y) || x < BX || x >= BX + CELL * BERRY_COLS || y < 52 || y >= BY + CELL * BERRY_ROWS + 8) return -1;
  return Math.floor((x - BX) / CELL);
};
// Gabu's eyes as Kitty draws them on the Snake head: his right eye amber, his left eye blue, so facing you the amber one is on your left.
function gabuEye(ctx, x, y, r, iris, ring, pupil) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = '#ffffff'; ctx.fill();
  ctx.beginPath(); ctx.arc(x, y, r * .7, 0, Math.PI * 2); ctx.fillStyle = iris; ctx.fill(); ctx.strokeStyle = ring; ctx.lineWidth = r * .2; ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y, r * .3, 0, Math.PI * 2); ctx.fillStyle = pupil; ctx.fill();
  ctx.beginPath(); ctx.arc(x - r * .28, y - r * .3, r * .16, 0, Math.PI * 2); ctx.fillStyle = '#ffffff'; ctx.fill();
}
function gabuEyes(ctx, x, y, gap, r) {
  ctx.save(); gabuEye(ctx, x - gap, y, r, '#fbbf24', '#e58f10', '#451a03'); gabuEye(ctx, x + gap, y, r, '#38bdf8', '#1d97d8', '#082f49'); ctx.restore();
}
/** Your piece is a golden star with a soft glow; Gabu's is a little ringed planet with his amber and blue eyes. */
export function drawStarToken(ctx, who, cx, cy, r = R, alpha = 1) {
  if (who !== 1 && who !== 2) return;
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(cx, cy); ctx.scale(r / R, r / R); ctx.lineJoin = 'round';
  if (who === 1) {
    const halo = ctx.createRadialGradient(0, 0, 2, 0, 0, 17); halo.addColorStop(0, '#fff3c466'); halo.addColorStop(1, '#fff3c400');
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(0, 0, 17, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? 6.4 : 14.5; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr + 1); } ctx.closePath();
    const body = ctx.createLinearGradient(0, -14, 0, 15); body.addColorStop(0, '#fff3b0'); body.addColorStop(1, '#ffb43c');
    ctx.fillStyle = body; ctx.fill(); ctx.strokeStyle = '#b8741a'; ctx.lineWidth = 1.3; ctx.stroke();
    ctx.globalAlpha = alpha * .7; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(-3, -4, 2.6, 1.4, -.5, 0, Math.PI * 2); ctx.fill();
  } else {
    // The ring passes behind the planet, then in front of it.
    ctx.strokeStyle = '#c9b6ff'; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.ellipse(0, 1, 17, 5, -.35, Math.PI, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 1, 12, 0, Math.PI * 2);
    const body = ctx.createRadialGradient(-4, -4, 2, 0, 1, 13); body.addColorStop(0, '#b8a2ff'); body.addColorStop(1, '#4b3a9e');
    ctx.fillStyle = body; ctx.fill(); ctx.strokeStyle = '#2a1f66'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.globalAlpha = alpha * .35; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(-2, 5, 8, 1.6, -.35, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = alpha;
    gabuEyes(ctx, 0, -1, 4.6, 2.9);
    ctx.strokeStyle = '#c9b6ff'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.ellipse(0, 1, 17, 5, -.35, 0, Math.PI); ctx.stroke();
  }
  ctx.restore();
}
function sparkle(ctx, x, y, size, color) {
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x, y - size); ctx.lineTo(x, y + size); ctx.moveTo(x - size, y); ctx.lineTo(x + size, y); ctx.stroke(); ctx.restore();
}
const LEVEL_NAMES = Object.freeze({ chill: 'CHILL GABU', normal: 'NORMAL GABU', hard: 'HARD GABU' });
export function drawStarDrop(canvas, game, { best = 0, images = {}, reduced = false, time = 0 } = {}) {
  if (!canvas?.getContext) return; const ctx = canvas.getContext('2d'); if (!ctx) return;
  ctx.save(); ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
  const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#141432'); bg.addColorStop(1, '#0c0c1c'); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 26; i++) { ctx.fillStyle = i % 3 ? '#ffffff22' : '#fff3c444'; ctx.fillRect((i * 83 + 9) % W, (i * 97 + 31) % H, i % 4 ? 1.5 : 2.2, i % 4 ? 1.5 : 2.2); }
  drawStarToken(ctx, 1, 26, 25, 10);
  drawTxt(ctx, 'STAR DROP', 42, 31, 12, '#ffe6ef');
  drawTxt(ctx, `SCORE ${game.score}`, 180, 31, 11, '#fdfaf7', 'center');
  drawTxt(ctx, `BEST ${Math.max(best, game.score)}`, 342, 31, 11, '#ead4c4', 'right');
  rounded(ctx, 20, 45, 320, 1, 0, '#3f3654');
  drawTxt(ctx, `ROUND ${game.round}  ·  WINS ${game.wins}`, 22, 62, 10, '#cfc4ea');
  drawTxt(ctx, LEVEL_NAMES[game.level] || 'GABU', 338, 62, 10, '#cfc4ea', 'right');
  const yourTurn = game.status === 'playing' && game.phase === 'turn' && game.turn === 1 && !game.falling;
  if (yourTurn) {
    const bob = reduced ? 0 : Math.sin(time * 5) * 2;
    drawStarToken(ctx, 1, BX + game.cursor * CELL + CELL / 2, 89 + bob, R - 1);
  } else if (game.status === 'playing' && game.phase === 'turn' && game.turn === 2 && !game.falling) {
    drawSprite(ctx, images.gabu_smug, 162, 62, 36, 31);
  }
  // The chart: a deep-blue sky panel with faint grid lines and a dark socket in every cell.
  const sky = ctx.createLinearGradient(0, BY, 0, BY + CELL * BERRY_ROWS); sky.addColorStop(0, '#1f2458'); sky.addColorStop(1, '#151a40');
  ctx.save(); ctx.shadowColor = '#7f97ff'; ctx.shadowBlur = reduced ? 0 : 10;
  rounded(ctx, BX - 9, BY - 9, CELL * BERRY_COLS + 18, CELL * BERRY_ROWS + 20, 16, '#5b64c8'); ctx.restore();
  rounded(ctx, BX - 7, BY - 7, CELL * BERRY_COLS + 14, CELL * BERRY_ROWS + 16, 14, sky);
  ctx.strokeStyle = '#ffffff10'; ctx.lineWidth = 1;
  for (let col = 1; col < BERRY_COLS; col++) { ctx.beginPath(); ctx.moveTo(BX + col * CELL, BY - 4); ctx.lineTo(BX + col * CELL, BY + CELL * BERRY_ROWS + 6); ctx.stroke(); }
  for (let row = 0; row < BERRY_ROWS; row++) for (let col = 0; col < BERRY_COLS; col++) {
    const cx = BX + col * CELL + CELL / 2, cy = BY + row * CELL + CELL / 2;
    ctx.beginPath(); ctx.arc(cx, cy, R + 1, 0, Math.PI * 2); ctx.fillStyle = '#0d1030'; ctx.fill(); ctx.strokeStyle = '#3c4590'; ctx.lineWidth = 1.2; ctx.stroke();
  }
  const falling = game.falling;
  for (let i = 0; i < game.board.length; i++) {
    const who = game.board[i]; if (!who) continue;
    drawStarToken(ctx, who, BX + (i % BERRY_COLS) * CELL + CELL / 2, BY + Math.floor(i / BERRY_COLS) * CELL + CELL / 2, SEATED);
  }
  if (falling) drawStarToken(ctx, falling.who, BX + falling.col * CELL + CELL / 2, BY + falling.y * CELL + CELL / 2, SEATED);
  if (yourTurn) { ctx.globalAlpha = .16; rounded(ctx, BX + game.cursor * CELL + 3, BY - 6, CELL - 6, CELL * BERRY_ROWS + 10, 12, '#ffffff'); ctx.globalAlpha = 1; }
  // Four in a row lights up as a constellation: a glowing line drawn through the four, with a sparkle on each.
  if (game.winLine) {
    const glow = reduced ? 1 : .8 + .2 * Math.sin(game.glow * 6), pts = game.winLine.map(cell => [BX + (cell % BERRY_COLS) * CELL + CELL / 2, BY + Math.floor(cell / BERRY_COLS) * CELL + CELL / 2]);
    ctx.save(); ctx.globalAlpha = glow; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.shadowColor = game.result === 'win' ? '#ffe08a' : '#9be7ff'; ctx.shadowBlur = reduced ? 0 : 10;
    ctx.strokeStyle = game.result === 'win' ? '#ffe08a' : '#9be7ff'; ctx.lineWidth = 3;
    ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); ctx.restore();
    for (const [cx, cy] of pts) sparkle(ctx, cx + 12, cy - 12, 4, '#fff6d6');
  }
  const legend = game.status === 'dead' ? 'GABU CONNECTED FOUR' : game.phase === 'over' ? (game.result === 'win' ? 'FOUR IN A ROW! TAP FOR THE NEXT ROUND' : 'FULL SKY. TAP FOR THE NEXT ROUND') :
    yourTurn ? 'YOUR DROP' : game.falling ? (game.falling.who === 1 ? 'FALLING STAR' : 'GABU DROPS') : game.status === 'playing' ? 'GABU IS PLOTTING' : 'STAR DROP';
  drawTxt(ctx, legend, 180, 406, 12, game.phase === 'over' && game.result === 'win' ? '#ffe08a' : '#fdf2f7', 'center');
  drawTxt(ctx, game.starter === 2 ? 'GABU STARTED THIS ROUND' : 'YOU STARTED THIS ROUND', 180, 424, 9, '#bfb3d8', 'center');
  drawTxt(ctx, 'TAP A COLUMN  ·  ARROWS + SPACE  ·  KEYS 1–7', 180, 441, 9, '#a99cc4', 'center');
  if (game.status === 'dead') overlay(ctx, 'GABU WINS', `Streak over: ${game.wins} ${game.wins === 1 ? 'win' : 'wins'}, ${game.score} points.`, 'PRESS PLAY FOR A NEW STREAK', '#8b86f5');
  else if (game.status === 'paused') overlay(ctx, 'PAUSED', 'The stars are holding very still.', 'PRESS PLAY TO RESUME', '#b8a7ff');
  else if (game.status === 'idle') overlay(ctx, 'STAR DROP', 'Line up four stars before Gabu’s planets do.', 'PRESS PLAY OR TAP TO START', '#ffd36e');
  ctx.restore();
}
function overlay(ctx, message, sub, hint, accent) {
  ctx.fillStyle = '#16121fb0'; ctx.fillRect(0, 53, W, H - 53);
  rounded(ctx, 37, 170, 286, 104, 14, accent); rounded(ctx, 39, 172, 282, 100, 12, '#251d36');
  drawTxt(ctx, message, 180, 214, 22, '#fff0f5', 'center'); drawTxt(ctx, sub, 180, 238, 11, '#ddd3f2', 'center');
  drawTxt(ctx, hint, 180, 259, 9, '#ffd98c', 'center');
}
