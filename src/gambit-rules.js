/** Original poker scoring and Joker catalog. Pure, deterministic rules without host APIs. */
export const GAMBIT_HANDS = Object.freeze([
  { id: 'high_card', name: 'High Card', chips: 5, mult: 1 },
  { id: 'pair', name: 'Pair', chips: 10, mult: 2 },
  { id: 'two_pair', name: 'Two Pair', chips: 20, mult: 2 },
  { id: 'three_kind', name: 'Three of a Kind', chips: 30, mult: 3 },
  { id: 'straight', name: 'Straight', chips: 30, mult: 4 },
  { id: 'flush', name: 'Flush', chips: 35, mult: 4 },
  { id: 'full_house', name: 'Full House', chips: 45, mult: 4 },
  { id: 'four_kind', name: 'Four of a Kind', chips: 60, mult: 7 },
  { id: 'straight_flush', name: 'Straight Flush', chips: 90, mult: 8 },
  { id: 'five_kind', name: 'Five of a Kind', chips: 120, mult: 12 },
  { id: 'flush_house', name: 'Flush House', chips: 140, mult: 14 },
  { id: 'flush_five', name: 'Flush Five', chips: 160, mult: 16 },
].map(hand => Object.freeze(hand)));

export const GAMBIT_JOKERS = Object.freeze([
  { id: 'pair_gremlin', name: 'Pair Gremlin', description: '+4 Mult when the played cards contain a repeated rank.', rarity: 'common' },
  { id: 'heart_hoarder', name: 'Heart Hoarder', description: '+20 chips for every scoring Heart.', rarity: 'common' },
  { id: 'last_laugh', name: 'Last Laugh', description: 'Mult ×1.5 on the final available play of a round.', rarity: 'rare' },
  { id: 'growing_suspicion', name: 'Growing Suspicion', description: '+5 chips for each round already cleared.', rarity: 'common' },
  { id: 'pocket_ace', name: 'Pocket Ace', description: '+3 Mult when an Ace scores.', rarity: 'uncommon' },
  { id: 'club_regular', name: 'Club Regular', description: '+12 chips for every scoring Club.', rarity: 'common' },
  { id: 'face_value', name: 'Face Value', description: '+8 chips for every scoring Jack, Queen, or King.', rarity: 'common' },
  { id: 'clean_slate', name: 'Clean Slate', description: '+3 Mult while no discards have been used this round.', rarity: 'uncommon' },
  { id: 'little_scheme', name: 'Little Scheme', description: '+3 Mult when playing three or fewer cards.', rarity: 'common' },
  { id: 'straight_talker', name: 'Straight Talker', description: 'Mult ×1.6 on a Straight or Straight Flush.', rarity: 'rare' },
  { id: 'velvet_flush', name: 'Velvet Flush', description: 'Mult ×1.5 on a Flush or Straight Flush.', rarity: 'rare' },
  { id: 'lonely_crown', name: 'Lonely Crown', description: '+35 chips on a High Card hand.', rarity: 'common' },
  {"id": "diamond_digger", "name": "Diamond Digger", "description": "+16 chips for every scoring Diamond.", "rarity": "common", "family": "suit"},
  {"id": "spade_scholar", "name": "Spade Scholar", "description": "+2 Mult for every scoring Spade.", "rarity": "common", "family": "suit"},
  {"id": "scarlet_thread", "name": "Scarlet Thread", "description": "+2 Mult for every scoring Heart.", "rarity": "common", "family": "suit"},
  {"id": "clover_chain", "name": "Clover Chain", "description": "+1 Mult for every scoring Club.", "rarity": "common", "family": "suit"},
  {"id": "black_tie", "name": "Black Tie", "description": "+12 chips for every scoring black card.", "rarity": "common", "family": "suit"},
  {"id": "red_letter", "name": "Red Letter", "description": "+12 chips for every scoring red card.", "rarity": "common", "family": "suit"},
  {"id": "even_odds", "name": "Even Odds", "description": "+4 Mult for every scoring 2, 4, 6, 8 or 10.", "rarity": "common", "family": "rank"},
  {"id": "odd_company", "name": "Odd Company", "description": "+18 chips for every scoring Ace, 3, 5, 7 or 9.", "rarity": "common", "family": "rank"},
  {"id": "prime_suspect", "name": "Prime Suspect", "description": "+3 Mult for every scoring 2, 3, 5 or 7.", "rarity": "common", "family": "rank"},
  {"id": "low_profile", "name": "Low Profile", "description": "+25 chips for every scoring card ranked 2 through 5.", "rarity": "common", "family": "rank"},
  {"id": "royal_court", "name": "Royal Court", "description": "+2 Mult for every scoring Jack, Queen or King.", "rarity": "common", "family": "rank"},
  {"id": "ace_up_sleeve", "name": "Ace Up Sleeve", "description": "+20 chips for every scoring Ace.", "rarity": "common", "family": "rank"},
  {"id": "ten_to_one", "name": "Ten to One", "description": "+5 Mult for every scoring 10.", "rarity": "uncommon", "family": "rank"},
  {"id": "lucky_seven", "name": "Lucky Seven", "description": "Mult ×1.3 for every scoring 7.", "rarity": "uncommon", "family": "rank"},
  {"id": "twin_moons", "name": "Twin Moons", "description": "+20 chips when the played cards contain a pair.", "rarity": "common", "family": "hand"},
  {"id": "crowded_house", "name": "Crowded House", "description": "+8 Mult on Full House or Flush House.", "rarity": "uncommon", "family": "hand"},
  {"id": "three_wishes", "name": "Three Wishes", "description": "+10 Mult when the played cards contain three of one rank.", "rarity": "uncommon", "family": "hand"},
  {"id": "square_deal", "name": "Square Deal", "description": "+100 chips when the played cards contain four of one rank.", "rarity": "uncommon", "family": "hand"},
  {"id": "double_trouble", "name": "Double Trouble", "description": "Mult ×2 on Two Pair.", "rarity": "rare", "family": "hand"},
  {"id": "royal_road", "name": "Royal Road", "description": "Mult ×2 on Straight Flush.", "rarity": "rare", "family": "hand"},
  {"id": "long_weekend", "name": "Long Weekend", "description": "+25 chips when playing five cards.", "rarity": "common", "family": "hand"},
  {"id": "solitary_star", "name": "Solitary Star", "description": "Mult ×2 when playing exactly one card.", "rarity": "uncommon", "family": "hand"},
  {"id": "spare_change", "name": "Spare Change", "description": "+1 Mult for each card held after selecting your play.", "rarity": "common", "family": "held"},
  {"id": "five_alarm", "name": "Five Alarm", "description": "Mult ×2 when five cards contribute to the hand.", "rarity": "rare", "family": "hand"},
  {"id": "before_dawn", "name": "Before Dawn", "description": "+40 chips on the first play of a round.", "rarity": "common", "family": "hand"},
  {"id": "final_notice", "name": "Final Notice", "description": "+12 Mult on the final available play of a round.", "rarity": "uncommon", "family": "hand"},
  {"id": "patience", "name": "Patience", "description": "+7 chips for each unused discard this round.", "rarity": "common", "family": "hand"},
  {"id": "empty_hands", "name": "Empty Hands", "description": "+4 Mult when three or fewer cards remain held.", "rarity": "common", "family": "held"},
  {"id": "royal_reserve", "name": "Royal Reserve", "description": "Mult ×1.25 for every King held after selecting your play.", "rarity": "rare", "family": "held"},
  {"id": "cold_storage", "name": "Cold Storage", "description": "+8 chips for each held card ranked 2 through 5.", "rarity": "common", "family": "held"},
  {"id": "tea_break", "name": "Tea Break", "description": "+2 Mult for every held Queen.", "rarity": "common", "family": "held"},
  {"id": "encore", "name": "Encore", "description": "Retrigger the first scoring card once. Repeats its chips, enhancement and per-card Joker effects.", "rarity": "uncommon", "family": "retrigger"},
  {"id": "curtain_call", "name": "Curtain Call", "description": "Retrigger every scoring Jack, Queen and King once.", "rarity": "rare", "family": "retrigger"},
  {"id": "tiny_echo", "name": "Tiny Echo", "description": "Retrigger every scoring 2, 3, 4 and 5 once.", "rarity": "uncommon", "family": "retrigger"},
  {"id": "paper_trail", "name": "Paper Trail", "description": "+3 chips for every card played earlier this run.", "rarity": "common", "family": "growth"},
  {"id": "practice_makes", "name": "Practice Makes", "description": "+1 Mult for every two hands played earlier this run.", "rarity": "common", "family": "growth"},
  {"id": "compost_heap", "name": "Compost Heap", "description": "+4 chips for every card discarded earlier this run.", "rarity": "common", "family": "growth"},
  {"id": "second_thought", "name": "Second Thought", "description": "+1 Mult for every discard used earlier this run.", "rarity": "common", "family": "growth"},
  {"id": "snowball", "name": "Snowball", "description": "Mult ×(1 + 0.12 per round cleared this run).", "rarity": "rare", "family": "growth"},
  {"id": "growing_appetite", "name": "Growing Appetite", "description": "Mult ×(1 + 0.15 per booster opened this run).", "rarity": "rare", "family": "growth"},
  {"id": "skinny_dip", "name": "Skinny Dip", "description": "Mult ×(1 + 0.15 per card permanently removed this run).", "rarity": "rare", "family": "growth"},
  {"id": "crowd_funding", "name": "Crowd Funding", "description": "+3 Mult for every card added to the deck this run.", "rarity": "uncommon", "family": "growth"},
  {"id": "coin_cathedral", "name": "Coin Cathedral", "description": "Mult ×(1 + run coins / 30). Saving money keeps this boost.", "rarity": "rare", "family": "economy"},
  {"id": "frequent_flyer", "name": "Frequent Flyer", "description": "Mult ×(1 + 0.25 per different poker category previously played this run).", "rarity": "rare", "family": "growth"},
  {"id": "repeat_customer", "name": "Repeat Customer", "description": "+3 Mult for each previous play of the current poker category this run.", "rarity": "uncommon", "family": "growth"},
  {"id": "night_school", "name": "Night School", "description": "+2 Mult per purchased level of the played poker category.", "rarity": "uncommon", "family": "growth"},
  {"id": "book_worm", "name": "Book Worm", "description": "+5 chips per purchased hand level across all poker categories.", "rarity": "common", "family": "growth"},
  {"id": "rust_collector", "name": "Rust Collector", "description": "+20 chips for every enhanced scoring card.", "rarity": "uncommon", "family": "hand"},
  {"id": "seal_of_approval", "name": "Seal of Approval", "description": "+4 Mult for every scoring card with a seal.", "rarity": "uncommon", "family": "hand"},
  {"id": "glass_menagerie", "name": "Glass Menagerie", "description": "Mult ×1.5 if a Glass card contributes to this hand.", "rarity": "rare", "family": "hand"},
  {"id": "steel_magnolia", "name": "Steel Magnolia", "description": "+6 Mult if a Steel card remains held after selecting your play.", "rarity": "uncommon", "family": "held"},
  {"id": "gold_digger", "name": "Gold Digger", "description": "Earn 1 run coin for each scoring Diamond, including retriggers.", "rarity": "common", "family": "economy"},
  {"id": "tip_jar", "name": "Tip Jar", "description": "Earn 1 run coin after each played hand.", "rarity": "common", "family": "economy"},
  {"id": "rainy_day", "name": "Rainy Day", "description": "Earn 1 run coin whenever a discard is used.", "rarity": "common", "family": "economy"},
  {"id": "dividend_demon", "name": "Dividend Demon", "description": "Earn 3 extra run coins after clearing a round.", "rarity": "uncommon", "family": "economy"},
  {"id": "pack_rat", "name": "Pack Rat", "description": "Earn 2 run coins after opening any booster.", "rarity": "uncommon", "family": "economy"},
  {"id": "spare_pocket", "name": "Spare Pocket", "description": "Draw one extra card in hand each round.", "rarity": "uncommon", "family": "utility"},
  {"id": "second_helping", "name": "Second Helping", "description": "Gain one extra play each round.", "rarity": "rare", "family": "utility"},
  {"id": "waste_not", "name": "Waste Not", "description": "Gain one extra discard each round.", "rarity": "uncommon", "family": "utility"},
  {"id": "coupon_ghoul", "name": "Coupon Ghoul", "description": "Shop rerolls cost 2 fewer run coins, to a minimum of 1.", "rarity": "uncommon", "family": "utility"},
  {"id": "deep_pockets", "name": "Deep Pockets", "description": "Raise the maximum round interest payout by 5 run coins.", "rarity": "uncommon", "family": "utility"},
  {"id": "cut_corners", "name": "Cut Corners", "description": "Straights and Flushes may be made with four cards. Can recognize four-card runs inside five selected cards.", "rarity": "rare", "family": "rule"},
  {"id": "wide_awake", "name": "Wide Awake", "description": "Every played card contributes chips and scoring-card effects, including kickers.", "rarity": "rare", "family": "rule"},
].map(joker => Object.freeze({ ...joker, family: joker.family || {"pair_gremlin": "hand", "heart_hoarder": "suit", "last_laugh": "hand", "growing_suspicion": "growth", "pocket_ace": "rank", "club_regular": "suit", "face_value": "rank", "clean_slate": "hand", "little_scheme": "hand", "straight_talker": "hand", "velvet_flush": "hand", "lonely_crown": "hand"}[joker.id], price: {common:4,uncommon:6,rare:8}[joker.rarity] })));

