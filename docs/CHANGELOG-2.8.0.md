# Fuckass Funzone 2.8.0 — Malware Mayhem, settled wafers and a clearer Gabu

## What's new: Malware Mayhem

**Malware Mayhem** joins Funzone OS as the twenty-first game. You play a little neon virus loose in Gabu's mainframe, eating every byte of his data while his antivirus bots hunt you. The bots are built like the robot decoys in Boop-a-Bun, each with its own neon trim and Gabu's pale left eye and cyan right eye. It shares the arcade's dark cyber palette, drawn as a monitor with a cyan bezel, scanlines and a "GABU OS" window for its start, pause and game-over screens.

- **Steering:** swipe to turn, tap toward where the virus should go, or use the arrows or WASD. A turn asked for a little early is remembered and taken at the next opening, and turning back works anywhere, even between two cells.
- **Exploit chips:** four per maze. One corrupts the bots: they go gray with crossed-out eyes and run, and crashing one sends it to its reboot dock for 100, 200, 400, then 800 points in the same exploit. The time left shows as a draining gold bar under the monitor, and the bots fade back to color as it ends; nothing blinks.
- **Hearts and levels:** a bot that catches you costs one of three hearts and sends everyone back to the start with a short READY? pause. Eating every byte pays a bonus and starts the next level, where the bots move a little faster, though never as fast as the virus.
- **The maze** is an original layout. Every corridor connects and none dead-ends, so the virus always has somewhere to run; a test keeps it that way.
- **Pace** follows Duck Hunt's names: Chill · slow sends two slower bots that lose your trail more often, with an 8-second exploit; Normal sends three; Chaos · fast sends four faster bots that rarely lose your trail, with a 4.5-second exploit. Like the other games, a new pace applies to the next run.
- **Gabu** judges through the existing `ReactionDirector` with Gabu's existing faces. His bots are doing the hunting, so it is his game to win, like the four games played against him: he is hyped when a bot catches you or the run ends, panics when you wipe his mainframe, is shocked by an exploit, and annoyed when you crash his bots. Single bytes stay quiet. His line sits over the title bar, so it never covers the maze.
- **Sounds** use the existing synth and stay silent with Sound effects off. **Saves** keep the bytes left, score, hearts, level and pace; a resumed run comes back paused at the start positions.

Each pace was checked with simulated players that steer for the nearest byte along paths clear of the bots, with careful, average and sloppy reaction times. Median score over 120 runs of up to five minutes:

| Player | Chill | Normal | Chaos |
| --- | ---: | ---: | ---: |
| Careful | 11,970 (4 levels) | 7,110 (2) | 3,520 (0) |
| Average | 11,560 (4) | 4,130 (1) | 2,420 (0) |
| Sloppy | 2,390 (1) | 1,700 (0) | 1,440 (0) |

## Fixed: Wobbly Wafers pieces sliding off screen or resting on nothing after a topple

After the tower fell, the first few wafers landed normally, but the rest slid sideways while still tilted and disappeared off the edge of the screen, and some came to rest in mid-air. The topple threw wafers so hard that most landed near the edge; a wafer that landed on another fallen wafer kept sliding at a fixed speed along the whole row; and the broken stump counted as a solid ledge across its full width, including spots whose wafers were already gone. Falling wafers are now thrown more gently, tip a little in the air, and drop in front of the stump onto the saucer or table, where they lie flat side by side, the way the missed tiers in Cake Tower fall. They never rest on the stump or on each other, so none can float, build a column, or slide away. Across 600 simulated topples (14,962 wafers), every wafer settled flat on screen within 1.25 seconds.

## Fixed: Cake Tower wobble warning sounded like a crash

Since 2.7.0 a wobbly cake never loses tiers on its own; wobble only makes it harder to aim. The wobble warning still used the crash buzz and Gabu's panicked face, which suggested something had gone wrong. It now plays a light tick, and Gabu is smug about it instead. The crash buzz plays only when a tier misses and costs a heart.

## Fixed: Gabu's line covering things you need to see

In five of the 2.7.0 games the bottom of the board is in play, and Gabu's line covered it: your back rank in Catmate Chess, the launcher and next bubble in Bubble Bloom, the bottom burrows in Boop-a-Bun, the steady-hand meter in Wobbly Wafers, and the last row of capsules in Gacha Match. In those games his line now sits over the title bar, the same way Plinko already moves it. In all the newer games the bubble uses a slightly smaller face and text, so it stays clear of the board on the narrow 292 px cabinet too, including the cake stand in Cake Tower. Kitty's original games keep their existing bubble.

**No changes** to any existing game's rules, scoring, difficulty, ticket formulas, shop items, saves, or Gabu's lines. Kitty's original games react exactly as before: every event they can send was replayed through the old and new reaction code with identical results.

## Files changed

- `src/malware.js`, `src/malware-render.js`: the Malware Mayhem rules engine and canvas renderer. The engine has no DOM or Spindle dependencies.
- `assets/funzone/malware-app.svg`: the launcher icon.
- `src/wafer.js`: gentler topple and flat landing for fallen wafers.
- `src/frontend.js`: Malware Mayhem's roster entry, swipe, tap and keyboard steering, drawer tab and pace select, sounds, saves and NEW BEST; the light wobble cue for Cake Tower.
- `src/reactions.js`: Gabu's lines, moods and timing for Malware Mayhem, and his face for the Cake Tower wobble warning.
- `src/rewards.js`: a ticket every 500 new Malware Mayhem personal-best points.
- `src/style.css`: Gabu's line placement and size in the newer games.
- `scripts/build.mjs`: bundles the new modules and icon; release banner.
- `tests/malware.test.mjs`, `tests/sweets-integration.test.mjs`, `tests/wafer.test.mjs`, `tests/lifecycle.test.mjs`: new rule, renderer and bundled-host tests, the wafer landing test, and the game count.
- `spindle.json`, `package.json`, `README.md`, `docs/TESTING.md` (items 45 to 50), `demo-classics-qa.html`: release metadata, instructions, and the preview link.
- `dist/frontend.js`: rebuilt with all 83 PNG/SVG assets embedded.

Original versions of every edited source, config, doc and test are retained at `docs/backups-pre-2.8.0/`. The update manifest lists changed files and their checksums.

## Verification

- `node scripts/build.mjs` builds successfully.
- `node --test tests/*.test.mjs`: **192/192 passed**.
- Malware Mayhem was played in Chromium at 382 px and 292 px cabinet widths and with real touch swipes on an emulated phone, with no page errors; swiping on the board never scrolls the page.
- Random-input stress runs (700 taps, swipes, keys, pauses, blurs and restarts per game, with reloads) on Malware Mayhem and every 2.7.0 game produced no page errors, and every save restored.
- Live Lumiverse on desktop and real devices still needs a check.

## Compatibility

No data migration. Uses the existing `fuckass_funzone:v1:<extensionInstallationId>` storage key and adds `toyPaces.malware` and `puzzles.malware` to the same save envelope.
