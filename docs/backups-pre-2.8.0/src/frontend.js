/** Bird Brain · Lumiverse Spindle frontend (zero runtime dependencies)
 * Built from source by scripts/build.mjs; images and CSS are embedded into dist.
 */
import { ArcadeEngine, WORLD, MODE, DEFAULT_SETTINGS, sanitizeSettings, lifecycleTransition, gabiFlightFrame } from './engine.js';
import { SnakeGame, Merge2048 } from './puzzles.js';
import { drawSnake, drawMerge } from './puzzle-render.js';
import { Match3Game, MATCH_WIDTHS, MATCH_ROWS } from './match3.js';
import { drawMatch3, matchCellAt } from './match3-render.js';
import { ReactionDirector } from './reactions.js';
import { PlinkoGame } from './plinko.js';
import { drawPlinko } from './plinko-render.js';
import { milestonePayout, creditTickets } from './rewards.js';
import { SimonGame, DuckGame, SlotGame } from './mini-games.js';
import { drawSimon, drawDuck, drawSlots, simonCell } from './mini-games-render.js';
import { SHOP_CATALOG, SHOP_SLOTS, restoreShop, purchaseReward, equipReward } from './shop.js';
import { TetrisGame } from './tetris.js';
import { drawTetris, tetrisControlAt } from './tetris-render.js';
import { SolitaireGame } from './solitaire.js';
import { drawSolitaire, solitaireHitAt } from './solitaire-render.js';
import { FroggyGame } from './froggy.js';
import { drawFroggy, froggyControlAt } from './froggy-render.js';
import { ChessGame, CHESS_LEVELS } from './chess.js';
import { drawChess, chessSquareAt } from './chess-render.js';
import { BerryDropGame, BERRY_COLS } from './connect.js';
import { drawBerryDrop, berryColumnAt } from './connect-render.js';
import { TicTacTreatsGame } from './tictac.js';
import { drawTicTacTreats, tictacCellAt } from './tictac-render.js';
import { CakeTowerGame, CAKE_PACES } from './cake.js';
import { drawCakeTower } from './cake-render.js';
import { BubbleGame, BUBBLE_PACES } from './bubble.js';
import { drawBubbleBloom } from './bubble-render.js';
import { BoopGame, BOOP_PACES } from './boop.js';
import { drawBoopABun, boopHoleAt } from './boop-render.js';
import { WobblyWafersGame } from './wafer.js';
import { drawWobblyWafers, waferAt } from './wafer-render.js';
import { GachaMatchGame, MEMORY_SIZES } from './memory.js';
import { drawGachaMatch, capsuleAt } from './memory-render.js';

const ASSETS = /* BUILD_ASSETS */ {};
const CSS = /* BUILD_CSS */ '';
const FUNZONE_TAB_SVG = /* BUILD_TAB_SVG */ '';
const GAME_ROSTER = Object.freeze([
 ['bird','Fuckass Bird','bird_flap_0'],['gabi','Gabi Jetpack','gabi_fly_0'],
 ['snake','Snake','snake_head'],['2048','2048','merge_tile'],
 ['match3','Trinket Panic','match_vec_cat'],['plinko','Plinko','plinko_app'],
 ['simon','Simon Says','simon_app'],['duck','Duck Hunt','duck_app'],['slots','Gabu Slots','slots_app'],
 ['tetris','Tetris','tetris_app'],['solitaire','Solitaire','solitaire_app'],['froggy','Froggy','froggy_app'],
 ['chess','Catmate Chess','chess_app'],['berry','Berry Drop','berry_app'],['tictac','Tic Tac Treats','treats_app'],
 ['cake','Cake Tower','cake_app'],['bubble','Bubble Bloom','bubble_app'],['boop','Boop-a-Bun','boop_app'],
 ['wafer','Wobbly Wafers','wafer_app'],['memory','Gacha Match','memory_app']
]);
/** Gabu opponents and pace presets share one vocabulary across the newer board and toy games. */
const GABU_LEVELS = Object.freeze([['chill','Chill'],['normal','Normal'],['hard','Hard · no mercy']]);
// Each pace label names what actually changes in that game.
const TOY_PACES = Object.freeze({
 cake:[['chill','Chill · slow'],['normal','Normal'],['chaos','Chaos · fast']],
 bubble:[['chill','Chill · fewer colors'],['normal','Normal'],['chaos','Chaos · more colors']],
 boop:[['chill','Chill · slow'],['normal','Normal'],['chaos','Chaos · fast']],
});
const GAME_IDS = GAME_ROSTER.map(([id])=>id);

/** Every HUD icon is a real SVG shape or PNG. No emoji, ASCII pseudo-icons, or icon fonts. */
const ICON_PATHS = Object.freeze({
  close:['M18 6 6 18','m6 6 12 12'],
  play:['M8 5v14l11-7z'],
  pause:['M8 5v14','M16 5v14'],
  restart:['M3 12a9 9 0 1 0 3-6.7','M3 3v6h6'],
  volume:['M11 5 6 9H3v6h3l5 4z','M15.5 8.5a5 5 0 0 1 0 7','M18 5a9 9 0 0 1 0 14'],
  mute:['M11 5 6 9H3v6h3l5 4z','M16 9l5 6','m21 9-5 6'],
  undo:['M9 14 4 9l5-5','M4 9h10a6 6 0 0 1 0 12h-2'],
  settings:['M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7','M19.4 15l1.3 2.2-2.5 2.5L16 18.4l-2 .8-.6 2.8h-3l-.6-2.8-2-.8-2.2 1.3-2.5-2.5L4.4 15l-.8-2 .8-2-1.3-2.2L5.6 6.3 7.8 7.6l2-.8.6-2.8h3l.6 2.8 2 .8 2.2-1.3 2.5 2.5L19.4 11l.8 2z'],
  trophy:['M8 4h8v7a4 4 0 0 1-8 0z','M8 6H5v3a3 3 0 0 0 3 3','M16 6h3v3a3 3 0 0 1-3 3','M12 15v5','M8 20h8'],
  arrow:['M5 12h14','m13 6 6 6-6 6'],
  phone:['M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z','M11 18h2','M8 5h8'],
  grid:['M3 3h7v7H3z','M14 3h7v7h-7z','M3 14h7v7H3z','M14 14h7v7h-7z'],
  chevron:['m6 9 6 6 6-6'],
  gift:['M3 10h18v11H3z','M2 7h20v4H2z','M12 7v14','M12 7C7 7 5 5 6 3c1-3 6 0 6 4','M12 7c5 0 7-2 6-4-1-3-6 0-6 4'],
});
function svgIcon(name,size=16) {
  const ns='http://www.w3.org/2000/svg';const svg=document.createElementNS(ns,'svg');
  for(const [k,v] of Object.entries({viewBox:'0 0 24 24',width:String(size),height:String(size),fill:'none',stroke:'currentColor','stroke-width':'2','stroke-linecap':'round','stroke-linejoin':'round','aria-hidden':'true'}))svg.setAttribute(k,v);
  for(const d of ICON_PATHS[name]||ICON_PATHS.play){const path=document.createElementNS(ns,'path');path.setAttribute('d',d);svg.append(path);}
  return svg;
}
function setIconLabel(el,iconName,label) {
  el.replaceChildren(svgIcon(iconName),create('span','',label));
  el.setAttribute('aria-label',label);
}
function setImageLabel(el,assetName,label){
  el.replaceChildren(image(assetName,'bb-tab-art'),create('span','',label));el.setAttribute('aria-label',label);
}
const GRADIENTS = {
  bird: { sky1: '#49b8ed', sky2: '#8ddffd', skyline: '#6ba5d6', floor: '#6baf62', pipe: '#83d862', light: '#d7ff84', edge: '#286b4e', glow: '#f3e678', tint: '#1e4b5f' },
  gabi: { sky1: '#302362', sky2: '#6846a6', skyline: '#42356e', floor: '#353154', pipe: '#552b66', light: '#ff8bab', edge: '#27183c', glow: '#fcaed7', tint: '#fff2fa' },
};

function create(tag, className = '', text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = String(text);
  return el;
}
function button(className, label, action, title = label) {
  const el = create('button', className, label);
  el.type = 'button'; el.title = title;
  el.addEventListener('click', action);
  return el;
}
function image(name, className = '') {
  const img = create('img', className);
  img.src = ASSETS[name] || '';
  img.alt = '';
  img.draggable = false;
  return img;
}
function safeLoad(key, fallback) {
  try { const raw = localStorage.getItem(key); return raw === null ? fallback : JSON.parse(raw); }
  catch { return fallback; }
}
function safeSave(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode / quota */ }
}
function writeStyle(target) {
  const style = create('style'); style.textContent = CSS; target.appendChild(style);
  return style;
}
function safeDestroy(handle) { try { handle?.destroy?.(); } catch { /* host teardown */ } }

function makeSound(settings) {
  let audio = null;
  return {
    play(kind) {
      if (!settings.sound) return;
      try {
        const Ctor = window.AudioContext || window.webkitAudioContext;
        if (!Ctor) return;
        audio ||= new Ctor();
        if (audio.state === 'suspended') void audio.resume();
        const osc = audio.createOscillator(), gain = audio.createGain();
        const t = audio.currentTime, notes = { flap: 420, thrust: 220, score: 780, coin: 990, hit: 180, death: 106, start: 560, pop: 880, drop: 330, tick: 640 };
        osc.type = kind === 'hit' || kind === 'death' ? 'sawtooth' : 'sine';
        osc.frequency.setValueAtTime(notes[kind] || 410, t);
        osc.frequency.exponentialRampToValueAtTime(Math.max(80, (notes[kind] || 410) * 0.65), t + 0.12);
        gain.gain.setValueAtTime(0.045, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
        osc.connect(gain); gain.connect(audio.destination); osc.start(t); osc.stop(t + 0.14);
      } catch { /* muted system audio is never a gameplay failure */ }
    },
    dispose() { try { void audio?.close?.(); } catch {} audio = null; },
  };
}

function loadImages() {
  const names = [
    ...Array.from({ length: 6 }, (_, i) => `bird_flap_${i}`),
    ...Array.from({ length: 6 }, (_, i) => `gabi_fly_${i}`),
    'bird_dizzy','bird_dead','gabi_hurt','gabi_crash','gabi_dead','cloud','coin','star','heart',
    'flame_0','flame_1','flame_2','record_flag','best_banner','game_over_banner',
    'snake_head','snake_snack',...['apple','berry','star','fish','cookie','candy'].map(k=>`snake_food_${k}`),'merge_tile',
    ...['cat','heart','star','fish','cookie','gem','rocket','bomb'].map(k=>`match_${k}`),
    ...['cat','heart','star','fish','cookie','gem','rocket','bomb','hint'].map(k=>`match_vec_${k}`),
    ...['smug','annoyed','hype','panic','dizzy','sleepy','shock'].map(k=>`gabu_${k}`),
    'gabu_magnate','gabu_peek','plinko_chip','plinko_app','plinko_crest','simon_app','duck_app','slots_app','tetris_app','solitaire_app','froggy_app',
    'chess_app','berry_app','treats_app','cake_app','bubble_app','boop_app','wafer_app','memory_app',
  ];
  const imgs = {};
  for (const name of names) {
    if (!ASSETS[name] || typeof Image === 'undefined') continue;
    try { const img = new Image(); img.src = ASSETS[name]; imgs[name] = img; }
    catch { /* render falls back to drawn mascots */ }
  }
  return imgs;
}

function drawPill(ctx, x, y, w, h, color) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, Math.min(12, h/2));
  ctx.fillStyle = color; ctx.fill();
}
function drawSprite(ctx, img, x, y, width, height) {
  if (!img || !img.complete || !img.naturalWidth) return false;
  const scale = Math.min(width/img.naturalWidth, height/img.naturalHeight);
  const w = img.naturalWidth * scale, h = img.naturalHeight * scale;
  ctx.drawImage(img, x - w/2, y - h/2, w, h);
  return true;
}
function paintSky(ctx, mode, age, reduced, images) {
  const c = GRADIENTS[mode], w = WORLD.width, h = WORLD.height;
  const bg = ctx.createLinearGradient(0,0,0,h);
  bg.addColorStop(0,c.sky1); bg.addColorStop(1,c.sky2);
  ctx.fillStyle = bg; ctx.fillRect(0,0,w,h);
  if (mode === 'gabi') {
    for(let i=0;i<16;i++) {
      const x = (i*79+19)%w, y=(i*61+35)%300;
      ctx.fillStyle = `rgba(255,231,255,${0.15 + (i%3)*0.11})`;
      ctx.fillRect(x,y, i%4===0 ? 3 : 2,i%4===0 ? 3 : 2);
    }
  }
  const shift = reduced ? 0 : (age*10) % 180;
  ctx.globalAlpha = mode==='gabi'? .27:.5;
  for(let i=-1;i<4;i++) {
    const x = i*158 + 50 - shift, y = 80+((i+3)*67)%175;
    if (!drawSprite(ctx, images.cloud, x,y,86,44)) {
      drawPill(ctx,x-35,y-4,80,21,'#ffffff');
    }
  }
  ctx.globalAlpha = 1;
  const parallax = reduced?0:(age*25)%55;
  ctx.fillStyle=c.skyline;
  for (let i=0;i<12;i++) {
    const x = i*53 - parallax;
    const hh = 38+((i*23+17)%64);
    ctx.fillRect(x, WORLD.floor-hh, 39,hh);
    if (mode==='gabi') {
      ctx.fillStyle = '#fb96d16b';
      for(let wy=WORLD.floor-hh+9;wy<WORLD.floor-7;wy+=13) ctx.fillRect(x+9,wy,5,4);
      ctx.fillStyle=c.skyline;
    }
  }
  ctx.fillStyle = c.floor;
  ctx.fillRect(0,WORLD.floor, w, h-WORLD.floor);
  ctx.fillStyle = mode==='bird'?'#d2f79d':'#f880c8';
  ctx.fillRect(0,WORLD.floor, w, 5);
  if (!reduced) {
    const scroll=(age*50)%32;
    ctx.globalAlpha=.18; ctx.fillStyle=mode==='bird'?'#2d744c':'#e9aaff';
    for(let x=-32;x<w+32;x+=32) ctx.fillRect(x-scroll, WORLD.floor+15, 20,5);
    ctx.globalAlpha=1;
  }
}
function paintPipe(ctx, pipe, color, mode) {
  const x=pipe.x,w=pipe.width, gapTop=pipe.center-pipe.gap/2,gapBottom=pipe.center+pipe.gap/2;
  const sections=[{y:-10,h:gapTop+10, capY:gapTop-19},{y:gapBottom,h:WORLD.floor-gapBottom,capY:gapBottom}];
  for(let i=0;i<2;i++) {
    const p=sections[i]; if (p.h<=0) continue;
    const grad=ctx.createLinearGradient(x,0,x+w,0);
    grad.addColorStop(0,color.edge);grad.addColorStop(.13,color.pipe);grad.addColorStop(.45,color.light);grad.addColorStop(.7,color.pipe);grad.addColorStop(1,color.edge);
    ctx.fillStyle=grad;ctx.strokeStyle=color.edge;ctx.lineWidth=3;
    ctx.fillRect(x,p.y,w,p.h);ctx.strokeRect(x+1.5,p.y,w-3,p.h);
    ctx.fillStyle=color.pipe; ctx.fillRect(x-5,p.capY,w+10,20);
    ctx.strokeStyle=color.edge;ctx.strokeRect(x-5,p.capY,w+10,20);
    ctx.fillStyle=color.light;ctx.globalAlpha=.65;ctx.fillRect(x+3,p.capY+3,6,13);ctx.globalAlpha=1;
    if(mode==='gabi') { ctx.strokeStyle='#ff90d290';ctx.lineWidth=2;ctx.strokeRect(x+1,p.y,w-2,p.h); }
  }
}

