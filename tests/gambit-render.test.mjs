import test from 'node:test';
import assert from 'node:assert/strict';
import { drawGambit, gambitActions, gambitHitAt } from '../src/gambit-render.js';
import { GAMBIT_JOKERS } from '../src/gambit-rules.js';

function fixture(overrides = {}) {
  return { status: 'playing', phase: 'play', won: false, round: 1, target: 180,
    roundScore: 30, score: 30, money: 8, playsLeft: 4, discardsLeft: 3,
    deck: Array.from({ length: 44 }, (_, id) => id + 8), hand: [0, 1, 2, 3, 4, 5, 6, 7], selected: [],
    jokers: ['pair_gremlin', 'growing_suspicion', 'last_laugh'], handLevels: {}, cardBoosts: {},
    preview: () => null, scoreTime: .5,
    shop: [{ kind: 'joker', id: 'velvet_flush', price: 4, sold: false },
      { kind: 'joker', id: 'heart_hoarder', price: 4, sold: true },
      { kind: 'pack', pack: 'joker', price: 4, sold: false }, { kind: 'pack', pack: 'upgrade', price: 3, sold: false }],
    pack: { kind: 'joker', selected: null, options: [{ kind: 'joker', id: 'heart_hoarder' }, { kind: 'joker', id: 'last_laugh' }, { kind: 'joker', id: 'straight_talker' }] },
    pendingJoker: 'velvet_flush',
    lastResult: { id: 'pair', name: 'Pair', chips: 30, mult: 6, total: 180,
      steps: [{ label: 'Base Pair', chips: 10, mult: 2 }, { label: 'Scoring cards', chips: 30, mult: 2 }, { label: 'Pair Gremlin +4 Mult', chips: 30, mult: 6 }] },
    ...overrides };
}
const point = action => [action.hitX ?? action.x + action.w / 2, action.hitY ?? action.y + action.h / 2];
const sameAction = (actual, expected) => actual?.kind === expected.kind && actual?.index === expected.index && actual?.id === expected.id && actual?.mode === expected.mode;
const inside = (action, x, y) => x >= action.x && x < action.x + action.w && y >= action.y && y < action.y + action.h;
const find = (game, kind, index, view) => gambitActions(game, view).find(action => action.kind === kind && (index === undefined || action.index === index || action.mode === index));
const hit = (game, action, view) => gambitHitAt(...point(action), game, view);

function mockCanvas() {
  const calls = [], labels = [], stack = [];
  let matrix = [1, 0, 0, 1, 0, 0];
  const multiply = rhs => {
    const [a, b, c, d, e, f] = matrix, [A, B, C, D, E, F] = rhs;
    matrix = [a * A + c * B, b * A + d * B, a * C + c * D, b * C + d * D, a * E + c * F + e, b * E + d * F + f];
  };
  const transform = (x, y) => [(matrix[0] * x + matrix[2] * y + matrix[4]) / 2, (matrix[1] * x + matrix[3] * y + matrix[5]) / 2];
  const ctx = new Proxy({
    font: '12px sans-serif', textAlign: 'left', fillStyle: '#000',
    measureText(value) { const size = Number(this.font.match(/([\d.]+)px/)?.[1] || 12); return { width: String(value).length * size * .55 }; },
    fillText(value, x, y, maxWidth) {
      const measured = this.measureText(value).width, width = maxWidth ? Math.min(measured, maxWidth) : measured;
      const start = this.textAlign === 'center' ? x - width / 2 : this.textAlign === 'right' ? x - width : x;
      const size = Number(this.font.match(/([\d.]+)px/)?.[1] || 12);
      const corners = [[start, y], [start + width, y], [start, y - size], [start + width, y - size]].map(([a, b]) => transform(a, b));
      labels.push({ value: String(value), x, y, width, start: Math.min(...corners.map(p => p[0])), end: Math.max(...corners.map(p => p[0])), top: Math.min(...corners.map(p => p[1])), bottom: Math.max(...corners.map(p => p[1])), color: this.fillStyle });
    },
    setTransform(...args) { calls.push(['setTransform', ...args]); matrix = [...args]; },
    translate(x, y) { multiply([1, 0, 0, 1, x, y]); },
    scale(x, y) { multiply([x, 0, 0, y, 0, 0]); },
    rotate(angle) { multiply([Math.cos(angle), Math.sin(angle), -Math.sin(angle), Math.cos(angle), 0, 0]); },
    save() { stack.push({ matrix: [...matrix], font: this.font, textAlign: this.textAlign, fillStyle: this.fillStyle }); },
    restore() { const state = stack.pop(); if (state) { matrix = state.matrix; this.font = state.font; this.textAlign = state.textAlign; this.fillStyle = state.fillStyle; } },
  }, { get(target, key) { return key in target ? target[key] : () => {}; }, set(target, key, value) { target[key] = value; return true; } });
  return { width: 720, height: 904, getContext: () => ctx, calls, labels };
}