export const GAMBIT_SCORE_LIMIT = 1e100;
export const GAMBIT_LEVEL_LIMIT = 999;
const handById = Object.fromEntries(GAMBIT_HANDS.map(hand => [hand.id, hand]));
const jokerById = Object.fromEntries(GAMBIT_JOKERS.map(joker => [joker.id, joker]));
const integer = (value, low, high) => Number.isSafeInteger(value) && value >= low && value <= high;
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const own = (value, key, fallback) => Object.hasOwn(value, key) ? value[key] : fallback;
const isCard = value => integer(value, 0, 4095);
const dense = (values, max, predicate) => Array.isArray(values) && values.length <= max &&
  Array.from({ length: values.length }, (_, index) => Object.hasOwn(values, index) && predicate(values[index])).every(Boolean);
const validJokers = values => dense(values, 5, id => Object.hasOwn(jokerById, id)) && new Set(values).size === values.length;
const canonicalId = key => String(Number(key)) === key && isCard(Number(key));
const enhancements = ['bonus', 'mult', 'glass', 'steel', 'gold'];
const seals = ['red', 'blue', 'gold'];
const validMods = value => record(value) && Object.entries(value).every(([id, mod]) => canonicalId(id) && record(mod) &&
  (!Object.hasOwn(mod, 'rank') || integer(mod.rank, 1, 13)) && (!Object.hasOwn(mod, 'suit') || integer(mod.suit, 0, 3)) &&
  (!Object.hasOwn(mod, 'enhancement') || enhancements.includes(mod.enhancement)) && (!Object.hasOwn(mod, 'seal') || seals.includes(mod.seal)));
