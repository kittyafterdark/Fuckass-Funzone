/** Familiar poker-table hierarchy, original card art, and shared input geometry. */
import { GAMBIT_JOKERS, GAMBIT_HANDS, gambitCardData } from './gambit-rules.js';
import { GAMBIT_SUIT_COLORS, drawGambitCard, drawGambitJoker, drawGambitDeck, drawGambitPack } from './gambit-art.js';

import { GAMBIT_DECKS, GAMBIT_PACKS } from './gambit.js';

const C = { ink:'#fff8e7', muted:'#bad3c9', gold:'#f6d97a', blue:'#139bea', red:'#ee5149', dark:'#243740', green:'#23634f', future:'#789c90' };
const jokerBy = id => GAMBIT_JOKERS.find(item => item.id === id);
const handBy = id => GAMBIT_HANDS.find(item => item.id === id);
const number = n => { const value=Number(n)||0; return Math.abs(value)>=1e7?value.toExponential(2).replace('e+','e'):Math.floor(value).toLocaleString('en-US'); };
const multNumber = n => Math.abs(n)>=1e7?number(n):Number(Number(n||0).toFixed(2)).toLocaleString('en-US');
const face = (id,game) => gambitCardData(id,game?.cardMods||{});
const cardName = (id,game) => {const data=face(id,game);return (({1:'Ace',11:'Jack',12:'Queen',13:'King'})[data.rank]||data.rank)+' of '+['Clubs','Diamonds','Spades','Hearts'][data.suit];};
const cardView = (id,game,extra={}) => ({...face(id,game),boost:game.cardBoosts?.[id]||0,...extra});
const enhancementCopy={bonus:'+30 chips when scoring',mult:'+4 Mult when scoring',glass:'X2 Mult per scoring trigger; 25% chance to break permanently after a played hand',steel:'X1.5 Mult while held outside the play',gold:'+3 run coins if held when the blind is cleared'};
const sealCopy={red:'retrigger this scoring card once',blue:'level the winning poker hand if held when the blind clears',gold:'+2 run coins for each scoring trigger'};
const traitCopy=data=>[data.enhancement?enhancementCopy[data.enhancement]:'',data.seal?data.seal+' seal: '+sealCopy[data.seal]:''].filter(Boolean).join('. ');
const packName = (kind,size='normal') => (size==='mega'?'Mega ':'')+({joker:'Joker',upgrade:'Upgrade',craft:'Craft',standard:'Playing Card'}[kind]||kind)+' Pack';
const slots = game => game.jokerSlots||3;
function jokerGeometry(index,game){const n=slots(game),step=234/n,w=Math.min(66,step-5);return {x:113+index*step,y:27,w,h:Math.min(92,w*1.4)};}
function optionGeometry(index,count){const w=count>3?44:72,step=count>3?48:80;return {x:111+index*step,y:111,w,h:count>3?68:104};}
function catalogList(inspection){return GAMBIT_JOKERS.filter(joker=>!inspection.filter||inspection.filter==='all'||joker.rarity===inspection.filter);}
const region = (kind,x,y,w,h,label,extra={}) => ({kind,x,y,w,h,label,enabled:true,...extra});
const ownedOffer = (game,offer) => offer.kind==='joker'&&game.jokers.includes(offer.id);
function optionCopy(option,game){
  if(option.kind==='joker'){const item=jokerBy(option.id);return {title:item?.name||'Joker',detail:item?.description||'',tag:item?.rarity||'Joker'};}
  if(option.kind==='hand')return {title:(handBy(option.id)?.name||option.id)+' upgrade',detail:'Permanently add 15 base chips and 1 base Mult to this poker hand. Stack levels to keep scaling.',tag:'LEVEL '+((game.handLevels[option.id]||0)+1)+' TO '+((game.handLevels[option.id]||0)+2)};
  if(option.kind==='playing')return {title:cardName(option.id),detail:'Add to your permanent deck. '+traitCopy(option)+'.',tag:'NEW PLAYING CARD'};
  if(option.kind==='remove')return {title:'Remove '+cardName(option.id,game),detail:'Permanently remove this card. A smaller deck makes your chosen hands easier to draw.',tag:'DECK CRAFTING'};
  if(option.kind==='modify'){
    const changes=[option.rank!==undefined?'rank becomes '+(({1:'Ace',11:'Jack',12:'Queen',13:'King'})[option.rank]||option.rank):'',option.suit!==undefined?'suit becomes '+['Clubs','Diamonds','Spades','Hearts'][option.suit]:'',option.enhancement?option.enhancement+': '+enhancementCopy[option.enhancement]:'',option.seal?option.seal+' seal: '+sealCopy[option.seal]:''].filter(Boolean);
    return {title:cardName(option.id,game),detail:'Permanent change: '+changes.join('; ')+'.',tag:'DECK CRAFTING'};
  }
  return {title:cardName(option.id,game),detail:'This exact card gains 10 chips whenever it scores. The boost lasts for the run.',tag:'CARD ENHANCEMENT'};
}
function offerName(offer){return offer.kind==='joker'?jokerBy(offer.id)?.name||'Joker':packName(offer.pack,offer.size);}
function offerDetail(offer){
  if(offer.kind==='joker')return jokerBy(offer.id)?.description||'';
  const catalog=GAMBIT_PACKS.find(pack=>pack.kind===offer.pack&&pack.size===(offer.size||'normal'));
  const detail={joker:'different Jokers',upgrade:'poker-hand levels',craft:'permanent deck changes',standard:'new enhanced playing cards'}[offer.pack]||'upgrades';
  return 'Reveal '+((catalog?.options||3)===3?'three':catalog?.options||3)+' '+detail+' and choose '+(catalog?.choose||1)+'.';
}
function offerLabel(game,offer){return (offer.sold?'Sold. ':ownedOffer(game,offer)?'Already equipped. ':game.money<offer.price?'Not enough run coins. ':'')+'Buy '+offerName(offer)+' for '+offer.price+' run coins. '+offerDetail(offer);}
function handGeometry(game){
  const n=game.hand.length,step=n>1?192/(n-1):0;
  return game.hand.map((id,index)=>{const offset=index-(n-1)/2,y=302+Math.abs(offset)*2-(game.selected.includes(id)?18:0),x=n===1?207:111+index*step;
    return {id,index,x,y,w:46,h:68,tilt:offset*.015,hitX:x+(index<n-1?Math.min(step*.4,18):23),hitY:y+19};});
}
function shopGeometry(index){const col=index%2,row=Math.floor(index/2);return {x:113+col*121,y:row===0?160:282,w:108,h:row===0?92:73,buyY:row===0?257:360};}