test('every visible action fits and receives a reachable tap while non-card controls remain separate', () => {
  for (const phase of ['play', 'score', 'shop', 'pack', 'replace']) {
    const game = fixture({ phase, selected: [0, 7] }), actions = gambitActions(game);
    for (const action of actions) {
      assert.ok(action.x >= 0 && action.y >= 0 && action.x + action.w <= 360 && action.y + action.h <= 452, `${phase} ${action.kind} fits`);
      assert.ok(inside(action, ...point(action)), `${phase} ${action.kind} exposes a point inside itself`);
      if (action.enabled) assert.ok(sameAction(hit(game, action), action), `${phase} ${action.kind}/${action.index} receives its exposed tap`);
    }
    for (let i = 0; i < actions.length; i++) for (let j = i + 1; j < actions.length; j++) {
      const a = actions[i], b = actions[j];
      if (a.kind === 'card' && b.kind === 'card') continue;
      const overlap = Math.min(a.x + a.w, b.x + b.w) > Math.max(a.x, b.x) && Math.min(a.y + a.h, b.y + b.h) > Math.max(a.y, b.y);
      assert.equal(overlap, false, `${phase} ${a.kind} and ${b.kind} have separate touch regions`);
    }
  }
});

test('the hand fans deliberately and overlap taps select the card painted on top', () => {
  const game = fixture(), cards = gambitActions(game).filter(action => action.kind === 'card');
  let checked = 0;
  for (let i = 0; i < cards.length - 1; i++) {
    const a = cards[i], b = cards[i + 1], left = Math.max(a.x, b.x), right = Math.min(a.x + a.w, b.x + b.w);
    const top = Math.max(a.y, b.y), bottom = Math.min(a.y + a.h, b.y + b.h);
    if (right <= left || bottom <= top) continue;
    const x = (left + right) / 2, y = (top + bottom) / 2;
    const topmost = cards.filter(action => inside(action, x, y)).at(-1);
    assert.ok(sameAction(gambitHitAt(x, y, game), topmost), 'later-painted card receives the overlapping tap'); checked++;
  }
  assert.ok(checked > 0, 'the layout actually fans overlapping cards');
  game.selected = [cards[2].id];
  const raised = gambitActions(game).find(action => action.kind === 'card' && action.index === 2);
  assert.ok(raised.y <= cards[2].y - 12, 'selection visibly raises the actual card');
  assert.deepEqual(gambitActions(game).filter(action => action.kind === 'sort').map(action => action.mode).sort(), ['rank', 'suit']);
});

test('selection, resources, paid offers, and explicit pack confirmation govern input availability', () => {
  const game = fixture();
  assert.equal(hit(game, find(game, 'play')), null, 'empty selection cannot be played');
  assert.equal(hit(game, find(game, 'discard')), null, 'empty selection cannot be discarded');
  game.selected = [0]; assert.equal(hit(game, find(game, 'play'))?.kind, 'play');
  game.deck = []; assert.equal(hit(game, find(game, 'discard')), null, 'empty draw deck cannot be discarded into');
  game.phase = 'shop'; assert.equal(hit(game, find(game, 'buy', 0))?.kind, 'buy');
  assert.equal(hit(game, find(game, 'buy', 1)), null, 'sold purchase control is inert');
  game.money = 0; assert.equal(hit(game, find(game, 'buy', 0)), null, 'unaffordable purchase control is inert');
  assert.equal(hit(game, find(game, 'offer', 0))?.kind, 'offer', 'an unaffordable item can still be inspected');
  game.phase = 'pack'; assert.equal(hit(game, find(game, 'claim')), null, 'Choose requires a highlighted option');
  game.pack.selected = 2; assert.equal(hit(game, find(game, 'claim'))?.kind, 'claim');
  for (const status of ['idle', 'paused', 'dead']) { game.status = status; assert.deepEqual(gambitActions(game), []); }
  assert.equal(gambitHitAt(NaN, 20, game), null); assert.equal(gambitHitAt(12, Infinity, game), null);
});

