# Fuckass Funzone 2.8.0 — Three new games, a real wafer Jenga, and a livelier 2.7.0 batch

## What's new

Three games join Funzone OS, bringing the cabinet to twenty-four. Each has its own art and app icon, a help tab with settings in the drawer, a personal best, a ticket every 500 new personal-best points, saves that resume paused, and Gabu commentary using Gabu's existing faces.

| Game | What it is | Settings |
| --- | --- | --- |
| **Malware Mayhem** | You are a little neon virus loose in Gabu's mainframe, eating every byte of his data while his antivirus bots hunt you. An exploit chip corrupts the bots so you can crash them back to their reboot dock for 100, 200, 400, then 800 points. Three hearts; clearing the maze starts a faster level. | Pace: Chill · slow / Normal / Chaos · fast |
| **Sugar Snap** | Gabu presses a shape into a disc of honeycomb toffee, and you carve it out with a needle before the timer runs out. Carving too fast or scratching off the line strains the toffee; two warning cracks appear, and at full strain it snaps. Three candies per run. | Difficulty: Chill · more time / Normal / Hard · no mercy |
| **Gabu's Lockscreen** | Guess the passcode on Gabu's phone one letter at a time. Every wrong guess turns one segment of its face scan red and pulls the scanner in; when it locks on, his eyes glare back and you are locked out. | Difficulty: Chill · 7 misses / Normal · 6 misses / Hard · no mercy |

### Malware Mayhem

- **Steering:** swipe to turn, keep a finger moving to steer on every leg of the drag, tap toward where the virus should go, or use the arrows or WASD. A turn asked for a moment early is taken at the next opening, and one asked a moment late still corners, the way arcade mazes let you: the virus steps back up to half a cell and takes it. A stroke only counts once it clearly goes one way, and the slight slip back as a fingertip lifts never turns the virus round. In a flick simulation at a junction, 100% of early, on-time and slightly late flicks turned where they were meant to. Turning back on purpose works anywhere, even between two cells. Swiping on the board never scrolls the page or drags the cabinet.
- **The maze** is an original layout. Every corridor connects and none dead-ends, so the virus always has somewhere to run; a test keeps it that way.
- **Exploits:** the bots go gray with crossed-out eyes and run. The time left drains as a gold bar; nothing blinks.
- **Look:** a monitor in the arcade's dark cyber palette with a "GABU OS" window for its start, pause and game-over screens. Each bot has its own neon trim and Gabu's amber and blue eyes.
- **Gabu** treats it as his game to win, like the games played against him: hyped when a bot catches you, panicking when you wipe his mainframe, shocked by an exploit, annoyed when you crash his bots.

Simulated players steering for the nearest byte while avoiding the bots, median score over 120 runs:

| Player | Chill | Normal | Chaos |
| --- | ---: | ---: | ---: |
| Careful | 11,970 | 7,110 | 3,520 |
| Average | 11,560 | 4,130 | 2,420 |
| Sloppy | 2,390 | 1,700 | 1,440 |

### Sugar Snap

- **Eight original shapes**, gentlest to trickiest: heart, fish, mushroom, star, cat, crescent moon, a robot head and a lightning bolt. Each lap through them narrows the line a little.
- **Carving:** drag along the pressed line with a finger or mouse, or hold Space to carve on along the line. The needle's tip glows mint on the line and red off it. Its speed is judged over about a quarter second, so uneven pointer events never count as rushing, and sweeping across the plate is always safe.
- **Scoring:** 100 for each shape, plus 10 for every second left, up to 100 for a clean carve, and 50 more for each lap.
- **Gabu** gloats at a snap, frets at a crack, sighs at a timeout, and is grudgingly hyped by a clean pop.

Simulated tracers with hand wobble, easing off when the toffee strains, share of shapes freed over 60 runs:

| Player | Chill | Normal | Hard |
| --- | ---: | ---: | ---: |
| Careful | 100% | 100% | 100% |
| Average | 100% | 100% | 77% |
| Sloppy | 100% | 40% | 0% |

### Gabu's Lockscreen