/** The action list is paint order; overlapping hand cards receive taps from the top down. */
export function gambitActions(game,{inspection=null}={}){
  if(game.status!=='playing'){
    if(game.status==='paused'||typeof game.chooseDeck!=='function')return [];
    return [region('deckCycle',114,306,40,28,'PREV',{direction:-1}),region('deckCycle',306,306,40,28,'NEXT',{direction:1}),region('start',114,347,232,38,'START NEW RUN'),...(game.canContinueEndless?[region('endless',114,396,232,32,'CONTINUE ENDLESS')]:[])];
  }
  if(inspection){
    if(inspection.collection&&!inspection.joker){
      const list=catalogList(inspection),page=Math.min(Math.max(0,inspection.page||0),Math.max(0,Math.ceil(list.length/9)-1));
      return [region('catalogFilter',112,49,236,26,'FILTER: '+(inspection.filter||'all').toUpperCase()),...list.slice(page*9,page*9+9).map((joker,index)=>region('catalogJoker',112+index%3*80,86+Math.floor(index/3)*88,72,80,'Inspect '+joker.name+'. '+joker.description,{id:joker.id})),region('catalogPage',112,358,112,25,'PREVIOUS',{page:page-1,enabled:page>0}),region('catalogPage',236,358,112,25,'NEXT',{page:page+1,enabled:(page+1)*9<list.length}),region('close',109,396,238,42,'BACK TO TABLE')];
    }
    if(inspection.breakdown){const count=game.lastResult?.steps.length||0,page=inspection.page||0;return [region('scorePage',112,354,112,26,'PREVIOUS',{page:page-1,enabled:page>0}),region('scorePage',236,354,112,26,'NEXT',{page:page+1,enabled:(page+1)*8<count}),region('close',109,396,238,42,'BACK TO SCORE')];}
    if(inspection.info)return [region('collection',112,350,236,20,'JOKER COLLECTION · '+GAMBIT_JOKERS.length),region('cardHelp',112,374,236,20,'ENHANCEMENTS & SEALS'),region('close',109,402,238,36,'BACK TO TABLE')];
    const id=typeof inspection==='string'?inspection:inspection.joker,index=game.jokers.indexOf(id);
    const offer=typeof inspection==='object'&&Number.isInteger(inspection.offer)?game.shop[inspection.offer]:null;
    const secondary=offer?'buy':game.phase==='shop'&&index>=0?'sell':null;
    return [region(inspection.collection?'collection':'close',109,390,secondary?144:238,48,inspection.collection?'BACK TO COLLECTION':'BACK TO TABLE'),...(secondary?[region(secondary,261,390,86,48,offer?offerLabel(game,offer):'Sell '+jokerBy(id)?.name+' for 2 run coins',{displayLabel:offer?'BUY $'+offer.price:'SELL +$2',index:offer?inspection.offer:index,enabled:!offer||(!offer.sold&&!ownedOffer(game,offer)&&game.money>=offer.price)})]:[])];
  }
  const info=region('info',12,402,82,35,'RUN INFO');
  if(game.phase==='victory')return [info,region('endless',112,310,236,48,'CONTINUE ENDLESS'),region('finish',112,386,236,48,'BANK THE WIN')];
  if(game.phase==='pack')return [info,...(game.pack?.options||[]).map((option,index)=>{const copy=optionCopy(option,game),g=optionGeometry(index,game.pack.options.length),claimed=game.pack.claimed?.includes(index),available=typeof game.optionAvailable!=='function'||game.optionAvailable(option);return region('packOption',g.x,g.y,g.w,g.h+7,(claimed?'Already claimed. ':game.pack.selected===index?'Selected: ':'Inspect ')+copy.title+'. '+copy.detail,{index,enabled:!claimed&&available});}),region('claim',109,390,150,48,'CHOOSE CARD',{enabled:Number.isInteger(game.pack?.selected)&&!game.pack.claimed?.includes(game.pack.selected)&&(typeof game.optionAvailable!=='function'||game.optionAvailable(game.pack.options[game.pack.selected]))}),region('skip',269,390,78,48,'SKIP')];
  if(game.phase==='replace')return [info,...game.jokers.map((id,index)=>{const g=jokerGeometry(index,game);return region('replace',g.x,255,g.w,g.h,'Replace '+jokerBy(id)?.name+' with '+jokerBy(game.pendingJoker)?.name,{id,index});}),region('skip',109,390,238,48,'KEEP CURRENT JOKERS')];
  const jokers=game.jokers.map((id,index)=>{const g=jokerGeometry(index,game);return region('joker',g.x,g.y,g.w,g.h,'Inspect '+jokerBy(id)?.name+'. '+jokerBy(id)?.description,{id,index});});
  if(game.phase==='shop')return [info,...jokers,...game.shop.flatMap((offer,index)=>{const g=shopGeometry(index);return [region('offer',g.x,g.y,g.w,g.h,'Inspect '+offerName(offer)+'. '+offerDetail(offer),{index}),region('buy',g.x,g.buyY,g.w,22,offerLabel(game,offer),{displayLabel:offer.sold?'SOLD':ownedOffer(game,offer)?'OWNED':'BUY $'+offer.price,index,enabled:!offer.sold&&!ownedOffer(game,offer)&&game.money>=offer.price})];}),...(typeof game.rerollShop==='function'?[region('reroll',109,386,238,22,'REROLL JOKERS $'+game.rerollPrice,{enabled:game.money>=game.rerollPrice})]:[]),region('next',109,412,238,26,'NEXT BLIND')];
  if(game.phase==='score')return [info,...jokers,...((game.lastResult?.steps.length||0)>6?[region('breakdown',111,326,234,24,'FULL BREAKDOWN')]:[]),region('continue',109,390,238,48,'CONTINUE')];
  if(game.phase!=='play')return [info];
  const error=game.selectionError?.();
  return [info,...jokers,region('deck',305,221,40,61,'Inspect remaining deck'),...handGeometry(game).map(g=>region('card',g.x,g.y,g.w,g.h,cardName(g.id,game)+', '+(game.selected.includes(g.id)?'selected':'unselected')+(game.cardBoosts[g.id]?'. Bonus '+game.cardBoosts[g.id]+' chips when scoring.':'')+(traitCopy(face(g.id,game))?'. '+traitCopy(face(g.id,game))+'.':''),g)),region('play',109,390,76,48,error||'PLAY HAND',{displayLabel:'PLAY HAND',enabled:game.selected.length>0&&game.playsLeft>0&&!error}),region('sort',193,390,68,22,'SORT RANK',{mode:'rank'}),region('sort',193,416,68,22,'SORT SUIT',{mode:'suit'}),region('discard',269,390,78,48,'DISCARD',{enabled:game.selected.length>0&&game.discardsLeft>0&&game.deck.length>0})];
}
export function gambitHitAt(x,y,game,view={}){
  if(!Number.isFinite(x)||!Number.isFinite(y))return null;
  return [...gambitActions(game,view)].reverse().find(a=>a.enabled&&x>=a.x&&x<a.x+a.w&&y>=a.y&&y<a.y+a.h)||null;
}
function box(ctx,x,y,w,h,fill,stroke=null,r=4){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}}
function text(ctx,value,x,y,size=11,color=C.ink,align='left',maxWidth=null){ctx.font=`900 ${size}px ui-monospace,Consolas,monospace`;ctx.textAlign=align;ctx.textBaseline='alphabetic';ctx.fillStyle=color;if(maxWidth)ctx.fillText(String(value),x,y,maxWidth);else ctx.fillText(String(value),x,y);}
function wrap(ctx,value,x,y,width,size=10,color=C.ink,maxLines=4,lineHeight=size+4){
  ctx.font=`800 ${size}px ui-monospace,Consolas,monospace`;
  const measure=s=>ctx.measureText?ctx.measureText(s).width:s.length*size*.6;
  const lines=[];let line='';for(const word of String(value).split(/\s+/)){const next=line?line+' '+word:word;if(line&&measure(next)>width){lines.push(line);line=word;}else line=next;}if(line)lines.push(line);
  lines.slice(0,maxLines).forEach((part,i)=>{if(i===maxLines-1&&lines.length>maxLines){while(part&&measure(part+'...')>width)part=part.slice(0,-1);part+='...';}text(ctx,part,x,y+i*lineHeight,size,color,'left',width);});
}
function button(ctx,a,focused=false){
  const fill=a.kind==='play'||a.kind==='continue'||a.kind==='next'||a.kind==='claim'||a.kind==='buy'||a.kind==='endless'||a.kind==='start'?C.blue:a.kind==='discard'||a.kind==='sell'?C.red:'#db8b18';
  box(ctx,a.x,a.y+3,a.w,a.h,a.enabled?'#132a2c':'#223c37',null,5);
  box(ctx,a.x,a.y,a.w,a.h-1,a.enabled?fill:'#466057',focused?'#fff4ac':'#ffffff42',5);
  const label=(a.displayLabel||a.label).replace('SORT ','');
  if(label==='PLAY HAND') {text(ctx,'Play',a.x+a.w/2,a.y+20,12,a.enabled?C.ink:'#9eb3a7','center');text(ctx,'Hand',a.x+a.w/2,a.y+34,12,a.enabled?C.ink:'#9eb3a7','center');}
  else text(ctx,label,a.x+a.w/2,a.y+a.h/2+4,a.h<28?9:10,a.enabled?C.ink:'#9eb3a7','center',a.w-8);
}
function background(ctx){
  ctx.fillStyle='#1b5848';ctx.fillRect(0,0,360,452);
  ctx.save();ctx.strokeStyle='#83b79210';ctx.lineWidth=22;
  for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(103+i*58,-15);ctx.bezierCurveTo(230-i*13,99,100+i*40,250,375-i*26,465);ctx.stroke();}
  ctx.restore();box(ctx,5,5,96,442,'#293d42','#0e2628',5);box(ctx,105,5,250,442,'#205d4b00','#90b69735',5);
}
function railNumber(ctx,value,x,width){
  if(value>=1000){const [mantissa,exponent]=value.toExponential(2).split('e');text(ctx,mantissa,x,259,12,C.ink,'center',width);text(ctx,'e'+Number(exponent),x,272,8,C.ink,'center',width);}
  else text(ctx,value>=100?Number(value.toFixed(1)):Number(value.toFixed(2)),x,268,value>=100?12:17,C.ink,'center',width);
}
function reportFor(game){return game.phase==='score'?game.lastResult:game.phase==='play'?game.preview():null;}
function rail(ctx,game,best){
  box(ctx,11,12,84,23,game.phase==='shop'?'#c65f32':game.boss?'#914c9e':'#167cb4','#9bbcab66');text(ctx,game.phase==='shop'?'THE SHOP':game.legacy?'ROUND '+game.round:'ANTE '+(game.ante||1),53,28,11,C.ink,'center',78);
  box(ctx,11,41,84,79,'#173741','#48666b');text(ctx,game.blindName||'Score at least',53,56,8,C.ink,'center',78);
  ctx.beginPath();ctx.arc(53,80,15,0,Math.PI*2);ctx.fillStyle='#166e91';ctx.fill();ctx.strokeStyle='#93cbd1';ctx.lineWidth=2;ctx.stroke();text(ctx,'G',53,86,18,C.ink,'center');
  text(ctx,number(game.target),53,113,15,'#ff7465','center',78);
  box(ctx,11,128,84,54,'#1a2b30','#587275');text(ctx,'Round score',53,141,9,C.ink,'center');text(ctx,number(game.roundScore),53,169,22,C.ink,'center',78);
  const report=reportFor(game),level=report?(game.handLevels[report.id]||0)+1:1;
  box(ctx,11,190,84,105,'#1c2e31','#52676b');
  wrap(ctx,report?.name||'Select cards',17,207,73,11,C.ink,2,13);text(ctx,report?'lvl.'+level:'1 to 5 cards',53,235,8,C.muted,'center');
  box(ctx,14,245,35,33,C.blue);box(ctx,58,245,34,33,C.red);
  railNumber(ctx,report?.chips||0,31.5,31);text(ctx,'X',53,267,11,C.ink,'center');railNumber(ctx,report?.mult||0,75,29);
  text(ctx,'CHIPS',31,289,6.5,C.muted,'center');text(ctx,'MULT',75,289,6.5,C.muted,'center');
  box(ctx,11,304,40,47,'#1a2e32','#526a6d');box(ctx,55,304,40,47,'#1a2e32','#526a6d');
  text(ctx,'Hands',31,317,8,C.ink,'center');text(ctx,'Discards',75,317,7,C.ink,'center');text(ctx,game.playsLeft,31,343,24,C.blue,'center');text(ctx,game.discardsLeft,75,343,24,C.red,'center');
  box(ctx,11,360,84,33,'#1a2b30','#526a6d');text(ctx,'$'+game.money,53,384,22,'#ffc963','center',76);
  text(ctx,'RUN '+number(game.score),53,448,6.5,C.muted,'center',88);
}
function jokers(ctx,game){
  for(let i=0;i<slots(game);i++){const g=jokerGeometry(i,game),id=game.jokers[i];if(id)drawGambitJoker(ctx,id,g.x,g.y,g.w,g.h);else{box(ctx,g.x,g.y,g.w,g.h,'#0c342f70','#83a18b55',5);text(ctx,'JOKER',g.x+g.w/2,g.y+g.h/2,7,'#89ac98','center',g.w-4);}}
  text(ctx,game.jokers.length+'/'+slots(game),114,slots(game)>3?107:134,9,C.ink);text(ctx,"GABU'S GAMBIT",345,18,8,C.ink,'right',231);
  if(game.boss){box(ctx,111,113,236,35,'#4e2b55','#d18ca9');text(ctx,game.boss.name,117,125,8,C.gold,'left',224);wrap(ctx,game.boss.description,117,137,224,7.5,C.ink,2,10);}
  else if(slots(game)>3)text(ctx,(game.endless?'ENDLESS · ':'')+'BLIND '+game.round+' / '+(game.campaignLength||24),345,107,8,C.muted,'right',198);
}
function optionArt(ctx,option,game,x,y,w,h,selected=false){
  if(option.kind==='joker')drawGambitJoker(ctx,option.id,x,y,w,h,{selected});
  else if(['card','playing','modify','remove'].includes(option.kind)){drawGambitCard(ctx,option.id,x,y,w,h,{...(option.kind==='playing'?gambitCardData(option.id):cardView(option.id,game)),...option,selected,boost:option.kind==='playing'?0:option.kind==='card'?(game.cardBoosts[option.id]||0)+10:game.cardBoosts[option.id]||0});if(option.kind==='remove')text(ctx,'REMOVE',x+w/2,y+h+12,8,C.red,'center',w);}
  else {box(ctx,x+2,y+4,w,h,'#123c35');box(ctx,x,y,w,h,'#d9ecf2',selected?C.gold:'#7196c8',5);box(ctx,x+5,y+5,w-10,h-10,'#486dae');text(ctx,'LEVEL',x+w/2,y+20,10,C.ink,'center',w-10);ctx.beginPath();ctx.arc(x+w/2,y+h*.52,w*.24,0,Math.PI*2);ctx.fillStyle='#f4cc69';ctx.fill();text(ctx,'+1',x+w/2,y+h*.52+5,14,'#263c65','center');wrap(ctx,handBy(option.id)?.name||option.id,x+6,y+h-26,w-12,9,C.ink,2,11);}
}
function playScreen(ctx,game,reduced){
  jokers(ctx,game);
  if(game.phase==='score'){
    const report=game.lastResult,steps=report?.steps||[],elapsed=Math.max(0,Math.min(1.2,game.scoreTime||0));
    text(ctx,report?.name||'HAND PLAYED',227,156,13,C.gold,'center',231);
    const played=game.lastPlay?.cards||report?.scoringCards||[],step=Math.min(43,216/Math.max(1,played.length));
    played.forEach((id,index)=>drawGambitCard(ctx,id,227-(played.length*step+42-step)/2+index*step,169,42,61,cardView(id,game)));
    const active=reduced||elapsed>=1.2?-1:Math.min(steps.length-1,Math.floor(elapsed/1.2*steps.length));
    steps.slice(0,6).forEach((s,i)=>{const y=242+i*13,current=i===active,future=active>=0&&i>active;if(current)box(ctx,110,y-12,238,17,'#0d342d',C.gold,3);text(ctx,s.label,115,y,8,future?C.future:current?C.gold:C.ink,'left',157);text(ctx,number(s.chips)+' X '+multNumber(s.mult),343,y,9,future?C.future:C.ink,'right',72);});
    text(ctx,'+'+number(report?.total||0),227,371,23,C.gold,'center',230);return;
  }
  const report=game.preview();
  text(ctx,report?.name||'BUILD YOUR HAND',115,174,13,report?C.gold:C.ink,'left',226);
  text(ctx,report?number(report.total)+' projected':game.selectionError?.()||'Select up to five cards',115,197,report?17:10,report?'#aee5ff':C.muted,'left',183);
  if(!report)wrap(ctx,game.selectionError?.()||'Match ranks, build a straight, or collect one suit.',115,224,169,10,C.muted,3,15);
  drawGambitDeck(ctx,307,223,34,47,game.deck.length,game.deckCards?.length||52);
  const geometry=handGeometry(game);
  geometry.forEach(g=>drawGambitCard(ctx,g.id,g.x,g.y,g.w,g.h,cardView(g.id,game,{selected:game.selected.includes(g.id),tilt:g.tilt})));
  geometry.forEach(g=>text(ctx,g.index===9?'0':g.index+1,g.x+8,385,7,C.muted,'center'));
  text(ctx,game.selected.length+'/'+game.hand.length+' SELECTED',227,279,8,C.ink,'center');
}
function shopScreen(ctx,game){
  jokers(ctx,game);text(ctx,'IMPROVE YOUR RUN',227,150,10,C.gold,'center');
  game.shop.forEach((offer,index)=>{const g=shopGeometry(index),owned=ownedOffer(game,offer);if(offer.kind==='joker')drawGambitJoker(ctx,offer.id,g.x+25,g.y,58,80);else drawGambitPack(ctx,offer.pack,g.x+28,g.y,52,66,{size:offer.size});
    if(index<2)text(ctx,offerName(offer),g.x+g.w/2,g.y+90,8,C.ink,'center',104);
    if(offer.sold||owned){box(ctx,g.x+15,g.y+20,g.w-30,23,'#1d3433e8','#b3c3a4');text(ctx,offer.sold?'SOLD':'OWNED',g.x+g.w/2,g.y+36,11,C.gold,'center');}
  });
}
function packScreen(ctx,game){
  text(ctx,packName(game.pack?.kind,game.pack?.size).toUpperCase(),227,36,17,C.ink,'center',232);text(ctx,'CHOOSE '+(game.pack?.remaining||1)+' MORE',227,60,10,C.gold,'center');
  (game.pack?.options||[]).forEach((option,index)=>{const g=optionGeometry(index,game.pack.options.length);optionArt(ctx,option,game,g.x,g.y,g.w,g.h,game.pack.selected===index);if(game.pack.claimed?.includes(index)){box(ctx,g.x,g.y+15,g.w,20,'#17352ee8');text(ctx,'TAKEN',g.x+g.w/2,g.y+28,8,C.gold,'center',g.w-4);}});
  const chosen=game.pack?.options?.[game.pack.selected],copy=chosen?optionCopy(chosen,game):null;
  box(ctx,110,242,238,132,'#143f35','#8bbaa2',5);text(ctx,copy?.title||'Pick a card to inspect',119,264,12,C.gold,'left',220);
  if(copy){text(ctx,copy.tag.toUpperCase(),119,284,8,'#a4d6ee','left',219);wrap(ctx,copy.detail,119,301,219,9.5,C.ink,5,13);}
  else wrap(ctx,'Inspect an option, then Choose Card to keep it. Mega packs let you claim two different options.',119,290,219,11,C.ink,4,16);
  text(ctx,'Already paid. Skip discards remaining choices.',227,384,7,C.muted,'center',233);
}
function replaceScreen(ctx,game){
  text(ctx,'JOKER SLOTS FULL',227,36,16,C.ink,'center',232);text(ctx,'Incoming',227,57,9,C.gold,'center');
  if(game.pendingJoker)drawGambitJoker(ctx,game.pendingJoker,194,69,66,92,{selected:true});
  wrap(ctx,jokerBy(game.pendingJoker)?.description||'',115,184,228,10,C.ink,3,14);
  text(ctx,'CHOOSE ONE TO REPLACE',227,239,10,C.gold,'center');
  game.jokers.forEach((id,index)=>{const g=jokerGeometry(index,game);drawGambitJoker(ctx,id,g.x,255,g.w,g.h);});
}
function infoScreen(ctx,game,inspection){
  if(inspection.cardHelp){text(ctx,'CARD EFFECTS',227,32,17,C.gold,'center');let y=65;for(const [name,detail] of [...Object.entries(enhancementCopy),...Object.entries(sealCopy).map(([name,detail])=>[name+' seal',detail])]){text(ctx,name.toUpperCase(),116,y,9,C.gold,'left',225);wrap(ctx,detail,116,y+13,225,8.5,C.ink,2,11);y+=39;}return;}
  if(inspection.collection&&!inspection.joker){
    const list=catalogList(inspection),pages=Math.max(1,Math.ceil(list.length/9)),page=Math.min(Math.max(0,inspection.page||0),pages-1);
    text(ctx,'JOKER COLLECTION',227,30,15,C.gold,'center',233);
    list.slice(page*9,page*9+9).forEach((joker,index)=>{const x=112+index%3*80,y=86+Math.floor(index/3)*88;drawGambitJoker(ctx,joker.id,x+12,y,48,67);text(ctx,joker.rarity,x+36,y+78,7,C.muted,'center',70);});
    text(ctx,'PAGE '+(page+1)+' / '+pages+' · '+list.length+' JOKERS',227,346,8,C.muted,'center',233);return;
  }
  if(inspection.breakdown){
    text(ctx,'SCORING BREAKDOWN',227,32,15,C.gold,'center',232);const steps=game.lastResult?.steps||[],page=inspection.page||0;
    steps.slice(page*8,page*8+8).forEach((step,index)=>{const y=71+index*33;wrap(ctx,step.label,114,y,231,9,C.ink,1,12);text(ctx,number(step.chips)+' CHIPS  X '+multNumber(step.mult),114,y+15,9,C.gold,'left',230);});
    text(ctx,'TOTAL '+number(game.lastResult?.total),227,338,14,C.gold,'center',232);return;
  }
  if(inspection.info){
    text(ctx,'RUN INFO',227,31,18,C.gold,'center');text(ctx,(game.legacy?'CLASSIC RUN':'ANTE '+(game.ante||1)+' · '+(game.blindName||'SMALL BLIND'))+' · ROUND '+game.round,227,52,9,C.ink,'center',229);
    wrap(ctx,'Hand levels and crafted cards last for the run. Growth Jokers count your run history. Chips, then +Mult, then XMult; slot order does not matter.',115,72,230,9,C.ink,4,12);
    const rules=['High Card: highest card','Pair: 2 of one rank','Two Pair: two pairs','Three: 3 of one rank','Straight: 5 in order','Flush: 5 of one suit','Full House: trio + pair','Four: 4 of one rank','Straight Flush: both','Five: 5 of one rank','Flush House: full house + suit','Flush Five: five + same suit'];rules.forEach((line,i)=>text(ctx,line,116,139+i*16,9,C.ink,'left',225));
    text(ctx,'Win Ante 8 to unlock optional Endless.',227,336,8,C.muted,'center',230);return;
  }
  if(inspection.deck){text(ctx,'YOUR DECK',227,37,18,C.gold,'center');text(ctx,game.deck.length+' cards left to draw',227,65,11,C.ink,'center');
    for(let suit=0;suit<4;suit++){const ids=game.deck.filter(id=>face(id,game).suit===suit).sort((a,b)=>face(b,game).rank-face(a,game).rank);box(ctx,113,90+suit*62,232,54,'#133f35','#7aa88b');text(ctx,['CLUBS','DIAMONDS','SPADES','HEARTS'][suit]+'  '+ids.length,121,108+suit*62,11,['#7ed8bd','#ffb36c','#a8c7ff','#ff8e98'][suit]);wrap(ctx,ids.map(id=>({1:'A',11:'J',12:'Q',13:'K'})[face(id,game).rank]||face(id,game).rank).join(' '),121,128+suit*62,215,10,C.ink,2,12);}
    text(ctx,(game.deckCards?.length||52)+' total / '+game.hand.length+' held / '+game.discard.length+' used',227,365,9,C.muted,'center',230);return;}
  const offer=typeof inspection==='object'?game.shop[inspection.offer]:null,id=offer?.kind==='joker'?offer.id:typeof inspection==='string'?inspection:inspection.joker||null;
  const title=offer?offerName(offer):jokerBy(id)?.name||'Joker';text(ctx,title,227,37,17,C.gold,'center',229);
  if(id)drawGambitJoker(ctx,id,184,59,86,121);else if(offer)drawGambitPack(ctx,offer.pack,188,65,78,109,{size:offer.size});
  const detail=offer?offerDetail(offer):jokerBy(id)?.description||'';wrap(ctx,detail,116,213,225,13,C.ink,6,19);
  if(!offer&&game.stats){text(ctx,game.stats.handsPlayed+' hands · '+game.stats.discardsUsed+' discards · '+game.stats.packsOpened+' packs',227,334,8,C.muted,'center',225);}
  if(offer)text(ctx,'COST $'+offer.price,227,355,17,C.gold,'center');else text(ctx,game.jokers.includes(id)?'ACTIVE FOR THIS RUN':'FIND IN SHOPS AND JOKER PACKS',227,355,9,C.muted,'center',230);
}
function victoryScreen(ctx,game){text(ctx,'THE HOUSE IS YOURS',227,69,17,C.gold,'center',230);text(ctx,'ANTE 8 CLEARED',227,105,13,C.ink,'center');text(ctx,number(game.score)+' RUN CHIPS',227,154,20,C.gold,'center',230);wrap(ctx,'Your campaign is won. Keep this deck and every boost in Endless, or bank the win and try a different starting deck.',119,196,219,12,C.ink,5,18);}
function overlay(ctx,game){
  box(ctx,105,5,250,442,'#123a32ed');box(ctx,113,120,234,315,'#243d44','#d9e6c5',6);
  text(ctx,game.status==='dead'?game.won?'HOUSE OUTPLAYED':'THE HOUSE HOLDS':game.status==='paused'?'PAUSED':"GABU'S GAMBIT",230,150,17,C.gold,'center',220);
  wrap(ctx,game.status==='dead'?'Blind '+game.round+'. Run score '+number(game.score)+'.':game.status==='paused'?'Your deck, purchases and paid pack choices are saved. Press the cabinet Play button to resume.':'75 Jokers. Five slots. Build a deck that can outgrow the house.',124,182,212,12,C.ink,4,18);
  if(game.status==='paused')return;
  const preset=GAMBIT_DECKS.find(deck=>deck.id===game.deckPreset)||GAMBIT_DECKS[0];text(ctx,preset?.name||'Classic deck',230,276,13,C.gold,'center',216);wrap(ctx,preset?.description||'',160,306,138,8.5,C.ink,3,11);
}

