/** Catmate canvas: strawberry-milk board, plush cat pieces in role hats, paw-print move hints.
 * Every piece is drawn from vector shapes; the hat is the role, so pieces read at a glance.
 */
import { kingSquare, inCheck } from './chess.js';

const W = 360, H = 452, X = 20, Y = 62, CELL = 40;
const SIDES = Object.freeze({
  w: { body: '#fff6ec', shade: '#f3d9c9', ink: '#6b4558', ear: '#ffc2d6', eye: '#3a2638', cushion: '#f7c6d8', cushionEdge: '#c77d9d' },
  b: { body: '#4b3668', shade: '#382852', ink: '#1d1329', ear: '#c78bd8', eye: '#ffe9f7', cushion: '#2a1d3d', cushionEdge: '#8f7bd6' },
});
const HAT = Object.freeze({ gold: '#ffd36e', goldInk: '#9b6418', gem: '#ff6fa5', stone: '#e6dcff', stoneInk: '#6f5f9a', mint: '#9fe6d6', mintInk: '#2f7d6d', steel: '#d5deea', steelInk: '#56647a', plume: '#ff8fb8' });
const rounded = (ctx, x, y, w, h, r, fill) => { ctx.fillStyle = fill; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); };
const drawTxt = (ctx, t, x, y, size, color = '#fbf3ef', align = 'left') => {
  ctx.font = `800 ${size}px ui-sans-serif,system-ui,sans-serif`; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.fillText(String(t), x, y); ctx.textAlign = 'left';
};
const drawSprite = (ctx, img, x, y, w, h) => { if (!img?.complete || !img.naturalWidth) return false; ctx.drawImage(img, x, y, w, h); return true; };
export const chessSquareAt = (x, y) => {
  if (!Number.isFinite(x) || !Number.isFinite(y) || x < X || y < Y || x >= X + CELL * 8 || y >= Y + CELL * 8) return -1;
  return Math.floor((y - Y) / CELL) * 8 + Math.floor((x - X) / CELL);
};
function shape(ctx, points, fill, ink) {
  ctx.beginPath(); ctx.moveTo(points[0][0], points[0][1]);
  for (const [px, py] of points.slice(1)) ctx.lineTo(px, py);
  ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = ink; ctx.stroke();
}
function paw(ctx, cx, cy, color, scale = 1) {
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.ellipse(cx, cy + 2 * scale, 4.2 * scale, 3.4 * scale, 0, 0, Math.PI * 2); ctx.fill();
  for (const [dx, dy] of [[-4.6, -2.4], [-1.6, -4.8], [1.6, -4.8], [4.6, -2.4]]) {
    ctx.beginPath(); ctx.ellipse(cx + dx * scale, cy + dy * scale, 1.5 * scale, 1.8 * scale, 0, 0, Math.PI * 2); ctx.fill();
  }
}
/** One plush cat loaf on a cushion. Pawns are smaller kittens with no hat. */
export function drawChessPiece(ctx, piece, cx, cy, size = CELL) {
  if (!piece) return;
  const side = piece === piece.toUpperCase() ? 'w' : 'b', kind = piece.toLowerCase(), c = SIDES[side];
  ctx.save(); ctx.translate(cx, cy); ctx.scale(size / CELL, size / CELL);
  if (kind === 'p') { ctx.translate(0, 3); ctx.scale(.8, .8); }
  ctx.lineWidth = 1.3; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  rounded(ctx, -13, 11, 26, 7, 3.5, c.cushion); ctx.strokeStyle = c.cushionEdge; ctx.beginPath(); ctx.roundRect(-13, 11, 26, 7, 3.5); ctx.stroke();
  for (const sign of [-1, 1]) {
    shape(ctx, [[sign * 11, -1], [sign * 9, -11.5], [sign * 2.8, -5]], c.body, c.ink);
    shape(ctx, [[sign * 9.2, -3], [sign * 8.6, -8.8], [sign * 5, -5.2]], c.ear, c.ear);
  }
  ctx.beginPath(); ctx.ellipse(0, 4, 12, 10.5, 0, 0, Math.PI * 2); ctx.fillStyle = c.body; ctx.fill(); ctx.strokeStyle = c.ink; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, 9.5, 8, 3.6, 0, 0, Math.PI); ctx.fillStyle = c.shade; ctx.fill();
  // Gabu's side wears Gabu's cyan right-eye interface; yours has plain kitten eyes.
  ctx.fillStyle = c.eye; ctx.beginPath(); ctx.arc(-4.5, 3, 1.7, 0, Math.PI * 2); ctx.fill();
  if (side === 'b') {
    ctx.save(); ctx.shadowColor = '#6ff3ff'; ctx.shadowBlur = 4; ctx.fillStyle = '#6ff3ff';
    ctx.beginPath(); ctx.arc(4.5, 3, 2, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  } else { ctx.beginPath(); ctx.arc(4.5, 3, 1.7, 0, Math.PI * 2); ctx.fill(); }
  ctx.strokeStyle = side === 'w' ? c.ink : '#f2d9ff'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-2, 6.2); ctx.quadraticCurveTo(-1, 7.6, 0, 6.4); ctx.quadraticCurveTo(1, 7.6, 2, 6.2); ctx.stroke();
  ctx.globalAlpha = .55; ctx.fillStyle = '#ff9fc0';
  ctx.beginPath(); ctx.ellipse(-7.6, 6.6, 2.1, 1.2, 0, 0, Math.PI * 2); ctx.ellipse(7.6, 6.6, 2.1, 1.2, 0, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1; ctx.lineWidth = 1.3;
  if (kind === 'k') {
    shape(ctx, [[-7, -6.5], [-7.5, -14], [-3.6, -10.2], [0, -16], [3.6, -10.2], [7.5, -14], [7, -6.5]], HAT.gold, HAT.goldInk);
    ctx.strokeStyle = HAT.goldInk; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(0, -16.5); ctx.lineTo(0, -21.5); ctx.moveTo(-2.4, -19.2); ctx.lineTo(2.4, -19.2); ctx.stroke();
    ctx.strokeStyle = HAT.gold; ctx.lineWidth = 1.1; ctx.stroke();
  } else if (kind === 'q') {
    shape(ctx, [[-7.5, -6.5], [-6.5, -10.5], [6.5, -10.5], [7.5, -6.5]], HAT.gold, HAT.goldInk);
    for (const [bx, by] of [[-6.5, -12], [-3.4, -14], [3.4, -14], [6.5, -12]]) { ctx.beginPath(); ctx.arc(bx, by, 1.6, 0, Math.PI * 2); ctx.fillStyle = HAT.gold; ctx.fill(); ctx.strokeStyle = HAT.goldInk; ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(0, -9.2); ctx.bezierCurveTo(-4.6, -12.6, -2.6, -17.4, 0, -14.6); ctx.bezierCurveTo(2.6, -17.4, 4.6, -12.6, 0, -9.2);
    ctx.fillStyle = HAT.gem; ctx.fill(); ctx.strokeStyle = HAT.goldInk; ctx.stroke();
  } else if (kind === 'r') {
    shape(ctx, [[-6.5, -6.5], [-6.5, -16.5], [-3.8, -16.5], [-3.8, -13.8], [-1.3, -13.8], [-1.3, -16.5], [1.3, -16.5], [1.3, -13.8], [3.8, -13.8], [3.8, -16.5], [6.5, -16.5], [6.5, -6.5]], HAT.stone, HAT.stoneInk);
    ctx.strokeStyle = HAT.stoneInk; ctx.beginPath(); ctx.moveTo(-6.5, -10.5); ctx.lineTo(6.5, -10.5); ctx.stroke();
  } else if (kind === 'b') {
    ctx.beginPath(); ctx.moveTo(-6.5, -6); ctx.quadraticCurveTo(-6, -15, 0, -19); ctx.quadraticCurveTo(6, -15, 6.5, -6); ctx.closePath();
    ctx.fillStyle = HAT.mint; ctx.fill(); ctx.strokeStyle = HAT.mintInk; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(2.4, -15.5); ctx.lineTo(-1.6, -9.5); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, -20.2, 1.8, 0, Math.PI * 2); ctx.fillStyle = '#fff6fb'; ctx.fill(); ctx.stroke();
  } else if (kind === 'n') {
    ctx.beginPath(); ctx.moveTo(-10, -1.5); ctx.ellipse(0, -1.5, 10, 11.5, 0, Math.PI, Math.PI * 2); ctx.closePath();
    ctx.fillStyle = HAT.steel; ctx.fill(); ctx.strokeStyle = HAT.steelInk; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-8.5, -4.6); ctx.lineTo(8.5, -4.6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -13); ctx.bezierCurveTo(-3, -21, -10, -21.5, -13, -16); ctx.bezierCurveTo(-8.5, -17.6, -4.5, -15.6, -2.2, -11.8); ctx.closePath();
    ctx.fillStyle = HAT.plume; ctx.fill(); ctx.strokeStyle = '#b4527a'; ctx.stroke();
  }
  ctx.restore();
}
function cornerFocus(ctx, x, y, color) {
  rounded(ctx, x + 1, y + 1, 10, 3, 1.5, color); rounded(ctx, x + 1, y + 1, 3, 10, 1.5, color);
  rounded(ctx, x + CELL - 11, y + 1, 10, 3, 1.5, color); rounded(ctx, x + CELL - 4, y + 1, 3, 10, 1.5, color);
  rounded(ctx, x + 1, y + CELL - 4, 10, 3, 1.5, color); rounded(ctx, x + 1, y + CELL - 11, 3, 10, 1.5, color);
  rounded(ctx, x + CELL - 11, y + CELL - 4, 10, 3, 1.5, color); rounded(ctx, x + CELL - 4, y + CELL - 11, 3, 10, 1.5, color);
}
function overlay(ctx, message, sub, accent = '#ffb3cf') {
  ctx.fillStyle = '#1a1220b8'; ctx.fillRect(0, 53, W, H - 53);
  rounded(ctx, 37, 170, 286, 104, 14, accent);
  rounded(ctx, 39, 172, 282, 100, 12, '#2a1d31');
  drawTxt(ctx, message, 180, 214, 22, '#fff0f5', 'center'); drawTxt(ctx, sub, 180, 238, 11, '#ead5e4', 'center');
  drawTxt(ctx, 'PRESS PLAY FOR A REMATCH', 180, 259, 9, '#ffd98c', 'center');
}
const LEVEL_NAMES = Object.freeze({ chill: 'CHILL GABU', normal: 'NORMAL GABU', hard: 'HARD GABU' });
const ENDINGS = Object.freeze({
  checkmate: { win: ['CATMATE!', 'Gabu’s king has nowhere left to nap.'], loss: ['GABU WINS', 'Your king got boxed in. Rematch?'] },
  stalemate: ['STALEMATE', 'Nobody can move. Nobody is happy.'],
  fifty: ['DRAW', 'Fifty quiet moves. Gabu fell asleep.'],
  material: ['DRAW', 'Not enough kittens left to finish it.'],
});
export function drawChess(canvas, game, { best = 0, images = {}, cursor = -1, reduced = false, time = 0 } = {}) {
  if (!canvas?.getContext) return; const ctx = canvas.getContext('2d'); if (!ctx) return;
  ctx.save(); ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
  const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#2b1831'); bg.addColorStop(1, '#1a1324'); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 14; i++) { ctx.fillStyle = i % 3 ? '#ffc8e014' : '#fff3c722'; ctx.fillRect((i * 71 + 13) % W, (i * 109 + 23) % H, 2, 2); }
  drawChessPiece(ctx, 'K', 26, 24, 24);
  drawTxt(ctx, 'CATMATE', 42, 31, 12, '#ffe6ef');
  drawTxt(ctx, `SCORE ${game.score}`, 170, 31, 11, '#fdfaf7', 'center');
  drawTxt(ctx, `BEST ${Math.max(best, game.score)}`, 342, 31, 11, '#ead4c4', 'right');
  rounded(ctx, 20, 45, 320, 1, 0, '#4a3546');
  rounded(ctx, X - 6, Y - 6, CELL * 8 + 12, CELL * 8 + 12, 14, '#c77d9d');
  rounded(ctx, X - 4, Y - 4, CELL * 8 + 8, CELL * 8 + 8, 12, '#ffd7e6');
  const board = game.board, checked = game.status !== 'idle' && inCheck(game.pos) ? kingSquare(board, game.pos.turn) : -1;
  const moves = game.status === 'playing' ? game.targets() : [];
  const last = game.lastMove;
  for (let sq = 0; sq < 64; sq++) {
    const x = X + (sq & 7) * CELL, y = Y + (sq >> 3) * CELL, light = ((sq & 7) + (sq >> 3)) % 2 === 0;
    ctx.fillStyle = light ? '#fff0f5' : '#f0b4cc'; ctx.fillRect(x, y, CELL, CELL);
    if (last && (sq === last.from || sq === last.to)) { ctx.globalAlpha = .5; ctx.fillStyle = '#ffe08a'; ctx.fillRect(x, y, CELL, CELL); ctx.globalAlpha = 1; }
    if (sq === game.selected) { ctx.globalAlpha = .55; ctx.fillStyle = '#8df0ec'; ctx.fillRect(x, y, CELL, CELL); ctx.globalAlpha = 1; }
    if (sq === checked) {
      const pulse = reduced ? .7 : .55 + .25 * Math.sin(time * 7);
      const glow = ctx.createRadialGradient(x + CELL / 2, y + CELL / 2, 2, x + CELL / 2, y + CELL / 2, CELL * .7);
      glow.addColorStop(0, `rgba(255,77,121,${pulse})`); glow.addColorStop(1, 'rgba(255,77,121,0)'); ctx.fillStyle = glow; ctx.fillRect(x, y, CELL, CELL);
    }
  }
  // A soft inner rim keeps the board plush instead of a hard-edged grid.
  ctx.strokeStyle = '#ffd7e6'; ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(X - 2, Y - 2, CELL * 8 + 4, CELL * 8 + 4, 10); ctx.stroke();
  for (let sq = 0; sq < 64; sq++) drawChessPiece(ctx, board[sq], X + (sq & 7) * CELL + CELL / 2, Y + (sq >> 3) * CELL + CELL / 2, CELL);
  for (const move of moves) {
    const x = X + (move.to & 7) * CELL, y = Y + (move.to >> 3) * CELL;
    if (move.captured) { ctx.strokeStyle = '#ff5d93'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.roundRect(x + 2.5, y + 2.5, CELL - 5, CELL - 5, 9); ctx.stroke(); }
    else { ctx.globalAlpha = .62; paw(ctx, x + CELL / 2, y + CELL / 2 + 1, '#b9507f', 1); ctx.globalAlpha = 1; }
  }
  if (cursor >= 0 && cursor < 64) cornerFocus(ctx, X + (cursor & 7) * CELL, Y + (cursor >> 3) * CELL, '#5fd8d2');
  const thinking = game.status === 'playing' && game.pos.turn === 'b';
  const dots = reduced ? '...' : '.'.repeat(1 + Math.floor(time * 3) % 3);
  if (thinking) drawSprite(ctx, images.gabu_smug, 18, 394, 20, 20);
  else drawChessPiece(ctx, 'K', 28, 405, 22);
  drawTxt(ctx, game.status === 'dead' ? 'GAME OVER' : thinking ? `GABU IS THINKING${dots}` : checked >= 0 ? 'CHECK! SAVE YOUR KING' : 'YOUR MOVE',
    44, 409, 11, checked >= 0 && !thinking ? '#ff9fbd' : '#fdf2f7');
  drawTxt(ctx, `${LEVEL_NAMES[game.level] || 'GABU'}  ·  MOVE ${game.pos.fullmove}`, 342, 409, 10, '#d8bfd0', 'right');
  drawTxt(ctx, game.status === 'dead' ? 'UNDO TAKES IT BACK  ·  PLAY FOR A REMATCH' : 'TAP A KITTEN, THEN A GLOWING PAW  ·  Z UNDOES', 180, 436, 9, '#bfa9c4', 'center');
  if (game.status === 'dead') {
    const ending = ENDINGS[game.reason] || ENDINGS.stalemate;
    const [title, sub] = Array.isArray(ending) ? ending : ending[game.result] || ending.loss;
    overlay(ctx, title, sub, game.result === 'win' ? '#ffd36e' : game.result === 'loss' ? '#ff8fb8' : '#b8a7ff');
  } else if (game.status === 'paused') overlay(ctx, 'PAUSED', 'Gabu promises not to touch the pieces.', '#b8a7ff');
  else if (game.status === 'idle') {
    rounded(ctx, 66, 196, 228, 58, 12, '#ffb3cf'); rounded(ctx, 68, 198, 224, 54, 10, '#2a1d31');
    drawTxt(ctx, 'YOU PLAY THE CREAM KITTENS', 180, 222, 12, '#fff0f5', 'center');
    drawTxt(ctx, 'PRESS PLAY OR TAP TO START', 180, 240, 9, '#ffd98c', 'center');
  }
  ctx.restore();
}
