import test from 'node:test';
import assert from 'node:assert/strict';
import { setup } from '../dist/frontend.js';
import { findMatchRuns, findMatchMove } from '../src/match3.js';
import { matchLayout } from '../src/match3-render.js';

class ElementMock {
  constructor(tag='div') {this.tagName=tag.toUpperCase();this.children=[];this.listeners=new Map();this.attributes=new Map();this.style={};this.className='';this.textContent='';this.dataset={};this.checked=false;this.complete=true;this.naturalWidth=120;this.naturalHeight=120;
    this.classList={toggle:(cls,on)=>{const s=new Set(this.className.split(' ').filter(Boolean));if(on)s.add(cls);else s.delete(cls);this.className=[...s].join(' ');}}; }
  append(...nodes){this.children.push(...nodes)} appendChild(node){this.append(node);return node;}
  replaceChildren(...nodes){this.children=[...nodes];this.textContent='';}
  setAttribute(key,value){this.attributes.set(key,value)}
  addEventListener(event,callback){if(!this.listeners.has(event))this.listeners.set(event,new Set());this.listeners.get(event).add(callback)}
  removeEventListener(event,callback){this.listeners.get(event)?.delete(callback)}
  dispatch(event,payload={}){for(const fn of [...(this.listeners.get(event)||[])])fn({target:this,preventDefault(){},stopPropagation(){},...payload});}
  focus(){}
  getBoundingClientRect(){return {left:0,top:0,width:360,height:452}}
  setPointerCapture(){} hasPointerCapture(){return false}releasePointerCapture(){}
  getContext(){if(this.tagName!=='CANVAS')return null;return {
    setTransform(){},clearRect(){},fillRect(){},strokeRect(){},beginPath(){},roundRect(){},fill(){},stroke(){},ellipse(){},arc(){},moveTo(){},lineTo(){},bezierCurveTo(){},quadraticCurveTo(){},closePath(){},fillText(){},drawImage(){},save(){},restore(){},translate(){},rotate(){},createLinearGradient(){return{addColorStop(){}}}
  };}
}
function flatten(node){return [node,...node.children.flatMap(c=>c instanceof ElementMock?flatten(c):[])];}

