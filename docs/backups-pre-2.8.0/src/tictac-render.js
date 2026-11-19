/** Tic Tac Treats canvas: a quilted picnic cushion, pocky crosses for you, glazed donuts for Gabu. */

const W = 360, H = 452, BX = 48, BY = 104, CELL = 88;
const rounded = (ctx, x, y, w, h, r, fill) => { ctx.fillStyle = fill; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); };
const drawTxt = (ctx, t, x, y, size, color = '#fbf3ef', align = 'left') => {
  ctx.font = `800 ${size}px ui-sans-serif,system-ui,sans-serif`; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.fillText(String(t), x, y); ctx.textAlign = 'left';
};
const drawSprite = (ctx, img, x, y, w, h) => { if (!img?.complete || !img.naturalWidth) return false; ctx.drawImage(img, x, y, w, h); return true; };
export const tictacCellAt = (x, y) => {
  if (!Number.isFinite(x) || !Number.isFinite(y) || x < BX || y < BY || x >= BX + CELL * 3 || y >= BY + CELL * 3) return -1;
  return Math.floor((y - BY) / CELL) * 3 + Math.floor((x - BX) / CELL);
};
/** Your mark: two crossed strawberry pocky sticks. */
export function drawPockyMark(ctx, cx, cy, size, alpha = 1) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(cx, cy); ctx.scale(size / 60, size / 60); ctx.lineCap = 'round';
  for (const a of [Math.PI / 4, -Math.PI / 4]) {
    ctx.save(); ctx.rotate(a);
    ctx.strokeStyle = '#a8632c'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(-25, 0); ctx.lineTo(25, 0); ctx.stroke();
    ctx.strokeStyle = '#e9b16f'; ctx.lineWidth = 6; ctx.stroke();
    ctx.strokeStyle = '#b4416f'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(25, 0); ctx.stroke();
    ctx.strokeStyle = '#ff8fb8'; ctx.lineWidth = 7; ctx.stroke();
    ctx.strokeStyle = '#ffd1e1'; ctx.lineWidth = 1.6;
    for (let x = -8; x < 24; x += 6) { ctx.beginPath(); ctx.moveTo(x, -2.6); ctx.lineTo(x + 3, 2.6); ctx.stroke(); }
    ctx.restore();
  }
  ctx.restore();
}
/** Gabu's mark: a glazed donut with sprinkles and a cyan glint where the right eye would be. */
export function drawDonutMark(ctx, cx, cy, size, alpha = 1) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(cx, cy); ctx.scale(size / 60, size / 60);
  ctx.beginPath(); ctx.arc(0, 0, 24, 0, Math.PI * 2); ctx.arc(0, 0, 8, 0, Math.PI * 2, true); ctx.fillStyle = '#e2a25f'; ctx.fill('evenodd');
  ctx.strokeStyle = '#8a5124'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 24, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath();
  for (let i = 0; i <= 24; i++) { const a = i / 24 * Math.PI * 2, r = 20 + (i % 2 ? 1.6 : -1.2); ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
  ctx.closePath(); ctx.arc(0, 0, 10.5, 0, Math.PI * 2, true); ctx.fillStyle = '#b9a2f0'; ctx.fill('evenodd');
  const colors = ['#ffffff', '#ff8fb8', '#ffd36e', '#8fd8ff'];
  for (let i = 0; i < 12; i++) {
    const a = i * .53 + .2, r = 13 + (i % 3) * 2.6;
    ctx.save(); ctx.translate(Math.cos(a) * r, Math.sin(a) * r); ctx.rotate(a * 2.3); ctx.fillStyle = colors[i % 4]; ctx.beginPath(); ctx.roundRect(-2.4, -.9, 4.8, 1.8, .9); ctx.fill(); ctx.restore();
  }
  ctx.save(); ctx.shadowColor = '#6ff3ff'; ctx.shadowBlur = 6; ctx.fillStyle = '#6ff3ff'; ctx.beginPath(); ctx.arc(12, -12, 3, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  ctx.restore();
}
const LEVEL_NAMES = Object.freeze({ chill: 'CHILL GABU', normal: 'NORMAL GABU', hard: 'HARD GABU' });
// `cursor` is false until the player uses the keyboard, so taps never leave a stray highlight.
export function drawTicTacTreats(canvas, game, { best = 0, images = {}, reduced = false, cursor = true } = {}) {
  if (!canvas?.getContext) return; const ctx = canvas.getContext('2d'); if (!ctx) return;
  ctx.save(); ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
  const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#2c1a33'); bg.addColorStop(1, '#1b1322'); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 12; i++) { ctx.fillStyle = '#ffc8e018'; ctx.fillRect((i * 79 + 21) % W, (i * 101 + 43) % H, 2, 2); }
  drawPockyMark(ctx, 26, 24, 22);
  drawTxt(ctx, 'TIC TAC TREATS', 42, 31, 12, '#ffe6ef');
  drawTxt(ctx, `SCORE ${game.score}`, 192, 31, 11, '#fdfaf7', 'center');
  drawTxt(ctx, `BEST ${Math.max(best, game.score)}`, 342, 31, 11, '#ead4c4', 'right');
  rounded(ctx, 20, 45, 320, 1, 0, '#4a3546');
  drawTxt(ctx, `ROUND ${game.round}  ·  WINS ${game.wins}  ·  DRAWS ${game.draws}`, 22, 66, 10, '#e2c9da');
  drawTxt(ctx, LEVEL_NAMES[game.level] || 'GABU', 338, 66, 10, '#e2c9da', 'right');
  // Quilted picnic cushion with stitched dividers.
  rounded(ctx, BX - 14, BY - 14, CELL * 3 + 28, CELL * 3 + 28, 26, '#c77d9d');
  rounded(ctx, BX - 11, BY - 11, CELL * 3 + 22, CELL * 3 + 22, 23, '#ffe3ee');
  for (let i = 0; i < 9; i++) {
    const x = BX + (i % 3) * CELL, y = BY + Math.floor(i / 3) * CELL;
    rounded(ctx, x + 5, y + 5, CELL - 10, CELL - 10, 16, (i + Math.floor(i / 3)) % 2 ? '#ffd0e1' : '#ffe9f1');
  }
  ctx.strokeStyle = '#d98aab'; ctx.lineWidth = 2; ctx.setLineDash([5, 5]);
  for (const k of [1, 2]) {
    ctx.beginPath(); ctx.moveTo(BX + k * CELL, BY + 6); ctx.lineTo(BX + k * CELL, BY + CELL * 3 - 6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(BX + 6, BY + k * CELL); ctx.lineTo(BX + CELL * 3 - 6, BY + k * CELL); ctx.stroke();
  }
  ctx.setLineDash([]);
  const yourTurn = game.status === 'playing' && game.phase === 'turn' && game.turn === 1;
  for (let i = 0; i < 9; i++) {
    const cx = BX + (i % 3) * CELL + CELL / 2, cy = BY + Math.floor(i / 3) * CELL + CELL / 2, grow = reduced ? 1 : .55 + .45 * Math.min(1, game.placed[i] || 1);
    if (game.board[i] === 1) drawPockyMark(ctx, cx, cy, 62 * grow);
    else if (game.board[i] === 2) drawDonutMark(ctx, cx, cy, 62 * grow);
    else if (cursor && yourTurn && i === game.cursor) drawPockyMark(ctx, cx, cy, 54, .28);
  }
  if (cursor && game.status === 'playing' && game.phase === 'turn') {
    const x = BX + (game.cursor % 3) * CELL, y = BY + Math.floor(game.cursor / 3) * CELL;
    ctx.strokeStyle = yourTurn ? '#5fd8d2' : '#5fd8d244'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.roundRect(x + 4, y + 4, CELL - 8, CELL - 8, 16); ctx.stroke();
  }
  if (game.line) {
    const a = game.line[0], b = game.line[2], pulse = reduced ? 1 : .8 + .2 * Math.sin(game.glow * 8);
    const ax = BX + (a % 3) * CELL + CELL / 2, ay = BY + Math.floor(a / 3) * CELL + CELL / 2, bx = BX + (b % 3) * CELL + CELL / 2, by = BY + Math.floor(b / 3) * CELL + CELL / 2;
    ctx.save(); ctx.globalAlpha = pulse; ctx.lineCap = 'round';
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
    ctx.strokeStyle = game.result === 'win' ? '#ffcf5a' : '#6ff3ff'; ctx.lineWidth = 7; ctx.stroke(); ctx.restore();
  }
  const thinking = game.status === 'playing' && game.phase === 'turn' && game.turn === 2;
  if (thinking) drawSprite(ctx, images.gabu_smug, 92, 384, 26, 26);
  const legend = game.status === 'dead' ? 'THREE DONUTS IN A ROW' : game.phase === 'over' ? (game.result === 'win' ? 'THREE POCKY! TAP FOR THE NEXT ROUND' : 'A TIE. TAP FOR THE NEXT ROUND') :
    yourTurn ? 'YOUR TREAT' : thinking ? 'GABU IS PLOTTING' : 'TIC TAC TREATS';
  drawTxt(ctx, legend, 180, 404, 12, game.phase === 'over' && game.result === 'win' ? '#ffe08a' : '#fdf2f7', 'center');
  drawTxt(ctx, game.starter === 2 ? 'GABU STARTED THIS ROUND' : 'YOU STARTED THIS ROUND', 180, 423, 9, '#d6bccc', 'center');
  drawTxt(ctx, 'TAP A SQUARE  ·  ARROWS + SPACE  ·  KEYS 1–9', 180, 441, 9, '#bfa9c4', 'center');
  if (game.status === 'dead') overlay(ctx, 'GABU WINS', `Streak over: ${game.wins} ${game.wins === 1 ? 'win' : 'wins'}, ${game.score} points.`, 'PRESS PLAY FOR A NEW STREAK', '#a99cf5');
  else if (game.status === 'paused') overlay(ctx, 'PAUSED', 'Gabu is pretending not to look.', 'PRESS PLAY TO RESUME', '#b8a7ff');
  else if (game.status === 'idle') overlay(ctx, 'TIC TAC TREATS', 'Three pocky in a row beats the donuts.', 'PRESS PLAY OR TAP TO START', '#ff7fae');
  ctx.restore();
}
function overlay(ctx, message, sub, hint, accent) {
  ctx.fillStyle = '#1a1220b0'; ctx.fillRect(0, 53, W, H - 53);
  rounded(ctx, 37, 170, 286, 104, 14, accent); rounded(ctx, 39, 172, 282, 100, 12, '#2a1d31');
  drawTxt(ctx, message, 180, 214, 22, '#fff0f5', 'center'); drawTxt(ctx, sub, 180, 238, 11, '#ead5e4', 'center');
  drawTxt(ctx, hint, 180, 259, 9, '#ffd98c', 'center');
}