export function drawGambit(canvas,game,{best=0,reduced=false,cursor=-1,inspection=null}={}){
  const ctx=canvas?.getContext?.('2d');if(!ctx)return;
  ctx.save();ctx.setTransform(canvas.width/360,0,0,canvas.height/452,0,0);ctx.textBaseline='alphabetic';ctx.textAlign='left';ctx.globalAlpha=1;ctx.lineCap='round';ctx.lineJoin='round';
  background(ctx);rail(ctx,game,best);
  if(inspection)infoScreen(ctx,game,inspection);else if(game.phase==='shop')shopScreen(ctx,game);else if(game.phase==='pack')packScreen(ctx,game);else if(game.phase==='replace')replaceScreen(ctx,game);else if(game.phase==='victory')victoryScreen(ctx,game);else playScreen(ctx,game,reduced);
  if(game.status!=='playing')overlay(ctx,game);
  const actions=gambitActions(game,{inspection});actions.forEach((a,index)=>{if(['info','play','sort','discard','continue','next','buy','claim','skip','close','sell','reroll','collection','cardHelp','catalogFilter','catalogPage','scorePage','breakdown','endless','finish','start','deckCycle'].includes(a.kind))button(ctx,a,index===cursor);if(index===cursor){ctx.strokeStyle=C.gold;ctx.lineWidth=2;ctx.strokeRect(a.x-2,a.y-2,a.w+4,a.h+4);}});
  ctx.restore();
}
