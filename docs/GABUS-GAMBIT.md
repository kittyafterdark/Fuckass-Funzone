# Gabu's Gambit — expanded prototype

Gambit is an original, dependency-free poker roguelike for Funzone's 360 × 452 logical canvas. The branch includes upstream 2.7.0's twenty games and adds Gambit as game twenty-one. This expansion adds 75 original Jokers, five equipped slots, four starting decks, eight booster variants, a 24-blind campaign, boss rules, and optional Endless continuation.

## Starting and continuing a run

New runs have eight Antes, each containing a Small Blind, Big Blind, and Boss Blind. The base targets by Ante are 180, 450, 1,100, 2,500, 5,500, 11,000, 20,000, and 35,000; Big Blinds require ×1.5 and bosses ×2, before a boss-specific target adjustment. A win at Ante 8 offers Bank the Win or Continue Endless. Endless keeps the build and increases the Ante base by ×2.2 each Ante. The engine supports finite scores up to 1e100 and 9,999 blinds; large values use scientific notation in the table.

Choose a starting deck on the idle or finished-run screen. Gremlin starts with Pair Gremlin and eight run coins; Velvet starts with Velvet Flush, six coins, and a deck containing only Hearts and Clubs; Scholar starts with Pair Gremlin, four coins, and Pair/High Card at level three; Merchant starts with twenty coins and no Joker. Starting a new run clears that run's purchases and progress. Run coins never spend or award arcade tickets, and personal bests survive restarts.

Each blind begins with eight cards, four plays, and three discards before resource modifiers or boss rules. Select one to five cards to play. Only contributing cards score unless an effect explicitly changes that rule. Played/discarded cards stay out of the draw pile until the next blind. Deck crafting, added cards, hand levels, and Jokers persist across blinds. Every physical card has its own identity, so two cards can share a rank and suit without sharing enhancements.

## Scoring and build directions

Scoring applies hand base and purchased levels, scoring-card chips, chip boosts, added Mult, then multiplied Mult. Slot order does not affect scoring. Each hand level adds 15 base chips and one base Mult; categories can receive up to 999 purchased levels. The twelve categories include the ordinary nine poker categories plus Five of a Kind, Flush House, and Flush Five, enabled by deck construction. Aces can be low in a straight but cannot wrap between King and Two.

Jokers cover immediate chips and Mult, rank/suit specialization, hand categories, held cards, retriggers, economy, extra resources, rule changes, and growth from run history. Growth descriptions explicitly count earlier events across the whole run, including events before buying the Joker. For example, Paper Trail counts cards already played, Repeat Customer counts previous plays of the current category, Growing Appetite counts boosters opened, and Snowball counts cleared blinds. Combining a source of base growth with XMult and retriggers gives a build room to scale.

The score preview is a pure read: it does not consume randomness, pay income, increment growth, or break Glass. Committing a hand freezes its pre-play context, then awards the score and updates counters once. Continue waits for the player; reopening a saved scoring screen reproduces the same report. Long reports have a Full Breakdown action with pages rather than drawing over the controls. The [75-Joker catalog](GAMBIT-JOKERS.md) lists every implemented effect. All effects and rarities can also be browsed in Run Info → Joker Collection, with rarity filtering and inspectable cards.

## Shops and economy

Clearing a non-final blind pays six coins plus unused plays, interest, and applicable income effects. Interest pays one coin per five saved coins, capped at five before modifiers; Locked Purse suppresses it. Unused hands therefore reward efficient clears, while interest creates a reason to save. Jokers sell for two coins. Shop Joker prices are four/common, six/uncommon, and eight/rare; generation weights are 68%, 26%, and 6% with no equipped duplicates.

Every shop offers two Jokers and two boosters. The first shop guarantees normal Joker and Upgrade packs. Later packs vary by family and size. Rerolls start at three coins, rise by one within that shop, and replace only the two Joker offers. Sold boosters and their payment remain unchanged. Coupon Ghoul reduces reroll cost, to a minimum of one. The next shop resets the reroll price.

## Boosters and permanent deck changes

There are four pack families, each with Normal and Mega variants. Normal packs show three choices and keep one; Mega packs show five and keep two different options. Normal Upgrade packs cost three coins, other Normal packs four, and Mega packs seven. Inspect an option, then Choose Card to confirm; selecting alone does not claim it. Skip discards any remaining paid choices.

| Family | What it changes |
| --- | --- |
| Joker | Adds an original Joker, requiring an explicit replacement when all five slots are full. |
| Upgrade | Permanently levels a poker category for the run. |
| Craft | Changes a specific card's rank or suit, adds an enhancement/seal, or removes a specific card from the deck. |
| Playing Card | Adds a new physical playing card with an enhancement and sometimes a seal. Duplicate faces are valid. |

A Mega pack saves its generated options, claimed indices, remaining choices, highlighted option, and originating purchase. Replacing or declining an incoming Joker returns to any remaining claim. Reload cannot charge again, reroll the contents, or claim the same option twice. Decks may contain eight to 128 physical cards. Craft options target explicit cards so changes are understandable before purchase or confirmation.