/** Gabi's obstacles are actual urban towers, not purple pipes. The lower
 * building's roof is the physical score marker; it carries the saved-best flag.
 * Collision bounds intentionally remain the same simple rectangles as before. */
function paintBuilding(ctx, tower, images) {
  const x=tower.x, w=tower.width;
  const roofTop=tower.center-tower.gap/2;
  const roofBottom=tower.center+tower.gap/2;
  const variant=(tower.number||0)%4;
  const accent=['#ef79b2','#7bd6fc','#ffc978','#bb97ff'][variant];
  function facade(top,bottom,lower) {
    const h=bottom-top;
    if(h<=0)return;
    const body=ctx.createLinearGradient(x,top,x+w,bottom);
    body.addColorStop(0,'#39264f');body.addColorStop(.55,'#241d3e');body.addColorStop(1,'#30234e');
    ctx.fillStyle=body;ctx.fillRect(x,top,w,h);
    ctx.strokeStyle='#181529';ctx.lineWidth=3;ctx.strokeRect(x+1,top,w-2,h);
    ctx.fillStyle='#66517c';ctx.fillRect(x+4,top,3,h);ctx.fillRect(x+w-7,top,3,h);
    const first=lower?top+18:top+15;
    for(let wy=first;wy+8<bottom-9;wy+=24) {
      for(let col=0;col<3;col++) {
        const lit=((Math.floor(wy/24)+col*3+variant*2)%5)!==0;
        ctx.fillStyle=lit?(col===1?'#ffcf91':'#be9cf3'):'#352b53';
        ctx.fillRect(x+9+col*16,wy,9,12);
        ctx.globalAlpha=.45;ctx.fillStyle='#ffffff';
        if(lit)ctx.fillRect(x+11+col*16,wy+2,2,6);
        ctx.globalAlpha=1;
      }
    }
    // Skylines have parapets, warning-light strips and rooftop ledges.
    const ledge=lower?top:bottom-9;
    ctx.fillStyle='#18162c';ctx.fillRect(x-4,ledge,w+8,10);
    ctx.fillStyle=accent;ctx.fillRect(x-4,ledge,w+8,3);
    ctx.fillStyle='#a685b1';ctx.fillRect(x+5,ledge+(lower?9:-6),3,7);
    ctx.fillRect(x+w-8,ledge+(lower?9:-6),3,7);
  }
  facade(0,roofTop,false);
  facade(roofBottom,WORLD.floor,true);
  // The flag belongs to the building where the last PERSONAL BEST was set,
  // not the best that is being updated live on this run.
  if(tower.landmark) {
    drawSprite(ctx,images.record_flag,x+w-13,roofBottom-22,43,48);
  }
}

