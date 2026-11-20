/** Berry Drop canvas: a lavender berry basket with strawberry and blueberry tokens. */
import { BERRY_COLS, BERRY_ROWS } from './connect.js';

const W = 360, H = 452, CELL = 44, BX = 26, BY = 108, R = 17, SEATED = 14.5;
const rounded = (ctx, x, y, w, h, r, fill) => { ctx.fillStyle = fill; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); };
const drawTxt = (ctx, t, x, y, size, color = '#fbf3ef', align = 'left') => {
  ctx.font = `800 ${size}px ui-sans-serif,system-ui,sans-serif`; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.fillText(String(t), x, y); ctx.textAlign = 'left';
};
const drawSprite = (ctx, img, x, y, w, h) => { if (!img?.complete || !img.naturalWidth) return false; ctx.drawImage(img, x, y, w, h); return true; };
export const berryColumnAt = (x, y) => {
  if (!Number.isFinite(x) || !Number.isFinite(y) || x < BX || x >= BX + CELL * BERRY_COLS || y < 52 || y >= BY + CELL * BERRY_ROWS + 8) return -1;
  return Math.floor((x - BX) / CELL);
};
/** Your strawberry has a leafy cap and seeds; Gabu's blueberry wears the cyan right-eye interface. */
export function drawBerryToken(ctx, who, cx, cy, r = R, alpha = 1) {
  if (who !== 1 && who !== 2) return;
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(cx, cy); ctx.scale(r / R, r / R); ctx.lineWidth = 1.4; ctx.lineJoin = 'round';
  if (who === 1) {
    ctx.beginPath(); ctx.moveTo(0, 16); ctx.bezierCurveTo(-13, 12, -17, -2, -12, -9); ctx.bezierCurveTo(-7, -14, 7, -14, 12, -9); ctx.bezierCurveTo(17, -2, 13, 12, 0, 16); ctx.closePath();
    const body = ctx.createRadialGradient(-5, -5, 2, 0, 0, 18); body.addColorStop(0, '#ff9fbf'); body.addColorStop(1, '#ec4f7f');
    ctx.fillStyle = body; ctx.fill(); ctx.strokeStyle = '#8f2148'; ctx.stroke();
    ctx.fillStyle = '#ffe9a8'; for (const [sx, sy] of [[-8, 5], [8, 5], [-3, 10], [3, 10], [-10, -2], [10, -2]]) { ctx.beginPath(); ctx.ellipse(sx, sy, .9, 1.4, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#6fcf6b'; ctx.strokeStyle = '#2f7d3a'; ctx.lineWidth = 1.1;
    for (const a of [-1.1, -.4, .4, 1.1]) { ctx.save(); ctx.translate(0, -12); ctx.rotate(a); ctx.beginPath(); ctx.ellipse(0, -4, 2.6, 5.4, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore(); }
    ctx.fillStyle = '#5a2440'; ctx.beginPath(); ctx.arc(-4.5, 0, 1.8, 0, Math.PI * 2); ctx.arc(4.5, 0, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#5a2440'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(0, 3, 2.4, .2, Math.PI - .2); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.arc(0, 1, R - 1, 0, Math.PI * 2);
    const body = ctx.createRadialGradient(-5, -5, 2, 0, 0, 18); body.addColorStop(0, '#a9b4ff'); body.addColorStop(1, '#4f5bd6');
    ctx.fillStyle = body; ctx.fill(); ctx.strokeStyle = '#1f2470'; ctx.stroke();
    ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? 2.2 : 5; ctx.lineTo(Math.cos(a) * rr, -11 + Math.sin(a) * rr); }
    ctx.closePath(); ctx.fillStyle = '#2a2f86'; ctx.fill();
    ctx.fillStyle = '#e8ebff'; ctx.beginPath(); ctx.arc(-5, 2, 1.9, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.shadowColor = '#6ff3ff'; ctx.shadowBlur = 5; ctx.fillStyle = '#6ff3ff'; ctx.beginPath(); ctx.arc(5, 2, 2.4, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    ctx.strokeStyle = '#e8ebff'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-2.2, 6.6); ctx.lineTo(2.2, 6.2); ctx.stroke();
  }
  ctx.globalAlpha = alpha * .45; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(-7, -5, 3.4, 1.8, -.6, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = alpha * .5; ctx.fillStyle = '#ffc2d6'; ctx.beginPath(); ctx.ellipse(-9, 4.5, 2.4, 1.3, 0, 0, Math.PI * 2); ctx.ellipse(9, 4.5, 2.4, 1.3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
function sparkle(ctx, x, y, size, color) {
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x, y - size); ctx.lineTo(x, y + size); ctx.moveTo(x - size, y); ctx.lineTo(x + size, y); ctx.stroke(); ctx.restore();
}
const LEVEL_NAMES = Object.freeze({ chill: 'CHILL GABU', normal: 'NORMAL GABU', hard: 'HARD GABU' });
export function drawBerryDrop(canvas, game, { best = 0, images = {}, reduced = false, time = 0 } = {}) {
  if (!canvas?.getContext) return; const ctx = canvas.getContext('2d'); if (!ctx) return;
  ctx.save(); ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
  const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#221a36'); bg.addColorStop(1, '#16121f'); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 14; i++) { ctx.fillStyle = i % 2 ? '#c9c5ff14' : '#ffc8e01c'; ctx.fillRect((i * 83 + 9) % W, (i * 97 + 31) % H, 2, 2); }
  drawBerryToken(ctx, 1, 26, 25, 9);
  drawTxt(ctx, 'BERRY DROP', 42, 31, 12, '#ffe6ef');
  drawTxt(ctx, `SCORE ${game.score}`, 180, 31, 11, '#fdfaf7', 'center');
  drawTxt(ctx, `BEST ${Math.max(best, game.score)}`, 342, 31, 11, '#ead4c4', 'right');
  rounded(ctx, 20, 45, 320, 1, 0, '#3f3654');
  drawTxt(ctx, `ROUND ${game.round}  ·  WINS ${game.wins}`, 22, 62, 10, '#cfc4ea');
  drawTxt(ctx, LEVEL_NAMES[game.level] || 'GABU', 338, 62, 10, '#cfc4ea', 'right');
  const yourTurn = game.status === 'playing' && game.phase === 'turn' && game.turn === 1 && !game.falling;
  if (yourTurn) {
    const bob = reduced ? 0 : Math.sin(time * 5) * 2;
    drawBerryToken(ctx, 1, BX + game.cursor * CELL + CELL / 2, 89 + bob, R - 1);
  } else if (game.status === 'playing' && game.phase === 'turn' && game.turn === 2 && !game.falling) {
    drawSprite(ctx, images.gabu_smug, 160, 70, 40, 34);
  }
  // Seated berries sit slightly small so their leaves and calyx stay visible inside each hole.
  rounded(ctx, BX - 10, BY - 10, CELL * BERRY_COLS + 20, CELL * BERRY_ROWS + 22, 18, '#2f2647');
  const falling = game.falling;
  for (let i = 0; i < game.board.length; i++) {
    const who = game.board[i]; if (!who) continue;
    drawBerryToken(ctx, who, BX + (i % BERRY_COLS) * CELL + CELL / 2, BY + Math.floor(i / BERRY_COLS) * CELL + CELL / 2 + 1.5, SEATED);
  }
  if (falling) drawBerryToken(ctx, falling.who, BX + falling.col * CELL + CELL / 2, BY + falling.y * CELL + CELL / 2 + 1.5, SEATED);
  ctx.save(); ctx.beginPath(); ctx.roundRect(BX - 8, BY - 8, CELL * BERRY_COLS + 16, CELL * BERRY_ROWS + 18, 16);
  for (let row = 0; row < BERRY_ROWS; row++) for (let col = 0; col < BERRY_COLS; col++) {
    const cx = BX + col * CELL + CELL / 2, cy = BY + row * CELL + CELL / 2; ctx.moveTo(cx + R + 2, cy); ctx.arc(cx, cy, R + 2, 0, Math.PI * 2, true);
  }
  const tin = ctx.createLinearGradient(0, BY, 0, BY + CELL * BERRY_ROWS); tin.addColorStop(0, '#c4b0f6'); tin.addColorStop(1, '#a58de6');
  ctx.fillStyle = tin; ctx.fill('evenodd'); ctx.restore();
  ctx.strokeStyle = '#ece4ff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(BX - 8, BY - 8, CELL * BERRY_COLS + 16, CELL * BERRY_ROWS + 18, 16); ctx.stroke();
  for (let row = 0; row < BERRY_ROWS; row++) for (let col = 0; col < BERRY_COLS; col++) {
    ctx.strokeStyle = '#7f69c4'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(BX + col * CELL + CELL / 2, BY + row * CELL + CELL / 2, R + 2, 0, Math.PI * 2); ctx.stroke();
  }
  if (yourTurn) { ctx.globalAlpha = .16; rounded(ctx, BX + game.cursor * CELL + 3, BY - 6, CELL - 6, CELL * BERRY_ROWS + 10, 12, '#ffffff'); ctx.globalAlpha = 1; }
  if (game.winLine) {
    const pulse = reduced ? 1 : .75 + .25 * Math.sin(game.glow * 8);
    for (const cell of game.winLine) {
      const cx = BX + (cell % BERRY_COLS) * CELL + CELL / 2, cy = BY + Math.floor(cell / BERRY_COLS) * CELL + CELL / 2;
      ctx.globalAlpha = pulse; ctx.strokeStyle = game.result === 'win' ? '#ffe08a' : '#6ff3ff'; ctx.lineWidth = 3.2;
      ctx.beginPath(); ctx.arc(cx, cy, R + 3.5, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
      sparkle(ctx, cx + 13, cy - 13, 4, '#fff6d6');
    }
  }
  const legend = game.status === 'dead' ? 'GABU CONNECTED FOUR' : game.phase === 'over' ? (game.result === 'win' ? 'FOUR IN A ROW! TAP FOR THE NEXT ROUND' : 'FULL BASKET. TAP FOR THE NEXT ROUND') :
    yourTurn ? 'YOUR DROP' : game.falling ? (game.falling.who === 1 ? 'PLOP' : 'GABU DROPS') : game.status === 'playing' ? 'GABU IS PLOTTING' : 'BERRY DROP';
  drawTxt(ctx, legend, 180, 406, 12, game.phase === 'over' && game.result === 'win' ? '#ffe08a' : '#fdf2f7', 'center');
  drawTxt(ctx, game.starter === 2 ? 'GABU STARTED THIS ROUND' : 'YOU STARTED THIS ROUND', 180, 424, 9, '#bfb3d8', 'center');
  drawTxt(ctx, 'TAP A COLUMN  ·  ARROWS + SPACE  ·  KEYS 1–7', 180, 441, 9, '#a99cc4', 'center');
  if (game.status === 'dead') overlay(ctx, 'GABU WINS', `Streak over: ${game.wins} ${game.wins === 1 ? 'win' : 'wins'}, ${game.score} points.`, 'PRESS PLAY FOR A NEW STREAK', '#8b86f5');
  else if (game.status === 'paused') overlay(ctx, 'PAUSED', 'The berries are holding very still.', 'PRESS PLAY TO RESUME', '#b8a7ff');
  else if (game.status === 'idle') overlay(ctx, 'BERRY DROP', 'Line up four strawberries before Gabu does.', 'PRESS PLAY OR TAP TO START', '#ff8fb8');
  ctx.restore();
}
function overlay(ctx, message, sub, hint, accent) {
  ctx.fillStyle = '#16121fb0'; ctx.fillRect(0, 53, W, H - 53);
  rounded(ctx, 37, 170, 286, 104, 14, accent); rounded(ctx, 39, 172, 282, 100, 12, '#251d36');
  drawTxt(ctx, message, 180, 214, 22, '#fff0f5', 'center'); drawTxt(ctx, sub, 180, 238, 11, '#ddd3f2', 'center');
  drawTxt(ctx, hint, 180, 259, 9, '#ffd98c', 'center');
}
