/** Original poker roguelike engine: persistent decks, seeded choices and longer runs. */
import { GAMBIT_HANDS, GAMBIT_JOKERS, scoreGambitHand, evaluateGambitHand, gambitCardData, gambitJokerPayout, gambitJokerModifiers, GAMBIT_SCORE_LIMIT, GAMBIT_LEVEL_LIMIT } from './gambit-rules.js';

const LEGACY_TARGETS = [180,350,600,1000,1500,2200];
const ANTE_BASES = [180,450,1100,2500,5500,11000,20000,35000];
export const GAMBIT_TARGETS = Object.freeze(ANTE_BASES.flatMap(base=>[base,Math.round(base*1.5),base*2]));
export const GAMBIT_DECKS = Object.freeze([
  {id:'classic',name:'Gremlin Deck',description:'Start with Pair Gremlin and $8. A balanced beginning.'},
  {id:'velvet',name:'Velvet Deck',description:'Start with Velvet Flush, $6 and a deck with only Hearts and Clubs.'},
  {id:'scholar',name:'Scholar Deck',description:'Start with Pair Gremlin, Pair and High Card level 3, and $4.'},
  {id:'merchant',name:'Merchant Deck',description:'Start with no Joker and $20. Invest in your own build.'},
].map(Object.freeze));
export const GAMBIT_PACKS = Object.freeze(['joker','upgrade','craft','standard'].flatMap(kind=>['normal','mega'].map(size=>Object.freeze({
  id:kind+'_'+size,kind,size,name:(size==='mega'?'Mega ':'')+({joker:'Joker',upgrade:'Upgrade',craft:'Craft',standard:'Playing Card'})[kind]+' Pack',
  price:size==='mega'?7:kind==='upgrade'?3:4,options:size==='mega'?5:3,choose:size==='mega'?2:1,
}))));
export const GAMBIT_BOSSES = Object.freeze([
  {id:'short_fuse',name:'Short Fuse',description:'One fewer hand this blind.'},
  {id:'dry_well',name:'Dry Well',description:'Two fewer discards this blind.'},
  {id:'narrow_gate',name:'Narrow Gate',description:'Play at most three cards at once.'},
  {id:'full_table',name:'Full Table',description:'Every played hand must contain five cards.'},
  {id:'echo_chamber',name:'Echo Chamber',description:'A poker category can score only once this blind.'},
  {id:'heavy_blind',name:'Heavy Blind',description:'The target is fifty percent higher.'},
  {id:'toll',name:'The Toll',description:'Pay one run coin for each hand played.'},
  {id:'locked_purse',name:'Locked Purse',description:'No interest is paid for clearing this blind.'},
].map(Object.freeze));
const jokerIds=GAMBIT_JOKERS.map(j=>j.id), legacyJokers=jokerIds.slice(0,12), handIds=GAMBIT_HANDS.map(h=>h.id);
const phases=['play','score','shop','pack','replace','victory'];
const integer=(n,low,high)=>Number.isSafeInteger(n)&&n>=low&&n<=high;
const amount=(n,max=GAMBIT_SCORE_LIMIT)=>Number.isFinite(n)&&n>=0&&n<=max&&Math.floor(n)===n;
const card=id=>integer(id,0,4095);
const plain=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
const dense=(values,max,check)=>Array.isArray(values)&&values.length<=max&&Array.from({length:values.length},(_,i)=>Object.hasOwn(values,i)&&check(values[i])).every(Boolean);
const unique=values=>new Set(values).size===values.length;
const clone=value=>JSON.parse(JSON.stringify(value));
const enhancements=['bonus','mult','glass','steel','gold'],seals=['red','blue','gold'];
const validLevels=(value,max=GAMBIT_LEVEL_LIMIT)=>plain(value)&&Object.entries(value).every(([id,n])=>handIds.includes(id)&&integer(n,0,max));
const validBoosts=(value,max=300)=>plain(value)&&Object.entries(value).every(([id,n])=>String(Number(id))===id&&card(Number(id))&&integer(n,0,max)&&n%10===0);
const validMod=value=>plain(value)&&Object.keys(value).every(key=>['rank','suit','enhancement','seal'].includes(key))&&
  (value.rank===undefined||integer(value.rank,1,13))&&(value.suit===undefined||integer(value.suit,0,3))&&
  (value.enhancement===undefined||enhancements.includes(value.enhancement))&&(value.seal===undefined||seals.includes(value.seal));
const freshStats=()=>({handsPlayed:0,cardsPlayed:0,discardsUsed:0,cardsDiscarded:0,roundsCleared:0,packsOpened:0,rerolls:0,cardsAdded:0,cardsRemoved:0,handCounts:{},lastHand:null,sameHandStreak:0});
const countKeys=['handsPlayed','cardsPlayed','discardsUsed','cardsDiscarded','roundsCleared','packsOpened','rerolls','cardsAdded','cardsRemoved','sameHandStreak'];
const validStats=s=>plain(s)&&countKeys.every(key=>integer(s[key],0,1e9))&&plain(s.handCounts)&&Object.entries(s.handCounts).every(([id,n])=>handIds.includes(id)&&integer(n,0,1e9))&&(s.lastHand===null||handIds.includes(s.lastHand));
const jokerPrice=id=>({common:4,uncommon:6,rare:8})[GAMBIT_JOKERS.find(j=>j.id===id)?.rarity]||8;
const packBy=(kind,size='normal')=>GAMBIT_PACKS.find(p=>p.kind===kind&&p.size===size);
const optionKey=o=>JSON.stringify(o);
const validOption=o=>plain(o)&&(o.kind==='joker'?jokerIds.includes(o.id):o.kind==='hand'?handIds.includes(o.id):
  o.kind==='card'||o.kind==='remove'?card(o.id):o.kind==='playing'?integer(o.id,0,51)&&validMod(Object.fromEntries(Object.entries(o).filter(([k])=>!['kind','id'].includes(k)))):
  o.kind==='modify'&&card(o.id)&&Object.keys(o).some(k=>['rank','suit','enhancement','seal'].includes(k))&&validMod(Object.fromEntries(Object.entries(o).filter(([k])=>!['kind','id'].includes(k)))));