| Card effect | Behavior |
| --- | --- |
| Bonus | +30 chips for each scoring trigger. |
| Mult | +4 Mult for each scoring trigger. |
| Glass | ×2 Mult for each scoring trigger; a played Glass card has a seeded 25% chance to break permanently after the hand. |
| Steel | ×1.5 Mult while held outside the selected play. |
| Gold | +3 run coins if held when the winning hand was played. |
| Red seal | Retriggers that scoring card once, including chips, enhancement, and per-card Joker effects. |
| Blue seal | Levels the winning poker category if held when the winning hand was played. |
| Gold seal | +2 run coins per scoring trigger. |

Glass break results are rolled once when the hand commits, saved, and applied on Continue. Held effects use the cards outside the selected play, not cards drawn to refill afterward. Enhancements and seals are separate properties and can coexist. The table distinguishes them visually; Run Info → Enhancements & Seals explains their effects and risk.

## Bosses

Each seeded campaign shuffles eight original bosses, one per Ante: Short Fuse removes one play; Dry Well removes two discards; Narrow Gate permits at most three selected cards; Full Table requires five; Echo Chamber permits each poker category only once during that blind; Heavy Blind raises its target by fifty percent; The Toll charges one coin per played hand; Locked Purse disables interest. The boss rule appears above the hand, and an illegal selection explains why Play Hand is unavailable.

## Controls and preview

Tap cards and buttons, or use 1–9 and 0 for hand positions one through ten. Space plays or continues scoring, D discards, P pauses, R sorts ranks, S sorts suits, and I opens Run Info. Arrows focus every visible action and Enter activates it; Escape closes details. Rank/Suit sorting preserves physical card selection. Inspect Jokers and shop cards before their separate Buy/Sell actions. Tap the deck for remaining rank/suit counts. New-run deck choices, the collection, score pages, packs, and Endless decisions support keyboard focus.

The table retains four suit colors, mirrored court portraits, raised/fanned selection, illustrated Joker cards, sealed booster wrappers, and blue Chips/red Mult. Canvas hit testing uses the same geometry as painting. Detailed booster descriptions remain readable when their five card thumbnails are small. Accessibility status reports the blind, resources, preview, focused actions, inspections, and selected pack choice. Blur, hiding, and reload pause the game.

Run `npm run check`, then serve this checkout with `python -m http.server 8766 --bind 127.0.0.1` and open `http://127.0.0.1:8766/demo-gambit-qa.html`. The preview includes separate, disposable shop/pack/victory examples; the ordinary playable-run namespace is preserved. Example fixtures are QA aids, not evidence of natural progression. The production bundle embeds its own assets and has no new runtime dependency.

## Existing saves and verification

Version-one saves migrate atomically. An ongoing classic run keeps its six original targets, three Joker slots, old pack choices, prices, and scoring phase until it ends. A classic win can continue into expanded play at blind seven. A fresh run uses the new campaign. Version-two saves preserve physical card conservation, valid effects and phases, paid pack provenance, partial Mega choices, RNG state, growth, frozen scoring context, and boss order. Unknown fields cannot overwrite callbacks or methods. Other upstream games, records, settings, presets, and future save namespaces remain independent.

Automated checks cover scoring and all content families, preview purity, high-score scaling, copied/modified cards, all pack variants, partial claims, replacement, Glass, held payouts, bosses, campaign/Endless transitions, true old-version fixtures, malformed saves, geometry, narrow/high-DPI rendering, all collection pages, and production-bundle input and lifecycle. A seeded legal-run heuristic also checks campaign reach and logs reproducible traces; its results are not player win rates or proof of final balance. Browser QA checks the real self-contained bundle; live Lumiverse and real touch-device acceptance still remain necessary. Balance and usefulness across all 75 Jokers will benefit from player feedback.

## Design references and boundaries

The requested [Balatro Joker wiki](https://balatrogame.fandom.com/wiki/Jokers) documents 150 Jokers across scoring, economy, growth, and other roles. Gambit's target of 75 is half that catalog, with original names, descriptions, artwork, and implementation. The [booster reference](https://balatrogame.fandom.com/wiki/Booster_Packs) describes five families across three sizes; Gambit's eight variants use four families and two sizes. The [Ante/blind reference](https://balatrogame.fandom.com/wiki/Blinds_and_Antes) and [shop reference](https://balatrogame.fandom.com/wiki/The_Shop) informed the longer campaign, optional continuation, and separation of rerolls from pack purchases. Fandom direct fetches were restricted during research; indexed wiki text supplied the tables.

This remains a deliberately smaller game. It does not implement every Balatro Joker, Spectral consumables, vouchers, skip tags, Joker editions, Joker copying, order-sensitive reordering, unlock progression, or every boss/deck. The upstream installation identifier, `ui_panels` permission, browser storage namespace, and 2.7.0 release records remain unchanged. Continue editing source and rebuilding `dist/frontend.js` rather than editing the generated bundle.