test('Spindle mock: mounts, starts once, survives end, handles stop and teardown without leaks',()=>{
 const old={window:globalThis.window,document:globalThis.document,Image:globalThis.Image,HTMLElement:globalThis.HTMLElement,localStorage:globalThis.localStorage,requestAnimationFrame:globalThis.requestAnimationFrame,cancelAnimationFrame:globalThis.cancelAnimationFrame};
 const window=new ElementMock('window');const document=new ElementMock('document');
 document.createElement=(tag)=>new ElementMock(tag);document.createElementNS=(_ns,tag)=>new ElementMock(tag);document.hidden=false;
 globalThis.window=window;globalThis.document=document;globalThis.HTMLElement=ElementMock;
 globalThis.Image=class extends ElementMock {constructor(){super('img')}set src(url){this._src=url}get src(){return this._src}};
 const cache=new Map();cache.set('fuckass_funzone:v1:test-profile',JSON.stringify({tickets:250}));globalThis.localStorage={getItem:k=>cache.get(k)||null,setItem:(k,v)=>cache.set(k,v)};
 const queued=new Map();let id=0;
 globalThis.requestAnimationFrame=(cb)=>{queued.set(++id,cb);return id};globalThis.cancelAnimationFrame=id=>queued.delete(id);
 const ws=new Map();const placements={widget:null,drawer:null,action:null};
 const ctx={host:{extensionInstallationId:'test-profile'},events:{on:(event,fn)=>{ws.set(event,fn);return()=>ws.delete(event)}},ui:{
   createFloatWidget:()=>{
    const h={root:new ElementMock('section'),visible:null,destroyed:false,setVisible(v){this.visible=v},destroy(){this.destroyed=true}};
    placements.widget=h;return h;
   },
   registerDrawerTab:(options)=>{placements.drawerOptions=options;const h={root:new ElementMock('section'),destroyed:false,destroy(){this.destroyed=true}};placements.drawer=h;return h;},
   registerInputBarAction:(options)=>{placements.actionOptions=options;const h={destroyed:false,onClick(fn){this.click=fn;return()=>{this.click=null}},destroy(){this.destroyed=true}};placements.action=h;return h;}
 }};
 try {
  const stop=setup(ctx);assert.equal(placements.widget.visible,false);assert.equal(ws.size,3);
  assert.match(placements.drawerOptions.iconSvg, /viewBox="0 0 32 32"/,'uses the supplied SVG rather than host generic extension icon');
  assert.match(placements.drawerOptions.iconSvg, /M30\.47 4\.57/,'supplied arcade path is intact');
  assert.equal(placements.actionOptions.iconSvg,placements.drawerOptions.iconSvg,'the chat launcher also uses the custom SVG');
  assert.equal(placements.actionOptions.iconName,undefined,'old generic icon name is gone');
  const sidebar=flatten(placements.drawer.root);
  assert.equal(sidebar.some(x=>/debug|\+500 coins/i.test(x.className+' '+x.textContent)),false,'no debug coin button in drawer');
  assert.equal(window.__funzoneAddCoins,undefined,'no debug wallet shortcut exposed globally');
  assert.equal(sidebar.filter(x=>x.className==='bb-drawer-os-button').length,1,'one prominent Funzone OS launcher');
  assert.equal(sidebar.filter(x=>x.className==='bb-launch').length,0,'no six direct-launch buttons cluttering the drawer');
  assert.equal(sidebar.filter(x=>x.className==='bb-cover').length,0,'no redundant giant cover under the logo');
  const behavior=sidebar.filter(x=>x.className==='bb-drawer-behavior');
  assert.equal(behavior.length,1,'Arcade behavior is independently collapsible');
  const gameTabs=sidebar.filter(x=>x.className==='bb-drawer-game-tab');
  const gamePanels=sidebar.filter(x=>x.className==='bb-drawer-game-page');
  const modes=['bird','gabi','snake','2048','match3','plinko','simon','duck','slots','tetris','solitaire','froggy','chess','berry','tictac','cake','bubble','boop','wafer','memory'];
  assert.deepEqual(gameTabs.map(x=>x.dataset.game),modes,'all twenty games have compact tabs');
  assert.deepEqual(gamePanels.map(x=>x.dataset.game),modes,'all twenty games have independent help panels');
  assert.equal(sidebar.filter(x=>x.attributes.get('role')==='tablist').length,1,'one radio-style tablist');
  assert.equal(sidebar.filter(x=>x.className==='bb-drawer-details').length,0,'accordion skyscraper removed');
  const selectedTabs=()=>gameTabs.filter(x=>x.attributes.get('aria-selected')==='true');
  const visiblePanels=()=>gamePanels.filter(x=>!x.hidden);
  assert.equal(selectedTabs().length,1,'exactly one selected tab on mount');
  assert.equal(visiblePanels().length,1,'exactly one visible game panel on mount');
  const tabBy=id=>gameTabs.find(x=>x.dataset.game===id);
  const clickTab=id=>tabBy(id).dispatch('click');
  clickTab('match3');
  assert.equal(selectedTabs()[0].dataset.game,'match3');
  assert.equal(visiblePanels()[0].dataset.game,'match3');
  const matchingTabArtwork=tabBy('match3').children.find(x=>x.className==='bb-drawer-game-art');
  assert.match(matchingTabArtwork.src,/^data:image\/svg\+xml;base64,/,'new cat is vector artwork');
  const tablist=sidebar.find(x=>x.className==='bb-drawer-game-tabs');
  tablist.dispatch('keydown',{key:'ArrowRight',target:tabBy('match3')});
  assert.equal(selectedTabs()[0].dataset.game,'plinko','right arrow follows tab order');
  assert.equal(visiblePanels()[0].dataset.game,'plinko');
  tablist.dispatch('keydown',{key:'Home',target:tabBy('plinko')});
  assert.equal(selectedTabs()[0].dataset.game,'bird','Home focuses first game');
  tablist.dispatch('keydown',{key:'End',target:tabBy('bird')});
  assert.equal(selectedTabs()[0].dataset.game,'memory','End focuses last game');
  clickTab('match3');
  assert.equal(visiblePanels().length,1,'never displays stacked game pages');
  const specials=sidebar.filter(x=>x.className==='bb-special-card');assert.equal(specials.length,3,'explains match-3, rocket and bomb');
  assert.ok(specials.every(x=>x.children.some(c=>c.className==='bb-special-art')),'specials use illustrated SVG art');
  const hintChoice=sidebar.find(x=>x.attributes.get('aria-label')==='Match-3 hint delay');
  assert.equal(hintChoice.value,'12','new default waits longer');
  hintChoice.value='20';hintChoice.dispatch('change');
  assert.equal(JSON.parse(cache.get('fuckass_funzone:v1:test-profile')).matchHintSeconds,20,'hint preference saves immediately');
  hintChoice.value='0';hintChoice.dispatch('change');
  assert.equal(JSON.parse(cache.get('fuckass_funzone:v1:test-profile')).matchHintSeconds,0,'hints can be disabled');
  hintChoice.value='12';hintChoice.dispatch('change');
  const matchClock=sidebar.find(x=>x.attributes.get('aria-label')==='Match-3 timer mode');
  assert.ok(matchClock);assert.equal(matchClock.value,'0','existing boards stay untimed by default');
  matchClock.value='120';matchClock.dispatch('change');
  assert.equal(JSON.parse(cache.get('fuckass_funzone:v1:test-profile')).matchTimerSeconds,120);
  const duckClock=sidebar.find(x=>x.attributes.get('aria-label')==='Duck Hunt timer mode');
  const duckPace=sidebar.find(x=>x.attributes.get('aria-label')==='Duck Hunt speed');
  assert.ok(duckClock&&duckPace);assert.equal(duckClock.value,'45');assert.equal(duckPace.value,'normal');
  duckClock.value='90';duckClock.dispatch('change');duckPace.value='chaos';duckPace.dispatch('change');
  let configured=JSON.parse(cache.get('fuckass_funzone:v1:test-profile'));
  assert.equal(configured.duckTimerSeconds,90);assert.equal(configured.duckSpeed,'chaos');
  const flights=sidebar.filter(x=>x.attributes.get('aria-label')==='Flight difficulty');
  assert.equal(flights.length,2,'Bird and Jetpack have their own panels, with a shared flight setting');
  assert.deepEqual(flights[0].children.map(option=>option.value),['chill','normal','medium','hard'],'all flight difficulties are really exposed in settings');
  assert.deepEqual(flights[1].children.map(option=>option.value),['chill','normal','medium','hard']);
  flights[0].value='hard';flights[0].dispatch('change');
  assert.equal(flights[1].value,'hard','shared difficulty stays in sync across game pages');
  assert.equal(JSON.parse(cache.get('fuckass_funzone:v1:test-profile')).settings.difficulty,'hard');
  flights[1].value='medium';flights[1].dispatch('change');
  assert.equal(flights[0].value,'medium','former Chaos remains selectable as Medium');
  assert.equal(JSON.parse(cache.get('fuckass_funzone:v1:test-profile')).settings.difficulty,'medium');
  flights[0].value='normal';flights[0].dispatch('change');
  const betChoice=sidebar.find(x=>x.attributes.get('aria-label')==='Plinko default wager');assert.ok(betChoice);
  betChoice.value='1';betChoice.dispatch('change');
  assert.equal(JSON.parse(cache.get('fuckass_funzone:v1:test-profile')).plinkoStake,1,'wager preference saves');
  betChoice.value='5';betChoice.dispatch('change');
  const buttons=flatten(placements.widget.root).filter(x=>x.tagName==='BUTTON');
  assert.ok(buttons.length>5);
  ws.get('GENERATION_STARTED')({generationId:'G1'});
  assert.equal(placements.widget.visible,true);assert.ok(queued.size>0);
  // Ticket wallet and Funzone OS both lead to the genuine, stateful reward shop.
  const flattenWidget=()=>flatten(placements.widget.root);
  const prizeWallet=flattenWidget().find(x=>x.className==='bb-wallet');
  assert.equal(prizeWallet.tagName,'BUTTON');prizeWallet.dispatch('click');
  const shopPage=flattenWidget().find(x=>x.className==='bb-shop');assert.ok(shopPage&&!shopPage.hidden);
  assert.equal(flattenWidget().some(x=>/bb-shop-debug|\+500 coins/i.test(x.className+' '+x.textContent)),false,'no +500 cheats in shop or cabinet');
  assert.equal(flattenWidget().find(x=>x.className==='bb-shop-wallet').textContent,'250','real balance remains visible');
  const shopFloat=flattenWidget().find(x=>x.className.includes('bb-float'));
  assert.equal(shopFloat.dataset.shopOpen,'true','shop-only window constraint is enabled');
  const catalog=flattenWidget().find(x=>x.className==='bb-shop-scroll');assert.ok(catalog,'catalog has its own scrolling region');
  assert.equal(catalog.attributes.get('role'),'region');
  assert.equal(catalog.attributes.get('aria-label'),'Prize catalog');
  assert.equal(catalog.tabIndex,0,'catalog is keyboard focusable');
  assert.ok(catalog.children.some(x=>x.className==='bb-prize-grid'),'reward cards live inside scrolling region');
  catalog.scrollTop=180;
  assert.equal(flattenWidget().filter(x=>x.className==='bb-prize-card').length,29);
  const minted=flattenWidget().find(x=>x.dataset.reward==='cabinet_mint');
  const purchase=minted.children.flatMap(x=>x.children||[]).find(x=>x.className==='bb-prize-buy');
  assert.ok(purchase);purchase.dispatch('click');
  let shopSaved=JSON.parse(cache.get('fuckass_funzone:v1:test-profile'));
  assert.equal(shopSaved.tickets,215,'purchasing spends the exact listed amount');
  assert.equal(shopSaved.shop.equipped.cabinet,'cabinet_mint');
  assert.equal(flattenWidget().find(x=>x.className.includes('bb-float')).dataset.cabinet,'cabinet_mint');
  purchase.dispatch('click');assert.equal(JSON.parse(cache.get('fuckass_funzone:v1:test-profile')).tickets,215,'repeat purchase cannot double-charge');
  const snakeMint=flattenWidget().find(x=>x.dataset.reward==='snake_mint');
  snakeMint.children.flatMap(x=>x.children||[]).find(x=>x.className==='bb-prize-buy').dispatch('click');
  shopSaved=JSON.parse(cache.get('fuckass_funzone:v1:test-profile'));
  assert.equal(shopSaved.shop.equipped.snake,'snake_mint');
  const shopFilter=flattenWidget().find(x=>x.className==='bb-shop-filter'&&x.textContent==='SNAKE');
  shopFilter.dispatch('click');
  assert.equal(catalog.scrollTop,0,'category switching returns to the top of the catalog');
  assert.equal(minted.hidden,true,'category filters actually hide unmatched rewards');
  const restoreOriginal=flattenWidget().find(x=>x.className==='bb-shop-reset');
  restoreOriginal.dispatch('click');
  assert.equal(JSON.parse(cache.get('fuckass_funzone:v1:test-profile')).shop.equipped.snake,'default','original skin can be restored');
  snakeMint.children.flatMap(x=>x.children||[]).find(x=>x.className==='bb-prize-buy').dispatch('click');
  const shopBack=flattenWidget().find(x=>x.className==='bb-shop-back');shopBack.dispatch('click');
  assert.equal(shopPage.hidden,true);
  assert.equal(shopFloat.dataset.shopOpen,'false','leaving shop returns to ordinary game/phone sizing');
  catalog.scrollTop=180;
  const shopLaunch=flattenWidget().find(x=>x.className==='bb-shop-launch');shopLaunch.dispatch('click');
  assert.equal(catalog.scrollTop,0,'reopening starts the catalog at the beginning');
  assert.equal(shopPage.hidden,false,'Funzone OS offers a shop shortcut');
  shopBack.dispatch('click');
  flattenWidget().find(x=>x.className==='bb-phone-resume').dispatch('click');
  assert.equal(shopPage.hidden,true);

  ws.get('GENERATION_STARTED')({generationId:'G1'});
  const canvas=flatten(placements.widget.root).find(x=>x.tagName==='CANVAS');assert.ok(canvas);
  canvas.dispatch('pointerdown',{pointerType:'touch',pointerId:1,button:0});
  canvas.dispatch('pointerup',{pointerId:1});
  ws.get('GENERATION_ENDED')({generationId:'G1'});
  assert.equal(placements.widget.visible,true,'a finished answer never interrupts an active run');
  // The single phone picker opens twenty game apps without a permanent tab rail.
  const apps=flatten(placements.widget.root).filter(x=>x.className==='bb-app');
  assert.equal(apps.length,20,'Funzone OS exposes twenty custom-asset apps');
  assert.equal(flatten(placements.widget.root).filter(x=>x.className==='bb-mode').length,0);
  const pick=mode=>{const picker=flatten(placements.widget.root).find(x=>x.className.includes('bb-phone-button'));assert.ok(picker);picker.dispatch('click');
    const target=apps.find(x=>x.title===`Open ${mode}`);assert.ok(target,mode);target.dispatch('click');};
  pick('Snake');
  const root=flatten(placements.widget.root).find(x=>x.className.includes('bb-float'));
  root.dispatch('keydown',{target:canvas,code:'ArrowDown'});
  pick('2048');root.dispatch('keydown',{target:canvas,code:'ArrowLeft'});
  // The new single primary control is actually functional while a game is running.
  const primary=flatten(placements.widget.root).find(x=>x.className.includes('bb-mainbutton'));
  assert.ok(primary);
  assert.equal(primary.attributes.get('aria-label'),'Pause','2048 started from directional input');
  primary.dispatch('click');assert.equal(primary.attributes.get('aria-label'),'Resume');
  primary.dispatch('click');assert.equal(primary.attributes.get('aria-label'),'Pause');
  assert.equal(flatten(placements.widget.root).filter(x=>x.className.includes('bb-ticker')).length,0,'tickets moved into single top line');
  assert.equal(flatten(placements.widget.root).filter(x=>x.className.includes('bb-wallet')).length,1,'tickets have one compact wallet');
  assert.equal(flatten(placements.widget.root).filter(x=>x.className.includes('bb-mini')).length,3,'duplicate pause button removed');
  const currentSave=JSON.parse(cache.get('fuckass_funzone:v1:test-profile'));
  assert.equal(currentSave.arcadeGame,'2048');
  assert.ok(Array.isArray(currentSave.puzzles.merge.board));
  assert.ok(Array.isArray(currentSave.puzzles.snake.body));
  pick('Trinket Panic');
  assert.equal(JSON.parse(cache.get('fuckass_funzone:v1:test-profile')).arcadeGame,'match3');
  let freshMatch=JSON.parse(cache.get('fuckass_funzone:v1:test-profile')).puzzles.match3;
  assert.equal(freshMatch.timerSeconds,0,'changing the timer preserves the current match board until restart');
  const matchReset=flatten(placements.widget.root).find(x=>x.className==='bb-mini'&&x.title==='Restart game');
  assert.ok(matchReset);matchReset.dispatch('click');
  assert.equal(JSON.parse(cache.get('fuckass_funzone:v1:test-profile')).puzzles.match3.timerSeconds,120,'new match boards use the configured timer');
  freshMatch=JSON.parse(cache.get('fuckass_funzone:v1:test-profile')).puzzles.match3;
  assert.equal(freshMatch.board.length,49);
  let legal=null;
  for(let a=0;a<49&&!legal;a++)for(const b of [a+1,a+7]){
    if(b>=49||Math.abs(a%7-b%7)+Math.abs(Math.floor(a/7)-Math.floor(b/7))!==1)continue;
    const attempt=freshMatch.board.map(t=>({...t}));[attempt[a],attempt[b]]=[attempt[b],attempt[a]];
    if(findMatchRuns(attempt).length){legal=[a,b];break;}
  }
  assert.ok(legal,'engine has a legal first move');
  function tap(ix){const cx=28+ix%7*44+20,cy=77+Math.floor(ix/7)*44+20;
    canvas.dispatch('pointerdown',{pointerType:'touch',pointerId:1,clientX:cx,clientY:cy});
    canvas.dispatch('pointerup',{pointerType:'touch',pointerId:1,clientX:cx,clientY:cy});}
  tap(legal[0]);tap(legal[1]);
  const updatedMatch=JSON.parse(cache.get('fuckass_funzone:v1:test-profile')).puzzles.match3;
  assert.equal(updatedMatch.moves,1,'two adjacent taps make a real match');
  assert.ok(updatedMatch.score>0,'match score survives in localStorage');
  assert.ok(flatten(placements.widget.root).some(x=>x.className==='bb-reaction'),'Gabu reaction DOM is mounted');
  // Width controls preserve the original 7x7 save and create an independent 8x7 board.
  const widthSelect=flatten(placements.widget.root).find(x=>x.className==='bb-match-size-select');assert.ok(widthSelect);
  widthSelect.value='8';widthSelect.dispatch('change');
  let widthSave=JSON.parse(cache.get('fuckass_funzone:v1:test-profile'));
  assert.equal(widthSave.match3Width,8);assert.equal(widthSave.puzzles.match3.board.length,56);
  assert.equal(widthSave.match3Boards[7].moves,1,'classic progress survives width switching');
  const next=findMatchMove(widthSave.puzzles.match3.board,8);assert.ok(next,'8-column board is playable');
  const wide=matchLayout(8);
  for(const ix of next){const cx=wide.x+(ix%8)*wide.step+wide.cell/2,cy=wide.y+Math.floor(ix/8)*wide.step+wide.cell/2;
    canvas.dispatch('pointerdown',{pointerType:'touch',pointerId:5,clientX:cx,clientY:cy});
    canvas.dispatch('pointerup',{pointerType:'touch',pointerId:5,clientX:cx,clientY:cy});}
  widthSave=JSON.parse(cache.get('fuckass_funzone:v1:test-profile'));
  assert.equal(widthSave.puzzles.match3.moves,1,'wide touch hitboxes map to real matches');
  widthSelect.value='7';widthSelect.dispatch('change');
  widthSave=JSON.parse(cache.get('fuckass_funzone:v1:test-profile'));
  assert.equal(widthSave.puzzles.match3.moves,1,'classic save restores without wiping its move history');
  assert.equal(widthSave.match3Boards[8].moves,1,'wide board remains banked for later');
  const drawerWidth=flatten(placements.drawer.root).find(x=>x.attributes.get('aria-label')==='Match-3 difficulty');assert.ok(drawerWidth);
  drawerWidth.value='6';drawerWidth.dispatch('change');
  assert.equal(JSON.parse(cache.get('fuckass_funzone:v1:test-profile')).puzzles.match3.board.length,42,'drawer difficulty changes width too');
  widthSelect.value='7';widthSelect.dispatch('change');
  pick('Plinko');
  const plinkoStage=flatten(placements.widget.root).find(x=>x.className==='bb-game-stage');
  const plinkoHost=flatten(plinkoStage).find(x=>x.className==='bb-plinko-host');
  assert.equal(plinkoStage.dataset.game,'plinko');
  assert.ok(plinkoHost?.children.some(x=>x.className==='bb-plinko-host-art'),'monocled Gabu peeks over the cabinet');
  const plinkoBar=flatten(placements.widget.root).find(x=>x.className==='bb-controls');
  assert.equal(plinkoBar.dataset.mode,'plinko');
  assert.ok(plinkoBar.children.some(x=>x.className==='bb-plinko-bets'),'wager and drop share the same action strip');
  const walletBefore=JSON.parse(cache.get('fuckass_funzone:v1:test-profile')).tickets;
  const free=flatten(placements.widget.root).find(x=>x.dataset.value==='0');
  assert.ok(free,'practice wager is available');free.dispatch('click');
  canvas.dispatch('pointerdown',{pointerType:'touch',button:0,pointerId:4,clientX:180,clientY:140});
  const activeDrop=JSON.parse(cache.get('fuckass_funzone:v1:test-profile'));
  assert.equal(activeDrop.puzzles.plinko.ball.stake,0,'practice drop costs no tickets');
  assert.equal(activeDrop.tickets,walletBefore,'practice preserves wallet');
  // New games run through the real bundled browser entrypoint, not an isolated engine.
  pick('Simon Says');
  let miniSave=JSON.parse(cache.get('fuckass_funzone:v1:test-profile'));
  assert.equal(miniSave.arcadeGame,'simon');
  assert.equal(miniSave.puzzles.simon.sequence.length,1,'opening Simon starts a real demonstration');
  root.dispatch('keydown',{target:canvas,code:'Digit1'});
  miniSave=JSON.parse(cache.get('fuckass_funzone:v1:test-profile'));
  assert.equal(miniSave.puzzles.simon.score,0,'early Simon key cannot skip demonstration');
  pick('Duck Hunt');
  assert.equal(JSON.parse(cache.get('fuckass_funzone:v1:test-profile')).arcadeGame,'duck');
  let configuredDuck=JSON.parse(cache.get('fuckass_funzone:v1:test-profile')).puzzles.duck;
  assert.equal(configuredDuck.timerSeconds,45,'active saved hunt keeps its original timer');
  matchReset.dispatch('click');
  configuredDuck=JSON.parse(cache.get('fuckass_funzone:v1:test-profile')).puzzles.duck;
  assert.equal(configuredDuck.timerSeconds,90,'next hunt uses the selected time limit');
  assert.equal(configuredDuck.speed,'chaos','next hunt uses the selected flight speed');
  primary.dispatch('click'); // Launch after configuring a fresh hunt; the first canvas tap would otherwise only start it.
  canvas.dispatch('pointerdown',{pointerType:'touch',pointerId:9,clientX:180,clientY:190});
  miniSave=JSON.parse(cache.get('fuckass_funzone:v1:test-profile'));
  assert.equal(miniSave.puzzles.duck.misses,1,'missed duck shot updates persisted hit/miss counters');
  pick('Gabu Slots');
  assert.equal(JSON.parse(cache.get('fuckass_funzone:v1:test-profile')).arcadeGame,'slots');
  const slotStrip=flatten(placements.widget.root).find(x=>x.className==='bb-slot-bets');
  assert.equal(slotStrip.hidden,false,'slots use their own compact stake rail');
  const slotFree=flatten(placements.widget.root).find(x=>x.dataset.slotStake==='0');
  slotFree.dispatch('click');
  const walletBeforeFree=JSON.parse(cache.get('fuckass_funzone:v1:test-profile')).tickets;
  primary.dispatch('click');
  miniSave=JSON.parse(cache.get('fuckass_funzone:v1:test-profile'));
  assert.equal(miniSave.puzzles.slots.pending.stake,0,'free slot spin has zero prepaid stake');
  assert.equal(miniSave.tickets,walletBeforeFree,'free slot spin does not debit wallet');
  // Cancelled practice spin never charges or grants money.
  const restartBtn=flatten(placements.widget.root).find(x=>x.title==='Restart game');
  restartBtn.dispatch('click');
  const slotThree=flatten(placements.widget.root).find(x=>x.dataset.slotStake==='3');
  slotThree.dispatch('click');
  primary.dispatch('click');
  miniSave=JSON.parse(cache.get('fuckass_funzone:v1:test-profile'));
  assert.equal(miniSave.puzzles.slots.pending.stake,3,'paid slot spin persists wager + predetermined result');
  assert.equal(miniSave.tickets,walletBeforeFree-3,'paid slot spin debits exactly once');
  pick('Gabi Jetpack');
  pick('Gabu Slots');
  miniSave=JSON.parse(cache.get('fuckass_funzone:v1:test-profile'));
  assert.equal(miniSave.puzzles.slots.pending.stake,3,'switching modes preserves the pending paid spin');
  assert.equal(primary.attributes.get('aria-label'),'Resume','paused paid spin can resume without recharging');
  primary.dispatch('click');
  let clock=32;
  for(let i=0;i<16;i++){
    const task=[...queued.entries()][0];assert.ok(task,'active arcade has a live RAF');
    queued.delete(task[0]);clock+=100;task[1](clock);
  }
  miniSave=JSON.parse(cache.get('fuckass_funzone:v1:test-profile'));
  assert.equal(miniSave.puzzles.slots.pending,null,'paid spin finishes after resume');
  assert.equal(miniSave.tickets,walletBeforeFree-3+miniSave.puzzles.slots.lastPayout,'reel payout settles exactly once');
  pick('Gabi Jetpack');

  assert.equal(JSON.parse(cache.get('fuckass_funzone:v1:test-profile')).arcadeGame,'gabi');
  assert.ok(flatten(placements.widget.root).some(x=>x.tagName==='SVG'),'SVG icons are built as real DOM elements');
  let tasks=[...queued.entries()];for(const [key,fn] of tasks){queued.delete(key);fn(16);}
  stop();stop();
  assert.equal(ws.size,0);assert.equal(queued.size,0);
  assert.equal(placements.widget.destroyed,true);assert.equal(placements.drawer.destroyed,true);assert.equal(placements.action.destroyed,true);
  assert.equal(window.listeners.get('blur')?.size||0,0);
 } finally {for(const [k,v] of Object.entries(old)){if(v===undefined)delete globalThis[k];else globalThis[k]=v;}}
});