test('Joker and shop inspections block the table and offer an explicit sale or purchase', () => {
  const game = fixture(), view = { inspection: 'pair_gremlin' };
  assert.deepEqual(gambitActions(game, view).map(action => action.kind), ['close']);
  assert.equal(gambitHitAt(...point(find(game, 'card', 0)), game, view), null, 'inspection consumes hand taps');
  game.phase = 'shop';
  const actions = gambitActions(game, view);
  assert.deepEqual(actions.map(action => action.kind), ['close', 'sell']);
  assert.equal(actions[1].index, 0); assert.equal(hit(game, actions[1], view)?.kind, 'sell');
  const offerView = { inspection: { offer: 0 } }, inspected = gambitActions(game, offerView);
  assert.deepEqual(inspected.map(action => action.kind), ['close', 'buy']);
  assert.equal(inspected[1].index, 0); assert.equal(hit(game, inspected[1], offerView)?.kind, 'buy');
});

test('action labels identify cards, effects, pack choices, prices, and replacement decisions', () => {
  const game = fixture({ hand: [0, 22, 38, 51], selected: [22], cardBoosts: { 22: 10 } });
  const labels = gambitActions(game).filter(item => item.kind === 'card').map(item => item.label);
  assert.equal(labels[0], 'Ace of Clubs, unselected');
  assert.match(labels[1], /^10 of Diamonds, selected\. Bonus 10 chips/);
  assert.equal(labels[2], 'King of Spades, unselected'); assert.equal(labels[3], 'King of Hearts, unselected');
  game.phase = 'shop'; const offers = gambitActions(game).filter(item => item.kind === 'buy');
  assert.match(offers[0].label, /Buy Velvet Flush for 4 run coins.*Mult/);
  assert.match(offers[2].label, /Joker Pack.*three.*Jokers/);
  game.jokers.push('velvet_flush');
  assert.equal(find(game, 'buy', 0).enabled, false); assert.match(find(game, 'buy', 0).label, /^Already equipped/);
  game.phase = 'pack'; game.pack.selected = 1;
  const choices = gambitActions(game).filter(item => item.kind === 'packOption');
  assert.match(choices[0].label, /Heart Hoarder.*20 chips/); assert.match(choices[1].label, /^Selected: Last Laugh.*1\.5/);
  game.phase = 'replace'; game.jokers.pop();
  assert.match(find(game, 'replace', 0).label, /^Replace Pair Gremlin with Velvet Flush/);
});

test('score counting advances its highlight and reduced motion presents the full breakdown immediately', () => {
  const game = fixture({ phase: 'score', scoreTime: 0 });
  const labelsAt = (elapsed, reduced = false) => {
    const canvas = mockCanvas(); game.scoreTime = elapsed; drawGambit(canvas, game, { reduced });
    return canvas.labels.filter(label => game.lastResult.steps.some(step => step.label === label.value));
  };
  const initial = labelsAt(0), middle = labelsAt(.5), final = labelsAt(1);
  assert.equal(initial.length, 3); assert.notEqual(initial[0].color, initial[1].color, 'current and future calculations are visually distinct');
  assert.equal(initial[0].color, middle[1].color, 'card chips receive the same active highlight next');
  assert.equal(initial[0].color, final[2].color, 'the Joker contribution receives the active highlight');
  const complete = labelsAt(1.2), staticLabels = labelsAt(0, true);
  assert.deepEqual(staticLabels.map(item => item.color), complete.map(item => item.color), 'reduced motion shows the completed colors immediately');
  assert.equal(gambitActions(game).at(-1).kind, 'continue');
});

