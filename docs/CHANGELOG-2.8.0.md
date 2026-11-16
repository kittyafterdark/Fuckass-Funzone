# Fuckass Funzone 2.8.0 — Sprinkle Scurry

## What's new

**Sprinkle Scurry** joins Funzone OS as the twenty-first game. A hamster scurries through a candy-shop maze of pink shelves eating rainbow sprinkles while Gabu's vacuum bots give chase. The bots are built like the robot decoys in Boop-a-Bun, each in its own pastel shell, with Gabu's pale left eye and cyan right eye.

- **Steering:** swipe to turn, tap toward where the hamster should go, or use the arrows or WASD. A turn asked for a little early is remembered and taken at the next opening, and turning back works anywhere, even between two cells.
- **Sugar cubes:** four per shop. One gives the hamster the zoomies: the bots go pale with swirly eyes and run, and bonking one sends it back to its charger for 100, 200, 400, then 800 points in the same rush. The rush shows as a draining bar in the footer and fades the bots back to color as it ends; nothing blinks.
- **Hearts and levels:** a bot that catches you costs one of three hearts and sends everyone back to the start with a short READY? pause. Clearing every sprinkle pays a bonus and starts the next level, where the bots roll a little faster, though never as fast as a running hamster.
- **The maze** is an original layout. Every aisle connects and none dead-ends, so the hamster always has somewhere to run; a test keeps it that way.
- **Pace** follows Duck Hunt's names: Chill · slow sends two slower bots that lose your trail more often, with an 8-second sugar rush; Normal sends three; Chaos · fast sends four faster bots that rarely lose your trail, with a 4.5-second rush. Like the other games, a new pace applies to the next run.
- **Gabu** judges through the existing `ReactionDirector` with Gabu's existing faces. His bots are doing the chasing, so it is his game to win, like the four games played against him: he is hyped when a bot catches you or the run ends, panics when you clear a shop, is shocked by a sugar rush, and annoyed when you bonk his bots. Single sprinkles stay quiet. His line sits over the title bar, so it never covers the maze.
- **Sounds** use the existing synth and stay silent with Sound effects off.
- **Saves** keep the sprinkles left, score, hearts, level and pace. A resumed run comes back paused at the start positions; the bots and the hamster are not saved mid-move.

## Fairness

Each pace was checked with simulated players that steer for the nearest sprinkle along paths clear of the bots, with careful, average and sloppy reaction times. Median score over 120 runs of up to five minutes:

| Player | Chill | Normal | Chaos |
| --- | ---: | ---: | ---: |
| Careful | 12,370 (4 levels) | 7,560 (2) | 4,060 (1) |
| Average | 12,170 (4) | 3,880 (1) | 2,700 (0) |
| Sloppy | 2,270 (0) | 1,720 (0) | 1,610 (0) |

Every step up is harder for every kind of player.

**No changes** to any existing game's rules, art, ticket formulas, shop items, or Gabu's lines for other games. Kitty's original games react exactly as before: every event they can send was replayed through the old and new reaction code with identical results.

## Files changed

- `src/scurry.js`, `src/scurry-render.js`: the rules engine and canvas renderer. The engine has no DOM or Spindle dependencies.
- `assets/funzone/scurry-app.svg`: the launcher icon.
- `src/frontend.js`: roster, swipe, tap and keyboard steering, drawer tab and pace select, sounds, saves and the NEW BEST.
- `src/reactions.js`: Gabu's lines, moods and timing for the new game.
- `src/rewards.js`: a ticket every 500 new personal-best points.
- `src/style.css`: Gabu's line placement for the new game.
- `scripts/build.mjs`: bundles the new modules and icon; release banner.
- `tests/scurry.test.mjs`, `tests/sweets-integration.test.mjs`, `tests/lifecycle.test.mjs`: new rule, renderer and bundled-host tests, and the game count.
- `spindle.json`, `package.json`, `README.md`, `docs/TESTING.md` (items 48 to 50), `demo-classics-qa.html`: release metadata, instructions, and the preview link.
- `dist/frontend.js`: rebuilt with all 83 PNG/SVG assets embedded.

Original versions of every edited source, config, doc and test are retained at `docs/backups-pre-2.8.0/`. The update manifest lists changed files and their checksums.

## Verification

- `node scripts/build.mjs` builds successfully.
- `node --test tests/*.test.mjs`: **192/192 passed**.
- Played in Chromium at 382 px and 292 px cabinet widths and with real touch swipes on an emulated phone, with no page errors; swiping on the board never scrolls the page.
- A random-input stress run (700 taps, swipes, keys, pauses, blurs and restarts, with reloads) produced no page errors and every save restored.
- Live Lumiverse on desktop and real devices still needs a check.

## Compatibility

No data migration. Uses the existing `fuckass_funzone:v1:<extensionInstallationId>` storage key and adds `toyPaces.scurry` and `puzzles.scurry` to the same save envelope.