const statKeys = ['handsPlayed','cardsPlayed','discardsUsed','cardsDiscarded','roundsCleared','packsOpened','rerolls','cardsAdded','cardsRemoved','sameHandStreak'];
const validStats = value => record(value) && statKeys.every(key => !Object.hasOwn(value,key) || integer(value[key],0,1e9)) &&
  (!Object.hasOwn(value,'lastHand') || value.lastHand === null || Object.hasOwn(handById,value.lastHand)) &&
  (!Object.hasOwn(value,'handCounts') || record(value.handCounts) && Object.entries(value.handCounts).every(([id,count]) => Object.hasOwn(handById,id) && integer(count,0,1e9)));
const stat = (stats, key) => own(stats, key, 0);
const clamp = value => Math.min(GAMBIT_SCORE_LIMIT, Math.max(0, value));
const display = value => value >= 1e7 ? value.toExponential(2) : Number(value.toFixed(4));

/** Physical identity is separate from face: copied cards receive a new ID and optional face overrides. */
export function gambitCardData(id, cardMods = {}) {
  if (!isCard(id) || !record(cardMods)) return null;
  const raw = own(cardMods, id, {});
  if (!record(raw)) return null;
  const face = id % 52;
  const rank = own(raw, 'rank', face % 13 + 1), suit = own(raw, 'suit', Math.floor(face / 13));
  if (!integer(rank,1,13) || !integer(suit,0,3) ||
      Object.hasOwn(raw,'enhancement') && !enhancements.includes(raw.enhancement) || Object.hasOwn(raw,'seal') && !seals.includes(raw.seal)) return null;
  return { rank, suit, ...(Object.hasOwn(raw,'enhancement') ? {enhancement:raw.enhancement} : {}), ...(Object.hasOwn(raw,'seal') ? {seal:raw.seal} : {}) };
}

