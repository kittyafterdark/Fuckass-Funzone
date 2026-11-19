# Gambit's 75 Jokers

All effects below are implemented in `src/gambit-rules.js` and inspectable in Run Info → Joker Collection. Five slots can be equipped. Growth counts earlier events across the whole run; scoring resolves chips, then added Mult, then XMult, independently of slot order.

Rarities: 35 Common, 23 Uncommon, 17 Rare. Shop prices: 4, 6, and 8 run coins respectively.

| Joker | Family | Rarity | Effect |
| --- | --- | --- | --- |
| Pair Gremlin | hand | common | +4 Mult when the played cards contain a repeated rank. |
| Heart Hoarder | suit | common | +20 chips for every scoring Heart. |
| Last Laugh | hand | rare | Mult ×1.5 on the final available play of a round. |
| Growing Suspicion | growth | common | +5 chips for each round already cleared. |
| Pocket Ace | rank | uncommon | +3 Mult when an Ace scores. |
| Club Regular | suit | common | +12 chips for every scoring Club. |
| Face Value | rank | common | +8 chips for every scoring Jack, Queen, or King. |
| Clean Slate | hand | uncommon | +3 Mult while no discards have been used this round. |
| Little Scheme | hand | common | +3 Mult when playing three or fewer cards. |
| Straight Talker | hand | rare | Mult ×1.6 on a Straight or Straight Flush. |
| Velvet Flush | hand | rare | Mult ×1.5 on a Flush or Straight Flush. |
| Lonely Crown | hand | common | +35 chips on a High Card hand. |
| Diamond Digger | suit | common | +16 chips for every scoring Diamond. |
| Spade Scholar | suit | common | +2 Mult for every scoring Spade. |
| Scarlet Thread | suit | common | +2 Mult for every scoring Heart. |
| Clover Chain | suit | common | +1 Mult for every scoring Club. |
| Black Tie | suit | common | +12 chips for every scoring black card. |
| Red Letter | suit | common | +12 chips for every scoring red card. |
| Even Odds | rank | common | +4 Mult for every scoring 2, 4, 6, 8 or 10. |
| Odd Company | rank | common | +18 chips for every scoring Ace, 3, 5, 7 or 9. |
| Prime Suspect | rank | common | +3 Mult for every scoring 2, 3, 5 or 7. |
| Low Profile | rank | common | +25 chips for every scoring card ranked 2 through 5. |
| Royal Court | rank | common | +2 Mult for every scoring Jack, Queen or King. |
| Ace Up Sleeve | rank | common | +20 chips for every scoring Ace. |
| Ten to One | rank | uncommon | +5 Mult for every scoring 10. |
| Lucky Seven | rank | uncommon | Mult ×1.3 for every scoring 7. |
| Twin Moons | hand | common | +20 chips when the played cards contain a pair. |
| Crowded House | hand | uncommon | +8 Mult on Full House or Flush House. |
| Three Wishes | hand | uncommon | +10 Mult when the played cards contain three of one rank. |
| Square Deal | hand | uncommon | +100 chips when the played cards contain four of one rank. |
| Double Trouble | hand | rare | Mult ×2 on Two Pair. |
| Royal Road | hand | rare | Mult ×2 on Straight Flush. |
| Long Weekend | hand | common | +25 chips when playing five cards. |
| Solitary Star | hand | uncommon | Mult ×2 when playing exactly one card. |
| Spare Change | held | common | +1 Mult for each card held after selecting your play. |
| Five Alarm | hand | rare | Mult ×2 when five cards contribute to the hand. |
| Before Dawn | hand | common | +40 chips on the first play of a round. |
| Final Notice | hand | uncommon | +12 Mult on the final available play of a round. |
| Patience | hand | common | +7 chips for each unused discard this round. |
| Empty Hands | held | common | +4 Mult when three or fewer cards remain held. |
| Royal Reserve | held | rare | Mult ×1.25 for every King held after selecting your play. |
| Cold Storage | held | common | +8 chips for each held card ranked 2 through 5. |
| Tea Break | held | common | +2 Mult for every held Queen. |
| Encore | retrigger | uncommon | Retrigger the first scoring card once. Repeats its chips, enhancement and per-card Joker effects. |
| Curtain Call | retrigger | rare | Retrigger every scoring Jack, Queen and King once. |
| Tiny Echo | retrigger | uncommon | Retrigger every scoring 2, 3, 4 and 5 once. |
| Paper Trail | growth | common | +3 chips for every card played earlier this run. |
| Practice Makes | growth | common | +1 Mult for every two hands played earlier this run. |
| Compost Heap | growth | common | +4 chips for every card discarded earlier this run. |
| Second Thought | growth | common | +1 Mult for every discard used earlier this run. |
| Snowball | growth | rare | Mult ×(1 + 0.12 per round cleared this run). |
| Growing Appetite | growth | rare | Mult ×(1 + 0.15 per booster opened this run). |
| Skinny Dip | growth | rare | Mult ×(1 + 0.15 per card permanently removed this run). |
| Crowd Funding | growth | uncommon | +3 Mult for every card added to the deck this run. |
| Coin Cathedral | economy | rare | Mult ×(1 + run coins / 30). Saving money keeps this boost. |
| Frequent Flyer | growth | rare | Mult ×(1 + 0.25 per different poker category previously played this run). |
| Repeat Customer | growth | uncommon | +3 Mult for each previous play of the current poker category this run. |
| Night School | growth | uncommon | +2 Mult per purchased level of the played poker category. |
| Book Worm | growth | common | +5 chips per purchased hand level across all poker categories. |
| Rust Collector | hand | uncommon | +20 chips for every enhanced scoring card. |
| Seal of Approval | hand | uncommon | +4 Mult for every scoring card with a seal. |
| Glass Menagerie | hand | rare | Mult ×1.5 if a Glass card contributes to this hand. |
| Steel Magnolia | held | uncommon | +6 Mult if a Steel card remains held after selecting your play. |
| Gold Digger | economy | common | Earn 1 run coin for each scoring Diamond, including retriggers. |
| Tip Jar | economy | common | Earn 1 run coin after each played hand. |
| Rainy Day | economy | common | Earn 1 run coin whenever a discard is used. |
| Dividend Demon | economy | uncommon | Earn 3 extra run coins after clearing a round. |
| Pack Rat | economy | uncommon | Earn 2 run coins after opening any booster. |
| Spare Pocket | utility | uncommon | Draw one extra card in hand each round. |
| Second Helping | utility | rare | Gain one extra play each round. |
| Waste Not | utility | uncommon | Gain one extra discard each round. |
| Coupon Ghoul | utility | uncommon | Shop rerolls cost 2 fewer run coins, to a minimum of 1. |
| Deep Pockets | utility | uncommon | Raise the maximum round interest payout by 5 run coins. |
| Cut Corners | rule | rare | Straights and Flushes may be made with four cards. Can recognize four-card runs inside five selected cards. |
| Wide Awake | rule | rare | Every played card contributes chips and scoring-card effects, including kickers. |