test('upgrade offers show their resulting level explicitly', () => {
  const game = fixture({ phase: 'pack', pack: { kind: 'upgrade', selected: 0, options: [{ kind: 'hand', id: 'pair' }] } });
  const first = mockCanvas(); drawGambit(first, game);
  assert.ok(first.labels.some(label => label.value === 'LEVEL 1 TO 2'));
  game.handLevels.pair = 3; const upgraded = mockCanvas(); drawGambit(upgraded, game);
  assert.ok(upgraded.labels.some(label => label.value === 'LEVEL 4 TO 5'));
});

test('high-DPI painting keeps finite, bounded text across screens and every Joker inspection', () => {
  for (const phase of ['play', 'score', 'shop', 'pack', 'replace']) for (const status of ['playing', 'paused', 'idle', 'dead']) {
    const canvas = mockCanvas(), game = fixture({ phase, status }); drawGambit(canvas, game, { best: 999999999, reduced: true, cursor: 0 });
    assert.deepEqual(canvas.calls[0], ['setTransform', 2, 0, 0, 2, 0, 0]);
    for (const label of canvas.labels) {
      assert.ok([label.start, label.end, label.top, label.bottom].every(Number.isFinite), `${phase}/${status}: ${label.value} is finite`);
      assert.ok(label.start >= 0 && label.end <= 360, `${phase}/${status}: ${label.value} fits horizontally (${label.start}..${label.end})`);
      assert.ok(label.top >= 0 && label.bottom <= 452, `${phase}/${status}: ${label.value} fits vertically (${label.top}..${label.bottom})`);
    }
  }
  for (const joker of GAMBIT_JOKERS) {
    const canvas = mockCanvas(); drawGambit(canvas, fixture(), { inspection: joker.id });
    assert.ok(canvas.labels.some(label => label.value === joker.name));
    assert.ok(canvas.labels.some(label => label.value.includes(fixture().jokers.includes(joker.id)?'ACTIVE FOR THIS RUN':'FIND IN SHOPS AND JOKER PACKS')));
    assert.ok(canvas.labels.every(label => label.start >= 0 && label.end <= 360));
  }
});

test('selection count stays above the fanned cards and Run Info explains matching ranks', () => {
  const game = fixture({ selected: [0, 3, 7] }), canvas = mockCanvas();
  drawGambit(canvas, game);
  const count = canvas.labels.find(label => /SELECTED$/.test(label.value));
  const cards = gambitActions(game).filter(action => action.kind === 'card');
  assert.ok(count && count.bottom < Math.min(...cards.map(action => action.y)), 'counter has clear space above every card');
  const guide = mockCanvas(); drawGambit(guide, game, { inspection: { info: true } });
  assert.ok(guide.labels.some(label => label.value === 'Three: 3 of one rank'));
  assert.ok(guide.labels.some(label => label.value === 'Four: 4 of one rank'));
});


test('expanded table keeps five Jokers, ten hand cards, five booster options and all collection pages reachable', () => {
  const ids=GAMBIT_JOKERS.slice(0,5).map(joker=>joker.id);
  const game=fixture({jokerSlots:5,jokers:ids,hand:Array.from({length:10},(_,id)=>id)});
  for(const phase of ['play','replace','pack']){
    game.phase=phase;
    if(phase==='pack')game.pack={kind:'joker',size:'mega',remaining:2,claimed:[1],selected:0,options:GAMBIT_JOKERS.slice(5,10).map(joker=>({kind:'joker',id:joker.id}))};
    const actions=gambitActions(game);
    for(const action of actions){
      assert.ok(action.x>=0&&action.x+action.w<=360&&action.y>=0&&action.y+action.h<=452);
      if(action.enabled)assert.ok(sameAction(hit(game,action),action),phase+' '+action.kind+' '+action.index);
    }
    if(phase==='pack')assert.equal(find(game,'packOption',1).enabled,false,'a Mega choice cannot be claimed twice');
  }
  game.phase='play';const seen=[];
  for(let page=0;page<Math.ceil(GAMBIT_JOKERS.length/9);page++){
    const view={inspection:{collection:true,page,filter:'all'}},actions=gambitActions(game,view);
    for(const action of actions.filter(action=>action.kind==='catalogJoker')){seen.push(action.id);assert.ok(sameAction(hit(game,action,view),action));}
    const canvas=mockCanvas();drawGambit(canvas,game,view);
    assert.ok(canvas.labels.every(label=>label.start>=0&&label.end<=360&&label.top>=0&&label.bottom<=452));
  }
  assert.deepEqual(seen,GAMBIT_JOKERS.map(joker=>joker.id));
});