function straightSubset(cards, data, count) {
  const values = [...new Set(cards.map(id => data.get(id).rank === 1 ? 14 : data.get(id).rank))].sort((a,b) => a-b);
  if (values.includes(14)) values.unshift(1);
  for (let start = values.length-count; start>=0; start--) {
    const slice=values.slice(start,start+count);
    if (slice.at(-1)-slice[0]===count-1) {
      const wanted=new Set(slice.map(rank=>rank===14?1:rank));
      const picked=[];
      for (const id of cards) if(wanted.has(data.get(id).rank)){picked.push(id);wanted.delete(data.get(id).rank);}
      return picked;
    }
  }
  return null;
}

/** Identify the highest category while conserving physical identities for duplicates and crafting. */
export function evaluateGambitHand(cards, options = {}) {
  if(!record(options))return null;
  const {cardMods = {}, jokers = []}=options;
  if (!dense(cards,5,isCard) || !cards.length || new Set(cards).size!==cards.length || !validMods(cardMods) || !validJokers(jokers)) return null;
  const data=new Map(cards.map(id=>[id,gambitCardData(id,cardMods)]));
  const rankOf=id=>data.get(id).rank, pokerRank=id=>rankOf(id)===1?14:rankOf(id);
  const ranks=new Map();
  for(const id of cards){const rank=rankOf(id);if(!ranks.has(rank))ranks.set(rank,[]);ranks.get(rank).push(id);}
  const groups=[...ranks.values()].sort((a,b)=>b.length-a.length||pokerRank(b[0])-pokerRank(a[0]));
  const count=jokers.includes('cut_corners')?4:5;
  const straight=straightSubset(cards,data,5)||(count===4?straightSubset(cards,data,4):null);
  const suits=[0,1,2,3].map(suit=>cards.filter(id=>data.get(id).suit===suit));
  const flush=suits.find(group=>group.length>=count)||null;
  const straightFlush=flush?(straightSubset(flush,data,5)||(count===4?straightSubset(flush,data,4):null)):null;
  let id='high_card', scored;
  if(cards.length===5&&groups[0].length===5&&flush?.length===5)id='flush_five';
  else if(cards.length===5&&groups[0].length===3&&groups[1]?.length===2&&flush?.length===5)id='flush_house';
  else if(groups[0].length===5)id='five_kind';
  else if(straightFlush)id='straight_flush';
  else if(groups[0].length===4)id='four_kind';
  else if(groups[0].length===3&&groups[1]?.length===2)id='full_house';
  else if(flush)id='flush';
  else if(straight)id='straight';
  else if(groups[0].length===3)id='three_kind';
  else if(groups[0].length===2&&groups[1]?.length===2)id='two_pair';
  else if(groups[0].length===2)id='pair';
  if(jokers.includes('wide_awake')||['full_house','five_kind','flush_house','flush_five'].includes(id))scored=cards;
  else if(id==='straight_flush')scored=straightFlush;
  else if(id==='flush')scored=flush;
  else if(id==='straight')scored=straight;
  else if(id==='two_pair')scored=[...groups[0],...groups[1]];
  else if(id==='high_card')scored=[cards.reduce((best,card)=>pokerRank(card)>pokerRank(best)?card:best)];
  else scored=groups[0];
  const selected=new Set(scored);
  return {...handById[id],scoringCards:cards.filter(card=>selected.has(card))};
}

