/** Gabu's Lockscreen canvas: his phone's face scan above the passcode prompt, with an on-screen keyboard that stays clear of his line. */
import { LOCK_LETTERS } from './lockscreen.js';

const W = 360, H = 452, KEY_W = 33, KEY_H = 30, GAP = 4, ROW_GAP = 5, KEYS_X = (W - (9 * KEY_W + 8 * GAP)) / 2, KEYS_Y = 270;
const rounded = (ctx, x, y, w, h, r, fill) => { ctx.fillStyle = fill; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); };
const drawTxt = (ctx, t, x, y, size, color = '#fbf3ef', align = 'left') => {
  ctx.font = `800 ${size}px ui-sans-serif,system-ui,sans-serif`; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.fillText(String(t), x, y); ctx.textAlign = 'left';
};
const PACE_NAMES = Object.freeze({ chill: 'CHILL', normal: 'NORMAL', hard: 'HARD' });
/** Where each letter key sits: three rows of nine, nine and eight. */
const keyRect = i => { const row = Math.floor(i / 9), col = i % 9, offset = row === 2 ? (KEY_W + GAP) / 2 : 0; return { x: KEYS_X + offset + col * (KEY_W + GAP), y: KEYS_Y + row * (KEY_H + ROW_GAP), w: KEY_W, h: KEY_H }; };
export const lockKeyAt = (x, y) => {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return -1;
  for (let i = 0; i < LOCK_LETTERS.length; i++) { const k = keyRect(i); if (x >= k.x && x < k.x + k.w && y >= k.y && y < k.y + k.h) return i; }
  return -1;
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
/** Gabu's phone and its face scan. Each wrong guess turns one ring segment red and pulls the scanner brackets in;
 * when the scan locks on, the screen turns red and his eyes glare back at you. */
function faceScan(ctx, misses, max, locked, flash) {
  const cx = 180, cy = 136, closing = Math.min(1, misses / max);
  rounded(ctx, 124, 72, 112, 136, 18, locked ? '#ff3b6b' : '#3a2f55'); rounded(ctx, 127, 75, 106, 130, 16, locked ? '#2a0f1f' : '#120f20');
  rounded(ctx, 166, 80, 28, 4, 2, '#00000066');
  drawTxt(ctx, locked ? 'INTRUDER' : 'FACE SCAN', cx, 98, 8, locked ? '#ff8fb8' : '#8fa3c7', 'center');
  // The ring: one segment per guess allowed, red for each one used.
  const seg = Math.PI * 2 / max;
  ctx.lineWidth = 4; ctx.lineCap = 'round';
  for (let i = 0; i < max; i++) {
    const a = -Math.PI / 2 + i * seg + .12;
    ctx.strokeStyle = i < misses ? '#ff5d8f' : '#ffffff1f'; ctx.beginPath(); ctx.arc(cx, cy, 34, a, a + seg - .24); ctx.stroke();
  }
  // Scanner brackets close in on the face as the misses add up.
  const d = 28 - closing * 10, arm = 7;
  ctx.strokeStyle = locked ? '#ff3b6b' : misses ? '#ffb15c' : '#5fd8d2'; ctx.lineWidth = 2;
  for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    const x = cx + sx * d, y = cy + sy * d;
    ctx.beginPath(); ctx.moveTo(x, y - sy * arm); ctx.lineTo(x, y); ctx.lineTo(x - sx * arm, y); ctx.stroke();
  }
  if (locked) gabuEyes(ctx, cx, cy - 2, 9, 6.5);
  else {
    // An empty face outline waiting to be matched, with a sweep line while a guess lands.
    ctx.strokeStyle = '#8fa3c766'; ctx.lineWidth = 1.4; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.ellipse(cx, cy - 2, 13, 16, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    if (flash && !flash.hit) { ctx.save(); ctx.globalAlpha = 1 - flash.age / .6; rounded(ctx, cx - d, cy - d + (flash.age / .6) * d * 2, d * 2, 2, 1, '#ff5d8f'); ctx.restore(); }
  }
  drawTxt(ctx, locked ? 'LOCKED OUT' : `${Math.max(0, max - misses)} ${max - misses === 1 ? 'TRY' : 'TRIES'} LEFT`, cx, 194, 8, locked ? '#ff8fb8' : '#cfc4ea', 'center');
}
function overlay(ctx, message, sub, hint, accent) {
  ctx.fillStyle = '#120e1ca8'; ctx.fillRect(0, 53, W, H - 53);
  rounded(ctx, 30, 176, 300, 104, 14, accent); rounded(ctx, 32, 178, 296, 100, 12, '#211a33');
  drawTxt(ctx, message, 180, 220, 22, '#fff0f5', 'center'); drawTxt(ctx, sub, 180, 244, 11, '#ead5e4', 'center');
  drawTxt(ctx, hint, 180, 265, 9, '#ffd98c', 'center');
}
function padlock(ctx, x, y, s) {
  ctx.save(); ctx.strokeStyle = '#8fe8ff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y - s * .2, s * .32, Math.PI, 0); ctx.stroke();
  rounded(ctx, x - s * .45, y - s * .2, s * .9, s * .7, 3, '#e75aa8'); rounded(ctx, x - 1.2, y + s * .02, 2.4, s * .26, 1, '#1a1528'); ctx.restore();
}
export function drawLockscreen(canvas, game, { best = 0, cursor = false, reduced = false } = {}) {
  if (!canvas?.getContext) return; const ctx = canvas.getContext('2d'); if (!ctx) return;
  ctx.save(); ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
  const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#1f1733'); bg.addColorStop(1, '#0f0c18'); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 14; i++) { ctx.fillStyle = i % 3 ? '#8fe8ff12' : '#ff8fb81c'; ctx.fillRect((i * 71 + 13) % W, (i * 109 + 23) % H, 2, 2); }
  padlock(ctx, 26, 27, 16);
  drawTxt(ctx, 'GABU’S LOCKSCREEN', 42, 31, 11, '#ffe6ef');
  drawTxt(ctx, `SCORE ${game.score}`, 232, 31, 11, '#fdfaf7', 'center');
  drawTxt(ctx, `BEST ${Math.max(best, game.score)}`, 342, 31, 11, '#ead4c4', 'right');
  rounded(ctx, 20, 45, 320, 1, 0, '#4a3546');
  const max = game.rules.misses, misses = Math.min(game.misses, max), caught = game.result === 'caught';
  drawTxt(ctx, game.rules.hint || game.phase === 'over' ? game.category : 'CATEGORY HIDDEN', 20, 66, 10, '#8fe8ff');
  drawTxt(ctx, `CRACKED ${game.cracked}  ·  ${PACE_NAMES[game.pace] || 'NORMAL'}`, 340, 66, 9, '#cfc4ea', 'right');
  // Gabu's phone. Its face scan tightens with every wrong guess.
  faceScan(ctx, misses, max, caught, reduced ? null : game.flash);
  // The passcode: one slot per letter, revealed as you find them. A lockout shows what it was.
  const word = game.word, n = word.length, slot = Math.min(24, 316 / n), x0 = 180 - slot * n / 2;
  for (let i = 0; i < n; i++) {
    const ch = word[i], known = game.guessed.includes(ch), x = x0 + i * slot;
    rounded(ctx, x + 2, 252, slot - 4, 2.5, 1, known ? '#8fe8ff' : '#ffffff55');
    if (known || caught) drawTxt(ctx, ch, x + slot / 2, 247, Math.min(18, slot * .8), known ? '#fff4fa' : '#ff8fb8', 'center');
  }
  // The keyboard. Found letters go cyan, wrong ones pink and dim.
  const flash = game.flash, pulse = flash && !reduced ? 1 - flash.age / .6 : 0;
  for (let i = 0; i < LOCK_LETTERS.length; i++) {
    const k = keyRect(i), ch = LOCK_LETTERS[i], used = game.guessed.includes(ch), hit = used && word.includes(ch);
    rounded(ctx, k.x, k.y, k.w, k.h, 7, used ? (hit ? '#1d4a57' : '#3a1a2e') : '#2c2342');
    if (flash?.letter === ch && pulse > 0) { ctx.save(); ctx.globalAlpha = pulse * .6; rounded(ctx, k.x, k.y, k.w, k.h, 7, flash.hit ? '#8fe8ff' : '#ff5d8f'); ctx.restore(); }
    drawTxt(ctx, ch, k.x + k.w / 2, k.y + 20, 13, used ? (hit ? '#8fe8ff' : '#ff8fb866') : '#f4e8ff', 'center');
    if (cursor && game.status === 'playing' && game.phase === 'guess' && i === game.cursor) { ctx.strokeStyle = '#5fd8d2'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(k.x - 1, k.y - 1, k.w + 2, k.h + 2, 8); ctx.stroke(); }
  }
  drawTxt(ctx, game.left === 1 && game.phase === 'guess' ? 'ONE MORE MISS AND THE SCAN LOCKS ON' : 'TAP OR TYPE A LETTER', 180, 413, 9, game.left === 1 && game.phase === 'guess' ? '#ff8fb8' : '#bfb3d8', 'center');
  drawTxt(ctx, 'ARROWS + ENTER ALSO PICK A KEY', 180, 427, 8, '#a99bc2', 'center');
  if (game.status === 'playing' && game.phase === 'over') {
    rounded(ctx, 50, 96, 260, 60, 12, '#8fe8ff'); rounded(ctx, 52, 98, 256, 56, 10, '#1d1830');
    drawTxt(ctx, 'ACCESS GRANTED', 180, 118, 16, '#fff0f5', 'center'); drawTxt(ctx, `+${game.earned} points`, 180, 134, 10, '#ead5e4', 'center');
    drawTxt(ctx, 'TAP FOR THE NEXT PASSCODE', 180, 147, 8, '#ffd98c', 'center');
  }
  if (game.status === 'dead') {
    // Locked out: the card covers only the keyboard, so the locked scan and the revealed passcode stay in view.
    ctx.fillStyle = '#120e1cc0'; ctx.fillRect(0, KEYS_Y - 6, W, 3 * KEY_H + 2 * ROW_GAP + 12);
    rounded(ctx, 30, 272, 300, 96, 14, '#ff5d8f'); rounded(ctx, 32, 274, 296, 92, 12, '#211a33');
    drawTxt(ctx, 'LOCKED OUT', 180, 304, 20, '#fff0f5', 'center');
    drawTxt(ctx, `${game.cracked} ${game.cracked === 1 ? 'passcode' : 'passcodes'} cracked · ${game.score} points`, 180, 326, 11, '#ead5e4', 'center');
    drawTxt(ctx, 'PRESS PLAY FOR A NEW RUN', 180, 348, 9, '#ffd98c', 'center');
  } else if (game.status === 'paused') overlay(ctx, 'PAUSED', 'Gabu swears he isn’t changing his passcode.', 'PRESS PLAY TO RESUME', '#b8a7ff');
  else if (game.status === 'idle') overlay(ctx, 'GABU’S LOCKSCREEN', 'Guess his passcode before his face scan locks on.', 'PRESS PLAY OR TAP TO UNLOCK', '#8fe8ff');
  ctx.restore();
}