function paintMascot(ctx, game, images, reduced) {
  const isGabi=game.mode==='gabi';
  const hurt=game.invulnerable>0 && Math.floor(game.age*12)%2===0;
  if (hurt && !reduced) ctx.globalAlpha=.45;
  ctx.save();
  ctx.translate(WORLD.playerX,game.y);
  ctx.rotate(Math.max(-.36,Math.min(.7,game.velocity/850)));
  const frame=isGabi?gabiFlightFrame(game,reduced):(reduced?0:Math.floor(game.age*12)%6);
  if(isGabi && game.holding && game.status==='playing') {
    const fireFrame=reduced?1:Math.floor(game.age*15)%3;
    // The art already has a small baked-in exhaust. This extra real flame
    // extends the jetpack stream only while thrust is held, and is behind Gabi.
    ctx.globalAlpha=.9;
    drawSprite(ctx,images[`flame_${fireFrame}`],-32,34,30,52);
    ctx.globalAlpha=(hurt && !reduced) ? .45 : 1;
  }
  const name=game.status==='dead' ? (isGabi?'gabi_dead':'bird_dead'):
    (hurt && isGabi?'gabi_hurt':(isGabi?`gabi_fly_${frame}`:`bird_flap_${frame}`));
  const size=isGabi?75:57;
  if(!drawSprite(ctx, images[name], 0,0, size,size)) {
    ctx.fillStyle=isGabi?'#f16176':'#ffd44d';
    ctx.beginPath();ctx.ellipse(0,0,isGabi?21:22,isGabi?23:18,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(8,-5,7,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#1f1843';ctx.beginPath();ctx.arc(10,-5,3,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#f99242';ctx.beginPath();ctx.moveTo(19,0);ctx.lineTo(28,4);ctx.lineTo(17,9);ctx.closePath();ctx.fill();
  }
  ctx.restore();ctx.globalAlpha=1;
}
function paintHud(ctx, game, ready, images, best) {
  const isGabi=game.mode==='gabi';
  drawPill(ctx,11,10,isGabi?112:105,29,'#17122ddb');
  // Other mini-games reuse this same canvas and may leave textAlign=center.
  // Without an explicit HUD baseline the score/best text shifts left until
  // the death overlay happens to restore textAlign=start.
  ctx.textAlign='left';
  ctx.font='bold 15px ui-monospace, monospace';
  ctx.fillStyle='#ffffff';ctx.textBaseline='middle';
  ctx.fillText('SCORE '+String(game.score).padStart(3,'0'),20,25);
  if(isGabi) {
    drawPill(ctx,126,10,97,29,'#17122de8');
    drawSprite(ctx,images.coin,146,24,21,21);
    // Reapply ink AFTER drawing the coin; it should always be bright white.
    ctx.font='900 16px ui-monospace,monospace';
    ctx.fillStyle='#ffffff';ctx.shadowColor='#100b25';ctx.shadowBlur=4;
    ctx.fillText('×'+String(game.coins).padStart(2,'0'),163,25);
    ctx.shadowBlur=0;
  }
  // Current best belongs in the HUD too, but the in-world flag stays anchored
  // to the PREVIOUS best, as it was at the beginning of this run.
  drawPill(ctx,11,45,117,25,'#1b1739db');
  drawSprite(ctx,images.record_flag,23,57,18,24);
  ctx.fillStyle='#ffffff';ctx.font='800 12px ui-monospace,monospace';
  ctx.fillText('BEST '+String(best).padStart(3,'0'),36,58);
  if (ready) {
    drawPill(ctx,197,44,151,23,'#f6bde9e6');
    ctx.font='bold 11px ui-sans-serif,sans-serif';ctx.fillStyle='#391b4d';ctx.textAlign='center';
    ctx.fillText('RESPONSE READY!',272,56);ctx.textAlign='start';
  }
  if(isGabi) {
    for(let n=0;n<3;n++) {
      const x=274+n*27;
      if(n<game.health) drawSprite(ctx,images.heart,x,26,24,24);
      else {ctx.save();ctx.globalAlpha=.22;drawSprite(ctx,images.heart,x,26,24,24);ctx.restore();}
    }
  }
  // Play an actual NEW BEST graphic for 3 seconds, once per run.
  if(game.status==='playing' && game.newBestFlash>0) {
    const pulse=1 + (Math.sin(game.age*12)+1)*.045;
    drawSprite(ctx,images.best_banner,180,112,193*pulse,80*pulse);
  }
}
function paintOverlay(ctx, game, ready, best, generationActive, images) {
  if(game.status==='playing') return;
  ctx.fillStyle='#0e1027ad';ctx.fillRect(0,80,WORLD.width,WORLD.floor-120);
  const center=WORLD.width/2;
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.shadowColor='#171332';ctx.shadowBlur=5;
  ctx.fillStyle='#fff6eb';ctx.font='900 26px ui-sans-serif, sans-serif';
  const died=game.status==='dead';
  const recordLayout=died && game.newBest;
  if(died) {
    // Distinct non-overlapping banner lanes, even when both assets are shown.
    if(recordLayout) drawSprite(ctx,images.best_banner,center,115,165,62);
    if(!drawSprite(ctx,images.game_over_banner,center,recordLayout?192:178,210,76)) {
      ctx.fillText('GAME OVER!',center,recordLayout?192:178);
    }
  } else {
    ctx.fillText(game.status==='paused'?'PAUSED':'BIRD BRAIN',center,185);
  }
  ctx.shadowBlur=0;
  ctx.font='600 13px ui-sans-serif, sans-serif';ctx.fillStyle='#e8d9ff';
  const line=died ? `Score ${game.score} · Best ${best}` : game.status==='paused' ? 'Your chaos is on hold' :
    game.mode==='gabi'?'Hold to fire the jetpack':'Tap to flap. Regret everything.';
  ctx.fillText(line,center,recordLayout?249:219);
  if(died && game.mode==='gabi') ctx.fillText(`Coins collected: ${game.coins}`,center,recordLayout?269:242);
  const buttonY=recordLayout?296:265;
  drawPill(ctx,center-105,buttonY,210,38,game.mode==='gabi'?'#eb5d95':'#ffd15a');
  ctx.fillStyle='#24172e';ctx.font='800 15px ui-sans-serif,sans-serif';
  ctx.fillText(game.status==='paused'?'RESUME':'TAP TO PLAY',center,buttonY+19);
  ctx.font='600 11px ui-sans-serif,sans-serif';ctx.fillStyle='#e6d0ee';
  const hintY=recordLayout?366:337;
  if(ready) ctx.fillText('AI FINISHED · KEEP PLAYING',center,hintY);
  else if(generationActive) ctx.fillText('AI THINKING · YOU ARE NOT',center,hintY);
  ctx.textAlign='start';
}
export function drawFrame(canvas, game, images, opts, state, best) {
  if(!canvas || !canvas.getContext) return;
  const ctx=canvas.getContext('2d'); if(!ctx) return;
  ctx.setTransform(canvas.width/WORLD.width,0,0,canvas.height/WORLD.height,0,0);
  ctx.clearRect(0,0,WORLD.width,WORLD.height);
  paintSky(ctx,game.mode,game.age,opts.reduceMotion,images);
  for(const pipe of game.pipes) {
    if(game.mode==='gabi')paintBuilding(ctx,pipe,images);
    else paintPipe(ctx,pipe,GRADIENTS.bird,'bird');
    if(game.mode==='gabi' && !pipe.coinTaken) drawSprite(ctx,images.coin,pipe.x+pipe.width/2,pipe.center,24,24);
  }
  paintMascot(ctx,game,images,opts.reduceMotion);
  paintHud(ctx,game,state.ready,images,best);
  paintOverlay(ctx,game,state.ready,best,state.activeIds.length>0,images);
}

/** Spindle frontend entry. Return teardown; no backend worker or generation privilege. */
/** Spindle frontend; one widget, multiple independent client-side games. */
export function setup(ctx) {
  const storageKey='fuckass_funzone:v1:'+String(ctx?.host?.extensionInstallationId||'local');
  const legacyStorageKey='bird_brain:v1:'+String(ctx?.host?.extensionInstallationId||'local');
  const persisted=safeLoad(storageKey, safeLoad(legacyStorageKey, {}));
  const settings=sanitizeSettings(persisted.settings);
  let activeMode=GAME_IDS.includes(persisted.arcadeGame)?persisted.arcadeGame:settings.mode;
  const bests={};for(const id of GAME_IDS)bests[id]=Math.max(0,Math.floor(Number(persisted?.bests?.[id])||0));
  let tickets=Number.isSafeInteger(persisted.tickets)?Math.max(0,Math.min(100000000,persisted.tickets)):0;
  let shopState=restoreShop(persisted.shop);
  const images=loadImages();let lifecycle={activeIds:[],ready:false};
  let widget=null,drawer=null,action=null,frame=0,lastTs=0,shown=false,disposed=false;
  let keyHeld=false,pointerStart=null,selectedCell=-1,keyboardCursor=-1,solitaireCursor=-1,chessCursor=-1,bubbleAiming=false,toyKeys=false;
  const classicGames={},pendingClassicScores=new Set();let classicSavePending=false;
  const matchBanks=Object.create(null);
  for(const width of MATCH_WIDTHS)if(persisted?.match3Boards?.[width])matchBanks[width]=persisted.match3Boards[width];
  const oldMatch=persisted?.puzzles?.match3;
  if(oldMatch?.board){const oldWidth=MATCH_WIDTHS.includes(oldMatch.width)?oldMatch.width:7;if(!matchBanks[oldWidth])matchBanks[oldWidth]=oldMatch;}
  const firstMatchWidth=MATCH_WIDTHS.includes(persisted?.match3Width)?persisted.match3Width:7;
  let phoneOpen=false,shopOpen=false,shopCategory='all',plinkoStake=[0,1,5,10].includes(persisted?.plinkoStake)?persisted.plinkoStake:5;
  let slotStake=[0,1,3,5].includes(persisted?.slotStake)?persisted.slotStake:1;
  let matchHintSeconds=[0,8,12,20].includes(persisted?.matchHintSeconds)?persisted.matchHintSeconds:12;
  let matchTimerSeconds=MATCH_TIMER_MODES.includes(persisted?.matchTimerSeconds)?persisted.matchTimerSeconds:0;
  let duckTimerSeconds=DUCK_TIMER_MODES.includes(persisted?.duckTimerSeconds)?persisted.duckTimerSeconds:45;
  let duckSpeed=DUCK_SPEEDS.includes(persisted?.duckSpeed)?persisted.duckSpeed:'normal';
  // Board-game opponents and toy-game paces apply on the next new game, never mid-run.
  const gabuLevels={chess:'normal',berry:'normal',tictac:'normal',wafer:'normal'},toyPaces={cake:'normal',bubble:'normal',boop:'normal',memory:'classic'};
  for(const id of Object.keys(gabuLevels))if(CHESS_LEVELS.includes(persisted?.gabuLevels?.[id]))gabuLevels[id]=persisted.gabuLevels[id];
  const PACE_CHOICES={cake:CAKE_PACES,bubble:BUBBLE_PACES,boop:BOOP_PACES,memory:Object.keys(MEMORY_SIZES)};
  for(const id of Object.keys(toyPaces))if(PACE_CHOICES[id].includes(persisted?.toyPaces?.[id]))toyPaces[id]=persisted.toyPaces[id];
  let plinkoAim=180,phoneEl=null,gameStage=null,bar=null,betBar=null,slotBar=null,phoneResume=null;
  const appBestLabels=new Map(),wagerButtons=new Map(),slotButtons=new Map(),drawerBestLabels=new Map(),shopCards=new Map(),shopFilters=new Map();
  let rootEl=null,shopEl=null,shopWallet=null,shopNotice=null,shopReset=null,shopResetWrap=null,shopScroll=null;
  const phoneLauncherNodes=[];
  let canvas=null,statusEl=null,footerEl=null,playButton=null,soundButton=null,ticketEl=null,highs=null,undoButton=null,matchSizeSelect=null,matchDrawerSelect=null,matchHintSelect=null,matchTimerSelect=null,duckTimerSelect=null,duckSpeedSelect=null,plinkoDrawerSelect=null,slotDrawerSelect=null;
  const presetSelects=new Map();
  const flightDrawerSelects=[];
  let reactionBox=null,reactionPicture=null,reactionText=null;
  const reactions=new ReactionDirector();
  const off=[],listeners=[],sound=makeSound(settings);
  const save=()=>{
    matchBanks[match3.width]=match3.snapshot();
    safeSave(storageKey,{settings,bests,arcadeGame:activeMode,tickets,shop:shopState,plinkoStake,slotStake,matchHintSeconds,matchTimerSeconds,duckTimerSeconds,duckSpeed,gabuLevels,toyPaces,match3Width:match3.width,match3Boards:matchBanks,
      puzzles:{snake:snake.snapshot(),merge:merge.snapshot(),match3:match3.snapshot(),plinko:plinko.snapshot(),simon:simon.snapshot(),duck:duck.snapshot(),slots:slots.snapshot(),
        ...Object.fromEntries(Object.entries(classicGames).map(([id,g])=>[id,g.snapshot()]))}});
  };
  function addTickets(amount){
    const gain=Math.max(0,Math.floor(Number(amount)||0));
    tickets=creditTickets(tickets,gain);
    save();refresh();
  }
  function award(id,score){
    const current=Math.max(0,Math.floor(Number(score)||0));
    if(current>bests[id]){
      // Tickets only awarded for new milestones, not repeated retries or undo loops.
      const gain=milestonePayout(id,bests[id],current);
      tickets=creditTickets(tickets,gain);bests[id]=current;
    }
    save();
  }
  const game=new ArcadeEngine({mode:settings.mode,difficulty:settings.difficulty,recordTarget:bests[settings.mode],onEvent:(event)=>{
    if(event==='reset')return; // ArcadeEngine emits reset during its constructor.
    if(['flap','thrust','score','coin','hit','death','start','new_best'].includes(event))sound.play(event==='new_best'?'score':event);
    if(event==='score'||event==='death')award(game.mode,game.score);
    // Collected Jetpack coins are real wallet credits, never a death-screen estimate.
    if(event==='coin'&&game.mode==='gabi')addTickets(1);
    reactions.emit(game.mode,event);refresh();
  }});
  const snake=new SnakeGame({saved:persisted?.puzzles?.snake,onEvent:(event)=>{
    if(event==='score'||event==='death')award('snake',snake.score);
    if(event==='death')sound.play('death');else if(event==='score')sound.play('coin');
    reactions.emit('snake',event);refresh();
  }});
  const merge=new Merge2048({saved:persisted?.puzzles?.merge,onEvent:(event,data)=>{
    if(event==='score'||event==='death'||event==='move'||event==='undo')award('2048',merge.score);
    if(event==='score')sound.play('score');
    reactions.emit('2048',event,data);refresh();
  }});
  const onMatchEvent=(event,data)=>{
    if(event==='score'||event==='move')award('match3',match3.score);
    if(event==='special_created')addTickets(Math.min(10,Math.max(0,Number(data?.count)||0)));
    if(event==='special_triggered')addTickets(Math.min(20,2*Math.max(0,Number(data?.count)||0)));
    if(event==='match'||event==='special_created'||event==='special_triggered'||event==='cascade')sound.play(event==='special_triggered'?'coin':'score');
    if(event==='no_moves'||event==='timeout')sound.play('death');
    if(event==='timeout')save(); // A clock can expire without a pointer/keyboard event; persist the failure immediately.
    reactions.emit('match3',event,data);refresh();
  };
  let match3=new Match3Game({width:firstMatchWidth,timerSeconds:matchTimerSeconds,saved:matchBanks[firstMatchWidth],onEvent:onMatchEvent});
  const plinko=new PlinkoGame({saved:persisted?.puzzles?.plinko,onEvent:(event,data)=>{
    if(event==='land'){tickets=Math.min(100000000,tickets+data.payout);bests.plinko=Math.max(bests.plinko,data.payout);sound.play(data.multiplier>=6?'score':'coin');save();}
    reactions.emit('plinko',event,data);refresh();
  }});
  const simon=new SimonGame({saved:persisted?.puzzles?.simon,onEvent:(event,data)=>{
    if(event==='score')award('simon',simon.score);
    if(event==='tap'||event==='score')sound.play('coin');
    if(event==='death')sound.play('death');
    reactions.emit('simon',event,data);refresh();
  }});
  const duck=new DuckGame({timerSeconds:duckTimerSeconds,speed:duckSpeed,saved:persisted?.puzzles?.duck,onEvent:(event,data)=>{
    if(event==='score')award('duck',duck.score);
    if(event==='score')sound.play('coin');
    if(event==='death'){sound.play('death');save();} // The clock may end a hunt without any further player input.
    reactions.emit('duck',event,data);refresh();
  }});
  const slots=new SlotGame({saved:persisted?.puzzles?.slots,onEvent:(event,data)=>{
    if(event==='land'){addTickets(data.payout);bests.slots=Math.max(bests.slots,data.payout);sound.play(data.multiplier>=9?'score':'coin');save();}
    if(event==='spin')sound.play('start');
    if(event==='land'){reactions.emit('slots',data.stake===0?'practice':data.multiplier>=14?'jackpot':'land',data);}
    else reactions.emit('slots',event,data);refresh();
  }});
  // Cues for the newer games reuse the same synth, so the Sound setting silences them like every other game.
  const CLASSIC_SOUNDS=Object.freeze({
    chess:{move:'tick',gabu_move:'tick',capture:'coin',queen_taken:'coin',gabu_capture:'hit',queen_lost:'hit',check:'start',gabu_check:'hit',castle:'flap',promote:'score',draw:'hit',undo:'flap'},
    berry:{drop:'drop',gabu_drop:'drop',block:'coin',fork:'score',draw:'hit',round:'start'},
    tictac:{place:'tick',gabu_place:'tick',block:'coin',fork:'score',draw:'hit',round:'start'},
    cake:{drop:'flap',land:'drop',perfect:'coin',combo:'score',milestone:'score',miss:'hit',wobble:'hit'},
    bubble:{shoot:'thrust',bounce:'tick',pop:'pop',big_pop:'score',avalanche:'score',miss:'drop',ceiling:'hit',clear:'score',swap:'flap'},
    boop:{boop:'pop',gold:'coin',combo:'score',bot:'hit',whiff:'tick'},
    wafer:{select:'tick',pull:'drop',gabu_pull:'drop',perfect:'coin',risky:'hit',gabu_risky:'hit',round:'start'},
    memory:{flip:'tick',match:'coin',streak:'score',miss:'drop',forgot:'hit'},
  });
  // Like the flight engine, each run of a newer game announces a NEW BEST once, when it first passes the best it started from.
  const RECORD_GAMES=new Set(['chess','berry','tictac','cake','bubble','boop','wafer','memory']),recordBase={},recordAnnounced={};
  function classicEvent(id,event,data){
    const current=classicGames[id];if(!current)return;
    if(RECORD_GAMES.has(id)){
      if(event==='reset'){recordBase[id]=bests[id];recordAnnounced[id]=false;}
      else if(event==='score'&&!recordAnnounced[id]&&current.score>recordBase[id]){recordAnnounced[id]=true;reactions.emit(id,'new_best',{score:current.score,previousBest:recordBase[id]});}
    }
    if(['score','move','win','death'].includes(event))pendingClassicScores.add(id);
    if(['score','move','undo','win','death','hit','home','level','hop','lock','hold','gabu_move','draw','drop','gabu_drop','place','gabu_place','round','land','miss','shoot','swap','ceiling','clear','boop','gold','bot','whiff','escape','pull','gabu_pull','flip','match','streak','forgot'].includes(event))classicSavePending=true;
    if(event==='death')sound.play('death');else if(event==='win'||event==='line')sound.play('score');
    else if(CLASSIC_SOUNDS[id]?.[event])sound.play(CLASSIC_SOUNDS[id][event]);
    reactions.emit(id,event,data);refresh();
  }
  function flushClassic(){
    if(!classicSavePending)return;
    classicSavePending=false;
    for(const id of pendingClassicScores)award(id,classicGames[id].score);
    pendingClassicScores.clear();save();
  }
  for(const [id,Game] of [['tetris',TetrisGame],['solitaire',SolitaireGame],['froggy',FroggyGame],['chess',ChessGame],['berry',BerryDropGame],['tictac',TicTacTreatsGame],['cake',CakeTowerGame],['bubble',BubbleGame],['boop',BoopGame],['wafer',WobblyWafersGame],['memory',GachaMatchGame]]){
    classicGames[id]=new Game({saved:persisted?.puzzles?.[id],level:gabuLevels[id],pace:toyPaces[id],onEvent:(event,data)=>classicEvent(id,event,data)});
    // A run restored from a save that already holds the record announced it before the reload.
    if(RECORD_GAMES.has(id)){const g=classicGames[id];recordBase[id]=bests[id];recordAnnounced[id]=(g.status==='paused'||g.status==='playing')&&g.score>0&&g.score===bests[id];}
  }
  const bind=(el,event,fn,options)=>{el.addEventListener(event,fn,options);listeners.push(()=>el.removeEventListener(event,fn,options));};
  const active=()=>classicGames[activeMode]||(activeMode==='snake'?snake:activeMode==='2048'?merge:activeMode==='match3'?match3:activeMode==='plinko'?plinko:activeMode==='simon'?simon:activeMode==='duck'?duck:activeMode==='slots'?slots:game);
  function setMatchWidth(width){
    if(!MATCH_WIDTHS.includes(width)||width===match3.width)return;
    matchBanks[match3.width]=match3.snapshot();match3.pause();
    match3=new Match3Game({width,timerSeconds:matchTimerSeconds,saved:matchBanks[width],onEvent:onMatchEvent});
    selectedCell=-1;keyboardCursor=-1;reactions.clear();
    save();refresh();refreshReaction();
  }
  function shopAction(id){
    const item=SHOP_CATALOG.find(reward=>reward.id===id);
    if(!item)return;
    if(shopState.owned.includes(id)){
      const result=equipReward(shopState,item.slot,id);
      if(!result.ok)return;
      shopState=result.shop;
      if(shopNotice)shopNotice.textContent=`Equipped ${item.name}.`;
    }else{
      const result=purchaseReward(shopState,id,tickets);
      if(!result.ok){if(shopNotice)shopNotice.textContent=result.reason==='funds'?'Not enough tickets yet.':'Reward unavailable.';return;}
      shopState=result.shop;tickets=result.tickets;
      if(shopNotice)shopNotice.textContent=`Unlocked ${item.name}. Permanently yours.`;
      sound.play('score');
    }
    save();refresh();
  }
  function resetShopSlot(slot){
    const result=equipReward(shopState,slot,'default');if(!result.ok)return;
    shopState=result.shop;if(shopNotice)shopNotice.textContent='Original look equipped.';
    save();refresh();
  }
  function chooseShopCategory(category){
    if(category!=='all'&&!SHOP_SLOTS.includes(category))return;
    shopCategory=category;if(shopScroll)shopScroll.scrollTop=0;refresh();
  }
  function refreshShop(){
    if(!shopEl)return;
    if(shopWallet)shopWallet.textContent=String(tickets);
    for(const [category,btn] of shopFilters){btn.setAttribute('aria-pressed',String(category===shopCategory));}
    for(const [id,entry] of shopCards){
      const item=SHOP_CATALOG.find(reward=>reward.id===id);
      entry.node.hidden=shopCategory!=='all'&&shopCategory!==item.slot;
      const owned=shopState.owned.includes(id),equipped=shopState.equipped[item.slot]===id;
      entry.node.dataset.owned=owned?'true':'false';entry.node.dataset.equipped=equipped?'true':'false';
      entry.button.textContent=equipped?'EQUIPPED':owned?'EQUIP':`BUY ${item.price}`;
      entry.button.disabled=equipped||(!owned&&tickets<item.price);
      entry.button.setAttribute('aria-label',equipped?`${item.name} equipped`:owned?`Equip ${item.name}`:`Buy ${item.name} for ${item.price} tickets`);
      entry.meta.textContent=equipped?'ACTIVE':owned?'OWNED':tickets<item.price?`NEED ${item.price-tickets} MORE`:`${item.price} TICKETS`;
    }
    if(shopResetWrap)shopResetWrap.hidden=shopCategory==='all';
    if(shopReset&&shopCategory!=='all'){
      shopReset.textContent=shopState.equipped[shopCategory]==='default'?'ORIGINAL EQUIPPED':'USE ORIGINAL LOOK';
      shopReset.disabled=shopState.equipped[shopCategory]==='default';
    }
  }
  function openShop(){
    active().pause();if(activeMode==='bird'||activeMode==='gabi'){game.release();keyHeld=false;}
    phoneOpen=true;shopOpen=true;if(shopScroll)shopScroll.scrollTop=0;refresh();save();
  }
  function closeShop(){shopOpen=false;refresh();}
  function refresh(){
    if(!statusEl)return;
    statusEl.textContent=lifecycle.activeIds.length?'THINKING':lifecycle.ready?'READY':'IDLE';
    statusEl.setAttribute('aria-label',lifecycle.activeIds.length?'Model is thinking':lifecycle.ready?'Response ready':'Arcade idle');
    statusEl.dataset.state=lifecycle.activeIds.length?'thinking':lifecycle.ready?'ready':'idle';
    const current=active();
    if(canvas)canvas.dataset.mode=activeMode;
    if(gameStage)gameStage.dataset.game=activeMode;
    if(footerEl)footerEl.textContent=activeMode==='chess'?'PICK, THEN MOVE':activeMode==='berry'?'TAP A COLUMN':activeMode==='tictac'?'TAP A SQUARE':activeMode==='cake'?'TAP TO DROP':activeMode==='bubble'?'DRAG TO AIM':activeMode==='boop'?'BOOP THE BUNS':activeMode==='wafer'?'PULL A WAFER':activeMode==='memory'?'FIND THE PAIRS':activeMode==='tetris'?'ARROWS / TOUCH · SPACE TO DROP':activeMode==='solitaire'?'TAP SOURCE, THEN DESTINATION':activeMode==='froggy'?'ARROWS / WASD / TOUCH PAD':activeMode==='plinko'?(tickets?'FICTIONAL TICKETS ONLY':'FREE PRACTICE'):activeMode==='simon'?'TAP COLORS / KEYS 1–4':activeMode==='duck'?'TAP THE DUCKS':activeMode==='slots'?'FICTIONAL TICKETS ONLY':activeMode==='snake'?'ARROWS / SWIPE':activeMode==='2048'?'SWIPE / ARROWS':activeMode==='match3'?'TAP / DRAG TO SWAP':game.mode==='gabi'?'HOLD TO THRUST':'TAP TO FLAP';
    if(playButton){const isSlot=activeMode==='slots';const playing=current.status==='playing';
      const label=isSlot?(slots.pending?(playing?'Pause':'Resume'):'Spin'):playing?'Pause':current.status==='paused'?'Resume':activeMode==='plinko'?'Drop':current.status==='dead'&&activeMode==='match3'?'New Board':current.status==='dead'?'Again':'Play';
      setIconLabel(playButton,label==='Pause'?'pause':'play',label);playButton.disabled=false;}
    
    if(soundButton)setIconLabel(soundButton,settings.sound?'volume':'mute',settings.sound?'Sound on':'Sound off');
    if(ticketEl)ticketEl.textContent=String(tickets);
    if(rootEl){rootEl.dataset.cabinet=shopState.equipped.cabinet;rootEl.dataset.shopOpen=String(shopOpen);rootEl.dataset.phoneOpen=String(phoneOpen&&!shopOpen);}
    if(undoButton)undoButton.hidden=activeMode!=='2048'&&activeMode!=='solitaire'&&activeMode!=='chess';
    for(const [id,select] of presetSelects)select.value=gabuLevels[id]||toyPaces[id];
    if(matchSizeSelect){matchSizeSelect.hidden=activeMode!=='match3';matchSizeSelect.value=String(match3.width);}
    if(matchDrawerSelect)matchDrawerSelect.value=String(match3.width);
    if(matchHintSelect)matchHintSelect.value=String(matchHintSeconds);
    if(plinkoDrawerSelect)plinkoDrawerSelect.value=String(plinkoStake);
    if(slotDrawerSelect)slotDrawerSelect.value=String(slotStake);
    for(const select of flightDrawerSelects)select.value=settings.difficulty;
    if(phoneEl)phoneEl.hidden=!phoneOpen;
    for(const node of phoneLauncherNodes)node.hidden=shopOpen;
    if(shopEl)shopEl.hidden=!shopOpen;
    refreshShop();
    if(gameStage)gameStage.hidden=phoneOpen;
    if(bar)bar.hidden=phoneOpen;
    if(betBar)betBar.hidden=phoneOpen||activeMode!=='plinko';
    if(slotBar)slotBar.hidden=phoneOpen||activeMode!=='slots';
    if(bar)bar.dataset.mode=activeMode;
    const chosenStake=tickets===0||plinkoStake===0?0:tickets>=plinkoStake?plinkoStake:1;
    for(const [amount,b] of wagerButtons){b.classList.toggle('selected',amount===chosenStake);b.disabled=amount!==0&&tickets<amount;}
    const chosenSlotStake=tickets===0||slotStake===0?0:tickets>=slotStake?slotStake:0;
    for(const [amount,b] of slotButtons){b.classList.toggle('selected',amount===chosenSlotStake);b.disabled=amount!==0&&tickets<amount;}
    for(const [mode,el] of appBestLabels)el.textContent=`BEST ${bests[mode]}`;
    if(phoneResume)phoneResume.textContent=`CONTINUE ${GAME_ROSTER.find(([id])=>id===activeMode)?.[1]||'GAME'}`;
    for(const [id,el] of drawerBestLabels)el.textContent=String(bests[id]);
  }
  function refreshReaction(){
    if(!reactionBox)return;
    const item=reactions.current;
    if(!settings.gabuReactions||!item||!shown||item.game!==activeMode){reactionBox.hidden=true;return;}
    reactionBox.hidden=false;
    if(reactionText.textContent!==item.line)reactionText.textContent=item.line;
    if(reactionPicture.dataset.art!==item.art){reactionPicture.src=ASSETS[item.art]||'';reactionPicture.dataset.art=item.art;}
    reactionBox.dataset.mood=item.mood;
  }
  function tick(now){
    frame=0;if(!shown||disposed)return;
    const dt=lastTs?Math.max(0,Math.min(.12,(now-lastTs)/1000)):0;lastTs=now;
    reactions.update(dt);refreshReaction();
    if(classicGames[activeMode]){
      const current=classicGames[activeMode];current.update(dt);flushClassic();
      const opts={best:bests[activeMode],reduced:settings.reduceMotion,cursor:solitaireCursor<0?null:classicGames.solitaire.keyboardHits()[solitaireCursor]};
      const toyOpts={best:bests[activeMode],reduced:settings.reduceMotion,images,time:now/1000,cursor:toyKeys};
      if(activeMode==='tetris')drawTetris(canvas,current,opts);
      else if(activeMode==='solitaire')drawSolitaire(canvas,current,opts);
      else if(activeMode==='chess')drawChess(canvas,current,{...toyOpts,cursor:chessCursor});
      else if(activeMode==='berry')drawBerryDrop(canvas,current,toyOpts);
      else if(activeMode==='tictac')drawTicTacTreats(canvas,current,toyOpts);
      else if(activeMode==='cake')drawCakeTower(canvas,current,toyOpts);
      else if(activeMode==='bubble')drawBubbleBloom(canvas,current,toyOpts);
      else if(activeMode==='boop')drawBoopABun(canvas,current,toyOpts);
      else if(activeMode==='wafer')drawWobblyWafers(canvas,current,toyOpts);
      else if(activeMode==='memory')drawGachaMatch(canvas,current,toyOpts);
      else drawFroggy(canvas,current,opts);
    }
    else if(activeMode==='snake'){snake.update(dt);drawSnake(canvas,snake,images,{ready:lifecycle.ready,best:bests.snake,skin:shopState.equipped.snake});}
    else if(activeMode==='2048')drawMerge(canvas,merge,{ready:lifecycle.ready,best:bests['2048'],skin:shopState.equipped.merge});
    else if(activeMode==='match3'){match3.update(dt);drawMatch3(canvas,match3,images,{ready:lifecycle.ready,best:bests.match3,selected:selectedCell>=0?selectedCell:keyboardCursor,reduceMotion:settings.reduceMotion,hint:match3.getHint(matchHintSeconds)});}
    else if(activeMode==='plinko'){plinko.update(dt);drawPlinko(canvas,plinko,images,{tickets,stake:plinkoStake,reduced:settings.reduceMotion,trailSkin:shopState.equipped.plinko});}
    else if(activeMode==='simon'){simon.update(dt);drawSimon(canvas,simon,{best:bests.simon});}
    else if(activeMode==='duck'){duck.update(dt);drawDuck(canvas,duck,{best:bests.duck,reduced:settings.reduceMotion});}
    else if(activeMode==='slots'){slots.update(dt);drawSlots(canvas,slots,{tickets,stake:tickets>=slotStake?slotStake:0,best:bests.slots});}
    else{game.update(dt);drawFrame(canvas,game,images,settings,lifecycle,bests[game.mode]);}
    frame=requestAnimationFrame(tick);
  }
  function startRaf(){if(frame||!shown||disposed)return;lastTs=0;frame=requestAnimationFrame(tick);}
  function stopRaf(){if(frame)cancelAnimationFrame(frame);frame=0;lastTs=0;}
  function show(){if(disposed||!widget)return;shown=true;widget.setVisible(true);refresh();startRaf();}
  function hide(){if(!shown)return;shown=false;active().pause();if(activeMode==='bird'||activeMode==='gabi')game.release();stopRaf();save();widget?.setVisible(false);refresh();}
  function switchMode(mode,launch=false){
    if(!GAME_IDS.includes(mode))return;
    if(activeMode!==mode)active().pause();
    activeMode=mode;selectedCell=-1;keyboardCursor=-1;solitaireCursor=-1;chessCursor=-1;bubbleAiming=false;toyKeys=false;pointerStart=null;reactions.clear();
    if(mode==='bird'||mode==='gabi'){
      // Do not reset an existing bird/Gabi run just because the player opens another tab.
      if(game.mode!==mode){settings.mode=mode;game.reset(mode,settings.difficulty,bests[mode]);}
    }
    phoneOpen=false;shopOpen=false;if(launch){show();if(mode==='duck'&&duck.status==='dead')duck.reset(duckTimerSeconds,duckSpeed);if(presetFresh(classicGames[mode]))resetRun(classicGames[mode]);if(mode!=='plinko'&&mode!=='slots'&&!(mode==='match3'&&match3.status==='dead'))active().start();canvas?.focus?.({preventScroll:true});}save();refresh();refreshReaction();
  }
  function openMode(mode){switchMode(mode,true);}
  function openPhone(){active().pause();if(activeMode==='bird'||activeMode==='gabi'){game.release();keyHeld=false;}phoneOpen=true;shopOpen=false;refresh();save();}
  function closePhone(){phoneOpen=false;refresh();canvas?.focus?.({preventScroll:true});}
  function doPlinkoDrop(x=plinkoAim){
    if(plinko.status==='paused'){plinko.start();refresh();save();return;}
    if(plinko.ball)return;
    const stake=tickets===0||plinkoStake===0?0:tickets>=plinkoStake?plinkoStake:1;
    if(plinko.launch(x,stake)){tickets-=stake;refresh();save();}
  }
  function doSlotSpin(){
    if(slots.pending){if(slots.status==='paused')slots.start();else slots.pause();save();refresh();return;}
    const stake=slotStake!==0&&tickets>=slotStake?slotStake:0;
    if(slots.spin(stake)){tickets-=stake;save();refresh();}
  }
  function play(){const g=active();if(activeMode==='slots'){doSlotSpin();}
    else if(activeMode==='plinko'){if(g.status==='playing')g.togglePause();else doPlinkoDrop();}
    else if(g.status==='playing'){g.togglePause();if(activeMode==='bird'||activeMode==='gabi'){game.release();keyHeld=false;}}
    else{if(g.status==='dead'||presetFresh(g))resetRun(g);g.start();}
    refresh();canvas?.focus?.({preventScroll:true});save();}
  // A finished or never-started preset game picks up the current difficulty or pace before it begins.
  function presetFresh(g){return !!g&&(g.status==='dead'||g.status==='idle')&&!!(gabuLevels[activeMode]||toyPaces[activeMode]);}
  function resetRun(g=active()){
    if(activeMode==='bird'||activeMode==='gabi')g.reset(game.mode,settings.difficulty,bests[game.mode]);
    else if(activeMode==='match3')g.reset(matchTimerSeconds);
    else if(activeMode==='duck')g.reset(duckTimerSeconds,duckSpeed);
    else if(gabuLevels[activeMode])g.reset(gabuLevels[activeMode]);
    else if(toyPaces[activeMode])g.reset(toyPaces[activeMode]);
    else g.reset();
  }
  function restart(){const g=active();if(activeMode==='plinko'){tickets=Math.min(100000000,tickets+plinko.cancel());}
    else if(activeMode==='slots'){tickets=Math.min(100000000,tickets+slots.cancel());}
    else resetRun(g);selectedCell=-1;keyboardCursor=-1;reactions.clear();save();refresh();refreshReaction();}
  function pointerCell(e){
    const rect=canvas?.getBoundingClientRect?.();
    if(!rect?.width||!rect?.height)return -1;
    return matchCellAt(((e.clientX??0)-rect.left)*360/rect.width,((e.clientY??0)-rect.top)*452/rect.height,match3.width);
  }
  function selectMatchCell(cell){
    if(cell<0||match3.status==='dead')return;
    match3.touch();if(match3.status==='paused')match3.start();
    if(selectedCell===cell){selectedCell=-1;return;}
    if(selectedCell<0){selectedCell=cell;return;}
    const a=selectedCell;const w=match3.width,adjacent=Math.abs(a%w-cell%w)+Math.abs(Math.floor(a/w)-Math.floor(cell/w))===1;
    if(adjacent){match3.swap(a,cell);selectedCell=-1;save();}else selectedCell=cell;
  }
  function classicPointer(e){
    const current=classicGames[activeMode];
    if(current.status!=='playing'){play();return;}
    const rect=canvas.getBoundingClientRect();if(!rect?.width||!rect?.height)return;
    const x=(e.clientX-rect.left)*360/rect.width,y=(e.clientY-rect.top)*452/rect.height;
    toyKeys=false;
    if(activeMode==='chess'){chessCursor=-1;current.select(chessSquareAt(x,y));}
    else if(activeMode==='berry'){const col=berryColumnAt(x,y);if(current.phase==='over')current.nextRound();else if(col>=0)current.drop(col);}
    else if(activeMode==='tictac'){const cell=tictacCellAt(x,y);if(current.phase==='over')current.nextRound();else if(cell>=0)current.place(cell);}
    else if(activeMode==='cake')current.release();
    else if(activeMode==='boop'){const hole=boopHoleAt(x,y,current);if(hole>=0)current.boop(hole);}
    else if(activeMode==='wafer'){const hit=waferAt(x,y,current.layers.length,current.lean(settings.reduceMotion));current.choose(hit?hit.row:-1,hit?hit.slot:0);}
    else if(activeMode==='memory'){const card=capsuleAt(x,y,current.cols,current.rows);if(card>=0)current.flip(card);}
    else if(activeMode==='bubble'){current.setAim(x,y);bubbleAiming=true;try{canvas?.setPointerCapture?.(e.pointerId);}catch{}}
    else if(activeMode==='tetris'){
      const control=tetrisControlAt(x,y);
      if(control==='left')current.move(-1);else if(control==='right')current.move(1);
      else if(control==='rotate')current.rotate();else if(control==='down')current.softDrop();
      else if(control==='drop')current.hardDrop();else if(control==='hold')current.hold();
    }else if(activeMode==='froggy'){
      const direction=froggyControlAt(x,y);if(direction)current.hop(direction);
    }else{
      solitaireCursor=-1;current.select(solitaireHitAt(x,y,current));
    }
    flushClassic();save();refresh();
  }
  const DIGITS=Array.from({length:9},(_,i)=>`Digit${i+1}`);
  // These games use Enter as their own action key; P and the main button still pause them.
  const ENTER_ACTS=new Set(['solitaire','chess','berry','tictac','cake','bubble','boop','wafer','memory']);
  function classicKey(e){
    const current=classicGames[activeMode];
    if(e.code==='KeyP'||(e.code==='Enter'&&!ENTER_ACTS.has(activeMode))){
      e.preventDefault();e.stopPropagation();if(!e.repeat)play();return;
    }
    const directions={ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right'};
    const keys=activeMode==='tetris'?['Space','KeyX','KeyZ','KeyC',...Object.keys(directions)]:activeMode==='froggy'?Object.keys(directions):
      activeMode==='chess'?['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter','Space','KeyU','KeyZ','Backspace','Escape']:
      activeMode==='berry'?['ArrowLeft','ArrowRight','KeyA','KeyD','ArrowDown','KeyS','Enter','Space',...DIGITS.slice(0,BERRY_COLS)]:
      activeMode==='tictac'||activeMode==='boop'?[...Object.keys(directions),'Enter','Space',...DIGITS]:
      activeMode==='wafer'?[...Object.keys(directions),'Enter','Space','Escape']:
      activeMode==='memory'?[...Object.keys(directions),'Enter','Space']:
      activeMode==='cake'?['Space','Enter','ArrowDown','KeyS']:
      activeMode==='bubble'?['ArrowLeft','ArrowRight','KeyA','KeyD','ArrowUp','KeyW','Space','Enter','KeyC','KeyX']:
      ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter','Space','KeyD','KeyF','KeyU','KeyZ','Backspace','Escape'];
    if(!keys.includes(e.code))return;
    e.preventDefault();e.stopPropagation();toyKeys=true;
    if((activeMode==='solitaire'&&current.won||activeMode==='chess'&&current.status==='dead')&&['KeyU','KeyZ','Backspace'].includes(e.code)){
      if(!e.repeat){current.undo();solitaireCursor=-1;flushClassic();save();refresh();}return;
    }
    if(current.status!=='playing'){
      // Keyboard input never advances a paused run behind its overlay.
      if(e.code==='Enter'||e.code==='Space'){if(!e.repeat)play();}return;
    }
    if(activeMode==='tetris'){
      if(e.code==='ArrowLeft'||e.code==='KeyA')current.move(-1);
      else if(e.code==='ArrowRight'||e.code==='KeyD')current.move(1);
      else if(e.code==='ArrowDown'||e.code==='KeyS')current.softDrop();
      else if(!e.repeat){
        if(e.code==='Space')current.hardDrop();else if(e.code==='KeyC')current.hold();
        else current.rotate(e.code==='KeyZ'?-1:1);
      }
    }else if(activeMode==='froggy'){
      if(!e.repeat)current.hop(directions[e.code]);
    }else if(activeMode==='chess'){
      const steps={ArrowLeft:-1,ArrowRight:1,ArrowUp:-8,ArrowDown:8};
      if(steps[e.code]){
        if(chessCursor<0)chessCursor=current.selected>=0?current.selected:52;
        else{const dest=chessCursor+steps[e.code];if(dest>=0&&dest<64&&(Math.abs(steps[e.code])!==1||Math.floor(dest/8)===Math.floor(chessCursor/8)))chessCursor=dest;}
      }else if(!e.repeat){
        if(['KeyU','KeyZ','Backspace'].includes(e.code))current.undo();
        else if(e.code==='Escape')current.selected=-1;
        else{if(chessCursor<0)chessCursor=52;current.select(chessCursor);}
      }
    }else if(activeMode==='berry'||activeMode==='tictac'){
      const over=current.phase==='over',act=()=>activeMode==='berry'?current.drop():current.place();
      // Holding an action key never repeats a move; only the cursor keys auto-repeat.
      if(e.repeat&&!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyA','KeyD','KeyW','KeyS'].includes(e.code))return;
      if(over&&(e.code==='Enter'||e.code==='Space'||DIGITS.includes(e.code)))current.nextRound();
      else if(DIGITS.includes(e.code)){const n=Number(e.code.slice(-1))-1;if(activeMode==='berry')current.drop(n);else current.place(n);}
      else if(e.code==='Enter'||e.code==='Space'||activeMode==='berry'&&(e.code==='ArrowDown'||e.code==='KeyS'))act();
      else if(activeMode==='berry')current.moveCursor(e.code==='ArrowLeft'||e.code==='KeyA'?-1:1);
      else current.moveCursor(directions[e.code]==='left'?-1:directions[e.code]==='right'?1:0,directions[e.code]==='up'?-1:directions[e.code]==='down'?1:0);
    }else if(activeMode==='boop'){
      if(DIGITS.includes(e.code)){if(!e.repeat)current.boop(Number(e.code.slice(-1))-1);}
      else if(e.code==='Enter'||e.code==='Space'){if(!e.repeat)current.boop();}
      else current.moveCursor(directions[e.code]==='left'?-1:directions[e.code]==='right'?1:0,directions[e.code]==='up'?-1:directions[e.code]==='down'?1:0);
    }else if(activeMode==='wafer'){
      // Wafer rows count up from the table, so Up climbs the tower.
      if(e.code==='Escape')current.cancel();
      else if(e.code==='Enter'||e.code==='Space'){if(!e.repeat)current.choose();}
      else if(!current.selected)current.moveCursor(directions[e.code]==='left'?-1:directions[e.code]==='right'?1:0,directions[e.code]==='up'?1:directions[e.code]==='down'?-1:0);
    }else if(activeMode==='memory'){
      if(e.code==='Enter'||e.code==='Space'){if(!e.repeat)current.flip();}
      else current.moveCursor(directions[e.code]==='left'?-1:directions[e.code]==='right'?1:0,directions[e.code]==='up'?-1:directions[e.code]==='down'?1:0);
    }else if(activeMode==='cake'){
      if(!e.repeat)current.release();
    }else if(activeMode==='bubble'){
      if(e.code==='ArrowLeft'||e.code==='KeyA')current.nudgeAim(.06);
      else if(e.code==='ArrowRight'||e.code==='KeyD')current.nudgeAim(-.06);
      else if(!e.repeat){if(e.code==='KeyC'||e.code==='KeyX')current.swap();else current.fire();}
    }else{
      const hits=current.keyboardHits();
      if(/^Arrow/.test(e.code)){
        const step=e.code==='ArrowLeft'||e.code==='ArrowUp'?-1:1;
        solitaireCursor=solitaireCursor<0?0:(solitaireCursor+step+hits.length)%hits.length;
      }else if(!e.repeat){
        if(e.code==='KeyD')current.drawStock();
        else if(['KeyU','KeyZ','Backspace'].includes(e.code)){current.undo();solitaireCursor=-1;}
        else if(e.code==='Escape')current.selection=null;
        else if(e.code==='KeyF')current.autoMove(hits[solitaireCursor]||current.selection);
        else{if(solitaireCursor<0)solitaireCursor=0;current.select(hits[solitaireCursor]);}
      }
    }
    flushClassic();save();refresh();
  }
  function pointerDown(e){
    if(e.pointerType==='mouse'&&e.button!==0)return;
    e.preventDefault();canvas?.focus?.({preventScroll:true});
    if(classicGames[activeMode]){classicPointer(e);return;}
    if(activeMode==='plinko'){const rect=canvas.getBoundingClientRect();plinkoAim=Math.max(26,Math.min(334,((e.clientX??rect.left+rect.width/2)-rect.left)*360/rect.width));doPlinkoDrop(plinkoAim);return;}
    if(activeMode==='slots'){doSlotSpin();return;}
    if(activeMode==='simon'||activeMode==='duck'){
      const rect=canvas.getBoundingClientRect();if(!rect?.width||!rect?.height)return;
      const x=(e.clientX-rect.left)*360/rect.width,y=(e.clientY-rect.top)*452/rect.height;
      if(activeMode==='simon'){if(simon.status==='idle')simon.start();else simon.press(simonCell(x,y));}
      else duck.shoot(x,y);
      save();refresh();return;
    }
    pointerStart={x:e.clientX??0,y:e.clientY??0,cell:activeMode==='match3'?pointerCell(e):-1};
    if(activeMode==='bird'||activeMode==='gabi'){
      if(game.status==='dead')game.reset(game.mode,settings.difficulty,bests[game.mode]);
      if(game.status==='paused')game.start();game.press();
    }else if(activeMode==='snake'&&snake.status==='idle')snake.start();
    else if(activeMode==='match3'){if(match3.status==='idle')match3.start();if(match3.status==='playing')match3.touch();}
    try{canvas?.setPointerCapture?.(e.pointerId);}catch{}refresh();
  }
  function pointerMove(e){
    // Bubble Bloom alone aims on hover and drag; every other game ignores movement.
    if(activeMode!=='bubble'||!canvas||classicGames.bubble.status!=='playing')return;
    if(e.pointerType!=='mouse'&&!bubbleAiming)return;
    const rect=canvas.getBoundingClientRect();if(!rect?.width||!rect?.height)return;
    classicGames.bubble.setAim((e.clientX-rect.left)*360/rect.width,(e.clientY-rect.top)*452/rect.height);
  }
  function pointerUp(e){
    if(activeMode==='bubble'&&bubbleAiming){
      bubbleAiming=false;pointerMove({...e,pointerType:'mouse',clientX:e.clientX,clientY:e.clientY});
      if(e.type!=='pointercancel')classicGames.bubble.fire();
      try{if(canvas?.hasPointerCapture?.(e.pointerId))canvas.releasePointerCapture(e.pointerId);}catch{}
      flushClassic();save();refresh();pointerStart=null;return;
    }
    if(classicGames[activeMode]){pointerStart=null;return;}
    if(activeMode==='plinko'||activeMode==='slots'||activeMode==='simon'||activeMode==='duck'){pointerStart=null;return;}
    if(activeMode==='bird'||activeMode==='gabi')game.release();
    else if(pointerStart){
      const dx=(e.clientX??0)-pointerStart.x,dy=(e.clientY??0)-pointerStart.y;
      if(activeMode==='match3'){
        const origin=pointerStart.cell,target=pointerCell(e);
        if(Math.max(Math.abs(dx),Math.abs(dy))>15&&origin>=0){
          let dest=target;
          if(dest<0){const right=Math.abs(dx)>Math.abs(dy),step=right?(dx>0?1:-1):(dy>0?match3.width:-match3.width);dest=origin+step;}
          const w=match3.width,adjacent=dest>=0&&dest<match3.board.length&&Math.abs(origin%w-dest%w)+Math.abs(Math.floor(origin/w)-Math.floor(dest/w))===1;
          if(adjacent){match3.swap(origin,dest);selectedCell=-1;save();}
        }else selectMatchCell(origin);
      }else if(Math.max(Math.abs(dx),Math.abs(dy))>18){const dir=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');if(activeMode==='snake')snake.setDirection(dir);else if(merge.move(dir))save();}
    }
    pointerStart=null;
    try{if(canvas?.hasPointerCapture?.(e.pointerId))canvas.releasePointerCapture(e.pointerId);}catch{}
    refresh();
  }
  function onKeyDown(e){
    if(e.target!==canvas)return;
    if(e.target instanceof HTMLElement&&(e.target.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)))return;
    if(classicGames[activeMode]){classicKey(e);return;}
    if(activeMode==='slots'){if(e.code==='Space'||e.code==='Enter'){e.preventDefault();e.stopPropagation();doSlotSpin();}return;}
    if(activeMode==='simon'){
      if(/^Digit[1-4]$/.test(e.code)||/^Numpad[1-4]$/.test(e.code)){e.preventDefault();e.stopPropagation();simon.press(Number(e.code.slice(-1))-1);save();refresh();}
      else if(e.code==='Space'||e.code==='Enter'){e.preventDefault();play();}return;
    }
    if(activeMode==='duck'){if(e.code==='Space'||e.code==='Enter'){e.preventDefault();play();}return;}
    if(activeMode==='plinko'){
      if(e.code==='Space'||e.code==='Enter'){e.preventDefault();e.stopPropagation();doPlinkoDrop();return;}
      if(e.code==='ArrowLeft'||e.code==='ArrowRight'){e.preventDefault();plinkoAim=Math.max(26,Math.min(334,plinkoAim+(e.code==='ArrowLeft'?-18:18)));return;}
      return;
    }
    const dirs={ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right'};
    if(activeMode==='match3'){
      const w=match3.width;
      if(match3.status==='dead'){if(e.code==='Space'||e.code==='Enter'){e.preventDefault();restart();match3.start();save();refresh();}return;}
      const dirs={ArrowUp:-w,KeyW:-w,ArrowDown:w,KeyS:w,ArrowLeft:-1,KeyA:-1,ArrowRight:1,KeyD:1};
      if(dirs[e.code]){e.preventDefault();e.stopPropagation();match3.touch();
        if(keyboardCursor<0)keyboardCursor=Math.floor(MATCH_ROWS/2)*w+Math.floor(w/2);
        else{const dest=keyboardCursor+dirs[e.code];if(dest>=0&&dest<match3.board.length&&(Math.abs(dirs[e.code])!==1||Math.floor(dest/w)===Math.floor(keyboardCursor/w)))keyboardCursor=dest;}
        return;
      }
      if(e.code==='Space'||e.code==='Enter'){e.preventDefault();e.stopPropagation();if(keyboardCursor<0)keyboardCursor=Math.floor(MATCH_ROWS/2)*w+Math.floor(w/2);selectMatchCell(keyboardCursor);return;}
      return;
    }
    if(activeMode==='snake'||activeMode==='2048'){
      if(dirs[e.code]){e.preventDefault();e.stopPropagation();if(activeMode==='snake')snake.setDirection(dirs[e.code]);else if(merge.move(dirs[e.code]))save();refresh();return;}
      if(e.code==='Space'){e.preventDefault();active().togglePause();refresh();return;}
      if(activeMode==='2048'&&(e.code==='KeyZ'||e.code==='Backspace')){e.preventDefault();merge.undo();save();refresh();}
      return;
    }
    if(e.code!=='Space'&&e.code!=='ArrowUp')return;
    if(e.repeat&&(keyHeld||game.mode==='bird')){e.preventDefault();return;}
    e.preventDefault();e.stopPropagation();if(game.status==='dead')game.reset(game.mode,settings.difficulty,bests[game.mode]);
    if(!keyHeld||game.mode==='gabi')game.press();keyHeld=true;refresh();
  }
  function onKeyUp(e){
    if(classicGames[activeMode])return;
    if(activeMode==='snake'||activeMode==='2048'||activeMode==='match3'||activeMode==='plinko'||activeMode==='simon'||activeMode==='duck'||activeMode==='slots'||(e.code!=='Space'&&e.code!=='ArrowUp')||e.target!==canvas)return;
    e.preventDefault();e.stopPropagation();keyHeld=false;game.release();
  }
  try{
    widget=ctx.ui.createFloatWidget({width:382,height:605,chromeless:true,resizable:true,snapToEdge:true,
      persistGeometry:'fuckass_funzone_arcade_v1',mobileClamp:true,touchScrollMode:'native',tooltip:'Fuckass Funzone Arcade',
      bounds:{minWidth:292,minHeight:350,maxWidth:660,maxHeight:850}});
    widget.setVisible(false);writeStyle(widget.root);
    const root=create('div','bb bb-float');rootEl=root;
    const header=create('div','bb-header');
    const logo=image('funzone_logo','bb-brand');logo.alt='Fuckass Funzone — Arcade Intermission';
    header.append(logo);
    const picker=button('bb-iconbutton bb-phone-button','',openPhone,'Choose a game');setIconLabel(picker,'phone','Games');header.append(picker);
    statusEl=create('span','bb-status','IDLE');statusEl.setAttribute('aria-live','polite');
    header.append(statusEl);
    const wallet=button('bb-wallet','',openShop,'Open prize shop with arcade tickets');wallet.title='Open prize shop';wallet.setAttribute('aria-label','Open prize shop, arcade tickets');
    wallet.append(image('coin','bb-currency-icon'));ticketEl=create('strong','bb-ticket-count','0');wallet.append(ticketEl);header.append(wallet);
    const close=button('bb-iconbutton bb-close','',hide,'Minimize arcade');setIconLabel(close,'close','Close');header.append(close);
    root.append(header);
    
    phoneEl=create('section','bb-phone');phoneEl.hidden=true;phoneEl.setAttribute('aria-label','Funzone OS app launcher');
    const phoneTop=create('div','bb-phone-top');phoneTop.append(create('strong','', 'FUNZONE OS'),create('small','', 'THE WORST PHONE. THE BEST GAMES.'));phoneEl.append(phoneTop);
    const phoneHero=create('div','bb-phone-hero');phoneHero.append(image('gabu_magnate','bb-phone-mascot'),create('div','bb-phone-copy',`${GAME_ROSTER.length} games. One highly questionable executive.`));phoneEl.append(phoneHero);
    const appGrid=create('div','bb-app-grid');
    for(const [id,label,art] of GAME_ROSTER){
      const b=button('bb-app','',()=>{switchMode(id,true);},`Open ${label}`);b.dataset.game=id;
      const artWrap=create('span','bb-app-art');artWrap.append(image(art,'bb-app-image'));
      const name=create('strong','bb-app-name',label);const best=create('small','bb-app-best','BEST 0');appBestLabels.set(id,best);
      b.replaceChildren(artWrap,name,best);appGrid.append(b);
    }
    phoneEl.append(appGrid);
    const shopLaunch=button('bb-shop-launch','',openShop,'Spend arcade tickets in the Prize Counter');
    shopLaunch.append(svgIcon('gift',21));
    const launchText=create('span','bb-shop-launch-copy');launchText.append(create('strong','', 'THE PRIZE COUNTER'),create('small','', 'Your tickets. Your questionable taste.'));
    shopLaunch.append(launchText,svgIcon('arrow',17));phoneEl.append(shopLaunch);
    phoneResume=button('bb-phone-resume','',closePhone,'Return to current game');phoneEl.append(phoneResume);
    phoneLauncherNodes.push(phoneTop,phoneHero,appGrid,shopLaunch,phoneResume);
    shopEl=create('section','bb-shop');shopEl.hidden=true;shopEl.setAttribute('aria-label','Prize Counter cosmetic shop');
    const shopHeader=create('div','bb-shop-header');
    const shopBack=button('bb-shop-back','',closeShop,'Back to Funzone OS');shopBack.append(svgIcon('arrow',17),create('span','', 'FUNZONE OS'));
    const shopHeading=create('div','bb-shop-heading');shopHeading.append(create('strong','', 'THE PRIZE COUNTER'),create('small','', 'COSMETICS ONLY. THE HOUSE KEEPS RECEIPTS.'));
    shopHeader.append(shopBack,shopHeading);shopEl.append(shopHeader);
    const shopHero=create('div','bb-shop-hero');shopHero.append(image('gabu_magnate','bb-shop-magnate'));
    const heroWords=create('div','bb-shop-hero-words');heroWords.append(create('strong','', 'Spend responsibly. Or stylishly.'),create('small','', 'Every unlock is permanent. Equip whenever you want.'));
    shopHero.append(heroWords);shopEl.append(shopHero);
    const shopCurrency=create('div','bb-shop-currency');shopCurrency.append(image('coin','bb-shop-coin'),create('span','', 'YOUR TICKETS'));
    shopWallet=create('strong','bb-shop-wallet','0');
    shopCurrency.append(shopWallet);shopEl.append(shopCurrency);
    const categories=create('div','bb-shop-filters');categories.setAttribute('role','group');categories.setAttribute('aria-label','Reward categories');
    for(const [key,name] of [['all','ALL'],['cabinet','CABINET'],['snake','SNAKE'],['plinko','PLINKO'],['merge','2048']]){
      const b=button('bb-shop-filter',name,()=>chooseShopCategory(key),`Show ${name.toLowerCase()} rewards`);
      shopFilters.set(key,b);categories.append(b);
    }
    shopEl.append(categories);
    shopResetWrap=create('div','bb-shop-original');
    shopReset=button('bb-shop-reset','',()=>resetShopSlot(shopCategory),'Restore the original look');
    shopResetWrap.append(create('span','', 'Prefer the classics?'),shopReset);shopEl.append(shopResetWrap);
    const prizeGrid=create('div','bb-prize-grid');
    for(const item of SHOP_CATALOG){
      const card=create('article','bb-prize-card');card.dataset.slot=item.slot;card.dataset.reward=item.id;
      const art=create('div','bb-prize-art');art.style.borderColor=item.color;
      art.append(image(item.asset,'bb-prize-image'));
      const swatch=create('span','bb-prize-swatch');swatch.style.background=item.color;art.append(swatch);
      card.append(art,create('strong','bb-prize-name',item.name),create('p','bb-prize-description',item.description));
      const info=create('div','bb-prize-actions');const meta=create('span','bb-prize-meta','');
      const buy=button('bb-prize-buy','',()=>shopAction(item.id),`Buy ${item.name}`);
      info.append(meta,buy);card.append(info);prizeGrid.append(card);
      shopCards.set(item.id,{node:card,button:buy,meta});
    }
    // The catalog alone scrolls; the wallet, categories and navigation remain visible.
    shopScroll=create('div','bb-shop-scroll');shopScroll.setAttribute('role','region');shopScroll.setAttribute('aria-label','Prize catalog');shopScroll.tabIndex=0;
    shopScroll.append(prizeGrid,create('p','bb-shop-fineprint','Tickets are earned by playing. Rewards are visual only, with no cash value, purchases, or gameplay advantage.'));shopEl.append(shopScroll);
    shopNotice=create('p','bb-shop-notice','');shopNotice.setAttribute('role','status');shopNotice.setAttribute('aria-live','polite');shopEl.append(shopNotice);
    phoneEl.append(shopEl);root.append(phoneEl);
    // The host drags the widget from any touch that moves, so claim touches here and let the phone scroll. The header still drags.
    bind(phoneEl,'pointerdown',e=>{if(e.pointerType==='touch')e.preventDefault();});
    canvas=create('canvas','bb-canvas');canvas.width=720;canvas.height=904;canvas.tabIndex=0;
    canvas.setAttribute('role','button');canvas.setAttribute('aria-label','Funzone playfield. Tetris: arrows, Space to drop, C to hold. Solitaire: tap source then destination, arrows and Enter to select, D to draw, Z to undo. Froggy: arrows or WASD to hop. P pauses these games. Chess: tap a piece then a square, or arrows and Enter. Berry Drop: tap a column or keys 1 to 7. Tic Tac Treats: tap a square or keys 1 to 9. Cake Tower: tap or Space to drop. Bubble Bloom: drag to aim and release, or arrows and Space. Boop-a-Bun: tap a burrow or keys 1 to 9. Wobbly Wafers: tap a wafer, then tap again on green. Gacha Match: tap two capsules. Simon: tap colors or 1 through 4. Duck Hunt: tap ducks. Slots: tap or Space to spin fictional tickets. Plinko: tap or Space to drop. Match-3: tap or drag. Snake/2048: arrows or swipe. Bird/Jetpack: tap or hold.');
    gameStage=create('div','bb-game-stage');gameStage.append(canvas);
    const plinkoHost=create('div','bb-plinko-host');
    plinkoHost.append(image('gabu_peek','bb-plinko-host-art'));
    gameStage.append(plinkoHost);
    reactionBox=create('div','bb-reaction');reactionBox.hidden=true;reactionBox.setAttribute('role','status');reactionBox.setAttribute('aria-live','polite');
    reactionPicture=image('gabu_smug','bb-reaction-face');reactionText=create('span','bb-reaction-text','');
    reactionBox.append(reactionPicture,reactionText);gameStage.append(reactionBox);root.append(gameStage);
    betBar=create('div','bb-plinko-bets');betBar.hidden=true;betBar.setAttribute('aria-label','Plinko fictional ticket wager');
    const stakeLabel=create('span','bb-stake-label','BET');betBar.append(stakeLabel);
    for(const [value,text] of [[0,'FREE'],[1,'1'],[5,'5'],[10,'10']]){const b=button('bb-stake',text,()=>{plinkoStake=value;save();refresh();},value===0?'Free practice':'Bet '+value);
      b.dataset.value=String(value);b.setAttribute('aria-label',value===0?'Practice for free':`Bet ${value} fictional tickets`);wagerButtons.set(value,b);betBar.append(b);}
    slotBar=create('div','bb-slot-bets');slotBar.hidden=true;slotBar.setAttribute('aria-label','Slots fictional ticket stake');
    slotBar.append(create('span','bb-stake-label','SPIN'));
    for(const [value,text] of [[0,'FREE'],[1,'1'],[3,'3'],[5,'5']]){const b=button('bb-stake',text,()=>{slotStake=value;save();refresh();},value===0?'Free practice':'Spend '+value+' fictional tickets');
      b.dataset.slotStake=String(value);slotButtons.set(value,b);slotBar.append(b);}
    bar=create('div','bb-controls');
    bar.append(betBar,slotBar);
    matchSizeSelect=create('select','bb-match-size-select');matchSizeSelect.setAttribute('aria-label','Match-3 board width');matchSizeSelect.title='Match-3 difficulty by number of columns';
    for(const [width,label] of [[6,'6 COL'],[7,'7 COL'],[8,'8 COL']]){const opt=create('option');opt.value=String(width);opt.textContent=label;matchSizeSelect.append(opt);}
    bind(matchSizeSelect,'change',()=>setMatchWidth(Number(matchSizeSelect.value)));bar.append(matchSizeSelect);
    footerEl=create('div','bb-footer');bar.append(footerEl);
    playButton=button('bb-mainbutton','',play,'Play game');setIconLabel(playButton,'play','PLAY');
    const resetButton=button('bb-mini','',restart,'Restart game');setIconLabel(resetButton,'restart','Restart');
    soundButton=button('bb-mini','',()=>{settings.sound=!settings.sound;save();refresh();},'Toggle sound');setIconLabel(soundButton,'mute','Sound off');
    undoButton=button('bb-mini bb-undo','',()=>{if(activeMode==='2048'||activeMode==='solitaire'||activeMode==='chess'){active().undo();solitaireCursor=-1;flushClassic();save();refresh();}},'Undo move');setIconLabel(undoButton,'undo','Undo');
    bar.append(playButton,resetButton,soundButton,undoButton);root.append(bar);
    widget.root.append(root);
    bind(canvas,'pointerdown',pointerDown);bind(canvas,'pointerup',pointerUp);bind(canvas,'pointercancel',pointerUp);bind(canvas,'pointermove',pointerMove);
    bind(root,'keydown',onKeyDown);bind(root,'keyup',onKeyUp);
    bind(window,'blur',()=>{keyHeld=false;game.release();active().pause();save();refresh();});
    bind(document,'visibilitychange',()=>{if(document.hidden){keyHeld=false;game.release();active().pause();save();refresh();}});
    bind(canvas,'contextmenu',e=>e.preventDefault());
    drawer=ctx.ui.registerDrawerTab({id:'fuckass_funzone',title:'Fuckass Funzone',shortName:'Funzone',iconSvg:FUNZONE_TAB_SVG,description:'The arcade inside your model wait time',
      keywords:['arcade','bird','gabi','gabu','jetpack','snake','2048','match3','match-3','plinko','simon','duck','slots','tetris','solitaire','froggy','chess','catmate','connect four','berry','tic tac toe','treats','cake','tower','bubble','bubble shooter','boop','bunny','whack a mole','wafer','jenga','memory','match','gacha','capsules','phone','funzone','waiting','thinking']});
    writeStyle(drawer.root);
    const panel=create('section','bb bb-drawer');
    const banner=image('funzone_logo','bb-drawer-logo');banner.alt='Fuckass Funzone Arcade';panel.append(banner);
    const hero=create('section','bb-drawer-hero');hero.setAttribute('aria-label','Funzone OS launcher');
    const heroCopy=create('div','bb-drawer-hero-copy');
    heroCopy.append(create('span','bb-drawer-eyebrow','YOUR POCKET ARCADE'),create('h2','bb-drawer-heading',`${GAME_ROSTER.length} games. One terrible idea.`),
      create('p','bb-drawer-subtitle','Your model thinks. Gabu judges. You play.'));
    const launcherButton=button('bb-drawer-os-button','',()=>{show();openPhone();},'Open Funzone OS');
    launcherButton.append(svgIcon('phone',18),create('span','', 'OPEN FUNZONE OS'),svgIcon('arrow',16));
    heroCopy.append(launcherButton);hero.append(heroCopy,image('gabu_smug','bb-drawer-hero-art'));panel.append(hero);
    const behavior=create('details','bb-drawer-behavior');behavior.dataset.section='arcade';
    const behaviorHead=create('summary','bb-drawer-behavior-head');
    const behaviorMark=create('span','bb-drawer-behavior-icon');behaviorMark.append(svgIcon('settings',19));
    const behaviorCopy=create('span','bb-drawer-behavior-copy');
    behaviorCopy.append(create('strong','', 'Arcade behavior'),create('small','', 'Generation, sound, motion & commentary'));
    behaviorHead.append(behaviorMark,behaviorCopy,svgIcon('chevron',17));behavior.append(behaviorHead);
    const globals=create('div','bb-drawer-behavior-content');behavior.append(globals);panel.append(behavior);
    const gamesTop=create('div','bb-drawer-topline');
    gamesTop.append(create('h3','bb-drawer-category','GAMES'),create('small','', 'Settings and a little survival advice.'));panel.append(gamesTop);
    const gameTabs=create('div','bb-drawer-game-tabs');gameTabs.setAttribute('role','tablist');
    gameTabs.setAttribute('aria-label','Game settings');panel.append(gameTabs);
    const gamePages=create('div','bb-drawer-game-pages');panel.append(gamePages);
    const drawerGameTabs=new Map(),drawerGamePanels=new Map();
    function setDrawerGame(id,focus=false){
      for(const [gameId,tab] of drawerGameTabs){
        const selected=gameId===id;tab.setAttribute('aria-selected',String(selected));
        tab.setAttribute('tabindex',selected?'0':'-1');
        drawerGamePanels.get(gameId).hidden=!selected;
        if(selected&&focus)tab.focus?.();
      }
    }
    for(const [id,label,art] of GAME_ROSTER){
      const tab=button('bb-drawer-game-tab','',()=>setDrawerGame(id),`Show ${label} settings`);
      tab.dataset.game=id;tab.id='bb-drawer-tab-'+id;tab.setAttribute('role','tab');
      tab.setAttribute('aria-label',`${label} settings`);tab.setAttribute('aria-controls','bb-drawer-page-'+id);
      const pic=image(art,'bb-drawer-game-art');pic.alt='';
      tab.append(pic,create('span','bb-drawer-game-name',label));gameTabs.append(tab);drawerGameTabs.set(id,tab);
      const page=create('section','bb-drawer-game-page');page.dataset.game=id;
      page.id='bb-drawer-page-'+id;page.setAttribute('role','tabpanel');page.setAttribute('aria-labelledby',tab.id);
      const pageTitle=create('div','bb-drawer-page-title');pageTitle.append(image(art,'bb-drawer-page-art'),create('h4','',label));
      page.append(pageTitle);gamePages.append(page);drawerGamePanels.set(id,page);
    }
    bind(gameTabs,'keydown',e=>{
      const ids=GAME_IDS;const current=ids.findIndex(id=>drawerGameTabs.get(id)===e.target);
      if(current<0)return;
      let index=current;
      if(e.key==='ArrowRight'||e.key==='ArrowDown')index=(current+1)%ids.length;
      else if(e.key==='ArrowLeft'||e.key==='ArrowUp')index=(current+ids.length-1)%ids.length;
      else if(e.key==='Home')index=0;
      else if(e.key==='End')index=ids.length-1;
      else return;
      e.preventDefault();e.stopPropagation();setDrawerGame(ids[index],true);
    });
    setDrawerGame(GAME_IDS.includes(activeMode)?activeMode:'match3');
    const drawerGamePanel=id=>{
      const panel=drawerGamePanels.get(id);if(!panel)throw Error('Unknown settings game: '+id);
      return panel;
    };
    function makeToggle(destination,label,key,help){
      const line=create('label','bb-setting'),info=create('span','bb-setting-label');
      info.append(create('strong','',label),create('small','',help));const input=create('input');input.type='checkbox';input.checked=!!settings[key];
      bind(input,'change',()=>{settings[key]=input.checked;save();refresh();});line.append(info,input);destination.append(line);
      return input;
    }
    function makeSelect(destination,label,help,options,current,accessible,handle){
      const line=create('label','bb-drawer-choice'),description=create('span','bb-setting-label');
      description.append(create('strong','',label),create('small','',help));line.append(description);
      const select=create('select','bb-select');select.setAttribute('aria-label',accessible);
      for(const [v,text] of options){const option=create('option');option.value=String(v);option.textContent=text;select.append(option);}
      select.value=String(current);bind(select,'change',()=>handle(select.value));line.append(select);destination.append(line);return select;
    }
    function tip(dest,text){dest.append(create('p','bb-drawer-tip',text));}
    makeToggle(globals,'Open on generation','autoOpen','Automatically show the floating arcade while the model responds.');
    makeToggle(globals,'Auto-hide when idle','autoHideIdle','Hide after a response only if no game is running.');
    makeToggle(globals,'Sound effects','sound','Local arcade sounds. Muted by default.');
    makeToggle(globals,'Reduced motion','reduceMotion','Quiet decorative animations while keeping game cues visible.');
    makeToggle(globals,'Gabu commentary','gabuReactions','Enable unsolicited judgments when something important happens.');
    const flightOptions=[['chill','Chill'],['normal','Normal'],['medium','Medium · former Chaos'],['hard','Hard · no mercy']];
    function flightDifficulty(dest){
      const flightSelect=makeSelect(dest,'Flight difficulty','Shared by Bird and Jetpack. Changes apply to your next run.',flightOptions,settings.difficulty,'Flight difficulty',v=>{
        settings.difficulty=v;for(const other of flightDrawerSelects)other.value=v;
        if(game.status!=='playing'&&game.status!=='paused')game.reset(game.mode,v,bests[game.mode]);
        save();refresh();
      });flightDrawerSelects.push(flightSelect);
    }
    const birdInfo=drawerGamePanel('bird');
    tip(birdInfo,'Tap, press Space or Up to flap through pipes. Speed rises as you survive. Hard: much faster, tighter pipes, zero forgiveness.');flightDifficulty(birdInfo);
    const jetpackInfo=drawerGamePanel('gabi');
    tip(jetpackInfo,'Hold to thrust. Coins instantly add a ticket to your wallet, even if you crash; five new obstacle-score points earn another. Hard: faster towers, narrower gaps, just one heart.');flightDifficulty(jetpackInfo);
    const snakeInfo=drawerGamePanel('snake');
    tip(snakeInfo,'Swipe or use Arrow keys / WASD. The snake gets faster with every snack. Every two new personal-best snacks earn a ticket. Hitting a wall or your body ends the run.');
    const mergeInfo=drawerGamePanel('2048');
    tip(mergeInfo,'Swipe or use Arrow keys / WASD to merge equal tiles. Every 64 new personal-best points earn a ticket. Undo does not duplicate rewards.');
    const matchInfo=drawerGamePanel('match3');
    matchDrawerSelect=makeSelect(matchInfo,'Board difficulty','Each width keeps a separate saved board.',[[6,'Cozy · 6×7'],[7,'Classic · 7×7'],[8,'Busy · 8×7']],match3.width,'Match-3 difficulty',v=>setMatchWidth(Number(v)));
    matchTimerSelect=makeSelect(matchInfo,'Timer mode','Zen is untimed. Timed challenges end at zero. Changes apply on your next new board.',[[0,'Zen · untimed'],[60,'Sprint · 1 min'],[120,'Arcade · 2 min'],[180,'Relaxed · 3 min']],matchTimerSeconds,'Match-3 timer mode',v=>{
      matchTimerSeconds=Number(v);save();refresh();
    });
    matchHintSelect=makeSelect(matchInfo,'Pity hint delay','After no moves or taps for a while, highlight one legal swap. Pauses during game pause.',
      [[0,'Off'],[8,'8 seconds'],[12,'12 seconds'],[20,'20 seconds']],matchHintSeconds,'Match-3 hint delay',v=>{
        matchHintSeconds=Number(v);match3.touch();save();refresh();
      });
    matchInfo.append(create('h4','bb-drawer-subhead','HOW THE SPECIALS WORK'));
    const specialList=create('div','bb-special-guide');
    function specialCard(asset,title,desc){
      const card=create('div','bb-special-card'),pic=image(asset,'bb-special-art');pic.alt='';
      const copy=create('span','bb-special-copy');copy.append(create('strong','',title),create('small','',desc));
      card.append(pic,copy);specialList.append(card);
    }
    specialCard('match_vec_star','Match 3','Clear three identical trinkets in a row or column.');
    specialCard('match_vec_rocket','Match 4 · Rocket','Make four in one row or column to create a rocket; swap it to clear its entire row or column.');
    specialCard('match_vec_bomb','Match 5 · Gabu bomb','Five in a line or an intersecting match creates a bomb. Swap it to clear one trinket type.');
    matchInfo.append(specialList);
    tip(matchInfo,'Create a rocket or bomb for +1 ticket each; activate one for +2 each. You also earn 1 ticket per 400 new personal-best points. No legal swaps? Use New Board.');
    const plinkoInfo=drawerGamePanel('plinko');
    tip(plinkoInfo,'Drop cat chips onto the pegs. The landing slot determines the fictional-ticket payout; practice is always free.');
    plinkoDrawerSelect=makeSelect(plinkoInfo,'Default wager','Preselect a stake for the next drop.',[[0,'Free practice'],[1,'1 ticket'],[5,'5 tickets'],[10,'10 tickets']],plinkoStake,'Plinko default wager',v=>{
      plinkoStake=Number(v);save();refresh();
    });
    const simonInfo=drawerGamePanel('simon');
    tip(simonInfo,'Watch the color pattern, then repeat it. Tap the four pads or press number keys 1–4. Two newly cleared best rounds earn one ticket. A wrong note ends the run.');
    const duckInfo=drawerGamePanel('duck');
    tip(duckInfo,'Tap flying ducks. Eight missed shots always ends the hunt, even in untimed mode. Every three hits above your previous best earns a ticket.');
    duckTimerSelect=makeSelect(duckInfo,'Hunt timer','Untimed runs end after eight misses. Timed runs also end when the clock runs out. Changes apply on your next hunt.',[[0,'Free hunt · untimed'],[30,'Sprint · 30 sec'],[45,'Classic · 45 sec'],[60,'Relaxed · 60 sec'],[90,'Marathon · 90 sec']],duckTimerSeconds,'Duck Hunt timer mode',v=>{
      duckTimerSeconds=Number(v);save();refresh();
    });
    duckSpeedSelect=makeSelect(duckInfo,'Duck speed','Controls how fast ducks cross the field and how often new ducks spawn. Changes apply on your next hunt.',[['chill','Chill · slow'],['normal','Normal'],['chaos','Chaos · fast']],duckSpeed,'Duck Hunt speed',v=>{
      duckSpeed=v;save();refresh();
    });
    const slotInfo=drawerGamePanel('slots');
    tip(slotInfo,'A three-reel fictional-ticket slot machine. Any pair pays 1× your stake; triples pay 3–40×. No cash value or purchases. FREE practice never awards tickets.');
    slotDrawerSelect=makeSelect(slotInfo,'Default stake','FREE spins pay zero; wagering 1, 3 or 5 tickets pays according to the reels.',[[0,'FREE practice'],[1,'1 ticket'],[3,'3 tickets'],[5,'5 tickets']],slotStake,'Slots default stake',v=>{slotStake=Number(v);save();refresh();});
    const tetrisInfo=drawerGamePanel('tetris');
    tip(tetrisInfo,'Clear full rows of blocks. Left/Right or A/D moves; Up/W/X rotates clockwise and Z counterclockwise; Down/S soft drops; Space hard drops; C holds one piece per turn. Touch buttons provide the same actions. P or the main button pauses. Every 1,000 new personal-best points earns a ticket.');
    const solitaireInfo=drawerGamePanel('solitaire');
    tip(solitaireInfo,'Draw-one Klondike: tap the stock to draw, then tap a face-up card or run and its destination. Build tableau columns down in alternating colors; only Kings fill empty columns. Build foundations up from Ace by suit. Empty stock recycles the waste. Undo uses the Undo button or Z/U. Keyboard: arrows choose a pile/card, Enter selects, D draws, F sends the chosen top card to a foundation, Escape cancels selection, P pauses. Score is 10 per foundation card; every 100 new personal-best points earns a ticket.');
    const froggyInfo=drawerGamePanel('froggy');
    tip(froggyInfo,'Hop with Arrow keys, WASD, or the touch pad. Dodge road traffic, ride logs across the river, and fill all five different home slots to advance. Water without a log, cars, and occupied homes cost a life. You have three lives; P or the main button pauses. Every 100 new personal-best points earns a ticket.');
    const chessInfo=drawerGamePanel('chess');
    tip(chessInfo,'Full-rules chess against Gabu, with castling, en passant and promotion (pawns promote to a queen). Tap a cream kitten, then a glowing paw print. The hat is the piece: crown king, tiara queen, turret rook, pointy-hat bishop, helmet knight, bare-headed pawn. Keyboard: arrows pick a square, Enter or Space selects, Escape cancels. Z/U or Undo takes back your move and Gabu\u2019s reply. Score is 10 per point of material you capture plus a checkmate bonus; every 100 new personal-best points earns a ticket.');
    presetSelects.set('chess',makeSelect(chessInfo,'Gabu difficulty','How far ahead Gabu looks. Changes apply to your next new game.',GABU_LEVELS,gabuLevels.chess,'Catmate Chess difficulty',v=>{gabuLevels.chess=v;save();refresh();}));
    const berryInfo=drawerGamePanel('berry');
    tip(berryInfo,'Drop strawberries into the basket and connect four in a row, column or diagonal before Gabu\u2019s blueberries do. Tap a column, use Left/Right then Space or Down, or press 1\u20137. Each won round adds to your streak score and a draw adds a little; one loss ends the streak. Who starts alternates every round. Every 100 new personal-best points earns a ticket.');
    presetSelects.set('berry',makeSelect(berryInfo,'Gabu difficulty','How far ahead Gabu looks. Changes apply to your next new streak.',GABU_LEVELS,gabuLevels.berry,'Berry Drop difficulty',v=>{gabuLevels.berry=v;save();refresh();}));
    const treatsInfo=drawerGamePanel('tictac');
    tip(treatsInfo,'Tic-tac-toe with pocky crosses against Gabu\u2019s donuts. Tap a square, use the arrows and Space, or press 1\u20139 (top-left to bottom-right). Wins and draws build your streak score; one loss ends it. Hard Gabu never makes a mistake, so a draw is the best result there. Every 100 new personal-best points earns a ticket.');
    presetSelects.set('tictac',makeSelect(treatsInfo,'Gabu difficulty','How often Gabu slips up. Changes apply to your next new streak.',GABU_LEVELS,gabuLevels.tictac,'Tic Tac Treats difficulty',v=>{gabuLevels.tictac=v;save();refresh();}));
    const cakeInfo=drawerGamePanel('cake');
    tip(cakeInfo,'Tap, Space, Enter or Down drops the swinging tier. Land it dead center for a PERFECT that steadies the tower and builds a streak; sloppy drops make it wobble. A tier only stays if its middle sits over the tier below; a wobbly cake is harder to aim at. Each missed tier costs one of three hearts. Every 100 new personal-best points earns a ticket.');
    presetSelects.set('cake',makeSelect(cakeInfo,'Swing pace','Chill swings slower with a wider perfect window; Chaos swings faster with a tighter one. Changes apply to your next cake.',TOY_PACES.cake,toyPaces.cake,'Cake Tower pace',v=>{toyPaces.cake=v;save();refresh();}));
    const bubbleInfo=drawerGamePanel('bubble');
    tip(bubbleInfo,'Drag to aim and release to shoot, or aim with Left/Right and shoot with Space. C swaps in the next bubble. Three or more of a kind pop, and anything left hanging falls for bonus points. Every few misses a new row pushes down; a bubble past the dashed line ends the run. Clear the board to level up. Every 300 new personal-best points earns a ticket.');
    presetSelects.set('bubble',makeSelect(bubbleInfo,'Board difficulty','Chill uses fewer colors and forgives more misses; Chaos adds a color and pushes rows sooner. Changes apply to your next run.',TOY_PACES.bubble,toyPaces.bubble,'Bubble Bloom difficulty',v=>{toyPaces.bubble=v;save();refresh();}));
    const boopInfo=drawerGamePanel('boop');
    tip(boopInfo,'Bunnies pop out of the nine burrows; boop them before they duck back down. Golden bunnies are worth 50 and every five-boop streak adds a bonus. Gabu\u2019s little robots are decoys: booping one costs 20 points and your streak. Tap a burrow, press 1\u20139 (top-left to bottom-right), or move with the arrows and boop with Space. Rounds last 45 seconds. Every 100 new personal-best points earns a ticket.');
    presetSelects.set('boop',makeSelect(boopInfo,'Bunny pace','Chill bunnies stay up longer and fewer pop up at once; Chaos bunnies are quick and crowded. Changes apply to your next round.',TOY_PACES.boop,toyPaces.boop,'Boop-a-Bun pace',v=>{toyPaces.boop=v;save();refresh();}));
    const waferInfo=drawerGamePanel('wafer');
    tip(waferInfo,'Take turns with Gabu pulling wafers from the tower and stacking them on top. Tap a wafer to pick it, then tap again while the steady-hand meter is green for a clean pull; sloppy pulls make the tower wobble. You can\u2019t pull from the top two layers, and a layer left with only an edge wafer tips everything above it. The outline turns yellow on risky wafers and red on ones that would topple the tower. Whoever topples the tower loses the round; Gabu toppling it extends your streak. Arrows move, Space picks and pulls, Escape cancels. Every 100 new personal-best points earns a ticket.');
    presetSelects.set('wafer',makeSelect(waferInfo,'Gabu difficulty','How steady Gabu\u2019s paws are and how well Gabu picks wafers. Changes apply to your next new streak.',GABU_LEVELS,gabuLevels.wafer,'Wobbly Wafers difficulty',v=>{gabuLevels.wafer=v;save();refresh();}));
    const memoryInfo=drawerGamePanel('memory');
    tip(memoryInfo,'Each new tray starts with every capsule open for a few seconds so you can memorize the charms (3 on Cozy, 3.5 on Classic, 4 on Busy); tap to start early. Then open two capsules at a time to find matching pairs. Matches in a row build a streak bonus, and finishing the tray adds a bonus that shrinks with every miss. Tap a capsule, or use the arrows and Space. Every 100 new personal-best points earns a ticket.');
    presetSelects.set('memory',makeSelect(memoryInfo,'Board size','Cozy has 6 pairs, Classic 8 and Busy 10. Changes apply to your next new tray.',[['cozy','Cozy · 6 pairs'],['classic','Classic · 8 pairs'],['busy','Busy · 10 pairs']],toyPaces.memory,'Gacha Match board size',v=>{toyPaces.memory=v;save();refresh();}));
    const scoreHeader=create('div','bb-drawer-topline bb-drawer-scores-header');scoreHeader.append(create('h3','bb-drawer-category','PERSONAL BESTS'));
    panel.append(scoreHeader);highs=create('div','bb-bests');
    for(const [id,label,art] of GAME_ROSTER){
      const row=create('div','bb-best-row');row.append(image(art,'bb-best-art'),create('span','bb-best-name',label));
      const value=create('strong','bb-best-value','0');drawerBestLabels.set(id,value);row.append(value);highs.append(row);
    }
    panel.append(highs);
    panel.append(button('bb-quiet','Clear high scores',()=>{
      for(const id of Object.keys(bests))bests[id]=0;
      if(game.status!=='playing')game.reset(game.mode,settings.difficulty,0);
      save();refresh();
    }));
    drawer.root.append(panel);
    try{action=ctx.ui.registerInputBarAction({id:'fuckass_funzone_launch',label:'Fuckass Funzone',subtitle:'Arcade intermission',iconSvg:FUNZONE_TAB_SVG,tooltip:'Open Fuckass Funzone'});
      off.push(action.onClick(()=>{show();canvas.focus({preventScroll:true});}));}
    catch(err){console.info('[Fuckass Funzone] Chat bar action not available:',err);}
    for(const [event,type] of [['GENERATION_STARTED','start'],['GENERATION_ENDED','end'],['GENERATION_STOPPED','stop']]){
      off.push(ctx.events.on(event,payload=>{
        if(disposed)return;const id=payload?.generationId||payload?.generation_id||'unknown';const prev=lifecycle;
        lifecycle=lifecycleTransition(lifecycle,type,id);
        if(type==='start'&&settings.autoOpen&&!shown&&!prev.activeIds.includes(id))show();
        if((type==='end'||type==='stop')&&settings.autoHideIdle&&active().status!=='playing'&&active().status!=='paused'&&shown)hide();
        refresh();
      }));
    }
    refresh();
    return function teardown(){if(disposed)return;disposed=true;stopRaf();game.release();save();sound.dispose();
      for(const fn of [...off,...listeners])try{fn();}catch{};
      safeDestroy(action);safeDestroy(drawer);safeDestroy(widget);canvas=null;statusEl=null;footerEl=null;reactions.clear();};
  }catch(err){disposed=true;stopRaf();sound.dispose();for(const fn of [...off,...listeners])try{fn();}catch{};
    safeDestroy(action);safeDestroy(drawer);safeDestroy(widget);throw err;}
}
