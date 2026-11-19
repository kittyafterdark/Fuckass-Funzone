/** Cake Tower canvas: a bakery sky that climbs into the stars, frosted tiers, and a ribbon crane. */
import { CAKE_W, CAKE_H, CAKE_GROUND, LAYER_W, LAYER_H, PLATE_W, ROPE_PIVOT_Y } from './cake.js';

const FLAVOR_ART = Object.freeze({
  strawberry: { sponge: '#ffb7c9', crumb: '#f593ad', frost: '#fff4f7', drip: '#ff7aa2', sprinkle: ['#ff5d8f', '#ffffff', '#ffd36e'] },
  vanilla: { sponge: '#ffe7b3', crumb: '#f5d08a', frost: '#fffaf0', drip: '#ffe9a8', sprinkle: ['#ff8fb8', '#8fd8ff', '#b8f2a8'] },
  matcha: { sponge: '#bfe3a4', crumb: '#9fcf82', frost: '#f6fff0', drip: '#8fca75', sprinkle: ['#ffffff', '#ffb7c9', '#6e9e57'] },
  chocolate: { sponge: '#9b6a55', crumb: '#7f5240', frost: '#ffe9f1', drip: '#5c3527', sprinkle: ['#ff8fb8', '#ffd36e', '#8fd8ff'] },
  blueberry: { sponge: '#b9c3ff', crumb: '#9aa6f2', frost: '#f6f4ff', drip: '#7f8cf0', sprinkle: ['#ffffff', '#ff8fb8', '#5a64c8'] },
  lemon: { sponge: '#fff0a1', crumb: '#f2db6e', frost: '#fffef2', drip: '#ffe066', sprinkle: ['#ff8fb8', '#9fe6d6', '#ffffff'] },
  ube: { sponge: '#d6b5f2', crumb: '#bf96e6', frost: '#fbf5ff', drip: '#a979dc', sprinkle: ['#ffd36e', '#ffffff', '#ff8fb8'] },
});
const rounded = (ctx, x, y, w, h, r, fill) => { ctx.fillStyle = fill; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); };
const drawTxt = (ctx, t, x, y, size, color = '#fbf3ef', align = 'left') => {
  ctx.font = `800 ${size}px ui-sans-serif,system-ui,sans-serif`; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.fillText(String(t), x, y); ctx.textAlign = 'left';
};
const drawSprite = (ctx, img, x, y, w, h) => { if (!img?.complete || !img.naturalWidth) return false; ctx.drawImage(img, x, y, w, h); return true; };
const mix = (a, b, t) => {
  const pa = [1, 3, 5].map(i => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map(i => parseInt(b.slice(i, i + 2), 16));
  return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join('');
};
// Sky keys by camera height: bakery morning, peach sunset, lavender dusk, then a starry night.
const SKY = [[0, '#ffd6e5', '#fff1e6'], [700, '#ffb38f', '#ffd9c2'], [1500, '#8e72c9', '#d59ad6'], [2400, '#1f1840', '#3c2c6b']];
function skyAt(height) {
  for (let i = 1; i < SKY.length; i++) if (height < SKY[i][0]) {
    const t = (height - SKY[i - 1][0]) / (SKY[i][0] - SKY[i - 1][0]);
    return [mix(SKY[i - 1][1], SKY[i][1], t), mix(SKY[i - 1][2], SKY[i][2], t), Math.max(0, (height - 1500) / 900)];
  }
  return [SKY[SKY.length - 1][1], SKY[SKY.length - 1][2], 1];
}
/** One frosted tier. `bottom` is its lower screen edge; index seeds its sprinkles and toppings. */
export function drawCakeTier(ctx, flavor, cx, bottom, index = 0, angle = 0) {
  const art = FLAVOR_ART[flavor] || FLAVOR_ART.vanilla, x = -LAYER_W / 2, y = -LAYER_H;
  ctx.save(); ctx.translate(cx, bottom); if (angle) ctx.rotate(angle);
  rounded(ctx, x, y, LAYER_W, LAYER_H, 7, art.sponge);
  ctx.fillStyle = art.crumb; ctx.fillRect(x + 4, y + LAYER_H - 7, LAYER_W - 8, 3);
  ctx.beginPath(); ctx.moveTo(x, y + 7); ctx.quadraticCurveTo(x, y, x + 7, y); ctx.lineTo(x + LAYER_W - 7, y); ctx.quadraticCurveTo(x + LAYER_W, y, x + LAYER_W, y + 7);
  for (let i = 0; i <= 8; i++) {
    const dx = x + LAYER_W - i * (LAYER_W / 8), long = (i + index) % 3 === 0;
    ctx.lineTo(dx, y + (long ? 14 : 9)); if (i < 8) ctx.quadraticCurveTo(dx - LAYER_W / 16, y + 6, dx - LAYER_W / 8, y + ((i + 1 + index) % 3 === 0 ? 14 : 9));
  }
  ctx.closePath(); ctx.fillStyle = art.frost; ctx.fill();
  ctx.fillStyle = art.drip; ctx.globalAlpha = .55; ctx.fillRect(x + 6, y + 2, LAYER_W - 12, 2); ctx.globalAlpha = 1;
  for (let i = 0; i < 7; i++) {
    const sx = x + 10 + ((i * 37 + index * 23) % (LAYER_W - 20)), sy = y + 3 + ((i * 13 + index * 7) % 4);
    ctx.save(); ctx.translate(sx, sy); ctx.rotate((i + index) * .9); rounded(ctx, -2.5, -.9, 5, 1.8, .9, art.sprinkle[i % 3]); ctx.restore();
  }
  ctx.strokeStyle = '#00000022'; ctx.lineWidth = 1; ctx.beginPath(); ctx.roundRect(x + .5, y + .5, LAYER_W - 1, LAYER_H - 1, 7); ctx.stroke();
  ctx.restore();
}
function strawberry(ctx, x, y) {
  ctx.beginPath(); ctx.moveTo(x, y + 7); ctx.bezierCurveTo(x - 7, y + 1, x - 5, y - 5, x, y - 4); ctx.bezierCurveTo(x + 5, y - 5, x + 7, y + 1, x, y + 7);
  ctx.fillStyle = '#ff4f7b'; ctx.fill(); ctx.fillStyle = '#7fd36b'; ctx.beginPath(); ctx.ellipse(x, y - 5, 4, 1.8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffe9a8'; for (const [dx, dy] of [[-2, 0], [2, 1], [0, 3]]) ctx.fillRect(x + dx, y + dy, 1, 1);
}
function candle(ctx, x, y, t) {
  rounded(ctx, x - 2.5, y - 16, 5, 16, 2, '#9fe6d6'); ctx.fillStyle = '#ffffff'; for (let i = 0; i < 3; i++) ctx.fillRect(x - 2.5, y - 14 + i * 5, 5, 1.5);
  ctx.beginPath(); ctx.ellipse(x, y - 21 + Math.sin(t * 12) * .6, 2.6, 4.6, 0, 0, Math.PI * 2); ctx.fillStyle = '#ffd36e'; ctx.fill();
  ctx.beginPath(); ctx.ellipse(x, y - 20, 1.2, 2.4, 0, 0, Math.PI * 2); ctx.fillStyle = '#fff6d6'; ctx.fill();
}
function heartShape(ctx, x, y, s, fill) {
  ctx.beginPath(); ctx.moveTo(x, y + s * .9); ctx.bezierCurveTo(x - s * 1.4, y - s * .1, x - s * .6, y - s * 1.1, x, y - s * .35);
  ctx.bezierCurveTo(x + s * .6, y - s * 1.1, x + s * 1.4, y - s * .1, x, y + s * .9); ctx.fillStyle = fill; ctx.fill();
}
export function drawCakeTower(canvas, game, { best = 0, images = {}, reduced = false, time = 0 } = {}) {
  if (!canvas?.getContext) return; const ctx = canvas.getContext('2d'); if (!ctx) return;
  ctx.save(); ctx.setTransform(canvas.width / CAKE_W, 0, 0, canvas.height / CAKE_H, 0, 0);
  const cam = game.camera, screen = worldY => CAKE_GROUND - worldY + cam;
  const [top, bottom, night] = skyAt(cam);
  const sky = ctx.createLinearGradient(0, 0, 0, CAKE_H); sky.addColorStop(0, top); sky.addColorStop(1, bottom); ctx.fillStyle = sky; ctx.fillRect(0, 0, CAKE_W, CAKE_H);
  if (night > 0) for (let i = 0; i < 26; i++) {
    ctx.globalAlpha = night * (.4 + (i % 3) * .2); ctx.fillStyle = '#fff6d6';
    ctx.fillRect((i * 61 + 17) % CAKE_W, ((i * 89 + 11) + cam * .2) % CAKE_H, i % 4 ? 2 : 3, i % 4 ? 2 : 3);
  }
  ctx.globalAlpha = .55 * (1 - night);
  for (let i = 0; i < 4; i++) {
    const cx = ((i * 131 + 40) + (reduced ? 0 : time * 8)) % (CAKE_W + 120) - 60, cy = ((i * 173 + 90) + cam * .45) % (CAKE_H + 80) - 40;
    rounded(ctx, cx - 30, cy - 8, 70, 18, 9, '#ffffff'); rounded(ctx, cx - 10, cy - 18, 34, 22, 11, '#ffffff');
  }
  ctx.globalAlpha = 1;
  const ground = screen(0);
  if (ground < CAKE_H + 60) {
    for (let i = 0; i < 12; i++) { ctx.fillStyle = i % 2 ? '#ff9fbd' : '#fff4f7'; ctx.fillRect(i * 30, ground + 24, 30, CAKE_H); }
    ctx.fillStyle = '#e57a9f'; ctx.fillRect(0, ground + 22, CAKE_W, 4);
    rounded(ctx, CAKE_W / 2 - 14, ground + 2, 28, 22, 4, '#eaf6ff'); rounded(ctx, CAKE_W / 2 - 34, ground + 18, 68, 7, 3, '#d5ecfb');
    rounded(ctx, CAKE_W / 2 - PLATE_W / 2, ground - 4, PLATE_W, 8, 4, '#f4fbff'); ctx.strokeStyle = '#a9cde3'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.roundRect(CAKE_W / 2 - PLATE_W / 2, ground - 4, PLATE_W, 8, 4); ctx.stroke();
  }
  const shown = game.tiers.length;
  for (let i = 0; i < shown; i++) {
    const bottomY = screen(i * LAYER_H); if (bottomY - LAYER_H > CAKE_H || bottomY < -10) continue;
    drawCakeTier(ctx, game.tiers[i].flavor, game.tierX(i), bottomY, i);
    const tierNumber = i + 1;
    if (tierNumber % 10 === 0) candle(ctx, game.tierX(i), bottomY - LAYER_H + 1, time);
    else if (tierNumber % 5 === 0) for (const dx of [-34, 0, 34]) strawberry(ctx, game.tierX(i) + dx, bottomY - LAYER_H - 3);
  }
  // Missed tiers tip around their middle as they fall away.
  for (const c of game.crumbs) { ctx.save(); ctx.translate(c.x, screen(c.y) - LAYER_H / 2); ctx.rotate(c.spin); drawCakeTier(ctx, c.flavor, 0, LAYER_H / 2, 3); ctx.restore(); }
  // Crane rail and ribbon. The ribbon hangs from a pivot above the screen and bows a little behind its swing, like a real rope.
  rounded(ctx, 0, 6, CAKE_W, 12, 0, '#ff9fbd'); for (let i = 0; i < 12; i++) rounded(ctx, i * 32 + 4, 9, 18, 6, 3, '#ffd1e1');
  const swinging = game.status !== 'dead' && game.phase === 'swing', hx = game.hookX(), hy = game.hookY();
  const along = (18 - ROPE_PIVOT_Y) / (hy - ROPE_PIVOT_Y), sx = CAKE_W / 2 + (hx - CAKE_W / 2) * along, bow = reduced ? 0 : -game.ropeSpeed() * 9;
  ctx.strokeStyle = '#d9578a'; ctx.lineWidth = 2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(sx, 18); ctx.quadraticCurveTo((sx + hx) / 2 + bow, (18 + hy) / 2, hx, hy); ctx.stroke();
  heartShape(ctx, hx, hy - 2, 6, '#ff6f9f');
  if (swinging) {
    const top = hy + 12, bottom = top + LAYER_H; // Matches where the engine releases the tier.
    ctx.strokeStyle = '#ff8fb8'; ctx.lineWidth = 1.6; ctx.beginPath();
    ctx.moveTo(hx, hy); ctx.lineTo(hx - LAYER_W / 2 + 10, top); ctx.moveTo(hx, hy); ctx.lineTo(hx + LAYER_W / 2 - 10, top); ctx.stroke();
    drawCakeTier(ctx, game.flavor, hx, bottom, game.tiers.length);
  }
  if (game.drop) drawCakeTier(ctx, game.drop.flavor, game.drop.x, screen(game.drop.y), game.tiers.length);
  if (game.perfectFlash > 0 && shown) {
    ctx.globalAlpha = Math.min(1, game.perfectFlash * 2); const py = screen(game.topY()) - 14;
    ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 6;
    drawTxt(ctx, game.combo >= 3 ? `PERFECT ×${game.combo}` : 'PERFECT!', game.topX(), py, 14, '#d63a72', 'center'); ctx.shadowBlur = 0; ctx.globalAlpha = 1;
  }
  rounded(ctx, 10, 26, 340, 40, 12, '#2a1d31'); // Opaque so the ribbon passes behind the scoreboard.
  ctx.save(); ctx.translate(28, 59); ctx.scale(.26, .5); drawCakeTier(ctx, 'vanilla', 0, 0, 2); ctx.restore();
  ctx.save(); ctx.translate(28, 46); ctx.scale(.19, .5); drawCakeTier(ctx, 'strawberry', 0, 0, 1); ctx.restore();
  strawberry(ctx, 28, 31);
  drawTxt(ctx, 'CAKE TOWER', 46, 44, 11, '#ffe6ef');
  drawTxt(ctx, `TIERS ${game.tiers.length}  ·  ${String(game.pace).toUpperCase()}`, 46, 59, 9, '#e8d2df');
  drawTxt(ctx, `SCORE ${game.score}`, 214, 44, 11, '#fdfaf7', 'right');
  drawTxt(ctx, `BEST ${Math.max(best, game.score)}`, 214, 59, 9, '#ead4c4', 'right');
  for (let n = 0; n < 3; n++) {
    const x = 266 + n * 26;
    ctx.globalAlpha = n < game.hearts ? 1 : .22;
    if (!drawSprite(ctx, images.heart, x - 11, 34, 22, 22)) heartShape(ctx, x, 45, 8, '#ff6f9f');
    ctx.globalAlpha = 1;
  }
  const warn = game.sway >= 24 && game.status === 'playing';
  drawTxt(ctx, warn ? 'IT’S WOBBLING. LAND A PERFECT ONE' : game.combo >= 2 ? `PERFECT STREAK ×${game.combo}` : 'TAP OR SPACE TO DROP THE TIER', 180, 440, 10,
    warn ? '#ff5d8f' : night > .5 ? '#f4e8ff' : '#7a3d5c', 'center');
  if (game.status === 'dead') overlay(ctx, 'OUT OF CAKE', `${game.tiers.length} tiers · best streak ${game.bestCombo}`, 'PRESS PLAY TO BAKE AGAIN', '#ff8fb8');
  else if (game.status === 'paused') overlay(ctx, 'PAUSED', 'The frosting is setting.', 'PRESS PLAY TO RESUME', '#b8a7ff');
  else if (game.status === 'idle') overlay(ctx, 'CAKE TOWER', 'Drop each tier right on top. Perfect ones steady it.', 'PRESS PLAY OR TAP TO START', '#ffd36e');
  ctx.restore();
}
function overlay(ctx, message, sub, hint, accent) {
  ctx.fillStyle = '#1a1220a0'; ctx.fillRect(0, 70, CAKE_W, CAKE_H - 70);
  rounded(ctx, 30, 176, 300, 104, 14, accent); rounded(ctx, 32, 178, 296, 100, 12, '#2a1d31');
  drawTxt(ctx, message, 180, 220, 22, '#fff0f5', 'center'); drawTxt(ctx, sub, 180, 244, 11, '#ead5e4', 'center');
  drawTxt(ctx, hint, 180, 265, 9, '#ffd98c', 'center');
}
