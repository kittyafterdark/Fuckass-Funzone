<p align="center">
  <img src="assets/funzone/funzone-logo.png" alt="Fuckass Funzone" width="660">
</p>

<h1 align="center">Arcade Intermission</h1>

<p align="center">
  A pocket arcade for Lumiverse. Play a round while your next reply is on its way.
</p>

<p align="center">
  <img src="assets/sprites/gabi_fly_2.png" alt="Gabi in flight" width="72">
  <img src="assets/match3/gabu-smug.png" alt="Gabu looking smug" width="72">
  <img src="assets/plinko/gabu-monocle.png" alt="Gabu wearing a monocle" width="72">
</p>

## Pick a game

Open **Funzone OS** from the arcade drawer to launch any of the twenty-one games in the floating cabinet.

| Game | How to play |
| --- | --- |
| **Fuckass Bird** | Tap, press Space, or press Up to flap through the gaps. |
| **Gabi Jetpack** | Hold to thrust, dodge buildings, and collect coins. |
| **Snake** | Swipe or use the arrow keys or WASD to steer toward snacks. |
| **2048** | Swipe or use the arrow keys or WASD to merge tiles. |
| **Trinket Panic** | Swap adjacent trinkets, make rockets and Gabu bombs, and choose a cozy, classic, or busy board. Timed rounds are optional. |
| **Plinko** | Drop a chip in free practice or play for fictional tickets. |
| **Simon Says** | Repeat the flashing sequence with the four pads or keys 1–4. |
| **Duck Hunt** | Tap or click flying ducks. Choose a timer or play an untimed hunt. |
| **Gabu Slots** | Spin in free practice or choose a fictional-ticket wager. |
| **Tetris** | Move with Left/Right or A/D, rotate with Up/W/X or Z, soft drop with Down/S, hard drop with Space, and hold with C. Touch buttons are included. |
| **Solitaire** | Play draw-one Klondike: tap a source card or run, then its destination; tap the stock to draw or recycle. Use Undo to take back a move. |
| **Froggy** | Hop with the arrows, WASD, or touch pad. Dodge cars, ride logs, and fill five different homes to advance. |
| **Catmate Chess** | Full-rules chess against Gabu with plush cat pieces. Tap a kitten, then a glowing paw print, or use the arrows and Enter. Z undoes. |
| **Berry Drop** | Connect four strawberries before Gabu's blueberries do. Tap a column or press 1–7. Keep the win streak alive. |
| **Tic Tac Treats** | Pocky crosses against Gabu's donuts. Tap a square or press 1–9. Wins and draws build your streak. |
| **Cake Tower** | Drop each swinging tier with a tap or Space. A tier only stays if its middle lands over the tier below. Perfect drops steady the cake; sloppy ones make it wobble and harder to aim at. Three missed tiers end the run. |
| **Bubble Bloom** | Drag to aim and release, or aim with the arrows and shoot with Space. Pop three of a kind and drop what hangs. |
| **Boop-a-Bun** | Boop bunnies as they pop out of their burrows. Golden ones pay extra; skip Gabu's robot decoys. |
| **Wobbly Wafers** | Take turns with Gabu pulling wafers from the tower. Tap a wafer, then tap again while the meter is green. Don't topple it. |
| **Gacha Match** | Memorize the open capsules, then open two at a time to find every pair of matching charms. Choose a cozy, classic, or busy tray. |
| **Gabu's Gambit** | Build a deck across eight Antes, combine five of 75 original Jokers, open eight booster variants, and continue into Endless. |

Tetris, Solitaire, Froggy, Gambit, and the eight games added in upstream 2.7.0 pause with **P** or the cabinet's main button. They also pause when the window loses focus; saved games resume paused. Solitaire supports keyboard play: arrows choose cards/piles, Enter selects, D draws, F moves the selected top card to its foundation, Z/U undoes, and Escape cancels selection. Undo history lasts for the current session; the board itself survives reloads.

Catmate Chess, Berry Drop, Tic Tac Treats, and Wobbly Wafers are played against Gabu, with a Chill, Normal, or Hard opponent in each game's drawer settings. Cake Tower, Bubble Bloom, and Boop-a-Bun have Chill, Normal, and Chaos paces, and Gacha Match has three tray sizes. A new difficulty, pace, or board size applies to your next new game, never to the one in progress. Chess undo also lasts for the current session only.

### Gabu's Gambit prototype

Choose one of four starting decks, then beat 24 blinds across eight Antes. Combine five of 75 original Jokers with permanent hand levels, enhanced cards, retriggers, and deck crafting. Eight booster variants offer Jokers, hand levels, deck changes, or added cards; Mega packs let you claim two. Paid shop rerolls and interest create ways to build and save. Defeat the final boss to bank a win or continue in Endless. Run coins stay separate from arcade tickets; purchases and partial pack choices survive reload. Existing classic runs retain their original rules until they end.

Use taps or keys **1–9 and 0** to select cards, **Space** to play or continue a scoring breakdown, **D** to discard, and **P** to pause. **R** sorts by rank, **S** by suit, and **I** opens Run Info, the full Joker Collection, and card-effect help. Arrow keys focus every visible action; **Enter** activates it and **Escape** closes details. The card-table layout uses four distinct suit colors, illustrated Joker cards, and a persistent Chips/Mult panel. See [the full rules and development notes](docs/GABUS-GAMBIT.md).

Gambit joins the twenty games in upstream 2.7.0, including the merged Tetris, Solitaire, and Froggy contribution and the eight newest games. Its rules, artwork, and run state live in dedicated modules alongside the existing games.

### Visit the Prize Counter

Earn tickets as you play and trade them for cabinet themes, Snake skins, Plinko trails, and 2048 palettes. High scores, supported game saves, and cosmetics stay in your browser. Tickets have no cash value. The extension runs locally and reacts to generation events without reading prompts or replies.

## A peek inside

<table>
  <tr>
    <td width="50%"><img src="docs/match3-v2.3.3-hints-and-widths-preview.png" alt="Trinket Panic reference art showing three board widths"></td>
    <td width="50%"><img src="docs/plinko-funzone-os-preview.png" alt="Plinko cabinet beside the nine-game Funzone OS launcher and Prize Counter shortcut"></td>
  </tr>
  <tr>
    <td align="center"><strong>Trinket Panic</strong></td>
    <td align="center"><strong>Plinko &amp; Funzone OS</strong></td>
  </tr>
</table>

## Install or update

1. Copy this repo link 
```txt
https://github.com/kittyafterdark/Fuckass-Funzone
```
2. Paste it on the Extensions sidebar tab > Add Extensions

## Development

No npm dependencies are needed. Run `npm run check` to rebuild `dist/frontend.js` and execute the rule and mock-host integration tests. The committed bundle is self-contained; edit `src/` and rebuild instead of editing `dist/` directly.

For a playable mock-host preview, run `python -m http.server 8765 --bind 127.0.0.1` from the repository root and open [the local preview](http://127.0.0.1:8765/demo-classics-qa.html). This checks the bundled UI but does not replace testing in live Lumiverse; see [the acceptance checklist](docs/TESTING.md).

For the Gambit mock-host preview, run `python -m http.server 8766 --bind 127.0.0.1` from the repository root and open [Gabu's Gambit locally](http://127.0.0.1:8766/demo-gambit-qa.html). Its selector includes isolated shop and booster examples. This preview also runs the combined twenty-one-game bundle; live Lumiverse and real touch-device checks remain pending.