function triggers(id, scored, data, jokers) {
  const rank=data.get(id).rank;
  return 1+(data.get(id).seal==='red'?1:0)+(jokers.includes('encore')&&id===scored[0]?1:0)+
    (jokers.includes('curtain_call')&&rank>=11?1:0)+(jokers.includes('tiny_echo')&&rank>=2&&rank<=5?1:0);
}

/** Hand/cards, chip effects, additive Mult, then multiplicative Mult. Reading a preview never changes the run. */
export function scoreGambitHand(cards, jokers = [], handLevels = {}, context = {}) {
  if(!validJokers(jokers)||!record(handLevels)||Object.entries(handLevels).some(([id,level])=>!Object.hasOwn(handById,id)||!integer(level,0,GAMBIT_LEVEL_LIMIT))||!record(context))return null;
  const {round=1,playsLeft=4,discardsUsed=0,cardBoosts={},cardMods={},heldCards=[],money=0,stats={},deckSize=52,maxPlays=4,maxDiscards=3}=context;
  if(!integer(round,1,9999)||!integer(playsLeft,1,10)||!integer(discardsUsed,0,10)||!integer(maxPlays,1,10)||!integer(maxDiscards,0,10)||
    !integer(money,0,99999)||!integer(deckSize,0,128)||!record(cardBoosts)||Object.entries(cardBoosts).some(([id,bonus])=>!canonicalId(id)||!integer(bonus,0,300))||
    !validMods(cardMods)||!dense(heldCards,10,isCard)||new Set(heldCards).size!==heldCards.length||!validStats(stats))return null;
  const hand=evaluateGambitHand(cards,{cardMods,jokers});
  if(!hand||heldCards.some(id=>cards.includes(id)))return null;
  const data=new Map([...cards,...heldCards].map(id=>[id,gambitCardData(id,cardMods)]));
  const rank=id=>data.get(id).rank,suit=id=>data.get(id).suit;
  const scored=hand.scoringCards,level=own(handLevels,hand.id,0);
  let chips=hand.chips+level*15,mult=hand.mult+level;
  const steps=[{label:hand.name+(level?' · level '+(level+1):''),chips,mult}];
  const effects=[];
  const add=(id,type,amount)=>{if(amount>0&&(type!=='times'||amount!==1))effects.push({id,type,amount});};
  const per=(predicate)=>scored.reduce((sum,id)=>sum+(predicate(id)?triggers(id,scored,data,jokers):0),0);
  let cardPoints=0,cardMult=0,glass=1;
  for(const id of scored){const value=data.get(id),n=triggers(id,scored,data,jokers);
    cardPoints+=n*((rank(id)===1?11:Math.min(10,rank(id)))+own(cardBoosts,id,0)+(value.enhancement==='bonus'?30:0));
    if(value.enhancement==='mult')cardMult+=4*n;
    if(value.enhancement==='glass')glass*=2**n;
  }
  chips+=cardPoints;steps.push({label:'Scoring cards +'+cardPoints+' chips',chips,mult});
  if(cardMult)add('Enhanced cards','mult',cardMult);
  if(glass>1)add('Glass cards','times',glass);
  const steel=heldCards.filter(id=>data.get(id).enhancement==='steel').length;
  if(steel)add('Held Steel cards','times',1.5**steel);
  const groups=new Map();for(const id of cards)groups.set(rank(id),(groups.get(rank(id))||0)+1);
  const maxGroup=Math.max(...groups.values()),known=own(stats,'handCounts',{});
  const straightHand=['straight','straight_flush'].includes(hand.id),flushHand=['flush','straight_flush','flush_house','flush_five'].includes(hand.id);
  for(const id of jokers){
    switch(id){
      case 'pair_gremlin':if(maxGroup>=2)add(id,'mult',4);break;
      case 'heart_hoarder':add(id,'chips',per(id=>suit(id)===3)*20);break;
      case 'last_laugh':if(playsLeft===1)add(id,'times',1.5);break;
      case 'growing_suspicion':add(id,'chips',(round-1)*5);break;
      case 'pocket_ace':if(scored.some(id=>rank(id)===1))add(id,'mult',3);break;
      case 'club_regular':add(id,'chips',per(id=>suit(id)===0)*12);break;
      case 'face_value':add(id,'chips',per(id=>rank(id)>=11)*8);break;
      case 'clean_slate':if(discardsUsed===0)add(id,'mult',3);break;
      case 'little_scheme':if(cards.length<=3)add(id,'mult',3);break;
      case 'straight_talker':if(straightHand)add(id,'times',1.6);break;
      case 'velvet_flush':if(flushHand)add(id,'times',1.5);break;
      case 'lonely_crown':if(hand.id==='high_card')add(id,'chips',35);break;
      case 'diamond_digger':add(id,'chips',per(id=>suit(id)===1)*16);break;
      case 'spade_scholar':add(id,'mult',per(id=>suit(id)===2)*2);break;
      case 'scarlet_thread':add(id,'mult',per(id=>suit(id)===3)*2);break;
      case 'clover_chain':add(id,'mult',per(id=>suit(id)===0));break;
      case 'black_tie':add(id,'chips',per(id=>suit(id)===0||suit(id)===2)*12);break;
      case 'red_letter':add(id,'chips',per(id=>suit(id)===1||suit(id)===3)*12);break;
      case 'even_odds':add(id,'mult',per(id=>rank(id)<=10&&rank(id)%2===0)*4);break;
      case 'odd_company':add(id,'chips',per(id=>rank(id)<=9&&rank(id)%2===1)*18);break;
      case 'prime_suspect':add(id,'mult',per(id=>[2,3,5,7].includes(rank(id)))*3);break;
      case 'low_profile':add(id,'chips',per(id=>rank(id)>=2&&rank(id)<=5)*25);break;
      case 'royal_court':add(id,'mult',per(id=>rank(id)>=11)*2);break;
      case 'ace_up_sleeve':add(id,'chips',per(id=>rank(id)===1)*20);break;
      case 'ten_to_one':add(id,'mult',per(id=>rank(id)===10)*5);break;
      case 'lucky_seven':add(id,'times',1.3**per(id=>rank(id)===7));break;
      case 'twin_moons':if(maxGroup>=2)add(id,'chips',20);break;
      case 'crowded_house':if(['full_house','flush_house'].includes(hand.id))add(id,'mult',8);break;
      case 'three_wishes':if(maxGroup>=3)add(id,'mult',10);break;
      case 'square_deal':if(maxGroup>=4)add(id,'chips',100);break;
      case 'double_trouble':if(hand.id==='two_pair')add(id,'times',2);break;
      case 'royal_road':if(hand.id==='straight_flush')add(id,'times',2);break;
      case 'long_weekend':if(cards.length===5)add(id,'chips',25);break;
      case 'solitary_star':if(cards.length===1)add(id,'times',2);break;
      case 'spare_change':add(id,'mult',heldCards.length);break;
      case 'five_alarm':if(scored.length===5)add(id,'times',2);break;
      case 'before_dawn':if(playsLeft===maxPlays)add(id,'chips',40);break;
      case 'final_notice':if(playsLeft===1)add(id,'mult',12);break;
      case 'patience':add(id,'chips',Math.max(0,maxDiscards-discardsUsed)*7);break;
      case 'empty_hands':if(heldCards.length<=3)add(id,'mult',4);break;
      case 'royal_reserve':add(id,'times',1.25**heldCards.filter(id=>rank(id)===13).length);break;
      case 'cold_storage':add(id,'chips',heldCards.filter(id=>rank(id)>=2&&rank(id)<=5).length*8);break;
      case 'tea_break':add(id,'mult',heldCards.filter(id=>rank(id)===12).length*2);break;
      case 'paper_trail':add(id,'chips',stat(stats,'cardsPlayed')*3);break;
      case 'practice_makes':add(id,'mult',Math.floor(stat(stats,'handsPlayed')/2));break;
      case 'compost_heap':add(id,'chips',stat(stats,'cardsDiscarded')*4);break;
      case 'second_thought':add(id,'mult',stat(stats,'discardsUsed'));break;
      case 'snowball':add(id,'times',1+.12*stat(stats,'roundsCleared'));break;
      case 'growing_appetite':add(id,'times',1+.15*stat(stats,'packsOpened'));break;
      case 'skinny_dip':add(id,'times',1+.15*stat(stats,'cardsRemoved'));break;
      case 'crowd_funding':add(id,'mult',3*stat(stats,'cardsAdded'));break;
      case 'coin_cathedral':add(id,'times',1+money/30);break;
      case 'frequent_flyer':add(id,'times',1+.25*Object.keys(known).filter(id=>known[id]>0).length);break;
      case 'repeat_customer':add(id,'mult',3*own(known,hand.id,0));break;
      case 'night_school':add(id,'mult',level*2);break;
      case 'book_worm':add(id,'chips',Object.values(handLevels).reduce((sum,n)=>sum+n,0)*5);break;
      case 'rust_collector':add(id,'chips',per(id=>!!data.get(id).enhancement)*20);break;
      case 'seal_of_approval':add(id,'mult',per(id=>!!data.get(id).seal)*4);break;
      case 'glass_menagerie':if(scored.some(id=>data.get(id).enhancement==='glass'))add(id,'times',1.5);break;
      case 'steel_magnolia':if(steel)add(id,'mult',6);break;
    }
  }
  for(const type of ['chips','mult','times'])for(const effect of effects.filter(item=>item.type===type)){
    if(type==='chips')chips=clamp(chips+effect.amount);
    else if(type==='mult')mult=clamp(mult+effect.amount);
    else mult=clamp(mult*effect.amount);
    if(mult<1e12)mult=Math.round(mult*1e8)/1e8;
    const bonus=type==='chips'?'+'+display(effect.amount)+' chips':type==='mult'?'+'+display(effect.amount)+' Mult':'Mult ×'+display(effect.amount);
    steps.push({label:(jokerById[effect.id]?.name||effect.id)+': '+bonus,chips,mult});
  }
  return {id:hand.id,name:hand.name,scoringCards:[...scored],chips,mult,total:Math.floor(clamp(chips*mult)),steps};
}