- **Words:** 173 everyday words in five categories anyone can guess: Food, Games, Tech, Animals, and Around the House. No jargon. Chill draws shorter words, Hard draws the longer ones and keeps the category hidden until the end.
- **Input:** type a letter, tap the on-screen keyboard (three rows above Gabu's line), or use the arrows and Enter. P is a letter here, so Escape pauses.
- **Scoring:** 100 for each passcode, plus 10 a letter, 25 for every spare guess, and 20 more for each passcode already cracked in the run. One lockout ends the run.
- Saves store the word's list and position, not the word itself, and nothing on the page shows the answer.

Simulated players who reason from the pattern some of the time, share of words cracked over 300 runs:

| Player | Chill | Normal | Hard |
| --- | ---: | ---: | ---: |
| Sharp | 99% | 98% | 93% |
| Casual | 85% | 80% | 63% |

## Reworked: Tic Tac Treats only keeps your three newest treats

Tic Tac Treats and Berry Drop played almost the same loop, and plain tic-tac-toe mostly ends in a draw. Now each side keeps only its three newest treats on the board: placing a fourth eats your oldest, which shows faded beforehand (no blinking) so you can plan around it. Gabu searches with the same rule, two, four and seven moves ahead on Chill, Normal and Hard. Hard is beatable now, so it earns a bonus like the other levels. A round of 30 treats with no line goes stale and counts as a draw. Forks can no longer happen, so the fork event, sound and lines are gone for this game only. Older saves keep their streak and score and start the current round on a fresh board.

Simulated opponents, 200 rounds each, with alternating starters (W/L/D from the player's side):

| Player | Chill Gabu | Normal Gabu | Hard Gabu |
| --- | --- | --- | --- |
| Strong | 194 / 5 / 1 | 175 / 21 / 4 | 99 / 101 / 0 |
| Medium | 147 / 53 / 0 | 92 / 105 / 3 | 19 / 172 / 9 |
| Weak | 75 / 125 / 0 | 31 / 169 / 0 | 5 / 195 / 0 |

## Reworked: Wobbly Wafers is a real digital Jenga

The steady-hand meter raced to red, the tower fell too fast, and fallen wafers could slide off screen tilted or rest on an invisible ledge. Wafers now work the way Jenga blocks do:

- **Slide them out by hand.** Hold a wafer and drag: side wafers slide sideways, a middle wafer slides out toward you (drag down; it grows a little as it comes). Keyboard: arrows pick a wafer, hold Space to slide it out steadily, Escape pushes it back. Fully out, it goes on top and it is Gabu's turn.
- **Every wafer has its own grip:** the weight resting on it, shared by what is left in its layer, times how snugly it sits. Loose ones slide out clean; stuck ones shake the tower however gently you pull, and rushing shakes it more. Nudge one to feel it (the outline and a FEELS readout say loose, snug or stuck), push it back, and try another. Gabu warns you when you pick a stuck one.
- **Real balance:** the tower stands only while the weight above every layer sits over the wafers that layer still has, so a lone edge drops it and a lopsided top can tip a narrow layer. It falls toward the side the weight hangs over.
- **A calmer wobble:** the tower settles when left alone, down to a floor that rises with every hole, so it gets nervier as the game goes on instead of racing to red.
- **Gabu slides his wafers out too,** visibly. His level sets how well he reads grip and how steady his paws are.
- **A smoother fall:** the top section tips over as one piece around the stump's outer edge with gentler gravity, breaks apart without a jolt, bounces off the screen's sides, rolls off its rounded ends, and comes to rest flat on the saucer or table. Across 60 random topples in the tests, no wafer sinks into the floor, slides while tilted, or rests anywhere but flat and on screen.

Simulated players over 120 rounds against each level, share of rounds won:

| Player | Chill Gabu | Normal Gabu | Hard Gabu |
| --- | ---: | ---: | ---: |
| Careful (feels for loose wafers, slides slowly) | 66% | 33% | 25% |
| Sloppy (grabs anything, yanks) | 21% | 0% | 0% |

Rounds run about 10 to 16 pulls each. Older saves get fresh grips.

## Reworked: Bubble Bloom fills the cabinet and has more going on

The field was small and squeezed, with the level and new-row dots hanging outside it. It now fills the cabinet inside one framed panel with a neon rim, and the level, pace and new-row dots sit inside its top strip. Bubbles are a little bigger, and the launcher sits above Gabu's line, which moves the cushion line up one row (a run saved already past it loads finished instead of being refused).

- **Combos:** shots that pop in a row multiply their points, x1.25, x1.5 and so on up to x3, with a callout from the third.
- **The Bloom meter:** pops and drops charge it. When it fills, your next bubble is a rainbow that takes the kind making the biggest group where it lands, pops even a single neighbour, and scores double.
- **Feel:** pops burst into a ring and sparks, points float up, callouts announce combos, rainbows and cleared fields, shots leave a soft streak, and faint bubbles drift up behind the field. The rim and cushion line warm to red as bubbles near the line, without blinking. All of it holds still with reduced motion.
- **Gabu** reacts to a full meter, a rainbow pop and combos (not every shot).

## Fixed: Cake Tower wobble warning sounded like a crash

A wobbly cake never loses tiers on its own; wobble only makes it harder to aim. The warning used the crash buzz and Gabu's panicked face, which suggested something had gone wrong. It is now a light tick with his smug face, and the crash buzz plays only when a tier misses and costs a heart.

## Fixed: Gabu's line in the newer games

His line now uses Kitty's own box, at the same size and at the bottom, in every newer game. The layouts moved instead, so nothing you need to see sits under it on the standard cabinet: Catmate Chess's board sits a little higher, Gacha Match's tray ends above it, and Bubble Bloom's field was rebuilt around it (above). Only footer hints go under his line, as in the original games, and every layout looks the same with commentary turned off. While you hold a wafer, Gabu stays quiet so the steady-hand meter shows.

## Fixed: Bubble Bloom's launcher cloud looked tilted

The cloud's puffs are now mirrored on a flat base, so it sits level.

## Changed: darker cabinets and Gabu's real eyes

- **Darker cabinets:** Catmate Chess, Tic Tac Treats, Cake Tower and Gacha Match move from pastel boards to the arcade's dark cabinet look, so they sit beside the original games without going kawaii. Cake Tower becomes a late-night bakery whose sky deepens as the cake climbs. Their app icons now use dark tiles too. Boop-a-Bun keeps its bright garden, like the arcade's other colorful games.
- **Gabu's eyes:** everything that stands in for Gabu now has his amber right eye and blue left eye, as on the Snake head: his chess kittens, Berry Drop's blueberries, Tic Tac Treats' donuts, Boop-a-Bun's robot decoys and the antivirus bots. Catmate Chess's header and app icon show his king kitten.
- **Gabu's lines** for all the newer games were rewritten in his voice: crude, sarcastic, with bracketed log sidebars and concern markers.

**No changes** to the original games' rules, scoring, difficulty, ticket formulas, shop items, saves, art or Gabu's lines. Every event the original games can send was replayed through the old and new reaction code with identical results.

## Files changed

- `src/malware.js`, `src/malware-render.js`, `src/sugar.js`, `src/sugar-render.js`, `src/lockscreen.js`, `src/lockscreen-render.js`: the three new games' rules engines and canvas renderers. The engines have no DOM or Spindle dependencies.
- `assets/funzone/malware-app.svg`, `assets/funzone/sugar-app.svg`, `assets/funzone/lockscreen-app.svg`: their launcher icons. `chess-app.svg`, `berry-app.svg`, `treats-app.svg`, `cake-app.svg`, `memory-app.svg`: dark tiles and Gabu's eyes.
- `src/tictac.js`, `src/tictac-render.js`: the three-treat rule, Gabu's search, stale draws, and the faded next-to-go treat.
- `src/wafer.js`, `src/wafer-render.js`: sliding pulls, grip, balance, settling, Gabu's pulls, and how the tower topples and comes to rest.
- `src/bubble.js`, `src/bubble-render.js`: the framed field, combos, the Bloom meter and rainbow bubble, effects, and the level cloud.
- `src/malware.js`, `src/malware-render.js` also carry the cornering and stroke tracking that make quick swipes reliable.
- `src/chess-render.js`, `src/cake-render.js`, `src/memory-render.js`, `src/connect-render.js`, `src/boop-render.js`: darker palettes, layouts clear of Gabu's line, and Gabu's eyes.
- `src/frontend.js`: the three new games' roster entries, input, drawer tabs and settings, sounds, saves and NEW BEST; drag-to-slide wafers and their keys; Malware Mayhem's stroke tracking; new drawer tips for Tic Tac Treats, Bubble Bloom and Wobbly Wafers; the light wobble cue for Cake Tower; Gabu stays quiet while a wafer is held.
- `src/reactions.js`: Gabu's lines and moods for the newer games, including the three new ones.
- `src/rewards.js`: a ticket every 500 new personal-best points in each new game.
- `scripts/build.mjs`: bundles the new modules and icons; release banner.
- `tests/malware.test.mjs`, `tests/sugar.test.mjs`, `tests/lockscreen.test.mjs`: new rule, renderer and save tests. `tests/treats.test.mjs`, `tests/wafer.test.mjs`, `tests/bubble.test.mjs`, `tests/chess.test.mjs`: updated for the new rules and layout. `tests/sweets-integration.test.mjs`: the new games in the bundled build. `tests/lifecycle.test.mjs`, `tests/gambit-integration.test.mjs`: the game count and the new games' default settings.
- `spindle.json`, `package.json`, `README.md`, `docs/TESTING.md` (items 45 to 54), `demo-classics-qa.html`: release metadata, instructions and the preview links.
- `dist/frontend.js`: rebuilt with all 84 PNG/SVG assets embedded.

Original versions of every edited source, config, doc, test and icon are retained at `docs/backups-pre-2.8.0/`. The update manifest lists changed files and their checksums.

## Verification

- `node scripts/build.mjs` builds successfully, and a fresh build matches the committed `dist/frontend.js`.
- `node --test tests/*.test.mjs`: **293/293 passed**.
- The new games were played in Chromium at 382 px and 292 px cabinet widths, with a real mouse and with real touch on an emulated phone, with no page errors. Swiping, dragging and carving on the board never scroll the page or drag the cabinet.
- Random-input stress runs (700 taps, drags, keys, letters, pauses, blurs and restarts per game, with reloads) on every newer game and on Gabu's Gambit produced no page errors, and every save restored.
- Played in live Lumiverse.

## Compatibility

No data migration. Uses the existing `fuckass_funzone:v1:<extensionInstallationId>` storage key and adds `toyPaces`, `puzzles` and `bests` entries for `malware`, `sugar` and `lockscreen` to the same save envelope. Tic Tac Treats saves move to version 2 (older ones keep their streak and start the round on a fresh board), Wobbly Wafers saves to version 2 (older ones get fresh grips), and Bubble Bloom saves gain the Bloom meter.