test('large scores, expanded reports, bosses, deck choices and the Endless decision fit the cabinet', () => {
  const phases=['score','victory','play'];
  for(const phase of phases){
    const game=fixture({phase,jokerSlots:5,score:1e40,roundScore:1e30,target:1e35,ante:12,round:36,
      boss:{name:'Echo Chamber',description:'You cannot play the same poker hand twice during this blind.'},
      lastResult:{id:'pair',name:'Pair',chips:1e25,mult:1.5,total:1.5e25,steps:Array.from({length:26},(_,index)=>({label:'A growing boost '+index,chips:1e20,mult:1.5+index}))}});
    for(const inspection of [null,{breakdown:true,page:2},{info:true}]){
      const canvas=mockCanvas();drawGambit(canvas,game,{inspection});
      assert.ok(canvas.labels.every(label=>label.start>=0&&label.end<=360&&label.top>=0&&label.bottom<=452));
    }
    if(phase==='score'){const canvas=mockCanvas();drawGambit(canvas,game);assert.ok(canvas.labels.some(label=>label.value.includes('1.5')),'fractional multipliers stay visible');assert.ok(find(game,'breakdown'));}
    if(phase==='victory')assert.deepEqual(gambitActions(game).filter(action=>['endless','finish'].includes(action.kind)).map(action=>action.kind),['endless','finish']);
  }
  const initial=fixture({status:'idle',chooseDeck(){},deckPreset:'classic'});
  assert.equal(gambitActions(initial).filter(action=>action.kind==='deckCycle').length,2);
  assert.ok(find(initial,'start'));
});


test('Glass risk and seal rules are explained before claiming a crafted card and in Run Info', () => {
  const game=fixture({phase:'pack',pack:{kind:'craft',size:'normal',selected:0,remaining:1,claimed:[],options:[{kind:'modify',id:0,enhancement:'glass'}]}});
  const choice=find(game,'packOption',0);assert.match(choice.label,/25% chance to break permanently/);
  const canvas=mockCanvas();drawGambit(canvas,game);assert.ok(canvas.labels.some(label=>label.value.includes('25%')));
  const help=mockCanvas();drawGambit(help,game,{inspection:{cardHelp:true}});
  assert.ok(help.labels.some(label=>label.value==='CARD EFFECTS'));
  assert.ok(help.labels.some(label=>label.value==='BLUE SEAL'));
  assert.ok(help.labels.every(label=>label.start>=0&&label.end<=360&&label.top>=0&&label.bottom<=452));
  assert.ok(gambitActions(game,{inspection:{info:true}}).some(action=>action.kind==='cardHelp'));
});


test('new playing-card options show their canonical face rather than an existing crafted card with the same face ID',()=>{
  const game=fixture({phase:'pack',cardMods:{0:{rank:13,suit:3}},cardBoosts:{0:300},pack:{kind:'standard',selected:0,options:[{kind:'playing',id:0,enhancement:'bonus'}]}});
  const canvas=mockCanvas();drawGambit(canvas,game);
  assert.ok(canvas.labels.some(label=>label.value==='A'),'new Ace keeps its canonical rank');
  assert.equal(canvas.labels.some(label=>label.value==='K'),false,'existing crafted King does not leak into a new physical card');
  assert.match(find(game,'packOption',0).label,/Ace of Clubs/);
});


test('large rail values use readable mantissa and exponent lines while the full breakdown keeps precise Mult',()=>{
  const game=fixture({phase:'score',lastResult:{id:'pair',name:'Pair',chips:2400,mult:721731.58,total:1732155792,steps:[{label:'Final boost',chips:2400,mult:721731.58}]}});
  const canvas=mockCanvas();drawGambit(canvas,game);
  assert.ok(canvas.labels.some(label=>label.value==='7.22'&&label.x===75));
  assert.ok(canvas.labels.some(label=>label.value==='e5'&&label.x===75));
  assert.ok(canvas.labels.some(label=>label.value.includes('721,731.58')),'the larger breakdown retains precise totals');
});