export class GambitGame {
  constructor({seed=Math.floor(Math.random()*0xffffffff),onEvent=()=>{},saved}={}) {
    this.onEvent=onEvent;this.rngState=1;this.deckPreset='classic';this.reset(seed);if(saved)this.restore(saved);
  }
  nextRandom(){let n=this.rngState;n^=n<<13;n^=n>>>17;n^=n<<5;this.rngState=n>>>0||1;return this.rngState/0x100000000;}
  shuffled(values){const items=[...values];for(let i=items.length-1;i>0;i--){const j=Math.floor(this.nextRandom()*(i+1));[items[i],items[j]]=[items[j],items[i]];}return items;}
  reset(seed){
    this.rngState=integer(seed,0,0xffffffff)?seed||1:Math.floor(this.nextRandom()*0xffffffff)||1;
    this.legacy=false;this.endless=false;this.status='idle';this.phase='play';this.won=false;this.round=1;
    this.score=0;this.money=8;this.jokers=['pair_gremlin'];this.handLevels={};this.cardBoosts={};this.cardMods={};
    this.deckCards=Array.from({length:52},(_,i)=>i);this.nextCardId=52;this.stats=freshStats();this.rerollsInShop=0;
    if(this.deckPreset==='velvet'){this.money=6;this.jokers=['velvet_flush'];for(const id of this.deckCards)if(Math.floor(id/13)===1||Math.floor(id/13)===2)this.cardMods[id]={suit:id%2?0:3};}
    else if(this.deckPreset==='scholar'){this.money=4;this.handLevels={pair:2,high_card:2};}
    else if(this.deckPreset==='merchant'){this.money=20;this.jokers=[];}
    this.shop=[];this.pack=null;this.pendingJoker=null;this.lastResult=null;this.lastPlay=null;this.scoreTime=0;
    this.bossOrder=this.shuffled(GAMBIT_BOSSES.map(b=>b.id));this.dealRound();this.onEvent('reset');
  }
  chooseDeck(id){if(!['idle','dead'].includes(this.status)||!GAMBIT_DECKS.some(d=>d.id===id))return false;this.deckPreset=id;this.reset();return true;}
  get ante(){return this.legacy?Math.ceil(this.round/3):Math.ceil(this.round/3);}
  get blindName(){return this.legacy?'Classic Round':['Small Blind','Big Blind','Boss Blind'][(this.round-1)%3];}
  get campaignLength(){return this.legacy?6:24;}
  get jokerSlots(){return this.legacy?3:5;}
  get boss(){return !this.legacy&&this.round%3===0?GAMBIT_BOSSES.find(b=>b.id===this.bossOrder[(this.ante-1)%8]):null;}
  get target(){
    if(this.legacy)return LEGACY_TARGETS[this.round-1];
    const base=this.ante<=8?ANTE_BASES[this.ante-1]:Math.min(GAMBIT_SCORE_LIMIT,ANTE_BASES[7]*Math.pow(2.2,this.ante-8));
    return Math.min(GAMBIT_SCORE_LIMIT,Math.round(base*[1,1.5,2][(this.round-1)%3]*(this.boss?.id==='heavy_blind'?1.5:1)));
  }
  get handSize(){return this.limits?.handSize||8;}
  get maxPlays(){return this.limits?.plays||4;}
  get maxDiscards(){return this.limits?.discards??3;}
  get rerollPrice(){return Math.max(1,3+this.rerollsInShop-(this.legacy?0:gambitJokerModifiers(this.jokers).rerollDiscount||0));}
  get canContinueEndless(){return this.won&&(this.phase==='victory'||this.status==='dead')&&(!this.endless);}
  dealRound(){
    const m=this.legacy?{}:gambitJokerModifiers(this.jokers);
    this.limits={handSize:Math.max(1,Math.min(10,8+(m.handSize||0))),plays:Math.max(1,Math.min(10,4+(m.plays||0)-(this.boss?.id==='short_fuse'?1:0))),discards:Math.max(0,Math.min(10,3+(m.discards||0)-(this.boss?.id==='dry_well'?2:0)))};
    this.deck=this.shuffled(this.deckCards);this.hand=[];this.discard=[];this.selected=[];
    this.playsLeft=this.maxPlays;this.discardsLeft=this.maxDiscards;this.roundScore=0;this.roundStats={hands:0,discards:0,handCounts:{}};
    this.refill();this.phase='play';this.lastResult=null;this.lastPlay=null;this.scoreTime=0;
  }
  refill(){while(this.hand.length<this.handSize&&this.deck.length)this.hand.push(this.deck.pop());}
  start(){if(this.status==='dead')this.reset();if(this.status==='playing')return;const resumed=this.status==='paused';this.status='playing';this.onEvent(resumed?'resume':'start');}
  pause(){if(this.status==='playing'){this.status='paused';this.onEvent('pause');}}
  togglePause(){if(this.status==='playing')this.pause();else if(this.status==='paused')this.start();}
  update(dt){if(this.status==='playing'&&this.phase==='score'&&Number.isFinite(dt)&&dt>0)this.scoreTime=Math.min(1.2,this.scoreTime+Math.min(dt,.12));}
  toggleCard(id){if(this.status!=='playing'||this.phase!=='play'||!this.hand.includes(id))return false;const i=this.selected.indexOf(id);if(i>=0)this.selected.splice(i,1);else if(this.selected.length<5)this.selected.push(id);else return false;this.onEvent('select');return true;}
  sortHand(mode){if(this.status!=='playing'||this.phase!=='play'||!['rank','suit'].includes(mode))return false;
    const rank=id=>{const r=gambitCardData(id,this.cardMods).rank;return r===1?14:r;},suit=id=>gambitCardData(id,this.cardMods).suit;
    this.hand=[...this.hand].sort((a,b)=>mode==='rank'?rank(b)-rank(a)||suit(a)-suit(b):suit(a)-suit(b)||rank(b)-rank(a));this.onEvent('sort',{mode});return true;}
  selectionError(){
    if(!this.selected.length)return null;
    if(this.boss?.id==='narrow_gate'&&this.selected.length>3)return 'Play at most three cards for Narrow Gate.';
    if(this.boss?.id==='full_table'&&this.selected.length!==5)return 'Full Table requires five played cards.';
    const hand=evaluateGambitHand(this.selected,{cardMods:this.cardMods,jokers:this.jokers});
    if(this.boss?.id==='echo_chamber'&&hand&&this.roundStats.handCounts[hand.id])return 'Echo Chamber: use a different poker category.';
    return null;
  }
  scoreContext(){return {round:this.round,playsLeft:this.playsLeft,maxPlays:this.maxPlays,maxDiscards:this.maxDiscards,discardsUsed:this.maxDiscards-this.discardsLeft,cardBoosts:this.cardBoosts,cardMods:this.cardMods,heldCards:this.hand.filter(id=>!this.selected.includes(id)),money:this.money,stats:this.stats,deckSize:this.deckCards.length};}
  preview(){return this.selected.length&&!this.selectionError()?scoreGambitHand(this.selected,this.jokers,this.handLevels,this.scoreContext()):null;}
  consumeSelection(){const ids=new Set(this.selected);this.discard.push(...this.hand.filter(id=>ids.has(id)));this.hand=this.hand.filter(id=>!ids.has(id));this.selected=[];this.refill();}
  pay(event,extra={}){const gain=gambitJokerPayout(this.jokers,this.stats,event,{...this.scoreContext(),...extra});this.money=Math.max(0,Math.min(99999,this.money+gain));return gain;}
  playHand(){
    if(this.status!=='playing'||this.phase!=='play'||this.playsLeft<1)return false;
    const report=this.preview();if(!report)return false;
    const cards=[...this.selected],context=clone(this.scoreContext());
    const breaks=this.legacy?[]:report.scoringCards.filter(id=>gambitCardData(id,this.cardMods).enhancement==='glass'&&this.deckCards.length>8&&this.nextRandom()<.25);
    this.lastPlay={cards,playsLeft:this.playsLeft,discardsUsed:this.maxDiscards-this.discardsLeft,context,breaks};
    this.consumeSelection();this.playsLeft--;this.roundStats.hands++;this.roundStats.handCounts[report.id]=(this.roundStats.handCounts[report.id]||0)+1;
    this.roundScore=Math.min(GAMBIT_SCORE_LIMIT,this.roundScore+report.total);this.score=Math.min(GAMBIT_SCORE_LIMIT,this.score+report.total);
    if(!this.legacy)this.pay('hand',{cards,scoringCards:report.scoringCards,handId:report.id,heldCards:context.heldCards});
    this.stats.handsPlayed++;this.stats.cardsPlayed+=cards.length;this.stats.handCounts[report.id]=(this.stats.handCounts[report.id]||0)+1;
    this.stats.sameHandStreak=this.stats.lastHand===report.id?this.stats.sameHandStreak+1:1;this.stats.lastHand=report.id;
    if(this.boss?.id==='toll')this.money=Math.max(0,this.money-1);
    this.lastResult=report;this.scoreTime=0;this.phase='score';this.onEvent('score',{score:this.score,total:report.total});return true;
  }
  discardSelected(){if(this.status!=='playing'||this.phase!=='play'||!this.discardsLeft||!this.selected.length||!this.deck.length)return false;
    const cards=[...this.selected];this.consumeSelection();this.discardsLeft--;this.roundStats.discards++;
    this.stats.discardsUsed++;this.stats.cardsDiscarded+=cards.length;if(!this.legacy)this.pay('discard',{cards});this.onEvent('discard');return true;}
  removeCard(id){this.deckCards=this.deckCards.filter(n=>n!==id);this.deck=this.deck.filter(n=>n!==id);this.hand=this.hand.filter(n=>n!==id);this.discard=this.discard.filter(n=>n!==id);this.selected=this.selected.filter(n=>n!==id);delete this.cardMods[id];delete this.cardBoosts[id];this.stats.cardsRemoved++;this.refill();}
  continueScore(){
    if(this.status!=='playing'||this.phase!=='score')return false;
    const report=this.lastResult,winningHeld=[...(this.lastPlay.context?.heldCards||this.hand)];
    for(const id of this.lastPlay.breaks||[])if(this.deckCards.length>8)this.removeCard(id);
    this.scoreTime=0;this.lastPlay=null;this.lastResult=null;
    if(this.roundScore>=this.target){
      this.stats.roundsCleared++;
      if(!this.legacy){for(const id of winningHeld)if(gambitCardData(id,this.cardMods).seal==='blue')this.handLevels[report.id]=Math.min(GAMBIT_LEVEL_LIMIT,(this.handLevels[report.id]||0)+1);}
      if(this.round===this.campaignLength&&!this.endless){this.won=true;this.phase=this.legacy?'play':'victory';if(this.legacy)this.status='dead';this.onEvent('win',{score:this.score});}
      else{
        const cap=5+(this.legacy?0:gambitJokerModifiers(this.jokers).interestCap||0),interest=this.legacy||this.boss?.id==='locked_purse'?0:Math.min(cap,Math.floor(this.money/5));
        this.money=Math.min(99999,this.money+6+this.playsLeft+interest);if(!this.legacy)this.pay('round',{handId:report.id,heldCards:winningHeld});
        this.phase='shop';this.makeShop();this.onEvent('round_clear',{round:this.round,money:this.money,interest});
      }
    }else if(this.playsLeft===0||!this.hand.length){this.phase='play';this.status='dead';this.onEvent('death',{score:this.score});}
    else{this.phase='play';this.onEvent('continue');}return true;
  }
  availableJokers(){return (this.legacy?legacyJokers:jokerIds).filter(id=>!this.jokers.includes(id));}
  drawJokers(count){const pool=this.availableJokers(),chosen=[];while(chosen.length<count&&pool.length){const roll=this.nextRandom(),rarity=roll<.68?'common':roll<.94?'uncommon':'rare';let candidates=pool.filter(id=>GAMBIT_JOKERS.find(j=>j.id===id)?.rarity===rarity);if(!candidates.length)candidates=pool;const id=candidates[Math.floor(this.nextRandom()*candidates.length)];chosen.push(id);pool.splice(pool.indexOf(id),1);}return chosen;}
  jokerOffers(){const choices=this.legacy?this.shuffled(this.availableJokers()).slice(0,2):this.drawJokers(2);return choices.map(id=>({kind:'joker',id,price:this.legacy?4:jokerPrice(id),sold:false}));}
  makeShop(){this.rerollsInShop=0;this.shop=this.jokerOffers();
    const packs=this.legacy?[packBy('joker'),packBy('upgrade')]:this.round===1?[packBy('joker'),packBy('upgrade')]:Array.from({length:2},()=>{const family=['joker','upgrade','craft','standard'][Math.floor(this.nextRandom()*4)];return packBy(family,this.nextRandom()<.25?'mega':'normal');});
    this.shop.push(...packs.map(p=>({kind:'pack',pack:p.kind,size:p.size,price:p.price,sold:false})));}
  rerollShop(){if(this.status!=='playing'||this.phase!=='shop'||this.money<this.rerollPrice)return false;this.money-=this.rerollPrice;this.rerollsInShop++;this.stats.rerolls++;this.shop.splice(0,2,...this.jokerOffers());if(!this.legacy)this.pay('reroll');this.onEvent('purchase');return true;}
  upgradeOptions(){return [...handIds.filter(id=>(this.handLevels[id]||0)<(this.legacy?5:GAMBIT_LEVEL_LIMIT)).map(id=>({kind:'hand',id})),...this.deckCards.filter(id=>(this.cardBoosts[id]||0)<(this.legacy?30:300)).map(id=>({kind:'card',id}))];}
  craftOptions(){const choices=[];for(const id of this.shuffled(this.deckCards).slice(0,8)){const data=gambitCardData(id,this.cardMods),type=Math.floor(this.nextRandom()*5);
    if(type===0)choices.push({kind:'modify',id,suit:(data.suit+1+Math.floor(this.nextRandom()*3))%4});
    else if(type===1)choices.push({kind:'modify',id,rank:data.rank%13+1});
    else if(type===2)choices.push({kind:'modify',id,enhancement:enhancements.filter(e=>e!==data.enhancement)[Math.floor(this.nextRandom()*enhancements.filter(e=>e!==data.enhancement).length)]});
    else if(type===3)choices.push({kind:'modify',id,seal:seals.filter(e=>e!==data.seal)[Math.floor(this.nextRandom()*seals.filter(e=>e!==data.seal).length)]});
    else if(this.deckCards.length>8)choices.push({kind:'remove',id});
    else choices.push({kind:'modify',id,rank:data.rank%13+1});
  }return choices;}
  packOptions(offer){const config=packBy(offer.pack,offer.size);
    if(offer.pack==='joker')return this.drawJokers(config.options).map(id=>({kind:'joker',id}));
    if(offer.pack==='upgrade'){const all=this.upgradeOptions();return this.legacy?[...this.shuffled(all.filter(o=>o.kind==='hand')).slice(0,2),...this.shuffled(all.filter(o=>o.kind==='card')).slice(0,1)]:this.shuffled(all.filter(o=>o.kind==='hand')).slice(0,config.options);}
    if(offer.pack==='craft')return this.craftOptions().slice(0,config.options);
    return Array.from({length:config.options},()=>{const id=Math.floor(this.nextRandom()*52),enhancement=enhancements[Math.floor(this.nextRandom()*enhancements.length)],option={kind:'playing',id,enhancement};if(this.nextRandom()<.35)option.seal=seals[Math.floor(this.nextRandom()*seals.length)];return option;});}
  buy(index){if(this.status!=='playing'||this.phase!=='shop'||!integer(index,0,this.shop.length-1))return false;const offer=this.shop[index];if(offer.sold||offer.price>this.money||offer.kind==='joker'&&this.jokers.includes(offer.id))return false;
    if(offer.kind==='pack'&&offer.pack==='standard'&&(this.deckCards.length>=128||this.nextCardId>4095))return false;
    const options=offer.kind==='pack'?this.packOptions(offer):null;if(options&&!options.length)return false;
    this.money-=offer.price;offer.sold=true;
    if(offer.kind==='joker')this.receiveJoker(offer.id);
    else{this.pack={kind:offer.pack,size:offer.size||'normal',options,selected:null,remaining:Math.min(packBy(offer.pack,offer.size).choose,options.length),claimed:[],offer:index};this.phase='pack';this.stats.packsOpened++;if(!this.legacy)this.pay('pack');}
    this.onEvent('purchase');return true;}
  receiveJoker(id){if(this.jokers.length<this.jokerSlots){this.jokers.push(id);this.pendingJoker=null;this.resumePack();}else{this.pendingJoker=id;this.phase='replace';}}
  resumePack(){if(this.pack&&this.pack.remaining>0){this.pack.selected=null;this.phase='pack';}else{this.pack=null;this.phase='shop';}}
  selectPack(index){if(this.status!=='playing'||this.phase!=='pack'||!integer(index,0,this.pack.options.length-1)||this.pack.claimed.includes(index))return false;this.pack.selected=index;this.onEvent('select');return true;}
  optionAvailable(option){if(option.kind==='joker')return !this.jokers.includes(option.id);if(option.kind==='hand')return (this.handLevels[option.id]||0)<(this.legacy?5:GAMBIT_LEVEL_LIMIT);if(option.kind==='playing')return this.deckCards.length<128&&this.nextCardId<=4095;if(option.kind==='remove')return this.deckCards.includes(option.id)&&this.deckCards.length>8;return this.deckCards.includes(option.id);}
  claimPack(){if(this.status!=='playing'||this.phase!=='pack'||!integer(this.pack.selected,0,this.pack.options.length-1)||this.pack.claimed.includes(this.pack.selected))return false;
    const choice=this.pack.options[this.pack.selected];if(!this.optionAvailable(choice))return false;
    this.pack.claimed.push(this.pack.selected);this.pack.remaining--;this.pack.selected=null;
    if(choice.kind==='joker')this.receiveJoker(choice.id);
    else{
      if(choice.kind==='hand')this.handLevels[choice.id]=Math.min(this.legacy?5:GAMBIT_LEVEL_LIMIT,(this.handLevels[choice.id]||0)+1);
      else if(choice.kind==='card')this.cardBoosts[choice.id]=Math.min(this.legacy?30:300,(this.cardBoosts[choice.id]||0)+10);
      else if(choice.kind==='playing'){const id=this.nextCardId++;this.deckCards.push(id);this.deck.push(id);this.cardMods[id]={rank:choice.id%13+1,suit:Math.floor(choice.id/13),...(choice.enhancement?{enhancement:choice.enhancement}:{}),...(choice.seal?{seal:choice.seal}:{})};this.stats.cardsAdded++;}
      else if(choice.kind==='remove')this.removeCard(choice.id);
      else{const mod={...this.cardMods[choice.id]};for(const key of ['rank','suit','enhancement','seal'])if(choice[key]!==undefined)mod[key]=choice[key];this.cardMods[choice.id]=mod;}
      this.resumePack();
    }this.onEvent('upgrade');return true;}
  replaceJoker(index){if(this.status!=='playing'||this.phase!=='replace'||!integer(index,0,this.jokers.length-1))return false;this.jokers[index]=this.pendingJoker;this.pendingJoker=null;this.resumePack();this.onEvent('upgrade');return true;}
  skipPack(){if(this.status!=='playing'||!['pack','replace'].includes(this.phase))return false;if(this.phase==='replace'){this.pendingJoker=null;this.resumePack();}else{this.pack=null;this.phase='shop';}this.onEvent('skip');return true;}
  sellJoker(index){if(this.status!=='playing'||this.phase!=='shop'||!integer(index,0,this.jokers.length-1))return false;this.jokers.splice(index,1);this.money=Math.min(99999,this.money+2);this.onEvent('sell');return true;}
  nextRound(){if(this.status!=='playing'||this.phase!=='shop'||this.round>=9999||this.legacy&&this.round>=6)return false;this.round++;this.shop=[];this.pack=null;this.pendingJoker=null;this.dealRound();this.onEvent('round');return true;}
  continueEndless(){if(!this.canContinueEndless)return false;const wasLegacy=this.legacy;this.legacy=false;this.endless=true;this.won=false;this.status='playing';if(wasLegacy)this.round=6;this.phase='shop';this.makeShop();this.onEvent('round_clear',{round:this.round,money:this.money});return true;}
  finishRun(){if(this.status!=='playing'||this.phase!=='victory')return false;this.status='dead';this.phase='play';this.onEvent('win',{score:this.score});return true;}
  snapshot(){return clone({version:2,...Object.fromEntries(['rngState','phase','won','round','score','roundScore','money','jokers','handLevels','cardBoosts','deck','hand','discard','selected','playsLeft','discardsLeft','shop','pack','pendingJoker','lastPlay','scoreTime','legacy','endless','deckPreset','deckCards','cardMods','nextCardId','stats','roundStats','limits','bossOrder','rerollsInShop'].map(key=>[key,this[key]])),status:this.status==='playing'?'paused':this.status});}
  restore(data){
    if(data?.version===1)return this.restoreLegacy(data);
    if(!plain(data)||data.version!==2||!integer(data.rngState,1,0xffffffff)||!phases.includes(data.phase)||!['idle','paused','playing','dead'].includes(data.status)||typeof data.won!=='boolean'||typeof data.legacy!=='boolean'||typeof data.endless!=='boolean'||!GAMBIT_DECKS.some(d=>d.id===data.deckPreset)||!integer(data.round,1,data.legacy?6:9999)||data.legacy&&data.endless||!data.legacy&&data.round>24&&!data.endless||!amount(data.score)||!amount(data.roundScore,data.score)||!integer(data.money,0,99999))return false;
    if(!dense(data.jokers,data.legacy?3:5,id=>jokerIds.includes(id))||!unique(data.jokers)||!validLevels(data.handLevels,data.legacy?5:GAMBIT_LEVEL_LIMIT)||!validBoosts(data.cardBoosts,data.legacy?30:300)||!validStats(data.stats)||!integer(data.rerollsInShop,0,99999)||!dense(data.bossOrder,8,id=>GAMBIT_BOSSES.some(b=>b.id===id))||data.bossOrder.length!==8||!unique(data.bossOrder))return false;
    if(!plain(data.limits)||!integer(data.limits.handSize,1,10)||!integer(data.limits.plays,1,10)||!integer(data.limits.discards,0,10)||!integer(data.playsLeft,0,data.limits.plays)||!integer(data.discardsLeft,0,data.limits.discards)||!plain(data.roundStats)||!integer(data.roundStats.hands,0,10)||!integer(data.roundStats.discards,0,10)||!plain(data.roundStats.handCounts)||Object.entries(data.roundStats.handCounts).some(([id,n])=>!handIds.includes(id)||!integer(n,0,10)))return false;
    if(data.roundStats.hands!==data.limits.plays-data.playsLeft||data.roundStats.discards!==data.limits.discards-data.discardsLeft)return false;
    if(!dense(data.deckCards,128,card)||data.deckCards.length<8||!unique(data.deckCards)||!integer(data.nextCardId,52,4096)||data.deckCards.some(id=>id>=data.nextCardId)||!plain(data.cardMods)||Object.entries(data.cardMods).some(([id,m])=>String(Number(id))!==id||!data.deckCards.includes(Number(id))||!validMod(m))||Object.keys(data.cardBoosts).some(id=>!data.deckCards.includes(Number(id))))return false;
    if(!dense(data.deck,128,card)||!dense(data.hand,10,card)||!dense(data.discard,128,card)||!dense(data.selected,5,id=>data.hand.includes(id))||!unique(data.selected))return false;
    const cards=[...data.deck,...data.hand,...data.discard];if(cards.length!==data.deckCards.length||!unique(cards)||cards.some(id=>!data.deckCards.includes(id))||data.hand.length>data.limits.handSize)return false;
    if(!Number.isFinite(data.scoreTime)||data.scoreTime<0||data.scoreTime>1.2)return false;
    if(!dense(data.shop,4,o=>plain(o)&&typeof o.sold==='boolean'&&(o.kind==='joker'?jokerIds.includes(o.id)&&o.price===(data.legacy?4:jokerPrice(o.id)):o.kind==='pack'&&packBy(o.pack,o.size)&&o.price===packBy(o.pack,o.size).price)))return false;
    const shopping=['shop','pack','replace'].includes(data.phase);
    if(shopping!==!!data.shop.length||data.shop.length&&data.shop.length!==4)return false;
    if(shopping&&(data.shop[0].kind!=='joker'||data.shop[1].kind!=='joker'||data.shop[0].id===data.shop[1].id||data.shop[2].kind!=='pack'||data.shop[3].kind!=='pack'))return false;
    const receiver=Object.create(GambitGame.prototype);Object.assign(receiver,clone({round:data.round,legacy:data.legacy,bossOrder:data.bossOrder}));
    if(shopping&&(data.roundScore<receiver.target||data.legacy&&data.round===6))return false;
    if(data.pack!==null){
      const p=data.pack,config=packBy(p.kind,p.size);
      if(!shopping||!config||!integer(p.offer,2,3)||data.shop[p.offer].kind!=='pack'||!data.shop[p.offer].sold||data.shop[p.offer].pack!==p.kind||(data.shop[p.offer].size||'normal')!==p.size||!dense(p.options,5,validOption)||!p.options.length||!dense(p.claimed,2,i=>integer(i,0,p.options.length-1))||!unique(p.claimed)||!integer(p.remaining,0,config.choose)||p.remaining!==Math.min(config.choose,p.options.length)-p.claimed.length||!(p.selected===null||integer(p.selected,0,p.options.length-1)&&!p.claimed.includes(p.selected)))return false;
      if(p.options.some(o=>p.kind==='joker'?o.kind!=='joker':p.kind==='upgrade'?!['hand',...(data.legacy?['card']:[])].includes(o.kind):p.kind==='craft'?!['modify','remove'].includes(o.kind):o.kind!=='playing'))return false;
      if(p.kind!=='standard'&&!unique(p.options.map(optionKey)))return false;
      if(p.options.some((o,i)=>!p.claimed.includes(i)&&(o.kind==='joker'&&data.jokers.includes(o.id)||o.kind==='hand'&&(data.handLevels[o.id]||0)>=(data.legacy?5:GAMBIT_LEVEL_LIMIT)||['card','modify','remove'].includes(o.kind)&&!data.deckCards.includes(o.id))))return false;
      if(data.phase==='pack'&&p.remaining===0)return false;
    }else if(data.phase==='pack')return false;
    if(data.phase==='replace'){
      if(!jokerIds.includes(data.pendingJoker)||data.jokers.includes(data.pendingJoker)||data.jokers.length!==(data.legacy?3:5))return false;
      if(data.pack){if(!data.pack.claimed.some(i=>data.pack.options[i].kind==='joker'&&data.pack.options[i].id===data.pendingJoker))return false;}
      else if(!data.shop.some(o=>o.kind==='joker'&&o.sold&&o.id===data.pendingJoker))return false;
    }else if(data.pendingJoker!==null)return false;
    if(data.phase==='shop'&&data.pack!==null)return false;
    let lastResult=null;
    if(data.phase==='score'){
      const p=data.lastPlay;if(!plain(p)||!dense(p.cards,5,id=>data.discard.includes(id))||!p.cards.length||!unique(p.cards)||p.playsLeft!==data.playsLeft+1||p.discardsUsed!==data.limits.discards-data.discardsLeft||!plain(p.context)||p.context.round!==data.round||p.context.playsLeft!==p.playsLeft||p.context.discardsUsed!==p.discardsUsed||!dense(p.breaks,5,id=>p.cards.includes(id))||!unique(p.breaks))return false;
      lastResult=scoreGambitHand(p.cards,data.jokers,data.handLevels,p.context);if(!lastResult||lastResult.total>data.roundScore||data.selected.length)return false;
      if(p.breaks.some(id=>gambitCardData(id,data.cardMods).enhancement!=='glass'))return false;
      if(!data.legacy){
        const c=p.context,expectedStats=clone(data.stats);
        expectedStats.handsPlayed--;expectedStats.cardsPlayed-=p.cards.length;
        expectedStats.handCounts[lastResult.id]=(expectedStats.handCounts[lastResult.id]||0)-1;
        if(expectedStats.handCounts[lastResult.id]===0&&!Object.hasOwn(c.stats?.handCounts||{},lastResult.id))delete expectedStats.handCounts[lastResult.id];
        expectedStats.lastHand=c.stats?.lastHand;expectedStats.sameHandStreak=c.stats?.sameHandStreak;
        if(!validStats(c.stats)||JSON.stringify(expectedStats)!==JSON.stringify(c.stats)||data.stats.lastHand!==lastResult.id||data.stats.sameHandStreak!==(c.stats.lastHand===lastResult.id?c.stats.sameHandStreak+1:1)||
          JSON.stringify(c.cardMods)!==JSON.stringify(data.cardMods)||JSON.stringify(c.cardBoosts)!==JSON.stringify(data.cardBoosts)||c.deckSize!==data.deckCards.length||c.maxPlays!==data.limits.plays||c.maxDiscards!==data.limits.discards||
          !dense(c.heldCards,10,id=>data.hand.includes(id))||!unique(c.heldCards)||c.heldCards.length+p.cards.length>data.limits.handSize||!integer(c.money,0,99999))return false;
        const earned=gambitJokerPayout(data.jokers,c.stats,'hand',{...c,playsLeft:data.playsLeft,cards:p.cards,scoringCards:lastResult.scoringCards,handId:lastResult.id});
        const expectedMoney=Math.max(0,Math.min(99999,c.money+earned)-(receiver.boss?.id==='toll'?1:0));
        if(data.money!==expectedMoney)return false;
      }
    }else if(data.lastPlay!==null||data.scoreTime!==0)return false;
    if(data.phase==='victory'&&(!data.won||data.round!==24||data.endless||data.roundScore<receiver.target||data.status==='dead'))return false;
    if(data.won&&!(data.phase==='victory'||data.status==='dead'&&data.phase==='play'&&data.round===(data.legacy?6:24)&&data.roundScore>=receiver.target))return false;
    if(data.status==='dead'&&(data.phase!=='play'||!data.won&&(data.playsLeft>0&&data.hand.length||data.roundScore>=receiver.target)))return false;
    if(data.status!=='dead'&&data.phase==='play'&&(!data.playsLeft||!data.hand.length||data.roundScore>=receiver.target))return false;
    if(shopping&&data.selected.length)return false;
    if(data.status==='idle'&&(data.phase!=='play'||data.round!==1||data.score!==0||data.playsLeft!==data.limits.plays||data.discardsLeft!==data.limits.discards||data.selected.length))return false;
    const keys=Object.keys(this.snapshot()).filter(key=>!['version','status'].includes(key));
    Object.assign(this,clone(Object.fromEntries(keys.map(key=>[key,data[key]]))),{status:data.status==='playing'?'paused':data.status,lastResult});return true;
  }
  restoreLegacy(data) {
    const card=id=>integer(id,0,51);
    if (!plain(data) || data.version !== 1 || !integer(data.rngState, 1, 0xffffffff) || !['play','score','shop','pack','replace'].includes(data.phase) ||
      !['idle', 'paused', 'playing', 'dead'].includes(data.status) || typeof data.won !== 'boolean' ||
      !integer(data.round, 1, 6) || !integer(data.score, 0, 1e9) || !integer(data.roundScore, 0, data.score) || !integer(data.money, 0, 9999) ||
      !dense(data.jokers, 3, id => legacyJokers.includes(id)) || new Set(data.jokers).size !== data.jokers.length ||
      !validLevels(data.handLevels, 5) || Object.keys(data.handLevels).some(id=>!handIds.slice(0,9).includes(id)) || !validBoosts(data.cardBoosts, 30) || Object.keys(data.cardBoosts).some(id=>Number(id)>51) || !integer(data.playsLeft, 0, 4) || !integer(data.discardsLeft, 0, 3) ||
      !dense(data.deck, 52, card) || !dense(data.hand, 8, card) || !dense(data.discard, 52, card) ||
      !dense(data.selected, 5, id => data.hand.includes(id)) || new Set(data.selected).size !== data.selected.length ||
      !Number.isFinite(data.scoreTime) || data.scoreTime < 0 || data.scoreTime > 1.2) return false;
    const cards = [...data.deck, ...data.hand, ...data.discard];
    if (cards.length !== 52 || new Set(cards).size !== 52 || data.hand.length < Math.min(8, 52 - data.discard.length)) return false;
    if (!dense(data.shop, 4, item => plain(item) && typeof item.sold === 'boolean' &&
      (item.kind === 'joker' ? legacyJokers.includes(item.id) && item.price === 4 : item.kind === 'pack' &&
        ['joker', 'upgrade'].includes(item.pack) && item.price === (item.pack === 'joker' ? 4 : 3)))) return false;
    const shopping = ['shop', 'pack', 'replace'].includes(data.phase);
    if (shopping !== (data.shop.length === 4) || (shopping && (data.roundScore < LEGACY_TARGETS[data.round - 1] || data.round === 6))) return false;
    if (shopping && (data.shop[0].kind !== 'joker' || data.shop[1].kind !== 'joker' || data.shop[0].id === data.shop[1].id ||
      data.shop[2].kind !== 'pack' || data.shop[2].pack !== 'joker' || data.shop[3].kind !== 'pack' || data.shop[3].pack !== 'upgrade')) return false;
    if (data.phase === 'pack') {
      if (!plain(data.pack) || !['joker', 'upgrade'].includes(data.pack.kind) || !dense(data.pack.options, 3, validOption) || !data.pack.options.length ||
        !(data.pack.selected === null || integer(data.pack.selected, 0, data.pack.options.length - 1))) return false;
      if (data.pack.options.some(option => data.pack.kind === 'joker' ? option.kind !== 'joker' || data.jokers.includes(option.id) : option.kind === 'joker')) return false;
      if (data.pack.options.some(option => option.kind === 'hand' && (data.handLevels[option.id] || 0) >= 5 || option.kind === 'card' && (data.cardBoosts[option.id] || 0) >= 30)) return false;
      if (new Set(data.pack.options.map(option => `${option.kind}:${option.id}`)).size !== data.pack.options.length) return false;
      if (!data.shop.some(offer => offer.kind === 'pack' && offer.pack === data.pack.kind && offer.sold)) return false;
    } else if (data.pack !== null) return false;
    if (data.phase === 'replace') {
      if (!legacyJokers.includes(data.pendingJoker) || data.jokers.includes(data.pendingJoker) || data.jokers.length !== 3) return false;
      if (!data.shop.some(offer => offer.sold && (offer.kind === 'joker' && offer.id === data.pendingJoker || offer.kind === 'pack' && offer.pack === 'joker'))) return false;
    } else if (data.pendingJoker !== null) return false;
    let lastResult = null;
    if (data.phase === 'score') {
      if (!plain(data.lastPlay) || !dense(data.lastPlay.cards, 5, id => data.discard.includes(id)) || !data.lastPlay.cards.length ||
        new Set(data.lastPlay.cards).size !== data.lastPlay.cards.length || data.lastPlay.playsLeft !== data.playsLeft + 1 ||
        data.lastPlay.discardsUsed !== 3 - data.discardsLeft) return false;
      lastResult = scoreGambitHand(data.lastPlay.cards, data.jokers, data.handLevels, { round: data.round,
        playsLeft: data.lastPlay.playsLeft, discardsUsed: data.lastPlay.discardsUsed, cardBoosts: data.cardBoosts });
      if (!lastResult || lastResult.total > data.roundScore || data.selected.length) return false;
    } else if (data.lastPlay !== null || data.scoreTime !== 0) return false;
    if (data.won && (data.status !== 'dead' || data.round !== 6 || data.roundScore < LEGACY_TARGETS[5])) return false;
    if (data.status === 'dead' && (data.phase !== 'play' || (!data.won && data.playsLeft > 0 && data.hand.length))) return false;
    if (data.status === 'dead' && !data.won && data.roundScore >= LEGACY_TARGETS[data.round - 1]) return false;
    if (data.status !== 'dead' && data.phase === 'play' && (data.playsLeft === 0 || !data.hand.length)) return false;
    if (shopping && data.selected.length) return false;
    if (data.status === 'idle' && (data.phase !== 'play' || data.round !== 1 || data.score !== 0 || data.playsLeft !== 4 || data.discardsLeft !== 3 || data.selected.length)) return false;
    if (data.status !== 'dead' && data.phase === 'play' && data.roundScore >= LEGACY_TARGETS[data.round - 1]) return false;
    const keys = ['rngState','phase','won','round','score','roundScore','money','jokers','handLevels','cardBoosts','deck','hand','discard','selected','playsLeft','discardsLeft','shop','pack','pendingJoker','lastPlay','scoreTime'];
    const state = clone(Object.fromEntries(keys.map(key => [key, data[key]])));
    Object.assign(this, state, {status:data.status==='playing'?'paused':data.status,lastResult,legacy:true,endless:false,deckPreset:'classic',deckCards:Array.from({length:52},(_,i)=>i),cardMods:{},nextCardId:52,stats:freshStats(),roundStats:{hands:4-data.playsLeft,discards:3-data.discardsLeft,handCounts:{}},limits:{handSize:8,plays:4,discards:3},bossOrder:GAMBIT_BOSSES.map(b=>b.id),rerollsInShop:0});
    this.shop=this.shop.map(o=>o.kind==='pack'?{...o,size:'normal'}:o);
    if(this.pack)this.pack={...this.pack,size:'normal',remaining:1,claimed:[],offer:this.pack.kind==='joker'?2:3};
    if(this.lastPlay)this.lastPlay={...this.lastPlay,context:{round:this.round,playsLeft:this.lastPlay.playsLeft,discardsUsed:this.lastPlay.discardsUsed,cardBoosts:clone(this.cardBoosts)},breaks:[]};
    return true;
  }
}
