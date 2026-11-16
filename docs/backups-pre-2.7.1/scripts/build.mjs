/** Zero-dependency reproducible bundler. Fail before writes on uncertain anchors.
 * Source + sprites -> self-contained browser dist/frontend.js (no asset URL problems).
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
// Git may check out CRLF on Windows; import anchors use canonical LF.
const read=(p)=>{
  const source=fs.readFileSync(path.join(root,p),'utf8');
  return /\.(?:js|css)$/.test(p)?source.replace(/\r\n/g,'\n'):source;
};
const matches=(text,frag)=>(text.split(frag).length-1);
function requireOnce(src, needle, place) {
  if(matches(src,needle)!==1) throw Error(`${place}: expected exactly one build anchor: ${needle}`);
}
const engine=read('src/engine.js');
const puzzles=read('src/puzzles.js');
const puzzleRender=read('src/puzzle-render.js');
const match3=read('src/match3.js');
const matchRender=read('src/match3-render.js');
const reactions=read('src/reactions.js');
const plinko=read('src/plinko.js');
const plinkoRender=read('src/plinko-render.js');
const shop=read('src/shop.js');
const miniGames=read('src/mini-games.js');
const miniRender=read('src/mini-games-render.js');
const rewards=read('src/rewards.js');
const classicModules=[
  ['tetris', 'TetrisGame'],['tetris-render', 'drawTetris, tetrisControlAt'],
  ['solitaire', 'SolitaireGame'],['solitaire-render', 'drawSolitaire, solitaireHitAt'],
  ['froggy', 'FroggyGame'],['froggy-render', 'drawFroggy, froggyControlAt'],
  ['chess', 'ChessGame, CHESS_LEVELS'],['chess-render', 'drawChess, chessSquareAt'],
  ['connect', 'BerryDropGame, BERRY_COLS'],['connect-render', 'drawBerryDrop, berryColumnAt'],
  ['tictac', 'TicTacTreatsGame'],['tictac-render', 'drawTicTacTreats, tictacCellAt'],
  ['cake', 'CakeTowerGame, CAKE_PACES'],['cake-render', 'drawCakeTower'],
  ['bubble', 'BubbleGame, BUBBLE_PACES'],['bubble-render', 'drawBubbleBloom'],
  ['boop', 'BoopGame, BOOP_PACES'],['boop-render', 'drawBoopABun, boopHoleAt'],
  ['wafer', 'WobblyWafersGame'],['wafer-render', 'drawWobblyWafers, waferAt'],
  ['memory', 'GachaMatchGame, MEMORY_SIZES'],['memory-render', 'drawGachaMatch, capsuleAt'],
];
// Isolate each new game's helpers while making its named exports available to its renderer.
function bundleClassicModule(name){
  const source=read(`src/${name}.js`);
  const publicNames=[...source.matchAll(/^export\s+(?:const|let|class|function)\s+(\w+)/gm)].map(match=>match[1]);
  if(!publicNames.length)throw Error(`No public exports in ${name}`);
  const body=source.replace(/^import\s+\{[^}]*\}\s+from\s+['"]\.\/(?:tetris|solitaire|froggy|chess|connect|tictac|cake|bubble|boop|wafer|memory)\.js['"];?\s*$/gm,'').replace(/^export\s+/gm,'');
  return `const {${publicNames.join(',')}}=(()=>{\n${body}\nreturn {${publicNames.join(',')}};\n})();`;
}
let ui=read('src/frontend.js');
const css=read('src/style.css');
const arcadeSvg=read('assets/funzone/arcade-tab.svg').trim();
if(!/^<svg\s[^>]*xmlns="http:\/\/www\.w3\.org\/2000\/svg"/.test(arcadeSvg) || !arcadeSvg.includes('viewBox="0 0 32 32"') || !arcadeSvg.endsWith('</svg>') || /<\/?(?:script|foreignObject|image|text|use|style)\b|on(?:load|click|error)\s*=|href\s*=|url\s*\(|https?:\/\/(?!www\.w3\.org\/2000\/svg)/i.test(arcadeSvg)) throw Error('Unsafe or invalid arcade tab SVG');
const importAnchor="import { ArcadeEngine, WORLD, MODE, DEFAULT_SETTINGS, sanitizeSettings, lifecycleTransition, gabiFlightFrame } from './engine.js';";
const assetAnchor='const ASSETS = /* BUILD_ASSETS */ {};';
const cssAnchor="const CSS = /* BUILD_CSS */ '';";
const tabSvgAnchor="const FUNZONE_TAB_SVG = /* BUILD_TAB_SVG */ '';";
const puzzleAnchor="import { SnakeGame, Merge2048 } from './puzzles.js';";
const renderAnchor="import { drawSnake, drawMerge } from './puzzle-render.js';";
const matchAnchor="import { Match3Game, MATCH_WIDTHS, MATCH_ROWS } from './match3.js';";
const matchRenderAnchor="import { drawMatch3, matchCellAt } from './match3-render.js';";
const reactionAnchor="import { ReactionDirector } from './reactions.js';";
const plinkoAnchor="import { PlinkoGame } from './plinko.js';";
const plinkoRenderAnchor="import { drawPlinko } from './plinko-render.js';";
const shopAnchor="import { SHOP_CATALOG, SHOP_SLOTS, restoreShop, purchaseReward, equipReward } from './shop.js';";
const rewardsAnchor="import { milestonePayout, creditTickets } from './rewards.js';";
const miniAnchor="import { SimonGame, DuckGame, SlotGame } from './mini-games.js';";
const miniRenderAnchor="import { drawSimon, drawDuck, drawSlots, simonCell } from './mini-games-render.js';";
for(const [needle,label] of [[importAnchor,'engine import'],[puzzleAnchor,'puzzles import'],[renderAnchor,'render import'],[matchAnchor,'match-3 engine import'],[matchRenderAnchor,'match-3 renderer import'],[reactionAnchor,'reaction engine import'],[plinkoAnchor,'plinko engine import'],[plinkoRenderAnchor,'plinko renderer import'],[shopAnchor,'shop import'],[rewardsAnchor,'ticket rewards import'],[miniAnchor,'mini-games import'],[miniRenderAnchor,'mini-games renderer import'],[assetAnchor,'asset marker'],[cssAnchor,'CSS marker'],[tabSvgAnchor,'tab SVG marker']]) requireOnce(ui,needle,label);
for(const [name,imports] of classicModules){
  const anchor=`import { ${imports} } from './${name}.js';`;
  requireOnce(ui,anchor,`${name} import`);
  ui=ui.replace(anchor,bundleClassicModule(name));
}
const spriteNames=[...Array.from({length:6},(_,i)=>`bird_flap_${i}`),...Array.from({length:6},(_,i)=>`gabi_fly_${i}`),'bird_dizzy','bird_dead','gabi_hurt','gabi_crash','gabi_dead','cloud','coin','star','heart','flame_0','flame_1','flame_2','record_flag','best_banner','game_over_banner'];
const assetPaths=Object.fromEntries([
  ...spriteNames.map(name=>[name,`assets/sprites/${name}.png`]),
  ['cover','assets/cover/jetpack-cover.png'],['icon','assets/funzone/funzone-icon.png'],
  ['funzone_logo','assets/funzone/funzone-logo.png'],
  ['snake_head','assets/funzone/snake-head.png'],['snake_snack','assets/funzone/snake-snack.png'],
  ...['apple','berry','star','fish','cookie','candy'].map(k=>[`snake_food_${k}`,`assets/funzone/snake-food-${k}.png`]),
  ['merge_tile','assets/funzone/merge-tile.png'],
  ...['cat','heart','star','fish','cookie','gem','rocket','bomb'].map(k=>[`match_${k}`,`assets/match3/match-${k}.png`]),
  ...['smug','annoyed','hype','panic','dizzy','sleepy','shock'].map(k=>[`gabu_${k}`,`assets/match3/gabu-${k}.png`]),
  ['gabu_magnate','assets/plinko/gabu-monocle.png'],['gabu_peek','assets/plinko/gabu-peek.png'],['plinko_chip','assets/plinko/cat-chip.png'],['plinko_app','assets/plinko/plinko-app.png'],
]);
const svgPaths={...Object.fromEntries(['simon','duck','slots','tetris','solitaire','froggy','chess','berry','treats','cake','bubble','boop','wafer','memory'].map(k=>[`${k}_app`,`assets/funzone/${k}-app.svg`])),...Object.fromEntries(['cat','heart','star','fish','cookie','gem','rocket','bomb'].map(k=>[`match_vec_${k}`,`assets/match3/vector/${k}.svg`])),match_vec_hint:'assets/match3/vector/hint.svg',plinko_crest:'assets/plinko/cat-crest.svg'};
const assets={};
for(const [key,p] of Object.entries(assetPaths)) {
  const contents=fs.readFileSync(path.join(root,p));
  if(contents.length<25 || !contents.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex'))) throw Error('PNG invalid '+p);
  assets[key]='data:image/png;base64,'+contents.toString('base64');
}
for(const [key,p] of Object.entries(svgPaths)) {
  const xml=read(p);
  if(!/^<svg\s[^>]*xmlns=\"http:\/\/www\.w3\.org\/2000\/svg\"/.test(xml.trim()) || !xml.includes('viewBox="0 0 64 64"') || !xml.includes('</svg>')) throw Error('SVG format invalid: '+p);
  if(/<\/?(?:script|foreignObject|image|text|use|style)\b|on(?:load|click|error)\s*=|href\s*=|url\s*\(|https?:\/\/(?!www\.w3\.org\/2000\/svg)/i.test(xml))throw Error('SVG requires self-contained vector paths: '+p);
  assets[key]='data:image/svg+xml;base64,'+Buffer.from(xml).toString('base64');
}
let pureEngine=engine.replace(/^export\s+/gm,'');
const purePuzzles=puzzles.replace(/^export\s+/gm,'');
const pureRender=puzzleRender.replace("import {SNAKE_COLS,SNAKE_ROWS,SNAKE_FOOD_KINDS} from './puzzles.js';\n",'').replace(/^export\s+/gm,'');
const pureMatch3=match3.replace(/^export\s+/gm,'');
const pureMatchRender="const {drawMatch3,matchCellAt,matchLayout}=(()=>{\n"+matchRender.replace("import {MATCH_SIZE,MATCH_ROWS,cellAt} from './match3.js';\n",'').replace(/^export\s+/gm,'')+"\nreturn {drawMatch3,matchCellAt,matchLayout};\n})();";
const pureReactions=reactions.replace(/^export\s+/gm,'');
const pureShop=shop.replace(/^export\s+/gm,'');
const pureRewards=rewards.replace(/^export\s+/gm,'');
const miniPublic='SimonGame,DuckGame,SlotGame,SIMON_COLORS,DUCK_DURATION,DUCK_TIMER_MODES,DUCK_SPEEDS,SLOT_SYMBOLS';
const pureMini=`const {${miniPublic}}=(()=>{\n${miniGames.replace(/^export\s+/gm,'')}\nreturn {${miniPublic}};\n})();`;
const miniRenderPublic='drawSimon,drawDuck,drawSlots,simonCell';
const pureMiniRender=`const {${miniRenderPublic}}=(()=>{\n${miniRender.replace("import { DUCK_DURATION, SIMON_COLORS, SLOT_SYMBOLS } from './mini-games.js';\n",'').replace(/^export\s+/gm,'')}\nreturn {${miniRenderPublic}};\n})();`;
const plinkoPublic='PlinkoGame,PLINKO_W,PLINKO_H,PLINKO_PEGS,PLINKO_SLOTS,PLINKO_BIN_LEFT,PLINKO_BIN_RIGHT,PLINKO_BIN_Y';
const purePlinko=`const {${plinkoPublic}}=(()=>{\n${plinko.replace(/^export\s+/gm,'')}\nreturn {${plinkoPublic}};\n})();`;
const purePlinkoRender=`const {drawPlinko}=(()=>{\n${plinkoRender.replace("import {PLINKO_W,PLINKO_H,PLINKO_PEGS,PLINKO_SLOTS,PLINKO_BIN_LEFT,PLINKO_BIN_RIGHT,PLINKO_BIN_Y} from './plinko.js';\n",'').replace(/^export\s+/gm,'')}\nreturn {drawPlinko};\n})();`;
ui=ui.replace(importAnchor,pureEngine).replace(puzzleAnchor,purePuzzles).replace(renderAnchor,pureRender)
  .replace(matchAnchor,pureMatch3).replace(matchRenderAnchor,pureMatchRender).replace(reactionAnchor,pureReactions)
  .replace(plinkoAnchor,purePlinko).replace(plinkoRenderAnchor,purePlinkoRender).replace(shopAnchor,pureShop)
  .replace(rewardsAnchor,pureRewards)
  .replace(miniAnchor,pureMini).replace(miniRenderAnchor,pureMiniRender)
  .replace(assetAnchor,'const ASSETS = '+JSON.stringify(assets)+';').replace(cssAnchor,'const CSS = '+JSON.stringify(css)+';')
  .replace(tabSvgAnchor,'const FUNZONE_TAB_SVG = '+JSON.stringify(arcadeSvg)+';');
const banner=`/* Fuckass Funzone 2.7.0 | self-contained Spindle frontend | ${Object.keys(assets).length} embedded PNG/SVG assets | generated from editable src/ */\n`;
// Artifact is validated in memory before writes.
const candidate=banner+ui;
if(/^import\s/m.test(candidate))throw Error('Unresolved runtime import');
if(candidate.includes('BUILD_ASSETS')||candidate.includes('BUILD_CSS')||candidate.includes('BUILD_TAB_SVG')||candidate.includes("from './engine.js'")||candidate.includes("from './puzzles.js'")||candidate.includes("from './puzzle-render.js'")||candidate.includes("from './match3.js'")||candidate.includes("from './match3-render.js'")||candidate.includes("from './reactions.js'")||candidate.includes("from './plinko.js'")||candidate.includes("from './plinko-render.js'")||candidate.includes("from './rewards.js'")||candidate.includes("from './shop.js'")||candidate.includes("from './mini-games.js'")||candidate.includes("from './mini-games-render.js'"))throw Error('Unresolved build marker');
const old=path.join(root,'dist/frontend.js');
fs.mkdirSync(path.dirname(old),{recursive:true});
const temp=old+'.tmp';
fs.writeFileSync(temp,candidate);
fs.renameSync(temp,old);
console.log('Built dist/frontend.js',Math.round(candidate.length/1024),'KiB with',Object.keys(assets).length,'embedded PNG/SVG assets');