/** Resource effects are returned as additions, never applied while reading a preview. */
export function gambitJokerModifiers(jokers = []) {
  const result={handSize:0,plays:0,discards:0,rerollDiscount:0,interestCap:0};
  if(!validJokers(jokers))return result;
  if(jokers.includes('spare_pocket'))result.handSize=1;
  if(jokers.includes('second_helping'))result.plays=1;
  if(jokers.includes('waste_not'))result.discards=1;
  if(jokers.includes('coupon_ghoul'))result.rerollDiscount=2;
  if(jokers.includes('deep_pockets'))result.interestCap=5;
  return result;
}

/** Deterministic event income; the engine commits it exactly once at the corresponding event. */
export function gambitJokerPayout(jokers = [], stats = {}, event, context = {}) {
  if(!validJokers(jokers)||!validStats(stats)||!record(context))return 0;
  const {cardMods={},cards=[],scoringCards=[],heldCards=[]}=context;
  if(!validMods(cardMods)||!dense(cards,5,isCard)||!dense(scoringCards,5,isCard)||!dense(heldCards,10,isCard))return 0;
  const data=new Map([...cards,...scoringCards,...heldCards].map(id=>[id,gambitCardData(id,cardMods)]));
  let amount=0;
  if(event==='hand'){
    if(jokers.includes('tip_jar'))amount++;
    for(const id of scoringCards){const n=triggers(id,scoringCards,data,jokers);if(jokers.includes('gold_digger')&&data.get(id).suit===1)amount+=n;if(data.get(id).seal==='gold')amount+=n*2;}
  }
  else if(event==='discard'&&jokers.includes('rainy_day'))amount++;
  else if(event==='round'){
    if(jokers.includes('dividend_demon'))amount+=3;
    amount+=heldCards.filter(id=>data.get(id).enhancement==='gold').length*3;
  }
  else if(event==='pack'&&jokers.includes('pack_rat'))amount+=2;
  return amount;
}
